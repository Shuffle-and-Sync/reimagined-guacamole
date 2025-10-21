import { Router } from "express";
import { redisClient } from "../services/redis-client";
import { cacheService } from "../services/cache-service";
import { logger } from "../logger";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../auth";
import { generalRateLimit } from "../rate-limiting";
import {
  errorHandlingMiddleware,
  errors,
} from "../middleware/error-handling.middleware";

const { asyncHandler } = errorHandlingMiddleware;
const { AuthorizationError, _ValidationError } = errors;

const router = Router();

// Apply authentication and rate limiting to all cache routes
router.use(isAuthenticated);
router.use(generalRateLimit);

// Admin check utility (reuse from analytics)
const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { storage } = await import("../storage");
    const user = await storage.getUser(userId);
    // In production, implement proper role-based access control
    return user?.email === "admin@shuffleandsync.com";
  } catch (_error) {
    return false;
  }
};

/**
 * Redis and cache health check endpoints (admin only)
 */

/**
 * Check Redis connection and health
 * GET /api/cache/health
 */
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;

    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      throw new AuthorizationError("Admin access required");
    }

    const isHealthy = redisClient.isHealthy();
    const pingResult = await redisClient.ping();
    const stats = await cacheService.getStats();

    const healthStatus = {
      redis: {
        connected: isHealthy,
        ping: pingResult,
        client: redisClient.getClient() !== null,
      },
      cache: {
        stats: stats,
        service: "operational",
      },
      timestamp: new Date().toISOString(),
    };

    if (isHealthy && pingResult) {
      return res.json({
        success: true,
        status: "healthy",
        data: healthStatus,
      });
    } else {
      return res.status(503).json({
        success: false,
        status: "unhealthy",
        data: healthStatus,
      });
    }
  }),
);

/**
 * Get Redis info and statistics
 * GET /api/cache/info
 */
router.get("/info", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }
    const redisInfo = await redisClient.getInfo();
    const cacheStats = await cacheService.getStats();

    return res.json({
      success: true,
      data: {
        redis: {
          info: redisInfo,
          connected: redisClient.isHealthy(),
        },
        cache: {
          stats: cacheStats,
        },
      },
    });
  } catch (error) {
    logger.error("Failed to get cache info", { error });
    return res.status(500).json({
      success: false,
      error: "Failed to get cache info",
    });
  }
});

/**
 * Test cache operations
 * POST /api/cache/test
 */
router.post(
  "/test",
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;

    // Admin-only endpoint with environment check
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      throw new AuthorizationError("Admin access required");
    }

    // Only allow in development/testing environments
    if (process.env.NODE_ENV === "production") {
      throw new AuthorizationError("Cache testing disabled in production");
    }

    const testKey = `cache_test_${Date.now()}`;
    const testValue = { test: "data", timestamp: new Date().toISOString() };

    // Test set operation
    const setResult = await cacheService.set(testKey, testValue, 60);

    // Test get operation
    const getValue = await cacheService.get(testKey);

    // Test exists operation
    const existsResult = await cacheService.exists(testKey);

    // Test delete operation
    const deleteResult = await cacheService.delete(testKey);

    const testResults = {
      set: setResult,
      get: getValue,
      exists: existsResult,
      delete: deleteResult,
      dataMatch: JSON.stringify(getValue) === JSON.stringify(testValue),
    };

    const allPassed =
      setResult &&
      getValue !== null &&
      existsResult &&
      deleteResult &&
      testResults.dataMatch;

    return res.json({
      success: true,
      data: {
        allTestsPassed: allPassed,
        results: testResults,
      },
    });
  }),
);

/**
 * Clear all cache data (use with caution)
 * DELETE /api/cache/clear
 */
router.delete("/clear", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only destructive endpoint with strict environment check
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    // Only allow in development environments - disabled in production
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: "Cache clearing disabled in production",
      });
    }

    // Additional confirmation required
    const confirmHeader = req.headers["x-confirm-cache-clear"];
    if (confirmHeader !== "yes-delete-all-cache") {
      return res.status(400).json({
        success: false,
        error:
          "Add header X-Confirm-Cache-Clear: yes-delete-all-cache to confirm",
      });
    }
    await redisClient.flushAll();

    return res.json({
      success: true,
      message: "Cache cleared successfully",
    });
  } catch (error) {
    logger.error("Failed to clear cache", { error });
    return res.status(500).json({
      success: false,
      error: "Failed to clear cache",
    });
  }
});

export default router;
