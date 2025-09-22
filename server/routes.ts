import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { isAuthenticated, getAuthUserId, type AuthenticatedRequest } from "./auth";
import { 
  insertCommunitySchema, 
  insertEventSchema, 
  insertEventAttendeeSchema, 
  insertGameSessionSchema, 
  insertCollaborativeStreamEventSchema,
  insertStreamCollaboratorSchema,
  insertStreamCoordinationSessionSchema,
  type UpsertUser 
} from "@shared/schema";
import { sendPasswordResetEmail, sendEmailVerificationEmail } from "./email-service";
import { sendContactEmail } from "./email";
import { validatePasswordStrength, hashPassword } from "./auth/password";
import { 
  generateEmailVerificationJWT, 
  verifyEmailVerificationJWT,
  generatePasswordResetJWT,
  verifyPasswordResetJWT,
  TOKEN_EXPIRY 
} from "./auth/tokens";
import { logger } from "./logger";
import { NotFoundError, ValidationError } from "./types";
import analyticsRouter from "./routes/analytics";
import cacheHealthRouter from "./routes/cache-health";
import databaseHealthRouter from "./routes/database-health";
import backupRouter from "./routes/backup";
import monitoringRouter from "./routes/monitoring";
import matchingRouter from "./routes/matching";
import { CollaborativeStreamingService } from "./services/collaborative-streaming";
import { websocketMessageSchema } from '../shared/websocket-schemas';
// Auth.js session validation will be done via session endpoint
import { healthCheck } from "./health";
import { generatePlatformOAuthURL, handlePlatformOAuthCallback } from "./services/platform-oauth";
import { 
  validateRequest, 
  validateParams, 
  securityHeaders,
  validateUserProfileUpdateSchema,
  validateEmailSchema,
  validateEventSchema,
  validatePasswordResetSchema,
  validateSocialLinksSchema,
  validateJoinCommunitySchema,
  validateJoinEventSchema,
  validateMessageSchema,
  validateGameSessionSchema,
  validateUUID 
} from "./validation";
import { 
  generalRateLimit, 
  authRateLimit, 
  passwordResetRateLimit, 
  messageRateLimit, 
  eventCreationRateLimit 
} from "./rate-limiting";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security headers middleware
  app.use(securityHeaders);
  
  // General rate limiting for all API routes
  app.use('/api/', generalRateLimit);
  
  // Auth.js routes are handled in server/index.ts via authRouter

  // Initialize default communities
  await initializeDefaultCommunities();

  // Initialize collaborative streaming service
  const collaborativeStreaming = CollaborativeStreamingService.getInstance();

  // Health check endpoint
  app.get('/api/health', healthCheck);

  // Platform OAuth routes for account linking
  app.get('/api/platforms/:platform/oauth/initiate', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { platform } = req.params;
      
      if (!['twitch', 'youtube', 'facebook'].includes(platform)) {
        return res.status(400).json({ message: 'Unsupported platform' });
      }
      
      // Generate OAuth authorization URL
      const authUrl = await generatePlatformOAuthURL(platform, userId);
      res.json({ authUrl });
    } catch (error) {
      logger.error('Platform OAuth initiation error:', error);
      res.status(500).json({ message: 'Failed to initiate OAuth flow' });
    }
  });

  app.get('/api/platforms/:platform/oauth/callback', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { platform } = req.params;
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ message: 'Missing OAuth parameters' });
      }
      
      // Exchange code for tokens and save to storage
      const account = await handlePlatformOAuthCallback(platform, code as string, state as string, userId);
      res.json({ success: true, platform: account.platform, handle: account.handle });
    } catch (error) {
      logger.error('Platform OAuth callback error:', error);
      res.status(500).json({ message: 'Failed to complete OAuth flow' });
    }
  });

  app.get('/api/platforms/accounts', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const accounts = await storage.getUserPlatformAccounts(userId);
      res.json(accounts);
    } catch (error) {
      logger.error('Get platform accounts error:', error);
      res.status(500).json({ message: 'Failed to fetch platform accounts' });
    }
  });

  app.delete('/api/platforms/accounts/:id', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { id } = req.params;
      
      // Verify ownership before deletion
      const account = await storage.getUserPlatformAccounts(userId);
      const targetAccount = account.find(acc => acc.id === id);
      
      if (!targetAccount) {
        return res.status(404).json({ message: 'Platform account not found' });
      }
      
      await storage.deleteUserPlatformAccount(id);
      res.json({ success: true });
    } catch (error) {
      logger.error('Delete platform account error:', error);
      res.status(500).json({ message: 'Failed to delete platform account' });
    }
  });

  app.get('/api/platforms/status', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const accounts = await storage.getUserPlatformAccounts(userId);
      
      const status: Record<string, any> = {};
      
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
      
      res.json(status);
    } catch (error) {
      logger.error('Get platform status error:', error);
      res.status(500).json({ message: 'Failed to fetch platform status' });
    }
  });

  app.post('/api/platforms/:platform/refresh', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { platform } = req.params;
      
      // Import refresh function
      const { refreshPlatformToken } = await import('./services/platform-oauth');
      
      const newToken = await refreshPlatformToken(userId, platform);
      
      if (!newToken) {
        return res.status(400).json({ message: 'Failed to refresh token' });
      }
      
      res.json({ success: true, message: 'Token refreshed successfully' });
    } catch (error) {
      logger.error('Refresh platform token error:', error);
      res.status(500).json({ message: 'Failed to refresh platform token' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's communities
      const userCommunities = await storage.getUserCommunities(userId);
      
      res.json({
        ...user,
        communities: userCommunities,
      });
    } catch (error) {
      logger.error("Failed to fetch user", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/user/profile', isAuthenticated, validateRequest(validateUserProfileUpdateSchema), async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      
      const { 
        firstName, lastName, primaryCommunity, username, bio, location, 
        website, status, statusMessage, timezone, isPrivate, 
        showOnlineStatus, allowDirectMessages 
      } = req.body;
      
      const updates: Partial<UpsertUser> = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (primaryCommunity !== undefined) updates.primaryCommunity = primaryCommunity;
      if (username !== undefined) updates.username = username;
      if (bio !== undefined) updates.bio = bio;
      if (location !== undefined) updates.location = location;
      if (website !== undefined) updates.website = website;
      if (status !== undefined) updates.status = status;
      if (statusMessage !== undefined) updates.statusMessage = statusMessage;
      if (timezone !== undefined) updates.timezone = timezone;
      if (isPrivate !== undefined) updates.isPrivate = isPrivate;
      if (showOnlineStatus !== undefined) updates.showOnlineStatus = showOnlineStatus;
      if (allowDirectMessages !== undefined) updates.allowDirectMessages = allowDirectMessages;

      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      logger.error("Failed to update user profile", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get user profile (for viewing other users' profiles)
  app.get('/api/user/profile/:userId?', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const currentUserId = getAuthUserId(authenticatedReq);
      const targetUserId = req.params.userId || currentUserId;
      
      const user = await storage.getUser(targetUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get additional profile data
      const userCommunities = await storage.getUserCommunities(targetUserId);
      
      res.json({
        ...user,
        communities: userCommunities,
        isOwnProfile: currentUserId === targetUserId,
        friendCount: await storage.getFriendCount(targetUserId),
      });
    } catch (error) {
      logger.error("Failed to fetch user profile", error, { currentUserId: getAuthUserId(authenticatedReq), targetUserId: req.params.userId });
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Social links routes
  app.get('/api/user/social-links/:userId?', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const currentUserId = getAuthUserId(authenticatedReq);
      const targetUserId = req.params.userId || currentUserId;
      
      const socialLinks = await storage.getUserSocialLinks(targetUserId);
      res.json(socialLinks);
    } catch (error) {
      logger.error("Failed to fetch social links", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to fetch social links" });
    }
  });

  app.put('/api/user/social-links', isAuthenticated, validateRequest(validateSocialLinksSchema), async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { links } = req.body;
      
      const updatedLinks = await storage.updateUserSocialLinks(userId, links);
      res.json(updatedLinks);
    } catch (error) {
      logger.error("Failed to update social links", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to update social links" });
    }
  });

  // Gaming profiles routes
  app.get('/api/user/gaming-profiles/:userId?', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const currentUserId = getAuthUserId(authenticatedReq);
      const targetUserId = req.params.userId || currentUserId;
      
      const gamingProfiles = await storage.getUserGamingProfiles(targetUserId);
      res.json(gamingProfiles);
    } catch (error) {
      logger.error("Failed to fetch gaming profiles", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to fetch gaming profiles" });
    }
  });

  // Friendship routes
  app.get('/api/friends', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      logger.error("Failed to fetch friends", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get('/api/friend-requests', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const friendRequests = await storage.getFriendRequests(userId);
      res.json(friendRequests);
    } catch (error) {
      logger.error("Failed to fetch friend requests", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.post('/api/friend-requests', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const requesterId = getAuthUserId(authenticatedReq);
      const { addresseeId } = req.body;
      
      if (!addresseeId) {
        return res.status(400).json({ message: "Addressee ID is required" });
      }

      if (requesterId === addresseeId) {
        return res.status(400).json({ message: "Cannot send friend request to yourself" });
      }

      // Check if friendship already exists
      const existingFriendship = await storage.checkFriendshipStatus(requesterId, addresseeId);
      if (existingFriendship) {
        return res.status(400).json({ message: "Friendship request already exists" });
      }

      const friendship = await storage.sendFriendRequest(requesterId, addresseeId);
      
      // Create notification for the addressee
      await storage.createNotification({
        userId: addresseeId,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `You have a new friend request`,
        data: { friendshipId: friendship.id, requesterId },
      });
      
      res.status(201).json(friendship);
    } catch (error) {
      logger.error("Failed to send friend request", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.put('/api/friend-requests/:id', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['accepted', 'declined', 'blocked'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const friendship = await storage.respondToFriendRequest(id, status);
      
      // Create notification for the requester if accepted
      if (status === 'accepted') {
        await storage.createNotification({
          userId: friendship.requesterId,
          type: 'friend_accepted',
          title: 'Friend Request Accepted',
          message: `Your friend request was accepted`,
          data: { friendshipId: friendship.id },
        });
      }
      
      res.json(friendship);
    } catch (error) {
      logger.error("Failed to respond to friend request", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to respond to friend request" });
    }
  });

  app.delete('/api/friends/:id', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { id } = req.params;
      
      // First check if the user is part of this friendship
      const friendship = await storage.checkFriendshipStatus(userId, id);
      if (!friendship) {
        return res.status(404).json({ message: "Friendship not found" });
      }

      await storage.respondToFriendRequest(friendship.id, 'declined');
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to remove friend", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  // User settings routes
  app.get('/api/user/settings', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      logger.error("Failed to fetch user settings", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/user/settings', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const settingsData = { ...req.body, userId };
      
      const settings = await storage.upsertUserSettings(settingsData);
      res.json(settings);
    } catch (error) {
      logger.error("Failed to update user settings", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Matchmaking routes
  app.get('/api/matchmaking/preferences', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const preferences = await storage.getMatchmakingPreferences(userId);
      res.json(preferences);
    } catch (error) {
      logger.error("Failed to fetch matchmaking preferences", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put('/api/matchmaking/preferences', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const preferencesData = { ...req.body, userId };
      
      const preferences = await storage.upsertMatchmakingPreferences(preferencesData);
      res.json(preferences);
    } catch (error) {
      logger.error("Failed to update matchmaking preferences", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  app.post('/api/matchmaking/find-players', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      
      // Get user's current preferences or use request body preferences
      let preferences = await storage.getMatchmakingPreferences(userId);
      if (!preferences) {
        // Create default preferences if none exist
        preferences = await storage.upsertMatchmakingPreferences({
          userId,
          selectedGames: req.body.selectedGames || ["MTG"],
          selectedFormats: req.body.selectedFormats || ["commander"],
          powerLevelMin: req.body.powerLevelMin || 1,
          powerLevelMax: req.body.powerLevelMax || 10,
          playstyle: req.body.playstyle || "any",
          location: req.body.location || null,
          onlineOnly: req.body.onlineOnly || false,
          availability: req.body.availability || "any",
          language: req.body.language || "english",
          maxDistance: req.body.maxDistance || 50,
        });
      }
      
      const matches = await storage.findMatchingPlayers(userId, preferences);
      res.json(matches);
    } catch (error) {
      logger.error("Failed to find matching players", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to find matches" });
    }
  });

  // Tournament routes
  app.get('/api/tournaments', async (req, res) => {
    try {
      const communityId = req.query.community as string | undefined;
      const tournaments = await storage.getTournaments(communityId);
      res.json(tournaments);
    } catch (error) {
      logger.error("Failed to fetch tournaments", error);
      res.status(500).json({ message: "Failed to fetch tournaments" });
    }
  });

  app.get('/api/tournaments/:id', async (req, res) => {
    try {
      const tournamentId = req.params.id;
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.json(tournament);
    } catch (error) {
      logger.error("Failed to fetch tournament", error, { tournamentId: req.params.id });
      res.status(500).json({ message: "Failed to fetch tournament" });
    }
  });

  app.post('/api/tournaments', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const tournamentData = { ...req.body, organizerId: userId };
      
      const tournament = await storage.createTournament(tournamentData);
      res.json(tournament);
    } catch (error) {
      logger.error("Failed to create tournament", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to create tournament" });
    }
  });

  app.post('/api/tournaments/:id/join', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const tournamentId = req.params.id;
      
      const participant = await storage.joinTournament(tournamentId, userId);
      res.json(participant);
    } catch (error) {
      logger.error("Failed to join tournament", error, { userId: getAuthUserId(authenticatedReq), tournamentId: req.params.id });
      res.status(500).json({ message: "Failed to join tournament" });
    }
  });

  app.delete('/api/tournaments/:id/leave', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const tournamentId = req.params.id;
      
      const success = await storage.leaveTournament(tournamentId, userId);
      if (success) {
        res.json({ message: "Left tournament successfully" });
      } else {
        res.status(404).json({ message: "Tournament participation not found" });
      }
    } catch (error) {
      logger.error("Failed to leave tournament", error, { userId: getAuthUserId(authenticatedReq), tournamentId: req.params.id });
      res.status(500).json({ message: "Failed to leave tournament" });
    }
  });

  // Forum routes
  app.get('/api/forum/posts', async (req, res) => {
    try {
      const { communityId, category, limit, offset } = req.query;
      
      if (!communityId) {
        return res.status(400).json({ message: "Community ID is required" });
      }
      
      const posts = await storage.getForumPosts(communityId as string, {
        category: category as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      
      res.json(posts);
    } catch (error) {
      logger.error("Failed to fetch forum posts", error, { communityId: req.query.communityId });
      res.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });

  app.get('/api/forum/posts/:id', async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.query.userId as string;
      
      const post = await storage.getForumPost(postId, userId);
      if (!post) {
        return res.status(404).json({ message: "Forum post not found" });
      }
      
      res.json(post);
    } catch (error) {
      logger.error("Failed to fetch forum post", error, { postId: req.params.id });
      res.status(500).json({ message: "Failed to fetch forum post" });
    }
  });

  app.post('/api/forum/posts', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const postData = { ...req.body, authorId: userId };
      
      const post = await storage.createForumPost(postData);
      res.json(post);
    } catch (error) {
      logger.error("Failed to create forum post", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to create forum post" });
    }
  });

  app.put('/api/forum/posts/:id', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const postId = req.params.id;
      const userId = getAuthUserId(authenticatedReq);
      
      // Check if user owns the post
      const existingPost = await storage.getForumPost(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Forum post not found" });
      }
      if (existingPost.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this post" });
      }
      
      const updatedPost = await storage.updateForumPost(postId, req.body);
      res.json(updatedPost);
    } catch (error) {
      logger.error("Failed to update forum post", error, { postId: req.params.id });
      res.status(500).json({ message: "Failed to update forum post" });
    }
  });

  app.delete('/api/forum/posts/:id', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const postId = req.params.id;
      const userId = getAuthUserId(authenticatedReq);
      
      // Check if user owns the post
      const existingPost = await storage.getForumPost(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Forum post not found" });
      }
      if (existingPost.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }
      
      await storage.deleteForumPost(postId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to delete forum post", error, { postId: req.params.id });
      res.status(500).json({ message: "Failed to delete forum post" });
    }
  });

  app.post('/api/forum/posts/:id/like', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const postId = req.params.id;
      const userId = getAuthUserId(authenticatedReq);
      
      await storage.likeForumPost(postId, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to like forum post", error, { postId: req.params.id });
      res.status(500).json({ message: "Failed to like forum post" });
    }
  });

  app.delete('/api/forum/posts/:id/like', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const postId = req.params.id;
      const userId = getAuthUserId(authenticatedReq);
      
      await storage.unlikeForumPost(postId, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to unlike forum post", error, { postId: req.params.id });
      res.status(500).json({ message: "Failed to unlike forum post" });
    }
  });

  app.get('/api/forum/posts/:id/replies', async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.query.userId as string;
      
      const replies = await storage.getForumReplies(postId, userId);
      res.json(replies);
    } catch (error) {
      logger.error("Failed to fetch forum replies", error, { postId: req.params.id });
      res.status(500).json({ message: "Failed to fetch forum replies" });
    }
  });

  app.post('/api/forum/posts/:id/replies', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const postId = req.params.id;
      const userId = getAuthUserId(authenticatedReq);
      const replyData = { ...req.body, postId, authorId: userId };
      
      const reply = await storage.createForumReply(replyData);
      res.json(reply);
    } catch (error) {
      logger.error("Failed to create forum reply", error, { postId: req.params.id });
      res.status(500).json({ message: "Failed to create forum reply" });
    }
  });

  app.post('/api/forum/replies/:id/like', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const replyId = req.params.id;
      const userId = getAuthUserId(authenticatedReq);
      
      await storage.likeForumReply(replyId, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to like forum reply", error, { replyId: req.params.id });
      res.status(500).json({ message: "Failed to like forum reply" });
    }
  });

  app.delete('/api/forum/replies/:id/like', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const replyId = req.params.id;
      const userId = getAuthUserId(authenticatedReq);
      
      await storage.unlikeForumReply(replyId, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to unlike forum reply", error, { replyId: req.params.id });
      res.status(500).json({ message: "Failed to unlike forum reply" });
    }
  });

  // Analytics routes - comprehensive analytics system
  app.use('/api/analytics', analyticsRouter);
  
  // Cache health and management routes
  app.use('/api/cache', cacheHealthRouter);
  
  // Database health and monitoring routes
  app.use('/api/database', databaseHealthRouter);
  
  // Backup and recovery management routes
  app.use('/api/backup', backupRouter);
  
  // Monitoring and alerting routes
  app.use('/api/monitoring', monitoringRouter);
  
  // Real-time matching and AI recommendations
  app.use('/api/matching', matchingRouter);

  // ========================================
  // COLLABORATIVE STREAMING API ROUTES
  // ========================================

  // Create collaborative stream event
  app.post('/api/collaborative-streams', 
    isAuthenticated, 
    eventCreationRateLimit,
    validateRequest(insertCollaborativeStreamEventSchema), 
    async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        
        const event = await collaborativeStreaming.createCollaborativeEvent(userId, req.body);
        
        logger.info('Collaborative stream event created', { 
          eventId: event.id, 
          userId, 
          title: event.title 
        });
        res.status(201).json(event);
      } catch (error) {
        logger.error('Failed to create collaborative stream event', error, { userId: getAuthUserId(authenticatedReq) });
        res.status(500).json({ message: 'Failed to create collaborative stream event' });
      }
    }
  );

  // Get user's collaborative stream events
  app.get('/api/collaborative-streams', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const events = await storage.getUserCollaborativeStreamEvents(userId);
      res.json(events);
    } catch (error) {
      logger.error('Failed to get collaborative stream events', error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Failed to get collaborative stream events' });
    }
  });

  // Get specific collaborative stream event
  app.get('/api/collaborative-streams/:eventId', isAuthenticated, validateParams('eventId', validateUUID, 'Invalid event ID format'), async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { eventId } = req.params;
      
      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Collaborative stream event not found' });
      }
      
      res.json(event);
    } catch (error) {
      logger.error('Failed to get collaborative stream event', error, { 
        eventId: req.params.eventId, 
        userId: getAuthUserId(authenticatedReq) 
      });
      res.status(500).json({ message: 'Failed to get collaborative stream event' });
    }
  });

  // Update collaborative stream event
  app.patch('/api/collaborative-streams/:eventId', 
    isAuthenticated, 
    validateParams('eventId', validateUUID, 'Invalid event ID format'),
    validateRequest(insertCollaborativeStreamEventSchema.partial()),
    async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const { eventId } = req.params;
        
        // Check if user is the event creator
        const event = await storage.getCollaborativeStreamEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: 'Collaborative stream event not found' });
        }
        if (event.creatorId !== userId) {
          return res.status(403).json({ message: 'Only event creator can update the event' });
        }
        
        const updatedEvent = await storage.updateCollaborativeStreamEvent(eventId, req.body);
        res.json(updatedEvent);
      } catch (error) {
        logger.error('Failed to update collaborative stream event', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        res.status(500).json({ message: 'Failed to update collaborative stream event' });
      }
    }
  );

  // Delete collaborative stream event
  app.delete('/api/collaborative-streams/:eventId', 
    isAuthenticated, 
    validateParams('eventId', validateUUID, 'Invalid event ID format'),
    async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const { eventId } = req.params;
        
        // Check if user is the event creator
        const event = await storage.getCollaborativeStreamEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: 'Collaborative stream event not found' });
        }
        if (event.creatorId !== userId) {
          return res.status(403).json({ message: 'Only event creator can delete the event' });
        }
        
        await storage.deleteCollaborativeStreamEvent(eventId);
        res.json({ message: 'Collaborative stream event deleted successfully' });
      } catch (error) {
        logger.error('Failed to delete collaborative stream event', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        res.status(500).json({ message: 'Failed to delete collaborative stream event' });
      }
    }
  );

  // Get collaboration suggestions for an event
  app.get('/api/collaborative-streams/:eventId/suggestions', 
    isAuthenticated, 
    validateParams('eventId', validateUUID, 'Invalid event ID format'),
    async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const { eventId } = req.params;
        
        const suggestions = await collaborativeStreaming.getCollaborationSuggestions(eventId, userId);
        res.json(suggestions);
      } catch (error) {
        logger.error('Failed to get collaboration suggestions', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        res.status(500).json({ message: 'Failed to get collaboration suggestions' });
      }
    }
  );

  // Add collaborator to stream event
  app.post('/api/collaborative-streams/:eventId/collaborators', 
    isAuthenticated,
    validateParams('eventId', validateUUID, 'Invalid event ID format'),
    validateRequest(insertStreamCollaboratorSchema),
    async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const { eventId } = req.params;
        
        const collaborator = await collaborativeStreaming.addCollaborator(eventId, req.body);
        res.status(201).json(collaborator);
      } catch (error) {
        logger.error('Failed to add collaborator', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        res.status(500).json({ message: 'Failed to add collaborator' });
      }
    }
  );

  // Get collaborators for stream event
  app.get('/api/collaborative-streams/:eventId/collaborators', 
    isAuthenticated, 
    validateParams('eventId', validateUUID, 'Invalid event ID format'),
    async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const { eventId } = req.params;
        const collaborators = await storage.getStreamCollaborators(eventId);
        res.json(collaborators);
      } catch (error) {
        logger.error('Failed to get collaborators', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        res.status(500).json({ message: 'Failed to get collaborators' });
      }
    }
  );

  // Update collaborator status
  app.patch('/api/collaborative-streams/:eventId/collaborators/:collaboratorId', 
    isAuthenticated,
    validateParams('eventId', validateUUID, 'Invalid event ID format'),
    validateRequest(insertStreamCollaboratorSchema.partial()),
    async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const { eventId, collaboratorId } = req.params;
        
        const collaborator = await storage.updateStreamCollaborator(collaboratorId, req.body);
        res.json(collaborator);
      } catch (error) {
        logger.error('Failed to update collaborator', error, { 
          eventId: req.params.eventId,
          collaboratorId: req.params.collaboratorId,
          userId: getAuthUserId(authenticatedReq) 
        });
        res.status(500).json({ message: 'Failed to update collaborator' });
      }
    }
  );

  // Remove collaborator from stream event
  app.delete('/api/collaborative-streams/:eventId/collaborators/:collaboratorId', 
    isAuthenticated,
    validateParams('eventId', validateUUID, 'Invalid event ID format'),
    async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const { eventId, collaboratorId } = req.params;
        
        await storage.deleteStreamCollaborator(collaboratorId);
        res.json({ message: 'Collaborator removed successfully' });
      } catch (error) {
        logger.error('Failed to remove collaborator', error, { 
          eventId: req.params.eventId,
          collaboratorId: req.params.collaboratorId,
          userId: getAuthUserId(authenticatedReq) 
        });
        res.status(500).json({ message: 'Failed to remove collaborator' });
      }
    }
  );

  // Start coordination session
  app.post('/api/collaborative-streams/:eventId/coordination/start', 
    isAuthenticated,
    validateParams('eventId', validateUUID, 'Invalid event ID format'),
    async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const { eventId } = req.params;
        
        const session = await collaborativeStreaming.startCoordinationSession(eventId, userId);
        res.status(201).json(session);
      } catch (error) {
        logger.error('Failed to start coordination session', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        res.status(500).json({ message: 'Failed to start coordination session' });
      }
    }
  );

  // Update coordination session phase
  app.patch('/api/collaborative-streams/:eventId/coordination/phase', 
    isAuthenticated,
    validateParams('eventId', validateUUID, 'Invalid event ID format'),
    async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const { eventId } = req.params;
        const { phase } = req.body;
        
        await collaborativeStreaming.updateCoordinationPhase(eventId, phase, userId);
        res.json({ message: 'Coordination phase updated successfully' });
      } catch (error) {
        logger.error('Failed to update coordination phase', error, { 
          eventId: req.params.eventId,
          phase: req.body.phase,
          userId: getAuthUserId(authenticatedReq) 
        });
        res.status(500).json({ message: 'Failed to update coordination phase' });
      }
    }
  );

  // Get coordination session status
  app.get('/api/collaborative-streams/:eventId/coordination/status', 
    isAuthenticated,
    validateParams('eventId', validateUUID, 'Invalid event ID format'),
    async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const { eventId } = req.params;
        
        const status = await collaborativeStreaming.getCoordinationStatus(eventId);
        res.json(status);
      } catch (error) {
        logger.error('Failed to get coordination status', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        res.status(500).json({ message: 'Failed to get coordination status' });
      }
    }
  );

  // Data export route
  app.get('/api/user/export-data', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      
      // Get comprehensive user data for export
      const userData = await storage.exportUserData(userId);
      
      logger.info("Data export completed", { userId });
      res.json(userData);
    } catch (error) {
      logger.error("Failed to export user data", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Account deletion route  
  app.delete('/api/user/account', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      
      // Perform cascade deletion of user data
      const success = await storage.deleteUserAccount(userId);
      
      if (success) {
        logger.info("Account deletion completed", { userId });
        
        // Note: Auth.js handles session cleanup automatically when user is deleted
        // Clear any additional cookies if needed
        res.clearCookie('authjs.session-token');
        res.clearCookie('__Secure-authjs.session-token');
        
        res.json({ 
          message: "Account deleted successfully"
        });
      } else {
        res.status(404).json({ message: "User account not found" });
      }
    } catch (error) {
      logger.error("Failed to delete user account", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Password reset routes
  app.post('/api/auth/forgot-password', passwordResetRateLimit, validateRequest(validateEmailSchema), async (req, res) => {
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
          TOKEN_EXPIRY.PASSWORD_RESET
        );
        
        // Store token in database
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.PASSWORD_RESET * 1000);
        await storage.createPasswordResetToken({
          email,
          token: resetToken,
          expiresAt,
        });

        // Send email with trusted base URL
        const baseUrl = process.env.AUTH_URL || process.env.PUBLIC_WEB_URL || 'https://shuffleandsync.org';
        await sendPasswordResetEmail(email, resetToken, baseUrl, userExists.firstName || undefined);
      }

      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      logger.error('Password reset request failed', { email: req.body.email });
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      res.json({ message: "Token is valid", email: resetToken.email });
    } catch (error) {
      logger.error("Failed to verify reset token", error, { token: req.body.token });
      res.status(500).json({ message: "Failed to verify reset token" });
    }
  });

  app.post('/api/auth/reset-password', passwordResetRateLimit, validateRequest(validatePasswordResetSchema), async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      // Validate password strength with enhanced security rules
      const validation = validatePasswordStrength(newPassword);
      if (!validation.valid) {
        return res.status(400).json({ 
          message: "Password does not meet security requirements",
          details: validation.errors
        });
      }

      // Verify JWT token
      const jwtResult = await verifyPasswordResetJWT(token);
      if (!jwtResult.valid) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Check token in database
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Find user by email from token
      const user = await storage.getUserByEmail(resetToken.email);
      if (!user) {
        return res.status(400).json({ message: "Invalid reset request" });
      }
      
      // Hash new password with Argon2
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user password
      await storage.updateUser(user.id, { password: hashedPassword });
      
      // Mark token as used
      await storage.markTokenAsUsed(token);
      
      // Log successful password reset (without sensitive data)
      logger.info('Password reset completed successfully', { userId: user.id, email: user.email });
      
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      logger.error('Password reset failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Email verification endpoints
  app.post('/api/auth/send-verification-email', authRateLimit, validateRequest(validateEmailSchema), async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if email exists to prevent enumeration attacks
        return res.json({ message: "If an account with that email exists, a verification email has been sent." });
      }

      // Check if email is already verified - but don't reveal this to prevent enumeration
      if (user.isEmailVerified) {
        return res.json({ message: "If an account with that email exists, a verification email has been sent." });
      }

      // Invalidate any existing verification tokens for this user
      await storage.invalidateUserEmailVerificationTokens(user.id);
      
      // Generate JWT token for email verification
      const verificationToken = await generateEmailVerificationJWT(
        user.id, 
        email, 
        TOKEN_EXPIRY.EMAIL_VERIFICATION
      );
      
      // Store token in database
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION * 1000);
      await storage.createEmailVerificationToken({
        userId: user.id,
        email,
        token: verificationToken,
        expiresAt,
      });

      // Send verification email with trusted base URL
      const baseUrl = process.env.AUTH_URL || process.env.PUBLIC_WEB_URL || 'https://shuffleandsync.org';
      await sendEmailVerificationEmail(email, verificationToken, baseUrl, user.firstName || undefined);

      res.json({ message: "If an account with that email exists, a verification email has been sent." });
    } catch (error) {
      logger.error("Failed to send verification email", error, { email: req.body.email });
      res.status(500).json({ message: "Failed to send verification email" });
    }
  });

  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Verification token is required" });
      }

      // Verify JWT token
      const jwtResult = await verifyEmailVerificationJWT(token);
      
      if (!jwtResult.valid) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Check token in database
      const dbToken = await storage.getEmailVerificationToken(token);
      
      if (!dbToken) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Mark token as used
      await storage.markEmailVerificationTokenAsUsed(token);

      // Update user's email verification status
      await storage.updateUser(dbToken.userId, { 
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      });

      res.json({ 
        message: "Email verified successfully",
        redirectUrl: "/dashboard" 
      });
    } catch (error) {
      logger.error("Failed to verify email", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  app.post('/api/auth/resend-verification-email', authRateLimit, async (req, res) => {
    try {
      // Get user from session or request body
      const userId = getAuthUserId(req);
      const { email } = req.body;
      
      if (!userId && !email) {
        return res.status(400).json({ message: "User session or email is required" });
      }

      let user;
      if (userId) {
        user = await storage.getUser(userId);
      } else if (email) {
        user = await storage.getUserByEmail(email);
      }
      
      if (!user) {
        // Don't reveal if user exists to prevent enumeration attacks
        return res.json({ message: "If an account exists, a verification email has been sent." });
      }

      // Check if email is already verified - but don't reveal this to prevent enumeration
      if (user.isEmailVerified) {
        return res.json({ message: "If an account exists, a verification email has been sent." });
      }

      // Check for existing unexpired token
      const existingToken = await storage.getEmailVerificationTokenByUserId(user.id);
      if (existingToken) {
        return res.status(429).json({ 
          message: "A verification email was already sent recently. Please check your email or wait before requesting another." 
        });
      }

      // Invalidate any existing verification tokens for this user
      await storage.invalidateUserEmailVerificationTokens(user.id);
      
      // Generate new JWT token
      const verificationToken = await generateEmailVerificationJWT(
        user.id, 
        user.email!, 
        TOKEN_EXPIRY.EMAIL_VERIFICATION
      );
      
      // Store token in database
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION * 1000);
      await storage.createEmailVerificationToken({
        userId: user.id,
        email: user.email!,
        token: verificationToken,
        expiresAt,
      });

      // Send verification email with trusted base URL
      const baseUrl = process.env.AUTH_URL || process.env.PUBLIC_WEB_URL || 'https://shuffleandsync.org';
      await sendEmailVerificationEmail(user.email!, verificationToken, baseUrl, user.firstName || undefined);

      res.json({ message: "If an account exists, a verification email has been sent." });
    } catch (error) {
      logger.error("Failed to resend verification email", error, { userId: getAuthUserId(req) });
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  // Contact form route
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const emailSent = await sendContactEmail({ name, email, subject, message });
      
      if (emailSent) {
        logger.info("Contact email sent successfully", { senderEmail: email, subject });
        res.json({ message: "Message sent successfully" });
      } else {
        logger.warn("Contact email failed to send", { senderEmail: email, subject });
        res.status(500).json({ message: "Failed to send message" });
      }
    } catch (error) {
      logger.error("Contact form error", error, { email: req.body?.email });
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Communities routes
  app.get('/api/communities', async (req, res) => {
    try {
      const communities = await storage.getCommunities();
      res.json(communities);
    } catch (error) {
      logger.error("Failed to fetch communities", error);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  app.get('/api/communities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const community = await storage.getCommunity(id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      res.json(community);
    } catch (error) {
      logger.error("Failed to fetch community", error, { id: req.params.id });
      res.status(500).json({ message: "Failed to fetch community" });
    }
  });

  // User community management
  app.post('/api/user/communities/:communityId/join', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { communityId } = req.params;
      
      // Verify community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      const userCommunity = await storage.joinCommunity({
        userId,
        communityId,
        isPrimary: false,
      });

      res.json(userCommunity);
    } catch (error) {
      logger.error("Failed to join community", error, { userId: getAuthUserId(authenticatedReq), communityId: req.body.communityId });
      res.status(500).json({ message: "Failed to join community" });
    }
  });

  app.post('/api/user/communities/:communityId/set-primary', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { communityId } = req.params;
      
      await storage.setPrimaryCommunity(userId, communityId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to set primary community", error, { userId: getAuthUserId(authenticatedReq), communityId: req.body.communityId });
      res.status(500).json({ message: "Failed to set primary community" });
    }
  });

  // Theme preferences
  app.get('/api/user/theme-preferences', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const preferences = await storage.getUserThemePreferences(userId);
      res.json(preferences);
    } catch (error) {
      logger.error("Failed to fetch theme preferences", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to fetch theme preferences" });
    }
  });

  app.post('/api/user/theme-preferences', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { communityId, themeMode, customColors } = req.body;
      
      const preference = await storage.upsertThemePreference({
        userId,
        communityId,
        themeMode,
        customColors,
      });

      res.json(preference);
    } catch (error) {
      logger.error("Failed to update theme preferences", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to update theme preferences" });
    }
  });

  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const { communityId, type, upcoming } = req.query;
      const userId = (req as any).user?.claims?.sub;
      
      const events = await storage.getEvents({
        userId,
        communityId: communityId as string,
        type: type as string,
        upcoming: upcoming === 'true',
      });
      
      res.json(events);
    } catch (error) {
      logger.error("Failed to fetch events", error, { filters: req.query });
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.claims?.sub;
      
      const event = await storage.getEvent(id, userId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      logger.error("Failed to fetch event", error, { eventId: req.params.id });
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events', isAuthenticated, eventCreationRateLimit, validateRequest(validateEventSchema), async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const eventData = insertEventSchema.parse({
        ...req.body,
        creatorId: userId,
        hostId: userId, // Set host to the same user who created the event
      });
      
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      logger.error("Failed to create event", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put('/api/events/:id', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      const userId = getAuthUserId(authenticatedReq);
      
      // Check if user owns the event
      const existingEvent = await storage.getEvent(id);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (existingEvent.creatorId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this event" });
      }
      
      const eventData = insertEventSchema.partial().parse(req.body);
      const updatedEvent = await storage.updateEvent(id, eventData);
      
      res.json(updatedEvent);
    } catch (error) {
      logger.error("Failed to update event", error, { eventId: req.params.id });
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete('/api/events/:id', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      const userId = getAuthUserId(authenticatedReq);
      
      // Check if user owns the event
      const existingEvent = await storage.getEvent(id);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (existingEvent.creatorId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this event" });
      }
      
      await storage.deleteEvent(id);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to delete event", error, { eventId: req.params.id });
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Event attendance routes
  app.post('/api/events/:eventId/join', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { eventId } = req.params;
      const userId = getAuthUserId(authenticatedReq);
      const { status = 'attending' } = req.body;
      
      // Verify event exists
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const { role = 'participant', playerType = 'main' } = req.body;
      
      const attendee = await storage.joinEvent({
        eventId,
        userId,
        status,
        role,
        playerType,
      });

      // Get current event details for notifications
      const updatedEvent = await storage.getEvent(eventId);
      const joiningUser = await storage.getUser(userId);
      
      if (updatedEvent && joiningUser) {
        // Notify event creator that someone joined
        if (updatedEvent.creatorId !== userId) {
          await storage.createNotification({
            userId: updatedEvent.creatorId,
            type: 'event_join',
            title: 'New Player Joined Your Pod',
            message: `${joiningUser.firstName || joiningUser.email} joined your ${updatedEvent.title} game pod`,
            data: { eventId, playerType, joinedUserId: userId },
            priority: 'normal',
            communityId: updatedEvent.communityId,
          });
        }

        // Check if pod is now full or almost full for additional notifications
        const attendees = await storage.getEventAttendees(eventId);
        const mainPlayers = attendees.filter(a => a.playerType === 'main' && a.status === 'attending').length;
        const playerSlots = updatedEvent.playerSlots || 4;

        if (mainPlayers >= playerSlots) {
          // Pod is full - notify all participants
          for (const attendeeRecord of attendees) {
            if (attendeeRecord.userId !== userId) {
              await storage.createNotification({
                userId: attendeeRecord.userId,
                type: 'pod_filled',
                title: 'Game Pod is Full!',
                message: `${updatedEvent.title} is now at full capacity`,
                data: { eventId },
                priority: 'high',
                communityId: updatedEvent.communityId,
              });
            }
          }
        } else if (mainPlayers === playerSlots - 1) {
          // Pod is almost full
          await storage.createNotification({
            userId: updatedEvent.creatorId,
            type: 'pod_almost_full',
            title: 'Game Pod Almost Full',
            message: `${updatedEvent.title} needs 1 more player`,
            data: { eventId },
            priority: 'normal',
            communityId: updatedEvent.communityId,
          });
        }
      }
      
      res.json(attendee);
    } catch (error) {
      logger.error("Failed to join event", error, { userId: getAuthUserId(authenticatedReq), eventId: req.body.eventId });
      res.status(500).json({ message: "Failed to join event" });
    }
  });

  app.delete('/api/events/:eventId/leave', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { eventId } = req.params;
      const userId = getAuthUserId(authenticatedReq);
      
      // Get event and user details before leaving
      const event = await storage.getEvent(eventId);
      const leavingUser = await storage.getUser(userId);
      
      await storage.leaveEvent(eventId, userId);

      // Notify event creator that someone left
      if (event && leavingUser && event.creatorId !== userId) {
        await storage.createNotification({
          userId: event.creatorId,
          type: 'event_leave',
          title: 'Player Left Your Pod',
          message: `${leavingUser.firstName || leavingUser.email} left your ${event.title} game pod`,
          data: { eventId, leftUserId: userId },
          priority: 'normal',
          communityId: event.communityId,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to leave event", error, { userId: getAuthUserId(authenticatedReq), eventId: req.params.eventId });
      res.status(500).json({ message: "Failed to leave event" });
    }
  });

  app.get('/api/events/:eventId/attendees', async (req, res) => {
    try {
      const { eventId } = req.params;
      
      const attendees = await storage.getEventAttendees(eventId);
      res.json(attendees);
    } catch (error) {
      logger.error("Failed to fetch event attendees", error, { eventId: req.params.eventId });
      res.status(500).json({ message: "Failed to fetch event attendees" });
    }
  });

  app.get('/api/user/events', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      
      const attendance = await storage.getUserEventAttendance(userId);
      res.json(attendance);
    } catch (error) {
      logger.error("Failed to fetch user events", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: "Failed to fetch user events" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { unreadOnly, limit } = req.query;
      const notifications = await storage.getUserNotifications(userId, {
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(notifications);
    } catch (error) {
      logger.error("Failed to fetch notifications", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const notificationData = { ...req.body, userId: userId };
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      logger.error("Failed to create notification", error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to mark notification as read", error, { notificationId: req.params.id });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to mark all notifications as read", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Message routes
  app.get('/api/messages', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { eventId, communityId, limit } = req.query;
      const messages = await storage.getUserMessages(userId, {
        eventId: eventId as string,
        communityId: communityId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(messages);
    } catch (error) {
      logger.error("Failed to fetch messages", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const messageData = { ...req.body, senderId: userId };
      const message = await storage.sendMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      logger.error("Failed to send message", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/conversations/:userId', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const currentUserId = getAuthUserId(authenticatedReq);
      const { userId } = req.params;
      const conversation = await storage.getConversation(currentUserId, userId);
      res.json(conversation);
    } catch (error) {
      logger.error("Failed to fetch conversation", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Calendar routes for game pod scheduling
  app.post('/api/events/bulk', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { events } = req.body;
      
      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ message: "Events array is required" });
      }

      // Add creator and host information to each event
      const eventData = events.map((event: any) => ({
        ...event,
        creatorId: userId,
        hostId: userId,
      }));

      const createdEvents = await storage.createBulkEvents(eventData);
      res.status(201).json(createdEvents);
    } catch (error) {
      logger.error("Failed to create bulk events", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/events/recurring', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const eventData = {
        ...req.body,
        creatorId: userId,
        hostId: userId,
      };

      const createdEvents = await storage.createRecurringEvents(eventData, req.body.recurrenceEndDate);
      res.status(201).json(createdEvents);
    } catch (error) {
      logger.error("Failed to create recurring events", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/calendar/events', async (req, res) => {
    try {
      const { communityId, startDate, endDate, type } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }

      const events = await storage.getCalendarEvents({
        communityId: communityId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        type: type as string,
      });
      
      res.json(events);
    } catch (error) {
      logger.error("Failed to fetch calendar events", error, { filters: req.query });
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  // Game session routes
  app.get('/api/game-sessions', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { eventId, communityId, hostId, status } = req.query;
      const gameSessions = await storage.getGameSessions({
        eventId: eventId as string,
        communityId: communityId as string,
        hostId: hostId as string,
        status: status as string,
      });
      res.json(gameSessions);
    } catch (error) {
      logger.error("Failed to fetch game sessions", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-sessions', isAuthenticated, validateRequest(validateGameSessionSchema), async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const sessionData = { ...req.body, hostId: userId };
      const gameSession = await storage.createGameSession(sessionData);
      res.status(201).json(gameSession);
    } catch (error) {
      logger.error("Failed to create game session", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-sessions/:id/join', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const user = authenticatedReq.user;
      const { id } = req.params;
      await storage.joinGameSession(id, userId);
      
      // Create notification for host when someone joins
      const gameSession = await storage.getGameSessions({ eventId: id });
      if (gameSession.length > 0) {
        await storage.createNotification({
          userId: gameSession[0].hostId,
          type: 'event_join',
          title: 'Player Joined Game',
          message: `${user?.name || user?.email} joined your game session`,
          data: { gameSessionId: id, playerId: userId },
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to join game session", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get single game session
  app.get('/api/game-sessions/:id', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      const gameSession = await storage.getGameSessionById(id);
      
      if (!gameSession) {
        return res.status(404).json({ message: 'Game session not found' });
      }
      
      res.json(gameSession);
    } catch (error) {
      logger.error("Failed to fetch game session", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-sessions/:id/leave', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const user = authenticatedReq.user;
      const { id } = req.params;
      await storage.leaveGameSession(id, userId);
      
      // Create notification for host when someone leaves
      const gameSession = await storage.getGameSessions({ eventId: id });
      if (gameSession.length > 0) {
        await storage.createNotification({
          userId: gameSession[0].hostId,
          type: 'event_leave',
          title: 'Player Left Game',
          message: `${user?.name || user?.email} left your game session`,
          data: { gameSessionId: id, playerId: userId },
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to leave game session", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-sessions/:id/spectate', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const user = authenticatedReq.user;
      const { id } = req.params;
      await storage.spectateGameSession(id, userId);
      
      // Create notification for host when someone starts spectating
      const gameSession = await storage.getGameSessions({ eventId: id });
      if (gameSession.length > 0) {
        await storage.createNotification({
          userId: gameSession[0].hostId,
          type: 'spectator_join',
          title: 'New Spectator',
          message: `${user?.name || user?.email} is now spectating your game`,
          data: { gameSessionId: id, spectatorId: userId },
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to spectate game session", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-sessions/:id/leave-spectating', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { id } = req.params;
      await storage.leaveSpectating(id, userId);
      
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to leave spectating", error, { userId: getAuthUserId(authenticatedReq) });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time game coordination
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Extended WebSocket type with additional properties
  type ExtendedWebSocket = WebSocket & {
    userId?: string;
    userName?: string;
    userAvatar?: string;
    sessionId?: string;
  };
  
  // Game room connections: sessionId -> Set of WebSocket connections
  const gameRooms = new Map<string, Set<ExtendedWebSocket>>();
  
  // Collaborative streaming room connections: eventId -> Set of WebSocket connections
  const collaborativeStreamRooms = new Map<string, Set<ExtendedWebSocket>>();
  
  wss.on('connection', async (ws, req) => {
    logger.info('WebSocket connection attempt');
    
    // Extract and validate Auth.js session from request
    let authenticatedUserId: string | null = null;
    let authenticatedUser: any = null;
    
    try {
      // Parse session from Auth.js cookies
      const cookies = req.headers.cookie;
      if (!cookies) {
        logger.warn('WebSocket connection rejected - no cookies');
        ws.close(1008, 'Authentication required');
        return;
      }

      // Validate Origin to prevent CSRF attacks with exact URL parsing
      const origin = req.headers.origin;
      const host = req.headers.host;
      
      if (!origin) {
        logger.warn('WebSocket connection rejected - no origin header');
        ws.close(1008, 'Origin required');
        return;
      }

      try {
        const originUrl = new URL(origin);
        const allowedOrigins = new Set([
          process.env.AUTH_URL ? new URL(process.env.AUTH_URL).origin : null,
          `http://localhost:${process.env.PORT || 5000}`,
          `https://localhost:${process.env.PORT || 5000}`,
          `http://${host}`,
          `https://${host}`
        ].filter(Boolean));

        if (!allowedOrigins.has(originUrl.origin)) {
          logger.warn('WebSocket connection rejected - origin not allowed', { 
            origin: originUrl.origin, 
            allowedOrigins: Array.from(allowedOrigins) 
          });
          ws.close(1008, 'Origin not allowed');
          return;
        }
        
        logger.info('WebSocket origin validation passed', { origin: originUrl.origin });
      } catch (error) {
        logger.warn('WebSocket connection rejected - invalid origin format', { origin, error });
        ws.close(1008, 'Invalid origin format');
        return;
      }

      try {
        // Use Auth.js session endpoint to get session
        const response = await fetch(`${process.env.AUTH_URL || `http://localhost:${process.env.PORT || 5000}`}/api/auth/session`, {
          headers: { cookie: cookies }
        });
        
        if (response.ok) {
          const session = await response.json();
          
          if (session?.user?.id) {
            authenticatedUserId = session.user.id;
            authenticatedUser = session.user;
            logger.info('WebSocket connection authenticated', { 
              userId: authenticatedUserId,
              userName: session.user.name || session.user.email 
            });
          } else {
            logger.warn('WebSocket connection rejected - no user in session');
            ws.close(1008, 'No valid session');
            return;
          }
        } else {
          logger.warn('WebSocket connection rejected - session endpoint failed', { status: response.status });
          ws.close(1008, 'Session validation failed');
          return;
        }
      } catch (authError) {
        logger.error('WebSocket Auth.js session validation failed', authError);
        ws.close(1008, 'Authentication error');
        return;
      }
    } catch (error) {
      logger.error('WebSocket authentication error', error);
      ws.close(1008, 'Authentication error');
      return;
    }

    if (!authenticatedUserId) {
      logger.warn('WebSocket connection rejected - no authenticated user');
      ws.close(1008, 'Authentication required');
      return;
    }

    logger.info('WebSocket connection established', { userId: authenticatedUserId });
    
    ws.on('message', async (data) => {
      try {
        const rawMessage = JSON.parse(data.toString());
        
        // Validate WebSocket message with Zod schema
        const validationResult = websocketMessageSchema.safeParse(rawMessage);
        if (!validationResult.success) {
          logger.warn('Invalid WebSocket message received', { 
            error: validationResult.error,
            message: rawMessage 
          });
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format',
            details: validationResult.error.format()
          }));
          return;
        }
        
        const message = validationResult.data;
        
        switch (message.type) {
          case 'join_room':
            const { sessionId, user } = message;
            
            // Add user info to WebSocket
            (ws as any).userId = user.id;
            (ws as any).userName = user.name;
            (ws as any).userAvatar = user.avatar;
            (ws as any).sessionId = sessionId;
            
            // Add to game room
            if (!gameRooms.has(sessionId)) {
              gameRooms.set(sessionId, new Set());
            }
            gameRooms.get(sessionId)?.add(ws as ExtendedWebSocket);
            
            // Notify other players
            const roomPlayers = Array.from(gameRooms.get(sessionId) || []).map(client => ({
              id: client.userId!,
              name: client.userName!,
              avatar: client.userAvatar
            }));
            
            // Broadcast to all players in room
            gameRooms.get(sessionId)?.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'player_joined',
                  player: { id: user.id, name: user.name, avatar: user.avatar },
                  players: roomPlayers
                }));
              }
            });
            break;
            
          case 'message':
            const room = gameRooms.get(message.sessionId);
            if (room) {
              const chatMessage = {
                type: 'message',
                message: {
                  id: Date.now().toString(),
                  senderId: message.user.id,
                  sender: {
                    firstName: message.user.name.split(' ')[0],
                    email: message.user.name,
                    profileImageUrl: message.user.avatar
                  },
                  content: message.content,
                  timestamp: new Date().toISOString(),
                  type: 'chat'
                }
              };
              
              room.forEach((client: ExtendedWebSocket) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(chatMessage));
                }
              });
            }
            break;
            
          case 'game_action':
            const gameRoom = gameRooms.get(message.sessionId);
            if (gameRoom) {
              gameRoom.forEach((client: ExtendedWebSocket) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'game_action',
                    action: message.action,
                    player: message.user.name,
                    result: message.data.result,
                    data: message.data
                  }));
                }
              });
            }
            break;
            
          case 'webrtc_offer':
            const offerRoom = gameRooms.get(message.sessionId);
            if (offerRoom) {
              // Relay offer to target player
              offerRoom.forEach((client: ExtendedWebSocket) => {
                if (client.userId === message.targetPlayer && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'webrtc_offer',
                    fromPlayer: (ws as ExtendedWebSocket).userId,
                    offer: message.offer
                  }));
                }
              });
            }
            break;
            
          case 'webrtc_answer':
            const answerRoom = gameRooms.get(message.sessionId);
            if (answerRoom) {
              // Relay answer to target player
              answerRoom.forEach((client: ExtendedWebSocket) => {
                if (client.userId === message.targetPlayer && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'webrtc_answer',
                    fromPlayer: (ws as ExtendedWebSocket).userId,
                    answer: message.answer
                  }));
                }
              });
            }
            break;
            
          case 'webrtc_ice_candidate':
            const iceRoom = gameRooms.get(message.sessionId);
            if (iceRoom) {
              // Relay ICE candidate to target player
              iceRoom.forEach((client: ExtendedWebSocket) => {
                if (client.userId === message.targetPlayer && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'webrtc_ice_candidate',
                    fromPlayer: (ws as ExtendedWebSocket).userId,
                    candidate: message.candidate
                  }));
                }
              });
            }
            break;
            
          case 'camera_toggle':
            const cameraRoom = gameRooms.get(message.sessionId);
            if (cameraRoom) {
              // Notify other players about camera status
              cameraRoom.forEach((client: ExtendedWebSocket) => {
                if (client.userId !== (ws as ExtendedWebSocket).userId && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'camera_status',
                    playerId: (ws as ExtendedWebSocket).userId,
                    playerName: message.user.name,
                    cameraOn: message.cameraOn
                  }));
                }
              });
            }
            break;
            
          case 'mic_toggle':
            const micRoom = gameRooms.get(message.sessionId);
            if (micRoom) {
              // Notify other players about microphone status
              micRoom.forEach((client: ExtendedWebSocket) => {
                if (client.userId !== (ws as ExtendedWebSocket).userId && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'mic_status',
                    playerId: (ws as ExtendedWebSocket).userId,
                    playerName: message.user.name,
                    micOn: message.micOn
                  }));
                }
              });
            }
            break;
            
          // Collaborative Streaming WebSocket Events
          case 'join_collab_stream':
            const { eventId } = message;
            
            // Use authenticated user from session (not from client message)
            if (!authenticatedUserId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
              break;
            }
            
            // Validate event access and user authorization
            try {
              const event = await storage.getCollaborativeStreamEvent(eventId);
              if (!event) {
                ws.send(JSON.stringify({ type: 'error', message: 'Event not found' }));
                break;
              }
              
              const collaborators = await storage.getStreamCollaborators(eventId);
              const userCollaborator = collaborators.find(c => c.userId === authenticatedUserId);
              if (!userCollaborator) {
                ws.send(JSON.stringify({ type: 'error', message: 'Access denied - not a collaborator' }));
                break;
              }
              
              // Add authenticated user info to WebSocket (from session, not client)
              (ws as any).userId = authenticatedUserId;
              (ws as any).userName = authenticatedUser?.name || authenticatedUser?.email;
              (ws as any).userRole = userCollaborator.role;
              (ws as any).eventId = eventId;
            
            // Add to collaborative stream room
            if (!collaborativeStreamRooms.has(eventId)) {
              collaborativeStreamRooms.set(eventId, new Set());
            }
            collaborativeStreamRooms.get(eventId)?.add(ws as ExtendedWebSocket);
            
            // Notify other collaborators
            const activeCollaborators = Array.from(collaborativeStreamRooms.get(eventId) || []).map(client => ({
              userId: client.userId!,
              userName: client.userName!,
              userAvatar: client.userAvatar,
              status: 'connected'
            }));
            
            // Broadcast to all collaborators in the event
            collaborativeStreamRooms.get(eventId)?.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'collaborator_joined',
                  collaborator: {
                    userId: collaborator.userId,
                    userName: collaborator.userName,
                    userAvatar: collaborator.userAvatar,
                    role: collaborator.role
                  },
                  activeCollaborators
                }));
              }
            });
            
            // Handle collaborator join in the service
            try {
              await collaborativeStreaming.handleCollaboratorJoin(eventId, collaborator.userId, {
                connectionId: (ws as any).id,
                platform: collaborator.platform,
                timestamp: new Date().toISOString()
              });
            } catch (error) {
              logger.error('Failed to handle collaborator join via WebSocket', error);
            }
            break;
            
          case 'phase_change':
            const { eventId: phaseEventId, newPhase } = message;
            const requestingUserId = (ws as ExtendedWebSocket).userId;
            
            if (!requestingUserId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
              break;
            }
            
            // Verify user is authorized to change phases (host/co-host) - SERVER-SIDE RBAC
            try {
              const event = await storage.getCollaborativeStreamEvent(phaseEventId);
              if (!event) {
                ws.send(JSON.stringify({ 
                  type: 'phase_change_error', 
                  eventId: phaseEventId,
                  error: 'Event not found' 
                }));
                break;
              }

              const collaborators = await storage.getStreamCollaborators(phaseEventId);
              const userCollaborator = collaborators.find(c => c.userId === requestingUserId);
              
              // Explicit role-based authorization check
              const isHost = event.hostUserId === requestingUserId;
              const isCoHost = userCollaborator?.role === 'co_host';
              
              if (!isHost && !isCoHost) {
                logger.warn('Unauthorized phase change attempt', { 
                  userId: requestingUserId, 
                  eventId: phaseEventId,
                  userRole: userCollaborator?.role || 'none'
                });
                ws.send(JSON.stringify({ 
                  type: 'phase_change_error', 
                  eventId: phaseEventId,
                  error: 'Access denied - only hosts and co-hosts can change phases'
                }));
                break;
              }

              logger.info('Authorized phase change', { 
                userId: requestingUserId, 
                eventId: phaseEventId,
                newPhase,
                userRole: isHost ? 'host' : 'co_host'
              });
              
              const phaseChangeRoom = collaborativeStreamRooms.get(phaseEventId);
              if (phaseChangeRoom) {
                // Update coordination phase via service with authenticated user
                await collaborativeStreaming.updateCoordinationPhase(phaseEventId, newPhase, requestingUserId);
                
                // Broadcast phase change to all collaborators
                phaseChangeRoom.forEach((client: ExtendedWebSocket) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: 'phase_updated',
                      eventId: phaseEventId,
                      newPhase,
                      hostUserId,
                      timestamp: new Date().toISOString()
                    }));
                  }
                });
              } catch (error) {
                logger.error('Failed to update coordination phase via WebSocket', error);
                // Send error back to requesting client
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    type: 'phase_change_error',
                    eventId: phaseEventId,
                    error: 'Failed to update coordination phase'
                  }));
                }
              }
            }
            break;
            
          case 'coordination_event':
            const { eventId: coordEventId, eventType, eventData } = message;
            const coordRoom = collaborativeStreamRooms.get(coordEventId);
            
            if (coordRoom) {
              // Broadcast coordination event to all collaborators
              coordRoom.forEach((client: ExtendedWebSocket) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'coordination_event_broadcast',
                    eventId: coordEventId,
                    eventType,
                    eventData,
                    fromUserId: (ws as ExtendedWebSocket).userId,
                    timestamp: new Date().toISOString()
                  }));
                }
              });
            }
            break;
            
          case 'collaborator_status_update':
            const { eventId: statusEventId, userId, statusUpdate } = message;
            const statusRoom = collaborativeStreamRooms.get(statusEventId);
            
            if (statusRoom) {
              // Broadcast status update to all collaborators
              statusRoom.forEach((client: ExtendedWebSocket) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'collaborator_status_changed',
                    eventId: statusEventId,
                    userId,
                    statusUpdate,
                    timestamp: new Date().toISOString()
                  }));
                }
              });
            }
            break;
        }
      } catch (error) {
        logger.error('WebSocket message error', error);
      }
    });
    
    ws.on('close', () => {
      // Remove from all game rooms and collaborative streaming rooms
      const wsWithData = ws as ExtendedWebSocket;
      
      // Game rooms cleanup
      if (wsWithData.sessionId) {
        const room = gameRooms.get(wsWithData.sessionId);
        if (room) {
          room.delete(ws as ExtendedWebSocket);
          
          // Notify other players
          const remainingPlayers = Array.from(room).map(client => ({
            id: client.userId!,
            name: client.userName!,
            avatar: client.userAvatar
          }));
          
          room.forEach((client: ExtendedWebSocket) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'player_left',
                player: { id: wsWithData.userId, name: wsWithData.userName },
                players: remainingPlayers
              }));
            }
          });
          
          // Clean up empty rooms
          if (room.size === 0) {
            gameRooms.delete(wsWithData.sessionId);
          }
        }
      }
      
      // Collaborative streaming rooms cleanup
      if ((wsWithData as any).eventId) {
        const eventId = (wsWithData as any).eventId;
        const collabRoom = collaborativeStreamRooms.get(eventId);
        if (collabRoom) {
          collabRoom.delete(ws as ExtendedWebSocket);
          
          // Notify other collaborators
          const remainingCollaborators = Array.from(collabRoom).map(client => ({
            userId: client.userId!,
            userName: client.userName!,
            userAvatar: client.userAvatar,
            status: 'connected'
          }));
          
          collabRoom.forEach((client: ExtendedWebSocket) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'collaborator_left',
                collaborator: { userId: wsWithData.userId, userName: wsWithData.userName },
                activeCollaborators: remainingCollaborators,
                timestamp: new Date().toISOString()
              }));
            }
          });
          
          // Clean up empty collaborative streaming rooms
          if (collabRoom.size === 0) {
            collaborativeStreamRooms.delete(eventId);
          }
        }
      }
    });
  });
  
  return httpServer;
}

