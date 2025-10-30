/**
 * Game Adapter Routes
 * Handles game adapter operations for different TCG games
 */

import { Router } from "express";
import rateLimit from "express-rate-limit";
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
  createGameAdapter,
  getAvailableGames,
  isGameSupported,
} from "../services/games/adapters";
import {
  getAllMTGFormats,
  getAllPokemonFormats,
} from "../services/games/adapters/formats";

const { asyncHandler } = errorHandlingMiddleware;
const { NotFoundError, BadRequestError } = errors;

const router = Router();

// Rate limiter for session creation (e.g., max 10 requests per user per 15 minutes)
const createSessionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP or user to 10 session creates per windowMs
  message: { error: "Too many game sessions created, please try again later." },
  standardHeaders: true, // Return rate limit info in the headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Game state storage
// WARNING: In-memory storage - all game sessions will be lost on server restart
// TODO: Implement database persistence for production use (e.g., Redis, PostgreSQL)
// This is suitable for development/testing only
const gameStates = new Map<
  string,
  { gameId: string; state: unknown; lastUpdate: Date }
>();

// Get available games
router.get(
  "/games",
  asyncHandler(async (req, res) => {
    const games = getAvailableGames();
    return res.json({
      games,
      count: games.length,
    });
  }),
);

// Check if game is supported
router.get(
  "/games/:gameId/supported",
  asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    const supported = isGameSupported(gameId);
    return res.json({
      gameId,
      supported,
    });
  }),
);

// Get game phases
router.get(
  "/games/:gameId/phases",
  asyncHandler(async (req, res) => {
    const { gameId } = req.params;

    if (!isGameSupported(gameId)) {
      throw new NotFoundError(`Game '${gameId}'`);
    }

    const adapter = createGameAdapter(gameId);
    const phases = adapter.getGamePhases();

    return res.json({
      gameId,
      phases,
    });
  }),
);

// Get available formats for a game
router.get(
  "/games/:gameId/formats",
  asyncHandler(async (req, res) => {
    const { gameId } = req.params;

    let formats;
    switch (gameId.toLowerCase()) {
      case "mtg":
        formats = getAllMTGFormats();
        break;
      case "pokemon":
        formats = getAllPokemonFormats();
        break;
      default:
        formats = [];
    }

    return res.json({
      gameId,
      formats,
      count: formats.length,
    });
  }),
);

// Create new game session
router.post(
  "/games/:gameId/sessions",
  createSessionRateLimiter,
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getAuthUserId(authenticatedReq);
    const { gameId } = req.params;
    const { config } = req.body;

    if (!isGameSupported(gameId)) {
      throw new NotFoundError(`Game '${gameId}'`);
    }

    const adapter = createGameAdapter(gameId);
    const state = adapter.createInitialState(config || { playerCount: 2 });

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    gameStates.set(sessionId, {
      gameId,
      state,
      lastUpdate: new Date(),
    });

    return res.status(201).json({
      sessionId,
      gameId,
      createdBy: userId,
      createdAt: new Date(),
    });
  }),
);

// Get game session state
router.get(
  "/sessions/:sessionId",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { playerId } = req.query;

    const session = gameStates.get(sessionId);
    if (!session) {
      throw new NotFoundError("Game session");
    }

    const adapter = createGameAdapter(session.gameId);
    const renderedState = adapter.renderState(
      session.state,
      playerId as string,
    );

    return res.json({
      sessionId,
      gameId: session.gameId,
      state: renderedState,
      lastUpdate: session.lastUpdate,
    });
  }),
);

// Get available actions for player
router.get(
  "/sessions/:sessionId/actions/:playerId",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { sessionId, playerId } = req.params;

    const session = gameStates.get(sessionId);
    if (!session) {
      throw new NotFoundError("Game session");
    }

    const adapter = createGameAdapter(session.gameId);
    const actions = adapter.getPlayerActions(session.state, playerId);

    return res.json({
      sessionId,
      playerId,
      actions,
      count: actions.length,
    });
  }),
);

// Apply action to game state
router.post(
  "/sessions/:sessionId/actions",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { action } = req.body;

    if (!action || !action.playerId) {
      throw new BadRequestError("Action and playerId are required");
    }

    const session = gameStates.get(sessionId);
    if (!session) {
      throw new NotFoundError("Game session");
    }

    const adapter = createGameAdapter(session.gameId);

    // Validate action
    if (!adapter.validateAction(session.state, action)) {
      throw new BadRequestError("Invalid action for current game state");
    }

    // Apply action
    const newState = adapter.applyAction(session.state, action);

    // Update session
    gameStates.set(sessionId, {
      ...session,
      state: newState,
      lastUpdate: new Date(),
    });

    // Check for win condition
    const winResult = adapter.checkWinCondition(newState);

    // Get rendered state
    const renderedState = adapter.renderState(newState, action.playerId);

    return res.json({
      sessionId,
      state: renderedState,
      winResult,
      lastUpdate: new Date(),
    });
  }),
);

// Validate game state
router.post(
  "/games/:gameId/validate",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    const { state } = req.body;

    if (!isGameSupported(gameId)) {
      throw new NotFoundError(`Game '${gameId}'`);
    }

    const adapter = createGameAdapter(gameId);
    const validation = adapter.validateState(state);

    return res.json({
      gameId,
      validation,
    });
  }),
);

// Get state diff between two states
router.post(
  "/games/:gameId/diff",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    const { oldState, newState } = req.body;

    if (!oldState || !newState) {
      throw new BadRequestError("Both oldState and newState are required");
    }

    if (!isGameSupported(gameId)) {
      throw new NotFoundError(`Game '${gameId}'`);
    }

    const adapter = createGameAdapter(gameId);
    const diffs = adapter.getStateDiff(oldState, newState);

    return res.json({
      gameId,
      diffs,
      count: diffs.length,
    });
  }),
);

export default router;
