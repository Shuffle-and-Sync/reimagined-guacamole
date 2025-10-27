/**
 * State Convergence Tests
 *
 * Tests for state convergence across multiple distributed clients
 * using vector clocks and merge operations.
 */

import { describe, test, expect } from "@jest/globals";
import { StateManager } from "../StateManager";
import { MergeStrategy } from "../types";
import { VectorClock } from "../VectorClock";
import { VersionController } from "../VersionController";

interface MultiClientGameState {
  players: Array<{ id: string; name: string; score: number }>;
  turn: number;
  lastAction?: string;
}

describe("State Convergence with Multiple Clients", () => {
  describe("two-client convergence", () => {
    test("should converge when one client is ahead", () => {
      // Client 1
      const client1 = new StateManager<MultiClientGameState>("client1");
      const initialData: MultiClientGameState = {
        players: [
          { id: "p1", name: "Alice", score: 0 },
          { id: "p2", name: "Bob", score: 0 },
        ],
        turn: 1,
      };

      const state1 = client1.createState(initialData);

      // Client 2 gets the same initial state
      const client2 = new StateManager<MultiClientGameState>("client2");
      client2.mergeRemoteState(state1);

      // Client 1 makes an update
      const state2 = client1.updateState(state1.id, (draft) => {
        draft.turn = 2;
        draft.players[0].score = 10;
      });

      // Client 2 merges the update
      client2.mergeRemoteState(state2);

      const client2State = client2.getState();
      expect(client2State?.data.turn).toBe(2);
      expect(client2State?.data.players[0].score).toBe(10);
    });

    test("should handle concurrent updates", () => {
      // Both clients start with same state
      const client1 = new StateManager<MultiClientGameState>("client1");
      const client2 = new StateManager<MultiClientGameState>("client2");

      const initialData: MultiClientGameState = {
        players: [{ id: "p1", name: "Alice", score: 0 }],
        turn: 1,
      };

      const state1 = client1.createState(initialData);
      client2.mergeRemoteState(state1);

      // Client 1 updates
      const client1Update = client1.updateState(state1.id, (draft) => {
        draft.players[0].score = 10;
        draft.lastAction = "client1-action";
      });

      // Client 2 updates concurrently
      const client2Update = client2.updateState(state1.id, (draft) => {
        draft.turn = 2;
        draft.lastAction = "client2-action";
      });

      // Check that versions are concurrent
      expect(
        VectorClock.isConcurrent(client1Update.version, client2Update.version),
      ).toBe(true);

      // Merge using VersionController
      const vc1 = new VersionController(client1);
      const mergeResult = vc1.merge(
        client1Update,
        client2Update,
        MergeStrategy.LAST_WRITE_WINS,
      );

      expect(mergeResult.resolved).toBe(true);
      // The merged version should include both client counters
      expect(mergeResult.state.version.client1).toBeGreaterThan(0);
      expect(mergeResult.state.version.client2).toBeGreaterThan(0);
    });
  });

  describe("three-client convergence", () => {
    test("should converge states from three clients", () => {
      const client1 = new StateManager<MultiClientGameState>("client1");
      const client2 = new StateManager<MultiClientGameState>("client2");
      const client3 = new StateManager<MultiClientGameState>("client3");

      const initialData: MultiClientGameState = {
        players: [
          { id: "p1", name: "Alice", score: 0 },
          { id: "p2", name: "Bob", score: 0 },
          { id: "p3", name: "Charlie", score: 0 },
        ],
        turn: 1,
      };

      // All clients start with same state
      const state = client1.createState(initialData);
      client2.mergeRemoteState(state);
      client3.mergeRemoteState(state);

      // Client 1 updates
      const update1 = client1.updateState(state.id, (draft) => {
        draft.players[0].score = 10;
      });

      // Client 2 updates
      const update2 = client2.updateState(state.id, (draft) => {
        draft.players[1].score = 20;
      });

      // Client 3 updates
      const update3 = client3.updateState(state.id, (draft) => {
        draft.players[2].score = 30;
      });

      // Merge all updates into client 1
      client1.mergeRemoteState(update2);
      client1.mergeRemoteState(update3);

      // Verify all updates are present
      const history = client1.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(4); // initial + 3 updates
    });

    test("should maintain causal ordering", () => {
      const client1 = new StateManager<MultiClientGameState>("client1");
      const client2 = new StateManager<MultiClientGameState>("client2");

      const initialData: MultiClientGameState = {
        players: [{ id: "p1", name: "Alice", score: 0 }],
        turn: 1,
      };

      // Client 1 creates initial state
      const state1 = client1.createState(initialData);

      // Client 1 makes first update
      const state2 = client1.updateState(state1.id, (draft) => {
        draft.turn = 2;
      });

      // Client 1 makes second update
      const state3 = client1.updateState(state2.id, (draft) => {
        draft.turn = 3;
      });

      // Verify causal ordering
      expect(VectorClock.isBefore(state1.version, state2.version)).toBe(true);
      expect(VectorClock.isBefore(state2.version, state3.version)).toBe(true);
      expect(VectorClock.isBefore(state1.version, state3.version)).toBe(true);
    });
  });

  describe("conflict resolution", () => {
    test("should detect conflicts in concurrent updates", () => {
      const client1 = new StateManager<MultiClientGameState>("client1");
      const client2 = new StateManager<MultiClientGameState>("client2");

      const initialData: MultiClientGameState = {
        players: [{ id: "p1", name: "Alice", score: 0 }],
        turn: 1,
      };

      const state = client1.createState(initialData);
      client2.mergeRemoteState(state);

      // Both clients update the same field
      const update1 = client1.updateState(state.id, (draft) => {
        draft.players[0].score = 10;
      });

      const update2 = client2.updateState(state.id, (draft) => {
        draft.players[0].score = 20;
      });

      // Merge with conflict detection
      const vc = new VersionController(client1);
      const mergeResult = vc.merge(update1, update2);

      expect(mergeResult.conflicts.length).toBeGreaterThan(0);
      expect(mergeResult.resolved).toBe(true);
    });

    test("should use last-write-wins strategy", () => {
      const client1 = new StateManager<MultiClientGameState>("client1");
      const client2 = new StateManager<MultiClientGameState>("client2");

      const initialData: MultiClientGameState = {
        players: [{ id: "p1", name: "Alice", score: 0 }],
        turn: 1,
      };

      const state = client1.createState(initialData);
      client2.mergeRemoteState(state);

      // Both clients update the same field
      const update1 = client1.updateState(state.id, (draft) => {
        draft.turn = 10;
      });

      const update2 = client2.updateState(state.id, (draft) => {
        draft.turn = 20;
      });

      // Merge with last-write-wins (remote wins)
      const vc = new VersionController(client1);
      const mergeResult = vc.merge(
        update1,
        update2,
        MergeStrategy.LAST_WRITE_WINS,
      );

      expect(mergeResult.state.data.turn).toBe(20);
    });

    test("should use custom conflict resolver", () => {
      const client1 = new StateManager<MultiClientGameState>("client1");
      const client2 = new StateManager<MultiClientGameState>("client2");

      const initialData: MultiClientGameState = {
        players: [{ id: "p1", name: "Alice", score: 0 }],
        turn: 1,
      };

      const state = client1.createState(initialData);
      client2.mergeRemoteState(state);

      const update1 = client1.updateState(state.id, (draft) => {
        draft.players[0].score = 10;
      });

      const update2 = client2.updateState(state.id, (draft) => {
        draft.players[0].score = 20;
      });

      // Custom resolver: take maximum value
      const customResolver = (conflict: any) => {
        return Math.max(conflict.localValue, conflict.remoteValue);
      };

      const vc = new VersionController(client1);
      const mergeResult = vc.merge(
        update1,
        update2,
        MergeStrategy.CUSTOM,
        customResolver,
      );

      expect(mergeResult.state.data.players[0].score).toBe(20);
    });
  });

  describe("branching and merging", () => {
    test("should support speculative execution with branches", () => {
      const stateManager = new StateManager<MultiClientGameState>("client1");
      const vc = new VersionController(stateManager);

      const initialData: MultiClientGameState = {
        players: [{ id: "p1", name: "Alice", score: 0 }],
        turn: 1,
      };

      const state = stateManager.createState(initialData);

      // Create a speculative branch
      const branchStateId = vc.createBranch("speculative");
      expect(branchStateId).toBe(state.id);

      // Make updates on main branch
      const mainUpdate = stateManager.updateState(state.id, (draft) => {
        draft.turn = 2;
      });

      // Create and switch to speculative branch
      vc.createBranch("preview", state.id);
      vc.checkoutBranch("preview");

      // Make speculative update
      const speculativeUpdate = stateManager.updateState(state.id, (draft) => {
        draft.players[0].score = 100; // Preview action
      });

      // Verify branches are different
      expect(mainUpdate.data.turn).toBe(2);
      expect(speculativeUpdate.data.players[0].score).toBe(100);
    });
  });

  describe("network partition scenarios", () => {
    test("should handle delayed message delivery", () => {
      const client1 = new StateManager<MultiClientGameState>("client1");
      const client2 = new StateManager<MultiClientGameState>("client2");

      const initialData: MultiClientGameState = {
        players: [{ id: "p1", name: "Alice", score: 0 }],
        turn: 1,
      };

      const state = client1.createState(initialData);

      // Client 1 makes multiple updates
      const update1 = client1.updateState(state.id, (draft) => {
        draft.turn = 2;
      });

      const update2 = client1.updateState(update1.id, (draft) => {
        draft.turn = 3;
      });

      // Client 2 receives updates out of order (update2 before update1)
      client2.mergeRemoteState(state);
      client2.mergeRemoteState(update2); // Arrives first
      client2.mergeRemoteState(update1); // Arrives late

      // Client 2 should still converge to correct state
      const client2State = client2.getState();
      expect(client2State?.data.turn).toBe(3);
    });
  });
});
