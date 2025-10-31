import NodeCache from "node-cache";
import { logger } from "../../logger";

/**
 * Events cache for performance optimization
 * Uses in-memory caching with TTL (Time To Live)
 */
class EventsCache {
  private cache: NodeCache;

  constructor() {
    // Cache for 5 minutes by default, check expired keys every 60 seconds
    const ttl = parseInt(process.env.EVENTS_CACHE_TTL || "300", 10);
    const checkPeriod = parseInt(
      process.env.EVENTS_CACHE_CHECK_PERIOD || "60",
      10,
    );

    this.cache = new NodeCache({
      stdTTL: ttl,
      checkperiod: checkPeriod,
      useClones: true, // Clone objects to prevent cache corruption
    });

    logger.info("Events cache initialized", { ttl, checkPeriod });
  }

  /**
   * Get cached calendar events
   * @param key - Cache key
   * @returns Cached data or undefined
   */
  getCalendarEvents<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set calendar events in cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Optional custom TTL in seconds
   */
  setCalendarEvents<T>(key: string, data: T, ttl?: number): void {
    if (ttl) {
      this.cache.set(key, data, ttl);
    } else {
      this.cache.set(key, data);
    }
  }

  /**
   * Invalidate cache for a specific key or all
   * @param key - Optional specific key to invalidate
   */
  invalidate(key?: string): void {
    if (key) {
      const deleted = this.cache.del(key);
      logger.info("Events cache key invalidated", { key, deleted });
    } else {
      this.cache.flushAll();
      logger.info("Events cache completely flushed");
    }
  }

  /**
   * Invalidate all cache entries that match a pattern
   * @param pattern - Pattern to match (uses includes)
   */
  invalidatePattern(pattern: string): void {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter((key) => key.includes(pattern));

    if (matchingKeys.length > 0) {
      const deleted = this.cache.del(matchingKeys);
      logger.info("Events cache pattern invalidated", {
        pattern,
        matchingKeys: matchingKeys.length,
        deleted,
      });
    }
  }

  /**
   * Generate cache key from filters
   * @param filters - Filter object
   * @returns Cache key string
   */
  generateKey(filters: Record<string, unknown>): string {
    // Sort keys for consistent cache keys
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = filters[key];
          return acc;
        },
        {} as Record<string, unknown>,
      );

    return `calendar:${JSON.stringify(sortedFilters)}`;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }
}

export const eventsCache = new EventsCache();
