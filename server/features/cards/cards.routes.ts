/**
 * Card Recognition Routes (Legacy - Deprecated)
 *
 * API endpoints for Magic: The Gathering card recognition and lookup
 *
 * DEPRECATED: These endpoints are maintained for backward compatibility.
 * New integrations should use /api/games/:game_id/cards/* endpoints instead.
 */

import { Router } from "express";
import { z } from "zod";
import { logger } from "../../logger";
import { universalCardService } from "../../services/card-recognition/index";
import { cardRecognitionService } from "../../services/card-recognition.service";

const router = Router();

// Default game ID for backward compatibility (MTG Official)
const DEFAULT_GAME_ID = "mtg-official";

/**
 * Add deprecation warning to response
 */
function addDeprecationWarning(data: unknown) {
  return {
    ...data,
    _deprecated: {
      message:
        "This endpoint is deprecated. Please use /api/games/:game_id/cards/* endpoints instead.",
      migrationGuide: "https://docs.shuffleandsync.org/api/migration-guide",
      newEndpoint: `/api/games/${DEFAULT_GAME_ID}/cards/`,
    },
  };
}

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
 * Search for cards
 * GET /api/cards/search?q=lightning+bolt&set=lea&format=modern&page=1&limit=20
 *
 * DEPRECATED: Use /api/games/:game_id/cards/search instead
 */
router.get("/search", async (req, res) => {
  try {
    const params = searchCardsSchema.parse(req.query);

    logger.info("Legacy card search request (deprecated)", {
      query: params.q,
      set: params.set,
      format: params.format,
    });

    // Internally redirect to MTG game using Universal Card Service
    const result = await universalCardService.searchCards(
      DEFAULT_GAME_ID,
      params.q,
      {
        set: params.set,
        format: params.format,
        page: params.page,
        limit: params.limit,
      },
    );

    return res.json(addDeprecationWarning(result));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid request parameters",
        errors: error.errors,
      });
    }

    logger.error("Error searching cards", error);
    return res.status(500).json({ message: "Failed to search cards" });
  }
});

/**
 * Get card by ID
 * GET /api/cards/:id
 *
 * DEPRECATED: Use /api/games/:game_id/cards/:id instead
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length < 10) {
      return res.status(400).json({ message: "Invalid card ID" });
    }

    logger.info("Legacy get card by ID request (deprecated)", { id });

    // Internally redirect to MTG game using Universal Card Service
    const card = await universalCardService.getCardById(DEFAULT_GAME_ID, id);

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    return res.json(addDeprecationWarning(card));
  } catch (error) {
    logger.error("Error fetching card by ID", error, { id: req.params.id });
    return res.status(500).json({ message: "Failed to fetch card" });
  }
});

/**
 * Get card by exact or fuzzy name
 * GET /api/cards/named?exact=Lightning+Bolt
 * GET /api/cards/named?fuzzy=bolt&set=lea
 *
 * DEPRECATED: Use /api/games/:game_id/cards/named instead
 */
router.get("/named", async (req, res) => {
  try {
    const params = getCardByNameSchema.parse(req.query);

    if (!params.exact && !params.fuzzy) {
      return res.status(400).json({
        message: 'Either "exact" or "fuzzy" parameter is required',
      });
    }

    const cardName = params.exact || params.fuzzy || "";
    logger.info("Legacy get card by name request (deprecated)", {
      name: cardName,
      set: params.set,
    });

    // Internally redirect to MTG game using Universal Card Service
    const card = await universalCardService.getCardByName(
      DEFAULT_GAME_ID,
      cardName,
      {
        set: params.set,
      },
    );

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    return res.json(addDeprecationWarning(card));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid request parameters",
        errors: error.errors,
      });
    }

    logger.error("Error fetching card by name", error);
    return res.status(500).json({ message: "Failed to fetch card" });
  }
});

/**
 * Autocomplete card names
 * GET /api/cards/autocomplete?q=light&limit=10
 *
 * DEPRECATED: Use /api/games/:game_id/cards/autocomplete instead
 */
router.get("/autocomplete", async (req, res) => {
  try {
    const params = autocompleteSchema.parse(req.query);

    logger.info("Legacy autocomplete request (deprecated)", {
      query: params.q,
    });

    // Internally redirect to MTG game using Universal Card Service
    const result = await universalCardService.autocomplete(
      DEFAULT_GAME_ID,
      params.q,
      params.limit,
    );

    return res.json(addDeprecationWarning(result));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid request parameters",
        errors: error.errors,
      });
    }

    logger.error("Error autocompleting card names", error);
    return res.status(500).json({ message: "Failed to autocomplete" });
  }
});

/**
 * Get random card
 * GET /api/cards/random?set=lea&format=modern
 *
 * DEPRECATED: Use /api/games/:game_id/cards/random instead
 */
router.get("/random", async (req, res) => {
  try {
    const params = randomCardSchema.parse(req.query);

    logger.info("Legacy random card request (deprecated)", {
      set: params.set,
      format: params.format,
    });

    // Internally redirect to MTG game using Universal Card Service
    const card = await universalCardService.getRandomCard(DEFAULT_GAME_ID, {
      set: params.set,
      format: params.format,
    });

    return res.json(addDeprecationWarning(card));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid request parameters",
        errors: error.errors,
      });
    }

    logger.error("Error fetching random card", error);
    return res.status(500).json({ message: "Failed to fetch random card" });
  }
});

/**
 * Get cache statistics (for monitoring/debugging)
 * GET /api/cards/cache/stats
 *
 * NOTE: This endpoint is not deprecated as it's for internal monitoring
 */
router.get("/cache/stats", async (req, res) => {
  try {
    const stats = cardRecognitionService.getCacheStats();
    res.json(stats);
  } catch (error) {
    logger.error("Error fetching cache stats", error);
    res.status(500).json({ message: "Failed to fetch cache stats" });
  }
});

export { router as cardRecognitionRoutes };
