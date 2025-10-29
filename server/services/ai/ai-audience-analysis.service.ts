/**
 * AI Audience Analysis Service
 * Handles audience overlap analysis with demographic modeling
 */

import { logger } from "../../logger";
import type {
  AudienceData,
  AudienceOverlapAnalysis,
  StreamingMetrics,
} from "./ai-algorithm-types";

export class AIAudienceAnalysisService {
  private static instance: AIAudienceAnalysisService;

  private readonly AUDIENCE_ANALYSIS_WEIGHTS = {
    demographicOverlap: 0.3,
    interestOverlap: 0.25,
    engagementSynergy: 0.2,
    growthPotential: 0.15,
    retentionPotential: 0.1,
  };

  private constructor() {
    logger.debug("AI Audience Analysis Service initialized");
  }

  public static getInstance(): AIAudienceAnalysisService {
    if (!AIAudienceAnalysisService.instance) {
      AIAudienceAnalysisService.instance = new AIAudienceAnalysisService();
    }
    return AIAudienceAnalysisService.instance;
  }

  /**
   * Advanced audience overlap analysis with demographic modeling
   */
  async analyzeOverlap(
    userAudience: AudienceData,
    candidateAudience: AudienceData,
    userMetrics?: StreamingMetrics,
    candidateMetrics?: StreamingMetrics,
  ): Promise<AudienceOverlapAnalysis> {
    try {
      // Demographic overlap analysis
      const demographicOverlap = this.calculateDemographicOverlap(
        userAudience,
        candidateAudience,
      );

      // Interest overlap
      const interestOverlap = this.calculateInterestOverlap(
        userAudience.interests || [],
        candidateAudience.interests || [],
      );

      // Engagement pattern synergy
      const engagementSynergy = this.calculateEngagementSynergy(
        userMetrics,
        candidateMetrics,
      );

      // Growth potential calculation
      const potentialGrowth = this.calculateGrowthPotential(
        userAudience,
        candidateAudience,
      );

      // Retention synergy
      const retentionPotential = this.calculateRetentionSynergy(
        userMetrics,
        candidateMetrics,
      );

      // Geographic distribution analysis
      const geographicDistribution = this.analyzeGeographicDistribution(
        userAudience.regions || {},
        candidateAudience.regions || {},
      );

      // Calculate overall overlap score
      const overlapScore =
        demographicOverlap * this.AUDIENCE_ANALYSIS_WEIGHTS.demographicOverlap +
        interestOverlap * this.AUDIENCE_ANALYSIS_WEIGHTS.interestOverlap +
        engagementSynergy * this.AUDIENCE_ANALYSIS_WEIGHTS.engagementSynergy +
        potentialGrowth * this.AUDIENCE_ANALYSIS_WEIGHTS.growthPotential +
        retentionPotential * this.AUDIENCE_ANALYSIS_WEIGHTS.retentionPotential;

      return {
        overlapScore: Math.min(100, overlapScore * 100),
        sharedDemographics: this.identifySharedDemographics(
          userAudience,
          candidateAudience,
        ),
        complementaryAudiences: this.identifyComplementaryAudiences(
          userAudience,
          candidateAudience,
        ),
        potentialGrowth: potentialGrowth * 100,
        engagementSynergy: engagementSynergy * 100,
        retentionPotential: retentionPotential * 100,
        geographicDistribution,
      };
    } catch (error) {
      logger.error("Audience overlap analysis failed", {
        error,
        userAudienceSize: userAudience?.size,
        candidateAudienceSize: candidateAudience?.size,
      });
      return {
        overlapScore: 40,
        sharedDemographics: [],
        complementaryAudiences: [],
        potentialGrowth: 30,
        engagementSynergy: 50,
        retentionPotential: 40,
        geographicDistribution: {},
      };
    }
  }

  private calculateDemographicOverlap(
    userAudience: AudienceData,
    candidateAudience: AudienceData,
  ): number {
    const userDemo = userAudience.demographics || {};
    const candidateDemo = candidateAudience.demographics || {};

    // Age group overlap
    const ageOverlap = this.calculateAgeOverlap(
      userDemo.ageGroups,
      candidateDemo.ageGroups,
    );

    // Geographic overlap
    const geoOverlap = this.calculateGeographicOverlap(
      userAudience.regions,
      candidateAudience.regions,
    );

    return ageOverlap * 0.6 + geoOverlap * 0.4;
  }

  private calculateAgeOverlap(
    userAges: Record<string, number>,
    candidateAges: Record<string, number>,
  ): number {
    if (!userAges || !candidateAges) return 0.5;

    const ageGroups = ["13-17", "18-24", "25-34", "35-44", "45+"];
    let overlap = 0;
    let total = 0;

    ageGroups.forEach((group) => {
      const userPct = userAges[group] || 0;
      const candidatePct = candidateAges[group] || 0;
      overlap += Math.min(userPct, candidatePct);
      total += Math.max(userPct, candidatePct);
    });

    return total > 0 ? overlap / total : 0.5;
  }

  private calculateGeographicOverlap(
    userRegions: Record<string, number>,
    candidateRegions: Record<string, number>,
  ): number {
    if (!userRegions || !candidateRegions) return 0.5;

    const allRegions = new Set([
      ...Object.keys(userRegions),
      ...Object.keys(candidateRegions),
    ]);
    let overlap = 0;
    let total = 0;

    allRegions.forEach((region) => {
      const userPct = userRegions[region] || 0;
      const candidatePct = candidateRegions[region] || 0;
      overlap += Math.min(userPct, candidatePct);
      total += Math.max(userPct, candidatePct);
    });

    return total > 0 ? overlap / total : 0.5;
  }

