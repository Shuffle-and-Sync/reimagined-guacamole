import { sql } from 'drizzle-orm';
import {
  index,
  sqliteTable,
  text,
  integer,
  real,
  unique,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// SQLite Schema - Migrated from PostgreSQL
// Note: SQLite doesn't support native enums. TEXT fields with validation are used instead.
// Default timestamp values use INTEGER (Unix timestamp). Application layer handles conversions.

// ======================
// AUTH.JS TABLES
// ======================

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    unique().on(table.provider, table.providerAccountId),
  ]
);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: 'timestamp' }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: integer("expires", { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    unique().on(table.identifier, table.token),
  ]
);

// ======================
// CORE USER TABLES
// ======================

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  primaryCommunity: text("primary_community"),
  username: text("username"),
  bio: text("bio"),
  location: text("location"),
  website: text("website"),
  status: text("status").default("offline"), // 'online', 'offline', 'away', 'busy', 'gaming'
  statusMessage: text("status_message"),
  timezone: text("timezone"),
  dateOfBirth: text("date_of_birth"),
  isPrivate: integer("is_private", { mode: 'boolean' }).default(0),
  showOnlineStatus: text("show_online_status").default("everyone"), // 'everyone', 'friends_only', 'private'
  allowDirectMessages: text("allow_direct_messages").default("everyone"),
  passwordHash: text("password_hash"),
  isEmailVerified: integer("is_email_verified", { mode: 'boolean' }).default(0),
  emailVerifiedAt: integer("email_verified_at", { mode: 'timestamp' }),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lastFailedLogin: integer("last_failed_login", { mode: 'timestamp' }),
  accountLockedUntil: integer("account_locked_until", { mode: 'timestamp' }),
  passwordChangedAt: integer("password_changed_at", { mode: 'timestamp' }),
  mfaEnabled: integer("mfa_enabled", { mode: 'boolean' }).default(0),
  mfaEnabledAt: integer("mfa_enabled_at", { mode: 'timestamp' }),
  lastLoginAt: integer("last_login_at", { mode: 'timestamp' }),
  lastActiveAt: integer("last_active_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  index("idx_users_email").on(table.email),
  index("idx_users_username").on(table.username),
  index("idx_users_status").on(table.status),
  index("idx_users_primary_community").on(table.primaryCommunity),
  index("idx_users_created_at").on(table.createdAt),
  index("idx_users_last_active").on(table.lastActiveAt),
  index("idx_users_last_login").on(table.lastLoginAt),
  index("idx_users_status_last_active").on(table.status, table.lastActiveAt),
  index("idx_users_community_status").on(table.primaryCommunity, table.status),
]);

export const userPlatformAccounts = sqliteTable("user_platform_accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  handle: text("handle").notNull(),
  platformUserId: text("platform_user_id"),
  channelId: text("channel_id"),
  pageId: text("page_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: integer("token_expires_at", { mode: 'timestamp' }),
  scopes: text("scopes"), // JSON string
  isActive: integer("is_active", { mode: 'boolean' }).default(1),
  lastVerified: integer("last_verified", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  unique().on(table.userId, table.platform),
  index("idx_user_platform_user_id").on(table.userId),
  index("idx_user_platform_platform").on(table.platform),
  index("idx_user_platform_active").on(table.userId, table.isActive),
  index("idx_user_platform_handle").on(table.handle),
  index("idx_user_platform_token_expires").on(table.tokenExpiresAt),
]);

// ======================
// COMMUNITY TABLES
// ======================

export const communities = sqliteTable("communities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  themeColor: text("theme_color").notNull(),
  iconClass: text("icon_class").notNull(),
  isActive: integer("is_active", { mode: 'boolean' }).default(1),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
});

export const userCommunities = sqliteTable("user_communities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  communityId: text("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  isPrimary: integer("is_primary", { mode: 'boolean' }).default(0),
  joinedAt: integer("joined_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  unique("unique_user_community").on(table.userId, table.communityId),
  index("idx_user_communities_user_id").on(table.userId),
  index("idx_user_communities_community_id").on(table.communityId),
  index("idx_user_communities_primary").on(table.userId, table.isPrimary),
]);

export const themePreferences = sqliteTable("theme_preferences", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  communityId: text("community_id").references(() => communities.id),
  themeMode: text("theme_mode").default("dark"),
  customColors: text("custom_colors"), // JSON string
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
});

// ======================
// EVENT & CALENDAR TABLES
// ======================

