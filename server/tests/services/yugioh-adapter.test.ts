/**
 * Yu-Gi-Oh Game Adapter Tests
 *
 * Tests for Yu-Gi-Oh Trading Card Game adapter implementation.
 */

import { YuGiOhGameAdapter } from "../../services/games/adapters/yugioh-adapter";
import type { GameConfig } from "../../../shared/game-adapter-types";

describe("YuGiOhGameAdapter", () => {
  let adapter: YuGiOhGameAdapter;

  beforeEach(() => {
    adapter = new YuGiOhGameAdapter();
  });

  describe("Metadata", () => {
    it("should have correct metadata", () => {
      expect(adapter.gameId).toBe("yugioh");
      expect(adapter.gameName).toBe("Yu-Gi-Oh Trading Card Game");
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

    it("should initialize players with 8000 life points", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      state.players.forEach((player) => {
        expect(player.lifePoints).toBe(8000);
        expect(player.zones.hand).toHaveLength(5); // Starting hand
        expect(player.zones.deck.length).toBeGreaterThan(0);
      });
    });

    it("should respect custom starting life points", () => {
      const config: GameConfig = {
        playerCount: 2,
        startingResources: { lifePoints: 4000 },
      };
      const state = adapter.createInitialState(config);

      state.players.forEach((player) => {
        expect(player.lifePoints).toBe(4000);
      });
    });

    it("should throw error for invalid player count", () => {
      const config: GameConfig = { playerCount: 4 };

      expect(() => adapter.createInitialState(config)).toThrow(
        "Yu-Gi-Oh TCG only supports 2 players",
      );
    });

    it("should validate valid game state", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      const result = adapter.validateState(state);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should detect invalid player count", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);
      state.players = []; // Remove all players

      const result = adapter.validateState(state);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain("must have exactly 2 players");
    });

    it("should detect negative life points", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);
      state.players[0].lifePoints = -100;

      const result = adapter.validateState(state);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain("negative life points");
    });

    it("should detect too many monsters in zone", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      // Add 6 monsters (exceeds limit of 5)
      for (let i = 0; i < 6; i++) {
        state.players[0].zones.monster_zones.push({
          id: `monster-${i}`,
          name: `Monster ${i}`,
          type: "Monster",
          atk: 1800,
          def: 1200,
        });
      }

      const result = adapter.validateState(state);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain("too many monsters");
    });

    it("should detect too many spell/trap cards", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      // Add 6 spell/trap cards (exceeds limit of 5)
      for (let i = 0; i < 6; i++) {
        state.players[0].zones.spell_trap_zones.push({
          id: `spell-${i}`,
          name: `Spell ${i}`,
          type: "Spell",
        });
      }

      const result = adapter.validateState(state);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain("too many spell/trap");
    });

    it("should detect multiple field spells", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      // Add 2 field spells (exceeds limit of 1)
      state.players[0].zones.field_zone.push({
        id: "field-1",
        name: "Field 1",
        type: "Spell",
      });
      state.players[0].zones.field_zone.push({
        id: "field-2",
        name: "Field 2",
        type: "Spell",
      });

      const result = adapter.validateState(state);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain("multiple field spells");
    });
  });

  describe("Game Phases", () => {
    it("should return correct Yu-Gi-Oh phases", () => {
      const phases = adapter.getGamePhases();

      expect(phases).toHaveLength(6);
      expect(phases[0].id).toBe("draw");
      expect(phases[1].id).toBe("standby");
      expect(phases[2].id).toBe("main1");
      expect(phases[3].id).toBe("battle");
      expect(phases[4].id).toBe("main2");
      expect(phases[5].id).toBe("end");
    });

    it("should advance through phases correctly", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);

      expect(state.currentPhase).toBe("draw");
      expect(state.turnNumber).toBe(1);

      // Advance through phases
      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("standby");

      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("main1");

      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("battle");

      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("main2");

      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("end");

      // Should wrap to next turn
      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("draw");
      expect(state.turnNumber).toBe(2);
      expect(state.activePlayerIndex).toBe(1);
    });

    it("should reset per-turn flags on new turn", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);

      // Use normal summon
      state.players[0].normalSummonUsed = true;

      // Advance to next turn
      for (let i = 0; i < 6; i++) {
        state = adapter.advancePhase(state);
      }

      // New active player should have reset flag
      expect(state.players[1].normalSummonUsed).toBe(false);
    });
  });

  describe("Actions", () => {
    it("should validate draw card action in draw phase", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      const action = {
        type: "draw_card" as const,
        playerId: state.players[0].id,
        timestamp: new Date(),
      };

      expect(adapter.validateAction(state, action)).toBe(true);
    });

    it("should reject draw card when not in draw phase", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);
      state.currentPhase = "main1";

      const action = {
        type: "draw_card" as const,
        playerId: state.players[0].id,
        timestamp: new Date(),
      };

      expect(adapter.validateAction(state, action)).toBe(false);
    });

    it("should reject draw card when deck is empty", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);
      state.players[0].zones.deck = [];

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
      const initialDeckSize = player.zones.deck.length;

      const action = {
        type: "draw_card" as const,
        playerId: player.id,
        timestamp: new Date(),
      };

      state = adapter.applyAction(state, action);

      expect(state.players[0].zones.hand.length).toBe(initialHandSize + 1);
      expect(state.players[0].zones.deck.length).toBe(initialDeckSize - 1);
    });

    it("should get available actions for active player", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);

      // Move to main phase
      state.currentPhase = "main1";

      const actions = adapter.getAvailableActions(state, state.players[0].id);

      // Should include end turn and potentially normal summon
      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some((a) => a.type === "end_turn")).toBe(true);
    });

    it("should return no actions for non-active player", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      const actions = adapter.getAvailableActions(state, state.players[1].id);

      expect(actions).toHaveLength(0);
    });
  });

  describe("Normal Summon", () => {
    it("should allow normal summon in main phase", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);
      state.currentPhase = "main1";

      // Add a monster to hand
      const monster = {
        id: "test-monster",
        name: "Test Monster",
        type: "Monster" as const,
        level: 4,
        atk: 1800,
        def: 1200,
      };
      state.players[0].zones.hand.push(monster);

      const action = {
        type: "normal_summon" as const,
        playerId: state.players[0].id,
        cardId: monster.id,
        timestamp: new Date(),
      };

      expect(adapter.validateAction(state, action)).toBe(true);
    });

    it("should apply normal summon correctly", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);
      state.currentPhase = "main1";

      const monster = {
        id: "test-monster",
        name: "Test Monster",
        type: "Monster" as const,
        level: 4,
        atk: 1800,
        def: 1200,
      };
      state.players[0].zones.hand.push(monster);

      const action = {
        type: "normal_summon" as const,
        playerId: state.players[0].id,
        cardId: monster.id,
        timestamp: new Date(),
      };

      state = adapter.applyAction(state, action);

      expect(state.players[0].zones.monster_zones.length).toBe(1);
      expect(state.players[0].zones.monster_zones[0].id).toBe(monster.id);
      expect(state.players[0].zones.monster_zones[0].position).toBe(
        "face-up-attack",
      );
      expect(state.players[0].normalSummonUsed).toBe(true);
    });

    it("should reject second normal summon in same turn", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);
      state.currentPhase = "main1";
      state.players[0].normalSummonUsed = true;

      const monster = {
        id: "test-monster",
        name: "Test Monster",
        type: "Monster" as const,
        level: 4,
        atk: 1800,
        def: 1200,
      };
      state.players[0].zones.hand.push(monster);

      const action = {
        type: "normal_summon" as const,
        playerId: state.players[0].id,
        cardId: monster.id,
        timestamp: new Date(),
      };

      expect(adapter.validateAction(state, action)).toBe(false);
    });
  });

  describe("Set Cards", () => {
    it("should allow setting a monster", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);
      state.currentPhase = "main1";

      const monster = {
        id: "test-monster",
        name: "Test Monster",
        type: "Monster" as const,
        level: 4,
        atk: 1800,
        def: 1200,
      };
      state.players[0].zones.hand.push(monster);

      const action = {
        type: "set_monster" as const,
        playerId: state.players[0].id,
        cardId: monster.id,
        timestamp: new Date(),
      };

      state = adapter.applyAction(state, action);

      expect(state.players[0].zones.monster_zones.length).toBe(1);
      expect(state.players[0].zones.monster_zones[0].position).toBe(
        "face-down-defense",
      );
    });

    it("should allow setting spell/trap cards", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);
      state.currentPhase = "main1";

      const spell = {
        id: "test-spell",
        name: "Test Spell",
        type: "Spell" as const,
      };
      state.players[0].zones.hand.push(spell);

      const action = {
        type: "set_spell_trap" as const,
        playerId: state.players[0].id,
        cardId: spell.id,
        timestamp: new Date(),
      };

      state = adapter.applyAction(state, action);

      expect(state.players[0].zones.spell_trap_zones.length).toBe(1);
      expect(state.players[0].zones.spell_trap_zones[0].id).toBe(spell.id);
    });
  });

  describe("Win Conditions", () => {
    it("should detect win when opponent life points reach 0", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      state.players[1].lifePoints = 0;

      const result = adapter.checkWinCondition(state);

      expect(result).not.toBeNull();
      expect(result?.winnerId).toBe(state.players[0].id);
      expect(result?.winCondition).toBe("opponent_life_points_zero");
    });

    it("should detect win when opponent decks out", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      state.players[1].zones.deck = [];
      state.currentPhase = "draw";

      const result = adapter.checkWinCondition(state);

      expect(result).not.toBeNull();
      expect(result?.winnerId).toBe(state.players[0].id);
      expect(result?.winCondition).toBe("opponent_deck_out");
    });

    it("should return null when no win condition is met", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      const result = adapter.checkWinCondition(state);

      expect(result).toBeNull();
    });
  });

  describe("Battle Phase", () => {
    it("should allow attacks in battle phase", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);
      state.currentPhase = "battle";

      // Add attacking monster
      const monster = {
        id: "attacker",
        name: "Attacker",
        type: "Monster" as const,
        atk: 2000,
        def: 1000,
        position: "face-up-attack" as const,
      };
      state.players[0].zones.monster_zones.push(monster);

      const action = {
        type: "declare_attack" as const,
        playerId: state.players[0].id,
        cardId: monster.id,
        timestamp: new Date(),
      };

      expect(adapter.validateAction(state, action)).toBe(true);
    });

    it("should apply direct attack damage", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);
      state.currentPhase = "battle";

      const monster = {
        id: "attacker",
        name: "Attacker",
        type: "Monster" as const,
        atk: 2000,
        def: 1000,
        position: "face-up-attack" as const,
      };
      state.players[0].zones.monster_zones.push(monster);

      const initialLife = state.players[1].lifePoints;

      const action = {
        type: "declare_attack" as const,
        playerId: state.players[0].id,
        cardId: monster.id,
        timestamp: new Date(),
      };

      state = adapter.applyAction(state, action);

      expect(state.players[1].lifePoints).toBe(initialLife - 2000);
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
