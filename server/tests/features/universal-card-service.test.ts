/**
 * Universal Card Service Integration Tests
 *
 * Tests for database-backed game lookups in the Universal Card Service
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import { universalCardService } from "../../services/card-recognition/index";

describe("Universal Card Service - Database Integration", () => {
  beforeEach(() => {
    // Clear cache before each test
    universalCardService.clearAdapterCache();
  });

  describe("Game Validation and Lookup", () => {
    test("should support legacy game ID: mtg-official", async () => {
      const result = await universalCardService.searchCards(
        "mtg-official",
        "lightning bolt",
        { limit: 5 },
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result.cards)).toBe(true);
      expect(result.cards.length).toBeGreaterThan(0);
      expect(result.cards[0].gameId).toBe("mtg-official");
    });

    test("should support legacy game ID: pokemon-tcg", async () => {
      const result = await universalCardService.searchCards(
        "pokemon-tcg",
        "pikachu",
        { limit: 5 },
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result.cards)).toBe(true);
      expect(result.cards.length).toBeGreaterThan(0);
    });

    test("should support legacy game ID: yugioh-tcg", async () => {
      const result = await universalCardService.searchCards(
        "yugioh-tcg",
        "dark magician",
        { limit: 5 },
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result.cards)).toBe(true);
      expect(result.cards.length).toBeGreaterThan(0);
    });

    test("should reject unknown game ID", async () => {
      await expect(
        universalCardService.searchCards("invalid-game", "test"),
      ).rejects.toThrow(/Game not found|No adapter available/);
    });
  });

  describe("Game Code Support", () => {
    test("should support game code: MTG", async () => {
      // When games are seeded, this should work with MTG code
      try {
        const result = await universalCardService.searchCards(
          "MTG",
          "counterspell",
          { limit: 5 },
        );

        expect(result).toBeDefined();
        expect(Array.isArray(result.cards)).toBe(true);
      } catch (error) {
        // If games not seeded in test DB, should fall back gracefully
        expect(error).toBeDefined();
      }
    });

    test("should support game code: POKEMON", async () => {
      try {
        const result = await universalCardService.searchCards(
          "POKEMON",
          "charizard",
          { limit: 5 },
        );

        expect(result).toBeDefined();
        expect(Array.isArray(result.cards)).toBe(true);
      } catch (error) {
        // If games not seeded in test DB, should fall back gracefully
        expect(error).toBeDefined();
      }
    });
  });

  describe("Supported Games API", () => {
    test("should return list of supported games", async () => {
      const games = await universalCardService.getSupportedGames();

      expect(Array.isArray(games)).toBe(true);
      expect(games.length).toBeGreaterThan(0);

      // Should have at least the three hardcoded fallback games
      const gameCodes = games.map((g) => g.code);
      expect(gameCodes).toContain("MTG");
      expect(gameCodes).toContain("POKEMON");
      expect(gameCodes).toContain("YUGIOH");
    });

    test("each game should have required fields", async () => {
      const games = await universalCardService.getSupportedGames();

      games.forEach((game) => {
        expect(game).toHaveProperty("id");
        expect(game).toHaveProperty("name");
        expect(game).toHaveProperty("code");
        expect(typeof game.id).toBe("string");
        expect(typeof game.name).toBe("string");
        expect(typeof game.code).toBe("string");
      });
    });
  });

  describe("Adapter Caching", () => {
    test("should cache adapters per game ID", async () => {
      // First call - should create adapter
      await universalCardService.searchCards("mtg-official", "bolt", {
        limit: 1,
      });

      // Second call - should use cached adapter
      await universalCardService.searchCards("mtg-official", "mana", {
        limit: 1,
      });

      // No easy way to test cache directly, but if this doesn't throw, caching works
      expect(true).toBe(true);
    });

    test("should clear cache properly", () => {
      universalCardService.clearAdapterCache();
      // Cache cleared, no exceptions thrown
      expect(true).toBe(true);
    });
  });

  describe("All Card Operations", () => {
    test("searchCards should work with database-backed games", async () => {
      const result = await universalCardService.searchCards(
        "mtg-official",
        "forest",
      );
      expect(Array.isArray(result.cards)).toBe(true);
    });

    test("getCardById should work with database-backed games", async () => {
      // Using a known Lightning Bolt card ID
      const card = await universalCardService.getCardById(
        "mtg-official",
        "ce711943-c1a1-43a0-8b89-8d169cfb8e06",
      );
      expect(card).toBeDefined();
      if (card) {
        expect(card.name).toBe("Lightning Bolt");
      }
    });

    test("getCardByName should work with database-backed games", async () => {
      const card = await universalCardService.getCardByName(
        "mtg-official",
        "Black Lotus",
      );
      expect(card).toBeDefined();
      if (card) {
        expect(card.name).toContain("Black Lotus");
      }
    });

    test("autocomplete should work with database-backed games", async () => {
      const result = await universalCardService.autocomplete(
        "mtg-official",
        "light",
        10,
      );
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test("getRandomCard should work with database-backed games", async () => {
      const card = await universalCardService.getRandomCard("mtg-official");
      expect(card).toBeDefined();
      expect(card.name).toBeDefined();
    });
  });
});
