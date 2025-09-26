import { Router } from "express";
import { isAuthenticated, getAuthUserId, type AuthenticatedRequest } from "../../auth";
import { authService } from "./auth.service";
import { logger } from "../../logger";
import { 
  validateRequest, 
  validateEmailSchema,
  validatePasswordResetSchema
} from "../../validation";
import { 
  authRateLimit, 
  passwordResetRateLimit 
} from "../../rate-limiting";

const router = Router();

// Get current authenticated user
router.get('/user', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const user = await authService.getCurrentUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    return res.json(user);
  } catch (error) {
    logger.error("Failed to fetch user", error, { userId: getAuthUserId(authenticatedReq) });
    return res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Request password reset
router.post('/forgot-password', passwordResetRateLimit, validateRequest(validateEmailSchema), async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const baseUrl = req.protocol + '://' + req.get('host');
    await authService.requestPasswordReset(email, baseUrl);

    return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
  } catch (error) {
    logger.error("Failed to process forgot password request", error, { email: req.body.email });
    return res.status(500).json({ message: "Failed to process password reset request" });
  }
});

// Verify reset token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const result = await authService.verifyResetToken(token);
    
    if (!result) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    return res.json({ message: "Token is valid", email: result.email });
  } catch (error) {
    logger.error("Failed to verify reset token", error, { token: req.params.token?.substring(0, 8) + "***" });
    return res.status(500).json({ message: "Failed to verify reset token" });
  }
});

// Reset password
router.post('/reset-password', authRateLimit, validateRequest(validatePasswordResetSchema), async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const success = await authService.resetPassword(token, newPassword);
    
    if (!success) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    
    return res.json({ message: "Password reset successful" });
  } catch (error) {
    if (error instanceof Error && error.message === "Password must be at least 8 characters long") {
      return res.status(400).json({ message: error.message });
    }
    
    logger.error("Failed to reset password", error, { token: req.body.token?.substring(0, 8) + "***" });
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

export { router as authRoutes };