  private calculateInterestOverlap(
    userInterests: string[],
    candidateInterests: string[],
  ): number {
    if (!userInterests.length || !candidateInterests.length) return 0.3;

    const sharedInterests = userInterests.filter((interest) =>
      candidateInterests.includes(interest),
    );
    const allInterests = Array.from(
      new Set([...userInterests, ...candidateInterests]),
    );

    return sharedInterests.length / allInterests.length;
  }

  private calculateEngagementSynergy(
    userMetrics?: StreamingMetrics,
    candidateMetrics?: StreamingMetrics,
  ): number {
    if (!userMetrics || !candidateMetrics) return 0.5;

    const userEngagement = userMetrics.engagementRate || 0;
    const candidateEngagement = candidateMetrics.engagementRate || 0;

    // Similar engagement rates suggest compatible audience styles
    const engagementDiff = Math.abs(userEngagement - candidateEngagement);
    const engagementCompatibility = 1 - engagementDiff;

    return Math.max(0, Math.min(1, engagementCompatibility));
  }

  private calculateGrowthPotential(
    userAudience: AudienceData,
    candidateAudience: AudienceData,
  ): number {
    const sizeDiff = Math.abs(userAudience.size - candidateAudience.size);
    const avgSize = (userAudience.size + candidateAudience.size) / 2;

    // Higher growth potential when audiences are different sizes
    const sizeDiversity = avgSize > 0 ? sizeDiff / avgSize : 0;

    // Interest diversity
    const allInterests = new Set([
      ...(userAudience.interests || []),
      ...(candidateAudience.interests || []),
    ]);
    const sharedInterests = (userAudience.interests || []).filter((interest) =>
      (candidateAudience.interests || []).includes(interest),
    );
    const interestDiversity =
      allInterests.size > 0
        ? (allInterests.size - sharedInterests.length) / allInterests.size
        : 0;

    return sizeDiversity * 0.4 + interestDiversity * 0.6;
  }

  private calculateRetentionSynergy(
    userMetrics?: StreamingMetrics,
    candidateMetrics?: StreamingMetrics,
  ): number {
    if (!userMetrics || !candidateMetrics) return 0.6;

    const userRetention = userMetrics.retentionRate || 0;
    const candidateRetention = candidateMetrics.retentionRate || 0;

    // Similar retention rates suggest compatible content quality
    const retentionDiff = Math.abs(userRetention - candidateRetention);
    const retentionCompatibility = 1 - retentionDiff * 0.5;

    return Math.max(0, Math.min(1, retentionCompatibility));
  }

  private analyzeGeographicDistribution(
    userRegions: Record<string, number>,
    candidateRegions: Record<string, number>,
  ): Record<string, number> {
    const distribution: Record<string, number> = {};
    const allRegions = new Set([
      ...Object.keys(userRegions),
      ...Object.keys(candidateRegions),
    ]);

    allRegions.forEach((region) => {
      const userPct = userRegions[region] || 0;
      const candidatePct = candidateRegions[region] || 0;
      distribution[region] = (userPct + candidatePct) / 2;
    });

    return distribution;
  }

  private identifySharedDemographics(
    userAudience: AudienceData,
    candidateAudience: AudienceData,
  ): string[] {
    const shared: string[] = [];
    const userAges = userAudience.demographics?.ageGroups || {};
    const candidateAges = candidateAudience.demographics?.ageGroups || {};

    Object.keys(userAges).forEach((ageGroup) => {
      const userAge = userAges[ageGroup];
      const candidateAge = candidateAges[ageGroup];
      if (userAge && candidateAge && userAge > 20 && candidateAge > 20) {
        shared.push(`${ageGroup} age group`);
      }
    });

    return shared;
  }

  private identifyComplementaryAudiences(
    userAudience: AudienceData,
    candidateAudience: AudienceData,
  ): string[] {
    const complementary: string[] = [];
    const userStrengths = this.identifyAudienceStrengths(userAudience);
    const candidateStrengths =
      this.identifyAudienceStrengths(candidateAudience);

    userStrengths.forEach((strength) => {
      if (!candidateStrengths.includes(strength)) {
        complementary.push(`User strength: ${strength}`);
      }
    });

    candidateStrengths.forEach((strength) => {
      if (!userStrengths.includes(strength)) {
        complementary.push(`Candidate strength: ${strength}`);
      }
    });

    return complementary.slice(0, 5);
  }

  private identifyAudienceStrengths(audience: AudienceData): string[] {
    const strengths: string[] = [];
    const demo = audience.demographics || { ageGroups: {} };

    if (demo.ageGroups?.["18-24"] && demo.ageGroups["18-24"] > 40)
      strengths.push("Young Adult");
    if (demo.ageGroups?.["25-34"] && demo.ageGroups["25-34"] > 35)
      strengths.push("Professional");
    if (audience.regions?.US && audience.regions.US > 50)
      strengths.push("US Market");
    if (audience.regions?.EU && audience.regions.EU > 30)
      strengths.push("EU Market");

    return strengths;
  }
}

export const aiAudienceAnalysis = AIAudienceAnalysisService.getInstance();
