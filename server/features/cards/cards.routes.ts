/**
 * Card Recognition Routes
 * 
 * API endpoints for Magic: The Gathering card recognition and lookup
 */

import { Router } from 'express';
import { z } from 'zod';
import { cardRecognitionService } from '../../services/card-recognition';
import { logger } from '../../logger';

const router = Router();

// Validation schemas
const searchCardsSchema = z.object({
  q: z.string().min(1).max(200),
  set: z.string().max(10).optional(),
  format: z.enum(['standard', 'modern', 'commander', 'legacy', 'vintage', 'pioneer', 'pauper']).optional(),
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
  format: z.enum(['standard', 'modern', 'commander', 'legacy', 'vintage', 'pioneer', 'pauper']).optional(),
});

/**
 * Search for cards
 * GET /api/cards/search?q=lightning+bolt&set=lea&format=modern&page=1&limit=20
 */
router.get('/search', async (req, res) => {
  try {
    const params = searchCardsSchema.parse(req.query);
    
    logger.info('Card search request', { query: params.q, set: params.set, format: params.format });
    
    const result = await cardRecognitionService.searchCards(params.q, {
      set: params.set,
      format: params.format,
      page: params.page,
      limit: params.limit,
    });
    
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid request parameters',
        errors: error.errors 
      });
    }
    
    logger.error('Error searching cards', error);
    return res.status(500).json({ message: 'Failed to search cards' });
  }
});

/**
 * Get card by ID
 * GET /api/cards/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.length < 10) {
      return res.status(400).json({ message: 'Invalid card ID' });
    }
    
    logger.info('Get card by ID request', { id });
    
    const card = await cardRecognitionService.getCardById(id);
    
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    return res.json(card);
  } catch (error) {
    logger.error('Error fetching card by ID', error, { id: req.params.id });
    return res.status(500).json({ message: 'Failed to fetch card' });
  }
});

/**
 * Get card by exact or fuzzy name
 * GET /api/cards/named?exact=Lightning+Bolt
 * GET /api/cards/named?fuzzy=bolt&set=lea
 */
router.get('/named', async (req, res) => {
  try {
    const params = getCardByNameSchema.parse(req.query);
    
    if (!params.exact && !params.fuzzy) {
      return res.status(400).json({ 
        message: 'Either "exact" or "fuzzy" parameter is required' 
      });
    }
    
    const cardName = params.exact || params.fuzzy || '';
    logger.info('Get card by name request', { name: cardName, set: params.set });
    
    const card = await cardRecognitionService.getCardByName(cardName, {
      set: params.set,
    });
    
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    return res.json(card);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid request parameters',
        errors: error.errors 
      });
    }
    
    logger.error('Error fetching card by name', error);
    return res.status(500).json({ message: 'Failed to fetch card' });
  }
});

/**
 * Autocomplete card names
 * GET /api/cards/autocomplete?q=light&limit=10
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const params = autocompleteSchema.parse(req.query);
    
    logger.info('Autocomplete request', { query: params.q });
    
    const result = await cardRecognitionService.autocomplete(params.q, params.limit);
    
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid request parameters',
        errors: error.errors 
      });
    }
    
    logger.error('Error autocompleting card names', error);
    return res.status(500).json({ message: 'Failed to autocomplete' });
  }
});

/**
 * Get random card
 * GET /api/cards/random?set=lea&format=modern
 */
router.get('/random', async (req, res) => {
  try {
    const params = randomCardSchema.parse(req.query);
    
    logger.info('Random card request', { set: params.set, format: params.format });
    
    const card = await cardRecognitionService.getRandomCard({
      set: params.set,
      format: params.format,
    });
    
    return res.json(card);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid request parameters',
        errors: error.errors 
      });
    }
    
    logger.error('Error fetching random card', error);
    return res.status(500).json({ message: 'Failed to fetch random card' });
  }
});

/**
 * Get cache statistics (for monitoring/debugging)
 * GET /api/cards/cache/stats
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = cardRecognitionService.getCacheStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching cache stats', error);
    res.status(500).json({ message: 'Failed to fetch cache stats' });
  }
});

export { router as cardRecognitionRoutes };
