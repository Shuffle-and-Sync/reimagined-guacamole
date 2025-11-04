#!/usr/bin/env tsx
/**
 * Seed Official Games Script
 *
 * Seeds the database with official game definitions for:
 * - Magic: The Gathering
 * - Pokemon TCG
 * - Yu-Gi-Oh!
 * - Disney Lorcana
 *
 * This script is idempotent and can be run multiple times safely.
 */

import { eq, sql } from "drizzle-orm";
import { logger } from "../server/logger";
import { db } from "../shared/database-unified";
import { games, type InsertGame } from "../shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";

/**
 * Wait for database connection to be ready
 */
async function waitForDatabase(
  maxAttempts = 10,
  delayMs = 1000,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Try a simple database query to check connection
      await db.execute(sql`SELECT 1 as test`);
      console.warn("✅ Database connection established");
      return; // Connection is ready
    } catch (error) {
      if (i < maxAttempts - 1) {
        console.warn(
          `⏳ Waiting for database connection... (attempt ${i + 1}/${maxAttempts})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw new Error(
          `Database connection timeout: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  }
}

// Official game definitions
const officialGames: InsertGame[] = [
  {
    name: "Magic: The Gathering",
    code: "MTG",
    description:
      "The original trading card game where players duel as powerful Planeswalkers, casting spells and summoning creatures from across the multiverse.",
    isActive: true,
  },
  {
    name: "Pokemon Trading Card Game",
    code: "POKEMON",
    description:
      "Collect and battle with Pokemon cards! Build decks around your favorite Pokemon and challenge other trainers.",
    isActive: true,
  },
  {
    name: "Yu-Gi-Oh! Trading Card Game",
    code: "YUGIOH",
    description:
      "Summon powerful monsters, cast spells, and set traps in this strategic dueling card game based on the popular anime series.",
    isActive: true,
  },
  {
    name: "Disney Lorcana",
    code: "LORCANA",
    description:
      "A new trading card game featuring Disney characters reimagined as Glimmers in the magical world of Lorcana.",
    isActive: true,
  },
];

/**
 * Main seeding function
 */
async function seedGames() {
  console.warn("🎮 Starting official games seeding...\n");

  try {
    // Wait for database connection to be ready
    await waitForDatabase();

    let gamesCreated = 0;
    let gamesUpdated = 0;
    let gamesSkipped = 0;

    for (const gameData of officialGames) {
      // Check if game already exists by code
      const existingGame = await db
        .select()
        .from(games)
        .where(eq(games.code, gameData.code))
        .limit(1);

      if (existingGame.length > 0) {
        // Game exists - check if it needs updating
        const existing = existingGame[0];
        const needsUpdate =
          existing.name !== gameData.name ||
          existing.description !== gameData.description ||
          existing.isActive !== gameData.isActive;

        if (needsUpdate) {
          // Update existing game
          await db
            .update(games)
            .set({
              name: gameData.name,
              description: gameData.description,
              isActive: gameData.isActive,
              updatedAt: new Date(),
            })
            .where(eq(games.id, existing.id));

          console.warn(`  ✏️  Updated: ${gameData.name} (${gameData.code})`);
          gamesUpdated++;
        } else {
          console.warn(
            `  ⏭️  Skipped: ${gameData.name} (${gameData.code}) - no changes needed`,
          );
          gamesSkipped++;
        }
      } else {
        // Create new game
        await db.insert(games).values(gameData);
        console.warn(`  ✅ Created: ${gameData.name} (${gameData.code})`);
        gamesCreated++;
      }
    }

    console.warn("\n📊 Seeding Summary:");
    console.warn(`  ✨ Games created: ${gamesCreated}`);
    console.warn(`  ✏️  Games updated: ${gamesUpdated}`);
    console.warn(`  ⏭️  Games skipped: ${gamesSkipped}`);
    console.warn(`  📦 Total games: ${officialGames.length}`);

    // Verify all games exist
    console.warn("\n🔍 Verifying seeded games...");
    const allGames = await db.select().from(games);
    console.warn(`  ✅ Found ${allGames.length} game(s) in database:`);

    for (const game of allGames) {
      console.warn(
        `     - ${game.name} (${game.code}) - ${game.isActive ? "Active" : "Inactive"}`,
      );
    }

    console.warn("\n✅ Official games seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding games:");
    console.error(error);
    logger.error("Game seeding failed", toLoggableError(error));
    process.exit(1);
  }
}

// Run the seeding
seedGames();