// Initialize the 6 default gaming communities
async function initializeDefaultCommunities() {
  const defaultCommunities = [
    {
      id: "scry-gather",
      name: "scry-gather",
      displayName: "Scry & Gather",
      description: "Magic: The Gathering streaming coordination. Manage spell circles, strategic alliances, and create legendary MTG content.",
      themeColor: "hsl(0, 75%, 60%)", // Red theme for MTG
      iconClass: "fas fa-magic",
    },
    {
      id: "pokestream-hub",
      name: "pokestream-hub", 
      displayName: "PokeStream Hub",
      description: "Unite Pokemon trainers worldwide. Coordinate teams, host battle arenas, and create legendary content together.",
      themeColor: "hsl(45, 100%, 50%)", // Yellow theme for Pokemon
      iconClass: "fas fa-bolt",
    },
    {
      id: "decksong",
      name: "decksong",
      displayName: "Decksong",
      description: "Disney Lorcana creators unite in harmony. Orchestrate collaborative streams and build magical kingdoms together.",
      themeColor: "hsl(300, 70%, 65%)", // Purple theme for Lorcana
      iconClass: "fas fa-crown",
    },
    {
      id: "duelcraft",
      name: "duelcraft",
      displayName: "Duelcraft", 
      description: "Yu-Gi-Oh duelists assemble! Master the shadow realm of collaborative content and strategic partnerships.",
      themeColor: "hsl(240, 70%, 65%)", // Blue theme for Yu-Gi-Oh
      iconClass: "fas fa-eye",
    },
    {
      id: "bladeforge",
      name: "bladeforge",
      displayName: "Bladeforge",
      description: "Forge alliances in the world of strategic card combat. Unite creators and build legendary gaming content.",
      themeColor: "hsl(160, 70%, 50%)", // Green theme
      iconClass: "fas fa-sword",
    },
    {
      id: "deckmaster",
      name: "deckmaster",
      displayName: "Deckmaster",
      description: "Master the art of strategic deck building and content creation. Perfect your craft with fellow creators.",
      themeColor: "hsl(260, 70%, 65%)", // Indigo theme
      iconClass: "fas fa-chess",
    },
  ];

  for (const communityData of defaultCommunities) {
    try {
      const existing = await storage.getCommunity(communityData.id);
      if (!existing) {
        await storage.createCommunity(communityData);
        logger.info("Created community successfully", { name: communityData.displayName, id: communityData.id });
      }
    } catch (error) {
      logger.error("Failed to create community", error, { name: communityData.displayName });
    }
  }
}
