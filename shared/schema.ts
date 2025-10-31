import { relations } from "drizzle-orm";
import {
  index,
  sqliteTable,
  text,
  integer,
  real,
  unique,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// SQLite Schema for SQLite Cloud
// Note: SQLite doesn't support native enums. TEXT fields with validation are used instead.
// Default timestamp values use INTEGER (Unix timestamp). Application layer handles conversions.

// ======================
// AUTH.JS TABLES
// ======================

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
  (table) => [unique().on(table.provider, table.providerAccountId)],
);

export const sessions = sqliteTable("sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (table) => [unique().on(table.identifier, table.token)],
);

// ======================
// CORE USER TABLES
// ======================

export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").unique(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    profileImageUrl: text("profile_image_url"),
    primaryCommunity: text("primary_community"),
    username: text("username").unique(),
    bio: text("bio"),
    location: text("location"),
    website: text("website"),
    status: text("status").default("offline"), // 'online', 'offline', 'away', 'busy', 'gaming'
    statusMessage: text("status_message"),
    timezone: text("timezone"),
    dateOfBirth: text("date_of_birth"),
    isPrivate: integer("is_private", { mode: "boolean" }).default(false),
    showOnlineStatus: text("show_online_status").default("everyone"), // 'everyone', 'friends_only', 'private'
    allowDirectMessages: text("allow_direct_messages").default("everyone"),
    passwordHash: text("password_hash"),
    isEmailVerified: integer("is_email_verified", { mode: "boolean" }).default(
      false,
    ),
    emailVerifiedAt: integer("email_verified_at", { mode: "timestamp" }),
    failedLoginAttempts: integer("failed_login_attempts").default(0),
    lastFailedLogin: integer("last_failed_login", { mode: "timestamp" }),
    accountLockedUntil: integer("account_locked_until", { mode: "timestamp" }),
    passwordChangedAt: integer("password_changed_at", { mode: "timestamp" }),
    mfaEnabled: integer("mfa_enabled", { mode: "boolean" }).default(false),
    mfaEnabledAt: integer("mfa_enabled_at", { mode: "timestamp" }),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
    lastActiveAt: integer("last_active_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_username").on(table.username),
    index("idx_users_status").on(table.status),
    index("idx_users_primary_community").on(table.primaryCommunity),
    index("idx_users_created_at").on(table.createdAt),
    index("idx_users_last_active").on(table.lastActiveAt),
    index("idx_users_last_login").on(table.lastLoginAt),
    index("idx_users_status_last_active").on(table.status, table.lastActiveAt),
    index("idx_users_community_status").on(
      table.primaryCommunity,
      table.status,
    ),
    // Composite indexes for common query patterns
    index("idx_users_community_status_active").on(
      table.primaryCommunity,
      table.status,
      table.lastActiveAt,
    ),
  ],
);

export const userPlatformAccounts = sqliteTable(
  "user_platform_accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    handle: text("handle").notNull(),
    platformUserId: text("platform_user_id"),
    channelId: text("channel_id"),
    pageId: text("page_id"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
    scopes: text("scopes"), // JSON string
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    lastVerified: integer("last_verified", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    unique().on(table.userId, table.platform),
    index("idx_user_platform_user_id").on(table.userId),
    index("idx_user_platform_platform").on(table.platform),
    index("idx_user_platform_active").on(table.userId, table.isActive),
    index("idx_user_platform_handle").on(table.handle),
    index("idx_user_platform_token_expires").on(table.tokenExpiresAt),
    // Composite index for active platform lookups
    index("idx_user_platform_user_platform_active").on(
      table.userId,
      table.platform,
      table.isActive,
    ),
  ],
);

// ======================
// GAME & CARD TABLES
// ======================

export const games = sqliteTable(
  "games",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    code: text("code").notNull().unique(), // Short code like 'MTG', 'POKEMON', 'LORCANA'
    description: text("description"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_games_name").on(table.name),
    index("idx_games_code").on(table.code),
    index("idx_games_active").on(table.isActive),
    index("idx_games_created_at").on(table.createdAt),
  ],
);

export const cards = sqliteTable(
  "cards",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    gameId: text("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    type: text("type"), // Card type (e.g., "Creature", "Instant", "Trainer")
    rarity: text("rarity"), // Card rarity (e.g., "Common", "Rare", "Mythic")
    setCode: text("set_code"), // Set/expansion code
    setName: text("set_name"), // Set/expansion name
    imageUrl: text("image_url"), // Optional image URL
    metadata: text("metadata"), // JSON string for game-specific properties
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_cards_game").on(table.gameId),
    index("idx_cards_name").on(table.name),
    index("idx_cards_set_code").on(table.setCode),
    index("idx_cards_game_name").on(table.gameId, table.name),
  ],
);

// ======================
// COMMUNITY TABLES
// ======================

export const communities = sqliteTable("communities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  themeColor: text("theme_color").notNull(),
  iconClass: text("icon_class").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const userCommunities = sqliteTable(
  "user_communities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    communityId: text("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    isPrimary: integer("is_primary", { mode: "boolean" }).default(false),
    joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    unique("unique_user_community").on(table.userId, table.communityId),
    index("idx_user_communities_user_id").on(table.userId),
    index("idx_user_communities_community_id").on(table.communityId),
    index("idx_user_communities_primary").on(table.userId, table.isPrimary),
  ],
);

export const themePreferences = sqliteTable("theme_preferences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  communityId: text("community_id").references(() => communities.id),
  themeMode: text("theme_mode").default("dark"),
  customColors: text("custom_colors"), // JSON string
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// ======================
// EVENT & CALENDAR TABLES
// ======================

export const events = sqliteTable(
  "events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type").notNull(), // 'tournament', 'convention', 'release', 'stream', 'community', 'personal', 'game_pod'
    status: text("status").default("active"), // 'active', 'cancelled', 'completed', 'draft'
    startTime: integer("start_time", { mode: "timestamp" }).notNull(),
    endTime: integer("end_time", { mode: "timestamp" }),
    timezone: text("timezone").notNull().default("UTC"), // IANA timezone (e.g., "America/New_York", "Europe/London")
    displayTimezone: text("display_timezone"), // Optional: override timezone for display purposes
    location: text("location"),
    isVirtual: integer("is_virtual", { mode: "boolean" }).default(false),
    maxAttendees: integer("max_attendees"),
    playerSlots: integer("player_slots"), // For game pods - number of main player slots
    alternateSlots: integer("alternate_slots"), // For game pods - number of alternate/waitlist slots
    isPublic: integer("is_public", { mode: "boolean" }).default(true), // Event visibility
    gameFormat: text("game_format"), // e.g., 'commander', 'standard', 'modern'
    powerLevel: integer("power_level"), // 1-10 scale for game pods
    isRecurring: integer("is_recurring", { mode: "boolean" }).default(false), // Recurring event flag
    recurrencePattern: text("recurrence_pattern"), // 'daily', 'weekly', 'monthly'
    recurrenceInterval: integer("recurrence_interval"), // Every X days/weeks/months
    recurrenceEndDate: integer("recurrence_end_date", { mode: "timestamp" }), // End date for recurring events
    parentEventId: text("parent_event_id"), // Reference to parent event for recurring instances (self-reference)
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id),
    hostId: text("host_id").references(() => users.id),
    coHostId: text("co_host_id").references(() => users.id),
    communityId: text("community_id").references(() => communities.id),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_events_creator").on(table.creatorId),
    index("idx_events_community").on(table.communityId),
    index("idx_events_start_time").on(table.startTime),
    index("idx_events_status").on(table.status),
    index("idx_events_type").on(table.type),
    // Indexes for new fields
    index("idx_events_is_public").on(table.isPublic),
    index("idx_events_game_format").on(table.gameFormat),
    index("idx_events_is_recurring").on(table.isRecurring),
    index("idx_events_parent").on(table.parentEventId),
    // Composite index for community + time range queries
    index("idx_events_community_status_start").on(
      table.communityId,
      table.status,
      table.startTime,
    ),
    // Composite index for status + type filtering
    index("idx_events_status_type_start").on(
      table.status,
      table.type,
      table.startTime,
    ),
  ],
);

export const eventAttendees = sqliteTable(
  "event_attendees",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").default("attending"), // 'confirmed', 'waitlist', 'cancelled', 'declined', 'attending' (default for backward compatibility), 'maybe', 'not_attending'
    role: text("role").default("participant"), // 'participant', 'organizer', 'moderator'
    playerType: text("player_type").default("main"), // 'main', 'alternate' (for game pods with waitlist)
    waitlistPosition: integer("waitlist_position"), // Position in waitlist, null if not waitlisted
    registeredAt: integer("registered_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ), // When user registered for the event
    joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    unique().on(table.eventId, table.userId),
    index("idx_event_attendees_event").on(table.eventId),
    index("idx_event_attendees_user").on(table.userId),
    // Composite index for status lookups
    index("idx_event_attendees_event_status").on(table.eventId, table.status),
    index("idx_event_attendees_user_status").on(table.userId, table.status),
    // Index for waitlist ordering
    index("idx_event_attendees_waitlist").on(
      table.eventId,
      table.waitlistPosition,
    ),
  ],
);

// ======================
// MESSAGING TABLES
// ======================

