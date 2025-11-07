/**
 * Game Statistics API Routes
 *
 * This file demonstrates proper Express.js RESTful API patterns
 * following the Shuffle & Sync repository conventions:
 * - RESTful endpoint design with proper HTTP methods
 * - Authentication middleware integration
 * - Input validation using Zod schemas
 * - Consistent error handling and response formats
 * - Proper HTTP status codes
 * - Rate limiting and security middleware
 */

import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAuth } from "../../auth/auth.middleware";
import { ValidationError, NotFoundError } from "../../shared/types";
import { assertRouteParam } from "../../shared/utils";
import { validateRequest } from "../../validation";
import { gameStatsService } from "./game-stats.service";

const router = Router();

// Rate limiter for game stats routes
const gameStatsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // maximum requests per window
  message: "Too many requests for game stats, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const createGameResultSchema = z.object({
  gameType: z.enum([
    "mtg",
    "pokemon",
    "lorcana",
    "yugioh",
    "flesh-and-blood",
    "keyforge",
  ]),
  format: z.string().min(1, "Format is required"),
  result: z.enum(["win", "loss", "draw"]),
  opponentId: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

const updateGameStatsSchema = z.object({
  gameType: z.enum([
    "mtg",
    "pokemon",
    "lorcana",
    "yugioh",
    "flesh-and-blood",
    "keyforge",
  ]),
  favoriteFormat: z.string().optional(),
});

const gameStatsQuerySchema = z.object({
  gameType: z
    .enum([
      "mtg",
      "pokemon",
      "lorcana",
      "yugioh",
      "flesh-and-blood",
      "keyforge",
    ])
    .optional(),
  format: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  resultType: z.enum(["win", "loss", "draw"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "winRate", "totalGames"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * GET /api/game-stats
 * Get user's game statistics with optional filtering
 *
 * Query Parameters:
 * - gameType: Filter by specific TCG type
 * - format: Filter by game format
 * - dateFrom: Filter results from date (ISO string)
 * - dateTo: Filter results to date (ISO string)
 * - page: Page number for pagination
 * - limit: Results per page (max 100)
 * - sortBy: Sort field
 * - sortOrder: Sort direction
 */
router.get("/", gameStatsLimiter, requireAuth, async (req, res, next) => {
  try {
    // Validate query parameters
    const query = gameStatsQuerySchema.parse(req.query);
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;

    // Calculate pagination offset
    const offset = (query.page - 1) * query.limit;

    const result = await gameStatsService.getUserGameStats(userId, {
      ...query,
      offset,
    });

    return res.json({
      success: true,
      data: result,
      message: "Game statistics retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/game-stats
 * Update user's game statistics preferences
 */
router.put(
  "/",
  requireAuth,
  validateRequest(updateGameStatsSchema),
  async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.user.id;
      const updateData = req.body;

      const updatedStats = await gameStatsService.updateGameStatsPreferences(
        userId,
        updateData,
      );

      return res.json({
        success: true,
        data: updatedStats,
        message: "Game statistics preferences updated successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * GET /api/game-stats/aggregate
 * Get aggregate statistics across all game types for the authenticated user
 */
router.get(
  "/aggregate",
  gameStatsLimiter,
  requireAuth,
  async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.user.id;

      const aggregateStats = await gameStatsService.getAggregateStats(userId);

      return res.json({
        success: true,
        data: aggregateStats,
        message: "Aggregate statistics retrieved successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * GET /api/game-stats/leaderboard
 * Get leaderboard data for game statistics
 *
 * Query Parameters:
 * - gameType: Optional filter by specific TCG type
 * - limit: Number of top players to return (default 20, max 100)
 */
router.get("/leaderboard", gameStatsLimiter, async (req, res, next) => {
  try {
    const { gameType, limit = 20 } = req.query;

    const leaderboardQuery = z
      .object({
        gameType: z
          .enum([
            "mtg",
            "pokemon",
            "lorcana",
            "yugioh",
            "flesh-and-blood",
            "keyforge",
          ])
          .optional(),
        limit: z.coerce.number().min(1).max(100).default(20),
      })
      .parse({ gameType, limit });

    const leaderboard = await gameStatsService.getLeaderboard(leaderboardQuery);

    return res.json({
      success: true,
      data: leaderboard,
      message: "Leaderboard retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/game-results
 * Record a new game result
 */
router.post(
  "/game-results",
  requireAuth,
  validateRequest(createGameResultSchema),
  async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.user.id;
      const gameResultData = req.body;

      const newResult = await gameStatsService.createGameResult(
        userId,
        gameResultData,
      );

      return res.status(201).json({
        success: true,
        data: newResult,
        message: "Game result recorded successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * GET /api/game-results
 * Get user's game results with filtering and pagination
 */
router.get(
  "/game-results",
  gameStatsLimiter,
  requireAuth,
  async (req, res, next) => {
    try {
      const query = gameStatsQuerySchema.parse(req.query);
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.user.id;

      const offset = (query.page - 1) * query.limit;

      const results = await gameStatsService.getUserGameResults(userId, {
        ...query,
        offset,
      });

      return res.json({
        success: true,
        data: results,
        message: "Game results retrieved successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
);

/**
 * DELETE /api/game-results/:id
 * Delete a specific game result (only if user owns it)
 */
router.delete("/game-results/:id", requireAuth, async (req, res, next) => {
  try {
    const id = assertRouteParam(req.params.id, "id");
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;

    await gameStatsService.deleteGameResult(id, userId);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

/**
 * Error handling middleware for this router
 */
router.use(
  (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Game Stats API Error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  },
);

export { router as gameStatsRoutes };
