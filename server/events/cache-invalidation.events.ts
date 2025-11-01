import { EventEmitter } from "events";
import { logger } from "../logger";
import { advancedCache } from "../services/advanced-cache.service";

export interface CacheInvalidationEvent {
  type: "invalidate" | "invalidate_pattern";
  key?: string;
  pattern?: string;
  reason?: string;
}

/**
 * Cache Invalidation Event Emitter
 *
 * Provides event-driven cache invalidation for automatic
 * cache cleanup when data changes.
 */
class CacheInvalidationEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  private setupListeners() {
    this.on("invalidate", async (event: CacheInvalidationEvent) => {
      try {
        if (event.key) {
          await advancedCache.invalidate(event.key);
          logger.info(`Cache invalidated for key: ${event.key}`, {
            reason: event.reason,
          });
        }
      } catch (error) {
        logger.error("Error invalidating cache", error as Error, { event });
      }
    });

    this.on("invalidate_pattern", async (event: CacheInvalidationEvent) => {
      try {
        if (event.pattern) {
          const count = await advancedCache.invalidatePattern(event.pattern);
          logger.info(`Cache invalidated for pattern: ${event.pattern}`, {
            keysInvalidated: count,
            reason: event.reason,
          });
        }
      } catch (error) {
        logger.error("Error invalidating cache pattern", error as Error, {
          event,
        });
      }
    });
  }

  invalidateKey(key: string, reason?: string) {
    this.emit("invalidate", { type: "invalidate", key, reason });
  }

  invalidatePattern(pattern: string, reason?: string) {
    this.emit("invalidate_pattern", {
      type: "invalidate_pattern",
      pattern,
      reason,
    });
  }
}

export const cacheInvalidation = new CacheInvalidationEmitter();
