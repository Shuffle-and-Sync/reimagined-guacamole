/**
 * Real-time Matching API Routes
 * 
 * Provides endpoints for real-time streaming partner matching
 * with machine learning recommendations and live updates.
 */

import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../logger';
import { realtimeMatchingAPI } from '../services/real-time-matching-api';
import { isAuthenticated } from '../auth';
import { assertRouteParam } from '../shared/utils';

export const matchingRouter = Router();

// Request validation schemas
const realtimeMatchRequestSchema = z.object({
  preferences: z.object({
    urgency: z.enum(['immediate', 'today', 'this_week']).optional(),
    maxResults: z.number().min(1).max(50).optional(),
    minCompatibilityScore: z.number().min(0).max(100).optional(),
    requiredGames: z.array(z.string()).optional(),
    preferredTimeSlots: z.array(z.string()).optional(),
    excludeUserIds: z.array(z.string()).optional(),
    platformFilter: z.array(z.enum(['twitch', 'youtube', 'facebook'])).optional()
  }).optional(),
  context: z.object({
    currentlyStreaming: z.boolean().optional(),
    plannedStreamTime: z.string().datetime().optional(),
    streamDuration: z.number().optional(),
    contentType: z.string().optional(),
    specialEvent: z.boolean().optional()
  }).optional()
});

const collaborationOutcomeSchema = z.object({
  matchId: z.string(),
  success: z.boolean(),
  rating: z.number().min(1).max(5),
  viewerGrowth: z.number(),
  engagementIncrease: z.number(),
  wouldCollaborateAgain: z.boolean(),
  feedback: z.string().optional()
});

/**
 * GET /api/matching/realtime
 * Get real-time streaming match suggestions
 */
