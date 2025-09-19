// Facebook Gaming API Service Stub
// This is a placeholder implementation for Facebook Gaming API integration
// TODO: Implement full Facebook Gaming Creator API and Graph API integration

export interface FacebookPage {
  id: string;
  name: string;
  about?: string;
  category: string;
  picture: {
    data: {
      url: string;
    };
  };
  fan_count?: number;
  followers_count?: number;
}

export interface FacebookLiveVideo {
  id: string;
  title?: string;
  description?: string;
  status: 'UNPUBLISHED' | 'LIVE' | 'LIVE_STOPPED' | 'PROCESSING' | 'VOD' | 'SCHEDULED_UNPUBLISHED' | 'SCHEDULED_LIVE' | 'SCHEDULED_CANCELED';
  live_views?: number;
  creation_time: string;
  planned_start_time?: string;
  actual_start_time?: string;
  broadcast_start_time?: string;
  ad_break_config?: any;
  permalink_url?: string;
  embed_html?: string;
}

export interface FacebookLiveVideoDetails extends FacebookLiveVideo {
  stream_url?: string;
  secure_stream_url?: string;
  dash_ingest_url?: string;
  rtmp_preview_url?: string;
}

export interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  updated_time: string;
  permalink_url?: string;
  likes?: {
    summary: {
      total_count: number;
    };
  };
  comments?: {
    summary: {
      total_count: number;
    };
  };
  shares?: {
    count: number;
  };
}

/**
 * Facebook Gaming API Service (Stub Implementation)
 * 
 * To implement full functionality, you will need:
 * 1. Facebook App ID and App Secret
 * 2. Facebook Gaming Creator API access
 * 3. Graph API permissions for live video and gaming features
 * 4. Webhooks setup for real-time notifications
 */
export class FacebookAPIService {
  private appId: string | undefined;
  private appSecret: string | undefined;
  private apiVersion: string = 'v18.0';
  
