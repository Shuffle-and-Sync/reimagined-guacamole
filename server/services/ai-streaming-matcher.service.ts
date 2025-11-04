import type { User } from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { storage } from "../storage";
import { facebookAPI } from "./facebook-api";
import { twitchAPI } from "./twitch-api";
import { youtubeAPI } from "./youtube-api";

// Enhanced streaming-specific matching interfaces
export interface StreamerProfile {
  id: string;
  username: string;
  avatar?: string;
  platforms: ConnectedPlatform[];
  streamingPreferences: StreamingPreferences;
  audienceMetrics: AudienceMetrics;
  contentPreferences: ContentPreferences;
  availabilitySchedule: AvailabilitySchedule;
  collaborationHistory: CollaborationHistory;
  matchingPreferences: StreamingMatchPreferences;
}

export interface ConnectedPlatform {
  platform: "twitch" | "youtube" | "facebook";
  username: string;
  isActive: boolean;
  followerCount?: number;
  averageViewers?: number;
  lastStreamDate?: Date;
  streamQuality?: string;
}

export interface StreamingPreferences {
  preferredStreamTimes: string[]; // e.g., ["19:00-22:00", "14:00-17:00"]
  streamFrequency: "daily" | "weekly" | "biweekly" | "monthly";
  streamDuration: number; // in minutes
  contentRating: "family_friendly" | "teen" | "mature";
  interactionStyle: "high_energy" | "chill" | "educational" | "competitive";
  chatModeration: "strict" | "moderate" | "relaxed";
}

export interface AudienceMetrics {
  totalFollowers: number;
  averageViewers: number;
  peakViewers: number;
  audienceAge: "teen" | "young_adult" | "adult" | "mixed";
  audienceRegions: string[]; // e.g., ["US", "EU", "APAC"]
  engagementRate: number; // 0-100
  retentionRate: number; // 0-100
  chatActivity: "low" | "medium" | "high" | "very_high";
}

export interface ContentPreferences {
  primaryGames: string[]; // Community IDs
  secondaryGames: string[];
  contentTypes: (
    | "gameplay"
    | "tutorial"
    | "tournament"
    | "casual"
    | "speedrun"
    | "review"
  )[];
  collabTypes: (
    | "co_op"
    | "versus"
    | "teaching"
    | "tournament"
    | "casual_chat"
    | "raid_train"
  )[];
  avoidedContent: string[];
}

export interface AvailabilitySchedule {
  timezone: string;
  weeklySchedule: {
    [day in
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday"]: {
      available: boolean;
      timeSlots: string[]; // e.g., ["09:00-12:00", "19:00-22:00"]
    };
  };
  advanceNotice: number; // hours needed for planning
  maxCollabsPerWeek: number;
}

export interface CollaborationHistory {
  totalCollaborations: number;
  successfulCollaborations: number;
  averageRating: number; // 1-5 from collaboration partners
  preferredPartnerTypes: string[];
  lastCollaboration?: Date;
  noShowRate: number; // 0-100
}

export interface StreamingMatchPreferences {
  audienceSizeCompatibility:
    | "similar"
    | "larger_welcome"
    | "smaller_welcome"
    | "any";
  contentSynergy: "same_games" | "complementary" | "educational" | "any";
  collaborationFrequency: "rare" | "occasional" | "regular" | "frequent";
  partnershipGoals: (
    | "audience_growth"
    | "content_variety"
    | "learning"
    | "fun"
    | "networking"
  )[];
  excludeCompetitors: boolean;
  minimumRating: number; // 1-5 minimum collaboration rating
  geoPreference: "local" | "regional" | "global";
}

export interface StreamerMatch {
  partnerId: string;
  profile: StreamerProfile;
  compatibilityScore: number; // 0-100
  matchReasons: string[];
  suggestedCollaborationType: string;
  scheduledTimeSlots: string[];
  audienceOverlapPotential: number;
  contentSynergyScore: number;
  availabilityMatch: number;
  platformCompatibility: string[];
  estimatedViewerBoost: number; // projected viewer increase
}

