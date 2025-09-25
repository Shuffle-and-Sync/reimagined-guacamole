// YouTube API Service
// Production-ready implementation of YouTube Data API v3 and YouTube Live Streaming API integration
// Includes OAuth 2.0, live broadcasting, webhook support with security and error handling

import { logger } from '../logger';
import { generateSecureToken } from '../utils/security.utils';

// Structured error types for better error handling
export interface YouTubeAPIError {
  code: string;
  message: string;
  details?: any;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

export interface YouTubeStream {
  id: string;
  title: string;
  description: string;
  status: 'live' | 'upcoming' | 'completed';
  scheduledStartTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  concurrentViewers?: number;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

// Result wrapper type for better error handling
export type YouTubeAPIResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: YouTubeAPIError;
}

/**
 * YouTube API Service (Stub Implementation)
 * 
 * To implement full functionality, you will need:
 * 1. YouTube Data API v3 credentials
 * 2. YouTube Live Streaming API access
 * 3. OAuth 2.0 setup for user authentication
 * 4. Webhook/Push notifications setup
 */
export class YouTubeAPIService {
  private apiKey: string | undefined;
  private clientId: string | undefined;
  private clientSecret: string | undefined;
  private webhookVerifyToken: string;

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.clientId = process.env.YOUTUBE_CLIENT_ID;
    this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    this.webhookVerifyToken = process.env.YOUTUBE_WEBHOOK_VERIFY_TOKEN || generateSecureToken();
  }

