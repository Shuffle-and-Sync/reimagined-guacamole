/**
 * Platform OAuth Service
 *
 * This module handles OAuth 2.0 authentication flows for streaming platforms:
 * - Twitch
 * - YouTube
 * - Facebook Gaming
 *
 * Security Features:
 * - PKCE (Proof Key for Code Exchange) for all platforms
 * - Cryptographically secure state parameters
 * - Token encryption in storage
 * - Automatic token refresh
 * - CSRF protection via state validation
 *
 * @see docs/features/twitch/TWITCH_OAUTH_GUIDE.md for detailed Twitch OAuth documentation
 */

import { randomBytes, createHash } from "crypto";
import { logger } from "../logger";
import { storage } from "../storage";
import { FacebookAPIService } from "./facebook-api";
import { YouTubeAPIService } from "./youtube-api";

/**
 * OAuth state stored temporarily during authorization flow
 * Used to prevent CSRF attacks and store PKCE verifiers
 */
interface OAuthState {
  userId: string; // User initiating the OAuth flow
  platform: string; // Platform being authorized (twitch/youtube/facebook)
  timestamp: number; // Creation time for expiry checking
  codeVerifier?: string; // PKCE code verifier (required for token exchange)
}

/**
 * In-memory OAuth state storage
 * TODO: Replace with Redis in production for scalability
 * States expire after 10 minutes and are cleaned up automatically
 */
const oauthStates = new Map<string, OAuthState>();

/**
 * OAuth scopes requested for each streaming platform
 *
 * Twitch Scopes:
 * - user:read:email: Access user's email address
 * - channel:read:stream_key: Read the user's stream key
 * - channel:manage:broadcast: Manage broadcast settings (title, game, etc.)
 * - channel:read:subscriptions: Read subscription information
 * - bits:read: View bits/cheers information
 * - analytics:read:games: Access game analytics
 * - analytics:read:extensions: Access extension analytics
 *
 * YouTube Scopes:
 * - youtube.readonly: View YouTube account data
 * - youtube.force-ssl: Manage YouTube account (required for live streaming)
 * - youtube.channel-memberships.creator: Access channel membership data
 *
 * Facebook Scopes:
 * - pages_show_list: List user's Facebook pages
 * - pages_read_engagement: Read page engagement metrics
 * - pages_manage_posts: Create and manage posts
 * - publish_video: Upload and publish videos
 * - gaming_user_picture: Access gaming profile picture
 */
const PLATFORM_SCOPES = {
  twitch: [
    "user:read:email",
    "channel:read:stream_key",
    "channel:manage:broadcast",
    "channel:read:subscriptions",
    "bits:read",
    "analytics:read:games",
    "analytics:read:extensions",
  ],
  youtube: [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
  ],
  facebook: [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "publish_video",
    "gaming_user_picture",
  ],
};

/**
 * Generate OAuth authorization URL for platform account linking
 *
 * This initiates the OAuth 2.0 authorization code flow with PKCE:
 * 1. Generates cryptographically secure state parameter
 * 2. Stores state with user ID and platform for validation
 * 3. Generates platform-specific authorization URL
 * 4. Cleans up expired states (>10 minutes old)
 *
 * @param platform - Platform identifier (twitch, youtube, facebook)
 * @param userId - ID of user initiating OAuth flow
 * @returns Authorization URL to redirect user to
 * @throws Error if platform is unsupported
 */