export const messages = sqliteTable(
  "messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id),
    receiverId: text("receiver_id").references(() => users.id),
    recipientId: text("recipient_id").references(() => users.id),
    eventId: text("event_id").references(() => events.id),
    communityId: text("community_id").references(() => communities.id),
    content: text("content").notNull(),
    isRead: integer("is_read", { mode: "boolean" }).default(false),
    readAt: integer("read_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_messages_sender").on(table.senderId),
    index("idx_messages_receiver").on(table.receiverId),
    index("idx_messages_event").on(table.eventId),
    index("idx_messages_created").on(table.createdAt),
  ],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // 'event_join', 'event_leave', 'game_invite', 'message', 'system', etc.
    priority: text("priority").default("normal"), // 'low', 'normal', 'high', 'urgent'
    title: text("title").notNull(),
    message: text("message"),
    data: text("data"), // JSON string
    actionUrl: text("action_url"),
    actionText: text("action_text"),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    read: integer("read", { mode: "boolean" }).default(false),
    readAt: integer("read_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    // Keep old isRead field for compatibility (can be removed in migration)
    isRead: integer("is_read", { mode: "boolean" }).default(false),
  },
  (table) => [
    index("idx_notifications_user").on(table.userId),
    index("idx_notifications_type").on(table.type),
    index("idx_notifications_read").on(table.isRead),
    index("idx_notifications_created").on(table.createdAt),
    // Composite index for user + unread queries (most common pattern)
    index("idx_notifications_user_unread_created").on(
      table.userId,
      table.isRead,
      table.createdAt,
    ),
    // Composite index for user + type filtering
    index("idx_notifications_user_type_created").on(
      table.userId,
      table.type,
      table.createdAt,
    ),
  ],
);

// Push notification subscriptions for web push
export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    deviceInfo: text("device_info"), // JSON string with device details
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    lastUsed: integer("last_used", { mode: "timestamp" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
  },
  (table) => [
    index("idx_push_subscriptions_user").on(table.userId),
    index("idx_push_subscriptions_endpoint").on(table.endpoint),
    index("idx_push_subscriptions_active").on(table.isActive),
    // Composite index for user + active subscriptions
    index("idx_push_subscriptions_user_active").on(
      table.userId,
      table.isActive,
    ),
  ],
);

// ======================
// GAME SESSION TABLES
// ======================

export const gameSessions = sqliteTable(
  "game_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    eventId: text("event_id").references(() => events.id, {
      onDelete: "cascade",
    }),
    gameType: text("game_type").notNull(),
    communityId: text("community_id").references(() => communities.id),
    status: text("status").default("waiting"), // 'waiting', 'active', 'paused', 'completed', 'cancelled'
    maxPlayers: integer("max_players"),
    currentPlayers: integer("current_players").default(0),
    spectators: text("spectators").default("[]"), // JSON array of user IDs
    hostId: text("host_id")
      .notNull()
      .references(() => users.id),
    coHostId: text("co_host_id").references(() => users.id),
    boardState: text("board_state"), // JSON string
    gameData: text("game_data"), // JSON string
    startedAt: integer("started_at", { mode: "timestamp" }),
    endedAt: integer("ended_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_game_sessions_event").on(table.eventId),
    index("idx_game_sessions_host").on(table.hostId),
    index("idx_game_sessions_status").on(table.status),
    index("idx_game_sessions_community").on(table.communityId),
    index("idx_game_sessions_created_at").on(table.createdAt),
    // Composite indexes for common query patterns
    index("idx_game_sessions_status_created").on(table.status, table.createdAt),
    index("idx_game_sessions_community_status").on(
      table.communityId,
      table.status,
    ),
    index("idx_game_sessions_host_status").on(table.hostId, table.status),
    index("idx_game_sessions_community_status_created").on(
      table.communityId,
      table.status,
      table.createdAt,
    ),
  ],
);

// ======================
// GAME STATE TRACKING TABLES
// ======================

export const gameStateHistory = sqliteTable(
  "game_state_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => gameSessions.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    state: text("state").notNull(), // JSON string of game state
    stateHash: text("state_hash"), // Hash for integrity verification
    changedBy: text("changed_by").references(() => users.id),
    changeType: text("change_type"), // 'action', 'undo', 'redo', 'sync', 'snapshot'
    changeDescription: text("change_description"),
    metadata: text("metadata"), // JSON string for additional context
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_game_state_history_session").on(table.sessionId),
    index("idx_game_state_history_version").on(table.version),
    index("idx_game_state_history_created").on(table.createdAt),
    // Composite index for version lookups
    index("idx_game_state_history_session_version").on(
      table.sessionId,
      table.version,
    ),
    index("idx_game_state_history_session_created").on(
      table.sessionId,
      table.createdAt,
    ),
    // Unique constraint to prevent duplicate versions
    unique("unique_session_version").on(table.sessionId, table.version),
  ],
);

export const gameActions = sqliteTable(
  "game_actions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => gameSessions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    actionType: text("action_type").notNull(), // 'move', 'play_card', 'draw', 'attack', 'end_turn', etc.
    actionData: text("action_data").notNull(), // JSON string with action details
    targetId: text("target_id"), // Optional target user/entity
    resultData: text("result_data"), // JSON string with action results
    stateVersion: integer("state_version"), // Links to game_state_history version
    isValid: integer("is_valid", { mode: "boolean" }).default(true),
    validationError: text("validation_error"),
    timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_game_actions_session").on(table.sessionId),
    index("idx_game_actions_user").on(table.userId),
    index("idx_game_actions_type").on(table.actionType),
    index("idx_game_actions_timestamp").on(table.timestamp),
    index("idx_game_actions_created").on(table.createdAt),
    // Composite indexes for common query patterns
    index("idx_game_actions_session_timestamp").on(
      table.sessionId,
      table.timestamp,
    ),
    index("idx_game_actions_session_user_timestamp").on(
      table.sessionId,
      table.userId,
      table.timestamp,
    ),
    index("idx_game_actions_session_type_timestamp").on(
      table.sessionId,
      table.actionType,
      table.timestamp,
    ),
  ],
);

// ======================
// AUTHENTICATION & SECURITY TABLES
// ======================

export const passwordResetTokens = sqliteTable(
  "password_reset_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_password_reset_token").on(table.token),
    index("idx_password_reset_user").on(table.userId),
  ],
);

export const emailVerificationTokens = sqliteTable(
  "email_verification_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    verifiedAt: integer("verified_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_email_verification_token").on(table.token),
    index("idx_email_verification_user").on(table.userId),
  ],
);

export const userMfaSettings = sqliteTable("user_mfa_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes"), // JSON string array
  enabled: integer("enabled", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const authAuditLog = sqliteTable(
  "auth_audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => users.id),
    eventType: text("event_type").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    isSuccessful: integer("is_successful", { mode: "boolean" }),
    failureReason: text("failure_reason"),
    details: text("details"), // JSON string
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_auth_audit_user").on(table.userId),
    index("idx_auth_audit_event").on(table.eventType),
    index("idx_auth_audit_created").on(table.createdAt),
  ],
);

// ======================
// SOCIAL FEATURES
// ======================

export const friendships = sqliteTable(
  "friendships",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    friendId: text("friend_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => users.id),
    status: text("status").default("pending"), // 'pending', 'accepted', 'declined', 'blocked'
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    respondedAt: integer("responded_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    unique().on(table.userId, table.friendId),
    index("idx_friendships_user").on(table.userId),
    index("idx_friendships_friend").on(table.friendId),
    index("idx_friendships_status").on(table.status),
    // Composite index for pending friend requests (common query)
    index("idx_friendships_addressee_pending").on(
      table.addresseeId,
      table.status,
    ),
    index("idx_friendships_requester_status").on(
      table.requesterId,
      table.status,
    ),
  ],
);

export const userActivities = sqliteTable(
  "user_activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityType: text("activity_type").notNull(),
    type: text("type"),
    title: text("title"),
    description: text("description"),
    data: text("data"), // JSON string
    metadata: text("metadata"), // JSON string
    communityId: text("community_id").references(() => communities.id),
    isPublic: integer("is_public", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_user_activities_user").on(table.userId),
    index("idx_user_activities_type").on(table.activityType),
    index("idx_user_activities_created").on(table.createdAt),
  ],
);

// ======================
// TOURNAMENT TABLES
// ======================

export const tournaments = sqliteTable(
  "tournaments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    gameType: text("game_type").notNull(),
    format: text("format").notNull(),
    status: text("status").default("upcoming"), // 'upcoming', 'active', 'completed', 'cancelled'
    maxParticipants: integer("max_participants"),
    currentParticipants: integer("current_participants").default(0),
    prizePool: real("prize_pool"),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => users.id),
    communityId: text("community_id").references(() => communities.id),
    startDate: integer("start_date", { mode: "timestamp" }).notNull(),
    endDate: integer("end_date", { mode: "timestamp" }),
    // Tournament structure and seeding
    bracketStructure: text("bracket_structure"), // JSON for complex bracket data
    seedingAlgorithm: text("seeding_algorithm").default("random"), // 'random', 'elo', 'manual', 'hybrid'
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_tournaments_organizer").on(table.organizerId),
    index("idx_tournaments_community").on(table.communityId),
    index("idx_tournaments_status").on(table.status),
    index("idx_tournaments_start_date").on(table.startDate),
  ],
);

export const tournamentParticipants = sqliteTable(
  "tournament_participants",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").default("registered"), // 'registered', 'active', 'eliminated', 'winner'
    seed: integer("seed"),
    finalRank: integer("final_rank"),
    joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    unique().on(table.tournamentId, table.userId),
    index("idx_tournament_participants_tournament").on(table.tournamentId),
    index("idx_tournament_participants_user").on(table.userId),
    // Composite index for tournament + status queries
    index("idx_tournament_participants_tournament_status").on(
      table.tournamentId,
      table.status,
    ),
  ],
);

// ======================
// STREAMING TABLES
// ======================

