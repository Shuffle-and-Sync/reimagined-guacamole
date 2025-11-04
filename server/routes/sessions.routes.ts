import { Router } from "express";
import { isAuthenticated, getAuthUserId } from "../auth";
import { enhancedSessionManager } from "../auth/session-security";
import { logger } from "../logger";
import { storage } from "../storage";

const router = Router();

// Apply authentication to all session management routes
router.use(isAuthenticated);

/**
 * Get user's active sessions with device information
 * GET /api/sessions
 *
 * Note: This returns device fingerprints as "sessions" since Auth.js
 * manages actual session tokens through its adapter
 */
router.get("/", async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    // Get device fingerprints which represent user's login devices
    const devices = await storage.getUserDeviceFingerprints(userId);

    // Format as sessions with device information
    const sessions = devices.map((device) => ({
      id: device.id,
      userId: device.userId,
      device: {
        id: device.id,
        fingerprintHash: device.fingerprintHash.substring(0, 16) + "...",
        deviceInfo:
          device.deviceInfo && typeof device.deviceInfo === "string"
            ? JSON.parse(device.deviceInfo)
            : {},
        firstSeen: device.firstSeen,
        lastSeen: device.lastSeen,
        trustScore: device.trustScore,
        isBlocked: device.isBlocked,
        isActive: device.isActive,
      },
    }));

    res.json({
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    logger.error("Failed to fetch user sessions", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: getAuthUserId(req),
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch sessions",
    });
  }
});

/**
 * Get user's device fingerprints
 * GET /api/sessions/devices
 */
router.get("/devices", async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    const devices = await storage.getUserDeviceFingerprints(userId);

    const formattedDevices = devices.map((device) => ({
      id: device.id,
      fingerprintHash: device.fingerprintHash.substring(0, 16) + "...",
      deviceInfo:
        device.deviceInfo && typeof device.deviceInfo === "string"
          ? JSON.parse(device.deviceInfo)
          : {},
      firstSeen: device.firstSeen,
      lastSeen: device.lastSeen,
      trustScore: device.trustScore,
      isBlocked: device.isBlocked,
      isActive: device.isActive,
    }));

    res.json({
      success: true,
      devices: formattedDevices,
      count: formattedDevices.length,
    });
  } catch (error) {
    logger.error("Failed to fetch user devices", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: getAuthUserId(req),
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch devices",
    });
  }
});

/**
 * Revoke a specific device (removes device fingerprint)
 * DELETE /api/sessions/:deviceId
 */
router.delete("/:deviceId", async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { deviceId } = req.params;

    // Get all user devices and find the one to delete
    const devices = await storage.getUserDeviceFingerprints(userId);
    const device = devices.find((d) => d.id === deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: "Device not found",
      });
    }

    // Delete device fingerprint
    await storage.deleteDeviceFingerprint(deviceId);

    logger.info("Device revoked by user", {
      userId,
      revokedDeviceId: deviceId,
    });

    return res.json({
      success: true,
      message: "Device revoked successfully",
    });
  } catch (error) {
    logger.error("Failed to revoke device", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: getAuthUserId(req),
      deviceId: req.params.deviceId,
    });
    return res.status(500).json({
      success: false,
      error: "Failed to revoke device",
    });
  }
});

/**
 * Revoke all devices except current
 * POST /api/sessions/revoke-all
 */
router.post("/revoke-all", async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    // Get all devices
    const devices = await storage.getUserDeviceFingerprints(userId);

    // Delete all devices (user will need to re-authenticate on all devices)
    let revokedCount = 0;
    for (const device of devices) {
      await storage.deleteDeviceFingerprint(device.id);
      revokedCount++;
    }

    logger.info("All devices revoked by user", {
      userId,
      revokedCount,
    });

    res.json({
      success: true,
      message:
        "All devices revoked successfully. You will need to log in again on all devices.",
      revokedCount,
    });
  } catch (error) {
    logger.error("Failed to revoke all devices", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: getAuthUserId(req),
    });
    res.status(500).json({
      success: false,
      error: "Failed to revoke devices",
    });
  }
});

/**
 * Block a device
 * POST /api/sessions/devices/:deviceId/block
 */
router.post("/devices/:deviceId/block", async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { deviceId } = req.params;

    // Get all user devices and find the one to block
    const devices = await storage.getUserDeviceFingerprints(userId);
    const device = devices.find((d) => d.id === deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: "Device not found",
      });
    }

    // Block device
    await storage.updateDeviceFingerprint(deviceId, { isBlocked: true });

    logger.info("Device blocked by user", {
      userId,
      deviceId,
    });

    return res.json({
      success: true,
      message: "Device blocked successfully",
    });
  } catch (error) {
    logger.error("Failed to block device", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: getAuthUserId(req),
      deviceId: req.params.deviceId,
    });
    return res.status(500).json({
      success: false,
      error: "Failed to block device",
    });
  }
});

/**
 * Unblock a device
 * POST /api/sessions/devices/:deviceId/unblock
 */
router.post("/devices/:deviceId/unblock", async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { deviceId } = req.params;

    // Get all user devices and find the one to unblock
    const devices = await storage.getUserDeviceFingerprints(userId);
    const device = devices.find((d) => d.id === deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: "Device not found",
      });
    }

    // Unblock device
    await storage.updateDeviceFingerprint(deviceId, { isBlocked: false });

    logger.info("Device unblocked by user", {
      userId,
      deviceId,
    });

    return res.json({
      success: true,
      message: "Device unblocked successfully",
    });
  } catch (error) {
    logger.error("Failed to unblock device", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: getAuthUserId(req),
      deviceId: req.params.deviceId,
    });
    return res.status(500).json({
      success: false,
      error: "Failed to unblock device",
    });
  }
});

/**
 * Get security assessment for current session
 * GET /api/sessions/security-assessment
 */
router.get("/security-assessment", async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const currentSessionToken =
      req.cookies?.["authjs.session-token"] || req.headers.authorization;

    if (!currentSessionToken) {
      return res.status(401).json({
        success: false,
        error: "No active session found",
      });
    }

    // Perform security assessment
    const assessment = await enhancedSessionManager.validateSessionSecurity(
      userId,
      currentSessionToken,
      {
        headers: req.headers as Record<string, string>,
        ip: req.ip || "",
      },
    );

    return res.json({
      success: true,
      assessment: {
        isValid: assessment.isValid,
        riskLevel: assessment.assessment.riskLevel,
        riskScore: assessment.assessment.riskScore,
        trustScore: assessment.assessment.trustScore,
        riskFactors: assessment.assessment.riskFactors,
        requiresAction: assessment.assessment.requiresAction,
        recommendedActions: assessment.assessment.recommendedActions,
      },
    });
  } catch (error) {
    logger.error("Failed to assess session security", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: getAuthUserId(req),
    });
    return res.status(500).json({
      success: false,
      error: "Failed to assess session security",
    });
  }
});

export default router;
