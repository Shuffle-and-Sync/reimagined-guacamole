import { RedisClientType } from "redis";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { redisClient } from "./redis-client.service";

interface CacheOptions {
  ttl: number; // Time to live in seconds
  staleTime?: number; // Time after which cache is considered stale
  revalidate?: boolean; // Whether to revalidate in background
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  staleAt: number;
}

/**
 * Advanced Cache Service with stale-while-revalidate strategy
 */
export class AdvancedCacheService {
  private static readonly DEFAULT_STALE_TIME_RATIO = 0.8;

  private redis: RedisClientType | null;
  private revalidationQueue: Map<string, Promise<unknown>>;

  constructor(redis: RedisClientType | null) {
    this.redis = redis;
    this.revalidationQueue = new Map();
  }

  /**
   * Get data with stale-while-revalidate strategy
   */
  async getStaleWhileRevalidate<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions,
  ): Promise<T> {
    // If Redis is not available, fetch fresh data
    if (!this.redis) {
      logger.debug("Redis not available, fetching fresh data");
      return fetchFn();
    }

    try {
      const cached = await this.redis.get(key);

      if (!cached) {
        // Cache miss - fetch fresh data
        const data = await fetchFn();
        await this.set(key, data, options);
        return data;
      }

      // Ensure cached is a string before parsing
      const cachedString = typeof cached === "string" ? cached : String(cached);
      const cachedData: CachedData<T> = JSON.parse(cachedString);
      const now = Date.now();

      // Check if data is stale
      const isStale = now > cachedData.staleAt;

      if (isStale && options.revalidate) {
        // Serve stale data immediately
        // Revalidate in background
        this.revalidateInBackground(key, fetchFn, options);
      }

      return cachedData.data;
    } catch (error) {
      logger.error("Error parsing cached data", toLoggableError(error), { key });
      // Fallback to fresh fetch
      const data = await fetchFn();
      await this.set(key, data, options);
      return data;
    }
  }

  /**
   * Set data in cache with metadata
   */
  private async set<T>(
    key: string,
    data: T,
    options: CacheOptions,
  ): Promise<void> {
    if (!this.redis) return;

    try {
      const now = Date.now();
      const staleTime =
        options.staleTime ||
        options.ttl * AdvancedCacheService.DEFAULT_STALE_TIME_RATIO;

      const cachedData: CachedData<T> = {
        data,
        timestamp: now,
        staleAt: now + staleTime * 1000,
      };

      await this.redis.setEx(key, options.ttl, JSON.stringify(cachedData));
    } catch (error) {
      logger.error("Error setting cache", toLoggableError(error), { key });
    }
  }

  /**
   * Revalidate data in background
   */
  private revalidateInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions,
  ): void {
    // Check if revalidation is already in progress
    if (this.revalidationQueue.has(key)) {
      return;
    }

    const revalidationPromise = (async () => {
      try {
        logger.debug(`Revalidating cache for key: ${key}`);
        const freshData = await fetchFn();
        await this.set(key, freshData, options);
        logger.debug(`Cache revalidated for key: ${key}`);
      } catch (error) {
        logger.error(
          `Error revalidating cache for key: ${key}`,
          error as Error,
        );
      } finally {
        this.revalidationQueue.delete(key);
      }
    })();

    this.revalidationQueue.set(key, revalidationPromise);
  }

  /**
   * Invalidate cache by key pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.redis) return 0;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await this.redis.del(keys);
    } catch (error) {
      logger.error("Error invalidating cache pattern", toLoggableError(error), {
        pattern,
      });
      return 0;
    }
  }

  /**
   * Invalidate specific key
   */
  async invalidate(key: string): Promise<number> {
    if (!this.redis) return 0;

    try {
      return await this.redis.del(key);
    } catch (error) {
      logger.error("Error invalidating cache key", toLoggableError(error), { key });
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    if (!this.redis) {
      return {
        totalKeys: 0,
        memoryUsage: "0B",
        hitRate: 0,
      };
    }

    try {
      const info = await this.redis.info("stats");
      const dbsize = await this.redis.dbSize();

      // Parse Redis info
      const hitsStr = this.parseInfoValue(info, "keyspace_hits");
      const missesStr = this.parseInfoValue(info, "keyspace_misses");
      const hits = hitsStr ? parseInt(hitsStr, 10) : 0;
      const misses = missesStr ? parseInt(missesStr, 10) : 0;
      const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;

      return {
        totalKeys: dbsize,
        memoryUsage: this.parseInfoValue(info, "used_memory_human") || "0B",
        hitRate: Math.round(hitRate * 100) / 100,
      };
    } catch (error) {
      logger.error("Error getting cache stats", toLoggableError(error));
      return {
        totalKeys: 0,
        memoryUsage: "0B",
        hitRate: 0,
      };
    }
  }

  private parseInfoValue(info: string, key: string): string | null {
    const match = info.match(new RegExp(`${key}:(.+)`));
    return match ? match[1].trim() : null;
  }

  /**
   * Get the size of the revalidation queue
   */
  getRevalidationQueueSize(): number {
    return this.revalidationQueue.size;
  }
}

// Export singleton instance
export const advancedCache = new AdvancedCacheService(redisClient.getClient());
