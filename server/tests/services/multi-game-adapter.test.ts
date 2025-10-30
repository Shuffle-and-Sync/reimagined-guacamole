/**
 * Tests for Multi-Game Adapter System
 *
 * Tests adapter registration, retrieval, and game-specific functionality
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import { isGameAdapter } from "../../../shared/game-adapters/base-game-adapter";
import { MTGAdapter } from "../../../shared/game-adapters/mtg-adapter";
import { PokemonAdapter } from "../../../shared/game-adapters/pokemon-adapter";
import { GameAdapterRegistry } from "../../../shared/game-adapters/registry";

describe("Multi-Game Adapter System", () => {
  beforeEach(() => {
    // Clear registry before each test
    GameAdapterRegistry.clear();
  });

  describe("GameAdapterRegistry", () => {
    test("should register MTG adapter", () => {
      const mtgAdapter = new MTGAdapter();
      GameAdapterRegistry.register(mtgAdapter);

      expect(GameAdapterRegistry.count()).toBe(1);
      expect(GameAdapterRegistry.isSupported("mtg")).toBe(true);
    });

    test("should register Pokemon adapter", () => {
      const pokemonAdapter = new PokemonAdapter();
      GameAdapterRegistry.register(pokemonAdapter);

      expect(GameAdapterRegistry.count()).toBe(1);
      expect(GameAdapterRegistry.isSupported("pokemon")).toBe(true);
    });

    test("should register multiple adapters", () => {
      GameAdapterRegistry.register(new MTGAdapter());
      GameAdapterRegistry.register(new PokemonAdapter());

      expect(GameAdapterRegistry.count()).toBe(2);
      expect(GameAdapterRegistry.isSupported("mtg")).toBe(true);
      expect(GameAdapterRegistry.isSupported("pokemon")).toBe(true);
    });

    test("should retrieve MTG adapter", () => {
      GameAdapterRegistry.register(new MTGAdapter());
      const adapter = GameAdapterRegistry.get("mtg");

      expect(adapter).toBeDefined();
      expect(adapter?.gameType).toBe("mtg");
      expect(adapter?.gameName).toBe("Magic: The Gathering");
    });

    test("should return null for unregistered game type", () => {
      const adapter = GameAdapterRegistry.get("yugioh");
      expect(adapter).toBeNull();
    });

    test("should get all supported games", () => {
      GameAdapterRegistry.register(new MTGAdapter());
      GameAdapterRegistry.register(new PokemonAdapter());

      const games = GameAdapterRegistry.getSupportedGames();

      expect(games).toHaveLength(2);
      expect(games.map((g) => g.type)).toContain("mtg");
      expect(games.map((g) => g.type)).toContain("pokemon");
    });

    test("should unregister adapter", () => {
      GameAdapterRegistry.register(new MTGAdapter());
      expect(GameAdapterRegistry.isSupported("mtg")).toBe(true);

      const removed = GameAdapterRegistry.unregister("mtg");

      expect(removed).toBe(true);
      expect(GameAdapterRegistry.isSupported("mtg")).toBe(false);
    });

    test("should clear all adapters", () => {
      GameAdapterRegistry.register(new MTGAdapter());
      GameAdapterRegistry.register(new PokemonAdapter());
      expect(GameAdapterRegistry.count()).toBe(2);

      GameAdapterRegistry.clear();

      expect(GameAdapterRegistry.count()).toBe(0);
    });
  });

  describe("MTGAdapter", () => {
    let adapter: MTGAdapter;

    beforeEach(() => {
      adapter = new MTGAdapter();
    });

    test("should create initial MTG state", () => {
      const config = {
        maxPlayers: 2,
        players: [
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
        ],
      };

      const state = adapter.createInitialState(config);

      expect(state.gameType).toBe("tcg");
      expect(state.players).toHaveLength(2);
      expect(state.players[0].lifeTotal).toBe(20);
      expect(state.players[0].library.count).toBe(60);
      expect(state.currentTurn.phase).toBe("untap");
    });

    test("should validate correct MTG state", () => {
      const config = {
        maxPlayers: 2,
        players: [
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
        ],
      };

      const state = adapter.createInitialState(config);
      const result = adapter.validateState(state);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should detect invalid state with too few players", () => {
      const config = {
        maxPlayers: 1,
        players: [{ id: "p1", name: "Alice" }],
      };

      const state = adapter.createInitialState(config);
      const result = adapter.validateState(state);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("should detect game over when life reaches 0", () => {
      const config = {
        maxPlayers: 2,
        players: [
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
        ],
      };

      const state = adapter.createInitialState(config);
      state.players[0].lifeTotal = 0;

      expect(adapter.isGameOver(state)).toBe(true);
    });

    test("should detect game over with poison counters", () => {
      const config = {
        maxPlayers: 2,
        players: [
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
        ],
      };

      const state = adapter.createInitialState(config);
      state.players[0].poisonCounters = 10;

      expect(adapter.isGameOver(state)).toBe(true);
    });

    test("should get winner correctly", () => {
      const config = {
        maxPlayers: 2,
        players: [
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
        ],
      };

      const state = adapter.createInitialState(config);
      state.players[1].lifeTotal = 0;

      expect(adapter.isGameOver(state)).toBe(true);
      expect(adapter.getWinner(state)).toBe("p1");
    });

    test("should get legal actions for active player", () => {
      const config = {
        maxPlayers: 2,
        players: [
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
        ],
      };

      const state = adapter.createInitialState(config);
      state.currentTurn.phase = "draw";

      const actions = adapter.getLegalActions(state, "p1");

      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some((a) => a.type === "draw")).toBe(true);
      expect(actions.some((a) => a.type === "concede")).toBe(true);
    });

    test("should render state with public and private information", () => {
      const config = {
        maxPlayers: 2,
        players: [
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
        ],
      };

      const state = adapter.createInitialState(config);
      const view = adapter.renderState(state);

      expect(view.publicState).toBeDefined();
      expect(view.playerStates.size).toBe(2);
      expect(view.playerStates.has("p1")).toBe(true);
      expect(view.playerStates.has("p2")).toBe(true);
    });

    test("should get player actions for UI", () => {
      const config = {
        maxPlayers: 2,
        players: [
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
        ],
      };

      const state = adapter.createInitialState(config);
      state.currentTurn.phase = "draw";

      const playerActions = adapter.getPlayerActions(state, "p1");

      expect(playerActions.length).toBeGreaterThan(0);
      expect(playerActions.every((a) => a.label)).toBe(true);
      expect(playerActions.every((a) => a.icon)).toBe(true);
    });
  });

  describe("PokemonAdapter", () => {
    let adapter: PokemonAdapter;

    beforeEach(() => {
      adapter = new PokemonAdapter();
    });

    test("should create initial Pokemon state", () => {
      const config = {
        maxPlayers: 2,
        players: [
          { id: "p1", name: "Ash" },
          { id: "p2", name: "Gary" },
        ],
      };

      const state = adapter.createInitialState(config);

      expect(state.gameType).toBe("pokemon");
      expect(state.players).toHaveLength(2);
      expect(state.players[0].prizeCards).toBe(6);
      expect(state.players[0].deck.count).toBe(60);
      expect(state.currentTurn.phase).toBe("setup");
    });

    test("should validate Pokemon state requires exactly 2 players", () => {
      const config = {
        maxPlayers: 2,
        players: [
          { id: "p1", name: "Ash" },
          { id: "p2", name: "Gary" },
        ],
      };

      const state = adapter.createInitialState(config);
      const result = adapter.validateState(state);

      expect(result.valid).toBe(true);
    });

    test("should detect game over when prize cards reach 0", () => {
      const config = {
        maxPlayers: 2,
        players: [
          { id: "p1", name: "Ash" },
          { id: "p2", name: "Gary" },
        ],
      };

      const state = adapter.createInitialState(config);
      state.players[0].prizeCards = 0;

      expect(adapter.isGameOver(state)).toBe(true);
    });

    test("should detect game over when player has no Pokemon", () => {
      const config = {
        maxPlayers: 2,
        players: [
          { id: "p1", name: "Ash" },
          { id: "p2", name: "Gary" },
        ],
      };

      const state = adapter.createInitialState(config);
      state.players[0].activePokemon = null;
      state.players[0].bench = [];

      expect(adapter.isGameOver(state)).toBe(true);
    });

    test("should get winner when opponent has no prize cards", () => {
      const config = {
        maxPlayers: 2,
        players: [
          { id: "p1", name: "Ash" },
          { id: "p2", name: "Gary" },
        ],
      };

      const state = adapter.createInitialState(config);
      state.players[1].prizeCards = 0;

      expect(adapter.isGameOver(state)).toBe(true);
      expect(adapter.getWinner(state)).toBe("p1");
    });
  });

  describe("Type Guards", () => {
    test("should identify valid game adapter", () => {
      const adapter = new MTGAdapter();
      expect(isGameAdapter(adapter)).toBe(true);
    });

    test("should reject non-adapter object", () => {
      const notAdapter = { gameType: "test" };
      expect(isGameAdapter(notAdapter)).toBe(false);
    });

    test("should reject null", () => {
      expect(isGameAdapter(null)).toBe(false);
    });

    test("should reject undefined", () => {
      expect(isGameAdapter(undefined)).toBe(false);
    });
  });
});