export interface MatchingCriteria {
  userId: string;
  games?: string[];
  timeSlots?: string[];
  collaborationType?: string;
  audienceSize?: "any" | "similar" | "larger" | "smaller";
  contentType?: string;
  urgency?: "low" | "medium" | "high";
  maxResults?: number;
}

/**
 * AI-powered streaming partnership matching service
 * Provides intelligent matching based on audience compatibility, content synergy,
 * scheduling alignment, and collaboration goals
 */
export class AIStreamingMatcher {
  private static instance: AIStreamingMatcher;
  private matchingCache = new Map<string, StreamerMatch[]>();
  private profileCache = new Map<string, StreamerProfile>();
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes

  static getInstance(): AIStreamingMatcher {
    if (!AIStreamingMatcher.instance) {
      AIStreamingMatcher.instance = new AIStreamingMatcher();
    }
    return AIStreamingMatcher.instance;
  }

  /**
   * Find optimal streaming partners using AI algorithms
   */
  async findStreamingPartners(
    criteria: MatchingCriteria,
  ): Promise<StreamerMatch[]> {
    const startTime = Date.now();
    logger.info("AI streaming partner matching started", {
      userId: criteria.userId,
      criteria,
    });

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(criteria);
      if (this.matchingCache.has(cacheKey)) {
        const cached = this.matchingCache.get(cacheKey);
        if (cached) {
          logger.info("Returned cached streaming matches", {
            userId: criteria.userId,
            count: cached.length,
          });
          return cached;
        }
      }

      // Get user's streaming profile
      const userProfile = await this.getStreamerProfile(criteria.userId);
      if (!userProfile) {
        throw new Error(`User streaming profile not found: ${criteria.userId}`);
      }

      // Get potential streaming partners
      const candidates = await this.getStreamingCandidates(
        criteria,
        userProfile,
      );

      // Apply AI matching algorithms
      const matches = await this.calculateStreamingCompatibility(
        userProfile,
        candidates,
        criteria,
      );

      // Sort by compatibility score and apply final filtering
      const rankedMatches = matches
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, criteria.maxResults || 10);

      // Cache results
      this.matchingCache.set(cacheKey, rankedMatches);
      setTimeout(() => this.matchingCache.delete(cacheKey), this.cacheExpiry);

      const duration = Date.now() - startTime;
      logger.info("AI streaming partner matching completed", {
        userId: criteria.userId,
        matchCount: rankedMatches.length,
        duration: `${duration}ms`,
        averageScore:
          rankedMatches.reduce(
            (sum, match) => sum + match.compatibilityScore,
            0,
          ) / rankedMatches.length,
      });

