import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  date,
  decimal,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is used for authentication session management, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is used for user authentication and profile data, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  primaryCommunity: varchar("primary_community"), // Main gaming community
  // Enhanced profile fields
  username: varchar("username"), // Unique display name (will add unique constraint later)
  bio: text("bio"), // User biography/description
  location: varchar("location"), // Geographic location
  website: varchar("website"), // Personal website URL
  status: varchar("status").default("offline"), // online, offline, away, busy, gaming
  statusMessage: varchar("status_message"), // Custom status message
  timezone: varchar("timezone"), // User's timezone
  dateOfBirth: varchar("date_of_birth"), // YYYY-MM-DD format
  isPrivate: boolean("is_private").default(false), // Private profile setting
  showOnlineStatus: varchar("show_online_status").default("everyone"), // "everyone", "friends_only"
  allowDirectMessages: varchar("allow_direct_messages").default("everyone"), // "everyone", "friends_only"
  // Authentication fields
  passwordHash: varchar("password_hash"), // For credential-based authentication (null for OAuth users)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User platform accounts for cross-platform streaming coordination
export const userPlatformAccounts = pgTable("user_platform_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(), // 'youtube', 'twitch', 'facebook'
  handle: varchar("handle").notNull(), // Username/channel name for display
  platformUserId: varchar("platform_user_id"), // Platform-specific user ID
  channelId: varchar("channel_id"), // YouTube channel ID or equivalent
  pageId: varchar("page_id"), // Facebook page ID
  accessToken: text("access_token"), // OAuth access token (encrypted in storage)
  refreshToken: text("refresh_token"), // OAuth refresh token (encrypted in storage)
  tokenExpiresAt: timestamp("token_expires_at"), // Token expiration timestamp
  scopes: jsonb("scopes").default([]), // JSON array of granted permissions
  isActive: boolean("is_active").default(true), // Account is active and usable
  lastVerified: timestamp("last_verified"), // Last successful API verification
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.platform), // One account per platform per user
  index("idx_user_platform_active").on(table.userId, table.isActive),
]);

// Communities table for the 6 gaming communities
export const communities = pgTable("communities", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  themeColor: varchar("theme_color").notNull(),
  iconClass: varchar("icon_class").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User community preferences and memberships
export const userCommunities = pgTable("user_communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// User theme preferences
export const themePreferences = pgTable("theme_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  communityId: varchar("community_id").references(() => communities.id),
  themeMode: varchar("theme_mode").default("dark"), // dark, light, auto
  customColors: jsonb("custom_colors"), // Store custom theme colors
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events table for calendar events
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // tournament, convention, release, stream, community, personal, game_pod
  date: varchar("date").notNull(), // YYYY-MM-DD format
  time: varchar("time").notNull(), // HH:MM format
  location: varchar("location").notNull(),
  communityId: varchar("community_id").references(() => communities.id),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hostId: varchar("host_id").notNull().references(() => users.id, { onDelete: "cascade" }).default(''), // Primary host
  coHostId: varchar("co_host_id").references(() => users.id, { onDelete: "set null" }), // Optional co-host
  maxAttendees: integer("max_attendees"), // null means unlimited
  isPublic: boolean("is_public").default(true),
  status: varchar("status").default("active"), // active, cancelled, completed
  // Game pod specific fields
  playerSlots: integer("player_slots").default(4), // Number of main player slots (2-4)
  alternateSlots: integer("alternate_slots").default(2), // Number of alternate player slots
  gameFormat: varchar("game_format"), // Commander, Standard, Limited, etc.
  powerLevel: integer("power_level"), // 1-10 for power level matching
  // Recurring event fields
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: varchar("recurrence_pattern"), // daily, weekly, monthly
  recurrenceInterval: integer("recurrence_interval").default(1), // Every X days/weeks/months
  recurrenceEndDate: varchar("recurrence_end_date"), // When recurring events stop
  parentEventId: varchar("parent_event_id"), // Links to original event for recurring series
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_events_creator_id").on(table.creatorId),
  index("idx_events_community_id").on(table.communityId),
  index("idx_events_date").on(table.date),
  index("idx_events_status").on(table.status),
]);

// Event attendees table for tracking who's attending which events
export const eventAttendees = pgTable("event_attendees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status").default("attending"), // attending, maybe, not_attending
  role: varchar("role").default("participant"), // participant, host, co_host, spectator
  playerType: varchar("player_type").default("main"), // main, alternate
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  index("idx_event_attendees_event_id").on(table.eventId),
  index("idx_event_attendees_user_id").on(table.userId),
  index("idx_event_attendees_composite").on(table.eventId, table.userId),
]);

// Notifications table for real-time user notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // event_join, event_leave, game_invite, message, system
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional contextual data (event IDs, user IDs, etc.)
  isRead: boolean("is_read").default(false),
  priority: varchar("priority").default("normal"), // low, normal, high, urgent
  communityId: varchar("community_id").references(() => communities.id),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration for temporary notifications
}, (table) => [
  index("idx_notifications_user_id").on(table.userId),
  index("idx_notifications_is_read").on(table.isRead),
  index("idx_notifications_created_at").on(table.createdAt),
]);

// Messages table for user-to-user communication
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientId: varchar("recipient_id").references(() => users.id, { onDelete: "cascade" }),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }), // Optional: message tied to an event
  communityId: varchar("community_id").references(() => communities.id),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("direct"), // direct, event, community
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  editedAt: timestamp("edited_at"),
}, (table) => [
  index("idx_messages_sender_id").on(table.senderId),
  index("idx_messages_recipient_id").on(table.recipientId),
  index("idx_messages_created_at").on(table.createdAt),
  index("idx_messages_conversation").on(table.senderId, table.recipientId),
]);

// Game sessions table for real-time game coordination
export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  hostId: varchar("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  coHostId: varchar("co_host_id").references(() => users.id, { onDelete: "set null" }),
  status: varchar("status").default("waiting"), // waiting, active, paused, completed, cancelled
  currentPlayers: integer("current_players").default(0),
  maxPlayers: integer("max_players").notNull(),
  spectators: integer("spectators").default(0),
  gameData: jsonb("game_data"), // Store game-specific data (deck info, match details, etc.)
  communityId: varchar("community_id").references(() => communities.id),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
}, (table) => [
  index("idx_game_sessions_host_id").on(table.hostId),
  index("idx_game_sessions_event_id").on(table.eventId),
  index("idx_game_sessions_community_id").on(table.communityId),
  index("idx_game_sessions_status").on(table.status),
]);

// Stream sessions table for multi-platform streaming coordination
export const streamSessions = pgTable("stream_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostUserId: varchar("host_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  scheduledStartTime: timestamp("scheduled_start_time").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  endTime: timestamp("end_time"),
  status: varchar("status").default("scheduled"), // scheduled, live, ended, cancelled
  category: varchar("category").notNull(),
  tags: jsonb("tags").default([]), // String array for search/categorization
  communityId: varchar("community_id").references(() => communities.id),
  isPublic: boolean("is_public").default(true),
  autoStartEnabled: boolean("auto_start_enabled").default(false),
  crossPlatformChat: boolean("cross_platform_chat").default(false),
  recordingEnabled: boolean("recording_enabled").default(false),
  multistreaming: boolean("multistreaming").default(false),
  // Viewer metrics
  maxViewers: integer("max_viewers").default(0),
  averageViewers: integer("average_viewers").default(0),
  peakViewers: integer("peak_viewers").default(0),
  totalViewTime: integer("total_view_time").default(0), // in minutes
  // Advanced settings
  sessionData: jsonb("session_data"), // Additional metadata and settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_stream_sessions_host_user_id").on(table.hostUserId),
  index("idx_stream_sessions_community_id").on(table.communityId),
  index("idx_stream_sessions_status").on(table.status),
  index("idx_stream_sessions_scheduled_start").on(table.scheduledStartTime),
]);

// Stream session co-hosts for multi-host streams
export const streamSessionCoHosts = pgTable("stream_session_co_hosts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamSessionId: varchar("stream_session_id").notNull().references(() => streamSessions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role").default("co_host"), // co_host, moderator, guest
  permissions: jsonb("permissions").default({
    canControlStream: false,
    canManageChat: true,
    canInviteGuests: false,
    canEndStream: false
  }),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
}, (table) => [
  index("idx_stream_session_co_hosts_session_id").on(table.streamSessionId),
  index("idx_stream_session_co_hosts_user_id").on(table.userId),
]);

