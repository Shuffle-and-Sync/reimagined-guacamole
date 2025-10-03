import { storage } from '../storage';
import { logger } from '../logger';
import type { 
  UserActivityAnalytics,
  CommunityAnalytics, 
  PlatformMetrics,
  EventTracking,
  ConversionFunnel,
  StreamAnalytics,
  InsertUserActivityAnalytics,
  InsertCommunityAnalytics,
  InsertPlatformMetrics,
  InsertEventTracking,
  InsertConversionFunnel,
  User,
  Community
} from '@shared/schema';

/**
 * Analytics event data structures
 */
export interface AnalyticsEvent {
  userId?: string;
  sessionId?: string;
  eventName: string;
  eventCategory: string;
  eventAction: string;
  eventLabel?: string;
  eventValue?: number;
  properties?: Record<string, any>;
  context?: {
    userAgent?: string;
    ipAddress?: string;
    pageUrl?: string;
    referrerUrl?: string;
    [key: string]: any;
  };
}

export interface StreamMetrics {
  sessionId: string;
  platform: string;
  viewerCount: number;
  chatMessageCount?: number;
  followersGained?: number;
  subscriptionsGained?: number;
  streamQuality?: string;
  frameDrops?: number;
  bitrate?: number;
}

export interface CommunityMetrics {
  communityId: string;
  activeUsers: number;
  newMembers: number;
  streamsStarted: number;
  totalStreamTime: number;
  collaborationsCreated: number;
  tournamentsCreated: number;
  forumPosts: number;
  forumReplies: number;
  avgSessionDuration: number;
}

export interface SystemMetrics {
  metricType: 'performance' | 'usage' | 'system' | 'error' | 'business';
  metricName: string;
  metricValue: number;
  metricUnit?: string;
  aggregationType: 'avg' | 'sum' | 'max' | 'min' | 'count' | 'percentile';
  timeWindow: '1m' | '5m' | '15m' | '1h' | '6h' | '1d' | '7d' | '30d';
  tags?: Record<string, string>;
}

/**
 * Comprehensive analytics service for tracking user behavior, system metrics, and business intelligence
 */
export class AnalyticsService {
  private readonly eventQueue: AnalyticsEvent[] = [];
  private readonly metricsQueue: SystemMetrics[] = [];
  private isProcessing = false;

