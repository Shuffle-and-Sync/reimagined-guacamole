/**
 * User Profile Routes
 * Handles user profile management, settings, social links, and gaming profiles
 */

import { Router } from "express";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../auth";
import { logger } from "../logger";
import { storage } from "../storage";
import type { UpsertUser } from "@shared/schema";
import {
  validateRequest,
  validateUserProfileUpdateSchema,
  validateSocialLinksSchema,
} from "../validation";
import { errors, errorHandlingMiddleware } from "../middleware/error-handling.middleware";

const { asyncHandler } = errorHandlingMiddleware;
const { NotFoundError } = errors;

const router = Router();

// Update user profile
router.patch(
  "/profile",
  isAuthenticated,
  validateRequest(validateUserProfileUpdateSchema),
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);

    const {
      firstName,
      lastName,
      primaryCommunity,
      username,
      bio,
      location,
      website,
      status,
      statusMessage,
      timezone,
      isPrivate,
      showOnlineStatus,
      allowDirectMessages,
    } = req.body;

    const updates: Partial<UpsertUser> = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (primaryCommunity !== undefined)
      updates.primaryCommunity = primaryCommunity;
    if (username !== undefined) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (website !== undefined) updates.website = website;
    if (status !== undefined) updates.status = status;
    if (statusMessage !== undefined) updates.statusMessage = statusMessage;
    if (timezone !== undefined) updates.timezone = timezone;
    if (isPrivate !== undefined) updates.isPrivate = isPrivate;
    if (showOnlineStatus !== undefined)
      updates.showOnlineStatus = showOnlineStatus;
    if (allowDirectMessages !== undefined)
      updates.allowDirectMessages = allowDirectMessages;

    const updatedUser = await storage.updateUser(userId, updates);
    return res.json(updatedUser);
  }),
);

// Get user profile (for viewing other users' profiles)
router.get(
  "/profile/:userId?",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const currentUserId = getAuthUserId(authenticatedReq);
    const targetUserId = req.params.userId || currentUserId;

    const user = await storage.getUser(targetUserId);
    if (!user) {
      throw new NotFoundError("User");
    }

    // Get additional profile data
    const userCommunities = await storage.getUserCommunities(targetUserId);

    return res.json({
      ...user,
      communities: userCommunities,
      isOwnProfile: currentUserId === targetUserId,
      friendCount: await storage.getFriendCount(targetUserId),
    });
  }),
);

// Get user social links
router.get(
  "/social-links/:userId?",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const currentUserId = getAuthUserId(authenticatedReq);
    const targetUserId = req.params.userId || currentUserId;

    const socialLinks = await storage.getUserSocialLinks(targetUserId);
    return res.json(socialLinks);
  }),
);

// Update user social links
router.put(
  "/social-links",
  isAuthenticated,
  validateRequest(validateSocialLinksSchema),
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const { links } = req.body;

    const updatedLinks = await storage.updateUserSocialLinks(userId, links);
    return res.json(updatedLinks);
  }),
);

// Get gaming profiles
router.get(
  "/gaming-profiles/:userId?",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const currentUserId = getAuthUserId(authenticatedReq);
    const targetUserId = req.params.userId || currentUserId;

    const gamingProfiles =
      await storage.getUserGamingProfiles(targetUserId);
    return res.json(gamingProfiles);
  }),
);

// Get user settings
router.get(
  "/settings",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const settings = await storage.getUserSettings(userId);
    return res.json(settings);
  }),
);

// Update user settings
router.put(
  "/settings",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const settingsData = { ...req.body, userId };

    const settings = await storage.upsertUserSettings(settingsData);
    return res.json(settings);
  }),
);

// Export user data
router.get(
  "/export-data",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);

    // Get comprehensive user data for export
    const userData = await storage.exportUserData(userId);

    logger.info("Data export completed", { userId });
    return res.json(userData);
  }),
);

// Delete user account
router.delete(
  "/account",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);

    // Perform cascade deletion of user data
    const success = await storage.deleteUserAccount(userId);

    if (!success) {
      throw new NotFoundError("User account");
    }

    logger.info("Account deletion completed", { userId });

    // Note: Auth.js handles session cleanup automatically when user is deleted
    // Clear any additional cookies if needed
    res.clearCookie("authjs.session-token");
    res.clearCookie("__Secure-authjs.session-token");

    return res.json({
      message: "Account deleted successfully",
    });
  }),
);

export default router;
