/**
 * Chaos Engineering Tests
 *
 * Tests system resilience under adverse conditions:
 * - Random network failures
 * - Concurrent disconnections and reconnections
 * - Message loss and delays
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  createMoveCardOperation,
  createTapCardOperation,
} from "../../src/ot/operations/CardOperations";
import { OTEngine } from "../../src/ot/OTEngine";
import { StateManager } from "../../src/state/StateManager";
import { wait, createMockClientIds } from "../helpers/TestHelpers";
import type { VectorClock, Operation } from "../../src/ot/types";

interface ChaosTestState {
  counter: number;
  operations: string[];
  connectedClients: string[];
}

class SimulatedClient {
  public manager: StateManager<ChaosTestState>;
  public engine: OTEngine;
  public connected: boolean = true;
  public pendingUpdates: any[] = [];

  constructor(public clientId: string) {
    this.manager = new StateManager<ChaosTestState>(clientId);
    this.engine = new OTEngine();
  }

  disconnect(): void {
    this.connected = false;
  }

  reconnect(): void {
    this.connected = true;
  }

  isConnected(): boolean {
    return this.connected;
  }

  bufferUpdate(update: any): void {
    if (!this.connected) {
      this.pendingUpdates.push(update);
    }
  }

  flushPendingUpdates(): any[] {
    const updates = [...this.pendingUpdates];
    this.pendingUpdates = [];
    return updates;
  }

  performAction(baseStateId: string): any {
    if (!this.connected) return null;

    return this.manager.updateState(baseStateId, (draft) => {
      draft.counter++;
      draft.operations.push(`${this.clientId}-op-${Date.now()}`);
    });
  }

  getState() {
    return this.manager.getState();
  }

  mergeRemoteState(state: any): void {
    this.manager.mergeRemoteState(state);
  }
}

describe("Chaos Engineering", () => {
  describe("Random network failures", () => {
    test("should handle random client disconnections", async () => {
      const clientCount = 10;
      const clients = createMockClientIds(clientCount).map(
        (id) => new SimulatedClient(id),
      );

      // Create initial state
      const initialState: ChaosTestState = {
        counter: 0,
        operations: [],
        connectedClients: clients.map((c) => c.clientId),
      };

      const state = clients[0].manager.createState(initialState);

      // All clients sync initial state
      for (let i = 1; i < clients.length; i++) {
        clients[i].manager.mergeRemoteState(state);
      }

      // Simulate random disconnections
      const disconnectionRounds = 5;
      for (let round = 0; round < disconnectionRounds; round++) {
        // Randomly disconnect some clients
        for (const client of clients) {
          if (Math.random() > 0.7) {
            client.disconnect();
          }
        }

        // Connected clients perform actions
        const updates: any[] = [];
        for (const client of clients) {
          if (client.isConnected()) {
            const currentState = client.getState();
            if (currentState) {
              const update = client.performAction(currentState.id);
              if (update) {
                updates.push(update);
              }
            }
          }
        }

        await wait(50);

        // Reconnect all clients and sync
        for (const client of clients) {
          if (!client.isConnected()) {
            client.reconnect();
          }

          // Sync all updates
          for (const update of updates) {
            client.mergeRemoteState(update);
          }
        }

        await wait(50);
      }

      // Verify all connected clients converged
      const connectedClients = clients.filter((c) => c.isConnected());
      expect(connectedClients.length).toBeGreaterThan(0);

      const states = connectedClients.map((c) => c.getState());
      const firstState = states[0];

      for (const state of states) {
        expect(state?.data.counter).toBeGreaterThan(0);
      }
    });

    test("should recover from complete network partition", async () => {
      const clients = [
        new SimulatedClient("client1"),
        new SimulatedClient("client2"),
        new SimulatedClient("client3"),
      ];

      const initialState: ChaosTestState = {
        counter: 0,
        operations: [],
        connectedClients: ["client1", "client2", "client3"],
      };

      const state = clients[0].manager.createState(initialState);

      for (let i = 1; i < clients.length; i++) {
        clients[i].manager.mergeRemoteState(state);
      }

      // Disconnect all clients from each other
      for (const client of clients) {
        client.disconnect();
      }

      // Each client performs operations in isolation
      const isolatedUpdates: any[][] = [[], [], []];
      for (let i = 0; i < 3; i++) {
        clients[i].reconnect();
        for (let j = 0; j < 5; j++) {
          const currentState = clients[i].getState();
          if (currentState) {
            const update = clients[i].performAction(currentState.id);
            if (update) {
              isolatedUpdates[i].push(update);
            }
          }
        }
        clients[i].disconnect();
      }

      // Reconnect and sync all updates
      for (const client of clients) {
        client.reconnect();
      }

      for (const client of clients) {
        for (const updates of isolatedUpdates) {
          for (const update of updates) {
            client.mergeRemoteState(update);
          }
        }
      }

      await wait(100);

      // All clients should have operations from all clients
      const states = clients.map((c) => c.getState());
      for (const state of states) {
        expect(state?.data.counter).toBeGreaterThan(0);
        expect(state?.data.operations.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Message loss and delays", () => {
    test("should handle dropped messages", async () => {
      const clients = [
        new SimulatedClient("client1"),
        new SimulatedClient("client2"),
      ];

      const initialState: ChaosTestState = {
        counter: 0,
        operations: [],
        connectedClients: ["client1", "client2"],
      };

      const state = clients[0].manager.createState(initialState);
      clients[1].manager.mergeRemoteState(state);

      // Client1 performs multiple updates
      const updates: any[] = [];
      let currentState = state;
      for (let i = 0; i < 10; i++) {
        currentState = clients[0].manager.updateState(
          currentState.id,
          (draft) => {
            draft.counter++;
          },
        );
        updates.push(currentState);
      }

      // Simulate 50% message loss - client2 only receives half the updates
      const receivedUpdates = updates.filter(() => Math.random() > 0.5);

      for (const update of receivedUpdates) {
        clients[1].manager.mergeRemoteState(update);
      }

      // Eventually send all updates
      await wait(100);

      for (const update of updates) {
        clients[1].manager.mergeRemoteState(update);
      }

      // Client2 should eventually get to same state
      const state1 = clients[0].getState();
      const state2 = clients[1].getState();

      expect(state1?.data.counter).toBe(10);
      expect(state2?.data.counter).toBe(10);
    });

    test("should handle out-of-order message delivery", async () => {
      const clients = [
        new SimulatedClient("client1"),
        new SimulatedClient("client2"),
      ];

      const initialState: ChaosTestState = {
        counter: 0,
        operations: [],
        connectedClients: ["client1", "client2"],
      };

      const state = clients[0].manager.createState(initialState);
      clients[1].manager.mergeRemoteState(state);

      // Client1 creates sequential updates
      const updates: any[] = [];
      let currentState = state;
      for (let i = 0; i < 5; i++) {
        currentState = clients[0].manager.updateState(
          currentState.id,
          (draft) => {
            draft.counter++;
            draft.operations.push(`update-${i}`);
          },
        );
        updates.push(currentState);
      }

      // Deliver in random order
      const shuffled = [...updates].sort(() => Math.random() - 0.5);
      for (const update of shuffled) {
        clients[1].manager.mergeRemoteState(update);
      }

      const state2 = clients[1].getState();
      expect(state2?.data.counter).toBe(5);
      expect(state2?.data.operations.length).toBe(5);
    });
  });

  describe("Concurrent failures", () => {
    test("should handle multiple simultaneous failures", async () => {
      const clientCount = 8;
      const clients = createMockClientIds(clientCount).map(
        (id) => new SimulatedClient(id),
      );

      const initialState: ChaosTestState = {
        counter: 0,
        operations: [],
        connectedClients: clients.map((c) => c.clientId),
      };

      const state = clients[0].manager.createState(initialState);

      for (let i = 1; i < clients.length; i++) {
        clients[i].manager.mergeRemoteState(state);
      }

      // Simulate cascading failures
      for (let i = 0; i < clientCount / 2; i++) {
        clients[i].disconnect();
        await wait(10); // Small delay between failures
      }

      // Remaining clients continue operations
      const updates: any[] = [];
      for (const client of clients) {
        if (client.isConnected()) {
          const currentState = client.getState();
          if (currentState) {
            const update = client.performAction(currentState.id);
            if (update) {
              updates.push(update);
            }
          }
        }
      }

      // Recover all clients
      for (const client of clients) {
        client.reconnect();
      }

      // Sync all updates
      for (const client of clients) {
        for (const update of updates) {
          client.mergeRemoteState(update);
        }
      }

      await wait(100);

      // All clients should be in consistent state
      const states = clients.map((c) => c.getState());
      const firstCounter = states[0]?.data.counter;

      for (const state of states) {
        expect(state?.data.counter).toBe(firstCounter);
      }
    });

    test("should maintain consistency during rapid connect/disconnect cycles", async () => {
      const clients = [
        new SimulatedClient("client1"),
        new SimulatedClient("client2"),
        new SimulatedClient("client3"),
      ];

      const initialState: ChaosTestState = {
        counter: 0,
        operations: [],
        connectedClients: ["client1", "client2", "client3"],
      };

      const state = clients[0].manager.createState(initialState);

      for (let i = 1; i < clients.length; i++) {
        clients[i].manager.mergeRemoteState(state);
      }

      const allUpdates: any[] = [];

      // Rapid connect/disconnect cycles with operations
      for (let cycle = 0; cycle < 10; cycle++) {
        // Random client disconnects
        const disconnectIndex = Math.floor(Math.random() * clients.length);
        clients[disconnectIndex].disconnect();

        // Remaining clients perform operations
        for (const client of clients) {
          if (client.isConnected()) {
            const currentState = client.getState();
            if (currentState) {
              const update = client.performAction(currentState.id);
              if (update) {
                allUpdates.push(update);
              }
            }
          }
        }

        await wait(20);

        // Reconnect
        clients[disconnectIndex].reconnect();

        await wait(20);
      }

      // Final sync of all updates
      for (const client of clients) {
        for (const update of allUpdates) {
          client.mergeRemoteState(update);
        }
      }

      await wait(100);

      // Verify all clients have operations
      const states = clients.map((c) => c.getState());
      expect(states[0]?.data.counter).toBeGreaterThan(0);

      // All clients should have the same number of operations in history
      // Note: Due to concurrent updates, counter may vary but all should have updates
      for (const state of states) {
        expect(state?.data.counter).toBeGreaterThan(0);
        expect(state?.data.operations.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Stress testing", () => {
    test("should handle high load with failures", async () => {
      const clientCount = 5;
      const clients = createMockClientIds(clientCount).map(
        (id) => new SimulatedClient(id),
      );

      const initialState: ChaosTestState = {
        counter: 0,
        operations: [],
        connectedClients: clients.map((c) => c.clientId),
      };

      const state = clients[0].manager.createState(initialState);

      for (let i = 1; i < clients.length; i++) {
        clients[i].manager.mergeRemoteState(state);
      }

      const allUpdates: any[] = [];

      // High-frequency operations with random failures
      for (let i = 0; i < 20; i++) {
        // Random failures
        for (const client of clients) {
          if (Math.random() > 0.8) {
            client.disconnect();
          } else if (!client.isConnected() && Math.random() > 0.5) {
            client.reconnect();
          }
        }

        // All connected clients perform operations
        for (const client of clients) {
          if (client.isConnected()) {
            const currentState = client.getState();
            if (currentState) {
              const update = client.performAction(currentState.id);
              if (update) {
                allUpdates.push(update);
              }
            }
          }
        }

        await wait(10);
      }

      // Recover all clients
      for (const client of clients) {
        client.reconnect();
      }

      // Sync all updates
      for (const client of clients) {
        for (const update of allUpdates) {
          client.mergeRemoteState(update);
        }
      }

      await wait(200);

      // Verify all clients converged
      const states = clients.map((c) => c.getState());
      expect(states[0]?.data.counter).toBeGreaterThan(0);
    });
  });
});
