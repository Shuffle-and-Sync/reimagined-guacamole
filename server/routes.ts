import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { isAuthenticated, getAuthUserId, requireHybridAuth, type AuthenticatedRequest } from "./auth";
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
import { validatePasswordStrength, hashPassword, verifyPassword } from "./auth/password";
import { 
  generateEmailVerificationJWT, 
  verifyEmailVerificationJWT,
  generatePasswordResetJWT,
  verifyPasswordResetJWT,
  TOKEN_EXPIRY,
  generateAccessTokenJWT,
  generateRefreshTokenJWT,
  verifyRefreshTokenJWT,
  generateRefreshTokenId
} from "./auth/tokens";
import { 
  generateTOTPSetup, 
  verifyTOTPCode, 
  verifyBackupCode, 
  hashBackupCode, 
  validateMFASetupRequirements,
  generateBackupCodes 
} from "./auth/mfa";
import { generateDeviceFingerprint, extractDeviceContext } from "./auth/device-fingerprinting";
import { logger } from "./logger";
import { NotFoundError, ValidationError } from "./types";
import { 
  errorHandlingMiddleware,
  errors
} from "./middleware/error-handling.middleware";
import { assertRouteParam } from "./shared/utils";
const { asyncHandler } = errorHandlingMiddleware;
const { 
  AppError,
  ValidationError: ValidationErr,
  AuthenticationError,
  AuthorizationError,
  NotFoundError: NotFoundErr,
  ConflictError,
  DatabaseError
} = errors;
import analyticsRouter from "./routes/analytics";
import cacheHealthRouter from "./routes/cache-health";
import databaseHealthRouter from "./routes/database-health";
import backupRouter from "./routes/backup";
import monitoringRouter from "./routes/monitoring";
import matchingRouter from "./routes/matching";
import { CollaborativeStreamingService } from "./services/collaborative-streaming";
import { websocketMessageSchema } from '@shared/websocket-schemas';
import EnhancedWebSocketServer from './utils/websocket-server-enhanced';
// Auth.js session validation will be done via session endpoint
import { healthCheck } from "./health";
import { generatePlatformOAuthURL, handlePlatformOAuthCallback } from "./services/platform-oauth";
import { 
  validateRequest, 
  validateQuery,
  validateParams, 
  validateParamsWithSchema,
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
  validateUUID,
  uuidParamSchema,
  eventParamSchema,
  userParamSchema,
  communityParamSchema,
  paginationQuerySchema,
  searchQuerySchema
} from "./validation";
import { z } from "zod";

// JWT request validation schemas
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
});

const revokeTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
});

