/**
 * Base Social Media Service Types
 * Shared types for all social media platform integrations
 */

export interface SocialMediaAPIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface SocialMediaChannel {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
}

export interface SocialMediaVideo {
  id: string;
  title: string;
  description?: string;
  publishedAt: string;
  thumbnailUrl?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  duration?: string;
}

export interface SocialMediaStream {
  id: string;
  title: string;
  description?: string;
  status: "live" | "upcoming" | "completed";
  scheduledStartTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  viewerCount?: number;
  streamUrl?: string;
}

export interface SocialMediaTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
}

export interface WebhookSubscription {
  id: string;
  channelId: string;
  callbackUrl: string;
  verifyToken?: string;
  expiresAt?: Date;
}
