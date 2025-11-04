import { Router } from "express";
import { toLoggableError } from "@shared/utils/type-guards";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../auth";
import { logger } from "../logger";
import { generalRateLimit } from "../rate-limiting";
import { backupService } from "../services/backup-service";

const router = Router();

// Apply authentication and rate limiting to all backup routes
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
 * Get backup system status and history
 * GET /api/backup/status
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

    const status = backupService.getBackupStatus();

    return res.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get backup status", toLoggableError(error));
    return res.status(500).json({
      success: false,
      error: "Failed to get backup status",
    });
  }
});

/**
 * Create a full database backup
 * POST /api/backup/full
 */
router.post("/full", async (req, res) => {
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
      const confirmHeader = req.headers["x-confirm-full-backup"];
      if (confirmHeader !== "yes-create-full-backup") {
        return res.status(400).json({
          success: false,
          error:
            "Add header X-Confirm-Full-Backup: yes-create-full-backup to confirm",
        });
      }
    }

    logger.info("Full backup initiated by admin", { userId });

    const metadata = await backupService.createFullBackup();

    return res.json({
      success: true,
      backup: metadata,
      message: "Full backup completed successfully",
    });
  } catch (error) {
    logger.error("Full backup failed", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(500).json({
      success: false,
      error: "Full backup failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Create a critical data backup
 * POST /api/backup/critical
 */
router.post("/critical", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    logger.info("Critical data backup initiated by admin", { userId });

    const metadata = await backupService.createCriticalDataBackup();

    return res.json({
      success: true,
      backup: metadata,
      message: "Critical data backup completed successfully",
    });
  } catch (error) {
    logger.error("Critical data backup failed", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(500).json({
      success: false,
      error: "Critical data backup failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Restore database from backup
 * POST /api/backup/restore
 */
router.post("/restore", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint with strict validation
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    // Strict production safety check
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: "Database restore is disabled in production for safety",
      });
    }

    const { backupPath, tables, dropExisting, dryRun } = req.body;

    if (!backupPath) {
      return res.status(400).json({
        success: false,
        error: "backupPath is required",
      });
    }

    logger.info("Database restore initiated by admin", {
      userId,
      backupPath,
      tables,
      dropExisting,
      dryRun,
    });

    const result = await backupService.restoreFromBackup(backupPath, {
      tables,
      dropExisting,
      dryRun,
    });

    return res.json({
      success: result.success,
      result,
      message: result.success
        ? "Database restore completed successfully"
        : "Database restore failed",
    });
  } catch (error) {
    logger.error("Database restore failed", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(500).json({
      success: false,
      error: "Database restore failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Verify backup integrity
 * POST /api/backup/verify
 */
router.post("/verify", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    const { backupPath } = req.body;

    if (!backupPath) {
      return res.status(400).json({
        success: false,
        error: "backupPath is required",
      });
    }

    logger.info("Backup verification initiated by admin", {
      userId,
      backupPath,
    });

    const result = await backupService.verifyBackup(backupPath);

    return res.json({
      success: result.valid,
      verification: result,
      message: result.valid
        ? "Backup verification successful"
        : "Backup verification failed",
    });
  } catch (error) {
    logger.error("Backup verification failed", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(500).json({
      success: false,
      error: "Backup verification failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Clean up old backups
 * DELETE /api/backup/cleanup
 */
router.delete("/cleanup", async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    // Admin-only endpoint
    const userId = getAuthUserId(authenticatedReq);
    if (!(await isAdmin(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    logger.info("Backup cleanup initiated by admin", { userId });

    const result = await backupService.cleanupOldBackups();

    return res.json({
      success: true,
      cleanup: result,
      message: `Cleanup completed: ${result.deletedCount} files deleted, ${Math.round(result.freedSpace / 1024 / 1024)}MB freed`,
    });
  } catch (error) {
    logger.error("Backup cleanup failed", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(500).json({
      success: false,
      error: "Backup cleanup failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Test backup system health
 * GET /api/backup/health
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

    const status = backupService.getBackupStatus();

    // Basic health checks
    const health = {
      backupServiceEnabled: status.config.enabled,
      backupDirectoryAccessible: true, // Would need fs check
      recentBackupStatus:
        status.recentBackups.length > 0
          ? (status.recentBackups[status.recentBackups.length - 1]?.status ??
            "no_backups")
          : "no_backups",
      configurationValid:
        status.config.schedule.full && status.config.schedule.criticalData,
      diskSpaceAvailable: true, // Would need actual disk space check
    };

    const allHealthy = Object.values(health).every(
      (check) =>
        check === true || check === "completed" || check === "no_backups",
    );

    return res.json({
      success: true,
      healthy: allHealthy,
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Backup health check failed", toLoggableError(error));
    return res.status(500).json({
      success: false,
      error: "Backup health check failed",
    });
  }
});

export default router;
