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
  showOnlineStatus: boolean("show_online_status").default(true),
  allowDirectMessages: boolean("allow_direct_messages").default(true),
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
  type: varchar("type").notNull(), // tournament, convention, release, stream, community, personal
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event attendees table for tracking who's attending which events
export const eventAttendees = pgTable("event_attendees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status").default("attending"), // attending, maybe, not_attending
  role: varchar("role").default("participant"), // participant, host, co_host
  joinedAt: timestamp("joined_at").defaultNow(),
});

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
});

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
});

// Game sessions table for real-time game coordination
export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  hostId: varchar("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  coHostId: varchar("co_host_id").references(() => users.id, { onDelete: "set null" }),
  status: varchar("status").default("waiting"), // waiting, active, paused, completed, cancelled
  currentPlayers: integer("current_players").default(0),
  maxPlayers: integer("max_players").notNull(),
  gameData: jsonb("game_data"), // Store game-specific data (deck info, match details, etc.)
  communityId: varchar("community_id").references(() => communities.id),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
});

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
});

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
}));

export const communitiesRelations = relations(communities, ({ many }) => ({
  userCommunities: many(userCommunities),
  themePreferences: many(themePreferences),
  events: many(events),
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

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventAttendeeSchema = createInsertSchema(eventAttendees).omit({
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
export type UserGamingProfile = typeof userGamingProfiles.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type UserActivity = typeof userActivities.$inferSelect;

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
export type InsertUserGamingProfile = z.infer<typeof insertUserGamingProfileSchema>;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
