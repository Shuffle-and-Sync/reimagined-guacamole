import { logger } from "../logger";
import { storage } from "../storage";
import { cacheService } from "./cache-service";
import { twitchAPI } from "./twitch-api";

// import { notificationDelivery } from './notification-delivery.service'; // Commented out for now

// Types for streaming coordination
export interface StreamingPlatform {
  id: string;
  name: string;
  isConnected: boolean;
  username?: string;
  profileUrl?: string;
  lastStreamCheck?: Date;
}

export interface StreamSession {
  id: string;
  hostUserId: string;
  coHostUserIds: string[];
  title: string;
  description?: string;
  scheduledStartTime: Date;
  actualStartTime?: Date;
  endTime?: Date;
  status: "scheduled" | "live" | "ended" | "cancelled";
  platforms: StreamingPlatform[];
  category: string;
  tags: string[];
  maxViewers?: number;
  averageViewers?: number;
  peakViewers?: number;
  communityId?: string;
  isPublic: boolean;
  autoStartEnabled: boolean;
  crossPlatformChat: boolean;
  recordingEnabled: boolean;
  multistreaming: boolean;
}

export interface StreamingNotification {
  id: string;
  userId: string;
  type:
    | "stream_started"
    | "stream_ended"
    | "raid_incoming"
    | "host_request"
    | "collaboration_invite";
  message: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export interface CollaborationRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  streamSessionId: string;
  type: "co_host" | "raid" | "host" | "guest_appearance";
  message?: string;
  scheduledTime?: Date;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Multi-platform streaming coordination service
 * Handles stream coordination across Twitch, YouTube, Facebook, and other platforms
 */
export class StreamingCoordinator {
  private activeStreamSessions: Map<string, StreamSession> = new Map();
  private streamCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic stream status checks
    this.startStreamMonitoring();
  }

  /**
   * Start monitoring streams across all platforms
   */
  private startStreamMonitoring(): void {
    if (this.streamCheckInterval) {
      clearInterval(this.streamCheckInterval);
    }

    // Check stream statuses every 2 minutes
    this.streamCheckInterval = setInterval(
      async () => {
        await this.checkAllStreamStatuses();
      },
      2 * 60 * 1000,
    );
  }

  /**
   * Stop stream monitoring
   */
  stopStreamMonitoring(): void {
    if (this.streamCheckInterval) {
      clearInterval(this.streamCheckInterval);
      this.streamCheckInterval = null;
    }
  }

  /**
   * Get user's connected platforms
   */
  async getUserPlatforms(userId: string): Promise<StreamingPlatform[]> {
    // TODO: Implement platform connection storage
    // For now, return sample data based on auth providers
    const user = await storage.getUser(userId);
    if (!user) return [];

    const platforms: StreamingPlatform[] = [];

    // Check Twitch connection (placeholder - would check OAuth tokens in real implementation)
    platforms.push({
      id: "twitch",
      name: "Twitch",
      isConnected: true, // TODO: Check actual connection status
      username: user.username || "user_" + userId.slice(0, 8),
      profileUrl: `https://twitch.tv/${user.username || "user_" + userId.slice(0, 8)}`,
      lastStreamCheck: new Date(),
    });

    // YouTube placeholder
    platforms.push({
      id: "youtube",
      name: "YouTube",
      isConnected: false, // TODO: Implement YouTube OAuth
      lastStreamCheck: new Date(),
    });

    // Facebook placeholder
    platforms.push({
      id: "facebook",
      name: "Facebook Gaming",
      isConnected: false, // TODO: Implement Facebook OAuth
      lastStreamCheck: new Date(),
    });

    return platforms;
  }

