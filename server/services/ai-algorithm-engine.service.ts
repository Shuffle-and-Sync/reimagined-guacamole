/**
 * AI Algorithm Engine for Advanced Streaming Partner Matching
 *
 * Provides sophisticated algorithms for:
 * - Game type compatibility analysis with cross-genre synergy
 * - Audience overlap calculation with demographic modeling
 * - Advanced time zone coordination with global scheduling
 * - Streaming style preference matching with behavioral analysis
 * - Machine learning-inspired scoring with adaptive weights
 */

import { logger } from "../logger";

// Core algorithm interfaces
export interface GameCompatibilityResult {
  compatibilityScore: number;
  sharedGames: string[];
  complementaryGames: string[];
  synergyClusters: string[];
  crossGenreOpportunities: string[];
  contentMixPotential: number;
}

export interface AudienceOverlapAnalysis {
  overlapScore: number;
  sharedDemographics: string[];
  complementaryAudiences: string[];
  potentialGrowth: number;
  engagementSynergy: number;
  retentionPotential: number;
  geographicDistribution: Record<string, number>;
}

export interface TimeZoneCoordination {
  compatibilityScore: number;
  optimalTimeSlots: string[];
  conflictAreas: string[];
  schedulingFlexibility: number;
  globalReachPotential: number;
  weekendOpportunities: string[];
  timezoneAdvantages: string[];
}

export interface StreamingStyleMatch {
  styleCompatibility: number;
  contentSynergy: number;
  communicationAlignment: number;
  paceCompatibility: number;
  audienceEngagementStyle: string;
  collaborationTypes: string[];
  streamingPersonalities: string[];
}

export interface AlgorithmWeights {
  gameCompatibility: number;
  audienceOverlap: number;
  timezoneAlignment: number;
  styleMatching: number;
  socialFactors: number;
  performanceMetrics: number;
  adaptiveBonus: number;
}

export interface GamePreferences {
  preferredGenres: string[];
  preferredFormats: string[];
  skillLevel: "beginner" | "intermediate" | "advanced" | "expert";
  competitiveLevel: "casual" | "competitive" | "professional";
}

export interface AudienceData {
  size: number;
  demographics: {
    ageGroups: Record<string, number>;
  };
  regions: Record<string, number>;
  interests: string[];
  engagementMetrics: {
    averageViewTime: number;
    chatActivity: number;
    followRate: number;
  };
}

export interface StreamingMetrics {
  averageViewers: number;
  peakViewers: number;
  streamDuration: number;
  followersGained: number;
  subscriptionConversions: number;
  engagementRate?: number;
  retentionRate?: number;
}

export interface ScheduleData {
  timeZone: string;
  regularHours: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  availability: {
    flexibleHours: boolean;
    advanceNotice: number; // hours
    maxCollabHours: number; // per week
  };
  weeklySchedule?: Record<string, Array<{ start: string; end: string }>>;
}

export interface UserProfile {
  id: string;
  streamingPlatforms: string[];
  gamePreferences: string[];
  schedulingPreferences: {
    timeZone: string;
    availableHours: number[];
    preferredDays: string[];
  };
  audienceSize: number;
  engagementRate: number;
  reputation: number;
}

export interface MatchData {
  matchId: string;
  participants: string[];
  outcome: "successful" | "failed" | "cancelled";
  rating: number;
  feedback?: string;
  timestamp: Date;
}

export interface AdvancedMatchingCriteria {
  userId: string;
  candidateId: string;
  userProfile: UserProfile;
  candidateProfile: UserProfile;
  contextualFactors?: {
    seasonality?: string;
    trendingGames?: string[];
    currentEvents?: string[];
    platformPromotions?: string[];
  };
  learningFactors?: {
    previousMatches?: MatchData[];
    successPatterns?: MatchData[];
    userFeedback?: MatchData[];
  };
}

// Types for streaming analytics and style matching
export interface StreamingStyleData {
  contentType?: string;
  interactionLevel?: string;
  streamPace?: string;
  contentMix?: string[];
  personality?: string;
  productionQuality?: string;
  chatEngagement?: string;
  streamFormat?: string;
  [key: string]: unknown; // Allow additional analytics fields
}

export interface StreamerHistoryData {
  pastCollaborations?: number;
  successRate?: number;
  viewerRetention?: number;
  averageStreamLength?: number;
  [key: string]: unknown; // Allow additional history fields
}

export interface AudienceAnalytics {
  ageGroups?: Record<string, number>;
  interests?: string[];
  regions?: Record<string, number>;
  engagementMetrics?: {
    averageViewTime?: number;
    chatActivity?: number;
    followRate?: number;
  };
  [key: string]: unknown; // Allow additional audience metrics
}

export interface ScheduleAnalytics {
  timeZone?: string;
  regularHours?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
  preferredDays?: string[];
  flexibleHours?: boolean;
  [key: string]: unknown; // Allow additional schedule fields
}

export interface PerformanceMetrics {
  averageViewers?: number;
  peakViewers?: number;
  streamDuration?: number;
  followersGained?: number;
  subscriptionConversions?: number;
  growthRate?: number;
  retentionRate?: number;
  [key: string]: unknown; // Allow additional metrics
}

