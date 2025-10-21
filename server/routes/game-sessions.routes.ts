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

import { storage } from "../storage";
import { validateRequest, validateGameSessionSchema } from "../validation";
import {
  errors,
  errorHandlingMiddleware,
} from "../middleware/error-handling.middleware";

const { asyncHandler } = errorHandlingMiddleware;
const { NotFoundError } = errors;

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
    const { id } = req.params;
    const gameSession = await storage.getGameSessionById(id);

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
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const user = authenticatedReq.user;
    const { id } = req.params;

    await storage.joinGameSession(id, userId);

    // Create notification for host when someone joins
    const gameSession = await storage.getGameSessions({ eventId: id });
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
    const { id } = req.params;

    await storage.leaveGameSession(id, userId);

    // Create notification for host when someone leaves
    const gameSession = await storage.getGameSessions({ eventId: id });
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
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const user = authenticatedReq.user;
    const { id } = req.params;

    await storage.spectateGameSession(id, userId);

    // Create notification for host when someone starts spectating
    const gameSession = await storage.getGameSessions({ eventId: id });
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
