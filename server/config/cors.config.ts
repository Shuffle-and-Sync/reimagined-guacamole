/**
 * CORS Configuration Module
 *
 * Provides environment-based CORS management with type-safe configuration.
 * Supports different configurations for development, staging, and production.
 */

import { CorsOptions } from "cors";
import { logger } from "../logger";

/**
 * Get allowed origins from environment variables
 * Falls back to development defaults if not configured
 */
export function getAllowedOrigins(): string[] {
  const originsEnv =
    process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || "";

  if (!originsEnv) {
    // Default for development
    if (process.env.NODE_ENV !== "production") {
      logger.warn("CORS_ORIGINS not set, using development defaults");
      return [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5000",
      ];
    }

    // Require explicit configuration in production
    throw new Error(
      "CORS_ORIGINS environment variable must be set in production",
    );
  }

  // Parse comma-separated origins
  const origins = originsEnv
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  logger.info("CORS origins configured", { origins, count: origins.length });

  return origins;
}

/**
 * Create CORS configuration for production use
 * Enforces strict origin checking
 */
export function createCorsConfig(): CorsOptions {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn("CORS request blocked", {
          origin,
          allowedOrigins,
        });
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: process.env.CORS_ALLOW_CREDENTIALS !== "false",
    methods: (
      process.env.CORS_METHODS || "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    ).split(","),
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Request-ID",
      "X-API-Key",
      "Accept",
      "Origin",
    ],
    exposedHeaders: [
      "X-Request-ID",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    maxAge: parseInt(process.env.CORS_MAX_AGE || "86400", 10),
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
}

/**
 * Create permissive CORS configuration for development
 * WARNING: Only use in development environments
 *
 * Note: CodeQL may flag this as overly permissive, but this is intentional
 * for development. Production uses createCorsConfig() with strict origin checking.
 */
export function createDevCorsConfig(): CorsOptions {
  logger.warn("Using permissive CORS configuration for development");

  return {
    origin: true, // Allow all origins (development only)
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Request-ID",
    ],
    exposedHeaders: ["X-Request-ID"],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
}

/**
 * Validate CORS configuration on startup
 * Throws error if configuration is invalid
 */
export function validateCorsConfig(): void {
  try {
    const origins = getAllowedOrigins();

    if (origins.length === 0) {
      throw new Error("No CORS origins configured");
    }

    // Validate each origin is a valid URL
    origins.forEach((origin) => {
      try {
        new URL(origin);
      } catch {
        throw new Error(`Invalid CORS origin: ${origin}`);
      }
    });

    logger.info("CORS configuration validated", {
      originsCount: origins.length,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    logger.error("CORS configuration validation failed", { error });
    throw error;
  }
}
