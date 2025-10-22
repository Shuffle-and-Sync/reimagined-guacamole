import { Router } from "express";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../auth";
import { generalRateLimit } from "../rate-limiting";
import { monitoringService } from "../services/monitoring-service";
import { logger } from "../logger";

const router = Router();

// Apply authentication and rate limiting to all monitoring routes
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
 * Get monitoring system status and overview
 * GET /api/monitoring/status
 */
router.get("/status", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    const status = monitoringService.getStatus();

    return res.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get monitoring status", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get monitoring status",
    });
  }
});

/**
 * Get system metrics
 * GET /api/monitoring/metrics
 */
router.get("/metrics", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    const { since, limit } = req.query;

    const sinceDate = since ? new Date(since as string) : undefined;
    const limitNum = limit ? parseInt(limit as string) : 100;

    const metrics = monitoringService.getMetrics(sinceDate, limitNum);

    return res.json({
      success: true,
      metrics,
      count: metrics.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get metrics", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get metrics",
    });
  }
});

/**
 * Get service health status
 * GET /api/monitoring/health
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

    const _status = monitoringService.getStatus();
    const healthChecks = await monitoringService.performHealthChecks();

    return res.json({
      success: true,
      health: Object.fromEntries(healthChecks),
      summary: {
        total: healthChecks.size,
        healthy: Array.from(healthChecks.values()).filter(
          (h) => h.status === "healthy",
        ).length,
        degraded: Array.from(healthChecks.values()).filter(
          (h) => h.status === "degraded",
        ).length,
        unhealthy: Array.from(healthChecks.values()).filter(
          (h) => h.status === "unhealthy",
        ).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get health status", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get health status",
    });
  }
});

/**
 * Get alerts
 * GET /api/monitoring/alerts
 */
router.get("/alerts", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    const { service, severity, resolved, since } = req.query;

    const filters = {
      service: service as string,
      severity: severity as "critical" | "warning" | "info",
      resolved: resolved ? resolved === "true" : undefined,
      since: since ? new Date(since as string) : undefined,
    };

    const alerts = monitoringService.getAlerts(filters);

    return res.json({
      success: true,
      alerts,
      count: alerts.length,
      summary: {
        critical: alerts.filter((a) => a.severity === "critical" && !a.resolved)
          .length,
        warning: alerts.filter((a) => a.severity === "warning" && !a.resolved)
          .length,
        info: alerts.filter((a) => a.severity === "info" && !a.resolved).length,
        resolved: alerts.filter((a) => a.resolved).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get alerts", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get alerts",
    });
  }
});

/**
 * Trigger manual health check
 * POST /api/monitoring/health/check
 */
router.post("/health/check", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    logger.info("Manual health check initiated by admin", { userId });

    const healthChecks = await monitoringService.performHealthChecks();

    return res.json({
      success: true,
      health: Object.fromEntries(healthChecks),
      message: "Health check completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Manual health check failed", error);
    return res.status(500).json({
      success: false,
      error: "Health check failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Trigger manual metrics collection
 * POST /api/monitoring/metrics/collect
 */
router.post("/metrics/collect", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    logger.info("Manual metrics collection initiated by admin", { userId });

    const metrics = await monitoringService.collectSystemMetrics();

    return res.json({
      success: true,
      metrics,
      message: "Metrics collection completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Manual metrics collection failed", error);
    return res.status(500).json({
      success: false,
      error: "Metrics collection failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Start monitoring service
 * POST /api/monitoring/start
 */
router.post("/start", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    logger.info("Monitoring service start requested by admin", { userId });

    monitoringService.start();

    return res.json({
      success: true,
      message: "Monitoring service started successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to start monitoring service", error);
    return res.status(500).json({
      success: false,
      error: "Failed to start monitoring service",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Stop monitoring service
 * POST /api/monitoring/stop
 */
router.post("/stop", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    // Production safety check
    if (process.env.NODE_ENV === "production") {
      const confirmHeader = req.headers["x-confirm-stop-monitoring"];
      if (confirmHeader !== "yes-stop-monitoring") {
        return res.status(400).json({
          success: false,
          error:
            "Add header X-Confirm-Stop-Monitoring: yes-stop-monitoring to confirm",
        });
      }
    }

    logger.info("Monitoring service stop requested by admin", { userId });

    monitoringService.stop();

    return res.json({
      success: true,
      message: "Monitoring service stopped successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to stop monitoring service", error);
    return res.status(500).json({
      success: false,
      error: "Failed to stop monitoring service",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Test alert system
 * POST /api/monitoring/alerts/test
 */
router.post("/alerts/test", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    const { severity = "info", message = "Test alert from monitoring system" } =
      req.body;

    logger.info("Test alert requested by admin", { userId, severity, message });

    // Create a test alert by emitting it
    const testAlert = {
      id: `test_alert_${Date.now()}`,
      severity: severity as "critical" | "warning" | "info",
      service: "monitoring",
      message,
      timestamp: new Date(),
      resolved: false,
      metadata: { test: true, requestedBy: userId },
    };

    monitoringService.emit("alert", testAlert);

    return res.json({
      success: true,
      alert: testAlert,
      message: "Test alert created successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to create test alert", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create test alert",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