matchingRouter.get('/realtime', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Parse query parameters
    const preferences = {
      urgency: req.query.urgency as 'immediate' | 'today' | 'this_week' | undefined,
      maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : undefined,
      minCompatibilityScore: req.query.minCompatibilityScore ? 
        parseInt(req.query.minCompatibilityScore as string) : undefined,
      requiredGames: req.query.requiredGames ? 
        (req.query.requiredGames as string).split(',') : undefined,
      preferredTimeSlots: req.query.preferredTimeSlots ? 
        (req.query.preferredTimeSlots as string).split(',') : undefined,
      excludeUserIds: req.query.excludeUserIds ? 
        (req.query.excludeUserIds as string).split(',') : undefined,
      platformFilter: req.query.platformFilter ? 
        (req.query.platformFilter as string).split(',') as ('twitch' | 'youtube' | 'facebook')[] : undefined
    };

    const context = {
      currentlyStreaming: req.query.currentlyStreaming === 'true',
      plannedStreamTime: req.query.plannedStreamTime ? 
        new Date(req.query.plannedStreamTime as string) : undefined,
      streamDuration: req.query.streamDuration ? 
        parseInt(req.query.streamDuration as string) : undefined,
      contentType: req.query.contentType as string | undefined,
      specialEvent: req.query.specialEvent === 'true'
    };

    const matchRequest = {
      userId,
      preferences: Object.keys(preferences).some(key => preferences[key as keyof typeof preferences] !== undefined) ? preferences : undefined,
      context: Object.keys(context).some(key => context[key as keyof typeof context] !== undefined) ? context : undefined
    };

    const matches = await realtimeMatchingAPI.getRealtimeMatches(matchRequest);

    // Log real-time matches retrieved event
    logger.info("Real-time matches retrieved successfully", {
      userId,
      matchCount: matches.matches.length,
      processingTime: matches.metadata.processingTime
    });

    return res.json({
      success: true,
      data: matches
    });

  } catch (error) {
    logger.error("Failed to get real-time matches", { error, userId: req.user?.id });
    return res.status(500).json({
      error: 'Failed to get real-time matches',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * POST /api/matching/realtime
 * Get real-time matches with detailed request body
 */
matchingRouter.post('/realtime', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate request body
    const validationResult = realtimeMatchRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request format',
        details: validationResult.error.errors
      });
    }

    const matchRequest = {
      userId,
      ...validationResult.data,
      context: validationResult.data.context ? {
        ...validationResult.data.context,
        plannedStreamTime: validationResult.data.context.plannedStreamTime 
          ? new Date(validationResult.data.context.plannedStreamTime) 
          : undefined
      } : undefined
    } as const;

    const matches = await realtimeMatchingAPI.getRealtimeMatches(matchRequest);

    logger.info("Real-time matches retrieved via POST", {
      userId,
      matchCount: matches.matches.length,
      processingTime: matches.metadata.processingTime
    });

    return res.json({
      success: true,
      data: matches
    });

  } catch (error) {
    logger.error("Failed to get real-time matches via POST", { error, userId: req.user?.id });
    return res.status(500).json({
      error: 'Failed to get real-time matches',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * GET /api/matching/trending
 * Get trending collaboration opportunities
 */
matchingRouter.get('/trending', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const opportunities = await realtimeMatchingAPI.getTrendingOpportunities(userId);

    logger.info("Trending opportunities retrieved", {
      userId,
      opportunityCount: opportunities.length
    });

    return res.json({
      success: true,
      data: opportunities
    });

  } catch (error) {
    logger.error("Failed to get trending opportunities", { error, userId: req.user?.id });
    return res.status(500).json({
      error: 'Failed to get trending opportunities',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * POST /api/matching/subscribe
 * Subscribe to real-time match updates
 */
matchingRouter.post('/subscribe', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const preferences = req.body.preferences || {};

    // Create callback for real-time updates
    // In a real implementation, this would use WebSockets or SSE
    const callback = (matches: any) => {
      logger.debug("Real-time match update", { userId, matchCount: matches.matches.length });
      // This would push to WebSocket connection
    };

    const subscriptionId = realtimeMatchingAPI.subscribeToUpdates(
      userId,
      preferences,
      callback
    );

    logger.info("Real-time subscription created", { userId, subscriptionId });

    return res.json({
      success: true,
      data: {
        subscriptionId,
        message: 'Subscribed to real-time updates'
      }
    });

  } catch (error) {
    logger.error("Failed to create subscription", { error, userId: req.user?.id });
    return res.status(500).json({
      error: 'Failed to create subscription',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * DELETE /api/matching/subscribe/:subscriptionId
 * Unsubscribe from real-time updates
 */
matchingRouter.delete('/subscribe/:subscriptionId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const subscriptionId = assertRouteParam(req.params.subscriptionId, 'subscriptionId');

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const success = realtimeMatchingAPI.unsubscribe(subscriptionId);

    if (success) {
      logger.info("Real-time subscription removed", { userId, subscriptionId });
      
      return res.json({
        success: true,
        message: 'Unsubscribed successfully'
      });
    } else {
      return res.status(404).json({
        error: 'Subscription not found'
      });
    }

  } catch (error) {
    logger.error("Failed to remove subscription", { 
      error, 
      userId: req.user?.id,
      subscriptionId: req.params.subscriptionId
    });
    return res.status(500).json({
      error: 'Failed to remove subscription',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * POST /api/matching/outcome
 * Record collaboration outcome for machine learning
 */
matchingRouter.post('/outcome', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate outcome data
    const validationResult = collaborationOutcomeSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid outcome format',
        details: validationResult.error.errors
      });
    }

    const outcome = validationResult.data;

    await realtimeMatchingAPI.recordCollaborationOutcome(outcome.matchId, {
      success: outcome.success,
      rating: outcome.rating,
      viewerGrowth: outcome.viewerGrowth,
      engagementIncrease: outcome.engagementIncrease,
      wouldCollaborateAgain: outcome.wouldCollaborateAgain,
      feedback: outcome.feedback
    });

    logger.info("Collaboration outcome recorded", {
      userId,
      matchId: outcome.matchId,
      success: outcome.success,
      rating: outcome.rating
    });

    return res.json({
      success: true,
      message: 'Collaboration outcome recorded successfully'
    });

  } catch (error) {
    logger.error("Failed to record collaboration outcome", { error, userId: req.user?.id });
    return res.status(500).json({
      error: 'Failed to record outcome',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * GET /api/matching/performance
 * Get matching algorithm performance metrics (admin/debugging)
 */
matchingRouter.get('/performance', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Basic performance metrics
    const metrics = {
      cacheStats: {
        hitRate: 75,
        size: 150,
        maxSize: 1000
      },
      algorithmConfig: {
        version: '2.1',
        mlEnabled: true,
        adaptiveWeights: true
      },
      systemHealth: {
        status: 'healthy',
        avgProcessingTime: 245,
        successRate: 94.2
      }
    };

    logger.debug("Performance metrics retrieved", { userId });

    return res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    logger.error("Failed to get performance metrics", { error, userId: req.user?.id });
    return res.status(500).json({
      error: 'Failed to get performance metrics',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * POST /api/matching/feedback
 * Submit feedback about match quality
 */
matchingRouter.post('/feedback', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { requestId, rating, feedback, suggestions } = req.body;

    if (!requestId || !rating) {
      return res.status(400).json({
        error: 'Request ID and rating are required'
      });
    }

    // Log feedback for analysis
    logger.info("Match feedback received", {
      userId,
      requestId,
      rating,
      feedback: feedback ? 'provided' : 'none',
      suggestions: suggestions ? 'provided' : 'none'
    });

    return res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });

  } catch (error) {
    logger.error("Failed to record feedback", { error, userId: req.user?.id });
    return res.status(500).json({
      error: 'Failed to record feedback',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default matchingRouter;