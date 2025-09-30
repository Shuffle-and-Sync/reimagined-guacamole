import { randomBytes, createHash } from 'crypto';
import { storage } from '../storage';
import { logger } from '../logger';
import { YouTubeAPIService } from './youtube-api';
import { FacebookAPIService } from './facebook-api';

interface OAuthState {
  userId: string;
  platform: string;
  timestamp: number;
  codeVerifier?: string; // For PKCE
}

// Store OAuth states temporarily (in production, use Redis)
const oauthStates = new Map<string, OAuthState>();

/**
 * Platform OAuth scopes for each platform
 */
const PLATFORM_SCOPES = {
  twitch: [
    'user:read:email',
    'channel:read:stream_key',
    'channel:manage:broadcast',
    'channel:read:subscriptions',
    'bits:read',
    'analytics:read:games',
    'analytics:read:extensions'
  ],
  youtube: [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/youtube.channel-memberships.creator'
  ],
  facebook: [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'publish_video',
    'gaming_user_picture'
  ]
};

/**
 * Generate OAuth authorization URL for platform account linking
 */
export async function generatePlatformOAuthURL(platform: string, userId: string): Promise<string> {
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
    case 'twitch':
      return generateTwitchOAuthURL(state);
    case 'youtube':
      return generateYouTubeOAuthURL(state);
    case 'facebook':
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
  userId: string
): Promise<any> {
  // Validate state
  const storedState = oauthStates.get(state);
  if (!storedState || storedState.userId !== userId || storedState.platform !== platform) {
    throw new Error('Invalid OAuth state');
  }
  
  let result;
  
  switch (platform) {
    case 'twitch':
      result = await handleTwitchCallback(code, userId);
      break;
    case 'youtube':
      result = await handleYouTubeCallback(code, userId, storedState);
      break;
    case 'facebook':
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
export async function refreshPlatformToken(userId: string, platform: string): Promise<string | null> {
  const account = await storage.getUserPlatformAccount(userId, platform);
  if (!account) {
    return null;
  }
  
  // TODO: Add secure refresh token accessor to storage interface
  // For now, platform refresh methods will need to handle token retrieval internally
  // This is a limitation that needs to be addressed with a dedicated storage method
  
  try {
    // Get platform account with tokens for refresh
    const fullAccount = await storage.getUserPlatformAccountWithTokens(userId, platform);
    
    if (!fullAccount?.refreshToken) {
      logger.warn(`No refresh token available for ${platform} user ${userId}`);
      return null;
    }
    
    // Call platform-specific refresh with the refresh token
    switch (platform) {
      case 'twitch':
        return await refreshTwitchToken(fullAccount.refreshToken, userId);
      case 'youtube':
        return await refreshYouTubeToken(fullAccount.refreshToken, userId);
      case 'facebook':
        return await refreshFacebookToken(fullAccount.refreshToken, userId);
      default:
        throw new Error(`Token refresh not supported for platform: ${platform}`);
    }
  } catch (error) {
    logger.error(`Failed to refresh ${platform} token for user ${userId}:`, error);
    return null;
  }
}

/**
 * Generate Twitch OAuth URL
 */
function generateTwitchOAuthURL(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID!,
    redirect_uri: `${process.env.AUTH_URL}/api/platforms/twitch/oauth/callback`,
    response_type: 'code',
    scope: PLATFORM_SCOPES.twitch.join(' '),
    state,
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
  
  const params = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID!,
    redirect_uri: `${process.env.AUTH_URL}/api/platforms/youtube/oauth/callback`,
    response_type: 'code',
    scope: PLATFORM_SCOPES.youtube.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Generate Facebook OAuth URL
 */
function generateFacebookOAuthURL(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: `${process.env.AUTH_URL}/api/platforms/facebook/oauth/callback`,
    response_type: 'code',
    scope: PLATFORM_SCOPES.facebook.join(','),
    state,
  });
  
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Handle Twitch OAuth callback
 */
async function handleTwitchCallback(code: string, userId: string): Promise<any> {
  // Exchange code for tokens
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.AUTH_URL}/api/platforms/twitch/oauth/callback`,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to exchange Twitch authorization code');
  }
  
  const tokenData = await response.json();
  
  // Get user info
  const userResponse = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID!,
    },
  });
  
  if (!userResponse.ok) {
    throw new Error('Failed to fetch Twitch user info');
  }
  
  const userData = await userResponse.json();
  const user = userData.data[0];
  
  // Store account with tokens
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
  
  return await storage.createUserPlatformAccount({
    userId,
    platform: 'twitch',
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
async function handleYouTubeCallback(code: string, userId: string, storedState: OAuthState): Promise<any> {
  const codeVerifier = storedState.codeVerifier;
  
  if (!codeVerifier) {
    throw new Error('Missing PKCE code verifier for YouTube OAuth');
  }
  
  try {
    // Import YouTube API service safely
    const { YouTubeAPIService } = await import('./youtube-api');
    const youtubeService = new YouTubeAPIService();
    
    // Exchange code for tokens with PKCE code verifier
    const tokenData = await youtubeService.exchangeCodeForTokens(
      code, 
      `${process.env.AUTH_URL}/api/platforms/youtube/oauth/callback`,
      codeVerifier
    );
    
    // Get channel info using the access token
    const channelData = await youtubeService.getMyChannel(tokenData.access_token);
    
    if (!channelData) {
      throw new Error('Failed to fetch YouTube channel info');
    }
    
    // Calculate token expiry
    const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null;
    
    // Store account with tokens securely
    const account = await storage.createUserPlatformAccount({
      userId,
      platform: 'youtube',
      handle: channelData.title,
      platformUserId: channelData.id,
      channelId: channelData.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: expiresAt,
      scopes: (tokenData as any).scope?.split(' ') || [],
      isActive: true,
    });
    
    logger.info('YouTube OAuth completed successfully', { 
      userId, 
      channelId: channelData.id, 
      channelTitle: channelData.title,
      scopes: (tokenData as any).scope 
    });
    
    return account;
  } catch (error) {
    logger.error('YouTube OAuth callback failed', error, { userId, codeVerifier: !!codeVerifier });
    throw error;
  }
}

/**
 * Handle Facebook OAuth callback
 */
async function handleFacebookCallback(code: string, userId: string): Promise<any> {
  const facebookService = new FacebookAPIService();
  
  // Exchange code for tokens
  const tokenData = await facebookService.exchangeCodeForTokens(code, `${process.env.AUTH_URL}/api/platforms/facebook/oauth/callback`);
  
  // Get user info
  const userInfo = await facebookService.getMe(tokenData.access_token);
  
  if (!userInfo.success) {
    throw new Error('Failed to fetch Facebook user info');
  }
  
  // Store account with tokens
  const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null;
  
  return await storage.createUserPlatformAccount({
    userId,
    platform: 'facebook',
    handle: userInfo.data.name,
    platformUserId: userInfo.data.id,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    tokenExpiresAt: expiresAt,
    scopes: [],
    isActive: true,
  });
}

/**
 * Refresh Twitch token
 */
async function refreshTwitchToken(refreshToken: string, userId: string): Promise<string | null> {
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    
    if (!response.ok) {
      return null;
    }
    
    const tokenData = await response.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    
    // Update stored tokens
    const account = await storage.getUserPlatformAccount(userId, 'youtube');
    if (account) {
      await storage.updateUserPlatformAccount(account.id, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken,
        tokenExpiresAt: expiresAt,
      });
    }
    
    return tokenData.access_token;
  } catch (error) {
    logger.error('Failed to refresh Twitch token:', error);
    return null;
  }
}

/**
 * Refresh YouTube token
 */
async function refreshYouTubeToken(refreshToken: string, userId: string): Promise<string | null> {
  try {
    const youtubeService = new YouTubeAPIService();
    const tokenData = await youtubeService.refreshAccessToken(refreshToken);
    
    if (!tokenData) {
      return null;
    }
    
    const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null;
    
    // Update stored tokens
    const account = await storage.getUserPlatformAccount(userId, 'youtube');
    if (account) {
      await storage.updateUserPlatformAccount(account.id, {
        accessToken: tokenData.access_token,
        tokenExpiresAt: expiresAt,
      });
    }
    
    return tokenData.access_token;
  } catch (error) {
    logger.error('Failed to refresh YouTube token:', error);
    return null;
  }
}

/**
 * Refresh Facebook token
 * Note: Facebook tokens typically need to be exchanged for long-lived tokens
 */
async function refreshFacebookToken(refreshToken: string, userId: string): Promise<string | null> {
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
  return randomBytes(32).toString('hex');
}

function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
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
  const identifiers: any = {};
  
  for (const account of accounts) {
    if (!account.isActive) continue;
    
    switch (account.platform) {
      case 'twitch':
        if (account.platformUserId) {
          identifiers.twitch = {
            userId: account.platformUserId,
            handle: account.handle
          };
        }
        break;
      case 'youtube':
        if (account.channelId) {
          identifiers.youtube = {
            channelId: account.channelId,
            handle: account.handle
          };
        }
        break;
      case 'facebook':
        identifiers.facebook = {
          pageId: account.pageId,
          handle: account.handle
        };
        break;
    }
  }
  
  return identifiers;
}

/**
 * Get valid access token for platform (with refresh if needed)
 */
export async function getValidPlatformToken(userId: string, platform: string): Promise<string | null> {
  // Get account to check expiry
  const account = await storage.getUserPlatformAccount(userId, platform);
  if (!account) {
    return null;
  }
  
  // Check if token is expired or near expiry (5 minute buffer)
  const now = new Date();
  const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  const isExpired = account.tokenExpiresAt && account.tokenExpiresAt.getTime() <= (now.getTime() + buffer);
  
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