import { Request, Response } from "express";
import { logger } from "../logger";
import { createHmac, timingSafeEqual } from "crypto";

// Twitch API configuration
const TWITCH_API_BASE = "https://api.twitch.tv/helix";
const TWITCH_OAUTH_BASE = "https://id.twitch.tv/oauth2";

// Types for Twitch OAuth token response
interface TwitchOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

// Types for Twitch API generic response wrapper
interface TwitchAPIResponse<T> {
  data: T[];
}

// Types for Twitch API responses
export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email?: string;
  created_at: string;
}

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: "live" | "";
  title: string;
  tags: string[];
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

export interface TwitchCategory {
  id: string;
  name: string;
  box_art_url: string;
}

export interface TwitchWebhookEvent {
  id: string;
  event_type: string;
  event_timestamp: string;
  version: string;
  event_data: Record<string, unknown>;
}

export interface TwitchEventSubSubscription {
  id: string;
  status:
    | "enabled"
    | "webhook_callback_verification_pending"
    | "webhook_callback_verification_failed"
    | "notification_failures_exceeded";
  type: string;
  version: string;
  condition: Record<string, string | number>;
  transport: {
    method: "webhook";
    callback: string;
  };
  created_at: string;
  cost: number;
}

/**
 * Twitch API Service for handling Twitch API interactions and EventSub webhooks
 */
export class TwitchAPIService {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  /**
   * Get app access token for API calls
   */
  private async getAppAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (
      this.accessToken &&
      this.tokenExpiresAt &&
      Date.now() < this.tokenExpiresAt
    ) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${TWITCH_OAUTH_BASE}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: "client_credentials",
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get Twitch access token: ${response.status} ${response.statusText}`,
        );
      }

      const data: TwitchOAuthTokenResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60000; // Subtract 1 minute for safety

      if (!this.accessToken) {
        throw new Error("Failed to obtain valid access token from Twitch");
      }

      return this.accessToken;
    } catch (error) {
      logger.error("Error getting Twitch access token", error);
      throw error;
    }
  }

  /**
   * Make authenticated request to Twitch API
   */
  private async makeAPIRequest<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getAppAccessToken();

    const response = await fetch(`${TWITCH_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Client-ID": this.clientId,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Twitch API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  /**
   * Get user information by username or ID
   */
  async getUser(login?: string, id?: string): Promise<TwitchUser | null> {
    const params = new URLSearchParams();
    if (login) params.append("login", login);
    if (id) params.append("id", id);

    if (!params.toString()) {
      throw new Error("Either login or id must be provided");
    }

    try {
      const data = await this.makeAPIRequest<TwitchAPIResponse<TwitchUser>>(
        `/users?${params.toString()}`,
      );
      return data.data?.[0] || null;
    } catch (error) {
      logger.error("Error fetching Twitch user", error);
      return null;
    }
  }

  /**
   * Get stream information for a user
   */
  async getStream(userLogin: string): Promise<TwitchStream | null> {
    try {
      const data = await this.makeAPIRequest<TwitchAPIResponse<TwitchStream>>(
        `/streams?user_login=${userLogin}`,
      );
      return data.data?.[0] || null;
    } catch (error) {
      logger.error("Error fetching Twitch stream", error);
      return null;
    }
  }

  /**
   * Get multiple streams by user logins
   */
  async getStreams(userLogins: string[]): Promise<TwitchStream[]> {
    if (userLogins.length === 0) return [];

    const params = userLogins
      .map((login) => `user_login=${encodeURIComponent(login)}`)
      .join("&");

    try {
      const data = await this.makeAPIRequest<TwitchAPIResponse<TwitchStream>>(
        `/streams?${params}`,
      );
      return data.data || [];
    } catch (error) {
      logger.error("Error fetching Twitch streams", error);
      return [];
    }
  }

  /**
   * Get game/category information
   */
  async getCategories(
    names?: string[],
    ids?: string[],
  ): Promise<TwitchCategory[]> {
    const params = new URLSearchParams();
    names?.forEach((name) => params.append("name", name));
    ids?.forEach((id) => params.append("id", id));

    if (!params.toString()) {
      throw new Error("Either names or ids must be provided");
    }

    try {
      const data = await this.makeAPIRequest<TwitchAPIResponse<TwitchCategory>>(
        `/games?${params.toString()}`,
      );
      return data.data || [];
    } catch (error) {
      logger.error("Error fetching Twitch categories", error);
      return [];
    }
  }

  /**
   * Search for categories/games
   */
  async searchCategories(query: string): Promise<TwitchCategory[]> {
    try {
      const data = await this.makeAPIRequest<TwitchAPIResponse<TwitchCategory>>(
        `/search/categories?query=${encodeURIComponent(query)}`,
      );
      return data.data || [];
    } catch (error) {
      logger.error("Error searching Twitch categories", error);
      return [];
    }
  }

  /**
   * Subscribe to EventSub webhook events
   */
  async subscribeToEvent(
    type: string,
    version: string,
    condition: Record<string, string | number>,
    callbackUrl: string,
    secret: string,
  ): Promise<TwitchEventSubSubscription | null> {
    try {
      const data = await this.makeAPIRequest<
        TwitchAPIResponse<TwitchEventSubSubscription>
      >("/eventsub/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          type,
          version,
          condition,
          transport: {
            method: "webhook",
            callback: callbackUrl,
            secret,
          },
        }),
      });