  /**
   * Track user activity and behavior analytics
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const eventData: InsertEventTracking = {
        userId: event.userId,
        eventName: event.eventName,
        eventCategory: event.eventCategory,
        sessionId: event.sessionId || this.generateSessionId(),
        ipAddress: event.context?.ipAddress,
        userAgent: event.context?.userAgent,
        eventProperties: JSON.stringify({
          eventAction: event.eventAction,
          eventLabel: event.eventLabel,
          eventValue: event.eventValue,
          properties: event.properties,
          context: event.context
        })
      };

      await storage.recordEventTracking(eventData);

      // Also add to generic event tracking for cross-platform analysis
      await this.trackGenericEvent({
        userId: event.userId,
        eventName: event.eventName,
        eventSource: 'web',
        properties: event.properties,
        context: event.context
      });

      logger.info('User event tracked', {
        userId: event.userId,
        eventName: event.eventName,
        eventCategory: event.eventCategory
      });
    } catch (error) {
      logger.error('Failed to track user event', { 
        error, 
        userId: event.userId,
        eventName: event.eventName,
        eventCategory: event.eventCategory 
      });
      // Add to queue for retry
      this.eventQueue.push(event);
    }
  }

  /**
   * Track conversion funnel progression
   */
  async trackFunnelStep(
    funnelName: string,
    stepName: string,
    stepOrder: number,
    userId: string,
    sessionId: string,
    completed: boolean = true,
    timeSpent?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const funnelData: InsertConversionFunnel = {
        funnelName,
        stepName,
        stepOrder,
        userId,
        sessionId,
        completed,
        completedAt: completed ? new Date() : undefined,
        metadata: JSON.stringify({
          timeSpent,
          ...(metadata || {})
        })
      };

      await storage.recordConversionFunnel(funnelData);

      logger.info('Funnel step tracked', {
        funnelName,
        stepName,
        userId,
        completed
      });
    } catch (error) {
      logger.error('Failed to track funnel step', { error, funnelName, stepName, userId });
    }
  }

  /**
   * Track streaming session metrics in real-time
   */
  async trackStreamMetrics(metrics: StreamMetrics): Promise<void> {
    try {
      await storage.recordStreamAnalytics({
        sessionId: metrics.sessionId,
        userId: metrics.platform, // TODO: This should be actual userId, needs to be passed in StreamMetrics
        platform: metrics.platform as 'twitch' | 'youtube' | 'facebook' | 'discord',
        viewerCount: metrics.viewerCount,
        chatMessages: metrics.chatMessageCount || 0
        // Note: followersGained, subscriptionsGained, streamQuality, frameDrops, bitrate 
        // are not in the schema and would need to be added if needed
      });

      logger.info('Stream metrics recorded', {
        sessionId: metrics.sessionId,
        platform: metrics.platform,
        viewerCount: metrics.viewerCount
      });
    } catch (error) {
      logger.error('Failed to track stream metrics', { 
        error, 
        sessionId: metrics.sessionId,
        platform: metrics.platform,
        viewerCount: metrics.viewerCount 
      });
      throw error;
    }
  }

  /**
   * Aggregate and record community-level analytics
   */
  async aggregateCommunityMetrics(communityId: string, date: Date, hour?: number): Promise<void> {
    try {
      const metrics = await this.calculateCommunityMetrics(communityId, date, hour);
      
      // Store metrics as separate records for each metric type
      const metricsToStore = [
        { metricType: 'active_users', value: metrics.activeUsers },
        { metricType: 'new_members', value: metrics.newMembers },
        { metricType: 'streams_started', value: metrics.streamsStarted },
        { metricType: 'total_stream_time', value: metrics.totalStreamTime },
        { metricType: 'collaborations_created', value: metrics.collaborationsCreated },
        { metricType: 'tournaments_created', value: metrics.tournamentsCreated },
        { metricType: 'forum_posts', value: metrics.forumPosts },
        { metricType: 'forum_replies', value: metrics.forumReplies }
      ];

      for (const metric of metricsToStore) {
        const communityAnalytics: InsertCommunityAnalytics = {
          communityId,
          metricType: metric.metricType,
          value: metric.value,
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          metadata: JSON.stringify({
            calculatedAt: new Date().toISOString(),
            hour,
            avgSessionDuration: metrics.avgSessionDuration
          })
        };
        
        await storage.recordCommunityAnalytics(communityAnalytics);
      }

      logger.info('Community metrics aggregated', {
        communityId,
        date: date.toISOString().split('T')[0],
        hour,
        activeUsers: metrics.activeUsers
      });
    } catch (error) {
      logger.error('Failed to aggregate community metrics', { error, communityId, date });
    }
  }

  /**
   * Record system performance and health metrics
   */
  async recordSystemMetrics(metrics: SystemMetrics): Promise<void> {
    try {
      const platformMetrics: InsertPlatformMetrics = {
        metricType: metrics.metricType,
        metricName: metrics.metricName,
        metricValue: metrics.metricValue,
        tags: JSON.stringify({
          metricUnit: metrics.metricUnit,
          aggregationType: metrics.aggregationType,
          timeWindow: metrics.timeWindow,
          ...(metrics.tags || {})
        })
      };

      await storage.recordPlatformMetrics(platformMetrics);

      logger.debug('System metrics recorded', {
        metricType: metrics.metricType,
        metricName: metrics.metricName,
        metricValue: metrics.metricValue
      });
    } catch (error) {
      logger.error('Failed to record system metrics', { 
        error, 
        metricType: metrics.metricType,
        metricName: metrics.metricName,
        metricValue: metrics.metricValue 
      });
      // Add to queue for retry
      this.metricsQueue.push(metrics);
    }
  }

  /**
   * Generate analytics dashboard data
   */
  async generateDashboardData(
    userId?: string,
    communityId?: string,
    timeframe: '24h' | '7d' | '30d' | '90d' = '7d'
  ): Promise<{
    userActivity: any[];
    communityGrowth: any[];
    streamingMetrics: any[];
    platformHealth: any[];
    keyInsights: any[];
  }> {
    try {
      const startDate = this.getTimeframeStartDate(timeframe);
      
      const [
        userActivity,
        communityGrowth,
        streamingMetrics,
        platformHealth
      ] = await Promise.all([
        this.getUserActivityInsights(userId, startDate),
        this.getCommunityGrowthInsights(communityId, startDate),
        this.getStreamingInsights(communityId, startDate),
        this.getPlatformHealthInsights(startDate)
      ]);

      const keyInsights = this.generateKeyInsights({
        userActivity,
        communityGrowth,
        streamingMetrics,
        platformHealth
      });

      return {
        userActivity,
        communityGrowth,
        streamingMetrics,
        platformHealth,
        keyInsights
      };
    } catch (error) {
      logger.error('Failed to generate dashboard data', { error, userId, communityId, timeframe });
      throw error;
    }
  }

  /**
   * Get real-time platform statistics
   */
  async getRealTimeStats(): Promise<{
    activeUsers: number;
    liveStreams: number;
    totalViewers: number;
    activeCommunities: number;
    eventsToday: number;
  }> {
    try {
      const stats = await this.calculateRealTimeStats();
      return stats;
    } catch (error) {
      logger.error('Failed to get real-time stats', { error });
      return {
        activeUsers: 0,
        liveStreams: 0,
        totalViewers: 0,
        activeCommunities: 0,
        eventsToday: 0
      };
    }
  }

  /**
   * Generate user behavior insights and recommendations
   */
  async generateUserInsights(userId: string): Promise<{
    engagementLevel: 'low' | 'medium' | 'high';
    preferredFeatures: string[];
    recommendedActions: string[];
    activityPattern: any[];
    collaborationHistory: any[];
  }> {
    try {
      const [
        activityData,
        engagementMetrics,
        collaborationData
      ] = await Promise.all([
        storage.getUserActivityAnalytics(userId, 30), // Last 30 days
        this.calculateUserEngagement(userId),
        this.getUserCollaborationHistory(userId)
      ]);

      const insights = this.analyzeUserBehavior(activityData, engagementMetrics, collaborationData);
      return insights;
    } catch (error) {
      logger.error('Failed to generate user insights', { error, userId });
      throw error;
    }
  }

  // Private helper methods
  private categorizeEventType(eventName: string): 'page_view' | 'feature_usage' | 'interaction' | 'navigation' | 'form_submit' {
    if (eventName.includes('page_') || eventName.includes('route_')) return 'page_view';
    if (eventName.includes('form_') || eventName.includes('submit')) return 'form_submit';
    if (eventName.includes('click_') || eventName.includes('scroll')) return 'interaction';
    if (eventName.includes('nav_') || eventName.includes('menu')) return 'navigation';
    return 'feature_usage';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async trackGenericEvent(event: {
    userId?: string;
    eventName: string;
    eventSource: string;
    properties?: Record<string, any>;
    context?: Record<string, any>;
  }): Promise<void> {
    const eventData: InsertEventTracking = {
      userId: event.userId,
      eventName: event.eventName,
      eventCategory: event.eventSource,
      eventProperties: JSON.stringify({
        anonymousId: event.userId ? undefined : this.generateSessionId(),
        properties: event.properties,
        traits: event.context,
        context: event.context
      })
    };

    await storage.recordEventTracking(eventData);
  }

  private async calculateCommunityMetrics(communityId: string, date: Date, hour?: number): Promise<CommunityMetrics> {
    const startTime = hour !== undefined 
      ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour)
      : new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const endTime = hour !== undefined
      ? new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour
      : new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // 1 day

    // Calculate metrics for the time period
    // This would involve complex queries to aggregate data
    // For now, return mock data structure
    return {
      communityId,
      activeUsers: 0, // Count unique users active in time period
      newMembers: 0, // Count new community joins
      streamsStarted: 0, // Count streams initiated
      totalStreamTime: 0, // Sum of streaming minutes
      collaborationsCreated: 0, // Count collaboration requests
      tournamentsCreated: 0, // Count tournaments created
      forumPosts: 0, // Count forum posts
      forumReplies: 0, // Count forum replies
      avgSessionDuration: 0 // Average user session length
    };
  }

  private async getCommunityMemberCount(communityId: string): Promise<number> {
    // Get total members in community
    return 0; // Implement actual count
  }

  private getTimeframeStartDate(timeframe: '24h' | '7d' | '30d' | '90d'): Date {
    const now = new Date();
    switch (timeframe) {
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private async getUserActivityInsights(userId?: string, startDate?: Date): Promise<any[]> {
    // Implement user activity insights
    return [];
  }

  private async getCommunityGrowthInsights(communityId?: string, startDate?: Date): Promise<any[]> {
    // Implement community growth insights
    return [];
  }

  private async getStreamingInsights(communityId?: string, startDate?: Date): Promise<any[]> {
    // Implement streaming insights
    return [];
  }

  private async getPlatformHealthInsights(startDate?: Date): Promise<any[]> {
    // Implement platform health insights
    return [];
  }

  private generateKeyInsights(data: any): any[] {
    // Generate key insights from aggregated data
    return [];
  }

  private async calculateRealTimeStats(): Promise<any> {
    // Calculate real-time platform statistics
    return {
      activeUsers: 0,
      liveStreams: 0,
      totalViewers: 0,
      activeCommunities: 0,
      eventsToday: 0
    };
  }

  private async calculateUserEngagement(userId: string): Promise<any> {
    // Calculate user engagement metrics
    return {};
  }

  private async getUserCollaborationHistory(userId: string): Promise<any[]> {
    // Get user collaboration history
    return [];
  }

  private analyzeUserBehavior(activityData: any[], engagementMetrics: any, collaborationData: any[]): any {
    // Analyze user behavior and generate insights
    return {
      engagementLevel: 'medium',
      preferredFeatures: [],
      recommendedActions: [],
      activityPattern: [],
      collaborationHistory: []
    };
  }

  /**
   * Process queued events and metrics
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    try {
      // Process event queue
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (event) {
          await this.trackEvent(event);
        }
      }

      // Process metrics queue
      while (this.metricsQueue.length > 0) {
        const metrics = this.metricsQueue.shift();
        if (metrics) {
          await this.recordSystemMetrics(metrics);
        }
      }
    } catch (error) {
      logger.error('Failed to process analytics queue', { error });
    } finally {
      this.isProcessing = false;
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Background queue processing
setInterval(() => {
  analyticsService.processQueue();
}, 30000); // Process queue every 30 seconds