/**
 * Auth Routes - Feature-based routing
 *
 * Consolidates all authentication-related routes including:
 * - User authentication endpoints
 * - Password reset functionality
 * - MFA (Multi-Factor Authentication)
 * - Token management (JWT)
 * - User registration
 */

import { Router } from "express";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import { storage } from "../../storage";
import { logger } from "../../logger";

// Import route modules from routes/auth
import passwordRouter from "../../routes/auth/password";
import mfaRouter from "../../routes/auth/mfa";
import tokensRouter from "../../routes/auth/tokens";
import registerRouter from "../../routes/auth/register";

const router = Router();

// Get current authenticated user
router.get("/user", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's communities
    const userCommunities = await storage.getUserCommunities(userId);

    return res.json({
      ...user,
      communities: userCommunities,
    });
  } catch (error) {
    logger.error("Failed to fetch user", error, {
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Mount sub-routers for auth functionality
router.use("/", passwordRouter); // /forgot-password, /verify-reset-token/:token, /reset-password
router.use("/mfa", mfaRouter); // /mfa/setup, /mfa/enable, /mfa/disable, /mfa/verify, /mfa/backup-codes/regenerate, /mfa/status
router.use("/", tokensRouter); // /refresh, /revoke, /revoke-all, /tokens
router.use("/register", registerRouter); // /register

export default router;
export { router as authRoutes };
