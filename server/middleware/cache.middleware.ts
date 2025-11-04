/**
 * Cache Middleware
 *
 * This module provides Express middleware for caching HTTP responses
 * to reduce database load and improve API response times.
 */

import { Request, Response, NextFunction } from "express";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { queryCache, generateCacheKey } from "../utils/cache.utils";

export interface CacheMiddlewareOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string; // Prefix for cache keys
  cacheControl?: string; // Cache-Control header value
  varyByUser?: boolean; // Include user ID in cache key
  varyByQuery?: boolean; // Include query params in cache key
}

/**
 * Create a cache middleware for GET requests
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = "route",
    cacheControl = "private, max-age=300",
    varyByUser = false,
    varyByQuery = true,
  } = options;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    try {
      // Generate cache key based on request
      const keyParams: Record<string, unknown> = {
        path: req.path,
      };

      if (varyByQuery) {
        keyParams.query = req.query;
      }

      if (varyByUser && req.user?.id) {
        keyParams.userId = req.user.id;
      }

      const cacheKey = generateCacheKey(keyPrefix, keyParams);

      // Try to get from cache
      const cachedResponse = await queryCache.get<{
        status: number;
        data: unknown;
        headers: Record<string, string>;
      }>(cacheKey);

      if (cachedResponse) {
        // Serve from cache
        res.setHeader("X-Cache-Hit", "true");
        res.setHeader("Cache-Control", cacheControl);

        // Set any cached headers
        if (cachedResponse.headers) {
          Object.entries(cachedResponse.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
        }

        res.status(cachedResponse.status).json(cachedResponse.data);
        return;
      }

      // Cache miss - intercept response
      res.setHeader("X-Cache-Hit", "false");

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data: unknown): Response {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseToCache = {
            status: res.statusCode,
            data,
            headers: {
              "Content-Type":
                (res.getHeader("Content-Type") as string) || "application/json",
            },
          };

          // Cache asynchronously (don't block response)
          queryCache.set(cacheKey, responseToCache, ttl).catch((error) => {
            logger.error("Failed to cache response", toLoggableError(error), {
              cacheKey,
            });
          });

          res.setHeader("Cache-Control", cacheControl);
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error("Cache middleware error", toLoggableError(error), {
        path: req.path,
      });
      // Continue without caching on error
      next();
    }
  };
}

/**
 * Middleware to invalidate cache based on route patterns
 */
export function invalidateCacheMiddleware(patterns: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful response
    res.json = function (data: unknown): Response {
      // Only invalidate on successful mutations
      if (
        (req.method === "POST" ||
          req.method === "PUT" ||
          req.method === "PATCH" ||
          req.method === "DELETE") &&
        res.statusCode >= 200 &&
        res.statusCode < 300
      ) {
        // Invalidate cache patterns asynchronously
        Promise.all(
          patterns.map((pattern) => queryCache.invalidate(pattern)),
        ).catch((error) => {
          logger.error("Failed to invalidate cache", toLoggableError(error), {
            patterns,
          });
        });
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Create cache middleware for specific resources
 */
export const cacheStrategies = {
  /**
   * Cache for user profile data (5 minutes)
   */
  userProfile: () =>
    cacheMiddleware({
      ttl: 300,
      keyPrefix: "user-profile",
      varyByUser: true,
      varyByQuery: false,
      cacheControl: "private, max-age=300",
    }),

  /**
   * Cache for community data (10 minutes)
   */
  community: () =>
    cacheMiddleware({
      ttl: 600,
      keyPrefix: "community",
      varyByUser: false,
      varyByQuery: true,
      cacheControl: "public, max-age=600",
    }),

  /**
   * Cache for event listings (2 minutes)
   */
  events: () =>
    cacheMiddleware({
      ttl: 120,
      keyPrefix: "events",
      varyByUser: false,
      varyByQuery: true,
      cacheControl: "public, max-age=120",
    }),

  /**
   * Cache for static/reference data (30 minutes)
   */
  staticData: () =>
    cacheMiddleware({
      ttl: 1800,
      keyPrefix: "static",
      varyByUser: false,
      varyByQuery: true,
      cacheControl: "public, max-age=1800",
    }),

  /**
   * Short cache for frequently changing data (30 seconds)
   */
  shortLived: () =>
    cacheMiddleware({
      ttl: 30,
      keyPrefix: "short",
      varyByUser: false,
      varyByQuery: true,
      cacheControl: "public, max-age=30",
    }),
};

/**
 * Cache invalidation strategies for mutations
 */
export const cacheInvalidation = {
  /**
   * Invalidate user-related cache
   */
  user: () => invalidateCacheMiddleware(["user-profile"]),

  /**
   * Invalidate community-related cache
   */
  community: () => invalidateCacheMiddleware(["community"]),

  /**
   * Invalidate event-related cache
   */
  events: () => invalidateCacheMiddleware(["events"]),

  /**
   * Invalidate all caches (use sparingly)
   */
  all: () => async (_req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = function (data: unknown): Response {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        queryCache.flush().catch((error) => {
          logger.error("Failed to flush cache", toLoggableError(error));
        });
      }
      return originalJson(data);
    };
    next();
  },
};
