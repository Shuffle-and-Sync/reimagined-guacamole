import type { Express } from "express";
import { createServer, type Server } from "http";

import { storage } from "./storage";
import {
  isAuthenticated,
  getAuthUserId,
  _requireHybridAuth,
  type AuthenticatedRequest,
} from "./auth";
import {
  _insertCommunitySchema,
  insertEventSchema,
  _insertEventAttendeeSchema,
  _insertGameSessionSchema,
  type _UpsertUser,
} from "@shared/schema";
import { sendContactEmail } from "./email";
import { logger } from "./logger";
// FIXED: Use ONLY error classes from middleware, removed conflicting imports from ./types
import {
  errorHandlingMiddleware,
  errors,
} from "./middleware/error-handling.middleware";
import { assertRouteParam } from "./shared/utils";
import { graphicsGeneratorService } from "./services/graphics-generator";
import { enhancedNotificationService } from "./services/enhanced-notifications";
import { waitlistService } from "./services/waitlist";
const { asyncHandler } = errorHandlingMiddleware;
const {
  _AppError,
  _ValidationError,
  _AuthenticationError,
  _AuthorizationError,
  NotFoundError,
  ConflictError,
  _DatabaseError,
} = errors;
import analyticsRouter from "./routes/analytics";
import cacheHealthRouter from "./routes/cache-health";
import databaseHealthRouter from "./routes/database-health";
import backupRouter from "./routes/backup";
import monitoringRouter from "./routes/monitoring";
import matchingRouter from "./routes/matching";
import platformsRouter from "./routes/platforms.routes";
import userProfileRouter from "./routes/user-profile.routes";
import forumRouter from "./routes/forum.routes";
import gameSessionsRouter from "./routes/game-sessions.routes";
import streamingRouter from "./routes/streaming";