      return rankedMatches;
    } catch (error) {
      logger.error("AI streaming partner matching failed", toLoggableError(error), {
        userId: criteria.userId,
        criteria,
      });
      throw error;
    }
  }

  /**
   * Get comprehensive streamer profile including real-time platform data
   */
  async getStreamerProfile(userId: string): Promise<StreamerProfile | null> {
    try {
      // Check cache first
      if (this.profileCache.has(userId)) {
        const cached = this.profileCache.get(userId);
        if (cached) {
          return cached;
        }
      }

      // Get user data with error handling
      const user = await storage.getUser(userId);
      if (!user) return null;

      // Get streaming preferences and settings with fallbacks
      let userSettings;
      let matchingPrefs;
      try {
        userSettings = (await storage.getUserSettings?.(userId)) || {};
        matchingPrefs =
          (await storage.getMatchmakingPreferences?.(userId)) || {};
      } catch (error) {
        logger.warn("Settings/preferences not available, using defaults", {
          userId,
          error,
        });
        userSettings = {};
        matchingPrefs = {};
      }

      // Get real-time platform data
      const platforms = await this.getConnectedPlatforms(
        userId,
        user.username || "",
      );

      // Build comprehensive profile
      const profile: StreamerProfile = {
        id: userId,
        username: user.username || `${user.firstName} ${user.lastName}`,
        avatar: user.profileImageUrl || undefined,
        platforms,
        streamingPreferences: this.extractStreamingPreferences(userSettings),
        audienceMetrics: await this.calculateAudienceMetrics(platforms),
        contentPreferences: this.extractContentPreferences(matchingPrefs),
        availabilitySchedule: this.extractAvailabilitySchedule(
          user,
          userSettings,
        ),
        collaborationHistory: await this.getCollaborationHistory(userId),
        matchingPreferences: this.extractMatchingPreferences(
          matchingPrefs,
          userSettings,
        ),
      };

      // Cache profile
      this.profileCache.set(userId, profile);
      setTimeout(() => this.profileCache.delete(userId), this.cacheExpiry);

      return profile;
    } catch (error) {
      logger.error("Failed to get streamer profile", toLoggableError(error), { userId });
      return null;
    }
  }

  /**
   * Get real-time connected platform data
   */
  private async getConnectedPlatforms(
    userId: string,
    username: string,
  ): Promise<ConnectedPlatform[]> {
    const platforms: ConnectedPlatform[] = [];

    try {
      // Check Twitch
      try {
        const twitchUser = await twitchAPI.getUser(username);
        const twitchStream = await twitchAPI.getStream(username);

        platforms.push({
          platform: "twitch",
          username: twitchUser?.display_name || twitchUser?.login || username,
          isActive: !!twitchStream && twitchStream.type === "live",
          followerCount: twitchUser?.view_count || 0,
          averageViewers: twitchStream?.viewer_count || 0,
          lastStreamDate: twitchStream ? new Date() : undefined,
          streamQuality: "720p",
        });
      } catch (error) {
        logger.debug("Twitch platform data not available", {
          userId,
          username,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Check YouTube
      try {
        const youtubeChannel = await youtubeAPI.getChannel(username);
        const youtubeLive = await youtubeAPI.getLiveStream(username);

        platforms.push({
          platform: "youtube",
          username: youtubeChannel?.title || username,
          isActive: !!youtubeLive && youtubeLive.status === "live",
          followerCount: youtubeChannel?.subscriberCount || 0,
          averageViewers: youtubeLive?.concurrentViewers || 0,
          lastStreamDate: youtubeLive ? new Date() : undefined,
        });
      } catch (error) {
        logger.debug("YouTube platform data not available", {
          userId,
          username,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Check Facebook Gaming
      try {
        const facebookLive = await facebookAPI.getLiveVideos("", "");
        if (facebookLive && facebookLive.data && facebookLive.data.length > 0) {
          const video = facebookLive.data[0];
          if (video) {
            platforms.push({
              platform: "facebook",
              username: video.title || video.description || username,
              isActive: video.status === "LIVE",
              followerCount: 0,
              averageViewers: 0,
              lastStreamDate: new Date(),
            });
          }
        }
      } catch (error) {
        logger.debug("Facebook Gaming platform data not available", {
          userId,
          username,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } catch (error) {
      logger.error("Failed to get connected platforms", toLoggableError(error), {
        userId,
        username,
      });
    }

    return platforms;
  }

  /**
   * Get potential streaming candidates using efficient database queries
   */
  private async getStreamingCandidates(
    criteria: MatchingCriteria,
    _userProfile: StreamerProfile,
  ): Promise<StreamerProfile[]> {
    try {
      // Get basic users first, then build streaming profiles
      let users: User[] = [];
      try {
        // Use getAllUsers method
        const result = await storage.getAllUsers?.();
        users = result?.users || [];
      } catch (error) {
        logger.warn("User lookup not available, using empty list", { error });
        users = [];
      }
      const streamingCandidates = users
        .filter((u: User) => u.id !== criteria.userId)
        .slice(0, 50);

      // Convert to streaming profiles
      const candidates: StreamerProfile[] = [];
      for (const user of streamingCandidates) {
        const profile = await this.getStreamerProfile(user.id);
        if (profile && profile.platforms.length > 0) {
          candidates.push(profile);
        }
      }

      return candidates;
    } catch (error) {
      logger.error("Failed to get streaming candidates", toLoggableError(error), {
        userId: criteria.userId,
      });
      return [];
    }
  }

  /**
   * AI algorithm to calculate streaming compatibility scores
   */
  private async calculateStreamingCompatibility(
    userProfile: StreamerProfile,
    candidates: StreamerProfile[],
    _criteria: MatchingCriteria,
  ): Promise<StreamerMatch[]> {
    const matches: StreamerMatch[] = [];

    for (const candidate of candidates) {
      try {
        let score = 0;
        const reasons: string[] = [];

        // 1. Audience Compatibility (25% weight)
        const audienceScore = this.calculateAudienceCompatibility(
          userProfile.audienceMetrics,
          candidate.audienceMetrics,
        );
        score += audienceScore * 0.25;
        if (audienceScore > 70) reasons.push("Highly compatible audiences");

        // 2. Content Synergy (25% weight)
        const contentScore = this.calculateContentSynergy(
          userProfile.contentPreferences,
          candidate.contentPreferences,
        );
        score += contentScore * 0.25;
        if (contentScore > 80) reasons.push("Excellent content alignment");

        // 3. Schedule Alignment (20% weight)
        const scheduleScore = this.calculateScheduleAlignment(
          userProfile.availabilitySchedule,
          candidate.availabilitySchedule,
        );
        score += scheduleScore * 0.2;
        if (scheduleScore > 60) reasons.push("Good schedule overlap");

        // 4. Platform Compatibility (15% weight)
        const platformScore = this.calculatePlatformCompatibility(
          userProfile.platforms,
          candidate.platforms,
        );
        score += platformScore * 0.15;
        if (platformScore > 50) reasons.push("Shared streaming platforms");

        // 5. Collaboration History (10% weight)
        const historyScore = this.calculateCollaborationScore(
          candidate.collaborationHistory,
        );
        score += historyScore * 0.1;
        if (historyScore > 80)
          reasons.push("Excellent collaboration track record");

        // 6. Real-time factors (5% weight)
        const realtimeScore = this.calculateRealtimeFactors(
          userProfile,
          candidate,
        );
        score += realtimeScore * 0.05;

        // Only include matches above threshold
        if (score >= 40) {
          const match: StreamerMatch = {
            partnerId: candidate.id,
            profile: candidate,
            compatibilityScore: Math.round(score),
            matchReasons: reasons,
            suggestedCollaborationType: this.suggestCollaborationType(
              userProfile,
              candidate,
            ),
            scheduledTimeSlots: this.findCommonTimeSlots(
              userProfile.availabilitySchedule,
              candidate.availabilitySchedule,
            ),
            audienceOverlapPotential: this.calculateAudienceOverlap(
              userProfile.audienceMetrics,
              candidate.audienceMetrics,
            ),
            contentSynergyScore: Math.round(contentScore),
            availabilityMatch: Math.round(scheduleScore),
            platformCompatibility: this.getSharedPlatforms(
              userProfile.platforms,
              candidate.platforms,
            ),
            estimatedViewerBoost: this.estimateViewerBoost(
              userProfile.audienceMetrics,
              candidate.audienceMetrics,
            ),
          };

          matches.push(match);
        }
      } catch (error) {
        logger.error("Failed to calculate compatibility for candidate", toLoggableError(error), {
          userId: userProfile.id,
          candidateId: candidate.id,
        });
      }
    }

    return matches;
  }

  // Compatibility calculation methods
  private calculateAudienceCompatibility(
    user: AudienceMetrics,
    candidate: AudienceMetrics,
  ): number {
    let score = 0;

    // Audience size compatibility
    const sizeRatio =
      Math.min(user.totalFollowers, candidate.totalFollowers) /
      Math.max(user.totalFollowers, candidate.totalFollowers);
    score += sizeRatio * 30;

    // Engagement compatibility
    const engagementDiff = Math.abs(
      user.engagementRate - candidate.engagementRate,
    );
    score += Math.max(0, 100 - engagementDiff) * 0.3;

    // Age group compatibility
    if (user.audienceAge === candidate.audienceAge) score += 20;

    // Regional overlap
    const sharedRegions = user.audienceRegions.filter((region) =>
      candidate.audienceRegions.includes(region),
    );
    score +=
      (sharedRegions.length /
        Math.max(
          user.audienceRegions.length,
          candidate.audienceRegions.length,
        )) *
      20;

    return Math.min(score, 100);
  }

  private calculateContentSynergy(
    user: ContentPreferences,
    candidate: ContentPreferences,
  ): number {
    let score = 0;

    // Shared primary games
    const sharedPrimary = user.primaryGames.filter((game) =>
      candidate.primaryGames.includes(game),
    );
    score +=
      (sharedPrimary.length / Math.max(user.primaryGames.length, 1)) * 40;

    // Complementary games
    const sharedSecondary = user.secondaryGames.filter((game) =>
      candidate.secondaryGames.includes(game),
    );
    score +=
      (sharedSecondary.length / Math.max(user.secondaryGames.length, 1)) * 20;

    // Content type alignment
    const sharedTypes = user.contentTypes.filter((type) =>
      candidate.contentTypes.includes(type),
    );
    score += (sharedTypes.length / Math.max(user.contentTypes.length, 1)) * 25;

    // Collaboration type compatibility
    const sharedCollabTypes = user.collabTypes.filter((type) =>
      candidate.collabTypes.includes(type),
    );
    score +=
      (sharedCollabTypes.length / Math.max(user.collabTypes.length, 1)) * 15;

    return Math.min(score, 100);
  }

  private calculateScheduleAlignment(
    user: AvailabilitySchedule,
    candidate: AvailabilitySchedule,
  ): number {
    let score = 0;
    let totalSlots = 0;
    let matchingSlots = 0;

    // Check each day for overlapping time slots
    Object.keys(user.weeklySchedule).forEach((day) => {
      const userDay =
        user.weeklySchedule[day as keyof typeof user.weeklySchedule];
      const candidateDay =
        candidate.weeklySchedule[day as keyof typeof candidate.weeklySchedule];

      if (userDay.available && candidateDay.available) {
        totalSlots += userDay.timeSlots.length;

        // Check for time slot overlaps
        userDay.timeSlots.forEach((userSlot) => {
          candidateDay.timeSlots.forEach((candidateSlot) => {
            if (this.timeSlotsOverlap(userSlot, candidateSlot)) {
              matchingSlots++;
            }
          });
        });
      }
    });

    if (totalSlots > 0) {
      score = (matchingSlots / totalSlots) * 100;
    }

    // Timezone adjustment bonus/penalty
    const timezoneScore = this.calculateTimezoneCompatibility(
      user.timezone,
      candidate.timezone,
    );
    score = score * 0.7 + timezoneScore * 0.3;

    return Math.min(score, 100);
  }

  private calculatePlatformCompatibility(
    userPlatforms: ConnectedPlatform[],
    candidatePlatforms: ConnectedPlatform[],
  ): number {
    const userPlatformNames = userPlatforms
      .filter((p) => p.isActive)
      .map((p) => p.platform);
    const candidatePlatformNames = candidatePlatforms
      .filter((p) => p.isActive)
      .map((p) => p.platform);

    const sharedPlatforms = userPlatformNames.filter((platform) =>
      candidatePlatformNames.includes(platform),
    );
    const totalUniquePlatforms = new Set([
      ...userPlatformNames,
      ...candidatePlatformNames,
    ]).size;

    if (totalUniquePlatforms === 0) return 0;
    return (sharedPlatforms.length / totalUniquePlatforms) * 100;
  }

  private calculateCollaborationScore(history: CollaborationHistory): number {
    let score = 0;

    // Success rate
    if (history.totalCollaborations > 0) {
      const successRate =
        (history.successfulCollaborations / history.totalCollaborations) * 100;
      score += successRate * 0.4;
    } else {
      score += 50; // Neutral for new streamers
    }

    // Average rating
    score += (history.averageRating / 5) * 30;

    // No-show penalty
    score -= history.noShowRate * 0.2;

    // Recent activity bonus
    if (
      history.lastCollaboration &&
      Date.now() - history.lastCollaboration.getTime() <
        30 * 24 * 60 * 60 * 1000
    ) {
      score += 10;
    }

    return Math.max(0, Math.min(score, 100));
  }

  private calculateRealtimeFactors(
    user: StreamerProfile,
    candidate: StreamerProfile,
  ): number {
    let score = 50; // Base score

    // Currently streaming bonus
    const userStreaming = user.platforms.some((p) => p.isActive);
    const candidateStreaming = candidate.platforms.some((p) => p.isActive);

    if (userStreaming && candidateStreaming) score += 30;
    else if (userStreaming || candidateStreaming) score += 15;

    // Recent activity bonus
    const recentThreshold = 24 * 60 * 60 * 1000; // 24 hours
    const hasRecentActivity = candidate.platforms.some(
      (p) =>
        p.lastStreamDate &&
        Date.now() - p.lastStreamDate.getTime() < recentThreshold,
    );

    if (hasRecentActivity) score += 20;

    return Math.min(score, 100);
  }

  // Helper methods for match details
  private suggestCollaborationType(
    user: StreamerProfile,
    candidate: StreamerProfile,
  ): string {
    const sharedGames = user.contentPreferences.primaryGames.filter((game) =>
      candidate.contentPreferences.primaryGames.includes(game),
    );

    if (sharedGames.length > 0) {
      return "Co-operative gameplay stream";
    }

    const sharedTypes = user.contentPreferences.collabTypes.filter((type) =>
      candidate.contentPreferences.collabTypes.includes(type),
    );

    if (sharedTypes.includes("tournament")) return "Tournament collaboration";
    if (sharedTypes.includes("teaching")) return "Teaching/Learning stream";
    if (sharedTypes.includes("versus")) return "Competitive matchup";
    if (sharedTypes.includes("casual_chat")) return "Casual chat collaboration";

    return "Cross-community collaboration";
  }

  private findCommonTimeSlots(
    user: AvailabilitySchedule,
    candidate: AvailabilitySchedule,
  ): string[] {
    const commonSlots: string[] = [];

    Object.keys(user.weeklySchedule).forEach((day) => {
      const userDay =
        user.weeklySchedule[day as keyof typeof user.weeklySchedule];
      const candidateDay =
        candidate.weeklySchedule[day as keyof typeof candidate.weeklySchedule];

      if (userDay.available && candidateDay.available) {
        userDay.timeSlots.forEach((userSlot) => {
          candidateDay.timeSlots.forEach((candidateSlot) => {
            if (this.timeSlotsOverlap(userSlot, candidateSlot)) {
              commonSlots.push(
                `${day}: ${this.calculateOverlapTime(userSlot, candidateSlot)}`,
              );
            }
          });
        });
      }
    });

    return commonSlots;
  }

  private calculateAudienceOverlap(
    user: AudienceMetrics,
    candidate: AudienceMetrics,
  ): number {
    const sharedRegions = user.audienceRegions.filter((region) =>
      candidate.audienceRegions.includes(region),
    );
    const totalRegions = new Set([
      ...user.audienceRegions,
      ...candidate.audienceRegions,
    ]).size;

    if (totalRegions === 0) return 0;
    return Math.round((sharedRegions.length / totalRegions) * 100);
  }

  private getSharedPlatforms(
    user: ConnectedPlatform[],
    candidate: ConnectedPlatform[],
  ): string[] {
    const userPlatforms = user.filter((p) => p.isActive).map((p) => p.platform);
    const candidatePlatforms = candidate
      .filter((p) => p.isActive)
      .map((p) => p.platform);

    return userPlatforms.filter((platform) =>
      candidatePlatforms.includes(platform),
    );
  }

  private estimateViewerBoost(
    user: AudienceMetrics,
    candidate: AudienceMetrics,
  ): number {
    // Conservative estimate: 10-30% of smaller audience might cross over
    const smallerAudience = Math.min(
      user.averageViewers,
      candidate.averageViewers,
    );
    const crossoverRate = 0.15; // 15% average crossover rate

    return Math.round(smallerAudience * crossoverRate);
  }

  // Utility methods
  private timeSlotsOverlap(slot1: string, slot2: string): boolean {
    const [start1, end1] = slot1.split("-").map((t) => this.timeToMinutes(t));
    const [start2, end2] = slot2.split("-").map((t) => this.timeToMinutes(t));

    if (
      start1 === undefined ||
      end1 === undefined ||
      start2 === undefined ||
      end2 === undefined
    ) {
      return false;
    }

    return Math.max(start1, start2) < Math.min(end1, end2);
  }

  private calculateOverlapTime(slot1: string, slot2: string): string {
    const [start1, end1] = slot1.split("-").map((t) => this.timeToMinutes(t));
    const [start2, end2] = slot2.split("-").map((t) => this.timeToMinutes(t));

    if (
      start1 === undefined ||
      end1 === undefined ||
      start2 === undefined ||
      end2 === undefined
    ) {
      return "";
    }

    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);

    return `${this.minutesToTime(overlapStart)}-${this.minutesToTime(overlapEnd)}`;
  }

  private timeToMinutes(time: string): number {
    const parts = time.split(":").map(Number);
    const hours = parts[0];
    const minutes = parts[1];

    if (hours === undefined || minutes === undefined) {
      throw new Error(`Invalid time format: ${time}`);
    }

    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  private calculateTimezoneCompatibility(tz1: string, tz2: string): number {
    // Simplified timezone compatibility scoring
    if (tz1 === tz2) return 100;

    // Add actual timezone offset calculation here
    // For now, return moderate compatibility for different timezones
    return 60;
  }

  private generateCacheKey(criteria: MatchingCriteria): string {
    return `streaming_match_${criteria.userId}_${JSON.stringify(criteria)}`;
  }

  // Data extraction methods
  private extractStreamingPreferences(
    userSettings: unknown,
  ): StreamingPreferences {
    const streamingSettings = userSettings?.streamingSettings || {};

    return {
      preferredStreamTimes: streamingSettings.preferredTimes || ["19:00-22:00"],
      streamFrequency: streamingSettings.frequency || "weekly",
      streamDuration: streamingSettings.duration || 120,
      contentRating: streamingSettings.contentRating || "family_friendly",
      interactionStyle: streamingSettings.interactionStyle || "chill",
      chatModeration: streamingSettings.chatModeration || "moderate",
    };
  }

  private async calculateAudienceMetrics(
    platforms: ConnectedPlatform[],
  ): Promise<AudienceMetrics> {
    const totalFollowers = platforms.reduce(
      (sum, p) => sum + (p.followerCount || 0),
      0,
    );
    const avgViewers = platforms.reduce(
      (sum, p) => sum + (p.averageViewers || 0),
      0,
    );

    return {
      totalFollowers,
      averageViewers: avgViewers,
      peakViewers: Math.round(avgViewers * 1.5),
      audienceAge: "young_adult", // Default, could be enhanced with real data
      audienceRegions: ["US", "EU"], // Default, could be enhanced with real data
      engagementRate: Math.min(75, Math.max(25, Math.random() * 50 + 25)), // Simulated
      retentionRate: Math.min(85, Math.max(40, Math.random() * 45 + 40)), // Simulated
      chatActivity:
        avgViewers > 100 ? "high" : avgViewers > 50 ? "medium" : "low",
    };
  }

  private extractContentPreferences(
    matchingPrefs: unknown,
  ): ContentPreferences {
    return {
      primaryGames: matchingPrefs?.selectedGames || ["MTG"],
      secondaryGames: matchingPrefs?.selectedFormats || [],
      contentTypes: ["gameplay", "casual"],
      collabTypes: ["co_op", "casual_chat"],
      avoidedContent: [],
    };
  }

  private extractAvailabilitySchedule(
    user: unknown,
    _userSettings: unknown,
  ): AvailabilitySchedule {
    const defaultSchedule = {
      available: true,
      timeSlots: ["19:00-22:00"],
    };

    return {
      timezone: user.timezone || "UTC",
      weeklySchedule: {
        monday: defaultSchedule,
        tuesday: defaultSchedule,
        wednesday: defaultSchedule,
        thursday: defaultSchedule,
        friday: defaultSchedule,
        saturday: {
          available: true,
          timeSlots: ["14:00-17:00", "19:00-22:00"],
        },
        sunday: { available: true, timeSlots: ["14:00-17:00", "19:00-22:00"] },
      },
      advanceNotice: 24,
      maxCollabsPerWeek: 3,
    };
  }

  private async getCollaborationHistory(
    userId: string,
  ): Promise<CollaborationHistory> {
    try {
      // Get collaboration requests history
      // Simplified collaboration history for now
      const requests: unknown[] = [];

      return {
        totalCollaborations: requests.length,
        successfulCollaborations: Math.round(requests.length * 0.8), // 80% success rate average
        averageRating: 4.2, // Default good rating
        preferredPartnerTypes: ["content_creator", "gamer"],
        lastCollaboration: requests.length > 0 ? new Date() : undefined,
        noShowRate: 5, // 5% no-show rate
      };
    } catch (error) {
      logger.error("Failed to get collaboration history", toLoggableError(error), { userId });
      return {
        totalCollaborations: 0,
        successfulCollaborations: 0,
        averageRating: 4.0,
        preferredPartnerTypes: [],
        noShowRate: 0,
      };
    }
  }

  private extractMatchingPreferences(
    _matchingPrefs: unknown,
    _userSettings: unknown,
  ): StreamingMatchPreferences {
    return {
      audienceSizeCompatibility: "similar",
      contentSynergy: "same_games",
      collaborationFrequency: "occasional",
      partnershipGoals: ["audience_growth", "fun"],
      excludeCompetitors: false,
      minimumRating: 3.0,
      geoPreference: "global",
    };
  }

  /**
   * Get real-time streaming recommendations for immediate collaboration
   */
  async getRealtimeMatches(userId: string): Promise<StreamerMatch[]> {
    return this.findStreamingPartners({
      userId,
      urgency: "high",
      maxResults: 5,
    });
  }

  /**
   * Get scheduled collaboration opportunities
   */
  async getScheduledMatches(
    userId: string,
    timeSlot?: string,
  ): Promise<StreamerMatch[]> {
    return this.findStreamingPartners({
      userId,
      timeSlots: timeSlot ? [timeSlot] : undefined,
      urgency: "medium",
      maxResults: 10,
    });
  }

  /**
   * Clear caches (for testing or admin purposes)
   */
  clearCaches(): void {
    this.matchingCache.clear();
    this.profileCache.clear();
    logger.info("AI streaming matcher caches cleared");
  }
}

// Export singleton instance
export const aiStreamingMatcher = AIStreamingMatcher.getInstance();
