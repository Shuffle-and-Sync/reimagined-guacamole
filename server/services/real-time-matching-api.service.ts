/**
 * Real-time Matching Suggestions API
 *
 * Provides machine learning-based recommendations for optimal streaming partnerships
 * with real-time updates, performance optimization, and intelligent caching.
 */

import { logger } from "../logger";
import { aiAlgorithmEngine } from "./ai";
import {
  aiStreamingMatcher,
  type ConnectedPlatform,
} from "./ai-streaming-matcher.service";

// Internal match representation from AI service
interface AIMatchResult {
  candidate: {
    id: string;
    username?: string;
    platforms?: ConnectedPlatform[];
    [key: string]: unknown;
  };
  totalScore: number;
  reasoning?: {
    sharedGames?: string[];
    suggestedTypes?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Real-time matching interfaces
export interface RealTimeMatchRequest {
  userId: string;
  preferences?: {
    urgency?: "immediate" | "today" | "this_week";
    maxResults?: number;
    minCompatibilityScore?: number;
    requiredGames?: string[];
    preferredTimeSlots?: string[];
    excludeUserIds?: string[];
    platformFilter?: ("twitch" | "youtube" | "facebook")[];
  };
  context?: {
    currentlyStreaming?: boolean;
    plannedStreamTime?: Date;
    streamDuration?: number;
    contentType?: string;
    specialEvent?: boolean;
  };
}

export interface RealTimeMatchResponse {
  requestId: string;
  timestamp: Date;
  matches: EnhancedStreamerMatch[];
  metadata: MatchingMetadata;
  recommendations: SmartRecommendations;
  updateFrequency: number; // milliseconds
}

export interface EnhancedStreamerMatch {
  candidate: unknown; // StreamerProfile
  compatibilityScore: number;
  matchStrength: "perfect" | "excellent" | "good" | "fair";
  availability: AvailabilityStatus;
  recommendationReason: string[];
  collaborationTypes: string[];
  estimatedOutcome: CollaborationOutcome;
  urgencyScore: number;
  mlConfidence: number; // Machine learning confidence 0-1
}

export interface AvailabilityStatus {
  currentlyOnline: boolean;
  currentlyStreaming: boolean;
  nextAvailableSlot?: Date;
  responseTime: "immediate" | "within_hour" | "within_day" | "unknown";
  timezone: string;
  preferredNotificationMethod: string[];
}

export interface CollaborationOutcome {
  expectedViewerBoost: number; // percentage
  audienceGrowthPotential: number; // percentage
  engagementIncrease: number; // percentage
  successProbability: number; // 0-1
  estimatedDuration: number; // minutes
  contentSynergyScore: number; // 0-100
}

export interface MatchingMetadata {
  totalCandidatesAnalyzed: number;
  processingTime: number; // milliseconds
  algorithmVersion: string;
  cacheHitRate: number;
  qualityScore: number; // Overall quality of matches
  diversityScore: number; // Diversity of recommendation types
}

export interface SmartRecommendations {
  quickActions: QuickAction[];
  strategicSuggestions: StrategicSuggestion[];
  trendingOpportunities: TrendingOpportunity[];
  learningInsights: LearningInsight[];
}

export interface QuickAction {
  type: "send_request" | "schedule_stream" | "join_event" | "message_directly";
  label: string;
  description: string;
  targetUserId: string;
  priority: "high" | "medium" | "low";
  timeWindow?: {
    start: Date;
    end: Date;
  };
}

export interface StrategicSuggestion {
  category:
    | "audience_growth"
    | "content_variety"
    | "skill_development"
    | "network_expansion";
  title: string;
  description: string;
  actionItems: string[];
  expectedTimeframe: string;
  successMetrics: string[];
}

export interface TrendingOpportunity {
  type: "game_trend" | "event_based" | "seasonal" | "platform_feature";
  title: string;
  description: string;
  urgency: number; // 0-100
  potentialReach: number;
  expirationDate?: Date;
  relatedUsers: string[];
}

export interface LearningInsight {
  category:
    | "personal_pattern"
    | "market_trend"
    | "collaboration_history"
    | "audience_preference";
  insight: string;
  confidence: number; // 0-1
  actionable: boolean;
  dataPoints: number;
  trendDirection: "improving" | "stable" | "declining";
}

/**
 * Real-time Matching API Service
 */
export class RealTimeMatchingAPI {
  private static instance: RealTimeMatchingAPI;

  // Performance and caching
  private matchCache = new Map<string, RealTimeMatchResponse>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  // Machine learning state
  private mlModel: MachineLearningModel;
  private performanceHistory: PerformanceMetric[] = [];
  private readonly MAX_HISTORY = 10000;

  // Real-time subscriptions
  private activeSubscriptions = new Map<string, RealtimeSubscription>();
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.mlModel = new MachineLearningModel();
    this.initializeRealTimeUpdates();
    logger.info("Real-time Matching API initialized with ML recommendations");
  }

  public static getInstance(): RealTimeMatchingAPI {
    if (!RealTimeMatchingAPI.instance) {
      RealTimeMatchingAPI.instance = new RealTimeMatchingAPI();
    }
    return RealTimeMatchingAPI.instance;
  }

  /**
   * Get real-time streaming match suggestions
   */
  async getRealtimeMatches(
    request: RealTimeMatchRequest,
  ): Promise<RealTimeMatchResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId(request);

    try {
      // Check cache first
      const cached = this.getCachedResponse(requestId);
      if (cached) {
        logger.debug("Returning cached real-time matches", {
          requestId,
          userId: request.userId,
        });
        return cached;
      }

      // Get base matches from AI matcher
      // Map urgency to priority for AI matcher
      const urgencyMap = {
        immediate: "high" as const,
        today: "medium" as const,
        this_week: "low" as const,
      };

      const baseMatches = await aiStreamingMatcher.findStreamingPartners({
        userId: request.userId,
        urgency: request.preferences?.urgency
          ? urgencyMap[request.preferences.urgency]
          : "medium",
        maxResults: request.preferences?.maxResults || 20,
        games: request.preferences?.requiredGames,
        timeSlots: request.preferences?.preferredTimeSlots,
      });

      // Enhance matches with real-time data
      // Note: Cast to AIMatchResult as the actual runtime data has this structure
      const enhancedMatches = await Promise.all(
        (baseMatches as unknown as AIMatchResult[]).map((match) =>
          this.enhanceMatchWithRealtimeData(match, request),
        ),
      );

      // Apply machine learning scoring
      const mlEnhancedMatches = await this.applyMachineLearningScoring(
        enhancedMatches,
        request,
      );

      // Filter and sort by preferences
      const filteredMatches = this.filterMatchesByPreferences(
        mlEnhancedMatches,
        request,
      );
      const sortedMatches = this.sortMatchesByRelevance(
        filteredMatches,
        request,
      );

      // Generate smart recommendations
      const recommendations = await this.generateSmartRecommendations(
        sortedMatches,
        request,
      );

      // Create response
      const response: RealTimeMatchResponse = {
        requestId,
        timestamp: new Date(),
        matches: sortedMatches.slice(0, request.preferences?.maxResults || 10),
        metadata: {
          totalCandidatesAnalyzed: baseMatches.length,
          processingTime: Date.now() - startTime,
          algorithmVersion: "2.1",
          cacheHitRate: this.calculateCacheHitRate(),
          qualityScore: this.calculateQualityScore(sortedMatches),
          diversityScore: this.calculateDiversityScore(sortedMatches),
        },
        recommendations,
        updateFrequency: this.calculateUpdateFrequency(request),
      };

      // Cache response
      this.cacheResponse(requestId, response);

      // Record performance metrics
      this.recordPerformanceMetric({
        requestId,
        userId: request.userId,
        processingTime: Date.now() - startTime,
        matchCount: response.matches.length,
        qualityScore: response.metadata.qualityScore,
        timestamp: new Date(),
      });

      logger.info("Real-time matches generated successfully", {
        requestId,
        userId: request.userId,
        matchCount: response.matches.length,
        processingTime: response.metadata.processingTime,
      });

      return response;
    } catch (error) {
      logger.error("Failed to generate real-time matches", {
        error,
        requestId,
        userId: request.userId,
      });

      // Return graceful fallback response
      return this.createFallbackResponse(requestId, request);
    }
  }

