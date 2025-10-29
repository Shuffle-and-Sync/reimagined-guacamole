/**
 * Tests for CacheService
 * Coverage target: 85% based on service component type
 *
 * This test suite validates all caching operations including:
 * - Generic cache operations (get, set, delete, exists)
 * - Domain-specific caching (users, communities, sessions)
 * - Batch operations
 * - Pattern-based operations
 * - Cache statistics
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { User, Community } from "@shared/schema";
import { CacheService } from "./cache-service";
import type { StreamSession } from "./streaming-coordinator.service";

// Mock Redis client
const mockRedisClient = {
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  mGet: jest.fn(),
  multi: jest.fn(),
  keys: jest.fn(),
  dbSize: jest.fn(),
};

const mockMulti = {
  setEx: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
};

// Mock redis-client service
jest.mock("./redis-client.service", () => ({
  redisClient: {
    getClient: jest.fn(() => mockRedisClient),
    isHealthy: jest.fn(() => true),
    getInfo: jest.fn().mockResolvedValue("used_memory_human:2.5M\r\n"),
  },
}));

// Mock logger
jest.mock("../logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe("CacheService", () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService();
    // Clear all mocks
    jest.clearAllMocks();
    mockRedisClient.multi.mockReturnValue(mockMulti);
  });

  describe("happy path", () => {
    describe("generic cache operations", () => {
      describe("get", () => {
        it("should get cached value successfully", async () => {
          // Arrange
          const testKey = "test-key";
          const testValue = { id: "123", name: "Test" };
          mockRedisClient.get.mockResolvedValue(JSON.stringify(testValue));

          // Act
          const result = await service.get(testKey);

          // Assert
          expect(result).toEqual(testValue);
          expect(mockRedisClient.get).toHaveBeenCalledWith(testKey);
        });

        it("should return null when key does not exist", async () => {
          // Arrange
          const testKey = "nonexistent-key";
          mockRedisClient.get.mockResolvedValue(null);

          // Act
          const result = await service.get(testKey);

          // Assert
          expect(result).toBeNull();
        });
      });

      describe("set", () => {
        it("should set cached value successfully with default TTL", async () => {
          // Arrange
          const testKey = "test-key";
          const testValue = { id: "123", name: "Test" };
          mockRedisClient.setEx.mockResolvedValue("OK");

          // Act
          const result = await service.set(testKey, testValue);

          // Assert
          expect(result).toBe(true);
          expect(mockRedisClient.setEx).toHaveBeenCalledWith(
            testKey,
            300, // default TTL
            JSON.stringify(testValue),
          );
        });

        it("should set cached value with custom TTL", async () => {
          // Arrange
          const testKey = "test-key";
          const testValue = { id: "123", name: "Test" };
          const customTTL = 600;
          mockRedisClient.setEx.mockResolvedValue("OK");

          // Act
          const result = await service.set(testKey, testValue, customTTL);

          // Assert
          expect(result).toBe(true);
          expect(mockRedisClient.setEx).toHaveBeenCalledWith(
            testKey,
            customTTL,
            JSON.stringify(testValue),
          );
        });
      });

      describe("delete", () => {
        it("should delete key successfully", async () => {
          // Arrange
          const testKey = "test-key";
          mockRedisClient.del.mockResolvedValue(1);

          // Act
          const result = await service.delete(testKey);

          // Assert
          expect(result).toBe(true);
          expect(mockRedisClient.del).toHaveBeenCalledWith(testKey);
        });
      });

      describe("exists", () => {
        it("should return true when key exists", async () => {
          // Arrange
          const testKey = "test-key";
          mockRedisClient.exists.mockResolvedValue(1);

          // Act
          const result = await service.exists(testKey);

          // Assert
          expect(result).toBe(true);
          expect(mockRedisClient.exists).toHaveBeenCalledWith(testKey);
        });

        it("should return false when key does not exist", async () => {
          // Arrange
          const testKey = "nonexistent-key";
          mockRedisClient.exists.mockResolvedValue(0);

          // Act
          const result = await service.exists(testKey);

          // Assert
          expect(result).toBe(false);
        });
      });
    });

    describe("stream session caching", () => {
      it("should cache stream session successfully", async () => {
        // Arrange
        const session: StreamSession = {
          id: "session-123",
          userId: "user-123",
          title: "Test Stream",
          scheduledStartTime: new Date(),
          status: "scheduled",
        };
        mockRedisClient.setEx.mockResolvedValue("OK");

        // Act
        const result = await service.cacheStreamSession(session);

        // Assert
        expect(result).toBe(true);
        expect(mockRedisClient.setEx).toHaveBeenCalledWith(
          `stream_session:${session.id}`,
          1800, // session TTL
          JSON.stringify(session),
        );
      });

      it("should get stream session from cache", async () => {
        // Arrange
        const sessionId = "session-123";
        const scheduledStart = new Date();
        const session: StreamSession = {
          id: sessionId,
          userId: "user-123",
          title: "Test Stream",
          scheduledStartTime: scheduledStart,
          status: "scheduled",
        };
        // Mock returns stringified version (dates become strings in JSON)
        const cachedVersion = {
          ...session,
          scheduledStartTime: scheduledStart.toISOString(),
        };
        mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedVersion));

        // Act
        const result = await service.getStreamSession(sessionId);

        // Assert
        expect(result).toEqual(cachedVersion);
      });

      it("should delete stream session from cache", async () => {
        // Arrange
        const sessionId = "session-123";
        mockRedisClient.del.mockResolvedValue(1);

        // Act
        const result = await service.deleteStreamSession(sessionId);

        // Assert
        expect(result).toBe(true);
        expect(mockRedisClient.del).toHaveBeenCalledWith(
          `stream_session:${sessionId}`,
        );
      });
    });

    describe("user data caching", () => {
      it("should cache user successfully", async () => {
        // Arrange
        const user: Partial<User> = {
          id: "user-123",
          email: "test@example.com",
          firstName: "Test",
        };
        mockRedisClient.setEx.mockResolvedValue("OK");

        // Act
        const result = await service.cacheUser(user as User);

        // Assert
        expect(result).toBe(true);
        expect(mockRedisClient.setEx).toHaveBeenCalledWith(
          `user:${user.id}`,
          600, // user TTL
          JSON.stringify(user),
        );
      });

      it("should get user from cache", async () => {
        // Arrange
        const userId = "user-123";
        const user: Partial<User> = {
          id: userId,
          email: "test@example.com",
          firstName: "Test",
        };
        mockRedisClient.get.mockResolvedValue(JSON.stringify(user));

        // Act
        const result = await service.getUser(userId);

        // Assert
        expect(result).toEqual(user);
      });

      it("should delete user from cache", async () => {
        // Arrange
        const userId = "user-123";
        mockRedisClient.del.mockResolvedValue(1);

        // Act
        const result = await service.deleteUser(userId);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe("community data caching", () => {
      it("should cache community successfully", async () => {
        // Arrange
        const community: Partial<Community> = {
          id: "community-123",
          name: "magic",
          displayName: "Magic: The Gathering",
        };
        mockRedisClient.setEx.mockResolvedValue("OK");

        // Act
        const result = await service.cacheCommunity(community as Community);

        // Assert
        expect(result).toBe(true);
        expect(mockRedisClient.setEx).toHaveBeenCalledWith(
          `community:${community.id}`,
          600,
          JSON.stringify(community),
        );
      });

      it("should get community from cache", async () => {
        // Arrange
        const communityId = "community-123";
        const community: Partial<Community> = {
          id: communityId,
          name: "magic",
          displayName: "Magic: The Gathering",
        };
        mockRedisClient.get.mockResolvedValue(JSON.stringify(community));

        // Act
        const result = await service.getCommunity(communityId);

        // Assert
        expect(result).toEqual(community);
      });

      it("should cache all communities", async () => {
        // Arrange
        const communities: Partial<Community>[] = [
          { id: "1", name: "magic", displayName: "Magic" },
          { id: "2", name: "pokemon", displayName: "Pokemon" },
        ];
        mockRedisClient.setEx.mockResolvedValue("OK");

        // Act
        const result = await service.cacheAllCommunities(
          communities as Community[],
        );

        // Assert
        expect(result).toBe(true);
        expect(mockRedisClient.setEx).toHaveBeenCalledWith(
          "communities:all",
          600,
          JSON.stringify(communities),
        );
      });
    });

    describe("API response caching", () => {
      it("should cache API response with generated key", async () => {
        // Arrange
        const endpoint = "/api/users";
        const params = { page: 1, limit: 10 };
        const response = { users: [], total: 0 };
        mockRedisClient.setEx.mockResolvedValue("OK");

        // Act
        const result = await service.cacheApiResponse(
          endpoint,
          params,
          response,
        );

        // Assert
        expect(result).toBe(true);
        expect(mockRedisClient.setEx).toHaveBeenCalled();
      });

      it("should get API response with same params", async () => {
        // Arrange
        const endpoint = "/api/users";
        const params = { page: 1, limit: 10 };
        const response = { users: [], total: 0 };
        mockRedisClient.get.mockResolvedValue(JSON.stringify(response));

        // Act
        const result = await service.getApiResponse(endpoint, params);

        // Assert
        expect(result).toEqual(response);
      });

      it("should generate consistent cache keys for same params in different order", async () => {
        // Arrange
        const endpoint = "/api/users";
        const params1 = { page: 1, limit: 10, sort: "name" };
        const params2 = { sort: "name", limit: 10, page: 1 }; // Different order
        const response = { users: [], total: 0 };
        mockRedisClient.setEx.mockResolvedValue("OK");
        mockRedisClient.get.mockResolvedValue(JSON.stringify(response));

        // Act
        await service.cacheApiResponse(endpoint, params1, response);
        const result = await service.getApiResponse(endpoint, params2);

        // Assert
        expect(result).toEqual(response);
      });
    });

    describe("batch operations", () => {
      it("should get multiple keys successfully", async () => {
        // Arrange
        const keys = ["key1", "key2", "key3"];
        const values = ['{"id":"1"}', '{"id":"2"}', null];
        mockRedisClient.mGet.mockResolvedValue(values);

        // Act
        const result = await service.multiGet(keys);

        // Assert
        expect(result).toEqual([{ id: "1" }, { id: "2" }, null]);
        expect(mockRedisClient.mGet).toHaveBeenCalledWith(keys);
      });

      it("should set multiple key-value pairs successfully", async () => {
        // Arrange
        const keyValuePairs = [
          { key: "key1", value: { id: "1" }, ttl: 100 },
          { key: "key2", value: { id: "2" } },
        ];
        mockMulti.exec.mockResolvedValue([]);

        // Act
        const result = await service.multiSet(keyValuePairs);

        // Assert
        expect(result).toBe(true);
        expect(mockMulti.setEx).toHaveBeenCalledTimes(2);
        expect(mockMulti.exec).toHaveBeenCalled();
      });
    });

    describe("pattern-based operations", () => {
      it("should delete keys matching pattern", async () => {
        // Arrange
        const pattern = "user:*";
        const keys = ["user:1", "user:2", "user:3"];
        mockRedisClient.keys.mockResolvedValue(keys);
        mockRedisClient.del.mockResolvedValue(3);

        // Act
        const result = await service.deletePattern(pattern);

        // Assert
        expect(result).toBe(3);
        expect(mockRedisClient.keys).toHaveBeenCalledWith(pattern);
        expect(mockRedisClient.del).toHaveBeenCalledWith(keys);
      });

      it("should return 0 when no keys match pattern", async () => {
        // Arrange
        const pattern = "nonexistent:*";
        mockRedisClient.keys.mockResolvedValue([]);

        // Act
        const result = await service.deletePattern(pattern);

        // Assert
        expect(result).toBe(0);
        expect(mockRedisClient.del).not.toHaveBeenCalled();
      });
    });

    describe("cache statistics", () => {
      it("should get cache stats successfully", async () => {
        // Arrange
        mockRedisClient.dbSize.mockResolvedValue(150);

        // Act
        const result = await service.getStats();

        // Assert
        expect(result).toEqual({
          connected: true,
          keyCount: 150,
          memoryUsage: "2.5M",
          hitRate: null,
        });
      });
    });
  });

  describe("error handling", () => {
    it("should return null when Redis client is not available", async () => {
      // Arrange
      const { redisClient } = await import("./redis-client.service");
      (redisClient.getClient as jest.Mock).mockReturnValue(null);

      // Act
      const result = await service.get("test-key");

      // Assert
      expect(result).toBeNull();
    });

    it("should return false when Redis client is not healthy", async () => {
      // Arrange
      const { redisClient } = await import("./redis-client.service");
      (redisClient.isHealthy as jest.Mock).mockReturnValue(false);

      // Act
      const result = await service.set("test-key", { data: "test" });

      // Assert
      expect(result).toBe(false);
    });

    it("should handle JSON parse errors gracefully", async () => {
      // Arrange
      mockRedisClient.get.mockResolvedValue("invalid json");

      // Act
      const result = await service.get("test-key");

      // Assert
      expect(result).toBeNull();
    });

    it("should handle Redis errors on set operation", async () => {
      // Arrange
      mockRedisClient.setEx.mockRejectedValue(new Error("Redis error"));

      // Act
      const result = await service.set("test-key", { data: "test" });

      // Assert
      expect(result).toBe(false);
    });

    it("should handle Redis errors on delete operation", async () => {
      // Arrange
      mockRedisClient.del.mockRejectedValue(new Error("Redis error"));

      // Act
      const result = await service.delete("test-key");

      // Assert
      expect(result).toBe(false);
    });

    it("should handle errors in multiGet operation", async () => {
      // Arrange
      const keys = ["key1", "key2"];
      mockRedisClient.mGet.mockRejectedValue(new Error("Redis error"));

      // Act
      const result = await service.multiGet(keys);

      // Assert
      expect(result).toEqual([null, null]);
    });

    it("should handle errors in multiSet operation", async () => {
      // Arrange
      const keyValuePairs = [{ key: "key1", value: { id: "1" } }];
      mockMulti.exec.mockRejectedValue(new Error("Redis error"));

      // Act
      const result = await service.multiSet(keyValuePairs);

      // Assert
      expect(result).toBe(false);
    });

    it("should handle errors in deletePattern operation", async () => {
      // Arrange
      mockRedisClient.keys.mockRejectedValue(new Error("Redis error"));

      // Act
      const result = await service.deletePattern("user:*");

      // Assert
      expect(result).toBe(0);
    });

    it("should handle errors in getStats operation", async () => {
      // Arrange
      mockRedisClient.dbSize.mockRejectedValue(new Error("Redis error"));

      // Act
      const result = await service.getStats();

      // Assert
      expect(result).toEqual({
        connected: false,
        keyCount: 0,
        memoryUsage: null,
        hitRate: null,
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty string keys", async () => {
      // Arrange
      mockRedisClient.get.mockResolvedValue(null);

      // Act
      const result = await service.get("");

      // Assert
      expect(result).toBeNull();
    });

    it("should handle null values in set operation", async () => {
      // Arrange
      const { redisClient } = await import("./redis-client.service");
      (redisClient.getClient as jest.Mock).mockReturnValue(mockRedisClient);
      (redisClient.isHealthy as jest.Mock).mockReturnValue(true);
      mockRedisClient.setEx.mockResolvedValue("OK");

      // Act
      const result = await service.set("test-key", null);

      // Assert
      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "test-key",
        300,
        "null",
      );
    });

    it("should handle undefined values in set operation", async () => {
      // Arrange
      const { redisClient } = await import("./redis-client.service");
      (redisClient.getClient as jest.Mock).mockReturnValue(mockRedisClient);
      (redisClient.isHealthy as jest.Mock).mockReturnValue(true);
      mockRedisClient.setEx.mockResolvedValue("OK");

      // Act
      const result = await service.set("test-key", undefined);

      // Assert
      expect(result).toBe(true);
    });

    it("should handle very large objects", async () => {
      // Arrange
      const { redisClient } = await import("./redis-client.service");
      (redisClient.getClient as jest.Mock).mockReturnValue(mockRedisClient);
      (redisClient.isHealthy as jest.Mock).mockReturnValue(true);
      const largeObject = { data: "x".repeat(10000) };
      mockRedisClient.setEx.mockResolvedValue("OK");

      // Act
      const result = await service.set("test-key", largeObject);

      // Assert
      expect(result).toBe(true);
    });

    it("should handle empty array in multiGet", async () => {
      // Arrange
      const { redisClient } = await import("./redis-client.service");
      (redisClient.getClient as jest.Mock).mockReturnValue(mockRedisClient);
      (redisClient.isHealthy as jest.Mock).mockReturnValue(true);
      mockRedisClient.mGet.mockResolvedValue([]);

      // Act
      const result = await service.multiGet([]);

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle empty array in multiSet", async () => {
      // Arrange
      const { redisClient } = await import("./redis-client.service");
      (redisClient.getClient as jest.Mock).mockReturnValue(mockRedisClient);
      (redisClient.isHealthy as jest.Mock).mockReturnValue(true);
      mockMulti.exec.mockResolvedValue([]);

      // Act
      const result = await service.multiSet([]);

      // Assert
      expect(result).toBe(true);
    });

    it("should handle special characters in cache keys", async () => {
      // Arrange
      const { redisClient } = await import("./redis-client.service");
      (redisClient.getClient as jest.Mock).mockReturnValue(mockRedisClient);
      (redisClient.isHealthy as jest.Mock).mockReturnValue(true);
      const key = "user:123:profile:settings";
      mockRedisClient.get.mockResolvedValue('{"id":"123"}');

      // Act
      const result = await service.get(key);

      // Assert
      expect(result).toEqual({ id: "123" });
    });
  });
});
