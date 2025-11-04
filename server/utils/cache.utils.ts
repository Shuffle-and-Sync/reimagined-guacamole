/**
 * Query Cache Utilities
 *
 * This module provides caching utilities for database query results
 * to improve performance for frequently accessed data (hot paths).
 */

import NodeCache from "node-cache";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  checkperiod?: number; // Check for expired keys every X seconds
  maxKeys?: number; // Maximum number of keys to store
}

export class QueryCache {
  private static instance: QueryCache;
  private cache: NodeCache;
  private hitCount = 0;
  private missCount = 0;

  private constructor(options?: CacheOptions) {
    this.cache = new NodeCache({
      stdTTL: options?.ttl || 300, // 5 minutes default TTL
      checkperiod: options?.checkperiod || 60, // Check for expired keys every 60s
      useClones: false, // Better performance, be careful with mutations
      maxKeys: options?.maxKeys || 1000, // Limit cache size
    });

    // Log cache events in development
    if (process.env.NODE_ENV === "development") {
      this.cache.on("set", (key) => {
        logger.debug("Cache set", { key });
      });
      this.cache.on("expired", (key) => {
        logger.debug("Cache key expired", { key });
      });
    }
  }

  public static getInstance(options?: CacheOptions): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache(options);
    }
    return QueryCache.instance;
  }

  /**
   * Get a value from cache
   */
  public async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = this.cache.get<T>(key);
      if (value !== undefined) {
        this.hitCount++;
        logger.debug("Cache hit", { key });
        return value;
      }
      this.missCount++;
      logger.debug("Cache miss", { key });
      return undefined;
    } catch (error) {
      logger.error("Cache get error", toLoggableError(error), {
        key,
      });
      return undefined;
    }
  }

  /**
   * Set a value in cache
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const success = this.cache.set(key, value, ttl || 0);
      if (!success) {
        logger.warn("Failed to set cache value", { key });
      }
      return success;
    } catch (error) {
      logger.error("Cache set error", toLoggableError(error), {
        key,
      });
      return false;
    }
  }

  /**
   * Get or set a value in cache (wrapper for query functions)
   */
  public async getOrSet<T>(
    key: string,
    queryFunction: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Execute query and cache result
    try {
      const result = await queryFunction();
      await this.set(key, result, ttl);
      return result;
    } catch (error) {
      logger.error("Query function error in getOrSet", toLoggableError(error), {
        key,
      });
      throw error;
    }
  }

  /**
   * Delete a value from cache
   */
  public async del(key: string): Promise<void> {
    try {
      this.cache.del(key);
    } catch (error) {
      logger.error("Cache delete error", toLoggableError(error), {
        key,
      });
    }
  }

  /**
   * Delete multiple keys from cache
   */
  public async delMany(keys: string[]): Promise<void> {
    try {
      this.cache.del(keys);
    } catch (error) {
      logger.error("Cache delete many error", toLoggableError(error), { keys });
    }
  }

  /**
   * Invalidate cache keys matching a pattern
   */
  public async invalidate(pattern: string): Promise<void> {
    try {
      const keys = this.cache.keys();
      const matchingKeys = keys.filter((key) => key.includes(pattern));
      if (matchingKeys.length > 0) {
        this.cache.del(matchingKeys);
        logger.info("Cache invalidated", {
          pattern,
          count: matchingKeys.length,
        });
      }
    } catch (error) {
      logger.error("Cache invalidate error", toLoggableError(error), {
        pattern,
      });
    }
  }

  /**
   * Clear all cache entries
   */
  public async flush(): Promise<void> {
    try {
      this.cache.flushAll();
      logger.info("Cache flushed");
    } catch (error) {
      logger.error("Cache flush error", toLoggableError(error));
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    hits: number;
    misses: number;
    hitRate: number;
    keys: number;
  } {
    const total = this.hitCount + this.missCount;
    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: total > 0 ? (this.hitCount / total) * 100 : 0,
      keys: this.cache.keys().length,
    };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }
}

/**
 * Helper function to generate cache keys
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, unknown>,
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${JSON.stringify(params[key])}`)
    .join("|");
  return `${prefix}:${sortedParams}`;
}

/**
 * Default cache instance
 */
export const queryCache = QueryCache.getInstance();
