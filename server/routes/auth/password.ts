import { Router } from "express";
import { storage } from "../../storage";
import { logger } from "../../logger";
import {
  validateRequest,
  validateEmailSchema,
  validatePasswordResetSchema,
} from "../../validation";
import { passwordResetRateLimit } from "../../rate-limiting";
import { validatePasswordStrength, hashPassword } from "../../auth/password";
import {
  generatePasswordResetJWT,
  verifyPasswordResetJWT,
  TOKEN_EXPIRY,
} from "../../auth/tokens";
import { sendPasswordResetEmail } from "../../email-service";

const router = Router();

// Request password reset
router.post(
  "/forgot-password",
  passwordResetRateLimit,
  validateRequest(validateEmailSchema),
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists (we check this for security but don't reveal it)
      const userExists = await storage.getUserByEmail(email);

      if (userExists) {
        // Invalidate any existing reset tokens for this user
        await storage.invalidateUserPasswordResetTokens(userExists.id);

        // Generate secure JWT token for password reset
        const resetToken = await generatePasswordResetJWT(
          userExists.id,
          email,
          TOKEN_EXPIRY.PASSWORD_RESET,
        );

        // Store token in database
        const expiresAt = new Date(
          Date.now() + TOKEN_EXPIRY.PASSWORD_RESET * 1000,
        );
        await storage.createPasswordResetToken({
          userId: userExists.id,
          token: resetToken,
          expiresAt,
        });

        // Send email with trusted base URL
        const baseUrl =
          process.env.AUTH_URL ||
          process.env.PUBLIC_WEB_URL ||
          "https://shuffleandsync.org";
        await sendPasswordResetEmail(
          email,
          resetToken,
          baseUrl,
          userExists.firstName || undefined,
        );
      }

      return res.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (_error: unknown) {
      logger.error("Password reset request failed", {
        email: req.body.email,
      });
      return res
        .status(500)
        .json({ message: "Failed to process password reset request" });
    }
  },
);

// Verify reset token
router.get("/verify-reset-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const resetToken = await storage.getPasswordResetToken(token);

    if (!resetToken) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Get user email from userId
    const user = await storage.getUser(resetToken.userId);
    return res.json({ message: "Token is valid", email: user?.email });
  } catch (error) {
    logger.error("Failed to verify reset token", error, {
      token: req.body.token,
    });
    return res.status(500).json({ message: "Failed to verify reset token" });
  }
});

// Reset password
router.post(
  "/reset-password",
  passwordResetRateLimit,
  validateRequest(validatePasswordResetSchema),
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res
          .status(400)
          .json({ message: "Token and new password are required" });
      }

      // Validate password strength with enhanced security rules
      const validation = validatePasswordStrength(newPassword);
      if (!validation.valid) {
        return res.status(400).json({
          message: "Password does not meet security requirements",
          details: validation.errors,
        });
      }

      // Verify JWT token
      const jwtResult = await verifyPasswordResetJWT(token);
      if (!jwtResult.valid) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset token" });
      }

      // Check token in database
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset token" });
      }

      // Find user by userId from token
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.status(400).json({ message: "Invalid reset request" });
      }

      // Hash new password with Argon2
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await storage.updateUser(user.id, { passwordHash: hashedPassword });

      // Mark token as used
      await storage.markTokenAsUsed(token);

      // Log successful password reset (without sensitive data)
      logger.info("Password reset completed successfully", {
        userId: user.id,
        email: user.email,
      });

      return res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      logger.error("Password reset failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return res.status(500).json({ message: "Failed to reset password" });
    }
  },
);

export default router;