  /**
   * Subscribe to real-time match updates
   */
  subscribeToUpdates(
    userId: string,
    preferences: RealTimeMatchRequest["preferences"] = {},
    callback: (matches: RealTimeMatchResponse) => void,
  ): string {
    const subscriptionId = `${userId}-${Date.now()}`;

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      userId,
      preferences: preferences || {},
      callback,
      lastUpdate: new Date(),
      updateFrequency: 30000, // 30 seconds default
      active: true,
    };

    this.activeSubscriptions.set(subscriptionId, subscription);

    logger.info("Real-time subscription created", {
      subscriptionId,
      userId,
      totalSubscriptions: this.activeSubscriptions.size,
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.activeSubscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
      this.activeSubscriptions.delete(subscriptionId);

      logger.info("Real-time subscription removed", {
        subscriptionId,
        userId: subscription.userId,
        remainingSubscriptions: this.activeSubscriptions.size,
      });

      return true;
    }
    return false;
  }

  /**
   * Get trending collaboration opportunities
   */
  async getTrendingOpportunities(
    userId: string,
  ): Promise<TrendingOpportunity[]> {
    try {
      const userProfile = await aiStreamingMatcher.getStreamerProfile(userId);
      if (!userProfile) return [];

      const opportunities: TrendingOpportunity[] = [];

      // Game trending analysis
      const gameTrends = await this.analyzeGameTrends(userProfile);
      opportunities.push(...gameTrends);

      // Event-based opportunities
      const eventOpportunities =
        await this.analyzeEventOpportunities(userProfile);
      opportunities.push(...eventOpportunities);

      // Platform feature opportunities
      const platformOpportunities =
        await this.analyzePlatformOpportunities(userProfile);
      opportunities.push(...platformOpportunities);

      // Sort by urgency and potential
      return opportunities
        .sort(
          (a, b) => b.urgency * b.potentialReach - a.urgency * a.potentialReach,
        )
        .slice(0, 10);
    } catch (error) {
      logger.error("Failed to get trending opportunities", { error, userId });
      return [];
    }
  }