export const events = sqliteTable("events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'tournament', 'convention', 'release', 'stream', 'community', 'personal', 'game_pod'
  status: text("status").default("active"), // 'active', 'cancelled', 'completed', 'draft'
  startTime: integer("start_time", { mode: 'timestamp' }).notNull(),
  endTime: integer("end_time", { mode: 'timestamp' }),
  location: text("location"),
  isVirtual: integer("is_virtual", { mode: 'boolean' }).default(0),
  maxAttendees: integer("max_attendees"),
  creatorId: text("creator_id").notNull().references(() => users.id),
  hostId: text("host_id").references(() => users.id),
  coHostId: text("co_host_id").references(() => users.id),
  communityId: text("community_id").references(() => communities.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  index("idx_events_creator").on(table.creatorId),
  index("idx_events_community").on(table.communityId),
  index("idx_events_start_time").on(table.startTime),
  index("idx_events_status").on(table.status),
  index("idx_events_type").on(table.type),
]);

export const eventAttendees = sqliteTable("event_attendees", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("attending"), // 'attending', 'maybe', 'not_attending'
  joinedAt: integer("joined_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  unique().on(table.eventId, table.userId),
  index("idx_event_attendees_event").on(table.eventId),
  index("idx_event_attendees_user").on(table.userId),
]);

// ======================
// MESSAGING TABLES
// ======================

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: text("sender_id").notNull().references(() => users.id),
  receiverId: text("receiver_id").references(() => users.id),
  eventId: text("event_id").references(() => events.id),
  content: text("content").notNull(),
  isRead: integer("is_read", { mode: 'boolean' }).default(0),
  readAt: integer("read_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  index("idx_messages_sender").on(table.senderId),
  index("idx_messages_receiver").on(table.receiverId),
  index("idx_messages_event").on(table.eventId),
  index("idx_messages_created").on(table.createdAt),
]);

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'event_join', 'event_leave', 'game_invite', 'message', 'system', etc.
  priority: text("priority").default("normal"), // 'low', 'normal', 'high', 'urgent'
  title: text("title").notNull(),
  message: text("message"),
  data: text("data"), // JSON string
  isRead: integer("is_read", { mode: 'boolean' }).default(0),
  readAt: integer("read_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  index("idx_notifications_user").on(table.userId),
  index("idx_notifications_type").on(table.type),
  index("idx_notifications_read").on(table.isRead),
  index("idx_notifications_created").on(table.createdAt),
]);

// ======================
// GAME SESSION TABLES
// ======================

export const gameSessions = sqliteTable("game_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id").references(() => events.id, { onDelete: "cascade" }),
  gameType: text("game_type").notNull(),
  status: text("status").default("waiting"), // 'waiting', 'active', 'paused', 'completed', 'cancelled'
  maxPlayers: integer("max_players"),
  currentPlayers: integer("current_players").default(0),
  hostId: text("host_id").notNull().references(() => users.id),
  coHostId: text("co_host_id").references(() => users.id),
  boardState: text("board_state"), // JSON string
  startedAt: integer("started_at", { mode: 'timestamp' }),
  endedAt: integer("ended_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  index("idx_game_sessions_event").on(table.eventId),
  index("idx_game_sessions_host").on(table.hostId),
  index("idx_game_sessions_status").on(table.status),
]);

// ======================
// AUTHENTICATION & SECURITY TABLES
// ======================

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: 'timestamp' }).notNull(),
  usedAt: integer("used_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  index("idx_password_reset_token").on(table.token),
  index("idx_password_reset_user").on(table.userId),
]);

export const emailVerificationTokens = sqliteTable("email_verification_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: 'timestamp' }).notNull(),
  verifiedAt: integer("verified_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  index("idx_email_verification_token").on(table.token),
  index("idx_email_verification_user").on(table.userId),
]);

export const userMfaSettings = sqliteTable("user_mfa_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes"), // JSON string array
  enabled: integer("enabled", { mode: 'boolean' }).default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
});

export const authAuditLog = sqliteTable("auth_audit_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  eventType: text("event_type").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isSuccessful: integer("is_successful", { mode: 'boolean' }),
  failureReason: text("failure_reason"),
  details: text("details"), // JSON string
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  index("idx_auth_audit_user").on(table.userId),
  index("idx_auth_audit_event").on(table.eventType),
  index("idx_auth_audit_created").on(table.createdAt),
]);

// ======================
// SOCIAL FEATURES
// ======================

export const friendships = sqliteTable("friendships", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  friendId: text("friend_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("pending"), // 'pending', 'accepted', 'declined', 'blocked'
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
  respondedAt: integer("responded_at", { mode: 'timestamp' }),
}, (table) => [
  unique().on(table.userId, table.friendId),
  index("idx_friendships_user").on(table.userId),
  index("idx_friendships_friend").on(table.friendId),
  index("idx_friendships_status").on(table.status),
]);

