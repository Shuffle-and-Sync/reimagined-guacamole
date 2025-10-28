import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";
import { cacheService } from "../services/cache-service";
import { AuthenticatedRequest } from "../types";

/**
 * Cache middleware for API responses
 */
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
  skipCacheIf?: (req: Request, res: Response) => boolean;
}

/**
 * Express middleware for caching API responses
 */
export function cacheMiddleware(
  options: CacheOptions = {},
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const {
    ttl = 60, // Default 1 minute
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false,
    skipCacheIf = () => false,
  } = options;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Skip caching for non-GET requests
      if (req.method !== "GET") {
        return next();
      }

      // Skip if cache is disabled for this request
      if (skipCache(req)) {
        return next();
      }

      const cacheKey = keyGenerator(req);

      // Try to get cached response
      const cachedResponse = await cacheService.get(cacheKey);

      if (cachedResponse) {
        logger.debug("Cache hit", { cacheKey, path: req.path });

        // Set cache headers
        res.set("X-Cache", "HIT");
        res.set("Cache-Control", `public, max-age=${ttl}`);

        return res.json(cachedResponse);
      }

      // Cache miss - intercept response
      logger.debug("Cache miss", { cacheKey, path: req.path });

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (body: unknown) {
        // Check if we should skip caching this response
        if (
          !skipCacheIf(req, res) &&
          res.statusCode >= 200 &&
          res.statusCode < 300
        ) {
          // Cache successful responses only
          cacheService.set(cacheKey, body, ttl).catch((error) => {
            logger.error("Failed to cache response", { cacheKey, error });
          });
        }

        // Set cache headers
        res.set("X-Cache", "MISS");
        res.set("Cache-Control", `public, max-age=${ttl}`);

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error("Cache middleware error", { error, path: req.path });
      next(); // Continue without caching on error
    }
  };
}

/**
 * Default cache key generator
 */
function defaultKeyGenerator(req: Request): string {
  const baseUrl = req.baseUrl || "";
  const path = req.path || "";
  const query = JSON.stringify(req.query || {});
  const userId = (req as Partial<AuthenticatedRequest>).user?.id || "anonymous";

  return `api:${baseUrl}${path}:${userId}:${Buffer.from(query).toString("base64")}`;
}

/**
 * Cache invalidation middleware
 */
export function invalidateCacheMiddleware(
  patterns: string[],
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to invalidate cache after successful response
      res.json = function (body: unknown) {
        // Invalidate cache patterns after successful mutations
        if (res.statusCode >= 200 && res.statusCode < 300) {
          Promise.all(
            patterns.map((pattern) => cacheService.deletePattern(pattern)),
          ).catch((error) => {
            logger.error("Failed to invalidate cache", { patterns, error });
          });
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error("Cache invalidation middleware error", { error, patterns });
      next();
    }
  };
}

/**
 * Predefined cache configurations
 */
export const cacheConfigs = {
  // Short-lived cache for frequently changing data
  shortCache: {
    ttl: 30, // 30 seconds
    skipCacheIf: (req: Request, res: Response) => res.statusCode !== 200,
  },

  // Medium cache for relatively stable data
  mediumCache: {
    ttl: 300, // 5 minutes
    skipCacheIf: (req: Request, res: Response) => res.statusCode !== 200,
  },

  // Long cache for rarely changing data
  longCache: {
    ttl: 1800, // 30 minutes
    skipCacheIf: (req: Request, res: Response) => res.statusCode !== 200,
  },

  // User-specific cache
  userCache: {
    ttl: 300, // 5 minutes
    keyGenerator: (req: Request) => {
      const userId =
        (req as Partial<AuthenticatedRequest>).user?.id || "anonymous";
      const path = req.path;
      const query = JSON.stringify(req.query);
      return `user:${userId}:${path}:${Buffer.from(query).toString("base64")}`;
    },
  },

  // Analytics cache
  analyticsCache: {
    ttl: 60, // 1 minute for analytics
    keyGenerator: (req: Request) => {
      const path = req.path;
      const query = JSON.stringify(req.query);
      return `analytics:${path}:${Buffer.from(query).toString("base64")}`;
    },
  },
};