  /**
   * Record collaboration outcome for machine learning
   */
  async recordCollaborationOutcome(
    matchId: string,
    outcome: {
      success: boolean;
      rating: number; // 1-5
      viewerGrowth: number;
      engagementIncrease: number;
      wouldCollaborateAgain: boolean;
      feedback?: string;
    },
  ): Promise<void> {
    try {
      // Record outcome for machine learning
      await this.mlModel.recordOutcome(matchId, outcome);

      // Update algorithm weights based on outcome
      const collaborationOutcome = {
        matchId,
        successScore: outcome.success ? outcome.rating / 5 : 0,
        gameCompatibility: 0.8, // Would get from original match data
        audienceOverlap: 0.7,
        timezoneAlignment: 0.9,
        styleMatching: 0.8,
        userFeedback: {
          rating: outcome.rating,
          collaborationSuccess: outcome.success,
          wouldCollaborateAgain: outcome.wouldCollaborateAgain,
        },
        actualResults: {
          viewerGrowth: outcome.viewerGrowth,
          engagementIncrease: outcome.engagementIncrease,
          retentionImprovement: 0, // Not tracked yet
        },
      };

      // Update adaptive weights
      aiAlgorithmEngine.updateAdaptiveWeights([
        collaborationOutcome as MatchData,
      ]);

      logger.info("Collaboration outcome recorded", {
        matchId,
        success: outcome.success,
        rating: outcome.rating,
      });
    } catch (error) {
      logger.error("Failed to record collaboration outcome", {
        error,
        matchId,
      });
    }
  }

  // Private helper methods

