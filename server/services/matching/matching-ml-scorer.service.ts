/**
 * Matching ML Scorer Service
 * Machine learning-based scoring and ranking for matches
 */

import { logger } from "../../logger";
import type {
  EnhancedStreamerMatch,
  CollaborationOutcome,
  RealTimeMatchRequest,
} from "./matching-types";

/**
 * Machine Learning Model for match scoring
 */
class MachineLearningModel {
  private weights = {
    gameCompatibility: 0.25,
    audienceOverlap: 0.2,
    timezoneAlignment: 0.15,
    styleMatch: 0.15,
    platformSynergy: 0.1,
    historicalSuccess: 0.1,
    availability: 0.05,
  };

  /**
   * Adjust weights based on feedback
   */
  updateWeights(outcome: CollaborationOutcome, actualSuccess: number): void {
    const predicted = outcome.successProbability;
    const error = actualSuccess - predicted;
    const learningRate = 0.01;

    // Simple gradient descent adjustment
    for (const key in this.weights) {
      this.weights[key as keyof typeof this.weights] *=
        1 + error * learningRate;
    }

    // Normalize weights
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    for (const key in this.weights) {
      this.weights[key as keyof typeof this.weights] /= sum;
    }
  }

  getWeights() {
    return { ...this.weights };
  }
}

export class MatchingMLScorerService {
  private static instance: MatchingMLScorerService;
  private mlModel: MachineLearningModel;

  private constructor() {
    this.mlModel = new MachineLearningModel();
    logger.debug("Matching ML Scorer Service initialized");
  }

  public static getInstance(): MatchingMLScorerService {
    if (!MatchingMLScorerService.instance) {
      MatchingMLScorerService.instance = new MatchingMLScorerService();
    }
    return MatchingMLScorerService.instance;
  }

  /**
   * Apply ML scoring to matches
   */
  async applyMLScoring(
    matches: EnhancedStreamerMatch[],
    _request: RealTimeMatchRequest,
  ): Promise<EnhancedStreamerMatch[]> {
    const weights = this.mlModel.getWeights();

    return matches.map((match) => {
      // Calculate ML confidence based on feature quality
      const mlConfidence =
        match.compatibilityScore * weights.gameCompatibility +
        (match.availability.currentlyOnline ? 1 : 0.5) * weights.availability +
        match.estimatedOutcome.contentSynergyScore / 100;

      return {
        ...match,
        mlConfidence: Math.min(1, mlConfidence),
      };
    });
  }

  /**
   * Estimate collaboration outcome
   */
  async estimateOutcome(
    match: EnhancedStreamerMatch,
    request: RealTimeMatchRequest,
  ): Promise<CollaborationOutcome> {
    const baseScore = match.compatibilityScore;

    return {
      expectedViewerBoost: baseScore * 50, // 0-50% boost
      audienceGrowthPotential: baseScore * 30,
      engagementIncrease: baseScore * 40,
      successProbability: baseScore,
      estimatedDuration: request.context?.streamDuration || 120,
      contentSynergyScore: baseScore * 100,
    };
  }

  /**
   * Record actual collaboration outcome for learning
   */
  recordOutcome(predicted: CollaborationOutcome, actualSuccess: number): void {
    this.mlModel.updateWeights(predicted, actualSuccess);
    logger.debug("ML model updated with feedback", {
      predicted: predicted.successProbability,
      actual: actualSuccess,
    });
  }

  /**
   * Calculate urgency score
   */
  calculateUrgencyScore(
    match: EnhancedStreamerMatch,
    request: RealTimeMatchRequest,
  ): number {
    let urgency = 0.5;

    // Increase urgency based on request context
    if (request.preferences?.urgency === "immediate") {
      urgency += 0.3;
    } else if (request.preferences?.urgency === "today") {
      urgency += 0.2;
    }

    // Increase if candidate is currently online
    if (match.availability.currentlyOnline) {
      urgency += 0.2;
    }

    return Math.min(1, urgency);
  }

  /**
   * Determine match strength category
   */
  determineMatchStrength(
    score: number,
  ): "perfect" | "excellent" | "good" | "fair" {
    if (score >= 0.9) return "perfect";
    if (score >= 0.75) return "excellent";
    if (score >= 0.6) return "good";
    return "fair";
  }

  /**
   * Get current model weights
   */
  getModelWeights() {
    return this.mlModel.getWeights();
  }
}

export const matchingMLScorer = MatchingMLScorerService.getInstance();