export const streamSessions = sqliteTable(
  "stream_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").default("scheduled"), // 'scheduled', 'live', 'ended', 'cancelled'
    streamerId: text("streamer_id")
      .notNull()
      .references(() => users.id),
    hostUserId: text("host_user_id").references(() => users.id),
    eventId: text("event_id").references(() => events.id),
    communityId: text("community_id").references(() => communities.id),
    scheduledStart: integer("scheduled_start", { mode: "timestamp" }),
    scheduledStartTime: integer("scheduled_start_time", { mode: "timestamp" }),
    actualStart: integer("actual_start", { mode: "timestamp" }),
    actualEnd: integer("actual_end", { mode: "timestamp" }),
    viewerCount: integer("viewer_count").default(0),
    peakViewers: integer("peak_viewers").default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_stream_sessions_streamer").on(table.streamerId),
    index("idx_stream_sessions_event").on(table.eventId),
    index("idx_stream_sessions_status").on(table.status),
    // Composite index for status + community filtering
    index("idx_stream_sessions_status_community").on(
      table.status,
      table.communityId,
      table.scheduledStart,
    ),
    // Composite index for streamer + status
    index("idx_stream_sessions_streamer_status").on(
      table.streamerId,
      table.status,
    ),
  ],
);

export const collaborationRequests = sqliteTable(
  "collaboration_requests",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    fromUserId: text("from_user_id")
      .notNull()
      .references(() => users.id),
    toUserId: text("to_user_id")
      .notNull()
      .references(() => users.id),
    eventId: text("event_id").references(() => events.id),
    message: text("message"),
    status: text("status").default("pending"), // 'pending', 'accepted', 'declined', 'expired', 'cancelled'
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    respondedAt: integer("responded_at", { mode: "timestamp" }),
  },
  (table) => [
    index("idx_collaboration_requests_from").on(table.fromUserId),
    index("idx_collaboration_requests_to").on(table.toUserId),
    index("idx_collaboration_requests_event").on(table.eventId),
    index("idx_collaboration_requests_status").on(table.status),
  ],
);

// ===============================
// ADMIN & MODERATION TABLES
// ===============================

// User roles for admin platform - hierarchical role-based access control
export const userRoles = sqliteTable(
  "user_roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'admin', 'moderator', 'trust_safety', 'community_manager'
    permissions: text("permissions").notNull().default("[]"), // JSON array of permission strings
    communityId: text("community_id").references(() => communities.id),
    assignedBy: text("assigned_by")
      .notNull()
      .references(() => users.id),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_user_roles_user_id").on(table.userId),
    index("idx_user_roles_role").on(table.role),
    index("idx_user_roles_community").on(table.communityId),
    unique("unique_user_role_community").on(
      table.userId,
      table.role,
      table.communityId,
    ),
  ],
);

// User reputation - tracks user trustworthiness and behavior
export const userReputation = sqliteTable(
  "user_reputation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").default(100),
    level: text("level").default("new"), // 'new', 'trusted', 'veteran', 'flagged', 'restricted'
    positiveActions: integer("positive_actions").default(0),
    negativeActions: integer("negative_actions").default(0),
    reportsMade: integer("reports_made").default(0),
    reportsAccurate: integer("reports_accurate").default(0),
    moderationHistory: text("moderation_history").default("[]"), // JSON array
    lastCalculated: integer("last_calculated", {
      mode: "timestamp",
    }).$defaultFn(() => new Date()),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_user_reputation_user_id").on(table.userId),
    index("idx_user_reputation_score").on(table.score),
    index("idx_user_reputation_level").on(table.level),
  ],
);

// Content reports - user and system generated reports for moderation
export const contentReports = sqliteTable(
  "content_reports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    reporterUserId: text("reporter_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reportedUserId: text("reported_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    contentType: text("content_type").notNull(), // 'forum_post', 'forum_reply', 'message', 'profile', 'stream'
    contentId: text("content_id").notNull(),
    reason: text("reason").notNull(), // 'hate_speech', 'harassment', 'spam', 'inappropriate_content'
    description: text("description"),
    evidence: text("evidence"), // JSON
    isSystemGenerated: integer("is_system_generated", {
      mode: "boolean",
    }).default(false),
    automatedFlags: text("automated_flags"), // JSON
    confidenceScore: real("confidence_score"),
    status: text("status").default("pending"), // 'pending', 'investigating', 'resolved', 'dismissed'
    priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
    assignedModerator: text("assigned_moderator").references(() => users.id),
    moderationNotes: text("moderation_notes"),
    resolution: text("resolution"),
    actionTaken: text("action_taken"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  },
  (table) => [
    index("idx_content_reports_reporter").on(table.reporterUserId),
    index("idx_content_reports_reported").on(table.reportedUserId),
    index("idx_content_reports_status").on(table.status),
    index("idx_content_reports_priority").on(table.priority),
    index("idx_content_reports_assigned").on(table.assignedModerator),
    index("idx_content_reports_content").on(table.contentType, table.contentId),
    index("idx_content_reports_status_type_created").on(
      table.status,
      table.contentType,
      table.createdAt,
    ),
  ],
);

// Moderation actions - comprehensive log of all moderation activities
export const moderationActions = sqliteTable(
  "moderation_actions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    moderatorId: text("moderator_id")
      .notNull()
      .references(() => users.id),
    targetUserId: text("target_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // 'warn', 'mute', 'restrict', 'shadowban', 'ban', 'unban'
    reason: text("reason").notNull(),
    duration: integer("duration"), // Duration in hours for temporary actions
    relatedContentType: text("related_content_type"),
    relatedContentId: text("related_content_id"),
    relatedReportId: text("related_report_id").references(
      () => contentReports.id,
    ),
    isReversible: integer("is_reversible", { mode: "boolean" }).default(true),
    isPublic: integer("is_public", { mode: "boolean" }).default(false),
    metadata: text("metadata"), // JSON
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    adminNotes: text("admin_notes"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    reversedBy: text("reversed_by").references(() => users.id),
    reversedAt: integer("reversed_at", { mode: "timestamp" }),
    reversalReason: text("reversal_reason"),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_moderation_actions_moderator").on(table.moderatorId),
    index("idx_moderation_actions_target").on(table.targetUserId),
    index("idx_moderation_actions_action").on(table.action),
    index("idx_moderation_actions_active").on(table.isActive),
    index("idx_moderation_actions_expires").on(table.expiresAt),
    index("idx_moderation_actions_created").on(table.createdAt),
    index("idx_moderation_actions_target_action_active").on(
      table.targetUserId,
      table.action,
      table.isActive,
    ),
  ],
);

// Moderation queue - centralized queue for all moderation tasks
export const moderationQueue = sqliteTable(
  "moderation_queue",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    itemType: text("item_type").notNull(), // 'report', 'auto_flag', 'appeal', 'ban_evasion'
    itemId: text("item_id").notNull(),
    priority: integer("priority").default(5), // 1-10, higher = more urgent
    status: text("status").default("open"), // 'open', 'assigned', 'in_progress', 'completed', 'skipped'
    assignedModerator: text("assigned_moderator").references(() => users.id),
    assignedAt: integer("assigned_at", { mode: "timestamp" }),
    riskScore: real("risk_score"),
    userReputationScore: integer("user_reputation_score"),
    reporterReputationScore: integer("reporter_reputation_score"),
    mlPriority: integer("ml_priority"),
    autoGenerated: integer("auto_generated", { mode: "boolean" }).default(
      false,
    ),
    summary: text("summary"),
    tags: text("tags").default("[]"), // JSON array
    estimatedTimeMinutes: integer("estimated_time_minutes"),
    metadata: text("metadata"), // JSON
    resolution: text("resolution"),
    actionTaken: text("action_taken"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    completedAt: integer("completed_at", { mode: "timestamp" }),
  },
  (table) => [
    index("idx_moderation_queue_status").on(table.status),
    index("idx_moderation_queue_priority").on(table.priority),
    index("idx_moderation_queue_assigned").on(table.assignedModerator),
    index("idx_moderation_queue_created").on(table.createdAt),
    index("idx_moderation_queue_item").on(table.itemType, table.itemId),
    index("idx_moderation_queue_status_priority_created").on(
      table.status,
      table.priority,
      table.createdAt,
    ),
  ],
);

// CMS content management - for Terms of Service, Privacy Policy, etc.
export const cmsContent = sqliteTable(
  "cms_content",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    type: text("type").notNull(), // 'terms_of_service', 'privacy_policy', 'community_guidelines'
    title: text("title").notNull(),
    content: text("content").notNull(),
    version: integer("version").notNull().default(1),
    isPublished: integer("is_published", { mode: "boolean" }).default(false),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    scheduledPublishAt: integer("scheduled_publish_at", { mode: "timestamp" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    lastEditedBy: text("last_edited_by")
      .notNull()
      .references(() => users.id),
    approvedBy: text("approved_by").references(() => users.id),
    approvedAt: integer("approved_at", { mode: "timestamp" }),
    changeLog: text("change_log"),
    previousVersionId: text("previous_version_id"),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords"),
    slug: text("slug").unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_cms_content_type").on(table.type),
    index("idx_cms_content_published").on(table.isPublished),
    index("idx_cms_content_author").on(table.authorId),
    index("idx_cms_content_scheduled").on(table.scheduledPublishAt),
    index("idx_cms_content_version").on(table.type, table.version),
  ],
);

// Ban evasion tracking - tracks IP addresses and device fingerprints
export const banEvasionTracking = sqliteTable(
  "ban_evasion_tracking",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ipAddress: text("ip_address").notNull(),
    hashedFingerprint: text("hashed_fingerprint"),
    userAgent: text("user_agent"),
    screenResolution: text("screen_resolution"),
    timezone: text("timezone"),
    language: text("language"),
    loginPatterns: text("login_patterns"), // JSON
    activitySignature: text("activity_signature"), // JSON
    detectionMethod: text("detection_method"),
    confidenceScore: real("confidence_score"),
    relatedBannedUser: text("related_banned_user").references(() => users.id),
    status: text("status").default("flagged"), // 'flagged', 'investigating', 'confirmed', 'false_positive'
    investigatedBy: text("investigated_by").references(() => users.id),
    investigatedAt: integer("investigated_at", { mode: "timestamp" }),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_ban_evasion_user").on(table.userId),
    index("idx_ban_evasion_ip").on(table.ipAddress),
    index("idx_ban_evasion_fingerprint").on(table.hashedFingerprint),
    index("idx_ban_evasion_status").on(table.status),
    index("idx_ban_evasion_confidence").on(table.confidenceScore),
  ],
);

// User appeals - system for users to appeal moderation actions
export const userAppeals = sqliteTable(
  "user_appeals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    moderationActionId: text("moderation_action_id")
      .notNull()
      .references(() => moderationActions.id),
    reason: text("reason").notNull(),
    evidence: text("evidence"), // JSON
    additionalInfo: text("additional_info"),
    status: text("status").default("pending"), // 'pending', 'under_review', 'approved', 'denied', 'withdrawn', 'resolved'
    reviewedBy: text("reviewed_by").references(() => users.id),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    reviewNotes: text("review_notes"),
    decision: text("decision"),
    decisionReason: text("decision_reason"),
    responseToUser: text("response_to_user"),
    isUserNotified: integer("is_user_notified", { mode: "boolean" }).default(
      false,
    ),
    canReappeal: integer("can_reappeal", { mode: "boolean" }).default(false),
    reappealCooldownUntil: integer("reappeal_cooldown_until", {
      mode: "timestamp",
    }),
    resolvedAt: integer("resolved_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_user_appeals_user").on(table.userId),
    index("idx_user_appeals_action").on(table.moderationActionId),
    index("idx_user_appeals_status").on(table.status),
    index("idx_user_appeals_reviewer").on(table.reviewedBy),
    index("idx_user_appeals_created").on(table.createdAt),
  ],
);

// Saved moderation templates - for consistent communication
export const moderationTemplates = sqliteTable(
  "moderation_templates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    category: text("category").notNull(), // 'warning', 'ban_notice', 'appeal_response'
    subject: text("subject"),
    content: text("content").notNull(),
    variables: text("variables").default("[]"), // JSON array
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    lastModifiedBy: text("last_modified_by")
      .notNull()
      .references(() => users.id),
    usageCount: integer("usage_count").default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_moderation_templates_category").on(table.category),
    index("idx_moderation_templates_active").on(table.isActive),
    index("idx_moderation_templates_creator").on(table.createdBy),
  ],
);

