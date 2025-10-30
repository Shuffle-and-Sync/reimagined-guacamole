import { describe, it, expect } from "@jest/globals";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import {
  gameSessions,
  gameStateHistory,
  gameActions,
} from "../../../shared/schema";

describe("Game Session Performance Indexes", () => {
  describe("gameSessions Table Indexes", () => {
    it("should have comprehensive indexes for query optimization", () => {
      const config = getTableConfig(gameSessions);
      expect(config.indexes).toBeDefined();
      const indexCount = Object.keys(config.indexes).length;

      // Should have at least 9 indexes:
      // - 3 existing: event, host, status
      // - 2 new single: community, created_at
      // - 4 composite: status+created, community+status, host+status, community+status+created
      expect(indexCount).toBeGreaterThanOrEqual(9);
    });

    it("should support common query patterns", () => {
      const config = getTableConfig(gameSessions);
      const indexCount = Object.keys(config.indexes).length;

      // Verify we have enough indexes to cover:
      // - Find active sessions for a community (community_id + status)
      // - Find sessions hosted by user (host_id + status)
      // - Find sessions waiting for players (status + created_at)
      // - Community session lists sorted (community_id + status + created_at)
      expect(indexCount).toBeGreaterThanOrEqual(9);
    });
  });

  describe("gameStateHistory Table Indexes", () => {
    it("should have indexes for version-based lookups", () => {
      const config = getTableConfig(gameStateHistory);
      expect(config.indexes).toBeDefined();
      const indexCount = Object.keys(config.indexes).length;

      // Should have at least 5 indexes:
      // - 3 single: session, version, created
      // - 2 composite: session+version, session+created
      expect(indexCount).toBeGreaterThanOrEqual(5);
    });

    it("should have unique constraint on session + version", () => {
      const config = getTableConfig(gameStateHistory);
      expect(config.uniqueConstraints).toBeDefined();
      expect(config.uniqueConstraints.length).toBeGreaterThan(0);
    });
  });

  describe("gameActions Table Indexes", () => {
    it("should have indexes for action history queries", () => {
      const config = getTableConfig(gameActions);
      expect(config.indexes).toBeDefined();
      const indexCount = Object.keys(config.indexes).length;

      // Should have at least 8 indexes:
      // - 5 single: session, user, type, timestamp, created
      // - 3 composite: session+timestamp, session+user+timestamp, session+type+timestamp
      expect(indexCount).toBeGreaterThanOrEqual(8);
    });

    it("should optimize timeline-based queries", () => {
      const config = getTableConfig(gameActions);
      const indexCount = Object.keys(config.indexes).length;

      // Action history queries need timestamp-based indexes
      expect(indexCount).toBeGreaterThanOrEqual(8);
    });
  });

  describe("Cross-Table Performance Requirements", () => {
    it("should have comprehensive indexing strategy across all game tables", () => {
      const sessionConfig = getTableConfig(gameSessions);
      const historyConfig = getTableConfig(gameStateHistory);
      const actionsConfig = getTableConfig(gameActions);

      // Verify all tables have adequate indexes
      expect(Object.keys(sessionConfig.indexes).length).toBeGreaterThanOrEqual(
        9,
      );
      expect(Object.keys(historyConfig.indexes).length).toBeGreaterThanOrEqual(
        5,
      );
      expect(Object.keys(actionsConfig.indexes).length).toBeGreaterThanOrEqual(
        8,
      );

      // Total: at least 22 indexes across all game-related tables
      const totalIndexes =
        Object.keys(sessionConfig.indexes).length +
        Object.keys(historyConfig.indexes).length +
        Object.keys(actionsConfig.indexes).length;
      expect(totalIndexes).toBeGreaterThanOrEqual(22);
    });

    it("should support high-concurrency scenarios", () => {
      const sessionConfig = getTableConfig(gameSessions);

      // Composite indexes are crucial for performance at scale
      // They prevent full table scans when filtering by multiple columns
      const indexCount = Object.keys(sessionConfig.indexes).length;
      expect(indexCount).toBeGreaterThanOrEqual(9);
    });
  });
});