// Connected platforms for each stream session
export const streamSessionPlatforms = pgTable("stream_session_platforms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamSessionId: varchar("stream_session_id").notNull().references(() => streamSessions.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(), // twitch, youtube, facebook, discord
  platformUserId: varchar("platform_user_id"), // Platform-specific user ID
  platformUsername: varchar("platform_username"), // Platform username
  streamKey: varchar("stream_key"), // Encrypted stream key
  isActive: boolean("is_active").default(true),
  isLive: boolean("is_live").default(false),
  viewerCount: integer("viewer_count").default(0),
  chatEnabled: boolean("chat_enabled").default(true),
  platformMetadata: jsonb("platform_metadata"), // Platform-specific data
  lastStatusCheck: timestamp("last_status_check"),
  connectedAt: timestamp("connected_at").defaultNow(),
}, (table) => [
  index("idx_stream_session_platforms_session_id").on(table.streamSessionId),
  index("idx_stream_session_platforms_platform").on(table.platform),
  index("idx_stream_session_platforms_is_live").on(table.isLive),
]);

// Collaboration requests for stream coordination
export const collaborationRequests = pgTable("collaboration_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: varchar("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  streamSessionId: varchar("stream_session_id").references(() => streamSessions.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // co_host, raid, host, guest_appearance, collab_stream
  message: text("message"),
  scheduledTime: timestamp("scheduled_time"),
  status: varchar("status").default("pending"), // pending, accepted, declined, expired, cancelled
  metadata: jsonb("metadata"), // Additional request data
  responseMessage: text("response_message"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  respondedAt: timestamp("responded_at"),
}, (table) => [
  index("idx_collaboration_requests_from_user_id").on(table.fromUserId),
  index("idx_collaboration_requests_to_user_id").on(table.toUserId),
  index("idx_collaboration_requests_stream_session_id").on(table.streamSessionId),
  index("idx_collaboration_requests_status").on(table.status),
]);

// Real-time streaming analytics and metrics
export const streamAnalytics = pgTable("stream_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamSessionId: varchar("stream_session_id").notNull().references(() => streamSessions.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  viewerCount: integer("viewer_count").default(0),
  chatMessageCount: integer("chat_message_count").default(0),
  followersGained: integer("followers_gained").default(0),
  subscriptionsGained: integer("subscriptions_gained").default(0),
  donationsReceived: jsonb("donations_received"), // Amount and currency data
  averageChatSentiment: varchar("average_chat_sentiment"), // positive, neutral, negative
  topChatters: jsonb("top_chatters"), // Most active chat participants
  streamQuality: varchar("stream_quality"), // 720p, 1080p, etc.
  frameDrops: integer("frame_drops").default(0),
  bitrate: integer("bitrate"), // In kbps
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_stream_analytics_session_id").on(table.streamSessionId),
  index("idx_stream_analytics_platform").on(table.platform),
  index("idx_stream_analytics_timestamp").on(table.timestamp),
]);

// User activity and behavior analytics
export const userActivityAnalytics = pgTable("user_activity_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id"), // Browser/app session identifier
  eventType: varchar("event_type").notNull(), // page_view, feature_usage, interaction, etc.
  eventCategory: varchar("event_category").notNull(), // navigation, streaming, social, tournament, etc.
  eventAction: varchar("event_action").notNull(), // click, scroll, submit, create, join, etc.
  eventLabel: varchar("event_label"), // Specific element or feature name
  eventValue: integer("event_value"), // Numeric value associated with event
  pageUrl: varchar("page_url"), // Current page/route
  referrerUrl: varchar("referrer_url"), // Previous page/external referrer
  userAgent: varchar("user_agent"), // Browser/app info
  ipAddress: varchar("ip_address"), // For geographic analytics
  metadata: jsonb("metadata"), // Additional event-specific data
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => [
  index("idx_user_activity_analytics_user_id").on(table.userId),
  index("idx_user_activity_analytics_event_type").on(table.eventType),
  index("idx_user_activity_analytics_event_category").on(table.eventCategory),
  index("idx_user_activity_analytics_timestamp").on(table.timestamp),
  index("idx_user_activity_analytics_session_id").on(table.sessionId),
]);

// Community engagement and growth analytics
export const communityAnalytics = pgTable("community_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  date: date("date").notNull(), // Daily aggregation
  hour: integer("hour"), // Hour of day (0-23) for hourly aggregations
  activeUsers: integer("active_users").default(0), // Daily/hourly active users
  newMembers: integer("new_members").default(0), // New community joins
  totalMembers: integer("total_members").default(0), // Running total
  streamsStarted: integer("streams_started").default(0), // Streams initiated
  totalStreamTime: integer("total_stream_time").default(0), // Total streaming minutes
  collaborationsCreated: integer("collaborations_created").default(0), // New collaboration requests
  tournamentsCreated: integer("tournaments_created").default(0), // New tournaments
  forumPosts: integer("forum_posts").default(0), // Forum activity
  forumReplies: integer("forum_replies").default(0), // Forum engagement
  avgSessionDuration: integer("avg_session_duration").default(0), // Average user session length (minutes)
  retentionRate: decimal("retention_rate"), // Daily/weekly retention percentage
  engagementScore: decimal("engagement_score"), // Computed engagement metric
  metadata: jsonb("metadata"), // Additional community-specific metrics
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_community_analytics_community_id").on(table.communityId),
  index("idx_community_analytics_date").on(table.date),
  index("idx_community_analytics_hour").on(table.hour),
  unique("unique_community_date_hour").on(table.communityId, table.date, table.hour),
]);

// Platform-wide performance and system metrics  
export const platformMetrics = pgTable("platform_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: varchar("metric_type").notNull(), // performance, usage, system, error, etc.
  metricName: varchar("metric_name").notNull(), // response_time, memory_usage, active_connections, etc.
  metricValue: decimal("metric_value").notNull(), // Numeric value
  metricUnit: varchar("metric_unit"), // ms, mb, percent, count, etc.
  aggregationType: varchar("aggregation_type").notNull(), // avg, sum, max, min, count
  timeWindow: varchar("time_window").notNull(), // 1m, 5m, 1h, 1d for aggregation period
  tags: jsonb("tags"), // Additional dimensions (server, region, service, etc.)
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => [
  index("idx_platform_metrics_metric_type").on(table.metricType),
  index("idx_platform_metrics_metric_name").on(table.metricName),
  index("idx_platform_metrics_timestamp").on(table.timestamp),
  index("idx_platform_metrics_time_window").on(table.timeWindow),
]);

// Generic event tracking for user behavior analysis
export const eventTracking = pgTable("event_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  anonymousId: varchar("anonymous_id"), // For tracking non-logged-in users
  eventName: varchar("event_name").notNull(), // button_click, form_submit, feature_discovery, etc.
  eventSource: varchar("event_source").notNull(), // web, mobile, api, system
  properties: jsonb("properties"), // Event-specific properties and context
  traits: jsonb("traits"), // User traits at time of event
  context: jsonb("context"), // Device, browser, location context
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => [
  index("idx_event_tracking_user_id").on(table.userId),
  index("idx_event_tracking_anonymous_id").on(table.anonymousId),
  index("idx_event_tracking_event_name").on(table.eventName),
  index("idx_event_tracking_event_source").on(table.eventSource),
  index("idx_event_tracking_timestamp").on(table.timestamp),
]);

// Funnel and conversion analytics
export const conversionFunnels = pgTable("conversion_funnels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  funnelName: varchar("funnel_name").notNull(), // signup_flow, stream_creation, tournament_join, etc.
  stepName: varchar("step_name").notNull(), // step1_land, step2_signup, step3_verify, etc.
  stepOrder: integer("step_order").notNull(), // Sequential step number
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull(), // Track user journey across sessions
  completed: boolean("completed").default(false), // Whether user completed this step
  timeSpent: integer("time_spent"), // Time spent on this step (seconds)
  metadata: jsonb("metadata"), // Step-specific data
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => [
  index("idx_conversion_funnels_funnel_name").on(table.funnelName),
  index("idx_conversion_funnels_step_name").on(table.stepName),
  index("idx_conversion_funnels_user_id").on(table.userId),
  index("idx_conversion_funnels_session_id").on(table.sessionId),
  index("idx_conversion_funnels_timestamp").on(table.timestamp),
]);

