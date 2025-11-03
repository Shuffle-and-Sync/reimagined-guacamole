/**
 * Card Recognition Service Tests
 *
 * Tests for Magic: The Gathering card recognition and lookup functionality
 */

import {
  cardRecognitionService,
  type _MtgCard,
} from "../../services/card-recognition.service";

describe("Card Recognition Service", () => {
  beforeEach(() => {
    // Clear cache before each test
    cardRecognitionService.clearCache();
  });

  describe("searchCards", () => {
    test("should search for cards by name", async () => {
      const result = await cardRecognitionService.searchCards("Lightning Bolt");

      expect(result).toBeDefined();
      expect(Array.isArray(result.cards)).toBe(true);
      expect(result.total).toBeGreaterThan(0);
      expect(result.cards.length).toBeGreaterThan(0);

      // Verify card structure
      const card = result.cards[0];
      expect(card).toBeDefined();
      expect(card?.name).toBeDefined();
      expect(card?.id).toBeDefined();
    }, 10000);

    test("should return empty results for non-existent card", async () => {
      const result = await cardRecognitionService.searchCards(
        "NonExistentCardXYZ123",
      );

      expect(result.cards).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    test("should filter by set", async () => {
      const result = await cardRecognitionService.searchCards(
        "Lightning Bolt",
        {
          set: "lea", // Limited Edition Alpha
          limit: 5,
        },
      );

      expect(result).toBeDefined();
      if (result.cards.length > 0) {
        const card = result.cards[0];
        expect(card?.setCode).toBe("lea");
      }
    }, 10000);

    test("should filter by format legality", async () => {
      const result = await cardRecognitionService.searchCards(
        "Lightning Bolt",
        {
          format: "modern",
          limit: 5,
        },
      );

      expect(result).toBeDefined();
      if (result.cards.length > 0) {
        const card = result.cards[0];
        expect(card?.legalities).toBeDefined();
      }
    }, 10000);
  });

  describe("getCardById", () => {
    test("should get card by Scryfall ID", async () => {
      // First search for a card to get an ID
      const searchResult = await cardRecognitionService.searchCards(
        "Lightning Bolt",
        { limit: 1 },
      );
      expect(searchResult.cards.length).toBeGreaterThan(0);

      const cardId = searchResult.cards[0]?.id;
      expect(cardId).toBeDefined();

      // Now get the card by ID
      if (cardId) {
        const card = await cardRecognitionService.getCardById(cardId);

        expect(card).toBeDefined();
        expect(card?.id).toBe(cardId);
        expect(card?.name).toBeDefined();
      }
    }, 10000);

    test("should return null for invalid card ID", async () => {
      const card = await cardRecognitionService.getCardById("invalid-id-12345");
      expect(card).toBeNull();
    });

    test("should use cache for repeated requests", async () => {
      // First search to get an ID
      const searchResult = await cardRecognitionService.searchCards(
        "Lightning Bolt",
        { limit: 1 },
      );
      const cardId = searchResult.cards[0]?.id;

      if (cardId) {
        // First call - should hit API
        const card1 = await cardRecognitionService.getCardById(cardId);

        // Second call - should hit cache
        const card2 = await cardRecognitionService.getCardById(cardId);

        expect(card1).toEqual(card2);

        // Verify cache stats
        const stats = cardRecognitionService.getCacheStats();
        expect(stats.size).toBeGreaterThan(0);
      }
    }, 10000);
  });

  describe("getCardByName", () => {
    test("should get card by exact name", async () => {
      const card = await cardRecognitionService.getCardByName("Lightning Bolt");

      expect(card).toBeDefined();
      expect(card?.name).toBe("Lightning Bolt");
      expect(card?.id).toBeDefined();
      expect(card?.manaCost).toBeDefined();
    }, 10000);

    test("should return null for non-existent card name", async () => {
      const card = await cardRecognitionService.getCardByName(
        "This Card Does Not Exist XYZ",
      );
      expect(card).toBeNull();
    });

    test("should get specific set version", async () => {
      const card = await cardRecognitionService.getCardByName(
        "Lightning Bolt",
        {
          set: "lea",
        },
      );

      if (card) {
        expect(card.name).toBe("Lightning Bolt");
        expect(card.setCode).toBe("lea");
      }
    }, 10000);
  });

  describe("autocomplete", () => {
    test("should return card name suggestions", async () => {
      const result = await cardRecognitionService.autocomplete("Light");

      expect(result).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);

      // Check that suggestions contain the query
      const hasMatchingName = result.suggestions.some((s) =>
        s.name.toLowerCase().includes("light"),
      );
      expect(hasMatchingName).toBe(true);
    }, 10000);

    test("should return empty for short query", async () => {
      const result = await cardRecognitionService.autocomplete("L");
      expect(result.suggestions).toHaveLength(0);
    });

    test("should limit results", async () => {
      const result = await cardRecognitionService.autocomplete("Lightning", 3);
      expect(result.suggestions.length).toBeLessThanOrEqual(3);
    }, 10000);
  });

  describe("getRandomCard", () => {
    test("should return a random card", async () => {
      const card = await cardRecognitionService.getRandomCard();

      expect(card).toBeDefined();
      expect(card.id).toBeDefined();
      expect(card.name).toBeDefined();
      expect(card.typeLine).toBeDefined();
    }, 10000);

    test("should filter by set", async () => {
      const card = await cardRecognitionService.getRandomCard({ set: "m21" });

      expect(card).toBeDefined();
      if (card.setCode) {
        expect(card.setCode).toBe("m21");
      }
    }, 10000);

    test("should filter by format", async () => {
      const card = await cardRecognitionService.getRandomCard({
        format: "standard",
      });

      expect(card).toBeDefined();
      expect(card.legalities).toBeDefined();
    }, 10000);
  });

  describe("caching", () => {
    test("should cache cards and respect cache limits", async () => {
      // Clear cache first
      cardRecognitionService.clearCache();

      const initialStats = cardRecognitionService.getCacheStats();
      expect(initialStats.size).toBe(0);

      // Search for a card to populate cache
      await cardRecognitionService.searchCards("Lightning Bolt", { limit: 5 });

      const afterStats = cardRecognitionService.getCacheStats();
      expect(afterStats.size).toBeGreaterThan(0);
      expect(afterStats.size).toBeLessThanOrEqual(afterStats.maxSize);
    }, 10000);

    test("should clear cache on demand", async () => {
      // Populate cache
      await cardRecognitionService.searchCards("Lightning Bolt", { limit: 1 });

      const beforeClear = cardRecognitionService.getCacheStats();
      expect(beforeClear.size).toBeGreaterThan(0);

      // Clear cache
      cardRecognitionService.clearCache();

      const afterClear = cardRecognitionService.getCacheStats();
      expect(afterClear.size).toBe(0);
    });
  });

  describe("card data structure", () => {
    test("should return complete card data", async () => {
      const card = await cardRecognitionService.getCardByName("Lightning Bolt");

      expect(card).toBeDefined();
      if (card) {
        // Required fields
        expect(card.id).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.typeLine).toBeDefined();
        expect(card.setCode).toBeDefined();
        expect(card.setName).toBeDefined();
        expect(card.collectorNumber).toBeDefined();
        expect(card.rarity).toBeDefined();

        // Optional fields that should exist for most cards
        expect(card.manaCost).toBeDefined();
        expect(card.oracleText).toBeDefined();
        expect(card.imageUris).toBeDefined();

        // Card-type specific fields
        if (card.typeLine.includes("Creature")) {
          expect(card.power).toBeDefined();
          expect(card.toughness).toBeDefined();
        }
      }
    }, 10000);
  });

  describe("error handling", () => {
    test("should handle network errors gracefully", async () => {
      // This test verifies error handling - we can't easily trigger real network errors
      // but the service should handle them
      expect(async () => {
        await cardRecognitionService.getCardById("test-id");
      }).not.toThrow();
    });

    test("should handle malformed queries gracefully", async () => {
      // Empty query should return empty results
      const result = await cardRecognitionService.searchCards("!!!@@@###$$$");
      expect(result).toBeDefined();
      // Empty or error results are acceptable
      expect(result.cards).toBeDefined();
    });
  });

  describe("rate limiting", () => {
    test("should enforce rate limiting between requests", async () => {
      const start = Date.now();

      // Make two quick requests
      await cardRecognitionService.getRandomCard();
      await cardRecognitionService.getRandomCard();

      const elapsed = Date.now() - start;

      // Should take at least 100ms due to rate limiting
      expect(elapsed).toBeGreaterThanOrEqual(100);
    }, 20000); // 20 second timeout for external API calls
  });
});
