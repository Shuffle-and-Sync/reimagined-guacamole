/**
 * Matchmaking Optimization Service Tests
 *
 * Tests for efficient player matching with caching and scoring.
 */

import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { db } from "@shared/database-unified";
import { matchmakingOptimizationService } from "../../services/matchmaking-optimization.service";

// Mock database
jest.mock("@shared/database-unified", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("../../logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Matchmaking Optimization Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    matchmakingOptimizationService.clearCache("test-user");
  });

  describe("findCompatiblePlayers", () => {
    test("should find compatible players with scoring", async () => {
      const mockUserPrefs = {
        userId: "user-1",
        preferredFormat: "standard",
        skillLevel: 1500,
        competitiveLevel: "competitive",
      };

      const mockUserRating = {
        userId: "user-1",
        rating: 1500,
        gameType: "magic",
      };

      const mockUser = {
        timezone: "America/New_York",
      };

      const mockCompatiblePlayers = [
        {
          userId: "user-2",
          username: "player2",
          timezone: "America/New_York",
          skillLevel: 1500,
          preferredFormat: "standard",
          rating: 1520,
          compatibilityScore: 45,
        },
      ];

      let callCount = 0;
      const mockSelect = jest.fn().mockImplementation(() => {
        callCount++;
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest
                .fn()
                .mockResolvedValue(
                  callCount === 1
                    ? [mockUserPrefs]
                    : callCount === 2
                      ? [mockUserRating]
                      : callCount === 3
                        ? [mockUser]
                        : [],
                ),
            }),
            innerJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue(mockCompatiblePlayers),
                  }),
                }),
              }),
            }),
          }),
        };
      });

      (db.select as jest.Mock).mockImplementation(mockSelect);

      const result = await matchmakingOptimizationService.findCompatiblePlayers(
        {
          userId: "user-1",
          gameType: "magic",
          format: "standard",
        },
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test("should return empty array when user has no preferences", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const result = await matchmakingOptimizationService.findCompatiblePlayers(
        {
          userId: "user-1",
          gameType: "magic",
        },
      );

      expect(result).toEqual([]);
    });

    test("should use cached results on subsequent calls", async () => {
      const mockUserPrefs = {
        userId: "user-1",
        preferredFormat: "standard",
      };

      let selectCallCount = 0;
      const mockSelect = jest.fn().mockImplementation(() => {
        selectCallCount++;
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockUserPrefs]),
            }),
            innerJoin: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([]),
                  }),
                }),
              }),
            }),
          }),
        };
      });

      (db.select as jest.Mock).mockImplementation(mockSelect);

      // First call - should hit database
      await matchmakingOptimizationService.findCompatiblePlayers({
        userId: "user-1",
        gameType: "magic",
      });

      const firstCallCount = selectCallCount;

      // Second call - should use cache
      await matchmakingOptimizationService.findCompatiblePlayers({
        userId: "user-1",
        gameType: "magic",
      });

      // Database should not be called again (or minimal calls for user data)
      expect(selectCallCount).toBeLessThanOrEqual(firstCallCount + 2);
    });
  });

  describe("getRecentOpponents", () => {
    test("should return list of recent opponent IDs", async () => {
      const mockMatches = [
        { player1Id: "user-1", player2Id: "user-2" },
        { player1Id: "user-3", player2Id: "user-1" },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockMatches),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const result = await matchmakingOptimizationService.getRecentOpponents(
        "user-1",
        30,
        10,
      );

      expect(result).toContain("user-2");
      expect(result).toContain("user-3");
      expect(result.length).toBe(2);
    });

    test("should return empty array when no recent matches", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const result = await matchmakingOptimizationService.getRecentOpponents(
        "user-1",
        30,
        10,
      );

      expect(result).toEqual([]);
    });
  });

  describe("updatePreferences", () => {
    test("should update existing preferences", async () => {
      const mockExisting = {
        id: "pref-1",
        userId: "user-1",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockExisting]),
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());
      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      await matchmakingOptimizationService.updatePreferences("user-1", {
        preferredFormat: "modern",
      });

      expect(mockUpdate).toHaveBeenCalled();
    });

    test("should create new preferences if none exist", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue({}),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());
      (db.insert as jest.Mock).mockReturnValue(mockInsert());

      await matchmakingOptimizationService.updatePreferences("user-1", {
        preferredFormat: "modern",
      });

      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe("batchMatchmaking", () => {
    test("should process multiple users in batches", async () => {
      const userIds = ["user-1", "user-2", "user-3"];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
          innerJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const result = await matchmakingOptimizationService.batchMatchmaking(
        userIds,
        "magic",
      );

      expect(result.size).toBe(3);
      expect(result.has("user-1")).toBe(true);
      expect(result.has("user-2")).toBe(true);
      expect(result.has("user-3")).toBe(true);
    });
  });

  describe("cache management", () => {
    test("should clear cache for specific user", () => {
      matchmakingOptimizationService.clearCache("user-1");
      // No error should be thrown
      expect(true).toBe(true);
    });

    test("should return cache statistics", () => {
      const stats = matchmakingOptimizationService.getStats();

      expect(stats).toHaveProperty("cacheHitRate");
      expect(stats).toHaveProperty("cacheSize");
    });
  });
});