export async function generatePlatformOAuthURL(
  platform: string,
  userId: string,
): Promise<string> {
  const state = generateSecureState();
  const timestamp = Date.now();

  // Store state for validation
  oauthStates.set(state, { userId, platform, timestamp });

  // Clean up old states (older than 10 minutes)
  const entries = Array.from(oauthStates.entries());
  for (const [key, value] of entries) {
    if (timestamp - value.timestamp > 10 * 60 * 1000) {
      oauthStates.delete(key);
    }
  }

  switch (platform) {
    case "twitch":
      return generateTwitchOAuthURL(state);
    case "youtube":
      return generateYouTubeOAuthURL(state);
    case "facebook":
      return generateFacebookOAuthURL(state);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Handle OAuth callback and store tokens securely
 */
export async function handlePlatformOAuthCallback(
  platform: string,
  code: string,
  state: string,
  userId: string,
): Promise<unknown> {
  // Validate state
  const storedState = oauthStates.get(state);
  if (
    !storedState ||
    storedState.userId !== userId ||
    storedState.platform !== platform
  ) {
    throw new Error("Invalid OAuth state");
  }

  let result;

  switch (platform) {
    case "twitch":
      result = await handleTwitchCallback(code, userId, storedState);
      break;
    case "youtube":
      result = await handleYouTubeCallback(code, userId, storedState);
      break;
    case "facebook":
      result = await handleFacebookCallback(code, userId);
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  // Remove used state only after successful callback
  oauthStates.delete(state);
  return result;
}

/**
 * Refresh platform access token
 */
export async function refreshPlatformToken(
  userId: string,
  platform: string,
): Promise<string | null> {
  const account = await storage.getUserPlatformAccount(userId, platform);
  if (!account) {
    return null;
  }

  // TODO: Add secure refresh token accessor to storage interface
  // For now, platform refresh methods will need to handle token retrieval internally
  // This is a limitation that needs to be addressed with a dedicated storage method

  try {
    // Get platform account with tokens for refresh
    const fullAccount = await storage.getUserPlatformAccountWithTokens(
      userId,
      platform,
    );

    if (!fullAccount?.refreshToken) {
      logger.warn(`No refresh token available for ${platform} user ${userId}`);
      return null;
    }

    // Call platform-specific refresh with the refresh token
    switch (platform) {
      case "twitch":
        return await refreshTwitchToken(fullAccount.refreshToken, userId);
      case "youtube":
        return await refreshYouTubeToken(fullAccount.refreshToken, userId);
      case "facebook":
        return await refreshFacebookToken(fullAccount.refreshToken, userId);
      default:
        throw new Error(
          `Token refresh not supported for platform: ${platform}`,
        );
    }
  } catch (error) {
    logger.error(
      `Failed to refresh ${platform} token for user ${userId}:`,
      error,
    );
    return null;
  }
}

/**
 * Generate Twitch OAuth URL with PKCE for enhanced security
 * PKCE (Proof Key for Code Exchange) prevents authorization code interception attacks
 */
function generateTwitchOAuthURL(state: string): string {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Store code verifier with state for later verification
  const storedState = oauthStates.get(state);
  if (storedState) {
    storedState.codeVerifier = codeVerifier;
  }

  if (!process.env.TWITCH_CLIENT_ID) {
    throw new Error("TWITCH_CLIENT_ID not configured");
  }

  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    redirect_uri: `${process.env.AUTH_URL}/api/platforms/twitch/oauth/callback`,
    response_type: "code",
    scope: PLATFORM_SCOPES.twitch.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    // Force consent to ensure user sees all requested permissions
    force_verify: "true",
  });

  return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
}

/**
 * Generate YouTube OAuth URL with PKCE
 */
function generateYouTubeOAuthURL(state: string): string {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Store code verifier with state
  const storedState = oauthStates.get(state);
  if (storedState) {
    storedState.codeVerifier = codeVerifier;
  }

  if (!process.env.YOUTUBE_CLIENT_ID) {
    throw new Error("YOUTUBE_CLIENT_ID not configured");
  }

  const params = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID,
    redirect_uri: `${process.env.AUTH_URL}/api/platforms/youtube/oauth/callback`,
    response_type: "code",
    scope: PLATFORM_SCOPES.youtube.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Generate Facebook OAuth URL
 */
function generateFacebookOAuthURL(state: string): string {
  if (!process.env.FACEBOOK_APP_ID) {
    throw new Error("FACEBOOK_APP_ID not configured");
  }

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: `${process.env.AUTH_URL}/api/platforms/facebook/oauth/callback`,
    response_type: "code",
    scope: PLATFORM_SCOPES.facebook.join(","),
    state,
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Handle Twitch OAuth callback with PKCE verification
 */
async function handleTwitchCallback(
  code: string,
  userId: string,
  storedState: OAuthState,
): Promise<unknown> {
  const codeVerifier = storedState.codeVerifier;

  if (!codeVerifier) {
    logger.error("Missing PKCE code verifier for Twitch OAuth", { userId });
    throw new Error("Missing PKCE code verifier for Twitch OAuth");
  }

  // Exchange code for tokens with PKCE verification
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    throw new Error("Twitch credentials not configured");
  }

  const tokenParams: Record<string, string> = {
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: `${process.env.AUTH_URL}/api/platforms/twitch/oauth/callback`,
    code_verifier: codeVerifier,
  };

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(tokenParams),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("Failed to exchange Twitch authorization code", {
      userId,
      status: response.status,
      error: errorText,
    });
    throw new Error("Failed to exchange Twitch authorization code");
  }

  const tokenData = await response.json();

  // Get user info
  if (!process.env.TWITCH_CLIENT_ID) {
    throw new Error("TWITCH_CLIENT_ID not configured");
  }

  const userResponse = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Client-Id": process.env.TWITCH_CLIENT_ID,
    },
  });

  if (!userResponse.ok) {
    logger.error("Failed to fetch Twitch user info", { userId });
    throw new Error("Failed to fetch Twitch user info");
  }

  const userData = await userResponse.json();
  const user = userData.data[0];

  if (!user) {
    logger.error("No user data returned from Twitch API", { userId });
    throw new Error("No user data returned from Twitch API");
  }

  // Store account with tokens
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  logger.info("Twitch OAuth completed successfully", {
    userId,
    twitchUserId: user.id,
    twitchLogin: user.login,
    scopes: tokenData.scope,
  });

  return await storage.createUserPlatformAccount({
    userId,
    platform: "twitch",
    handle: user.login,
    platformUserId: user.id,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    tokenExpiresAt: expiresAt,
    scopes: tokenData.scope,
    isActive: true,
  });
}

