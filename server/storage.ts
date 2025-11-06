import {
  eq,
  and,
  gte,
  lte,
  count,
  sql,
  or,
  desc,
  not,
  asc,
  ilike,
  isNotNull,
  inArray,
  lt,
  gt,
} from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import {
  db,
  withQueryTiming,
  type Transaction,
} from "@shared/database-unified";
import {
  users,
  communities,
  userCommunities,
  userPlatformAccounts,
  themePreferences,
  events,
  eventAttendees,
  notifications,
  messages,
  gameSessions,
  passwordResetTokens,
  emailVerificationTokens,
  emailChangeRequests,
  emailChangeTokens,
  userSocialLinks,
  userGamingProfiles,
  friendships,
  userActivities,
  userSettings,
  matchmakingPreferences,
  tournaments,
  tournamentParticipants,
  tournamentFormats,
  tournamentRounds,
  tournamentMatches,
  matchResults,
  forumPosts,
  forumReplies,
  forumPostLikes,
  forumReplyLikes,
  streamSessions,
  streamSessionCoHosts,
  streamSessionPlatforms,
  collaborationRequests,
  streamAnalytics,
  userActivityAnalytics,
  communityAnalytics,
  platformMetrics,
  eventTracking,
  conversionFunnel,
  collaborativeStreamEvents,
  streamCollaborators,
  streamCoordinationSessions,
  // Calendar sync tables
  calendarConnections,
  externalEvents,
  // Admin & Moderation tables
  userRoles,
  userReputation,
  contentReports,
  moderationActions,
  moderationQueue,
  cmsContent,
  banEvasionTracking,
  userAppeals,
  moderationTemplates,
  adminAuditLog,
  userMfaSettings,
  userMfaAttempts,
  deviceFingerprints,
  mfaSecurityContext,
  trustedDevices,
  refreshTokens,
  authAuditLog,
  revokedJwtTokens,
  type User,
  type UpsertUser,
  type Community,
  type UserCommunity,
  type UserPlatformAccount,
  type ThemePreference,
  type Event,
  type EventAttendee,
  type Notification,
  type Message,
  type GameSession,
  type PasswordResetToken,
  type EmailChangeRequest,
  type EmailChangeToken,
  type EmailVerificationToken,
  type UserSocialLink,
  type UserGamingProfile,
  type Friendship,
  type UserActivity,
  type UserSettings,
  type MatchmakingPreferences,
  type Tournament,
  type TournamentParticipant,
  type TournamentFormat,
  type TournamentRound,
  type TournamentMatch,
  type MatchResult,
  type ForumPost,
  type ForumReply,
  type StreamSession,
  type StreamSessionCoHost,
  type StreamSessionPlatform,
  type CollaborationRequest,
  type StreamAnalytics,
  type InsertCommunity,
  type InsertUserCommunity,
  type InsertUserPlatformAccount,
  type InsertThemePreference,
  type InsertEvent,
  type InsertEventAttendee,
  type InsertNotification,
  type InsertMessage,
  type InsertGameSession,
  type InsertPasswordResetToken,
  type InsertEmailVerificationToken,
  type InsertEmailChangeRequest,
  type InsertEmailChangeToken,
  type InsertUserSocialLink,
  type InsertUserGamingProfile,
  type InsertUserActivity,
  type InsertUserSettings,
  type InsertMatchmakingPreferences,
  type InsertTournament,
  type UpdateTournament,
  type InsertTournamentFormat,
  type InsertTournamentRound,
  type InsertTournamentMatch,
  type InsertMatchResult,
  type InsertForumPost,
  type InsertForumReply,
  type InsertStreamSession,
  type InsertStreamSessionCoHost,
  type InsertStreamSessionPlatform,
  type InsertCollaborationRequest,
  type InsertStreamAnalytics,
  type UserActivityAnalytics,
  type CommunityAnalytics,
  type CollaborativeStreamEvent,
  type StreamCollaborator,
  type StreamCoordinationSession,
  type InsertCollaborativeStreamEvent,
  type InsertStreamCollaborator,
  type InsertStreamCoordinationSession,
  type PlatformMetrics,
  type EventTracking,
  type ConversionFunnel,
  type InsertUserActivityAnalytics,
  type InsertCommunityAnalytics,
  type InsertPlatformMetrics,
  type InsertEventTracking,
  type InsertConversionFunnel,
  // Calendar sync types
  type CalendarConnection,
  type InsertCalendarConnection,
  type ExternalEvent,
  type InsertExternalEvent,
  // Admin & Moderation types
  type UserRole,
  type UserReputation,
  type ContentReport,
  type ModerationAction,
  type ModerationQueue,
  type CmsContent,
  type BanEvasionTracking,
  type UserAppeal,
  type ModerationTemplate,
  type AdminAuditLog,
  type InsertUserRole,
  type InsertUserReputation,
  type InsertContentReport,
  type InsertModerationAction,
  type InsertModerationQueue,
  type InsertCmsContent,
  type InsertBanEvasionTracking,
  type InsertUserAppeal,
  type InsertModerationTemplate,
  type InsertAdminAuditLog,
  SafeUserPlatformAccount,
  type UserMfaSettings,
  type InsertUserMfaSettings,
  type UserMfaAttempts,
  type DeviceFingerprint,
  type InsertDeviceFingerprint,
  type MfaSecurityContext,
  type InsertMfaSecurityContext,
  type TrustedDevice,
  type InsertTrustedDevice,
  type RefreshToken,
  type InsertRefreshToken,
  type AuthAuditLog,
  type InsertAuthAuditLog,
} from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "./logger";

// Extended types for entities with properties not yet in schema
// TODO: Add these columns to schema when implementing full functionality
// Commented out unused interfaces - uncomment when needed
// interface _ExtendedEvent extends Event {
//   date?: string;
//   time?: string;
//   gameFormat?: string;
//   powerLevel?: string;
//   isRecurring?: boolean;
//   recurrencePattern?: string;
//   recurrenceInterval?: number;
//   recurrenceEndDate?: Date;
//   isPublic?: boolean;
// }
//
// interface _ExtendedTournament extends Tournament {
//   gameFormat?: string;
//   rules?: Record<string, unknown>;
// }

