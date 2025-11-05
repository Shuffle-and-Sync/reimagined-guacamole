/**
 * Query Logging Middleware
 *
 * Tracks database query counts and performance metrics per request
 * to help identify N+1 query patterns and performance issues.
 */

import { Request, Response, NextFunction } from "express";
import { DatabaseMonitor } from "@shared/database-unified";
import { logger } from "../logger";

// Extended request with query tracking
export interface RequestWithQueryTracking extends Request {
  queryMetrics?: {
    queryCount: number;
    startTime: number;
    queries: Array<{
      operation: string;
      duration: number;
      timestamp: number;
    }>;
  };
}

// Query logging configuration
interface QueryLoggingConfig {
  enabled: boolean;
  logSlowRequests: boolean;
  slowRequestThreshold: number; // ms
  logHighQueryCount: boolean;
  highQueryCountThreshold: number;
  detailedLogging: boolean;
}

const defaultConfig: QueryLoggingConfig = {
  enabled: process.env.NODE_ENV !== "production",
  logSlowRequests: true,
  slowRequestThreshold: 1000, // 1 second
  logHighQueryCount: true,
  highQueryCountThreshold: 10, // More than 10 queries per request
  detailedLogging: process.env.QUERY_LOGGING_DETAILED === "true",
};

let config = { ...defaultConfig };

/**
 * Configure query logging
 */
export function configureQueryLogging(options: Partial<QueryLoggingConfig>) {
  config = { ...config, ...options };
}

/**
 * Middleware to track query counts per request
 */
export function queryLoggingMiddleware(
  req: RequestWithQueryTracking,
  res: Response,
  next: NextFunction,
) {
  if (!config.enabled) {
    return next();
  }

  const dbMonitor = DatabaseMonitor.getInstance();
  const startMetrics = dbMonitor.getStats();
  const startTime = Date.now();

  // Initialize query tracking on request
  req.queryMetrics = {
    queryCount: 0,
    startTime,
    queries: [],
  };

  // Store original query count - sum all operation counts
  const startQueryCount = Object.values(startMetrics).reduce(
    (sum, stat) => sum + stat.count,
    0,
  );

  // Track response
  const originalSend = res.send;
  res.send = function (data: unknown) {
    // Calculate metrics
    const endTime = Date.now();
    const duration = endTime - startTime;
    const endMetrics = dbMonitor.getStats();
    const endQueryCount = Object.values(endMetrics).reduce(
      (sum, stat) => sum + stat.count,
      0,
    );
    const queryCount = endQueryCount - startQueryCount;

    // Update request query metrics
    if (req.queryMetrics) {
      req.queryMetrics.queryCount = queryCount;
    }

    // Log if conditions are met
    const shouldLog =
      (config.logSlowRequests && duration > config.slowRequestThreshold) ||
      (config.logHighQueryCount && queryCount > config.highQueryCountThreshold);

    if (shouldLog) {
      const logData: Record<string, unknown> = {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        queryCount,
        avgQueryTime:
          queryCount > 0 ? `${(duration / queryCount).toFixed(2)}ms` : "0ms",
        statusCode: res.statusCode,
      };

      if (config.detailedLogging) {
        logData.queries = req.queryMetrics?.queries || [];
        logData.dbMetrics = endMetrics;
      }

      if (queryCount > config.highQueryCountThreshold) {
        logger.warn(
          `⚠️  High query count detected (possible N+1): ${queryCount} queries in ${duration}ms`,
          logData,
        );
      } else {
        logger.warn(`🐌 Slow request detected: ${duration}ms`, logData);
      }
    }

    // Add query count to response headers (for debugging)
    if (config.detailedLogging) {
      res.setHeader("X-Query-Count", queryCount.toString());
      res.setHeader("X-Query-Duration", duration.toString());
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Get query metrics for the current request
 */
export function getRequestQueryMetrics(
  req: RequestWithQueryTracking,
): { queryCount: number; duration: number } | null {
  if (!req.queryMetrics) {
    return null;
  }

  return {
    queryCount: req.queryMetrics.queryCount,
    duration: Date.now() - req.queryMetrics.startTime,
  };
}

/**
 * Enable query logging (useful for testing)
 */
export function enableQueryLogging() {
  config.enabled = true;
}

/**
 * Disable query logging
 */
export function disableQueryLogging() {
  config.enabled = false;
}
