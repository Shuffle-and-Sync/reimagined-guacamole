import {
  users,
  communities,
  userCommunities,
  themePreferences,
  events,
  eventAttendees,
  passwordResetTokens,
  type User,
  type UpsertUser,
  type Community,
  type UserCommunity,
  type ThemePreference,
  type Event,
  type EventAttendee,
  type PasswordResetToken,
  type InsertCommunity,
  type InsertUserCommunity,
  type InsertThemePreference,
  type InsertEvent,
  type InsertEventAttendee,
  type InsertPasswordResetToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, count, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User>;
  
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
  
  // Event operations
  getEvents(filters?: { userId?: string; communityId?: string; type?: string; upcoming?: boolean }): Promise<(Event & { creator: User; community: Community | null; attendeeCount: number; isUserAttending?: boolean })[]>;
  getEvent(id: string, userId?: string): Promise<(Event & { creator: User; community: Community | null; attendeeCount: number; isUserAttending: boolean }) | undefined>;
  createEvent(data: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  
  // Event attendee operations
  joinEvent(data: InsertEventAttendee): Promise<EventAttendee>;
  leaveEvent(eventId: string, userId: string): Promise<void>;
  getEventAttendees(eventId: string): Promise<(EventAttendee & { user: User })[]>;
  getUserEventAttendance(userId: string): Promise<(EventAttendee & { event: Event })[]>;
  
  // Password reset operations
  createPasswordResetToken(data: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
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
      .values([communityData])
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

  // Event operations
  async getEvents(filters?: { userId?: string; communityId?: string; type?: string; upcoming?: boolean }): Promise<(Event & { creator: User; community: Community | null; attendeeCount: number; isUserAttending?: boolean })[]> {
    const baseQuery = db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        type: events.type,
        date: events.date,
        time: events.time,
        location: events.location,
        communityId: events.communityId,
        creatorId: events.creatorId,
        maxAttendees: events.maxAttendees,
        isPublic: events.isPublic,
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
      conditions.push(eq(events.type, filters.type));
    }
    if (filters?.upcoming) {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(gte(events.date, today));
    }

    let query = baseQuery;
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rawEvents = await query.orderBy(events.date, events.time);

    // Get attendee counts and user attendance separately
    const eventIds = rawEvents.map(e => e.id);
    const attendeeCounts = eventIds.length > 0 ? await db
      .select({
        eventId: eventAttendees.eventId,
        count: count(eventAttendees.id).as('count'),
      })
      .from(eventAttendees)
      .where(sql`${eventAttendees.eventId} IN ${eventIds}`)
      .groupBy(eventAttendees.eventId) : [];

    const userAttendance = filters?.userId && eventIds.length > 0 ? await db
      .select({
        eventId: eventAttendees.eventId,
      })
      .from(eventAttendees)
      .where(and(
        sql`${eventAttendees.eventId} IN ${eventIds}`,
        eq(eventAttendees.userId, filters.userId)
      )) : [];

    return rawEvents.map(event => ({
      ...event,
      attendeeCount: attendeeCounts.find(ac => ac.eventId === event.id)?.count || 0,
      isUserAttending: userAttendance.some(ua => ua.eventId === event.id),
    }));
  }

  async getEvent(id: string, userId?: string): Promise<(Event & { creator: User; community: Community | null; attendeeCount: number; isUserAttending: boolean }) | undefined> {
    const [event] = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        type: events.type,
        date: events.date,
        time: events.time,
        location: events.location,
        communityId: events.communityId,
        creatorId: events.creatorId,
        maxAttendees: events.maxAttendees,
        isPublic: events.isPublic,
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
    const isUserAttending = userId ? await db
      .select({ id: eventAttendees.id })
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.eventId, id),
        eq(eventAttendees.userId, userId)
      ))
      .then(result => result.length > 0) : false;

    return {
      ...event,
      attendeeCount: attendeeCount?.count || 0,
      isUserAttending,
    };
  }

  async createEvent(data: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(data)
      .returning();
    return event;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: string): Promise<void> {
    await db
      .delete(events)
      .where(eq(events.id, id));
  }

  // Event attendee operations
  async joinEvent(data: InsertEventAttendee): Promise<EventAttendee> {
    const [attendee] = await db
      .insert(eventAttendees)
      .values(data)
      .onConflictDoUpdate({
        target: [eventAttendees.eventId, eventAttendees.userId],
        set: {
          status: data.status || 'attending',
          joinedAt: new Date(),
        },
      })
      .returning();
    return attendee;
  }

  async leaveEvent(eventId: string, userId: string): Promise<void> {
    await db
      .delete(eventAttendees)
      .where(
        and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.userId, userId)
        )
      );
  }

  async getEventAttendees(eventId: string): Promise<(EventAttendee & { user: User })[]> {
    return await db
      .select({
        id: eventAttendees.id,
        eventId: eventAttendees.eventId,
        userId: eventAttendees.userId,
        status: eventAttendees.status,
        joinedAt: eventAttendees.joinedAt,
        user: users,
      })
      .from(eventAttendees)
      .innerJoin(users, eq(eventAttendees.userId, users.id))
      .where(eq(eventAttendees.eventId, eventId));
  }

  async getUserEventAttendance(userId: string): Promise<(EventAttendee & { event: Event })[]> {
    return await db
      .select({
        id: eventAttendees.id,
        eventId: eventAttendees.eventId,
        userId: eventAttendees.userId,
        status: eventAttendees.status,
        joinedAt: eventAttendees.joinedAt,
        event: events,
      })
      .from(eventAttendees)
      .innerJoin(events, eq(eventAttendees.eventId, events.id))
      .where(eq(eventAttendees.userId, userId));
  }

  // Password reset operations
  async createPasswordResetToken(data: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(data)
      .returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.isUsed, false),
          gte(passwordResetTokens.expiresAt, new Date())
        )
      );
    return resetToken;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(
        and(
          gte(new Date(), passwordResetTokens.expiresAt)
        )
      );
  }
}

export const storage = new DatabaseStorage();
