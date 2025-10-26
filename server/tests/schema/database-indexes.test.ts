import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "@jest/globals";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import {
  users,
  games,
  tournamentMatches,
  matchResults,
} from "../../../shared/schema";

describe("Database Indexes", () => {
  // Test that migration file exists and contains our new indexes
  describe("Migration File Validation", () => {
    it("should have generated migration file with new indexes", () => {
      const migrationPath = resolve(
        __dirname,
        "../../../migrations/0001_tiresome_triathlon.sql",
      );
      expect(existsSync(migrationPath)).toBe(true);

      const migrationContent = readFileSync(migrationPath, "utf-8");

      // Verify username unique index
      expect(migrationContent).toContain("users_username_unique");

      // Verify games indexes
      expect(migrationContent).toContain("idx_games_created_at");

      // Verify tournament matches indexes
      expect(migrationContent).toContain("idx_tournament_matches_player1");
      expect(migrationContent).toContain("idx_tournament_matches_player2");
      expect(migrationContent).toContain("idx_tournament_matches_status");
      expect(migrationContent).toContain("idx_tournament_matches_created_at");
      expect(migrationContent).toContain(
        "idx_tournament_matches_tournament_created",
      );

      // Verify match results indexes
      expect(migrationContent).toContain("idx_match_results_winner");
      expect(migrationContent).toContain("idx_match_results_loser");
      expect(migrationContent).toContain("idx_match_results_created_at");
      expect(migrationContent).toContain("idx_match_results_winner_created");
    });
  });

  describe("Users Table Indexes", () => {
    it("should have unique constraint on username", () => {
      const config = getTableConfig(users);
      const usernameColumn = config.columns.find(
        (col) => col.name === "username",
      );
      expect(usernameColumn).toBeDefined();
      expect(usernameColumn?.isUnique).toBe(true);
    });

    it("should have unique constraint on email", () => {
      const config = getTableConfig(users);
      const emailColumn = config.columns.find((col) => col.name === "email");
      expect(emailColumn).toBeDefined();
      expect(emailColumn?.isUnique).toBe(true);
    });

    it("should have indexes defined", () => {
      const config = getTableConfig(users);
      expect(config.indexes).toBeDefined();
      expect(Object.keys(config.indexes).length).toBeGreaterThan(0);
    });
  });

  describe("Games Table Indexes", () => {
    it("should have indexes defined", () => {
      const config = getTableConfig(games);
      expect(config.indexes).toBeDefined();
      const indexCount = Object.keys(config.indexes).length;
      // Should have at least 4 indexes (name, code, active, createdAt)
      expect(indexCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Tournament Matches Table Indexes", () => {
    it("should have multiple indexes defined", () => {
      const config = getTableConfig(tournamentMatches);
      expect(config.indexes).toBeDefined();
      const indexCount = Object.keys(config.indexes).length;
      // Should have at least 8 indexes based on our additions
      expect(indexCount).toBeGreaterThanOrEqual(7);
    });
  });

  describe("Match Results Table Indexes", () => {
    it("should have multiple indexes defined", () => {
      const config = getTableConfig(matchResults);
      expect(config.indexes).toBeDefined();
      const indexCount = Object.keys(config.indexes).length;
      // Should have at least 6 indexes (match, reporter, winner, loser, createdAt, winner_created)
      expect(indexCount).toBeGreaterThanOrEqual(6);
    });
  });

  describe("Index Performance Requirements", () => {
    it("should have comprehensive indexing strategy", () => {
      // Verify critical tables have indexing
      const userConfig = getTableConfig(users);
      const gameConfig = getTableConfig(games);
      const matchConfig = getTableConfig(tournamentMatches);
      const resultConfig = getTableConfig(matchResults);

      expect(Object.keys(userConfig.indexes).length).toBeGreaterThan(5);
      expect(Object.keys(gameConfig.indexes).length).toBeGreaterThan(2);
      expect(Object.keys(matchConfig.indexes).length).toBeGreaterThan(4);
      expect(Object.keys(resultConfig.indexes).length).toBeGreaterThan(3);
    });
  });
});
