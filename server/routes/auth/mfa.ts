import { Router } from "express";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import {
  generateDeviceFingerprint,
  extractDeviceContext,
} from "../../auth/device-fingerprinting";
import {
  generateTOTPSetup,
  verifyTOTPCode,
  verifyBackupCode,
  hashBackupCode,
  validateMFASetupRequirements,
  generateBackupCodes,
} from "../../auth/mfa";
import { verifyPassword } from "../../auth/password";
import { logger } from "../../logger";
import { authRateLimit } from "../../rate-limiting";
import { storage } from "../../storage";

const router = Router();

// MFA setup - generate QR code and manual entry key
router.post("/setup", isAuthenticated, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);

    // Get user details
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if MFA is already enabled
    const existingMfa = await storage.getUserMfaSettings(userId);
    if (existingMfa?.enabled) {
      return res
        .status(400)
        .json({ message: "MFA is already enabled for this account" });
    }

    // Generate TOTP setup data
    const setupData = await generateTOTPSetup(user.email, "Shuffle & Sync");

    // Store pending TOTP secret in session with 10-minute expiry
    const pendingData = {
      secret: setupData.secret,
      qrCodeUrl: setupData.qrCodeUrl,
      manualEntryKey: setupData.manualEntryKey,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    // Store in session for production-ready distributed deployments
    if (!authenticatedReq.session) {
      return res.status(500).json({
        message: "Session not available - server configuration error",
      });
    }
    authenticatedReq.session.mfaPendingSecret = pendingData;

    // Only return QR code and manual entry - NO plaintext secret or backup codes
    return res.json({
      message: "MFA setup data generated - scan QR code or enter manual key",
      qrCodeUrl: setupData.qrCodeUrl,
      manualEntryKey: setupData.manualEntryKey,
      // Backup codes will be generated server-side upon successful enable
    });
  } catch (error) {
    logger.error("MFA setup failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: getAuthUserId(req as AuthenticatedRequest),
    });
    return res.status(500).json({ message: "Failed to generate MFA setup" });
  }
});

// Enable MFA after verifying TOTP code
router.post("/enable", isAuthenticated, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const { totpCode } = req.body;

    if (!totpCode) {
      return res
        .status(400)
        .json({ message: "TOTP verification code is required" });
    }

    // Get pending secret from session storage
    const pendingData = authenticatedReq.session?.mfaPendingSecret;

    if (
      !pendingData ||
      pendingData.expiresAt < Date.now() ||
      pendingData.userId !== userId
    ) {
      // Clear expired or invalid pending secret
      if (authenticatedReq.session?.mfaPendingSecret) {
        delete authenticatedReq.session.mfaPendingSecret;
      }
      return res
        .status(400)
        .json({ message: "MFA setup expired. Please start setup again." });
    }

    // Validate TOTP code against server-stored secret
    const validation = validateMFASetupRequirements(
      totpCode,
      pendingData.secret,
    );
    if (!validation.isValid) {
      return res.status(400).json({
        message: "Invalid TOTP code",
        details: validation.errors,
      });
    }

    // Generate secure backup codes server-side (12 chars, higher entropy)
    const newBackupCodes = generateBackupCodes(8); // 8 codes for better UX
    const hashedBackupCodes = await Promise.all(
      newBackupCodes.map(async (code: string) => await hashBackupCode(code)),
    );

    // Enable MFA for the user with server-generated data
    await storage.enableUserMfa(userId, pendingData.secret, hashedBackupCodes);

    // Clear pending secret from session
    if (authenticatedReq.session?.mfaPendingSecret) {
      delete authenticatedReq.session.mfaPendingSecret;
    }

    // Log MFA enabled event with audit trail
    logger.info("MFA enabled successfully", { userId });

    // Create audit log entry
    await storage.createAuthAuditLog({
      userId,
      eventType: "mfa_enabled",
      details: JSON.stringify({
        method: "totp",
        backupCodesGenerated: newBackupCodes.length,
        userAgent: req.get("User-Agent") || "Unknown",
      }),
      ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
      isSuccessful: true,
    });

    // Return backup codes ONCE - user must save them now
    return res.json({
      message: "Multi-factor authentication has been enabled successfully",
      backupCodes: newBackupCodes,
      warning: "Save these backup codes now - they will not be shown again!",
    });
  } catch (error) {
    logger.error("MFA enable failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: getAuthUserId(req as AuthenticatedRequest),
    });
    return res.status(500).json({ message: "Failed to enable MFA" });
  }
});

