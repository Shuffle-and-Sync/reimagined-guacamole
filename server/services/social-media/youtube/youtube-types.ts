/**
 * YouTube API Types
 * Type definitions for YouTube API integration
 */

export interface YouTubeAPIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type YouTubeAPIResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: YouTubeAPIError;
    };

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
  status: "live" | "upcoming" | "completed";
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
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface YouTubeBroadcast {
  id: string;
  title: string;
  description?: string;
  scheduledStartTime: string;
  status: "ready" | "testing" | "live" | "complete";
  privacyStatus: "public" | "unlisted" | "private";
}

export interface YouTubeStreamKey {
  streamId: string;
  streamName: string;
  ingestionAddress: string;
}

export interface YouTubeTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}
