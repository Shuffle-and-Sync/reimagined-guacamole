/**
 * Base Game Adapter Tests
 *
 * Tests for the abstract base game adapter class.
 */

import { BaseGameAdapter } from "../../services/games/adapters/base-game-adapter";
import type {
  GameConfig,
  ValidationResult,
  WinResult,
  Phase,
  StateDiff,
} from "../../../shared/game-adapter-types";

// Mock implementation for testing
class MockGameAdapter extends BaseGameAdapter<
  { value: number },
  { type: string; value: number }
> {
  readonly gameId = "mock";
  readonly gameName = "Mock Game";
  readonly version = "1.0.0";

  createInitialState(config: GameConfig): { value: number } {
    return { value: config.playerCount * 10 };
  }

  validateState(state: { value: number }): ValidationResult {
    return this.createValidationResult(
      state.value >= 0,
      state.value < 0 ? ["Value must be non-negative"] : undefined,
    );
  }

  validateAction(
    state: { value: number },
    action: { type: string; value: number },
  ): boolean {
    return action.type === "increment" || action.type === "decrement";
  }

  applyAction(
    state: { value: number },
    action: { type: string; value: number },
  ): { value: number } {
    if (action.type === "increment") {
      return { value: state.value + action.value };
    } else if (action.type === "decrement") {
      return { value: state.value - action.value };
    }
    return state;
  }

  getAvailableActions(
    state: { value: number },
    playerId: string,
  ): Array<{ type: string; value: number }> {
    return [
      { type: "increment", value: 1 },
      { type: "decrement", value: 1 },
    ];
  }

  checkWinCondition(state: { value: number }): WinResult | null {
    if (state.value >= 100) {
      return this.createWinResult("player-1", "reached_100");
    }
    return null;
  }

  getGamePhases(): Phase[] {
    return [
      this.createPhase("phase1", "Phase 1", 1, "First phase"),
      this.createPhase("phase2", "Phase 2", 2, "Second phase"),
    ];
  }

  advancePhase(state: { value: number }): { value: number } {
    return { value: state.value + 1 };
  }
}

describe("BaseGameAdapter", () => {
  let adapter: MockGameAdapter;

  beforeEach(() => {
    adapter = new MockGameAdapter();
  });

  describe("Metadata", () => {
    it("should have correct metadata", () => {
      expect(adapter.gameId).toBe("mock");
      expect(adapter.gameName).toBe("Mock Game");
      expect(adapter.version).toBe("1.0.0");
    });
  });

  describe("State Management", () => {
    it("should create initial state", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      expect(state).toEqual({ value: 20 });
    });

    it("should validate valid state", () => {
      const result = adapter.validateState({ value: 50 });

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should reject invalid state", () => {
      const result = adapter.validateState({ value: -10 });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain("Value must be non-negative");
    });

    it("should serialize state to JSON", () => {
      const state = { value: 42 };
      const serialized = adapter.serializeState(state);

      expect(serialized).toBe('{"value":42}');
    });

    it("should deserialize state from JSON", () => {
      const json = '{"value":42}';
      const state = adapter.deserializeState(json);

      expect(state).toEqual({ value: 42 });
    });
  });

  describe("Actions", () => {
    it("should validate valid actions", () => {
      const state = { value: 50 };
      const validAction = { type: "increment", value: 5 };

      expect(adapter.validateAction(state, validAction)).toBe(true);
    });

    it("should reject invalid actions", () => {
      const state = { value: 50 };
      const invalidAction = { type: "invalid", value: 5 };

      expect(adapter.validateAction(state, invalidAction)).toBe(false);
    });

    it("should apply actions correctly", () => {
      const state = { value: 50 };
      const action = { type: "increment", value: 10 };

      const newState = adapter.applyAction(state, action);

      expect(newState).toEqual({ value: 60 });
      expect(state).toEqual({ value: 50 }); // Original unchanged
    });

    it("should get available actions", () => {
      const state = { value: 50 };
      const actions = adapter.getAvailableActions(state, "player-1");

      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe("increment");
      expect(actions[1].type).toBe("decrement");
    });
  });

  describe("Win Conditions", () => {
    it("should return null when no win condition met", () => {
      const state = { value: 50 };
      const result = adapter.checkWinCondition(state);

      expect(result).toBeNull();
    });

    it("should detect win condition", () => {
      const state = { value: 100 };
      const result = adapter.checkWinCondition(state);

      expect(result).not.toBeNull();
      expect(result?.winnerId).toBe("player-1");
      expect(result?.winCondition).toBe("reached_100");
      expect(result?.timestamp).toBeInstanceOf(Date);
    });
  });

  describe("Game Phases", () => {
    it("should return game phases", () => {
      const phases = adapter.getGamePhases();

      expect(phases).toHaveLength(2);
      expect(phases[0].id).toBe("phase1");
      expect(phases[0].name).toBe("Phase 1");
      expect(phases[0].order).toBe(1);
      expect(phases[1].id).toBe("phase2");
      expect(phases[1].name).toBe("Phase 2");
      expect(phases[1].order).toBe(2);
    });

    it("should advance phase", () => {
      const state = { value: 50 };
      const newState = adapter.advancePhase(state);

      expect(newState.value).toBe(51);
    });
  });

  describe("State Synchronization", () => {
    it("should detect state differences", () => {
      const oldState = { value: 50 };
      const newState = { value: 60 };

      const diffs = adapter.getStateDiff(oldState, newState);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].type).toBe("replace");
      expect(diffs[0].path).toBe("value");
      expect(diffs[0].oldValue).toBe(50);
      expect(diffs[0].newValue).toBe(60);
    });

    it("should return empty diff for identical states", () => {
      const state = { value: 50 };

      const diffs = adapter.getStateDiff(state, state);

      expect(diffs).toHaveLength(0);
    });

    it("should apply state diffs", () => {
      const state = { value: 50 };
      const diff: StateDiff = {
        type: "replace",
        path: "value",
        oldValue: 50,
        newValue: 60,
        timestamp: new Date(),
      };

      const newState = adapter.applyStateDiff(state, [diff]);

      expect(newState).toEqual({ value: 60 });
    });
  });

  describe("Helper Methods", () => {
    it("should create validation result", () => {
      const result = (adapter as any).createValidationResult(true);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should create validation result with errors", () => {
      const result = (adapter as any).createValidationResult(false, [
        "Error 1",
        "Error 2",
      ]);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(["Error 1", "Error 2"]);
    });

    it("should create win result", () => {
      const result = (adapter as any).createWinResult("player-1", "victory");

      expect(result.winnerId).toBe("player-1");
      expect(result.winCondition).toBe("victory");
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("should create phase", () => {
      const phase = (adapter as any).createPhase(
        "test",
        "Test Phase",
        1,
        "Description",
        ["action1", "action2"],
      );

      expect(phase.id).toBe("test");
      expect(phase.name).toBe("Test Phase");
      expect(phase.order).toBe(1);
      expect(phase.description).toBe("Description");
      expect(phase.allowedActions).toEqual(["action1", "action2"]);
    });
  });
});