// Admin audit log - comprehensive logging of all admin actions
export const adminAuditLog = sqliteTable(
  "admin_audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminUserId: text("admin_user_id")
      .notNull()
      .references(() => users.id),
    action: text("action").notNull(), // 'login', 'role_assign', 'user_ban', 'content_delete'
    category: text("category").notNull(), // 'authentication', 'user_management', 'content_moderation', 'system_config'
    targetType: text("target_type"),
    targetId: text("target_id"),
    targetIdentifier: text("target_identifier"),
    oldValues: text("old_values"), // JSON
    newValues: text("new_values"), // JSON
    parameters: text("parameters"), // JSON
    ipAddress: text("ip_address").notNull(),
    userAgent: text("user_agent"),
    sessionId: text("session_id"),
    success: integer("success", { mode: "boolean" }).default(true),
    errorMessage: text("error_message"),
    impactAssessment: text("impact_assessment"), // 'low', 'medium', 'high', 'critical'
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_admin_audit_log_admin").on(table.adminUserId),
    index("idx_admin_audit_log_action").on(table.action),
    index("idx_admin_audit_log_category").on(table.category),
    index("idx_admin_audit_log_target").on(table.targetType, table.targetId),
    index("idx_admin_audit_log_created").on(table.createdAt),
    index("idx_admin_audit_log_ip").on(table.ipAddress),
  ],
);

// ======================
// EMAIL CHANGE MANAGEMENT
// ======================

export const emailChangeRequests = sqliteTable(
  "email_change_requests",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    currentEmail: text("current_email").notNull(),
    newEmail: text("new_email").notNull(),
    status: text("status").notNull().default("pending"), // 'pending', 'verified', 'completed', 'cancelled', 'expired'
    verificationCode: text("verification_code"),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    initiatedAt: integer("initiated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    completedAt: integer("completed_at", { mode: "timestamp" }),
  },
  (table) => [
    index("idx_email_change_user").on(table.userId),
    index("idx_email_change_status").on(table.status),
    index("idx_email_change_new_email").on(table.newEmail),
  ],
);

export const emailChangeTokens = sqliteTable(
  "email_change_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    requestId: text("request_id")
      .notNull()
      .references(() => emailChangeRequests.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    type: text("type").notNull(), // 'current_email', 'new_email'
    isUsed: integer("is_used", { mode: "boolean" }).default(false),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_email_change_token_request").on(table.requestId),
    index("idx_email_change_token_token").on(table.token),
  ],
);

// ======================
// USER PROFILES & SOCIAL
// ======================

export const userSocialLinks = sqliteTable(
  "user_social_links",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(), // 'twitter', 'instagram', 'tiktok', 'discord', 'website'
    url: text("url").notNull(),
    displayName: text("display_name"),
    isVerified: integer("is_verified", { mode: "boolean" }).default(false),
    isPublic: integer("is_public", { mode: "boolean" }).default(true),
    orderIndex: integer("order_index").default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_user_social_links_user").on(table.userId),
    index("idx_user_social_links_platform").on(table.platform),
  ],
);

export const userGamingProfiles = sqliteTable(
  "user_gaming_profiles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameType: text("game_type").notNull(), // 'MTG', 'Pokemon', 'Lorcana', 'Yu-Gi-Oh'
    communityId: text("community_id").references(() => communities.id),
    playerId: text("player_id"),
    username: text("username"),
    skillLevel: text("skill_level"), // 'beginner', 'intermediate', 'advanced', 'competitive'
    rank: text("rank"),
    experience: integer("experience").default(0),
    favoriteDeck: text("favorite_deck"),
    preferredFormats: text("preferred_formats").default("[]"), // JSON array
    achievements: text("achievements").default("[]"), // JSON array
    statistics: text("statistics").default("{}"), // JSON object
    isPublic: integer("is_public", { mode: "boolean" }).default(true),
    isVisible: integer("is_visible", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_user_gaming_profiles_user").on(table.userId),
    index("idx_user_gaming_profiles_game").on(table.gameType),
    unique().on(table.userId, table.gameType),
  ],
);

// ======================
// USER SETTINGS & PREFERENCES
// ======================

export const userSettings = sqliteTable(
  "user_settings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationsEnabled: integer("notifications_enabled", {
      mode: "boolean",
    }).default(true),
    emailNotifications: integer("email_notifications", {
      mode: "boolean",
    }).default(true),
    pushNotifications: integer("push_notifications", {
      mode: "boolean",
    }).default(false),
    notificationTypes: text("notification_types").default("{}"), // JSON object
    privacySettings: text("privacy_settings").default("{}"), // JSON object
    displayPreferences: text("display_preferences").default("{}"), // JSON object
    language: text("language").default("en"),
    timezone: text("timezone").default("UTC"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [index("idx_user_settings_user").on(table.userId)],
);

export const matchmakingPreferences = sqliteTable(
  "matchmaking_preferences",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    gameType: text("game_type").notNull(),
    preferredFormats: text("preferred_formats").default("[]"), // JSON array
    skillLevelRange: text("skill_level_range").default("[]"), // JSON array [min, max]
    availabilitySchedule: text("availability_schedule").default("{}"), // JSON object
    maxTravelDistance: integer("max_travel_distance"),
    preferredLocation: text("preferred_location"),
    playStyle: text("play_style"), // 'casual', 'competitive', 'social'
    communicationPreferences: text("communication_preferences").default("{}"), // JSON object
    blockedUsers: text("blocked_users").default("[]"), // JSON array of user IDs
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_matchmaking_prefs_user").on(table.userId),
    index("idx_matchmaking_prefs_game").on(table.gameType),
  ],
);

// ======================
// TOURNAMENT STRUCTURES
// ======================

export const tournamentFormats = sqliteTable(
  "tournament_formats",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    gameType: text("game_type").notNull(),
    description: text("description"),
    rules: text("rules").default("{}"), // JSON object
    structure: text("structure").notNull(), // 'single_elimination', 'double_elimination', 'round_robin', 'swiss'
    defaultRounds: integer("default_rounds"),
    isOfficial: integer("is_official", { mode: "boolean" }).default(false),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_tournament_formats_game").on(table.gameType),
    unique().on(table.name, table.gameType),
  ],
);

export const tournamentRounds = sqliteTable(
  "tournament_rounds",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    roundNumber: integer("round_number").notNull(),
    name: text("name"),
    status: text("status").default("pending"), // 'pending', 'in_progress', 'completed'
    startTime: integer("start_time", { mode: "timestamp" }),
    endTime: integer("end_time", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_tournament_rounds_tournament").on(table.tournamentId),
    index("idx_tournament_rounds_number").on(
      table.tournamentId,
      table.roundNumber,
    ),
    unique().on(table.tournamentId, table.roundNumber),
  ],
);

