/**
 * Universal Card Routes
 *
 * Game-scoped API endpoints for card operations
 * Endpoints: /api/games/:game_id/cards/*
 */

import { Router } from "express";
import { z } from "zod";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../../logger";
import { universalCardService } from "../../services/card-recognition/index";

const router = Router();

/**
 * GET /api/games - List all supported games
 */
router.get("/", async (req, res) => {
  try {
    const supportedGames = await universalCardService.getSupportedGames();
    return res.json({
      games: supportedGames,
      count: supportedGames.length,
    });
  } catch (error) {
    logger.error("Error fetching supported games", toLoggableError(error));
    return res.status(500).json({ message: "Failed to fetch supported games" });
  }
});

// Validation schemas
const searchCardsSchema = z.object({
  q: z.string().min(1).max(200),
  set: z.string().max(10).optional(),
  format: z
    .enum([
      "standard",
      "modern",
      "commander",
      "legacy",
      "vintage",
      "pioneer",
      "pauper",
    ])
    .optional(),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const getCardByNameSchema = z.object({
  exact: z.string().min(1).max(200).optional(),
  fuzzy: z.string().min(1).max(200).optional(),
  set: z.string().max(10).optional(),
});

const autocompleteSchema = z.object({
  q: z.string().min(2).max(100),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

const randomCardSchema = z.object({
  set: z.string().max(10).optional(),
  format: z
    .enum([
      "standard",
      "modern",
      "commander",
      "legacy",
      "vintage",
      "pioneer",
      "pauper",
    ])
    .optional(),
});

/**
 * GET /api/games/:game_id/cards/search - Search cards in a specific game
 */
router.get("/:game_id/cards/search", async (req, res) => {
  try {
    const { game_id } = req.params;
    const params = searchCardsSchema.parse(req.query);

    logger.info("Game-scoped card search", {
      gameId: game_id,
      query: params.q,
    });

    const result = await universalCardService.searchCards(game_id, params.q, {
      set: params.set,
      format: params.format,
      page: params.page,
      limit: params.limit,
    });

    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid request parameters",
        errors: error.errors,
      });
    }

    if (error instanceof Error && error.message.startsWith("Game not found")) {
      return res.status(404).json({ message: "Game not found" });
    }

    logger.error("Error in game-scoped card search", toLoggableError(error), {
      gameId: req.params.game_id,
    });
    return res.status(500).json({ message: "Failed to search cards" });
  }
});

/**
 * GET /api/games/:game_id/cards/:id - Get card by ID in a specific game
 */
router.get("/:game_id/cards/:id", async (req, res) => {
  try {
    const { game_id, id } = req.params;

    if (!id || id.length < 10) {
      return res.status(400).json({ message: "Invalid card ID" });
    }

    logger.info("Get card by ID in game", { gameId: game_id, cardId: id });

    const card = await universalCardService.getCardById(game_id, id);

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    return res.json(card);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Game not found")) {
      return res.status(404).json({ message: "Game not found" });
    }

    logger.error("Error getting card by ID", toLoggableError(error), {
      gameId: req.params.game_id,
      cardId: req.params.id,
    });
    return res.status(500).json({ message: "Failed to fetch card" });
  }
});

/**
 * GET /api/games/:game_id/cards/named - Get card by exact or fuzzy name
 */
router.get("/:game_id/cards/named", async (req, res) => {
  try {
    const { game_id } = req.params;
    const params = getCardByNameSchema.parse(req.query);

    if (!params.exact && !params.fuzzy) {
      return res.status(400).json({
        message: 'Either "exact" or "fuzzy" parameter is required',
      });
    }

    const cardName = params.exact || params.fuzzy || "";
    logger.info("Get card by name in game", {
      gameId: game_id,
      name: cardName,
    });

    const card = await universalCardService.getCardByName(game_id, cardName, {
      set: params.set,
    });

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    return res.json(card);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid request parameters",
        errors: error.errors,
      });
    }

    if (error instanceof Error && error.message.startsWith("Game not found")) {
      return res.status(404).json({ message: "Game not found" });
    }

    logger.error("Error getting card by name", toLoggableError(error), {
      gameId: req.params.game_id,
    });
    return res.status(500).json({ message: "Failed to fetch card" });
  }
});

/**
 * GET /api/games/:game_id/cards/autocomplete - Autocomplete card names
 */
router.get("/:game_id/cards/autocomplete", async (req, res) => {
  try {
    const { game_id } = req.params;
    const params = autocompleteSchema.parse(req.query);

    logger.info("Autocomplete in game", { gameId: game_id, query: params.q });

    const result = await universalCardService.autocomplete(
      game_id,
      params.q,
      params.limit,
    );

    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid request parameters",
        errors: error.errors,
      });
    }

    if (error instanceof Error && error.message.startsWith("Game not found")) {
      return res.status(404).json({ message: "Game not found" });
    }

    logger.error("Error in autocomplete", toLoggableError(error), {
      gameId: req.params.game_id,
    });
    return res.status(500).json({ message: "Failed to autocomplete" });
  }
});

/**
 * GET /api/games/:game_id/cards/random - Get random card from a specific game
 */
router.get("/:game_id/cards/random", async (req, res) => {
  try {
    const { game_id } = req.params;
    const params = randomCardSchema.parse(req.query);

    logger.info("Get random card in game", { gameId: game_id });

    const card = await universalCardService.getRandomCard(game_id, {
      set: params.set,
      format: params.format,
    });

    return res.json(card);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid request parameters",
        errors: error.errors,
      });
    }

    if (error instanceof Error && error.message.startsWith("Game not found")) {
      return res.status(404).json({ message: "Game not found" });
    }

    logger.error("Error getting random card", toLoggableError(error), {
      gameId: req.params.game_id,
    });
    return res.status(500).json({ message: "Failed to fetch random card" });
  }
});

export { router as universalCardRoutes };