// Disable MFA with password confirmation
router.post("/disable", isAuthenticated, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password confirmation is required to disable MFA",
      });
    }

    // Get user and verify password
    const user = await storage.getUser(userId);
    if (!user || !user.passwordHash) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password before allowing MFA disable
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Disable MFA
    await storage.disableUserMfa(userId);

    // Log MFA disabled event with audit trail
    logger.info("MFA disabled successfully", { userId });

    // Create audit log entry
    await storage.createAuthAuditLog({
      userId,
      eventType: "mfa_disabled",
      details: JSON.stringify({
        method: "password_confirmation",
        userAgent: req.get("User-Agent") || "Unknown",
      }),
      ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
      isSuccessful: true,
    });

    return res.json({
      message: "Multi-factor authentication has been disabled",
    });
  } catch (error) {
    logger.error("MFA disable failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: getAuthUserId(req as AuthenticatedRequest),
    });
    return res.status(500).json({ message: "Failed to disable MFA" });
  }
});

// Verify MFA code (TOTP or backup code)
router.post("/verify", isAuthenticated, authRateLimit, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const { code, isBackupCode = false } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Verification code is required" });
    }

    // Extract device context for security validation
    const deviceContext = extractDeviceContext(
      req.headers,
      req.ip || req.connection.remoteAddress || "unknown",
    );
    const deviceFingerprint = generateDeviceFingerprint(deviceContext);

    // Calculate device risk score
    const riskAssessment = await storage.calculateDeviceRiskScore(userId, {
      userAgent: deviceContext.userAgent,
      ipAddress: deviceContext.ipAddress,
      location: deviceContext.location,
      timezone: deviceContext.timezone,
    });

    // Validate device context and get trust score
    const deviceValidation = await storage.validateDeviceContext(
      userId,
      deviceFingerprint.hash,
    );

    // Get user MFA settings
    const mfaSettings = await storage.getUserMfaSettings(userId);
    if (!mfaSettings || !mfaSettings.enabled) {
      return res
        .status(400)
        .json({ message: "MFA is not enabled for this account" });
    }

    let isValid = false;

    if (isBackupCode) {
      // Verify backup code with Argon2id
      const backupCodes = mfaSettings.backupCodes
        ? JSON.parse(mfaSettings.backupCodes)
        : [];
      const backupResult = await verifyBackupCode(code, backupCodes);
      if (backupResult.isValid && backupResult.codeIndex !== undefined) {
        // Mark backup code as used by removing it from the array
        await storage.markBackupCodeAsUsed(userId, backupResult.codeIndex);
        isValid = true;
      }
    } else {
      // Verify TOTP code
      if (!mfaSettings.secret) {
        return res.status(400).json({ message: "TOTP secret not found" });
      }

      const totpResult = verifyTOTPCode(code, mfaSettings.secret);
      isValid = totpResult.isValid;
    }

    if (isValid) {
      // Update last verified timestamp
      await storage.updateUserMfaLastVerified(userId);

      // Store MFA security context for this verification
      await storage.createMfaSecurityContext({
        userId,
        deviceFingerprint: deviceValidation.deviceFingerprint?.id || null,
        contextType: "login",
        ipAddress: deviceContext.ipAddress,
        location: deviceContext.location || null,
        riskLevel:
          riskAssessment.riskScore > 0.7
            ? "high"
            : riskAssessment.riskScore > 0.4
              ? "medium"
              : "low",
        requiresMfa: true,
        mfaCompleted: true,
        isSuccessful: true,
      });

      // Update device fingerprint with successful verification
      if (deviceValidation.deviceFingerprint) {
        await storage.updateDeviceLastSeen(deviceFingerprint.hash);
        // Increment successful verifications via updateDeviceFingerprint
        await storage.updateDeviceFingerprint(
          deviceValidation.deviceFingerprint.id,
          {
            lastSeen: new Date(),
            trustScore: Math.min(
              1.0,
              (deviceValidation.deviceFingerprint.trustScore || 0.5) + 0.1,
            ),
          },
        );
      }

      // Log successful MFA verification with audit trail
      logger.info("MFA verification successful", {
        userId,
        isBackupCode,
        deviceTrustScore: deviceValidation.trustScore,
        riskScore: riskAssessment.riskScore,
        riskFactorsDetected: riskAssessment.riskFactors.length,
      });

      // Create audit log entry
      await storage.createAuthAuditLog({
        userId,
        eventType: "mfa_verified",
        details: JSON.stringify({
          method: isBackupCode ? "backup_code" : "totp",
          userAgent: req.get("User-Agent") || "Unknown",
          deviceTrustScore: deviceValidation.trustScore,
          riskScore: riskAssessment.riskScore,
        }),
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
        isSuccessful: true,
      });

      return res.json({
        message: "MFA verification successful",
        securityContext: {
          trustScore: deviceValidation.trustScore,
          riskScore: riskAssessment.riskScore,
          deviceTrusted: deviceValidation.trustScore > 0.7,
        },
      });
    } else {
      // Log failed MFA verification with audit trail
      logger.warn("MFA verification failed", { userId, isBackupCode });

      // Create audit log entry for failed verification
      await storage.createAuthAuditLog({
        userId,
        eventType: "mfa_verified",
        details: JSON.stringify({
          method: isBackupCode ? "backup_code" : "totp",
          userAgent: req.get("User-Agent") || "Unknown",
        }),
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
        isSuccessful: false,
        failureReason: "invalid_mfa_code",
      });

      return res.status(400).json({ message: "Invalid verification code" });
    }
  } catch (error) {
    logger.error("MFA verification error", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: getAuthUserId(req as AuthenticatedRequest),
    });
    return res.status(500).json({ message: "MFA verification failed" });
  }
});