  // Store OAuth states to validate CSRF protection
  private oauthStates = new Map<string, { timestamp: number; redirectUri: string }>();

  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID;
    this.appSecret = process.env.FACEBOOK_APP_SECRET;
  }

  /**
   * Check if Facebook API is properly configured
   */
  isConfigured(): boolean {
    return !!(this.appId && this.appSecret);
  }

  /**
   * Get page information
   */
  async getPage(pageId: string, accessToken: string): Promise<FacebookPage | null> {
    if (!this.isConfigured()) {
      console.warn('Facebook API not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.');
      return null;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${pageId}?fields=id,name,about,category,picture,fan_count,followers_count&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      return {
        id: data.id,
        name: data.name,
        about: data.about,
        category: data.category,
        picture: data.picture || { data: { url: '' } },
        fan_count: data.fan_count,
        followers_count: data.followers_count,
      };
    } catch (error) {
      console.error('Error fetching Facebook page:', error);
      return null;
    }
  }

  /**
   * Get live videos for a page
   */
  async getLiveVideos(pageId: string, accessToken: string): Promise<FacebookLiveVideo[]> {
    if (!this.isConfigured()) {
      console.warn('Facebook API not configured');
      return [];
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${pageId}/live_videos?fields=id,title,description,status,live_views,creation_time,planned_start_time,actual_start_time,broadcast_start_time,permalink_url&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      return data.data?.map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        status: video.status,
        live_views: video.live_views,
        creation_time: video.creation_time,
        planned_start_time: video.planned_start_time,
        actual_start_time: video.actual_start_time,
        broadcast_start_time: video.broadcast_start_time,
        permalink_url: video.permalink_url,
      })) || [];
    } catch (error) {
      console.error('Error fetching Facebook live videos:', error);
      return [];
    }
  }

  /**
   * Create a live video
   */
  async createLiveVideo(
    pageId: string,
    accessToken: string,
    title: string,
    description?: string,
    plannedStartTime?: Date
  ): Promise<FacebookLiveVideoDetails | null> {
    if (!this.isConfigured()) {
      console.warn('Facebook API not configured');
      return null;
    }

    try {
      const body = new URLSearchParams({
        title,
        status: plannedStartTime ? 'SCHEDULED_UNPUBLISHED' : 'UNPUBLISHED',
        ...(description && { description }),
        ...(plannedStartTime && { planned_start_time: Math.floor(plannedStartTime.getTime() / 1000).toString() }),
        access_token: accessToken,
      });

      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${pageId}/live_videos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        }
      );

      if (!response.ok) {
        throw new Error(`Facebook API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      // Fetch the created live video to get authoritative details including streaming info
      const createdVideo = await this.getLiveVideoDetails(data.id, accessToken);
      
      return createdVideo || {
        id: data.id,
        title,
        description,
        status: 'UNPUBLISHED',
        creation_time: new Date().toISOString(),
        planned_start_time: plannedStartTime?.toISOString(),
        permalink_url: data.permalink_url,
        embed_html: data.embed_html,
      };
    } catch (error) {
      console.error('Error creating Facebook live video:', error);
      return null;
    }
  }

  /**
   * Get live video details with streaming information
   */
  async getLiveVideoDetails(liveVideoId: string, accessToken: string): Promise<FacebookLiveVideoDetails | null> {
    if (!this.isConfigured()) {
      console.warn('Facebook API not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${liveVideoId}?fields=id,title,description,status,creation_time,planned_start_time,permalink_url,embed_html,stream_url,secure_stream_url,dash_ingest_url,rtmp_preview_url&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        creation_time: data.creation_time,
        planned_start_time: data.planned_start_time 
          ? this.parseTimestamp(data.planned_start_time)
          : undefined,
        permalink_url: data.permalink_url,
        embed_html: data.embed_html,
        stream_url: data.stream_url,
        secure_stream_url: data.secure_stream_url,
        dash_ingest_url: data.dash_ingest_url,
        rtmp_preview_url: data.rtmp_preview_url,
      };
    } catch (error) {
      console.error('Error fetching Facebook live video details:', error);
      return null;
    }
  }

  /**
   * Update live video
   */
  async updateLiveVideo(
    liveVideoId: string,
    accessToken: string,
    updates: Partial<FacebookLiveVideo>
  ): Promise<FacebookLiveVideoDetails | null> {
    if (!this.isConfigured()) {
      console.warn('Facebook API not configured');
      return null;
    }

    try {
      const updateData: any = {};
      
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.planned_start_time) {
        if (typeof updates.planned_start_time === 'string') {
          // Handle both ISO strings and Unix timestamp strings
          const numericValue = parseFloat(updates.planned_start_time);
          if (!isNaN(numericValue) && updates.planned_start_time.match(/^\d+(\.\d+)?$/)) {
            // It's a numeric string (Unix timestamp)
            updateData.planned_start_time = Math.floor(numericValue).toString();
          } else {
            // It's an ISO string
            updateData.planned_start_time = Math.floor(new Date(updates.planned_start_time).getTime() / 1000).toString();
          }
        } else {
          updateData.planned_start_time = updates.planned_start_time;
        }
      }
      
      const body = new URLSearchParams({
        ...updateData,
        access_token: accessToken,
      });

      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${liveVideoId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        }
      );

      if (!response.ok) {
        throw new Error(`Facebook API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      // Fetch the updated live video to get authoritative details
      const updatedVideo = await this.getLiveVideoDetails(liveVideoId, accessToken);
      
      return updatedVideo || {
        id: liveVideoId,
        title: updates.title || '',
        description: updates.description || '',
        status: 'UNPUBLISHED',
        creation_time: new Date().toISOString(),
        planned_start_time: updates.planned_start_time,
      };
    } catch (error) {
      console.error('Error updating Facebook live video:', error);
      return null;
    }
  }

  /**
   * End live video
   */
  async endLiveVideo(liveVideoId: string, accessToken: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Facebook API not configured');
      return false;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${liveVideoId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            end_live_video: 'true',
            access_token: accessToken,
          }).toString(),
        }
      );

      if (!response.ok) {
        throw new Error(`Facebook API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      return data.success === true || response.ok;
    } catch (error) {
      console.error('Error ending Facebook live video:', error);
      return false;
    }
  }

  /**
   * Get page posts
   */
  async getPagePosts(pageId: string, accessToken: string, limit: number = 10): Promise<FacebookPost[]> {
    if (!this.isConfigured()) {
      console.warn('Facebook API not configured');
      return [];
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${pageId}/posts?fields=id,message,story,created_time,updated_time,permalink_url,likes.summary(true),comments.summary(true),shares&limit=${limit}&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      return data.data?.map((post: any) => ({
        id: post.id,
        message: post.message,
        story: post.story,
        created_time: post.created_time,
        updated_time: post.updated_time,
        permalink_url: post.permalink_url,
        likes: {
          summary: {
            total_count: post.likes?.summary?.total_count || 0,
          },
        },
        comments: {
          summary: {
            total_count: post.comments?.summary?.total_count || 0,
          },
        },
        shares: {
          count: post.shares?.count || 0,
        },
      })) || [];
    } catch (error) {
      console.error('Error fetching Facebook page posts:', error);
      return [];
    }
  }

  /**
   * Create a post
   */
  async createPost(
    pageId: string,
    accessToken: string,
    message: string,
    link?: string
  ): Promise<FacebookPost | null> {
    if (!this.isConfigured()) {
      console.warn('Facebook API not configured');
      return null;
    }

    try {
      const postData: any = {
        message,
        access_token: accessToken,
      };
      
      if (link) {
        postData.link = link;
      }

      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${pageId}/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(postData).toString(),
        }
      );

      if (!response.ok) {
        throw new Error(`Facebook API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      return {
        id: data.id,
        message,
        created_time: new Date().toISOString(),
        updated_time: new Date().toISOString(),
        permalink_url: `https://facebook.com/${data.id}`,
        likes: { summary: { total_count: 0 } },
        comments: { summary: { total_count: 0 } },
        shares: { count: 0 },
      };
    } catch (error) {
      console.error('Error creating Facebook post:', error);
      return null;
    }
  }

  /**
   * Get OAuth authorization URL for Facebook with CSRF protection
   */
  getAuthorizationUrl(redirectUri: string): { url: string; state: string } {
    if (!this.isConfigured()) {
      console.warn('Facebook API not configured');
      return { url: '', state: '' };
    }

    // Generate secure random state for CSRF protection
    const state = this.generateSecureState();
    
    // Store state with timestamp for validation (expires in 10 minutes)
    this.oauthStates.set(state, {
      timestamp: Date.now(),
      redirectUri,
    });

    // Clean expired states
    this.cleanExpiredStates();
    
    const params = new URLSearchParams({
      client_id: this.appId!,
      redirect_uri: redirectUri,
      scope: 'pages_manage_posts,pages_read_engagement,publish_video,pages_manage_metadata,pages_read_user_content,pages_show_list',
      response_type: 'code',
      state: state,
    });

    return {
      url: `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`,
      state,
    };
  }

  /**
   * Generate cryptographically secure state token
   */
  private generateSecureState(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Clean expired OAuth states (older than 10 minutes)
   */
  private cleanExpiredStates(): void {
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    for (const [state, data] of this.oauthStates.entries()) {
      if (data.timestamp < tenMinutesAgo) {
        this.oauthStates.delete(state);
      }
    }
  }

  /**
   * Validate OAuth state for CSRF protection
   */
  validateOAuthState(state: string, redirectUri: string): boolean {
    const stateData = this.oauthStates.get(state);
    if (!stateData) {
      console.warn('Invalid OAuth state: not found');
      return false;
    }

    // Check if state is expired (10 minutes)
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    if (stateData.timestamp < tenMinutesAgo) {
      console.warn('Invalid OAuth state: expired');
      this.oauthStates.delete(state);
      return false;
    }

    // Check if redirect URI matches
    if (stateData.redirectUri !== redirectUri) {
      console.warn('Invalid OAuth state: redirect URI mismatch');
      this.oauthStates.delete(state);
      return false;
    }

    // State is valid, remove it to prevent reuse
    this.oauthStates.delete(state);
    return true;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<{ access_token: string; token_type: string } | null> {
    if (!this.isConfigured()) {
      console.warn('Facebook API not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/oauth/access_token?` +
        `client_id=${this.appId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `client_secret=${this.appSecret}&` +
        `code=${code}`
      );

      if (!response.ok) {
        throw new Error(`Facebook OAuth request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook OAuth error: ${data.error.message}`);
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type || 'bearer',
      };
    } catch (error) {
      console.error('Error exchanging Facebook OAuth code:', error);
      return null;
    }
  }

  /**
   * Get long-lived page access token
   */
  async getPageAccessToken(pageId: string, userAccessToken: string): Promise<string | null> {
    if (!this.isConfigured()) {
      console.warn('Facebook API not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${pageId}?fields=access_token&access_token=${userAccessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      return data.access_token || null;
    } catch (error) {
      console.error('Error getting Facebook page access token:', error);
      return null;
    }
  }

  /**
   * Parse timestamp from Facebook API (handles both Unix seconds and ISO strings)
   */
  private parseTimestamp(timestamp: string): string {
    // Check if it's a numeric Unix timestamp
    if (/^\d+(?:\.\d+)?$/.test(timestamp)) {
      return new Date(parseInt(timestamp) * 1000).toISOString();
    }
    
    // Try parsing as ISO string
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp format, returning raw value:', timestamp);
        return timestamp;
      }
      return date.toISOString();
    } catch (error) {
      console.warn('Error parsing timestamp, returning raw value:', timestamp);
      return timestamp;
    }
  }

  /**
   * Subscribe to page webhooks
   */
  async subscribeToWebhooks(pageId: string, accessToken: string, callbackUrl: string, verifyToken: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Facebook API not configured');
      return false;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${pageId}/subscribed_apps`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            subscribed_fields: 'live_videos,feed',
            access_token: accessToken,
          }).toString(),
        }
      );

      if (!response.ok) {
        throw new Error(`Facebook API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      return data.success === true;
    } catch (error) {
      console.error('Error subscribing to Facebook webhooks:', error);
      return false;
    }
  }

  /**
   * Verify webhook callback for GET requests (challenge verification)
   */
  verifyWebhookCallback(mode: string, token: string, challenge: string, verifyToken: string): string | null {
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Verify webhook POST signature with HMAC-SHA256
   */
  verifyWebhookSignature(signature: string, body: string): boolean {
    if (!this.isConfigured()) {
      console.warn('Facebook API not configured');
      return false;
    }

    try {
      const crypto = require('crypto');
      
      // Remove 'sha256=' prefix if present
      const cleanSignature = signature.replace('sha256=', '');
      
      // Calculate expected signature using app secret
      const expectedSignature = crypto
        .createHmac('sha256', this.appSecret)
        .update(body, 'utf8')
        .digest('hex');
      
      // Use constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(cleanSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}

// Export singleton instance
export const facebookAPI = new FacebookAPIService();