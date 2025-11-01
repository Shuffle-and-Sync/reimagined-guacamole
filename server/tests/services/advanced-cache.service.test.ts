import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AdvancedCacheService } from "../../services/advanced-cache.service";
import type { RedisClientType } from "redis";

// Mock Redis client
const createMockRedis = () => {
  const store = new Map<string, { value: string; ttl: number }>();

  return {
    get: jest.fn(async (key: string) => {
      const item = store.get(key);
      return item ? item.value : null;
    }),
    setEx: jest.fn(async (key: string, ttl: number, value: string) => {
      store.set(key, { value, ttl });
      return "OK";
    }),
    del: jest.fn(async (keys: string | string[]) => {
      let deleted = 0;
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach((key) => {
        if (store.delete(key)) deleted++;
      });
      return deleted;
    }),
    keys: jest.fn(async (pattern: string) => {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return Array.from(store.keys()).filter((key) => regex.test(key));
    }),
    info: jest.fn(
      async () =>
        "keyspace_hits:100\nkeyspace_misses:20\nused_memory_human:1.5M",
    ),
    dbSize: jest.fn(async () => store.size),
    clear: () => store.clear(),
    getStore: () => store,
  } as unknown as RedisClientType & {
    clear: () => void;
    getStore: () => Map<string, { value: string; ttl: number }>;
  };
};

describe("AdvancedCacheService", () => {
  let mockRedis: ReturnType<typeof createMockRedis>;
  let cacheService: AdvancedCacheService;

  beforeEach(() => {
    mockRedis = createMockRedis();
    cacheService = new AdvancedCacheService(mockRedis);
    jest.clearAllMocks();
  });

  describe("getStaleWhileRevalidate", () => {
    it("should fetch fresh data on cache miss", async () => {
      const fetchFn = jest.fn().mockResolvedValue({ data: "fresh" });

      const result = await cacheService.getStaleWhileRevalidate(
        "test-key",
        fetchFn,
        { ttl: 60, staleTime: 30, revalidate: true },
      );

      expect(result).toEqual({ data: "fresh" });
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(mockRedis.setEx).toHaveBeenCalled();
    });

    it("should return cached data when fresh", async () => {
      const now = Date.now();
      const cachedData = {
        data: { value: "cached" },
        timestamp: now,
        staleAt: now + 60000, // Fresh for 60s
      };

      (mockRedis.get as ReturnType<typeof jest.fn>).mockResolvedValue(
        JSON.stringify(cachedData),
      );

      const fetchFn = jest.fn().mockResolvedValue({ value: "fresh" });

      const result = await cacheService.getStaleWhileRevalidate(
        "test-key",
        fetchFn,
        { ttl: 60, staleTime: 30, revalidate: true },
      );

      expect(result).toEqual({ value: "cached" });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it("should serve stale data and revalidate in background", async () => {
      const now = Date.now();
      const cachedData = {
        data: { value: "stale" },
        timestamp: now - 70000,
        staleAt: now - 10000, // Stale
      };

      (mockRedis.get as ReturnType<typeof jest.fn>).mockResolvedValue(
        JSON.stringify(cachedData),
      );

      const fetchFn = jest.fn().mockResolvedValue({ value: "fresh" });

      const result = await cacheService.getStaleWhileRevalidate(
        "test-key",
        fetchFn,
        { ttl: 60, staleTime: 30, revalidate: true },
      );

      // Should immediately return stale data
      expect(result).toEqual({ value: "stale" });

      // Wait for background revalidation
      await new Promise((resolve) => setTimeout(resolve, 50));

      // fetchFn should be called in background
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("should fallback to fresh fetch on parse error", async () => {
      (mockRedis.get as ReturnType<typeof jest.fn>).mockResolvedValue(
        "invalid-json",
      );

      const fetchFn = jest.fn().mockResolvedValue({ value: "fresh" });

      const result = await cacheService.getStaleWhileRevalidate(
        "test-key",
        fetchFn,
        { ttl: 60, staleTime: 30, revalidate: true },
      );

      expect(result).toEqual({ value: "fresh" });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("should work without Redis available", async () => {
      const serviceWithoutRedis = new AdvancedCacheService(null);
      const fetchFn = jest.fn().mockResolvedValue({ value: "fresh" });

      const result = await serviceWithoutRedis.getStaleWhileRevalidate(
        "test-key",
        fetchFn,
        { ttl: 60, staleTime: 30, revalidate: true },
      );

      expect(result).toEqual({ value: "fresh" });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("invalidatePattern", () => {
    it("should invalidate all keys matching pattern", async () => {
      const store = (
        mockRedis as ReturnType<typeof createMockRedis>
      ).getStore();
      store.set("user:123:profile", { value: "data1", ttl: 60 });
      store.set("user:456:profile", { value: "data2", ttl: 60 });
      store.set("game:789", { value: "data3", ttl: 60 });

      // Mock keys to return matching keys
      (mockRedis.keys as ReturnType<typeof jest.fn>).mockResolvedValue([
        "user:123:profile",
        "user:456:profile",
      ]);

      const count = await cacheService.invalidatePattern("user:*");

      expect(count).toBe(2);
      expect(mockRedis.keys).toHaveBeenCalledWith("user:*");
      expect(mockRedis.del).toHaveBeenCalledWith([
        "user:123:profile",
        "user:456:profile",
      ]);
    });

    it("should return 0 when no keys match", async () => {
      // Mock keys to return empty array
      (mockRedis.keys as ReturnType<typeof jest.fn>).mockResolvedValue([]);
      const count = await cacheService.invalidatePattern("nonexistent:*");

      expect(count).toBe(0);
    });
  });

  describe("invalidate", () => {
    it("should invalidate specific key", async () => {
      const store = (
        mockRedis as ReturnType<typeof createMockRedis>
      ).getStore();
      store.set("test-key", { value: "data", ttl: 60 });

      const count = await cacheService.invalidate("test-key");

      expect(count).toBe(1);
      expect(mockRedis.del).toHaveBeenCalledWith("test-key");
    });
  });

  describe("getStats", () => {
    it("should return cache statistics", async () => {
      const stats = await cacheService.getStats();

      expect(stats).toHaveProperty("totalKeys");
      expect(stats).toHaveProperty("memoryUsage");
      expect(stats).toHaveProperty("hitRate");
      expect(mockRedis.info).toHaveBeenCalledWith("stats");
      expect(mockRedis.dbSize).toHaveBeenCalled();
    });

    it("should calculate hit rate correctly", async () => {
      const stats = await cacheService.getStats();

      // Based on mock: hits=100, misses=20
      // Hit rate = 100 / (100 + 20) = 83.33%
      expect(stats.hitRate).toBeCloseTo(83.33, 1);
    });

    it("should handle Redis unavailable", async () => {
      const serviceWithoutRedis = new AdvancedCacheService(null);
      const stats = await serviceWithoutRedis.getStats();

      expect(stats).toEqual({
        totalKeys: 0,
        memoryUsage: "0B",
        hitRate: 0,
      });
    });
  });

  describe("getRevalidationQueueSize", () => {
    it("should return queue size", () => {
      const size = cacheService.getRevalidationQueueSize();
      expect(size).toBe(0);
    });
  });
});
