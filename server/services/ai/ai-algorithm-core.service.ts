/**
 * AI Algorithm Core Service
 * Orchestrates AI algorithm services for advanced streaming partner matching
 */

import { logger } from "../../logger";
import { aiAdaptiveWeights } from "./ai-adaptive-weights.service";
import { aiAudienceAnalysis } from "./ai-audience-analysis.service";
import { aiGameCompatibility } from "./ai-game-compatibility.service";
import { aiStyleMatcher } from "./ai-style-matcher.service";
import { aiTimezoneCoordinator } from "./ai-timezone-coordinator.service";
import type {
  AlgorithmWeights,
  AudienceData,
  AudienceOverlapAnalysis,
  GameCompatibilityResult,
  GamePreferences,
  MatchData,
  ScheduleData,
  StreamingMetrics,
  StreamingStyleData,
  StreamingStyleMatch,
  TimeZoneCoordination,
} from "./ai-algorithm-types";

/**
 * Core AI Algorithm Engine for streaming partner matching
 * Orchestrates specialized sub-services for comprehensive analysis
 */
export class AIAlgorithmCoreService {
  private static instance: AIAlgorithmCoreService;

  private constructor() {
    logger.info(
      "AI Algorithm Engine initialized with advanced matching algorithms",
    );
  }

  public static getInstance(): AIAlgorithmCoreService {
    if (!AIAlgorithmCoreService.instance) {
      AIAlgorithmCoreService.instance = new AIAlgorithmCoreService();
    }
    return AIAlgorithmCoreService.instance;
  }

  /**
   * Comprehensive game compatibility analysis with cross-genre synergy
   */
  async analyzeGameCompatibility(
    userGames: string[],
    candidateGames: string[],
    userPreferences?: GamePreferences,
    candidatePreferences?: GamePreferences,
  ): Promise<GameCompatibilityResult> {
    return aiGameCompatibility.analyzeCompatibility(
      userGames,
      candidateGames,
      userPreferences,
      candidatePreferences,
    );
  }

  /**
   * Advanced audience overlap analysis with demographic modeling
   */
  async analyzeAudienceOverlap(
    userAudience: AudienceData,
    candidateAudience: AudienceData,
    userMetrics?: StreamingMetrics,
    candidateMetrics?: StreamingMetrics,
  ): Promise<AudienceOverlapAnalysis> {
    return aiAudienceAnalysis.analyzeOverlap(
      userAudience,
      candidateAudience,
      userMetrics,
      candidateMetrics,
    );
  }

  /**
   * Advanced timezone coordination analysis with global scheduling
   */
  async analyzeTimezoneCoordination(
    userSchedule: ScheduleData,
    candidateSchedule: ScheduleData,
  ): Promise<TimeZoneCoordination> {
    return aiTimezoneCoordinator.analyzeCoordination(
      userSchedule,
      candidateSchedule,
    );
  }

  /**
   * Streaming style preference matching with behavioral analysis
   */
  async analyzeStreamingStyleMatch(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): Promise<StreamingStyleMatch> {
    return aiStyleMatcher.analyzeStyleMatch(userStyle, candidateStyle);
  }

  /**
   * Update adaptive weights based on collaboration outcomes
   * Uses machine learning-inspired approach to optimize matching algorithm
   */
  updateAdaptiveWeights(
    collaborationOutcomes: MatchData[],
    learningRate: number = 0.1,
  ): void {
    aiAdaptiveWeights.updateWeights(collaborationOutcomes, learningRate);
  }

  /**
   * Get current algorithm configuration
   */
  getAlgorithmConfiguration(): AlgorithmWeights {
    return aiAdaptiveWeights.getWeights();
  }

  /**
   * Reset algorithm weights to defaults
   */
  resetToDefaults(): void {
    aiAdaptiveWeights.resetToDefaults();
  }
}

// Export singleton instance for use in other services
export const aiAlgorithmCore = AIAlgorithmCoreService.getInstance();

// Backwards compatibility - export as aiAlgorithmEngine
export const aiAlgorithmEngine = aiAlgorithmCore;
