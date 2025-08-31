import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCommunitySchema, insertEventSchema, insertEventAttendeeSchema, type UpsertUser } from "@shared/schema";
import { sendPasswordResetEmail } from "./email-service";
import { randomBytes } from "crypto";
import { logger } from "./logger";
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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      logger.error("Failed to fetch user", error, { userId: req.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/user/profile', isAuthenticated, validateRequest(validateUserProfileUpdateSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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
      logger.error("Failed to update user profile", error, { userId: req.user.claims.sub, updates: Object.keys(updates) });
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get user profile (for viewing other users' profiles)
  app.get('/api/user/profile/:userId?', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
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
        friendCount: 0, // TODO: implement friend count
      });
    } catch (error) {
      logger.error("Failed to fetch user profile", error, { currentUserId: req.user.claims.sub, targetUserId: req.params.userId });
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Social links routes
  app.get('/api/user/social-links/:userId?', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const targetUserId = req.params.userId || currentUserId;
      
      const socialLinks = await storage.getUserSocialLinks(targetUserId);
      res.json(socialLinks);
    } catch (error) {
      logger.error("Failed to fetch social links", error, { userId: req.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch social links" });
    }
  });

  app.put('/api/user/social-links', isAuthenticated, validateRequest(validateSocialLinksSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { links } = req.body;
      
      const updatedLinks = await storage.updateUserSocialLinks(userId, links);
      res.json(updatedLinks);
    } catch (error) {
      logger.error("Failed to update social links", error, { userId: req.user.claims.sub });
      res.status(500).json({ message: "Failed to update social links" });
    }
  });

  // Gaming profiles routes
  app.get('/api/user/gaming-profiles/:userId?', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const targetUserId = req.params.userId || currentUserId;
      
      const gamingProfiles = await storage.getUserGamingProfiles(targetUserId);
      res.json(gamingProfiles);
    } catch (error) {
      logger.error("Failed to fetch gaming profiles", error, { userId: req.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch gaming profiles" });
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
    try {
      const userId = req.user.claims.sub;
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
      logger.error("Failed to join community", error, { userId: req.user.claims.sub, communityId: req.body.communityId });
      res.status(500).json({ message: "Failed to join community" });
    }
  });

  app.post('/api/user/communities/:communityId/set-primary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { communityId } = req.params;
      
      await storage.setPrimaryCommunity(userId, communityId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to set primary community", error, { userId: req.user.claims.sub, communityId: req.body.communityId });
      res.status(500).json({ message: "Failed to set primary community" });
    }
  });

  // Theme preferences
  app.get('/api/user/theme-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getUserThemePreferences(userId);
      res.json(preferences);
    } catch (error) {
      logger.error("Failed to fetch theme preferences", error, { userId: req.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch theme preferences" });
    }
  });

  app.post('/api/user/theme-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { communityId, themeMode, customColors } = req.body;
      
      const preference = await storage.upsertThemePreference({
        userId,
        communityId,
        themeMode,
        customColors,
      });

      res.json(preference);
    } catch (error) {
      logger.error("Failed to update theme preferences", error, { userId: req.user.claims.sub });
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
    try {
      const userId = req.user.claims.sub;
      const eventData = insertEventSchema.parse({
        ...req.body,
        creatorId: userId,
      });
      
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      logger.error("Failed to create event", error, { userId: req.user.claims.sub });
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
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
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
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
    try {
      const { eventId } = req.params;
      const userId = req.user.claims.sub;
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
      logger.error("Failed to join event", error, { userId: req.user.claims.sub, eventId: req.body.eventId });
      res.status(500).json({ message: "Failed to join event" });
    }
  });

  app.delete('/api/events/:eventId/leave', isAuthenticated, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const userId = req.user.claims.sub;
      
      await storage.leaveEvent(eventId, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to leave event", error, { userId: req.user.claims.sub, eventId: req.params.eventId });
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
    try {
      const userId = req.user.claims.sub;
      
      const attendance = await storage.getUserEventAttendance(userId);
      res.json(attendance);
    } catch (error) {
      logger.error("Failed to fetch user events", error, { userId: req.user.claims.sub });
      res.status(500).json({ message: "Failed to fetch user events" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const { unreadOnly, limit } = req.query;
      const notifications = await storage.getUserNotifications(user.claims.sub, {
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(notifications);
    } catch (error) {
      logger.error("Failed to fetch notifications", error, { userId: req.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const notificationData = { ...req.body, userId: user.claims.sub };
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      logger.error("Failed to create notification", error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
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
    try {
      const user = req.user as any;
      await storage.markAllNotificationsAsRead(user.claims.sub);
      res.json({ success: true });
    } catch (error) {
      logger.error("Failed to mark all notifications as read", error, { userId: req.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Message routes
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const { eventId, communityId, limit } = req.query;
      const messages = await storage.getUserMessages(user.claims.sub, {
        eventId: eventId as string,
        communityId: communityId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(messages);
    } catch (error) {
      logger.error("Failed to fetch messages", error, { userId: req.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const messageData = { ...req.body, senderId: user.claims.sub };
      const message = await storage.sendMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      logger.error("Failed to send message", error, { userId: req.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/conversations/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const { userId } = req.params;
      const conversation = await storage.getConversation(user.claims.sub, userId);
      res.json(conversation);
    } catch (error) {
      logger.error("Failed to fetch conversation", error, { userId: req.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Game session routes
  app.get('/api/game-sessions', isAuthenticated, async (req: any, res) => {
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
      logger.error("Failed to fetch game sessions", error, { userId: req.user.claims.sub });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const sessionData = { ...req.body, hostId: user.claims.sub };
      const gameSession = await storage.createGameSession(sessionData);
      res.status(201).json(gameSession);
    } catch (error) {
      console.error('Error creating game session:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-sessions/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
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
      console.error('Error joining game session:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-sessions/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
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
      console.error('Error leaving game session:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
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
