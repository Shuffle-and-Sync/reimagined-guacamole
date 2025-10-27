/**
 * MTG Game Adapter Tests
 *
 * Tests for Magic: The Gathering game adapter implementation.
 */

import { MTGGameAdapter } from "../../services/games/adapters/mtg-adapter";
import type { GameConfig } from "../../../shared/game-adapter-types";

describe("MTGGameAdapter", () => {
  let adapter: MTGGameAdapter;

  beforeEach(() => {
    adapter = new MTGGameAdapter();
  });

  describe("Metadata", () => {
    it("should have correct metadata", () => {
      expect(adapter.gameId).toBe("mtg");
      expect(adapter.gameName).toBe("Magic: The Gathering");
      expect(adapter.version).toBe("1.0.0");
    });
  });

  describe("State Management", () => {
    it("should create initial state for 2 players", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      expect(state.players).toHaveLength(2);
      expect(state.activePlayerIndex).toBe(0);
      expect(state.turnNumber).toBe(1);
      expect(state.isGameOver).toBe(false);
    });

    it("should create initial state for 4 players (Commander)", () => {
      const config: GameConfig = { playerCount: 4 };
      const state = adapter.createInitialState(config);

      expect(state.players).toHaveLength(4);
      state.players.forEach((player) => {
        expect(player.life).toBe(40); // Commander starting life
        expect(player.zones.hand).toHaveLength(7); // Starting hand
        expect(player.zones.library.length).toBeGreaterThan(0);
      });
    });

    it("should respect custom starting life", () => {
      const config: GameConfig = {
        playerCount: 2,
        startingResources: { life: 20 },
      };
      const state = adapter.createInitialState(config);

      state.players.forEach((player) => {
        expect(player.life).toBe(20);
      });
    });

    it("should validate valid game state", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      const result = adapter.validateState(state);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual(undefined);
    });

    it("should detect invalid player count", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);
      state.players = []; // Remove all players

      const result = adapter.validateState(state);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain("Invalid player count");
    });

    it("should detect negative life", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);
      state.players[0].life = -5;

      const result = adapter.validateState(state);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain("negative life");
    });
  });

  describe("Game Phases", () => {
    it("should return correct MTG phases", () => {
      const phases = adapter.getGamePhases();

      expect(phases).toHaveLength(5);
      expect(phases[0].id).toBe("beginning");
      expect(phases[1].id).toBe("precombat_main");
      expect(phases[2].id).toBe("combat");
      expect(phases[3].id).toBe("postcombat_main");
      expect(phases[4].id).toBe("ending");
    });

    it("should advance through phases correctly", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);

      expect(state.currentPhase).toBe("beginning");
      expect(state.turnNumber).toBe(1);

      // Advance through phases
      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("precombat_main");

      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("combat");

      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("postcombat_main");

      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("ending");

      // Should wrap to next turn
      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("beginning");
      expect(state.turnNumber).toBe(2);
      expect(state.activePlayerIndex).toBe(1);
    });

    it("should reset per-turn flags on new turn", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);

      // Play a land
      state.players[0].hasPlayedLand = true;

      // Advance to next turn
      for (let i = 0; i < 5; i++) {
        state = adapter.advancePhase(state);
      }

      // New active player should have reset flag
      expect(state.players[1].hasPlayedLand).toBe(false);
    });
  });

  describe("Actions", () => {
    it("should validate draw card action", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      const action = {
        type: "draw_card" as const,
        playerId: state.players[0].id,
        timestamp: new Date(),
      };

      expect(adapter.validateAction(state, action)).toBe(true);
    });

    it("should reject draw card when library is empty", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);
      state.players[0].zones.library = []; // Empty library

      const action = {
        type: "draw_card" as const,
        playerId: state.players[0].id,
        timestamp: new Date(),
      };

      expect(adapter.validateAction(state, action)).toBe(false);
    });

    it("should apply draw card action", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);

      const player = state.players[0];
      const initialHandSize = player.zones.hand.length;
      const initialLibrarySize = player.zones.library.length;

      const action = {
        type: "draw_card" as const,
        playerId: player.id,
        timestamp: new Date(),
      };

      state = adapter.applyAction(state, action);

      expect(state.players[0].zones.hand.length).toBe(initialHandSize + 1);
      expect(state.players[0].zones.library.length).toBe(
        initialLibrarySize - 1,
      );
    });

    it("should validate pass priority action", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      const action = {
        type: "pass_priority" as const,
        playerId: state.players[0].id,
        timestamp: new Date(),
      };

      expect(adapter.validateAction(state, action)).toBe(true);
    });

    it("should get available actions for active player", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);

      // Move to main phase
      state.currentPhase = "precombat_main";
      state.priorityPlayerIndex = 0;

      const actions = adapter.getAvailableActions(state, state.players[0].id);

      // Should include pass priority and potentially play land/cast spells
      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some((a) => a.type === "pass_priority")).toBe(true);
    });
  });

  describe("Win Conditions", () => {
    it("should detect win by opponent losing all life", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      state.players[1].life = 0;

      const result = adapter.checkWinCondition(state);

      expect(result).not.toBeNull();
      expect(result?.winnerId).toBe(state.players[0].id);
      expect(result?.winCondition).toBe("opponent_lost_life");
    });

    it("should detect win by commander damage", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      // Set commander damage to lethal
      state.players[1].commanderDamage[state.players[0].id] = 21;

      const result = adapter.checkWinCondition(state);

      expect(result).not.toBeNull();
      expect(result?.winnerId).toBe(state.players[0].id);
      expect(result?.winCondition).toBe("commander_damage");
    });

    it("should detect win by opponent decking out", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      state.players[1].zones.library = [];

      const result = adapter.checkWinCondition(state);

      expect(result).not.toBeNull();
      expect(result?.winnerId).toBe(state.players[0].id);
      expect(result?.winCondition).toBe("opponent_decked");
    });

    it("should return null when no win condition is met", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      const result = adapter.checkWinCondition(state);

      expect(result).toBeNull();
    });
  });

  describe("Serialization", () => {
    it("should serialize and deserialize state correctly", () => {
      const config: GameConfig = { playerCount: 2 };
      const originalState = adapter.createInitialState(config);

      const serialized = adapter.serializeState(originalState);
      const deserialized = adapter.deserializeState(serialized);

      expect(deserialized.gameId).toBe(originalState.gameId);
      expect(deserialized.players.length).toBe(originalState.players.length);
      expect(deserialized.turnNumber).toBe(originalState.turnNumber);
    });
  });

  describe("State Synchronization", () => {
    it("should detect state changes", () => {
      const config: GameConfig = { playerCount: 2 };
      const oldState = adapter.createInitialState(config);
      const newState = { ...oldState, turnNumber: 2 };

      const diffs = adapter.getStateDiff(oldState, newState);

      expect(diffs.length).toBeGreaterThan(0);
    });

    it("should apply state diffs", () => {
      const config: GameConfig = { playerCount: 2 };
      const oldState = adapter.createInitialState(config);
      const newState = { ...oldState, turnNumber: 2 };

      const diffs = adapter.getStateDiff(oldState, newState);
      const applied = adapter.applyStateDiff(oldState, diffs);

      expect(applied.turnNumber).toBe(2);
    });
  });
});