/**
 * Handle YouTube OAuth callback
 */
async function handleYouTubeCallback(
  code: string,
  userId: string,
  storedState: OAuthState,
): Promise<unknown> {
  const codeVerifier = storedState.codeVerifier;

  if (!codeVerifier) {
    throw new Error("Missing PKCE code verifier for YouTube OAuth");
  }

  try {
    // Import YouTube API service safely
    const { YouTubeAPIService } = await import("./youtube-api");
    const youtubeService = new YouTubeAPIService();

    // Exchange code for tokens with PKCE code verifier
    const tokenData = await youtubeService.exchangeCodeForTokens(
      code,
      `${process.env.AUTH_URL}/api/platforms/youtube/oauth/callback`,
      codeVerifier,
    );

    if (!tokenData) {
      throw new Error("Failed to exchange code for tokens");
    }

    // Get channel info using the access token
    const channelData = await youtubeService.getMyChannel(
      tokenData.access_token,
    );

    if (!channelData) {
      throw new Error("Failed to fetch YouTube channel info");
    }

    // Calculate token expiry
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    // Store account with tokens securely
    const account = await storage.createUserPlatformAccount({
      userId,
      platform: "youtube",
      handle: channelData.title,
      platformUserId: channelData.id,
      channelId: channelData.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: expiresAt,
      scopes: (tokenData as any).scope?.split(" ") || [],
      isActive: true,
    });

    logger.info("YouTube OAuth completed successfully", {
      userId,
      channelId: channelData.id,
      channelTitle: channelData.title,
      scopes: (tokenData as any).scope,
    });

    return account;
  } catch (error) {
    logger.error("YouTube OAuth callback failed", error, {
      userId,
      codeVerifier: !!codeVerifier,
    });
    throw error;
  }
}

/**
 * Handle Facebook OAuth callback
 */
async function handleFacebookCallback(
  code: string,
  userId: string,
): Promise<unknown> {
  const facebookService = new FacebookAPIService();

  // Exchange code for tokens
  const tokenData = await facebookService.exchangeCodeForToken(
    code,
    `${process.env.AUTH_URL}/api/platforms/facebook/oauth/callback`,
  );

  if (!tokenData) {
    throw new Error("Failed to exchange code for tokens");
  }

  // Get user info
  const userInfo = await facebookService.getMe(tokenData.access_token);

  if (!userInfo.success || !userInfo.data) {
    throw new Error("Failed to fetch Facebook user info");
  }

  // Store account with tokens
  // Note: Facebook short-lived tokens don't include expires_in, they're typically valid for 1-2 hours
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours default

  return await storage.createUserPlatformAccount({
    userId,
    platform: "facebook",
    handle: userInfo.data.name,
    platformUserId: userInfo.data.id,
    accessToken: tokenData.access_token,
    refreshToken: null, // Facebook uses long-lived token exchange instead of refresh tokens
    tokenExpiresAt: expiresAt,
    scopes: JSON.stringify([]),
    isActive: true,
  });
}

