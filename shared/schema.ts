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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userCommunities: many(userCommunities),
  themePreferences: many(themePreferences),
}));

export const communitiesRelations = relations(communities, ({ many }) => ({
  userCommunities: many(userCommunities),
  themePreferences: many(themePreferences),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
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

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Community = typeof communities.$inferSelect;
export type UserCommunity = typeof userCommunities.$inferSelect;
export type ThemePreference = typeof themePreferences.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type InsertUserCommunity = z.infer<typeof insertUserCommunitySchema>;
export type InsertThemePreference = z.infer<typeof insertThemePreferenceSchema>;
