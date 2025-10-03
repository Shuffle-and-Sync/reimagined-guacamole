/**
 * Game CRUD Routes
 * 
 * API endpoints for creating and managing games in the Universal Deck-Building framework
 */

import { Router } from 'express';
import { z } from 'zod';
import { gameService } from '../../services/games/game.service';
import { isAuthenticated, getAuthUserId, type AuthenticatedRequest } from '../../auth';
import { logger } from '../../logger';

const router = Router();

// Validation schemas
const createGameSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Game name must be lowercase alphanumeric with hyphens'),
  displayName: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  isOfficial: z.boolean().optional(),
  version: z.string().optional(),
  playerCount: z.object({
    min: z.number().int().min(1),
    max: z.number().int().min(1),
  }).optional(),
  avgGameDuration: z.number().int().min(1).optional(),
  complexity: z.number().int().min(1).max(5).optional(),
  ageRating: z.string().max(10).optional(),
  cardTypes: z.array(z.string()).optional(),
  resourceTypes: z.array(z.any()).optional(),
  zones: z.array(z.string()).optional(),
  phaseStructure: z.array(z.string()).optional(),
  deckRules: z.object({
    minDeckSize: z.number().int().min(1).optional(),
    maxDeckSize: z.number().int().min(1).nullable().optional(),
    maxCopies: z.number().int().min(1).optional(),
    allowedSets: z.array(z.string()).nullable().optional(),
  }).optional(),
  theme: z.object({
    primaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    cardBackUrl: z.string().nullable().optional(),
  }).optional(),
  externalSource: z.string().optional(),
});

const updateGameSchema = createGameSchema.partial().omit({ name: true });

/**
 * POST /api/games - Create new game
 */
router.post('/', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const validatedData = createGameSchema.parse(req.body);

    // Add userId as creatorId
    const gameData = {
      ...validatedData,
      creatorId: userId,
    };

    const game = await gameService.createGame(userId, gameData);
    return res.status(201).json(game);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid request data',
        errors: error.errors,
      });
    }

    logger.error('Failed to create game', error, { userId: getAuthUserId(authenticatedReq) });
    return res.status(500).json({ message: 'Failed to create game' });
  }
});

/**
 * GET /api/games - List all games
 */
router.get('/', async (req, res) => {
  try {
    const { published, official, creator } = req.query;

    const filters: any = {};
    if (published !== undefined) filters.isPublished = published === 'true';
    if (official !== undefined) filters.isOfficial = official === 'true';
    if (creator) filters.creatorId = creator as string;

    const games = await gameService.getAllGames(filters);
    return res.json(games);
  } catch (error) {
    logger.error('Failed to fetch games', error);
    return res.status(500).json({ message: 'Failed to fetch games' });
  }
});

/**
 * GET /api/games/:id - Get game details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const game = await gameService.getGameById(id);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    return res.json(game);
  } catch (error) {
    logger.error('Failed to fetch game', error, { gameId: req.params.id });
    return res.status(500).json({ message: 'Failed to fetch game' });
  }
});

/**
 * PUT /api/games/:id - Update game
 */
router.put('/:id', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Game ID is required' });
    }
    
    const updates = updateGameSchema.parse(req.body);

    const game = await gameService.updateGame(id, userId, updates);
    return res.json(game);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid request data',
        errors: error.errors,
      });
    }

    if (error instanceof Error) {
      if (error.message === 'Game not found') {
        return res.status(404).json({ message: 'Game not found' });
      }
      if (error.message === 'Not authorized to update this game') {
        return res.status(403).json({ message: 'Not authorized to update this game' });
      }
    }

    logger.error('Failed to update game', error, { gameId: req.params.id, userId: getAuthUserId(authenticatedReq) });
    return res.status(500).json({ message: 'Failed to update game' });
  }
});

/**
 * DELETE /api/games/:id - Delete game
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Game ID is required' });
    }

    await gameService.deleteGame(id, userId);
    return res.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Game not found') {
        return res.status(404).json({ message: 'Game not found' });
      }
      if (error.message === 'Not authorized to delete this game') {
        return res.status(403).json({ message: 'Not authorized to delete this game' });
      }
    }

    logger.error('Failed to delete game', error, { gameId: req.params.id, userId: getAuthUserId(authenticatedReq) });
    return res.status(500).json({ message: 'Failed to delete game' });
  }
});

/**
 * POST /api/games/:id/publish - Publish game
 */
router.post('/:id/publish', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Game ID is required' });
    }

    const game = await gameService.publishGame(id, userId);
    return res.json(game);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Game not found') {
        return res.status(404).json({ message: 'Game not found' });
      }
      if (error.message === 'Not authorized to publish this game') {
        return res.status(403).json({ message: 'Not authorized to publish this game' });
      }
    }

    logger.error('Failed to publish game', error, { gameId: req.params.id, userId: getAuthUserId(authenticatedReq) });
    return res.status(500).json({ message: 'Failed to publish game' });
  }
});

/**
 * GET /api/games/:id/stats - Get game statistics
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await gameService.getGameStats(id);

    return res.json(stats);
  } catch (error) {
    if (error instanceof Error && error.message === 'Game not found') {
      return res.status(404).json({ message: 'Game not found' });
    }

    logger.error('Failed to fetch game stats', error, { gameId: req.params.id });
    return res.status(500).json({ message: 'Failed to fetch game stats' });
  }
});

export { router as gamesCrudRoutes };
