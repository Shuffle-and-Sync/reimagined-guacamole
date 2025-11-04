/**
 * Error Tracking Service - Sentry Integration
 *
 * Provides centralized error tracking and monitoring using Sentry.
 * Automatically captures errors, exceptions, and performance metrics.
 */

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";

/**
 * Initialize Sentry error tracking
 * Should be called early in application startup
 */
export function initializeSentry(): void {
  const sentryDsn = process.env.SENTRY_DSN;

  // Only initialize if DSN is configured
  if (!sentryDsn) {
    logger.info("Sentry DSN not configured - error tracking disabled");
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || "development",

      // Release tracking for better error grouping
      release: process.env.npm_package_version || "1.0.0",

      // Set sample rate for performance monitoring
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

      // Set sample rate for profiling
      profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

      // Enable profiling integration
      integrations: [nodeProfilingIntegration()],

      // Configure what data to send
      beforeSend(event) {
        // Filter out sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers["authorization"];
            delete event.request.headers["cookie"];
          }

          // Remove sensitive query parameters
          if (
            event.request.query_string &&
            typeof event.request.query_string === "string"
          ) {
            event.request.query_string = event.request.query_string
              .replace(/token=[^&]*/g, "token=[REDACTED]")
              .replace(/api_key=[^&]*/g, "api_key=[REDACTED]")
              .replace(/apikey=[^&]*/g, "apikey=[REDACTED]");
          }
        }

        // Add custom context
        event.tags = {
          ...event.tags,
          service: "shuffle-and-sync",
        };

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        /extensions\//i,
        /^Non-Error/,
        // Network errors that are user-side issues
        "Network request failed",
        "NetworkError",
      ],
    });

    logger.info("Sentry error tracking initialized", {
      environment: process.env.NODE_ENV,
      release: process.env.npm_package_version,
      sampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
  } catch (error) {
    logger.error("Failed to initialize Sentry", toLoggableError(error));
  }
}

/**
 * Express error handler middleware for Sentry
 * Should be added before other error handlers but after all routes
 */
export function sentryErrorHandler(): ErrorRequestHandler {
  return (err: unknown, req: Request, res: Response, next: NextFunction) => {
    // Capture error in Sentry
    Sentry.captureException(err);

    // Pass to next error handler
    next(err);
  };
}

/**
 * Express request handler middleware for Sentry
 * Should be added early in the middleware chain
 */
export function sentryRequestHandler() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set request context for Sentry
    Sentry.setContext("request", {
      url: req.url,
      method: req.method,
      headers: {
        "user-agent": req.get("User-Agent"),
      },
      query: req.query,
    });

    next();
  };
}

/**
 * Express tracing middleware for performance monitoring
 * Should be added early in the middleware chain
 */
export function sentryTracingHandler() {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Start span for request tracing
    Sentry.startSpan(
      {
        op: "http.server",
        name: `${req.method} ${req.path}`,
      },
      () => {
        next();
      },
    );
  };
}

/**
 * Manually capture an exception
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>,
): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      // Add extra context
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  });
}

/**
 * Manually capture a message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, unknown>,
): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureMessage(message, level);
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
}): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level: "info",
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a span for performance monitoring
 */
export function startSpan(
  name: string,
  op: string,
  callback: () => void,
): void {
  if (!process.env.SENTRY_DSN) {
    callback();
    return;
  }

  Sentry.startSpan(
    {
      name,
      op,
    },
    callback,
  );
}

/**
 * Middleware to track user context from authenticated requests
 */
export function trackUserMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!process.env.SENTRY_DSN) {
    return next();
  }

  // Extract user from request if available
  const user = (req as any).user;
  if (user) {
    setUserContext({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }

  // Clear user context on response
  res.on("finish", () => {
    if (user) {
      clearUserContext();
    }
  });

  next();
}

/**
 * Flush pending events to Sentry
 * Useful for graceful shutdown
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  if (!process.env.SENTRY_DSN) {
    return true;
  }

  try {
    const result = await Sentry.close(timeout);
    logger.info("Sentry events flushed successfully");
    return result;
  } catch (error) {
    logger.error("Failed to flush Sentry events", toLoggableError(error));
    return false;
  }
}

// Export Sentry for advanced usage
export { Sentry };
