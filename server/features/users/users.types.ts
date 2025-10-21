// Note: UpsertUser type from @shared/schema reserved for user creation/update operations

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  primaryCommunity?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  status?: "online" | "offline" | "away" | "busy" | "gaming";
  statusMessage?: string;
  timezone?: string;
  isPrivate?: boolean;
  showOnlineStatus?: "everyone" | "friends_only" | "private";
  allowDirectMessages?: "everyone" | "friends_only" | "private";
}

export interface SocialLinksRequest {
  links: unknown[];
}

export interface UserSettingsRequest {
  [key: string]: unknown;
}

export interface FriendRequestRequest {
  addresseeId: string;
}

export interface FriendRequestResponse {
  status: string;
}

export interface MatchmakingPreferencesRequest {
  [key: string]: unknown;
}

export interface FindPlayersRequest {
  gameType?: string;
  skillLevel?: string;
  communityId?: string;
  pagination?: {
    limit?: number;
    cursor?: string;
    page?: number;
  };
}
