import { Router } from "express";
import { checkDatabaseHealth, DatabaseMonitor } from "@shared/database-unified";
import { toLoggableError } from "@shared/utils/type-guards";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../auth";
import { logger } from "../logger";
import { PerformanceMonitor } from "../middleware/performance.middleware";
import { generalRateLimit } from "../rate-limiting";
import { queryCache } from "../utils/cache.utils";
import { connectionMonitor } from "../utils/connection-monitor";

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
  } catch {
    return false;
  }
};

/**
 * Database health check endpoint with enhanced metrics
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
    const dbMonitor = DatabaseMonitor.getInstance();
    const perfMonitor = PerformanceMonitor.getInstance();
    const cacheStats = queryCache.getStats();
    const connMonitorMetrics = connectionMonitor.getMetrics();
    const connStatistics = connectionMonitor.getStatistics();
    const activeConnections = connectionMonitor.getActiveConnections();
    const connectionAlerts = connectionMonitor.getAlerts(5);

    // Calculate average query time from database stats
    const dbStats = dbMonitor.getStats();
    const queryTimes = Object.values(dbStats).map((stat) => stat.avgTime);
    const averageQueryTime =
      queryTimes.length > 0
        ? queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length
        : 0;

    // Get total query count
    const totalQueries = Object.values(dbStats).reduce(
      (sum, stat) => sum + stat.count,
      0,
    );

    const enhancedHealth = {
      status: health.status,
      timestamp: new Date().toISOString(),
      database: {
        connected: health.status === "healthy",
        queryStats: dbStats,
        slowQueries: dbMonitor.getSlowQueries(500),
        connectionPool: {
          // SQLite uses single connection, but provide structure for monitoring
          note: "SQLite uses single connection model",
          totalConnections: 1,
          idleConnections: 0,
          activeConnections:
            perfMonitor.getMetrics().activeConnections > 0 ? 1 : 0,
          waitingCount: 0,
          maxConnections: 1,
        },
        performance: {
          averageQueryTime: Math.round(averageQueryTime),
          totalQueries,
          cacheHitRate: cacheStats.hitRate,
          queryResponseTime: health.queryResponseTime,
        },
        connectionMonitoring: {
          metrics: connMonitorMetrics,
          statistics: connStatistics,
          activeConnections: activeConnections.slice(0, 10), // Limit to 10 most recent
          recentAlerts: connectionAlerts,
        },
      },
    };

    // Set status to unhealthy if thresholds exceeded
    if (
      enhancedHealth.database.performance.averageQueryTime > 1000 ||
      enhancedHealth.database.connectionPool.waitingCount > 5 ||
      connStatistics.leakCount > 3
    ) {
      enhancedHealth.status = "unhealthy";
      return res.status(503).json(enhancedHealth);
    }

    return res.json({
      success: true,
      ...enhancedHealth,
    });
  } catch (error) {
    logger.error("Database health check failed", toLoggableError(error));
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
          (sum, stat: unknown) => sum + stat.count,
          0,
        ),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get database stats", toLoggableError(error));
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
    logger.error("Failed to reset database stats", toLoggableError(error));
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
    logger.error("Failed to get pool information", toLoggableError(error));
    return res.status(500).json({
      success: false,
      error: "Failed to get pool information",
    });
  }
});

/**
 * Connection monitoring details
 * GET /api/database/connections
 */
router.get("/connections", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    const metrics = connectionMonitor.getMetrics();
    const statistics = connectionMonitor.getStatistics();
    const activeConnections = connectionMonitor.getActiveConnections();
    const alerts = connectionMonitor.getAlerts(20);

    return res.json({
      success: true,
      data: {
        metrics,
        statistics,
        activeConnections,
        alerts,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(
      "Failed to get connection monitoring details",
      toLoggableError(error),
    );
    return res.status(500).json({
      success: false,
      error: "Failed to get connection monitoring details",
    });
  }
});

/**
 * Reset connection monitoring metrics
 * POST /api/database/connections/reset
 */
router.post("/connections/reset", async (req, res) => {
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
        error: "Connection monitoring reset disabled in production",
      });
    }

    connectionMonitor.reset();

    logger.info("Connection monitoring metrics reset", { userId });

    return res.json({
      success: true,
      message: "Connection monitoring metrics reset successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(
      "Failed to reset connection monitoring metrics",
      toLoggableError(error),
    );
    return res.status(500).json({
      success: false,
      error: "Failed to reset connection monitoring metrics",
    });
  }
});

export default router;
