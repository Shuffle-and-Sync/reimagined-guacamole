/**
 * Real-time Matching Core Service
 * Main orchestrator for real-time matching operations
 */

import { logger } from "../../logger";
import { aiAlgorithmEngine } from "../ai";
import { aiStreamingMatcher } from "../ai-streaming-matcher.service";
import { matchingCache } from "./matching-cache.service";
import { matchingMLScorer } from "./matching-ml-scorer.service";
import { matchingRecommendations } from "./matching-recommendations.service";
import type {
  RealTimeMatchRequest,
  RealTimeMatchResponse,
  EnhancedStreamerMatch,
  MatchingMetadata,
} from "./matching-types";

export class RealTimeMatchingCoreService {
  private static instance: RealTimeMatchingCoreService;

  private constructor() {
    logger.info("Real-time Matching Core Service initialized");
  }

  public static getInstance(): RealTimeMatchingCoreService {
    if (!RealTimeMatchingCoreService.instance) {
      RealTimeMatchingCoreService.instance = new RealTimeMatchingCoreService();
    }
    return RealTimeMatchingCoreService.instance;
  }

  /**
   * Get real-time matches for a user
   */
  async getRealtimeMatches(
    request: RealTimeMatchRequest,
  ): Promise<RealTimeMatchResponse> {
    const startTime = Date.now();
    const requestId = matchingCache.generateCacheKey(request);

    // Check cache first
    const cached = matchingCache.getCached(requestId);
    if (cached) {
      matchingCache.recordMetric({
        timestamp: new Date(),
        operation: "getRealtimeMatches",
        duration: Date.now() - startTime,
        cacheHit: true,
        resultCount: cached.matches.length,
        qualityScore: cached.metadata.qualityScore,
      });
      return cached;
    }

    try {
      // Get initial matches from AI streaming matcher
      const baseMatches = await aiStreamingMatcher.findStreamingPartners({
        userId: request.userId,
        maxResults: request.preferences?.maxResults || 10,
      });

      // Enhance matches with real-time data
      let enhancedMatches: EnhancedStreamerMatch[] = await Promise.all(
        baseMatches.map(async (m: any) => ({
          candidate: m.candidate,
          compatibilityScore: m.compatibilityScore,
          matchStrength: matchingMLScorer.determineMatchStrength(
            m.compatibilityScore,
          ),
          availability: {
            currentlyOnline: false,
            currentlyStreaming: false,
            responseTime: "unknown" as const,
            timezone: "UTC",
            preferredNotificationMethod: ["email"],
          },
          recommendationReason: m.reasons || [],
          collaborationTypes: m.collaborationTypes || [],
          estimatedOutcome: await matchingMLScorer.estimateOutcome(
            m as any,
            request,
          ),
          urgencyScore: 0.5,
          mlConfidence: 0.8,
        })),
      );

      // Apply ML scoring
      enhancedMatches = await matchingMLScorer.applyMLScoring(
        enhancedMatches,
        request,
      );

      // Calculate urgency scores
      enhancedMatches = enhancedMatches.map((m) => ({
        ...m,
        urgencyScore: matchingMLScorer.calculateUrgencyScore(m, request),
      }));

      // Filter by preferences
      if (request.preferences?.minCompatibilityScore) {
        const minScore = request.preferences.minCompatibilityScore;
        enhancedMatches = enhancedMatches.filter(
          (m) => m.compatibilityScore >= minScore,
        );
      }

      // Sort by relevance (compatibility * urgency * ml confidence)
      enhancedMatches.sort((a, b) => {
        const scoreA = a.compatibilityScore * a.urgencyScore * a.mlConfidence;
        const scoreB = b.compatibilityScore * b.urgencyScore * b.mlConfidence;
        return scoreB - scoreA;
      });

      // Limit results
      const maxResults = request.preferences?.maxResults || 10;
      enhancedMatches = enhancedMatches.slice(0, maxResults);

      // Generate recommendations
      const recommendations =
        await matchingRecommendations.generateRecommendations(
          enhancedMatches,
          request,
        );

      // Build metadata
      const processingTime = Date.now() - startTime;
      const metadata: MatchingMetadata = {
        totalCandidatesAnalyzed: baseMatches.length,
        processingTime,
        algorithmVersion: "2.0",
        cacheHitRate: matchingCache.calculateCacheHitRate(),
        qualityScore:
          matchingRecommendations.calculateQualityScore(enhancedMatches),
        diversityScore:
          matchingRecommendations.calculateDiversityScore(enhancedMatches),
      };

      const response: RealTimeMatchResponse = {
        requestId,
        timestamp: new Date(),
        matches: enhancedMatches,
        metadata,
        recommendations,
        updateFrequency: 60000, // 1 minute
      };

      // Cache the response
      matchingCache.cacheResponse(requestId, response);

      // Record metrics
      matchingCache.recordMetric({
        timestamp: new Date(),
        operation: "getRealtimeMatches",
        duration: processingTime,
        cacheHit: false,
        resultCount: enhancedMatches.length,
        qualityScore: metadata.qualityScore,
      });

      return response;
    } catch (error) {
      logger.error(
        "Error getting realtime matches",
        error instanceof Error ? error : new Error(String(error)),
        { userId: request.userId },
      );
      throw error;
    }
  }

  /**
   * Record collaboration outcome for ML learning
   */
  async recordCollaborationOutcome(
    matchId: string,
    outcome: {
      success: boolean;
      viewerBoost: number;
      audienceGrowth: number;
      engagementIncrease: number;
    },
  ): Promise<void> {
    const successScore =
      outcome.success && outcome.viewerBoost > 0 && outcome.audienceGrowth > 0
        ? 0.8
        : 0.3;

    matchingMLScorer.recordOutcome(
      {
        expectedViewerBoost: 0,
        audienceGrowthPotential: 0,
        engagementIncrease: 0,
        successProbability: 0.5,
        estimatedDuration: 120,
        contentSynergyScore: 50,
      },
      successScore,
    );

    logger.info("Collaboration outcome recorded", { matchId, outcome });
  }

  /**
   * Get trending opportunities
   */
  async getTrendingOpportunities(
    userId: string,
  ): Promise<
    RealTimeMatchResponse["recommendations"]["trendingOpportunities"]
  > {
    const request: RealTimeMatchRequest = { userId };
    const recommendations =
      await matchingRecommendations.generateRecommendations([], request);
    return recommendations.trendingOpportunities;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return matchingCache.getPerformanceStats();
  }
}

export const realTimeMatchingCore = RealTimeMatchingCoreService.getInstance();
