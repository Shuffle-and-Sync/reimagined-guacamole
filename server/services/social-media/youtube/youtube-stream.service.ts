/**
 * YouTube Stream Service
 * Handles YouTube live streaming operations
 */

import { logger } from "../../../logger";
import { youtubeAPIClient } from "./youtube-api-client.service";
import type { YouTubeStream, YouTubeBroadcast } from "./youtube-types";

export class YouTubeStreamService {
  private static instance: YouTubeStreamService;

  private constructor() {
    logger.debug("YouTube Stream Service initialized");
  }

  public static getInstance(): YouTubeStreamService {
    if (!YouTubeStreamService.instance) {
      YouTubeStreamService.instance = new YouTubeStreamService();
    }
    return YouTubeStreamService.instance;
  }

  /**
   * Get live stream information
   */
  async getLiveStream(channelId: string): Promise<YouTubeStream | null> {
    if (!channelId?.trim()) {
      logger.error("Channel ID is required");
      return null;
    }

    if (!youtubeAPIClient.isReadOnlyConfigured()) {
      logger.warn("YouTube API not configured");
      return null;
    }

    // Search for live broadcasts
    const searchResult = await youtubeAPIClient.makeRequest<any>(
      `/search?part=snippet&channelId=${encodeURIComponent(channelId)}&type=video&eventType=live&maxResults=1`,
    );

    if (!searchResult.success) {
      logger.error(
        "Error searching for live streams",
        new Error(searchResult.error.message),
        { code: searchResult.error.code },
      );
      return null;
    }

    const liveVideo = searchResult.data.items?.[0];
    if (!liveVideo) {
      return null;
    }

    // Get detailed video information
    const videoResult = await youtubeAPIClient.makeRequest<any>(
      `/videos?part=snippet,liveStreamingDetails,statistics&id=${liveVideo.id.videoId}`,
    );

    if (!videoResult.success) {
      logger.error(
        "Error fetching video details",
        new Error(videoResult.error.message),
        { code: videoResult.error.code },
      );
      return null;
    }

    const video = videoResult.data.items?.[0];
    if (!video) {
      return null;
    }

    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      status: "live",
      scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime,
      actualStartTime: video.liveStreamingDetails?.actualStartTime,
      concurrentViewers: parseInt(
        video.liveStreamingDetails?.concurrentViewers || "0",
      ),
      thumbnails: {
        default: { url: video.snippet.thumbnails?.default?.url || "" },
        medium: { url: video.snippet.thumbnails?.medium?.url || "" },
        high: { url: video.snippet.thumbnails?.high?.url || "" },
      },
    };
  }

  /**
   * Create live broadcast
   */
  async createLiveBroadcast(
    accessToken: string,
    title: string,
    description: string,
    scheduledStartTime: string,
    privacyStatus: "public" | "unlisted" | "private" = "public",
  ): Promise<YouTubeBroadcast | null> {
    const result = await youtubeAPIClient.makeRequest<any>(
      `/liveBroadcasts?part=snippet,status`,
      {
        method: "POST",
        body: JSON.stringify({
          snippet: {
            title,
            description,
            scheduledStartTime,
          },
          status: {
            privacyStatus,
          },
        }),
      },
      accessToken,
    );

    if (!result.success) {
      logger.error(
        "Error creating live broadcast",
        new Error(result.error.message),
        { code: result.error.code },
      );
      return null;
    }

    const broadcast = result.data;
    return {
      id: broadcast.id,
      title: broadcast.snippet.title,
      description: broadcast.snippet.description,
      scheduledStartTime: broadcast.snippet.scheduledStartTime,
      status: broadcast.status.lifeCycleStatus,
      privacyStatus: broadcast.status.privacyStatus,
    };
  }

  /**
   * Transition broadcast status
   */
  async transitionBroadcast(
    accessToken: string,
    broadcastId: string,
    status: "testing" | "live" | "complete",
  ): Promise<boolean> {
    const result = await youtubeAPIClient.makeRequest<any>(
      `/liveBroadcasts/transition?broadcastStatus=${status}&id=${broadcastId}&part=status`,
      { method: "POST" },
      accessToken,
    );

    if (!result.success) {
      logger.error(
        "Error transitioning broadcast",
        new Error(result.error.message),
        { code: result.error.code },
      );
      return false;
    }

    return true;
  }
}

export const youtubeStreamService = YouTubeStreamService.getInstance();
