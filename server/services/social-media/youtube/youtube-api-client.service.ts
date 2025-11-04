/**
 * YouTube API Client Service
 * Handles HTTP requests to YouTube API with error handling and retries
 */

import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../../../logger";
import { BaseSocialMediaService } from "../base/base-social-media.service";
import type { YouTubeAPIResult, YouTubeTokens } from "./youtube-types";
import type { SocialMediaTokens } from "../base/social-media-types";

export class YouTubeAPIClientService extends BaseSocialMediaService {
  private static instance: YouTubeAPIClientService;

  private constructor() {
    super(
      process.env.YOUTUBE_API_KEY,
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
    );
  }

  public static getInstance(): YouTubeAPIClientService {
    if (!YouTubeAPIClientService.instance) {
      YouTubeAPIClientService.instance = new YouTubeAPIClientService();
    }
    return YouTubeAPIClientService.instance;
  }

  /**
   * Make authenticated API request to YouTube
   */
  async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    accessToken?: string,
    retries: number = 3,
  ): Promise<YouTubeAPIResult<T>> {
    if (!endpoint) {
      return {
        success: false,
        error: { code: "INVALID_INPUT", message: "Endpoint is required" },
      };
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string>),
        };

        let finalUrl: string;
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
          finalUrl = `https://www.googleapis.com/youtube/v3${endpoint}`;
        } else if (this.apiKey) {
          const url = new URL(
            endpoint,
            "https://www.googleapis.com/youtube/v3",
          );
          url.searchParams.set("key", this.apiKey);
          finalUrl = url.toString();
        } else {
          return {
            success: false,
            error: {
              code: "NO_AUTH",
              message: "No authentication method available",
            },
          };
        }

        const response = await fetch(finalUrl, {
          ...options,
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.error) {
            return {
              success: false,
              error: {
                code: data.error.code || "API_ERROR",
                message: data.error.message || "Unknown API error",
                details: data.error,
              },
            };
          }
          return { success: true, data };
        }

        // Handle rate limiting and server errors
        if (
          (response.status === 429 || response.status >= 500) &&
          attempt < retries
        ) {
          const retryAfter = response.headers.get("Retry-After");
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : Math.pow(2, attempt) * 1000;

          logger.warn(
            `YouTube API ${response.status === 429 ? "rate limited" : "server error"}, retrying`,
            { status: response.status, attempt, delay },
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        const errorText = await response.text();
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: `YouTube API request failed: ${response.status}`,
            details: { errorText },
          },
        };
      } catch (error) {
        if (attempt === retries) {
          logger.error(
            "YouTube API request failed after retries",
            toLoggableError(error),
            { endpoint, attempt },
          );
          return {
            success: false,
            error: {
              code: "REQUEST_FAILED",
              message: error instanceof Error ? error.message : "Unknown error",
            },
          };
        }
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000),
        );
      }
    }

    return {
      success: false,
      error: { code: "MAX_RETRIES", message: "Max retries exceeded" },
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<SocialMediaTokens> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error("YouTube OAuth not configured");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data: YouTubeTokens = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<SocialMediaTokens> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error("YouTube OAuth not configured");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data: YouTubeTokens = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  /**
   * Check if read-only operations are available
   */
  isReadOnlyConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const youtubeAPIClient = YouTubeAPIClientService.getInstance();
