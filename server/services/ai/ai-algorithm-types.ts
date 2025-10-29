/**
 * Shared types and interfaces for AI Algorithm services
 */

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
  flexibility: "low" | "medium" | "high";
  availableTimeSlots: string[];
}

export interface UserProfile {
  id: string;
  games: string[];
  gamePreferences?: GamePreferences;
  audience: AudienceData;
  schedule: ScheduleData;
  streamingMetrics: StreamingMetrics;
  streamingStyle?: StreamingStyleData;
  history?: StreamerHistoryData;
}

export interface MatchData {
  gameCompatibilityScore?: number;
  audienceOverlapScore?: number;
  timezoneCompatibilityScore?: number;
  styleMatchingScore?: number;
  successScore?: number;
  [key: string]: number | undefined;
}

export interface AdvancedMatchingCriteria {
  minGameCompatibility?: number;
  minAudienceOverlap?: number;
  maxTimezoneOffset?: number;
  requireSharedGame?: boolean;
  preferredStreamingStyles?: string[];
  minFollowerCount?: number;
  maxFollowerCount?: number;
  excludeUserIds?: string[];
}

export interface StreamingStyleData {
  pace: "slow" | "medium" | "fast";
  interactivity: "low" | "medium" | "high";
  competitive: boolean;
  educational: boolean;
  entertainment: boolean;
  professional: boolean;
  communicationStyle: string;
  contentFocus: string[];
}

export interface StreamerHistoryData {
  totalCollaborations: number;
  successfulCollaborations: number;
  averageCollaborationRating: number;
  preferredPartnerCount: number;
  lastCollaborationDate?: Date;
}

export interface AudienceAnalytics {
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

export interface ScheduleAnalytics {
  timeZone: string;
  regularHours: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  peakViewingTimes: string[];
  flexibility: "low" | "medium" | "high";
}

export interface PerformanceMetrics {
  averageViewers: number;
  peakViewers: number;
  streamDuration: number;
  followersGained: number;
  subscriptionConversions: number;
  engagementRate: number;
  retentionRate: number;
}
