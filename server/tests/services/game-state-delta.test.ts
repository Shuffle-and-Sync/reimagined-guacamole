/**
 * Tests for Game State Delta/Patch System
 *
 * Tests delta compression, operation application, and state synchronization
 */

import { describe, test, expect } from "@jest/globals";
import {
  GameStateDeltaCompressor,
  createFullStateSyncMessage,
  createDeltaSyncMessage,
  shouldUseDelta,
  type GameStateDelta,
  type DeltaOperation,
  GameStateDeltaSchema,
} from "../../../shared/game-state-delta";
import {
  createInitialTCGState,
  GameStateManager,
  createGameAction,
} from "../../../shared/game-state-manager";
import type { TCGGameState } from "../../../shared/game-state-schema";

describe("Game State Delta System", () => {
  let initialState: TCGGameState;
  let manager: GameStateManager;

  beforeEach(() => {
    initialState = createInitialTCGState(
      "test-session",
      ["player-1", "player-2"],
      ["Alice", "Bob"],
    );
    manager = new GameStateManager();
    manager.initialize(initialState);
  });

  describe("Delta Creation", () => {
    test("should create empty delta for identical states", () => {
      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        initialState,
      );

      expect(delta.operations).toHaveLength(0);
      expect(delta.baseVersion).toBe(initialState.version);
      expect(delta.targetVersion).toBe(initialState.version);
    });

    test("should create delta for simple property change", () => {
      const newState = { ...initialState, version: 1 };

      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        newState,
      );

      expect(delta.operations.length).toBeGreaterThan(0);
      expect(delta.baseVersion).toBe(0);
      expect(delta.targetVersion).toBe(1);
    });

    test("should create delta for player life change", () => {
      const action = createGameAction(
        "change_life",
        "player-1",
        { delta: -3 },
        0,
      );
      const newState = manager.applyAction(action, initialState);

      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        newState,
      );

      expect(delta.operations.length).toBeGreaterThan(0);

      // Should contain an operation for life total change
      const lifeOp = delta.operations.find((op) =>
        op.path.includes("lifeTotal"),
      );
      expect(lifeOp).toBeDefined();
    });

    test("should create delta for drawing cards", () => {
      const action = createGameAction("draw", "player-1", { count: 2 }, 0);
      const newState = manager.applyAction(action, initialState);

      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        newState,
      );

      expect(delta.operations.length).toBeGreaterThan(0);
    });

    test("should create delta for battlefield changes", () => {
      // Draw and play a card
      let state = initialState;
      const drawAction = createGameAction("draw", "player-1", { count: 1 }, 0);
      state = manager.applyAction(drawAction, state);

      const oldState = state;
      const cardId = state.players[0].hand[0].id;
      const playAction = createGameAction("play", "player-1", { cardId }, 1);
      state = manager.applyAction(playAction, state);

      const delta = GameStateDeltaCompressor.createDelta(oldState, state);

      expect(delta.operations.length).toBeGreaterThan(0);
    });
  });

  describe("Delta Application", () => {
    test("should apply empty delta without changes", () => {
      const delta: GameStateDelta = {
        baseVersion: 0,
        targetVersion: 0,
        operations: [],
        timestamp: Date.now(),
      };

      const result = GameStateDeltaCompressor.applyDelta(initialState, delta);

      // Compare everything except timestamp which will differ
      expect(result.version).toBe(initialState.version);
      expect(result.players).toEqual(initialState.players);
      expect(result.battlefield).toEqual(initialState.battlefield);
      expect(result.stack).toEqual(initialState.stack);
    });

    test("should apply delta for property replacement", () => {
      const newState = JSON.parse(JSON.stringify(initialState));
      newState.players[0].lifeTotal = 17;
      newState.version = 1;

      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        newState,
      );
      const result = GameStateDeltaCompressor.applyDelta(initialState, delta);

      expect(result.players[0].lifeTotal).toBe(17);
      expect(result.version).toBe(1);
    });

    test("should throw error on version mismatch", () => {
      const delta: GameStateDelta = {
        baseVersion: 5,
        targetVersion: 6,
        operations: [],
        timestamp: Date.now(),
      };

      expect(() => {
        GameStateDeltaCompressor.applyDelta(initialState, delta);
      }).toThrow("Version mismatch");
    });

    test("should apply delta for array addition", () => {
      const newState = JSON.parse(JSON.stringify(initialState));
      newState.players[0].hand.push({ id: "new-card", name: "Test Card" });
      newState.version = 1;

      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        newState,
      );
      const result = GameStateDeltaCompressor.applyDelta(initialState, delta);

      expect(result.players[0].hand.length).toBe(
        initialState.players[0].hand.length + 1,
      );
    });

    test("should apply delta for array removal", () => {
      // First add some cards
      const stateWithCards = JSON.parse(JSON.stringify(initialState));
      stateWithCards.players[0].hand = [
        { id: "card-1" },
        { id: "card-2" },
        { id: "card-3" },
      ];

      const newState = JSON.parse(JSON.stringify(stateWithCards));
      newState.players[0].hand = [{ id: "card-1" }, { id: "card-3" }];
      newState.version = 1;

      const delta = GameStateDeltaCompressor.createDelta(
        stateWithCards,
        newState,
      );
      const result = GameStateDeltaCompressor.applyDelta(stateWithCards, delta);

      expect(result.players[0].hand).toHaveLength(2);
    });

    test("should apply delta for nested object changes", () => {
      const newState = JSON.parse(JSON.stringify(initialState));
      newState.currentTurn.phase = "main1";
      newState.currentTurn.turnNumber = 2;
      newState.version = 1;

      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        newState,
      );
      const result = GameStateDeltaCompressor.applyDelta(initialState, delta);

      expect(result.currentTurn.phase).toBe("main1");
      expect(result.currentTurn.turnNumber).toBe(2);
    });
  });

  describe("Roundtrip Delta Operations", () => {
    test("should roundtrip through delta creation and application", () => {
      const action = createGameAction(
        "change_life",
        "player-1",
        { delta: -5 },
        0,
      );
      const newState = manager.applyAction(action, initialState);

      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        newState,
      );
      const result = GameStateDeltaCompressor.applyDelta(initialState, delta);

      expect(result.players[0].lifeTotal).toBe(newState.players[0].lifeTotal);
      expect(result.version).toBe(newState.version);
    });

    test("should roundtrip complex state changes", () => {
      let state = initialState;

      // Perform multiple actions
      const actions = [
        createGameAction("draw", "player-1", { count: 2 }, 0),
        createGameAction("change_life", "player-2", { delta: -3 }, 1),
        createGameAction("advance_phase", "player-1", {}, 2),
      ];

      for (const action of actions) {
        const prevState = state;
        state = manager.applyAction(action, state);

        // Test roundtrip
        const delta = GameStateDeltaCompressor.createDelta(prevState, state);
        const result = GameStateDeltaCompressor.applyDelta(prevState, delta);

        expect(result.version).toBe(state.version);
        expect(result.players[0].hand.length).toBe(
          state.players[0].hand.length,
        );
      }
    });
  });

  describe("Delta Validation", () => {
    test("should validate correct delta schema", () => {
      const delta: GameStateDelta = {
        baseVersion: 0,
        targetVersion: 1,
        operations: [{ op: "replace", path: "/version", value: 1 }],
        timestamp: Date.now(),
      };

      const result = GameStateDeltaSchema.safeParse(delta);
      expect(result.success).toBe(true);
    });

    test("should reject invalid delta schema", () => {
      const invalidDelta = {
        baseVersion: "not-a-number",
        operations: [],
      };

      const result = GameStateDeltaSchema.safeParse(invalidDelta);
      expect(result.success).toBe(false);
    });

    test("should validate all operation types", () => {
      const operations: DeltaOperation[] = [
        { op: "add", path: "/test", value: "value" },
        { op: "remove", path: "/test" },
        { op: "replace", path: "/test", value: "new" },
        { op: "move", from: "/old", path: "/new" },
        { op: "copy", from: "/src", path: "/dest" },
        { op: "test", path: "/test", value: "expected" },
      ];

      const delta: GameStateDelta = {
        baseVersion: 0,
        targetVersion: 1,
        operations,
        timestamp: Date.now(),
      };

      const result = GameStateDeltaSchema.safeParse(delta);
      expect(result.success).toBe(true);
    });
  });

  describe("Compression Ratio", () => {
    test("should calculate compression ratio", () => {
      const action = createGameAction(
        "change_life",
        "player-1",
        { delta: -1 },
        0,
      );
      const newState = manager.applyAction(action, initialState);

      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        newState,
      );

      const ratio = GameStateDeltaCompressor.calculateCompressionRatio(
        newState,
        delta,
      );

      expect(ratio).toBeGreaterThan(0);
      expect(ratio).toBeLessThanOrEqual(100);
    });

    test("should show high compression for small changes", () => {
      const newState = JSON.parse(JSON.stringify(initialState));
      newState.version = 1;
      newState.players[0].lifeTotal = 19;

      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        newState,
      );

      const ratio = GameStateDeltaCompressor.calculateCompressionRatio(
        newState,
        delta,
      );

      // Small change should have high compression ratio
      expect(ratio).toBeGreaterThan(50);
    });
  });

  describe("Delta Merging", () => {
    test("should merge sequential deltas", () => {
      let state = initialState;

      // Create multiple deltas
      const deltas: GameStateDelta[] = [];

      for (let i = 0; i < 3; i++) {
        const prevState = state;
        const action = createGameAction(
          "change_life",
          "player-1",
          { delta: -1 },
          i,
        );
        state = manager.applyAction(action, state);

        const delta = GameStateDeltaCompressor.createDelta(prevState, state);
        deltas.push(delta);
      }

      const merged = GameStateDeltaCompressor.mergeDeltas(deltas);

      expect(merged).toBeDefined();
      if (merged) {
        expect(merged.baseVersion).toBe(0);
        expect(merged.targetVersion).toBe(3);
        expect(merged.operations.length).toBeGreaterThan(0);
      }
    });

    test("should return null for empty delta array", () => {
      const merged = GameStateDeltaCompressor.mergeDeltas([]);
      expect(merged).toBeNull();
    });

    test("should return single delta unchanged", () => {
      const delta: GameStateDelta = {
        baseVersion: 0,
        targetVersion: 1,
        operations: [{ op: "replace", path: "/test", value: 1 }],
        timestamp: Date.now(),
      };

      const merged = GameStateDeltaCompressor.mergeDeltas([delta]);
      expect(merged).toEqual(delta);
    });

    test("should throw error for non-sequential deltas", () => {
      const delta1: GameStateDelta = {
        baseVersion: 0,
        targetVersion: 1,
        operations: [],
        timestamp: Date.now(),
      };

      const delta2: GameStateDelta = {
        baseVersion: 5, // Non-sequential!
        targetVersion: 6,
        operations: [],
        timestamp: Date.now(),
      };

      expect(() => {
        GameStateDeltaCompressor.mergeDeltas([delta1, delta2]);
      }).toThrow("not sequential");
    });
  });

  describe("Sync Messages", () => {
    test("should create full state sync message", () => {
      const message = createFullStateSyncMessage("session-123", initialState);

      expect(message.type).toBe("game_state_sync");
      expect(message.sessionId).toBe("session-123");
      expect(message.syncType).toBe("full");
      expect(message.fullState).toEqual(initialState);
      expect(message.delta).toBeUndefined();
    });

    test("should create delta sync message", () => {
      const delta: GameStateDelta = {
        baseVersion: 0,
        targetVersion: 1,
        operations: [],
        timestamp: Date.now(),
      };

      const message = createDeltaSyncMessage("session-123", delta);

      expect(message.type).toBe("game_state_sync");
      expect(message.sessionId).toBe("session-123");
      expect(message.syncType).toBe("delta");
      expect(message.delta).toEqual(delta);
      expect(message.fullState).toBeUndefined();
    });

    test("should determine when to use delta based on size", () => {
      const action = createGameAction(
        "change_life",
        "player-1",
        { delta: -1 },
        0,
      );
      const newState = manager.applyAction(action, initialState);

      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        newState,
      );

      // Calculate compression ratio
      const ratio = GameStateDeltaCompressor.calculateCompressionRatio(
        newState,
        delta,
      );

      // Small change should have good compression
      expect(ratio).toBeGreaterThan(0);

      // Use a more generous threshold for this test
      const useDelta = shouldUseDelta(newState, delta, 0.5); // 50% threshold
      expect(useDelta).toBe(true);
    });

    test("should use full state for large changes", () => {
      // Create a large delta with many operations
      const operations: DeltaOperation[] = [];
      for (let i = 0; i < 100; i++) {
        operations.push({
          op: "add",
          path: `/test${i}`,
          value: `value${i}`,
        });
      }

      const delta: GameStateDelta = {
        baseVersion: 0,
        targetVersion: 1,
        operations,
        timestamp: Date.now(),
      };

      const useDelta = shouldUseDelta(initialState, delta, 0.1);
      // Large delta should prefer full state
      expect(useDelta).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty arrays", () => {
      const state1 = JSON.parse(JSON.stringify(initialState));
      const state2 = JSON.parse(JSON.stringify(initialState));

      state1.players[0].hand = [];
      state2.players[0].hand = [{ id: "card-1" }];
      state2.version = 1;

      const delta = GameStateDeltaCompressor.createDelta(state1, state2);
      const result = GameStateDeltaCompressor.applyDelta(state1, delta);

      expect(result.players[0].hand).toHaveLength(1);
    });

    test("should handle null values", () => {
      const state1 = JSON.parse(JSON.stringify(initialState));
      const state2 = JSON.parse(JSON.stringify(initialState));

      state2.winnerId = "player-1";
      state2.version = 1;

      const delta = GameStateDeltaCompressor.createDelta(state1, state2);
      const result = GameStateDeltaCompressor.applyDelta(state1, delta);

      expect(result.winnerId).toBe("player-1");
    });

    test("should handle deep nested changes", () => {
      const state1 = JSON.parse(JSON.stringify(initialState));
      const state2 = JSON.parse(JSON.stringify(initialState));

      state2.battlefield.permanents = [
        {
          id: "perm-1",
          ownerId: "player-1",
          controllerId: "player-1",
          counters: { "+1/+1": 3 },
        },
      ];
      state2.version = 1;

      const delta = GameStateDeltaCompressor.createDelta(state1, state2);
      const result = GameStateDeltaCompressor.applyDelta(state1, delta);

      expect(result.battlefield.permanents).toHaveLength(1);
      expect(result.battlefield.permanents[0].counters?.["+1/+1"]).toBe(3);
    });
  });
});