export const tournamentMatches = sqliteTable(
  "tournament_matches",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    roundId: text("round_id")
      .notNull()
      .references(() => tournamentRounds.id, { onDelete: "cascade" }),
    matchNumber: integer("match_number").notNull(),
    player1Id: text("player1_id").references(() => users.id),
    player2Id: text("player2_id").references(() => users.id),
    winnerId: text("winner_id").references(() => users.id),
    status: text("status").default("pending"), // 'pending', 'in_progress', 'completed', 'bye', 'disputed'
    tableNumber: integer("table_number"),
    startTime: integer("start_time", { mode: "timestamp" }),
    endTime: integer("end_time", { mode: "timestamp" }),
    // Conflict resolution fields
    version: integer("version").default(1),
    resultSubmittedAt: integer("result_submitted_at", { mode: "timestamp" }),
    resultSubmittedBy: text("result_submitted_by").references(() => users.id),
    conflictDetectedAt: integer("conflict_detected_at", { mode: "timestamp" }),
    conflictResolvedAt: integer("conflict_resolved_at", { mode: "timestamp" }),
    conflictResolution: text("conflict_resolution"), // JSON
    // Bracket metadata for double elimination
    bracketType: text("bracket_type"), // 'winners', 'losers', 'grand_finals', 'bracket_reset'
    bracketPosition: integer("bracket_position"),
    isGrandFinals: integer("is_grand_finals", { mode: "boolean" }).default(
      false,
    ),
    isBracketReset: integer("is_bracket_reset", { mode: "boolean" }).default(
      false,
    ),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_tournament_matches_tournament").on(table.tournamentId),
    index("idx_tournament_matches_round").on(table.roundId),
    index("idx_tournament_matches_player1").on(table.player1Id),
    index("idx_tournament_matches_player2").on(table.player2Id),
    index("idx_tournament_matches_status").on(table.status),
    index("idx_tournament_matches_created_at").on(table.createdAt),
    // Composite index for player history queries
    index("idx_tournament_matches_players").on(
      table.player1Id,
      table.player2Id,
    ),
    // Composite index for tournament game lists with date sorting
    index("idx_tournament_matches_tournament_created").on(
      table.tournamentId,
      table.createdAt,
    ),
  ],
);

export const matchResults = sqliteTable(
  "match_results",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    matchId: text("match_id")
      .notNull()
      .unique()
      .references(() => tournamentMatches.id, { onDelete: "cascade" }),
    winnerId: text("winner_id").references(() => users.id),
    loserId: text("loser_id").references(() => users.id),
    player1Score: integer("player1_score"),
    player2Score: integer("player2_score"),
    player1Deck: text("player1_deck"),
    player2Deck: text("player2_deck"),
    durationMinutes: integer("duration_minutes"),
    notes: text("notes"),
    reportedBy: text("reported_by")
      .notNull()
      .references(() => users.id),
    reportedById: text("reported_by_id").references(() => users.id),
    isVerified: integer("is_verified", { mode: "boolean" }).default(false),
    verifiedBy: text("verified_by").references(() => users.id),
    verifiedById: text("verified_by_id").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_match_results_match").on(table.matchId),
    index("idx_match_results_reporter").on(table.reportedBy),
    index("idx_match_results_winner").on(table.winnerId),
    index("idx_match_results_loser").on(table.loserId),
    index("idx_match_results_created_at").on(table.createdAt),
    // Composite index for winner/loser stats queries
    index("idx_match_results_winner_created").on(
      table.winnerId,
      table.createdAt,
    ),
  ],
);

// ======================
// ADVANCED TOURNAMENT FEATURES
// ======================

// Match result conflicts and dispute resolution
export const matchResultConflicts = sqliteTable(
  "match_result_conflicts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    matchId: text("match_id")
      .notNull()
      .references(() => tournamentMatches.id, { onDelete: "cascade" }),
    submission1Id: text("submission1_id").notNull(),
    submission2Id: text("submission2_id").notNull(),
    submission1By: text("submission1_by")
      .notNull()
      .references(() => users.id),
    submission2By: text("submission2_by")
      .notNull()
      .references(() => users.id),
    submission1Data: text("submission1_data").notNull(), // JSON
    submission2Data: text("submission2_data").notNull(), // JSON
    status: text("status").default("pending"), // 'pending', 'resolved', 'escalated'
    resolution: text("resolution"), // JSON with resolution details
    resolvedBy: text("resolved_by").references(() => users.id),
    resolvedAt: integer("resolved_at", { mode: "timestamp" }),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_match_conflicts_match").on(table.matchId),
    index("idx_match_conflicts_status").on(table.status),
    index("idx_match_conflicts_created").on(table.createdAt),
  ],
);

// Tournament seeding metadata
export const tournamentSeeds = sqliteTable(
  "tournament_seeds",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    participantId: text("participant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    seed: integer("seed").notNull(),
    seedScore: real("seed_score"),
    bracketPosition: integer("bracket_position"),
    eloRating: integer("elo_rating"),
    recentWinRate: real("recent_win_rate"),
    tournamentHistory: integer("tournament_history"),
    manualSeed: integer("manual_seed"),
    seedingAlgorithm: text("seeding_algorithm"),
    seedingMetadata: text("seeding_metadata"), // JSON
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_tournament_seeds_tournament").on(table.tournamentId),
    index("idx_tournament_seeds_participant").on(table.participantId),
    index("idx_tournament_seeds_seed").on(table.seed),
    unique().on(table.tournamentId, table.participantId),
  ],
);

// Player ELO ratings
export const playerRatings = sqliteTable(
  "player_ratings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameType: text("game_type").notNull(),
    format: text("format"),
    rating: integer("rating").default(1500),
    peak: integer("peak").default(1500),
    wins: integer("wins").default(0),
    losses: integer("losses").default(0),
    draws: integer("draws").default(0),
    winStreak: integer("win_streak").default(0),
    longestWinStreak: integer("longest_win_streak").default(0),
    gamesPlayed: integer("games_played").default(0),
    lastGameAt: integer("last_game_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_player_ratings_user").on(table.userId),
    index("idx_player_ratings_game").on(table.gameType),
    index("idx_player_ratings_rating").on(table.rating),
    unique().on(table.userId, table.gameType, table.format),
  ],
);

// Circuit breaker state tracking for platform APIs
export const platformApiCircuitBreakers = sqliteTable(
  "platform_api_circuit_breakers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    platform: text("platform").notNull(), // 'twitch', 'youtube', 'facebook'
    endpoint: text("endpoint").notNull(),
    state: text("state").notNull(), // 'closed', 'open', 'half_open'
    failureCount: integer("failure_count").default(0),
    successCount: integer("success_count").default(0),
    lastFailureAt: integer("last_failure_at", { mode: "timestamp" }),
    lastSuccessAt: integer("last_success_at", { mode: "timestamp" }),
    stateChangedAt: integer("state_changed_at", { mode: "timestamp" }),
    nextRetryAt: integer("next_retry_at", { mode: "timestamp" }),
    metadata: text("metadata").default("{}"), // JSON for additional state
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_circuit_breakers_platform").on(table.platform),
    index("idx_circuit_breakers_state").on(table.state),
    unique().on(table.platform, table.endpoint),
  ],
);

// ======================
// FORUM FEATURES
// ======================

export const forumPosts = sqliteTable(
  "forum_posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    communityId: text("community_id").references(() => communities.id),
    title: text("title").notNull(),
    content: text("content").notNull(),
    category: text("category").notNull(),
    tags: text("tags").default("[]"), // JSON array
    isPinned: integer("is_pinned", { mode: "boolean" }).default(false),
    isLocked: integer("is_locked", { mode: "boolean" }).default(false),
    viewCount: integer("view_count").default(0),
    likeCount: integer("like_count").default(0),
    replyCount: integer("reply_count").default(0),
    lastActivityAt: integer("last_activity_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_forum_posts_author").on(table.authorId),
    index("idx_forum_posts_community").on(table.communityId),
    index("idx_forum_posts_category").on(table.category),
    index("idx_forum_posts_activity").on(table.lastActivityAt),
  ],
);

export const forumReplies = sqliteTable(
  "forum_replies",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postId: text("post_id")
      .notNull()
      .references(() => forumPosts.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    parentReplyId: text("parent_reply_id"),
    likeCount: integer("like_count").default(0),
    isEdited: integer("is_edited", { mode: "boolean" }).default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_forum_replies_post").on(table.postId),
    index("idx_forum_replies_author").on(table.authorId),
    index("idx_forum_replies_parent").on(table.parentReplyId),
  ],
);

export const forumPostLikes = sqliteTable(
  "forum_post_likes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postId: text("post_id")
      .notNull()
      .references(() => forumPosts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_forum_post_likes_post").on(table.postId),
    index("idx_forum_post_likes_user").on(table.userId),
    unique().on(table.postId, table.userId),
  ],
);

export const forumReplyLikes = sqliteTable(
  "forum_reply_likes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    replyId: text("reply_id")
      .notNull()
      .references(() => forumReplies.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_forum_reply_likes_reply").on(table.replyId),
    index("idx_forum_reply_likes_user").on(table.userId),
    unique().on(table.replyId, table.userId),
  ],
);

// ======================
// STREAMING EXTENSIONS
// ======================

export const streamSessionCoHosts = sqliteTable(
  "stream_session_co_hosts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => streamSessions.id, { onDelete: "cascade" }),
    streamSessionId: text("stream_session_id").references(
      () => streamSessions.id,
      { onDelete: "cascade" },
    ),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").default("co_host"), // 'co_host', 'moderator', 'guest'
    joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    leftAt: integer("left_at", { mode: "timestamp" }),
  },
  (table) => [
    index("idx_stream_co_hosts_session").on(table.sessionId),
    index("idx_stream_co_hosts_user").on(table.userId),
    unique().on(table.sessionId, table.userId),
  ],
);