// Password reset tokens for secure password recovery
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User social links (Discord, Twitch, Twitter, etc.)
export const userSocialLinks = pgTable("user_social_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(), // discord, twitch, twitter, youtube, steam, etc.
  username: varchar("username").notNull(),
  url: varchar("url").notNull(),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User gaming preferences and statistics
export const userGamingProfiles = pgTable("user_gaming_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  rank: varchar("rank"), // Player rank/rating in this game
  experience: varchar("experience"), // Experience level (beginner, intermediate, expert)
  favoriteDeck: text("favorite_deck"), // Favorite deck/character description
  achievements: jsonb("achievements"), // Game-specific achievements
  statistics: jsonb("statistics"), // Win/loss ratios, games played, etc.
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Friends and social connections
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addresseeId: varchar("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status").default("pending"), // pending, accepted, declined, blocked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_friendships_requester_id").on(table.requesterId),
  index("idx_friendships_addressee_id").on(table.addresseeId),
  index("idx_friendships_status").on(table.status),
]);

// User activity feed
export const userActivities = pgTable("user_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // event_join, friendship_new, achievement_unlock, game_win, etc.
  title: varchar("title").notNull(),
  description: text("description"),
  data: jsonb("data"), // Additional context data
  isPublic: boolean("is_public").default(true),
  communityId: varchar("community_id").references(() => communities.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User settings and preferences
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  theme: varchar("theme").default("system"), // system, light, dark
  notificationSettings: jsonb("notification_settings").default({
    // Delivery channels
    browser: true,
    email: true,
    push: false,
    sms: false,
    webhook: false,
    
    // Event types with granular channel preferences
    streamStarted: { browser: true, email: false, push: true, sms: false },
    streamEnded: { browser: true, email: false, push: false, sms: false },
    collaborationInvite: { browser: true, email: true, push: true, sms: false },
    raidIncoming: { browser: true, email: false, push: true, sms: false },
    eventReminders: { browser: true, email: true, push: true, sms: false },
    friendRequests: { browser: true, email: true, push: false, sms: false },
    socialUpdates: { browser: false, email: false, push: false, sms: false },
    tournamentUpdates: { browser: true, email: true, push: true, sms: false },
    systemAnnouncements: { browser: true, email: true, push: false, sms: false },
    weeklyDigest: { browser: false, email: true, push: false, sms: false },
    
    // Frequency settings
    digestFrequency: "weekly", // daily, weekly, monthly, never
    quietHours: { enabled: false, start: "22:00", end: "08:00" },
    timezone: "UTC",
    
    // Advanced preferences
    groupNotifications: true, // Group similar notifications
    soundEnabled: true,
    vibrationEnabled: true,
    showPreview: true // Show content in notification preview
  }),
  privacySettings: jsonb("privacy_settings").default({
    profileVisible: true,
    showOnlineStatus: true,
    allowDirectMessages: true,
    shareStreamingActivity: true
  }),
  streamingSettings: jsonb("streaming_settings").default({
    defaultQuality: "720p",
    autoStartRecording: false,
    chatOverlay: true,
    showViewerCount: true
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Matchmaking preferences
export const matchmakingPreferences = pgTable("matchmaking_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  selectedGames: jsonb("selected_games").default(["MTG"]),
  selectedFormats: jsonb("selected_formats").default(["commander"]),
  powerLevelMin: integer("power_level_min").default(1),
  powerLevelMax: integer("power_level_max").default(10),
  playstyle: varchar("playstyle").default("any"), // casual, focused, competitive, any
  location: varchar("location"),
  onlineOnly: boolean("online_only").default(false),
  availability: varchar("availability").default("any"), // morning, afternoon, evening, night, any
  language: varchar("language").default("english"),
  maxDistance: integer("max_distance").default(50), // km for location-based matching
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tournament brackets
export const tournaments = pgTable("tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  gameFormat: varchar("game_format").notNull(),
  communityId: varchar("community_id").notNull().references(() => communities.id),
  organizerId: varchar("organizer_id").notNull().references(() => users.id),
  maxParticipants: integer("max_participants").default(8),
  currentParticipants: integer("current_participants").default(0),
  status: varchar("status").default("upcoming"), // upcoming, active, completed, cancelled
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  bracketData: jsonb("bracket_data"), // Tournament bracket structure
  prizePool: varchar("prize_pool"),
  rules: text("rules"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tournamentParticipants = pgTable("tournament_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  seed: integer("seed"), // Tournament seeding
  status: varchar("status").default("registered"), // registered, active, eliminated, winner
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  index("idx_tournament_participants_tournament_id").on(table.tournamentId),
  index("idx_tournament_participants_user_id").on(table.userId),
]);

// Tournament formats and types
export const tournamentFormats = pgTable("tournament_formats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "Single Elimination", "Double Elimination", "Swiss", "Round Robin"
  code: varchar("code").notNull().unique(), // "single_elim", "double_elim", "swiss", "round_robin"
  description: text("description"),
  supportsSeeding: boolean("supports_seeding").default(true),
  requiresEvenParticipants: boolean("requires_even_participants").default(false),
  isActive: boolean("is_active").default(true),
});

// Tournament rounds for organizing matches
export const tournamentRounds = pgTable("tournament_rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  roundNumber: integer("round_number").notNull(),
  name: varchar("name"), // "Round 1", "Quarterfinals", "Semifinals", "Finals"
  status: varchar("status").default("pending"), // pending, active, completed
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_tournament_rounds_tournament_id").on(table.tournamentId),
  index("idx_tournament_rounds_status").on(table.status),
]);

// Tournament matches between players
export const tournamentMatches = pgTable("tournament_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  roundId: varchar("round_id").notNull().references(() => tournamentRounds.id, { onDelete: "cascade" }),
  player1Id: varchar("player1_id").references(() => users.id, { onDelete: "cascade" }),
  player2Id: varchar("player2_id").references(() => users.id, { onDelete: "cascade" }),
  winnerId: varchar("winner_id").references(() => users.id),
  status: varchar("status").default("pending"), // pending, active, completed, bye
  gameSessionId: varchar("game_session_id"), // Link to actual game room
  bracketPosition: integer("bracket_position"), // Position in the bracket
  player1Score: integer("player1_score").default(0),
  player2Score: integer("player2_score").default(0),
  matchData: jsonb("match_data"), // Additional match information
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_tournament_matches_tournament_id").on(table.tournamentId),
  index("idx_tournament_matches_round_id").on(table.roundId),
  index("idx_tournament_matches_status").on(table.status),
  index("idx_tournament_matches_player1_id").on(table.player1Id),
  index("idx_tournament_matches_player2_id").on(table.player2Id),
]);

// Match results for detailed tracking
export const matchResults = pgTable("match_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => tournamentMatches.id, { onDelete: "cascade" }),
  winnerId: varchar("winner_id").notNull().references(() => users.id),
  loserId: varchar("loser_id").references(() => users.id),
  winnerScore: integer("winner_score").notNull(),
  loserScore: integer("loser_score").notNull(),
  gameLength: integer("game_length"), // Duration in minutes
  resultType: varchar("result_type").default("normal"), // normal, forfeit, timeout, disqualification
  notes: text("notes"),
  reportedById: varchar("reported_by_id").notNull().references(() => users.id),
  verifiedById: varchar("verified_by_id").references(() => users.id),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_match_results_match_id").on(table.matchId),
  index("idx_match_results_winner_id").on(table.winnerId),
  index("idx_match_results_loser_id").on(table.loserId),
]);

// Forum posts table for community discussions
export const forumPosts = pgTable("forum_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  category: varchar("category").notNull(), // strategy, deck-tech, stream-tips, general, collaboration
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  replyCount: integer("reply_count").default(0),
  lastReplyAt: timestamp("last_reply_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_forum_posts_author_id").on(table.authorId),
  index("idx_forum_posts_community_id").on(table.communityId),
  index("idx_forum_posts_category").on(table.category),
  index("idx_forum_posts_created_at").on(table.createdAt),
]);

// Forum replies table for post discussions
export const forumReplies = pgTable("forum_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  parentReplyId: varchar("parent_reply_id"), // For nested replies - self reference added later
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_forum_replies_post_id").on(table.postId),
  index("idx_forum_replies_author_id").on(table.authorId),
  index("idx_forum_replies_created_at").on(table.createdAt),
]);

// Forum post likes table for tracking user likes
export const forumPostLikes = pgTable("forum_post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_forum_post_likes_post_id").on(table.postId),
  index("idx_forum_post_likes_user_id").on(table.userId),
]);

