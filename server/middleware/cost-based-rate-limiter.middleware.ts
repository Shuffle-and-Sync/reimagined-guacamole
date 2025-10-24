/**
 * Cost-Based Rate Limiting Middleware
 *
 * Implements fair usage rate limiting based on API operation cost.
 * Different endpoints have different costs, and users have a quota of "cost points"
 * they can spend within a time window.
 */

import rateLimit from "express-rate-limit";
import { logger } from "../logger";
import type { Request, Response } from "express";

/**
 * Operation cost definition
 */
export interface OperationCost {
  endpoint: string; // Format: "METHOD /path"
  cost: number; // Cost on 1-10 scale
}

/**
 * Predefined operation costs for common endpoints
 * Higher cost = more expensive operation
 */
export const operationCosts: OperationCost[] = [
  // Low cost - simple reads
  { endpoint: "GET /api/v1/events", cost: 1 },
  { endpoint: "GET /api/v1/users/:id", cost: 1 },
  { endpoint: "GET /api/v1/communities", cost: 1 },

  // Medium cost - complex queries
  { endpoint: "GET /api/v1/search", cost: 5 },
  { endpoint: "POST /api/v1/matchmaking/find-players", cost: 5 },
  { endpoint: "GET /api/v1/tournaments", cost: 3 },

  // High cost - analytics and reports
  { endpoint: "POST /api/v1/analytics/report", cost: 10 },
  { endpoint: "GET /api/v1/analytics/dashboard", cost: 8 },
  { endpoint: "POST /api/v1/events/bulk", cost: 7 },
];

/**
 * In-memory quota tracking (in production, use Redis)
 * Maps userId or IP to remaining quota
 */
const quotaStore = new Map<string, { remaining: number; resetAt: number }>();

/**
 * Get the cost for a specific route
 */
function getRouteCost(req: Request): number {
  const route = req.route?.path
    ? `${req.method} ${req.route.path}`
    : `${req.method} ${req.path}`;
  const operation = operationCosts.find((op) => op.endpoint === route);
  return operation?.cost || 1; // Default cost of 1
}

/**
 * Get user identifier for quota tracking
 */
function getUserKey(req: Request): string {
  // Use authenticated user ID if available, otherwise fall back to IP
  const user = (req as any).user;
  return user?.id || req.ip || "anonymous";
}

/**
 * Get remaining quota for a user
 */
function getUserQuota(req: Request, _windowMs: number): number {
  const key = getUserKey(req);
  const now = Date.now();
  const quota = quotaStore.get(key);

  if (!quota || now >= quota.resetAt) {
    // Reset quota if window expired or first request
    return 100; // Default quota of 100 cost points
  }

  return quota.remaining;
}

/**
 * Deduct quota for a user
 */
function deductQuota(req: Request, cost: number, windowMs: number): void {
  const key = getUserKey(req);
  const now = Date.now();
  const quota = quotaStore.get(key);

  if (!quota || now >= quota.resetAt) {
    // Initialize or reset quota
    quotaStore.set(key, {
      remaining: 100 - cost,
      resetAt: now + windowMs,
    });
  } else {
    // Deduct cost from remaining quota
    quota.remaining -= cost;
    quotaStore.set(key, quota);
  }
}

/**
 * Cost-based rate limiter middleware
 *
 * @example
 * ```typescript
 * app.use('/api/v1', costBasedRateLimiter);
 * ```
 */
export const costBasedRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // 100 cost points per minute
  standardHeaders: true,
  legacyHeaders: false,

  // Custom key generator
  keyGenerator: (req: Request): string => {
    return getUserKey(req);
  },

  // Custom skip function for cost-based logic
  skip: (req: Request, _res: Response): boolean => {
    const cost = getRouteCost(req);
    const remaining = getUserQuota(req, 60 * 1000);

    if (remaining < cost) {
      // Not enough quota - don't skip, will be rate limited
      logger.warn("Cost-based rate limit exceeded", {
        user: getUserKey(req),
        cost,
        remaining,
        endpoint: req.path,
      });
      return false;
    }

    // Deduct cost from quota
    deductQuota(req, cost, 60 * 1000);

    // Skip rate limiting - user has enough quota
    return true;
  },

  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response): void => {
    const cost = getRouteCost(req);
    const remaining = getUserQuota(req, 60 * 1000);

    logger.warn("Rate limit exceeded", {
      user: getUserKey(req),
      endpoint: req.path,
      cost,
      remaining,
    });

    res.status(429).json({
      error: "Too Many Requests",
      message: "Cost-based rate limit exceeded. Please try again later.",
      cost,
      remaining,
      retryAfter: 60, // seconds
    });
  },
});

/**
 * Export utilities for testing and monitoring
 */
export const costBasedRateLimitUtils = {
  getRouteCost,
  getUserKey,
  getUserQuota,
  deductQuota,
  quotaStore,
};

/**
 * Default export for backward compatibility
 */
export default costBasedRateLimiter;
