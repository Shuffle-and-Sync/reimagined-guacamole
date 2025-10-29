/**
 * YouTube Video Service
 * Handles YouTube video operations
 */

import { logger } from "../../../logger";
import { youtubeAPIClient } from "./youtube-api-client.service";
import type { YouTubeVideo } from "./youtube-types";

export class YouTubeVideoService {
  private static instance: YouTubeVideoService;

  private constructor() {
    logger.debug("YouTube Video Service initialized");
  }

  public static getInstance(): YouTubeVideoService {
    if (!YouTubeVideoService.instance) {
      YouTubeVideoService.instance = new YouTubeVideoService();
    }
    return YouTubeVideoService.instance;
  }

  /**
   * Get channel's recent videos
   */
  async getChannelVideos(
    channelId: string,
    maxResults: number = 10,
  ): Promise<YouTubeVideo[]> {
    if (!channelId?.trim()) {
      logger.error("Channel ID is required");
      return [];
    }

    if (!youtubeAPIClient.isReadOnlyConfigured()) {
      logger.warn("YouTube API not configured");
      return [];
    }

    // Search for videos from the channel
    const searchResult = await youtubeAPIClient.makeRequest<any>(
      `/search?part=snippet&channelId=${encodeURIComponent(channelId)}&type=video&order=date&maxResults=${maxResults}`,
    );

    if (!searchResult.success) {
      logger.error(
        "Error searching channel videos",
        new Error(searchResult.error.message),
        { code: searchResult.error.code },
      );
      return [];
    }

    const videoIds = searchResult.data.items
      ?.map((item: any) => item.id.videoId)
      .filter(Boolean);

    if (!videoIds || videoIds.length === 0) {
      return [];
    }

    // Get video details
    const videosResult = await youtubeAPIClient.makeRequest<any>(
      `/videos?part=snippet,statistics&id=${videoIds.join(",")}`,
    );

    if (!videosResult.success) {
      logger.error(
        "Error fetching video details",
        new Error(videosResult.error.message),
        { code: videosResult.error.code },
      );
      return [];
    }

    return (
      videosResult.data.items?.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        thumbnails: {
          default: { url: video.snippet.thumbnails?.default?.url || "" },
          medium: { url: video.snippet.thumbnails?.medium?.url || "" },
          high: { url: video.snippet.thumbnails?.high?.url || "" },
        },
        viewCount: parseInt(video.statistics.viewCount || "0"),
        likeCount: parseInt(video.statistics.likeCount || "0"),
        commentCount: parseInt(video.statistics.commentCount || "0"),
      })) || []
    );
  }

  /**
   * Search for videos
   */
  async searchVideos(
    query: string,
    maxResults: number = 10,
  ): Promise<YouTubeVideo[]> {
    if (!query?.trim()) {
      logger.error("Search query is required");
      return [];
    }

    if (!youtubeAPIClient.isReadOnlyConfigured()) {
      logger.warn("YouTube API not configured");
      return [];
    }

    const searchResult = await youtubeAPIClient.makeRequest<any>(
      `/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}`,
    );

    if (!searchResult.success) {
      logger.error(
        "Error searching videos",
        new Error(searchResult.error.message),
        { code: searchResult.error.code },
      );
      return [];
    }

    const videoIds = searchResult.data.items
      ?.map((item: any) => item.id.videoId)
      .filter(Boolean);

    if (!videoIds || videoIds.length === 0) {
      return [];
    }

    const videosResult = await youtubeAPIClient.makeRequest<any>(
      `/videos?part=snippet,statistics&id=${videoIds.join(",")}`,
    );

    if (!videosResult.success) {
      logger.error(
        "Error fetching video details",
        new Error(videosResult.error.message),
        { code: videosResult.error.code },
      );
      return [];
    }

    return (
      videosResult.data.items?.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        thumbnails: {
          default: { url: video.snippet.thumbnails?.default?.url || "" },
          medium: { url: video.snippet.thumbnails?.medium?.url || "" },
          high: { url: video.snippet.thumbnails?.high?.url || "" },
        },
        viewCount: parseInt(video.statistics.viewCount || "0"),
        likeCount: parseInt(video.statistics.likeCount || "0"),
        commentCount: parseInt(video.statistics.commentCount || "0"),
      })) || []
    );
  }
}

export const youtubeVideoService = YouTubeVideoService.getInstance();
