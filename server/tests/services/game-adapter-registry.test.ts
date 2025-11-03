/**
 * Game Adapter Registry Tests
 *
 * Tests for the game adapter registry and factory functions.
 */

import { BaseGameAdapter } from "../../services/games/adapters/base-game-adapter";
import {
  GameAdapterRegistry,
  gameAdapterRegistry,
  createGameAdapter,
  getAvailableGames,
  isGameSupported,
} from "../../services/games/adapters/game-adapter-registry";
import type {
  IGameAdapter,
  GameConfig,
  ValidationResult,
  WinResult,
  Phase,
} from "../../../shared/game-adapter-types";

// Mock adapter for testing
class TestGameAdapter extends BaseGameAdapter<
  { test: string },
  { action: string }
> {
  readonly gameId = "test";
  readonly gameName = "Test Game";
  readonly version = "1.0.0";

  createInitialState(config: GameConfig): { test: string } {
    return { test: "initial" };
  }

  validateState(_state: { test: string }): ValidationResult {
    return { valid: true };
  }

  validateAction(
    _state: { test: string },
    _action: { action: string },
  ): boolean {
    return true;
  }

  applyAction(
    state: { test: string },
    _action: { action: string },
  ): { test: string } {
    return state;
  }

  getAvailableActions(
    _state: { test: string },
    playerId: string,
  ): Array<{ action: string }> {
    return [];
  }

  checkWinCondition(_state: { test: string }): WinResult | null {
    return null;
  }

  getGamePhases(): Phase[] {
    return [];
  }

  advancePhase(state: { test: string }): { test: string } {
    return state;
  }
}

