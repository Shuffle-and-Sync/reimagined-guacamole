/**
 * Pokemon Game Adapter Tests
 *
 * Tests for Pokemon TCG game adapter implementation.
 */

import { PokemonGameAdapter } from "../../services/games/adapters/pokemon-adapter";
import type { GameConfig } from "../../../shared/game-adapter-types";

describe("PokemonGameAdapter", () => {
  let adapter: PokemonGameAdapter;

  beforeEach(() => {
    adapter = new PokemonGameAdapter();
  });

  describe("Metadata", () => {
    it("should have correct metadata", () => {
      expect(adapter.gameId).toBe("pokemon");
      expect(adapter.gameName).toBe("Pokemon Trading Card Game");
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

    it("should throw error for non-2-player games", () => {
      const config: GameConfig = { playerCount: 4 };

      expect(() => adapter.createInitialState(config)).toThrow(
        "Pokemon TCG only supports 2 players",
      );
    });

    it("should setup prizes and starting hands", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      state.players.forEach((player) => {
        expect(player.zones.hand).toHaveLength(7); // Starting hand
        expect(player.zones.prizes).toHaveLength(6); // Prize cards
        expect(player.zones.deck.length).toBeGreaterThan(0);
      });
    });

    it("should validate valid game state", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);
      // Move past setup phase
      state.currentPhase = "draw";
      state.players[0].zones.active = [
        {
          id: "pokemon-1",
          name: "Test Pokemon",
          type: "pokemon",
          hp: 60,
        },
      ];
      state.players[1].zones.active = [
        {
          id: "pokemon-2",
          name: "Test Pokemon",
          type: "pokemon",
          hp: 60,
        },
      ];

      const result = adapter.validateState(state);

      expect(result.valid).toBe(true);
    });

    it("should detect invalid player count", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);
      state.players.push({
        id: "player-3",
        name: "Player 3",
        zones: {
          deck: [],
          hand: [],
          active: [],
          bench: [],
          discard: [],
          prizes: [],
        },
        hasPlayedSupporterThisTeurn: false,
        hasAttachedEnergyThisTurn: false,
      });

      const result = adapter.validateState(state);

      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain("exactly 2 players");
    });

    it("should detect bench size violation", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);
      state.currentPhase = "main";

      // Set up active Pokemon
      state.players[0].zones.active = [
        {
          id: "active-pokemon",
          name: "Active Pokemon",
          type: "pokemon",
          hp: 60,
        },
      ];

      // Add too many Pokemon to bench
      for (let i = 0; i < 7; i++) {
        state.players[0].zones.bench.push({
          id: `pokemon-${i}`,
          name: "Pokemon",
          type: "pokemon",
          hp: 60,
        });
      }

      const result = adapter.validateState(state);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(
        result.errors!.some((e) => e.includes("too many benched Pokemon")),
      ).toBe(true);
    });
  });

  describe("Game Phases", () => {
    it("should return correct Pokemon phases", () => {
      const phases = adapter.getGamePhases();

      expect(phases).toHaveLength(4);
      expect(phases[0].id).toBe("setup");
      expect(phases[1].id).toBe("draw");
      expect(phases[2].id).toBe("main");
      expect(phases[3].id).toBe("attack");
    });

    it("should advance through phases correctly", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);
      state.currentPhase = "draw";

      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("main");

      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("attack");

      // Should end turn and go to next player's draw phase
      state = adapter.advancePhase(state);
      expect(state.currentPhase).toBe("draw");
      expect(state.activePlayerIndex).toBe(1);
      expect(state.turnNumber).toBe(2);
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

    it("should reject draw card when deck is empty", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);
      state.players[0].zones.deck = []; // Empty deck

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

    it("should validate end turn action", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      const action = {
        type: "end_turn" as const,
        playerId: state.players[0].id,
        timestamp: new Date(),
      };

      expect(adapter.validateAction(state, action)).toBe(true);
    });

    it("should reject action from non-active player", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);
      state.activePlayerIndex = 0;

      const action = {
        type: "draw_card" as const,
        playerId: state.players[1].id, // Player 1, but player 0 is active
        timestamp: new Date(),
      };

      expect(adapter.validateAction(state, action)).toBe(false);
    });

    it("should get available actions for active player", () => {
      const config: GameConfig = { playerCount: 2 };
      let state = adapter.createInitialState(config);
      state.currentPhase = "main";

      const actions = adapter.getAvailableActions(state, state.players[0].id);

      // Should always include end turn
      expect(actions.some((a) => a.type === "end_turn")).toBe(true);
    });
  });

  describe("Win Conditions", () => {
    it("should detect win by taking all prizes", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      // Set up active Pokemon for both players
      state.players[0].zones.active = [
        {
          id: "active-1",
          name: "Active Pokemon",
          type: "pokemon",
          hp: 60,
        },
      ];
      state.players[1].zones.active = [
        {
          id: "active-2",
          name: "Active Pokemon",
          type: "pokemon",
          hp: 60,
        },
      ];

      state.players[1].zones.prizes = []; // Opponent has no prizes

      const result = adapter.checkWinCondition(state);

      expect(result).not.toBeNull();
      expect(result?.winnerId).toBe(state.players[0].id);
      expect(result?.winCondition).toBe("all_prizes_taken");
    });

    it("should detect win by opponent having no Pokemon", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      state.players[1].zones.active = [];
      state.players[1].zones.bench = [];

      const result = adapter.checkWinCondition(state);

      expect(result).not.toBeNull();
      expect(result?.winnerId).toBe(state.players[0].id);
      expect(result?.winCondition).toBe("opponent_no_pokemon");
    });

    it("should detect win by opponent deck out", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      // Set up active Pokemon for both players
      state.players[0].zones.active = [
        {
          id: "active-1",
          name: "Active Pokemon",
          type: "pokemon",
          hp: 60,
        },
      ];
      state.players[1].zones.active = [
        {
          id: "active-2",
          name: "Active Pokemon",
          type: "pokemon",
          hp: 60,
        },
      ];

      // Empty opponent's deck
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

      // Set up active Pokemon for both players
      state.players[0].zones.active = [
        {
          id: "active-1",
          name: "Active Pokemon",
          type: "pokemon",
          hp: 60,
        },
      ];
      state.players[1].zones.active = [
        {
          id: "active-2",
          name: "Active Pokemon",
          type: "pokemon",
          hp: 60,
        },
      ];

      state.currentPhase = "main";

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
});
