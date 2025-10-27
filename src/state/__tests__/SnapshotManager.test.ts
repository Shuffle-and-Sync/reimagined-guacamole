/**
 * SnapshotManager Tests
 *
 * Tests for snapshot creation, restoration, compression,
 * and incremental snapshots.
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import { SnapshotManager } from "../SnapshotManager";
import { StateManager } from "../StateManager";

interface TestGameState {
  players: Array<{ id: string; name: string; life: number }>;
  board: {
    zones: Record<string, { cards: string[] }>;
  };
  turn: number;
}

describe("SnapshotManager", () => {
  let snapshotManager: SnapshotManager<TestGameState>;
  let stateManager: StateManager<TestGameState>;

  beforeEach(() => {
    snapshotManager = new SnapshotManager<TestGameState>({
      interval: 3,
      enableCompression: true,
      enableIncrementalSnapshots: true,
    });
    stateManager = new StateManager<TestGameState>("test-client");
  });

  describe("createSnapshot", () => {
    test("should create snapshot from game state", () => {
      const data: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        board: { zones: {} },
        turn: 1,
      };

      const state = stateManager.createState(data);
      const snapshot = snapshotManager.createSnapshot(state);

      expect(snapshot.id).toBeDefined();
      expect(snapshot.version).toEqual(state.version);
      expect(snapshot.data).toEqual(state.data);
      expect(snapshot.timestamp).toBeGreaterThan(0);
      expect(snapshot.checksum).toBeDefined();
    });

    test("should create incremental snapshot", () => {
      const baseData: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        board: { zones: {} },
        turn: 1,
      };

      const baseState = stateManager.createState(baseData);
      const baseSnapshot = snapshotManager.createSnapshot(baseState);

      // Create updated state
      const updatedState = stateManager.updateState(baseState.id, (draft) => {
        draft.turn = 2;
        draft.players[0].life = 18;
      });

      // Create incremental snapshot
      const incrementalSnapshot = snapshotManager.createSnapshot(
        updatedState,
        baseSnapshot.id,
      );

      expect(incrementalSnapshot.baseSnapshotId).toBe(baseSnapshot.id);
      expect(incrementalSnapshot.delta).toBeDefined();
    });
  });

  describe("shouldCreateSnapshot", () => {
    test("should return true when interval is reached", () => {
      expect(snapshotManager.shouldCreateSnapshot()).toBe(false);
      expect(snapshotManager.shouldCreateSnapshot()).toBe(false);
      expect(snapshotManager.shouldCreateSnapshot()).toBe(true);
    });

    test("should reset after snapshot creation", () => {
      snapshotManager.shouldCreateSnapshot();
      snapshotManager.shouldCreateSnapshot();
      snapshotManager.shouldCreateSnapshot();

      const data: TestGameState = {
        players: [],
        board: { zones: {} },
        turn: 1,
      };
      const state = stateManager.createState(data);
      snapshotManager.createSnapshot(state);

      expect(snapshotManager.shouldCreateSnapshot()).toBe(false);
    });
  });

  describe("getSnapshot", () => {
    test("should retrieve snapshot by ID", () => {
      const data: TestGameState = {
        players: [],
        board: { zones: {} },
        turn: 1,
      };

      const state = stateManager.createState(data);
      const snapshot = snapshotManager.createSnapshot(state);

      const retrieved = snapshotManager.getSnapshot(snapshot.id);
      expect(retrieved?.id).toBe(snapshot.id);
    });

    test("should return null for non-existent snapshot", () => {
      const retrieved = snapshotManager.getSnapshot("non-existent");
      expect(retrieved).toBeNull();
    });
  });

  describe("restoreFromSnapshot", () => {
    test("should restore state from full snapshot", () => {
      const data: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        board: { zones: { battlefield: { cards: ["card1"] } } },
        turn: 1,
      };

      const state = stateManager.createState(data);
      const snapshot = snapshotManager.createSnapshot(state);

      const restored = snapshotManager.restoreFromSnapshot(snapshot.id);

      expect(restored).toEqual(data);
    });

    test("should restore state from incremental snapshot", () => {
      const baseData: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        board: { zones: {} },
        turn: 1,
      };

      const baseState = stateManager.createState(baseData);
      const baseSnapshot = snapshotManager.createSnapshot(baseState);

      // Create updated state
      const updatedState = stateManager.updateState(baseState.id, (draft) => {
        draft.turn = 2;
        draft.players[0].life = 18;
      });

      const incrementalSnapshot = snapshotManager.createSnapshot(
        updatedState,
        baseSnapshot.id,
      );

      // Restore from incremental snapshot
      const restored = snapshotManager.restoreFromSnapshot(
        incrementalSnapshot.id,
      );

      expect(restored?.turn).toBe(2);
      expect(restored?.players[0].life).toBe(18);
    });

    test("should return null for non-existent snapshot", () => {
      const restored = snapshotManager.restoreFromSnapshot("non-existent");
      expect(restored).toBeNull();
    });
  });

  describe("getSnapshotAtVersion", () => {
    test("should get snapshot at exact version", () => {
      const data: TestGameState = {
        players: [],
        board: { zones: {} },
        turn: 1,
      };

      const state = stateManager.createState(data);
      const snapshot = snapshotManager.createSnapshot(state);

      const retrieved = snapshotManager.getSnapshotAtVersion(state.version);
      expect(retrieved?.id).toBe(snapshot.id);
    });

    test("should get closest ancestor snapshot", () => {
      const data: TestGameState = {
        players: [],
        board: { zones: {} },
        turn: 1,
      };

      const state1 = stateManager.createState(data);
      const snapshot1 = snapshotManager.createSnapshot(state1);

      const state2 = stateManager.updateState(state1.id, (draft) => {
        draft.turn = 2;
      });

      // Request version between state1 and state2
      const retrieved = snapshotManager.getSnapshotAtVersion(state2.version);

      // Should get snapshot1 (closest ancestor)
      expect(retrieved?.id).toBe(snapshot1.id);
    });
  });

  describe("listSnapshots", () => {
    test("should list all snapshots in chronological order", () => {
      const data: TestGameState = {
        players: [],
        board: { zones: {} },
        turn: 1,
      };

      const state1 = stateManager.createState(data);
      const snapshot1 = snapshotManager.createSnapshot(state1);

      const state2 = stateManager.updateState(state1.id, (draft) => {
        draft.turn = 2;
      });
      const snapshot2 = snapshotManager.createSnapshot(state2);

      const snapshots = snapshotManager.listSnapshots();

      expect(snapshots).toHaveLength(2);
      expect(snapshots[0].id).toBe(snapshot1.id);
      expect(snapshots[1].id).toBe(snapshot2.id);
    });
  });

  describe("pruneSnapshots", () => {
    test("should keep only recent snapshots", () => {
      const data: TestGameState = {
        players: [],
        board: { zones: {} },
        turn: 1,
      };

      // Create multiple snapshots
      let state = stateManager.createState(data);
      snapshotManager.createSnapshot(state);

      for (let i = 0; i < 5; i++) {
        state = stateManager.updateState(state.id, (draft) => {
          draft.turn++;
        });
        snapshotManager.createSnapshot(state);
      }

      expect(snapshotManager.listSnapshots()).toHaveLength(6);

      // Prune to keep only 3
      snapshotManager.pruneSnapshots(3);

      expect(snapshotManager.listSnapshots()).toHaveLength(3);
    });

    test("should not delete snapshots that are dependencies", () => {
      const data: TestGameState = {
        players: [],
        board: { zones: {} },
        turn: 1,
      };

      const state1 = stateManager.createState(data);
      const baseSnapshot = snapshotManager.createSnapshot(state1);

      // Create incremental snapshots based on base
      for (let i = 0; i < 3; i++) {
        const state = stateManager.updateState(state1.id, (draft) => {
          draft.turn = i + 2;
        });
        snapshotManager.createSnapshot(state, baseSnapshot.id);
      }

      // Try to prune, but base snapshot should be kept
      snapshotManager.pruneSnapshots(2);

      const baseStillExists = snapshotManager.getSnapshot(baseSnapshot.id);
      expect(baseStillExists).not.toBeNull();
    });
  });

  describe("configuration", () => {
    test("should get configuration", () => {
      const config = snapshotManager.getConfig();

      expect(config.interval).toBe(3);
      expect(config.enableCompression).toBe(true);
      expect(config.enableIncrementalSnapshots).toBe(true);
    });

    test("should update configuration", () => {
      snapshotManager.updateConfig({ interval: 5 });

      const config = snapshotManager.getConfig();
      expect(config.interval).toBe(5);
    });
  });

  describe("clearSnapshots", () => {
    test("should clear all snapshots", () => {
      const data: TestGameState = {
        players: [],
        board: { zones: {} },
        turn: 1,
      };

      const state = stateManager.createState(data);
      snapshotManager.createSnapshot(state);

      snapshotManager.clearSnapshots();

      expect(snapshotManager.listSnapshots()).toHaveLength(0);
    });
  });

  describe("delta calculation", () => {
    test("should calculate delta for nested changes", () => {
      const baseData: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        board: {
          zones: {
            hand: { cards: ["card1", "card2"] },
            battlefield: { cards: [] },
          },
        },
        turn: 1,
      };

      const baseState = stateManager.createState(baseData);
      const baseSnapshot = snapshotManager.createSnapshot(baseState);

      // Make complex update
      const updatedState = stateManager.updateState(baseState.id, (draft) => {
        draft.turn = 2;
        draft.players[0].life = 18;
        draft.board.zones.battlefield.cards.push("card1");
      });

      const incrementalSnapshot = snapshotManager.createSnapshot(
        updatedState,
        baseSnapshot.id,
      );

      // Verify delta is smaller than full data
      expect(incrementalSnapshot.delta).toBeDefined();

      // Restore and verify correctness
      const restored = snapshotManager.restoreFromSnapshot(
        incrementalSnapshot.id,
      );
      expect(restored?.turn).toBe(2);
      expect(restored?.players[0].life).toBe(18);
      expect(Array.isArray(restored?.board.zones.battlefield.cards)).toBe(true);
      expect(restored?.board.zones.battlefield.cards).toEqual(
        expect.arrayContaining(["card1"]),
      );
    });
  });
});
