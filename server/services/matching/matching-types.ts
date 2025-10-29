/**
 * Real-time Matching Types
 * Type definitions for real-time matching and recommendations
 */

export type ConnectedPlatform = "twitch" | "youtube" | "facebook";

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
  updateFrequency: number;
}

export interface EnhancedStreamerMatch {
  candidate: unknown;
  compatibilityScore: number;
  matchStrength: "perfect" | "excellent" | "good" | "fair";
  availability: AvailabilityStatus;
  recommendationReason: string[];
  collaborationTypes: string[];
  estimatedOutcome: CollaborationOutcome;
  urgencyScore: number;
  mlConfidence: number;
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
  expectedViewerBoost: number;
  audienceGrowthPotential: number;
  engagementIncrease: number;
  successProbability: number;
  estimatedDuration: number;
  contentSynergyScore: number;
}

export interface MatchingMetadata {
  totalCandidatesAnalyzed: number;
  processingTime: number;
  algorithmVersion: string;
  cacheHitRate: number;
  qualityScore: number;
  diversityScore: number;
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
    | "content_strategy"
    | "audience_growth"
    | "collaboration_type"
    | "timing_optimization";
  insight: string;
  actionItems: string[];
  potentialImpact: "high" | "medium" | "low";
  confidence: number;
}

export interface TrendingOpportunity {
  type: "game_trend" | "event_based" | "seasonal" | "platform_feature";
  title: string;
  description: string;
  relevanceScore: number;
  expiresAt?: Date;
  relatedStreamers: string[];
}

export interface LearningInsight {
  type:
    | "personal_pattern"
    | "market_trend"
    | "collaboration_feedback"
    | "optimization_tip";
  message: string;
  learnedFrom: string;
  confidence: number;
  applicability: number;
  suggestedActions: string[];
}

export interface RealtimeSubscription {
  userId: string;
  callback: (update: RealTimeMatchResponse) => void;
  filters: RealTimeMatchRequest["preferences"];
  lastUpdate: Date;
  updateCount: number;
}

export interface PerformanceMetric {
  timestamp: Date;
  operation: string;
  duration: number;
  cacheHit: boolean;
  resultCount: number;
  qualityScore: number;
}