// Regenerate backup codes
router.post("/backup-codes/regenerate", isAuthenticated, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ message: "Password confirmation is required" });
    }

    // Get user and verify password
    const user = await storage.getUser(userId);
    if (!user || !user.passwordHash) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Check if MFA is enabled
    const mfaSettings = await storage.getUserMfaSettings(userId);
    if (!mfaSettings || !mfaSettings.enabled) {
      return res
        .status(400)
        .json({ message: "MFA is not enabled for this account" });
    }

    // Generate new backup codes with enhanced security
    const newBackupCodes = generateBackupCodes(8);
    const hashedBackupCodes = await Promise.all(
      newBackupCodes.map(async (code) => await hashBackupCode(code)),
    );

    // Update backup codes in database
    await storage.updateUserMfaSettings(userId, {
      backupCodes: JSON.stringify(hashedBackupCodes),
    });

    // Log backup codes regeneration with audit trail
    logger.info("MFA backup codes regenerated", { userId });

    // Create audit log entry
    await storage.createAuthAuditLog({
      userId,
      eventType: "mfa_verified", // Using existing enum, could add 'mfa_backup_codes_regenerated'
      details: JSON.stringify({
        action: "backup_codes_regenerated",
        codesGenerated: newBackupCodes.length,
        userAgent: req.get("User-Agent") || "Unknown",
      }),
      ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
      isSuccessful: true,
    });

    return res.json({
      message: "New backup codes generated successfully",
      backupCodes: newBackupCodes,
    });
  } catch (error) {
    logger.error("Backup codes regeneration failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: getAuthUserId(req as AuthenticatedRequest),
    });
    return res
      .status(500)
      .json({ message: "Failed to generate new backup codes" });
  }
});

// Get MFA status
router.get("/status", isAuthenticated, async (req, res) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);

    // Get user MFA settings
    const mfaSettings = await storage.getUserMfaSettings(userId);

    return res.json({
      mfaEnabled: mfaSettings?.enabled || false,
      enabledAt: mfaSettings?.createdAt || null, // Use createdAt since schema doesn't have enabledAt
      lastVerifiedAt: mfaSettings?.updatedAt || null, // Use updatedAt since schema doesn't have lastVerifiedAt
      backupCodesCount: mfaSettings?.backupCodes?.length || 0,
    });
  } catch (error) {
    logger.error("MFA status check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: getAuthUserId(req as AuthenticatedRequest),
    });
    return res.status(500).json({ message: "Failed to get MFA status" });
  }
});

export default router;
