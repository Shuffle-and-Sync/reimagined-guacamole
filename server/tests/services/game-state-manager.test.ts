/**
 * Tests for Game State Manager
 *
 * Tests versioning, conflict resolution, undo/redo, and operational transformation
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  GameStateManager,
  createGameAction,
  createInitialTCGState,
} from "../../../shared/game-state-manager";
import type {
  TCGGameState,
  GameStateAction,
} from "../../../shared/game-state-schema";

describe("GameStateManager", () => {
  let manager: GameStateManager;
  let initialState: TCGGameState;

  beforeEach(() => {
    manager = new GameStateManager();
    initialState = createInitialTCGState(
      "session-123",
      ["player-1", "player-2"],
      ["Alice", "Bob"],
    );
    manager.initialize(initialState);
  });

  describe("Initialization", () => {
    test("should initialize with a valid game state", () => {
      expect(manager.getCurrentVersion()).toBe(0);
      expect(manager.getStateAtVersion(0)).toEqual(initialState);
    });

    test("should reject invalid initial state", () => {
      const invalidState = { version: 0 } as any;

      expect(() => {
        manager.initialize(invalidState);
      }).toThrow();
    });

    test("should create initial state with correct structure", () => {
      expect(initialState.players).toHaveLength(2);
      expect(initialState.players[0].name).toBe("Alice");
      expect(initialState.players[1].name).toBe("Bob");
      expect(initialState.turnOrder).toEqual(["player-1", "player-2"]);
      expect(initialState.currentTurn.playerId).toBe("player-1");
      expect(initialState.currentTurn.phase).toBe("untap");
    });
  });

  describe("Action Application", () => {
    test("should apply a draw action", () => {
      const action = createGameAction("draw", "player-1", { count: 1 }, 0);

      const newState = manager.applyAction(action, initialState);

      expect(newState.version).toBe(1);
      expect(newState.players[0].hand).toHaveLength(1);
      expect(newState.players[0].library.count).toBe(59);
    });

    test("should apply a play action", () => {
      // First draw a card
      const drawAction = createGameAction("draw", "player-1", { count: 1 }, 0);
      const stateAfterDraw = manager.applyAction(drawAction, initialState);

      const cardId = stateAfterDraw.players[0].hand[0].id;

      // Then play it
      const playAction = createGameAction("play", "player-1", { cardId }, 1);
      const stateAfterPlay = manager.applyAction(playAction, stateAfterDraw);

      expect(stateAfterPlay.version).toBe(2);
      expect(stateAfterPlay.players[0].hand).toHaveLength(0);
      expect(stateAfterPlay.battlefield.permanents).toHaveLength(1);
    });

    test("should apply a tap action", () => {
      // Draw and play a card first
      let state = initialState;
      const drawAction = createGameAction("draw", "player-1", { count: 1 }, 0);
      state = manager.applyAction(drawAction, state);

      const cardId = state.players[0].hand[0].id;
      const playAction = createGameAction("play", "player-1", { cardId }, 1);
      state = manager.applyAction(playAction, state);

      // Tap the permanent
      const permanentId = state.battlefield.permanents[0].id;
      const tapAction = createGameAction(
        "tap",
        "player-1",
        { cardId: permanentId },
        2,
      );
      const finalState = manager.applyAction(tapAction, state);

      expect(finalState.battlefield.permanents[0].isTapped).toBe(true);
    });

    test("should apply a change life action", () => {
      const action = createGameAction(
        "change_life",
        "player-1",
        { delta: -3 },
        0,
      );

      const newState = manager.applyAction(action, initialState);

      expect(newState.players[0].lifeTotal).toBe(17);
    });

    test("should detect loss when life reaches 0", () => {
      const action = createGameAction(
        "change_life",
        "player-1",
        { delta: -20 },
        0,
      );

      const newState = manager.applyAction(action, initialState);

      expect(newState.players[0].lifeTotal).toBe(0);
      expect(newState.players[0].hasLost).toBe(true);
      expect(newState.players[0].lossReason).toBe("life total reached 0");
    });

    test("should apply add counter action", () => {
      // Draw and play a card first
      let state = initialState;
      const drawAction = createGameAction("draw", "player-1", { count: 1 }, 0);
      state = manager.applyAction(drawAction, state);

      const cardId = state.players[0].hand[0].id;
      const playAction = createGameAction("play", "player-1", { cardId }, 1);
      state = manager.applyAction(playAction, state);

      // Add +1/+1 counter
      const permanentId = state.battlefield.permanents[0].id;
      const addCounterAction = createGameAction(
        "add_counter",
        "player-1",
        { cardId: permanentId, counterType: "+1/+1", count: 2 },
        2,
      );
      const finalState = manager.applyAction(addCounterAction, state);

      expect(finalState.battlefield.permanents[0].counters?.["+1/+1"]).toBe(2);
    });

    test("should apply advance phase action", () => {
      const action = createGameAction("advance_phase", "player-1", {}, 0);

      const newState = manager.applyAction(action, initialState);

      expect(newState.currentTurn.phase).toBe("upkeep");
    });

    test("should advance to next player after cleanup", () => {
      let state = initialState;

      // Go through all phases to reach cleanup
      const phases = [
        "upkeep",
        "draw",
        "main1",
        "combat_begin",
        "combat_attackers",
        "combat_blockers",
        "combat_damage",
        "combat_end",
        "main2",
        "end",
        "cleanup",
      ];

      let version = 0;
      for (const expectedPhase of phases) {
        const action = createGameAction(
          "advance_phase",
          "player-1",
          {},
          version,
        );
        state = manager.applyAction(action, state);
        version++;
      }

      // After cleanup, should advance to next player's untap
      const action = createGameAction("advance_phase", "player-1", {}, version);
      state = manager.applyAction(action, state);

      expect(state.currentTurn.playerId).toBe("player-2");
      expect(state.currentTurn.phase).toBe("untap");
      expect(state.currentTurn.turnNumber).toBe(2);
    });

    test("should handle concede action", () => {
      const action = createGameAction("concede", "player-2", {}, 0);

      const newState = manager.applyAction(action, initialState);

      expect(newState.players[1].hasLost).toBe(true);
      expect(newState.players[1].lossReason).toBe("conceded");
      expect(newState.winnerId).toBe("player-1");
      expect(newState.winCondition).toBe("opponents conceded");
    });
  });

  describe("Conflict Resolution", () => {
    test("should resolve concurrent draw actions (independent)", () => {
      // Both players draw at the same time
      const action1 = createGameAction("draw", "player-1", { count: 1 }, 0);
      const action2 = createGameAction("draw", "player-2", { count: 1 }, 0);

      const state1 = manager.applyAction(action1, initialState);
      const state2 = manager.applyAction(action2, state1);

      expect(state2.players[0].hand).toHaveLength(1);
      expect(state2.players[1].hand).toHaveLength(1);
    });

    test("should resolve conflicting tap actions (first wins)", () => {
      // Set up: play a card
      let state = initialState;
      const drawAction = createGameAction("draw", "player-1", { count: 1 }, 0);
      state = manager.applyAction(drawAction, state);

      const cardId = state.players[0].hand[0].id;
      const playAction = createGameAction("play", "player-1", { cardId }, 1);
      state = manager.applyAction(playAction, state);

      const permanentId = state.battlefield.permanents[0].id;

      // Both players try to tap the same permanent at version 2
      const tapAction1 = createGameAction(
        "tap",
        "player-1",
        { cardId: permanentId },
        2,
      );
      const tapAction2 = createGameAction(
        "tap",
        "player-2",
        { cardId: permanentId },
        2,
      );

      const state1 = manager.applyAction(tapAction1, state);
      const state2 = manager.applyAction(tapAction2, state1);

      // First tap succeeds, second is transformed to no-op (pass_priority)
      expect(state1.battlefield.permanents[0].isTapped).toBe(true);
      expect(state2.version).toBe(3); // Only first tap increments version meaningfully
      // The permanent should still be tapped
      expect(state2.battlefield.permanents[0].isTapped).toBe(true);
    });

    test("should handle life changes as commutative operations", () => {
      const action1 = createGameAction(
        "change_life",
        "player-1",
        { delta: -3 },
        0,
      );
      const action2 = createGameAction(
        "change_life",
        "player-1",
        { delta: -2 },
        0,
      );

      const state1 = manager.applyAction(action1, initialState);
      const state2 = manager.applyAction(action2, state1);

      // Both deltas should be applied
      expect(state2.players[0].lifeTotal).toBe(15); // 20 - 3 - 2
    });
  });

  describe("Undo/Redo", () => {
    test("should undo a single action", () => {
      const action = createGameAction("draw", "player-1", { count: 1 }, 0);
      const newState = manager.applyAction(action, initialState);

      expect(newState.version).toBe(1);
      expect(newState.players[0].hand).toHaveLength(1);

      const undoneState = manager.undo();

      expect(undoneState).toBeDefined();
      expect(undoneState!.version).toBe(0);
      expect(undoneState!.players[0].hand).toHaveLength(0);
    });

    test("should undo multiple actions", () => {
      let state = initialState;

      // Apply 3 actions
      for (let i = 0; i < 3; i++) {
        const action = createGameAction("draw", "player-1", { count: 1 }, i);
        state = manager.applyAction(action, state);
      }

      expect(state.version).toBe(3);
      expect(state.players[0].hand).toHaveLength(3);

      // Undo 2 steps
      const undoneState = manager.undo(2);

      expect(undoneState).toBeDefined();
      expect(undoneState!.version).toBe(1);
      expect(undoneState!.players[0].hand).toHaveLength(1);
    });

    test("should return null when undoing beyond history", () => {
      const undoneState = manager.undo(5);

      expect(undoneState).toBeNull();
    });

    test("should redo an undone action", () => {
      const action = createGameAction("draw", "player-1", { count: 1 }, 0);
      manager.applyAction(action, initialState);

      manager.undo();
      const redoneState = manager.redo();

      expect(redoneState).toBeDefined();
      expect(redoneState!.version).toBe(1);
      expect(redoneState!.players[0].hand).toHaveLength(1);
    });

    test("should redo multiple steps", () => {
      let state = initialState;

      // Apply 3 actions
      for (let i = 0; i < 3; i++) {
        const action = createGameAction("draw", "player-1", { count: 1 }, i);
        state = manager.applyAction(action, state);
      }

      // Undo all
      manager.undo(3);

      // Redo 2 steps
      const redoneState = manager.redo(2);

      expect(redoneState).toBeDefined();
      expect(redoneState!.version).toBe(2);
      expect(redoneState!.players[0].hand).toHaveLength(2);
    });

    test("should return null when redoing beyond available history", () => {
      const redoneState = manager.redo(5);

      expect(redoneState).toBeNull();
    });
  });

  describe("History Management", () => {
    test("should track all versions in history", () => {
      let state = initialState;

      // Apply 5 actions
      for (let i = 0; i < 5; i++) {
        const action = createGameAction("draw", "player-1", { count: 1 }, i);
        state = manager.applyAction(action, state);
      }

      const versions = manager.getAvailableVersions();

      expect(versions).toEqual([0, 1, 2, 3, 4, 5]);
    });

    test("should retrieve state at specific version", () => {
      let state = initialState;

      // Apply 5 actions
      for (let i = 0; i < 5; i++) {
        const action = createGameAction("draw", "player-1", { count: 1 }, i);
        state = manager.applyAction(action, state);
      }

      const version3State = manager.getStateAtVersion(3);

      expect(version3State).toBeDefined();
      expect(version3State!.version).toBe(3);
      expect(version3State!.players[0].hand).toHaveLength(3);
    });

    test("should trim history when exceeding max size", () => {
      const smallManager = new GameStateManager(5);
      const smallState = createInitialTCGState(
        "session-456",
        ["p1", "p2"],
        ["A", "B"],
      );
      smallManager.initialize(smallState);

      let state = smallState;

      // Apply 10 actions (more than max history size)
      for (let i = 0; i < 10; i++) {
        const action = createGameAction("draw", "p1", { count: 1 }, i);
        state = smallManager.applyAction(action, state);
      }

      const versions = smallManager.getAvailableVersions();

      // Should keep only last 5 versions + initial
      expect(versions.length).toBeLessThanOrEqual(6);
      expect(versions).toContain(10); // Most recent version
    });

    test("should retrieve actions since a version", () => {
      let state = initialState;

      // Apply 5 actions
      for (let i = 0; i < 5; i++) {
        const action = createGameAction("draw", "player-1", { count: 1 }, i);
        state = manager.applyAction(action, state);
      }

      const actionsSince = manager.getActionsSince(2);

      expect(actionsSince.length).toBeGreaterThanOrEqual(3);
      expect(actionsSince.every((a) => a.previousStateVersion >= 2)).toBe(true);
    });

    test("should clear all history", () => {
      let state = initialState;

      // Apply some actions
      for (let i = 0; i < 3; i++) {
        const action = createGameAction("draw", "player-1", { count: 1 }, i);
        state = manager.applyAction(action, state);
      }

      manager.clear();

      expect(manager.getCurrentVersion()).toBe(0);
      expect(manager.getAvailableVersions()).toHaveLength(0);
    });
  });

  describe("Helper Functions", () => {
    test("createGameAction should create valid action", () => {
      const action = createGameAction("draw", "player-1", { count: 2 }, 5);

      expect(action.id).toBeDefined();
      expect(action.type).toBe("draw");
      expect(action.playerId).toBe("player-1");
      expect(action.timestamp).toBeDefined();
      expect(action.payload).toEqual({ count: 2 });
      expect(action.previousStateVersion).toBe(5);
      expect(action.resultingStateVersion).toBe(6);
    });

    test("createInitialTCGState should create valid initial state", () => {
      const state = createInitialTCGState(
        "test-session",
        ["p1", "p2", "p3"],
        ["Alice", "Bob", "Charlie"],
      );

      expect(state.sessionId).toBe("test-session");
      expect(state.players).toHaveLength(3);
      expect(state.players[0].name).toBe("Alice");
      expect(state.players[1].name).toBe("Bob");
      expect(state.players[2].name).toBe("Charlie");
      expect(state.turnOrder).toEqual(["p1", "p2", "p3"]);
      expect(state.version).toBe(0);
    });

    test("createInitialTCGState should use default names if not provided", () => {
      const state = createInitialTCGState("test-session", ["p1", "p2"], []);

      expect(state.players[0].name).toBe("Player 1");
      expect(state.players[1].name).toBe("Player 2");
    });
  });
});
