/**
 * YouTube API Core Service
 * Main orchestrator for YouTube API operations
 */

import { logger } from "../../../logger";
import { youtubeAPIClient } from "./youtube-api-client.service";
import { youtubeChannelService } from "./youtube-channel.service";
import { youtubeStreamService } from "./youtube-stream.service";
import { youtubeVideoService } from "./youtube-video.service";
import type {
  YouTubeChannel,
  YouTubeStream,
  YouTubeVideo,
  YouTubeBroadcast,
} from "./youtube-types";

/**
 * Core YouTube API Service
 * Provides unified interface to all YouTube operations
 */
export class YouTubeAPICoreService {
  private static instance: YouTubeAPICoreService;

  private constructor() {
    logger.info("YouTube API Core Service initialized");
  }

  public static getInstance(): YouTubeAPICoreService {
    if (!YouTubeAPICoreService.instance) {
      YouTubeAPICoreService.instance = new YouTubeAPICoreService();
    }
    return YouTubeAPICoreService.instance;
  }

  /**
   * Check if YouTube API is properly configured
   */
  isConfigured(): boolean {
    return youtubeAPIClient.isConfigured();
  }

  /**
   * Check if API key is available for read-only operations
   */
  isReadOnlyConfigured(): boolean {
    return youtubeAPIClient.isReadOnlyConfigured();
  }

  // Channel operations
  async getChannel(channelId: string): Promise<YouTubeChannel | null> {
    return youtubeChannelService.getChannel(channelId);
  }

  async getMyChannel(accessToken: string): Promise<YouTubeChannel | null> {
    return youtubeChannelService.getMyChannel(accessToken);
  }

  // Video operations
  async getChannelVideos(
    channelId: string,
    maxResults?: number,
  ): Promise<YouTubeVideo[]> {
    return youtubeVideoService.getChannelVideos(channelId, maxResults);
  }

  async searchVideos(
    query: string,
    maxResults?: number,
  ): Promise<YouTubeVideo[]> {
    return youtubeVideoService.searchVideos(query, maxResults);
  }

  // Stream operations
  async getLiveStream(channelId: string): Promise<YouTubeStream | null> {
    return youtubeStreamService.getLiveStream(channelId);
  }

  async createLiveBroadcast(
    accessToken: string,
    title: string,
    description: string,
    scheduledStartTime: string,
    privacyStatus?: "public" | "unlisted" | "private",
  ): Promise<YouTubeBroadcast | null> {
    return youtubeStreamService.createLiveBroadcast(
      accessToken,
      title,
      description,
      scheduledStartTime,
      privacyStatus,
    );
  }

  async transitionBroadcast(
    accessToken: string,
    broadcastId: string,
    status: "testing" | "live" | "complete",
  ): Promise<boolean> {
    return youtubeStreamService.transitionBroadcast(
      accessToken,
      broadcastId,
      status,
    );
  }

  // Auth operations
  async exchangeCodeForTokens(code: string, redirectUri: string) {
    return youtubeAPIClient.exchangeCodeForTokens(code, redirectUri);
  }

  async refreshAccessToken(refreshToken: string) {
    return youtubeAPIClient.refreshAccessToken(refreshToken);
  }
}

// Export singleton for backwards compatibility
export const youtubeAPI = YouTubeAPICoreService.getInstance();
