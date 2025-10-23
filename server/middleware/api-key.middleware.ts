import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

/**
 * API Key Authentication Middleware
 * Protects sensitive endpoints (metrics, status, admin) with API key authentication
 */

/**
 * Authenticate requests using API key in X-API-Key header
 * Uses timing-safe comparison to prevent timing attacks
 */
export function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || typeof apiKey !== "string") {
    logger.warn("API key missing", {
      ip: req.ip,
      path: req.path,
      userAgent: req.get("user-agent"),
    });
    res.status(401).json({ error: "API key required" });
    return;
  }

  const validApiKey = process.env.MONITORING_API_KEY;
  if (!validApiKey) {
    logger.error("MONITORING_API_KEY not configured");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  // Timing-safe comparison to prevent timing attacks
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(apiKey),
      Buffer.from(validApiKey),
    );

    if (!isValid) {
      logger.warn("Invalid API key attempt", {
        ip: req.ip,
        path: req.path,
        userAgent: req.get("user-agent"),
      });
      res.status(401).json({ error: "Invalid API key" });
      return;
    }

    next();
  } catch (error) {
    // Buffer length mismatch will throw an error
    logger.warn("API key validation error", {
      ip: req.ip,
      path: req.path,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    res.status(401).json({ error: "Invalid API key" });
    return;
  }
}

/**
 * Optional API key authentication
 * Allows access without API key but sets a flag if authenticated
 */
export function optionalApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || typeof apiKey !== "string") {
    // No API key provided, continue without authentication
    (req as any).isApiAuthenticated = false;
    next();
    return;
  }

  const validApiKey = process.env.MONITORING_API_KEY;
  if (!validApiKey) {
    (req as any).isApiAuthenticated = false;
    next();
    return;
  }

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(apiKey),
      Buffer.from(validApiKey),
    );

    (req as any).isApiAuthenticated = isValid;
    next();
  } catch (error) {
    (req as any).isApiAuthenticated = false;
    next();
  }
}
