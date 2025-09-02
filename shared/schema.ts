import { sql } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
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
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

// Platform OAuth tokens for real API integrations
export const platformTokens = pgTable("platform_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(), // twitch, youtube, discord, twitter, instagram, tiktok
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenType: varchar("token_type").default("Bearer"),
  expiresAt: timestamp("expires_at"),
  scope: text("scope"), // Platform-specific permissions
  platformUserId: varchar("platform_user_id"), // User ID on the external platform
  platformUsername: varchar("platform_username"), // Username on the external platform
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_platform_tokens_user_id").on(table.userId),
  index("idx_platform_tokens_platform").on(table.platform),
  uniqueIndex("unique_user_platform").on(table.userId, table.platform),
]);

// Social media posts and scheduling
export const socialPosts = pgTable("social_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  platforms: jsonb("platforms").notNull(), // Array of platform IDs to post to
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  status: varchar("status").default("draft"), // draft, scheduled, published, failed
  mediaUrls: jsonb("media_urls"), // Array of media URLs/attachments
  platformData: jsonb("platform_data"), // Platform-specific data (hashtags, mentions, etc.)
  engagement: jsonb("engagement").default({}), // Likes, shares, comments per platform
  errors: jsonb("errors"), // Any posting errors encountered
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_social_posts_user_id").on(table.userId),
  index("idx_social_posts_status").on(table.status),
  index("idx_social_posts_scheduled_for").on(table.scheduledFor),
]);

// Webhook configurations for platform events  
export const webhookConfigs = pgTable("webhook_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: varchar("platform").notNull(), // twitch, youtube, discord
  eventType: varchar("event_type").notNull(), // stream_start, stream_end, new_follower, etc.
  webhookUrl: varchar("webhook_url").notNull(),
  secret: varchar("secret"), // Webhook verification secret
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  triggerCount: integer("trigger_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_webhook_configs_platform").on(table.platform),
  index("idx_webhook_configs_event_type").on(table.eventType),
]);

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
    email: true,
    browser: true,
    eventReminders: true,
    socialUpdates: false,
    weeklyDigest: true
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

export const insertPlatformTokenSchema = createInsertSchema(platformTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebhookConfigSchema = createInsertSchema(webhookConfigs).omit({
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
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTournamentParticipantSchema = createInsertSchema(tournamentParticipants).omit({
  id: true,
  joinedAt: true,
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

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Community = typeof communities.$inferSelect;
export type UserCommunity = typeof userCommunities.$inferSelect;
export type ThemePreference = typeof themePreferences.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type UserSocialLink = typeof userSocialLinks.$inferSelect;
export type PlatformToken = typeof platformTokens.$inferSelect;
export type SocialPost = typeof socialPosts.$inferSelect;
export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type UserGamingProfile = typeof userGamingProfiles.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type UserActivity = typeof userActivities.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type MatchmakingPreferences = typeof matchmakingPreferences.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;
export type ForumPost = typeof forumPosts.$inferSelect;
export type ForumReply = typeof forumReplies.$inferSelect;
export type ForumPostLike = typeof forumPostLikes.$inferSelect;
export type ForumReplyLike = typeof forumReplyLikes.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type InsertUserCommunity = z.infer<typeof insertUserCommunitySchema>;
export type InsertThemePreference = z.infer<typeof insertThemePreferenceSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertEventAttendee = z.infer<typeof insertEventAttendeeSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type InsertUserSocialLink = z.infer<typeof insertUserSocialLinkSchema>;
export type InsertPlatformToken = z.infer<typeof insertPlatformTokenSchema>;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type InsertWebhookConfig = z.infer<typeof insertWebhookConfigSchema>;
export type InsertUserGamingProfile = z.infer<typeof insertUserGamingProfileSchema>;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type InsertMatchmakingPreferences = z.infer<typeof insertMatchmakingPreferencesSchema>;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type InsertTournamentParticipant = z.infer<typeof insertTournamentParticipantSchema>;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
export type InsertForumPostLike = z.infer<typeof insertForumPostLikeSchema>;
export type InsertForumReplyLike = z.infer<typeof insertForumReplyLikeSchema>;
