/**
 * Example: Adaptive Rate Limiter Usage
 *
 * This file demonstrates various use cases for the Adaptive Rate Limiter.
 * These examples can be integrated into your Express routes or WebSocket handlers.
 *
 * NOTE: This is an example file for documentation purposes.
 * Some type assertions use 'any' for simplicity - use proper types in production code.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Router, Request, Response, NextFunction } from "express";
import { WebSocket } from "ws";
import {
  AdaptiveRateLimiter,
  MessagePriority,
  UserType,
  defaultAdaptiveRateLimiter,
} from "../utils/adaptive-rate-limiter";

// ============================================================================
// Example 3: WebSocket Rate Limiting
// ============================================================================

// ============================================================================
// Example 1: Basic Express Middleware Integration
// ============================================================================

const apiRateLimiter = new AdaptiveRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  burstAllowance: 20, // +20 for bursts
});

/**
 * Express middleware for adaptive rate limiting
 */
export function createAdaptiveRateLimitMiddleware(
  priority: MessagePriority = "normal",
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Determine user type
    const user = (req as any).user;
    const userType: UserType = user?.isPremium
      ? "premium"
      : user
        ? "authenticated"
        : "anonymous";

    // Generate rate limit key (prefer user ID, fallback to IP)
    const key = user?.id || req.ip || "unknown";

    // Check if request is allowed
    const allowed = apiRateLimiter.isAllowed(key, userType, priority);

    if (!allowed) {
      // Get status for detailed error response
      const status = apiRateLimiter.getStatus(key, userType, priority);

      return res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        details: {
          limit: status.limit,
          remaining: 0,
          resetAt: new Date(status.resetAt).toISOString(),
          retryAfter: Math.ceil((status.resetAt - Date.now()) / 1000),
        },
        serverLoad: {
          factor: status.loadFactor,
          status:
            status.loadFactor > 0.8
              ? "high"
              : status.loadFactor > 0.6
                ? "medium"
                : "normal",
        },
      });
    }

    // Add rate limit headers
    const status = apiRateLimiter.getStatus(key, userType, priority);
    res.setHeader("X-RateLimit-Limit", status.limit.toString());
    res.setHeader("X-RateLimit-Remaining", status.remaining.toString());
    res.setHeader("X-RateLimit-Reset", new Date(status.resetAt).toISOString());
    res.setHeader("X-Server-Load", status.loadFactor.toFixed(2));

    next();
  };
}

// ============================================================================
// Example 2: Route-Specific Rate Limiting
// ============================================================================

const router = Router();

// High-priority endpoint (e.g., critical system operations)
router.post(
  "/api/critical-operation",
  createAdaptiveRateLimitMiddleware("high"),
  (req, res) => {
    res.json({ message: "Critical operation completed" });
  },
);

// Standard endpoint with normal priority
router.get(
  "/api/data",
  createAdaptiveRateLimitMiddleware("normal"),
  (req, res) => {
    res.json({ data: "some data" });
  },
);

// Background task endpoint with low priority
router.post(
  "/api/analytics",
  createAdaptiveRateLimitMiddleware("low"),
  (req, res) => {
    res.json({ message: "Analytics queued" });
  },
);

