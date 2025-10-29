/**
 * Facebook Stream Service
 * Handles Facebook live video/streaming operations
 */

import { logger } from "../../../logger";
import { facebookAPIClient } from "./facebook-api-client.service";
import type {
  FacebookLiveVideo,
  FacebookLiveVideoDetails,
} from "./facebook-types";

export class FacebookStreamService {
  private static instance: FacebookStreamService;

  private constructor() {
    logger.debug("Facebook Stream Service initialized");
  }

  public static getInstance(): FacebookStreamService {
    if (!FacebookStreamService.instance) {
      FacebookStreamService.instance = new FacebookStreamService();
    }
    return FacebookStreamService.instance;
  }

  /**
   * Get live videos for a page
   */
  async getLiveVideos(
    pageId: string,
    accessToken: string,
  ): Promise<{ data: FacebookLiveVideo[] } | null> {
    const result = await facebookAPIClient.makeRequest<{
      data: FacebookLiveVideo[];
    }>(
      `/${pageId}/live_videos?fields=id,title,description,status,live_views,creation_time,planned_start_time,actual_start_time,broadcast_start_time,permalink_url,embed_html`,
      accessToken,
    );

    if (!result.success) {
      logger.error(
        "Error fetching live videos",
        new Error(result.error?.message || "Unknown error"),
        { code: result.error?.code },
      );
      return null;
    }

    return result.data || null;
  }

  /**
   * Create live video
   */
  async createLiveVideo(
    pageId: string,
    accessToken: string,
    title: string,
    description?: string,
  ): Promise<FacebookLiveVideoDetails | null> {
    const body: any = { title, status: "UNPUBLISHED" };
    if (description) body.description = description;

    const result =
      await facebookAPIClient.makeRequest<FacebookLiveVideoDetails>(
        `/${pageId}/live_videos?fields=id,title,description,status,stream_url,secure_stream_url,dash_ingest_url`,
        accessToken,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

    if (!result.success) {
      logger.error(
        "Error creating live video",
        new Error(result.error?.message || "Unknown error"),
        { code: result.error?.code },
      );
      return null;
    }

    return result.data || null;
  }

  /**
   * Get live video details
   */
  async getLiveVideoDetails(
    videoId: string,
    accessToken: string,
  ): Promise<FacebookLiveVideoDetails | null> {
    const result =
      await facebookAPIClient.makeRequest<FacebookLiveVideoDetails>(
        `/${videoId}?fields=id,title,description,status,live_views,stream_url,secure_stream_url,dash_ingest_url,rtmp_preview_url,creation_time`,
        accessToken,
      );

    if (!result.success) {
      logger.error(
        "Error fetching live video details",
        new Error(result.error?.message || "Unknown error"),
        { code: result.error?.code },
      );
      return null;
    }

    return result.data || null;
  }

  /**
   * Update live video
   */
  async updateLiveVideo(
    videoId: string,
    accessToken: string,
    updates: { title?: string; description?: string; status?: string },
  ): Promise<boolean> {
    const result = await facebookAPIClient.makeRequest<{ success: boolean }>(
      `/${videoId}`,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify(updates),
      },
    );

    if (!result.success) {
      logger.error(
        "Error updating live video",
        new Error(result.error?.message || "Unknown error"),
        { code: result.error?.code },
      );
      return false;
    }

    return result.data?.success || false;
  }

  /**
   * End live video
   */
  async endLiveVideo(videoId: string, accessToken: string): Promise<boolean> {
    const result = await facebookAPIClient.makeRequest<{ success: boolean }>(
      `/${videoId}`,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({ end_live_video: true }),
      },
    );

    if (!result.success) {
      logger.error(
        "Error ending live video",
        new Error(result.error?.message || "Unknown error"),
        { code: result.error?.code },
      );
      return false;
    }

    return result.data?.success || false;
  }
}

export const facebookStreamService = FacebookStreamService.getInstance();