describe("GameAdapterRegistry", () => {
  let registry: GameAdapterRegistry;

  beforeEach(() => {
    registry = new GameAdapterRegistry();
  });

  describe("Default Adapters", () => {
    it("should register MTG adapter by default", () => {
      expect(registry.has("mtg")).toBe(true);
    });

    it("should register Pokemon adapter by default", () => {
      expect(registry.has("pokemon")).toBe(true);
    });

    it("should register Yu-Gi-Oh adapter by default", () => {
      expect(registry.has("yugioh")).toBe(true);
    });

    it("should get MTG adapter", () => {
      const adapter = registry.get("mtg");

      expect(adapter).toBeDefined();
      expect(adapter?.gameId).toBe("mtg");
      expect(adapter?.gameName).toBe("Magic: The Gathering");
    });

    it("should get Pokemon adapter", () => {
      const adapter = registry.get("pokemon");

      expect(adapter).toBeDefined();
      expect(adapter?.gameId).toBe("pokemon");
      expect(adapter?.gameName).toBe("Pokemon Trading Card Game");
    });

    it("should get Yu-Gi-Oh adapter", () => {
      const adapter = registry.get("yugioh");

      expect(adapter).toBeDefined();
      expect(adapter?.gameId).toBe("yugioh");
      expect(adapter?.gameName).toBe("Yu-Gi-Oh Trading Card Game");
    });
  });

  describe("Registration", () => {
    it("should register a new adapter", () => {
      registry.register("test", () => new TestGameAdapter());

      expect(registry.has("test")).toBe(true);
    });

    it("should get registered adapter", () => {
      registry.register("test", () => new TestGameAdapter());
      const adapter = registry.get("test");

      expect(adapter).toBeDefined();
      expect(adapter?.gameId).toBe("test");
      expect(adapter?.gameName).toBe("Test Game");
    });

    it("should be case-insensitive", () => {
      registry.register("TEST", () => new TestGameAdapter());

      expect(registry.has("test")).toBe(true);
      expect(registry.has("TEST")).toBe(true);
      expect(registry.has("Test")).toBe(true);
    });

    it("should create new instance each time", () => {
      registry.register("test", () => new TestGameAdapter());

      const adapter1 = registry.get("test");
      const adapter2 = registry.get("test");

      expect(adapter1).not.toBe(adapter2); // Different instances
      expect(adapter1?.gameId).toBe(adapter2?.gameId);
    });
  });

  describe("Unregistration", () => {
    it("should unregister an adapter", () => {
      registry.register("test", () => new TestGameAdapter());
      expect(registry.has("test")).toBe(true);

      const result = registry.unregister("test");

      expect(result).toBe(true);
      expect(registry.has("test")).toBe(false);
    });

    it("should return false when unregistering non-existent adapter", () => {
      const result = registry.unregister("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("Query Methods", () => {
    it("should return all registered game IDs", () => {
      const games = registry.getRegisteredGames();

      expect(games).toContain("mtg");
      expect(games).toContain("pokemon");
      expect(games).toContain("yugioh");
      expect(games.length).toBeGreaterThanOrEqual(3);
    });

    it("should return game metadata", () => {
      const metadata = registry.getGameMetadata();

      expect(metadata.length).toBeGreaterThanOrEqual(3);

      const mtg = metadata.find((m) => m.gameId === "mtg");
      expect(mtg).toBeDefined();
      expect(mtg?.gameName).toBe("Magic: The Gathering");

      const pokemon = metadata.find((m) => m.gameId === "pokemon");
      expect(pokemon).toBeDefined();
      expect(pokemon?.gameName).toBe("Pokemon Trading Card Game");

      const yugioh = metadata.find((m) => m.gameId === "yugioh");
      expect(yugioh).toBeDefined();
      expect(yugioh?.gameName).toBe("Yu-Gi-Oh Trading Card Game");
    });

    it("should check if game is supported", () => {
      expect(registry.has("mtg")).toBe(true);
      expect(registry.has("pokemon")).toBe(true);
      expect(registry.has("yugioh")).toBe(true);
      expect(registry.has("nonexistent")).toBe(false);
    });

    it("should return undefined for non-existent adapter", () => {
      const adapter = registry.get("nonexistent");

      expect(adapter).toBeUndefined();
    });
  });

  describe("Clear", () => {
    it("should clear all adapters", () => {
      expect(registry.getRegisteredGames().length).toBeGreaterThan(0);

      registry.clear();

      expect(registry.getRegisteredGames().length).toBe(0);
      expect(registry.has("mtg")).toBe(false);
      expect(registry.has("pokemon")).toBe(false);
      expect(registry.has("yugioh")).toBe(false);
    });
  });
});

describe("Factory Functions", () => {
  describe("createGameAdapter", () => {
    it("should create MTG adapter", () => {
      const adapter = createGameAdapter("mtg");

      expect(adapter).toBeDefined();
      expect(adapter.gameId).toBe("mtg");
    });

    it("should create Pokemon adapter", () => {
      const adapter = createGameAdapter("pokemon");

      expect(adapter).toBeDefined();
      expect(adapter.gameId).toBe("pokemon");
    });

    it("should create Yu-Gi-Oh adapter", () => {
      const adapter = createGameAdapter("yugioh");

      expect(adapter).toBeDefined();
      expect(adapter.gameId).toBe("yugioh");
    });

    it("should be case-insensitive", () => {
      const adapter1 = createGameAdapter("MTG");
      const adapter2 = createGameAdapter("mtg");
      const adapter3 = createGameAdapter("MtG");

      expect(adapter1.gameId).toBe("mtg");
      expect(adapter2.gameId).toBe("mtg");
      expect(adapter3.gameId).toBe("mtg");
    });

    it("should throw error for non-existent game", () => {
      expect(() => createGameAdapter("nonexistent")).toThrow(
        /Game adapter not found/,
      );
    });

    it("should include available games in error message", () => {
      try {
        createGameAdapter("nonexistent");
        fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("Available games:");
        expect(error.message).toContain("mtg");
        expect(error.message).toContain("pokemon");
      }
    });
  });

  describe("getAvailableGames", () => {
    it("should return available games metadata", () => {
      const games = getAvailableGames();

      expect(games.length).toBeGreaterThanOrEqual(3);
      expect(games.some((g) => g.gameId === "mtg")).toBe(true);
      expect(games.some((g) => g.gameId === "pokemon")).toBe(true);
      expect(games.some((g) => g.gameId === "yugioh")).toBe(true);
    });

    it("should include game name and version", () => {
      const games = getAvailableGames();
      const mtg = games.find((g) => g.gameId === "mtg");

      expect(mtg).toBeDefined();
      expect(mtg?.gameName).toBe("Magic: The Gathering");
      expect(mtg?.version).toBeTruthy();
    });
  });

  describe("isGameSupported", () => {
    it("should return true for supported games", () => {
      expect(isGameSupported("mtg")).toBe(true);
      expect(isGameSupported("pokemon")).toBe(true);
      expect(isGameSupported("yugioh")).toBe(true);
    });

    it("should return false for unsupported games", () => {
      expect(isGameSupported("nonexistent")).toBe(false);
      expect(isGameSupported("hearthstone")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isGameSupported("MTG")).toBe(true);
      expect(isGameSupported("MtG")).toBe(true);
      expect(isGameSupported("POKEMON")).toBe(true);
    });
  });
});

describe("Singleton Instance", () => {
  it("should provide a global singleton registry", () => {
    expect(gameAdapterRegistry).toBeDefined();
    expect(gameAdapterRegistry).toBeInstanceOf(GameAdapterRegistry);
  });

  it("should have default adapters registered", () => {
    expect(gameAdapterRegistry.has("mtg")).toBe(true);
    expect(gameAdapterRegistry.has("pokemon")).toBe(true);
    expect(gameAdapterRegistry.has("yugioh")).toBe(true);
  });
});