// Forum reply likes table for tracking user likes on replies
export const forumReplyLikes = pgTable("forum_reply_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  replyId: varchar("reply_id").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_forum_reply_likes_reply_id").on(table.replyId),
  index("idx_forum_reply_likes_user_id").on(table.userId),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userCommunities: many(userCommunities),
  themePreferences: many(themePreferences),
  createdEvents: many(events),
  eventAttendees: many(eventAttendees),
  notifications: many(notifications),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  hostedGameSessions: many(gameSessions, { relationName: "hostedGameSessions" }),
  coHostedGameSessions: many(gameSessions, { relationName: "coHostedGameSessions" }),
  socialLinks: many(userSocialLinks),
  gamingProfiles: many(userGamingProfiles),
  sentFriendRequests: many(friendships, { relationName: "sentFriendRequests" }),
  receivedFriendRequests: many(friendships, { relationName: "receivedFriendRequests" }),
  activities: many(userActivities),
  settings: many(userSettings),
  matchmakingPreferences: many(matchmakingPreferences),
  organizedTournaments: many(tournaments, { relationName: "organizedTournaments" }),
  tournamentParticipation: many(tournamentParticipants),
  forumPosts: many(forumPosts),
  forumReplies: many(forumReplies),
  forumPostLikes: many(forumPostLikes),
  forumReplyLikes: many(forumReplyLikes),
}));

export const communitiesRelations = relations(communities, ({ many }) => ({
  userCommunities: many(userCommunities),
  themePreferences: many(themePreferences),
  events: many(events),
  forumPosts: many(forumPosts),
}));

export const userCommunitiesRelations = relations(userCommunities, ({ one }) => ({
  user: one(users, {
    fields: [userCommunities.userId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [userCommunities.communityId],
    references: [communities.id],
  }),
}));

export const themePreferencesRelations = relations(themePreferences, ({ one }) => ({
  user: one(users, {
    fields: [themePreferences.userId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [themePreferences.communityId],
    references: [communities.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.creatorId],
    references: [users.id],
  }),
  host: one(users, {
    fields: [events.hostId],
    references: [users.id],
  }),
  coHost: one(users, {
    fields: [events.coHostId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [events.communityId],
    references: [communities.id],
  }),
  attendees: many(eventAttendees),
  gameSession: one(gameSessions),
  messages: many(messages),
}));

export const eventAttendeesRelations = relations(eventAttendees, ({ one }) => ({
  event: one(events, {
    fields: [eventAttendees.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventAttendees.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [notifications.communityId],
    references: [communities.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  event: one(events, {
    fields: [messages.eventId],
    references: [events.id],
  }),
  community: one(communities, {
    fields: [messages.communityId],
    references: [communities.id],
  }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one }) => ({
  event: one(events, {
    fields: [gameSessions.eventId],
    references: [events.id],
  }),
  host: one(users, {
    fields: [gameSessions.hostId],
    references: [users.id],
    relationName: "hostedGameSessions",
  }),
  coHost: one(users, {
    fields: [gameSessions.coHostId],
    references: [users.id],
    relationName: "coHostedGameSessions",
  }),
  community: one(communities, {
    fields: [gameSessions.communityId],
    references: [communities.id],
  }),
}));

export const userSocialLinksRelations = relations(userSocialLinks, ({ one }) => ({
  user: one(users, {
    fields: [userSocialLinks.userId],
    references: [users.id],
  }),
}));

export const userGamingProfilesRelations = relations(userGamingProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userGamingProfiles.userId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [userGamingProfiles.communityId],
    references: [communities.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(users, {
    fields: [friendships.requesterId],
    references: [users.id],
    relationName: "sentFriendRequests",
  }),
  addressee: one(users, {
    fields: [friendships.addresseeId],
    references: [users.id],
    relationName: "receivedFriendRequests",
  }),
}));

export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [userActivities.communityId],
    references: [communities.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const matchmakingPreferencesRelations = relations(matchmakingPreferences, ({ one }) => ({
  user: one(users, {
    fields: [matchmakingPreferences.userId],
    references: [users.id],
  }),
}));

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  organizer: one(users, {
    fields: [tournaments.organizerId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [tournaments.communityId],
    references: [communities.id],
  }),
  participants: many(tournamentParticipants),
  rounds: many(tournamentRounds),
  matches: many(tournamentMatches),
}));

export const tournamentParticipantsRelations = relations(tournamentParticipants, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentParticipants.tournamentId],
    references: [tournaments.id],
  }),
  user: one(users, {
    fields: [tournamentParticipants.userId],
    references: [users.id],
  }),
}));

export const tournamentFormatsRelations = relations(tournamentFormats, ({ many }) => ({
  tournaments: many(tournaments),
}));

export const tournamentRoundsRelations = relations(tournamentRounds, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [tournamentRounds.tournamentId],
    references: [tournaments.id],
  }),
  matches: many(tournamentMatches),
}));

export const tournamentMatchesRelations = relations(tournamentMatches, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [tournamentMatches.tournamentId],
    references: [tournaments.id],
  }),
  round: one(tournamentRounds, {
    fields: [tournamentMatches.roundId],
    references: [tournamentRounds.id],
  }),
  player1: one(users, {
    fields: [tournamentMatches.player1Id],
    references: [users.id],
    relationName: "player1Matches",
  }),
  player2: one(users, {
    fields: [tournamentMatches.player2Id],
    references: [users.id],
    relationName: "player2Matches",
  }),
  winner: one(users, {
    fields: [tournamentMatches.winnerId],
    references: [users.id],
    relationName: "wonMatches",
  }),
  results: many(matchResults),
}));

export const matchResultsRelations = relations(matchResults, ({ one }) => ({
  match: one(tournamentMatches, {
    fields: [matchResults.matchId],
    references: [tournamentMatches.id],
  }),
  winner: one(users, {
    fields: [matchResults.winnerId],
    references: [users.id],
    relationName: "wonResults",
  }),
  loser: one(users, {
    fields: [matchResults.loserId],
    references: [users.id],
    relationName: "lostResults",
  }),
  reportedBy: one(users, {
    fields: [matchResults.reportedById],
    references: [users.id],
    relationName: "reportedResults",
  }),
  verifiedBy: one(users, {
    fields: [matchResults.verifiedById],
    references: [users.id],
    relationName: "verifiedResults",
  }),
}));

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [forumPosts.authorId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [forumPosts.communityId],
    references: [communities.id],
  }),
  replies: many(forumReplies),
  likes: many(forumPostLikes),
}));

export const forumRepliesRelations = relations(forumReplies, ({ one, many }) => ({
  post: one(forumPosts, {
    fields: [forumReplies.postId],
    references: [forumPosts.id],
  }),
  author: one(users, {
    fields: [forumReplies.authorId],
    references: [users.id],
  }),
  parentReply: one(forumReplies, {
    fields: [forumReplies.parentReplyId],
    references: [forumReplies.id],
    relationName: "parentReply",
  }),
  childReplies: many(forumReplies, { relationName: "parentReply" }),
  likes: many(forumReplyLikes),
}));

export const forumPostLikesRelations = relations(forumPostLikes, ({ one }) => ({
  post: one(forumPosts, {
    fields: [forumPostLikes.postId],
    references: [forumPosts.id],
  }),
  user: one(users, {
    fields: [forumPostLikes.userId],
    references: [users.id],
  }),
}));

