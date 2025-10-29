/**
 * Facebook Page Service
 * Handles Facebook page operations
 */

import { logger } from "../../../logger";
import { facebookAPIClient } from "./facebook-api-client.service";
import type { FacebookPage, FacebookPost } from "./facebook-types";

export class FacebookPageService {
  private static instance: FacebookPageService;

  private constructor() {
    logger.debug("Facebook Page Service initialized");
  }

  public static getInstance(): FacebookPageService {
    if (!FacebookPageService.instance) {
      FacebookPageService.instance = new FacebookPageService();
    }
    return FacebookPageService.instance;
  }

  /**
   * Get page information
   */
  async getPage(
    pageId: string,
    accessToken: string,
  ): Promise<FacebookPage | null> {
    const result = await facebookAPIClient.makeRequest<FacebookPage>(
      `/${pageId}?fields=id,name,about,category,picture,fan_count,followers_count`,
      accessToken,
    );

    if (!result.success) {
      logger.error(
        "Error fetching Facebook page",
        new Error(result.error?.message || "Unknown error"),
        { code: result.error?.code },
      );
      return null;
    }

    return result.data || null;
  }

  /**
   * Get page posts
   */
  async getPagePosts(
    pageId: string,
    accessToken: string,
    limit: number = 10,
  ): Promise<FacebookPost[]> {
    const result = await facebookAPIClient.makeRequest<{
      data: FacebookPost[];
    }>(
      `/${pageId}/posts?fields=id,message,story,created_time,updated_time,permalink_url,likes.summary(true),comments.summary(true),shares&limit=${limit}`,
      accessToken,
    );

    if (!result.success) {
      logger.error(
        "Error fetching page posts",
        new Error(result.error?.message || "Unknown error"),
        { code: result.error?.code },
      );
      return [];
    }

    return result.data?.data || [];
  }

  /**
   * Create post on page
   */
  async createPost(
    pageId: string,
    accessToken: string,
    message: string,
  ): Promise<FacebookPost | null> {
    const result = await facebookAPIClient.makeRequest<FacebookPost>(
      `/${pageId}/feed`,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({ message }),
      },
    );

    if (!result.success) {
      logger.error(
        "Error creating post",
        new Error(result.error?.message || "Unknown error"),
        { code: result.error?.code },
      );
      return null;
    }

    return result.data || null;
  }

  /**
   * Get page access token from user token
   */
  async getPageAccessToken(
    pageId: string,
    userAccessToken: string,
  ): Promise<string | null> {
    const result = await facebookAPIClient.makeRequest<{
      data: Array<{ access_token: string; id: string }>;
    }>(`/me/accounts`, userAccessToken);

    if (!result.success) {
      logger.error(
        "Error getting page access token",
        new Error(result.error?.message || "Unknown error"),
        { code: result.error?.code },
      );
      return null;
    }

    const page = result.data?.data?.find((p) => p.id === pageId);
    return page?.access_token || null;
  }
}

export const facebookPageService = FacebookPageService.getInstance();
