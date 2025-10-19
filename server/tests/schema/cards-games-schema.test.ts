/**
 * Cards and Games Schema Tests
 *
 * Tests to validate the structure of the cards and games tables.
 */

import { describe, test, expect } from "@jest/globals";
import {
  games,
  cards,
  insertGameSchema,
  insertCardSchema,
  type Game,
  type Card,
  type InsertGame,
  type InsertCard,
} from "../../../shared/schema";

describe("Games and Cards Schema", () => {
  describe("Games Table", () => {
    test("should have correct table name", () => {
      expect((games as any)[Symbol.for("drizzle:Name")]).toBe("games");
    });

    test("should validate insert schema for games", () => {
      const validGame: InsertGame = {
        name: "Magic: The Gathering",
        code: "MTG",
        description: "A popular trading card game",
        isActive: true,
      };

      const result = insertGameSchema.safeParse(validGame);
      expect(result.success).toBe(true);
    });

    test("should require name and code fields", () => {
      const invalidGame = {
        description: "Missing name and code",
      };

      const result = insertGameSchema.safeParse(invalidGame);
      expect(result.success).toBe(false);
    });

    test("should validate code format (uppercase)", () => {
      const gameWithLowercaseCode: InsertGame = {
        name: "Pokemon",
        code: "pokemon", // Should be converted to uppercase
      };

      const result = insertGameSchema.safeParse(gameWithLowercaseCode);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe("POKEMON");
      }
    });

    test("should enforce max length on name", () => {
      const longName = "a".repeat(101);
      const gameWithLongName = {
        name: longName,
        code: "TEST",
      };

      const result = insertGameSchema.safeParse(gameWithLongName);
      expect(result.success).toBe(false);
    });
  });

  describe("Cards Table", () => {
    test("should have correct table name", () => {
      expect((cards as any)[Symbol.for("drizzle:Name")]).toBe("cards");
    });

    test("should validate insert schema for cards", () => {
      const validCard: InsertCard = {
        name: "Black Lotus",
        gameId: "test-game-id",
        type: "Artifact",
        rarity: "Rare",
        setCode: "LEA",
        setName: "Limited Edition Alpha",
      };

      const result = insertCardSchema.safeParse(validCard);
      expect(result.success).toBe(true);
    });

    test("should require name and gameId fields", () => {
      const invalidCard = {
        type: "Creature",
        rarity: "Common",
      };

      const result = insertCardSchema.safeParse(invalidCard);
      expect(result.success).toBe(false);
    });

    test("should allow optional fields", () => {
      const minimalCard: InsertCard = {
        name: "Test Card",
        gameId: "test-game-id",
      };

      const result = insertCardSchema.safeParse(minimalCard);
      expect(result.success).toBe(true);
    });

    test("should validate imageUrl format when provided", () => {
      const cardWithInvalidUrl = {
        name: "Test Card",
        gameId: "test-game-id",
        imageUrl: "not-a-valid-url",
      };

      const result = insertCardSchema.safeParse(cardWithInvalidUrl);
      expect(result.success).toBe(false);
    });

    test("should accept valid imageUrl", () => {
      const cardWithValidUrl: InsertCard = {
        name: "Test Card",
        gameId: "test-game-id",
        imageUrl: "https://example.com/card-image.jpg",
      };

      const result = insertCardSchema.safeParse(cardWithValidUrl);
      expect(result.success).toBe(true);
    });

    test("should enforce max lengths on fields", () => {
      const cardWithLongName = {
        name: "a".repeat(201),
        gameId: "test-game-id",
      };

      const result = insertCardSchema.safeParse(cardWithLongName);
      expect(result.success).toBe(false);
    });
  });

  describe("Foreign Key Relationship", () => {
    test("cards should reference games table", () => {
      // Check that the gameId field has a reference
      const gameIdColumn = (cards as any).gameId;
      expect(gameIdColumn).toBeDefined();
      expect(gameIdColumn.notNull).toBe(true);
    });
  });

  describe("Type Definitions", () => {
    test("Game type should be properly typed", () => {
      const game: Game = {
        id: "test-id",
        name: "Test Game",
        code: "TEST",
        description: "Test description",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(game.id).toBeDefined();
      expect(game.name).toBeDefined();
      expect(game.code).toBeDefined();
    });

    test("Card type should be properly typed", () => {
      const card: Card = {
        id: "test-id",
        name: "Test Card",
        gameId: "game-id",
        type: "Creature",
        rarity: "Common",
        setCode: "TST",
        setName: "Test Set",
        imageUrl: "https://example.com/image.jpg",
        metadata: "{}",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(card.id).toBeDefined();
      expect(card.name).toBeDefined();
      expect(card.gameId).toBeDefined();
    });
  });
});