export const streamSessionPlatforms = sqliteTable(
  "stream_session_platforms",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => streamSessions.id, { onDelete: "cascade" }),
    streamSessionId: text("stream_session_id").references(
      () => streamSessions.id,
      { onDelete: "cascade" },
    ),
    platform: text("platform").notNull(), // 'twitch', 'youtube', 'facebook', 'kick'
    streamUrl: text("stream_url"),
    streamKey: text("stream_key"),
    status: text("status").default("idle"), // 'idle', 'live', 'offline', 'error'
    viewerCount: integer("viewer_count").default(0),
    startedAt: integer("started_at", { mode: "timestamp" }),
    endedAt: integer("ended_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_stream_platforms_session").on(table.sessionId),
    index("idx_stream_platforms_platform").on(table.platform),
  ],
);

// ======================
// ANALYTICS
// ======================

export const streamAnalytics = sqliteTable(
  "stream_analytics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => streamSessions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    platform: text("platform").notNull(),
    viewerCount: integer("viewer_count").default(0),
    peakViewers: integer("peak_viewers").default(0),
    averageViewers: integer("average_viewers").default(0),
    chatMessages: integer("chat_messages").default(0),
    likes: integer("likes").default(0),
    shares: integer("shares").default(0),
    durationMinutes: integer("duration_minutes").default(0),
    timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_stream_analytics_session").on(table.sessionId),
    index("idx_stream_analytics_user").on(table.userId),
    index("idx_stream_analytics_timestamp").on(table.timestamp),
  ],
);

export const userActivityAnalytics = sqliteTable(
  "user_activity_analytics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityType: text("activity_type").notNull(), // 'login', 'stream_view', 'event_join', 'forum_post'
    count: integer("count").default(1),
    metadata: text("metadata").default("{}"), // JSON object
    date: text("date").notNull(), // YYYY-MM-DD
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_user_activity_user").on(table.userId),
    index("idx_user_activity_type").on(table.activityType),
    index("idx_user_activity_date").on(table.date),
    unique().on(table.userId, table.activityType, table.date),
  ],
);

export const communityAnalytics = sqliteTable(
  "community_analytics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    communityId: text("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    metricType: text("metric_type").notNull(), // 'members', 'events', 'posts', 'streams'
    value: integer("value").default(0),
    metadata: text("metadata").default("{}"), // JSON object
    date: text("date").notNull(), // YYYY-MM-DD
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_community_analytics_community").on(table.communityId),
    index("idx_community_analytics_metric").on(table.metricType),
    index("idx_community_analytics_date").on(table.date),
    unique().on(table.communityId, table.metricType, table.date),
  ],
);

export const platformMetrics = sqliteTable(
  "platform_metrics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    metricName: text("metric_name").notNull(),
    metricValue: real("metric_value").notNull(),
    metricType: text("metric_type").notNull(), // 'counter', 'gauge', 'histogram'
    tags: text("tags").default("{}"), // JSON object
    timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_platform_metrics_name").on(table.metricName),
    index("idx_platform_metrics_timestamp").on(table.timestamp),
  ],
);

export const eventTracking = sqliteTable(
  "event_tracking",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => users.id),
    eventName: text("event_name").notNull(),
    eventCategory: text("event_category").notNull(),
    eventProperties: text("event_properties").default("{}"), // JSON object
    sessionId: text("session_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_event_tracking_user").on(table.userId),
    index("idx_event_tracking_name").on(table.eventName),
    index("idx_event_tracking_category").on(table.eventCategory),
    index("idx_event_tracking_timestamp").on(table.timestamp),
  ],
);

export const conversionFunnel = sqliteTable(
  "conversion_funnels",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    funnelName: text("funnel_name").notNull(),
    stepName: text("step_name").notNull(),
    stepOrder: integer("step_order").notNull(),
    userId: text("user_id").references(() => users.id),
    sessionId: text("session_id"),
    completed: integer("completed", { mode: "boolean" }).default(false),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    metadata: text("metadata").default("{}"), // JSON object
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_conversion_funnel_name").on(table.funnelName),
    index("idx_conversion_funnel_user").on(table.userId),
    index("idx_conversion_funnel_session").on(table.sessionId),
  ],
);

// ======================
// COLLABORATIVE STREAMING
// ======================

export const collaborativeStreamEvents = sqliteTable(
  "collaborative_stream_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    scheduledStartTime: integer("scheduled_start_time", {
      mode: "timestamp",
    }).notNull(),
    estimatedDuration: integer("estimated_duration"), // in minutes
    communityId: text("community_id").references(() => communities.id),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id), // Changed from organizerId to creatorId for consistency
    organizerId: text("organizer_id")
      .notNull()
      .references(() => users.id), // Keep for backward compatibility
    status: text("status").default("planned"), // 'planned', 'live', 'completed', 'cancelled'
    streamingPlatforms: text("streaming_platforms").default("[]"), // JSON array
    contentType: text("content_type"), // 'gameplay', 'tournament', 'discussion', 'showcase'
    targetAudience: text("target_audience"),
    maxCollaborators: integer("max_collaborators"),
    requiresApproval: integer("requires_approval", { mode: "boolean" }).default(
      true,
    ),
    isPrivate: integer("is_private", { mode: "boolean" }).default(false),
    tags: text("tags").default("[]"), // JSON array
    actualStartTime: integer("actual_start_time", { mode: "timestamp" }),
    actualEndTime: integer("actual_end_time", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_collab_stream_events_organizer").on(table.organizerId),
    index("idx_collab_stream_events_creator").on(table.creatorId),
    index("idx_collab_stream_events_community").on(table.communityId),
    index("idx_collab_stream_events_start").on(table.scheduledStartTime),
    index("idx_collab_stream_events_status").on(table.status),
  ],
);

export const streamCollaborators = sqliteTable(
  "stream_collaborators",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    streamEventId: text("stream_event_id")
      .notNull()
      .references(() => collaborativeStreamEvents.id, { onDelete: "cascade" }), // Primary field name
    eventId: text("event_id")
      .notNull()
      .references(() => collaborativeStreamEvents.id, { onDelete: "cascade" }), // Alias for compatibility
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'host', 'co_host', 'guest', 'moderator'
    status: text("status").default("pending"), // 'pending', 'accepted', 'declined', 'removed'
    platformHandles: text("platform_handles").default("{}"), // JSON object
    streamingCapabilities: text("streaming_capabilities").default("[]"), // JSON array
    availableTimeSlots: text("available_time_slots").default("{}"), // JSON object for availability scheduling
    contentSpecialties: text("content_specialties").default("[]"), // JSON array for content expertise
    technicalSetup: text("technical_setup").default("{}"), // JSON object for equipment/setup details
    invitedByUserId: text("invited_by_user_id").references(() => users.id), // Primary field name
    invitedBy: text("invited_by").references(() => users.id), // Alias for compatibility
    invitedAt: integer("invited_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    respondedAt: integer("responded_at", { mode: "timestamp" }),
    joinedAt: integer("joined_at", { mode: "timestamp" }),
    leftAt: integer("left_at", { mode: "timestamp" }),
  },
  (table) => [
    index("idx_stream_collaborators_stream_event").on(table.streamEventId),
    index("idx_stream_collaborators_event").on(table.eventId),
    index("idx_stream_collaborators_user").on(table.userId),
    index("idx_stream_collaborators_status").on(table.status),
    unique().on(table.eventId, table.userId),
  ],
);

export const streamCoordinationSessions = sqliteTable(
  "stream_coordination_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    streamEventId: text("stream_event_id")
      .notNull()
      .references(() => collaborativeStreamEvents.id, { onDelete: "cascade" }), // Primary field name
    eventId: text("event_id")
      .notNull()
      .references(() => collaborativeStreamEvents.id, { onDelete: "cascade" }), // Alias for compatibility
    currentPhase: text("current_phase").default("preparation"), // 'preparation', 'live', 'break', 'wrap_up', 'ended'
    currentHost: text("current_host").references(() => users.id), // Primary field name used by service
    currentHostId: text("current_host_id").references(() => users.id), // Alias for compatibility
    activeCollaborators: text("active_collaborators").default("[]"), // JSON array of user IDs
    platformStatuses: text("platform_statuses").default("{}"), // JSON object for platform-specific statuses
    viewerCounts: text("viewer_counts").default("{}"), // JSON object for viewer counts per platform
    coordinationEvents: text("coordination_events").default("[]"), // JSON array of coordination event logs
    chatModerationActive: integer("chat_moderation_active", {
      mode: "boolean",
    }).default(false),
    streamQualitySettings: text("stream_quality_settings").default("{}"), // JSON object for quality settings
    audioCoordination: text("audio_coordination").default("{}"), // JSON object for audio setup
    streamMetrics: text("stream_metrics").default("{}"), // JSON object
    phaseHistory: text("phase_history").default("[]"), // JSON array
    notes: text("notes"),
    actualStartTime: integer("actual_start_time", { mode: "timestamp" }),
    actualEndTime: integer("actual_end_time", { mode: "timestamp" }),
    startedAt: integer("started_at", { mode: "timestamp" }),
    endedAt: integer("ended_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_stream_coordination_stream_event").on(table.streamEventId),
    index("idx_stream_coordination_event").on(table.eventId),
    index("idx_stream_coordination_phase").on(table.currentPhase),
  ],
);

// ======================
// MFA & SECURITY EXTENSIONS
// ======================

export const userMfaAttempts = sqliteTable(
  "user_mfa_attempts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    attemptType: text("attempt_type").notNull(), // 'totp', 'backup_code', 'recovery'
    success: integer("success", { mode: "boolean" }).notNull(),
    ipAddress: text("ip_address").notNull(),
    userAgent: text("user_agent"),
    failureReason: text("failure_reason"),
    failedAttempts: integer("failed_attempts").default(0),
    lockedUntil: integer("locked_until", { mode: "timestamp" }),
    windowStartedAt: integer("window_started_at", { mode: "timestamp" }),
    lastFailedAt: integer("last_failed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_mfa_attempts_user").on(table.userId),
    index("idx_mfa_attempts_created").on(table.createdAt),
    index("idx_mfa_attempts_success").on(table.success),
  ],
);