export const forumReplyLikesRelations = relations(forumReplyLikes, ({ one }) => ({
  reply: one(forumReplies, {
    fields: [forumReplyLikes.replyId],
    references: [forumReplies.id],
  }),
  user: one(users, {
    fields: [forumReplyLikes.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  createdAt: true,
});

export const insertUserCommunitySchema = createInsertSchema(userCommunities).omit({
  id: true,
  joinedAt: true,
});

export const insertUserPlatformAccountSchema = createInsertSchema(userPlatformAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThemePreferenceSchema = createInsertSchema(themePreferences).omit({
  id: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events, {
  title: z.string().min(1, "Title is required").max(200),
  type: z.enum(["tournament", "convention", "release", "stream", "community", "personal", "game_pod"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  location: z.string().min(1, "Location is required").max(200),
  maxAttendees: z.number().int().min(1).max(10000).optional(),
  playerSlots: z.number().int().min(2).max(4).optional(),
  alternateSlots: z.number().int().min(0).max(4).optional(),
  gameFormat: z.string().max(50).optional(),
  powerLevel: z.number().int().min(1).max(10).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(["daily", "weekly", "monthly"]).optional(),
  recurrenceInterval: z.number().int().min(1).max(30).optional(),
  recurrenceEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertEventAttendeeSchema = createInsertSchema(eventAttendees, {
  status: z.enum(["attending", "maybe", "not_attending"]),
  role: z.enum(["participant", "host", "co_host", "spectator"]),
  playerType: z.enum(["main", "alternate"]),
}).omit({
  id: true,
  joinedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  editedAt: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  endedAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  isUsed: true,
  createdAt: true,
});

export const insertUserSocialLinkSchema = createInsertSchema(userSocialLinks).omit({
  id: true,
  createdAt: true,
});

export const insertUserGamingProfileSchema = createInsertSchema(userGamingProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivities).omit({
  id: true,
  createdAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatchmakingPreferencesSchema = createInsertSchema(matchmakingPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,           // Prevent primary key tampering
  createdAt: true,    // Prevent timestamp manipulation  
  updatedAt: true,    // System managed field
});

export const updateTournamentSchema = insertTournamentSchema.partial().omit({
  organizerId: true,      // Prevent organizer hijacking
  communityId: true,      // Prevent community reassignment  
  status: true,           // Prevent status manipulation
  currentParticipants: true, // System calculated field
  bracketData: true,      // System generated tournament data
});

export const insertTournamentParticipantSchema = createInsertSchema(tournamentParticipants).omit({
  id: true,
  joinedAt: true,
});

// Streaming-related insert schemas
export const insertStreamSessionSchema = createInsertSchema(streamSessions, {
  title: z.string().min(1, "Title is required").max(200),
  scheduledStartTime: z.coerce.date(),
  actualStartTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  status: z.enum(["scheduled", "live", "ended", "cancelled"]),
  category: z.string().min(1, "Category is required").max(100),
  tags: z.array(z.string()).optional(),
  maxViewers: z.number().int().min(0).optional(),
  averageViewers: z.number().int().min(0).optional(),
  peakViewers: z.number().int().min(0).optional(),
  totalViewTime: z.number().int().min(0).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStreamSessionCoHostSchema = createInsertSchema(streamSessionCoHosts, {
  role: z.enum(["co_host", "moderator", "guest"]),
  permissions: z.object({
    canControlStream: z.boolean(),
    canManageChat: z.boolean(),
    canInviteGuests: z.boolean(),
    canEndStream: z.boolean(),
  }).optional(),
  leftAt: z.coerce.date().optional(),
}).omit({
  id: true,
  joinedAt: true,
});

export const insertStreamSessionPlatformSchema = createInsertSchema(streamSessionPlatforms, {
  platform: z.enum(["twitch", "youtube", "facebook", "discord"]),
  platformUserId: z.string().optional(),
  platformUsername: z.string().optional(),
  streamKey: z.string().optional(),
  viewerCount: z.number().int().min(0).optional(),
  lastStatusCheck: z.coerce.date().optional(),
}).omit({
  id: true,
  connectedAt: true,
});

export const insertCollaborationRequestSchema = createInsertSchema(collaborationRequests, {
  type: z.enum(["co_host", "raid", "host", "guest_appearance", "collab_stream"]),
  scheduledTime: z.coerce.date().optional(),
  status: z.enum(["pending", "accepted", "declined", "expired", "cancelled"]),
  expiresAt: z.coerce.date().optional(),
  respondedAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertStreamAnalyticsSchema = createInsertSchema(streamAnalytics, {
  platform: z.enum(["twitch", "youtube", "facebook", "discord"]),
  timestamp: z.coerce.date(),
  viewerCount: z.number().int().min(0).optional(),
  chatMessageCount: z.number().int().min(0).optional(),
  followersGained: z.number().int().min(0).optional(),
  subscriptionsGained: z.number().int().min(0).optional(),
  averageChatSentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  streamQuality: z.string().optional(),
  frameDrops: z.number().int().min(0).optional(),
  bitrate: z.number().int().min(0).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertTournamentFormatSchema = createInsertSchema(tournamentFormats).omit({
  id: true,
});

export const insertTournamentRoundSchema = createInsertSchema(tournamentRounds).omit({
  id: true,
  createdAt: true,
});

export const insertTournamentMatchSchema = createInsertSchema(tournamentMatches).omit({
  id: true,
  createdAt: true,
});

export const insertMatchResultSchema = createInsertSchema(matchResults).omit({
  id: true,
  createdAt: true,
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  viewCount: true,
  likeCount: true,
  replyCount: true,
  lastReplyAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertForumReplySchema = createInsertSchema(forumReplies).omit({
  id: true,
  likeCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertForumPostLikeSchema = createInsertSchema(forumPostLikes).omit({
  id: true,
  createdAt: true,
});

export const insertForumReplyLikeSchema = createInsertSchema(forumReplyLikes).omit({
  id: true,
  createdAt: true,
});

// Analytics insert schemas
export const insertUserActivityAnalyticsSchema = createInsertSchema(userActivityAnalytics, {
  eventType: z.enum(["page_view", "feature_usage", "interaction", "navigation", "form_submit"]),
  eventCategory: z.enum(["navigation", "streaming", "social", "tournament", "community", "profile", "settings"]),
  eventAction: z.enum(["click", "scroll", "submit", "create", "join", "leave", "share", "like", "comment"]),
  eventValue: z.number().int().min(0).optional(),
  timestamp: z.coerce.date().optional(),
}).omit({
  id: true,
});

export const insertCommunityAnalyticsSchema = createInsertSchema(communityAnalytics, {
  date: z.coerce.date(),
  hour: z.number().int().min(0).max(23).optional(),
  activeUsers: z.number().int().min(0).optional(),
  newMembers: z.number().int().min(0).optional(),
  totalMembers: z.number().int().min(0).optional(),
  streamsStarted: z.number().int().min(0).optional(),
  totalStreamTime: z.number().int().min(0).optional(),
  collaborationsCreated: z.number().int().min(0).optional(),
  tournamentsCreated: z.number().int().min(0).optional(),
  forumPosts: z.number().int().min(0).optional(),
  forumReplies: z.number().int().min(0).optional(),
  avgSessionDuration: z.number().int().min(0).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformMetricsSchema = createInsertSchema(platformMetrics, {
  metricType: z.enum(["performance", "usage", "system", "error", "business"]),
  metricValue: z.coerce.number(),
  aggregationType: z.enum(["avg", "sum", "max", "min", "count", "percentile"]),
  timeWindow: z.enum(["1m", "5m", "15m", "1h", "6h", "1d", "7d", "30d"]),
  timestamp: z.coerce.date().optional(),
}).omit({
  id: true,
});

export const insertEventTrackingSchema = createInsertSchema(eventTracking, {
  eventSource: z.enum(["web", "mobile", "api", "system", "webhook"]),
  timestamp: z.coerce.date().optional(),
}).omit({
  id: true,
});

export const insertConversionFunnelSchema = createInsertSchema(conversionFunnels, {
  stepOrder: z.number().int().min(1),
  completed: z.boolean().optional(),
  timeSpent: z.number().int().min(0).optional(),
  timestamp: z.coerce.date().optional(),
}).omit({
  id: true,
});

// =============================================================================
// ADMIN & MODERATION PLATFORM TABLES
// =============================================================================

// User roles for admin platform - supports hierarchical role-based access control
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role").notNull(), // admin, moderator, trust_safety, community_manager
  permissions: jsonb("permissions").notNull().default([]), // Array of permission strings
  communityId: varchar("community_id").references(() => communities.id), // Null for global roles
  assignedBy: varchar("assigned_by").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"), // Optional role expiration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_roles_user_id").on(table.userId),
  index("idx_user_roles_role").on(table.role),
  index("idx_user_roles_community").on(table.communityId),
  unique("unique_user_role_community").on(table.userId, table.role, table.communityId),
]);

// User reputation system - tracks user trustworthiness and behavior
export const userReputation = pgTable("user_reputation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").default(100), // Base score of 100, can go up or down
  level: varchar("level").default("new"), // new, trusted, veteran, flagged, restricted
  positiveActions: integer("positive_actions").default(0), // Count of positive behaviors
  negativeActions: integer("negative_actions").default(0), // Count of violations
  reportsMade: integer("reports_made").default(0), // User-submitted reports
  reportsAccurate: integer("reports_accurate").default(0), // How many were valid
  moderationHistory: jsonb("moderation_history").default([]), // Array of past actions
  lastCalculated: timestamp("last_calculated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_reputation_user_id").on(table.userId),
  index("idx_user_reputation_score").on(table.score),
  index("idx_user_reputation_level").on(table.level),
]);

// Content reports - user and system generated reports for moderation
export const contentReports = pgTable("content_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterUserId: varchar("reporter_user_id").references(() => users.id, { onDelete: "set null" }), // Null for system reports
  reportedUserId: varchar("reported_user_id").references(() => users.id, { onDelete: "cascade" }),
  contentType: varchar("content_type").notNull(), // forum_post, forum_reply, message, profile, stream
  contentId: varchar("content_id").notNull(), // ID of the reported content
  reason: varchar("reason").notNull(), // hate_speech, harassment, spam, inappropriate_content, etc.
  description: text("description"), // Additional details from reporter
  evidence: jsonb("evidence"), // Screenshots, links, etc.
  
  // System detection data
  isSystemGenerated: boolean("is_system_generated").default(false),
  automatedFlags: jsonb("automated_flags"), // ML/NLP detection results
  confidenceScore: decimal("confidence_score"), // AI confidence (0-1)
  
  // Moderation workflow
  status: varchar("status").default("pending"), // pending, investigating, resolved, dismissed
  priority: varchar("priority").default("medium"), // low, medium, high, urgent
  assignedModerator: varchar("assigned_moderator").references(() => users.id),
  moderationNotes: text("moderation_notes"), // Private notes for moderation team
  resolution: varchar("resolution"), // action_taken, false_positive, duplicate, etc.
  actionTaken: text("action_taken"), // Description of what was done
  
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  index("idx_content_reports_reporter").on(table.reporterUserId),
  index("idx_content_reports_reported").on(table.reportedUserId),
  index("idx_content_reports_status").on(table.status),
  index("idx_content_reports_priority").on(table.priority),
  index("idx_content_reports_assigned").on(table.assignedModerator),
  index("idx_content_reports_content").on(table.contentType, table.contentId),
  // Composite indexes for critical query paths
  index("idx_content_reports_status_type_created").on(table.status, table.contentType, table.createdAt),
]);

// Moderation actions - comprehensive log of all moderation activities
export const moderationActions = pgTable("moderation_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moderatorId: varchar("moderator_id").notNull().references(() => users.id),
  targetUserId: varchar("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action").notNull(), // warn, mute, restrict, shadowban, ban, unban, etc.
  reason: text("reason").notNull(), // Required reason for transparency
  duration: integer("duration"), // Duration in hours for temporary actions
  
  // Content context
  relatedContentType: varchar("related_content_type"), // What content triggered this
  relatedContentId: varchar("related_content_id"),
  relatedReportId: varchar("related_report_id").references(() => contentReports.id),
  
  // Action details
  isReversible: boolean("is_reversible").default(true),
  isPublic: boolean("is_public").default(false), // Whether action is visible to community
  metadata: jsonb("metadata"), // Additional action-specific data
  
  // Audit trail
  ipAddress: varchar("ip_address"), // For ban evasion tracking
  userAgent: varchar("user_agent"),
  adminNotes: text("admin_notes"), // Internal notes
  
  // Lifecycle
  isActive: boolean("is_active").default(true),
  reversedBy: varchar("reversed_by").references(() => users.id),
  reversedAt: timestamp("reversed_at"),
  reversalReason: text("reversal_reason"),
  expiresAt: timestamp("expires_at"), // For temporary actions
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_moderation_actions_moderator").on(table.moderatorId),
  index("idx_moderation_actions_target").on(table.targetUserId),
  index("idx_moderation_actions_action").on(table.action),
  index("idx_moderation_actions_active").on(table.isActive),
  index("idx_moderation_actions_expires").on(table.expiresAt),
  index("idx_moderation_actions_created").on(table.createdAt),
  // Composite indexes for critical query paths
  index("idx_moderation_actions_target_action_active").on(table.targetUserId, table.action, table.isActive),
]);

// Moderation queue - centralized queue for all moderation tasks
export const moderationQueue = pgTable("moderation_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemType: varchar("item_type").notNull(), // report, auto_flag, appeal, ban_evasion
  itemId: varchar("item_id").notNull(), // ID of the item (report, flag, etc.)
  priority: integer("priority").default(5), // 1-10, higher = more urgent
  
  // Assignment and workflow
  status: varchar("status").default("open"), // open, assigned, in_progress, completed, skipped
  assignedModerator: varchar("assigned_moderator").references(() => users.id),
  assignedAt: timestamp("assigned_at"),
  
  // Auto-prioritization data
  riskScore: decimal("risk_score"), // Computed risk score for prioritization
  userReputationScore: integer("user_reputation_score"), // Target user's reputation
  reporterReputationScore: integer("reporter_reputation_score"), // Reporter's reputation
  
  // Metadata
  summary: text("summary"), // Brief description for queue display
  tags: text("tags").array().default([]), // Categorization tags
  estimatedTimeMinutes: integer("estimated_time_minutes"), // Estimated resolution time
  
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_moderation_queue_status").on(table.status),
  index("idx_moderation_queue_priority").on(table.priority),
  index("idx_moderation_queue_assigned").on(table.assignedModerator),
  index("idx_moderation_queue_created").on(table.createdAt),
  index("idx_moderation_queue_item").on(table.itemType, table.itemId),
  // Composite indexes for critical query paths
  index("idx_moderation_queue_status_priority_created").on(table.status, table.priority, table.createdAt),
]);

// CMS content management - for Terms of Service, Privacy Policy, etc.
export const cmsContent = pgTable("cms_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // terms_of_service, privacy_policy, community_guidelines, etc.
  title: varchar("title").notNull(),
  content: text("content").notNull(), // HTML content from WYSIWYG editor
  
  // Versioning
  version: integer("version").notNull().default(1),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  scheduledPublishAt: timestamp("scheduled_publish_at"), // For scheduled publishing
  
  // Authorship and workflow
  authorId: varchar("author_id").notNull().references(() => users.id),
  lastEditedBy: varchar("last_edited_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Change tracking
  changeLog: text("change_log"), // Summary of what changed in this version
  previousVersionId: varchar("previous_version_id"),
  
  // SEO and metadata
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  slug: varchar("slug").unique(), // URL-friendly identifier
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_cms_content_type").on(table.type),
  index("idx_cms_content_published").on(table.isPublished),
  index("idx_cms_content_author").on(table.authorId),
  index("idx_cms_content_scheduled").on(table.scheduledPublishAt),
  index("idx_cms_content_version").on(table.type, table.version),
]);

// Ban evasion detection - tracks IP addresses and device fingerprints
export const banEvasionTracking = pgTable("ban_evasion_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Network and device fingerprinting
  ipAddress: varchar("ip_address").notNull(),
  hashedFingerprint: varchar("hashed_fingerprint"), // Hashed device fingerprint
  userAgent: text("user_agent"),
  screenResolution: varchar("screen_resolution"),
  timezone: varchar("timezone"),
  language: varchar("language"),
  
  // Behavioral patterns
  loginPatterns: jsonb("login_patterns"), // Times, frequency, etc.
  activitySignature: jsonb("activity_signature"), // Behavioral fingerprint
  
  // Detection metadata
  detectionMethod: varchar("detection_method"), // ip_match, fingerprint_match, behavioral
  confidenceScore: decimal("confidence_score"), // 0-1 confidence in evasion
  relatedBannedUser: varchar("related_banned_user").references(() => users.id),
  
  // Investigation status
  status: varchar("status").default("flagged"), // flagged, investigating, confirmed, false_positive
  investigatedBy: varchar("investigated_by").references(() => users.id),
  investigatedAt: timestamp("investigated_at"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ban_evasion_user").on(table.userId),
  index("idx_ban_evasion_ip").on(table.ipAddress),
  index("idx_ban_evasion_fingerprint").on(table.hashedFingerprint),
  index("idx_ban_evasion_status").on(table.status),
  index("idx_ban_evasion_confidence").on(table.confidenceScore),
]);

// User appeals - system for users to appeal moderation actions
export const userAppeals = pgTable("user_appeals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moderationActionId: varchar("moderation_action_id").notNull().references(() => moderationActions.id),
  
  // Appeal content
  reason: text("reason").notNull(), // User's explanation for appeal
  evidence: jsonb("evidence"), // User-provided evidence (links, explanations)
  additionalInfo: text("additional_info"), // Any other relevant information
  
  // Workflow
  status: varchar("status").default("pending"), // pending, under_review, approved, denied, withdrawn
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"), // Internal notes from reviewer
  decision: varchar("decision"), // approve, deny, partial_approve
  decisionReason: text("decision_reason"), // Explanation of decision
  
  // Communication
  responseToUser: text("response_to_user"), // Public response sent to user
  isUserNotified: boolean("is_user_notified").default(false),
  
  // Lifecycle
  canReappeal: boolean("can_reappeal").default(false),
  reappealCooldownUntil: timestamp("reappeal_cooldown_until"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_appeals_user").on(table.userId),
  index("idx_user_appeals_action").on(table.moderationActionId),
  index("idx_user_appeals_status").on(table.status),
  index("idx_user_appeals_reviewer").on(table.reviewedBy),
  index("idx_user_appeals_created").on(table.createdAt),
]);

// Saved moderation templates - for consistent communication
export const moderationTemplates = pgTable("moderation_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // Template name for easy identification
  category: varchar("category").notNull(), // warning, ban_notice, appeal_response, etc.
  subject: varchar("subject"), // Email/message subject line
  content: text("content").notNull(), // Template content with placeholders
  variables: jsonb("variables").default([]), // Array of available placeholder variables
  
  // Usage and management
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  lastModifiedBy: varchar("last_modified_by").notNull().references(() => users.id),
  usageCount: integer("usage_count").default(0), // How often it's been used
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_moderation_templates_category").on(table.category),
  index("idx_moderation_templates_active").on(table.isActive),
  index("idx_moderation_templates_creator").on(table.createdBy),
]);

// Admin audit log - comprehensive logging of all admin actions
export const adminAuditLog = pgTable("admin_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id),
  action: varchar("action").notNull(), // login, role_assign, user_ban, content_delete, etc.
  category: varchar("category").notNull(), // authentication, user_management, content_moderation, system_config
  
  // Target and context
  targetType: varchar("target_type"), // user, content, role, setting, etc.
  targetId: varchar("target_id"), // ID of the affected object
  targetIdentifier: varchar("target_identifier"), // Human-readable identifier (username, email, etc.)
  
  // Action details
  oldValues: jsonb("old_values"), // Previous state (for updates)
  newValues: jsonb("new_values"), // New state (for updates)
  parameters: jsonb("parameters"), // Action parameters and context
  
  // Technical details
  ipAddress: varchar("ip_address").notNull(),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id"),
  
  // Impact and results
  success: boolean("success").default(true),
  errorMessage: text("error_message"), // If action failed
  impactAssessment: varchar("impact_assessment"), // low, medium, high, critical
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_admin_audit_log_admin").on(table.adminUserId),
  index("idx_admin_audit_log_action").on(table.action),
  index("idx_admin_audit_log_category").on(table.category),
  index("idx_admin_audit_log_target").on(table.targetType, table.targetId),
  index("idx_admin_audit_log_created").on(table.createdAt),
  index("idx_admin_audit_log_ip").on(table.ipAddress),
]);

// Collaborative streaming events table - extends regular events for multi-streamer coordination
export const collaborativeStreamEvents = pgTable("collaborative_stream_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  scheduledStartTime: timestamp("scheduled_start_time", { withTimezone: true }).notNull(),
  estimatedDuration: integer("estimated_duration").notNull(), // Duration in minutes
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  communityId: varchar("community_id").references(() => communities.id),
  
  // Streaming specific fields
  streamingPlatforms: text("streaming_platforms").array().notNull(), // ['twitch', 'youtube', 'facebook']
  contentType: varchar("content_type").notNull(), // 'gaming', 'talk_show', 'tutorial', 'tournament'
  targetAudience: varchar("target_audience").notNull(), // 'beginner', 'intermediate', 'advanced', 'all'
  maxCollaborators: integer("max_collaborators").default(4), // Maximum number of co-streamers
  
  // Coordination settings
  requiresApproval: boolean("requires_approval").default(true), // Host must approve collaborators
  allowViewerParticipation: boolean("allow_viewer_participation").default(false),
  coordinationMode: varchar("coordination_mode").default("host_led"), // 'host_led', 'democratic', 'round_robin'
  
  // Stream setup
  streamKey: varchar("stream_key"), // For synchronized streaming
  chatCoordination: jsonb("chat_coordination"), // Chat moderation settings
  
  // Status and metadata
  status: varchar("status").default("planning"), // 'planning', 'recruiting', 'scheduled', 'live', 'completed', 'cancelled'
  aiMatchingData: jsonb("ai_matching_data"), // Data from AI matching system
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_collab_stream_events_creator").on(table.creatorId),
  index("idx_collab_stream_events_community").on(table.communityId),
  index("idx_collab_stream_events_start_time").on(table.scheduledStartTime),
  index("idx_collab_stream_events_status").on(table.status),
]);

// Stream collaborators table - manages participants in collaborative streaming events  
export const streamCollaborators = pgTable("stream_collaborators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamEventId: varchar("stream_event_id").notNull().references(() => collaborativeStreamEvents.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Collaboration role and status
  role: varchar("role").notNull(), // 'host', 'co_host', 'guest', 'moderator'
  status: varchar("status").default("invited"), // 'invited', 'accepted', 'declined', 'removed'
  invitedByUserId: varchar("invited_by_user_id").references(() => users.id, { onDelete: "set null" }),
  
  // Platform specific information
  platformHandles: jsonb("platform_handles"), // {'twitch': 'username', 'youtube': 'channel_id'}
  streamingCapabilities: text("streaming_capabilities").array(), // ['host', 'co_stream', 'guest_appear']
  
  // Coordination preferences
  availableTimeSlots: jsonb("available_time_slots"), // When this collaborator is available
  contentSpecialties: text("content_specialties").array(), // ['deck_building', 'strategy', 'entertainment']
  technicalSetup: jsonb("technical_setup"), // Stream quality, equipment info
  
  // Timestamps
  invitedAt: timestamp("invited_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  joinedAt: timestamp("joined_at"),
  
}, (table) => [
  index("idx_stream_collaborators_event").on(table.streamEventId),
  index("idx_stream_collaborators_user").on(table.userId),
  index("idx_stream_collaborators_status").on(table.status),
  unique("unique_collaborator_per_event").on(table.streamEventId, table.userId),
]);

// Stream coordination sessions - real-time coordination during live streaming
export const streamCoordinationSessions = pgTable("stream_coordination_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamEventId: varchar("stream_event_id").notNull().references(() => collaborativeStreamEvents.id, { onDelete: "cascade" }),
  
  // Session details
  actualStartTime: timestamp("actual_start_time", { withTimezone: true }),
  actualEndTime: timestamp("actual_end_time", { withTimezone: true }),
  currentPhase: varchar("current_phase").default("preparation"), // 'preparation', 'live', 'break', 'wrap_up', 'ended'
  
  // Real-time coordination data
  activeCollaborators: text("active_collaborators").array(), // Currently live collaborator user IDs
  currentHost: varchar("current_host").references(() => users.id), // Who's currently leading
  platformStatuses: jsonb("platform_statuses"), // Status per platform {'twitch': 'live', 'youtube': 'offline'}
  
  // Stream metrics and coordination
  viewerCounts: jsonb("viewer_counts"), // Viewer counts per platform
  coordinationEvents: jsonb("coordination_events"), // Log of coordination events
  chatModerationActive: boolean("chat_moderation_active").default(false),
  
  // Technical coordination
  streamQualitySettings: jsonb("stream_quality_settings"), // Shared quality settings
  audioCoordination: jsonb("audio_coordination"), // Audio mixing and coordination
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_stream_coord_sessions_event").on(table.streamEventId),
  index("idx_stream_coord_sessions_phase").on(table.currentPhase),
  index("idx_stream_coord_sessions_start_time").on(table.actualStartTime),
]);

// Zod schemas for the collaborative streaming tables
export const insertCollaborativeStreamEventSchema = createInsertSchema(collaborativeStreamEvents);
export const insertStreamCollaboratorSchema = createInsertSchema(streamCollaborators);
export const insertStreamCoordinationSessionSchema = createInsertSchema(streamCoordinationSessions);

// Admin & Moderation Platform Insert Schemas
export const insertUserRoleSchema = createInsertSchema(userRoles, {
  role: z.enum(["admin", "moderator", "trust_safety", "community_manager"]),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserReputationSchema = createInsertSchema(userReputation, {
  score: z.number().int().min(0).max(1000).optional(),
  level: z.enum(["new", "trusted", "veteran", "flagged", "restricted"]).optional(),
  positiveActions: z.number().int().min(0).optional(),
  negativeActions: z.number().int().min(0).optional(),
  reportsMade: z.number().int().min(0).optional(),
  reportsAccurate: z.number().int().min(0).optional(),
  moderationHistory: z.array(z.any()).optional(),
  lastCalculated: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentReportSchema = createInsertSchema(contentReports, {
  contentType: z.enum(["forum_post", "forum_reply", "message", "profile", "stream", "event", "user_bio"]),
  reason: z.enum(["hate_speech", "harassment", "spam", "inappropriate_content", "misinformation", "violence", "sexual_content", "copyright", "other"]),
  evidence: z.any().optional(),
  isSystemGenerated: z.boolean().optional(),
  automatedFlags: z.any().optional(),
  confidenceScore: z.coerce.number().min(0).max(1).optional(),
  status: z.enum(["pending", "investigating", "resolved", "dismissed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  resolvedAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertModerationActionSchema = createInsertSchema(moderationActions, {
  action: z.enum(["warn", "mute", "restrict", "shadowban", "ban", "unban", "content_remove", "account_suspend"]),
  duration: z.number().int().min(1).optional(), // Duration in hours
  isReversible: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  metadata: z.any().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.coerce.date().optional(),
  reversedAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertModerationQueueSchema = createInsertSchema(moderationQueue, {
  itemType: z.enum(["report", "auto_flag", "appeal", "ban_evasion"]),
  priority: z.number().int().min(1).max(10).optional(),
  status: z.enum(["open", "assigned", "in_progress", "completed", "skipped"]).optional(),
  assignedAt: z.coerce.date().optional(),
  riskScore: z.coerce.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
  estimatedTimeMinutes: z.number().int().min(1).optional(),
  completedAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertCmsContentSchema = createInsertSchema(cmsContent, {
  type: z.enum(["terms_of_service", "privacy_policy", "community_guidelines", "faq", "help_article", "announcement"]),
  version: z.number().int().min(1).optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.coerce.date().optional(),
  scheduledPublishAt: z.coerce.date().optional(),
  approvedAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBanEvasionTrackingSchema = createInsertSchema(banEvasionTracking, {
  detectionMethod: z.enum(["ip_match", "fingerprint_match", "behavioral", "manual"]).optional(),
  confidenceScore: z.coerce.number().min(0).max(1).optional(),
  status: z.enum(["flagged", "investigating", "confirmed", "false_positive"]).optional(),
  loginPatterns: z.any().optional(),
  activitySignature: z.any().optional(),
  investigatedAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertUserAppealSchema = createInsertSchema(userAppeals, {
  evidence: z.any().optional(),
  status: z.enum(["pending", "under_review", "approved", "denied", "withdrawn"]).optional(),
  decision: z.enum(["approve", "deny", "partial_approve"]).optional(),
  reviewedAt: z.coerce.date().optional(),
  isUserNotified: z.boolean().optional(),
  canReappeal: z.boolean().optional(),
  reappealCooldownUntil: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertModerationTemplateSchema = createInsertSchema(moderationTemplates, {
  category: z.enum(["warning", "ban_notice", "appeal_response", "content_removal", "account_action", "general"]),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  usageCount: z.number().int().min(0).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog, {
  category: z.enum(["authentication", "user_management", "content_moderation", "system_config", "role_assignment", "data_access"]),
  oldValues: z.any().optional(),
  newValues: z.any().optional(),
  parameters: z.any().optional(),
  success: z.boolean().optional(),
  impactAssessment: z.enum(["low", "medium", "high", "critical"]).optional(),
}).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Community = typeof communities.$inferSelect;
export type UserCommunity = typeof userCommunities.$inferSelect;
export type UserPlatformAccount = typeof userPlatformAccounts.$inferSelect;
export type SafeUserPlatformAccount = Omit<UserPlatformAccount, 'accessToken' | 'refreshToken'>;
export type ThemePreference = typeof themePreferences.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type UserSocialLink = typeof userSocialLinks.$inferSelect;
export type UserGamingProfile = typeof userGamingProfiles.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type UserActivity = typeof userActivities.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type MatchmakingPreferences = typeof matchmakingPreferences.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;
export type TournamentFormat = typeof tournamentFormats.$inferSelect;
export type TournamentRound = typeof tournamentRounds.$inferSelect;
export type TournamentMatch = typeof tournamentMatches.$inferSelect;
export type MatchResult = typeof matchResults.$inferSelect;
export type ForumPost = typeof forumPosts.$inferSelect;
export type ForumReply = typeof forumReplies.$inferSelect;
export type ForumPostLike = typeof forumPostLikes.$inferSelect;
export type ForumReplyLike = typeof forumReplyLikes.$inferSelect;
export type StreamSession = typeof streamSessions.$inferSelect;
export type StreamSessionCoHost = typeof streamSessionCoHosts.$inferSelect;
export type StreamSessionPlatform = typeof streamSessionPlatforms.$inferSelect;
export type CollaborationRequest = typeof collaborationRequests.$inferSelect;
export type StreamAnalytics = typeof streamAnalytics.$inferSelect;
export type UserActivityAnalytics = typeof userActivityAnalytics.$inferSelect;
export type CommunityAnalytics = typeof communityAnalytics.$inferSelect;
export type PlatformMetrics = typeof platformMetrics.$inferSelect;
export type EventTracking = typeof eventTracking.$inferSelect;
export type ConversionFunnel = typeof conversionFunnels.$inferSelect;
export type CollaborativeStreamEvent = typeof collaborativeStreamEvents.$inferSelect;
export type StreamCollaborator = typeof streamCollaborators.$inferSelect;
export type StreamCoordinationSession = typeof streamCoordinationSessions.$inferSelect;

// Admin & Moderation Platform Types
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type InsertUserCommunity = z.infer<typeof insertUserCommunitySchema>;
export type InsertUserPlatformAccount = z.infer<typeof insertUserPlatformAccountSchema>;
export type InsertThemePreference = z.infer<typeof insertThemePreferenceSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertEventAttendee = z.infer<typeof insertEventAttendeeSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type InsertUserSocialLink = z.infer<typeof insertUserSocialLinkSchema>;
export type InsertUserGamingProfile = z.infer<typeof insertUserGamingProfileSchema>;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type InsertMatchmakingPreferences = z.infer<typeof insertMatchmakingPreferencesSchema>;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type UpdateTournament = z.infer<typeof updateTournamentSchema>;
export type InsertTournamentParticipant = z.infer<typeof insertTournamentParticipantSchema>;
export type InsertTournamentFormat = z.infer<typeof insertTournamentFormatSchema>;
export type InsertTournamentRound = z.infer<typeof insertTournamentRoundSchema>;
export type InsertTournamentMatch = z.infer<typeof insertTournamentMatchSchema>;
export type InsertMatchResult = z.infer<typeof insertMatchResultSchema>;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
export type InsertForumPostLike = z.infer<typeof insertForumPostLikeSchema>;
export type InsertForumReplyLike = z.infer<typeof insertForumReplyLikeSchema>;
export type InsertStreamSession = z.infer<typeof insertStreamSessionSchema>;
export type InsertStreamSessionCoHost = z.infer<typeof insertStreamSessionCoHostSchema>;
export type InsertStreamSessionPlatform = z.infer<typeof insertStreamSessionPlatformSchema>;
export type InsertCollaborationRequest = z.infer<typeof insertCollaborationRequestSchema>;
export type InsertStreamAnalytics = z.infer<typeof insertStreamAnalyticsSchema>;
export type InsertUserActivityAnalytics = z.infer<typeof insertUserActivityAnalyticsSchema>;
export type InsertCommunityAnalytics = z.infer<typeof insertCommunityAnalyticsSchema>;
export type InsertPlatformMetrics = z.infer<typeof insertPlatformMetricsSchema>;
export type InsertEventTracking = z.infer<typeof insertEventTrackingSchema>;
export type InsertConversionFunnel = z.infer<typeof insertConversionFunnelSchema>;
export type InsertCollaborativeStreamEvent = z.infer<typeof insertCollaborativeStreamEventSchema>;
export type InsertStreamCollaborator = z.infer<typeof insertStreamCollaboratorSchema>;
export type InsertStreamCoordinationSession = z.infer<typeof insertStreamCoordinationSessionSchema>;

// Admin & Moderation Platform Insert Types
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type InsertUserReputation = z.infer<typeof insertUserReputationSchema>;
export type InsertContentReport = z.infer<typeof insertContentReportSchema>;
export type InsertModerationAction = z.infer<typeof insertModerationActionSchema>;
export type InsertModerationQueue = z.infer<typeof insertModerationQueueSchema>;
export type InsertCmsContent = z.infer<typeof insertCmsContentSchema>;
export type InsertBanEvasionTracking = z.infer<typeof insertBanEvasionTrackingSchema>;
export type InsertUserAppeal = z.infer<typeof insertUserAppealSchema>;
export type InsertModerationTemplate = z.infer<typeof insertModerationTemplateSchema>;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;
