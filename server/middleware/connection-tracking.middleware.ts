/**
 * Connection Tracking Middleware
 *
 * Express middleware that tracks database connections for each HTTP request.
 * Helps identify connection leaks and provides per-request connection metrics.
 */

import { randomUUID } from "crypto";
import { logger } from "../logger";
import { connectionMonitor } from "../utils/connection-monitor";
import type { Request, Response, NextFunction } from "express";

interface ConnectionTrackingRequest extends Request {
  connectionId?: string;
  connectionStartTime?: number;
}

/**
 * Middleware to track database connections per request
 */
export function connectionTrackingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const trackingReq = req as ConnectionTrackingRequest;

  // Generate unique connection ID for this request
  const connectionId = randomUUID();
  trackingReq.connectionId = connectionId;
  trackingReq.connectionStartTime = Date.now();

  // Extract request info for tracking
  const endpoint = `${req.method} ${req.path}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (req as any).user?.id || (req as any).userId;

  // Track connection acquisition
  connectionMonitor.track(connectionId, endpoint, userId);

  // Track connection release when response finishes
  const releaseConnection = () => {
    if (trackingReq.connectionStartTime) {
      const duration = Date.now() - trackingReq.connectionStartTime;

      // Log slow requests (> 5 seconds)
      if (duration > 5000) {
        logger.warn("Slow request detected", {
          connectionId,
          endpoint,
          duration,
          statusCode: res.statusCode,
        });
      }
    }

    connectionMonitor.release(connectionId);
  };

  // Release on response finish
  res.on("finish", releaseConnection);

  // Also release on close (connection interrupted)
  res.on("close", () => {
    if (!res.writableEnded) {
      logger.warn("Connection closed before response finished", {
        connectionId,
        endpoint,
      });
      releaseConnection();
    }
  });

  // Handle errors
  const originalNext = next;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrappedNext = (err?: any) => {
    if (err) {
      logger.error("Request error during connection tracking", {
        connectionId,
        endpoint,
        error: err.message,
      });
    }
    originalNext(err);
  };

  wrappedNext();
}

/**
 * Middleware to add connection monitoring headers to responses (optional)
 */
export function connectionMonitoringHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const trackingReq = req as ConnectionTrackingRequest;

  if (trackingReq.connectionId) {
    // Add connection tracking headers for debugging
    if (process.env.NODE_ENV === "development") {
      res.setHeader("X-Connection-Id", trackingReq.connectionId);

      // Add metrics on response finish
      res.on("finish", () => {
        const metrics = connectionMonitor.getMetrics();
        res.setHeader(
          "X-Active-Connections",
          metrics.activeConnections.toString(),
        );
      });
    }
  }

  next();
}

/**
 * Error handler for connection tracking
 */
export function connectionTrackingErrorHandler(
  err: Error,
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const trackingReq = req as ConnectionTrackingRequest;

  if (trackingReq.connectionId) {
    logger.error("Request failed with connection tracking", {
      connectionId: trackingReq.connectionId,
      endpoint: `${req.method} ${req.path}`,
      error: err.message,
      stack: err.stack,
    });
  }

  // Pass to next error handler
  next(err);
}