import EnhancedWebSocketServer from "./utils/websocket-server-enhanced";
// Auth.js session validation will be done via session endpoint
import { healthCheck } from "./health";
import {
  _generatePlatformOAuthURL,
  _handlePlatformOAuthCallback,
} from "./services/platform-oauth";
import {
  validateRequest,
  validateQuery,
  validateParamsWithSchema,
  securityHeaders,
  _validateUserProfileUpdateSchema,
  validateEventSchema,
  _validateSocialLinksSchema,
  _validateJoinCommunitySchema,
  _validateJoinEventSchema,
  _validateMessageSchema,
  _validateGameSessionSchema,
  uuidParamSchema,
  _eventParamSchema,
  _userParamSchema,
  _communityParamSchema,
  paginationQuerySchema,
  _searchQuerySchema,
} from "./validation";
import { z } from "zod";
import {
  generalRateLimit,
  _messageRateLimit,
  eventCreationRateLimit,
} from "./rate-limiting";
import { cardRecognitionRoutes } from "./features/cards/cards.routes";
import { universalCardRoutes } from "./features/cards/universal-cards.routes";
import { gamesCrudRoutes } from "./features/games/games-crud.routes";
import authRouter from "./features/auth/auth.routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security headers middleware
  app.use(securityHeaders);

  // General rate limiting for all API routes
  app.use("/api/", generalRateLimit);

  // Auth.js routes are handled in server/index.ts via authRouter

  // Initialize default communities
  await initializeDefaultCommunities();

  // Health check endpoint
  app.get("/api/health", healthCheck);

  // REMOVED: Platform OAuth routes - now in routes/platforms.routes.ts

  // Auth routes - authentication, MFA, tokens, password reset, registration (from features/auth)
  app.use("/api/auth", authRouter);

  // Friendship routes
  app.get("/api/friends", isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const friends = await storage.getFriends(userId);
      return res.json(friends);
    } catch (error) {
      logger.error("Failed to fetch friends", error, {
        userId: getAuthUserId(authenticatedReq),
      });
      return res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get("/api/friend-requests", isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const friendRequests = await storage.getFriendRequests(userId);
      return res.json(friendRequests);
    } catch (error) {
      logger.error("Failed to fetch friend requests", error, {
        userId: getAuthUserId(authenticatedReq),
      });
      return res
        .status(500)
        .json({ message: "Failed to fetch friend requests" });
    }
  });

  app.post("/api/friend-requests", isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const requesterId = getAuthUserId(authenticatedReq);
      const { addresseeId } = req.body;

      if (!addresseeId) {
        return res.status(400).json({ message: "Addressee ID is required" });
      }

      if (requesterId === addresseeId) {
        return res
          .status(400)
          .json({ message: "Cannot send friend request to yourself" });
      }

      // Check if friendship already exists
      const existingFriendship = await storage.checkFriendshipStatus(
        requesterId,
        addresseeId,
      );
      if (existingFriendship) {
        return res
          .status(400)
          .json({ message: "Friendship request already exists" });
      }

      const friendship = await storage.sendFriendRequest(
        requesterId,
        addresseeId,
      );

      // Create notification for the addressee
      await storage.createNotification({
        userId: addresseeId,
        type: "friend_request",
        title: "New Friend Request",
        message: `You have a new friend request`,
        data: JSON.stringify({ friendshipId: friendship.id, requesterId }),
      });

      return res.status(201).json(friendship);
    } catch (error) {
      logger.error("Failed to send friend request", error, {
        userId: getAuthUserId(authenticatedReq),
      });
      return res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.put("/api/friend-requests/:id", isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const _userId = getAuthUserId(authenticatedReq);
      const id = assertRouteParam(req.params.id, "id");
      const { status } = req.body;

      if (!["accepted", "declined", "blocked"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const friendship = await storage.respondToFriendRequest(id, status);

      // Create notification for the requester if accepted
      if (status === "accepted") {
        await storage.createNotification({
          userId: friendship.requesterId,
          type: "friend_accepted",
          title: "Friend Request Accepted",
          message: `Your friend request was accepted`,
          data: JSON.stringify({ friendshipId: friendship.id }),
        });
      }

      return res.json(friendship);
    } catch (error) {
      logger.error("Failed to respond to friend request", error, {
        userId: getAuthUserId(authenticatedReq),
      });
      return res
        .status(500)
        .json({ message: "Failed to respond to friend request" });
    }
  });

  app.delete("/api/friends/:id", isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const id = assertRouteParam(req.params.id, "id");

      // First check if the user is part of this friendship
      const friendship = await storage.checkFriendshipStatus(userId, id);
      if (!friendship) {
        return res.status(404).json({ message: "Friendship not found" });
      }

      await storage.respondToFriendRequest(friendship.id, "declined");
      return res.json({ success: true });
    } catch (error) {
      logger.error("Failed to remove friend", error, {
        userId: getAuthUserId(authenticatedReq),
      });
      return res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  // REMOVED: User settings routes - now in routes/user-profile.routes.ts

  // Matchmaking routes
  app.get("/api/matchmaking/preferences", isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const preferences = await storage.getMatchmakingPreferences(userId);
      return res.json(preferences);
    } catch (error) {
      logger.error("Failed to fetch matchmaking preferences", error, {
        userId: getAuthUserId(authenticatedReq),
      });
      return res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put("/api/matchmaking/preferences", isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const preferencesData = { ...req.body, userId };

      const preferences =
        await storage.upsertMatchmakingPreferences(preferencesData);
      return res.json(preferences);
    } catch (error) {
      logger.error("Failed to update matchmaking preferences", error, {
        userId: getAuthUserId(authenticatedReq),
      });
      return res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  app.post(
    "/api/matchmaking/find-players",
    isAuthenticated,
    async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);

        // Get user's current preferences or use request body preferences
        let preferences = await storage.getMatchmakingPreferences(userId);
        if (!preferences) {
          // Create default preferences if none exist
          preferences = await storage.upsertMatchmakingPreferences({
            userId,
            gameType: req.body.selectedGames?.[0] || "MTG", // Take first game as gameType
            preferredFormats: JSON.stringify(
              req.body.selectedFormats || ["commander"],
            ),
            skillLevelRange: JSON.stringify([
              req.body.powerLevelMin || 1,
              req.body.powerLevelMax || 10,
            ]),
            playStyle: req.body.playstyle || "casual",
            preferredLocation: req.body.location || null,
            maxTravelDistance: req.body.maxDistance || 50,
            availabilitySchedule: JSON.stringify(req.body.availability || {}),
            communicationPreferences: JSON.stringify({
              language: req.body.language || "english",
              onlineOnly: req.body.onlineOnly || false,
            }),
          });
        }

        const matches = await storage.findMatchingPlayers(userId, preferences);
        return res.json(matches);
      } catch (error) {
        logger.error("Failed to find matching players", error, {
          userId: getAuthUserId(authenticatedReq),
        });
        return res.status(500).json({ message: "Failed to find matches" });
      }
    },
  );

  // Tournament routes - improved with proper error handling
  app.get(
    "/api/tournaments",
    validateQuery(
      z.object({
        community: z.string().uuid().optional(),
        ...paginationQuerySchema.shape,
      }),
    ),
    asyncHandler(async (req, res) => {
      const {
        community: communityId,
        page,
        limit,
      } = req.query as Record<string, string>;
      const tournaments = await storage.getTournaments(communityId);
      return res.json({
        success: true,
        data: tournaments,
        meta: {
          page: page || 1,
          limit: limit || 20,
          total: tournaments.length,
        },
      });
    }),
  );

  app.get(
    "/api/tournaments/:id",
    validateParamsWithSchema(uuidParamSchema),
    asyncHandler(async (req, res) => {
      const tournamentId = assertRouteParam(req.params.id, "id");
      const tournament = await storage.getTournament(tournamentId);

      if (!tournament) {
        throw new NotFoundError("Tournament");
      }

      return res.json({
        success: true,
        data: tournament,
      });
    }),
  );

  app.post(
    "/api/tournaments",
    isAuthenticated,
    validateRequest(
      z.object({
        title: z.string().min(1, "Title is required").max(200),
        description: z.string().max(1000).optional(),
        type: z.enum(["tournament", "convention", "release", "community"]),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
        maxParticipants: z.number().int().min(1).max(1000).optional(),
        communityId: z.string().uuid("Invalid community ID"),
        isPublic: z.boolean().default(true),
      }),
    ),
    asyncHandler(async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);
      const tournamentData = { ...req.body, organizerId: userId };

      const tournament = await storage.createTournament(tournamentData);
      return res.status(201).json({
        success: true,
        data: tournament,
        message: "Tournament created successfully",
      });
    }),
  );

  app.post(
    "/api/tournaments/:id/join",
    isAuthenticated,
    validateParamsWithSchema(uuidParamSchema),
    asyncHandler(async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = getAuthUserId(authenticatedReq);
      const tournamentId = assertRouteParam(req.params.id, "id");

      const participant = await storage.joinTournament(tournamentId, userId);
      if (!participant) {
        throw new ConflictError(
          "Already joined tournament or tournament is full",
        );
      }

      return res.status(201).json({
        success: true,
        data: participant,
        message: "Successfully joined tournament",
      });
    }),
  );

  app.delete(
    "/api/tournaments/:id/leave",
    isAuthenticated,
    async (req, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const tournamentId = assertRouteParam(req.params.id, "id");

        const success = await storage.leaveTournament(tournamentId, userId);
        if (success) {
          return res.json({ message: "Left tournament successfully" });
        } else {
          return res
            .status(404)
            .json({ message: "Tournament participation not found" });
        }
      } catch (error) {
        logger.error("Failed to leave tournament", error, {
          userId: getAuthUserId(authenticatedReq),
          tournamentId: req.params.id,
        });
        return res.status(500).json({ message: "Failed to leave tournament" });
      }
    },
  );

  // Forum routes
  // REMOVED: Forum routes - now in routes/forum.routes.ts
  // This includes: posts CRUD, replies, likes/unlikes

  // ========================================
  // REFACTORED ROUTE MODULES (with consistent error handling)
  // ========================================

  // Platform OAuth and account linking
  app.use("/api/platforms", platformsRouter);

  // User profile, settings, and account management
  app.use("/api/user", userProfileRouter);

  // Forum posts and replies
  app.use("/api/forum", forumRouter);

  // Game sessions (join, leave, spectate)
  app.use("/api/game-sessions", gameSessionsRouter);

  // ========================================
  // INFRASTRUCTURE & MONITORING ROUTES
  // ========================================

  // Analytics routes - comprehensive analytics system
  app.use("/api/analytics", analyticsRouter);

  // Cache health and management routes
  app.use("/api/cache", cacheHealthRouter);

  // Database health and monitoring routes
  app.use("/api/database", databaseHealthRouter);

  // Backup and recovery management routes
  app.use("/api/backup", backupRouter);

  // Monitoring and alerting routes
  app.use("/api/monitoring", monitoringRouter);

  // Real-time matching and AI recommendations
  app.use("/api/matching", matchingRouter);

  // Universal Deck-Building routes (new)
  app.use("/api/games", gamesCrudRoutes); // Game CRUD operations
  app.use("/api/games", universalCardRoutes); // Game-scoped card operations

  // Card recognition routes for MTG and other TCG cards (legacy, maintained for backward compatibility)
  app.use("/api/cards", cardRecognitionRoutes);

  // ========================================
  // COLLABORATIVE STREAMING API ROUTES
  // ========================================

  // Collaborative streaming routes - real-time stream coordination and collaboration
  // REFACTORED: Moved to routes/streaming/ (events, collaborators, coordination, suggestions)
  app.use("/api/collaborative-streams", streamingRouter);

  // REMOVED: Data export and account deletion routes - now in routes/user-profile.routes.ts
  // REMOVED: Password reset routes - now in routes/auth/password.ts
  // REMOVED: Multi-Factor Authentication endpoints - now in routes/auth/mfa.ts
  // REMOVED: JWT Session Management endpoints - now in routes/auth/tokens.ts
  // REMOVED: Registration endpoint - now in routes/auth/register.ts

  // Contact form route
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

      if (
        !name?.trim() ||
        !email?.trim() ||
        !subject?.trim() ||
        !message?.trim()
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const emailSent = await sendContactEmail({
        name,
        email,
        subject,
        message,
      });

      if (emailSent) {
        logger.info("Contact email sent successfully", {
          senderEmail: email,
          subject,
        });
        return res.json({ message: "Message sent successfully" });
      } else {
        logger.warn("Contact email failed to send", {
          senderEmail: email,
          subject,
        });
        return res.status(500).json({ message: "Failed to send message" });
      }
    } catch (error) {
      logger.error("Contact form error", error, { email: req.body?.email });
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Communities routes
  app.get("/api/communities", async (req, res) => {
    try {
      const communities = await storage.getCommunities();
      return res.json(communities);
    } catch (error) {
      logger.error("Failed to fetch communities", error);
      return res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  app.get("/api/communities/:id", async (req, res) => {
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
  app.post(
    "/api/user/communities/:communityId/join",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
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
        logger.error("Failed to join community", error, {
          userId: getAuthUserId(authenticatedReq),
          communityId: req.body.communityId,
        });
        return res.status(500).json({ message: "Failed to join community" });
      }
    },
  );

  app.post(
    "/api/user/communities/:communityId/set-primary",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const { communityId } = req.params;

        await storage.setPrimaryCommunity(userId, communityId);
        return res.json({ success: true });
      } catch (error) {
        logger.error("Failed to set primary community", error, {
          userId: getAuthUserId(authenticatedReq),
          communityId: req.body.communityId,
        });
        return res
          .status(500)
          .json({ message: "Failed to set primary community" });
      }
    },
  );

  // Theme preferences
  app.get(
    "/api/user/theme-preferences",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const preferences = await storage.getUserThemePreferences(userId);
        return res.json(preferences);
      } catch (error) {
        logger.error("Failed to fetch theme preferences", error, {
          userId: getAuthUserId(authenticatedReq),
        });
        return res
          .status(500)
          .json({ message: "Failed to fetch theme preferences" });
      }
    },
  );

  app.post(
    "/api/user/theme-preferences",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
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
        logger.error("Failed to update theme preferences", error, {
          userId: getAuthUserId(authenticatedReq),
        });
        return res
          .status(500)
          .json({ message: "Failed to update theme preferences" });
      }
    },
  );

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const { communityId, type, upcoming } = req.query;
      const userId = (req as any).user?.id;

      const events = await storage.getEvents({
        userId,
        communityId: communityId as string,
        type: type as string,
        upcoming: upcoming === "true",
      });

      return res.json(events);
    } catch (error) {
      logger.error("Failed to fetch events", error, { filters: req.query });
      return res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
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

  app.post(
    "/api/events",
    isAuthenticated,
    eventCreationRateLimit,
    validateRequest(validateEventSchema),
    async (req: AuthenticatedRequest, res) => {
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
        logger.error("Failed to create event", error, {
          userId: getAuthUserId(authenticatedReq),
        });
        return res.status(500).json({ message: "Failed to create event" });
      }
    },
  );

  app.put(
    "/api/events/:id",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
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
          return res
            .status(403)
            .json({ message: "Not authorized to edit this event" });
        }

        const eventData = insertEventSchema.partial().parse(req.body);
        const updatedEvent = await storage.updateEvent(id, eventData);

        // Send update notifications
        const changes: string[] = [];
        if (
          eventData.startTime &&
          eventData.startTime !== existingEvent.startTime
        )
          changes.push("schedule");
        if (eventData.location && eventData.location !== existingEvent.location)
          changes.push("location");

        if (changes.length > 0) {
          enhancedNotificationService
            .sendEventUpdatedNotification(id, changes)
            .catch((err) =>
              logger.error("Failed to send update notification", err),
            );
        }

        return res.json(updatedEvent);
      } catch (error) {
        logger.error("Failed to update event", error, {
          eventId: req.params.id,
        });
        return res.status(500).json({ message: "Failed to update event" });
      }
    },
  );

  app.delete(
    "/api/events/:id",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
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
          return res
            .status(403)
            .json({ message: "Not authorized to delete this event" });
        }

        await storage.deleteEvent(id);
        return res.json({ success: true });
      } catch (error) {
        logger.error("Failed to delete event", error, {
          eventId: req.params.id,
        });
        return res.status(500).json({ message: "Failed to delete event" });
      }
    },
  );

  // Event attendance routes
  app.post(
    "/api/events/:eventId/join",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const { eventId } = req.params;
        const userId = getAuthUserId(authenticatedReq);
        const { status = "attending" } = req.body;

        // Verify event exists
        const event = await storage.getEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        const { role = "participant", playerType = "main" } = req.body;

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
              type: "event_join",
              title: "New Player Joined Your Pod",
              message: `${joiningUser.firstName || joiningUser.email} joined your ${updatedEvent.title} game pod`,
              data: JSON.stringify({
                eventId,
                playerType,
                joinedUserId: userId,
              }),
              priority: "normal",
            });
          }

          // Check if pod is now full or almost full for additional notifications
          const attendees = await storage.getEventAttendees(eventId);
          const mainPlayers = attendees.filter(
            (a) => a.playerType === "main" && a.status === "attending",
          ).length;
          const playerSlots = updatedEvent.playerSlots || 4;

          if (mainPlayers >= playerSlots) {
            // Pod is full - notify all participants
            for (const attendeeRecord of attendees) {
              if (attendeeRecord.userId !== userId) {
                await storage.createNotification({
                  userId: attendeeRecord.userId,
                  type: "pod_filled",
                  title: "Game Pod is Full!",
                  message: `${updatedEvent.title} is now at full capacity`,
                  data: JSON.stringify({ eventId }),
                  priority: "high",
                });
              }
            }
          } else if (mainPlayers === playerSlots - 1) {
            // Pod is almost full
            await storage.createNotification({
              userId: updatedEvent.creatorId,
              type: "pod_almost_full",
              title: "Game Pod Almost Full",
              message: `${updatedEvent.title} needs 1 more player`,
              data: JSON.stringify({ eventId }),
              priority: "normal",
            });
          }
        }

        return res.json(attendee);
      } catch (error) {
        logger.error("Failed to join event", error, {
          userId: getAuthUserId(authenticatedReq),
          eventId: req.body.eventId,
        });
        return res.status(500).json({ message: "Failed to join event" });
      }
    },
  );

  app.delete(
    "/api/events/:eventId/leave",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const { eventId } = req.params;
        const userId = getAuthUserId(authenticatedReq);

        // Get event and user details before leaving
        const event = await storage.getEvent(eventId);
        const leavingUser = await storage.getUser(userId);

        // Get attendee info to check if they were a main player
        const attendees = await storage.getEventAttendees(eventId);
        const leavingAttendee = attendees.find((a) => a.userId === userId);
        const wasMainPlayer = leavingAttendee?.playerType === "main";

        await storage.leaveEvent(eventId, userId);

        // If a main player left, try to promote from waitlist
        if (wasMainPlayer && event?.type === "game_pod") {
          await waitlistService
            .promoteFromWaitlist(eventId)
            .catch((err) =>
              logger.error("Failed to promote from waitlist", err),
            );
        }

        // Notify event creator that someone left
        if (event && leavingUser && event.creatorId !== userId) {
          await storage.createNotification({
            userId: event.creatorId,
            type: "event_leave",
            title: "Player Left Your Pod",
            message: `${leavingUser.firstName || leavingUser.email} left your ${event.title} game pod`,
            data: JSON.stringify({ eventId, leftUserId: userId }),
            priority: "normal",
          });
        }

        return res.json({ success: true });
      } catch (error) {
        logger.error("Failed to leave event", error, {
          userId: getAuthUserId(authenticatedReq),
          eventId: req.params.eventId,
        });
        return res.status(500).json({ message: "Failed to leave event" });
      }
    },
  );

  app.get("/api/events/:eventId/attendees", async (req, res) => {
    try {
      const { eventId } = req.params;

      const attendees = await storage.getEventAttendees(eventId);
      return res.json(attendees);
    } catch (error) {
      logger.error("Failed to fetch event attendees", error, {
        eventId: req.params.eventId,
      });
      return res
        .status(500)
        .json({ message: "Failed to fetch event attendees" });
    }
  });

  // Graphics generation route
  app.post(
    "/api/graphics/generate",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const _authenticatedReq = req as AuthenticatedRequest;
      try {
        const { eventId, template = "modern", includeQR = true } = req.body;

        if (!eventId) {
          return res.status(400).json({ message: "Event ID is required" });
        }

        // Verify user has access to this event
        const event = await storage.getEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        const graphicDataUrl =
          await graphicsGeneratorService.generateEventGraphic(
            eventId,
            template,
            includeQR,
          );

        return res.json({
          dataUrl: graphicDataUrl,
          template,
          eventId,
        });
      } catch (error) {
        logger.error("Failed to generate graphic", error, {
          eventId: req.body.eventId,
        });
        return res.status(500).json({ message: "Failed to generate graphic" });
      }
    },
  );

  app.get(
    "/api/user/events",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);

        const attendance = await storage.getUserEventAttendance(userId);
        return res.json(attendance);
      } catch (error) {
        logger.error("Failed to fetch user events", error, {
          userId: getAuthUserId(authenticatedReq),
        });
        return res.status(500).json({ message: "Failed to fetch user events" });
      }
    },
  );

  // Notification routes
  app.get(
    "/api/notifications",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const { unreadOnly, limit } = req.query;
        const notifications = await storage.getUserNotifications(userId, {
          unreadOnly: unreadOnly === "true",
          limit: limit ? parseInt(limit as string) : undefined,
        });
        return res.json(notifications);
      } catch (error) {
        logger.error("Failed to fetch notifications", error, {
          userId: getAuthUserId(authenticatedReq),
        });
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/notifications",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const notificationData = { ...req.body, userId: userId };
        const notification = await storage.createNotification(notificationData);
        return res.status(201).json(notification);
      } catch (error) {
        logger.error("Failed to create notification", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.patch(
    "/api/notifications/:id/read",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const _authenticatedReq = req as AuthenticatedRequest;
      try {
        const { id } = req.params;
        await storage.markNotificationAsRead(id);
        return res.json({ success: true });
      } catch (error) {
        logger.error("Failed to mark notification as read", error, {
          notificationId: req.params.id,
        });
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.patch(
    "/api/notifications/read-all",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        await storage.markAllNotificationsAsRead(userId);
        return res.json({ success: true });
      } catch (error) {
        logger.error("Failed to mark all notifications as read", error, {
          userId: getAuthUserId(authenticatedReq),
        });
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Message routes
  app.get("/api/messages", isAuthenticated, async (req, res) => {
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
      logger.error("Failed to fetch messages", error, {
        userId: getAuthUserId(authenticatedReq),
      });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(
    "/api/messages",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const messageData = { ...req.body, senderId: userId };
        const message = await storage.sendMessage(messageData);
        return res.status(201).json(message);
      } catch (error) {
        logger.error("Failed to send message", error, {
          userId: getAuthUserId(authenticatedReq),
        });
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get("/api/conversations/:userId", isAuthenticated, async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const currentUserId = getAuthUserId(authenticatedReq);
      const userId = assertRouteParam(req.params.userId, "userId");
      const conversation = await storage.getConversation(currentUserId, userId);
      return res.json(conversation);
    } catch (error) {
      logger.error("Failed to fetch conversation", error, {
        userId: getAuthUserId(authenticatedReq),
      });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Calendar routes for game pod scheduling
  app.post(
    "/api/events/bulk",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const { events } = req.body;

        if (!Array.isArray(events) || events.length === 0) {
          return res.status(400).json({ message: "Events array is required" });
        }

        // Add creator and host information to each event
        const eventData = events.map((event: Record<string, unknown>) => ({
          ...event,
          creatorId: userId,
          hostId: userId,
        }));

        const createdEvents = await storage.createBulkEvents(eventData);
        return res.status(201).json(createdEvents);
      } catch (error) {
        logger.error("Failed to create bulk events", error, {
          userId: getAuthUserId(authenticatedReq),
        });
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/events/recurring",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const eventData = {
          ...req.body,
          creatorId: userId,
          hostId: userId,
        };

        const createdEvents = await storage.createRecurringEvents(
          eventData,
          req.body.recurrenceEndDate,
        );
        return res.status(201).json(createdEvents);
      } catch (error) {
        logger.error("Failed to create recurring events", error, {
          userId: getAuthUserId(authenticatedReq),
        });
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get("/api/calendar/events", async (req, res) => {
    try {
      const { communityId, startDate, endDate, type } = req.query;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ message: "startDate and endDate are required" });
      }

      const events = await storage.getCalendarEvents({
        communityId: communityId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        type: type as string,
      });

      return res.json(events);
    } catch (error) {
      logger.error("Failed to fetch calendar events", error, {
        filters: req.query,
      });
      return res
        .status(500)
        .json({ message: "Failed to fetch calendar events" });
    }
  });

  // Game session routes
  // REMOVED: Game session routes - now in routes/game-sessions.routes.ts
  // This includes: get, create, join, leave, spectate game sessions

  app.post(
    "/api/game-sessions/:id/leave-spectating",
    isAuthenticated,
    async (req: AuthenticatedRequest, res) => {
      const authenticatedReq = req as AuthenticatedRequest;
      try {
        const userId = getAuthUserId(authenticatedReq);
        const { id } = req.params;
        await storage.leaveSpectating(id, userId);

        return res.json({ success: true });
      } catch (error) {
        logger.error("Failed to leave spectating", error, {
          userId: getAuthUserId(authenticatedReq),
        });
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  const httpServer = createServer(app);

  // Initialize Enhanced WebSocket Server with security and reliability features
  const enhancedWebSocketServer = new EnhancedWebSocketServer(httpServer);

  logger.info("Enhanced WebSocket server initialized with security features", {
    rateLimiting: true,
    authenticationValidation: true,
    messageValidation: true,
    connectionManagement: true,
  });

  // Health check endpoint for WebSocket server
  app.get("/api/websocket/health", (req, res) => {
    const stats = enhancedWebSocketServer.getStats();
    return res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      websocket: stats,
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
      description:
        "Magic: The Gathering streaming coordination. Manage spell circles, strategic alliances, and create legendary MTG content.",
      themeColor: "hsl(0, 75%, 60%)", // Red theme for MTG
      iconClass: "fas fa-magic",
    },
    {
      id: "pokestream-hub",
      name: "pokestream-hub",
      displayName: "PokeStream Hub",
      description:
        "Unite Pokemon trainers worldwide. Coordinate teams, host battle arenas, and create legendary content together.",
      themeColor: "hsl(45, 100%, 50%)", // Yellow theme for Pokemon
      iconClass: "fas fa-bolt",
    },
    {
      id: "decksong",
      name: "decksong",
      displayName: "Decksong",
      description:
        "Disney Lorcana creators unite in harmony. Orchestrate collaborative streams and build magical kingdoms together.",
      themeColor: "hsl(300, 70%, 65%)", // Purple theme for Lorcana
      iconClass: "fas fa-crown",
    },
    {
      id: "duelcraft",
      name: "duelcraft",
      displayName: "Duelcraft",
      description:
        "Yu-Gi-Oh duelists assemble! Master the shadow realm of collaborative content and strategic partnerships.",
      themeColor: "hsl(240, 70%, 65%)", // Blue theme for Yu-Gi-Oh
      iconClass: "fas fa-eye",
    },
    {
      id: "bladeforge",
      name: "bladeforge",
      displayName: "Bladeforge",
      description:
        "Forge alliances in the world of strategic card combat. Unite creators and build legendary gaming content.",
      themeColor: "hsl(160, 70%, 50%)", // Green theme
      iconClass: "fas fa-sword",
    },
    {
      id: "deckmaster",
      name: "deckmaster",
      displayName: "Deckmaster",
      description:
        "Master the art of strategic deck building and content creation. Perfect your craft with fellow creators.",
      themeColor: "hsl(260, 70%, 65%)", // Indigo theme
      iconClass: "fas fa-chess",
    },
  ];

  for (const communityData of defaultCommunities) {
    try {
      const existing = await storage.getCommunity(communityData.id);
      if (!existing) {
        await storage.createCommunity(communityData);
        logger.info("Created community successfully", {
          name: communityData.displayName,
          id: communityData.id,
        });
      }
    } catch (error) {
      logger.error("Failed to create community", error, {
        name: communityData.displayName,
      });
    }
  }
}
