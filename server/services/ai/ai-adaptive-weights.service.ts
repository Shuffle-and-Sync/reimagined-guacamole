/**
 * AI Adaptive Weights Service
 * Handles machine learning-inspired adaptive weight adjustment
 */

import { logger } from "../../logger";
import type { AlgorithmWeights, MatchData } from "./ai-algorithm-types";

export class AIAdaptiveWeightsService {
  private static instance: AIAdaptiveWeightsService;

  private adaptiveWeights: AlgorithmWeights = {
    gameCompatibility: 0.25,
    audienceOverlap: 0.25,
    timezoneAlignment: 0.2,
    styleMatching: 0.15,
    socialFactors: 0.1,
    performanceMetrics: 0.05,
    adaptiveBonus: 0.0,
  };

  private constructor() {
    logger.debug("AI Adaptive Weights Service initialized");
    this.loadAdaptiveWeights();
  }

  public static getInstance(): AIAdaptiveWeightsService {
    if (!AIAdaptiveWeightsService.instance) {
      AIAdaptiveWeightsService.instance = new AIAdaptiveWeightsService();
    }
    return AIAdaptiveWeightsService.instance;
  }

  /**
   * Update adaptive weights based on collaboration outcomes
   */
  updateWeights(
    collaborationOutcomes: MatchData[],
    learningRate: number = 0.1,
  ): void {
    try {
      if (collaborationOutcomes.length < 3) {
        logger.debug("Insufficient data for adaptive weight adjustment", {
          outcomesCount: collaborationOutcomes.length,
        });
        return;
      }

      // Calculate average success rate
      const avgSuccess =
        collaborationOutcomes.reduce(
          (sum, outcome) => sum + (outcome.successScore || 0),
          0,
        ) / collaborationOutcomes.length;

      // Analyze which factors correlate most with success
      const factorAnalysis = {
        gameCompatibility: this.analyzeFactorSuccess(
          collaborationOutcomes,
          "gameCompatibilityScore",
        ),
        audienceOverlap: this.analyzeFactorSuccess(
          collaborationOutcomes,
          "audienceOverlapScore",
        ),
        timezoneAlignment: this.analyzeFactorSuccess(
          collaborationOutcomes,
          "timezoneCompatibilityScore",
        ),
        styleMatching: this.analyzeFactorSuccess(
          collaborationOutcomes,
          "styleMatchingScore",
        ),
      };

      // Identify best performing factor
      const bestFactor = Object.keys(factorAnalysis).reduce((a, b) =>
        factorAnalysis[a as keyof typeof factorAnalysis] >
        factorAnalysis[b as keyof typeof factorAnalysis]
          ? a
          : b,
      );

      // Adjust weights based on performance
      if (avgSuccess > 0.8) {
        // High success rate - maintain current weights with minor refinement
        this.adaptiveWeights.adaptiveBonus = Math.min(
          0.15,
          this.adaptiveWeights.adaptiveBonus + 0.02,
        );
      } else if (avgSuccess < 0.5) {
        // Low success rate - adjust weights toward best performing factor
        const adjustmentFactor = learningRate;

        if (bestFactor === "gameCompatibility") {
          this.adaptiveWeights.gameCompatibility = Math.min(
            0.5,
            this.adaptiveWeights.gameCompatibility + adjustmentFactor,
          );
        } else if (bestFactor === "audienceOverlap") {
          this.adaptiveWeights.audienceOverlap = Math.min(
            0.5,
            this.adaptiveWeights.audienceOverlap + adjustmentFactor,
          );
        } else if (bestFactor === "timezoneAlignment") {
          this.adaptiveWeights.timezoneAlignment = Math.min(
            0.5,
            this.adaptiveWeights.timezoneAlignment + adjustmentFactor,
          );
        } else if (bestFactor === "styleMatching") {
          this.adaptiveWeights.styleMatching = Math.min(
            0.5,
            this.adaptiveWeights.styleMatching + adjustmentFactor,
          );
        }
      }

      // Normalize weights to ensure they sum to ~1.0
      this.normalizeWeights();

      // Persist updated weights
      this.persistAdaptiveWeights();

      logger.info("Adaptive weights updated based on collaboration outcomes", {
        avgSuccess,
        factorAnalysis,
        newWeights: this.adaptiveWeights,
        outcomesAnalyzed: collaborationOutcomes.length,
      });
    } catch (error) {
      logger.error("Failed to update adaptive weights", {
        error,
        outcomesCount: collaborationOutcomes.length,
      });
    }
  }

