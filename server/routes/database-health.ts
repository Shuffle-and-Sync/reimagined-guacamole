import { Router } from "express";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../auth";
import { generalRateLimit } from "../rate-limiting";
import { checkDatabaseHealth, DatabaseMonitor } from "@shared/database-unified";
import { logger } from "../logger";

const router = Router();

// Apply authentication and rate limiting to all database health routes
router.use(isAuthenticated);
router.use(generalRateLimit);

// Admin check utility
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
 * Database health check endpoint
 * GET /api/database/health
 */
router.get("/health", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    const health = await checkDatabaseHealth();

    return res.json({
      success: true,
      database: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Database health check failed", error);
    return res.status(500).json({
      success: false,
      error: "Health check failed",
    });
  }
});

/**
 * Database performance statistics
 * GET /api/database/stats
 */
router.get("/stats", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    const monitor = DatabaseMonitor.getInstance();
    const allStats = monitor.getStats();
    const slowQueries = monitor.getSlowQueries(500); // Queries >500ms

    // SQLite uses a single connection model, no connection pool
    const poolStats = {
      note: "SQLite uses single connection, pool stats not applicable",
    };

    return res.json({
      success: true,
      stats: {
        pool: poolStats,
        queries: allStats,
        slowQueries,
        queryCount: Object.values(allStats).reduce(
          (sum, stat: any) => sum + stat.count,
          0,
        ),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get database stats", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get database statistics",
    });
  }
});

/**
 * Reset performance statistics
 * POST /api/database/reset-stats
 */
router.post("/reset-stats", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint with environment check
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    // Only allow in development/testing environments
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: "Statistics reset disabled in production",
      });
    }

    const monitor = DatabaseMonitor.getInstance();
    monitor.reset();

    logger.info("Database performance statistics reset", { userId });

    return res.json({
      success: true,
      message: "Performance statistics reset successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to reset database stats", error);
    return res.status(500).json({
      success: false,
      error: "Failed to reset statistics",
    });
  }
});

/**
 * Database connection pool information
 * GET /api/database/pool
 */
router.get("/pool", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    // SQLite uses a single connection model, no connection pool
    const poolInfo = {
      note: "SQLite uses single connection, pool configuration not applicable",
      databaseType: "SQLite Cloud",
    };

    return res.json({
      success: true,
      pool: poolInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get pool information", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get pool information",
    });
  }
});

export default router;
