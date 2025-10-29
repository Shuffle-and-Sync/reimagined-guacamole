/**
 * Facebook API Core Service
 * Main orchestrator for Facebook API operations
 */

import { logger } from "../../../logger";
import { facebookAPIClient } from "./facebook-api-client.service";
import { facebookPageService } from "./facebook-page.service";
import { facebookStreamService } from "./facebook-stream.service";
import type {
  FacebookPage,
  FacebookPost,
  FacebookLiveVideo,
  FacebookLiveVideoDetails,
} from "./facebook-types";

/**
 * Core Facebook API Service
 * Provides unified interface to all Facebook operations
 */
export class FacebookAPICoreService {
  private static instance: FacebookAPICoreService;

  private constructor() {
    logger.info("Facebook API Core Service initialized");
  }

  public static getInstance(): FacebookAPICoreService {
    if (!FacebookAPICoreService.instance) {
      FacebookAPICoreService.instance = new FacebookAPICoreService();
    }
    return FacebookAPICoreService.instance;
  }

  /**
   * Check if Facebook API is properly configured
   */
  isConfigured(): boolean {
    return facebookAPIClient.isConfigured();
  }

  // Page operations
  async getPage(
    pageId: string,
    accessToken: string,
  ): Promise<FacebookPage | null> {
    return facebookPageService.getPage(pageId, accessToken);
  }

  async getPagePosts(
    pageId: string,
    accessToken: string,
    limit?: number,
  ): Promise<FacebookPost[]> {
    return facebookPageService.getPagePosts(pageId, accessToken, limit);
  }

  async createPost(
    pageId: string,
    accessToken: string,
    message: string,
  ): Promise<FacebookPost | null> {
    return facebookPageService.createPost(pageId, accessToken, message);
  }

  async getPageAccessToken(
    pageId: string,
    userAccessToken: string,
  ): Promise<string | null> {
    return facebookPageService.getPageAccessToken(pageId, userAccessToken);
  }

  // Stream operations
  async getLiveVideos(
    pageId: string,
    accessToken: string,
  ): Promise<{ data: FacebookLiveVideo[] } | null> {
    return facebookStreamService.getLiveVideos(pageId, accessToken);
  }

  async createLiveVideo(
    pageId: string,
    accessToken: string,
    title: string,
    description?: string,
  ): Promise<FacebookLiveVideoDetails | null> {
    return facebookStreamService.createLiveVideo(
      pageId,
      accessToken,
      title,
      description,
    );
  }

  async getLiveVideoDetails(
    videoId: string,
    accessToken: string,
  ): Promise<FacebookLiveVideoDetails | null> {
    return facebookStreamService.getLiveVideoDetails(videoId, accessToken);
  }

  async updateLiveVideo(
    videoId: string,
    accessToken: string,
    updates: { title?: string; description?: string; status?: string },
  ): Promise<boolean> {
    return facebookStreamService.updateLiveVideo(videoId, accessToken, updates);
  }

  async endLiveVideo(videoId: string, accessToken: string): Promise<boolean> {
    return facebookStreamService.endLiveVideo(videoId, accessToken);
  }

  // Auth operations
  async exchangeCodeForToken(code: string, redirectUri: string) {
    return facebookAPIClient.exchangeCodeForTokens(code, redirectUri);
  }

  async exchangeForLongLivedToken(shortLivedToken: string) {
    return facebookAPIClient.exchangeForLongLivedToken(shortLivedToken);
  }
}

// Export singleton for backwards compatibility
export const facebookAPI = FacebookAPICoreService.getInstance();