  /**
   * Get current algorithm weights
   */
  getWeights(): AlgorithmWeights {
    return { ...this.adaptiveWeights };
  }

  /**
   * Reset weights to defaults
   */
  resetToDefaults(): void {
    this.adaptiveWeights = {
      gameCompatibility: 0.25,
      audienceOverlap: 0.25,
      timezoneAlignment: 0.2,
      styleMatching: 0.15,
      socialFactors: 0.1,
      performanceMetrics: 0.05,
      adaptiveBonus: 0.0,
    };

    logger.info("Algorithm weights reset to defaults");
  }

  /**
   * Analyze how well a specific factor correlates with success
   */
  private analyzeFactorSuccess(outcomes: MatchData[], factor: string): number {
    if (outcomes.length === 0) return 0.5;

    const correlations = outcomes.map((outcome) => ({
      factorScore: outcome[factor] || 0,
      successScore: outcome.successScore || 0,
    }));

    // Simple correlation calculation
    let correlation = 0;
    correlations.forEach(({ factorScore, successScore }) => {
      if (factorScore > 0.7 && successScore > 0.7) {
        correlation += 1;
      } else if (factorScore < 0.4 && successScore < 0.4) {
        correlation += 0.5;
      }
    });

    return correlation / correlations.length;
  }

  /**
   * Normalize weights to ensure they sum to approximately 1.0 and stay within bounds
   */
  private normalizeWeights(): void {
    const coreWeights = [
      "gameCompatibility",
      "audienceOverlap",
      "timezoneAlignment",
      "styleMatching",
      "socialFactors",
      "performanceMetrics",
    ] as const;

    // Ensure individual weights stay within bounds
    coreWeights.forEach((weight) => {
      this.adaptiveWeights[weight] = Math.max(
        0.05,
        Math.min(0.5, this.adaptiveWeights[weight]),
      );
    });

    // Normalize to sum to 1.0 (excluding adaptive bonus)
    const totalCoreWeight = coreWeights.reduce(
      (sum, weight) => sum + this.adaptiveWeights[weight],
      0,
    );
    const targetSum = 1.0 - this.adaptiveWeights.adaptiveBonus;

    if (totalCoreWeight > 0) {
      const scaleFactor = targetSum / totalCoreWeight;
      coreWeights.forEach((weight) => {
        this.adaptiveWeights[weight] *= scaleFactor;
      });
    }

    // Ensure adaptive bonus stays within bounds
    this.adaptiveWeights.adaptiveBonus = Math.max(
      0,
      Math.min(0.15, this.adaptiveWeights.adaptiveBonus),
    );
  }

  /**
   * Persist adaptive weights for future sessions
   */
  private persistAdaptiveWeights(): void {
    try {
      // In production, this would save to database or storage service
      logger.info("Adaptive weights persisted", {
        weights: this.adaptiveWeights,
      });

      // TODO: Add actual persistence to storage
      // await storage.saveAlgorithmWeights(this.adaptiveWeights);
    } catch (error) {
      logger.error("Failed to persist adaptive weights", { error });
    }
  }

  /**
   * Load adaptive weights from persistent storage
   */
  private async loadAdaptiveWeights(): Promise<void> {
    try {
      // In production, this would load from database or storage service
      logger.debug("Loading adaptive weights from defaults");

      // TODO: Add actual loading from storage
      // const savedWeights = await storage.getAlgorithmWeights();
      // if (savedWeights) {
      //   this.adaptiveWeights = { ...this.adaptiveWeights, ...savedWeights };
      // }
    } catch (error) {
      logger.error("Failed to load adaptive weights, using defaults", {
        error,
      });
    }
  }
}

export const aiAdaptiveWeights = AIAdaptiveWeightsService.getInstance();