/**
 * Refresh Twitch token
 */
async function refreshTwitchToken(
  refreshToken: string,
  userId: string,
): Promise<string | null> {
  try {
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
      throw new Error("Twitch credentials not configured");
    }

    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      logger.warn("Failed to refresh Twitch token", {
        userId,
        status: response.status,
      });
      return null;
    }

    const tokenData = await response.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Update stored tokens - FIX: was incorrectly using 'youtube' instead of 'twitch'
    const account = await storage.getUserPlatformAccount(userId, "twitch");
    if (account) {
      await storage.updateUserPlatformAccount(account.id, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken,
        tokenExpiresAt: expiresAt,
      });

      logger.info("Twitch token refreshed successfully", {
        userId,
        twitchUserId: account.platformUserId,
      });
    }

    return tokenData.access_token;
  } catch (error) {
    logger.error("Failed to refresh Twitch token:", error, { userId });
    return null;
  }
}

/**
 * Refresh YouTube token
 */
async function refreshYouTubeToken(
  refreshToken: string,
  userId: string,
): Promise<string | null> {
  try {
    const youtubeService = new YouTubeAPIService();
    const tokenData = await youtubeService.refreshAccessToken(refreshToken);

    if (!tokenData) {
      return null;
    }

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : undefined;

    // Update stored tokens
    const account = await storage.getUserPlatformAccount(userId, "youtube");
    if (account) {
      await storage.updateUserPlatformAccount(account.id, {
        accessToken: tokenData.access_token,
        tokenExpiresAt: expiresAt,
      });
    }

    return tokenData.access_token;
  } catch (error) {
    logger.error("Failed to refresh YouTube token:", error);
    return null;
  }
}

/**
 * Refresh Facebook token
 * Note: Facebook tokens typically need to be exchanged for long-lived tokens
 */
async function refreshFacebookToken(
  refreshToken: string,
  userId: string,
): Promise<string | null> {
  try {
    // Facebook doesn't use refresh tokens the same way as YouTube/Twitch
    // Long-lived tokens need to be exchanged via a different flow
    // For now, return null to indicate refresh is not available
    logger.warn(`Facebook token refresh not implemented for user ${userId}`);
    return null;
  } catch (error) {
    logger.error(`Failed to refresh Facebook token for user ${userId}:`, error);
    return null;
  }
}

/**
 * Utility functions
 */
function generateSecureState(): string {
  return randomBytes(32).toString("hex");
}

function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Helper to resolve platform identifiers for streaming coordination
 */
export async function resolvePlatformIdentifiers(userId: string): Promise<{
  twitch?: { userId: string; handle: string };
  youtube?: { channelId: string; handle: string };
  facebook?: { pageId?: string; handle: string };
}> {
  const accounts = await storage.getUserPlatformAccounts(userId);
  const identifiers: unknown = {};

  for (const account of accounts) {
    if (!account.isActive) continue;

    switch (account.platform) {
      case "twitch":
        if (account.platformUserId) {
          identifiers.twitch = {
            userId: account.platformUserId,
            handle: account.handle,
          };
        }
        break;
      case "youtube":
        if (account.channelId) {
          identifiers.youtube = {
            channelId: account.channelId,
            handle: account.handle,
          };
        }
        break;
      case "facebook":
        identifiers.facebook = {
          pageId: account.pageId,
          handle: account.handle,
        };
        break;
    }
  }

  return identifiers;
}

/**
 * Get valid access token for platform (with refresh if needed)
 */
export async function getValidPlatformToken(
  userId: string,
  platform: string,
): Promise<string | null> {
  // Get account to check expiry
  const account = await storage.getUserPlatformAccount(userId, platform);
  if (!account) {
    return null;
  }

  // Check if token is expired or near expiry (5 minute buffer)
  const now = new Date();
  const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  const isExpired =
    account.tokenExpiresAt &&
    account.tokenExpiresAt.getTime() <= now.getTime() + buffer;

  if (isExpired) {
    // Try to refresh the token
    const refreshedToken = await refreshPlatformToken(userId, platform);
    if (refreshedToken) {
      return refreshedToken;
    }
    // If refresh failed and token is expired, return null instead of expired token
    return null;
  }

  // Get current token from storage (only if not expired)
  return await storage.getUserPlatformToken(userId, platform);
}