export const deviceFingerprints = sqliteTable(
  "device_fingerprints",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fingerprintHash: text("fingerprint_hash").notNull(),
    deviceInfo: text("device_info").default("{}"), // JSON object
    firstSeen: integer("first_seen", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    lastSeen: integer("last_seen", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    trustScore: real("trust_score").default(0.5),
    isBlocked: integer("is_blocked", { mode: "boolean" }).default(false),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
  },
  (table) => [
    index("idx_device_fingerprints_user").on(table.userId),
    index("idx_device_fingerprints_hash").on(table.fingerprintHash),
    unique().on(table.userId, table.fingerprintHash),
  ],
);

export const mfaSecurityContext = sqliteTable(
  "mfa_security_context",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contextType: text("context_type").notNull(), // 'login', 'sensitive_action', 'settings_change'
    ipAddress: text("ip_address").notNull(),
    location: text("location"),
    deviceFingerprint: text("device_fingerprint"),
    riskLevel: text("risk_level").default("low"), // 'low', 'medium', 'high'
    requiresMfa: integer("requires_mfa", { mode: "boolean" }).default(false),
    mfaCompleted: integer("mfa_completed", { mode: "boolean" }).default(false),
    isSuccessful: integer("is_successful", { mode: "boolean" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_mfa_context_user").on(table.userId),
    index("idx_mfa_context_type").on(table.contextType),
    index("idx_mfa_context_created").on(table.createdAt),
  ],
);

export const trustedDevices = sqliteTable(
  "trusted_devices",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceFingerprintId: text("device_fingerprint_id")
      .notNull()
      .references(() => deviceFingerprints.id, { onDelete: "cascade" }),
    deviceName: text("device_name"),
    name: text("name"),
    description: text("description"),
    trustLevel: text("trust_level").default("standard"), // 'low', 'standard', 'high'
    autoTrustMfa: integer("auto_trust_mfa", { mode: "boolean" }).default(false),
    trustDurationDays: integer("trust_duration_days").default(30),
    totalLogins: integer("total_logins").default(0),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    verifiedAt: integer("verified_at", { mode: "timestamp" }),
    verificationMethod: text("verification_method"),
    trustedAt: integer("trusted_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    lastUsed: integer("last_used", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    isRevoked: integer("is_revoked", { mode: "boolean" }).default(false),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    revokedReason: text("revoked_reason"),
  },
  (table) => [
    index("idx_trusted_devices_user").on(table.userId),
    index("idx_trusted_devices_fingerprint").on(table.deviceFingerprintId),
    unique().on(table.userId, table.deviceFingerprintId),
  ],
);

export const refreshTokens = sqliteTable(
  "refresh_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    deviceInfo: text("device_info").default("{}"), // JSON object
    ipAddress: text("ip_address").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    lastUsed: integer("last_used", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    isRevoked: integer("is_revoked", { mode: "boolean" }).default(false),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_refresh_tokens_user").on(table.userId),
    index("idx_refresh_tokens_token").on(table.token),
    index("idx_refresh_tokens_expires").on(table.expiresAt),
  ],
);

export const revokedJwtTokens = sqliteTable(
  "revoked_jwt_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    jti: text("jti").notNull().unique(), // JWT ID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    reason: text("reason"),
  },
  (table) => [
    index("idx_revoked_jwt_jti").on(table.jti),
    index("idx_revoked_jwt_user").on(table.userId),
    index("idx_revoked_jwt_expires").on(table.expiresAt),
  ],
);

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
  receivedFriendRequests: many(friendships, {
    relationName: "receivedFriendRequests",
  }),
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
  community: one(communities, {
    fields: [events.communityId],
    references: [communities.id],
  }),
  attendees: many(eventAttendees),
  gameSession: one(gameSessions),
  messages: many(messages),
}));

export const gameSessionsRelations = relations(
  gameSessions,
  ({ one, many }) => ({
    event: one(events, {
      fields: [gameSessions.eventId],
      references: [events.id],
    }),
    community: one(communities, {
      fields: [gameSessions.communityId],
      references: [communities.id],
    }),
    host: one(users, {
      fields: [gameSessions.hostId],
      references: [users.id],
    }),
    coHost: one(users, {
      fields: [gameSessions.coHostId],
      references: [users.id],
    }),
    stateHistory: many(gameStateHistory),
    actions: many(gameActions),
  }),
);

export const gameStateHistoryRelations = relations(
  gameStateHistory,
  ({ one }) => ({
    session: one(gameSessions, {
      fields: [gameStateHistory.sessionId],
      references: [gameSessions.id],
    }),
    changedByUser: one(users, {
      fields: [gameStateHistory.changedBy],
      references: [users.id],
    }),
  }),
);

export const gameActionsRelations = relations(gameActions, ({ one }) => ({
  session: one(gameSessions, {
    fields: [gameActions.sessionId],
    references: [gameSessions.id],
  }),
  user: one(users, {
    fields: [gameActions.userId],
    references: [users.id],
  }),
  target: one(users, {
    fields: [gameActions.targetId],
    references: [users.id],
  }),
}));

// ======================
// TYPES & SCHEMAS
// ======================

export type Game = typeof games.$inferSelect;
export type Card = typeof cards.$inferSelect;
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
export type GameStateHistory = typeof gameStateHistory.$inferSelect;
export type GameAction = typeof gameActions.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type StreamSession = typeof streamSessions.$inferSelect;

// Admin & Moderation types
export type UserRole = typeof userRoles.$inferSelect;
export type UserReputation = typeof userReputation.$inferSelect;
export type ContentReport = typeof contentReports.$inferSelect;
export type ModerationAction = typeof moderationActions.$inferSelect;
export type ModerationQueue = typeof moderationQueue.$inferSelect;
export type CmsContent = typeof cmsContent.$inferSelect;
export type BanEvasionTracking = typeof banEvasionTracking.$inferSelect;
export type UserAppeal = typeof userAppeals.$inferSelect;
export type ModerationTemplate = typeof moderationTemplates.$inferSelect;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;

