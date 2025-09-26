import { Router } from "express";
import { isAuthenticated, getAuthUserId, type AuthenticatedRequest } from "../../auth";
import { usersService } from "./users.service";
import { logger } from "../../logger";
import { 
  validateRequest, 
  validateUserProfileUpdateSchema,
  validateSocialLinksSchema
} from "../../validation";

const router = Router();

// Profile Management Routes
// Update user profile
router.patch('/profile', isAuthenticated, validateRequest(validateUserProfileUpdateSchema), async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const updatedUser = await usersService.updateProfile(userId, req.body);
    res.json(updatedUser);
  } catch (error) {
    logger.error("Failed to update user profile", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Get user profile (for viewing other users' profiles)
router.get('/profile/:userId?', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const currentUserId = getAuthUserId(authenticatedReq);
    const targetUserId = req.params.userId;
    
    const userProfile = await usersService.getUserProfile(currentUserId, targetUserId);
    
    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }
    
    return res.json(userProfile);
  } catch (error) {
    logger.error("Failed to fetch user profile", error, { 
      currentUserId: getAuthUserId(authenticatedReq), 
      targetUserId: req.params.userId 
    });
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Social Links Routes
router.get('/social-links/:userId?', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const currentUserId = getAuthUserId(authenticatedReq);
    const targetUserId = req.params.userId || currentUserId;
    
    const socialLinks = await usersService.getUserSocialLinks(targetUserId);
    res.json(socialLinks);
  } catch (error) {
    logger.error("Failed to fetch social links", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to fetch social links" });
  }
});

router.put('/social-links', isAuthenticated, validateRequest(validateSocialLinksSchema), async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const updatedLinks = await usersService.updateSocialLinks(userId, req.body);
    res.json(updatedLinks);
  } catch (error) {
    logger.error("Failed to update social links", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to update social links" });
  }
});

// Gaming Profiles Routes
router.get('/gaming-profiles/:userId?', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const currentUserId = getAuthUserId(authenticatedReq);
    const targetUserId = req.params.userId || currentUserId;
    
    const gamingProfiles = await usersService.getUserGamingProfiles(targetUserId);
    res.json(gamingProfiles);
  } catch (error) {
    logger.error("Failed to fetch gaming profiles", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to fetch gaming profiles" });
  }
});

// User Settings Routes
router.get('/settings', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const settings = await usersService.getUserSettings(userId);
    res.json(settings);
  } catch (error) {
    logger.error("Failed to fetch user settings", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to fetch user settings" });
  }
});

router.put('/settings', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const updatedSettings = await usersService.updateUserSettings(userId, req.body);
    res.json(updatedSettings);
  } catch (error) {
    logger.error("Failed to update user settings", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to update user settings" });
  }
});

// Data Export Route
router.get('/export-data', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const userData = await usersService.exportUserData(userId);
    
    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
    res.json(userData);
  } catch (error) {
    logger.error("Failed to export user data", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to export user data" });
  }
});

// Account Deletion Route
router.delete('/account', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const success = await usersService.deleteUserAccount(userId);
    
    if (success) {
      // Clear authentication cookies
      res.clearCookie('authjs.session-token');
      res.clearCookie('authjs.callback-url');
      res.clearCookie('authjs.csrf-token');
      
      res.json({ message: "Account deleted successfully" });
    } else {
      res.status(404).json({ message: "User account not found" });
    }
  } catch (error) {
    logger.error("Failed to delete user account", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to delete account" });
  }
});

export { router as usersRoutes };

// Separate router for friends management (mounted at /api/friends)
export const friendsRouter = Router();

friendsRouter.get('/', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const friends = await usersService.getFriends(userId);
    res.json(friends);
  } catch (error) {
    logger.error("Failed to fetch friends", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to fetch friends" });
  }
});

friendsRouter.delete('/:id', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const { id } = req.params;
    
    await usersService.removeFriend(userId, id);
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to remove friend", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to remove friend" });
  }
});

// Separate router for friend requests (mounted at /api/friend-requests)
export const friendRequestsRouter = Router();

friendRequestsRouter.get('/', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const friendRequests = await usersService.getFriendRequests(userId);
    res.json(friendRequests);
  } catch (error) {
    logger.error("Failed to fetch friend requests", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to fetch friend requests" });
  }
});

friendRequestsRouter.post('/', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const requesterId = getAuthUserId(authenticatedReq);
    const friendship = await usersService.sendFriendRequest(requesterId, req.body);
    res.status(201).json(friendship);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Addressee ID is required") {
        return res.status(400).json({ message: "Addressee ID is required" });
      }
      if (error.message === "Cannot send friend request to yourself") {
        return res.status(400).json({ message: "Cannot send friend request to yourself" });
      }
      if (error.message === "Friendship request already exists") {
        return res.status(400).json({ message: "Friendship request already exists" });
      }
    }
    
    logger.error("Failed to send friend request", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to send friend request" });
  }
});

friendRequestsRouter.put('/:id', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const { id } = req.params;
    
    const friendship = await usersService.respondToFriendRequest(userId, id, req.body);
    res.json(friendship);
  } catch (error) {
    if (error instanceof Error && error.message === "Status must be 'accepted' or 'declined'") {
      return res.status(400).json({ message: "Status must be 'accepted' or 'declined'" });
    }
    
    logger.error("Failed to respond to friend request", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to respond to friend request" });
  }
});

// Separate router for matchmaking (mounted at /api/matchmaking)
export const matchmakingRouter = Router();

matchmakingRouter.get('/preferences', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const preferences = await usersService.getMatchmakingPreferences(userId);
    res.json(preferences);
  } catch (error) {
    logger.error("Failed to fetch matchmaking preferences", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to fetch matchmaking preferences" });
  }
});

matchmakingRouter.put('/preferences', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const updatedPreferences = await usersService.updateMatchmakingPreferences(userId, req.body);
    res.json(updatedPreferences);
  } catch (error) {
    logger.error("Failed to update matchmaking preferences", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to update matchmaking preferences" });
  }
});

matchmakingRouter.post('/find-players', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const players = await usersService.findPlayers(userId, req.body);
    res.json(players);
  } catch (error) {
    logger.error("Failed to find players", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to find players" });
  }
});