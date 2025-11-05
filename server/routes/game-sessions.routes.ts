/**
 * Game Sessions Routes
 * Handles game session management, joining, leaving, and spectating
 */

import { Router } from "express";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../auth";
import {
  errors,
  errorHandlingMiddleware,
} from "../middleware/error-handling.middleware";
import {
  authorizeSessionJoin,
  authorizeSpectate,
} from "../middleware/game-authorization.middleware";
import { rateLimiter } from "../middleware/rateLimiter";
import { storage } from "../storage";
import { validateRequest, validateGameSessionSchema } from "../validation";

const { asyncHandler } = errorHandlingMiddleware;
const { NotFoundError, BadRequestError } = errors;

const router = Router();

// Get game sessions
router.get(
  "/",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { eventId, communityId, hostId, status } = req.query;
    const gameSessions = await storage.getGameSessions({
      eventId: eventId as string,
      communityId: communityId as string,
      hostId: hostId as string,
      status: status as string,
    });
    return res.json(gameSessions);
  }),
);

// Create game session
router.post(
  "/",
  isAuthenticated,
  validateRequest(validateGameSessionSchema),
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const sessionData = { ...req.body, hostId: userId };
    const gameSession = await storage.createGameSession(sessionData);
    return res.status(201).json(gameSession);
  }),
);

// Get single game session
router.get(
  "/:id",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    // Express route pattern /:id guarantees id is present
    const { id } = req.params;
    const gameSession = await storage.getGameSessionById(id!);

    if (!gameSession) {
      throw new NotFoundError("Game session");
    }

    return res.json(gameSession);
  }),
);

// Join game session
router.post(
  "/:id/join",
  isAuthenticated,
  rateLimiter.standard,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const user = authenticatedReq.user;
    // Express route pattern /:id guarantees id is present
    const { id } = req.params;

    // Authorize session join
    const authResult = await authorizeSessionJoin(id!, userId);
    if (!authResult.authorized) {
      return res.status(403).json({
        error: authResult.reason || "Not authorized to join this session",
      });
    }

    await storage.joinGameSession(id!, userId);

    // Create notification for host when someone joins
    const gameSession = await storage.getGameSessions({ eventId: id! });
    if (gameSession.length > 0 && gameSession[0]?.hostId) {
      await storage.createNotification({
        userId: gameSession[0].hostId,
        type: "event_join",
        title: "Player Joined Game",
        message: `${user?.name || user?.email || "A player"} joined your game session`,
        data: JSON.stringify({ gameSessionId: id, playerId: userId }),
      });
    }

    return res.json({ success: true });
  }),
);

// Leave game session
router.post(
  "/:id/leave",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const user = authenticatedReq.user;
    // Express route pattern /:id guarantees id is present
    const { id } = req.params;

    await storage.leaveGameSession(id!, userId);

    // Create notification for host when someone leaves
    const gameSession = await storage.getGameSessions({ eventId: id! });
    if (gameSession.length > 0 && gameSession[0]?.hostId) {
      await storage.createNotification({
        userId: gameSession[0].hostId,
        type: "event_leave",
        title: "Player Left Game",
        message: `${user?.name || user?.email || "A player"} left your game session`,
        data: JSON.stringify({ gameSessionId: id, playerId: userId }),
      });
    }

    return res.json({ success: true });
  }),
);

// Spectate game session
router.post(
  "/:id/spectate",
  isAuthenticated,
  rateLimiter.standard,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const user = authenticatedReq.user;
    // Express route pattern /:id guarantees id is present
    const { id } = req.params;

    // Authorize spectating
    const authResult = await authorizeSpectate(id!, userId);
    if (!authResult.authorized) {
      return res.status(403).json({
        error: authResult.reason || "Not authorized to spectate this session",
      });
    }

    await storage.spectateGameSession(id!, userId);

    // Create notification for host when someone starts spectating
    const gameSession = await storage.getGameSessions({ eventId: id! });
    if (gameSession.length > 0 && gameSession[0]?.hostId) {
      await storage.createNotification({
        userId: gameSession[0].hostId,
        type: "spectator_join",
        title: "New Spectator",
        message: `${user?.name || user?.email || "Someone"} is now spectating your game`,
        data: JSON.stringify({ gameSessionId: id, spectatorId: userId }),
      });
    }

    return res.json({ success: true });
  }),
);

export default router;
