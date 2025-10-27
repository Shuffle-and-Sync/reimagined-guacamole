/**
 * StateManager Tests
 *
 * Tests for state management including creation, updates,
 * versioning, and checksum validation.
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import { StateManager } from "../StateManager";
import { VectorClock } from "../VectorClock";

interface TestGameState {
  players: Array<{ id: string; name: string; life: number }>;
  turn: number;
  phase?: string;
}

describe("StateManager", () => {
  let stateManager: StateManager<TestGameState>;

  beforeEach(() => {
    stateManager = new StateManager<TestGameState>("test-client");
  });

  describe("createState", () => {
    test("should create initial state", () => {
      const data: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        turn: 1,
      };

      const state = stateManager.createState(data);

      expect(state.id).toBeDefined();
      expect(state.data).toEqual(data);
      expect(state.version).toEqual({ "test-client": 0 });
      expect(state.timestamp).toBeGreaterThan(0);
      expect(state.checksum).toBeDefined();
    });

    test("should create state with custom ID", () => {
      const data: TestGameState = {
        players: [],
        turn: 1,
      };

      const state = stateManager.createState(data, "custom-id");
      expect(state.id).toBe("custom-id");
    });

    test("should set state as head", () => {
      const data: TestGameState = {
        players: [],
        turn: 1,
      };

      const state = stateManager.createState(data);
      const currentState = stateManager.getState();

      expect(currentState?.id).toBe(state.id);
    });
  });

  describe("updateState", () => {
    test("should update state with draft function", () => {
      const initialData: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        turn: 1,
      };

      const initialState = stateManager.createState(initialData);

      const updatedState = stateManager.updateState(
        initialState.id,
        (draft) => {
          draft.turn = 2;
          draft.players[0].life = 18;
        },
      );

      expect(updatedState.data.turn).toBe(2);
      expect(updatedState.data.players[0].life).toBe(18);
      expect(updatedState.version["test-client"]).toBe(1);
      expect(updatedState.parentVersion).toEqual(initialState.version);
    });

    test("should not mutate original state", () => {
      const initialData: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        turn: 1,
      };

      const initialState = stateManager.createState(initialData);

      stateManager.updateState(initialState.id, (draft) => {
        draft.turn = 2;
      });

      expect(initialState.data.turn).toBe(1);
    });

    test("should throw error for non-existent state", () => {
      expect(() => {
        stateManager.updateState("non-existent", (draft) => {
          (draft as any).turn = 2;
        });
      }).toThrow("State not found");
    });

    test("should handle returning new data from update function", () => {
      const initialData: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        turn: 1,
      };

      const initialState = stateManager.createState(initialData);

      const updatedState = stateManager.updateState(initialState.id, () => {
        return {
          players: [{ id: "p2", name: "Bob", life: 20 }],
          turn: 2,
        };
      });

      expect(updatedState.data.players[0].name).toBe("Bob");
      expect(updatedState.data.turn).toBe(2);
    });
  });

  describe("getState", () => {
    test("should get current state", () => {
      const data: TestGameState = {
        players: [],
        turn: 1,
      };

      const state = stateManager.createState(data);
      const retrieved = stateManager.getState();

      expect(retrieved?.id).toBe(state.id);
    });

    test("should get state by ID", () => {
      const data: TestGameState = {
        players: [],
        turn: 1,
      };

      const state = stateManager.createState(data);
      const retrieved = stateManager.getState(state.id);

      expect(retrieved?.id).toBe(state.id);
    });

    test("should return null for non-existent state", () => {
      const retrieved = stateManager.getState("non-existent");
      expect(retrieved).toBeNull();
    });
  });

  describe("getStateAtVersion", () => {
    test("should get state at exact version", () => {
      const initialData: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        turn: 1,
      };

      const state1 = stateManager.createState(initialData);
      const state2 = stateManager.updateState(state1.id, (draft) => {
        draft.turn = 2;
      });

      const retrieved = stateManager.getStateAtVersion(state1.version);
      expect(retrieved?.id).toBe(state1.id);
    });

    test("should get closest ancestor for non-exact version", () => {
      const initialData: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        turn: 1,
      };

      const state1 = stateManager.createState(initialData);
      stateManager.updateState(state1.id, (draft) => {
        draft.turn = 2;
      });

      // Request a version that's ahead of state1
      const futureVersion = { "test-client": 5 };
      const retrieved = stateManager.getStateAtVersion(futureVersion);

      // Should get the most recent state
      expect(retrieved?.data.turn).toBe(2);
    });

    test("should return null if no state matches", () => {
      const retrieved = stateManager.getStateAtVersion({ "other-client": 1 });
      expect(retrieved).toBeNull();
    });
  });

  describe("getHistory", () => {
    test("should return all states in chronological order", () => {
      const initialData: TestGameState = {
        players: [],
        turn: 1,
      };

      const state1 = stateManager.createState(initialData);
      const state2 = stateManager.updateState(state1.id, (draft) => {
        draft.turn = 2;
      });
      const state3 = stateManager.updateState(state2.id, (draft) => {
        draft.turn = 3;
      });

      const history = stateManager.getHistory();

      expect(history).toHaveLength(3);
      expect(history[0].id).toBe(state1.id);
      expect(history[1].id).toBe(state2.id);
      expect(history[2].id).toBe(state3.id);
    });
  });

  describe("validateChecksum", () => {
    test("should validate correct checksum", () => {
      const data: TestGameState = {
        players: [],
        turn: 1,
      };

      const state = stateManager.createState(data);
      expect(stateManager.validateChecksum(state)).toBe(true);
    });

    test("should detect invalid checksum", () => {
      const data: TestGameState = {
        players: [],
        turn: 1,
      };

      const state = stateManager.createState(data);
      // Tamper with the state
      state.data.turn = 2;

      expect(stateManager.validateChecksum(state)).toBe(false);
    });
  });

  describe("mergeRemoteState", () => {
    test("should merge remote state into history", () => {
      const remoteManager = new StateManager<TestGameState>("remote-client");
      const remoteData: TestGameState = {
        players: [{ id: "p1", name: "Bob", life: 20 }],
        turn: 1,
      };

      const remoteState = remoteManager.createState(remoteData);

      const merged = stateManager.mergeRemoteState(remoteState);

      expect(merged.id).toBe(remoteState.id);
      expect(VectorClock.isEqual(merged.version, remoteState.version)).toBe(
        true,
      );
    });

    test("should update head if remote state is more recent", () => {
      const localData: TestGameState = {
        players: [],
        turn: 1,
      };

      const localState = stateManager.createState(localData);

      // Remote manager gets the local state and updates it
      const remoteManager = new StateManager<TestGameState>("remote-client");
      remoteManager.mergeRemoteState(localState);

      const remoteData: TestGameState = {
        players: [{ id: "p1", name: "Bob", life: 20 }],
        turn: 2,
      };
      const remoteState = remoteManager.updateState(
        localState.id,
        () => remoteData,
      );

      stateManager.mergeRemoteState(remoteState);

      const currentState = stateManager.getState();
      expect(currentState?.id).toBe(remoteState.id);
    });

    test("should throw error for invalid checksum", () => {
      const remoteManager = new StateManager<TestGameState>("remote-client");
      const remoteData: TestGameState = {
        players: [],
        turn: 1,
      };
      const remoteState = remoteManager.createState(remoteData);

      // Tamper with checksum
      remoteState.checksum = "invalid";

      expect(() => {
        stateManager.mergeRemoteState(remoteState);
      }).toThrow("Invalid checksum");
    });

    test("should not duplicate existing states", () => {
      const data: TestGameState = {
        players: [],
        turn: 1,
      };
      const state = stateManager.createState(data);

      const merged = stateManager.mergeRemoteState(state);

      expect(merged.id).toBe(state.id);
      expect(stateManager.getHistory()).toHaveLength(1);
    });
  });

  describe("getClientId", () => {
    test("should return client ID", () => {
      expect(stateManager.getClientId()).toBe("test-client");
    });
  });

  describe("getHistoryMetadata", () => {
    test("should return history metadata", () => {
      const data: TestGameState = {
        players: [],
        turn: 1,
      };

      const state = stateManager.createState(data);

      const metadata = stateManager.getHistoryMetadata();

      expect(metadata.stateCount).toBe(1);
      expect(metadata.head).toBe(state.id);
    });
  });

  describe("clearHistory", () => {
    test("should clear all history", () => {
      const data: TestGameState = {
        players: [],
        turn: 1,
      };

      stateManager.createState(data);
      stateManager.clearHistory();

      const metadata = stateManager.getHistoryMetadata();
      expect(metadata.stateCount).toBe(0);
      expect(metadata.head).toBe("");
    });
  });
});
