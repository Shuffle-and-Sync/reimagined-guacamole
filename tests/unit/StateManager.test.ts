/**
 * Comprehensive StateManager Unit Tests
 *
 * Tests for state management including:
 * - State creation and versioning
 * - Immutable updates
 * - Concurrent state merging
 * - Vector clock incrementation
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import { StateManager } from "../../src/state/StateManager";
import { VectorClock } from "../../src/state/VectorClock";

interface TestState {
  a: number;
  b: number;
  counter?: number;
  value?: number;
  players?: Array<{ id: string; name: string; life: number }>;
  turn?: number;
}

describe("StateManager - Comprehensive Unit Tests", () => {
  let stateManager: StateManager<TestState>;

  beforeEach(() => {
    stateManager = new StateManager<TestState>("client1");
  });

  describe("createState", () => {
    test("should create initial state with version 0", () => {
      const state = stateManager.createState({ a: 0, b: 0 });

      expect(state.version).toEqual({ client1: 0 });
      expect(state.data.a).toBe(0);
      expect(state.data.b).toBe(0);
      expect(state.id).toBeDefined();
      expect(state.timestamp).toBeGreaterThan(0);
      expect(state.checksum).toBeDefined();
    });

    test("should create state with custom ID", () => {
      const state = stateManager.createState({ a: 1, b: 2 }, "custom-id");
      expect(state.id).toBe("custom-id");
    });

    test("should set state as head", () => {
      const state = stateManager.createState({ a: 0, b: 0 });
      const currentState = stateManager.getState();

      expect(currentState?.id).toBe(state.id);
    });
  });

  describe("updateState", () => {
    test("should increment vector clock on update", () => {
      const state = stateManager.createState({ a: 0, b: 0 });
      const updated = stateManager.updateState(state.id, (draft) => {
        draft.a = 1;
      });

      expect(updated.version.client1).toBe(1);
      expect(state.version.client1).toBe(0);
    });

    test("should maintain immutability", () => {
      const state = stateManager.createState({ a: 0, b: 0 });
      const updated = stateManager.updateState(state.id, (draft) => {
        draft.a = 1;
      });

      expect(state.data.a).toBe(0);
      expect(updated.data.a).toBe(1);
    });

    test("should create new state ID on update", () => {
      const state = stateManager.createState({ a: 0, b: 0 });
      const updated = stateManager.updateState(state.id, (draft) => {
        draft.a = 1;
      });

      expect(updated.id).not.toBe(state.id);
    });

    test("should preserve parent version", () => {
      const state = stateManager.createState({ a: 0, b: 0 });
      const updated = stateManager.updateState(state.id, (draft) => {
        draft.a = 1;
      });

      expect(updated.parentVersion).toEqual(state.version);
    });

    test("should handle returning new data from update function", () => {
      const state = stateManager.createState({ a: 0, b: 0 });
      const updated = stateManager.updateState(state.id, () => {
        return { a: 5, b: 10 };
      });

      expect(updated.data.a).toBe(5);
      expect(updated.data.b).toBe(10);
    });

    test("should throw error for non-existent state", () => {
      expect(() => {
        stateManager.updateState("non-existent", (draft) => {
          draft.a = 1;
        });
      }).toThrow("State not found");
    });
  });

  describe("merge - Concurrent updates", () => {
    test("should merge concurrent updates correctly", () => {
      const state = stateManager.createState({ a: 0, b: 0 });

      const update1 = stateManager.updateState(state.id, (draft) => {
        draft.a = 1;
      });

      // Simulate concurrent update from same base state
      const manager2 = new StateManager<TestState>("client2");
      manager2.mergeRemoteState(state);
      const update2 = manager2.updateState(state.id, (draft) => {
        draft.b = 1;
      });

      // Merge remote state
      const merged = stateManager.mergeRemoteState(update2);

      expect(merged.data.b).toBe(1);
      expect(update1.data.a).toBe(1);
    });

    test("should handle three-way concurrent updates", () => {
      const initialState = stateManager.createState({ a: 0, b: 0, counter: 0 });

      // Client 1 updates a
      const update1 = stateManager.updateState(initialState.id, (draft) => {
        draft.a = 1;
      });

      // Client 2 updates b
      const manager2 = new StateManager<TestState>("client2");
      manager2.mergeRemoteState(initialState);
      const update2 = manager2.updateState(initialState.id, (draft) => {
        draft.b = 2;
      });

      // Client 3 updates counter
      const manager3 = new StateManager<TestState>("client3");
      manager3.mergeRemoteState(initialState);
      const update3 = manager3.updateState(initialState.id, (draft) => {
        draft.counter = 10;
      });

      // Merge all updates
      stateManager.mergeRemoteState(update2);
      stateManager.mergeRemoteState(update3);

      // Verify all updates are tracked
      const history = stateManager.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Vector clock operations", () => {
    test("should increment clock on multiple updates", () => {
      const state = stateManager.createState({ a: 0, b: 0 });

      const update1 = stateManager.updateState(state.id, (draft) => {
        draft.a = 1;
      });
      const update2 = stateManager.updateState(update1.id, (draft) => {
        draft.b = 1;
      });
      const update3 = stateManager.updateState(update2.id, (draft) => {
        draft.a = 2;
      });

      expect(state.version.client1).toBe(0);
      expect(update1.version.client1).toBe(1);
      expect(update2.version.client1).toBe(2);
      expect(update3.version.client1).toBe(3);
    });

    test("should handle multi-client vector clocks", () => {
      const state = stateManager.createState({ a: 0, b: 0 });

      const manager2 = new StateManager<TestState>("client2");
      const remoteState = manager2.createState({ a: 5, b: 5 });

      stateManager.mergeRemoteState(remoteState);

      const update = stateManager.updateState(state.id, (draft) => {
        draft.a = 10;
      });

      expect(update.version.client1).toBeGreaterThan(0);
    });
  });

  describe("getStateAtVersion", () => {
    test("should retrieve state at specific version", () => {
      const state1 = stateManager.createState({ a: 0, b: 0 });
      const state2 = stateManager.updateState(state1.id, (draft) => {
        draft.a = 1;
      });
      const state3 = stateManager.updateState(state2.id, (draft) => {
        draft.a = 2;
      });

      const retrieved = stateManager.getStateAtVersion(state2.version);
      expect(retrieved?.id).toBe(state2.id);
      expect(retrieved?.data.a).toBe(1);
    });

    test("should return closest ancestor for non-exact version", () => {
      const state1 = stateManager.createState({ a: 0, b: 0 });
      stateManager.updateState(state1.id, (draft) => {
        draft.a = 1;
      });

      // Request a future version
      const futureVersion = { client1: 100 };
      const retrieved = stateManager.getStateAtVersion(futureVersion);

      // Should get the most recent state
      expect(retrieved?.data.a).toBe(1);
    });

    test("should return null if no matching state", () => {
      const retrieved = stateManager.getStateAtVersion({ otherClient: 1 });
      expect(retrieved).toBeNull();
    });
  });

  describe("Checksum validation", () => {
    test("should validate correct checksums", () => {
      const state = stateManager.createState({ a: 1, b: 2 });
      expect(stateManager.validateChecksum(state)).toBe(true);
    });

    test("should detect tampered data", () => {
      const state = stateManager.createState({ a: 1, b: 2 });
      state.data.a = 999; // Tamper

      expect(stateManager.validateChecksum(state)).toBe(false);
    });

    test("should reject remote state with invalid checksum", () => {
      const remoteManager = new StateManager<TestState>("client2");
      const remoteState = remoteManager.createState({ a: 1, b: 2 });
      remoteState.checksum = "invalid-checksum";

      expect(() => {
        stateManager.mergeRemoteState(remoteState);
      }).toThrow("Invalid checksum");
    });
  });

  describe("History management", () => {
    test("should maintain history in chronological order", () => {
      const state1 = stateManager.createState({ a: 0, b: 0 });
      const state2 = stateManager.updateState(state1.id, (draft) => {
        draft.a = 1;
      });
      const state3 = stateManager.updateState(state2.id, (draft) => {
        draft.a = 2;
      });

      const history = stateManager.getHistory();

      expect(history).toHaveLength(3);
      expect(history[0].id).toBe(state1.id);
      expect(history[1].id).toBe(state2.id);
      expect(history[2].id).toBe(state3.id);
    });

    test("should provide accurate history metadata", () => {
      const state = stateManager.createState({ a: 0, b: 0 });

      const metadata = stateManager.getHistoryMetadata();

      expect(metadata.stateCount).toBe(1);
      expect(metadata.head).toBe(state.id);
    });

    test("should clear history", () => {
      stateManager.createState({ a: 0, b: 0 });
      stateManager.clearHistory();

      const metadata = stateManager.getHistoryMetadata();
      expect(metadata.stateCount).toBe(0);
      expect(metadata.head).toBe("");
    });
  });

  describe("Remote state merging", () => {
    test("should merge remote state and update head if newer", () => {
      const localState = stateManager.createState({ a: 0, b: 0 });

      // Remote client creates a newer state
      const remoteManager = new StateManager<TestState>("client2");
      remoteManager.mergeRemoteState(localState);
      const remoteState = remoteManager.updateState(localState.id, (draft) => {
        draft.a = 5;
      });

      // Merge into local
      stateManager.mergeRemoteState(remoteState);

      const currentState = stateManager.getState();
      expect(currentState?.id).toBe(remoteState.id);
    });

    test("should not duplicate existing states", () => {
      const state = stateManager.createState({ a: 0, b: 0 });

      const merged = stateManager.mergeRemoteState(state);

      expect(merged.id).toBe(state.id);
      expect(stateManager.getHistory()).toHaveLength(1);
    });
  });

  describe("Client ID management", () => {
    test("should return client ID", () => {
      expect(stateManager.getClientId()).toBe("client1");
    });

    test("should use different client IDs for different managers", () => {
      const manager2 = new StateManager<TestState>("client2");
      expect(manager2.getClientId()).toBe("client2");
      expect(manager2.getClientId()).not.toBe(stateManager.getClientId());
    });
  });
});
