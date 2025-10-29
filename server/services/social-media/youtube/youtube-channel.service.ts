/**
 * YouTube Channel Service
 * Handles YouTube channel operations
 */

import { logger } from "../../../logger";
import { youtubeAPIClient } from "./youtube-api-client.service";
import type { YouTubeChannel } from "./youtube-types";

export class YouTubeChannelService {
  private static instance: YouTubeChannelService;

  private constructor() {
    logger.debug("YouTube Channel Service initialized");
  }

  public static getInstance(): YouTubeChannelService {
    if (!YouTubeChannelService.instance) {
      YouTubeChannelService.instance = new YouTubeChannelService();
    }
    return YouTubeChannelService.instance;
  }

  /**
   * Get channel information
   */
  async getChannel(channelId: string): Promise<YouTubeChannel | null> {
    if (!channelId?.trim()) {
      logger.warn("Channel ID is required");
      return null;
    }

    if (!youtubeAPIClient.isReadOnlyConfigured()) {
      logger.warn("YouTube API not configured");
      return null;
    }

    const result = await youtubeAPIClient.makeRequest<any>(
      `/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}`,
    );

    if (!result.success) {
      logger.error(
        "Error fetching YouTube channel",
        new Error(result.error.message),
        { code: result.error.code },
      );
      return null;
    }

    const channel = result.data.items?.[0];
    if (!channel) {
      return null;
    }

    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnails: {
        default: { url: channel.snippet.thumbnails?.default?.url || "" },
        medium: { url: channel.snippet.thumbnails?.medium?.url || "" },
        high: { url: channel.snippet.thumbnails?.high?.url || "" },
      },
      subscriberCount: parseInt(channel.statistics.subscriberCount || "0"),
      videoCount: parseInt(channel.statistics.videoCount || "0"),
      viewCount: parseInt(channel.statistics.viewCount || "0"),
    };
  }

  /**
   * Get authenticated user's channel
   */
  async getMyChannel(accessToken: string): Promise<YouTubeChannel | null> {
    const result = await youtubeAPIClient.makeRequest<any>(
      `/channels?part=snippet,statistics&mine=true`,
      {},
      accessToken,
    );

    if (!result.success) {
      logger.error(
        "Error fetching user's channel",
        new Error(result.error.message),
        { code: result.error.code },
      );
      return null;
    }

    const channel = result.data.items?.[0];
    if (!channel) {
      return null;
    }

    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnails: {
        default: { url: channel.snippet.thumbnails?.default?.url || "" },
        medium: { url: channel.snippet.thumbnails?.medium?.url || "" },
        high: { url: channel.snippet.thumbnails?.high?.url || "" },
      },
      subscriberCount: parseInt(channel.statistics.subscriberCount || "0"),
      videoCount: parseInt(channel.statistics.videoCount || "0"),
      viewCount: parseInt(channel.statistics.viewCount || "0"),
    };
  }
}

export const youtubeChannelService = YouTubeChannelService.getInstance();