// Insert schemas with Zod validation
export const insertGameSchema = createInsertSchema(games, {
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20).toUpperCase(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCardSchema = createInsertSchema(cards, {
  name: z.string().min(1).max(200),
  type: z.string().max(50).optional(),
  rarity: z.string().max(50).optional(),
  setCode: z.string().max(20).optional(),
  setName: z.string().max(100).optional(),
  imageUrl: z.string().url().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  status: z.enum(["online", "offline", "away", "busy", "gaming"]).optional(),
  showOnlineStatus: z.enum(["everyone", "friends_only", "private"]).optional(),
  allowDirectMessages: z
    .enum(["everyone", "friends_only", "private"])
    .optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events, {
  title: z.string().min(1).max(200),
  type: z.enum([
    "tournament",
    "convention",
    "release",
    "stream",
    "community",
    "personal",
    "game_pod",
  ]),
  status: z.enum(["active", "cancelled", "completed", "draft"]).optional(),
  // Validation for new fields
  timezone: z.string().min(1).optional(), // IANA timezone string
  displayTimezone: z.string().min(1).optional(),
  isPublic: z.boolean().optional(),
  gameFormat: z.string().optional(),
  powerLevel: z.number().min(1).max(10).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(["daily", "weekly", "monthly"]).optional(),
  recurrenceInterval: z.number().min(1).optional(),
  recurrenceEndDate: z.date().optional(),
  parentEventId: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertEventAttendeeSchema = createInsertSchema(
  eventAttendees,
).omit({
  id: true,
  joinedAt: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
});

export const insertGameStateHistorySchema = createInsertSchema(
  gameStateHistory,
  {
    version: z.number().int().nonnegative(),
    state: z.string().min(1),
    changeType: z
      .enum(["action", "undo", "redo", "sync", "snapshot"])
      .optional(),
  },
).omit({
  id: true,
  createdAt: true,
});

export const insertGameActionSchema = createInsertSchema(gameActions, {
  actionType: z.string().min(1).max(50),
  actionData: z.string().min(1),
  isValid: z.boolean().optional(),
}).omit({
  id: true,
  createdAt: true,
  timestamp: true,
});

export const insertCollaborativeStreamEventSchema = createInsertSchema(
  collaborativeStreamEvents,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStreamCollaboratorSchema = createInsertSchema(
  streamCollaborators,
).omit({
  id: true,
  invitedAt: true,
});

export const insertStreamCoordinationSessionSchema = createInsertSchema(
  streamCoordinationSessions,
).omit({
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

// Admin & Moderation insert schemas
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentReportSchema = createInsertSchema(
  contentReports,
).omit({
  id: true,
  createdAt: true,
});

export const insertModerationActionSchema = createInsertSchema(
  moderationActions,
).omit({
  id: true,
  createdAt: true,
});

export const insertModerationQueueSchema = createInsertSchema(
  moderationQueue,
).omit({
  id: true,
  createdAt: true,
});

export const insertCmsContentSchema = createInsertSchema(cmsContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserAppealSchema = createInsertSchema(userAppeals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog).omit(
  {
    id: true,
    createdAt: true,
  },
);

// Additional insert schemas for important tables
export const insertTournamentSchema = createInsertSchema(tournaments, {
  name: z.string().min(1).max(200),
  gameType: z.string().min(1),
  format: z.string().min(1),
  status: z.enum(["upcoming", "active", "completed", "cancelled"]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTournamentParticipantSchema = createInsertSchema(
  tournamentParticipants,
  {
    status: z.enum(["registered", "active", "eliminated", "winner"]).optional(),
  },
).omit({
  id: true,
  joinedAt: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships, {
  status: z.enum(["pending", "accepted", "declined", "blocked"]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStreamSessionSchema = createInsertSchema(streamSessions, {
  title: z.string().min(1).max(200),
  status: z.enum(["scheduled", "live", "ended", "cancelled"]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStreamSessionCoHostSchema = createInsertSchema(
  streamSessionCoHosts,
  {
    role: z.enum(["co_host", "moderator", "guest"]).optional(),
  },
).omit({
  id: true,
});

export const insertStreamSessionPlatformSchema = createInsertSchema(
  streamSessionPlatforms,
  {
    platform: z.enum(["twitch", "youtube", "facebook", "kick"]),
    status: z.enum(["idle", "live", "offline", "error"]).optional(),
    viewerCount: z.number().int().nonnegative().optional(),
  },
).omit({
  id: true,
  createdAt: true,
});

export const insertCollaborationRequestSchema = createInsertSchema(
  collaborationRequests,
  {
    message: z.string().max(1000).optional(),
    status: z
      .enum(["pending", "accepted", "declined", "expired", "cancelled"])
      .optional(),
  },
).omit({
  id: true,
  createdAt: true,
});

export const insertUserPlatformAccountSchema = createInsertSchema(
  userPlatformAccounts,
  {
    platform: z.enum(["twitch", "youtube", "facebook", "kick"]),
    handle: z.string().min(1).max(100),
    platformUserId: z.string().min(1),
    isActive: z.boolean().optional(),
  },
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTournamentRoundSchema = createInsertSchema(
  tournamentRounds,
  {
    roundNumber: z.number().int().positive(),
    status: z.enum(["pending", "in_progress", "completed"]).optional(),
  },
).omit({
  id: true,
  createdAt: true,
});

export const insertTournamentMatchSchema = createInsertSchema(
  tournamentMatches,
  {
    matchNumber: z.number().int().positive(),
    status: z
      .enum(["pending", "in_progress", "completed", "cancelled"])
      .optional(),
  },
).omit({
  id: true,
  createdAt: true,
});

export const insertMatchResultSchema = createInsertSchema(matchResults, {
  player1Score: z.number().int().nonnegative().optional(),
  player2Score: z.number().int().nonnegative().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
  isVerified: z.boolean().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type InsertCommunity = typeof communities.$inferInsert;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type InsertContentReport = z.infer<typeof insertContentReportSchema>;
export type InsertModerationAction = z.infer<
  typeof insertModerationActionSchema
>;
export type InsertModerationQueue = z.infer<typeof insertModerationQueueSchema>;
export type InsertCmsContent = z.infer<typeof insertCmsContentSchema>;
export type InsertUserAppeal = z.infer<typeof insertUserAppealSchema>;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;

// Email change types
export type EmailChangeRequest = typeof emailChangeRequests.$inferSelect;
export type InsertEmailChangeRequest = typeof emailChangeRequests.$inferInsert;
export type EmailChangeToken = typeof emailChangeTokens.$inferSelect;
export type InsertEmailChangeToken = typeof emailChangeTokens.$inferInsert;

// User profile types
export type UserSocialLink = typeof userSocialLinks.$inferSelect;
export type InsertUserSocialLink = typeof userSocialLinks.$inferInsert;
export type UserGamingProfile = typeof userGamingProfiles.$inferSelect;
export type InsertUserGamingProfile = typeof userGamingProfiles.$inferInsert;

// Settings types
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;
export type MatchmakingPreferences = typeof matchmakingPreferences.$inferSelect;
export type InsertMatchmakingPreferences =
  typeof matchmakingPreferences.$inferInsert;

// Tournament structure types
export type TournamentFormat = typeof tournamentFormats.$inferSelect;
export type InsertTournamentFormat = typeof tournamentFormats.$inferInsert;
export type TournamentRound = typeof tournamentRounds.$inferSelect;
export type InsertTournamentRound = z.infer<typeof insertTournamentRoundSchema>;
export type TournamentMatch = typeof tournamentMatches.$inferSelect;
export type InsertTournamentMatch = z.infer<typeof insertTournamentMatchSchema>;
export type MatchResult = typeof matchResults.$inferSelect;
export type InsertMatchResult = z.infer<typeof insertMatchResultSchema>;

// Forum types
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = typeof forumPosts.$inferInsert;
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = typeof forumReplies.$inferInsert;
export type ForumPostLike = typeof forumPostLikes.$inferSelect;
export type InsertForumPostLike = typeof forumPostLikes.$inferInsert;
export type ForumReplyLike = typeof forumReplyLikes.$inferSelect;
export type InsertForumReplyLike = typeof forumReplyLikes.$inferInsert;

// Stream extension types
export type StreamSessionCoHost = typeof streamSessionCoHosts.$inferSelect;
export type InsertStreamSessionCoHost = z.infer<
  typeof insertStreamSessionCoHostSchema
>;
export type StreamSessionPlatform = typeof streamSessionPlatforms.$inferSelect;
export type InsertStreamSessionPlatform = z.infer<
  typeof insertStreamSessionPlatformSchema
>;

// Analytics types
export type StreamAnalytics = typeof streamAnalytics.$inferSelect;
export type InsertStreamAnalytics = typeof streamAnalytics.$inferInsert;
export type UserActivityAnalytics = typeof userActivityAnalytics.$inferSelect;
export type InsertUserActivityAnalytics =
  typeof userActivityAnalytics.$inferInsert;
export type CommunityAnalytics = typeof communityAnalytics.$inferSelect;
export type InsertCommunityAnalytics = typeof communityAnalytics.$inferInsert;
export type PlatformMetrics = typeof platformMetrics.$inferSelect;
export type InsertPlatformMetrics = typeof platformMetrics.$inferInsert;
export type EventTracking = typeof eventTracking.$inferSelect;
export type InsertEventTracking = typeof eventTracking.$inferInsert;
export type ConversionFunnel = typeof conversionFunnel.$inferSelect;
export type InsertConversionFunnel = typeof conversionFunnel.$inferInsert;

// Collaborative streaming types
export type CollaborativeStreamEvent =
  typeof collaborativeStreamEvents.$inferSelect;
export type InsertCollaborativeStreamEvent =
  typeof collaborativeStreamEvents.$inferInsert;
export type StreamCollaborator = typeof streamCollaborators.$inferSelect;
export type InsertStreamCollaborator = typeof streamCollaborators.$inferInsert;
export type StreamCoordinationSession =
  typeof streamCoordinationSessions.$inferSelect;
export type InsertStreamCoordinationSession =
  typeof streamCoordinationSessions.$inferInsert;

// MFA & Security types
export type UserMfaAttempts = typeof userMfaAttempts.$inferSelect;
export type InsertUserMfaAttempts = typeof userMfaAttempts.$inferInsert;
export type DeviceFingerprint = typeof deviceFingerprints.$inferSelect;
export type InsertDeviceFingerprint = typeof deviceFingerprints.$inferInsert;
export type MfaSecurityContext = typeof mfaSecurityContext.$inferSelect;
export type InsertMfaSecurityContext = typeof mfaSecurityContext.$inferInsert;
export type TrustedDevice = typeof trustedDevices.$inferSelect;
export type InsertTrustedDevice = typeof trustedDevices.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertRefreshToken = typeof refreshTokens.$inferInsert;
export type RevokedJwtToken = typeof revokedJwtTokens.$inferSelect;
export type InsertRevokedJwtToken = typeof revokedJwtTokens.$inferInsert;

// Additional commonly used types that were missing
export type UserCommunity = typeof userCommunities.$inferSelect;
export type InsertUserCommunity = typeof userCommunities.$inferInsert;
export type UserPlatformAccount = typeof userPlatformAccounts.$inferSelect;
export type InsertUserPlatformAccount = z.infer<
  typeof insertUserPlatformAccountSchema
>;
export type SafeUserPlatformAccount = Omit<
  UserPlatformAccount,
  "accessToken" | "refreshToken"
>;
export type ThemePreference = typeof themePreferences.$inferSelect;
export type InsertThemePreference = typeof themePreferences.$inferInsert;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type InsertEventAttendee = typeof eventAttendees.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type EmailVerificationToken =
  typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken =
  typeof emailVerificationTokens.$inferInsert;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = typeof userActivities.$inferInsert;
export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;
export type InsertTournamentParticipant = z.infer<
  typeof insertTournamentParticipantSchema
>;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type UpdateTournament = Partial<InsertTournament>;
export type CollaborationRequest = typeof collaborationRequests.$inferSelect;
export type InsertCollaborationRequest = z.infer<
  typeof insertCollaborationRequestSchema
>;
export type InsertGameSession = typeof gameSessions.$inferInsert;
export type InsertGameStateHistory = z.infer<
  typeof insertGameStateHistorySchema
>;
export type InsertGameAction = z.infer<typeof insertGameActionSchema>;
export type InsertStreamSession = z.infer<typeof insertStreamSessionSchema>;
export type InsertUserReputation = typeof userReputation.$inferInsert;
export type InsertBanEvasionTracking = typeof banEvasionTracking.$inferInsert;
export type InsertModerationTemplate = typeof moderationTemplates.$inferInsert;
export type UserMfaSettings = typeof userMfaSettings.$inferSelect;
export type InsertUserMfaSettings = typeof userMfaSettings.$inferInsert;
export type AuthAuditLog = typeof authAuditLog.$inferSelect;
export type InsertAuthAuditLog = typeof authAuditLog.$inferInsert;