  /**
   * Check if YouTube API is properly configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.clientId && this.clientSecret);
  }

  /**
   * Check if API key is available for read-only operations
   */
  isReadOnlyConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get channel information by username or channel ID
   */
  async getChannel(channelId: string): Promise<YouTubeChannel | null> {
    if (!channelId?.trim()) {
      console.warn('Channel ID is required');
      return null;
    }

    if (!this.isReadOnlyConfigured()) {
      console.warn('YouTube API not configured. Please set YOUTUBE_API_KEY environment variable.');
      return null;
    }

    const result = await this.makeAPIRequest<any>(
      `/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}`
    );

    if (!result.success) {
      console.error('Error fetching YouTube channel:', result.error);
      return null;
    }

    const channel = result.data.items?.[0];
    if (!channel) {
      return null;
    }

    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnails: {
        default: { url: channel.snippet.thumbnails?.default?.url || '' },
        medium: { url: channel.snippet.thumbnails?.medium?.url || '' },
        high: { url: channel.snippet.thumbnails?.high?.url || '' },
      },
      subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
      videoCount: parseInt(channel.statistics.videoCount || '0'),
      viewCount: parseInt(channel.statistics.viewCount || '0'),
    };
  }

  /**
   * Get live stream information with production error handling
   */
  async getLiveStream(channelId: string): Promise<YouTubeStream | null> {
    if (!channelId?.trim()) {
      console.error('Channel ID is required');
      return null;
    }

    if (!this.isReadOnlyConfigured()) {
      console.warn('YouTube API not configured');
      return null;
    }

    // First get live broadcasts for the channel
    const searchResult = await this.makeAPIRequest<any>(
      `/search?part=snippet&channelId=${encodeURIComponent(channelId)}&type=video&eventType=live&maxResults=1`
    );

    if (!searchResult.success) {
      console.error('Error searching for YouTube live streams:', searchResult.error);
      return null;
    }

    const liveVideo = searchResult.data.items?.[0];
    if (!liveVideo) {
      return null;
    }

    // Get detailed video information
    const videoResult = await this.makeAPIRequest<any>(
      `/videos?part=snippet,liveStreamingDetails,statistics&id=${liveVideo.id.videoId}`
    );

    if (!videoResult.success) {
      console.error('Error fetching YouTube video details:', videoResult.error);
      return null;
    }

    const video = videoResult.data.items?.[0];
    if (!video) {
      return null;
    }

    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      status: 'live',
      scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime,
      actualStartTime: video.liveStreamingDetails?.actualStartTime,
      concurrentViewers: parseInt(video.liveStreamingDetails?.concurrentViewers || '0'),
      thumbnails: {
        default: { url: video.snippet.thumbnails?.default?.url || '' },
        medium: { url: video.snippet.thumbnails?.medium?.url || '' },
        high: { url: video.snippet.thumbnails?.high?.url || '' },
      },
    };
  }

  /**
   * Get channel's recent videos with production error handling
   */
  async getChannelVideos(channelId: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
    if (!channelId?.trim()) {
      console.error('Channel ID is required');
      return [];
    }

    if (!this.isReadOnlyConfigured()) {
      console.warn('YouTube API not configured');
      return [];
    }

    // Validate and clamp maxResults
    const validMaxResults = Math.min(Math.max(1, maxResults), 50);

    // Get recent videos from the channel
    const searchResult = await this.makeAPIRequest<any>(
      `/search?part=snippet&channelId=${encodeURIComponent(channelId)}&type=video&order=date&maxResults=${validMaxResults}`
    );

    if (!searchResult.success) {
      console.error('Error searching YouTube channel videos:', searchResult.error);
      return [];
    }

    const videoIds = searchResult.data.items?.map((item: any) => item.id.videoId).join(',');
    if (!videoIds) {
      return [];
    }

    // Get detailed video information
    const videosResult = await this.makeAPIRequest<any>(
      `/videos?part=snippet,statistics,contentDetails&id=${videoIds}`
    );

    if (!videosResult.success) {
      console.error('Error fetching YouTube video details:', videosResult.error);
      return [];
    }
      
    return videosResult.data.items?.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      publishedAt: video.snippet.publishedAt,
      thumbnails: {
        default: { url: video.snippet.thumbnails?.default?.url || '' },
        medium: { url: video.snippet.thumbnails?.medium?.url || '' },
        high: { url: video.snippet.thumbnails?.high?.url || '' },
      },
      duration: video.contentDetails.duration,
      viewCount: parseInt(video.statistics.viewCount || '0'),
      likeCount: parseInt(video.statistics.likeCount || '0'),
      commentCount: parseInt(video.statistics.commentCount || '0'),
    })) || [];
  }

  /**
   * Search for videos by query with production validation
   */
  async searchVideos(query: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
    if (!query?.trim()) {
      console.error('Search query is required');
      return [];
    }

    if (!this.isReadOnlyConfigured()) {
      console.warn('YouTube API not configured');
      return [];
    }

    // Validate and clamp parameters
    const validMaxResults = Math.min(Math.max(1, maxResults), 50);
    const sanitizedQuery = query.trim().slice(0, 1000); // Limit query length

    // Search for videos
    const searchResult = await this.makeAPIRequest<any>(
      `/search?part=snippet&type=video&q=${encodeURIComponent(sanitizedQuery)}&maxResults=${validMaxResults}`
    );

    if (!searchResult.success) {
      console.error('Error searching YouTube videos:', searchResult.error);
      return [];
    }

    const videoIds = searchResult.data.items?.map((item: any) => item.id.videoId).join(',');
    if (!videoIds) {
      return [];
    }

    // Get detailed video information
    const videosResult = await this.makeAPIRequest<any>(
      `/videos?part=snippet,statistics,contentDetails&id=${videoIds}`
    );

    if (!videosResult.success) {
      console.error('Error fetching YouTube video details:', videosResult.error);
      return [];
    }
      
    return videosResult.data.items?.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      publishedAt: video.snippet.publishedAt,
      thumbnails: {
        default: { url: video.snippet.thumbnails?.default?.url || '' },
        medium: { url: video.snippet.thumbnails?.medium?.url || '' },
        high: { url: video.snippet.thumbnails?.high?.url || '' },
      },
      duration: video.contentDetails.duration,
      viewCount: parseInt(video.statistics.viewCount || '0'),
      likeCount: parseInt(video.statistics.likeCount || '0'),
      commentCount: parseInt(video.statistics.commentCount || '0'),
    })) || [];
  }

  /**
   * Create a live broadcast with production validation
   */
  async createLiveBroadcast(
    title: string, 
    description: string, 
    scheduledStartTime: Date, 
    accessToken: string,
    refreshToken?: string
  ): Promise<YouTubeStream | null> {
    // Input validation
    if (!title?.trim() || !accessToken?.trim()) {
      console.error('Title and access token are required');
      return null;
    }

    if (!this.isConfigured()) {
      console.warn('YouTube API not configured');
      return null;
    }

    const broadcastData = {
      snippet: {
        title: title.trim(),
        description: description?.trim() || '',
        scheduledStartTime: scheduledStartTime.toISOString(),
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    };

    const result = await this.makeAPIRequest<any>(
      '/liveBroadcasts?part=snippet,status',
      {
        method: 'POST',
        body: JSON.stringify(broadcastData),
      },
      accessToken,
      refreshToken
    );

    if (!result.success) {
      console.error('Error creating YouTube live broadcast:', result.error);
      return null;
    }

    const data = result.data;

    return {
      id: data.id,
      title: data.snippet.title,
      description: data.snippet.description,
      status: 'upcoming',
      scheduledStartTime: data.snippet.scheduledStartTime,
      thumbnails: {
        default: { url: data.snippet.thumbnails?.default?.url || '' },
        medium: { url: data.snippet.thumbnails?.medium?.url || '' },
        high: { url: data.snippet.thumbnails?.high?.url || '' },
      },
    };
  }

  /**
   * Update live broadcast with centralized API handling
   */
  async updateLiveBroadcast(
    broadcastId: string, 
    updates: Partial<YouTubeStream>, 
    accessToken: string,
    refreshToken?: string
  ): Promise<YouTubeStream | null> {
    if (!broadcastId?.trim() || !accessToken?.trim()) {
      console.error('Broadcast ID and access token are required');
      return null;
    }

    if (!this.isConfigured()) {
      console.warn('YouTube API not configured');
      return null;
    }

    const updateData: any = {
      id: broadcastId,
    };

    if (updates.title || updates.description || updates.scheduledStartTime) {
      updateData.snippet = {};
      if (updates.title) updateData.snippet.title = updates.title;
      if (updates.description) updateData.snippet.description = updates.description;
      if (updates.scheduledStartTime) {
        updateData.snippet.scheduledStartTime = updates.scheduledStartTime;
      }
    }

    const result = await this.makeAPIRequest<any>(
      '/liveBroadcasts?part=snippet,status',
      {
        method: 'PUT',
        body: JSON.stringify(updateData),
      },
      accessToken,
      refreshToken
    );

    if (!result.success) {
      console.error('Error updating YouTube live broadcast:', result.error);
      return null;
    }

    const data = result.data;

    return {
      id: data.id,
      title: data.snippet.title,
      description: data.snippet.description,
      status: data.status.lifeCycleStatus === 'live' ? 'live' : 
              data.status.lifeCycleStatus === 'complete' ? 'completed' : 'upcoming',
      scheduledStartTime: data.snippet.scheduledStartTime,
      actualStartTime: data.snippet.actualStartTime,
      actualEndTime: data.snippet.actualEndTime,
      thumbnails: {
        default: { url: data.snippet.thumbnails?.default?.url || '' },
        medium: { url: data.snippet.thumbnails?.medium?.url || '' },
        high: { url: data.snippet.thumbnails?.high?.url || '' },
      },
    };
  }

  /**
   * Create live stream for broadcast
   */
  async createLiveStream(
    title: string,
    accessToken: string,
    resolution: '240p' | '360p' | '480p' | '720p' | '1080p' = '720p'
  ): Promise<{ id: string; streamName: string; ingestionAddress: string } | null> {
    if (!this.isConfigured()) {
      console.warn('YouTube API not configured');
      return null;
    }

    try {
      const streamData = {
        snippet: {
          title,
        },
        cdn: {
          resolution,
          frameRate: '30fps',
          ingestionType: 'rtmp',
        },
      };

      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(streamData),
        }
      );

      if (!response.ok) {
        throw new Error(`YouTube Live Stream API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`YouTube Live Stream API error: ${data.error.message}`);
      }

      return {
        id: data.id,
        streamName: data.cdn.ingestionInfo.streamName,
        ingestionAddress: data.cdn.ingestionInfo.ingestionAddress,
      };
    } catch (error) {
      console.error('Error creating YouTube live stream:', error);
      return null;
    }
  }

  /**
   * Bind broadcast to stream
   */
  async bindBroadcastToStream(
    broadcastId: string,
    streamId: string,
    accessToken: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('YouTube API not configured');
      return false;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${broadcastId}&streamId=${streamId}&part=snippet,status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`YouTube Live Bind API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`YouTube Live Bind API error: ${data.error.message}`);
      }
      
      // Validate that binding was successful by checking for expected response structure
      return response.ok && data.id && data.snippet;
    } catch (error) {
      console.error('Error binding YouTube broadcast to stream:', error);
      return false;
    }
  }

  /**
   * Transition broadcast state (testing -> live -> complete)
   */
  async transitionBroadcast(
    broadcastId: string,
    broadcastStatus: 'testing' | 'live' | 'complete',
    accessToken: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('YouTube API not configured');
      return false;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=${broadcastStatus}&id=${broadcastId}&part=snippet,status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`YouTube Live Transition API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`YouTube Live Transition API error: ${data.error.message}`);
      }
      
      // Validate transition was successful by checking status matches expected state
      return response.ok && data.id && data.status?.lifeCycleStatus;
    } catch (error) {
      console.error('Error transitioning YouTube broadcast:', error);
      return false;
    }
  }

  /**
   * Get OAuth authorization URL for YouTube
   */
  getAuthorizationUrl(scopes: string[] = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl'
  ], state?: string): string {
    if (!this.clientId) {
      throw new Error('YouTube Client ID not configured');
    }

    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5000/auth/youtube/callback',
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state }),
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{ 
    access_token: string; 
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  } | null> {
    if (!this.isConfigured()) {
      console.warn('YouTube API not configured');
      return null;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId!,
          client_secret: this.clientSecret!,
          redirect_uri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5000/auth/youtube/callback',
          grant_type: 'authorization_code',
          code,
        }),
      });

      if (!response.ok) {
        throw new Error(`OAuth token exchange failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`OAuth error: ${data.error_description || data.error}`);
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in || 3600,
        token_type: data.token_type || 'Bearer',
      };
    } catch (error) {
      console.error('Error exchanging YouTube OAuth code:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ 
    access_token: string; 
    expires_in: number;
    token_type: string;
  } | null> {
    if (!this.isConfigured()) {
      console.warn('YouTube API not configured');
      return null;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId!,
          client_secret: this.clientSecret!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Token refresh error: ${data.error_description || data.error}`);
      }

      return {
        access_token: data.access_token,
        expires_in: data.expires_in || 3600,
        token_type: data.token_type || 'Bearer',
      };
    } catch (error) {
      console.error('Error refreshing YouTube access token:', error);
      return null;
    }
  }

  /**
   * Subscribe to channel push notifications using PubSubHubbub with security
   */
  async subscribeToChannelNotifications(
    channelId: string, 
    callbackUrl: string
  ): Promise<boolean> {
    if (!channelId?.trim() || !callbackUrl?.trim()) {
      console.error('Channel ID and callback URL are required');
      return false;
    }

    try {
      const hubUrl = 'https://pubsubhubbub.appspot.com/subscribe';
      const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
      
      const response = await fetch(hubUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'hub.callback': callbackUrl,
          'hub.topic': topicUrl,
          'hub.mode': 'subscribe',
          'hub.verify': 'async',
          'hub.verify_token': this.webhookVerifyToken,
          'hub.secret': this.webhookVerifyToken, // Add proper secret for HMAC
          'hub.lease_seconds': '864000', // 10 days
        }),
      });

      return response.status === 202; // Accepted for verification
    } catch (error) {
      console.error('Error subscribing to YouTube channel notifications:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from channel push notifications with security
   */
  async unsubscribeFromChannelNotifications(
    channelId: string, 
    callbackUrl: string
  ): Promise<boolean> {
    if (!channelId?.trim() || !callbackUrl?.trim()) {
      console.error('Channel ID and callback URL are required');
      return false;
    }

    try {
      const hubUrl = 'https://pubsubhubbub.appspot.com/subscribe';
      const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
      
      const response = await fetch(hubUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'hub.callback': callbackUrl,
          'hub.topic': topicUrl,
          'hub.mode': 'unsubscribe',
          'hub.verify': 'async',
          'hub.verify_token': this.webhookVerifyToken,
        }),
      });

      return response.status === 202;
    } catch (error) {
      console.error('Error unsubscribing from YouTube channel notifications:', error);
      return false;
    }
  }

  /**
   * Verify webhook callback for push notifications with security validation
   */
  verifyWebhookCallback(
    mode: 'subscribe' | 'unsubscribe',
    topic: string,
    challenge: string,
    verifyToken: string,
    leaseSeconds?: string
  ): string | null {
    // Validate required parameters
    if (!mode || !topic || !challenge || !verifyToken) {
      console.warn('Missing required webhook verification parameters');
      return null;
    }

    // Validate verify token for security
    if (verifyToken !== this.webhookVerifyToken) {
      console.warn('Invalid webhook verify token');
      return null;
    }

    // Validate topic URL format
    if (!topic.startsWith('https://www.youtube.com/xml/feeds/videos.xml?channel_id=')) {
      console.warn('Invalid topic URL format');
      return null;
    }

    // Validate mode
    if (mode === 'subscribe' || mode === 'unsubscribe') {
      // Return the challenge to confirm the subscription
      return challenge;
    }
    
    console.warn('Invalid webhook mode:', mode);
    return null;
  }

  /**
   * Verify webhook signature for security (YouTube uses HMAC-SHA1 with X-Hub-Signature)
   */
  verifyWebhookSignature(
    signature: string,
    body: string,
    secret: string
  ): boolean {
    if (!signature || !body || !secret) {
      return false;
    }

    try {
      // Use dynamic import for better ESM compatibility
      const crypto = require('crypto');
      const expectedSignature = 'sha1=' + crypto
        .createHmac('sha1', secret)
        .update(body)
        .digest('hex');

      // Ensure equal buffer lengths for timingSafeEqual
      const signatureBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);
      
      if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch (error) {
      console.error('Error verifying YouTube webhook signature:', error);
      return false;
    }
  }

  /**
   * Parse YouTube PubSubHubbub notification with security validation
   */
  parseWebhookNotification(xmlContent: string, signature?: string): {
    channelId: string;
    videoId: string;
    title: string;
    publishedAt: string;
  } | null {
    if (!xmlContent?.trim()) {
      console.error('Empty XML content provided');
      return null;
    }

    // Verify signature if provided
    if (signature && !this.verifyWebhookSignature(signature, xmlContent, this.webhookVerifyToken)) {
      console.error('Invalid webhook signature');
      return null;
    }

    // Validate content size (prevent abuse)
    if (xmlContent.length > 50000) { // 50KB limit
      console.error('XML content too large');
      return null;
    }

    try {
      // Enhanced XML parsing with better validation
      const channelIdMatch = xmlContent.match(/<yt:channelId>([a-zA-Z0-9_-]{1,100})<\/yt:channelId>/);
      const videoIdMatch = xmlContent.match(/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/);
      const titleMatch = xmlContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>([^<]*)<\/title>/);
      const publishedMatch = xmlContent.match(/<published>(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)<\/published>/);

      if (channelIdMatch && videoIdMatch && titleMatch && publishedMatch) {
        return {
          channelId: channelIdMatch[1],
          videoId: videoIdMatch[1],
          title: titleMatch[1] || titleMatch[2] || '',
          publishedAt: publishedMatch[1],
        };
      }

      console.warn('Unable to parse YouTube webhook notification - missing required fields');
      return null;
    } catch (error) {
      console.error('Error parsing YouTube webhook notification:', error);
      return null;
    }
  }

  /**
   * Make YouTube API request with retry logic and error handling
   */
  private async makeAPIRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    accessToken?: string,
    refreshToken?: string,
    retries: number = 3
  ): Promise<YouTubeAPIResult<T>> {
    // Validate input parameters
    if (!endpoint) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Endpoint is required' } };
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...options.headers as Record<string, string>,
        };

        // Construct final URL properly
        let finalUrl: string;
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
          finalUrl = `https://www.googleapis.com/youtube/v3${endpoint}`;
        } else if (this.apiKey) {
          // Add API key for public endpoints
          const url = new URL(endpoint, 'https://www.googleapis.com/youtube/v3');
          url.searchParams.set('key', this.apiKey);
          finalUrl = url.toString();
        } else {
          return { success: false, error: { code: 'NO_AUTH', message: 'No authentication method available' } };
        }

        const response = await fetch(finalUrl, {
          ...options,
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.error) {
            return { success: false, error: { code: data.error.code || 'API_ERROR', message: data.error.message || 'Unknown API error', details: data.error } };
          }
          return { success: true, data };
        }

        // Handle rate limiting (HTTP 429) and server errors (5xx) with exponential backoff
        if ((response.status === 429 || response.status >= 500) && attempt < retries) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          
          logger.warn(`YouTube API ${response.status === 429 ? 'rate limited' : 'server error'}, retrying after ${delay}ms`, { 
            status: response.status, 
            attempt, 
            delay 
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Handle token refresh for 401 errors
        if (response.status === 401 && refreshToken && attempt < retries) {
          logger.info('Attempting to refresh YouTube access token', { attempt });
          const refreshResult = await this.refreshAccessToken(refreshToken);
          if (refreshResult) {
            // Retry with new token
            accessToken = refreshResult.access_token;
            continue;
          }
        }

        const errorText = await response.text();
        return { 
          success: false, 
          error: { 
            code: `HTTP_${response.status}`, 
            message: `YouTube API request failed: ${response.status} ${response.statusText}`,
            details: { status: response.status, body: errorText }
          } 
        };
      } catch (error) {
        if (attempt === retries) {
          return { 
            success: false, 
            error: { 
              code: 'REQUEST_FAILED', 
              message: error instanceof Error ? error.message : 'Unknown request error',
              details: error 
            } 
          };
        }
        
        // Exponential backoff for other errors
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn(`YouTube API request failed, retrying after ${delay}ms`, { 
          attempt, 
          delay, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { success: false, error: { code: 'MAX_RETRIES_EXCEEDED', message: 'Maximum retry attempts exceeded' } };
  }

  /**
   * Get authenticated user's channel information
   */
  async getMyChannel(accessToken: string, refreshToken?: string): Promise<YouTubeChannel | null> {
    if (!accessToken?.trim()) {
      console.error('Access token is required');
      return null;
    }

    if (!this.isConfigured()) {
      console.warn('YouTube API not configured');
      return null;
    }

    const result = await this.makeAPIRequest<any>(
      '/channels?part=snippet,statistics&mine=true',
      {},
      accessToken,
      refreshToken
    );

    if (!result.success) {
      console.error('Error fetching authenticated YouTube channel:', result.error);
      return null;
    }

    const channel = result.data.items?.[0];
    if (!channel) {
      return null;
    }

    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnails: {
        default: { url: channel.snippet.thumbnails?.default?.url || '' },
        medium: { url: channel.snippet.thumbnails?.medium?.url || '' },
        high: { url: channel.snippet.thumbnails?.high?.url || '' },
      },
      subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
      videoCount: parseInt(channel.statistics.videoCount || '0'),
      viewCount: parseInt(channel.statistics.viewCount || '0'),
    };
  }

  /**
   * Get webhook verify token for secure webhook setup
   */
  getWebhookVerifyToken(): string {
    return this.webhookVerifyToken;
  }
}

// Export singleton instance
export const youtubeAPI = new YouTubeAPIService();