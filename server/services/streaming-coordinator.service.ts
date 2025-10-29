import { logger } from "../logger";
import { storage } from "../storage";
import { cacheService } from "./cache-service";
import { twitchAPI } from "./twitch-api.service";

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
   * Get user's connected platforms with real OAuth status
   */
  async getUserPlatforms(userId: string): Promise<StreamingPlatform[]> {
    const user = await storage.getUser(userId);
    if (!user) return [];

    // Get all platform accounts from storage
    const accounts = await storage.getUserPlatformAccounts(userId);
    const now = new Date();

    const platforms: StreamingPlatform[] = [];

    // Helper to check if token is expired
    const isTokenExpired = (expiresAt: Date | null | undefined): boolean => {
      if (!expiresAt) return false;
      return expiresAt.getTime() <= now.getTime();
    };

    // Check each platform for connected status
    for (const platformId of ["twitch", "youtube", "facebook"] as const) {
      const account = accounts.find((acc) => acc.platform === platformId);
      const platformNames: Record<string, string> = {
        twitch: "Twitch",
        youtube: "YouTube",
        facebook: "Facebook Gaming",
      };

      if (account && account.isActive) {
        // Platform is connected and active
        const isExpired = isTokenExpired(account.tokenExpiresAt);
        platforms.push({
          id: platformId,
          name: platformNames[platformId] || platformId,
          isConnected: !isExpired, // Connected if token not expired
          username: account.handle,
          profileUrl: this.getPlatformProfileUrl(
            platformId,
            account.handle,
            account.platformUserId,
            account.channelId,
          ),
          lastStreamCheck: account.lastVerified || new Date(),
        });
      } else {
        // Platform not connected
        platforms.push({
          id: platformId,
          name: platformNames[platformId] || platformId,
          isConnected: false,
          lastStreamCheck: new Date(),
        });
      }
    }

    return platforms;
  }

  /**
   * Get platform profile URL based on platform type
   */
  private getPlatformProfileUrl(
    platform: string,
    handle: string,
    userId?: string | null,
    channelId?: string | null,
  ): string | undefined {
    switch (platform) {
      case "twitch":
        return `https://twitch.tv/${handle}`;
      case "youtube":
        return channelId
          ? `https://youtube.com/channel/${channelId}`
          : undefined;
      case "facebook":
        return userId ? `https://facebook.com/${userId}` : undefined;
      default:
        return undefined;
    }
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
    if (!user) {
      return { isStreaming: false };
    }

    try {
      // Get user's platform accounts
      const accounts = await storage.getUserPlatformAccounts(userId);

      // Check Twitch if connected
      const twitchAccount = accounts.find((acc) => acc.platform === "twitch");
      if (twitchAccount?.isActive && twitchAccount.handle) {
        const twitchStream = await twitchAPI.getStream(twitchAccount.handle);
        if (twitchStream && twitchStream.type === "live") {
          return {
            isStreaming: true,
            platform: "Twitch",
            streamTitle: twitchStream.title,
            viewerCount: twitchStream.viewer_count,
          };
        }
      }

      // Check YouTube if connected
      const youtubeAccount = accounts.find((acc) => acc.platform === "youtube");
      if (youtubeAccount?.isActive && youtubeAccount.channelId) {
        const { YouTubeAPIService } = await import("./youtube-api.service");
        const youtubeService = new YouTubeAPIService();
        const youtubeStream = await youtubeService.getLiveStream(
          youtubeAccount.channelId,
        );
        if (youtubeStream && youtubeStream.status === "live") {
          return {
            isStreaming: true,
            platform: "YouTube",
            streamTitle: youtubeStream.title,
            viewerCount: youtubeStream.concurrentViewers,
          };
        }
      }

      // Check Facebook if connected
      const facebookAccount = accounts.find(
        (acc) => acc.platform === "facebook",
      );
      if (facebookAccount?.isActive && facebookAccount.pageId) {
        const { FacebookAPIService } = await import("./facebook-api.service");
        const facebookService = new FacebookAPIService();
        // Get valid access token with refresh if needed
        const accessToken = await storage.getUserPlatformToken(
          userId,
          "facebook",
        );
        if (accessToken) {
          const liveVideosResult = await facebookService.getLiveVideos(
            facebookAccount.pageId,
            accessToken,
          );
          if (liveVideosResult.success && liveVideosResult.data) {
            const liveVideo = liveVideosResult.data.find(
              (video) => video.status === "LIVE",
            );
            if (liveVideo) {
              return {
                isStreaming: true,
                platform: "Facebook Gaming",
                streamTitle: liveVideo.title,
                viewerCount: liveVideo.live_views,
              };
            }
          }
        }
      }

      return { isStreaming: false };
    } catch (error) {
      logger.error(
        "Error checking user streaming status:",
        error instanceof Error ? error : new Error(String(error)),
      );
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
   * Setup EventSub webhooks for real-time updates across all platforms
   */
  async setupPlatformWebhooks(
    userId: string,
    callbackUrl: string,
    secret: string,
  ): Promise<boolean> {
    try {
      const accounts = await storage.getUserPlatformAccounts(userId);
      let setupSuccessful = false;

      // Setup Twitch webhooks if connected
      const twitchAccount = accounts.find((acc) => acc.platform === "twitch");
      if (twitchAccount?.isActive && twitchAccount.handle) {
        try {
          await twitchAPI.subscribeToEvent(
            "stream.online",
            "1",
            { broadcaster_user_login: twitchAccount.handle },
            `${callbackUrl}/twitch`,
            secret,
          );

          await twitchAPI.subscribeToEvent(
            "stream.offline",
            "1",
            { broadcaster_user_login: twitchAccount.handle },
            `${callbackUrl}/twitch`,
            secret,
          );
          setupSuccessful = true;
          logger.info("Twitch webhooks setup successfully", { userId });
        } catch (error) {
          logger.error(
            "Error setting up Twitch webhooks:",
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      }

      // Setup YouTube webhooks if connected
      const youtubeAccount = accounts.find((acc) => acc.platform === "youtube");
      if (youtubeAccount?.isActive && youtubeAccount.channelId) {
        try {
          const { YouTubeAPIService } = await import("./youtube-api.service");
          const youtubeService = new YouTubeAPIService();
          const subscribed =
            await youtubeService.subscribeToChannelNotifications(
              youtubeAccount.channelId,
              `${callbackUrl}/youtube`,
            );
          if (subscribed) {
            setupSuccessful = true;
            logger.info("YouTube webhooks setup successfully", { userId });
          }
        } catch (error) {
          logger.error(
            "Error setting up YouTube webhooks:",
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      }

      // Setup Facebook webhooks if connected
      const facebookAccount = accounts.find(
        (acc) => acc.platform === "facebook",
      );
      if (facebookAccount?.isActive && facebookAccount.pageId) {
        try {
          const accessToken = await storage.getUserPlatformToken(
            userId,
            "facebook",
          );
          if (accessToken) {
            const { FacebookAPIService } = await import(
              "./facebook-api.service"
            );
            const facebookService = new FacebookAPIService();
            const subscribed = await facebookService.subscribeToWebhooks(
              facebookAccount.pageId,
              accessToken,
              `${callbackUrl}/facebook`,
              secret,
            );
            if (subscribed) {
              setupSuccessful = true;
              logger.info("Facebook webhooks setup successfully", { userId });
            }
          }
        } catch (error) {
          logger.error(
            "Error setting up Facebook webhooks:",
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      }

      return setupSuccessful;
    } catch (error) {
      logger.error(
        "Error setting up platform webhooks:",
        error instanceof Error ? error : new Error(String(error)),
      );
      return false;
    }
  }

  /**
   * Handle platform webhook events from all platforms
   */
  async handlePlatformEvent(platform: string, event: unknown): Promise<void> {
    switch (platform) {
      case "twitch":
        await this.handleTwitchEvent(event);
        break;
      case "youtube":
        await this.handleYouTubeEvent(event);
        break;
      case "facebook":
        await this.handleFacebookEvent(event);
        break;
      default:
        logger.warn(`Unknown platform event: ${platform}`);
    }
  }

  /**
   * Handle Twitch-specific events
   */
  private async handleTwitchEvent(event: unknown): Promise<void> {
    const eventType = (event as any).event_type;
    const eventData = (event as any).event_data;

    switch (eventType) {
      case "stream.online":
        logger.info(`Twitch stream started`, {
          broadcaster: eventData?.broadcaster_user_login,
        });
        // Find and update relevant stream sessions
        break;
      case "stream.offline":
        logger.info(`Twitch stream ended`, {
          broadcaster: eventData?.broadcaster_user_login,
        });
        // Find and update relevant stream sessions
        break;
      default:
        logger.warn(`Unhandled Twitch event`, { eventType });
    }
  }

  /**
   * Handle YouTube-specific events
   */
  private async handleYouTubeEvent(event: unknown): Promise<void> {
    try {
      const eventData = event as any;
      logger.info(`YouTube event received`, {
        channelId: eventData?.channelId,
        videoId: eventData?.videoId,
        title: eventData?.title,
      });
      // Find and update relevant stream sessions based on channel ID
      // The actual implementation would depend on the YouTube webhook payload structure
    } catch (error) {
      logger.error(
        "Error handling YouTube event:",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Handle Facebook-specific events
   */
  private async handleFacebookEvent(event: unknown): Promise<void> {
    try {
      const eventData = event as any;
      const entry = eventData?.entry?.[0];
      const changes = entry?.changes?.[0];

      if (changes?.field === "live_videos") {
        const value = changes.value;
        logger.info(`Facebook live video event`, {
          pageId: entry?.id,
          videoId: value?.id,
          status: value?.status,
        });
        // Find and update relevant stream sessions based on page ID
      }
    } catch (error) {
      logger.error(
        "Error handling Facebook event:",
        error instanceof Error ? error : new Error(String(error)),
      );
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
