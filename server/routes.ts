import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCommunitySchema, insertEventSchema, insertEventAttendeeSchema, type UpsertUser } from "@shared/schema";
import { sendPasswordResetEmail } from "./email-service";
import { sendContactEmail } from "./email";
import { randomBytes } from "crypto";
import { logger } from "./logger";
import { AuthenticatedRequest, NotFoundError, ValidationError } from "./types";
import { healthCheck } from "./health";
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
  
  // Auth middleware
  await setupAuth(app);

  // Initialize default communities
  await initializeDefaultCommunities();

  // Health check endpoint
  app.get('/api/health', healthCheck);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
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
      logger.error("Failed to fetch user", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/user/profile', isAuthenticated, validateRequest(validateUserProfileUpdateSchema), async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      
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
      logger.error("Failed to update user profile", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get user profile (for viewing other users' profiles)
  app.get('/api/user/profile/:userId?', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const currentUserId = authenticatedReq.user.claims.sub;
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
      logger.error("Failed to fetch user profile", error, { currentUserId: authenticatedReq.user.claims.sub, targetUserId: req.params.userId });
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Social links routes
  app.get('/api/user/social-links/:userId?', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const currentUserId = authenticatedReq.user.claims.sub;
      const targetUserId = req.params.userId || currentUserId;
      
      const socialLinks = await storage.getUserSocialLinks(targetUserId);
      res.json(socialLinks);
    } catch (error) {
      logger.error("Failed to fetch social links", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch social links" });
    }
  });

  app.put('/api/user/social-links', isAuthenticated, validateRequest(validateSocialLinksSchema), async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      const { links } = req.body;
      
      const updatedLinks = await storage.updateUserSocialLinks(userId, links);
      res.json(updatedLinks);
    } catch (error) {
      logger.error("Failed to update social links", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to update social links" });
    }
  });

  // Gaming profiles routes
  app.get('/api/user/gaming-profiles/:userId?', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const currentUserId = authenticatedReq.user.claims.sub;
      const targetUserId = req.params.userId || currentUserId;
      
      const gamingProfiles = await storage.getUserGamingProfiles(targetUserId);
      res.json(gamingProfiles);
    } catch (error) {
      logger.error("Failed to fetch gaming profiles", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch gaming profiles" });
    }
  });

  // Friendship routes
  app.get('/api/friends', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      logger.error("Failed to fetch friends", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get('/api/friend-requests', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      const friendRequests = await storage.getFriendRequests(userId);
      res.json(friendRequests);
    } catch (error) {
      logger.error("Failed to fetch friend requests", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.post('/api/friend-requests', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const requesterId = authenticatedReq.user.claims.sub;
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
      logger.error("Failed to send friend request", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.put('/api/friend-requests/:id', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
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
      logger.error("Failed to respond to friend request", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to respond to friend request" });
    }
  });

  app.delete('/api/friends/:id', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      const { id } = req.params;
      
      // First check if the user is part of this friendship
      const friendship = await storage.checkFriendshipStatus(userId, id);
      if (!friendship) {
        return res.status(404).json({ message: "Friendship not found" });
      }

      await storage.respondToFriendRequest(friendship.id, 'declined');
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to remove friend", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  // User settings routes
  app.get('/api/user/settings', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      logger.error("Failed to fetch user settings", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/user/settings', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      const settingsData = { ...req.body, userId };
      
      const settings = await storage.upsertUserSettings(settingsData);
      res.json(settings);
    } catch (error) {
      logger.error("Failed to update user settings", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Matchmaking routes
  app.get('/api/matchmaking/preferences', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      const preferences = await storage.getMatchmakingPreferences(userId);
      res.json(preferences);
    } catch (error) {
      logger.error("Failed to fetch matchmaking preferences", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put('/api/matchmaking/preferences', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      const preferencesData = { ...req.body, userId };
      
      const preferences = await storage.upsertMatchmakingPreferences(preferencesData);
      res.json(preferences);
    } catch (error) {
      logger.error("Failed to update matchmaking preferences", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  app.post('/api/matchmaking/find-players', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      
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
      logger.error("Failed to find matching players", error, { userId: authenticatedReq.user.claims.sub });
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
      const userId = authenticatedReq.user.claims.sub;
      const tournamentData = { ...req.body, organizerId: userId };
      
      const tournament = await storage.createTournament(tournamentData);
      res.json(tournament);
    } catch (error) {
      logger.error("Failed to create tournament", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to create tournament" });
    }
  });

  app.post('/api/tournaments/:id/join', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      const tournamentId = req.params.id;
      
      const participant = await storage.joinTournament(tournamentId, userId);
      res.json(participant);
    } catch (error) {
      logger.error("Failed to join tournament", error, { userId: authenticatedReq.user.claims.sub, tournamentId: req.params.id });
      res.status(500).json({ message: "Failed to join tournament" });
    }
  });

  app.delete('/api/tournaments/:id/leave', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      const tournamentId = req.params.id;
      
      const success = await storage.leaveTournament(tournamentId, userId);
      if (success) {
        res.json({ message: "Left tournament successfully" });
      } else {
        res.status(404).json({ message: "Tournament participation not found" });
      }
    } catch (error) {
      logger.error("Failed to leave tournament", error, { userId: authenticatedReq.user.claims.sub, tournamentId: req.params.id });
      res.status(500).json({ message: "Failed to leave tournament" });
    }
  });

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      
      // Get analytics data for the current user
      const analytics = await storage.getAnalyticsData(userId);
      res.json(analytics);
    } catch (error) {
      logger.error("Failed to fetch analytics", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Data export route
  app.get('/api/user/export-data', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      
      // Get comprehensive user data for export
      const userData = await storage.exportUserData(userId);
      
      logger.info("Data export completed", { userId });
      res.json(userData);
    } catch (error) {
      logger.error("Failed to export user data", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Account deletion route  
  app.delete('/api/user/account', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      
      // Perform cascade deletion of user data
      const success = await storage.deleteUserAccount(userId);
      
      if (success) {
        logger.info("Account deletion completed", { userId });
        
        // Clear session and cookies
        req.session.destroy((err) => {
          if (err) {
            logger.error("Failed to destroy session during account deletion", err);
          }
        });
        
        res.clearCookie('connect.sid');
        res.json({ 
          message: "Account deleted successfully"
        });
      } else {
        res.status(404).json({ message: "User account not found" });
      }
    } catch (error) {
      logger.error("Failed to delete user account", error, { userId: authenticatedReq.user.claims.sub });
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
      
      // Always return success to prevent email enumeration attacks
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      const baseUrl = req.protocol + '://' + req.get('host');

      if (userExists) {
        // Create password reset token
        await storage.createPasswordResetToken({
          email,
          token,
          expiresAt,
        });

        // Send email
        await sendPasswordResetEmail(email, token, baseUrl);
      }

      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      logger.error("Failed to process forgot password request", error, { email: req.body.email });
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

  app.post('/api/auth/reset-password', authRateLimit, validateRequest(validatePasswordResetSchema), async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Mark token as used
      await storage.markTokenAsUsed(token);

      // TODO: Update user password in database
      // Note: This depends on your authentication system
      // For now, we'll just clean up the token
      
      res.json({ message: "Password reset successful" });
    } catch (error) {
      logger.error("Failed to reset password", error, { token: req.body.token });
      res.status(500).json({ message: "Failed to reset password" });
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
      const userId = authenticatedReq.user.claims.sub;
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
      logger.error("Failed to join community", error, { userId: authenticatedReq.user.claims.sub, communityId: req.body.communityId });
      res.status(500).json({ message: "Failed to join community" });
    }
  });

  app.post('/api/user/communities/:communityId/set-primary', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      const { communityId } = req.params;
      
      await storage.setPrimaryCommunity(userId, communityId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to set primary community", error, { userId: authenticatedReq.user.claims.sub, communityId: req.body.communityId });
      res.status(500).json({ message: "Failed to set primary community" });
    }
  });

  // Theme preferences
  app.get('/api/user/theme-preferences', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      const preferences = await storage.getUserThemePreferences(userId);
      res.json(preferences);
    } catch (error) {
      logger.error("Failed to fetch theme preferences", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch theme preferences" });
    }
  });

  app.post('/api/user/theme-preferences', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user.claims.sub;
      const { communityId, themeMode, customColors } = req.body;
      
      const preference = await storage.upsertThemePreference({
        userId,
        communityId,
        themeMode,
        customColors,
      });

      res.json(preference);
    } catch (error) {
      logger.error("Failed to update theme preferences", error, { userId: authenticatedReq.user.claims.sub });
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
      const userId = authenticatedReq.user.claims.sub;
      const eventData = insertEventSchema.parse({
        ...req.body,
        creatorId: userId,
        hostId: userId, // Set host to the same user who created the event
      });
      
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      logger.error("Failed to create event", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put('/api/events/:id', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      const userId = authenticatedReq.user.claims.sub;
      
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
      const userId = authenticatedReq.user.claims.sub;
      
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
      const userId = authenticatedReq.user.claims.sub;
      const { status = 'attending' } = req.body;
      
      // Verify event exists
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const attendee = await storage.joinEvent({
        eventId,
        userId,
        status,
      });
      
      res.json(attendee);
    } catch (error) {
      logger.error("Failed to join event", error, { userId: authenticatedReq.user.claims.sub, eventId: req.body.eventId });
      res.status(500).json({ message: "Failed to join event" });
    }
  });

  app.delete('/api/events/:eventId/leave', isAuthenticated, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const userId = authenticatedReq.user.claims.sub;
      
      await storage.leaveEvent(eventId, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to leave event", error, { userId: authenticatedReq.user.claims.sub, eventId: req.params.eventId });
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
      const userId = authenticatedReq.user.claims.sub;
      
      const attendance = await storage.getUserEventAttendance(userId);
      res.json(attendance);
    } catch (error) {
      logger.error("Failed to fetch user events", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch user events" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const user = authenticatedReq.user as any;
      const { unreadOnly, limit } = req.query;
      const notifications = await storage.getUserNotifications(user.claims.sub, {
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(notifications);
    } catch (error) {
      logger.error("Failed to fetch notifications", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const user = authenticatedReq.user as any;
      const notificationData = { ...req.body, userId: user.claims.sub };
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
      const user = authenticatedReq.user as any;
      await storage.markAllNotificationsAsRead(user.claims.sub);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to mark all notifications as read", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Message routes
  app.get('/api/messages', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const user = authenticatedReq.user as any;
      const { eventId, communityId, limit } = req.query;
      const messages = await storage.getUserMessages(user.claims.sub, {
        eventId: eventId as string,
        communityId: communityId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(messages);
    } catch (error) {
      logger.error("Failed to fetch messages", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const user = authenticatedReq.user as any;
      const messageData = { ...req.body, senderId: user.claims.sub };
      const message = await storage.sendMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      logger.error("Failed to send message", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/conversations/:userId', isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const user = authenticatedReq.user as any;
      const { userId } = req.params;
      const conversation = await storage.getConversation(user.claims.sub, userId);
      res.json(conversation);
    } catch (error) {
      logger.error("Failed to fetch conversation", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
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
      logger.error("Failed to fetch game sessions", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-sessions', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const user = authenticatedReq.user as any;
      const sessionData = { ...req.body, hostId: user.claims.sub };
      const gameSession = await storage.createGameSession(sessionData);
      res.status(201).json(gameSession);
    } catch (error) {
      logger.error("Failed to create game session", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-sessions/:id/join', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const user = authenticatedReq.user as any;
      const { id } = req.params;
      await storage.joinGameSession(id, user.claims.sub);
      
      // Create notification for host when someone joins
      const gameSession = await storage.getGameSessions({ eventId: id });
      if (gameSession.length > 0) {
        await storage.createNotification({
          userId: gameSession[0].hostId,
          type: 'event_join',
          title: 'Player Joined Game',
          message: `${user.claims.first_name || user.claims.email} joined your game session`,
          data: { gameSessionId: id, playerId: user.claims.sub },
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to join game session", error, { userId: authenticatedReq.user.claims.sub });
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
      logger.error("Failed to fetch game session", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-sessions/:id/leave', isAuthenticated, async (req: any, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const user = authenticatedReq.user as any;
      const { id } = req.params;
      await storage.leaveGameSession(id, user.claims.sub);
      
      // Create notification for host when someone leaves
      const gameSession = await storage.getGameSessions({ eventId: id });
      if (gameSession.length > 0) {
        await storage.createNotification({
          userId: gameSession[0].hostId,
          type: 'event_leave',
          title: 'Player Left Game',
          message: `${user.claims.first_name || user.claims.email} left your game session`,
          data: { gameSessionId: id, playerId: user.claims.sub },
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to leave game session", error, { userId: authenticatedReq.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time game coordination
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Game room connections: sessionId -> Set of WebSocket connections
  const gameRooms = new Map();
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
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
            gameRooms.get(sessionId)?.add(ws as any);
            
            // Notify other players
            const roomPlayers = Array.from(gameRooms.get(sessionId) || []).map(client => ({
              id: (client as any).userId,
              name: (client as any).userName,
              avatar: (client as any).userAvatar
            }));
            
            // Broadcast to all players in room
            gameRooms.get(sessionId)?.forEach(client => {
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
              
              room.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(chatMessage));
                }
              });
            }
            break;
            
          case 'game_action':
            const gameRoom = gameRooms.get(message.sessionId);
            if (gameRoom) {
              gameRoom.forEach(client => {
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
              offerRoom.forEach(client => {
                if ((client as any).userId === message.targetPlayer && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'webrtc_offer',
                    fromPlayer: (ws as any).userId,
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
              answerRoom.forEach(client => {
                if ((client as any).userId === message.targetPlayer && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'webrtc_answer',
                    fromPlayer: (ws as any).userId,
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
              iceRoom.forEach(client => {
                if ((client as any).userId === message.targetPlayer && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'webrtc_ice_candidate',
                    fromPlayer: (ws as any).userId,
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
              cameraRoom.forEach(client => {
                if ((client as any).userId !== (ws as any).userId && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'camera_status',
                    playerId: (ws as any).userId,
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
              micRoom.forEach(client => {
                if ((client as any).userId !== (ws as any).userId && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'mic_status',
                    playerId: (ws as any).userId,
                    playerName: message.user.name,
                    micOn: message.micOn
                  }));
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove from all game rooms
      const wsWithData = ws as any;
      if (wsWithData.sessionId) {
        const room = gameRooms.get(wsWithData.sessionId);
        if (room) {
          room.delete(ws as any);
          
          // Notify other players
          const remainingPlayers = Array.from(room).map(client => ({
            id: (client as any).userId,
            name: (client as any).userName,
            avatar: (client as any).userAvatar
          }));
          
          room.forEach(client => {
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
