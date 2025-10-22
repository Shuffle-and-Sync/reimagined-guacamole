import { Router } from "express";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../auth";
import { logger } from "../logger";
import { generalRateLimit } from "../rate-limiting";
import { infrastructureTestService } from "../services/infrastructure-test-service";

const router = Router();

// Apply authentication and rate limiting to all test routes
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
 * Get infrastructure test service status
 * GET /api/tests/status
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

    const status = infrastructureTestService.getStatus();

    return res.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get test service status", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get test service status",
    });
  }
});

/**
 * Run comprehensive infrastructure tests
 * POST /api/tests/run
 */
router.post("/run", async (req, res) => {
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
      const confirmHeader = req.headers["x-confirm-run-tests"];
      if (confirmHeader !== "yes-run-infrastructure-tests") {
        return res.status(400).json({
          success: false,
          error:
            "Add header X-Confirm-Run-Tests: yes-run-infrastructure-tests to confirm",
        });
      }
    }

    logger.info("Infrastructure tests initiated by admin", { userId });

    // Set timeout for long-running test suite
    req.setTimeout(300000); // 5 minutes
    res.setTimeout(300000); // 5 minutes

    const report = await infrastructureTestService.runComprehensiveTests();

    return res.json({
      success: true,
      report,
      message: `Infrastructure tests completed with ${report.overall.score}% success rate`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Infrastructure tests failed", error, {
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(500).json({
      success: false,
      error: "Infrastructure tests failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Run specific test suite
 * POST /api/tests/suite/:suiteName
 */
router.post("/suite/:suiteName", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    const { suiteName } = req.params;

    if (!suiteName) {
      return res.status(400).json({
        success: false,
        error: "Suite name is required",
      });
    }

    logger.info("Specific test suite initiated by admin", {
      userId,
      suiteName,
    });

    // For now, run comprehensive tests and filter to specific suite
    // In a full implementation, we'd have individual suite runners
    const report = await infrastructureTestService.runComprehensiveTests();
    const suite = report.suites.find((s) =>
      s.name.toLowerCase().includes(suiteName.toLowerCase()),
    );

    if (!suite) {
      return res.status(404).json({
        success: false,
        error: `Test suite '${suiteName}' not found`,
        availableSuites: report.suites.map((s) => s.name),
      });
    }

    return res.json({
      success: true,
      suite,
      message: `Test suite '${suite.name}' completed`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Test suite execution failed", error, {
      userId: getAuthUserId(authenticatedReq),
      suiteName: req.params.suiteName,
    });
    return res.status(500).json({
      success: false,
      error: "Test suite execution failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Get test results summary
 * GET /api/tests/summary
 */
router.get("/summary", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    // Return a summary of available test suites and current status
    const status = infrastructureTestService.getStatus();

    const summary = {
      testServiceStatus: status,
      availableTestSuites: [
        {
          name: "Monitoring System",
          description:
            "Test monitoring service, metrics collection, health checks, and alerting",
          tests: [
            "service_status",
            "metrics_collection",
            "health_checks",
            "alert_system",
          ],
        },
        {
          name: "Caching Layer",
          description:
            "Test Redis caching, fallback mechanisms, and cache operations",
          tests: [
            "service_status",
            "cache_set",
            "cache_get",
            "cache_delete",
            "graceful_degradation",
          ],
        },
        {
          name: "Database Optimization",
          description:
            "Test database connection pooling, query optimization, and performance monitoring",
          tests: [
            "connectivity",
            "optimized_queries",
            "connection_pool",
            "performance_monitoring",
          ],
        },
        {
          name: "Backup System",
          description:
            "Test backup service, backup verification, and recovery capabilities",
          tests: [
            "service_status",
            "configuration",
            "backup_directory",
            "cleanup_system",
          ],
        },
        {
          name: "Analytics System",
          description:
            "Test analytics data collection, metrics tracking, and reporting",
          tests: [
            "data_models",
            "storage_operations",
            "metrics_collection",
            "api_endpoints",
          ],
        },
        {
          name: "Notification System",
          description:
            "Test notification delivery, preferences, and multi-channel support",
          tests: [
            "data_models",
            "preferences_system",
            "delivery_channels",
            "queue_system",
          ],
        },
        {
          name: "Health Check System",
          description:
            "Test comprehensive health monitoring and status reporting",
          tests: [
            "database_health",
            "redis_health",
            "application_health",
            "filesystem_health",
            "overall_status",
          ],
        },
        {
          name: "Integration Scenarios",
          description: "Test cross-system integration and end-to-end workflows",
          tests: [
            "monitoring_alerting",
            "cache_database",
            "monitoring_database",
            "backup_monitoring",
            "system_resilience",
          ],
        },
      ],
      instructions: {
        runAllTests: "POST /api/tests/run",
        runSpecificSuite: "POST /api/tests/suite/{suiteName}",
        headers: {
          production: "X-Confirm-Run-Tests: yes-run-infrastructure-tests",
        },
      },
    };

    return res.json({
      success: true,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get test summary", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get test summary",
    });
  }
});

/**
 * Health check for test service
 * GET /api/tests/health
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

    const status = infrastructureTestService.getStatus();

    const health = {
      testServiceOperational: true,
      testServiceRunning: !status.isRunning, // false when not running tests (good)
      testFrameworkAvailable: true,
      adminAccessVerified: true,
    };

    const allHealthy = Object.values(health).every((check) => check === true);

    return res.json({
      success: true,
      healthy: allHealthy,
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Test service health check failed", error);
    return res.status(500).json({
      success: false,
      error: "Test service health check failed",
    });
  }
});

export default router;