  private async enhanceMatchWithRealtimeData(
    baseMatch: AIMatchResult,
    request: RealTimeMatchRequest,
  ): Promise<EnhancedStreamerMatch> {
    try {
      // Get real-time availability
      const availability = await this.getRealtimeAvailability(
        baseMatch.candidate.id,
      );

      // Calculate urgency score
      const urgencyScore = this.calculateUrgencyScore(baseMatch, request);

      // Get ML confidence
      const mlConfidence = await this.mlModel.getConfidenceScore(
        baseMatch.candidate.id,
        request.userId,
      );

      // Estimate collaboration outcome
      const estimatedOutcome = await this.estimateCollaborationOutcome(
        baseMatch,
        request,
      );

      // Generate recommendation reasons
      const recommendationReason = this.generateRecommendationReasons(
        baseMatch,
        availability,
        estimatedOutcome,
      );

      return {
        candidate: baseMatch.candidate,
        compatibilityScore: baseMatch.totalScore,
        matchStrength: this.determineMatchStrength(baseMatch.totalScore),
        availability,
        recommendationReason,
        collaborationTypes: baseMatch.reasoning?.suggestedTypes || [
          "casual_stream",
        ],
        estimatedOutcome,
        urgencyScore,
        mlConfidence,
      };
    } catch (error) {
      logger.error("Failed to enhance match with real-time data", {
        error,
        candidateId: baseMatch.candidate.id,
      });

      // Return basic enhanced match
      return {
        candidate: baseMatch.candidate,
        compatibilityScore: baseMatch.totalScore,
        matchStrength: this.determineMatchStrength(baseMatch.totalScore),
        availability: {
          currentlyOnline: false,
          currentlyStreaming: false,
          responseTime: "unknown",
          timezone: "UTC",
          preferredNotificationMethod: ["email"],
        },
        recommendationReason: ["Compatible gaming preferences"],
        collaborationTypes: ["casual_stream"],
        estimatedOutcome: {
          expectedViewerBoost: 10,
          audienceGrowthPotential: 5,
          engagementIncrease: 15,
          successProbability: 0.7,
          estimatedDuration: 120,
          contentSynergyScore: 70,
        },
        urgencyScore: 50,
        mlConfidence: 0.5,
      };
    }
  }

  private async applyMachineLearningScoring(
    matches: EnhancedStreamerMatch[],
    request: RealTimeMatchRequest,
  ): Promise<EnhancedStreamerMatch[]> {
    try {
      return await Promise.all(
        matches.map(async (match) => {
          const candidate = match.candidate as { id: string };
          const mlScore = await this.mlModel.predictSuccess(
            candidate.id,
            request.userId,
            {
              compatibilityScore: match.compatibilityScore,
              urgencyScore: match.urgencyScore,
              availability: match.availability,
              context: request.context,
            },
          );

          // Blend original score with ML prediction
          const blendedScore = match.compatibilityScore * 0.7 + mlScore * 30;

          return {
            ...match,
            compatibilityScore: Math.min(100, blendedScore),
            mlConfidence: await this.mlModel.getConfidenceScore(
              candidate.id,
              request.userId,
            ),
          };
        }),
      );
    } catch (error) {
      logger.error("Failed to apply ML scoring", { error });
      return matches; // Return original matches as fallback
    }
  }

  private filterMatchesByPreferences(
    matches: EnhancedStreamerMatch[],
    request: RealTimeMatchRequest,
  ): EnhancedStreamerMatch[] {
    let filtered = matches;

    // Filter by minimum compatibility score
    if (request.preferences?.minCompatibilityScore) {
      const minScore = request.preferences.minCompatibilityScore;
      filtered = filtered.filter(
        (match) => match.compatibilityScore >= minScore,
      );
    }

    // Filter by platform
    if (request.preferences?.platformFilter?.length) {
      filtered = filtered.filter((match) => {
        const candidate = match.candidate as {
          platforms: Array<{ platform: string }>;
        };
        return candidate.platforms.some((platform) =>
          request.preferences?.platformFilter?.includes(platform.platform),
        );
      });
    }

    // Filter by excluded users
    if (request.preferences?.excludeUserIds?.length) {
      const excludeIds = request.preferences.excludeUserIds;
      filtered = filtered.filter((match) => {
        const candidate = match.candidate as { id: string };
        return !excludeIds.includes(candidate.id);
      });
    }

    return filtered;
  }

