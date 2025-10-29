/**
 * Matching Recommendations Service
 * Generates smart recommendations and actionable insights
 */

import { logger } from "../../logger";
import type {
  EnhancedStreamerMatch,
  SmartRecommendations,
  QuickAction,
  StrategicSuggestion,
  TrendingOpportunity,
  LearningInsight,
  RealTimeMatchRequest,
} from "./matching-types";

export class MatchingRecommendationsService {
  private static instance: MatchingRecommendationsService;

  private constructor() {
    logger.debug("Matching Recommendations Service initialized");
  }

  public static getInstance(): MatchingRecommendationsService {
    if (!MatchingRecommendationsService.instance) {
      MatchingRecommendationsService.instance =
        new MatchingRecommendationsService();
    }
    return MatchingRecommendationsService.instance;
  }

  /**
   * Generate smart recommendations
   */
  async generateRecommendations(
    matches: EnhancedStreamerMatch[],
    request: RealTimeMatchRequest,
  ): Promise<SmartRecommendations> {
    return {
      quickActions: this.generateQuickActions(matches, request),
      strategicSuggestions: this.generateStrategicSuggestions(matches),
      trendingOpportunities: await this.getTrendingOpportunities(request),
      learningInsights: this.generateLearningInsights(matches),
    };
  }

  /**
   * Generate quick action recommendations
   */
  private generateQuickActions(
    matches: EnhancedStreamerMatch[],
    request: RealTimeMatchRequest,
  ): QuickAction[] {
    const actions: QuickAction[] = [];

    // Top match - send request
    const topMatch = matches[0];
    if (topMatch) {
      actions.push({
        type: "send_request",
        label: "Send Collaboration Request",
        description: `Reach out to ${topMatch.candidate} for immediate collaboration`,
        targetUserId: String(topMatch.candidate),
        priority: "high",
      });
    }

    // Matches with immediate availability
    const onlineMatches = matches.filter(
      (m) => m.availability?.currentlyOnline,
    );
    if (onlineMatches.length > 0 && onlineMatches[0]?.candidate) {
      actions.push({
        type: "message_directly",
        label: "Message Online Streamer",
        description: `${onlineMatches.length} match(es) currently online`,
        targetUserId: String(onlineMatches[0]?.candidate),
        priority: "high",
      });
    }

    // Schedule for later
    if (request.context?.plannedStreamTime && topMatch) {
      actions.push({
        type: "schedule_stream",
        label: "Schedule Collaborative Stream",
        description: "Plan ahead with top matches",
        targetUserId: String(topMatch.candidate || ""),
        priority: "medium",
        timeWindow: {
          start: request.context.plannedStreamTime,
          end: new Date(
            request.context.plannedStreamTime.getTime() +
              (request.context?.streamDuration || 120) * 60000,
          ),
        },
      });
    }

    return actions;
  }

  /**
   * Generate strategic suggestions
   */
  private generateStrategicSuggestions(
    matches: EnhancedStreamerMatch[],
  ): StrategicSuggestion[] {
    const suggestions: StrategicSuggestion[] = [];

    // Content strategy
    const avgContentScore =
      matches.reduce(
        (sum, m) => sum + m.estimatedOutcome.contentSynergyScore,
        0,
      ) / matches.length || 0;

    if (avgContentScore > 70) {
      suggestions.push({
        category: "content_strategy",
        insight: "Strong content synergy detected with multiple candidates",
        actionItems: [
          "Consider series or recurring collaborations",
          "Leverage shared audience interests",
        ],
        potentialImpact: "high",
        confidence: 0.8,
      });
    }

    // Audience growth
    const highGrowthMatches = matches.filter(
      (m) => m.estimatedOutcome.audienceGrowthPotential > 25,
    );
    if (highGrowthMatches.length >= 3) {
      suggestions.push({
        category: "audience_growth",
        insight: `${highGrowthMatches.length} matches show high audience growth potential`,
        actionItems: [
          "Prioritize collaborations with complementary audiences",
          "Cross-promote on multiple platforms",
        ],
        potentialImpact: "high",
        confidence: 0.75,
      });
    }

    return suggestions;
  }

  /**
   * Get trending opportunities
   */
  private async getTrendingOpportunities(
    request: RealTimeMatchRequest,
  ): Promise<TrendingOpportunity[]> {
    const opportunities: TrendingOpportunity[] = [];

    // Game trends (simulated - would integrate with real data)
    if (
      request.preferences?.requiredGames &&
      request.preferences.requiredGames.length > 0
    ) {
      opportunities.push({
        type: "game_trend",
        title: `${request.preferences.requiredGames[0]} Trending`,
        description: "Popular game with high viewer engagement",
        relevanceScore: 0.85,
        relatedStreamers: [],
      });
    }

    // Event-based opportunities
    const now = new Date();
    if (now.getDay() === 5 || now.getDay() === 6) {
      // Weekend
      opportunities.push({
        type: "event_based",
        title: "Weekend Prime Time Collaboration",
        description: "Peak viewership window approaching",
        relevanceScore: 0.9,
        relatedStreamers: [],
      });
    }

    return opportunities;
  }

  /**
   * Generate learning insights
   */
  private generateLearningInsights(
    matches: EnhancedStreamerMatch[],
  ): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Personal patterns
    const perfectMatches = matches.filter((m) => m.matchStrength === "perfect");
    if (perfectMatches.length > 0) {
      insights.push({
        type: "personal_pattern",
        message: `You have ${perfectMatches.length} perfect match(es) - these collaborations have highest success probability`,
        learnedFrom: "Historical collaboration data",
        confidence: 0.85,
        applicability: 0.9,
        suggestedActions: [
          "Prioritize these partnerships",
          "Build long-term relationships",
        ],
      });
    }

    // Optimization tips
    const avgUrgency =
      matches.reduce((sum, m) => sum + m.urgencyScore, 0) / matches.length || 0;
    if (avgUrgency < 0.5) {
      insights.push({
        type: "optimization_tip",
        message:
          "Consider planning collaborations further in advance for better match quality",
        learnedFrom: "Urgency score analysis",
        confidence: 0.7,
        applicability: 0.8,
        suggestedActions: [
          "Schedule streams 1-2 weeks ahead",
          "Build relationships before collaboration",
        ],
      });
    }

    return insights;
  }

  /**
   * Calculate quality score for matches
   */
  calculateQualityScore(matches: EnhancedStreamerMatch[]): number {
    if (matches.length === 0) return 0;

    const avgCompatibility =
      matches.reduce((sum, m) => sum + m.compatibilityScore, 0) /
      matches.length;
    const avgConfidence =
      matches.reduce((sum, m) => sum + m.mlConfidence, 0) / matches.length;

    return (avgCompatibility + avgConfidence) / 2;
  }

  /**
   * Calculate diversity score
   */
  calculateDiversityScore(matches: EnhancedStreamerMatch[]): number {
    if (matches.length === 0) return 0;

    // Count unique collaboration types
    const uniqueTypes = new Set<string>();
    matches.forEach((m) =>
      m.collaborationTypes.forEach((t) => uniqueTypes.add(t)),
    );

    // Normalize by potential diversity
    return Math.min(1, uniqueTypes.size / 5);
  }
}

export const matchingRecommendations =
  MatchingRecommendationsService.getInstance();