/**
 * Advanced AI Algorithm Engine for Streaming Compatibility
 */
export class AIAlgorithmEngine {
  private static instance: AIAlgorithmEngine;

  // Algorithm configuration
  private readonly GAME_COMPATIBILITY_WEIGHTS = {
    directMatch: 0.4, // Same games
    genreSynergy: 0.25, // Related genres
    crossGenre: 0.15, // Cross-genre opportunities
    contentMix: 0.12, // Content variety potential
    trendsAlignment: 0.08, // Trending game alignment
  };

  private readonly AUDIENCE_ANALYSIS_WEIGHTS = {
    demographic: 0.3, // Age, gender, location overlap
    interest: 0.25, // Gaming interests
    engagement: 0.2, // Activity patterns
    growth: 0.15, // Mutual growth potential
    retention: 0.1, // Audience retention synergy
  };

  private readonly TIMEZONE_FACTORS = {
    optimalOverlap: 0.4, // Perfect time overlap
    flexibilityBonus: 0.25, // Scheduling flexibility
    globalReach: 0.2, // Combined global coverage
    weekendSynergy: 0.15, // Weekend opportunities
  };

  private readonly STYLE_MATCHING_FACTORS = {
    contentDelivery: 0.3, // How they present content
    interaction: 0.25, // Audience interaction style
    pacing: 0.2, // Stream pacing and energy
    personality: 0.15, // Personality compatibility
    collaboration: 0.1, // Previous collaboration style
  };