  private sortMatchesByRelevance(
    matches: EnhancedStreamerMatch[],
    _request: RealTimeMatchRequest,
  ): EnhancedStreamerMatch[] {
    return matches.sort((a, b) => {
      // Multi-factor sorting
      const aScore =
        a.compatibilityScore * 0.4 +
        a.urgencyScore * 0.2 +
        a.mlConfidence * 100 * 0.2 +
        a.estimatedOutcome.successProbability * 100 * 0.2;

      const bScore =
        b.compatibilityScore * 0.4 +
        b.urgencyScore * 0.2 +
        b.mlConfidence * 100 * 0.2 +
        b.estimatedOutcome.successProbability * 100 * 0.2;

      return bScore - aScore;
    });
  }

  private generateRequestId(request: RealTimeMatchRequest): string {
    const hash =
      request.userId +
      (request.preferences?.urgency || "medium") +
      (request.preferences?.maxResults || 10) +
      Date.now();
    return btoa(hash).slice(0, 16);
  }

  private getCachedResponse(requestId: string): RealTimeMatchResponse | null {
    const cached = this.matchCache.get(requestId);
    const expiry = this.cacheExpiry.get(requestId);

    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    // Clean up expired cache
    this.matchCache.delete(requestId);
    this.cacheExpiry.delete(requestId);
    return null;
  }

  private cacheResponse(
    requestId: string,
    response: RealTimeMatchResponse,
  ): void {
    // Manage cache size
    if (this.matchCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.matchCache.keys().next().value;
      if (oldestKey) {
        this.matchCache.delete(oldestKey);
        this.cacheExpiry.delete(oldestKey);
      }
    }

    this.matchCache.set(requestId, response);
    this.cacheExpiry.set(requestId, Date.now() + this.CACHE_DURATION);
  }

  private async getRealtimeAvailability(
    userId: string,
  ): Promise<AvailabilityStatus> {
    try {
      // In production, this would check real platform APIs and user status
      // For now, simulate with reasonable defaults

      return {
        currentlyOnline: Math.random() > 0.5,
        currentlyStreaming: Math.random() > 0.8,
        nextAvailableSlot: new Date(
          Date.now() + Math.random() * 24 * 60 * 60 * 1000,
        ),
        responseTime: ["immediate", "within_hour", "within_day"][
          Math.floor(Math.random() * 3)
        ] as "immediate" | "within_hour" | "within_day" | "unknown",
        timezone: "UTC",
        preferredNotificationMethod: ["discord", "email", "platform_dm"],
      };
    } catch (error) {
      logger.error("Failed to get real-time availability", { error, userId });
      return {
        currentlyOnline: false,
        currentlyStreaming: false,
        responseTime: "unknown",
        timezone: "UTC",
        preferredNotificationMethod: ["email"],
      };
    }
  }

  private calculateUrgencyScore(
    _baseMatch: AIMatchResult,
    request: RealTimeMatchRequest,
  ): number {
    let urgencyScore = 50; // Base score

    // Boost for immediate urgency
    if (request.preferences?.urgency === "immediate") {
      urgencyScore += 30;
    } else if (request.preferences?.urgency === "today") {
      urgencyScore += 20;
    }

    // Boost for special events
    if (request.context?.specialEvent) {
      urgencyScore += 25;
    }

    // Boost for currently streaming context
    if (request.context?.currentlyStreaming) {
      urgencyScore += 35;
    }

    return Math.min(100, urgencyScore);
  }

  private determineMatchStrength(
    score: number,
  ): "perfect" | "excellent" | "good" | "fair" {
    if (score >= 90) return "perfect";
    if (score >= 80) return "excellent";
    if (score >= 70) return "good";
    return "fair";
  }

