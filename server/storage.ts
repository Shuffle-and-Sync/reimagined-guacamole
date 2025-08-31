import {
  users,
  communities,
  userCommunities,
  themePreferences,
  type User,
  type UpsertUser,
  type Community,
  type UserCommunity,
  type ThemePreference,
  type InsertCommunity,
  type InsertUserCommunity,
  type InsertThemePreference,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Community operations
  getCommunities(): Promise<Community[]>;
  getCommunity(id: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  
  // User community operations
  getUserCommunities(userId: string): Promise<(UserCommunity & { community: Community })[]>;
  joinCommunity(data: InsertUserCommunity): Promise<UserCommunity>;
  setPrimaryCommunity(userId: string, communityId: string): Promise<void>;
  
  // Theme preference operations
  getUserThemePreferences(userId: string): Promise<ThemePreference[]>;
  upsertThemePreference(data: InsertThemePreference): Promise<ThemePreference>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    return user;
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
    return community;
  }

  async createCommunity(communityData: InsertCommunity): Promise<Community> {
    const [community] = await db
      .insert(communities)
      .values(communityData)
      .returning();
    return community;
  }

  // User community operations
  async getUserCommunities(userId: string): Promise<(UserCommunity & { community: Community })[]> {
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
    return userCommunity;
  }

  async setPrimaryCommunity(userId: string, communityId: string): Promise<void> {
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
          eq(userCommunities.communityId, communityId)
        )
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

  // Theme preference operations
  async getUserThemePreferences(userId: string): Promise<ThemePreference[]> {
    return await db
      .select()
      .from(themePreferences)
      .where(eq(themePreferences.userId, userId));
  }

  async upsertThemePreference(data: InsertThemePreference): Promise<ThemePreference> {
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
    return preference;
  }
}

export const storage = new DatabaseStorage();
