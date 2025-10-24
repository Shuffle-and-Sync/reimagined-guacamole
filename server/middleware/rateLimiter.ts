/**
 * Enhanced Rate Limiting Middleware
 *
 * Provides rate limiting with JSend-formatted responses
 * Note: Redis support is available in the existing rate-limiting.ts for production use
 * This module provides a simplified, standardized interface
 */

import { Request, Response } from "express";
import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { rateLimitConfig, getWhitelistedIPs } from "../config/rateLimits";
import { logger } from "../logger";
import { ApiResponse } from "../utils/ApiResponse";

/**
 * Create a rate limiter with the specified configuration
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
 * Uses user ID instead of IP for better accuracy
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
