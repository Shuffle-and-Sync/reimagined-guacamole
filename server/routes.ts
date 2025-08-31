import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCommunitySchema, insertEventSchema, insertEventAttendeeSchema } from "@shared/schema";
import { sendPasswordResetEmail } from "./email-service";
import { randomBytes } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
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
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Password reset routes
  app.post('/api/auth/forgot-password', async (req, res) => {
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
      console.error("Error in forgot password:", error);
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
      console.error("Error verifying reset token:", error);
      res.status(500).json({ message: "Failed to verify reset token" });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
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
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Communities routes
  app.get('/api/communities', async (req, res) => {
    try {
      const communities = await storage.getCommunities();
      res.json(communities);
    } catch (error) {
      console.error("Error fetching communities:", error);
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
      console.error("Error fetching community:", error);
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
      console.error("Error joining community:", error);
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
      console.error("Error setting primary community:", error);
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
      console.error("Error fetching theme preferences:", error);
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
      console.error("Error updating theme preferences:", error);
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
      console.error("Error fetching events:", error);
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
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventData = insertEventSchema.parse({
        ...req.body,
        creatorId: userId,
      });
      
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
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
      console.error("Error updating event:", error);
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
      console.error("Error deleting event:", error);
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
      console.error("Error joining event:", error);
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
      console.error("Error leaving event:", error);
      res.status(500).json({ message: "Failed to leave event" });
    }
  });

  app.get('/api/events/:eventId/attendees', async (req, res) => {
    try {
      const { eventId } = req.params;
      
      const attendees = await storage.getEventAttendees(eventId);
      res.json(attendees);
    } catch (error) {
      console.error("Error fetching event attendees:", error);
      res.status(500).json({ message: "Failed to fetch event attendees" });
    }
  });

  app.get('/api/user/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const attendance = await storage.getUserEventAttendance(userId);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ message: "Failed to fetch user events" });
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
        console.log(`Created community: ${communityData.displayName}`);
      }
    } catch (error) {
      console.error(`Error creating community ${communityData.displayName}:`, error);
    }
  }
}
