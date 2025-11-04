import { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "./logger";
import { storage } from "./storage";

/**
 * Rate limiter for health check endpoint
 * Public endpoint but rate limited to prevent abuse
 */
export const healthCheckRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    error: "Too many health check requests",
    message: "Please try again in a moment",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function healthCheck(_req: Request, res: Response) {
  const startTime = Date.now();

  try {
    // Test database connection
    await storage.getCommunities();

    const responseTime = Date.now() - startTime;

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: "operational",
        responseTime: `${responseTime}ms`,
      },
      uptime: process.uptime(),
    });
  } catch (error) {
    logger.error("Health check failed", toLoggableError(error));
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    });
  }
}