  // Machine learning inspired adaptive weights
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
    logger.info(
      "AI Algorithm Engine initialized with advanced matching algorithms",
    );
  }

  public static getInstance(): AIAlgorithmEngine {
    if (!AIAlgorithmEngine.instance) {
      AIAlgorithmEngine.instance = new AIAlgorithmEngine();
    }
    return AIAlgorithmEngine.instance;
  }

  /**
   * Comprehensive game compatibility analysis with cross-genre synergy
   */
  async analyzeGameCompatibility(
    userGames: string[],
    candidateGames: string[],
    _userPreferences?: GamePreferences,
    _candidatePreferences?: GamePreferences,
  ): Promise<GameCompatibilityResult> {
    try {
      // Direct game matches
      const sharedGames = userGames.filter((game) =>
        candidateGames.includes(game),
      );
      const directMatchScore =
        sharedGames.length / Math.max(userGames.length, candidateGames.length);

      // Genre synergy analysis
      const userGenres = this.extractGameGenres(userGames);
      const candidateGenres = this.extractGameGenres(candidateGames);
      const genreSynergy = this.calculateGenreSynergy(
        userGenres,
        candidateGenres,
      );

      // Cross-genre opportunities
      const crossGenreOpportunities = this.identifyCrossGenreOpportunities(
        userGenres,
        candidateGenres,
      );

      // Content mix potential
      const contentMixPotential = this.calculateContentMixPotential(
        userGames,
        candidateGames,
      );

      // Trending games alignment
      const trendingAlignment = await this.calculateTrendingAlignment(
        userGames,
        candidateGames,
      );

      // Complementary games (different but synergistic)
      const complementaryGames = this.findComplementaryGames(
        userGames,
        candidateGames,
      );

      // Calculate weighted compatibility score
      const compatibilityScore =
        directMatchScore * this.GAME_COMPATIBILITY_WEIGHTS.directMatch +
        genreSynergy * this.GAME_COMPATIBILITY_WEIGHTS.genreSynergy +
        crossGenreOpportunities.length *
          0.1 *
          this.GAME_COMPATIBILITY_WEIGHTS.crossGenre +
        contentMixPotential * this.GAME_COMPATIBILITY_WEIGHTS.contentMix +
        trendingAlignment * this.GAME_COMPATIBILITY_WEIGHTS.trendsAlignment;

      return {
        compatibilityScore: Math.min(100, compatibilityScore * 100),
        sharedGames,
        complementaryGames,
        synergyClusters: this.identifySynergyClusters(
          userGames,
          candidateGames,
        ),
        crossGenreOpportunities,
        contentMixPotential: contentMixPotential * 100,
      };
    } catch (error) {
      logger.error("Game compatibility analysis failed", {
        error,
        userGames,
        candidateGames,
      });
      return {
        compatibilityScore: 30, // Conservative fallback
        sharedGames: [],
        complementaryGames: [],
        synergyClusters: [],
        crossGenreOpportunities: [],
        contentMixPotential: 20,
      };
    }
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
        userMetrics || ({} as StreamingMetrics),
        candidateMetrics || ({} as StreamingMetrics),
      );

      // Growth potential calculation
      const potentialGrowth = this.calculateGrowthPotential(
        userAudience,
        candidateAudience,
      );

      // Retention synergy
      const retentionPotential = this.calculateRetentionSynergy(
        userMetrics || ({} as StreamingMetrics),
        candidateMetrics || ({} as StreamingMetrics),
      );

      // Geographic distribution analysis
      const geographicDistribution = this.analyzeGeographicDistribution(
        userAudience.regions || {},
        candidateAudience.regions || {},
      );

      // Weighted overlap score
      const overlapScore =
        demographicOverlap * this.AUDIENCE_ANALYSIS_WEIGHTS.demographic +
        interestOverlap * this.AUDIENCE_ANALYSIS_WEIGHTS.interest +
        engagementSynergy * this.AUDIENCE_ANALYSIS_WEIGHTS.engagement +
        potentialGrowth * this.AUDIENCE_ANALYSIS_WEIGHTS.growth +
        retentionPotential * this.AUDIENCE_ANALYSIS_WEIGHTS.retention;

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
      logger.error("Audience overlap analysis failed", { error });
      return {
        overlapScore: 40,
        sharedDemographics: [],
        complementaryAudiences: [],
        potentialGrowth: 30,
        engagementSynergy: 35,
        retentionPotential: 40,
        geographicDistribution: {},
      };
    }
  }

  /**
   * Advanced timezone coordination with global scheduling optimization
   */
  async analyzeTimezoneCoordination(
    userSchedule: ScheduleData,
    candidateSchedule: ScheduleData,
    userTimezone: string = "UTC",
    candidateTimezone: string = "UTC",
  ): Promise<TimeZoneCoordination> {
    try {
      // Calculate timezone offset
      const timezoneOffset = this.calculateTimezoneOffset(
        userTimezone,
        candidateTimezone,
      );

      // Find optimal overlapping time slots
      const optimalTimeSlots = this.findOptimalTimeSlots(
        userSchedule,
        candidateSchedule,
        timezoneOffset,
      );

      // Identify scheduling conflicts
      const conflictAreas = this.identifySchedulingConflicts(
        userSchedule,
        candidateSchedule,
        timezoneOffset,
      );

      // Calculate scheduling flexibility
      const schedulingFlexibility = this.calculateSchedulingFlexibility(
        userSchedule,
        candidateSchedule,
      );

      // Global reach potential
      const globalReachPotential = this.calculateGlobalReachPotential(
        userTimezone,
        candidateTimezone,
        optimalTimeSlots,
      );

      // Weekend collaboration opportunities
      const weekendOpportunities = this.findWeekendOpportunities(
        userSchedule,
        candidateSchedule,
        timezoneOffset,
      );

      // Timezone advantages for different regions
      const timezoneAdvantages = this.identifyTimezoneAdvantages(
        userTimezone,
        candidateTimezone,
      );

      // Calculate weighted compatibility score
      const compatibilityScore =
        optimalTimeSlots.length * 0.15 * this.TIMEZONE_FACTORS.optimalOverlap +
        schedulingFlexibility * this.TIMEZONE_FACTORS.flexibilityBonus +
        globalReachPotential * this.TIMEZONE_FACTORS.globalReach +
        weekendOpportunities.length *
          0.1 *
          this.TIMEZONE_FACTORS.weekendSynergy;

      return {
        compatibilityScore: Math.min(100, compatibilityScore * 100),
        optimalTimeSlots,
        conflictAreas,
        schedulingFlexibility: schedulingFlexibility * 100,
        globalReachPotential: globalReachPotential * 100,
        weekendOpportunities,
        timezoneAdvantages,
      };
    } catch (error) {
      logger.error("Timezone coordination analysis failed", { error });
      return {
        compatibilityScore: 50,
        optimalTimeSlots: [],
        conflictAreas: [],
        schedulingFlexibility: 40,
        globalReachPotential: 30,
        weekendOpportunities: [],
        timezoneAdvantages: [],
      };
    }
  }

  /**
   * Streaming style compatibility with behavioral analysis
   */
  async analyzeStreamingStyleMatch(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
    _userHistory?: StreamerHistoryData,
    _candidateHistory?: StreamerHistoryData,
  ): Promise<StreamingStyleMatch> {
    try {
      // Content delivery style compatibility
      const contentDelivery = this.calculateContentDeliveryCompatibility(
        userStyle,
        candidateStyle,
      );

      // Interaction style alignment
      const communicationAlignment = this.calculateCommunicationAlignment(
        userStyle,
        candidateStyle,
      );

      // Stream pacing compatibility
      const paceCompatibility = this.calculatePaceCompatibility(
        userStyle,
        candidateStyle,
      );

      // Audience engagement style
      const audienceEngagementStyle = this.determineAudienceEngagementStyle(
        userStyle,
        candidateStyle,
      );

      // Collaboration types suitability
      const collaborationTypes = this.identifyCollaborationTypes(
        userStyle,
        candidateStyle,
      );

      // Streaming personality analysis
      const streamingPersonalities = this.analyzeStreamingPersonalities(
        userStyle,
        candidateStyle,
      );

      // Content synergy potential
      const contentSynergy = this.calculateContentSynergy(
        userStyle,
        candidateStyle,
      );

      // Weighted style compatibility
      const styleCompatibility =
        contentDelivery * this.STYLE_MATCHING_FACTORS.contentDelivery +
        communicationAlignment * this.STYLE_MATCHING_FACTORS.interaction +
        paceCompatibility * this.STYLE_MATCHING_FACTORS.pacing +
        this.getPersonalityScore(streamingPersonalities) *
          this.STYLE_MATCHING_FACTORS.personality +
        this.getCollaborationScore(collaborationTypes) *
          this.STYLE_MATCHING_FACTORS.collaboration;

      return {
        styleCompatibility: Math.min(100, styleCompatibility * 100),
        contentSynergy: contentSynergy * 100,
        communicationAlignment: communicationAlignment * 100,
        paceCompatibility: paceCompatibility * 100,
        audienceEngagementStyle,
        collaborationTypes,
        streamingPersonalities,
      };
    } catch (error) {
      logger.error("Streaming style analysis failed", { error });
      return {
        styleCompatibility: 60,
        contentSynergy: 55,
        communicationAlignment: 60,
        paceCompatibility: 65,
        audienceEngagementStyle: "moderate",
        collaborationTypes: ["casual"],
        streamingPersonalities: ["friendly"],
      };
    }
  }

  // Private helper methods for game compatibility

  private extractGameGenres(games: string[]): string[] {
    const genreMap: Record<string, string> = {
      "Magic: The Gathering": "Strategy",
      Pokemon: "Strategy",
      "Yu-Gi-Oh": "Strategy",
      Lorcana: "Strategy",
      Hearthstone: "Strategy",
      "Legends of Runeterra": "Strategy",
      Gwent: "Strategy",
      "Slay the Spire": "Roguelike",
      "Monster Train": "Strategy",
      Inscryption: "Puzzle",
    };

    const genres = games.map((game) => genreMap[game] || "Other");
    return Array.from(new Set(genres));
  }

  private calculateGenreSynergy(
    userGenres: string[],
    candidateGenres: string[],
  ): number {
    const commonGenres = userGenres.filter((genre) =>
      candidateGenres.includes(genre),
    );
    const allGenres = [...userGenres, ...candidateGenres];
    const uniqueGenres = Array.from(new Set(allGenres));
    const totalGenres = uniqueGenres.length;
    return totalGenres > 0 ? commonGenres.length / totalGenres : 0;
  }

  private identifyCrossGenreOpportunities(
    userGenres: string[],
    candidateGenres: string[],
  ): string[] {
    const synergisticPairs: [string, string][] = [
      ["Strategy", "Roguelike"],
      ["Strategy", "Puzzle"],
      ["Roguelike", "Puzzle"],
    ];

    const opportunities: string[] = [];
    synergisticPairs.forEach(([genre1, genre2]) => {
      if (
        (userGenres.includes(genre1) && candidateGenres.includes(genre2)) ||
        (userGenres.includes(genre2) && candidateGenres.includes(genre1))
      ) {
        opportunities.push(`${genre1} + ${genre2} Crossover`);
      }
    });

    return opportunities;
  }

  private calculateContentMixPotential(
    userGames: string[],
    candidateGames: string[],
  ): number {
    const allGames = [...userGames, ...candidateGames];
    const uniqueGames = Array.from(new Set(allGames));
    const sharedGames = userGames.filter((game) =>
      candidateGames.includes(game),
    );

    // Higher potential when there's both overlap and diversity
    const overlapRatio =
      sharedGames.length / Math.min(userGames.length, candidateGames.length);
    const diversityRatio =
      (uniqueGames.length - sharedGames.length) / uniqueGames.length;

    return overlapRatio * 0.6 + diversityRatio * 0.4;
  }

  private async calculateTrendingAlignment(
    userGames: string[],
    candidateGames: string[],
  ): Promise<number> {
    // Simulated trending games - in production this would come from external APIs
    const trendingGames = ["Magic: The Gathering", "Pokemon", "Lorcana"];

    const userTrendingCount = userGames.filter((game) =>
      trendingGames.includes(game),
    ).length;
    const candidateTrendingCount = candidateGames.filter((game) =>
      trendingGames.includes(game),
    ).length;

    return (
      Math.min(userTrendingCount, candidateTrendingCount) / trendingGames.length
    );
  }

  private findComplementaryGames(
    userGames: string[],
    candidateGames: string[],
  ): string[] {
    // Games that work well together but aren't the same
    const complementaryPairs: Record<string, string[]> = {
      "Magic: The Gathering": ["Yu-Gi-Oh", "Pokemon"],
      Pokemon: ["Magic: The Gathering", "Lorcana"],
      "Yu-Gi-Oh": ["Magic: The Gathering", "Pokemon"],
      Lorcana: ["Pokemon", "Magic: The Gathering"],
    };

    const complementary: string[] = [];
    userGames.forEach((userGame) => {
      const pairs = complementaryPairs[userGame] || [];
      pairs.forEach((pair) => {
        if (candidateGames.includes(pair) && !complementary.includes(pair)) {
          complementary.push(pair);
        }
      });
    });

    return complementary;
  }

  private identifySynergyClusters(
    userGames: string[],
    candidateGames: string[],
  ): string[] {
    const clusters = [
      {
        name: "TCG Masters",
        games: ["Magic: The Gathering", "Pokemon", "Yu-Gi-Oh"],
      },
      {
        name: "Modern Strategy",
        games: ["Lorcana", "Hearthstone", "Legends of Runeterra"],
      },
      {
        name: "Digital Innovators",
        games: ["Hearthstone", "Legends of Runeterra", "Gwent"],
      },
    ];

    return clusters
      .filter((cluster) => {
        const userMatches = userGames.filter((game) =>
          cluster.games.includes(game),
        ).length;
        const candidateMatches = candidateGames.filter((game) =>
          cluster.games.includes(game),
        ).length;
        return userMatches >= 1 && candidateMatches >= 1;
      })
      .map((cluster) => cluster.name);
  }

  // Private helper methods for audience analysis

  private calculateDemographicOverlap(
    userAudience: AudienceData,
    candidateAudience: AudienceData,
  ): number {
    // Simplified demographic overlap calculation
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
    if (!userAges || !candidateAges) return 0.5; // Default moderate overlap

    const ageGroups = ["13-17", "18-24", "25-34", "35-44", "45+"];
    let overlap = 0;
    let total = 0;

    ageGroups.forEach((group) => {
      const userPct = userAges[group] || 0;
      const candidatePct = candidateAges[group] || 0;
      overlap += Math.min(userPct, candidatePct);
      total += Math.max(userPct, candidatePct);
    });

    return total > 0 ? overlap / total : 0;
  }

  private calculateGeographicOverlap(
    userRegions: Record<string, number>,
    candidateRegions: Record<string, number>,
  ): number {
    if (!userRegions || !candidateRegions) return 0.5;

    const regions = ["US", "EU", "APAC", "LATAM", "OTHER"];
    let overlap = 0;
    let total = 0;

    regions.forEach((region) => {
      const userPct = userRegions[region] || 0;
      const candidatePct = candidateRegions[region] || 0;
      overlap += Math.min(userPct, candidatePct);
      total += Math.max(userPct, candidatePct);
    });

    return total > 0 ? overlap / total : 0;
  }

  private calculateInterestOverlap(
    userInterests: string[],
    candidateInterests: string[],
  ): number {
    if (!userInterests.length || !candidateInterests.length) return 0.3;

    const commonInterests = userInterests.filter((interest) =>
      candidateInterests.includes(interest),
    );
    const allInterests = [...userInterests, ...candidateInterests];
    const uniqueInterests = Array.from(new Set(allInterests));
    const totalInterests = uniqueInterests.length;

    return totalInterests > 0 ? commonInterests.length / totalInterests : 0;
  }

  private calculateEngagementSynergy(
    userMetrics: StreamingMetrics,
    candidateMetrics: StreamingMetrics,
  ): number {
    if (!userMetrics || !candidateMetrics) return 0.5;

    const userEngagement = userMetrics.engagementRate || 50;
    const candidateEngagement = candidateMetrics.engagementRate || 50;

    // Higher synergy when engagement rates are similar
    const difference = Math.abs(userEngagement - candidateEngagement);
    return Math.max(0, 1 - difference / 100);
  }

  private calculateGrowthPotential(
    userAudience: AudienceData,
    candidateAudience: AudienceData,
  ): number {
    // Simulate growth potential based on audience complementarity
    const userSize = userAudience.size || 100;
    const candidateSize = candidateAudience.size || 100;

    // Better growth potential when audiences are different sizes but compatible
    const sizeDifference =
      Math.abs(userSize - candidateSize) / Math.max(userSize, candidateSize);
    const complementarity =
      1 - this.calculateDemographicOverlap(userAudience, candidateAudience);

    return sizeDifference * 0.4 + complementarity * 0.6;
  }

  private calculateRetentionSynergy(
    userMetrics: StreamingMetrics,
    candidateMetrics: StreamingMetrics,
  ): number {
    if (!userMetrics || !candidateMetrics) return 0.6;

    const userRetention = userMetrics.retentionRate || 70;
    const candidateRetention = candidateMetrics.retentionRate || 70;

    // Synergy when both have good retention or can help each other improve
    const avgRetention = (userRetention + candidateRetention) / 2;
    const synergy = avgRetention / 100;

    return Math.min(1, synergy);
  }

  private analyzeGeographicDistribution(
    userRegions: Record<string, number>,
    candidateRegions: Record<string, number>,
  ): Record<string, number> {
    const combined: Record<string, number> = {};
    const regions = ["US", "EU", "APAC", "LATAM", "OTHER"];

    regions.forEach((region) => {
      const userPct = userRegions[region] || 0;
      const candidatePct = candidateRegions[region] || 0;
      combined[region] = (userPct + candidatePct) / 2;
    });

    return combined;
  }

  private identifySharedDemographics(
    userAudience: AudienceData,
    candidateAudience: AudienceData,
  ): string[] {
    const shared: string[] = [];

    // Age demographics
    const userAges = userAudience.demographics?.ageGroups || {};
    const candidateAges = candidateAudience.demographics?.ageGroups || {};

    Object.keys(userAges).forEach((ageGroup) => {
      if (userAges[ageGroup] > 20 && candidateAges[ageGroup] > 20) {
        shared.push(`Age ${ageGroup}`);
      }
    });

    return shared;
  }

  private identifyComplementaryAudiences(
    userAudience: AudienceData,
    candidateAudience: AudienceData,
  ): string[] {
    const complementary: string[] = [];

    // Identify audiences that complement each other
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

    return complementary;
  }

  private identifyAudienceStrengths(audience: AudienceData): string[] {
    const strengths: string[] = [];
    const demo = audience.demographics || {};

    if (demo.ageGroups?.["18-24"] > 40) strengths.push("Young Adult");
    if (demo.ageGroups?.["25-34"] > 35) strengths.push("Professional");
    if (audience.regions?.US > 50) strengths.push("US Market");
    if (audience.regions?.EU > 30) strengths.push("EU Market");

    return strengths;
  }

  // Private helper methods for timezone analysis

  private calculateTimezoneOffset(userTz: string, candidateTz: string): number {
    // Simplified timezone offset calculation
    const timezoneOffsets: Record<string, number> = {
      UTC: 0,
      EST: -5,
      PST: -8,
      CET: 1,
      JST: 9,
      AEST: 10,
    };

    const userOffset = timezoneOffsets[userTz] || 0;
    const candidateOffset = timezoneOffsets[candidateTz] || 0;

    return Math.abs(userOffset - candidateOffset);
  }

  private findOptimalTimeSlots(
    userSchedule: ScheduleData,
    candidateSchedule: ScheduleData,
    timezoneOffset: number,
  ): string[] {
    const optimalSlots: string[] = [];

    // Simplified schedule analysis
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    days.forEach((day) => {
      const userSlots = userSchedule?.weeklySchedule?.[day] || [];
      const candidateSlots = candidateSchedule?.weeklySchedule?.[day] || [];

      userSlots.forEach((userSlot: { start: string; end: string }) => {
        candidateSlots.forEach(
          (candidateSlot: { start: string; end: string }) => {
            if (
              this.isTimeSlotCompatible(
                `${userSlot.start}-${userSlot.end}`,
                `${candidateSlot.start}-${candidateSlot.end}`,
                timezoneOffset,
              )
            ) {
              optimalSlots.push(`${day}: ${userSlot} / ${candidateSlot}`);
            }
          },
        );
      });
    });

    return optimalSlots;
  }

  private isTimeSlotCompatible(
    _userSlot: string,
    _candidateSlot: string,
    offset: number,
  ): boolean {
    // Simplified time compatibility check
    // In production, this would parse actual times and apply timezone math
    return offset <= 8; // Max 8 hour difference for reasonable compatibility
  }

  private identifySchedulingConflicts(
    _userSchedule: ScheduleData,
    _candidateSchedule: ScheduleData,
    timezoneOffset: number,
  ): string[] {
    const conflicts: string[] = [];

    if (timezoneOffset > 12) {
      conflicts.push("Major timezone difference");
    }

    if (timezoneOffset > 8) {
      conflicts.push("Limited overlap hours");
    }

    return conflicts;
  }

  private calculateSchedulingFlexibility(
    userSchedule: ScheduleData,
    candidateSchedule: ScheduleData,
  ): number {
    const userFlexibility = userSchedule?.availability?.advanceNotice || 24;
    const candidateFlexibility =
      candidateSchedule?.availability?.advanceNotice || 24;

    // Higher flexibility when both can schedule with short notice
    const avgFlexibility = (userFlexibility + candidateFlexibility) / 2;
    return Math.max(0, 1 - avgFlexibility / 168); // 168 hours in a week
  }

  private calculateGlobalReachPotential(
    userTz: string,
    candidateTz: string,
    _optimalSlots: string[],
  ): number {
    // Assess how well their combined timezones cover global audiences
    const regions: string[] = [];

    // Add timezone coverage
    if (userTz.includes("EST") || userTz.includes("PST"))
      regions.push("Americas");
    if (userTz.includes("CET") || userTz.includes("GMT"))
      regions.push("Europe");
    if (userTz.includes("JST") || userTz.includes("AEST")) regions.push("Asia");

    if (candidateTz.includes("EST") || candidateTz.includes("PST"))
      regions.push("Americas");
    if (candidateTz.includes("CET") || candidateTz.includes("GMT"))
      regions.push("Europe");
    if (candidateTz.includes("JST") || candidateTz.includes("AEST"))
      regions.push("Asia");

    const uniqueRegions = Array.from(new Set(regions));
    return uniqueRegions.length / 3; // Max 3 major regions
  }

  private findWeekendOpportunities(
    userSchedule: ScheduleData,
    candidateSchedule: ScheduleData,
    _timezoneOffset: number,
  ): string[] {
    const weekendSlots: string[] = [];

    ["saturday", "sunday"].forEach((day) => {
      const userSlots = userSchedule?.weeklySchedule?.[day] || [];
      const candidateSlots = candidateSchedule?.weeklySchedule?.[day] || [];

      if (userSlots.length > 0 && candidateSlots.length > 0) {
        weekendSlots.push(`${day}: Extended collaboration opportunity`);
      }
    });

    return weekendSlots;
  }

  private identifyTimezoneAdvantages(
    userTz: string,
    candidateTz: string,
  ): string[] {
    const advantages: string[] = [];

    if (userTz !== candidateTz) {
      advantages.push("Extended coverage hours");
      advantages.push("Follow-the-sun content delivery");
    }

    if (this.calculateTimezoneOffset(userTz, candidateTz) <= 3) {
      advantages.push("Real-time collaboration friendly");
    }

    return advantages;
  }

  // Private helper methods for style analysis

  private calculateContentDeliveryCompatibility(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): number {
    // Analyze how they deliver content (educational, entertainment, competitive, etc.)
    const userDelivery = userStyle.contentDelivery || "balanced";
    const candidateDelivery = candidateStyle.contentDelivery || "balanced";

    const compatibilityMatrix: Record<string, Record<string, number>> = {
      educational: {
        educational: 0.9,
        entertainment: 0.7,
        competitive: 0.6,
        balanced: 0.8,
      },
      entertainment: {
        educational: 0.7,
        entertainment: 0.9,
        competitive: 0.7,
        balanced: 0.8,
      },
      competitive: {
        educational: 0.6,
        entertainment: 0.7,
        competitive: 0.9,
        balanced: 0.7,
      },
      balanced: {
        educational: 0.8,
        entertainment: 0.8,
        competitive: 0.7,
        balanced: 0.9,
      },
    };

    return compatibilityMatrix[userDelivery]?.[candidateDelivery] || 0.7;
  }

  private calculateCommunicationAlignment(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): number {
    // Analyze communication styles (chatty, focused, interactive, etc.)
    const userComm = userStyle.communicationStyle || "moderate";
    const candidateComm = candidateStyle.communicationStyle || "moderate";

    const alignmentMap: Record<string, Record<string, number>> = {
      chatty: { chatty: 0.9, moderate: 0.7, focused: 0.5 },
      moderate: { chatty: 0.7, moderate: 0.9, focused: 0.7 },
      focused: { chatty: 0.5, moderate: 0.7, focused: 0.9 },
    };

    return alignmentMap[userComm]?.[candidateComm] || 0.7;
  }

  private calculatePaceCompatibility(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): number {
    // Analyze streaming pace (fast, moderate, slow)
    const userPace = userStyle.pace || "moderate";
    const candidatePace = candidateStyle.pace || "moderate";

    const paceCompatibility: Record<string, Record<string, number>> = {
      fast: { fast: 0.9, moderate: 0.7, slow: 0.4 },
      moderate: { fast: 0.7, moderate: 0.9, slow: 0.7 },
      slow: { fast: 0.4, moderate: 0.7, slow: 0.9 },
    };

    return paceCompatibility[userPace]?.[candidatePace] || 0.7;
  }

  private determineAudienceEngagementStyle(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): string {
    const userEngagement = userStyle.audienceEngagement || "moderate";
    const candidateEngagement = candidateStyle.audienceEngagement || "moderate";

    if (userEngagement === "high" && candidateEngagement === "high")
      return "highly_interactive";
    if (userEngagement === "low" && candidateEngagement === "low")
      return "content_focused";
    return "balanced_interaction";
  }

  private identifyCollaborationTypes(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): string[] {
    const types: string[] = [];

    // Based on their styles, suggest collaboration types
    if (userStyle.competitive && candidateStyle.competitive) {
      types.push("competitive_tournaments");
    }

    if (userStyle.educational || candidateStyle.educational) {
      types.push("teaching_streams");
    }

    if (userStyle.entertainment && candidateStyle.entertainment) {
      types.push("variety_shows", "game_nights");
    }

    types.push("casual_games", "community_events"); // Always available

    return types;
  }

  private analyzeStreamingPersonalities(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): string[] {
    const personalities: string[] = [];

    // Determine personality compatibility
    if (
      userStyle.personality?.includes("energetic") &&
      candidateStyle.personality?.includes("energetic")
    ) {
      personalities.push("high_energy_duo");
    }

    if (
      userStyle.personality?.includes("analytical") ||
      candidateStyle.personality?.includes("analytical")
    ) {
      personalities.push("strategic_minds");
    }

    personalities.push("friendly_collaboration"); // Default

    return personalities;
  }

  private calculateContentSynergy(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): number {
    // Calculate how well their content styles work together
    let synergy = 0.5; // Base synergy

    // Boost for complementary styles
    if (
      userStyle.contentDelivery === "educational" &&
      candidateStyle.contentDelivery === "entertainment"
    ) {
      synergy += 0.2;
    }

    if (userStyle.pace !== candidateStyle.pace) {
      synergy += 0.1; // Different paces can create good dynamics
    }

    return Math.min(1, synergy);
  }

  private getPersonalityScore(personalities: string[]): number {
    return personalities.length > 0 ? 0.8 : 0.5;
  }

  private getCollaborationScore(types: string[]): number {
    return Math.min(1, types.length * 0.2);
  }

  /**
   * Update adaptive weights based on success patterns and collaboration outcomes
   */
  updateAdaptiveWeights(
    collaborationOutcomes: Array<{
      matchId: string;
      successScore: number; // 0-1 scale
      gameCompatibility: number;
      audienceOverlap: number;
      timezoneAlignment: number;
      styleMatching: number;
      userFeedback?: {
        rating: number; // 1-5 scale
        collaborationSuccess: boolean;
        wouldCollaborateAgain: boolean;
      };
      actualResults?: {
        viewerGrowth: number;
        engagementIncrease: number;
        retentionImprovement: number;
      };
    }>,
  ): void {
    if (collaborationOutcomes.length < 3) {
      logger.debug("Insufficient data for weight adaptation", {
        outcomes: collaborationOutcomes.length,
      });
      return;
    }

    try {
      // Calculate success metrics
      const avgSuccess =
        collaborationOutcomes.reduce(
          (sum, outcome) => sum + outcome.successScore,
          0,
        ) / collaborationOutcomes.length;
      collaborationOutcomes.filter((o) => o.successScore > 0.7);

      // Analyze which factors contributed most to success
      const factorAnalysis = {
        gameCompatibility: this.analyzeFactorSuccess(
          collaborationOutcomes,
          "gameCompatibility",
        ),
        audienceOverlap: this.analyzeFactorSuccess(
          collaborationOutcomes,
          "audienceOverlap",
        ),
        timezoneAlignment: this.analyzeFactorSuccess(
          collaborationOutcomes,
          "timezoneAlignment",
        ),
        styleMatching: this.analyzeFactorSuccess(
          collaborationOutcomes,
          "styleMatching",
        ),
      };

      // Adjust weights based on factor success correlation
      const adjustmentFactor = 0.1; // Conservative adjustment

      if (avgSuccess > 0.8) {
        // System performing well, minimal adjustments
        this.adaptiveWeights.adaptiveBonus = Math.min(
          0.1,
          this.adaptiveWeights.adaptiveBonus + 0.02,
        );
      } else if (avgSuccess < 0.5) {
        // System needs significant adjustment
        const bestFactor = Object.entries(factorAnalysis).reduce((a, b) =>
          factorAnalysis[a[0] as keyof typeof factorAnalysis] >
          factorAnalysis[b[0] as keyof typeof factorAnalysis]
            ? a
            : b,
        )[0] as keyof typeof factorAnalysis;

        // Boost the most successful factor
        if (bestFactor === "gameCompatibility") {
          this.adaptiveWeights.gameCompatibility += adjustmentFactor;
          this.adaptiveWeights.audienceOverlap -= adjustmentFactor * 0.3;
          this.adaptiveWeights.timezoneAlignment -= adjustmentFactor * 0.3;
          this.adaptiveWeights.styleMatching -= adjustmentFactor * 0.4;
        } else if (bestFactor === "audienceOverlap") {
          this.adaptiveWeights.audienceOverlap += adjustmentFactor;
          this.adaptiveWeights.gameCompatibility -= adjustmentFactor * 0.3;
          this.adaptiveWeights.timezoneAlignment -= adjustmentFactor * 0.3;
          this.adaptiveWeights.styleMatching -= adjustmentFactor * 0.4;
        } else if (bestFactor === "timezoneAlignment") {
          this.adaptiveWeights.timezoneAlignment += adjustmentFactor;
          this.adaptiveWeights.gameCompatibility -= adjustmentFactor * 0.3;
          this.adaptiveWeights.audienceOverlap -= adjustmentFactor * 0.3;
          this.adaptiveWeights.styleMatching -= adjustmentFactor * 0.4;
        } else if (bestFactor === "styleMatching") {
          this.adaptiveWeights.styleMatching += adjustmentFactor;
          this.adaptiveWeights.gameCompatibility -= adjustmentFactor * 0.3;
          this.adaptiveWeights.audienceOverlap -= adjustmentFactor * 0.3;
          this.adaptiveWeights.timezoneAlignment -= adjustmentFactor * 0.4;
        }
      }

      // Ensure weights remain within bounds and sum to ~1.0
      this.normalizeWeights();

      // Persist weights (in production, this would save to database/storage)
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
   * Analyze how well a specific factor correlates with success
   */
  private analyzeFactorSuccess(outcomes: any[], factor: string): number {
    if (outcomes.length === 0) return 0.5;

    const correlations = outcomes.map((outcome) => ({
      factorScore: (outcome as any)[factor] || 0,
      successScore: outcome.userFeedback?.rating
        ? outcome.userFeedback.rating / 5
        : outcome.successScore || 0, // Normalize rating to 0-1 scale
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
      // For now, we'll use in-memory persistence with logging
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
   * Reserved for future use - currently using default weights
   */
  /*
  private async loadAdaptiveWeights(): Promise<void> {
    try {
      // In production, this would load from database or storage service
      // For now, use defaults
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
  */

  /**
   * Get current algorithm configuration
   */
  getAlgorithmConfiguration(): AlgorithmWeights {
    return { ...this.adaptiveWeights };
  }

  /**
   * Reset algorithm weights to defaults
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
}

// Export singleton instance for use in other services
export const aiAlgorithmEngine = AIAlgorithmEngine.getInstance();