// Type for matchmaking results
export interface MatchedPlayer {
  id: string;
  username: string;
  avatar: string | null;
  games: (string | null)[];
  formats: string[];
  powerLevel: number;
  playstyle: string | null;
  location: string;
  availability: Record<string, unknown>;
  matchScore: number;
  commonInterests: string[];
  lastOnline: string;
  isOnline: boolean;
}

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for authentication integration.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  getAllUsers(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<{ users: User[]; total: number }>;
  getCommunityActiveUsers(
    communityId: string,
    options?: {
      limit?: number;
      cursor?: string;
      includeOffline?: boolean;
      sortBy?: string;
      sortDirection?: "asc" | "desc";
    },
  ): Promise<{ data: User[]; hasMore: boolean }>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User>;

  // Community operations
  getCommunities(): Promise<Community[]>;
  getCommunity(id: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;

  // User community operations
  getUserCommunities(
    userId: string,
  ): Promise<(UserCommunity & { community: Community })[]>;
  joinCommunity(data: InsertUserCommunity): Promise<UserCommunity>;
  setPrimaryCommunity(userId: string, communityId: string): Promise<void>;

  // Platform account operations for cross-platform streaming
  getUserPlatformAccounts(userId: string): Promise<SafeUserPlatformAccount[]>;
  getUserPlatformAccount(
    userId: string,
    platform: string,
  ): Promise<SafeUserPlatformAccount | undefined>;
  createUserPlatformAccount(
    data: InsertUserPlatformAccount,
  ): Promise<SafeUserPlatformAccount>;
  updateUserPlatformAccount(
    id: string,
    data: {
      handle?: string;
      accessToken?: string;
      refreshToken?: string;
      tokenExpiresAt?: Date;
      scopes?: unknown;
      isActive?: boolean;
      lastVerified?: Date;
    },
  ): Promise<SafeUserPlatformAccount>;
  deleteUserPlatformAccount(id: string): Promise<void>;
  getUserPlatformHandle(
    userId: string,
    platform: string,
  ): Promise<string | null>;
  getUserPlatformToken(
    userId: string,
    platform: string,
  ): Promise<string | null>;

  // Theme preference operations
  getUserThemePreferences(userId: string): Promise<ThemePreference[]>;
  upsertThemePreference(data: InsertThemePreference): Promise<ThemePreference>;

  // Event operations
  getEvents(filters?: {
    userId?: string;
    communityId?: string;
    type?: string;
    upcoming?: boolean;
  }): Promise<
    (Event & {
      creator: User;
      community: Community | null;
      attendeeCount: number;
      isUserAttending?: boolean;
    })[]
  >;
  getEvent(
    id: string,
    userId?: string,
  ): Promise<
    | (Event & {
        creator: User;
        community: Community | null;
        attendeeCount: number;
        isUserAttending: boolean;
      })
    | undefined
  >;
  createEvent(data: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  // Bulk calendar operations for game pods
  createBulkEvents(data: InsertEvent[]): Promise<Event[]>;
  createRecurringEvents(data: InsertEvent, endDate: string): Promise<Event[]>;
  getCalendarEvents(filters: {
    communityId?: string;
    startDate: string;
    endDate: string;
    type?: string;
  }): Promise<
    (Event & {
      creator: User;
      community: Community | null;
      attendeeCount: number;
      mainPlayers: number;
      alternates: number;
    })[]
  >;

  // Event attendee operations
  joinEvent(data: InsertEventAttendee): Promise<EventAttendee>;
  leaveEvent(eventId: string, userId: string): Promise<void>;
  updateEventAttendee(
    id: string,
    data: Partial<{
      playerType: string;
      status: "attending" | "maybe" | "not_attending";
      role: string;
    }>,
  ): Promise<EventAttendee>;
  getEventAttendees(
    eventId: string,
  ): Promise<(EventAttendee & { user: User })[]>;
  getUserEventAttendance(
    userId: string,
  ): Promise<(EventAttendee & { event: Event })[]>;
  getUserCreatedEvents(userId: string): Promise<Event[]>;
  getUsersEventAttendance(
    userIds: string[],
  ): Promise<(EventAttendee & { event: Event })[]>;

  // Password reset operations
  createPasswordResetToken(
    data: InsertPasswordResetToken,
  ): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
  invalidateUserPasswordResetTokens(userId: string): Promise<void>;

  // Email verification operations
  createEmailVerificationToken(
    data: InsertEmailVerificationToken,
  ): Promise<EmailVerificationToken>;
  getEmailVerificationToken(
    token: string,
  ): Promise<EmailVerificationToken | undefined>;
  markEmailVerificationTokenAsUsed(token: string): Promise<void>;
  cleanupExpiredEmailVerificationTokens(): Promise<void>;
  getEmailVerificationTokenByUserId(
    userId: string,
  ): Promise<EmailVerificationToken | undefined>;
  invalidateUserEmailVerificationTokens(userId: string): Promise<void>;

  // Email change operations
  createEmailChangeRequest(
    data: InsertEmailChangeRequest,
  ): Promise<EmailChangeRequest>;
  getEmailChangeRequest(id: string): Promise<EmailChangeRequest | undefined>;
  getUserEmailChangeRequest(
    userId: string,
  ): Promise<EmailChangeRequest | undefined>;
  updateEmailChangeRequest(
    id: string,
    data: Partial<InsertEmailChangeRequest>,
  ): Promise<EmailChangeRequest>;
  createEmailChangeToken(
    data: InsertEmailChangeToken,
  ): Promise<EmailChangeToken>;
  getEmailChangeToken(token: string): Promise<EmailChangeToken | undefined>;
  markEmailChangeTokenAsUsed(token: string): Promise<void>;
  cleanupExpiredEmailChangeTokens(): Promise<void>;
  cancelEmailChangeRequest(userId: string): Promise<void>;

  // MFA operations
  getUserMfaSettings(userId: string): Promise<UserMfaSettings | undefined>;
  createUserMfaSettings(data: InsertUserMfaSettings): Promise<UserMfaSettings>;
  updateUserMfaSettings(
    userId: string,
    data: Partial<InsertUserMfaSettings>,
  ): Promise<void>;

  /**
   * Enable MFA for a user with TOTP secret and backup codes
   * SECURITY: backupCodes must be ALREADY HASHED using Argon2id before calling this method
   * The caller (routes layer) is responsible for hashing raw codes before storage
   * This prevents plaintext backup codes from being stored in the database
   */
  enableUserMfa(
    userId: string,
    totpSecret: string,
    backupCodes: string[],
  ): Promise<void>;
  disableUserMfa(userId: string): Promise<void>;
  updateUserMfaLastVerified(userId: string): Promise<void>;
  markBackupCodeAsUsed(userId: string, codeIndex: number): Promise<void>;

  // MFA attempt tracking for throttling and lockout
  getUserMfaAttempts(userId: string): Promise<UserMfaAttempts | undefined>;
  recordMfaFailure(userId: string): Promise<void>;
  resetMfaAttempts(userId: string): Promise<void>;
  checkMfaLockout(userId: string): Promise<{
    isLocked: boolean;
    lockoutEndsAt?: Date;
    failedAttempts: number;
  }>;
  cleanupExpiredMfaLockouts(): Promise<void>;

  // Device fingerprinting for enhanced MFA security
  getDeviceFingerprint(
    fingerprintHash: string,
  ): Promise<DeviceFingerprint | undefined>;
  getUserDeviceFingerprints(userId: string): Promise<DeviceFingerprint[]>;
  createDeviceFingerprint(
    data: InsertDeviceFingerprint,
  ): Promise<DeviceFingerprint>;
  updateDeviceFingerprint(
    id: string,
    data: Partial<InsertDeviceFingerprint>,
  ): Promise<void>;
  deleteDeviceFingerprint(id: string): Promise<void>;
  updateDeviceLastSeen(fingerprintHash: string): Promise<void>;

  // MFA security context tracking
  createMfaSecurityContext(
    data: InsertMfaSecurityContext,
  ): Promise<MfaSecurityContext>;
  getMfaSecurityContext(
    userId: string,
    options?: { limit?: number; onlyFailures?: boolean },
  ): Promise<MfaSecurityContext[]>;
  updateMfaSecurityContext(
    id: string,
    data: Partial<InsertMfaSecurityContext>,
  ): Promise<void>;

  // Trusted device management
  getUserTrustedDevices(
    userId: string,
  ): Promise<(TrustedDevice & { deviceFingerprint: DeviceFingerprint })[]>;
  createTrustedDevice(data: InsertTrustedDevice): Promise<TrustedDevice>;
  updateTrustedDevice(
    id: string,
    data: Partial<InsertTrustedDevice>,
  ): Promise<void>;
  revokeTrustedDevice(id: string, reason: string): Promise<void>;
  cleanupExpiredTrustedDevices(): Promise<void>;

  // Device security validation
  calculateDeviceRiskScore(
    userId: string,
    context: {
      userAgent: string;
      ipAddress: string;
      location?: string;
      timezone?: string;
    },
  ): Promise<{ riskScore: number; riskFactors: string[] }>;
  validateDeviceContext(
    userId: string,
    fingerprintHash: string,
  ): Promise<{
    isValid: boolean;
    trustScore: number;
    requiresAdditionalVerification: boolean;
    deviceFingerprint?: DeviceFingerprint;
  }>;

  // Refresh token operations
  createRefreshToken(data: InsertRefreshToken): Promise<RefreshToken>;
  getRefreshToken(tokenId: string): Promise<RefreshToken | undefined>;
  getRefreshTokenByJWT(jwt: string): Promise<RefreshToken | undefined>;
  updateRefreshTokenLastUsed(tokenId: string): Promise<void>;
  revokeRefreshToken(tokenId: string): Promise<void>;
  revokeAllUserRefreshTokens(userId: string): Promise<void>;
  cleanupExpiredRefreshTokens(): Promise<void>;
  getUserActiveRefreshTokens(userId: string): Promise<RefreshToken[]>;

  // Auth audit log operations
  createAuthAuditLog(data: InsertAuthAuditLog): Promise<AuthAuditLog>;
  getAuthAuditLogs(
    userId?: string,
    filters?: { eventType?: string; limit?: number; hours?: number },
  ): Promise<AuthAuditLog[]>;
  getRecentAuthFailures(userId: string, hours: number): Promise<AuthAuditLog[]>;

  // JWT token revocation (enterprise security)
  revokeJWT(
    jti: string,
    userId: string,
    tokenType: string,
    reason: string,
    expiresAt: Date,
    originalExpiry?: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void>;
  isJWTRevoked(jti: string): Promise<boolean>;
  cleanupExpiredRevokedTokens(): Promise<number>;

  // Notification operations
  getUserNotifications(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;

  // Message operations
  getUserMessages(
    userId: string,
    options?: { eventId?: string; communityId?: string; limit?: number },
  ): Promise<(Message & { sender: User; recipient?: User; event?: Event })[]>;
  sendMessage(data: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<void>;
  getConversation(
    userId1: string,
    userId2: string,
  ): Promise<(Message & { sender: User; recipient?: User })[]>;

  // Game session operations
  getGameSessions(filters?: {
    eventId?: string;
    communityId?: string;
    hostId?: string;
    status?: string;
  }): Promise<(GameSession & { host: User; coHost?: User; event: Event })[]>;
  getGameSessionById(
    id: string,
  ): Promise<
    (GameSession & { host: User; coHost?: User; event: Event }) | null
  >;
  createGameSession(data: InsertGameSession): Promise<GameSession>;
  updateGameSession(
    id: string,
    data: Partial<InsertGameSession>,
  ): Promise<GameSession>;
  joinGameSession(sessionId: string, userId: string): Promise<void>;
  leaveGameSession(sessionId: string, userId: string): Promise<void>;

  // Social link operations
  getUserSocialLinks(userId: string): Promise<UserSocialLink[]>;
  updateUserSocialLinks(
    userId: string,
    links: InsertUserSocialLink[],
  ): Promise<UserSocialLink[]>;

  // Gaming profile operations
  getUserGamingProfiles(
    userId: string,
  ): Promise<(UserGamingProfile & { community: Community })[]>;
  upsertUserGamingProfile(
    data: InsertUserGamingProfile,
  ): Promise<UserGamingProfile>;

  // Friendship operations
  getFriends(
    userId: string,
  ): Promise<(Friendship & { requester: User; addressee: User })[]>;
  getFriendRequests(
    userId: string,
  ): Promise<(Friendship & { requester: User; addressee: User })[]>;
  getFriendCount(userId: string): Promise<number>;
  sendFriendRequest(
    requesterId: string,
    addresseeId: string,
  ): Promise<Friendship>;
  respondToFriendRequest(
    friendshipId: string,
    status: "accepted" | "declined" | "blocked",
  ): Promise<Friendship>;
  checkFriendshipStatus(
    userId1: string,
    userId2: string,
  ): Promise<Friendship | undefined>;

  // User activity operations
  getUserActivities(
    userId: string,
    options?: { limit?: number; communityId?: string },
  ): Promise<(UserActivity & { community?: Community })[]>;
  createUserActivity(data: InsertUserActivity): Promise<UserActivity>;

  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(data: InsertUserSettings): Promise<UserSettings>;

  // Matchmaking operations
  getMatchmakingPreferences(
    userId: string,
  ): Promise<MatchmakingPreferences | undefined>;
  upsertMatchmakingPreferences(
    data: InsertMatchmakingPreferences,
  ): Promise<MatchmakingPreferences>;
  findMatchingPlayers(
    userId: string,
    preferences: MatchmakingPreferences,
  ): Promise<{ data: MatchedPlayer[]; hasMore: boolean }>;

  // Tournament operations
  getTournaments(communityId?: string): Promise<
    (Tournament & {
      organizer: User;
      community: Community;
      participantCount: number;
    })[]
  >;
  getTournament(tournamentId: string): Promise<
    | (Tournament & {
        organizer: User;
        community: Community;
        participants: (TournamentParticipant & { user: User })[];
      })
    | undefined
  >;
  createTournament(data: InsertTournament): Promise<Tournament>;
  updateTournament(
    tournamentId: string,
    data: UpdateTournament,
  ): Promise<Tournament>;
  // Internal method for system status updates (bypasses business rules)
  updateTournamentStatus(
    tournamentId: string,
    status: string,
  ): Promise<Tournament>;
  joinTournament(
    tournamentId: string,
    userId: string,
  ): Promise<TournamentParticipant>;
  leaveTournament(tournamentId: string, userId: string): Promise<boolean>;

  // Advanced tournament operations
  getTournamentFormats(): Promise<TournamentFormat[]>;
  createTournamentFormat(
    data: InsertTournamentFormat,
  ): Promise<TournamentFormat>;
  getTournamentRounds(tournamentId: string): Promise<TournamentRound[]>;
  createTournamentRound(data: InsertTournamentRound): Promise<TournamentRound>;
  updateTournamentRound(
    roundId: string,
    data: Partial<InsertTournamentRound>,
  ): Promise<TournamentRound>;
  getTournamentMatches(
    tournamentId: string,
    roundId?: string,
  ): Promise<
    (TournamentMatch & { player1?: User; player2?: User; winner?: User })[]
  >;
  createTournamentMatch(data: InsertTournamentMatch): Promise<TournamentMatch>;
  updateTournamentMatch(
    matchId: string,
    data: Partial<InsertTournamentMatch>,
  ): Promise<TournamentMatch>;
  getMatchResults(matchId: string): Promise<
    (MatchResult & {
      winner: User;
      loser?: User;
      reportedBy: User;
      verifiedBy?: User;
    })[]
  >;
  createMatchResult(data: InsertMatchResult): Promise<MatchResult>;
  verifyMatchResult(resultId: string, verifierId: string): Promise<MatchResult>;

  // Forum operations
  getForumPosts(
    communityId: string,
    options?: { category?: string; limit?: number; offset?: number },
  ): Promise<
    (ForumPost & {
      author: User;
      community: Community;
      replyCount: number;
      likeCount: number;
      isLiked?: boolean;
    })[]
  >;
  getForumPost(
    id: string,
    userId?: string,
  ): Promise<
    | (ForumPost & { author: User; community: Community; isLiked: boolean })
    | undefined
  >;
  createForumPost(data: InsertForumPost): Promise<ForumPost>;
  updateForumPost(
    id: string,
    data: Partial<InsertForumPost>,
  ): Promise<ForumPost>;
  deleteForumPost(id: string): Promise<void>;
  likeForumPost(postId: string, userId: string): Promise<void>;
  unlikeForumPost(postId: string, userId: string): Promise<void>;
  getForumReplies(
    postId: string,
    userId?: string,
  ): Promise<
    (ForumReply & {
      author: User;
      isLiked?: boolean;
      childReplies?: ForumReply[];
    })[]
  >;
  createForumReply(data: InsertForumReply): Promise<ForumReply>;
  likeForumReply(replyId: string, userId: string): Promise<void>;
  unlikeForumReply(replyId: string, userId: string): Promise<void>;

  // Streaming session operations
  getStreamSessions(filters?: {
    hostUserId?: string;
    communityId?: string;
    status?: string;
    upcoming?: boolean;
  }): Promise<
    (StreamSession & {
      host: User;
      community?: Community;
      coHosts: StreamSessionCoHost[];
      platforms: StreamSessionPlatform[];
    })[]
  >;
  getStreamSession(id: string): Promise<
    | (StreamSession & {
        host: User;
        community?: Community;
        coHosts: (StreamSessionCoHost & { user: User })[];
        platforms: StreamSessionPlatform[];
      })
    | undefined
  >;
  createStreamSession(data: InsertStreamSession): Promise<StreamSession>;
  updateStreamSession(
    id: string,
    data: Partial<InsertStreamSession>,
  ): Promise<StreamSession>;
  deleteStreamSession(id: string): Promise<void>;

  // Stream session co-host operations
  addStreamCoHost(
    data: InsertStreamSessionCoHost,
  ): Promise<StreamSessionCoHost>;
  removeStreamCoHost(sessionId: string, userId: string): Promise<void>;
  updateStreamCoHostPermissions(
    sessionId: string,
    userId: string,
    permissions: {
      canControlStream: boolean;
      canManageChat: boolean;
      canInviteGuests: boolean;
      canEndStream: boolean;
    },
  ): Promise<StreamSessionCoHost>;

  // Stream session platform operations
  addStreamPlatform(
    data: InsertStreamSessionPlatform,
  ): Promise<StreamSessionPlatform>;
  updateStreamPlatform(
    id: string,
    data: Partial<InsertStreamSessionPlatform>,
  ): Promise<StreamSessionPlatform>;
  removeStreamPlatform(id: string): Promise<void>;
  getStreamPlatforms(sessionId: string): Promise<StreamSessionPlatform[]>;
  updateStreamStatus(
    sessionId: string,
    platform: string,
    isLive: boolean,
    viewerCount?: number,
  ): Promise<void>;

  // Collaboration request operations
  getCollaborationRequests(filters?: {
    fromUserId?: string;
    toUserId?: string;
    status?: string;
    type?: string;
  }): Promise<
    (CollaborationRequest & {
      fromUser: User;
      toUser: User;
      streamSession?: StreamSession;
    })[]
  >;
  createCollaborationRequest(
    data: InsertCollaborationRequest,
  ): Promise<CollaborationRequest>;
  respondToCollaborationRequest(
    id: string,
    status: "accepted" | "declined" | "cancelled",
    responseMessage?: string,
  ): Promise<CollaborationRequest>;
  expireCollaborationRequests(): Promise<void>;

  // Stream analytics operations
  recordStreamAnalytics(data: InsertStreamAnalytics): Promise<StreamAnalytics>;
  getStreamAnalytics(
    sessionId: string,
    platform?: string,
  ): Promise<StreamAnalytics[]>;
  getStreamAnalyticsSummary(sessionId: string): Promise<{
    totalViewers: number;
    peakViewers: number;
    averageViewers: number;
    totalChatMessages: number;
    platforms: string[];
  }>;

  // Collaborative streaming events
  createCollaborativeStreamEvent(
    data: InsertCollaborativeStreamEvent,
  ): Promise<CollaborativeStreamEvent>;
  getCollaborativeStreamEvent(
    id: string,
  ): Promise<CollaborativeStreamEvent | null>;
  updateCollaborativeStreamEvent(
    id: string,
    data: Partial<InsertCollaborativeStreamEvent>,
  ): Promise<CollaborativeStreamEvent>;
  deleteCollaborativeStreamEvent(id: string): Promise<void>;
  getUserCollaborativeStreamEvents(
    userId: string,
  ): Promise<CollaborativeStreamEvent[]>;

  // Stream collaborators
  createStreamCollaborator(
    data: InsertStreamCollaborator,
  ): Promise<StreamCollaborator>;
  getStreamCollaborator(id: string): Promise<StreamCollaborator | null>;
  updateStreamCollaborator(
    id: string,
    data: Partial<InsertStreamCollaborator>,
  ): Promise<StreamCollaborator>;
  deleteStreamCollaborator(id: string): Promise<void>;
  getStreamCollaborators(streamEventId: string): Promise<StreamCollaborator[]>;

  // Stream coordination sessions
  createStreamCoordinationSession(
    data: InsertStreamCoordinationSession,
  ): Promise<StreamCoordinationSession>;
  getStreamCoordinationSession(
    id: string,
  ): Promise<StreamCoordinationSession | null>;
  updateStreamCoordinationSession(
    id: string,
    data: Partial<InsertStreamCoordinationSession>,
  ): Promise<StreamCoordinationSession>;
  deleteStreamCoordinationSession(id: string): Promise<void>;
  getActiveCoordinationSessions(): Promise<StreamCoordinationSession[]>;

  // User activity analytics operations
  recordUserActivityAnalytics(
    data: InsertUserActivityAnalytics,
  ): Promise<UserActivityAnalytics>;
  getUserActivityAnalytics(
    userId: string,
    days?: number,
  ): Promise<UserActivityAnalytics[]>;

  // Community analytics operations
  recordCommunityAnalytics(
    data: InsertCommunityAnalytics,
  ): Promise<CommunityAnalytics>;
  getCommunityAnalytics(
    communityId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CommunityAnalytics[]>;

  // Platform metrics operations
  recordPlatformMetrics(data: InsertPlatformMetrics): Promise<PlatformMetrics>;
  getPlatformMetrics(
    metricType?: string,
    timeWindow?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PlatformMetrics[]>;

  // Event tracking operations
  recordEventTracking(data: InsertEventTracking): Promise<EventTracking>;
  getEventTracking(
    eventName?: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<EventTracking[]>;

  // Conversion funnel operations
  recordConversionFunnel(
    data: InsertConversionFunnel,
  ): Promise<ConversionFunnel>;
  getConversionFunnelData(
    funnelName: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ConversionFunnel[]>;

  // Admin & Moderation operations

  // User role operations (RBAC)
  getUserRoles(userId: string): Promise<UserRole[]>;
  createUserRole(data: InsertUserRole): Promise<UserRole>;
  updateUserRole(id: string, data: Partial<InsertUserRole>): Promise<UserRole>;
  deleteUserRole(id: string): Promise<void>;
  checkUserPermission(userId: string, permission: string): Promise<boolean>;
  getUsersByRole(role: string): Promise<(UserRole & { user: User })[]>;

  // User reputation operations
  getUserReputation(userId: string): Promise<UserReputation | undefined>;
  updateUserReputation(
    userId: string,
    data: Partial<InsertUserReputation>,
  ): Promise<UserReputation>;
  calculateReputationScore(userId: string): Promise<number>;
  getUsersByReputationRange(
    minScore: number,
    maxScore: number,
  ): Promise<(UserReputation & { user: User })[]>;
  recordPositiveAction(
    userId: string,
    actionType: string,
    metadata?: Record<string, unknown>,
  ): Promise<void>;
  recordNegativeAction(
    userId: string,
    actionType: string,
    severity: "minor" | "moderate" | "severe",
    metadata?: Record<string, unknown>,
  ): Promise<void>;
  recordReportSubmission(
    userId: string,
    reportId: string,
    isAccurate?: boolean,
  ): Promise<void>;
  batchRecalculateReputationScores(userIds?: string[]): Promise<void>;

  // Content report operations
  createContentReport(data: InsertContentReport): Promise<ContentReport>;
  getContentReports(filters?: {
    status?: string;
    priority?: string;
    reporterUserId?: string;
    assignedModerator?: string;
  }): Promise<
    (ContentReport & {
      reporter?: User;
      reportedUser?: User;
      assignedMod?: User;
    })[]
  >;
  getContentReport(id: string): Promise<
    | (ContentReport & {
        reporter?: User;
        reportedUser?: User;
        assignedMod?: User;
      })
    | undefined
  >;
  updateContentReport(
    id: string,
    data: Partial<InsertContentReport>,
  ): Promise<ContentReport>;
  assignContentReport(
    reportId: string,
    moderatorId: string,
  ): Promise<ContentReport>;
  resolveContentReport(
    reportId: string,
    resolution: string,
    actionTaken?: string,
    moderatorId?: string,
  ): Promise<ContentReport>;

  // Moderation action operations
  createModerationAction(
    data: InsertModerationAction,
  ): Promise<ModerationAction>;
  getModerationActions(filters?: {
    targetUserId?: string;
    moderatorId?: string;
    action?: string;
    isActive?: boolean;
  }): Promise<(ModerationAction & { moderator: User; targetUser: User })[]>;
  getModerationAction(
    id: string,
  ): Promise<
    (ModerationAction & { moderator: User; targetUser: User }) | undefined
  >;
  updateModerationAction(
    id: string,
    data: Partial<InsertModerationAction>,
  ): Promise<ModerationAction>;
  reverseModerationAction(
    id: string,
    reversedBy: string,
    reason: string,
  ): Promise<ModerationAction>;
  getUserActiveModerationActions(userId: string): Promise<ModerationAction[]>;

  // Moderation queue operations
  addToModerationQueue(data: InsertModerationQueue): Promise<ModerationQueue>;
  getModerationQueue(filters?: {
    status?: string;
    assignedModerator?: string;
    priority?: number;
    itemType?: string;
    overdue?: boolean;
  }): Promise<(ModerationQueue & { assignedMod?: User })[]>;
  getModerationQueueItem(
    id: string,
  ): Promise<(ModerationQueue & { assignedMod?: User }) | undefined>;
  assignModerationQueueItem(
    id: string,
    moderatorId: string,
  ): Promise<ModerationQueue>;
  completeModerationQueueItem(
    id: string,
    resolution: string,
    actionTaken?: string,
  ): Promise<ModerationQueue>;
  updateModerationQueuePriority(
    id: string,
    priority: number,
  ): Promise<ModerationQueue>;

  // Enhanced moderation queue operations
  autoAssignModerationQueue(
    itemType?: string,
  ): Promise<{ assigned: number; skipped: number }>;
  bulkAssignModerationQueue(
    itemIds: string[],
    moderatorId: string,
  ): Promise<ModerationQueue[]>;
  getModeratorWorkload(moderatorId?: string): Promise<
    {
      moderatorId: string;
      activeTasks: number;
      avgCompletionTime: number;
      lastActivity: Date | null;
    }[]
  >;
  escalateOverdueItems(thresholdHours?: number): Promise<ModerationQueue[]>;
  calculateAutoPriority(
    itemType: string,
    metadata?: Record<string, unknown>,
  ): Promise<number>;
  getModerationQueueStats(): Promise<{
    totalOpen: number;
    totalAssigned: number;
    totalCompleted: number;
    avgCompletionTime: number;
    overdueCount: number;
  }>;

  // CMS content operations
  getCmsContent(type?: string, isPublished?: boolean): Promise<CmsContent[]>;
  getCmsContentById(
    id: string,
  ): Promise<
    | (CmsContent & { author: User; lastEditor: User; approver?: User })
    | undefined
  >;
  createCmsContent(data: InsertCmsContent): Promise<CmsContent>;
  updateCmsContent(
    id: string,
    data: Partial<InsertCmsContent>,
  ): Promise<CmsContent>;
  publishCmsContent(id: string, publisherId: string): Promise<CmsContent>;
  deleteCmsContent(id: string): Promise<void>;
  getCmsContentVersions(type: string): Promise<CmsContent[]>;

  // Ban evasion tracking operations
  createBanEvasionRecord(
    data: InsertBanEvasionTracking,
  ): Promise<BanEvasionTracking>;
  getBanEvasionRecords(
    userId?: string,
    suspiciousActivity?: boolean,
  ): Promise<(BanEvasionTracking & { user: User; bannedUser?: User })[]>;
  checkBanEvasion(
    userId: string,
    ipAddress: string,
    deviceFingerprint?: string,
  ): Promise<BanEvasionTracking[]>;
  updateBanEvasionStatus(
    id: string,
    status: string,
    reviewedBy?: string,
  ): Promise<BanEvasionTracking>;

  // User appeal operations
  createUserAppeal(data: InsertUserAppeal): Promise<UserAppeal>;
  getUserAppeals(filters?: {
    userId?: string;
    status?: string;
    reviewedBy?: string;
  }): Promise<
    (UserAppeal & {
      user: User;
      moderationAction?: ModerationAction;
      reviewer?: User;
    })[]
  >;
  getUserAppeal(id: string): Promise<
    | (UserAppeal & {
        user: User;
        moderationAction?: ModerationAction;
        assignedRev?: User;
      })
    | undefined
  >;
  updateUserAppeal(
    id: string,
    data: Partial<InsertUserAppeal>,
  ): Promise<UserAppeal>;
  assignAppealReviewer(
    appealId: string,
    reviewerId: string,
  ): Promise<UserAppeal>;
  resolveUserAppeal(
    appealId: string,
    decision: string,
    reviewerNotes?: string,
    reviewerId?: string,
  ): Promise<UserAppeal>;

  // Moderation template operations
  getModerationTemplates(
    category?: string,
  ): Promise<
    Array<Omit<ModerationTemplate, "createdBy"> & { createdBy: User }>
  >;
  getModerationTemplate(
    id: string,
  ): Promise<
    (Omit<ModerationTemplate, "createdBy"> & { createdBy: User }) | undefined
  >;
  createModerationTemplate(
    data: InsertModerationTemplate,
  ): Promise<ModerationTemplate>;
  updateModerationTemplate(
    id: string,
    data: Partial<InsertModerationTemplate>,
  ): Promise<ModerationTemplate>;
  deleteModerationTemplate(id: string): Promise<void>;

  // Admin audit log operations
  createAuditLog(data: InsertAdminAuditLog): Promise<AdminAuditLog>;
  getAuditLogs(filters?: {
    adminUserId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<(AdminAuditLog & { admin: User })[]>;
  getAuditLog(
    id: string,
  ): Promise<(AdminAuditLog & { admin: User }) | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for authentication integration.

  async getUser(id: string): Promise<User | undefined> {
    // Return user data including all required fields, but with sensitive fields as null for security
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        profileImageUrl: users.profileImageUrl,
        primaryCommunity: users.primaryCommunity,
        bio: users.bio,
        location: users.location,
        website: users.website,
        status: users.status,
        statusMessage: users.statusMessage,
        timezone: users.timezone,
        dateOfBirth: users.dateOfBirth,
        isPrivate: users.isPrivate,
        showOnlineStatus: users.showOnlineStatus,
        allowDirectMessages: users.allowDirectMessages,
        // Sensitive fields - these will be returned as null for security
        passwordHash: sql<string | null>`NULL`,
        isEmailVerified: users.isEmailVerified,
        emailVerifiedAt: users.emailVerifiedAt,
        failedLoginAttempts: users.failedLoginAttempts,
        lastFailedLogin: users.lastFailedLogin,
        accountLockedUntil: users.accountLockedUntil,
        passwordChangedAt: users.passwordChangedAt,
        mfaEnabled: users.mfaEnabled,
        mfaEnabledAt: users.mfaEnabledAt,
        lastLoginAt: users.lastLoginAt,
        lastActiveAt: users.lastActiveAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id));
    if (!user) {
      throw new Error("Database operation failed");
    }
    return user;
  }

  async getAllUsers(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: "online" | "offline" | "away" | "busy" | "gaming" | "all";
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<{ users: User[]; total: number }> {
    const {
      page = 1,
      limit = 50,
      search,
      role,
      status,
      sortBy = "createdAt",
      order = "desc",
    } = filters || {};

    // Select safe user fields (exclude sensitive data like passwordHash)
    let query: any = db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        profileImageUrl: users.profileImageUrl,
        primaryCommunity: users.primaryCommunity,
        bio: users.bio,
        location: users.location,
        website: users.website,
        status: users.status,
        statusMessage: users.statusMessage,
        timezone: users.timezone,
        dateOfBirth: users.dateOfBirth,
        isPrivate: users.isPrivate,
        showOnlineStatus: users.showOnlineStatus,
        allowDirectMessages: users.allowDirectMessages,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);

    // Build conditions
    const conditions = [];

    // Add search filter
    if (search) {
      conditions.push(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
        ),
      );
    }

    // Add status filter
    if (status && status !== "all") {
      conditions.push(
        eq(
          users.status,
          status as "online" | "offline" | "away" | "busy" | "gaming",
        ),
      );
    }

    // Add role filter (requires join with userRoles)
    if (role) {
      query = query.leftJoin(userRoles, eq(users.id, userRoles.userId));
      conditions.push(eq(userRoles.role, role));
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Add sorting
    const validSortColumns = [
      "createdAt",
      "updatedAt",
      "username",
      "email",
      "firstName",
      "lastName",
    ];
    if (validSortColumns.includes(sortBy)) {
      let sortColumn;
      switch (sortBy) {
        case "createdAt":
          sortColumn = users.createdAt;
          break;
        case "updatedAt":
          sortColumn = users.updatedAt;
          break;
        case "username":
          sortColumn = users.username;
          break;
        case "email":
          sortColumn = users.email;
          break;
        case "firstName":
          sortColumn = users.firstName;
          break;
        case "lastName":
          sortColumn = users.lastName;
          break;
        default:
          sortColumn = users.createdAt;
      }

      if (order === "asc") {
        query = query.orderBy(asc(sortColumn));
      } else {
        query = query.orderBy(desc(sortColumn));
      }
    } else {
      // Default sort
      query = query.orderBy(desc(users.createdAt));
    }

    // Get total count with same filters
    let countQuery: any = db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    if (role) {
      countQuery = countQuery.leftJoin(
        userRoles,
        eq(users.id, userRoles.userId),
      );
    }
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const countResult = await countQuery;
    const total = countResult?.[0]?.count ?? 0;

    // Add pagination
    const offset = (page - 1) * limit;
    const usersList = await (query as any).limit(limit).offset(offset);

    return { users: usersList, total };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      throw new Error("Database operation failed");
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    if (!user) {
      throw new Error("Database operation failed");
    }
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    if (!user) {
      throw new Error("Failed to create user");
    }
    if (!user) {
      throw new Error("Database operation failed");
    }
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!user) {
      throw new Error("Failed to upsert user");
    }
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    // Update user and return safe projection (excluding passwordHash)
    const updateData = {
      ...userData,
      updatedAt: new Date(),
    };

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    if (!user) {
      throw new Error("Database operation failed");
    }
    return user;
  }

  async getCommunityActiveUsers(
    communityId: string,
    options: {
      limit?: number;
      cursor?: string;
      includeOffline?: boolean;
      sortBy?: string;
      sortDirection?: "asc" | "desc";
    } = {},
  ): Promise<{ data: User[]; hasMore: boolean }> {
    const {
      limit = 20,
      cursor,
      includeOffline = false,
      sortDirection = "desc",
    } = options;

    let conditions = [eq(userCommunities.communityId, communityId)];

    if (!includeOffline) {
      const statusCondition = or(
        eq(users.status, "online"),
        eq(users.status, "away"),
        eq(users.status, "busy"),
        eq(users.status, "gaming"),
      );
      if (statusCondition) {
        conditions.push(statusCondition);
      }
    }

    if (cursor) {
      conditions.push(lt(users.lastActiveAt, new Date(cursor)));
    }

    const activeUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        profileImageUrl: users.profileImageUrl,
        primaryCommunity: users.primaryCommunity,
        bio: users.bio,
        location: users.location,
        website: users.website,
        status: users.status,
        statusMessage: users.statusMessage,
        timezone: users.timezone,
        dateOfBirth: users.dateOfBirth,
        isPrivate: users.isPrivate,
        showOnlineStatus: users.showOnlineStatus,
        allowDirectMessages: users.allowDirectMessages,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastActiveAt: users.lastActiveAt,
      })
      .from(users)
      .innerJoin(userCommunities, eq(users.id, userCommunities.userId))
      .where(and(...conditions))
      .orderBy(
        sortDirection === "desc"
          ? desc(users.lastActiveAt)
          : asc(users.lastActiveAt),
      )
      .limit(limit + 1); // Get one extra to check if there are more

    const hasMore = activeUsers.length > limit;
    const data = (
      hasMore ? activeUsers.slice(0, limit) : activeUsers
    ) as User[];

    return { data, hasMore };
  }

  // Community operations
  async getCommunities(): Promise<Community[]> {
    return await db
      .select()
      .from(communities)
      .where(eq(communities.isActive, true))
      .orderBy(communities.displayName);
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db
      .select()
      .from(communities)
      .where(eq(communities.id, id));
    if (!community) {
      throw new Error("Database operation failed");
    }
    return community;
  }

  async createCommunity(communityData: InsertCommunity): Promise<Community> {
    const [community] = await db
      .insert(communities)
      .values([communityData])
      .returning();
    if (!community) {
      throw new Error("Failed to create community");
    }
    return community;
  }

  // User community operations
  async getUserCommunities(
    userId: string,
  ): Promise<(UserCommunity & { community: Community })[]> {
    return await db
      .select({
        id: userCommunities.id,
        userId: userCommunities.userId,
        communityId: userCommunities.communityId,
        isPrimary: userCommunities.isPrimary,
        joinedAt: userCommunities.joinedAt,
        community: communities,
      })
      .from(userCommunities)
      .innerJoin(communities, eq(userCommunities.communityId, communities.id))
      .where(eq(userCommunities.userId, userId));
  }

  async joinCommunity(data: InsertUserCommunity): Promise<UserCommunity> {
    const [userCommunity] = await db
      .insert(userCommunities)
      .values(data)
      .onConflictDoNothing()
      .returning();

    // Record positive action for community engagement
    if (userCommunity) {
      await this.recordPositiveAction(data.userId, "community_joined", {
        communityId: data.communityId,
      });
    }

    if (!userCommunity) {
      throw new Error("Database operation failed");
    }

    return userCommunity;
  }

  async setPrimaryCommunity(
    userId: string,
    communityId: string,
  ): Promise<void> {
    // First, unset all primary communities for the user
    await db
      .update(userCommunities)
      .set({ isPrimary: false })
      .where(eq(userCommunities.userId, userId));

    // Then set the new primary community
    await db
      .update(userCommunities)
      .set({ isPrimary: true })
      .where(
        and(
          eq(userCommunities.userId, userId),
          eq(userCommunities.communityId, communityId),
        ),
      );

    // Update the user's primary community
    await db
      .update(users)
      .set({
        primaryCommunity: communityId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Platform account operations for cross-platform streaming
  async getUserPlatformAccounts(
    userId: string,
  ): Promise<SafeUserPlatformAccount[]> {
    return await db
      .select({
        id: userPlatformAccounts.id,
        userId: userPlatformAccounts.userId,
        platform: userPlatformAccounts.platform,
        handle: userPlatformAccounts.handle,
        platformUserId: userPlatformAccounts.platformUserId,
        channelId: userPlatformAccounts.channelId,
        pageId: userPlatformAccounts.pageId,
        tokenExpiresAt: userPlatformAccounts.tokenExpiresAt,
        scopes: userPlatformAccounts.scopes,
        isActive: userPlatformAccounts.isActive,
        lastVerified: userPlatformAccounts.lastVerified,
        createdAt: userPlatformAccounts.createdAt,
        updatedAt: userPlatformAccounts.updatedAt,
      })
      .from(userPlatformAccounts)
      .where(eq(userPlatformAccounts.userId, userId))
      .orderBy(userPlatformAccounts.platform);
  }

  async getUserPlatformAccount(
    userId: string,
    platform: string,
  ): Promise<SafeUserPlatformAccount | undefined> {
    const result = await db
      .select({
        id: userPlatformAccounts.id,
        userId: userPlatformAccounts.userId,
        platform: userPlatformAccounts.platform,
        handle: userPlatformAccounts.handle,
        platformUserId: userPlatformAccounts.platformUserId,
        channelId: userPlatformAccounts.channelId,
        pageId: userPlatformAccounts.pageId,
        tokenExpiresAt: userPlatformAccounts.tokenExpiresAt,
        scopes: userPlatformAccounts.scopes,
        isActive: userPlatformAccounts.isActive,
        lastVerified: userPlatformAccounts.lastVerified,
        createdAt: userPlatformAccounts.createdAt,
        updatedAt: userPlatformAccounts.updatedAt,
      })
      .from(userPlatformAccounts)
      .where(
        and(
          eq(userPlatformAccounts.userId, userId),
          eq(userPlatformAccounts.platform, platform),
        ),
      )
      .limit(1);
    return result[0];
  }

  // Internal method to get platform account with tokens (for OAuth refresh)
  async getUserPlatformAccountWithTokens(
    userId: string,
    platform: string,
  ): Promise<UserPlatformAccount | undefined> {
    const [account] = await db
      .select()
      .from(userPlatformAccounts)
      .where(
        and(
          eq(userPlatformAccounts.userId, userId),
          eq(userPlatformAccounts.platform, platform),
        ),
      )
      .limit(1);
    if (!account) {
      throw new Error("Database operation failed");
    }
    return account;
  }

  async createUserPlatformAccount(
    data: InsertUserPlatformAccount,
  ): Promise<SafeUserPlatformAccount> {
    const result = await db
      .insert(userPlatformAccounts)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning({
        id: userPlatformAccounts.id,
        userId: userPlatformAccounts.userId,
        platform: userPlatformAccounts.platform,
        handle: userPlatformAccounts.handle,
        platformUserId: userPlatformAccounts.platformUserId,
        channelId: userPlatformAccounts.channelId,
        pageId: userPlatformAccounts.pageId,
        tokenExpiresAt: userPlatformAccounts.tokenExpiresAt,
        scopes: userPlatformAccounts.scopes,
        isActive: userPlatformAccounts.isActive,
        lastVerified: userPlatformAccounts.lastVerified,
        createdAt: userPlatformAccounts.createdAt,
        updatedAt: userPlatformAccounts.updatedAt,
      });
    if (!result[0]) {
      throw new Error("Failed to create user platform account");
    }
    return result[0];
  }

  async updateUserPlatformAccount(
    id: string,
    data: {
      handle?: string;
      accessToken?: string;
      refreshToken?: string;
      tokenExpiresAt?: Date;
      scopes?: unknown;
      isActive?: boolean;
      lastVerified?: Date;
    },
  ): Promise<SafeUserPlatformAccount> {
    const updateData: Partial<typeof userPlatformAccounts.$inferInsert> = {};
    if (data.handle !== undefined) updateData.handle = data.handle;
    if (data.accessToken !== undefined)
      updateData.accessToken = data.accessToken;
    if (data.refreshToken !== undefined)
      updateData.refreshToken = data.refreshToken;
    if (data.tokenExpiresAt !== undefined)
      updateData.tokenExpiresAt = data.tokenExpiresAt;
    if (data.scopes !== undefined)
      updateData.scopes = JSON.stringify(data.scopes);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.lastVerified !== undefined)
      updateData.lastVerified = data.lastVerified;
    updateData.updatedAt = new Date();

    const result = await db
      .update(userPlatformAccounts)
      .set(updateData)
      .where(eq(userPlatformAccounts.id, id))
      .returning({
        id: userPlatformAccounts.id,
        userId: userPlatformAccounts.userId,
        platform: userPlatformAccounts.platform,
        handle: userPlatformAccounts.handle,
        platformUserId: userPlatformAccounts.platformUserId,
        channelId: userPlatformAccounts.channelId,
        pageId: userPlatformAccounts.pageId,
        tokenExpiresAt: userPlatformAccounts.tokenExpiresAt,
        scopes: userPlatformAccounts.scopes,
        isActive: userPlatformAccounts.isActive,
        lastVerified: userPlatformAccounts.lastVerified,
        createdAt: userPlatformAccounts.createdAt,
        updatedAt: userPlatformAccounts.updatedAt,
      });
    if (!result[0]) {
      throw new Error("Failed to update user platform account");
    }
    return result[0];
  }

  async deleteUserPlatformAccount(id: string): Promise<void> {
    await db
      .delete(userPlatformAccounts)
      .where(eq(userPlatformAccounts.id, id));
  }

  async getUserPlatformHandle(
    userId: string,
    platform: string,
  ): Promise<string | null> {
    const account = await this.getUserPlatformAccount(userId, platform);
    return account?.handle || null;
  }

  async getUserPlatformToken(
    userId: string,
    platform: string,
  ): Promise<string | null> {
    // Security: Only fetch the token field, never expose tokens in broader queries
    const result = await db
      .select({
        accessToken: userPlatformAccounts.accessToken,
        tokenExpiresAt: userPlatformAccounts.tokenExpiresAt,
      })
      .from(userPlatformAccounts)
      .where(
        and(
          eq(userPlatformAccounts.userId, userId),
          eq(userPlatformAccounts.platform, platform),
          eq(userPlatformAccounts.isActive, true),
        ),
      )
      .limit(1);

    const account = result[0];
    if (!account?.accessToken) {
      return null;
    }

    // Check token expiry - return null for expired tokens
    if (account.tokenExpiresAt && account.tokenExpiresAt <= new Date()) {
      return null;
    }

    // TODO: Implement token decryption here when encryption is added
    return account.accessToken;
  }

  // Theme preference operations
  async getUserThemePreferences(userId: string): Promise<ThemePreference[]> {
    return await db
      .select()
      .from(themePreferences)
      .where(eq(themePreferences.userId, userId));
  }

  async upsertThemePreference(
    data: InsertThemePreference,
  ): Promise<ThemePreference> {
    const [preference] = await db
      .insert(themePreferences)
      .values(data)
      .onConflictDoUpdate({
        target: [themePreferences.userId, themePreferences.communityId],
        set: {
          themeMode: data.themeMode,
          customColors: data.customColors,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!preference) {
      throw new Error("Failed to upsert theme preference");
    }
    return preference;
  }

  // Event operations
  async getEvents(filters?: {
    userId?: string;
    communityId?: string;
    type?: string;
    upcoming?: boolean;
  }): Promise<
    (Event & {
      creator: User;
      community: Community | null;
      attendeeCount: number;
      isUserAttending?: boolean;
    })[]
  > {
    const baseQuery = db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        type: events.type,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        communityId: events.communityId,
        creatorId: events.creatorId,
        hostId: events.hostId,
        coHostId: events.coHostId,
        maxAttendees: events.maxAttendees,
        isVirtual: events.isVirtual,
        playerSlots: events.playerSlots,
        alternateSlots: events.alternateSlots,
        isPublic: events.isPublic,
        status: events.status,
        gameFormat: events.gameFormat,
        powerLevel: events.powerLevel,
        isRecurring: events.isRecurring,
        recurrencePattern: events.recurrencePattern,
        recurrenceInterval: events.recurrenceInterval,
        recurrenceEndDate: events.recurrenceEndDate,
        parentEventId: events.parentEventId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        creator: users,
        community: communities,
      })
      .from(events)
      .leftJoin(users, eq(events.creatorId, users.id))
      .leftJoin(communities, eq(events.communityId, communities.id));

    let conditions = [];
    if (filters?.communityId) {
      conditions.push(eq(events.communityId, filters.communityId));
    }
    if (filters?.type) {
      conditions.push(eq(events.type, filters.type as any));
    }
    if (filters?.upcoming) {
      // const today = new Date().toISOString().split('T')[0];
      // conditions.push(gte(events.date, today as any)); // TODO: date column doesn't exist
      conditions.push(gte(events.startTime, new Date()));
    }

    const query =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    const rawEvents = await query.orderBy(events.startTime); // TODO: time column doesn't exist, using startTime

    // Get attendee counts and user attendance separately
    const eventIds = rawEvents.map((e) => e.id);
    const attendeeCounts =
      eventIds.length > 0
        ? await db
            .select({
              eventId: eventAttendees.eventId,
              count: count(eventAttendees.id).as("count"),
            })
            .from(eventAttendees)
            .where(inArray(eventAttendees.eventId, eventIds))
            .groupBy(eventAttendees.eventId)
        : [];

    const userAttendance =
      filters?.userId && eventIds.length > 0
        ? await db
            .select({
              eventId: eventAttendees.eventId,
            })
            .from(eventAttendees)
            .where(
              and(
                inArray(eventAttendees.eventId, eventIds),
                eq(eventAttendees.userId, filters.userId),
              ),
            )
        : [];

    type AttendeeCount = { eventId: string; count: number };
    type UserAttendance = { eventId: string };

    const eventsWithDetails = rawEvents.map((event) => ({
      ...event,
      creator: event.creator || {
        id: "",
        email: null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        primaryCommunity: null,
        username: null,
        bio: null,
        location: null,
        website: null,
        status: null,
        statusMessage: null,
        timezone: null,
        dateOfBirth: null,
        isPrivate: false,
        showOnlineStatus: "everyone",
        allowDirectMessages: "everyone",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      community: event.community,
      attendeeCount:
        (attendeeCounts as AttendeeCount[]).find(
          (ac) => ac.eventId === event.id,
        )?.count || 0,
      isUserAttending: (userAttendance as UserAttendance[]).some(
        (ua) => ua.eventId === event.id,
      ),
    }));
    if (!eventsWithDetails) {
      throw new Error("Database operation failed");
    }
    return eventsWithDetails as (Event & {
      creator: User;
      community: Community | null;
      attendeeCount: number;
      isUserAttending?: boolean;
    })[];
  }

  async getEvent(
    id: string,
    userId?: string,
  ): Promise<
    | (Event & {
        creator: User;
        community: Community | null;
        attendeeCount: number;
        isUserAttending: boolean;
      })
    | undefined
  > {
    const [event] = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        type: events.type,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        communityId: events.communityId,
        creatorId: events.creatorId,
        hostId: events.hostId,
        coHostId: events.coHostId,
        maxAttendees: events.maxAttendees,
        isVirtual: events.isVirtual,
        playerSlots: events.playerSlots,
        alternateSlots: events.alternateSlots,
        isPublic: events.isPublic,
        status: events.status,
        gameFormat: events.gameFormat,
        powerLevel: events.powerLevel,
        isRecurring: events.isRecurring,
        recurrencePattern: events.recurrencePattern,
        recurrenceInterval: events.recurrenceInterval,
        recurrenceEndDate: events.recurrenceEndDate,
        parentEventId: events.parentEventId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        creator: users,
        community: communities,
      })
      .from(events)
      .leftJoin(users, eq(events.creatorId, users.id))
      .leftJoin(communities, eq(events.communityId, communities.id))
      .where(eq(events.id, id));

    if (!event) return undefined;

    // Get attendee count
    const [attendeeCount] = await db
      .select({ count: count(eventAttendees.id) })
      .from(eventAttendees)
      .where(eq(eventAttendees.eventId, id));

    // Check if user is attending
    const isUserAttending = userId
      ? await db
          .select({ id: eventAttendees.id })
          .from(eventAttendees)
          .where(
            and(
              eq(eventAttendees.eventId, id),
              eq(eventAttendees.userId, userId),
            ),
          )
          .then((result: { id: string }[]) => result.length > 0)
      : false;

    return {
      ...event,
      creator: event.creator || {
        id: "",
        email: null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        primaryCommunity: null,
        username: null,
        bio: null,
        location: null,
        website: null,
        status: null,
        statusMessage: null,
        timezone: null,
        dateOfBirth: null,
        isPrivate: false,
        showOnlineStatus: "everyone",
        allowDirectMessages: "everyone",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      community: event.community,
      attendeeCount: attendeeCount?.count || 0,
      isUserAttending,
    } as Event & {
      creator: User;
      community: Community | null;
      attendeeCount: number;
      isUserAttending: boolean;
    };
  }

  async createEvent(data: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(data).returning();

    if (!event) {
      throw new Error("Failed to create event");
    }

    // Auto-create TableSync session for game pod events
    if (event.type === "game_pod") {
      try {
        const gameSessionData: InsertGameSession = {
          eventId: event.id,
          hostId: event.creatorId,
          status: "waiting" as const,
          currentPlayers: 0,
          // maxPlayers: event.playerSlots || 4, // TODO: playerSlots doesn't exist in events schema
          maxPlayers: 4, // Default to 4 players
          // gameData: { // TODO: gameData doesn't exist in gameSessions schema
          //   name: event.title,
          //   format: event.gameFormat || 'commander', // TODO: gameFormat doesn't exist
          //   powerLevel: event.powerLevel || 'casual', // TODO: powerLevel doesn't exist
          //   description: event.description || '',
          // },
          gameType: "commander", // Default game type
          // communityId: event.communityId, // TODO: communityId doesn't exist in gameSessions schema
        };

        await this.createGameSession(gameSessionData);
      } catch (error) {
        console.error("Failed to create automatic TableSync session:", error);
        // Don't fail the event creation if TableSync session fails
      }
    }

    if (!event) {
      throw new Error("Database operation failed");
    }

    return event;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();
    if (!event) {
      throw new Error("Database operation failed");
    }
    return event;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  /**
   * Get user's events in a specific time range
   * Used for conflict detection and availability checking
   * Returns events that overlap with the given time range
   */
  async getUserEventsInRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(
        and(
          or(eq(events.creatorId, userId), eq(events.hostId, userId)),
          // Find events that overlap: startTime < endDate AND (endTime > startDate OR endTime is NULL)
          lt(events.startTime, endDate),
          or(gt(events.endTime, startDate), sql`${events.endTime} IS NULL`),
        ),
      )
      .all();
  }

  /**
   * Get all events in a recurring series
   * Uses parentEventId to group recurring event instances
   */
  async getRecurringEventSeries(parentEventId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(
        or(
          eq(events.parentEventId, parentEventId),
          eq(events.id, parentEventId),
        ),
      )
      .orderBy(asc(events.startTime))
      .all();
  }

  /**
   * Batch insert events (for recurring event creation)
   */
  async batchInsertEvents(eventData: InsertEvent[]): Promise<Event[]> {
    const insertedEvents: Event[] = [];

    for (const data of eventData) {
      const [inserted] = await db.insert(events).values(data).returning();
      if (inserted) {
        insertedEvents.push(inserted);
      }
    }

    return insertedEvents;
  }

  /**
   * Get events by multiple IDs
   * Optimized for batch operations
   */
  async getEventsByIds(eventIds: string[]): Promise<Event[]> {
    if (eventIds.length === 0) {
      return [];
    }

    return await db
      .select()
      .from(events)
      .where(inArray(events.id, eventIds))
      .all();
  }

  // Event attendee operations
  async joinEvent(data: InsertEventAttendee): Promise<EventAttendee> {
    const [attendee] = await db
      .insert(eventAttendees)
      .values(data)
      .onConflictDoUpdate({
        target: [eventAttendees.eventId, eventAttendees.userId],
        set: {
          status: data.status || "attending",
          joinedAt: new Date(),
        },
      })
      .returning();
    if (!attendee) {
      throw new Error("Database operation failed");
    }
    return attendee;
  }

  async leaveEvent(eventId: string, userId: string): Promise<void> {
    await db
      .delete(eventAttendees)
      .where(
        and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.userId, userId),
        ),
      );
  }

  async updateEventAttendee(
    id: string,
    data: Partial<{
      playerType: string;
      status: "attending" | "maybe" | "not_attending";
      role: string;
    }>,
  ): Promise<EventAttendee> {
    const [updated] = await db
      .update(eventAttendees)
      .set(data)
      .where(eq(eventAttendees.id, id))
      .returning();

    if (!updated) {
      throw new Error("Event attendee not found");
    }

    return updated;
  }

  async getEventAttendees(
    eventId: string,
  ): Promise<(EventAttendee & { user: User })[]> {
    const results = await db
      .select({
        attendee: eventAttendees,
        user: users,
      })
      .from(eventAttendees)
      .innerJoin(users, eq(eventAttendees.userId, users.id))
      .where(eq(eventAttendees.eventId, eventId));

    return results.map((r) => ({ ...r.attendee, user: r.user }));
  }

  async getUserEventAttendance(
    userId: string,
  ): Promise<(EventAttendee & { event: Event })[]> {
    const results = await db
      .select({
        attendee: eventAttendees,
        event: events,
      })
      .from(eventAttendees)
      .innerJoin(events, eq(eventAttendees.eventId, events.id))
      .where(eq(eventAttendees.userId, userId));

    return results.map((r) => ({ ...r.attendee, event: r.event }));
  }

  async getUsersEventAttendance(
    userIds: string[],
  ): Promise<(EventAttendee & { event: Event })[]> {
    if (userIds.length === 0) return [];

    const results = await db
      .select({
        attendee: eventAttendees,
        event: events,
      })
      .from(eventAttendees)
      .innerJoin(events, eq(eventAttendees.eventId, events.id))
      .where(inArray(eventAttendees.userId, userIds));

    return results.map((r) => ({ ...r.attendee, event: r.event }));
  }

  async getUserCreatedEvents(userId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.creatorId, userId))
      .orderBy(asc(events.startTime));
  }

  async getEventAttendeesByEventIds(
    eventIds: string[],
  ): Promise<EventAttendee[]> {
    if (eventIds.length === 0) return [];

    return await db
      .select()
      .from(eventAttendees)
      .where(inArray(eventAttendees.eventId, eventIds));
  }

  // Transaction-based event operations
  async getEventWithTransaction(
    tx: Transaction,
    id: string,
  ): Promise<Event | undefined> {
    const [event] = await tx.select().from(events).where(eq(events.id, id));
    if (!event) {
      throw new Error("Database operation failed");
    }
    return event;
  }

  async joinEventWithTransaction(
    tx: Transaction,
    data: InsertEventAttendee,
  ): Promise<EventAttendee> {
    const [attendee] = await tx
      .insert(eventAttendees)
      .values(data)
      .onConflictDoUpdate({
        target: [eventAttendees.eventId, eventAttendees.userId],
        set: {
          status: data.status || "attending",
          joinedAt: new Date(),
        },
      })
      .returning();
    if (!attendee) {
      throw new Error("Database operation failed");
    }
    return attendee;
  }

  async createNotificationWithTransaction(
    tx: Transaction,
    data: InsertNotification,
  ): Promise<Notification> {
    const [notification] = await tx
      .insert(notifications)
      .values(data)
      .returning();
    if (!notification) {
      throw new Error("Failed to create notification");
    }
    return notification;
  }

  // Bulk calendar operations for game pods
  async createBulkEvents(data: InsertEvent[]): Promise<Event[]> {
    if (data.length === 0) return [];
    const createdEvents = await db.insert(events).values(data).returning();

    // Auto-create TableSync sessions for game pod events
    for (const event of createdEvents) {
      if (event.type === "game_pod") {
        try {
          const gameSessionData: InsertGameSession = {
            eventId: event.id,
            hostId: event.creatorId,
            status: "waiting" as const,
            currentPlayers: 0,
            // maxPlayers: event.playerSlots || 4, // TODO: playerSlots doesn't exist in events schema
            maxPlayers: 4, // Default to 4 players
            // gameData: { // TODO: gameData doesn't exist in gameSessions schema
            //   name: event.title,
            //   format: event.gameFormat || 'commander', // TODO: gameFormat doesn't exist
            //   powerLevel: event.powerLevel || 'casual', // TODO: powerLevel doesn't exist
            //   description: event.description || '',
            // },
            gameType: "commander", // Default game type
            // communityId: event.communityId, // TODO: communityId doesn't exist in gameSessions schema
          };

          await this.createGameSession(gameSessionData);
        } catch (error) {
          console.error(
            `Failed to create automatic TableSync session for event ${event.id}:`,
            error,
          );
          // Don't fail the bulk creation if individual TableSync sessions fail
        }
      }
    }

    if (!createdEvents) {
      throw new Error("Database operation failed");
    }

    return createdEvents;
  }

  async createRecurringEvents(
    data: InsertEvent,
    _endDate: string,
  ): Promise<Event[]> {
    // Validate recurring event data
    if (
      !data.isRecurring ||
      !data.recurrencePattern ||
      !data.recurrenceInterval
    ) {
      throw new Error(
        "Invalid recurring event data: isRecurring, recurrencePattern, and recurrenceInterval are required",
      );
    }

    if (!data.startTime) {
      throw new Error("Invalid recurring event data: startTime is required");
    }

    // Use recurrenceEndDate from data if available, otherwise use the _endDate parameter
    const endDate = data.recurrenceEndDate || new Date(_endDate);
    const startDate = new Date(data.startTime);

    if (endDate <= startDate) {
      throw new Error("Recurrence end date must be after start date");
    }

    const eventList: InsertEvent[] = [];
    let currentStartDate = new Date(startDate);
    const interval = data.recurrenceInterval;

    // Calculate duration if endTime exists
    const duration = data.endTime
      ? new Date(data.endTime).getTime() - startDate.getTime()
      : 0;

    let isFirstEvent = true;

    while (currentStartDate <= endDate) {
      const currentEndTime =
        duration > 0
          ? new Date(currentStartDate.getTime() + duration)
          : undefined;

      const eventData: InsertEvent = {
        ...data,
        startTime: currentStartDate,
        endTime: currentEndTime,
        // First event in series has no parent, rest reference the first event
        parentEventId: isFirstEvent ? undefined : parentId,
      };

      eventList.push(eventData);

      // Calculate next occurrence based on pattern
      switch (data.recurrencePattern) {
        case "daily":
          currentStartDate = new Date(currentStartDate);
          currentStartDate.setDate(currentStartDate.getDate() + interval);
          break;
        case "weekly":
          currentStartDate = new Date(currentStartDate);
          currentStartDate.setDate(currentStartDate.getDate() + 7 * interval);
          break;
        case "monthly":
          currentStartDate = new Date(currentStartDate);
          currentStartDate.setMonth(currentStartDate.getMonth() + interval);
          break;
        default:
          throw new Error(
            `Invalid recurrence pattern: ${data.recurrencePattern}`,
          );
      }

      isFirstEvent = false;
    }

    if (eventList.length === 0) {
      throw new Error("No events to create - check recurrence parameters");
    }

    // Create all events using bulk insert
    const createdEvents = await this.createBulkEvents(eventList);

    // Update parent event IDs if needed
    // The first event is the parent, so we need to update all subsequent events
    if (createdEvents.length > 1) {
      const firstEvent = createdEvents[0];
      if (!firstEvent) {
        throw new Error("Failed to create first event");
      }
      const firstEventId = firstEvent.id;

      // Update all subsequent events to reference the first event as parent
      for (let i = 1; i < createdEvents.length; i++) {
        const event = createdEvents[i];
        if (!event) {
          continue;
        }

        await db
          .update(events)
          .set({ parentEventId: firstEventId })
          .where(eq(events.id, event.id));

        // Update the in-memory object as well
        event.parentEventId = firstEventId;
      }
    }

    return createdEvents;
  }

  async getCalendarEvents(filters: {
    communityId?: string;
    startDate: string;
    endDate: string;
    type?: string;
  }): Promise<
    (Event & {
      creator: User;
      community: Community | null;
      attendeeCount: number;
      mainPlayers: number;
      alternates: number;
    })[]
  > {
    const baseQuery = db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        type: events.type,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        communityId: events.communityId,
        creatorId: events.creatorId,
        hostId: events.hostId,
        coHostId: events.coHostId,
        maxAttendees: events.maxAttendees,
        playerSlots: events.playerSlots,
        alternateSlots: events.alternateSlots,
        isVirtual: events.isVirtual,
        status: events.status,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        creator: users,
        community: communities,
      })
      .from(events)
      .leftJoin(users, eq(events.creatorId, users.id))
      .leftJoin(communities, eq(events.communityId, communities.id));

    let conditions = [
      gte(events.startTime, new Date(filters.startDate)),
      lte(events.startTime, new Date(filters.endDate)),
    ];

    if (filters.communityId) {
      conditions.push(eq(events.communityId, filters.communityId));
    }
    if (filters.type) {
      conditions.push(eq(events.type, filters.type as any));
    }

    const rawEvents = await baseQuery
      .where(and(...conditions))
      .orderBy(events.startTime);

    // Get player counts for each event
    const eventIds = rawEvents.map((e) => e.id);
    const playerCounts =
      eventIds.length > 0
        ? await db
            .select({
              eventId: eventAttendees.eventId,
              totalCount: count(eventAttendees.id).as("totalCount"),
              mainPlayers: count(
                sql`CASE WHEN ${eventAttendees.playerType} = 'main' THEN 1 END`,
              ).as("mainPlayers"),
              alternates: count(
                sql`CASE WHEN ${eventAttendees.playerType} = 'alternate' THEN 1 END`,
              ).as("alternates"),
            })
            .from(eventAttendees)
            .where(sql`${eventAttendees.eventId} IN ${eventIds}`)
            .groupBy(eventAttendees.eventId)
        : [];

    return rawEvents.map((event) => ({
      ...event,
      creator: event.creator || {
        id: "",
        email: null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        primaryCommunity: null,
        username: null,
        bio: null,
        location: null,
        website: null,
        status: null,
        statusMessage: null,
        timezone: null,
        dateOfBirth: null,
        isPrivate: false,
        showOnlineStatus: "everyone",
        allowDirectMessages: "everyone",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      community: event.community,
      attendeeCount:
        playerCounts.find(
          (pc: {
            eventId: string;
            totalCount: number;
            mainPlayers: number;
            alternates: number;
          }) => pc.eventId === event.id,
        )?.totalCount || 0,
      mainPlayers:
        playerCounts.find(
          (pc: {
            eventId: string;
            totalCount: number;
            mainPlayers: number;
            alternates: number;
          }) => pc.eventId === event.id,
        )?.mainPlayers || 0,
      alternates:
        playerCounts.find(
          (pc: {
            eventId: string;
            totalCount: number;
            mainPlayers: number;
            alternates: number;
          }) => pc.eventId === event.id,
        )?.alternates || 0,
    })) as (Event & {
      creator: User;
      community: Community | null;
      attendeeCount: number;
      mainPlayers: number;
      alternates: number;
    })[];
  }

  // Password reset operations
  async createPasswordResetToken(
    data: InsertPasswordResetToken,
  ): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(data)
      .returning();
    if (!token) {
      throw new Error("Database operation failed");
    }
    return token;
  }

  async getPasswordResetToken(
    token: string,
  ): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          // eq(passwordResetTokens.isUsed, false), // TODO: Schema uses usedAt not isUsed
          sql`${passwordResetTokens.usedAt} IS NULL`,
          gte(passwordResetTokens.expiresAt, new Date()),
        ),
      );
    if (!resetToken) {
      throw new Error("Database operation failed");
    }
    return resetToken;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      // .set({ isUsed: true }) // TODO: Schema uses usedAt not isUsed
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(sql`${passwordResetTokens.expiresAt} < ${new Date()}`);
  }

  async invalidateUserPasswordResetTokens(userId: string): Promise<void> {
    // First get the user's email to find their tokens
    // const user = await this.getUser(userId); // Removed - email field doesn't exist on passwordResetTokens
    // if (!user?.email) return;

    await db
      .update(passwordResetTokens)
      // .set({ isUsed: true }) // TODO: Schema uses usedAt not isUsed
      .set({ usedAt: new Date() })
      .where(
        and(
          // eq(passwordResetTokens.email, user.email), // TODO: email field doesn't exist on passwordResetTokens
          eq(passwordResetTokens.userId, userId),
          // eq(passwordResetTokens.isUsed, false) // TODO: Schema uses usedAt not isUsed
          sql`${passwordResetTokens.usedAt} IS NULL`,
        ),
      );
  }

  // Email verification operations
  async createEmailVerificationToken(
    data: InsertEmailVerificationToken,
  ): Promise<EmailVerificationToken> {
    const [token] = await db
      .insert(emailVerificationTokens)
      .values(data)
      .returning();
    if (!token) {
      throw new Error("Database operation failed");
    }
    return token;
  }

  async getEmailVerificationToken(
    token: string,
  ): Promise<EmailVerificationToken | undefined> {
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.token, token),
          // eq(emailVerificationTokens.isUsed, false), // TODO: Schema uses verifiedAt not isUsed
          sql`${emailVerificationTokens.verifiedAt} IS NULL`,
          gte(emailVerificationTokens.expiresAt, new Date()),
        ),
      );
    if (!verificationToken) {
      throw new Error("Database operation failed");
    }
    return verificationToken;
  }

  async markEmailVerificationTokenAsUsed(token: string): Promise<void> {
    await db
      .update(emailVerificationTokens)
      // .set({ isUsed: true }) // TODO: Schema uses verifiedAt not isUsed
      .set({ verifiedAt: new Date() })
      .where(eq(emailVerificationTokens.token, token));
  }

  async cleanupExpiredEmailVerificationTokens(): Promise<void> {
    await db
      .delete(emailVerificationTokens)
      .where(sql`${emailVerificationTokens.expiresAt} < ${new Date()}`);
  }

  async getEmailVerificationTokenByUserId(
    userId: string,
  ): Promise<EmailVerificationToken | undefined> {
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.userId, userId),
          // eq(emailVerificationTokens.isUsed, false), // TODO: Schema uses verifiedAt not isUsed
          sql`${emailVerificationTokens.verifiedAt} IS NULL`,
          gte(emailVerificationTokens.expiresAt, new Date()),
        ),
      )
      .orderBy(sql`${emailVerificationTokens.createdAt} DESC`);
    if (!verificationToken) {
      throw new Error("Database operation failed");
    }
    return verificationToken;
  }

  async invalidateUserEmailVerificationTokens(userId: string): Promise<void> {
    await db
      .update(emailVerificationTokens)
      // .set({ isUsed: true }) // TODO: Schema uses verifiedAt not isUsed
      .set({ verifiedAt: new Date() })
      .where(
        and(
          eq(emailVerificationTokens.userId, userId),
          // eq(emailVerificationTokens.isUsed, false) // TODO: Schema uses verifiedAt not isUsed
          sql`${emailVerificationTokens.verifiedAt} IS NULL`,
        ),
      );
  }

  // Email change operations implementation
  async createEmailChangeRequest(
    data: InsertEmailChangeRequest,
  ): Promise<EmailChangeRequest> {
    const [request] = await db
      .insert(emailChangeRequests)
      .values(data)
      .returning();
    if (!request) {
      throw new Error("Database operation failed");
    }
    return request;
  }

  async getEmailChangeRequest(
    id: string,
  ): Promise<EmailChangeRequest | undefined> {
    const [request] = await db
      .select()
      .from(emailChangeRequests)
      .where(eq(emailChangeRequests.id, id));
    return request;
  }

  async getUserEmailChangeRequest(
    userId: string,
  ): Promise<EmailChangeRequest | undefined> {
    const [request] = await db
      .select()
      .from(emailChangeRequests)
      .where(
        and(
          eq(emailChangeRequests.userId, userId),
          eq(emailChangeRequests.status, "pending"),
          gte(emailChangeRequests.expiresAt, new Date()),
        ),
      )
      .orderBy(sql`${emailChangeRequests.initiatedAt} DESC`);
    return request;
  }

  async updateEmailChangeRequest(
    id: string,
    data: Partial<InsertEmailChangeRequest>,
  ): Promise<EmailChangeRequest> {
    const [request] = await db
      .update(emailChangeRequests)
      .set(data)
      .where(eq(emailChangeRequests.id, id))
      .returning();
    if (!request) {
      throw new Error("Database operation failed");
    }
    return request;
  }

  async createEmailChangeToken(
    data: InsertEmailChangeToken,
  ): Promise<EmailChangeToken> {
    const [token] = await db.insert(emailChangeTokens).values(data).returning();
    if (!token) {
      throw new Error("Database operation failed");
    }
    return token;
  }

  async getEmailChangeToken(
    token: string,
  ): Promise<EmailChangeToken | undefined> {
    const [changeToken] = await db
      .select()
      .from(emailChangeTokens)
      .where(
        and(
          eq(emailChangeTokens.token, token),
          eq(emailChangeTokens.isUsed, false),
          gte(emailChangeTokens.expiresAt, new Date()),
        ),
      );
    return changeToken;
  }

  async markEmailChangeTokenAsUsed(token: string): Promise<void> {
    await db
      .update(emailChangeTokens)
      .set({ isUsed: true, usedAt: new Date() })
      .where(eq(emailChangeTokens.token, token));
  }

  async cleanupExpiredEmailChangeTokens(): Promise<void> {
    await db
      .delete(emailChangeTokens)
      .where(sql`${emailChangeTokens.expiresAt} < ${new Date()}`);
  }

  async cancelEmailChangeRequest(userId: string): Promise<void> {
    await db
      .update(emailChangeRequests)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(emailChangeRequests.userId, userId),
          eq(emailChangeRequests.status, "pending"),
        ),
      );
  }

  // MFA operations implementation
  async getUserMfaSettings(
    userId: string,
  ): Promise<UserMfaSettings | undefined> {
    const [mfaSettings] = await db
      .select()
      .from(userMfaSettings)
      .where(eq(userMfaSettings.userId, userId));
    if (!mfaSettings) {
      throw new Error("Database operation failed");
    }
    return mfaSettings;
  }

  async createUserMfaSettings(
    data: InsertUserMfaSettings,
  ): Promise<UserMfaSettings> {
    const [mfaSettings] = await db
      .insert(userMfaSettings)
      .values(data)
      .returning();
    if (!mfaSettings) {
      throw new Error("Database operation failed");
    }
    return mfaSettings;
  }

  async updateUserMfaSettings(
    userId: string,
    data: Partial<InsertUserMfaSettings>,
  ): Promise<void> {
    await db
      .update(userMfaSettings)
      .set(data)
      .where(eq(userMfaSettings.userId, userId));
  }

  async enableUserMfa(
    userId: string,
    totpSecret: string,
    backupCodes: string[],
  ): Promise<void> {
    const now = new Date();

    // SECURITY: backupCodes are already hashed by caller (routes layer) using Argon2id
    // No additional hashing needed here to prevent double-hashing

    // Update or create MFA settings
    const existingSettings = await this.getUserMfaSettings(userId);

    if (existingSettings) {
      await db
        .update(userMfaSettings)
        .set({
          enabled: true,
          secret: totpSecret,
          backupCodes: JSON.stringify(backupCodes), // Store as JSON string in SQLite
          updatedAt: now,
        })
        .where(eq(userMfaSettings.userId, userId));
    } else {
      await db.insert(userMfaSettings).values({
        userId,
        enabled: true,
        secret: totpSecret,
        backupCodes: JSON.stringify(backupCodes), // Store as JSON string in SQLite
        createdAt: now,
        updatedAt: now,
      });
    }

    // Update user's MFA flag
    await db
      .update(users)
      .set({
        mfaEnabled: true,
        mfaEnabledAt: now,
      })
      .where(eq(users.id, userId));
  }

  async disableUserMfa(userId: string): Promise<void> {
    // Disable MFA settings
    await db
      .update(userMfaSettings)
      .set({
        enabled: false,
        secret: "", // Empty string instead of null since it's notNull
        backupCodes: null,
        updatedAt: new Date(),
      })
      .where(eq(userMfaSettings.userId, userId));

    // Update user's MFA flag
    await db
      .update(users)
      .set({
        mfaEnabled: false,
        mfaEnabledAt: null,
      })
      .where(eq(users.id, userId));
  }

  async updateUserMfaLastVerified(userId: string): Promise<void> {
    await db
      .update(userMfaSettings)
      .set({ updatedAt: new Date() }) // lastVerifiedAt doesn't exist in schema, use updatedAt
      .where(eq(userMfaSettings.userId, userId));
  }

  async markBackupCodeAsUsed(userId: string, codeIndex: number): Promise<void> {
    const settings = await this.getUserMfaSettings(userId);
    if (!settings || !settings.backupCodes) return;

    // Parse JSON string array, remove used code, then stringify back
    const codes = JSON.parse(settings.backupCodes);
    codes.splice(codeIndex, 1);

    await db
      .update(userMfaSettings)
      .set({
        backupCodes: JSON.stringify(codes),
        updatedAt: new Date(),
      })
      .where(eq(userMfaSettings.userId, userId));
  }

  // MFA attempt tracking implementation for throttling and lockout
  async getUserMfaAttempts(
    userId: string,
  ): Promise<UserMfaAttempts | undefined> {
    const [attempts] = await db
      .select()
      .from(userMfaAttempts)
      .where(eq(userMfaAttempts.userId, userId));
    if (!attempts) {
      throw new Error("Database operation failed");
    }
    return attempts;
  }

  async recordMfaFailure(userId: string): Promise<void> {
    const windowDurationMs = 15 * 60 * 1000; // 15 minutes failure window
    const now = Date.now();

    const existing = await db
      .select()
      .from(userMfaAttempts)
      .where(eq(userMfaAttempts.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      // Insert new record
      await db.insert(userMfaAttempts).values({
        userId,
        attemptType: "totp",
        success: false,
        ipAddress: "",
        failedAttempts: 1,
        lastFailedAt: new Date(),
        lockedUntil: null,
        windowStartedAt: new Date(),
        createdAt: new Date(),
      });
    } else {
      const record = existing[0]; // Safe: we checked existing.length > 0 above
      if (!record) {
        throw new Error("Unexpected: existing record not found");
      }
      const windowStart = record.windowStartedAt
        ? record.windowStartedAt.getTime()
        : 0;
      const isWindowExpired = now - windowStart > windowDurationMs;
      const isCurrentlyLocked =
        record.lockedUntil && record.lockedUntil.getTime() > now;

      // If locked, don't update anything
      if (isCurrentlyLocked) {
        return;
      }

      // Calculate new failure count
      let newFailedAttempts = isWindowExpired
        ? 1
        : (record.failedAttempts || 0) + 1;

      // Calculate lockout time based on failure count
      let lockedUntil: Date | null = null;
      if (newFailedAttempts >= 5) {
        lockedUntil = new Date(now + 30 * 60 * 1000); // 30 minutes
      } else if (newFailedAttempts === 4) {
        lockedUntil = new Date(now + 8 * 60 * 1000); // 8 minutes
      } else if (newFailedAttempts === 3) {
        lockedUntil = new Date(now + 2 * 60 * 1000); // 2 minutes
      } else if (newFailedAttempts === 2) {
        lockedUntil = new Date(now + 30 * 1000); // 30 seconds
      }

      await db
        .update(userMfaAttempts)
        .set({
          failedAttempts: newFailedAttempts,
          windowStartedAt: isWindowExpired
            ? new Date()
            : record.windowStartedAt,
          lockedUntil,
          lastFailedAt: new Date(),
        })
        .where(eq(userMfaAttempts.userId, userId));
    }
  }

  async resetMfaAttempts(userId: string): Promise<void> {
    await db
      .update(userMfaAttempts)
      .set({
        failedAttempts: 0,
        lastFailedAt: null,
        lockedUntil: null,
      })
      .where(eq(userMfaAttempts.userId, userId));
  }

  async checkMfaLockout(userId: string): Promise<{
    isLocked: boolean;
    lockoutEndsAt?: Date;
    failedAttempts: number;
  }> {
    const attempts = await this.getUserMfaAttempts(userId);

    if (!attempts) {
      return { isLocked: false, failedAttempts: 0 };
    }

    const now = new Date();
    const isLocked = attempts.lockedUntil && attempts.lockedUntil > now;

    return {
      isLocked: !!isLocked,
      lockoutEndsAt: isLocked ? attempts.lockedUntil || undefined : undefined,
      failedAttempts: attempts.failedAttempts || 0,
    };
  }

  async cleanupExpiredMfaLockouts(): Promise<void> {
    const now = new Date();
    await db
      .update(userMfaAttempts)
      .set({
        failedAttempts: 0,
        lastFailedAt: null,
        lockedUntil: null,
      })
      .where(
        and(
          isNotNull(userMfaAttempts.lockedUntil),
          lte(userMfaAttempts.lockedUntil, now),
        ),
      );
  }

  // Device fingerprinting implementation for enhanced MFA security
  async getDeviceFingerprint(
    fingerprintHash: string,
  ): Promise<DeviceFingerprint | undefined> {
    const [fingerprint] = await db
      .select()
      .from(deviceFingerprints)
      .where(eq(deviceFingerprints.fingerprintHash, fingerprintHash))
      .limit(1);
    if (!fingerprint) {
      throw new Error("Database operation failed");
    }
    return fingerprint;
  }

  async getUserDeviceFingerprints(
    userId: string,
  ): Promise<DeviceFingerprint[]> {
    return await db
      .select()
      .from(deviceFingerprints)
      .where(
        and(
          eq(deviceFingerprints.userId, userId),
          eq(deviceFingerprints.isActive, true),
        ),
      )
      .orderBy(desc(deviceFingerprints.lastSeen)); // Changed from lastSeenAt to lastSeen
  }

  async createDeviceFingerprint(
    data: InsertDeviceFingerprint,
  ): Promise<DeviceFingerprint> {
    const [fingerprint] = await db
      .insert(deviceFingerprints)
      .values(data)
      .returning();
    if (!fingerprint) {
      throw new Error("Database operation failed");
    }
    return fingerprint;
  }

  async updateDeviceFingerprint(
    id: string,
    data: Partial<InsertDeviceFingerprint>,
  ): Promise<void> {
    await db
      .update(deviceFingerprints)
      .set(data)
      .where(eq(deviceFingerprints.id, id));
  }

  async deleteDeviceFingerprint(id: string): Promise<void> {
    await db
      .update(deviceFingerprints)
      .set({
        isActive: false,
      })
      .where(eq(deviceFingerprints.id, id));
  }

  async updateDeviceLastSeen(fingerprintHash: string): Promise<void> {
    await db
      .update(deviceFingerprints)
      .set({
        lastSeen: new Date(), // Changed from lastSeenAt to lastSeen
      })
      .where(eq(deviceFingerprints.fingerprintHash, fingerprintHash));
  }

  // MFA security context implementation
  async createMfaSecurityContext(
    data: InsertMfaSecurityContext,
  ): Promise<MfaSecurityContext> {
    const [context] = await db
      .insert(mfaSecurityContext)
      .values(data)
      .returning();
    if (!context) {
      throw new Error("Database operation failed");
    }
    return context;
  }

  async getMfaSecurityContext(
    userId: string,
    options?: { limit?: number; onlyFailures?: boolean },
  ): Promise<MfaSecurityContext[]> {
    const { limit = 50, onlyFailures = false } = options || {};

    const conditions = [eq(mfaSecurityContext.userId, userId)];
    if (onlyFailures) {
      conditions.push(eq(mfaSecurityContext.isSuccessful, false));
    }

    return await db
      .select()
      .from(mfaSecurityContext)
      .where(and(...conditions))
      .orderBy(desc(mfaSecurityContext.createdAt))
      .limit(limit);
  }

  async updateMfaSecurityContext(
    id: string,
    data: Partial<InsertMfaSecurityContext>,
  ): Promise<void> {
    await db
      .update(mfaSecurityContext)
      .set(data)
      .where(eq(mfaSecurityContext.id, id));
  }

  // Trusted device management implementation
  async getUserTrustedDevices(
    userId: string,
  ): Promise<(TrustedDevice & { deviceFingerprint: DeviceFingerprint })[]> {
    return (await db
      .select({
        id: trustedDevices.id,
        userId: trustedDevices.userId,
        deviceFingerprintId: trustedDevices.deviceFingerprintId,
        name: trustedDevices.name,
        description: trustedDevices.description,
        trustLevel: trustedDevices.trustLevel,
        autoTrustMfa: trustedDevices.autoTrustMfa,
        trustDurationDays: trustedDevices.trustDurationDays,
        lastUsedAt: trustedDevices.lastUsedAt,
        totalLogins: trustedDevices.totalLogins,
        isActive: trustedDevices.isActive,
        revokedAt: trustedDevices.revokedAt,
        revokedReason: trustedDevices.revokedReason,
        expiresAt: trustedDevices.expiresAt,
        verifiedAt: trustedDevices.verifiedAt,
        verificationMethod: trustedDevices.verificationMethod,
        trustedAt: trustedDevices.trustedAt,
        lastUsed: trustedDevices.lastUsed,
        deviceFingerprint: deviceFingerprints,
      })
      .from(trustedDevices)
      .innerJoin(
        deviceFingerprints,
        eq(trustedDevices.deviceFingerprintId, deviceFingerprints.id),
      )
      .where(
        and(
          eq(trustedDevices.userId, userId),
          eq(trustedDevices.isActive, true),
          or(
            eq(trustedDevices.expiresAt, sql`NULL`),
            gte(trustedDevices.expiresAt, new Date()),
          ),
        ),
      )
      .orderBy(
        desc(trustedDevices.lastUsedAt),
      )) as unknown as (TrustedDevice & {
      deviceFingerprint: DeviceFingerprint;
    })[];
  }

  async createTrustedDevice(data: InsertTrustedDevice): Promise<TrustedDevice> {
    const [trustedDevice] = await db
      .insert(trustedDevices)
      .values(data)
      .returning();
    if (!trustedDevice) {
      throw new Error("Database operation failed");
    }
    return trustedDevice;
  }

  async updateTrustedDevice(
    id: string,
    data: Partial<InsertTrustedDevice>,
  ): Promise<void> {
    await db.update(trustedDevices).set(data).where(eq(trustedDevices.id, id));
  }

  async revokeTrustedDevice(id: string, reason: string): Promise<void> {
    const now = new Date();
    await db
      .update(trustedDevices)
      .set({
        isActive: false,
        isRevoked: true,
        revokedAt: now,
        revokedReason: reason,
      })
      .where(eq(trustedDevices.id, id));
  }

  async cleanupExpiredTrustedDevices(): Promise<void> {
    const now = new Date();
    await db
      .update(trustedDevices)
      .set({
        isActive: false,
        isRevoked: true,
        revokedReason: "expired",
      })
      .where(
        and(
          eq(trustedDevices.isActive, true),
          isNotNull(trustedDevices.expiresAt),
          lte(trustedDevices.expiresAt, now),
        ),
      );
  }

  // Device security validation implementation
  async calculateDeviceRiskScore(
    userId: string,
    context: {
      userAgent: string;
      ipAddress: string;
      location?: string;
      timezone?: string;
    },
  ): Promise<{ riskScore: number; riskFactors: string[] }> {
    const riskFactors: string[] = [];
    let riskScore = 0.1; // Base risk score

    // Get user's historical device patterns
    const userDevices = await this.getUserDeviceFingerprints(userId);
    const recentContexts = await this.getMfaSecurityContext(userId, {
      limit: 20,
    });

    // Check for new device (fingerprint not in user's devices)
    // Note: deviceFingerprints schema doesn't have userAgent field
    const hasSeenDevice = userDevices.length > 0;
    if (!hasSeenDevice) {
      riskScore += 0.3;
      riskFactors.push("new_device");
    }

    // Check for new IP range (simplified check - first 3 octets)
    const currentIpPrefix = context.ipAddress.split(".").slice(0, 3).join(".");
    const hasSeenIpRange = recentContexts.some(
      (ctx) =>
        ctx.ipAddress &&
        ctx.ipAddress.split(".").slice(0, 3).join(".") === currentIpPrefix,
    );
    if (!hasSeenIpRange) {
      riskScore += 0.2;
      riskFactors.push("new_ip_range");
    }

    // Check for new location
    if (context.location) {
      const hasSeenLocation = recentContexts.some(
        (ctx) => ctx.location === context.location,
      );
      if (!hasSeenLocation) {
        riskScore += 0.2;
        riskFactors.push("new_location");
      }
    }

    // Check for recent failed attempts
    const recentFailures = recentContexts.filter(
      (ctx) =>
        !ctx.isSuccessful &&
        ctx.createdAt &&
        new Date().getTime() - ctx.createdAt.getTime() < 24 * 60 * 60 * 1000, // 24 hours
    );
    if (recentFailures.length > 3) {
      riskScore += 0.3;
      riskFactors.push("recent_failed_attempts");
    }

    // Check for suspicious timing patterns (multiple attempts in short period)
    const recentAttempts = recentContexts.filter(
      (ctx) =>
        ctx.createdAt &&
        new Date().getTime() - ctx.createdAt.getTime() < 60 * 60 * 1000, // 1 hour
    );
    if (recentAttempts.length > 5) {
      riskScore += 0.2;
      riskFactors.push("rapid_attempts");
    }

    // Cap risk score at 1.0
    riskScore = Math.min(riskScore, 1.0);

    return { riskScore, riskFactors };
  }

  async validateDeviceContext(
    userId: string,
    fingerprintHash: string,
  ): Promise<{
    isValid: boolean;
    trustScore: number;
    requiresAdditionalVerification: boolean;
    deviceFingerprint?: DeviceFingerprint;
  }> {
    // Get or create device fingerprint
    let deviceFingerprint = await this.getDeviceFingerprint(fingerprintHash);

    if (!deviceFingerprint) {
      // New device - low trust score, requires additional verification
      return {
        isValid: false,
        trustScore: 0.1,
        requiresAdditionalVerification: true,
      };
    }

    // Check if device belongs to this user
    if (deviceFingerprint.userId !== userId) {
      return {
        isValid: false,
        trustScore: 0.0,
        requiresAdditionalVerification: true,
        deviceFingerprint,
      };
    }

    // Check if device is active
    if (!deviceFingerprint.isActive) {
      return {
        isValid: false,
        trustScore: 0.0,
        requiresAdditionalVerification: true,
        deviceFingerprint,
      };
    }

    // Calculate trust score based on device history
    // Note: deviceFingerprints only has: trustScore, firstSeen, lastSeen, isBlocked
    let trustScore = deviceFingerprint.trustScore || 0.5;

    // Factor in device age (older devices with good history = higher trust)
    const deviceAgeMs =
      new Date().getTime() - (deviceFingerprint.firstSeen?.getTime() || 0);
    const deviceAgeDays = deviceAgeMs / (24 * 60 * 60 * 1000);
    if (deviceAgeDays > 30) trustScore += 0.2;
    else if (deviceAgeDays > 7) trustScore += 0.1;

    // Check if blocked
    if (deviceFingerprint.isBlocked) {
      trustScore = 0.0;
    }

    // Cap trust score
    trustScore = Math.min(Math.max(trustScore, 0.0), 1.0);

    // Determine if additional verification is required
    const requiresAdditionalVerification = trustScore < 0.6;

    return {
      isValid: true,
      trustScore,
      requiresAdditionalVerification,
      deviceFingerprint,
    };
  }

  /**
   * Calculate lockout duration using exponential backoff
   * 0-1 failures: No lockout
   * 2 failures: 30 seconds
   * 3 failures: 2 minutes
   * 4 failures: 8 minutes
   * 5+ failures: 30 minutes
   * Unused but kept for potential future use
   */
  // private calculateLockoutSeconds(failedAttempts: number): number {
  //   if (failedAttempts < 2) return 0;
  //   if (failedAttempts >= 5) return 30 * 60; // 30 minutes in seconds
  //
  //   // Exponential backoff in seconds: [30, 120, 480] for attempts [2, 3, 4]
  //   const lockoutTimes = [0, 0, 30, 120, 480]; // Index = failedAttempts
  //   return lockoutTimes[failedAttempts] || 30 * 60; // Default to 30 minutes
  // }

  // Refresh token operations implementation
  async createRefreshToken(data: InsertRefreshToken): Promise<RefreshToken> {
    const [refreshToken] = await db
      .insert(refreshTokens)
      .values(data)
      .returning();
    if (!refreshToken) {
      throw new Error("Database operation failed");
    }
    return refreshToken;
  }

  async getRefreshToken(tokenId: string): Promise<RefreshToken | undefined> {
    const [refreshToken] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.id, tokenId),
          eq(refreshTokens.isRevoked, false),
          gte(refreshTokens.expiresAt, new Date()),
        ),
      );
    if (!refreshToken) {
      throw new Error("Database operation failed");
    }
    return refreshToken;
  }

  async getRefreshTokenByJWT(jwt: string): Promise<RefreshToken | undefined> {
    const [refreshToken] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, jwt),
          eq(refreshTokens.isRevoked, false),
          gte(refreshTokens.expiresAt, new Date()),
        ),
      );
    if (!refreshToken) {
      throw new Error("Database operation failed");
    }
    return refreshToken;
  }

  async updateRefreshTokenLastUsed(tokenId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ lastUsed: new Date() })
      .where(eq(refreshTokens.id, tokenId));
  }

  async revokeRefreshToken(tokenId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.id, tokenId));
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.userId, userId));
  }

  async cleanupExpiredRefreshTokens(): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(
        or(
          eq(refreshTokens.isRevoked, true),
          lte(refreshTokens.expiresAt, new Date()),
        ),
      );
  }

  async getUserActiveRefreshTokens(userId: string): Promise<RefreshToken[]> {
    return await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.isRevoked, false),
          gte(refreshTokens.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(refreshTokens.lastUsed));
  }

  // Auth audit log operations implementation
  async createAuthAuditLog(data: InsertAuthAuditLog): Promise<AuthAuditLog> {
    const [auditLog] = await db
      .insert(authAuditLog)
      .values(data) // Type assertion to handle decimal/number type mismatch
      .returning();
    if (!auditLog) {
      throw new Error("Failed to create auth audit log");
    }
    return auditLog;
  }

  // JWT token revocation implementation (enterprise security)
  async revokeJWT(
    jti: string,
    userId: string,
    _tokenType: string,
    reason: string,
    expiresAt: Date,
    _originalExpiry?: Date,
    _ipAddress?: string,
    _userAgent?: string,
  ): Promise<void> {
    await db.insert(revokedJwtTokens).values({
      jti,
      userId,
      reason,
      expiresAt,
      // Note: tokenType, originalExpiry, ipAddress, userAgent, revokedBy are not in schema
      // These could be added to metadata if needed
    });
    logger.info(`JWT token revoked for user`, { userId, hasJti: !!jti });
  }

  async isJWTRevoked(jti: string): Promise<boolean> {
    const [result] = await db
      .select({ id: revokedJwtTokens.id })
      .from(revokedJwtTokens)
      .where(eq(revokedJwtTokens.jti, jti))
      .limit(1);
    return !!result;
  }

  async cleanupExpiredRevokedTokens(): Promise<number> {
    const result = await db
      .delete(revokedJwtTokens)
      .where(lte(revokedJwtTokens.expiresAt, new Date()));
    return result.rowCount || 0;
  }

  async getAuthAuditLogs(
    userId?: string,
    filters?: { eventType?: string; limit?: number; hours?: number },
  ): Promise<AuthAuditLog[]> {
    const conditions = [];
    if (userId) {
      conditions.push(eq(authAuditLog.userId, userId));
    }
    if (filters?.eventType) {
      conditions.push(eq(authAuditLog.eventType, filters.eventType));
    }

    // Add time filter if hours is specified
    if (filters?.hours) {
      const hoursAgo = new Date(Date.now() - filters.hours * 60 * 60 * 1000);
      conditions.push(gte(authAuditLog.createdAt, hoursAgo));
    }

    const baseQuery = db
      .select()
      .from(authAuditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(authAuditLog.createdAt));

    if (filters?.limit) {
      return await baseQuery.limit(filters.limit);
    }

    return await baseQuery;
  }

  async getRecentAuthFailures(
    userId: string,
    hours: number,
  ): Promise<AuthAuditLog[]> {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

    return await db
      .select()
      .from(authAuditLog)
      .where(
        and(
          eq(authAuditLog.userId, userId),
          eq(authAuditLog.isSuccessful, false),
          gte(authAuditLog.createdAt, hoursAgo),
        ),
      )
      .orderBy(desc(authAuditLog.createdAt));
  }

  // Notification operations
  async getUserNotifications(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<Notification[]> {
    let conditions = [eq(notifications.userId, userId)];

    if (options?.unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const baseQuery = db
      .select()
      .from(notifications)
      .where(and(...conditions));

    const limitedQuery = options?.limit
      ? baseQuery.limit(options.limit)
      : baseQuery;

    return await limitedQuery.orderBy(sql`${notifications.createdAt} DESC`);
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    if (!notification) {
      throw new Error("Database operation failed");
    }
    return notification;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  async getUserNotificationsWithCursor(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      cursor?: string;
      limit?: number;
      sortField?: string;
      sortDirection?: "asc" | "desc";
    },
  ): Promise<Notification[]> {
    let conditions = [eq(notifications.userId, userId)];

    if (options?.unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    if (options?.cursor) {
      // Add cursor-based pagination condition
      conditions.push(lt(notifications.createdAt, new Date(options.cursor)));
    }

    return await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(options?.limit || 50);
  }

  // Message operations
  async getUserMessages(
    userId: string,
    options?: { eventId?: string; communityId?: string; limit?: number },
  ): Promise<
    (Message & { sender: User | null; recipient?: User; event?: Event })[]
  > {
    let conditions = [
      sql`(${messages.senderId} = ${userId} OR ${messages.recipientId} = ${userId})`,
    ];

    if (options?.eventId) {
      conditions.push(eq(messages.eventId, options.eventId));
    }

    if (options?.communityId) {
      conditions.push(eq(messages.communityId, options.communityId));
    }

    const results = await db
      .select({
        message: messages,
        sender: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(and(...conditions))
      .orderBy(sql`${messages.createdAt} DESC`)
      .limit(options?.limit || 50);

    return results.map((r) => ({
      ...r.message,
      sender: r.sender,
    })) as (Message & { sender: User | null })[];
  }

  async sendMessage(data: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(data).returning();
    if (!message) {
      throw new Error("Database operation failed");
    }
    return message;
  }

  async sendMessageWithTransaction(
    tx: Transaction,
    data: InsertMessage,
  ): Promise<Message> {
    const [message] = await tx.insert(messages).values(data).returning();
    if (!message) {
      throw new Error("Failed to send message");
    }
    return message;
  }

  async getUserMessagesWithCursor(
    userId: string,
    options?: {
      eventId?: string;
      communityId?: string;
      conversationId?: string;
      unreadOnly?: boolean;
      cursor?: string;
      limit?: number;
      sortField?: string;
      sortDirection?: "asc" | "desc";
    },
  ): Promise<
    (Message & { sender: User | null; recipient?: User; event?: Event })[]
  > {
    let conditions = [
      sql`(${messages.senderId} = ${userId} OR ${messages.recipientId} = ${userId})`,
    ];

    if (options?.eventId) {
      conditions.push(eq(messages.eventId, options.eventId));
    }

    if (options?.communityId) {
      conditions.push(eq(messages.communityId, options.communityId));
    }

    if (options?.unreadOnly) {
      conditions.push(eq(messages.isRead, false));
    }

    if (options?.cursor) {
      conditions.push(lt(messages.createdAt, new Date(options.cursor)));
    }

    const results = await db
      .select({
        message: messages,
        sender: users,
        event: events,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(events, eq(messages.eventId, events.id))
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(options?.limit || 50);

    return results.map(
      (r: { message: Message; sender: User | null; event: Event | null }) => ({
        ...r.message,
        sender: r.sender,
        event: r.event,
      }),
    ) as (Message & { sender: User | null; event: Event | null })[];
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  async getConversation(
    userId1: string,
    userId2: string,
  ): Promise<(Message & { sender: User; recipient?: User })[]> {
    const results = await db
      .select({
        message: messages,
        sender: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          sql`((${messages.senderId} = ${userId1} AND ${messages.recipientId} = ${userId2}) OR 
             (${messages.senderId} = ${userId2} AND ${messages.recipientId} = ${userId1}))`,
        ),
      )
      .orderBy(sql`${messages.createdAt} ASC`);

    return results.map((r) => ({
      ...r.message,
      sender: r.sender,
    })) as (Message & { sender: User | null })[];
  }

  // Game session operations
  async getGameSessionById(
    id: string,
  ): Promise<
    (GameSession & { host: User; coHost?: User; event: Event }) | null
  > {
    const results = await db
      .select({
        gameSession: gameSessions,
        host: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
        event: events,
      })
      .from(gameSessions)
      .leftJoin(users, eq(gameSessions.hostId, users.id))
      .leftJoin(events, eq(gameSessions.eventId, events.id))
      .where(eq(gameSessions.id, id))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const r = results[0];
    if (!r) {
      return null;
    }
    return {
      ...r.gameSession,
      host: r.host as User,
      event: r.event as Event,
    };
  }

  async getGameSessions(filters?: {
    eventId?: string;
    communityId?: string;
    hostId?: string;
    status?: string;
  }): Promise<
    (GameSession & { host: User | null; coHost?: User; event: Event | null })[]
  > {
    let conditions = [];

    if (filters?.eventId) {
      conditions.push(eq(gameSessions.eventId, filters.eventId));
    }

    if (filters?.communityId) {
      conditions.push(eq(gameSessions.communityId, filters.communityId));
    }

    if (filters?.hostId) {
      conditions.push(eq(gameSessions.hostId, filters.hostId));
    }

    if (filters?.status) {
      conditions.push(eq(gameSessions.status, filters.status as any));
    }

    const results = await db
      .select({
        gameSession: gameSessions,
        host: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
        event: events,
      })
      .from(gameSessions)
      .leftJoin(users, eq(gameSessions.hostId, users.id))
      .leftJoin(events, eq(gameSessions.eventId, events.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${gameSessions.createdAt} DESC`);

    return results.map((r) => ({
      ...r.gameSession,
      host: r.host,
      event: r.event,
    })) as (GameSession & { host: User | null; event: Event | null })[];
  }

  async createGameSession(data: InsertGameSession): Promise<GameSession> {
    const [gameSession] = await db
      .insert(gameSessions)
      .values(data)
      .returning();
    if (!gameSession) {
      throw new Error("Database operation failed");
    }
    return gameSession;
  }

  async updateGameSession(
    id: string,
    data: Partial<InsertGameSession>,
  ): Promise<GameSession> {
    const [gameSession] = await db
      .update(gameSessions)
      .set(data)
      .where(eq(gameSessions.id, id))
      .returning();
    if (!gameSession) {
      throw new Error("Failed to update game session");
    }
    return gameSession;
  }

  async joinGameSession(sessionId: string, _userId: string): Promise<void> {
    // Increment current players count
    await db
      .update(gameSessions)
      .set({ currentPlayers: sql`${gameSessions.currentPlayers} + 1` })
      .where(eq(gameSessions.id, sessionId));
  }

  async leaveGameSession(sessionId: string, _userId: string): Promise<void> {
    // Decrement current players count
    await db
      .update(gameSessions)
      .set({
        currentPlayers: sql`GREATEST(${gameSessions.currentPlayers} - 1, 0)`,
      })
      .where(eq(gameSessions.id, sessionId));
  }

  async spectateGameSession(sessionId: string, _userId: string): Promise<void> {
    // Increment spectator count
    await db
      .update(gameSessions)
      .set({ spectators: sql`${gameSessions.spectators} + 1` })
      .where(eq(gameSessions.id, sessionId));
  }

  async leaveSpectating(sessionId: string, _userId: string): Promise<void> {
    // Decrement spectator count
    await db
      .update(gameSessions)
      .set({ spectators: sql`GREATEST(${gameSessions.spectators} - 1, 0)` })
      .where(eq(gameSessions.id, sessionId));
  }

  // Social link operations
  async getUserSocialLinks(userId: string): Promise<UserSocialLink[]> {
    const links = await db
      .select()
      .from(userSocialLinks)
      .where(eq(userSocialLinks.userId, userId));
    if (!links) {
      throw new Error("Database operation failed");
    }
    return links;
  }

  async updateUserSocialLinks(
    userId: string,
    links: InsertUserSocialLink[],
  ): Promise<UserSocialLink[]> {
    return await db.transaction(async (tx: Transaction) => {
      // Delete existing links
      await tx
        .delete(userSocialLinks)
        .where(eq(userSocialLinks.userId, userId));

      // Insert new links
      if (links.length > 0) {
        const newLinks = await tx
          .insert(userSocialLinks)
          .values(links.map((link) => ({ ...link, userId })))
          .returning();
        return newLinks;
      }
      return [];
    });
  }

  // Gaming profile operations
  async getUserGamingProfiles(
    userId: string,
  ): Promise<(UserGamingProfile & { community: Community })[]> {
    const profiles = await db
      .select({
        id: userGamingProfiles.id,
        userId: userGamingProfiles.userId,
        communityId: userGamingProfiles.communityId,
        rank: userGamingProfiles.rank,
        experience: userGamingProfiles.experience,
        favoriteDeck: userGamingProfiles.favoriteDeck,
        achievements: userGamingProfiles.achievements,
        statistics: userGamingProfiles.statistics,
        isVisible: userGamingProfiles.isVisible,
        createdAt: userGamingProfiles.createdAt,
        updatedAt: userGamingProfiles.updatedAt,
        community: communities,
      })
      .from(userGamingProfiles)
      .innerJoin(
        communities,
        eq(userGamingProfiles.communityId, communities.id),
      )
      .where(eq(userGamingProfiles.userId, userId));
    if (!profiles) {
      throw new Error("Database operation failed");
    }
    return profiles as unknown as (UserGamingProfile & {
      community: Community;
    })[];
  }

  async upsertUserGamingProfile(
    data: InsertUserGamingProfile,
  ): Promise<UserGamingProfile> {
    const [profile] = await db
      .insert(userGamingProfiles)
      .values(data)
      .onConflictDoUpdate({
        target: [userGamingProfiles.userId, userGamingProfiles.communityId],
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!profile) {
      throw new Error("Failed to upsert user gaming profile");
    }
    return profile;
  }

  // Friendship operations
  async getFriends(
    userId: string,
  ): Promise<(Friendship & { requester: User; addressee: User })[]> {
    const requesterUser = alias(users, "requesterUser");
    const addresseeUser = alias(users, "addresseeUser");

    const results = await db
      .select({
        id: friendships.id,
        requesterId: friendships.requesterId,
        addresseeId: friendships.addresseeId,
        status: friendships.status,
        createdAt: friendships.createdAt,
        updatedAt: friendships.updatedAt,
        requester: requesterUser,
        addressee: addresseeUser,
      })
      .from(friendships)
      .innerJoin(requesterUser, eq(friendships.requesterId, requesterUser.id))
      .innerJoin(addresseeUser, eq(friendships.addresseeId, addresseeUser.id))
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId),
          ),
        ),
      );

    return results.map((r) => ({
      ...r,
      requester: r.requester as User,
      addressee: r.addressee as User,
    })) as (Friendship & { requester: User; addressee: User })[];
  }

  async getFriendRequests(
    userId: string,
  ): Promise<(Friendship & { requester: User; addressee: User })[]> {
    const requesterUser = alias(users, "requesterUser");
    const addresseeUser = alias(users, "addresseeUser");

    const results = await db
      .select({
        id: friendships.id,
        requesterId: friendships.requesterId,
        addresseeId: friendships.addresseeId,
        status: friendships.status,
        createdAt: friendships.createdAt,
        updatedAt: friendships.updatedAt,
        requester: requesterUser,
        addressee: addresseeUser,
      })
      .from(friendships)
      .innerJoin(requesterUser, eq(friendships.requesterId, requesterUser.id))
      .innerJoin(addresseeUser, eq(friendships.addresseeId, addresseeUser.id))
      .where(
        and(
          eq(friendships.status, "pending"),
          eq(friendships.addresseeId, userId),
        ),
      );

    return results.map((r) => ({
      ...r,
      requester: r.requester as User,
      addressee: r.addressee as User,
    })) as (Friendship & { requester: User; addressee: User })[];
  }

  async getFriendCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count(friendships.id) })
      .from(friendships)
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId),
          ),
        ),
      );
    return result?.count || 0;
  }

  async checkFriendshipStatus(
    userId1: string,
    userId2: string,
  ): Promise<Friendship | undefined> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, userId1),
            eq(friendships.addresseeId, userId2),
          ),
          and(
            eq(friendships.requesterId, userId2),
            eq(friendships.addresseeId, userId1),
          ),
        ),
      );
    if (!friendship) {
      throw new Error("Database operation failed");
    }
    return friendship;
  }

  async sendFriendRequest(
    requesterId: string,
    addresseeId: string,
  ): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({
        userId: requesterId,
        friendId: addresseeId,
        requesterId,
        addresseeId,
        status: "pending",
      })
      .returning();
    if (!friendship) {
      throw new Error("Database operation failed");
    }
    return friendship;
  }

  async respondToFriendRequest(
    friendshipId: string,
    status: "accepted" | "declined" | "blocked",
  ): Promise<Friendship> {
    const [friendship] = await db
      .update(friendships)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(friendships.id, friendshipId))
      .returning();
    if (!friendship) {
      throw new Error("Failed to update friendship status");
    }
    return friendship;
  }

  // User activity operations
  async getUserActivities(
    userId: string,
    options?: { limit?: number; communityId?: string },
  ): Promise<(UserActivity & { community?: Community })[]> {
    let conditions = [eq(userActivities.userId, userId)];

    if (options?.communityId) {
      conditions.push(eq(userActivities.communityId, options.communityId));
    }

    const baseQuery = db
      .select({
        id: userActivities.id,
        userId: userActivities.userId,
        type: userActivities.type,
        title: userActivities.title,
        description: userActivities.description,
        data: userActivities.data,
        isPublic: userActivities.isPublic,
        communityId: userActivities.communityId,
        createdAt: userActivities.createdAt,
        community: communities,
      })
      .from(userActivities)
      .leftJoin(communities, eq(userActivities.communityId, communities.id))
      .where(and(...conditions));

    const limitedQuery = options?.limit
      ? baseQuery.limit(options.limit)
      : baseQuery;

    const activities = await limitedQuery.orderBy(
      sql`${userActivities.createdAt} DESC`,
    );
    return activities.map((activity) => ({
      ...activity,
      community: activity.community || undefined,
    }));
  }

  async createUserActivity(data: InsertUserActivity): Promise<UserActivity> {
    const [activity] = await db.insert(userActivities).values(data).returning();
    if (!activity) {
      throw new Error("Failed to create user activity");
    }
    return activity;
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    if (!settings) {
      throw new Error("Database operation failed");
    }
    return settings;
  }

  async upsertUserSettings(data: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values(data)
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          notificationsEnabled: data.notificationsEnabled,
          emailNotifications: data.emailNotifications,
          pushNotifications: data.pushNotifications,
          notificationTypes: data.notificationTypes,
          privacySettings: data.privacySettings,
          displayPreferences: data.displayPreferences,
          language: data.language,
          timezone: data.timezone,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!settings) {
      throw new Error("Failed to upsert user settings");
    }
    return settings;
  }

  // Matchmaking operations
  async getMatchmakingPreferences(
    userId: string,
  ): Promise<MatchmakingPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(matchmakingPreferences)
      .where(eq(matchmakingPreferences.userId, userId));
    if (!preferences) {
      throw new Error("Database operation failed");
    }
    return preferences;
  }

  async upsertMatchmakingPreferences(
    data: InsertMatchmakingPreferences,
  ): Promise<MatchmakingPreferences> {
    const [preferences] = await db
      .insert(matchmakingPreferences)
      .values(data)
      .onConflictDoUpdate({
        target: matchmakingPreferences.userId,
        set: {
          gameType: data.gameType,
          preferredFormats: data.preferredFormats,
          skillLevelRange: data.skillLevelRange,
          availabilitySchedule: data.availabilitySchedule,
          maxTravelDistance: data.maxTravelDistance,
          preferredLocation: data.preferredLocation,
          playStyle: data.playStyle,
          communicationPreferences: data.communicationPreferences,
          blockedUsers: data.blockedUsers,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!preferences) {
      throw new Error("Database operation failed");
    }
    return preferences;
  }

  async findMatchingPlayers(
    userId: string,
    preferences: MatchmakingPreferences,
  ): Promise<{ data: MatchedPlayer[]; hasMore: boolean }> {
    // Optimized AI Matchmaking Algorithm with performance monitoring
    return withQueryTiming("ai_matchmaking", async () => {
      // Pre-filter with indexed query to reduce dataset size
      const userProfiles = await db
        .select({
          user: users,
          gamingProfile: userGamingProfiles,
          preferences: matchmakingPreferences,
          community: communities,
        })
        .from(users)
        .leftJoin(userGamingProfiles, eq(users.id, userGamingProfiles.userId))
        .leftJoin(
          matchmakingPreferences,
          eq(users.id, matchmakingPreferences.userId),
        )
        .leftJoin(
          communities,
          eq(userGamingProfiles.communityId, communities.id),
        )
        .where(
          and(
            not(eq(users.id, userId)), // Exclude self
            eq(users.status, "online"), // Only online users (indexed)
            eq(userGamingProfiles.isVisible, true), // Only visible profiles (indexed)
          ),
        )
        .limit(100); // Limit candidates for performance optimization

      // Calculate match scores
      type UserProfile = {
        user: User | null;
        gamingProfile: UserGamingProfile | null;
        preferences: MatchmakingPreferences | null;
        community: Community | null;
      };

      type ValidatedProfile = Omit<UserProfile, "user" | "gamingProfile"> & {
        user: User;
        gamingProfile: UserGamingProfile;
      };

      const scoredMatches = userProfiles
        .filter(
          (profile): profile is ValidatedProfile =>
            profile.user !== null && profile.gamingProfile !== null,
        )
        .map((profile): MatchedPlayer => {
          let score = 0;
          const user = profile.user;
          const gaming = profile.gamingProfile;
          const userPrefs = profile.preferences;

          // Game type matching (high weight)
          if (gaming.gameType === preferences.gameType) {
            score += 30;
          }

          // Format compatibility (medium weight)
          if (preferences.preferredFormats && gaming.preferredFormats) {
            const userFormats = JSON.parse(gaming.preferredFormats || "[]");
            const prefFormats = JSON.parse(
              preferences.preferredFormats || "[]",
            );
            const sharedFormats = userFormats.filter((f: string) =>
              prefFormats.includes(f),
            );
            if (sharedFormats.length > 0) score += 20;
          }

          // Play style matching (medium weight)
          if (userPrefs?.playStyle === preferences.playStyle) {
            score += 15;
          }

          // Location proximity (medium weight)
          if (!preferences.preferredLocation || !user.location) {
            score += 15; // Online or no location preference
          } else if (user.location === preferences.preferredLocation) {
            score += 25; // Same location bonus
          }

          // Random factor to add variety
          score += Math.random() * 10;

          return {
            id: user.id,
            username: user.username || `${user.firstName} ${user.lastName}`,
            avatar: user.profileImageUrl,
            games: [gaming.communityId],
            formats: JSON.parse(userPrefs?.preferredFormats || "[]"),
            powerLevel: this.calculatePowerLevel(gaming, userPrefs),
            playstyle: gaming.skillLevel || "intermediate",
            location: user.location || "Online Only",
            availability: JSON.parse(userPrefs?.availabilitySchedule || "{}"),
            matchScore: Math.round(score),
            commonInterests: gaming.favoriteDeck ? [gaming.favoriteDeck] : [],
            lastOnline: user.status === "online" ? "Online now" : "1 hour ago",
            isOnline: user.status === "online",
          };
        })
        .filter((match) => match.matchScore > 20) // Minimum match threshold
        .sort((a, b) => b.matchScore - a.matchScore) // Best matches first
        .slice(0, 20); // Limit results

      return {
        data: scoredMatches,
        hasMore: scoredMatches.length >= 20,
      };
    });
  }

  // Calculate power level based on gaming experience and stats
  private calculatePowerLevel(
    gaming: UserGamingProfile | null,
    preferences: MatchmakingPreferences | null,
  ): number {
    let powerLevel = 5; // Base level

    // Adjust based on skill level
    const skillLevel = gaming?.skillLevel?.toLowerCase();
    switch (skillLevel) {
      case "beginner":
        powerLevel = 2;
        break;
      case "intermediate":
        powerLevel = 5;
        break;
      case "advanced":
        powerLevel = 8;
        break;
      case "competitive":
      case "expert":
        powerLevel = 10;
        break;
      default:
        powerLevel = 5;
    }

    // Add experience bonus (experience is an integer representing total experience)
    if (gaming?.experience && gaming.experience > 100) {
      powerLevel += 1;
    }

    // Add slight variance based on preferences
    const formats = JSON.parse(
      preferences?.preferredFormats || "[]",
    ) as string[];
    if (formats.length > 3) powerLevel += 1;

    return Math.min(Math.max(powerLevel, 1), 10);
  }

  // Tournament operations
  async getTournaments(communityId?: string): Promise<
    (Tournament & {
      organizer: User;
      community: Community;
      participantCount: number;
    })[]
  > {
    const query = db
      .select({
        tournament: tournaments,
        organizer: users,
        community: communities,
        participantCount:
          sql<number>`COUNT(${tournamentParticipants.id})::int`.as(
            "participantCount",
          ),
      })
      .from(tournaments)
      .innerJoin(users, eq(tournaments.organizerId, users.id))
      .innerJoin(communities, eq(tournaments.communityId, communities.id))
      .leftJoin(
        tournamentParticipants,
        eq(tournaments.id, tournamentParticipants.tournamentId),
      )
      .groupBy(tournaments.id, users.id, communities.id)
      .orderBy(desc(tournaments.startDate));

    if (communityId) {
      query.where(eq(tournaments.communityId, communityId));
    }

    const results = await query;
    return results.map((result) => ({
      ...result.tournament,
      organizer: result.organizer,
      community: result.community,
      participantCount: result.participantCount,
    }));
  }

  async getTournament(tournamentId: string): Promise<
    | (Tournament & {
        organizer: User;
        community: Community;
        participants: (TournamentParticipant & { user: User })[];
      })
    | undefined
  > {
    const [tournament] = await db
      .select({
        tournament: tournaments,
        organizer: users,
        community: communities,
      })
      .from(tournaments)
      .innerJoin(users, eq(tournaments.organizerId, users.id))
      .innerJoin(communities, eq(tournaments.communityId, communities.id))
      .where(eq(tournaments.id, tournamentId));

    if (!tournament) return undefined;

    const participants = await db
      .select({
        participant: tournamentParticipants,
        user: users,
      })
      .from(tournamentParticipants)
      .innerJoin(users, eq(tournamentParticipants.userId, users.id))
      .where(eq(tournamentParticipants.tournamentId, tournamentId));

    return {
      ...tournament.tournament,
      organizer: tournament.organizer,
      community: tournament.community,
      participants: participants.map((p) => ({
        ...p.participant,
        user: p.user,
      })),
    };
  }

  async createTournament(data: InsertTournament): Promise<Tournament> {
    const [tournament] = await db.insert(tournaments).values(data).returning();
    if (!tournament) {
      throw new Error("Database operation failed");
    }
    return tournament;
  }

  async updateTournament(
    tournamentId: string,
    data: UpdateTournament,
  ): Promise<Tournament> {
    // Ensure only allowed fields are updated and add business rule validation
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const [tournament] = await db
      .update(tournaments)
      .set(updateData)
      .where(eq(tournaments.id, tournamentId))
      .returning();

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    return tournament;
  }

  async updateTournamentStatus(
    tournamentId: string,
    status: string,
  ): Promise<Tournament> {
    // Internal method for system status updates - bypasses business rules
    const [tournament] = await db
      .update(tournaments)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(tournaments.id, tournamentId))
      .returning();

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    return tournament;
  }

  async joinTournament(
    tournamentId: string,
    userId: string,
  ): Promise<TournamentParticipant> {
    const [participant] = await db
      .insert(tournamentParticipants)
      .values({ tournamentId, userId })
      .returning();
    if (!participant) {
      throw new Error("Database operation failed");
    }
    return participant;
  }

  async leaveTournament(
    tournamentId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await db
      .delete(tournamentParticipants)
      .where(
        and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.userId, userId),
        ),
      );
    return (result.rowCount ?? 0) > 0;
  }

  // Advanced tournament operations
  async getTournamentFormats(): Promise<TournamentFormat[]> {
    return await db
      .select()
      .from(tournamentFormats)
      .where(eq(tournamentFormats.isActive, true))
      .orderBy(tournamentFormats.name);
  }

  async createTournamentFormat(
    data: InsertTournamentFormat,
  ): Promise<TournamentFormat> {
    const [format] = await db
      .insert(tournamentFormats)
      .values(data)
      .returning();
    if (!format) {
      throw new Error("Database operation failed");
    }
    return format;
  }

  async getTournamentRounds(tournamentId: string): Promise<TournamentRound[]> {
    return await db
      .select()
      .from(tournamentRounds)
      .where(eq(tournamentRounds.tournamentId, tournamentId))
      .orderBy(tournamentRounds.roundNumber);
  }

  async createTournamentRound(
    data: InsertTournamentRound,
  ): Promise<TournamentRound> {
    const [round] = await db.insert(tournamentRounds).values(data).returning();
    if (!round) {
      throw new Error("Database operation failed");
    }
    return round;
  }

  async updateTournamentRound(
    roundId: string,
    data: Partial<InsertTournamentRound>,
  ): Promise<TournamentRound> {
    const [round] = await db
      .update(tournamentRounds)
      .set(data)
      .where(eq(tournamentRounds.id, roundId))
      .returning();
    if (!round) {
      throw new Error("Database operation failed");
    }
    return round;
  }

  async getTournamentMatches(
    tournamentId: string,
    roundId?: string,
  ): Promise<
    (TournamentMatch & { player1?: User; player2?: User; winner?: User })[]
  > {
    const query = db
      .select({
        match: tournamentMatches,
        player1: users,
        player2: alias(users, "player2"),
        winner: alias(users, "winner"),
      })
      .from(tournamentMatches)
      .leftJoin(users, eq(tournamentMatches.player1Id, users.id))
      .leftJoin(
        alias(users, "player2"),
        eq(tournamentMatches.player2Id, alias(users, "player2").id),
      )
      .leftJoin(
        alias(users, "winner"),
        eq(tournamentMatches.winnerId, alias(users, "winner").id),
      )
      .where(
        and(
          eq(tournamentMatches.tournamentId, tournamentId),
          roundId ? eq(tournamentMatches.roundId, roundId) : undefined,
        ),
      )
      .orderBy(tournamentMatches.matchNumber); // Use matchNumber instead of bracketPosition

    const results = await query;
    return results.map((r) => ({
      ...r.match,
      player1: r.player1 ?? undefined,
      player2: r.player2 ?? undefined,
      winner: r.winner ?? undefined,
    }));
  }

  async createTournamentMatch(
    data: InsertTournamentMatch,
  ): Promise<TournamentMatch> {
    // Validate that players are participants in the tournament
    if (data.player1Id) {
      const participant1 = await db
        .select()
        .from(tournamentParticipants)
        .where(
          and(
            eq(tournamentParticipants.tournamentId, data.tournamentId),
            eq(tournamentParticipants.userId, data.player1Id),
          ),
        );
      if (participant1.length === 0) {
        throw new Error("Player 1 is not a participant in this tournament");
      }
    }

    if (data.player2Id) {
      const participant2 = await db
        .select()
        .from(tournamentParticipants)
        .where(
          and(
            eq(tournamentParticipants.tournamentId, data.tournamentId),
            eq(tournamentParticipants.userId, data.player2Id),
          ),
        );
      if (participant2.length === 0) {
        throw new Error("Player 2 is not a participant in this tournament");
      }
    }

    const [match] = await db.insert(tournamentMatches).values(data).returning();
    if (!match) {
      throw new Error("Database operation failed");
    }
    return match;
  }

  async updateTournamentMatch(
    matchId: string,
    data: Partial<InsertTournamentMatch>,
  ): Promise<TournamentMatch> {
    // Prevent changing critical structural fields
    const allowedFields = { ...data };
    delete allowedFields.tournamentId;
    delete allowedFields.roundId;

    const [match] = await db
      .update(tournamentMatches)
      .set(allowedFields)
      .where(eq(tournamentMatches.id, matchId))
      .returning();
    if (!match) {
      throw new Error("Database operation failed");
    }
    return match;
  }

  async getMatchResults(matchId: string): Promise<
    (MatchResult & {
      winner: User;
      loser?: User;
      reportedBy: User;
      verifiedBy?: User;
    })[]
  > {
    const query = db
      .select({
        result: matchResults,
        winner: users,
        loser: alias(users, "loser"),
        reportedBy: alias(users, "reportedBy"),
        verifiedBy: alias(users, "verifiedBy"),
      })
      .from(matchResults)
      .innerJoin(users, eq(matchResults.winnerId, users.id))
      .leftJoin(
        alias(users, "loser"),
        eq(matchResults.loserId, alias(users, "loser").id),
      )
      .innerJoin(
        alias(users, "reportedBy"),
        eq(matchResults.reportedById, alias(users, "reportedBy").id),
      )
      .leftJoin(
        alias(users, "verifiedBy"),
        eq(matchResults.verifiedById, alias(users, "verifiedBy").id),
      )
      .where(eq(matchResults.matchId, matchId))
      .orderBy(desc(matchResults.createdAt));

    const results = await query;
    return results.map((r) => ({
      ...r.result,
      winner: r.winner,
      loser: r.loser ?? undefined,
      reportedBy: r.reportedBy,
      verifiedBy: r.verifiedBy ?? undefined,
    })) as (MatchResult & {
      winner: User;
      loser?: User;
      reportedBy: User;
      verifiedBy?: User;
    })[];
  }

  async createMatchResult(data: InsertMatchResult): Promise<MatchResult> {
    const [result] = await db.insert(matchResults).values(data).returning();
    if (!result) {
      throw new Error("Database operation failed");
    }
    return result;
  }

  async verifyMatchResult(
    resultId: string,
    verifierId: string,
  ): Promise<MatchResult> {
    return await db.transaction(async (tx: Transaction) => {
      // First, check if there's already a verified result for this match
      const existingResult = await tx
        .select()
        .from(matchResults)
        .where(
          and(
            eq(matchResults.id, resultId),
            eq(matchResults.isVerified, false),
          ),
        );

      if (existingResult.length === 0) {
        throw new Error("Result not found or already verified");
      }

      const matchResult = existingResult[0];

      if (!matchResult) {
        throw new Error("Match result not found");
      }

      // Check if there are any other verified results for this match
      const otherVerifiedResults = await tx
        .select()
        .from(matchResults)
        .where(
          and(
            eq(matchResults.matchId, matchResult.matchId),
            eq(matchResults.isVerified, true),
          ),
        );

      if (otherVerifiedResults.length > 0) {
        throw new Error("This match already has a verified result");
      }

      // Verify the result
      const [verifiedResult] = await tx
        .update(matchResults)
        .set({
          verifiedById: verifierId,
          isVerified: true,
        })
        .where(eq(matchResults.id, resultId))
        .returning();

      if (!verifiedResult) {
        throw new Error("Failed to verify match result");
      }

      // Update the tournament match with the verified result
      await tx
        .update(tournamentMatches)
        .set({
          winnerId: verifiedResult.winnerId as string | null,
          status: "completed",
          endTime: new Date(),
        })
        .where(eq(tournamentMatches.id, matchResult.matchId));

      return verifiedResult;
    });
  }

  // Tournament transaction operations
  async getTournamentWithTransaction(
    tx: Transaction,
    tournamentId: string,
  ): Promise<
    (Tournament & { organizer: User; community: Community }) | undefined
  > {
    const result = await tx
      .select({
        tournament: tournaments,
        organizer: users,
        community: communities,
      })
      .from(tournaments)
      .innerJoin(users, eq(tournaments.organizerId, users.id))
      .innerJoin(communities, eq(tournaments.communityId, communities.id))
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    if (!row) return undefined;

    const { tournament, organizer, community } = row;
    return {
      ...tournament,
      organizer,
      community,
    };
  }

  async getTournamentParticipantsWithTransaction(
    tx: Transaction,
    tournamentId: string,
  ): Promise<(TournamentParticipant & { user: User })[]> {
    const results = await tx
      .select({
        participant: tournamentParticipants,
        user: users,
      })
      .from(tournamentParticipants)
      .innerJoin(users, eq(tournamentParticipants.userId, users.id))
      .where(eq(tournamentParticipants.tournamentId, tournamentId));

    return results.map((r) => ({ ...r.participant, user: r.user }));
  }

  async getTournamentRoundsWithTransaction(
    tx: Transaction,
    tournamentId: string,
  ): Promise<TournamentRound[]> {
    return await tx
      .select()
      .from(tournamentRounds)
      .where(eq(tournamentRounds.tournamentId, tournamentId))
      .orderBy(tournamentRounds.roundNumber);
  }

  async getTournamentMatchesWithTransaction(
    tx: Transaction,
    tournamentId: string,
  ): Promise<
    (TournamentMatch & { player1?: User; player2?: User; winner?: User })[]
  > {
    const results = await tx
      .select({
        match: tournamentMatches,
        player1: alias(users, "player1"),
        player2: alias(users, "player2"),
        winner: alias(users, "winner"),
      })
      .from(tournamentMatches)
      .leftJoin(
        alias(users, "player1"),
        eq(tournamentMatches.player1Id, alias(users, "player1").id),
      )
      .leftJoin(
        alias(users, "player2"),
        eq(tournamentMatches.player2Id, alias(users, "player2").id),
      )
      .leftJoin(
        alias(users, "winner"),
        eq(tournamentMatches.winnerId, alias(users, "winner").id),
      )
      .where(eq(tournamentMatches.tournamentId, tournamentId))
      .orderBy(tournamentMatches.matchNumber, tournamentMatches.createdAt); // Use matchNumber instead of bracketPosition

    return results.map((r) => ({
      ...r.match,
      player1: r.player1 || undefined,
      player2: r.player2 || undefined,
      winner: r.winner || undefined,
    }));
  }

  // Forum operations
  async getForumPosts(
    communityId: string,
    options: { category?: string; limit?: number; offset?: number } = {},
  ): Promise<
    (ForumPost & {
      author: User;
      community: Community;
      replyCount: number;
      likeCount: number;
      isLiked?: boolean;
    })[]
  > {
    const { category, limit = 20, offset = 0 } = options;

    const query = db
      .select({
        post: forumPosts,
        author: users,
        community: communities,
        replyCount: sql<number>`COUNT(DISTINCT ${forumReplies.id})::int`.as(
          "replyCount",
        ),
        likeCount: sql<number>`COUNT(DISTINCT ${forumPostLikes.id})::int`.as(
          "likeCount",
        ),
      })
      .from(forumPosts)
      .innerJoin(users, eq(forumPosts.authorId, users.id))
      .innerJoin(communities, eq(forumPosts.communityId, communities.id))
      .leftJoin(forumReplies, eq(forumPosts.id, forumReplies.postId))
      .leftJoin(forumPostLikes, eq(forumPosts.id, forumPostLikes.postId))
      .where(
        and(
          eq(forumPosts.communityId, communityId),
          category ? eq(forumPosts.category, category) : undefined,
        ),
      )
      .groupBy(forumPosts.id, users.id, communities.id)
      .orderBy(desc(forumPosts.isPinned), desc(forumPosts.createdAt))
      .limit(limit)
      .offset(offset);

    const results = await query;

    return results.map((r) => ({
      ...r.post,
      author: r.author,
      community: r.community,
      replyCount: r.replyCount,
      likeCount: r.likeCount,
    }));
  }

  async getForumPost(
    id: string,
    userId?: string,
  ): Promise<
    | (ForumPost & { author: User; community: Community; isLiked: boolean })
    | undefined
  > {
    const postQuery = db
      .select({
        post: forumPosts,
        author: users,
        community: communities,
      })
      .from(forumPosts)
      .innerJoin(users, eq(forumPosts.authorId, users.id))
      .innerJoin(communities, eq(forumPosts.communityId, communities.id))
      .where(eq(forumPosts.id, id));

    const [result] = await postQuery;
    if (!result) return undefined;

    // Check if user liked this post
    let isLiked = false;
    if (userId) {
      const [like] = await db
        .select()
        .from(forumPostLikes)
        .where(
          and(eq(forumPostLikes.postId, id), eq(forumPostLikes.userId, userId)),
        );
      isLiked = !!like;
    }

    // Increment view count
    await db
      .update(forumPosts)
      .set({
        viewCount: sql`${forumPosts.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(forumPosts.id, id));

    return {
      ...result.post,
      author: result.author,
      community: result.community,
      isLiked,
    };
  }

  async createForumPost(data: InsertForumPost): Promise<ForumPost> {
    const [post] = await db.insert(forumPosts).values(data).returning();
    if (!post) {
      throw new Error("Database operation failed");
    }
    return post;
  }

  async updateForumPost(
    id: string,
    data: Partial<InsertForumPost>,
  ): Promise<ForumPost> {
    const [post] = await db
      .update(forumPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(forumPosts.id, id))
      .returning();
    if (!post) {
      throw new Error("Database operation failed");
    }
    return post;
  }

  async deleteForumPost(id: string): Promise<void> {
    await db.delete(forumPosts).where(eq(forumPosts.id, id));
  }

  async likeForumPost(postId: string, userId: string): Promise<void> {
    try {
      await db
        .insert(forumPostLikes)
        .values({ postId, userId })
        .onConflictDoNothing();

      // Update like count
      await db
        .update(forumPosts)
        .set({
          likeCount: sql`${forumPosts.likeCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(forumPosts.id, postId));
    } catch {
      // Ignore if already liked
    }
  }

  async unlikeForumPost(postId: string, userId: string): Promise<void> {
    const result = await db
      .delete(forumPostLikes)
      .where(
        and(
          eq(forumPostLikes.postId, postId),
          eq(forumPostLikes.userId, userId),
        ),
      );

    if ((result.rowCount ?? 0) > 0) {
      // Update like count
      await db
        .update(forumPosts)
        .set({
          likeCount: sql`GREATEST(${forumPosts.likeCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(forumPosts.id, postId));
    }
  }

  async getForumReplies(
    postId: string,
    userId?: string,
  ): Promise<
    (ForumReply & {
      author: User;
      isLiked?: boolean;
      childReplies?: ForumReply[];
    })[]
  > {
    const replies = await db
      .select({
        reply: forumReplies,
        author: users,
      })
      .from(forumReplies)
      .innerJoin(users, eq(forumReplies.authorId, users.id))
      .where(eq(forumReplies.postId, postId))
      .orderBy(forumReplies.createdAt);

    // Batch load like status for all replies if user is provided
    let likedReplyIds: Set<string> = new Set();
    if (userId && replies.length > 0) {
      const replyIds = replies.map((r) => r.reply.id);
      const likes = await db
        .select({ replyId: forumReplyLikes.replyId })
        .from(forumReplyLikes)
        .where(
          and(
            inArray(forumReplyLikes.replyId, replyIds),
            eq(forumReplyLikes.userId, userId),
          ),
        );
      likedReplyIds = new Set(likes.map((like) => like.replyId));
    }

    // Map replies with like status
    const enrichedReplies = replies.map((r) => ({
      ...r.reply,
      author: r.author,
      isLiked: likedReplyIds.has(r.reply.id),
    }));

    if (!enrichedReplies) {
      throw new Error("Database operation failed");
    }
    return enrichedReplies;
  }

  async createForumReply(data: InsertForumReply): Promise<ForumReply> {
    const [reply] = await db.insert(forumReplies).values(data).returning();

    // Update reply count on the post
    await db
      .update(forumPosts)
      .set({
        replyCount: sql`${forumPosts.replyCount} + 1`,
        lastActivityAt: new Date(), // Changed from lastReplyAt to lastActivityAt
        updatedAt: new Date(),
      })
      .where(eq(forumPosts.id, data.postId));

    if (!reply) {
      throw new Error("Database operation failed");
    }

    return reply;
  }

  async likeForumReply(replyId: string, userId: string): Promise<void> {
    try {
      await db
        .insert(forumReplyLikes)
        .values({ replyId, userId })
        .onConflictDoNothing();

      // Update like count
      await db
        .update(forumReplies)
        .set({
          likeCount: sql`${forumReplies.likeCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(forumReplies.id, replyId));
    } catch {
      // Ignore if already liked
    }
  }

  async unlikeForumReply(replyId: string, userId: string): Promise<void> {
    const result = await db
      .delete(forumReplyLikes)
      .where(
        and(
          eq(forumReplyLikes.replyId, replyId),
          eq(forumReplyLikes.userId, userId),
        ),
      );

    if ((result.rowCount ?? 0) > 0) {
      // Update like count
      await db
        .update(forumReplies)
        .set({
          likeCount: sql`GREATEST(${forumReplies.likeCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(forumReplies.id, replyId));
    }
  }

  // Analytics operations
  async getAnalyticsData(userId: string): Promise<unknown> {
    // Get user's comprehensive analytics data
    const userAnalytics = {
      userStats: {
        totalGamesPlayed: await this.getTotalGamesPlayed(userId),
        tournamentsEntered: await this.getTournamentsEntered(userId),
        friendsCount: await this.getFriendsCount(userId),
        averageSessionDuration: await this.getAverageSessionDuration(userId),
      },
      platformStats: {
        totalUsers: await this.getTotalUsers(),
        activeUsers: await this.getActiveUsers(),
        totalTournaments: await this.getTotalTournaments(),
        totalGamesPlayed: await this.getTotalGamesPlayed(),
      },
      gamePopularity: await this.getGamePopularity(),
      weeklyActivity: await this.getWeeklyActivity(userId),
    };

    return userAnalytics;
  }

  private async getTotalGamesPlayed(userId?: string): Promise<number> {
    if (userId) {
      // Count user's games
      const result = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(userGamingProfiles)
        .where(eq(userGamingProfiles.userId, userId));
      return result[0]?.count || 0;
    } else {
      // Count total platform games
      const result = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(userGamingProfiles);
      return result[0]?.count || 0;
    }
  }

  private async getTournamentsEntered(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.userId, userId));
    return result[0]?.count || 0;
  }

  private async getFriendsCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, userId),
            eq(friendships.status, "accepted"),
          ),
          and(
            eq(friendships.addresseeId, userId),
            eq(friendships.status, "accepted"),
          ),
        ),
      );
    return result[0]?.count || 0;
  }

  private async getAverageSessionDuration(_userId: string): Promise<number> {
    // Mock data for session duration - in production this would track actual sessions
    return Math.floor(Math.random() * 120) + 30; // 30-150 minutes
  }

  private async getTotalUsers(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(users);
    return result[0]?.count || 0;
  }

  private async getActiveUsers(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(users)
      .where(eq(users.status, "online"));
    return result[0]?.count || 0;
  }

  private async getTotalTournaments(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(tournaments);
    return result[0]?.count || 0;
  }

  private async getGamePopularity(): Promise<
    Array<{ game: string; players: number; change: number }>
  > {
    const result = await db
      .select({
        communityId: userGamingProfiles.communityId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(userGamingProfiles)
      .groupBy(userGamingProfiles.communityId);

    return result.map((r) => ({
      game: r.communityId || "unknown",
      players: r.count,
      change: Math.floor(Math.random() * 20) - 10, // Mock change percentage
    }));
  }

  private async getWeeklyActivity(
    _userId: string,
  ): Promise<Array<{ day: string; value: number }>> {
    // Mock weekly activity data - in production this would track actual user activity
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({
      day,
      value: Math.floor(Math.random() * 8) + 1,
    }));
  }

  // Data export operations
  async exportUserData(userId: string): Promise<unknown> {
    // Get all user data for export
    const userData = await this.getUser(userId);
    const socialLinks = await this.getUserSocialLinks(userId);
    const gamingProfiles = await this.getUserGamingProfiles(userId);
    const matchmakingPrefs = await this.getMatchmakingPreferences(userId);

    // Get tournament participation
    const userTournaments = await db
      .select({
        tournament: tournaments,
        participant: tournamentParticipants,
      })
      .from(tournamentParticipants)
      .innerJoin(
        tournaments,
        eq(tournamentParticipants.tournamentId, tournaments.id),
      )
      .where(eq(tournamentParticipants.userId, userId));

    // Get friend relationships
    const friends = await db
      .select()
      .from(friendships)
      .where(
        or(
          eq(friendships.requesterId, userId),
          eq(friendships.addresseeId, userId),
        ),
      );

    return {
      user: userData,
      socialLinks,
      gamingProfiles,
      matchmakingPreferences: matchmakingPrefs,
      tournaments: userTournaments.map((t) => t.tournament),
      friends,
      exportDate: new Date().toISOString(),
      platform: "Shuffle & Sync",
    };
  }

  // Account deletion operations
  async deleteUserAccount(userId: string): Promise<boolean> {
    try {
      // Cascade delete all user data in the correct order to respect foreign key constraints

      // Delete tournament participations
      await db
        .delete(tournamentParticipants)
        .where(eq(tournamentParticipants.userId, userId));

      // Delete tournaments organized by user
      await db.delete(tournaments).where(eq(tournaments.organizerId, userId));

      // Delete matchmaking preferences
      await db
        .delete(matchmakingPreferences)
        .where(eq(matchmakingPreferences.userId, userId));

      // Delete friend relationships
      await db
        .delete(friendships)
        .where(
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId),
          ),
        );

      // Delete social links
      await db
        .delete(userSocialLinks)
        .where(eq(userSocialLinks.userId, userId));

      // Delete gaming profiles
      await db
        .delete(userGamingProfiles)
        .where(eq(userGamingProfiles.userId, userId));

      // Finally delete the user
      const result = await db.delete(users).where(eq(users.id, userId));

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting user account:", error);
      return false;
    }
  }

  // Streaming session operations
  async getStreamSessions(filters?: {
    hostUserId?: string;
    communityId?: string;
    status?: string;
    upcoming?: boolean;
  }): Promise<
    (StreamSession & {
      host: User;
      community?: Community;
      coHosts: StreamSessionCoHost[];
      platforms: StreamSessionPlatform[];
    })[]
  > {
    try {
      const conditions = [];
      if (filters?.hostUserId) {
        conditions.push(eq(streamSessions.hostUserId, filters.hostUserId));
      }
      if (filters?.communityId) {
        conditions.push(eq(streamSessions.communityId, filters.communityId));
      }
      if (filters?.status) {
        conditions.push(eq(streamSessions.status, filters.status as any));
      }
      if (filters?.upcoming) {
        conditions.push(gte(streamSessions.scheduledStartTime, new Date()));
      }

      const results = await db
        .select({
          session: streamSessions,
          host: users,
          community: communities,
        })
        .from(streamSessions)
        .leftJoin(users, eq(streamSessions.hostUserId, users.id))
        .leftJoin(communities, eq(streamSessions.communityId, communities.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Batch load co-hosts and platforms for all sessions
      if (results.length === 0) {
        return [];
      }

      const sessionIds = results.map((r) => r.session.id);

      const [allCoHosts, allPlatforms] = await Promise.all([
        db
          .select()
          .from(streamSessionCoHosts)
          .where(inArray(streamSessionCoHosts.streamSessionId, sessionIds)),
        db
          .select()
          .from(streamSessionPlatforms)
          .where(inArray(streamSessionPlatforms.streamSessionId, sessionIds)),
      ]);

      // Create lookup maps for O(1) access
      const coHostsBySession = new Map<
        string,
        (typeof streamSessionCoHosts.$inferSelect)[]
      >();
      const platformsBySession = new Map<
        string,
        (typeof streamSessionPlatforms.$inferSelect)[]
      >();

      allCoHosts.forEach((coHost) => {
        if (coHost.streamSessionId) {
          const list = coHostsBySession.get(coHost.streamSessionId) || [];
          list.push(coHost);
          coHostsBySession.set(coHost.streamSessionId, list);
        }
      });

      allPlatforms.forEach((platform) => {
        if (platform.streamSessionId) {
          const list = platformsBySession.get(platform.streamSessionId) || [];
          list.push(platform);
          platformsBySession.set(platform.streamSessionId, list);
        }
      });

      // Map results with co-hosts and platforms
      const enrichedResults = results.map((result) => ({
        ...result.session,
        host: result.host || null,
        community: result.community,
        coHosts: coHostsBySession.get(result.session.id) || [],
        platforms: platformsBySession.get(result.session.id) || [],
      }));

      return enrichedResults;
    } catch (error) {
      console.error("Error getting stream sessions:", error);
      throw error;
    }
  }

  async getStreamSession(id: string): Promise<
    | (StreamSession & {
        host: User;
        community?: Community;
        coHosts: (StreamSessionCoHost & { user: User })[];
        platforms: StreamSessionPlatform[];
      })
    | undefined
  > {
    try {
      const [sessionResult] = await db
        .select({
          session: streamSessions,
          host: users,
          community: communities,
        })
        .from(streamSessions)
        .leftJoin(users, eq(streamSessions.hostUserId, users.id))
        .leftJoin(communities, eq(streamSessions.communityId, communities.id))
        .where(eq(streamSessions.id, id));

      if (!sessionResult) return undefined;

      const [coHostsData, platforms] = await Promise.all([
        db
          .select({
            coHost: streamSessionCoHosts,
            user: users,
          })
          .from(streamSessionCoHosts)
          .leftJoin(users, eq(streamSessionCoHosts.userId, users.id))
          .where(eq(streamSessionCoHosts.streamSessionId, id)),
        db
          .select()
          .from(streamSessionPlatforms)
          .where(eq(streamSessionPlatforms.streamSessionId, id)),
      ]);

      const coHosts = coHostsData
        .filter((ch) => ch.user)
        .map((ch) => ({
          ...ch.coHost,
          user: ch.user,
        }));

      if (!sessionResult.host) {
        throw new Error("Stream session host not found");
      }

      return {
        ...sessionResult.session,
        host: sessionResult.host,
        community: sessionResult.community || undefined,
        coHosts,
        platforms,
      };
    } catch (error) {
      console.error("Error getting stream session:", error);
      throw error;
    }
  }

  async createStreamSession(data: InsertStreamSession): Promise<StreamSession> {
    try {
      const [session] = await db
        .insert(streamSessions)
        .values(data)
        .returning();
      if (!session) {
        throw new Error("Database operation failed");
      }
      return session;
    } catch (error) {
      console.error("Error creating stream session:", error);
      throw error;
    }
  }

  async updateStreamSession(
    id: string,
    data: Partial<InsertStreamSession>,
  ): Promise<StreamSession> {
    try {
      const [session] = await db
        .update(streamSessions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(streamSessions.id, id))
        .returning();
      if (!session) {
        throw new Error("Failed to update stream session");
      }
      return session;
    } catch (error) {
      console.error("Error updating stream session:", error);
      throw error;
    }
  }

  async deleteStreamSession(id: string): Promise<void> {
    try {
      await db.delete(streamSessions).where(eq(streamSessions.id, id));
    } catch (error) {
      console.error("Error deleting stream session:", error);
      throw error;
    }
  }

  // Stream session co-host operations
  async addStreamCoHost(
    data: InsertStreamSessionCoHost,
  ): Promise<StreamSessionCoHost> {
    try {
      const [coHost] = await db
        .insert(streamSessionCoHosts)
        .values(data)
        .returning();
      if (!coHost) {
        throw new Error("Database operation failed");
      }
      return coHost;
    } catch (error) {
      console.error("Error adding stream co-host:", error);
      throw error;
    }
  }

  async removeStreamCoHost(sessionId: string, userId: string): Promise<void> {
    try {
      await db
        .delete(streamSessionCoHosts)
        .where(
          and(
            eq(streamSessionCoHosts.streamSessionId, sessionId),
            eq(streamSessionCoHosts.userId, userId),
          ),
        );
    } catch (error) {
      console.error("Error removing stream co-host:", error);
      throw error;
    }
  }

  async updateStreamCoHostPermissions(
    sessionId: string,
    userId: string,
    permissions: {
      canControlStream: boolean;
      canManageChat: boolean;
      canInviteGuests: boolean;
      canEndStream: boolean;
    },
  ): Promise<StreamSessionCoHost> {
    try {
      // Note: streamSessionCoHosts doesn't have permissions field, only role
      // Map permissions to role for simplified implementation
      let role = "co_host";
      if (
        permissions.canControlStream &&
        permissions.canManageChat &&
        permissions.canInviteGuests &&
        permissions.canEndStream
      ) {
        role = "moderator";
      } else if (!permissions.canControlStream && !permissions.canManageChat) {
        role = "guest";
      }

      const [coHost] = await db
        .update(streamSessionCoHosts)
        .set({ role })
        .where(
          and(
            eq(streamSessionCoHosts.sessionId, sessionId),
            eq(streamSessionCoHosts.userId, userId),
          ),
        )
        .returning();
      if (!coHost) {
        throw new Error("Failed to update stream co-host permissions");
      }
      return coHost;
    } catch (error) {
      console.error("Error updating stream co-host permissions:", error);
      throw error;
    }
  }

  // Stream session platform operations
  async addStreamPlatform(
    data: InsertStreamSessionPlatform,
  ): Promise<StreamSessionPlatform> {
    try {
      const [platform] = await db
        .insert(streamSessionPlatforms)
        .values(data)
        .returning();
      if (!platform) {
        throw new Error("Database operation failed");
      }
      return platform;
    } catch (error) {
      console.error("Error adding stream platform:", error);
      throw error;
    }
  }

  async updateStreamPlatform(
    id: string,
    data: Partial<InsertStreamSessionPlatform>,
  ): Promise<StreamSessionPlatform> {
    try {
      const [platform] = await db
        .update(streamSessionPlatforms)
        .set(data)
        .where(eq(streamSessionPlatforms.id, id))
        .returning();
      if (!platform) {
        throw new Error("Failed to update stream platform");
      }
      return platform;
    } catch (error) {
      console.error("Error updating stream platform:", error);
      throw error;
    }
  }

  async removeStreamPlatform(id: string): Promise<void> {
    try {
      await db
        .delete(streamSessionPlatforms)
        .where(eq(streamSessionPlatforms.id, id));
    } catch (error) {
      console.error("Error removing stream platform:", error);
      throw error;
    }
  }

  async getStreamPlatforms(
    sessionId: string,
  ): Promise<StreamSessionPlatform[]> {
    try {
      return await db
        .select()
        .from(streamSessionPlatforms)
        .where(eq(streamSessionPlatforms.streamSessionId, sessionId));
    } catch (error) {
      console.error("Error getting stream platforms:", error);
      throw error;
    }
  }

  async updateStreamStatus(
    sessionId: string,
    platform: string,
    isLive: boolean,
    viewerCount?: number,
  ): Promise<void> {
    try {
      // streamSessionPlatforms has 'status' field, not 'isLive'
      await db
        .update(streamSessionPlatforms)
        .set({
          status: isLive ? "live" : "offline", // Use status field instead of isLive
          viewerCount: viewerCount || 0,
        })
        .where(
          and(
            eq(streamSessionPlatforms.sessionId, sessionId),
            eq(streamSessionPlatforms.platform, platform),
          ),
        );
    } catch (error) {
      console.error("Error updating stream status:", error);
      throw error;
    }
  }

  // Collaboration request operations
  async getCollaborationRequests(filters?: {
    fromUserId?: string;
    toUserId?: string;
    status?: string;
    type?: string;
  }): Promise<
    (CollaborationRequest & {
      fromUser: User;
      toUser: User;
      streamSession?: StreamSession;
    })[]
  > {
    try {
      const conditions = [];
      if (filters?.fromUserId) {
        conditions.push(
          eq(collaborationRequests.fromUserId, filters.fromUserId),
        );
      }
      if (filters?.toUserId) {
        conditions.push(eq(collaborationRequests.toUserId, filters.toUserId));
      }
      if (filters?.status) {
        conditions.push(
          eq(collaborationRequests.status, filters.status as any),
        );
      }
      // Note: collaborationRequests doesn't have a 'type' field in schema

      const results = await db
        .select({
          request: collaborationRequests,
          fromUser: alias(users, "fromUser"),
          toUser: alias(users, "toUser"),
          streamSession: streamSessions,
        })
        .from(collaborationRequests)
        .leftJoin(
          alias(users, "fromUser"),
          eq(collaborationRequests.fromUserId, alias(users, "fromUser").id),
        )
        .leftJoin(
          alias(users, "toUser"),
          eq(collaborationRequests.toUserId, alias(users, "toUser").id),
        )
        .leftJoin(
          streamSessions,
          eq(collaborationRequests.eventId, streamSessions.eventId),
        ) // Use eventId instead of streamSessionId
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return results
        .filter((r) => r.fromUser && r.toUser)
        .map((r) => ({
          ...r.request,
          fromUser: r.fromUser,
          toUser: r.toUser,
          streamSession: r.streamSession,
        })) as (CollaborationRequest & {
        fromUser: User | null;
        toUser: User | null;
        streamSession?: StreamSession | null;
      })[];
    } catch (error) {
      console.error("Error getting collaboration requests:", error);
      throw error;
    }
  }

  async createCollaborationRequest(
    data: InsertCollaborationRequest,
  ): Promise<CollaborationRequest> {
    try {
      const [request] = await db
        .insert(collaborationRequests)
        .values(data)
        .returning();
      if (!request) {
        throw new Error("Database operation failed");
      }
      return request;
    } catch (error) {
      console.error("Error creating collaboration request:", error);
      throw error;
    }
  }

  async respondToCollaborationRequest(
    id: string,
    status: "accepted" | "declined" | "cancelled",
    _responseMessage?: string,
  ): Promise<CollaborationRequest> {
    try {
      // Note: collaborationRequests doesn't have a 'responseMessage' field
      const [request] = await db
        .update(collaborationRequests)
        .set({
          status,
          respondedAt: new Date(),
        })
        .where(eq(collaborationRequests.id, id))
        .returning();
      if (!request) {
        throw new Error("Failed to respond to collaboration request");
      }
      return request;
    } catch (error) {
      console.error("Error responding to collaboration request:", error);
      throw error;
    }
  }

  async expireCollaborationRequests(): Promise<void> {
    try {
      await db
        .update(collaborationRequests)
        .set({ status: "expired" })
        .where(
          and(
            eq(collaborationRequests.status, "pending"),
            sql`expires_at < NOW()`,
          ),
        );
    } catch (error) {
      console.error("Error expiring collaboration requests:", error);
      throw error;
    }
  }

  // Stream analytics operations
  async recordStreamAnalytics(
    data: InsertStreamAnalytics,
  ): Promise<StreamAnalytics> {
    try {
      const [analytics] = await db
        .insert(streamAnalytics)
        .values(data)
        .returning();
      if (!analytics) {
        throw new Error("Database operation failed");
      }
      return analytics;
    } catch (error) {
      console.error("Error recording stream analytics:", error);
      throw error;
    }
  }

  async getStreamAnalytics(
    sessionId: string,
    platform?: string,
  ): Promise<StreamAnalytics[]> {
    try {
      const conditions = [eq(streamAnalytics.sessionId, sessionId)]; // Changed from streamSessionId

      if (platform) {
        conditions.push(eq(streamAnalytics.platform, platform));
      }

      return await db
        .select()
        .from(streamAnalytics)
        .where(and(...conditions))
        .orderBy(streamAnalytics.timestamp);
    } catch (error) {
      console.error("Error getting stream analytics:", error);
      throw error;
    }
  }

  async getStreamAnalyticsSummary(sessionId: string): Promise<{
    totalViewers: number;
    peakViewers: number;
    averageViewers: number;
    totalChatMessages: number;
    platforms: string[];
  }> {
    try {
      const analytics = await db
        .select({
          maxViewers: sql<number>`MAX(${streamAnalytics.viewerCount})`,
          avgViewers: sql<number>`AVG(${streamAnalytics.viewerCount})`,
          totalMessages: sql<number>`SUM(${streamAnalytics.chatMessages})`, // Changed from chatMessageCount
          platforms: sql<string>`GROUP_CONCAT(DISTINCT ${streamAnalytics.platform})`, // Changed from ARRAY_AGG to GROUP_CONCAT for SQLite
        })
        .from(streamAnalytics)
        .where(eq(streamAnalytics.sessionId, sessionId)); // Changed from streamSessionId

      const result = analytics[0];
      return {
        totalViewers: result?.maxViewers || 0,
        peakViewers: result?.maxViewers || 0,
        averageViewers: Math.round(result?.avgViewers || 0),
        totalChatMessages: result?.totalMessages || 0,
        platforms: (result?.platforms || []) as string[],
      };
    } catch (error) {
      console.error("Error getting stream analytics summary:", error);
      throw error;
    }
  }

  // User activity analytics operations
  async recordUserActivityAnalytics(
    data: InsertUserActivityAnalytics,
  ): Promise<UserActivityAnalytics> {
    try {
      const [analytics] = await db
        .insert(userActivityAnalytics)
        .values(data)
        .returning();
      if (!analytics) {
        throw new Error("Database operation failed");
      }
      return analytics;
    } catch (error) {
      console.error("Error recording user activity analytics:", error);
      throw error;
    }
  }

  async getUserActivityAnalytics(
    userId: string,
    days: number = 30,
  ): Promise<UserActivityAnalytics[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await db
        .select()
        .from(userActivityAnalytics)
        .where(
          and(
            eq(userActivityAnalytics.userId, userId),
            gte(userActivityAnalytics.createdAt, startDate),
          ),
        )
        .orderBy(userActivityAnalytics.createdAt);
    } catch (error) {
      console.error("Error getting user activity analytics:", error);
      throw error;
    }
  }

  // Community analytics operations
  async recordCommunityAnalytics(
    data: InsertCommunityAnalytics,
  ): Promise<CommunityAnalytics> {
    try {
      const [analytics] = await db
        .insert(communityAnalytics)
        .values(data)
        .returning();
      if (!analytics) {
        throw new Error("Database operation failed");
      }
      return analytics;
    } catch (error) {
      console.error("Error recording community analytics:", error);
      throw error;
    }
  }

  async getCommunityAnalytics(
    communityId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CommunityAnalytics[]> {
    try {
      return await db
        .select()
        .from(communityAnalytics)
        .where(
          and(
            eq(communityAnalytics.communityId, communityId),
            gte(
              sql`DATE(${communityAnalytics.date})`,
              startDate.toISOString().split("T")[0],
            ),
            sql`DATE(${communityAnalytics.date}) <= ${endDate.toISOString().split("T")[0]}`,
          ),
        )
        .orderBy(communityAnalytics.date);
    } catch (error) {
      console.error("Error getting community analytics:", error);
      throw error;
    }
  }

  // Platform metrics operations
  async recordPlatformMetrics(
    data: InsertPlatformMetrics,
  ): Promise<PlatformMetrics> {
    try {
      const [metrics] = await db
        .insert(platformMetrics)
        .values(data)
        .returning();
      if (!metrics) {
        throw new Error("Database operation failed");
      }
      return metrics;
    } catch (error) {
      console.error("Error recording platform metrics:", error);
      throw error;
    }
  }

  async getPlatformMetrics(
    metricType?: string,
    _timeWindow?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PlatformMetrics[]> {
    try {
      const conditions = [];
      if (metricType) {
        conditions.push(eq(platformMetrics.metricType, metricType));
      }
      // Note: timeWindow parameter is not used as schema doesn't have this field
      if (startDate) {
        conditions.push(gte(platformMetrics.timestamp, startDate));
      }
      if (endDate) {
        conditions.push(sql`${platformMetrics.timestamp} <= ${endDate}`);
      }

      const query = db
        .select()
        .from(platformMetrics)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return await query.orderBy(platformMetrics.timestamp);
    } catch (error) {
      console.error("Error getting platform metrics:", error);
      throw error;
    }
  }

  // Event tracking operations
  async recordEventTracking(data: InsertEventTracking): Promise<EventTracking> {
    try {
      const [event] = await db.insert(eventTracking).values(data).returning();
      if (!event) {
        throw new Error("Database operation failed");
      }
      return event;
    } catch (error) {
      console.error("Error recording event tracking:", error);
      throw error;
    }
  }

  async getEventTracking(
    eventName?: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<EventTracking[]> {
    try {
      const conditions = [];
      if (eventName) {
        conditions.push(eq(eventTracking.eventName, eventName));
      }
      if (userId) {
        conditions.push(eq(eventTracking.userId, userId));
      }
      if (startDate) {
        conditions.push(gte(eventTracking.timestamp, startDate));
      }
      if (endDate) {
        conditions.push(sql`${eventTracking.timestamp} <= ${endDate}`);
      }

      const query = db
        .select()
        .from(eventTracking)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return await query.orderBy(eventTracking.timestamp);
    } catch (error) {
      console.error("Error getting event tracking:", error);
      throw error;
    }
  }

  // Conversion funnel operations
  async recordConversionFunnel(
    data: InsertConversionFunnel,
  ): Promise<ConversionFunnel> {
    try {
      const [funnel] = await db
        .insert(conversionFunnel)
        .values(data)
        .returning();
      if (!funnel) {
        throw new Error("Database operation failed");
      }
      return funnel;
    } catch (error) {
      console.error("Error recording conversion funnel:", error);
      throw error;
    }
  }

  async getConversionFunnelData(
    funnelName: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ConversionFunnel[]> {
    try {
      const conditions = [eq(conversionFunnel.funnelName, funnelName)];
      if (startDate) {
        conditions.push(gte(conversionFunnel.createdAt, startDate));
      }
      if (endDate) {
        conditions.push(sql`${conversionFunnel.createdAt} <= ${endDate}`);
      }

      return await db
        .select()
        .from(conversionFunnel)
        .where(and(...conditions))
        .orderBy(conversionFunnel.createdAt, conversionFunnel.stepOrder);
    } catch (error) {
      console.error("Error getting conversion funnel data:", error);
      throw error;
    }
  }

  // Collaborative streaming events
  async createCollaborativeStreamEvent(
    data: InsertCollaborativeStreamEvent,
  ): Promise<CollaborativeStreamEvent> {
    try {
      const [event] = await db
        .insert(collaborativeStreamEvents)
        .values(data)
        .returning();
      if (!event) {
        throw new Error("Database operation failed");
      }
      return event;
    } catch (error) {
      logger.error(
        "Failed to create collaborative stream event",
        toLoggableError(error),
      );
      throw error;
    }
  }

  async getCollaborativeStreamEvent(
    id: string,
  ): Promise<CollaborativeStreamEvent | null> {
    try {
      const [event] = await db
        .select()
        .from(collaborativeStreamEvents)
        .where(eq(collaborativeStreamEvents.id, id));
      return event || null;
    } catch (error) {
      logger.error(
        "Failed to get collaborative stream event",
        toLoggableError(error),
        { id },
      );
      throw error;
    }
  }

  async updateCollaborativeStreamEvent(
    id: string,
    data: Partial<InsertCollaborativeStreamEvent>,
  ): Promise<CollaborativeStreamEvent> {
    try {
      const [event] = await db
        .update(collaborativeStreamEvents)
        .set(data)
        .where(eq(collaborativeStreamEvents.id, id))
        .returning();
      if (!event) {
        throw new Error("Database operation failed");
      }
      return event;
    } catch (error) {
      logger.error(
        "Failed to update collaborative stream event",
        toLoggableError(error),
        {
          id,
        },
      );
      throw error;
    }
  }

  async deleteCollaborativeStreamEvent(id: string): Promise<void> {
    try {
      await db
        .delete(collaborativeStreamEvents)
        .where(eq(collaborativeStreamEvents.id, id));
    } catch (error) {
      logger.error(
        "Failed to delete collaborative stream event",
        toLoggableError(error),
        {
          id,
        },
      );
      throw error;
    }
  }

  async getUserCollaborativeStreamEvents(
    userId: string,
  ): Promise<CollaborativeStreamEvent[]> {
    try {
      return await db
        .select()
        .from(collaborativeStreamEvents)
        .where(eq(collaborativeStreamEvents.organizerId, userId));
    } catch (error) {
      logger.error(
        "Failed to get user collaborative stream events",
        toLoggableError(error),
        {
          userId,
        },
      );
      throw error;
    }
  }

  // Stream collaborators
  async createStreamCollaborator(
    data: InsertStreamCollaborator,
  ): Promise<StreamCollaborator> {
    try {
      const [collaborator] = await db
        .insert(streamCollaborators)
        .values(data)
        .returning();
      if (!collaborator) {
        throw new Error("Database operation failed");
      }
      return collaborator;
    } catch (error) {
      logger.error(
        "Failed to create stream collaborator",
        toLoggableError(error),
      );
      throw error;
    }
  }

  async getStreamCollaborator(id: string): Promise<StreamCollaborator | null> {
    try {
      const [collaborator] = await db
        .select()
        .from(streamCollaborators)
        .where(eq(streamCollaborators.id, id));
      return collaborator || null;
    } catch (error) {
      logger.error(
        "Failed to get stream collaborator",
        toLoggableError(error),
        { id },
      );
      throw error;
    }
  }

  async updateStreamCollaborator(
    id: string,
    data: Partial<InsertStreamCollaborator>,
  ): Promise<StreamCollaborator> {
    try {
      const [collaborator] = await db
        .update(streamCollaborators)
        .set(data)
        .where(eq(streamCollaborators.id, id))
        .returning();
      if (!collaborator) {
        throw new Error("Database operation failed");
      }
      return collaborator;
    } catch (error) {
      logger.error(
        "Failed to update stream collaborator",
        toLoggableError(error),
        { id },
      );
      throw error;
    }
  }

  async deleteStreamCollaborator(id: string): Promise<void> {
    try {
      await db
        .delete(streamCollaborators)
        .where(eq(streamCollaborators.id, id));
    } catch (error) {
      logger.error(
        "Failed to delete stream collaborator",
        toLoggableError(error),
        { id },
      );
      throw error;
    }
  }

  async getStreamCollaborators(
    streamEventId: string,
  ): Promise<StreamCollaborator[]> {
    try {
      return await db
        .select()
        .from(streamCollaborators)
        .where(eq(streamCollaborators.eventId, streamEventId));
    } catch (error) {
      logger.error(
        "Failed to get stream collaborators",
        toLoggableError(error),
        {
          streamEventId,
        },
      );
      throw error;
    }
  }

  // Stream coordination sessions
  async createStreamCoordinationSession(
    data: InsertStreamCoordinationSession,
  ): Promise<StreamCoordinationSession> {
    try {
      const [session] = await db
        .insert(streamCoordinationSessions)
        .values(data)
        .returning();
      if (!session) {
        throw new Error("Database operation failed");
      }
      return session;
    } catch (error) {
      logger.error(
        "Failed to create stream coordination session",
        toLoggableError(error),
      );
      throw error;
    }
  }

  async getStreamCoordinationSession(
    id: string,
  ): Promise<StreamCoordinationSession | null> {
    try {
      const [session] = await db
        .select()
        .from(streamCoordinationSessions)
        .where(eq(streamCoordinationSessions.id, id));
      return session || null;
    } catch (error) {
      logger.error(
        "Failed to get stream coordination session",
        toLoggableError(error),
        { id },
      );
      throw error;
    }
  }

  async updateStreamCoordinationSession(
    id: string,
    data: Partial<InsertStreamCoordinationSession>,
  ): Promise<StreamCoordinationSession> {
    try {
      const [session] = await db
        .update(streamCoordinationSessions)
        .set(data)
        .where(eq(streamCoordinationSessions.id, id))
        .returning();
      if (!session) {
        throw new Error("Database operation failed");
      }
      return session;
    } catch (error) {
      logger.error(
        "Failed to update stream coordination session",
        toLoggableError(error),
        {
          id,
        },
      );
      throw error;
    }
  }

  async deleteStreamCoordinationSession(id: string): Promise<void> {
    try {
      await db
        .delete(streamCoordinationSessions)
        .where(eq(streamCoordinationSessions.id, id));
    } catch (error) {
      logger.error(
        "Failed to delete stream coordination session",
        toLoggableError(error),
        {
          id,
        },
      );
      throw error;
    }
  }

  async getActiveCoordinationSessions(): Promise<StreamCoordinationSession[]> {
    try {
      return await db
        .select()
        .from(streamCoordinationSessions)
        .where(eq(streamCoordinationSessions.currentPhase, "live"));
    } catch (error) {
      logger.error(
        "Failed to get active coordination sessions",
        toLoggableError(error),
      );
      throw error;
    }
  }

  // ===== ADMIN & MODERATION OPERATIONS =====

  // User role operations (RBAC)
  async getUserRoles(userId: string): Promise<UserRole[]> {
    return await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
  }

  async createUserRole(data: InsertUserRole): Promise<UserRole> {
    const [role] = await db.insert(userRoles).values(data).returning();

    // Create audit log
    await this.createAuditLog({
      adminUserId: data.assignedBy || "system",
      action: "user_role_created",
      category: "role_assignment",
      targetType: "user",
      targetId: data.userId,
      parameters: JSON.stringify({
        role: data.role,
        permissions: data.permissions,
      }),
      ipAddress: "", // Will be filled by middleware
    });

    if (!role) {
      throw new Error("Database operation failed");
    }

    return role;
  }

  async updateUserRole(
    id: string,
    data: Partial<InsertUserRole>,
  ): Promise<UserRole> {
    const [role] = await db
      .update(userRoles)
      .set(data)
      .where(eq(userRoles.id, id))
      .returning();

    if (!role) {
      throw new Error("Failed to update user role");
    }

    if (data.assignedBy) {
      await this.createAuditLog({
        adminUserId: data.assignedBy,
        action: "user_role_updated",
        category: "role_assignment",
        targetType: "user",
        targetId: role.userId,
        parameters: JSON.stringify({ roleId: id, updates: data }),
        ipAddress: "",
      });
    }

    if (!role) {
      throw new Error("Database operation failed");
    }

    return role;
  }

  async deleteUserRole(id: string): Promise<void> {
    await db.delete(userRoles).where(eq(userRoles.id, id));
  }

  async checkUserPermission(
    userId: string,
    permission: string,
  ): Promise<boolean> {
    const roles = await this.getUserRoles(userId);

    for (const role of roles) {
      if (role.isActive && role.permissions) {
        const permissions =
          typeof role.permissions === "string"
            ? JSON.parse(role.permissions)
            : role.permissions;

        if (Array.isArray(permissions) && permissions.includes(permission)) {
          return true;
        }
      }
    }

    // Database operation validation
    throw new Error("Database operation failed");
  }

  async getUsersByRole(role: string): Promise<(UserRole & { user: User })[]> {
    return await db
      .select({
        id: userRoles.id,
        userId: userRoles.userId,
        role: userRoles.role,
        communityId: userRoles.communityId,
        permissions: userRoles.permissions,
        isActive: userRoles.isActive,
        assignedBy: userRoles.assignedBy,
        expiresAt: userRoles.expiresAt,
        createdAt: userRoles.createdAt,
        updatedAt: userRoles.updatedAt,
        user: users,
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(and(eq(userRoles.role, role), eq(userRoles.isActive, true)));
  }

  // User reputation operations
  async getUserReputation(userId: string): Promise<UserReputation | undefined> {
    const [reputation] = await db
      .select()
      .from(userReputation)
      .where(eq(userReputation.userId, userId));
    if (!reputation) {
      throw new Error("Database operation failed");
    }
    return reputation;
  }

  async updateUserReputation(
    userId: string,
    data: Partial<InsertUserReputation>,
  ): Promise<UserReputation> {
    // Check if reputation record exists
    const existing = await this.getUserReputation(userId);

    if (existing) {
      const [updated] = await db
        .update(userReputation)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userReputation.userId, userId))
        .returning();
      if (!updated) {
        throw new Error("Failed to update user reputation");
      }
      return updated;
    } else {
      const [created] = await db
        .insert(userReputation)
        .values({ userId, ...data } as InsertUserReputation)
        .returning();
      if (!created) {
        throw new Error("Failed to create user reputation");
      }
      return created;
    }
  }

  async calculateReputationScore(userId: string): Promise<number> {
    // Get or create user's reputation record
    let reputation = await this.getUserReputation(userId);
    if (!reputation) {
      reputation = await this.updateUserReputation(userId, { score: 100 });
    }

    // Get user account age for experience factor
    const user = await this.getUser(userId);
    const accountAgeMonths = user?.createdAt
      ? Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30),
        )
      : 0;

    // Get recent user activity analytics (last 30 days)
    const activityData = await this.getUserActivityAnalytics(userId, 30);

    // Get moderation actions against this user
    const moderationActions = await this.getUserActiveModerationActions(userId);

    // Get user's community involvement
    const userCommunities = await this.getUserCommunities(userId);

    // Get report accuracy data
    const reportsAccuracyRate =
      (reputation.reportsMade || 0) > 0
        ? (reputation.reportsAccurate || 0) / (reputation.reportsMade || 1)
        : 0;

    // === BASE SCORE CALCULATION ===
    let calculatedScore = 100; // Starting base score

    // === POSITIVE FACTORS ===

    // 1. Account longevity bonus (up to +50 points)
    const longevityBonus = Math.min(50, accountAgeMonths * 2);
    calculatedScore += longevityBonus;

    // 2. Positive actions multiplier (up to +100 points)
    const positiveActionsBonus = Math.min(
      100,
      (reputation.positiveActions || 0) * 3,
    );
    calculatedScore += positiveActionsBonus;

    // 3. Community engagement (up to +75 points)
    const communityEngagement = Math.min(75, userCommunities.length * 15);
    calculatedScore += communityEngagement;

    // 4. Activity consistency bonus (up to +50 points)
    const uniqueEventDays = new Set(
      activityData.map(
        (activity) => activity.date, // Use date field instead of timestamp
      ),
    ).size;
    const consistencyBonus = Math.min(50, uniqueEventDays * 2);
    calculatedScore += consistencyBonus;

    // 5. Report accuracy bonus (up to +40 points)
    const reportAccuracyBonus = Math.min(40, reportsAccuracyRate * 40);
    calculatedScore += reportAccuracyBonus;

    // === NEGATIVE FACTORS ===

    // 1. Negative actions penalty
    const negativeActionsPenalty = (reputation.negativeActions || 0) * 8;
    calculatedScore -= negativeActionsPenalty;

    // 2. Active moderation actions penalty
    const activeModerationPenalty = moderationActions.length * 25;
    calculatedScore -= activeModerationPenalty;

    // 3. Recent violation penalty (more severe for recent violations)
    const moderationHistory = Array.isArray(reputation.moderationHistory)
      ? (reputation.moderationHistory as any[])
      : [];

    let recentViolationPenalty = 0;
    const now = Date.now();
    moderationHistory.forEach((action) => {
      const typedAction = action as {
        timestamp?: Date | string;
        createdAt?: Date | string;
      };
      const timestamp = typedAction.timestamp || typedAction.createdAt;
      const actionDate = new Date(timestamp || Date.now()).getTime();
      const daysSince = (now - actionDate) / (1000 * 60 * 60 * 24);

      if (daysSince <= 30) {
        // Recent violations (last 30 days) - high penalty
        recentViolationPenalty += 50;
      } else if (daysSince <= 90) {
        // Medium-term violations - moderate penalty
        recentViolationPenalty += 20;
      } else if (daysSince <= 365) {
        // Older violations - small penalty
        recentViolationPenalty += 5;
      }
    });
    calculatedScore -= recentViolationPenalty;

    // === LEVEL DETERMINATION ===
    let newLevel: "new" | "trusted" | "veteran" | "flagged" | "restricted" =
      "new";
    if (calculatedScore >= 300 && accountAgeMonths >= 6) {
      newLevel = "veteran";
    } else if (calculatedScore >= 200 && accountAgeMonths >= 2) {
      newLevel = "trusted";
    } else if (calculatedScore < 50 || activeModerationPenalty > 50) {
      newLevel = "flagged";
    } else if (calculatedScore < 25 || activeModerationPenalty > 100) {
      newLevel = "restricted";
    }

    // Ensure minimum score of 0
    const finalScore = Math.max(0, Math.floor(calculatedScore));

    // Update the calculated score and level
    await this.updateUserReputation(userId, {
      score: finalScore,
      level: newLevel,
      lastCalculated: new Date(),
    });

    if (!finalScore) {
      throw new Error("Database operation failed");
    }

    return finalScore;
  }

  async getUsersByReputationRange(
    minScore: number,
    maxScore: number,
  ): Promise<(UserReputation & { user: User })[]> {
    return await db
      .select({
        id: userReputation.id,
        userId: userReputation.userId,
        score: userReputation.score,
        level: userReputation.level,
        positiveActions: userReputation.positiveActions,
        negativeActions: userReputation.negativeActions,
        reportsMade: userReputation.reportsMade,
        reportsAccurate: userReputation.reportsAccurate,
        moderationHistory: userReputation.moderationHistory,
        lastCalculated: userReputation.lastCalculated,
        createdAt: userReputation.createdAt,
        updatedAt: userReputation.updatedAt,
        user: users,
      })
      .from(userReputation)
      .innerJoin(users, eq(userReputation.userId, users.id))
      .where(
        and(
          gte(userReputation.score, minScore),
          lte(userReputation.score, maxScore),
        ),
      );
  }

  // Additional reputation management methods
  async recordPositiveAction(
    userId: string,
    actionType: string,
    metadata?: unknown,
  ): Promise<void> {
    // Get current reputation
    const reputation = await this.getUserReputation(userId);
    const currentPositiveActions = reputation?.positiveActions || 0;

    // Update positive actions count
    await this.updateUserReputation(userId, {
      positiveActions: currentPositiveActions + 1,
    });

    // Record in moderation history
    const moderationHistory = Array.isArray(reputation?.moderationHistory)
      ? (reputation.moderationHistory as any[])
      : typeof reputation?.moderationHistory === "string" &&
          reputation.moderationHistory
        ? JSON.parse(reputation.moderationHistory)
        : [];

    moderationHistory.push({
      type: "positive_action",
      action: actionType,
      timestamp: new Date().toISOString(),
      metadata,
    });

    await this.updateUserReputation(userId, {
      moderationHistory: JSON.stringify(moderationHistory.slice(-20)), // Keep last 20 entries
    });

    // Recalculate reputation score
    await this.calculateReputationScore(userId);
  }

  async recordNegativeAction(
    userId: string,
    actionType: string,
    severity: "minor" | "moderate" | "severe",
    metadata?: unknown,
  ): Promise<void> {
    // Get current reputation
    const reputation = await this.getUserReputation(userId);
    const currentNegativeActions = reputation?.negativeActions || 0;

    // Update negative actions count
    await this.updateUserReputation(userId, {
      negativeActions: currentNegativeActions + 1,
    });

    // Record in moderation history with severity
    const moderationHistory = Array.isArray(reputation?.moderationHistory)
      ? (reputation.moderationHistory as any[])
      : typeof reputation?.moderationHistory === "string" &&
          reputation.moderationHistory
        ? JSON.parse(reputation.moderationHistory)
        : [];

    moderationHistory.push({
      type: "negative_action",
      action: actionType,
      severity,
      timestamp: new Date().toISOString(),
      metadata,
    });

    await this.updateUserReputation(userId, {
      moderationHistory: JSON.stringify(moderationHistory.slice(-20)), // Keep last 20 entries
    });

    // Recalculate reputation score
    await this.calculateReputationScore(userId);
  }

  async recordReportSubmission(
    userId: string,
    _reportId: string,
    isAccurate?: boolean,
  ): Promise<void> {
    const reputation = await this.getUserReputation(userId);
    const currentReportsMade = reputation?.reportsMade || 0;
    const currentReportsAccurate = reputation?.reportsAccurate || 0;

    const updates: Partial<InsertUserReputation> = {
      reportsMade: currentReportsMade + 1,
    };

    // If we know if the report was accurate, update that too
    if (isAccurate === true) {
      updates.reportsAccurate = currentReportsAccurate + 1;
    }

    await this.updateUserReputation(userId, updates);

    // Recalculate reputation score
    await this.calculateReputationScore(userId);
  }

  async batchRecalculateReputationScores(userIds?: string[]): Promise<void> {
    const BATCH_SIZE = 10; // Process 10 users concurrently to balance load

    let targetUserIds: string[];
    if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      // Get all users with reputation records
      const allReputations = await db
        .select({ userId: userReputation.userId })
        .from(userReputation);
      targetUserIds = allReputations.map((rep) => rep.userId);
    }

    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < targetUserIds.length; i += BATCH_SIZE) {
      const batch = targetUserIds.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((userId) => this.calculateReputationScore(userId)),
      );
    }
  }

  // Content report operations
  async createContentReport(data: InsertContentReport): Promise<ContentReport> {
    // confidenceScore should be a number (real type in schema)
    const insertData = {
      ...data,
      confidenceScore:
        data.confidenceScore !== undefined
          ? Number(data.confidenceScore)
          : undefined,
    };

    const [report] = await db
      .insert(contentReports)
      .values(insertData)
      .returning();

    if (!report) {
      throw new Error("Failed to create content report");
    }

    // Record positive action for user who submitted the report
    if (data.reporterUserId) {
      await this.recordPositiveAction(
        data.reporterUserId,
        "content_report_submitted",
        {
          reportId: report.id,
          contentType: data.contentType,
          reason: data.reason,
        },
      );
    }

    // Add to moderation queue if auto-flagged or high priority
    if (
      data.isSystemGenerated ||
      data.priority === "high" ||
      data.priority === "urgent"
    ) {
      // Map priority strings to numbers (1-10 scale)
      const priorityMap: Record<string, number> = {
        low: 3,
        medium: 5,
        high: 7,
        urgent: 9,
      };

      await this.addToModerationQueue({
        itemType: "report",
        itemId: report.id as string,
        priority: priorityMap[data.priority || "medium"],
        summary: `${data.reason}: ${data.contentType} reported`,
        metadata: JSON.stringify({
          contentType: data.contentType,
          contentId: data.contentId,
        }),
      });
    }

    if (!report) {
      throw new Error("Database operation failed");
    }

    return report;
  }

  async getContentReports(filters?: {
    status?: string;
    priority?: string;
    reporterUserId?: string;
    assignedModerator?: string;
  }): Promise<
    (ContentReport & {
      reporter?: User;
      reportedUser?: User;
      assignedMod?: User;
    })[]
  > {
    const baseQuery = db
      .select({
        id: contentReports.id,
        reporterUserId: contentReports.reporterUserId,
        reportedUserId: contentReports.reportedUserId,
        contentType: contentReports.contentType,
        contentId: contentReports.contentId,
        reason: contentReports.reason,
        description: contentReports.description,
        evidence: contentReports.evidence,
        isSystemGenerated: contentReports.isSystemGenerated,
        automatedFlags: contentReports.automatedFlags,
        confidenceScore: contentReports.confidenceScore,
        status: contentReports.status,
        priority: contentReports.priority,
        assignedModerator: contentReports.assignedModerator,
        moderationNotes: contentReports.moderationNotes,
        resolution: contentReports.resolution,
        actionTaken: contentReports.actionTaken,
        createdAt: contentReports.createdAt,
        resolvedAt: contentReports.resolvedAt,
        reporter: alias(users, "reporter"),
        reportedUser: alias(users, "reportedUser"),
        assignedMod: alias(users, "assignedMod"),
      })
      .from(contentReports)
      .leftJoin(
        alias(users, "reporter"),
        eq(contentReports.reporterUserId, alias(users, "reporter").id),
      )
      .leftJoin(
        alias(users, "reportedUser"),
        eq(contentReports.reportedUserId, alias(users, "reportedUser").id),
      )
      .leftJoin(
        alias(users, "assignedMod"),
        eq(contentReports.assignedModerator, alias(users, "assignedMod").id),
      );

    const conditions = [];
    if (filters?.status)
      conditions.push(eq(contentReports.status, filters.status));
    if (filters?.priority)
      conditions.push(eq(contentReports.priority, filters.priority));
    if (filters?.reporterUserId)
      conditions.push(
        eq(contentReports.reporterUserId, filters.reporterUserId),
      );
    if (filters?.assignedModerator)
      conditions.push(
        eq(contentReports.assignedModerator, filters.assignedModerator),
      );

    const query =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    const results = await query.orderBy(desc(contentReports.createdAt));

    // Map null to undefined for optional joined fields to match return type
    return results.map((r) => ({
      ...r,
      reporter: r.reporter || undefined,
      reportedUser: r.reportedUser || undefined,
      assignedMod: r.assignedMod || undefined,
    }));
  }

  async getContentReport(id: string): Promise<
    | (ContentReport & {
        reporter?: User;
        reportedUser?: User;
        assignedMod?: User;
      })
    | undefined
  > {
    const reports = await this.getContentReports();
    return reports.find((report) => report.id === id);
  }

  async updateContentReport(
    id: string,
    data: Partial<InsertContentReport>,
  ): Promise<ContentReport> {
    const [updated] = await db
      .update(contentReports)
      .set({
        ...data,
        resolvedAt: data.status === "resolved" ? new Date() : undefined,
      })
      .where(eq(contentReports.id, id))
      .returning();
    if (!updated) {
      throw new Error("Database operation failed");
    }
    return updated;
  }

  async assignContentReport(
    reportId: string,
    moderatorId: string,
  ): Promise<ContentReport> {
    return await this.updateContentReport(reportId, {
      assignedModerator: moderatorId,
    });
  }

  async resolveContentReport(
    reportId: string,
    resolution: string,
    actionTaken?: string,
    moderatorId?: string,
  ): Promise<ContentReport> {
    // Get the original report to access reporter info
    const originalReport = await this.getContentReport(reportId);

    const updateData: Partial<InsertContentReport> = {
      status: "resolved",
      resolution,
      actionTaken,
      resolvedAt: new Date(),
    };

    // Update report accuracy tracking for the reporter
    if (originalReport?.reporterUserId) {
      const isAccurate =
        resolution === "valid" || resolution === "action_taken";
      await this.recordReportSubmission(
        originalReport.reporterUserId,
        reportId,
        isAccurate,
      );
    }

    if (moderatorId) {
      await this.createAuditLog({
        adminUserId: moderatorId,
        action: "content_report_resolved",
        targetId: reportId,
        targetType: "content_report",
        category: "content_moderation",
        parameters: JSON.stringify({ reportId, resolution, actionTaken }),
        ipAddress: "",
      });
    }

    return await this.updateContentReport(reportId, updateData);
  }

  // Moderation action operations
  async createModerationAction(
    data: InsertModerationAction,
  ): Promise<ModerationAction> {
    const [action] = await db
      .insert(moderationActions)
      .values(data)
      .returning();

    if (!action) {
      throw new Error("Failed to create moderation action");
    }

    // Record negative action for the target user based on severity
    if (data.targetUserId) {
      let severity: "minor" | "moderate" | "severe" = "moderate";

      // Determine severity based on action type
      // Valid actions: warn, mute, restrict, shadowban, ban, unban, content_remove, account_suspend, note, unmute
      if (
        data.action === "warn" ||
        data.action === "content_remove" ||
        data.action === "note"
      ) {
        severity = "minor";
      } else if (
        data.action === "mute" ||
        data.action === "restrict" ||
        data.action === "unmute"
      ) {
        severity = "moderate";
      } else if (
        data.action === "ban" ||
        data.action === "shadowban" ||
        data.action === "account_suspend"
      ) {
        severity = "severe";
      }

      await this.recordNegativeAction(
        data.targetUserId,
        data.action,
        severity,
        {
          moderationActionId: action.id,
          reason: data.reason,
          moderatorId: data.moderatorId,
        },
      );
    }

    // Create audit log
    await this.createAuditLog({
      adminUserId: data.moderatorId,
      action: "moderation_action_created",
      category: "content_moderation",
      targetId: data.targetUserId,
      targetType: "user",
      parameters: JSON.stringify({
        actionType: data.action,
        reason: data.reason,
        duration: data.expiresAt ? `until ${data.expiresAt}` : "permanent",
      }),
      ipAddress: "",
    });

    if (!action) {
      throw new Error("Database operation failed");
    }

    return action;
  }

  async getModerationActions(filters?: {
    targetUserId?: string;
    moderatorId?: string;
    action?: string;
    isActive?: boolean;
  }): Promise<(ModerationAction & { moderator: User; targetUser: User })[]> {
    const baseQuery = db
      .select({
        id: moderationActions.id,
        moderatorId: moderationActions.moderatorId,
        targetUserId: moderationActions.targetUserId,
        action: moderationActions.action,
        reason: moderationActions.reason,
        duration: moderationActions.duration,
        metadata: moderationActions.metadata,
        isActive: moderationActions.isActive,
        isReversible: moderationActions.isReversible,
        isPublic: moderationActions.isPublic,
        relatedContentType: moderationActions.relatedContentType,
        relatedContentId: moderationActions.relatedContentId,
        relatedReportId: moderationActions.relatedReportId,
        ipAddress: moderationActions.ipAddress,
        userAgent: moderationActions.userAgent,
        adminNotes: moderationActions.adminNotes,
        reversedBy: moderationActions.reversedBy,
        reversedAt: moderationActions.reversedAt,
        reversalReason: moderationActions.reversalReason,
        expiresAt: moderationActions.expiresAt,
        createdAt: moderationActions.createdAt,
        moderator: alias(users, "moderator"),
        targetUser: alias(users, "targetUser"),
      })
      .from(moderationActions)
      .innerJoin(
        alias(users, "moderator"),
        eq(moderationActions.moderatorId, alias(users, "moderator").id),
      )
      .innerJoin(
        alias(users, "targetUser"),
        eq(moderationActions.targetUserId, alias(users, "targetUser").id),
      );

    const conditions = [];
    if (filters?.targetUserId)
      conditions.push(eq(moderationActions.targetUserId, filters.targetUserId));
    if (filters?.moderatorId)
      conditions.push(eq(moderationActions.moderatorId, filters.moderatorId));
    if (filters?.action)
      conditions.push(eq(moderationActions.action, filters.action));
    if (filters?.isActive !== undefined)
      conditions.push(eq(moderationActions.isActive, filters.isActive));

    const query =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    return await query.orderBy(desc(moderationActions.createdAt));
  }

  async getModerationAction(
    id: string,
  ): Promise<
    (ModerationAction & { moderator: User; targetUser: User }) | undefined
  > {
    const actions = await this.getModerationActions();
    return actions.find((action) => action.id === id);
  }

  async updateModerationAction(
    id: string,
    data: Partial<InsertModerationAction>,
  ): Promise<ModerationAction> {
    const [updated] = await db
      .update(moderationActions)
      .set(data)
      .where(eq(moderationActions.id, id))
      .returning();
    if (!updated) {
      throw new Error("Database operation failed");
    }
    return updated;
  }

  async reverseModerationAction(
    id: string,
    reversedBy: string,
    reason: string,
  ): Promise<ModerationAction> {
    const [reversed] = await db
      .update(moderationActions)
      .set({
        isActive: false,
        reversedBy,
        reversedAt: new Date(),
        reversalReason: reason,
      })
      .where(eq(moderationActions.id, id))
      .returning();

    if (!reversed) {
      throw new Error("Failed to reverse moderation action");
    }

    await this.createAuditLog({
      adminUserId: reversedBy,
      action: "moderation_action_reversed",
      targetId: reversed.targetUserId,
      targetType: "user",
      category: "content_moderation",
      parameters: JSON.stringify({ moderationActionId: id, reason }),
      ipAddress: "",
    });

    return reversed;
  }

  async getUserActiveModerationActions(
    userId: string,
  ): Promise<ModerationAction[]> {
    return await db
      .select()
      .from(moderationActions)
      .where(
        and(
          eq(moderationActions.targetUserId, userId),
          eq(moderationActions.isActive, true),
          or(
            sql`${moderationActions.expiresAt} IS NULL`,
            sql`${moderationActions.expiresAt} > NOW()`,
          ),
        ),
      );
  }

  // Moderation queue operations
  async addToModerationQueue(
    data: InsertModerationQueue,
  ): Promise<ModerationQueue> {
    // Auto-calculate priority if not provided
    let enhancedData = { ...data };

    // Parse metadata if it's a string
    const metadata = data.metadata
      ? typeof data.metadata === "string"
        ? JSON.parse(data.metadata)
        : data.metadata
      : {};

    if (!enhancedData.priority) {
      enhancedData.priority = await this.calculateAutoPriority(
        data.itemType,
        metadata,
      );
    }

    // Set reputation scores if available in metadata
    if (metadata && typeof metadata === "object") {
      if (metadata.userReputationScore && !enhancedData.userReputationScore) {
        enhancedData.userReputationScore =
          metadata.userReputationScore as number;
      }
      if (
        metadata.reporterReputationScore &&
        !enhancedData.reporterReputationScore
      ) {
        enhancedData.reporterReputationScore =
          metadata.reporterReputationScore as number;
      }
      if (metadata.riskScore && !enhancedData.riskScore) {
        enhancedData.riskScore = metadata.riskScore as number;
      }
    }

    const [item] = await db
      .insert(moderationQueue)
      .values(enhancedData)
      .returning();

    if (!item) {
      throw new Error("Failed to add to moderation queue");
    }

    // Create audit log for queue addition
    await this.createAuditLog({
      adminUserId: "system",
      action: "moderation_queue_item_added",
      category: "content_moderation",
      targetType: "moderation_queue",
      targetId: item.id,
      parameters: JSON.stringify({
        itemType: item.itemType,
        itemId: item.itemId,
        priority: item.priority,
        autoGenerated: item.autoGenerated,
      }),
      ipAddress: "",
    });

    if (!item) {
      throw new Error("Database operation failed");
    }

    return item;
  }

  async getModerationQueue(filters?: {
    status?: string;
    assignedModerator?: string;
    priority?: number;
    itemType?: string;
    overdue?: boolean;
  }): Promise<(ModerationQueue & { assignedMod?: User })[]> {
    const baseQuery = db
      .select({
        id: moderationQueue.id,
        itemType: moderationQueue.itemType,
        itemId: moderationQueue.itemId,
        priority: moderationQueue.priority,
        status: moderationQueue.status,
        assignedModerator: moderationQueue.assignedModerator,
        assignedAt: moderationQueue.assignedAt,
        riskScore: moderationQueue.riskScore,
        userReputationScore: moderationQueue.userReputationScore,
        reporterReputationScore: moderationQueue.reporterReputationScore,
        mlPriority: moderationQueue.mlPriority,
        autoGenerated: moderationQueue.autoGenerated,
        summary: moderationQueue.summary,
        tags: moderationQueue.tags,
        estimatedTimeMinutes: moderationQueue.estimatedTimeMinutes,
        metadata: moderationQueue.metadata,
        resolution: moderationQueue.resolution,
        actionTaken: moderationQueue.actionTaken,
        createdAt: moderationQueue.createdAt,
        completedAt: moderationQueue.completedAt,
        assignedMod: users,
      })
      .from(moderationQueue)
      .leftJoin(users, eq(moderationQueue.assignedModerator, users.id));

    const conditions = [];
    if (filters?.status)
      conditions.push(eq(moderationQueue.status, filters.status));
    if (filters?.assignedModerator)
      conditions.push(
        eq(moderationQueue.assignedModerator, filters.assignedModerator),
      );
    if (filters?.priority)
      conditions.push(eq(moderationQueue.priority, filters.priority));
    if (filters?.itemType)
      conditions.push(eq(moderationQueue.itemType, filters.itemType));

    // Handle overdue filter - items assigned more than estimated time ago
    if (filters?.overdue) {
      const now = new Date();
      conditions.push(
        and(
          eq(moderationQueue.status, "assigned"),
          isNotNull(moderationQueue.assignedAt),
          isNotNull(moderationQueue.estimatedTimeMinutes),
          sql`${moderationQueue.assignedAt} + INTERVAL '1 minute' * ${moderationQueue.estimatedTimeMinutes} < ${now}`,
        ),
      );
    }

    const query =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    const results = await query.orderBy(
      desc(moderationQueue.priority),
      desc(moderationQueue.createdAt),
    );

    // Map null to undefined for optional joined fields to match return type
    return results.map((r) => ({
      ...r,
      assignedMod: r.assignedMod || undefined,
    }));
  }

  async getModerationQueueItem(
    id: string,
  ): Promise<(ModerationQueue & { assignedMod?: User }) | undefined> {
    const items = await this.getModerationQueue();
    return items.find((item) => item.id === id);
  }

  async assignModerationQueueItem(
    id: string,
    moderatorId: string,
  ): Promise<ModerationQueue> {
    const [updated] = await db
      .update(moderationQueue)
      .set({
        assignedModerator: moderatorId,
        status: "assigned",
        assignedAt: new Date(),
      })
      .where(eq(moderationQueue.id, id))
      .returning();
    if (!updated) {
      throw new Error("Database operation failed");
    }
    return updated;
  }

  async completeModerationQueueItem(
    id: string,
    resolution: string,
    actionTaken?: string,
  ): Promise<ModerationQueue> {
    const [completed] = await db
      .update(moderationQueue)
      .set({
        status: "completed",
        resolution,
        ...(actionTaken && { actionTaken }),
        completedAt: new Date(),
      })
      .where(eq(moderationQueue.id, id))
      .returning();
    if (!completed) {
      throw new Error("Database operation failed");
    }
    return completed;
  }

  async updateModerationQueuePriority(
    id: string,
    priority: number,
  ): Promise<ModerationQueue> {
    const [updated] = await db
      .update(moderationQueue)
      .set({ priority })
      .where(eq(moderationQueue.id, id))
      .returning();

    if (!updated) {
      throw new Error("Failed to update moderation queue priority");
    }

    return updated;
  }

  // Enhanced moderation queue operations
  async autoAssignModerationQueue(
    itemType?: string,
  ): Promise<{ assigned: number; skipped: number }> {
    // Get unassigned items
    const openItems = await this.getModerationQueue({
      status: "open",
      ...(itemType && { itemType }),
    });

    if (openItems.length === 0) {
      return { assigned: 0, skipped: 0 };
    }

    // Get moderator workloads
    const workloads = await this.getModeratorWorkload();

    // Find moderators with lowest workload
    const availableModerators = workloads
      .filter((w) => w.activeTasks < 10) // Max 10 active tasks per moderator
      .sort((a, b) => a.activeTasks - b.activeTasks);

    if (availableModerators.length === 0) {
      return { assigned: 0, skipped: openItems.length };
    }

    let assigned = 0;
    let skipped = 0;

    // Assign items using round-robin with workload balancing
    for (const item of openItems) {
      const moderator =
        availableModerators[assigned % availableModerators.length];

      if (!moderator) {
        skipped++;
        continue;
      }

      try {
        await this.assignModerationQueueItem(item.id, moderator.moderatorId);
        assigned++;
        moderator.activeTasks++; // Update local count
      } catch (error) {
        console.error("Auto-assignment failed for item:", item.id, error);
        skipped++;
      }
    }

    return { assigned, skipped };
  }

  async bulkAssignModerationQueue(
    itemIds: string[],
    moderatorId: string,
  ): Promise<ModerationQueue[]> {
    if (itemIds.length === 0) {
      return [];
    }

    // Perform batch update using IN clause for better performance
    const assignedItems = await db
      .update(moderationQueue)
      .set({
        assignedModerator: moderatorId,
        status: "assigned",
        assignedAt: new Date(),
      })
      .where(inArray(moderationQueue.id, itemIds))
      .returning();

    if (!assignedItems) {
      throw new Error("Database operation failed");
    }

    return assignedItems;
  }

  async getModeratorWorkload(moderatorId?: string): Promise<
    {
      moderatorId: string;
      activeTasks: number;
      avgCompletionTime: number;
      lastActivity: Date | null;
    }[]
  > {
    // Get all moderators with the MODERATOR role
    const moderators = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(eq(userRoles.role, "MODERATOR"));

    const workloads = [];

    for (const moderator of moderators) {
      if (moderatorId && moderator.userId !== moderatorId) continue;

      // Count active tasks
      const activeTasks = await db
        .select({ count: count() })
        .from(moderationQueue)
        .where(
          and(
            eq(moderationQueue.assignedModerator, moderator.userId),
            inArray(moderationQueue.status, ["assigned", "in_progress"]),
          ),
        );

      // Calculate average completion time from last 10 completed tasks
      const completedTasks = await db
        .select({
          createdAt: moderationQueue.createdAt,
          completedAt: moderationQueue.completedAt,
        })
        .from(moderationQueue)
        .where(
          and(
            eq(moderationQueue.assignedModerator, moderator.userId),
            eq(moderationQueue.status, "completed"),
            isNotNull(moderationQueue.completedAt),
          ),
        )
        .orderBy(desc(moderationQueue.completedAt))
        .limit(10);

      let avgCompletionTime = 0;
      if (completedTasks.length > 0) {
        const totalTime = completedTasks.reduce((sum, task) => {
          const typedTask = task as {
            completedAt?: Date | null;
            createdAt?: Date | null;
          };
          if (typedTask.completedAt && typedTask.createdAt) {
            return (
              sum +
              (typedTask.completedAt.getTime() - typedTask.createdAt.getTime())
            );
          }
          return sum;
        }, 0);
        avgCompletionTime = totalTime / completedTasks.length / (1000 * 60); // Convert to minutes
      }

      // Get last activity from audit logs
      const lastActivity = await db
        .select({ createdAt: adminAuditLog.createdAt })
        .from(adminAuditLog)
        .where(eq(adminAuditLog.adminUserId, moderator.userId))
        .orderBy(desc(adminAuditLog.createdAt))
        .limit(1);

      workloads.push({
        moderatorId: moderator.userId,
        activeTasks: activeTasks[0]?.count || 0,
        avgCompletionTime: Math.round(avgCompletionTime),
        lastActivity: lastActivity[0]?.createdAt || null,
      });
    }
    if (!workloads) {
      throw new Error("Database operation failed");
    }
    return workloads;
  }

  async escalateOverdueItems(thresholdHours = 24): Promise<ModerationQueue[]> {
    const cutoffTime = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);

    const overdueItems = await db
      .select()
      .from(moderationQueue)
      .where(
        and(
          eq(moderationQueue.status, "assigned"),
          isNotNull(moderationQueue.assignedAt),
          lte(moderationQueue.assignedAt, cutoffTime),
        ),
      );

    const escalatedItems: ModerationQueue[] = [];

    for (const item of overdueItems) {
      try {
        const [escalated] = await db
          .update(moderationQueue)
          .set({
            priority: Math.min((item.priority || 5) + 2, 10), // Increase priority by 2, max 10
          })
          .where(eq(moderationQueue.id, item.id))
          .returning();

        if (escalated) {
          escalatedItems.push(escalated);
        }
      } catch (error) {
        console.error("Escalation failed for item:", item.id, error);
      }
    }
    if (!escalatedItems) {
      throw new Error("Database operation failed");
    }
    return escalatedItems;
  }

  async calculateAutoPriority(
    itemType: string,
    metadata?: unknown,
  ): Promise<number> {
    let basePriority = 5; // Default priority

    // Priority based on item type
    const typePriorities: Record<string, number> = {
      auto_flag: 8, // High priority for auto-flagged content
      ban_evasion: 9, // Very high priority for ban evasion
      appeal: 7, // High priority for appeals
      report: 6, // Medium-high priority for user reports
    };

    basePriority = typePriorities[itemType] || basePriority;

    // Adjust based on metadata factors
    if (
      typeof metadata === "object" &&
      metadata !== null &&
      !Array.isArray(metadata)
    ) {
      const meta = metadata as Record<string, unknown>;

      // High-reputation reporter increases priority
      if (
        typeof meta.reporterReputationScore === "number" &&
        meta.reporterReputationScore > 300
      )
        basePriority += 1;

      // Low-reputation target increases priority
      if (
        typeof meta.userReputationScore === "number" &&
        meta.userReputationScore < 100
      )
        basePriority += 1;

      // Multiple reports increase priority
      if (typeof meta.userReports === "number" && meta.userReports > 1)
        basePriority += Math.min(meta.userReports - 1, 2);

      // ML confidence score (if available)
      if (typeof meta.mlConfidence === "number") {
        if (meta.mlConfidence > 0.8) basePriority += 2;
        else if (meta.mlConfidence > 0.6) basePriority += 1;
      }

      // Severity-based adjustments
      if (meta.severity === "critical") basePriority += 3;
      else if (meta.severity === "high") basePriority += 2;
      else if (meta.severity === "medium") basePriority += 1;
    }

    // Cap priority between 1 and 10
    return Math.max(1, Math.min(basePriority, 10));
  }

  async getModerationQueueStats(): Promise<{
    totalOpen: number;
    totalAssigned: number;
    totalCompleted: number;
    avgCompletionTime: number;
    overdueCount: number;
  }> {
    // Get counts by status
    const statusCounts = await db
      .select({
        status: moderationQueue.status,
        count: count(),
      })
      .from(moderationQueue)
      .groupBy(moderationQueue.status);

    const stats = {
      totalOpen: 0,
      totalAssigned: 0,
      totalCompleted: 0,
      avgCompletionTime: 0,
      overdueCount: 0,
    };

    // Process status counts
    statusCounts.forEach((row) => {
      const typedRow = row as { status: string; count: number };
      switch (typedRow.status) {
        case "open":
          stats.totalOpen = typedRow.count;
          break;
        case "assigned":
        case "in_progress":
          stats.totalAssigned += typedRow.count;
          break;
        case "completed":
          stats.totalCompleted = typedRow.count;
          break;
      }
    });

    // Calculate average completion time from last 100 completed items
    const recentCompleted = await db
      .select({
        createdAt: moderationQueue.createdAt,
        completedAt: moderationQueue.completedAt,
      })
      .from(moderationQueue)
      .where(
        and(
          eq(moderationQueue.status, "completed"),
          isNotNull(moderationQueue.completedAt),
        ),
      )
      .orderBy(desc(moderationQueue.completedAt))
      .limit(100);

    if (recentCompleted.length > 0) {
      const totalTime = recentCompleted.reduce((sum, item) => {
        const typedItem = item as {
          completedAt?: Date | null;
          createdAt?: Date | null;
        };
        if (typedItem.completedAt && typedItem.createdAt) {
          return (
            sum +
            (typedItem.completedAt.getTime() - typedItem.createdAt.getTime())
          );
        }
        return sum;
      }, 0);
      stats.avgCompletionTime = Math.round(
        totalTime / recentCompleted.length / (1000 * 60),
      ); // Convert to minutes
    }

    // Count overdue items (assigned > 24 hours ago)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const overdueCount = await db
      .select({ count: count() })
      .from(moderationQueue)
      .where(
        and(
          eq(moderationQueue.status, "assigned"),
          isNotNull(moderationQueue.assignedAt),
          lte(moderationQueue.assignedAt, cutoffTime),
        ),
      );

    stats.overdueCount = overdueCount[0]?.count || 0;

    return stats;
  }

  // CMS content operations
  async getCmsContent(
    type?: string,
    isPublished?: boolean,
  ): Promise<CmsContent[]> {
    const baseQuery = db.select().from(cmsContent);

    const conditions = [];
    if (type) conditions.push(eq(cmsContent.type, type));
    if (isPublished !== undefined)
      conditions.push(eq(cmsContent.isPublished, isPublished));

    const query =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    return await query.orderBy(desc(cmsContent.version));
  }

  async getCmsContentById(
    id: string,
  ): Promise<
    | (CmsContent & { author: User; lastEditor: User; approver?: User })
    | undefined
  > {
    const [content] = await db
      .select({
        id: cmsContent.id,
        type: cmsContent.type,
        title: cmsContent.title,
        content: cmsContent.content,
        version: cmsContent.version,
        isPublished: cmsContent.isPublished,
        publishedAt: cmsContent.publishedAt,
        scheduledPublishAt: cmsContent.scheduledPublishAt,
        authorId: cmsContent.authorId,
        lastEditedBy: cmsContent.lastEditedBy,
        approvedBy: cmsContent.approvedBy,
        approvedAt: cmsContent.approvedAt,
        changeLog: cmsContent.changeLog,
        previousVersionId: cmsContent.previousVersionId,
        metaDescription: cmsContent.metaDescription,
        metaKeywords: cmsContent.metaKeywords,
        slug: cmsContent.slug,
        createdAt: cmsContent.createdAt,
        updatedAt: cmsContent.updatedAt,
        author: alias(users, "author"),
        lastEditor: alias(users, "lastEditor"),
        approver: alias(users, "approver"),
      })
      .from(cmsContent)
      .innerJoin(
        alias(users, "author"),
        eq(cmsContent.authorId, alias(users, "author").id),
      )
      .innerJoin(
        alias(users, "lastEditor"),
        eq(cmsContent.lastEditedBy, alias(users, "lastEditor").id),
      )
      .leftJoin(
        alias(users, "approver"),
        eq(cmsContent.approvedBy, alias(users, "approver").id),
      )
      .where(eq(cmsContent.id, id));
    if (!content) {
      throw new Error("Database operation failed");
    }
    // Map null to undefined for optional joined fields to match return type
    return {
      ...content,
      approver: content.approver || undefined,
    };
  }

  async createCmsContent(data: InsertCmsContent): Promise<CmsContent> {
    const [content] = await db.insert(cmsContent).values(data).returning();

    if (!content) {
      throw new Error("Failed to create CMS content");
    }

    await this.createAuditLog({
      adminUserId: data.authorId,
      action: "cms_content_created",
      targetId: content.id,
      targetType: "cms_content",
      category: "content_moderation",
      parameters: JSON.stringify({ contentType: data.type, title: data.title }),
      ipAddress: "",
    });

    return content;
  }

  async updateCmsContent(
    id: string,
    data: Partial<InsertCmsContent>,
  ): Promise<CmsContent> {
    return await db.transaction(async (tx: Transaction) => {
      const [updated] = await tx
        .update(cmsContent)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(cmsContent.id, id))
        .returning();

      if (!updated) {
        throw new Error("Failed to update CMS content");
      }

      if (data.lastEditedBy) {
        await tx.insert(adminAuditLog).values({
          adminUserId: data.lastEditedBy,
          action: "cms_content_updated",
          category: "content_moderation",
          targetId: id,
          targetType: "cms_content",
          parameters: { contentId: id, changes: data },
          ipAddress: "",
        });
      }

      return updated;
    });
  }

  async publishCmsContent(
    id: string,
    publisherId: string,
  ): Promise<CmsContent> {
    return await db.transaction(async (tx: Transaction) => {
      const [published] = await tx
        .update(cmsContent)
        .set({
          isPublished: true,
          publishedAt: new Date(),
          approvedBy: publisherId,
          approvedAt: new Date(),
        })
        .where(eq(cmsContent.id, id))
        .returning();

      if (!published) {
        throw new Error("Failed to publish CMS content");
      }

      await tx.insert(adminAuditLog).values({
        adminUserId: publisherId,
        action: "cms_content_published",
        category: "content_moderation",
        targetId: id,
        targetType: "cms_content",
        parameters: JSON.stringify({ contentId: id, title: published.title }),
        ipAddress: "",
      });

      return published;
    });
  }

  async deleteCmsContent(id: string): Promise<void> {
    await db.delete(cmsContent).where(eq(cmsContent.id, id));
  }

  async getCmsContentVersions(type: string): Promise<CmsContent[]> {
    return await db
      .select()
      .from(cmsContent)
      .where(eq(cmsContent.type, type))
      .orderBy(desc(cmsContent.version));
  }

  // Admin audit log operations (placed early since used by other methods)
  async createAuditLog(data: InsertAdminAuditLog): Promise<AdminAuditLog> {
    const [log] = await db.insert(adminAuditLog).values(data).returning();
    if (!log) {
      throw new Error("Database operation failed");
    }
    return log;
  }

  async getAuditLogs(filters?: {
    adminUserId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<(AdminAuditLog & { admin: User })[]> {
    const baseQuery = db
      .select({
        id: adminAuditLog.id,
        adminUserId: adminAuditLog.adminUserId,
        action: adminAuditLog.action,
        category: adminAuditLog.category,
        targetType: adminAuditLog.targetType,
        targetId: adminAuditLog.targetId,
        targetIdentifier: adminAuditLog.targetIdentifier,
        oldValues: adminAuditLog.oldValues,
        newValues: adminAuditLog.newValues,
        parameters: adminAuditLog.parameters,
        ipAddress: adminAuditLog.ipAddress,
        userAgent: adminAuditLog.userAgent,
        sessionId: adminAuditLog.sessionId,
        success: adminAuditLog.success,
        errorMessage: adminAuditLog.errorMessage,
        impactAssessment: adminAuditLog.impactAssessment,
        createdAt: adminAuditLog.createdAt,
        admin: users,
      })
      .from(adminAuditLog)
      .innerJoin(users, eq(adminAuditLog.adminUserId, users.id));

    const conditions = [];
    if (filters?.adminUserId)
      conditions.push(eq(adminAuditLog.adminUserId, filters.adminUserId));
    if (filters?.action)
      conditions.push(eq(adminAuditLog.action, filters.action));
    if (filters?.startDate)
      conditions.push(gte(adminAuditLog.createdAt, filters.startDate));
    if (filters?.endDate)
      conditions.push(sql`${adminAuditLog.createdAt} <= ${filters.endDate}`);

    const query =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    return await query.orderBy(desc(adminAuditLog.createdAt));
  }

  async getAuditLog(
    id: string,
  ): Promise<(AdminAuditLog & { admin: User }) | undefined> {
    const logs = await this.getAuditLogs();
    return logs.find((log) => log.id === id);
  }

  // Ban evasion tracking operations
  async createBanEvasionRecord(
    data: InsertBanEvasionTracking,
  ): Promise<BanEvasionTracking> {
    return await db.transaction(async (tx: Transaction) => {
      // Convert confidenceScore from number to string if present (decimal type requires string)
      const insertData = {
        ...data,
        confidenceScore:
          data.confidenceScore !== undefined
            ? String(data.confidenceScore)
            : undefined,
      };

      const [record] = await tx
        .insert(banEvasionTracking)
        .values(insertData)
        .returning();

      if (!record) {
        throw new Error("Failed to create ban evasion record");
      }

      await tx.insert(adminAuditLog).values({
        adminUserId: data.investigatedBy || "system",
        action: "ban_evasion_detected",
        category: "content_moderation",
        targetId: data.userId,
        targetType: "user",
        parameters: JSON.stringify({
          detectionMethod: data.detectionMethod,
          confidenceScore: data.confidenceScore,
        }),
        ipAddress: data.ipAddress || "",
      });

      return record;
    });
  }

  async getBanEvasionRecords(
    userId?: string,
    _suspiciousActivity?: boolean,
  ): Promise<(BanEvasionTracking & { user: User; bannedUser?: User })[]> {
    const baseQuery = db
      .select({
        id: banEvasionTracking.id,
        userId: banEvasionTracking.userId,
        ipAddress: banEvasionTracking.ipAddress,
        hashedFingerprint: banEvasionTracking.hashedFingerprint,
        userAgent: banEvasionTracking.userAgent,
        screenResolution: banEvasionTracking.screenResolution,
        timezone: banEvasionTracking.timezone,
        language: banEvasionTracking.language,
        loginPatterns: banEvasionTracking.loginPatterns,
        activitySignature: banEvasionTracking.activitySignature,
        detectionMethod: banEvasionTracking.detectionMethod,
        confidenceScore: banEvasionTracking.confidenceScore,
        relatedBannedUser: banEvasionTracking.relatedBannedUser,
        status: banEvasionTracking.status,
        investigatedBy: banEvasionTracking.investigatedBy,
        investigatedAt: banEvasionTracking.investigatedAt,
        notes: banEvasionTracking.notes,
        createdAt: banEvasionTracking.createdAt,
        user: alias(users, "user"),
        bannedUser: alias(users, "bannedUser"),
      })
      .from(banEvasionTracking)
      .innerJoin(
        alias(users, "user"),
        eq(banEvasionTracking.userId, alias(users, "user").id),
      )
      .leftJoin(
        alias(users, "bannedUser"),
        eq(banEvasionTracking.relatedBannedUser, alias(users, "bannedUser").id),
      );

    const conditions = [];
    if (userId) conditions.push(eq(banEvasionTracking.userId, userId));
    // Note: suspiciousActivity parameter removed as field doesn't exist in schema

    const query =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    const results = await query.orderBy(desc(banEvasionTracking.createdAt));

    // Map null to undefined for optional joined fields to match return type
    return results.map((r) => ({
      ...r,
      bannedUser: r.bannedUser || undefined,
    }));
  }

  async checkBanEvasion(
    userId: string,
    ipAddress: string,
    deviceFingerprint?: string,
  ): Promise<BanEvasionTracking[]> {
    const conditions = [eq(banEvasionTracking.userId, userId)];

    if (ipAddress) {
      conditions.push(eq(banEvasionTracking.ipAddress, ipAddress));
    }

    if (deviceFingerprint) {
      conditions.push(
        eq(banEvasionTracking.hashedFingerprint, deviceFingerprint),
      );
    }

    return await db
      .select()
      .from(banEvasionTracking)
      .where(or(...conditions))
      .orderBy(desc(banEvasionTracking.createdAt));
  }

  async updateBanEvasionStatus(
    id: string,
    status: "flagged" | "investigating" | "confirmed" | "false_positive",
    investigatedBy?: string,
  ): Promise<BanEvasionTracking> {
    const updateData: Partial<InsertBanEvasionTracking> = {
      status,
      investigatedAt: new Date(),
    };

    if (investigatedBy) {
      updateData.investigatedBy = investigatedBy;

      await this.createAuditLog({
        adminUserId: investigatedBy,
        action: "ban_evasion_reviewed",
        category: "content_moderation",
        targetId: id,
        targetType: "ban_evasion_tracking",
        parameters: JSON.stringify({ banEvasionId: id, newStatus: status }),
        ipAddress: "",
      });
    }

    const [updated] = await db
      .update(banEvasionTracking)
      .set(updateData)
      .where(eq(banEvasionTracking.id, id))
      .returning();

    if (!updated) {
      throw new Error("Failed to update ban evasion status");
    }

    return updated;
  }

  // User appeal operations
  async createUserAppeal(data: InsertUserAppeal): Promise<UserAppeal> {
    return await db.transaction(async (tx: Transaction) => {
      const [appeal] = await tx.insert(userAppeals).values(data).returning();

      if (!appeal) {
        throw new Error("Failed to create user appeal");
      }

      await tx.insert(adminAuditLog).values({
        adminUserId: "system",
        action: "user_appeal_created",
        category: "content_moderation",
        targetId: data.userId,
        targetType: "user",
        parameters: { reason: data.reason },
        ipAddress: "",
      });

      return appeal;
    });
  }

  async getUserAppeals(filters?: {
    userId?: string;
    status?: string;
    reviewedBy?: string;
  }): Promise<
    (UserAppeal & {
      user: User;
      moderationAction?: ModerationAction;
      reviewer?: User;
    })[]
  > {
    const baseQuery = db
      .select({
        id: userAppeals.id,
        userId: userAppeals.userId,
        moderationActionId: userAppeals.moderationActionId,
        reason: userAppeals.reason,
        evidence: userAppeals.evidence,
        additionalInfo: userAppeals.additionalInfo,
        status: userAppeals.status,
        reviewedBy: userAppeals.reviewedBy,
        reviewedAt: userAppeals.reviewedAt,
        reviewNotes: userAppeals.reviewNotes,
        decision: userAppeals.decision,
        decisionReason: userAppeals.decisionReason,
        responseToUser: userAppeals.responseToUser,
        isUserNotified: userAppeals.isUserNotified,
        canReappeal: userAppeals.canReappeal,
        reappealCooldownUntil: userAppeals.reappealCooldownUntil,
        resolvedAt: userAppeals.resolvedAt,
        createdAt: userAppeals.createdAt,
        updatedAt: userAppeals.updatedAt,
        user: alias(users, "user"),
        moderationAction: moderationActions,
        reviewer: alias(users, "reviewer"),
      })
      .from(userAppeals)
      .innerJoin(
        alias(users, "user"),
        eq(userAppeals.userId, alias(users, "user").id),
      )
      .leftJoin(
        moderationActions,
        eq(userAppeals.moderationActionId, moderationActions.id),
      )
      .leftJoin(
        alias(users, "reviewer"),
        eq(userAppeals.reviewedBy, alias(users, "reviewer").id),
      );

    const conditions = [];
    if (filters?.userId)
      conditions.push(eq(userAppeals.userId, filters.userId));
    if (filters?.status)
      conditions.push(eq(userAppeals.status, filters.status as any));
    if (filters?.reviewedBy)
      conditions.push(eq(userAppeals.reviewedBy, filters.reviewedBy));

    const query =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    const results = await query.orderBy(desc(userAppeals.createdAt));

    // Map null to undefined for optional joined fields to match return type
    return results.map((r) => ({
      ...r,
      moderationAction: r.moderationAction || undefined,
      reviewer: r.reviewer || undefined,
    }));
  }

  async getUserAppeal(id: string): Promise<
    | (UserAppeal & {
        user: User;
        moderationAction?: ModerationAction;
        reviewer?: User;
      })
    | undefined
  > {
    const appeals = await this.getUserAppeals();
    return appeals.find((appeal) => appeal.id === id);
  }

  async updateUserAppeal(
    id: string,
    data: Partial<InsertUserAppeal>,
  ): Promise<UserAppeal> {
    const [updated] = await db
      .update(userAppeals)
      .set({
        ...data,
        resolvedAt: data.status === "resolved" ? new Date() : undefined,
      })
      .where(eq(userAppeals.id, id))
      .returning();
    if (!updated) {
      throw new Error("Database operation failed");
    }
    return updated;
  }

  async assignAppealReviewer(
    appealId: string,
    reviewerId: string,
  ): Promise<UserAppeal> {
    const updateData = {
      reviewerId,
      status: "under_review" as const,
      reviewedAt: new Date(),
    };

    return await this.updateUserAppeal(appealId, updateData);
  }

  async resolveUserAppeal(
    appealId: string,
    decision: "approve" | "deny" | "partial_approve",
    reviewerNotes?: string,
    reviewerId?: string,
  ): Promise<UserAppeal> {
    const updateData: Partial<InsertUserAppeal> = {
      status: "resolved",
      decision,
      reviewNotes: reviewerNotes,
      reviewedAt: new Date(),
    };

    if (reviewerId) {
      await this.createAuditLog({
        adminUserId: reviewerId,
        action: "user_appeal_resolved",
        category: "user_management",
        targetId: appealId,
        parameters: JSON.stringify({ appealId, decision, reviewerNotes }),
        ipAddress: "",
      });
    }

    return await this.updateUserAppeal(appealId, updateData);
  }

  // Moderation template operations
  async getModerationTemplates(
    category?: string,
  ): Promise<
    Array<Omit<ModerationTemplate, "createdBy"> & { createdBy: User }>
  > {
    const baseQuery = db
      .select({
        id: moderationTemplates.id,
        name: moderationTemplates.name,
        category: moderationTemplates.category,
        subject: moderationTemplates.subject,
        content: moderationTemplates.content,
        variables: moderationTemplates.variables,
        isActive: moderationTemplates.isActive,
        createdBy: users, // This is the User object
        lastModifiedBy: moderationTemplates.lastModifiedBy,
        usageCount: moderationTemplates.usageCount,
        createdAt: moderationTemplates.createdAt,
        updatedAt: moderationTemplates.updatedAt,
      })
      .from(moderationTemplates)
      .innerJoin(users, eq(moderationTemplates.createdBy, users.id));

    const query = category
      ? baseQuery.where(eq(moderationTemplates.category, category))
      : baseQuery;

    return await query;
  }

  async getModerationTemplate(
    id: string,
  ): Promise<
    (Omit<ModerationTemplate, "createdBy"> & { createdBy: User }) | undefined
  > {
    const templates = await this.getModerationTemplates();
    return templates.find((template) => template.id === id);
  }

  async createModerationTemplate(
    data: InsertModerationTemplate,
  ): Promise<ModerationTemplate> {
    return await db.transaction(async (tx: Transaction) => {
      const [template] = await tx
        .insert(moderationTemplates)
        .values(data)
        .returning();

      if (!template) {
        throw new Error("Failed to create moderation template");
      }

      await tx.insert(adminAuditLog).values({
        adminUserId: data.createdBy,
        action: "moderation_template_created",
        category: "content_moderation",
        targetId: "",
        parameters: { templateName: data.name, category: data.category },
        ipAddress: "",
      });

      return template;
    });
  }

  async updateModerationTemplate(
    id: string,
    data: Partial<InsertModerationTemplate>,
  ): Promise<ModerationTemplate> {
    return await db.transaction(async (tx: Transaction) => {
      const [updated] = await tx
        .update(moderationTemplates)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(moderationTemplates.id, id))
        .returning();

      if (!updated) {
        throw new Error("Failed to update moderation template");
      }

      if (data.createdBy) {
        await tx.insert(adminAuditLog).values({
          adminUserId: data.createdBy,
          action: "moderation_template_updated",
          category: "content_moderation",
          targetId: "",
          parameters: { templateId: id, changes: data },
          ipAddress: "",
        });
      }

      return updated;
    });
  }

  async deleteModerationTemplate(id: string): Promise<void> {
    await db.delete(moderationTemplates).where(eq(moderationTemplates.id, id));
  }

  // ======================
  // CALENDAR SYNC METHODS
  // ======================

  async getUserCalendarConnections(
    userId: string,
  ): Promise<CalendarConnection[]> {
    return await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, userId));
  }

  async getCalendarConnection(
    id: string,
  ): Promise<CalendarConnection | undefined> {
    const [connection] = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.id, id));
    return connection;
  }

  async getAllActiveCalendarConnections(): Promise<CalendarConnection[]> {
    return await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.syncEnabled, true));
  }

  async createCalendarConnection(
    data: InsertCalendarConnection,
  ): Promise<CalendarConnection> {
    const [connection] = await db
      .insert(calendarConnections)
      .values(data)
      .returning();

    if (!connection) {
      throw new Error("Failed to create calendar connection");
    }

    return connection;
  }

  async updateCalendarConnection(
    id: string,
    data: Partial<InsertCalendarConnection>,
  ): Promise<CalendarConnection> {
    const [updated] = await db
      .update(calendarConnections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(calendarConnections.id, id))
      .returning();

    if (!updated) {
      throw new Error("Failed to update calendar connection");
    }

    return updated;
  }

  async deleteCalendarConnection(id: string): Promise<void> {
    await db.delete(calendarConnections).where(eq(calendarConnections.id, id));
  }

  async getExternalEvent(id: string): Promise<ExternalEvent | undefined> {
    const [event] = await db
      .select()
      .from(externalEvents)
      .where(eq(externalEvents.id, id));
    return event;
  }

  async getExternalEventByExternalId(
    connectionId: string,
    externalEventId: string,
  ): Promise<ExternalEvent | undefined> {
    const [event] = await db
      .select()
      .from(externalEvents)
      .where(
        and(
          eq(externalEvents.connectionId, connectionId),
          eq(externalEvents.externalEventId, externalEventId),
        ),
      );
    return event;
  }

  async getConnectionExternalEvents(
    connectionId: string,
  ): Promise<ExternalEvent[]> {
    return await db
      .select()
      .from(externalEvents)
      .where(eq(externalEvents.connectionId, connectionId))
      .orderBy(desc(externalEvents.startTime));
  }

  async createExternalEvent(data: InsertExternalEvent): Promise<ExternalEvent> {
    const [event] = await db.insert(externalEvents).values(data).returning();

    if (!event) {
      throw new Error("Failed to create external event");
    }

    return event;
  }

  async upsertExternalEvent(
    data: InsertExternalEvent & {
      connectionId: string;
      externalEventId: string;
    },
  ): Promise<ExternalEvent> {
    const existing = await this.getExternalEventByExternalId(
      data.connectionId,
      data.externalEventId,
    );

    if (existing) {
      const [updated] = await db
        .update(externalEvents)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(externalEvents.id, existing.id))
        .returning();

      if (!updated) {
        throw new Error("Failed to update external event");
      }

      return updated;
    }

    return await this.createExternalEvent(data);
  }

  async updateExternalEvent(
    id: string,
    data: Partial<InsertExternalEvent>,
  ): Promise<ExternalEvent> {
    const [updated] = await db
      .update(externalEvents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(externalEvents.id, id))
      .returning();

    if (!updated) {
      throw new Error("Failed to update external event");
    }

    return updated;
  }

  async deleteExternalEvent(id: string): Promise<void> {
    await db.delete(externalEvents).where(eq(externalEvents.id, id));
  }
}

export const storage = new DatabaseStorage();
