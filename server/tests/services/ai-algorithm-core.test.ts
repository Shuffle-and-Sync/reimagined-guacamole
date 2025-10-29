/**
 * AI Algorithm Core Service Tests
 * Tests for the main orchestrator service
 */

import { aiAlgorithmCore } from "../../services/ai/ai-algorithm-core.service";
import type {
  AudienceData,
  GamePreferences,
  ScheduleData,
  StreamingMetrics,
  StreamingStyleData,
} from "../../services/ai/ai-algorithm-types";

describe("AIAlgorithmCoreService", () => {
  describe("analyzeGameCompatibility", () => {
    it("should analyze game compatibility between two users", async () => {
      const userGames = ["Magic: The Gathering", "Pokemon"];
      const candidateGames = ["Pokemon", "Yu-Gi-Oh"];

      const result = await aiAlgorithmCore.analyzeGameCompatibility(
        userGames,
        candidateGames,
      );

      expect(result).toBeDefined();
      expect(result.compatibilityScore).toBeGreaterThan(0);
      expect(result.sharedGames).toContain("Pokemon");
      expect(Array.isArray(result.complementaryGames)).toBe(true);
      expect(Array.isArray(result.synergyClusters)).toBe(true);
    });

    it("should handle no shared games", async () => {
      const userGames = ["Magic: The Gathering"];
      const candidateGames = ["Hearthstone"];

      const result = await aiAlgorithmCore.analyzeGameCompatibility(
        userGames,
        candidateGames,
      );

      expect(result).toBeDefined();
      expect(result.sharedGames).toHaveLength(0);
      expect(result.compatibilityScore).toBeGreaterThan(0); // Should still have some score from synergy
    });

    it("should include user preferences in analysis", async () => {
      const userGames = ["Magic: The Gathering"];
      const candidateGames = ["Pokemon"];
      const userPreferences: GamePreferences = {
        preferredGenres: ["Strategy"],
        preferredFormats: ["Standard"],
        skillLevel: "advanced",
        competitiveLevel: "competitive",
      };
      const candidatePreferences: GamePreferences = {
        preferredGenres: ["Strategy"],
        preferredFormats: ["Standard"],
        skillLevel: "intermediate",
        competitiveLevel: "competitive",
      };

      const result = await aiAlgorithmCore.analyzeGameCompatibility(
        userGames,
        candidateGames,
        userPreferences,
        candidatePreferences,
      );

      expect(result).toBeDefined();
      expect(result.compatibilityScore).toBeGreaterThan(0);
    });
  });

  describe("analyzeAudienceOverlap", () => {
    it("should analyze audience overlap between two users", async () => {
      const userAudience: AudienceData = {
        size: 1000,
        demographics: {
          ageGroups: { "18-24": 40, "25-34": 35 },
        },
        regions: { US: 60, EU: 30 },
        interests: ["gaming", "esports"],
        engagementMetrics: {
          averageViewTime: 45,
          chatActivity: 80,
          followRate: 5,
        },
      };

      const candidateAudience: AudienceData = {
        size: 1500,
        demographics: {
          ageGroups: { "18-24": 35, "25-34": 40 },
        },
        regions: { US: 55, EU: 35 },
        interests: ["gaming", "streaming"],
        engagementMetrics: {
          averageViewTime: 50,
          chatActivity: 75,
          followRate: 6,
        },
      };

      const result = await aiAlgorithmCore.analyzeAudienceOverlap(
        userAudience,
        candidateAudience,
      );

      expect(result).toBeDefined();
      expect(result.overlapScore).toBeGreaterThan(0);
      expect(result.overlapScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.sharedDemographics)).toBe(true);
      expect(result.potentialGrowth).toBeGreaterThanOrEqual(0);
    });

    it("should include streaming metrics in analysis", async () => {
      const userAudience: AudienceData = {
        size: 1000,
        demographics: { ageGroups: {} },
        regions: {},
        interests: [],
        engagementMetrics: {
          averageViewTime: 45,
          chatActivity: 80,
          followRate: 5,
        },
      };

      const candidateAudience: AudienceData = {
        size: 1500,
        demographics: { ageGroups: {} },
        regions: {},
        interests: [],
        engagementMetrics: {
          averageViewTime: 50,
          chatActivity: 75,
          followRate: 6,
        },
      };

      const userMetrics: StreamingMetrics = {
        averageViewers: 500,
        peakViewers: 1000,
        streamDuration: 4,
        followersGained: 50,
        subscriptionConversions: 10,
        engagementRate: 0.8,
        retentionRate: 0.75,
      };

      const candidateMetrics: StreamingMetrics = {
        averageViewers: 700,
        peakViewers: 1500,
        streamDuration: 3,
        followersGained: 60,
        subscriptionConversions: 15,
        engagementRate: 0.85,
        retentionRate: 0.8,
      };

      const result = await aiAlgorithmCore.analyzeAudienceOverlap(
        userAudience,
        candidateAudience,
        userMetrics,
        candidateMetrics,
      );

      expect(result).toBeDefined();
      expect(result.engagementSynergy).toBeGreaterThan(0);
      expect(result.retentionPotential).toBeGreaterThan(0);
    });
  });

  describe("analyzeTimezoneCoordination", () => {
    it("should analyze timezone coordination between two users", async () => {
      const userSchedule: ScheduleData = {
        timeZone: "EST",
        regularHours: [
          { day: "Monday", startTime: "18:00", endTime: "22:00" },
          { day: "Wednesday", startTime: "18:00", endTime: "22:00" },
        ],
        flexibility: "medium",
        availableTimeSlots: ["18:00-22:00", "20:00-23:00"],
      };

      const candidateSchedule: ScheduleData = {
        timeZone: "PST",
        regularHours: [
          { day: "Monday", startTime: "18:00", endTime: "22:00" },
          { day: "Wednesday", startTime: "18:00", endTime: "22:00" },
        ],
        flexibility: "high",
        availableTimeSlots: ["18:00-22:00", "19:00-23:00"],
      };

      const result = await aiAlgorithmCore.analyzeTimezoneCoordination(
        userSchedule,
        candidateSchedule,
      );

      expect(result).toBeDefined();
      expect(result.compatibilityScore).toBeGreaterThan(0);
      expect(result.compatibilityScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.optimalTimeSlots)).toBe(true);
      expect(result.schedulingFlexibility).toBeGreaterThanOrEqual(0);
    });

    it("should identify timezone advantages", async () => {
      const userSchedule: ScheduleData = {
        timeZone: "EST",
        regularHours: [],
        flexibility: "medium",
        availableTimeSlots: [],
      };

      const candidateSchedule: ScheduleData = {
        timeZone: "CET",
        regularHours: [],
        flexibility: "medium",
        availableTimeSlots: [],
      };

      const result = await aiAlgorithmCore.analyzeTimezoneCoordination(
        userSchedule,
        candidateSchedule,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result.timezoneAdvantages)).toBe(true);
    });
  });

  describe("analyzeStreamingStyleMatch", () => {
    it("should analyze streaming style compatibility", async () => {
      const userStyle: StreamingStyleData = {
        pace: "medium",
        interactivity: "high",
        competitive: true,
        educational: false,
        entertainment: true,
        professional: false,
        communicationStyle: "energetic",
        contentFocus: ["gameplay", "strategy"],
      };

      const candidateStyle: StreamingStyleData = {
        pace: "fast",
        interactivity: "high",
        competitive: true,
        educational: true,
        entertainment: true,
        professional: false,
        communicationStyle: "informative",
        contentFocus: ["gameplay", "teaching"],
      };

      const result = await aiAlgorithmCore.analyzeStreamingStyleMatch(
        userStyle,
        candidateStyle,
      );

      expect(result).toBeDefined();
      expect(result.styleCompatibility).toBeGreaterThan(0);
      expect(result.styleCompatibility).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.collaborationTypes)).toBe(true);
      expect(result.paceCompatibility).toBeGreaterThanOrEqual(0);
    });

    it("should handle similar styles", async () => {
      const style: StreamingStyleData = {
        pace: "medium",
        interactivity: "medium",
        competitive: false,
        educational: true,
        entertainment: false,
        professional: true,
        communicationStyle: "professional",
        contentFocus: ["teaching"],
      };

      const result = await aiAlgorithmCore.analyzeStreamingStyleMatch(
        style,
        style,
      );

      expect(result).toBeDefined();
      expect(result.styleCompatibility).toBeGreaterThan(70); // Same style should have high compatibility
    });
  });

  describe("updateAdaptiveWeights", () => {
    it("should update weights based on collaboration outcomes", () => {
      const outcomes = [
        {
          gameCompatibilityScore: 0.8,
          audienceOverlapScore: 0.7,
          timezoneCompatibilityScore: 0.6,
          styleMatchingScore: 0.9,
          successScore: 0.85,
        },
        {
          gameCompatibilityScore: 0.75,
          audienceOverlapScore: 0.65,
          timezoneCompatibilityScore: 0.7,
          styleMatchingScore: 0.85,
          successScore: 0.8,
        },
        {
          gameCompatibilityScore: 0.7,
          audienceOverlapScore: 0.8,
          timezoneCompatibilityScore: 0.65,
          styleMatchingScore: 0.75,
          successScore: 0.75,
        },
      ];

      expect(() => {
        aiAlgorithmCore.updateAdaptiveWeights(outcomes);
      }).not.toThrow();
    });

    it("should not update weights with insufficient data", () => {
      const outcomes = [
        {
          gameCompatibilityScore: 0.8,
          successScore: 0.85,
        },
      ];

      expect(() => {
        aiAlgorithmCore.updateAdaptiveWeights(outcomes);
      }).not.toThrow();
    });
  });

  describe("getAlgorithmConfiguration", () => {
    it("should return current algorithm weights", () => {
      const config = aiAlgorithmCore.getAlgorithmConfiguration();

      expect(config).toBeDefined();
      expect(config.gameCompatibility).toBeDefined();
      expect(config.audienceOverlap).toBeDefined();
      expect(config.timezoneAlignment).toBeDefined();
      expect(config.styleMatching).toBeDefined();
      expect(config.socialFactors).toBeDefined();
      expect(config.performanceMetrics).toBeDefined();
      expect(config.adaptiveBonus).toBeDefined();
    });
  });

  describe("resetToDefaults", () => {
    it("should reset algorithm weights to defaults", () => {
      aiAlgorithmCore.resetToDefaults();
      const config = aiAlgorithmCore.getAlgorithmConfiguration();

      expect(config.gameCompatibility).toBe(0.25);
      expect(config.audienceOverlap).toBe(0.25);
      expect(config.timezoneAlignment).toBe(0.2);
      expect(config.styleMatching).toBe(0.15);
      expect(config.socialFactors).toBe(0.1);
      expect(config.performanceMetrics).toBe(0.05);
      expect(config.adaptiveBonus).toBe(0.0);
    });
  });
});
