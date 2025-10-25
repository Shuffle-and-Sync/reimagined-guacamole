/**
 * Deprecation Middleware
 *
 * Mark endpoints as deprecated with sunset date and alternative endpoint information.
 * This middleware adds deprecation headers to help clients migrate to newer endpoints.
 */

import { logger } from "../logger";
import type { Request, Response, NextFunction } from "express";

/**
 * Mark endpoints as deprecated with sunset date
 *
 * @param sunsetDate - ISO 8601 date string indicating when the endpoint will be removed (e.g., "2024-12-31")
 * @param newEndpoint - Path to the new endpoint that should be used instead
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.get('/api/events/create', deprecated('2024-12-31', '/api/v1/events'), ...);
 * ```
 */
export const deprecated = (sunsetDate: string, newEndpoint: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Set deprecation headers according to RFC 8594
    res.setHeader("Deprecation", "true");
    res.setHeader("Sunset", sunsetDate);
    res.setHeader("Link", `<${newEndpoint}>; rel="alternate"`);

    // Log deprecation usage for monitoring
    logger.warn("Deprecated endpoint called", {
      path: req.path,
      method: req.method,
      client: req.get("User-Agent"),
      ip: req.ip,
      sunsetDate,
      newEndpoint,
    });

    next();
  };
};

/**
 * Default export for backward compatibility
 */
export default { deprecated };