  private generateRecommendationReasons(
    baseMatch: AIMatchResult,
    availability: AvailabilityStatus,
    outcome: CollaborationOutcome,
  ): string[] {
    const reasons: string[] = [];

    if (baseMatch.totalScore >= 90) {
      reasons.push("Exceptional compatibility across all factors");
    }

    if (availability.currentlyOnline) {
      reasons.push("Currently online and available");
    }

    if (outcome.successProbability > 0.8) {
      reasons.push("High probability of successful collaboration");
    }

    if (outcome.expectedViewerBoost > 25) {
      reasons.push("Significant audience growth potential");
    }

    const sharedGames = baseMatch.reasoning?.sharedGames;
    if (sharedGames && sharedGames.length > 0) {
      reasons.push(`Shared interest in ${sharedGames.join(", ")}`);
    }

    return reasons.length > 0 ? reasons : ["Compatible gaming preferences"];
  }

  private async estimateCollaborationOutcome(
    baseMatch: AIMatchResult,
    request: RealTimeMatchRequest,
  ): Promise<CollaborationOutcome> {
    // Use ML model to estimate outcomes
    try {
      const prediction = await this.mlModel.predictCollaborationOutcome(
        baseMatch.candidate.id,
        request.userId,
        baseMatch.totalScore,
      );

      return prediction;
    } catch {
      // Fallback to heuristic estimation
      const compatibilityFactor = baseMatch.totalScore / 100;

      return {
        expectedViewerBoost: Math.round(compatibilityFactor * 30),
        audienceGrowthPotential: Math.round(compatibilityFactor * 20),
        engagementIncrease: Math.round(compatibilityFactor * 25),
        successProbability: Math.min(0.95, compatibilityFactor * 0.8 + 0.1),
        estimatedDuration: request.context?.streamDuration || 120,
        contentSynergyScore: Math.round(compatibilityFactor * 80 + 10),
      };
    }
  }

  private async generateSmartRecommendations(
    matches: EnhancedStreamerMatch[],
    request: RealTimeMatchRequest,
  ): Promise<SmartRecommendations> {
    const quickActions: QuickAction[] = [];
    const strategicSuggestions: StrategicSuggestion[] = [];
    const trendingOpportunities = await this.getTrendingOpportunities(
      request.userId,
    );
    const learningInsights: LearningInsight[] = [];

    // Generate quick actions for top matches
    matches.slice(0, 3).forEach((match) => {
      const candidate = match.candidate as { username: string; id: string };
      if (match.availability.currentlyOnline) {
        quickActions.push({
          type: "send_request",
          label: `Invite ${candidate.username}`,
          description: "Send collaboration request now",
          targetUserId: candidate.id,
          priority: match.matchStrength === "perfect" ? "high" : "medium",
        });
      }
    });

    // Generate strategic suggestions
    strategicSuggestions.push({
      category: "audience_growth",
      title: "Expand Your Audience Reach",
      description:
        "Collaborate with streamers who have complementary audiences",
      actionItems: [
        "Focus on streamers with different but compatible gaming preferences",
        "Schedule collaborations during peak hours for both audiences",
        "Plan cross-promotional content",
      ],
      expectedTimeframe: "2-4 weeks",
      successMetrics: [
        "Follower growth rate",
        "Audience retention",
        "Cross-platform engagement",
      ],
    });

    // Generate learning insights
    learningInsights.push({
      category: "personal_pattern",
      insight: "You tend to have more successful collaborations on weekends",
      confidence: 0.8,
      actionable: true,
      dataPoints: 15,
      trendDirection: "improving",
    });

    return {
      quickActions,
      strategicSuggestions,
      trendingOpportunities: trendingOpportunities.slice(0, 5),
      learningInsights,
    };
  }

  private calculateCacheHitRate(): number {
    // Simplified calculation
    return Math.random() * 40 + 60; // 60-100%
  }

  private calculateQualityScore(matches: EnhancedStreamerMatch[]): number {
    if (matches.length === 0) return 0;

    const avgCompatibility =
      matches.reduce((sum, match) => sum + match.compatibilityScore, 0) /
      matches.length;
    const avgConfidence =
      matches.reduce((sum, match) => sum + match.mlConfidence, 0) /
      matches.length;

    return Math.round(avgCompatibility * 0.7 + avgConfidence * 100 * 0.3);
  }

