/**
 * Base Social Media Service
 * Abstract base class for social media platform integrations
 */

import { logger } from "../../../logger";
import type { SocialMediaTokens } from "./social-media-types";

export abstract class BaseSocialMediaService {
  protected apiKey: string | undefined;
  protected clientId: string | undefined;
  protected clientSecret: string | undefined;

  constructor(apiKey?: string, clientId?: string, clientSecret?: string) {
    this.apiKey = apiKey;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.clientId && this.clientSecret);
  }

  /**
   * Exchange authorization code for access tokens
   */
  abstract exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<SocialMediaTokens>;

  /**
   * Refresh an expired access token
   */
  abstract refreshAccessToken(refreshToken: string): Promise<SocialMediaTokens>;

  /**
   * Make an authenticated API request
   */
  protected async makeAPIRequest<T>(
    url: string,
    accessToken: string,
    options: RequestInit = {},
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      logger.error(
        "Social media API request failed",
        error instanceof Error ? error : new Error(String(error)),
        { url },
      );
      throw error;
    }
  }

  /**
   * Handle rate limiting
   */
  protected async handleRateLimit(retryAfter?: number): Promise<void> {
    const delay = retryAfter || 60000; // Default 1 minute
    logger.warn("Rate limit encountered, waiting before retry", { delay });
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
