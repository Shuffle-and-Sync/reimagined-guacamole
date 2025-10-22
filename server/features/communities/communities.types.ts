export interface JoinCommunityRequest {
  communityId: string;
}

export interface SetPrimaryCommunityRequest {
  communityId: string;
}

export interface ThemePreferencesRequest {
  communityId?: string;
  themeMode?: string;
  customColors?: unknown;
}

export interface CommunityMembership {
  id: string;
  userId: string;
  communityId: string;
  isPrimary: boolean | null;
  joinedAt: Date | null;
}