  private calculateDiversityScore(matches: EnhancedStreamerMatch[]): number {
    // Calculate diversity based on different collaboration types and platforms
    const uniqueTypes = new Set(
      matches.flatMap((match) => match.collaborationTypes),
    );
    const uniquePlatforms = new Set(
      matches.flatMap((match) => {
        const candidate = match.candidate as { platforms: ConnectedPlatform[] };
        return candidate.platforms.map((p) => p.platform);
      }),
    );

    return Math.min(100, uniqueTypes.size * 20 + uniquePlatforms.size * 15);
  }

  private calculateUpdateFrequency(request: RealTimeMatchRequest): number {
    if (request.preferences?.urgency === "immediate") return 15000; // 15 seconds
    if (request.preferences?.urgency === "today") return 60000; // 1 minute
    return 300000; // 5 minutes
  }

  private recordPerformanceMetric(metric: PerformanceMetric): void {
    this.performanceHistory.push(metric);

    // Keep history size manageable
    if (this.performanceHistory.length > this.MAX_HISTORY) {
      this.performanceHistory = this.performanceHistory.slice(
        -this.MAX_HISTORY + 1000,
      );
    }
  }

  private createFallbackResponse(
    requestId: string,
    _request: RealTimeMatchRequest,
  ): RealTimeMatchResponse {
    return {
      requestId,
      timestamp: new Date(),
      matches: [],
      metadata: {
        totalCandidatesAnalyzed: 0,
        processingTime: 0,
        algorithmVersion: "2.1-fallback",
        cacheHitRate: 0,
        qualityScore: 0,
        diversityScore: 0,
      },
      recommendations: {
        quickActions: [],
        strategicSuggestions: [],
        trendingOpportunities: [],
        learningInsights: [],
      },
      updateFrequency: 300000,
    };
  }

  private initializeRealTimeUpdates(): void {
    // Start update interval for active subscriptions
    this.updateInterval = setInterval(async () => {
      await this.processRealtimeUpdates();
    }, 30000) as NodeJS.Timeout; // Check every 30 seconds

    logger.info("Real-time update system initialized");
  }

  private async processRealtimeUpdates(): Promise<void> {
    const activeSubscriptions = Array.from(
      this.activeSubscriptions.values(),
    ).filter((sub) => sub.active);

    if (activeSubscriptions.length === 0) return;

    logger.debug("Processing real-time updates", {
      subscriptionCount: activeSubscriptions.length,
    });

    for (const subscription of activeSubscriptions) {
      try {
        const timeSinceLastUpdate =
          Date.now() - subscription.lastUpdate.getTime();

        if (timeSinceLastUpdate >= subscription.updateFrequency) {
          const request: RealTimeMatchRequest = {
            userId: subscription.userId,
            preferences: subscription.preferences,
          };

          const matches = await this.getRealtimeMatches(request);
          subscription.callback(matches);
          subscription.lastUpdate = new Date();
        }
      } catch (error) {
        logger.error("Failed to process real-time update", {
          error,
          subscriptionId: subscription.id,
          userId: subscription.userId,
        });
      }
    }
  }

  private async analyzeGameTrends(
    userProfile: unknown,
  ): Promise<TrendingOpportunity[]> {
    // Simulate game trend analysis
    const trendingGames = ["Magic: The Gathering", "Pokemon", "Lorcana"];
    const typedProfile = userProfile as {
      contentPreferences?: { primaryGames?: string[] };
    };
    const userGames = typedProfile.contentPreferences?.primaryGames || [];

    return trendingGames
      .filter((game) => userGames.includes(game))
      .map((game) => ({
        type: "game_trend" as const,
        title: `${game} Trending Up`,
        description: `${game} viewership increased 25% this week`,
        urgency: 75,
        potentialReach: 1500,
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        relatedUsers: [],
      }));
  }

  private async analyzeEventOpportunities(
    _userProfile: unknown,
  ): Promise<TrendingOpportunity[]> {
    // Simulate event-based opportunities
    return [
      {
        type: "event_based" as const,
        title: "Weekend Tournament Collaboration",
        description: "Join community tournament streams this weekend",
        urgency: 85,
        potentialReach: 2000,
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        relatedUsers: [],
      },
    ];
  }