export function setupWebSocketRateLimiting(wss: any) {
  wss.on("connection", (ws: WebSocket, req: Request) => {
    const connectionId =
      req.headers["sec-websocket-key"] || req.socket.remoteAddress || "unknown";

    ws.on("message", (data: string) => {
      try {
        const message = JSON.parse(data);
        const priority: MessagePriority = message.priority || "normal";

        // Check rate limit
        const allowed = defaultAdaptiveRateLimiter.isAllowed(
          connectionId,
          "authenticated", // Assume authenticated for WebSocket
          priority,
        );

        if (!allowed) {
          const status = defaultAdaptiveRateLimiter.getStatus(
            connectionId,
            "authenticated",
            priority,
          );

          ws.send(
            JSON.stringify({
              type: "rate_limit_error",
              error: "Rate limit exceeded",
              resetAt: status.resetAt,
              loadFactor: status.loadFactor,
            }),
          );
          return;
        }

        // Process the message
        handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      // Optional: Clean up rate limit data
      defaultAdaptiveRateLimiter.reset(connectionId);
    });
  });
}

function handleWebSocketMessage(ws: WebSocket, message: any) {
  // Your WebSocket message handling logic
  ws.send(JSON.stringify({ type: "ack", messageId: message.id }));
}

// ============================================================================
// Example 4: Monitoring Dashboard Endpoint
// ============================================================================

router.get(
  "/api/admin/rate-limit-stats",
  // Add authentication middleware here
  (req, res) => {
    const stats = apiRateLimiter.getStats();
    const serverLoad = apiRateLimiter.getServerLoad();

    res.json({
      rateLimiter: {
        activeEntries: stats.activeEntries,
        config: {
          windowMs: stats.config.windowMs,
          maxRequests: stats.config.maxRequests,
          burstAllowance: stats.config.burstAllowance,
        },
      },
      serverLoad: {
        factor: serverLoad.loadFactor,
        status:
          serverLoad.loadFactor > 0.8
            ? "critical"
            : serverLoad.loadFactor > 0.6
              ? "warning"
              : "healthy",
        memoryUsagePercent: serverLoad.memoryUsagePercent.toFixed(2),
        activeConnections: serverLoad.activeConnections,
        avgResponseTime: serverLoad.averageResponseTime,
      },
      recommendations: {
        limitMultiplier:
          serverLoad.loadFactor > 0.8
            ? 0.5
            : serverLoad.loadFactor > 0.6
              ? 0.75
              : 1.0,
        blockLowPriority: serverLoad.loadFactor > 0.7,
      },
    });
  },
);

// ============================================================================
// Example 5: Custom Rate Limiter for Different Endpoints
// ============================================================================

// Strict rate limiter for auth endpoints
const authRateLimiter = new AdaptiveRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Only 5 attempts
  burstAllowance: 2, // +2 for edge cases
  loadThresholds: {
    high: 0.7, // More aggressive under load
    medium: 0.5,
    blockLowPriority: 0.6,
  },
});

// Lenient rate limiter for read-only endpoints
const readOnlyRateLimiter = new AdaptiveRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 200, // 200 reads per minute
  burstAllowance: 50, // Generous burst
  userTypeLimits: {
    anonymous: 0.3, // 60 requests for anonymous
    authenticated: 1.0, // 200 requests for authenticated
    premium: 2.0, // 400 requests for premium
  },
});

// ============================================================================
// Example 6: Dynamic Priority Assignment
// ============================================================================

function getDynamicPriority(req: Request): MessagePriority {
  const user = (req as any).user;

  // Admins get high priority
  if (user?.role === "admin") {
    return "high";
  }

  // Premium users get normal priority for all operations
  if (user?.isPremium) {
    return "normal";
  }

  // Assign priority based on endpoint type
  if (req.path.includes("/critical")) {
    return "high";
  }

  if (req.path.includes("/analytics") || req.path.includes("/background")) {
    return "low";
  }

  return "normal";
}

// Use dynamic priority in middleware
router.use("/api/*", (req, res, next) => {
  const priority = getDynamicPriority(req);
  return createAdaptiveRateLimitMiddleware(priority)(req, res, next);
});

// ============================================================================
// Example 7: Graceful Degradation
// ============================================================================

router.get(
  "/api/feature",
  createAdaptiveRateLimitMiddleware("normal"),
  async (req, res) => {
    const serverLoad = apiRateLimiter.getServerLoad();

    // Provide degraded response under high load
    if (serverLoad.loadFactor > 0.8) {
      return res.json({
        data: getCachedData(), // Return cached data
        degraded: true,
        message: "Using cached data due to high server load",
      });
    }

    // Full response under normal load
    const data = await fetchFreshData();
    res.json({ data, degraded: false });
  },
);

function getCachedData() {
  return { cached: true, timestamp: new Date() };
}

async function fetchFreshData() {
  return { fresh: true, timestamp: new Date() };
}

// ============================================================================
// Example 8: Cleanup and Maintenance
// ============================================================================

// Set up periodic cleanup for custom rate limiters
setInterval(
  () => {
    apiRateLimiter.cleanup();
    authRateLimiter.cleanup();
    readOnlyRateLimiter.cleanup();

    // Log cleanup completion (use logger.info in production)
    // console.log('Rate limiter cleanup completed', {
    //   apiEntries: apiRateLimiter.getStats().activeEntries,
    //   authEntries: authRateLimiter.getStats().activeEntries,
    //   readOnlyEntries: readOnlyRateLimiter.getStats().activeEntries,
    // });
  },
  5 * 60 * 1000,
); // Every 5 minutes

// Clean up on process termination
process.on("SIGTERM", () => {
  apiRateLimiter.cleanup();
  authRateLimiter.cleanup();
  readOnlyRateLimiter.cleanup();
});

export { router, apiRateLimiter, authRateLimiter, readOnlyRateLimiter };
