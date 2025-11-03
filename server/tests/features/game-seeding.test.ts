/**
 * Game Seeding Tests
 *
 * Tests for the seed-games.ts script functionality
 */

import { describe, test, expect } from "@jest/globals";
import { eq } from "drizzle-orm";
import { db } from "../../../shared/database-unified";
import { games } from "../../../shared/schema";

describe("Game Seeding", () => {
  describe("Official Games", () => {
    test("should be able to insert MTG game", async () => {
      const mtgGame = {
        name: "Magic: The Gathering",
        code: "MTG",
        description: "The original trading card game",
        isActive: true,
      };

      await db.insert(games).values(mtgGame);

      const result = await db
        .select()
        .from(games)
        .where(eq(games.code, "MTG"))
        .limit(1);

      expect(result.length).toBe(1);
      expect(result[0].name).toBe("Magic: The Gathering");
      expect(result[0].code).toBe("MTG");
      expect(result[0].isActive).toBe(true);
    });

    test("should be able to insert Pokemon game", async () => {
      const pokemonGame = {
        name: "Pokemon Trading Card Game",
        code: "POKEMON",
        description: "Collect and battle with Pokemon cards",
        isActive: true,
      };

      await db.insert(games).values(pokemonGame);

      const result = await db
        .select()
        .from(games)
        .where(eq(games.code, "POKEMON"))
        .limit(1);

      expect(result.length).toBe(1);
      expect(result[0].name).toBe("Pokemon Trading Card Game");
    });

    test("should be able to query all games", async () => {
      const allGames = await db.select().from(games);
      expect(allGames.length).toBeGreaterThanOrEqual(2);
    });

    test("should be able to update existing game", async () => {
      // First insert a game
      const testGame = {
        name: "Test Game",
        code: "TEST",
        description: "Original description",
        isActive: true,
      };

      await db.insert(games).values(testGame);

      // Get the inserted game
      const [inserted] = await db
        .select()
        .from(games)
        .where(eq(games.code, "TEST"))
        .limit(1);

      expect(inserted).toBeDefined();

      // Update it
      await db
        .update(games)
        .set({
          description: "Updated description",
          updatedAt: new Date(),
        })
        .where(eq(games.id, inserted.id));

      // Verify update
      const [updated] = await db
        .select()
        .from(games)
        .where(eq(games.id, inserted.id))
        .limit(1);

      expect(updated.description).toBe("Updated description");
    });
  });

  describe("Game Codes", () => {
    test("should have unique codes", async () => {
      const uniqueCode = `UNIQUE${Date.now()}`;
      const game1 = {
        name: "Game One",
        code: uniqueCode,
        isActive: true,
      };

      const game2 = {
        name: "Game Two",
        code: uniqueCode, // Same code - should fail
        isActive: true,
      };

      await db.insert(games).values(game1);

      // Second insert with same code should fail
      await expect(db.insert(games).values(game2)).rejects.toThrow();
    });
  });
});
