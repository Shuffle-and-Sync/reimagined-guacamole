/**
 * Platform OAuth Routes
 * Handles platform account linking, OAuth flows, and platform status
 */

import { Router } from "express";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../auth";

import { assertRouteParam } from "../shared/utils";
import { storage } from "../storage";
import {
  generatePlatformOAuthURL,
  handlePlatformOAuthCallback,
} from "../services/platform-oauth.service";
import {
  errors,
  errorHandlingMiddleware,
} from "../middleware/error-handling.middleware";

const { asyncHandler } = errorHandlingMiddleware;
const { NotFoundError, ValidationError } = errors;

const router = Router();

// Platform OAuth routes for account linking
router.get(
  "/:platform/oauth/initiate",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const platform = assertRouteParam(req.params.platform, "platform");

    if (!["twitch", "youtube", "facebook"].includes(platform)) {
      throw new ValidationError("Unsupported platform");
    }

    // Generate OAuth authorization URL
    const authUrl = await generatePlatformOAuthURL(platform, userId);
    return res.json({ authUrl });
  }),
);

router.get(
  "/:platform/oauth/callback",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const platform = assertRouteParam(req.params.platform, "platform");
    const { code, state } = req.query;

    if (!code || !state) {
      throw new ValidationError("Missing OAuth parameters");
    }

    // Exchange code for tokens and save to storage
    const account = await handlePlatformOAuthCallback(
      platform,
      code as string,
      state as string,
      userId,
    );
    return res.json({
      success: true,
      platform: account.platform,
      handle: account.handle,
    });
  }),
);

router.get(
  "/accounts",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const accounts = await storage.getUserPlatformAccounts(userId);
    return res.json(accounts);
  }),
);

router.delete(
  "/accounts/:id",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const id = assertRouteParam(req.params.id, "id");

    // Verify ownership before deletion
    const account = await storage.getUserPlatformAccounts(userId);
    const targetAccount = account.find((acc) => acc.id === id);

    if (!targetAccount) {
      throw new NotFoundError("Platform account");
    }

    await storage.deleteUserPlatformAccount(id);
    return res.json({ success: true });
  }),
);

router.get(
  "/status",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const accounts = await storage.getUserPlatformAccounts(userId);

    const status: Record<string, unknown> = {};

    for (const account of accounts) {
      const now = new Date();
      const isExpired = account.tokenExpiresAt && account.tokenExpiresAt < now;

      status[account.platform] = {
        isConnected: account.isActive && !isExpired,
        isExpired: !!isExpired,
        expiryDate: account.tokenExpiresAt?.toISOString(),
        lastChecked: now.toISOString(),
      };
    }

    return res.json(status);
  }),
);

router.post(
  "/:platform/refresh",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const platform = assertRouteParam(req.params.platform, "platform");

    // Import refresh function
    const { refreshPlatformToken } = await import("../services/platform-oauth");

    const newToken = await refreshPlatformToken(userId, platform);

    if (!newToken) {
      throw new ValidationError("Failed to refresh token");
    }

    return res.json({
      success: true,
      message: "Token refreshed successfully",
    });
  }),
);

export default router;