export const userActivities = sqliteTable("user_activities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityType: text("activity_type").notNull(),
  description: text("description"),
  metadata: text("metadata"), // JSON string
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  index("idx_user_activities_user").on(table.userId),
  index("idx_user_activities_type").on(table.activityType),
  index("idx_user_activities_created").on(table.createdAt),
]);

// ======================
// TOURNAMENT TABLES
// ======================

export const tournaments = sqliteTable("tournaments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  gameType: text("game_type").notNull(),
  format: text("format").notNull(),
  status: text("status").default("upcoming"), // 'upcoming', 'active', 'completed', 'cancelled'
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),
  prizePool: real("prize_pool"),
  organizerId: text("organizer_id").notNull().references(() => users.id),
  communityId: text("community_id").references(() => communities.id),
  startDate: integer("start_date", { mode: 'timestamp' }).notNull(),
  endDate: integer("end_date", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  index("idx_tournaments_organizer").on(table.organizerId),
  index("idx_tournaments_community").on(table.communityId),
  index("idx_tournaments_status").on(table.status),
  index("idx_tournaments_start_date").on(table.startDate),
]);

export const tournamentParticipants = sqliteTable("tournament_participants", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tournamentId: text("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("registered"), // 'registered', 'active', 'eliminated', 'winner'
  seed: integer("seed"),
  finalRank: integer("final_rank"),
  joinedAt: integer("joined_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  unique().on(table.tournamentId, table.userId),
  index("idx_tournament_participants_tournament").on(table.tournamentId),
  index("idx_tournament_participants_user").on(table.userId),
]);

// ======================
// STREAMING TABLES
// ======================

export const streamSessions = sqliteTable("stream_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("scheduled"), // 'scheduled', 'live', 'ended', 'cancelled'
  streamerId: text("streamer_id").notNull().references(() => users.id),
  eventId: text("event_id").references(() => events.id),
  scheduledStart: integer("scheduled_start", { mode: 'timestamp' }),
  actualStart: integer("actual_start", { mode: 'timestamp' }),
  actualEnd: integer("actual_end", { mode: 'timestamp' }),
  viewerCount: integer("viewer_count").default(0),
  peakViewers: integer("peak_viewers").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
}, (table) => [
  index("idx_stream_sessions_streamer").on(table.streamerId),
  index("idx_stream_sessions_event").on(table.eventId),
  index("idx_stream_sessions_status").on(table.status),
]);

export const collaborationRequests = sqliteTable("collaboration_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromUserId: text("from_user_id").notNull().references(() => users.id),
  toUserId: text("to_user_id").notNull().references(() => users.id),
  eventId: text("event_id").references(() => events.id),
  message: text("message"),
  status: text("status").default("pending"), // 'pending', 'accepted', 'declined', 'expired', 'cancelled'
  expiresAt: integer("expires_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => Date.now()),
  respondedAt: integer("responded_at", { mode: 'timestamp' }),
}, (table) => [
  index("idx_collaboration_requests_from").on(table.fromUserId),
  index("idx_collaboration_requests_to").on(table.toUserId),
  index("idx_collaboration_requests_event").on(table.eventId),
  index("idx_collaboration_requests_status").on(table.status),
]);

// ======================
// RELATIONS
// ======================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  userCommunities: many(userCommunities),
  createdEvents: many(events),
  eventAttendees: many(eventAttendees),
  notifications: many(notifications),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  hostedGameSessions: many(gameSessions),
  sentFriendRequests: many(friendships, { relationName: "sentFriendRequests" }),
  receivedFriendRequests: many(friendships, { relationName: "receivedFriendRequests" }),
  activities: many(userActivities),
  organizedTournaments: many(tournaments),
  tournamentParticipation: many(tournamentParticipants),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const communitiesRelations = relations(communities, ({ many }) => ({
  userCommunities: many(userCommunities),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, { fields: [events.creatorId], references: [users.id] }),
  community: one(communities, { fields: [events.communityId], references: [communities.id] }),
  attendees: many(eventAttendees),
  gameSession: one(gameSessions),
  messages: many(messages),
}));

// ======================
// TYPES & SCHEMAS
// ======================

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type Community = typeof communities.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type StreamSession = typeof streamSessions.$inferSelect;

// Insert schemas with Zod validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  status: z.enum(['online', 'offline', 'away', 'busy', 'gaming']).optional(),
  showOnlineStatus: z.enum(['everyone', 'friends_only', 'private']).optional(),
  allowDirectMessages: z.enum(['everyone', 'friends_only', 'private']).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events, {
  title: z.string().min(1).max(200),
  type: z.enum(['tournament', 'convention', 'release', 'stream', 'community', 'personal', 'game_pod']),
  status: z.enum(['active', 'cancelled', 'completed', 'draft']).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