  /**
   * Create a new stream session
   */
  async createStreamSession(
    session: Omit<StreamSession, "id">,
  ): Promise<StreamSession> {
    const sessionId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newSession: StreamSession = {
      id: sessionId,
      ...session,
    };

    this.activeStreamSessions.set(sessionId, newSession);

    // Cache the new session
    await cacheService.cacheStreamSession(newSession);

    // Invalidate user sessions cache for host and co-hosts
    await cacheService.delete(`user_sessions:${newSession.hostUserId}`);
    for (const coHostId of newSession.coHostUserIds) {
      await cacheService.delete(`user_sessions:${coHostId}`);
    }

    // TODO: Store in database
    logger.info(`Created stream session: ${sessionId}`, {
      sessionId,
      hostUserId: newSession.hostUserId,
    });

    return newSession;
  }

  /**
   * Get active stream sessions for a user
   */
  async getUserStreamSessions(userId: string): Promise<StreamSession[]> {
    // Try to get from cache first
    const cachedSessions = await cacheService.getUserStreamSessions(userId);
    if (cachedSessions) {
      logger.debug("Cache hit for user stream sessions", { userId });
      return cachedSessions;
    }

    // Get from active sessions
    const sessions = Array.from(this.activeStreamSessions.values());
    const userSessions = sessions.filter(
      (session) =>
        session.hostUserId === userId || session.coHostUserIds.includes(userId),
    );

    // Cache the result
    await cacheService.cacheUserStreamSessions(userId, userSessions);
    logger.debug("Cached user stream sessions", {
      userId,
      count: userSessions.length,
    });

    return userSessions;
  }

  /**
   * Check if a user is currently streaming on any platform
   */
  async isUserStreaming(userId: string): Promise<{
    isStreaming: boolean;
    platform?: string;
    streamTitle?: string;
    viewerCount?: number;
  }> {
    const user = await storage.getUser(userId);
    if (!user || !user.username) {
      return { isStreaming: false };
    }

    try {
      // Check Twitch
      const twitchStream = await twitchAPI.getStream(user.username);
      if (twitchStream && twitchStream.type === "live") {
        return {
          isStreaming: true,
          platform: "Twitch",
          streamTitle: twitchStream.title,
          viewerCount: twitchStream.viewer_count,
        };
      }

      // TODO: Check YouTube API
      // TODO: Check Facebook Gaming API

      return { isStreaming: false };
    } catch (error) {
      console.error("Error checking user streaming status:", error);
      return { isStreaming: false };
    }
  }

  /**
   * Check streaming status for all active sessions
   */
  private async checkAllStreamStatuses(): Promise<void> {
    const activeSessions = Array.from(
      this.activeStreamSessions.values(),
    ).filter(
      (session) => session.status === "scheduled" || session.status === "live",
    );

    for (const session of activeSessions) {
      try {
        await this.updateStreamSessionStatus(session.id);
      } catch (error) {
        console.error(`Error updating stream session ${session.id}:`, error);
      }
    }
  }

  /**
   * Update stream session status based on platform data
   */
  async updateStreamSessionStatus(
    sessionId: string,
  ): Promise<StreamSession | null> {
    const session = this.activeStreamSessions.get(sessionId);
    if (!session) return null;

    const hostStreamStatus = await this.isUserStreaming(session.hostUserId);
    const currentTime = new Date();

    // Update session based on streaming status
    if (hostStreamStatus.isStreaming && session.status === "scheduled") {
      session.status = "live";
      session.actualStartTime = currentTime;
      logger.info(`Stream session started live`, { sessionId });
    } else if (!hostStreamStatus.isStreaming && session.status === "live") {
      session.status = "ended";
      session.endTime = currentTime;
      logger.info(`Stream session ended`, { sessionId });
    }

    // Update viewer metrics
    if (hostStreamStatus.isStreaming && hostStreamStatus.viewerCount) {
      session.maxViewers = Math.max(
        session.maxViewers || 0,
        hostStreamStatus.viewerCount,
      );
      session.peakViewers = Math.max(
        session.peakViewers || 0,
        hostStreamStatus.viewerCount,
      );
    }

    this.activeStreamSessions.set(sessionId, session);
    return session;
  }