      return data.data?.[0] || null;
    } catch (error) {
      logger.error("Error subscribing to Twitch EventSub", error);
      return null;
    }
  }

  /**
   * Get existing EventSub subscriptions
   */
  async getSubscriptions(): Promise<TwitchEventSubSubscription[]> {
    try {
      const data = await this.makeAPIRequest<
        TwitchAPIResponse<TwitchEventSubSubscription>
      >("/eventsub/subscriptions");
      return data.data || [];
    } catch (error) {
      logger.error("Error fetching Twitch EventSub subscriptions", error);
      return [];
    }
  }

  /**
   * Delete EventSub subscription
   */
  async deleteSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await this.makeAPIRequest(
        `/eventsub/subscriptions?id=${subscriptionId}`,
        {
          method: "DELETE",
        },
      );
      return true;
    } catch (error) {
      logger.error("Error deleting Twitch EventSub subscription", error);
      return false;
    }
  }

  // Store for message ID replay protection
  private processedMessageIds = new Set<string>();
  private messageIdCleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID || "";
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET || "";

    if (!this.clientId || !this.clientSecret) {
      logger.warn(
        "Twitch API credentials not configured. Twitch integration will be disabled.",
      );
      // Don't throw error - allow server to start without Twitch integration
      return;
    }

    // Clean up old message IDs every hour to prevent memory leaks
    this.messageIdCleanupInterval = setInterval(
      () => {
        this.processedMessageIds.clear();
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Verify webhook signature and prevent replay attacks for EventSub
   */
  verifyWebhookSignature(
    headers: Record<string, string>,
    body: string,
    secret: string,
  ): { valid: boolean; error?: string } {
    const messageId = headers["twitch-eventsub-message-id"];
    const timestamp = headers["twitch-eventsub-message-timestamp"];
    const signature = headers["twitch-eventsub-message-signature"];

    if (!messageId || !timestamp || !signature) {
      return { valid: false, error: "Missing required headers" };
    }

    // Check for replay attacks
    if (this.processedMessageIds.has(messageId)) {
      return {
        valid: false,
        error: "Message already processed (replay attack)",
      };
    }

    // Check timestamp to prevent old message replay (10 minutes tolerance)
    const messageTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const timeDifference = Math.abs(currentTime - messageTime);

    if (timeDifference > 10 * 60 * 1000) {
      return { valid: false, error: "Message timestamp too old" };
    }

    // Verify HMAC signature
    const message = messageId + timestamp + body;
    const expectedSignature =
      "sha256=" + createHmac("sha256", secret).update(message).digest("hex");

    const isValidSignature = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );

    if (!isValidSignature) {
      return { valid: false, error: "Invalid signature" };
    }

    // Store message ID to prevent replay
    this.processedMessageIds.add(messageId);

    return { valid: true };
  }

  /**
   * Handle EventSub webhook callback with proper security verification
   */
  handleWebhook(req: Request, res: Response): TwitchWebhookEvent | null {
    const messageType = req.headers["twitch-eventsub-message-type"] as string;
    const body = JSON.stringify(req.body);
    const secret = process.env.TWITCH_EVENTSUB_SECRET;

    if (!secret) {
      logger.error("TWITCH_EVENTSUB_SECRET not configured");
      res.status(500).send("Server configuration error");
      return null;
    }

    // Verify signature and prevent replay attacks
    const verification = this.verifyWebhookSignature(
      req.headers as Record<string, string>,
      body,
      secret,
    );
    if (!verification.valid) {
      logger.warn("Twitch webhook verification failed", {
        error: verification.error,
      });
      res.status(403).send("Forbidden");
      return null;
    }

    // Handle challenge verification (subscription setup)
    if (messageType === "webhook_callback_verification") {
      const challenge = req.body.challenge;
      logger.info("Twitch EventSub challenge verified");
      res.status(200).send(challenge);
      return null;
    }

    // Handle notification
    if (messageType === "notification") {
      const event: TwitchWebhookEvent = {
        id: req.body.subscription?.id || "",
        event_type: req.body.subscription?.type || "",
        event_timestamp: req.body.event?.started_at || new Date().toISOString(),
        version: req.body.subscription?.version || "1",
        event_data: req.body.event || {},
      };

      logger.info("Twitch EventSub notification received", {
        eventType: event.event_type,
      });
      res.status(204).send();
      return event;
    }

    // Handle revocation
    if (messageType === "revocation") {
      logger.info("Twitch EventSub subscription revoked", {
        subscription: req.body.subscription,
      });
      res.status(204).send();
      return null;
    }

    logger.warn("Unknown Twitch EventSub message type", { messageType });
    res.status(400).send("Bad Request");
    return null;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.messageIdCleanupInterval) {
      clearInterval(this.messageIdCleanupInterval);
      this.messageIdCleanupInterval = null;
    }
  }
}

// Export singleton instance
export const twitchAPI = new TwitchAPIService();
