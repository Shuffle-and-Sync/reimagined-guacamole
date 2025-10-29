/**
 * Facebook API Types
 * Type definitions for Facebook Graph API integration
 */

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
  status:
    | "UNPUBLISHED"
    | "LIVE"
    | "LIVE_STOPPED"
    | "PROCESSING"
    | "VOD"
    | "SCHEDULED_UNPUBLISHED"
    | "SCHEDULED_LIVE"
    | "SCHEDULED_CANCELED";
  live_views?: number;
  creation_time: string;
  planned_start_time?: string;
  actual_start_time?: string;
  broadcast_start_time?: string;
  ad_break_config?: Record<string, unknown>;
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

export interface FacebookAPIResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    type?: string;
    subcode?: number;
  };
  newAccessToken?: string;
}

export type FacebookAPIError =
  | "NO_CONFIG"
  | "NO_AUTH"
  | "INVALID_INPUT"
  | "INVALID_RESPONSE"
  | "RATE_LIMITED"
  | "PERMISSION_DENIED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "TOKEN_EXPIRED"
  | "UNKNOWN_ERROR";

export interface FacebookTokens {
  access_token: string;
  token_type: string;
  expires_in?: number;
}