  /**
   * Send collaboration request
   */
  async sendCollaborationRequest(
    request: Omit<CollaborationRequest, "id" | "createdAt" | "expiresAt">,
  ): Promise<CollaborationRequest> {
    const requestId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const collaborationRequest: CollaborationRequest = {
      id: requestId,
      ...request,
      createdAt: now,
      expiresAt,
    };

    // TODO: Store in database
    // TODO: Send notification to target user
    logger.info(`Collaboration request sent`, {
      requestId,
      collaborationRequest,
    });

    return collaborationRequest;
  }

  /**
   * Get upcoming stream sessions for a community
   */
  async getCommunityUpcomingStreams(
    communityId: string,
    limit: number = 10,
  ): Promise<StreamSession[]> {
    const sessions = Array.from(this.activeStreamSessions.values());
    const communitySessions = sessions
      .filter(
        (session) =>
          session.communityId === communityId && session.status === "scheduled",
      )
      .sort(
        (a, b) =>
          a.scheduledStartTime.getTime() - b.scheduledStartTime.getTime(),
      )
      .slice(0, limit);

    return communitySessions;
  }

  /**
   * Get live streams for a community
   */
  async getCommunityLiveStreams(communityId: string): Promise<StreamSession[]> {
    const sessions = Array.from(this.activeStreamSessions.values());
    return sessions.filter(
      (session) =>
        session.communityId === communityId && session.status === "live",
    );
  }

  /**
   * Setup EventSub webhooks for real-time updates
   */
  async setupPlatformWebhooks(
    userId: string,
    callbackUrl: string,
    secret: string,
  ): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.username) {
        throw new Error("User not found or no username");
      }

      // Subscribe to Twitch stream online/offline events
      await twitchAPI.subscribeToEvent(
        "stream.online",
        "1",
        { broadcaster_user_login: user.username },
        `${callbackUrl}/twitch`,
        secret,
      );

      await twitchAPI.subscribeToEvent(
        "stream.offline",
        "1",
        { broadcaster_user_login: user.username },
        `${callbackUrl}/twitch`,
        secret,
      );

      // TODO: Setup YouTube webhooks
      // TODO: Setup Facebook webhooks

      return true;
    } catch (error) {
      console.error("Error setting up platform webhooks:", error);
      return false;
    }
  }

  /**
   * Handle platform webhook events
   */
  async handlePlatformEvent(platform: string, event: unknown): Promise<void> {
    switch (platform) {
      case "twitch":
        await this.handleTwitchEvent(event);
        break;
      case "youtube":
        // TODO: Handle YouTube events
        break;
      case "facebook":
        // TODO: Handle Facebook events
        break;
      default:
        console.warn(`Unknown platform event: ${platform}`);
    }
  }

  /**
   * Handle Twitch-specific events
   */
  private async handleTwitchEvent(event: unknown): Promise<void> {
    const eventType = event.event_type;
    const eventData = event.event_data;

    switch (eventType) {
      case "stream.online":
        logger.info(`Stream started`, {
          broadcaster: eventData.broadcaster_user_login,
        });
        // Find and update relevant stream sessions
        break;
      case "stream.offline":
        logger.info(`Stream ended`, {
          broadcaster: eventData.broadcaster_user_login,
        });
        // Find and update relevant stream sessions
        break;
      default:
        logger.warn(`Unhandled Twitch event`, { eventType });
    }
  }

  /**
   * Get streaming analytics for a user
   */
  async getStreamingAnalytics(
    userId: string,
    _timeRange: "week" | "month" | "year" = "month",
  ): Promise<{
    totalStreams: number;
    totalHours: number;
    averageViewers: number;
    peakViewers: number;
    topCategories: Array<{ category: string; hours: number }>;
    platformBreakdown: Array<{
      platform: string;
      streams: number;
      hours: number;
    }>;
  }> {
    // TODO: Implement analytics calculation from stored stream data
    return {
      totalStreams: 0,
      totalHours: 0,
      averageViewers: 0,
      peakViewers: 0,
      topCategories: [],
      platformBreakdown: [],
    };
  }
}

// Export singleton instance
export const streamingCoordinator = new StreamingCoordinator();