// Registration validation schema
const registrationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(12, "Password must be at least 12 characters long"),
  firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username is too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  primaryCommunity: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions")
});
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
      const platform = assertRouteParam(req.params.platform, 'platform');
      
      if (!['twitch', 'youtube', 'facebook'].includes(platform)) {
        return res.status(400).json({ message: 'Unsupported platform' });
      }
      
      // Generate OAuth authorization URL
      const authUrl = await generatePlatformOAuthURL(platform, userId);
      return res.json({ authUrl });
    } catch (error) {
      logger.error('Platform OAuth initiation error:', error);
      return res.status(500).json({ message: 'Failed to initiate OAuth flow' });
    }
  });

  app.get('/api/platforms/:platform/oauth/callback', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const platform = assertRouteParam(req.params.platform, 'platform');
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ message: 'Missing OAuth parameters' });
      }
      
      // Exchange code for tokens and save to storage
      const account = await handlePlatformOAuthCallback(platform, code as string, state as string, userId);
      return res.json({ success: true, platform: account.platform, handle: account.handle });
    } catch (error) {
      logger.error('Platform OAuth callback error:', error);
      return res.status(500).json({ message: 'Failed to complete OAuth flow' });
    }
  });

  app.get('/api/platforms/accounts', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const accounts = await storage.getUserPlatformAccounts(userId);
      return res.json(accounts);
    } catch (error) {
      logger.error('Get platform accounts error:', error);
      return res.status(500).json({ message: 'Failed to fetch platform accounts' });
    }
  });

  app.delete('/api/platforms/accounts/:id', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const id = assertRouteParam(req.params.id, 'id');
      
      // Verify ownership before deletion
      const account = await storage.getUserPlatformAccounts(userId);
      const targetAccount = account.find(acc => acc.id === id);
      
      if (!targetAccount) {
        return res.status(404).json({ message: 'Platform account not found' });
      }
      
      await storage.deleteUserPlatformAccount(id);
      return res.json({ success: true });
    } catch (error) {
      logger.error('Delete platform account error:', error);
      return res.status(500).json({ message: 'Failed to delete platform account' });
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
      
      return res.json(status);
    } catch (error) {
      logger.error('Get platform status error:', error);
      return res.status(500).json({ message: 'Failed to fetch platform status' });
    }
  });

  app.post('/api/platforms/:platform/refresh', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const platform = assertRouteParam(req.params.platform, 'platform');
      
      // Import refresh function
      const { refreshPlatformToken } = await import('./services/platform-oauth');
      
      const newToken = await refreshPlatformToken(userId, platform);
      
      if (!newToken) {
        return res.status(400).json({ message: 'Failed to refresh token' });
      }
      
      return res.json({ success: true, message: 'Token refreshed successfully' });
    } catch (error) {
      logger.error('Refresh platform token error:', error);
      return res.status(500).json({ message: 'Failed to refresh platform token' });
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
      
      return res.json({
        ...user,
        communities: userCommunities,
      });
    } catch (error) {
      logger.error("Failed to fetch user", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to fetch user" });
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
      return res.json(updatedUser);
    } catch (error) {
      logger.error("Failed to update user profile", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to update profile" });
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
      
      return res.json({
        ...user,
        communities: userCommunities,
        isOwnProfile: currentUserId === targetUserId,
        friendCount: await storage.getFriendCount(targetUserId),
      });
    } catch (error) {
      logger.error("Failed to fetch user profile", error, { currentUserId: getAuthUserId(authenticatedReq), targetUserId: req.params.userId });
      return res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Social links routes
  app.get('/api/user/social-links/:userId?', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const currentUserId = getAuthUserId(authenticatedReq);
      const targetUserId = req.params.userId || currentUserId;
      
      const socialLinks = await storage.getUserSocialLinks(targetUserId);
      return res.json(socialLinks);
    } catch (error) {
      logger.error("Failed to fetch social links", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to fetch social links" });
    }
  });

  app.put('/api/user/social-links', isAuthenticated, validateRequest(validateSocialLinksSchema), async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { links } = req.body;
      
      const updatedLinks = await storage.updateUserSocialLinks(userId, links);
      return res.json(updatedLinks);
    } catch (error) {
      logger.error("Failed to update social links", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to update social links" });
    }
  });

  // Gaming profiles routes
  app.get('/api/user/gaming-profiles/:userId?', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const currentUserId = getAuthUserId(authenticatedReq);
      const targetUserId = req.params.userId || currentUserId;
      
      const gamingProfiles = await storage.getUserGamingProfiles(targetUserId);
      return res.json(gamingProfiles);
    } catch (error) {
      logger.error("Failed to fetch gaming profiles", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to fetch gaming profiles" });
    }
  });

  // Friendship routes
  app.get('/api/friends', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const friends = await storage.getFriends(userId);
      return res.json(friends);
    } catch (error) {
      logger.error("Failed to fetch friends", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get('/api/friend-requests', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const friendRequests = await storage.getFriendRequests(userId);
      return res.json(friendRequests);
    } catch (error) {
      logger.error("Failed to fetch friend requests", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to fetch friend requests" });
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
      
      return res.status(201).json(friendship);
    } catch (error) {
      logger.error("Failed to send friend request", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.put('/api/friend-requests/:id', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const id = assertRouteParam(req.params.id, 'id');
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
      
      return res.json(friendship);
    } catch (error) {
      logger.error("Failed to respond to friend request", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to respond to friend request" });
    }
  });

  app.delete('/api/friends/:id', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const id = assertRouteParam(req.params.id, 'id');
      
      // First check if the user is part of this friendship
      const friendship = await storage.checkFriendshipStatus(userId, id);
      if (!friendship) {
        return res.status(404).json({ message: "Friendship not found" });
      }

      await storage.respondToFriendRequest(friendship.id, 'declined');
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to remove friend", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  // User settings routes
  app.get('/api/user/settings', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const settings = await storage.getUserSettings(userId);
      return res.json(settings);
    } catch (error) {
      logger.error("Failed to fetch user settings", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/user/settings', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const settingsData = { ...req.body, userId };
      
      const settings = await storage.upsertUserSettings(settingsData);
      return res.json(settings);
    } catch (error) {
      logger.error("Failed to update user settings", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Matchmaking routes
  app.get('/api/matchmaking/preferences', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const preferences = await storage.getMatchmakingPreferences(userId);
      return res.json(preferences);
    } catch (error) {
      logger.error("Failed to fetch matchmaking preferences", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put('/api/matchmaking/preferences', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const preferencesData = { ...req.body, userId };
      
      const preferences = await storage.upsertMatchmakingPreferences(preferencesData);
      return res.json(preferences);
    } catch (error) {
      logger.error("Failed to update matchmaking preferences", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to update preferences" });
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
      return res.json(matches);
    } catch (error) {
      logger.error("Failed to find matching players", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to find matches" });
    }
  });

  // Tournament routes - improved with proper error handling
  app.get('/api/tournaments', 
    validateQuery(z.object({
      community: z.string().uuid().optional(),
      ...paginationQuerySchema.shape
    })),
    asyncHandler(async (req, res) => {
      const { community: communityId, page, limit } = req.query as any;
      const tournaments = await storage.getTournaments(communityId);
      return res.json({
        success: true,
        data: tournaments,
        meta: {
          page: page || 1,
          limit: limit || 20,
          total: tournaments.length
        }
      });
    })
  );

  app.get('/api/tournaments/:id', 
    validateParamsWithSchema(uuidParamSchema),
    asyncHandler(async (req, res) => {
      const tournamentId = assertRouteParam(req.params.id, 'id');
      const tournament = await storage.getTournament(tournamentId);
      
      if (!tournament) {
        throw new NotFoundErr('Tournament not found');
      }
      
      return res.json({
        success: true,
        data: tournament
      });
    })
  );

  app.post('/api/tournaments', 
    isAuthenticated, 
    validateRequest(z.object({
      title: z.string().min(1, 'Title is required').max(200),
      description: z.string().max(1000).optional(),
      type: z.enum(['tournament', 'convention', 'release', 'community']),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
      maxParticipants: z.number().int().min(1).max(1000).optional(),
      communityId: z.string().uuid('Invalid community ID'),
      isPublic: z.boolean().default(true)
    })),
    asyncHandler(async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);
      const tournamentData = { ...req.body, organizerId: userId };
      
      const tournament = await storage.createTournament(tournamentData);
      return res.status(201).json({
        success: true,
        data: tournament,
        message: 'Tournament created successfully'
      });
    })
  );

  app.post('/api/tournaments/:id/join', 
    isAuthenticated,
    validateParamsWithSchema(uuidParamSchema),
    asyncHandler(async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);
      const tournamentId = assertRouteParam(req.params.id, 'id');
      
      const participant = await storage.joinTournament(tournamentId, userId);
      if (!participant) {
        throw new ConflictError('Already joined tournament or tournament is full');
      }
      
      return res.status(201).json({
        success: true,
        data: participant,
        message: 'Successfully joined tournament'
      });
    })
  );

  app.delete('/api/tournaments/:id/leave', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const tournamentId = assertRouteParam(req.params.id, 'id');
      
      const success = await storage.leaveTournament(tournamentId, userId);
      if (success) {
        return res.json({ message: "Left tournament successfully" });
      } else {
        return res.status(404).json({ message: "Tournament participation not found" });
      }
    } catch (error) {
      logger.error("Failed to leave tournament", error, { userId: getAuthUserId(authenticatedReq), tournamentId: req.params.id });
      return res.status(500).json({ message: "Failed to leave tournament" });
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
      
      return res.json(posts);
    } catch (error) {
      logger.error("Failed to fetch forum posts", error, { communityId: req.query.communityId });
      return res.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });

  app.get('/api/forum/posts/:id', async (req, res) => {
    try {
      const postId = assertRouteParam(req.params.id, 'id');
      const userId = req.query.userId as string;
      
      const post = await storage.getForumPost(postId, userId);
      if (!post) {
        return res.status(404).json({ message: "Forum post not found" });
      }
      
      return res.json(post);
    } catch (error) {
      logger.error("Failed to fetch forum post", error, { postId: req.params.id });
      return res.status(500).json({ message: "Failed to fetch forum post" });
    }
  });

  app.post('/api/forum/posts', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const postData = { ...req.body, authorId: userId };
      
      const post = await storage.createForumPost(postData);
      return res.json(post);
    } catch (error) {
      logger.error("Failed to create forum post", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to create forum post" });
    }
  });

  app.put('/api/forum/posts/:id', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const postId = assertRouteParam(req.params.id, 'id');
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
      return res.json(updatedPost);
    } catch (error) {
      logger.error("Failed to update forum post", error, { postId: req.params.id });
      return res.status(500).json({ message: "Failed to update forum post" });
    }
  });

  app.delete('/api/forum/posts/:id', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const postId = assertRouteParam(req.params.id, 'id');
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
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to delete forum post", error, { postId: req.params.id });
      return res.status(500).json({ message: "Failed to delete forum post" });
    }
  });

  app.post('/api/forum/posts/:id/like', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const postId = assertRouteParam(req.params.id, 'id');
      const userId = getAuthUserId(authenticatedReq);
      
      await storage.likeForumPost(postId, userId);
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to like forum post", error, { postId: req.params.id });
      return res.status(500).json({ message: "Failed to like forum post" });
    }
  });

  app.delete('/api/forum/posts/:id/like', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const postId = assertRouteParam(req.params.id, 'id');
      const userId = getAuthUserId(authenticatedReq);
      
      await storage.unlikeForumPost(postId, userId);
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to unlike forum post", error, { postId: req.params.id });
      return res.status(500).json({ message: "Failed to unlike forum post" });
    }
  });

  app.get('/api/forum/posts/:id/replies', async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.query.userId as string;
      
      const replies = await storage.getForumReplies(postId, userId);
      return res.json(replies);
    } catch (error) {
      logger.error("Failed to fetch forum replies", error, { postId: req.params.id });
      return res.status(500).json({ message: "Failed to fetch forum replies" });
    }
  });

  app.post('/api/forum/posts/:id/replies', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const postId = req.params.id;
      const userId = getAuthUserId(authenticatedReq);
      const replyData = { ...req.body, postId, authorId: userId };
      
      const reply = await storage.createForumReply(replyData);
      return res.json(reply);
    } catch (error) {
      logger.error("Failed to create forum reply", error, { postId: req.params.id });
      return res.status(500).json({ message: "Failed to create forum reply" });
    }
  });

  app.post('/api/forum/replies/:id/like', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const replyId = assertRouteParam(req.params.id, 'id');
      const userId = getAuthUserId(authenticatedReq);
      
      await storage.likeForumReply(replyId, userId);
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to like forum reply", error, { replyId: req.params.id });
      return res.status(500).json({ message: "Failed to like forum reply" });
    }
  });

  app.delete('/api/forum/replies/:id/like', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const replyId = assertRouteParam(req.params.id, 'id');
      const userId = getAuthUserId(authenticatedReq);
      
      await storage.unlikeForumReply(replyId, userId);
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to unlike forum reply", error, { replyId: req.params.id });
      return res.status(500).json({ message: "Failed to unlike forum reply" });
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
        return res.status(201).json(event);
      } catch (error) {
        logger.error('Failed to create collaborative stream event', error, { userId: getAuthUserId(authenticatedReq) });
        return res.status(500).json({ message: 'Failed to create collaborative stream event' });
      }
    }
  );

  // Get user's collaborative stream events
  app.get('/api/collaborative-streams', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const events = await storage.getUserCollaborativeStreamEvents(userId);
      return res.json(events);
    } catch (error) {
      logger.error('Failed to get collaborative stream events', error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Failed to get collaborative stream events' });
    }
  });

  // Get specific collaborative stream event
  app.get('/api/collaborative-streams/:eventId', isAuthenticated, validateParams('eventId', validateUUID, 'Invalid event ID format'), async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const eventId = assertRouteParam(req.params.eventId, 'eventId');
      
      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Collaborative stream event not found' });
      }
      
      return res.json(event);
    } catch (error) {
      logger.error('Failed to get collaborative stream event', error, { 
        eventId: req.params.eventId, 
        userId: getAuthUserId(authenticatedReq) 
      });
      return res.status(500).json({ message: 'Failed to get collaborative stream event' });
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
        const eventId = assertRouteParam(req.params.eventId, 'eventId');
        
        // Check if user is the event creator
        const event = await storage.getCollaborativeStreamEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: 'Collaborative stream event not found' });
        }
        if (event.creatorId !== userId) {
          return res.status(403).json({ message: 'Only event creator can update the event' });
        }
        
        const updatedEvent = await storage.updateCollaborativeStreamEvent(eventId, req.body);
        return res.json(updatedEvent);
      } catch (error) {
        logger.error('Failed to update collaborative stream event', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        return res.status(500).json({ message: 'Failed to update collaborative stream event' });
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
        const eventId = assertRouteParam(req.params.eventId, 'eventId');
        
        // Check if user is the event creator
        const event = await storage.getCollaborativeStreamEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: 'Collaborative stream event not found' });
        }
        if (event.creatorId !== userId) {
          return res.status(403).json({ message: 'Only event creator can delete the event' });
        }
        
        await storage.deleteCollaborativeStreamEvent(eventId);
        return res.json({ message: 'Collaborative stream event deleted successfully' });
      } catch (error) {
        logger.error('Failed to delete collaborative stream event', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        return res.status(500).json({ message: 'Failed to delete collaborative stream event' });
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
        const eventId = assertRouteParam(req.params.eventId, 'eventId');
        
        const suggestions = await collaborativeStreaming.getCollaborationSuggestions(eventId, userId);
        return res.json(suggestions);
      } catch (error) {
        logger.error('Failed to get collaboration suggestions', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        return res.status(500).json({ message: 'Failed to get collaboration suggestions' });
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
        const eventId = assertRouteParam(req.params.eventId, 'eventId');
        
        const collaborator = await collaborativeStreaming.addCollaborator(eventId, req.body);
        return res.status(201).json(collaborator);
      } catch (error) {
        logger.error('Failed to add collaborator', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        return res.status(500).json({ message: 'Failed to add collaborator' });
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
        const eventId = assertRouteParam(req.params.eventId, 'eventId');
        const collaborators = await storage.getStreamCollaborators(eventId);
        return res.json(collaborators);
      } catch (error) {
        logger.error('Failed to get collaborators', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        return res.status(500).json({ message: 'Failed to get collaborators' });
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
        const eventId = assertRouteParam(req.params.eventId, 'eventId');
        const collaboratorId = assertRouteParam(req.params.collaboratorId, 'collaboratorId');
        
        const collaborator = await storage.updateStreamCollaborator(collaboratorId, req.body);
        return res.json(collaborator);
      } catch (error) {
        logger.error('Failed to update collaborator', error, { 
          eventId: req.params.eventId,
          collaboratorId: req.params.collaboratorId,
          userId: getAuthUserId(authenticatedReq) 
        });
        return res.status(500).json({ message: 'Failed to update collaborator' });
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
        const eventId = assertRouteParam(req.params.eventId, 'eventId');
        const collaboratorId = assertRouteParam(req.params.collaboratorId, 'collaboratorId');
        
        await storage.deleteStreamCollaborator(collaboratorId);
        return res.json({ message: 'Collaborator removed successfully' });
      } catch (error) {
        logger.error('Failed to remove collaborator', error, { 
          eventId: req.params.eventId,
          collaboratorId: req.params.collaboratorId,
          userId: getAuthUserId(authenticatedReq) 
        });
        return res.status(500).json({ message: 'Failed to remove collaborator' });
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
        const eventId = assertRouteParam(req.params.eventId, 'eventId');
        
        const session = await collaborativeStreaming.startCoordinationSession(eventId, userId);
        return res.status(201).json(session);
      } catch (error) {
        logger.error('Failed to start coordination session', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        return res.status(500).json({ message: 'Failed to start coordination session' });
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
        const eventId = assertRouteParam(req.params.eventId, 'eventId');
        const { phase } = req.body;
        
        await collaborativeStreaming.updateCoordinationPhase(eventId, phase, userId);
        return res.json({ message: 'Coordination phase updated successfully' });
      } catch (error) {
        logger.error('Failed to update coordination phase', error, { 
          eventId: req.params.eventId,
          phase: req.body.phase,
          userId: getAuthUserId(authenticatedReq) 
        });
        return res.status(500).json({ message: 'Failed to update coordination phase' });
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
        const eventId = assertRouteParam(req.params.eventId, 'eventId');
        
        const status = await collaborativeStreaming.getCoordinationStatus(eventId);
        return res.json(status);
      } catch (error) {
        logger.error('Failed to get coordination status', error, { 
          eventId: req.params.eventId, 
          userId: getAuthUserId(authenticatedReq) 
        });
        return res.status(500).json({ message: 'Failed to get coordination status' });
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
      return res.json(userData);
    } catch (error) {
      logger.error("Failed to export user data", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to export data" });
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
        
        return res.json({ 
          message: "Account deleted successfully"
        });
      } else {
        return res.status(404).json({ message: "User account not found" });
      }
    } catch (error) {
      logger.error("Failed to delete user account", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to delete account" });
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

      return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      logger.error('Password reset request failed', { email: req.body.email });
      return res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      return res.json({ message: "Token is valid", email: resetToken.email });
    } catch (error) {
      logger.error("Failed to verify reset token", error, { token: req.body.token });
      return res.status(500).json({ message: "Failed to verify reset token" });
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
      await storage.updateUser(user.id, { passwordHash: hashedPassword });
      
      // Mark token as used
      await storage.markTokenAsUsed(token);
      
      // Log successful password reset (without sensitive data)
      logger.info('Password reset completed successfully', { userId: user.id, email: user.email });
      
      return res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      logger.error('Password reset failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return res.status(500).json({ message: "Failed to reset password" });
    }
  });


  // Multi-Factor Authentication endpoints
  app.post('/api/auth/mfa/setup', isAuthenticated, async (req, res) => {
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
      if (existingMfa?.isEnabled) {
        return res.status(400).json({ message: "MFA is already enabled for this account" });
      }
      
      // Generate TOTP setup data
      const setupData = await generateTOTPSetup(user.email, 'Shuffle & Sync');
      
      // Store pending TOTP secret in session with 10-minute expiry
      const pendingData = {
        secret: setupData.secret,
        qrCodeUrl: setupData.qrCodeUrl,
        manualEntryKey: setupData.manualEntryKey,
        userId,
        createdAt: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
      };
      
      // Store in session for production-ready distributed deployments
      if (!authenticatedReq.session) {
        return res.status(500).json({ message: "Session not available - server configuration error" });
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
      logger.error('MFA setup failed', { error: error instanceof Error ? error.message : 'Unknown error', userId: getAuthUserId(req as AuthenticatedRequest) });
      return res.status(500).json({ message: "Failed to generate MFA setup" });
    }
  });
  
  app.post('/api/auth/mfa/enable', isAuthenticated, async (req, res) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);
      const { totpCode } = req.body;
      
      if (!totpCode) {
        return res.status(400).json({ message: "TOTP verification code is required" });
      }
      
      // Get pending secret from session storage
      const pendingData = authenticatedReq.session?.mfaPendingSecret;
      
      if (!pendingData || pendingData.expiresAt < Date.now() || pendingData.userId !== userId) {
        // Clear expired or invalid pending secret
        if (authenticatedReq.session?.mfaPendingSecret) {
          delete authenticatedReq.session.mfaPendingSecret;
        }
        return res.status(400).json({ message: "MFA setup expired. Please start setup again." });
      }
      
      // Validate TOTP code against server-stored secret
      const validation = validateMFASetupRequirements(totpCode, pendingData.secret);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: "Invalid TOTP code",
          details: validation.errors
        });
      }
      
      // Generate secure backup codes server-side (12 chars, higher entropy)
      const newBackupCodes = generateBackupCodes(8); // 8 codes for better UX
      const hashedBackupCodes = await Promise.all(
        newBackupCodes.map(async (code: string) => await hashBackupCode(code))
      );
      
      // Enable MFA for the user with server-generated data
      await storage.enableUserMfa(userId, pendingData.secret, hashedBackupCodes);
      
      // Clear pending secret from session
      if (authenticatedReq.session?.mfaPendingSecret) {
        delete authenticatedReq.session.mfaPendingSecret;
      }
      
      // Return backup codes ONCE - user must save them now
      return res.json({ 
        message: "Multi-factor authentication has been enabled successfully",
        backupCodes: newBackupCodes,
        warning: "Save these backup codes now - they will not be shown again!"
      });
      
      // Log MFA enabled event with audit trail
      logger.info('MFA enabled successfully', { userId });
      
      // Create audit log entry
      await storage.createAuthAuditLog({
        userId,
        eventType: 'mfa_enabled',
        details: { 
          method: 'totp',
          backupCodesGenerated: newBackupCodes.length,
          userAgent: req.get('User-Agent') || 'Unknown'
        },
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        isSuccessful: true
      });
      
      return res.json({ message: "Multi-factor authentication has been enabled successfully" });
      
    } catch (error) {
      logger.error('MFA enable failed', { error: error instanceof Error ? error.message : 'Unknown error', userId: getAuthUserId(req as AuthenticatedRequest) });
      return res.status(500).json({ message: "Failed to enable MFA" });
    }
  });
  
  app.post('/api/auth/mfa/disable', isAuthenticated, async (req, res) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password confirmation is required to disable MFA" });
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
      logger.info('MFA disabled successfully', { userId });
      
      // Create audit log entry
      await storage.createAuthAuditLog({
        userId,
        eventType: 'mfa_disabled',
        details: { 
          method: 'password_confirmation',
          userAgent: req.get('User-Agent') || 'Unknown'
        },
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        isSuccessful: true
      });
      
      return res.json({ message: "Multi-factor authentication has been disabled" });
      
    } catch (error) {
      logger.error('MFA disable failed', { error: error instanceof Error ? error.message : 'Unknown error', userId: getAuthUserId(req as AuthenticatedRequest) });
      return res.status(500).json({ message: "Failed to disable MFA" });
    }
  });
  
  app.post('/api/auth/mfa/verify', isAuthenticated, authRateLimit, async (req, res) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);
      const { code, isBackupCode = false } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Verification code is required" });
      }

      // Extract device context for security validation
      const deviceContext = extractDeviceContext(req.headers, req.ip || req.connection.remoteAddress || 'unknown');
      const deviceFingerprint = generateDeviceFingerprint(deviceContext);
      
      // Calculate device risk score
      const riskAssessment = await storage.calculateDeviceRiskScore(userId, {
        userAgent: deviceContext.userAgent,
        ipAddress: deviceContext.ipAddress,
        location: deviceContext.location,
        timezone: deviceContext.timezone
      });

      // Validate device context and get trust score  
      const deviceValidation = await storage.validateDeviceContext(userId, deviceFingerprint.hash);
      
      // Get user MFA settings
      const mfaSettings = await storage.getUserMfaSettings(userId);
      if (!mfaSettings || !mfaSettings.isEnabled) {
        return res.status(400).json({ message: "MFA is not enabled for this account" });
      }
      
      let isValid = false;
      
      if (isBackupCode) {
        // Verify backup code with Argon2id
        const backupResult = await verifyBackupCode(code, mfaSettings.backupCodes || []);
        if (backupResult.isValid && backupResult.codeIndex !== undefined) {
          // Mark backup code as used by removing it from the array
          await storage.markBackupCodeAsUsed(userId, backupResult.codeIndex);
          isValid = true;
        }
      } else {
        // Verify TOTP code
        if (!mfaSettings.totpSecret) {
          return res.status(400).json({ message: "TOTP secret not found" });
        }
        
        const totpResult = verifyTOTPCode(code, mfaSettings.totpSecret);
        isValid = totpResult.isValid;
      }
      
      if (isValid) {
        // Update last verified timestamp
        await storage.updateUserMfaLastVerified(userId);

        // Store MFA security context for this verification
        await storage.createMfaSecurityContext({
          userId,
          deviceFingerprintId: deviceValidation.deviceFingerprint?.id || null,
          verificationMethod: isBackupCode ? 'backup_code' : 'totp',
          riskScore: riskAssessment.riskScore,
          trustScore: deviceValidation.trustScore,
          ipAddress: deviceContext.ipAddress,
          location: deviceContext.location || null,
          riskFactors: riskAssessment.riskFactors.length > 0 ? riskAssessment.riskFactors : undefined,
          isSuccessful: true,
          newDevice: !deviceValidation.deviceFingerprint,
          newLocation: riskAssessment.riskFactors.includes('location_change'),
          newIpRange: riskAssessment.riskFactors.includes('ip_change'),
          suspiciousActivity: riskAssessment.riskScore > 0.8
        });

        // Update device fingerprint with successful verification
        if (deviceValidation.deviceFingerprint) {
          await storage.updateDeviceLastSeen(deviceFingerprint.hash);
          // Increment successful verifications via updateDeviceFingerprint
          await storage.updateDeviceFingerprint(deviceValidation.deviceFingerprint.id, {
            successfulMfaAttempts: (deviceValidation.deviceFingerprint.successfulMfaAttempts || 0) + 1,
            totalSessions: (deviceValidation.deviceFingerprint.totalSessions || 0) + 1,
            lastSeenAt: new Date()
          });
        }
        
        // Log successful MFA verification with audit trail
        logger.info('MFA verification successful', { 
          userId, 
          isBackupCode,
          deviceTrustScore: deviceValidation.trustScore,
          riskScore: riskAssessment.riskScore,
          riskFactorsDetected: riskAssessment.riskFactors.length
        });
        
        // Create audit log entry
        await storage.createAuthAuditLog({
          userId,
          eventType: 'mfa_verified',
          details: { 
            method: isBackupCode ? 'backup_code' : 'totp',
            userAgent: req.get('User-Agent') || 'Unknown',
            deviceTrustScore: deviceValidation.trustScore,
            riskScore: riskAssessment.riskScore
          },
          ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
          isSuccessful: true
        });
        
        return res.json({ 
          message: "MFA verification successful",
          securityContext: {
            trustScore: deviceValidation.trustScore,
            riskScore: riskAssessment.riskScore,
            deviceTrusted: deviceValidation.trustScore > 0.7
          }
        });
      } else {
        // Log failed MFA verification with audit trail
        logger.warn('MFA verification failed', { userId, isBackupCode });
        
        // Create audit log entry for failed verification
        await storage.createAuthAuditLog({
          userId,
          eventType: 'mfa_verified',
          details: { 
            method: isBackupCode ? 'backup_code' : 'totp',
            userAgent: req.get('User-Agent') || 'Unknown'
          },
          ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
          isSuccessful: false,
          failureReason: 'invalid_mfa_code'
        });
        
        return res.status(400).json({ message: "Invalid verification code" });
      }
      
    } catch (error) {
      logger.error('MFA verification error', { error: error instanceof Error ? error.message : 'Unknown error', userId: getAuthUserId(req as AuthenticatedRequest) });
      return res.status(500).json({ message: "MFA verification failed" });
    }
  });
  
  app.post('/api/auth/mfa/backup-codes/regenerate', isAuthenticated, async (req, res) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password confirmation is required" });
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
      if (!mfaSettings || !mfaSettings.isEnabled) {
        return res.status(400).json({ message: "MFA is not enabled for this account" });
      }
      
      // Generate new backup codes with enhanced security
      const newBackupCodes = generateBackupCodes(8);
      const hashedBackupCodes = await Promise.all(
        newBackupCodes.map(async (code) => await hashBackupCode(code))
      );
      
      // Update backup codes in database
      await storage.updateUserMfaSettings(userId, { backupCodes: hashedBackupCodes });
      
      // Log backup codes regeneration with audit trail
      logger.info('MFA backup codes regenerated', { userId });
      
      // Create audit log entry
      await storage.createAuthAuditLog({
        userId,
        eventType: 'mfa_verified', // Using existing enum, could add 'mfa_backup_codes_regenerated'
        details: { 
          action: 'backup_codes_regenerated',
          codesGenerated: newBackupCodes.length,
          userAgent: req.get('User-Agent') || 'Unknown'
        },
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        isSuccessful: true
      });
      
      return res.json({ 
        message: "New backup codes generated successfully",
        backupCodes: newBackupCodes
      });
      
    } catch (error) {
      logger.error('Backup codes regeneration failed', { error: error instanceof Error ? error.message : 'Unknown error', userId: getAuthUserId(req as AuthenticatedRequest) });
      return res.status(500).json({ message: "Failed to generate new backup codes" });
    }
  });
  
  app.get('/api/auth/mfa/status', isAuthenticated, async (req, res) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);
      
      // Get user MFA settings
      const mfaSettings = await storage.getUserMfaSettings(userId);
      
      return res.json({
        mfaEnabled: mfaSettings?.isEnabled || false,
        enabledAt: mfaSettings?.enabledAt || null,
        lastVerifiedAt: mfaSettings?.lastVerifiedAt || null,
        backupCodesCount: mfaSettings?.backupCodes?.length || 0,
      });
      
    } catch (error) {
      logger.error('MFA status check failed', { error: error instanceof Error ? error.message : 'Unknown error', userId: getAuthUserId(req as AuthenticatedRequest) });
      return res.status(500).json({ message: "Failed to get MFA status" });
    }
  });

  // JWT Session Management endpoints  
  app.post('/api/auth/refresh', authRateLimit, validateRequest(refreshTokenSchema), async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }
      
      // Verify the refresh token JWT
      const { valid, payload, error } = await verifyRefreshTokenJWT(refreshToken);
      if (!valid || !payload) {
        logger.warn('Invalid refresh token attempted', { error, ip: req.ip });
        return res.status(401).json({ message: "Invalid or expired refresh token" });
      }
      
      // Check if refresh token exists in database and is not revoked
      const tokenRecord = await storage.getRefreshToken(payload.jti);
      if (!tokenRecord) {
        logger.warn('Refresh token not found in database', { tokenId: payload.jti, ip: req.ip });
        return res.status(401).json({ message: "Invalid refresh token" });
      }
      
      // CRITICAL SECURITY: Check if token was already revoked (reuse detection)
      if (tokenRecord.isRevoked) {
        logger.error('SECURITY ALERT: Refresh token reuse detected - revoking all user tokens', {
          userId: payload.sub,
          tokenId: payload.jti,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
        
        // Revoke ALL user's refresh tokens immediately
        await storage.revokeAllUserRefreshTokens(payload.sub);
        
        // Log security incident to audit trail
        await storage.createAuthAuditLog({
          userId: payload.sub,
          eventType: 'logout', // Closest equivalent to forced logout due to security
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          isSuccessful: false,
          failureReason: 'security_policy', // Use valid enum value instead
          details: { tokenId: payload.jti, revokedAllTokens: true }
        });
        return res.status(401).json({ message: "Security violation detected - all tokens revoked" });
      }
      
      // Get user details
      const user = await storage.getUser(payload.sub);
      if (!user) {
        logger.warn('User not found for refresh token', { userId: payload.sub, ip: req.ip });
        return res.status(401).json({ message: "User not found" });
      }

      if (!user.email) {
        logger.warn('User has no email for refresh token', { userId: payload.sub, ip: req.ip });
        return res.status(401).json({ message: "User has no email address" });
      }
      
      // CRITICAL SECURITY: Implement refresh token rotation
      // 1. Generate new refresh token ID and JWT
      const newRefreshTokenId = generateRefreshTokenId();
      const newRefreshTokenJWT = await generateRefreshTokenJWT(user.id, user.email, newRefreshTokenId);
      
      // 2. Generate new access token
      const newAccessToken = await generateAccessTokenJWT(user.id, user.email);
      
      // 3. Atomic operation: Create new refresh token and revoke old one
      try {
        // Create new refresh token record
        const newRefreshTokenData = {
          id: newRefreshTokenId,
          userId: user.id,
          token: newRefreshTokenJWT,
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip || null,
          expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN * 1000),
        };
        
        await storage.createRefreshToken(newRefreshTokenData);
        
        // Revoke the old refresh token
        await storage.revokeRefreshToken(payload.jti);
        
        // Log successful token refresh to audit trail
        await storage.createAuthAuditLog({
          userId: user.id,
          eventType: 'login_success', // Token refresh is maintaining session
          ipAddress: req.ip || 'unknown', 
          userAgent: req.headers['user-agent'] || 'unknown',
          isSuccessful: true,
          details: { oldTokenId: payload.jti, newTokenId: newRefreshTokenId, refreshType: 'token_rotation' }
        });
        
        logger.info('Refresh token rotation completed successfully', {
          userId: user.id,
          oldTokenId: payload.jti,
          newTokenId: newRefreshTokenId,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
        
        // Return both new access token and new refresh token
        return res.json({
          accessToken: newAccessToken,
          refreshToken: newRefreshTokenJWT,
          expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
          tokenType: 'Bearer'
        });
        
      } catch (rotationError) {
        logger.error('Refresh token rotation failed', rotationError, {
          userId: user.id,
          tokenId: payload.jti,
          ip: req.ip
        });
        
        // If rotation fails, revoke the old token for security
        await storage.revokeRefreshToken(payload.jti);
        return res.status(500).json({ message: "Token rotation failed - please login again" });
      }
      
    } catch (error) {
      logger.error('Token refresh failed', error, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });
      return res.status(500).json({ message: "Failed to refresh token" });
    }
  });
  
  app.post('/api/auth/revoke', requireHybridAuth, authRateLimit, validateRequest(revokeTokenSchema), async (req, res) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }
      
      // Verify and get refresh token payload
      const { valid, payload } = await verifyRefreshTokenJWT(refreshToken);
      if (!valid || !payload) {
        return res.status(400).json({ message: "Invalid refresh token" });
      }
      
      // Ensure user can only revoke their own tokens
      if (payload.sub !== userId) {
        return res.status(403).json({ message: "Cannot revoke another user's token" });
      }
      
      // Revoke the refresh token
      await storage.revokeRefreshToken(payload.jti);
      
      logger.info('Refresh token revoked successfully', {
        userId,
        tokenId: payload.jti,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });
      
      return res.json({ message: "Token revoked successfully" });
      
    } catch (error) {
      logger.error('Token revocation failed', error, {
        userId: getAuthUserId(req as AuthenticatedRequest),
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });
      return res.status(500).json({ message: "Failed to revoke token" });
    }
  });
  
  app.post('/api/auth/revoke-all', requireHybridAuth, authRateLimit, async (req, res) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);
      
      // Get count of active tokens before revoking
      const activeTokens = await storage.getUserActiveRefreshTokens(userId);
      const tokenCount = activeTokens.length;
      
      // Revoke all user's refresh tokens
      await storage.revokeAllUserRefreshTokens(userId);
      
      logger.info('All refresh tokens revoked for user', {
        userId,
        revokedTokenCount: tokenCount,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });
      
      return res.json({ 
        message: "All tokens revoked successfully",
        revokedTokenCount: tokenCount
      });
      
    } catch (error) {
      logger.error('All tokens revocation failed', error, {
        userId: getAuthUserId(req as AuthenticatedRequest),
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });
      return res.status(500).json({ message: "Failed to revoke all tokens" });
    }
  });
  
  app.get('/api/auth/tokens', requireHybridAuth, async (req, res) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);
      
      // Get user's active refresh tokens
      const activeTokens = await storage.getUserActiveRefreshTokens(userId);
      
      // Format tokens for response (hide sensitive data)
      const tokenList = activeTokens.map(token => ({
        id: token.id,
        userAgent: token.userAgent,
        ipAddress: token.ipAddress,
        createdAt: token.createdAt,
        lastUsed: token.lastUsed,
        expiresAt: token.expiresAt,
        isCurrentSession: req.headers['user-agent'] === token.userAgent // Basic heuristic
      }));
      
      return res.json({
        tokens: tokenList,
        totalActive: tokenList.length
      });
      
    } catch (error) {
      logger.error('Failed to fetch user tokens', error, {
        userId: getAuthUserId(req as AuthenticatedRequest)
      });
      return res.status(500).json({ message: "Failed to fetch active tokens" });
    }
  });

  // Registration endpoint
  app.post('/api/auth/register', authRateLimit, validateRequest(registrationSchema), async (req, res) => {
    try {
      const { email, password, firstName, lastName, username, primaryCommunity } = req.body;
      
      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          message: "Password does not meet security requirements",
          errors: passwordValidation.errors
        });
      }
      
      // Normalize email and username for consistency
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedUsername = username.toLowerCase().trim();
      
      // Check if user already exists by email
      const existingUserByEmail = await storage.getUserByEmail(normalizedEmail);
      if (existingUserByEmail) {
        logger.warn('Registration attempted with existing email', { email: normalizedEmail, ip: req.ip });
        return res.status(409).json({ message: "An account with this email already exists" });
      }
      
      // Check if username is already taken
      const existingUserByUsername = await storage.getUserByUsername(normalizedUsername);
      if (existingUserByUsername) {
        logger.warn('Registration attempted with existing username', { username: normalizedUsername, ip: req.ip });
        return res.status(409).json({ message: "This username is already taken" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Generate unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      // Prepare user data with normalized values (correct schema field names)
      const userData = {
        id: userId,
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: normalizedUsername,
        primaryCommunity: primaryCommunity || 'general',
        passwordHash: hashedPassword, // Correct schema field name
        isEmailVerified: false,
        status: 'offline' as const,
        showOnlineStatus: 'everyone' as const,
        allowDirectMessages: 'everyone' as const,
        isPrivate: false,
        mfaEnabled: false // Correct schema field name
      };
      
      // TRANSACTIONAL REGISTRATION PROCESS
      let newUser;
      let verificationToken;
      let emailSent = false;
      
      try {
        // Create the user
        newUser = await storage.createUser(userData);
        
        // Generate email verification token
        verificationToken = await generateEmailVerificationJWT(userId, normalizedEmail);
        
        // Create email verification record
        await storage.createEmailVerificationToken({
          userId: userId,
          email: normalizedEmail,
          token: verificationToken,
          expiresAt: new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION * 1000)
        });
        
        // Send verification email
        const baseUrl = process.env.AUTH_URL || process.env.PUBLIC_WEB_URL || 'https://shuffleandsync.org';
        emailSent = await sendEmailVerificationEmail(normalizedEmail, verificationToken, baseUrl);
        
        if (!emailSent) {
          logger.error('Failed to send verification email during registration', { 
            userId, 
            email: normalizedEmail, 
            ip: req.ip 
          });
          // Don't fail registration if email fails, user can resend later
        }
        
      } catch (transactionError) {
        logger.error('Registration transaction failed', transactionError, {
          email: normalizedEmail,
          username: normalizedUsername,
          ip: req.ip
        });
        
        // Log failed registration attempt
        try {
          await storage.createAuthAuditLog({
            userId: null,
            eventType: 'registration',
            ipAddress: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            isSuccessful: false,
            failureReason: 'transaction_error',
            details: { 
              email: normalizedEmail, 
              username: normalizedUsername,
              error: transactionError instanceof Error ? transactionError.message : 'Unknown error' 
            }
          });
        } catch (auditError) {
          logger.error('Failed to log registration failure', auditError);
        }
        
        return res.status(500).json({ message: "Registration failed. Please try again." });
      }
      
      if (!emailSent) {
        logger.error('Failed to send verification email during registration', { 
          userId, 
          email: normalizedEmail, 
          ip: req.ip 
        });
        
        // Log email sending failure
        await storage.createAuthAuditLog({
          userId: userId,
          eventType: 'email_verification',
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          isSuccessful: false,
          failureReason: 'email_send_failed',
          details: { 
            email: normalizedEmail,
            reason: 'email_service_error'
          }
        });
        // Don't fail registration if email fails, user can resend later
      } else {
        // Log successful email verification sent
        await storage.createAuthAuditLog({
          userId: userId,
          eventType: 'email_verification',
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          isSuccessful: true,
          details: { 
            email: normalizedEmail,
            action: 'verification_email_sent'
          }
        });
      }
      
      // Log successful registration with complete audit trail
      await storage.createAuthAuditLog({
        userId: userId,
        eventType: 'registration',
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        isSuccessful: true,
        details: { 
          email: normalizedEmail, 
          username: normalizedUsername,
          emailSent,
          userAgent: req.headers['user-agent'],
          registrationMethod: 'email_password'
        }
      });
      
      logger.info('User registered successfully', {
        userId,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        ip: req.ip,
        emailSent
      });
      
      // Return success response (don't include sensitive data)
      return res.status(201).json({
        message: "Registration successful! Please check your email to verify your account.",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          username: newUser.username,
          isEmailVerified: newUser.isEmailVerified
        },
        emailSent
      });
      
    } catch (error) {
      logger.error('Registration failed', error, {
        email: req.body?.email,
        username: req.body?.username,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      // Log failed registration attempt
      if (req.body?.email) {
        try {
          await storage.createAuthAuditLog({
            userId: null,
            eventType: 'registration',
            ipAddress: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            isSuccessful: false,
            failureReason: 'registration_error',
            details: { 
              email: req.body.email, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            }
          });
        } catch (auditError) {
          logger.error('Failed to log registration failure', auditError);
        }
      }
      
      return res.status(500).json({ message: "Registration failed. Please try again." });
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
        return res.json({ message: "Message sent successfully" });
      } else {
        logger.warn("Contact email failed to send", { senderEmail: email, subject });
        return res.status(500).json({ message: "Failed to send message" });
      }
    } catch (error) {
      logger.error("Contact form error", error, { email: req.body?.email });
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Communities routes
  app.get('/api/communities', async (req, res) => {
    try {
      const communities = await storage.getCommunities();
      return res.json(communities);
    } catch (error) {
      logger.error("Failed to fetch communities", error);
      return res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  app.get('/api/communities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const community = await storage.getCommunity(id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      return res.json(community);
    } catch (error) {
      logger.error("Failed to fetch community", error, { id: req.params.id });
      return res.status(500).json({ message: "Failed to fetch community" });
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

      return res.json(userCommunity);
    } catch (error) {
      logger.error("Failed to join community", error, { userId: getAuthUserId(authenticatedReq), communityId: req.body.communityId });
      return res.status(500).json({ message: "Failed to join community" });
    }
  });

  app.post('/api/user/communities/:communityId/set-primary', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { communityId } = req.params;
      
      await storage.setPrimaryCommunity(userId, communityId);
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to set primary community", error, { userId: getAuthUserId(authenticatedReq), communityId: req.body.communityId });
      return res.status(500).json({ message: "Failed to set primary community" });
    }
  });

  // Theme preferences
  app.get('/api/user/theme-preferences', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const preferences = await storage.getUserThemePreferences(userId);
      return res.json(preferences);
    } catch (error) {
      logger.error("Failed to fetch theme preferences", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to fetch theme preferences" });
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

      return res.json(preference);
    } catch (error) {
      logger.error("Failed to update theme preferences", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to update theme preferences" });
    }
  });

  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const { communityId, type, upcoming } = req.query;
      const userId = (req as any).user?.id;
      
      const events = await storage.getEvents({
        userId,
        communityId: communityId as string,
        type: type as string,
        upcoming: upcoming === 'true',
      });
      
      return res.json(events);
    } catch (error) {
      logger.error("Failed to fetch events", error, { filters: req.query });
      return res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      const event = await storage.getEvent(id, userId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      return res.json(event);
    } catch (error) {
      logger.error("Failed to fetch event", error, { eventId: req.params.id });
      return res.status(500).json({ message: "Failed to fetch event" });
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
      return res.json(event);
    } catch (error) {
      logger.error("Failed to create event", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to create event" });
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
      
      return res.json(updatedEvent);
    } catch (error) {
      logger.error("Failed to update event", error, { eventId: req.params.id });
      return res.status(500).json({ message: "Failed to update event" });
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
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to delete event", error, { eventId: req.params.id });
      return res.status(500).json({ message: "Failed to delete event" });
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
      
      return res.json(attendee);
    } catch (error) {
      logger.error("Failed to join event", error, { userId: getAuthUserId(authenticatedReq), eventId: req.body.eventId });
      return res.status(500).json({ message: "Failed to join event" });
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
      
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to leave event", error, { userId: getAuthUserId(authenticatedReq), eventId: req.params.eventId });
      return res.status(500).json({ message: "Failed to leave event" });
    }
  });

  app.get('/api/events/:eventId/attendees', async (req, res) => {
    try {
      const { eventId } = req.params;
      
      const attendees = await storage.getEventAttendees(eventId);
      return res.json(attendees);
    } catch (error) {
      logger.error("Failed to fetch event attendees", error, { eventId: req.params.eventId });
      return res.status(500).json({ message: "Failed to fetch event attendees" });
    }
  });

  app.get('/api/user/events', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      
      const attendance = await storage.getUserEventAttendance(userId);
      return res.json(attendance);
    } catch (error) {
      logger.error("Failed to fetch user events", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: "Failed to fetch user events" });
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
      return res.json(notifications);
    } catch (error) {
      logger.error("Failed to fetch notifications", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const notificationData = { ...req.body, userId: userId };
      const notification = await storage.createNotification(notificationData);
      return res.status(201).json(notification);
    } catch (error) {
      logger.error("Failed to create notification", error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to mark notification as read", error, { notificationId: req.params.id });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      await storage.markAllNotificationsAsRead(userId);
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to mark all notifications as read", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
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
      return res.json(messages);
    } catch (error) {
      logger.error("Failed to fetch messages", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const messageData = { ...req.body, senderId: userId };
      const message = await storage.sendMessage(messageData);
      return res.status(201).json(message);
    } catch (error) {
      logger.error("Failed to send message", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/conversations/:userId', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const currentUserId = getAuthUserId(authenticatedReq);
      const userId = assertRouteParam(req.params.userId, 'userId');
      const conversation = await storage.getConversation(currentUserId, userId);
      return res.json(conversation);
    } catch (error) {
      logger.error("Failed to fetch conversation", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
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
      return res.status(201).json(createdEvents);
    } catch (error) {
      logger.error("Failed to create bulk events", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
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
      return res.status(201).json(createdEvents);
    } catch (error) {
      logger.error("Failed to create recurring events", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
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
      
      return res.json(events);
    } catch (error) {
      logger.error("Failed to fetch calendar events", error, { filters: req.query });
      return res.status(500).json({ message: "Failed to fetch calendar events" });
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
      return res.json(gameSessions);
    } catch (error) {
      logger.error("Failed to fetch game sessions", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-sessions', isAuthenticated, validateRequest(validateGameSessionSchema), async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const sessionData = { ...req.body, hostId: userId };
      const gameSession = await storage.createGameSession(sessionData);
      return res.status(201).json(gameSession);
    } catch (error) {
      logger.error("Failed to create game session", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
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
          message: `${user?.name || user?.email || 'A player'} joined your game session`,
          data: { gameSessionId: id, playerId: userId },
        });
      }
      
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to join game session", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
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
      
      return res.json(gameSession);
    } catch (error) {
      logger.error("Failed to fetch game session", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
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
          message: `${user?.name || user?.email || 'A player'} left your game session`,
          data: { gameSessionId: id, playerId: userId },
        });
      }
      
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to leave game session", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
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
          message: `${user?.name || user?.email || 'Someone'} is now spectating your game`,
          data: { gameSessionId: id, spectatorId: userId },
        });
      }
      
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to spectate game session", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-sessions/:id/leave-spectating', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const { id } = req.params;
      await storage.leaveSpectating(id, userId);
      
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to leave spectating", error, { userId: getAuthUserId(authenticatedReq) });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize Enhanced WebSocket Server with security and reliability features
  const enhancedWebSocketServer = new EnhancedWebSocketServer(httpServer);
  
  logger.info('Enhanced WebSocket server initialized with security features', {
    rateLimiting: true,
    authenticationValidation: true,
    messageValidation: true,
    connectionManagement: true
  });

  // Health check endpoint for WebSocket server
  app.get('/api/websocket/health', (req, res) => {
    const stats = enhancedWebSocketServer.getStats();
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      websocket: stats
    });
  });
  
  // WebSocket functionality is now handled by the Enhanced WebSocket Server
  // All real-time features including authentication, rate limiting, message validation,
  // and connection management are implemented in the EnhancedWebSocketServer class

  // Add error handling middleware - must be last
  app.use(errorHandlingMiddleware.notFound);
  app.use(errorHandlingMiddleware.global);
  
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