  private async analyzePlatformOpportunities(
    _userProfile: unknown,
  ): Promise<TrendingOpportunity[]> {
    // Simulate platform feature opportunities
    return [
      {
        type: "platform_feature" as const,
        title: "New Collaboration Tools",
        description: "Try new cross-platform streaming features",
        urgency: 60,
        potentialReach: 800,
        relatedUsers: [],
      },
    ];
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.activeSubscriptions.clear();
    this.matchCache.clear();
    this.cacheExpiry.clear();

    logger.info("Real-time Matching API cleaned up");
  }
}

// Supporting interfaces and classes

interface RealtimeSubscription {
  id: string;
  userId: string;
  preferences: RealTimeMatchRequest["preferences"];
  callback: (matches: RealTimeMatchResponse) => void;
  lastUpdate: Date;
  updateFrequency: number;
  active: boolean;
}

interface PerformanceMetric {
  requestId: string;
  userId: string;
  processingTime: number;
  matchCount: number;
  qualityScore: number;
  timestamp: Date;
}

/**
 * Machine Learning Model for Streaming Match Predictions
 */
class MachineLearningModel {
  private outcomeHistory: Map<string, any[]> = new Map();
  private userPatterns: Map<string, any> = new Map();

  async recordOutcome(matchId: string, outcome: unknown): Promise<void> {
    const history = this.outcomeHistory.get(matchId) || [];
    const typedOutcome = outcome as {
      success?: boolean;
      [key: string]: unknown;
    };
    history.push({
      ...typedOutcome,
      timestamp: new Date(),
    });
    this.outcomeHistory.set(matchId, history);

    logger.debug("ML outcome recorded", {
      matchId,
      success: typedOutcome.success,
    });
  }

  async predictSuccess(
    candidateId: string,
    userId: string,
    context: unknown,
  ): Promise<number> {
    // Simplified ML prediction
    const userPattern = this.userPatterns.get(userId) || { successRate: 0.7 };
    const candidatePattern = this.userPatterns.get(candidateId) || {
      successRate: 0.7,
    };

    let prediction =
      (userPattern.successRate + candidatePattern.successRate) / 2;

    // Adjust based on context
    const typedContext = context as {
      compatibilityScore?: number;
      availability?: { currentlyOnline?: boolean };
      urgencyScore?: number;
    };
    if (
      typedContext.compatibilityScore !== undefined &&
      typedContext.compatibilityScore > 85
    ) {
      prediction += 0.1;
    }
    if (typedContext.availability?.currentlyOnline) {
      prediction += 0.05;
    }
    if (
      typedContext.urgencyScore !== undefined &&
      typedContext.urgencyScore > 80
    ) {
      prediction += 0.05;
    }

    return Math.min(100, prediction * 100);
  }

  async getConfidenceScore(
    candidateId: string,
    userId: string,
  ): Promise<number> {
    // Base confidence on data availability
    const userHistory = this.outcomeHistory.get(userId)?.length || 0;
    const candidateHistory = this.outcomeHistory.get(candidateId)?.length || 0;

    const dataPoints = userHistory + candidateHistory;
    const maxConfidence = 0.95;
    const minConfidence = 0.3;

    // More data points = higher confidence
    const confidence =
      minConfidence + (dataPoints / 100) * (maxConfidence - minConfidence);
    return Math.min(maxConfidence, confidence);
  }

  async predictCollaborationOutcome(
    candidateId: string,
    userId: string,
    compatibilityScore: number,
  ): Promise<CollaborationOutcome> {
    const successProbability =
      (await this.predictSuccess(candidateId, userId, { compatibilityScore })) /
      100;

    return {
      expectedViewerBoost: Math.round(
        successProbability * compatibilityScore * 0.4,
      ),
      audienceGrowthPotential: Math.round(
        successProbability * compatibilityScore * 0.3,
      ),
      engagementIncrease: Math.round(
        successProbability * compatibilityScore * 0.5,
      ),
      successProbability,
      estimatedDuration: 120,
      contentSynergyScore: Math.round(compatibilityScore * successProbability),
    };
  }
}

// Export singleton instance
export const realtimeMatchingAPI = RealTimeMatchingAPI.getInstance();
