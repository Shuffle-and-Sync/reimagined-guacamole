/**
 * Enhanced Rate Limiting Middleware
 *
 * Provides comprehensive rate limiting functionality with:
 * - Configurable limits per endpoint type (API, authentication, webhooks, etc.)
 * - IP-based and user-based rate limiting
 * - Whitelisted IP support for internal services
 * - JSend-formatted error responses
 * - Automatic header injection for rate limit info
 *
 * Rate limiting is critical for preventing abuse, DDoS attacks, and ensuring
 * fair resource allocation across users. This module provides a standardized
 * interface over express-rate-limit with application-specific configuration.
 *
 * For production deployments with multiple servers, consider using Redis-backed
 * rate limiting (available in rate-limiting.ts) for distributed rate limit tracking.
 *
 * @module RateLimiter
 */

import { Request, Response } from "express";
import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { rateLimitConfig, getWhitelistedIPs } from "../config/rateLimits";
import { logger } from "../logger";
import { ApiResponse } from "../utils/ApiResponse";

/**
 * Create a rate limiter with the specified configuration
 *
 * Creates an Express middleware for rate limiting based on predefined
 * configurations. Automatically skips health checks and whitelisted IPs.
 * Returns JSend-formatted error responses when rate limit is exceeded.
 *
 * @param {keyof typeof rateLimitConfig} configName - Name of the rate limit configuration to use
 * @returns {RateLimitRequestHandler} Express rate limiting middleware
 * @example
 * // Use predefined API rate limiter
 * app.use('/api', createRateLimiter('api'));
 *
 * // Use authentication rate limiter for login endpoint
 * app.post('/auth/login', createRateLimiter('authentication'), loginHandler);
 */
function createRateLimiter(
  configName: keyof typeof rateLimitConfig,
): RateLimitRequestHandler {
  const config = rateLimitConfig[configName];
  const whitelist = getWhitelistedIPs();

  return rateLimit({
    ...config,
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded: ${configName}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        url: req.originalUrl,
        method: req.method,
        userId: (req as Request & { user?: { id: string } }).user?.id,
      });

      // Send JSend-formatted rate limit error
      const response = ApiResponse.fail(
        config.message || "Rate limit exceeded",
        [
          {
            code: "RATE_LIMIT_EXCEEDED",
            message: config.message || "Too many requests",
          },
        ],
      );

      res.status(429).json(response);
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      if (req.path === "/health" || req.path === "/api/health") {
        return true;
      }

      // Skip for whitelisted IPs
      if (whitelist.includes(req.ip || "")) {
        logger.debug(`Rate limit skipped for whitelisted IP: ${req.ip}`);
        return true;
      }

      return false;
    },
  });
}

/**
 * Per-user rate limiting (requires authentication)
 *
 * Creates a rate limiter that tracks limits per authenticated user ID rather
 * than IP address. This provides more accurate rate limiting for authenticated
 * endpoints and prevents users from bypassing limits by changing IPs.
 *
 * Falls back to IP-based limiting for unauthenticated requests.
 *
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of requests allowed in the window
 * @returns {RateLimitRequestHandler} Express rate limiting middleware
 * @example
 * // Limit authenticated users to 100 requests per 15 minutes
 * const userLimiter = createUserRateLimiter(15 * 60 * 1000, 100);
 * app.use('/api/user', requireAuth, userLimiter, userRoutes);
 */
export function createUserRateLimiter(
  windowMs: number,
  max: number,
): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req: Request) => {
      // Use user ID instead of IP
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      return userId || req.ip || "anonymous";
    },
    handler: (req: Request, res: Response) => {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      logger.warn("User rate limit exceeded", {
        userId,
        ip: req.ip,
        url: req.originalUrl,
      });

      const response = ApiResponse.fail("Rate limit exceeded for your account");
      res.status(429).json(response);
    },
  });
}

/**
 * Export rate limiters for different endpoint types
 */
export const rateLimiter = {
  public: createRateLimiter("public"),
  standard: createRateLimiter("standard"),
  strict: createRateLimiter("strict"),
  auth: createRateLimiter("auth"),
  expensive: createRateLimiter("expensive"),
  email: createRateLimiter("email"),
  upload: createRateLimiter("upload"),
  messaging: createRateLimiter("messaging"),
  eventCreation: createRateLimiter("eventCreation"),
};
