/**
 * Facebook API Client Service
 * Handles HTTP requests to Facebook Graph API with error handling and retries
 */

import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../../../logger";
import { BaseSocialMediaService } from "../base/base-social-media.service";
import type { FacebookAPIResult, FacebookTokens } from "./facebook-types";
import type { SocialMediaTokens } from "../base/social-media-types";

export class FacebookAPIClientService extends BaseSocialMediaService {
  private static instance: FacebookAPIClientService;
  private apiVersion: string = "v18.0";

  private constructor() {
    super(
      undefined, // No API key for Facebook
      process.env.FACEBOOK_APP_ID,
      process.env.FACEBOOK_APP_SECRET,
    );
  }

  public static getInstance(): FacebookAPIClientService {
    if (!FacebookAPIClientService.instance) {
      FacebookAPIClientService.instance = new FacebookAPIClientService();
    }
    return FacebookAPIClientService.instance;
  }

  /**
   * Make authenticated API request to Facebook
   */
  async makeRequest<T>(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {},
    retries: number = 3,
  ): Promise<FacebookAPIResult<T>> {
    if (!endpoint) {
      return {
        success: false,
        error: { code: "INVALID_INPUT", message: "Endpoint is required" },
      };
    }

    if (!accessToken) {
      return {
        success: false,
        error: { code: "NO_AUTH", message: "Access token is required" },
      };
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const url = `https://graph.facebook.com/${this.apiVersion}${endpoint}`;
        const urlWithToken = `${url}${url.includes("?") ? "&" : "?"}access_token=${accessToken}`;

        const response = await fetch(urlWithToken, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
          },
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          const error = data.error || {};

          // Handle rate limiting
          if (
            response.status === 429 ||
            error.code === 4 ||
            error.code === 17
          ) {
            if (attempt < retries) {
              const delay = Math.pow(2, attempt) * 1000;
              logger.warn("Facebook API rate limited, retrying", {
                attempt,
                delay,
              });
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
          }

          return {
            success: false,
            error: {
              code: this.mapErrorCode(error),
              message: error.message || "Facebook API error",
              type: error.type,
              subcode: error.error_subcode,
            },
          };
        }

        return { success: true, data };
      } catch (error) {
        if (attempt === retries) {
          logger.error(
            "Facebook API request failed after retries",
            toLoggableError(error),
            { endpoint, attempt },
          );
          return {
            success: false,
            error: {
              code: "NETWORK_ERROR",
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
      error: { code: "UNKNOWN_ERROR", message: "Max retries exceeded" },
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
      throw new Error("Facebook OAuth not configured");
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/oauth/access_token`;
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data: FacebookTokens = await response.json();
    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async exchangeForLongLivedToken(
    shortLivedToken: string,
  ): Promise<SocialMediaTokens> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error("Facebook OAuth not configured");
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/oauth/access_token`;
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data: FacebookTokens = await response.json();
    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Refresh access token (Facebook uses long-lived tokens)
   */
  async refreshAccessToken(refreshToken: string): Promise<SocialMediaTokens> {
    // Facebook doesn't have traditional refresh tokens
    // Use exchange for long-lived token instead
    return this.exchangeForLongLivedToken(refreshToken);
  }

  /**
   * Map Facebook error codes to our error taxonomy
   */
  private mapErrorCode(error: any): string {
    const code = error.code;
    const subcode = error.error_subcode;

    // Rate limiting
    if (code === 4 || code === 17 || code === 32 || code === 613) {
      return "RATE_LIMITED";
    }

    // Permission errors
    if (code === 10 || code === 200 || code === 201 || code === 299) {
      return "PERMISSION_DENIED";
    }

    // Token errors
    if (code === 190 || subcode === 460 || subcode === 463 || subcode === 467) {
      return "TOKEN_EXPIRED";
    }

    // Server errors
    if (code === 1 || code === 2) {
      return "SERVER_ERROR";
    }

    // Invalid input
    if (code === 100) {
      return "INVALID_INPUT";
    }

    return "UNKNOWN_ERROR";
  }
}

export const facebookAPIClient = FacebookAPIClientService.getInstance();
