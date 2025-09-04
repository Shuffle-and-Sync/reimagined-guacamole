import {
  users,
  communities,
  userCommunities,
  themePreferences,
  events,
  eventAttendees,
  notifications,
  messages,
  gameSessions,
  passwordResetTokens,
  userSocialLinks,
  platformTokens,
  socialPosts,
  webhookConfigs,
  userGamingProfiles,
  friendships,
  userActivities,
  userSettings,
  matchmakingPreferences,
  tournaments,
  tournamentParticipants,
  forumPosts,
  forumReplies,
  forumPostLikes,
  forumReplyLikes,
  type User,
  type UpsertUser,
  type Community,
  type UserCommunity,
  type ThemePreference,
  type Event,
  type EventAttendee,
  type Notification,
  type Message,
  type GameSession,
  type PasswordResetToken,
  type UserSocialLink,
  type PlatformToken,
  type SocialPost,
  type WebhookConfig,
  type UserGamingProfile,
  type Friendship,
  type UserActivity,
  type UserSettings,
  type MatchmakingPreferences,
  type Tournament,
  type TournamentParticipant,
  type ForumPost,
  type ForumReply,
  type ForumPostLike,
  type ForumReplyLike,
  type InsertCommunity,
  type InsertUserCommunity,
  type InsertThemePreference,
  type InsertEvent,
  type InsertEventAttendee,
  type InsertNotification,
  type InsertMessage,
  type InsertGameSession,
  type InsertPasswordResetToken,
  type InsertUserSocialLink,
  type InsertPlatformToken,
  type InsertSocialPost,
  type InsertWebhookConfig,
  type InsertUserGamingProfile,
  type InsertFriendship,
  type InsertUserActivity,
  type InsertUserSettings,
  type InsertMatchmakingPreferences,
  type InsertTournament,
  type InsertTournamentParticipant,
  type InsertForumPost,
  type InsertForumReply,
  type InsertForumPostLike,
  type InsertForumReplyLike,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, count, sql, or, desc, not } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User>;
  createUser(userData: { email: string; username: string; firstName: string; lastName: string; passwordHash: string }): Promise<User>;
  validateUserCredentials(email: string, password: string): Promise<User | null>;
  updateLastLogin(userId: string): Promise<void>;
  updateLoginAttempts(email: string, attempts: number, lockedUntil?: Date): Promise<void>;
  
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
  // Bulk calendar operations for game pods
  createBulkEvents(data: InsertEvent[]): Promise<Event[]>;
  createRecurringEvents(data: InsertEvent, endDate: string): Promise<Event[]>;
  getCalendarEvents(filters: { communityId?: string; startDate: string; endDate: string; type?: string }): Promise<(Event & { creator: User; community: Community | null; attendeeCount: number; mainPlayers: number; alternates: number })[]>;
  
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
  
  // Notification operations
  getUserNotifications(userId: string, options?: { unreadOnly?: boolean; limit?: number }): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  
  // Message operations
  getUserMessages(userId: string, options?: { eventId?: string; communityId?: string; limit?: number }): Promise<(Message & { sender: User; recipient?: User; event?: Event })[]>;
  sendMessage(data: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<void>;
  getConversation(userId1: string, userId2: string): Promise<(Message & { sender: User; recipient?: User })[]>;
  
  // Game session operations
  getGameSessions(filters?: { eventId?: string; communityId?: string; hostId?: string; status?: string }): Promise<(GameSession & { host: User; coHost?: User; event: Event })[]>;
  getGameSessionById(id: string): Promise<(GameSession & { host: User; coHost?: User; event: Event }) | null>;
  createGameSession(data: InsertGameSession): Promise<GameSession>;
  updateGameSession(id: string, data: Partial<InsertGameSession>): Promise<GameSession>;
  joinGameSession(sessionId: string, userId: string): Promise<void>;
  leaveGameSession(sessionId: string, userId: string): Promise<void>;
  
  // Social link operations
  getUserSocialLinks(userId: string): Promise<UserSocialLink[]>;
  updateUserSocialLinks(userId: string, links: InsertUserSocialLink[]): Promise<UserSocialLink[]>;
  
  // Gaming profile operations
  getUserGamingProfiles(userId: string): Promise<(UserGamingProfile & { community: Community })[]>;
  upsertUserGamingProfile(data: InsertUserGamingProfile): Promise<UserGamingProfile>;
  
  // Friendship operations
  getFriends(userId: string): Promise<(Friendship & { requester: User; addressee: User })[]>;
  getFriendRequests(userId: string): Promise<(Friendship & { requester: User; addressee: User })[]>;
  getFriendCount(userId: string): Promise<number>;
  sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship>;
  respondToFriendRequest(friendshipId: string, status: 'accepted' | 'declined' | 'blocked'): Promise<Friendship>;
  checkFriendshipStatus(userId1: string, userId2: string): Promise<Friendship | undefined>;
  
  // User activity operations
  getUserActivities(userId: string, options?: { limit?: number; communityId?: string }): Promise<(UserActivity & { community?: Community })[]>;
  createUserActivity(data: InsertUserActivity): Promise<UserActivity>;
  
  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(data: InsertUserSettings): Promise<UserSettings>;
  
  // Matchmaking operations
  getMatchmakingPreferences(userId: string): Promise<MatchmakingPreferences | undefined>;
  upsertMatchmakingPreferences(data: InsertMatchmakingPreferences): Promise<MatchmakingPreferences>;
  findMatchingPlayers(userId: string, preferences: MatchmakingPreferences): Promise<any[]>;
  
  // Tournament operations
  getTournaments(communityId?: string): Promise<(Tournament & { organizer: User; community: Community; participantCount: number })[]>;
  getTournament(tournamentId: string): Promise<(Tournament & { organizer: User; community: Community; participants: (TournamentParticipant & { user: User })[] }) | undefined>;
  createTournament(data: InsertTournament): Promise<Tournament>;
  joinTournament(tournamentId: string, userId: string): Promise<TournamentParticipant>;
  leaveTournament(tournamentId: string, userId: string): Promise<boolean>;
  
  // Forum operations
  getForumPosts(communityId: string, options?: { category?: string; limit?: number; offset?: number }): Promise<(ForumPost & { author: User; community: Community; replyCount: number; likeCount: number; isLiked?: boolean })[]>;
  getForumPost(id: string, userId?: string): Promise<(ForumPost & { author: User; community: Community; isLiked: boolean }) | undefined>;
  createForumPost(data: InsertForumPost): Promise<ForumPost>;
  updateForumPost(id: string, data: Partial<InsertForumPost>): Promise<ForumPost>;
  deleteForumPost(id: string): Promise<void>;
  likeForumPost(postId: string, userId: string): Promise<void>;
  unlikeForumPost(postId: string, userId: string): Promise<void>;
  getForumReplies(postId: string, userId?: string): Promise<(ForumReply & { author: User; isLiked?: boolean; childReplies?: ForumReply[] })[]>;
  createForumReply(data: InsertForumReply): Promise<ForumReply>;
  likeForumReply(replyId: string, userId: string): Promise<void>;
  unlikeForumReply(replyId: string, userId: string): Promise<void>;
  
  // Platform integration operations
  getUserPlatformTokens(userId: string): Promise<PlatformToken[]>;
  getPlatformToken(userId: string, platform: string): Promise<PlatformToken | undefined>;
  savePlatformToken(data: InsertPlatformToken): Promise<PlatformToken>;
  updatePlatformToken(userId: string, platform: string, data: Partial<InsertPlatformToken>): Promise<PlatformToken>;
  deletePlatformToken(userId: string, platform: string): Promise<void>;
  refreshPlatformToken(userId: string, platform: string, newTokenData: Partial<InsertPlatformToken>): Promise<PlatformToken>;
  
  // Social media posting operations
  createSocialPost(data: InsertSocialPost): Promise<SocialPost>;
  getUserSocialPosts(userId: string, options?: { status?: string; limit?: number }): Promise<SocialPost[]>;
  updateSocialPost(postId: string, data: Partial<InsertSocialPost>): Promise<SocialPost>;
  deleteSocialPost(postId: string): Promise<void>;
  getScheduledPosts(userId?: string): Promise<SocialPost[]>;
  
  // Webhook operations
  getWebhookConfigs(platform?: string): Promise<WebhookConfig[]>;
  createWebhookConfig(data: InsertWebhookConfig): Promise<WebhookConfig>;
  updateWebhookConfig(id: string, data: Partial<InsertWebhookConfig>): Promise<WebhookConfig>;
  deleteWebhookConfig(id: string): Promise<void>;
  logWebhookTrigger(id: string): Promise<void>;
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: { email: string; username: string; firstName: string; lastName: string; passwordHash: string }): Promise<User> {
    const { randomUUID } = await import('crypto');
    const [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash: userData.passwordHash,
        emailVerified: false,
        role: 'user',
        accountStatus: 'active',
        loginAttempts: 0,
      })
      .returning();
    return user;
  }

  async validateUserCredentials(email: string, password: string): Promise<User | null> {
    const bcrypt = await import('bcryptjs');
    const user = await this.getUserByEmail(email);
    
    if (!user || !user.passwordHash) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    return isValidPassword ? user : null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        loginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateLoginAttempts(email: string, attempts: number, lockedUntil?: Date): Promise<void> {
    await db
      .update(users)
      .set({
        loginAttempts: attempts,
        lockedUntil: lockedUntil || null,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));
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
        hostId: events.hostId,
        coHostId: events.coHostId,
        maxAttendees: events.maxAttendees,
        isPublic: events.isPublic,
        status: events.status,
        playerSlots: events.playerSlots,
        alternateSlots: events.alternateSlots,
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
      conditions.push(eq(events.type, filters.type));
    }
    if (filters?.upcoming) {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(gte(events.date, today));
    }

    const query = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

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
      creator: event.creator || { 
        id: '', email: null, firstName: null, lastName: null, profileImageUrl: null,
        primaryCommunity: null, username: null, bio: null, location: null, website: null,
        status: null, statusMessage: null, timezone: null, dateOfBirth: null,
        isPrivate: false, showOnlineStatus: 'everyone' as any, allowDirectMessages: 'everyone' as any,
        createdAt: new Date(), updatedAt: new Date()
      },
      community: event.community,
      attendeeCount: attendeeCounts.find(ac => ac.eventId === event.id)?.count || 0,
      isUserAttending: userAttendance.some(ua => ua.eventId === event.id),
    })) as (Event & { creator: User; community: Community | null; attendeeCount: number; isUserAttending?: boolean })[];
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
        hostId: events.hostId,
        coHostId: events.coHostId,
        maxAttendees: events.maxAttendees,
        isPublic: events.isPublic,
        status: events.status,
        playerSlots: events.playerSlots,
        alternateSlots: events.alternateSlots,
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
      creator: event.creator || { 
        id: '', email: null, firstName: null, lastName: null, profileImageUrl: null,
        primaryCommunity: null, username: null, bio: null, location: null, website: null,
        status: null, statusMessage: null, timezone: null, dateOfBirth: null,
        isPrivate: false, showOnlineStatus: 'everyone' as any, allowDirectMessages: 'everyone' as any,
        createdAt: new Date(), updatedAt: new Date()
      },
      community: event.community,
      attendeeCount: attendeeCount?.count || 0,
      isUserAttending,
    } as Event & { creator: User; community: Community | null; attendeeCount: number; isUserAttending: boolean };
  }

  async createEvent(data: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(data)
      .returning();
      
    // Auto-create TableSync session for game pod events
    if (event.type === 'game-pod') {
      try {
        const gameSessionData = {
          eventId: event.id,
          hostId: event.creatorId,
          status: 'waiting',
          currentPlayers: 0,
          maxPlayers: event.playerSlots || 4,
          gameData: {
            name: event.title,
            format: event.gameFormat || 'commander',
            powerLevel: event.powerLevel || 'casual',
            description: event.description || '',
          },
          communityId: event.communityId,
        };
        
        await this.createGameSession(gameSessionData);
      } catch (error) {
        console.error('Failed to create automatic TableSync session:', error);
        // Don't fail the event creation if TableSync session fails
      }
    }
    
    return event;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set(data)
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
        role: eventAttendees.role,
        playerType: eventAttendees.playerType,
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
        role: eventAttendees.role,
        playerType: eventAttendees.playerType,
        joinedAt: eventAttendees.joinedAt,
        event: events,
      })
      .from(eventAttendees)
      .innerJoin(events, eq(eventAttendees.eventId, events.id))
      .where(eq(eventAttendees.userId, userId));
  }

  // Bulk calendar operations for game pods
  async createBulkEvents(data: InsertEvent[]): Promise<Event[]> {
    if (data.length === 0) return [];
    const createdEvents = await db
      .insert(events)
      .values(data)
      .returning();
      
    // Auto-create TableSync sessions for game pod events
    for (const event of createdEvents) {
      if (event.type === 'game-pod') {
        try {
          const gameSessionData = {
            eventId: event.id,
            hostId: event.creatorId,
            status: 'waiting',
            currentPlayers: 0,
            maxPlayers: event.playerSlots || 4,
            gameData: {
              name: event.title,
              format: event.gameFormat || 'commander',
              powerLevel: event.powerLevel || 'casual',
              description: event.description || '',
            },
            communityId: event.communityId,
          };
          
          await this.createGameSession(gameSessionData);
        } catch (error) {
          console.error(`Failed to create automatic TableSync session for event ${event.id}:`, error);
          // Don't fail the bulk creation if individual TableSync sessions fail
        }
      }
    }
    
    return createdEvents;
  }

  async createRecurringEvents(data: InsertEvent, endDate: string): Promise<Event[]> {
    if (!data.isRecurring || !data.recurrencePattern || !data.recurrenceInterval) {
      throw new Error('Invalid recurring event data');
    }

    const eventList: InsertEvent[] = [];
    const startDate = new Date(data.date + 'T' + (data.time || '12:00'));
    const end = new Date(endDate);
    let currentDate = new Date(startDate);
    const interval = Number(data.recurrenceInterval) || 1;
    
    while (currentDate <= end) {
      eventList.push({
        ...data,
        date: currentDate.toISOString().split('T')[0],
        parentEventId: null, // Will be set after first event is created
      });
      
      // Calculate next occurrence based on pattern
      switch (data.recurrencePattern as string) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
      }
    }

    return this.createBulkEvents(eventList);
  }

  async getCalendarEvents(filters: { communityId?: string; startDate: string; endDate: string; type?: string }): Promise<(Event & { creator: User; community: Community | null; attendeeCount: number; mainPlayers: number; alternates: number })[]> {
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
        hostId: events.hostId,
        coHostId: events.coHostId,
        maxAttendees: events.maxAttendees,
        isPublic: events.isPublic,
        status: events.status,
        playerSlots: events.playerSlots,
        alternateSlots: events.alternateSlots,
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

    let conditions = [
      gte(events.date, filters.startDate),
      sql`${events.date} <= ${filters.endDate}`
    ];
    
    if (filters.communityId) {
      conditions.push(eq(events.communityId, filters.communityId));
    }
    if (filters.type) {
      conditions.push(eq(events.type, filters.type));
    }

    const rawEvents = await baseQuery
      .where(and(...conditions))
      .orderBy(events.date, events.time);

    // Get player counts for each event
    const eventIds = rawEvents.map(e => e.id);
    const playerCounts = eventIds.length > 0 ? await db
      .select({
        eventId: eventAttendees.eventId,
        totalCount: count(eventAttendees.id).as('totalCount'),
        mainPlayers: count(sql`CASE WHEN ${eventAttendees.playerType} = 'main' THEN 1 END`).as('mainPlayers'),
        alternates: count(sql`CASE WHEN ${eventAttendees.playerType} = 'alternate' THEN 1 END`).as('alternates'),
      })
      .from(eventAttendees)
      .where(sql`${eventAttendees.eventId} IN ${eventIds}`)
      .groupBy(eventAttendees.eventId) : [];

    return rawEvents.map(event => ({
      ...event,
      creator: event.creator || { 
        id: '', email: null, firstName: null, lastName: null, profileImageUrl: null,
        primaryCommunity: null, username: null, bio: null, location: null, website: null,
        status: null, statusMessage: null, timezone: null, dateOfBirth: null,
        isPrivate: false, showOnlineStatus: 'everyone' as any, allowDirectMessages: 'everyone' as any,
        createdAt: new Date(), updatedAt: new Date()
      },
      community: event.community,
      attendeeCount: playerCounts.find(pc => pc.eventId === event.id)?.totalCount || 0,
      mainPlayers: playerCounts.find(pc => pc.eventId === event.id)?.mainPlayers || 0,
      alternates: playerCounts.find(pc => pc.eventId === event.id)?.alternates || 0,
    })) as (Event & { creator: User; community: Community | null; attendeeCount: number; mainPlayers: number; alternates: number })[];
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
        sql`${passwordResetTokens.expiresAt} < ${new Date()}`
      );
  }

  // Notification operations
  async getUserNotifications(userId: string, options?: { unreadOnly?: boolean; limit?: number }): Promise<Notification[]> {
    let conditions = [eq(notifications.userId, userId)];
    
    if (options?.unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }
    
    const baseQuery = db.select().from(notifications).where(and(...conditions));
    
    const limitedQuery = options?.limit ? baseQuery.limit(options.limit) : baseQuery;
    
    return await limitedQuery.orderBy(sql`${notifications.createdAt} DESC`);
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  // Message operations
  async getUserMessages(userId: string, options?: { eventId?: string; communityId?: string; limit?: number }): Promise<(Message & { sender: User; recipient?: User; event?: Event })[]> {
    let conditions = [
      sql`(${messages.senderId} = ${userId} OR ${messages.recipientId} = ${userId})`
    ];

    if (options?.eventId) {
      conditions.push(eq(messages.eventId, options.eventId));
    }

    if (options?.communityId) {
      conditions.push(eq(messages.communityId, options.communityId));
    }

    const results = await db.select({
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

    return results.map((r: { message: any; sender: any }) => ({ ...r.message, sender: r.sender }));
  }

  async sendMessage(data: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(data).returning();
    return message;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  async getConversation(userId1: string, userId2: string): Promise<(Message & { sender: User; recipient?: User })[]> {
    const results = await db.select({
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
             (${messages.senderId} = ${userId2} AND ${messages.recipientId} = ${userId1}))`
      )
    )
    .orderBy(sql`${messages.createdAt} ASC`);

    return results.map((r: { message: any; sender: any }) => ({ ...r.message, sender: r.sender }));
  }

  // Game session operations
  async getGameSessionById(id: string): Promise<(GameSession & { host: User; coHost?: User; event: Event }) | null> {
    const results = await db.select({
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
    return { 
      ...r.gameSession, 
      host: r.host as User, 
      event: r.event as Event 
    };
  }

  async getGameSessions(filters?: { eventId?: string; communityId?: string; hostId?: string; status?: string }): Promise<(GameSession & { host: User; coHost?: User; event: Event })[]> {
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
      conditions.push(eq(gameSessions.status, filters.status));
    }

    const results = await db.select({
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

    return results.map((r: { gameSession: any; host: any; event: any }) => ({ 
      ...r.gameSession, 
      host: r.host as User, 
      event: r.event as Event 
    }));
  }

  async createGameSession(data: InsertGameSession): Promise<GameSession> {
    const [gameSession] = await db.insert(gameSessions).values(data).returning();
    return gameSession;
  }

  async updateGameSession(id: string, data: Partial<InsertGameSession>): Promise<GameSession> {
    const [gameSession] = await db.update(gameSessions)
      .set(data)
      .where(eq(gameSessions.id, id))
      .returning();
    return gameSession;
  }

  async joinGameSession(sessionId: string, userId: string): Promise<void> {
    // Increment current players count
    await db.update(gameSessions)
      .set({ currentPlayers: sql`${gameSessions.currentPlayers} + 1` })
      .where(eq(gameSessions.id, sessionId));
  }

  async leaveGameSession(sessionId: string, userId: string): Promise<void> {
    // Decrement current players count
    await db.update(gameSessions)
      .set({ currentPlayers: sql`GREATEST(${gameSessions.currentPlayers} - 1, 0)` })
      .where(eq(gameSessions.id, sessionId));
  }

  async spectateGameSession(sessionId: string, userId: string): Promise<void> {
    // Increment spectator count
    await db.update(gameSessions)
      .set({ spectators: sql`${gameSessions.spectators} + 1` })
      .where(eq(gameSessions.id, sessionId));
  }

  async leaveSpectating(sessionId: string, userId: string): Promise<void> {
    // Decrement spectator count
    await db.update(gameSessions)
      .set({ spectators: sql`GREATEST(${gameSessions.spectators} - 1, 0)` })
      .where(eq(gameSessions.id, sessionId));
  }
  
  // Social link operations
  async getUserSocialLinks(userId: string): Promise<UserSocialLink[]> {
    const links = await db
      .select()
      .from(userSocialLinks)
      .where(eq(userSocialLinks.userId, userId));
    return links;
  }

  async updateUserSocialLinks(userId: string, links: InsertUserSocialLink[]): Promise<UserSocialLink[]> {
    // Delete existing links
    await db.delete(userSocialLinks).where(eq(userSocialLinks.userId, userId));
    
    // Insert new links
    if (links.length > 0) {
      const newLinks = await db
        .insert(userSocialLinks)
        .values(links.map(link => ({ ...link, userId })))
        .returning();
      return newLinks;
    }
    return [];
  }
  
  // Gaming profile operations
  async getUserGamingProfiles(userId: string): Promise<(UserGamingProfile & { community: Community })[]> {
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
      .innerJoin(communities, eq(userGamingProfiles.communityId, communities.id))
      .where(eq(userGamingProfiles.userId, userId));
    return profiles;
  }

  async upsertUserGamingProfile(data: InsertUserGamingProfile): Promise<UserGamingProfile> {
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
    return profile;
  }
  
  // Friendship operations
  async getFriends(userId: string): Promise<(Friendship & { requester: User; addressee: User })[]> {
    const requesterUser = alias(users, 'requesterUser');
    const addresseeUser = alias(users, 'addresseeUser');
    
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
          eq(friendships.status, 'accepted'),
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          )
        )
      );
    
    return results.map(r => ({
      ...r,
      requester: r.requester as User,
      addressee: r.addressee as User,
    }));
  }

  async getFriendRequests(userId: string): Promise<(Friendship & { requester: User; addressee: User })[]> {
    const requesterUser = alias(users, 'requesterUser');
    const addresseeUser = alias(users, 'addresseeUser');
    
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
          eq(friendships.status, 'pending'),
          eq(friendships.addresseeId, userId)
        )
      );
    
    return results.map(r => ({
      ...r,
      requester: r.requester as User,
      addressee: r.addressee as User,
    }));
  }

  async getFriendCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count(friendships.id) })
      .from(friendships)
      .where(
        and(
          eq(friendships.status, 'accepted'),
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          )
        )
      );
    return result?.count || 0;
  }

  async checkFriendshipStatus(userId1: string, userId2: string): Promise<Friendship | undefined> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, userId1),
            eq(friendships.addresseeId, userId2)
          ),
          and(
            eq(friendships.requesterId, userId2),
            eq(friendships.addresseeId, userId1)
          )
        )
      );
    return friendship;
  }

  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({
        requesterId,
        addresseeId,
        status: 'pending',
      })
      .returning();
    return friendship;
  }

  async respondToFriendRequest(friendshipId: string, status: 'accepted' | 'declined' | 'blocked'): Promise<Friendship> {
    const [friendship] = await db
      .update(friendships)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(friendships.id, friendshipId))
      .returning();
    return friendship;
  }
  
  // User activity operations
  async getUserActivities(userId: string, options?: { limit?: number; communityId?: string }): Promise<(UserActivity & { community?: Community })[]> {
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
    
    const limitedQuery = options?.limit ? baseQuery.limit(options.limit) : baseQuery;
    
    const activities = await limitedQuery.orderBy(sql`${userActivities.createdAt} DESC`);
    return activities.map(activity => ({
      ...activity,
      community: activity.community || undefined,
    }));
  }

  async createUserActivity(data: InsertUserActivity): Promise<UserActivity> {
    const [activity] = await db
      .insert(userActivities)
      .values(data)
      .returning();
    return activity;
  }
  
  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings;
  }

  async upsertUserSettings(data: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values(data)
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          theme: data.theme,
          notificationSettings: data.notificationSettings,
          privacySettings: data.privacySettings,
          streamingSettings: data.streamingSettings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return settings;
  }
  
  // Matchmaking operations
  async getMatchmakingPreferences(userId: string): Promise<MatchmakingPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(matchmakingPreferences)
      .where(eq(matchmakingPreferences.userId, userId));
    return preferences;
  }

  async upsertMatchmakingPreferences(data: InsertMatchmakingPreferences): Promise<MatchmakingPreferences> {
    const [preferences] = await db
      .insert(matchmakingPreferences)
      .values(data)
      .onConflictDoUpdate({
        target: matchmakingPreferences.userId,
        set: {
          selectedGames: data.selectedGames,
          selectedFormats: data.selectedFormats,
          powerLevelMin: data.powerLevelMin,
          powerLevelMax: data.powerLevelMax,
          playstyle: data.playstyle,
          location: data.location,
          onlineOnly: data.onlineOnly,
          availability: data.availability,
          language: data.language,
          maxDistance: data.maxDistance,
          updatedAt: new Date(),
        },
      })
      .returning();
    return preferences;
  }

  async findMatchingPlayers(userId: string, preferences: MatchmakingPreferences): Promise<any[]> {
    // AI Matchmaking Algorithm
    const userProfiles = await db
      .select({
        user: users,
        gamingProfile: userGamingProfiles,
        preferences: matchmakingPreferences,
        community: communities,
      })
      .from(users)
      .leftJoin(userGamingProfiles, eq(users.id, userGamingProfiles.userId))
      .leftJoin(matchmakingPreferences, eq(users.id, matchmakingPreferences.userId))
      .leftJoin(communities, eq(userGamingProfiles.communityId, communities.id))
      .where(
        and(
          not(eq(users.id, userId)), // Exclude self
          eq(users.status, 'online'), // Only online users
          eq(userGamingProfiles.isVisible, true) // Only visible profiles
        )
      );

    // Calculate match scores
    const scoredMatches = userProfiles
      .filter(profile => profile.user && profile.gamingProfile)
      .map(profile => {
        let score = 0;
        const user = profile.user!;
        const gaming = profile.gamingProfile!;
        const userPrefs = profile.preferences;

        // Game compatibility (high weight)
        const sharedGames = (preferences.selectedGames as string[])?.filter(game => 
          gaming.communityId && (preferences.selectedGames as string[]).includes(gaming.communityId)
        );
        if (sharedGames?.length > 0) score += 30;

        // Experience level matching (medium weight)
        if (gaming.experience) {
          const experienceLevels = { beginner: 1, intermediate: 2, expert: 3 };
          const userLevel = experienceLevels[gaming.experience as keyof typeof experienceLevels] || 2;
          const prefLevel = experienceLevels[preferences.playstyle as keyof typeof experienceLevels] || 2;
          score += Math.max(0, 20 - Math.abs(userLevel - prefLevel) * 7);
        }

        // Location proximity (medium weight)
        if (preferences.onlineOnly || !preferences.location || !user.location) {
          score += 15; // Online players get base score
        } else if (user.location === preferences.location) {
          score += 25; // Same location bonus
        }

        // Availability matching (low weight)
        if (userPrefs?.availability === preferences.availability || preferences.availability === 'any') {
          score += 10;
        }

        // Language matching (low weight)
        if (userPrefs?.language === preferences.language) {
          score += 5;
        }

        // Random factor to add variety
        score += Math.random() * 10;

        return {
          id: user.id,
          username: user.username || `${user.firstName} ${user.lastName}`,
          avatar: user.profileImageUrl,
          games: [gaming.communityId],
          formats: userPrefs?.selectedFormats || [],
          powerLevel: this.calculatePowerLevel(gaming, userPrefs),
          playstyle: gaming.experience || 'intermediate',
          location: user.location || 'Online Only',
          availability: userPrefs?.availability || 'any',
          matchScore: Math.round(score),
          commonInterests: gaming.favoriteDeck ? [gaming.favoriteDeck] : [],
          lastOnline: user.status === 'online' ? 'Online now' : '1 hour ago',
          isOnline: user.status === 'online'
        };
      })
      .filter(match => match.matchScore > 20) // Minimum match threshold
      .sort((a, b) => b.matchScore - a.matchScore) // Best matches first
      .slice(0, 20); // Limit results

    return scoredMatches;
  }

  // Calculate power level based on gaming experience and stats
  private calculatePowerLevel(gaming: any, preferences: any): number {
    let powerLevel = 5; // Base level
    
    // Adjust based on experience
    switch (gaming?.experience?.toLowerCase()) {
      case 'beginner': powerLevel = 2; break;
      case 'intermediate': powerLevel = 5; break;
      case 'advanced': powerLevel = 8; break;
      case 'expert': powerLevel = 10; break;
      default: powerLevel = 5;
    }
    
    // Add slight variance based on preferences
    if (preferences?.selectedFormats?.length > 3) powerLevel += 1;
    if (preferences?.competitiveLevel === 'competitive') powerLevel += 1;
    
    return Math.min(Math.max(powerLevel, 1), 10);
  }
  
  // Tournament operations
  async getTournaments(communityId?: string): Promise<(Tournament & { organizer: User; community: Community; participantCount: number })[]> {
    const query = db
      .select({
        tournament: tournaments,
        organizer: users,
        community: communities,
        participantCount: sql<number>`COUNT(${tournamentParticipants.id})::int`.as('participantCount'),
      })
      .from(tournaments)
      .innerJoin(users, eq(tournaments.organizerId, users.id))
      .innerJoin(communities, eq(tournaments.communityId, communities.id))
      .leftJoin(tournamentParticipants, eq(tournaments.id, tournamentParticipants.tournamentId))
      .groupBy(tournaments.id, users.id, communities.id)
      .orderBy(desc(tournaments.startDate));

    if (communityId) {
      query.where(eq(tournaments.communityId, communityId));
    }

    const results = await query;
    return results.map(result => ({
      ...result.tournament,
      organizer: result.organizer,
      community: result.community,
      participantCount: result.participantCount,
    }));
  }

  async getTournament(tournamentId: string): Promise<(Tournament & { organizer: User; community: Community; participants: (TournamentParticipant & { user: User })[] }) | undefined> {
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
      participants: participants.map(p => ({ ...p.participant, user: p.user })),
    };
  }

  async createTournament(data: InsertTournament): Promise<Tournament> {
    const [tournament] = await db
      .insert(tournaments)
      .values(data)
      .returning();
    return tournament;
  }

  async joinTournament(tournamentId: string, userId: string): Promise<TournamentParticipant> {
    const [participant] = await db
      .insert(tournamentParticipants)
      .values({ tournamentId, userId })
      .returning();
    return participant;
  }

  async leaveTournament(tournamentId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(tournamentParticipants)
      .where(
        and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.userId, userId)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  // Forum operations
  async getForumPosts(communityId: string, options: { category?: string; limit?: number; offset?: number } = {}): Promise<(ForumPost & { author: User; community: Community; replyCount: number; likeCount: number; isLiked?: boolean })[]> {
    const { category, limit = 20, offset = 0 } = options;
    
    const query = db
      .select({
        post: forumPosts,
        author: users,
        community: communities,
        replyCount: sql<number>`COUNT(DISTINCT ${forumReplies.id})::int`.as('replyCount'),
        likeCount: sql<number>`COUNT(DISTINCT ${forumPostLikes.id})::int`.as('likeCount'),
      })
      .from(forumPosts)
      .innerJoin(users, eq(forumPosts.authorId, users.id))
      .innerJoin(communities, eq(forumPosts.communityId, communities.id))
      .leftJoin(forumReplies, eq(forumPosts.id, forumReplies.postId))
      .leftJoin(forumPostLikes, eq(forumPosts.id, forumPostLikes.postId))
      .where(
        and(
          eq(forumPosts.communityId, communityId),
          category ? eq(forumPosts.category, category) : undefined
        )
      )
      .groupBy(forumPosts.id, users.id, communities.id)
      .orderBy(desc(forumPosts.isPinned), desc(forumPosts.createdAt))
      .limit(limit)
      .offset(offset);

    const results = await query;
    
    return results.map(r => ({
      ...r.post,
      author: r.author,
      community: r.community,
      replyCount: r.replyCount,
      likeCount: r.likeCount,
    }));
  }

  async getForumPost(id: string, userId?: string): Promise<(ForumPost & { author: User; community: Community; isLiked: boolean }) | undefined> {
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
          and(
            eq(forumPostLikes.postId, id),
            eq(forumPostLikes.userId, userId)
          )
        );
      isLiked = !!like;
    }

    // Increment view count
    await db
      .update(forumPosts)
      .set({ 
        viewCount: sql`${forumPosts.viewCount} + 1`,
        updatedAt: new Date()
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
    const [post] = await db
      .insert(forumPosts)
      .values(data)
      .returning();
    return post;
  }

  async updateForumPost(id: string, data: Partial<InsertForumPost>): Promise<ForumPost> {
    const [post] = await db
      .update(forumPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(forumPosts.id, id))
      .returning();
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
          updatedAt: new Date()
        })
        .where(eq(forumPosts.id, postId));
    } catch (error) {
      // Ignore if already liked
    }
  }

  async unlikeForumPost(postId: string, userId: string): Promise<void> {
    const result = await db
      .delete(forumPostLikes)
      .where(
        and(
          eq(forumPostLikes.postId, postId),
          eq(forumPostLikes.userId, userId)
        )
      );
    
    if ((result.rowCount ?? 0) > 0) {
      // Update like count
      await db
        .update(forumPosts)
        .set({ 
          likeCount: sql`GREATEST(${forumPosts.likeCount} - 1, 0)`,
          updatedAt: new Date()
        })
        .where(eq(forumPosts.id, postId));
    }
  }

  async getForumReplies(postId: string, userId?: string): Promise<(ForumReply & { author: User; isLiked?: boolean; childReplies?: ForumReply[] })[]> {
    const replies = await db
      .select({
        reply: forumReplies,
        author: users,
      })
      .from(forumReplies)
      .innerJoin(users, eq(forumReplies.authorId, users.id))
      .where(eq(forumReplies.postId, postId))
      .orderBy(forumReplies.createdAt);

    // Add like status if user is provided
    const enrichedReplies = await Promise.all(
      replies.map(async (r) => {
        let isLiked = false;
        if (userId) {
          const [like] = await db
            .select()
            .from(forumReplyLikes)
            .where(
              and(
                eq(forumReplyLikes.replyId, r.reply.id),
                eq(forumReplyLikes.userId, userId)
              )
            );
          isLiked = !!like;
        }

        return {
          ...r.reply,
          author: r.author,
          isLiked,
        };
      })
    );

    return enrichedReplies;
  }

  async createForumReply(data: InsertForumReply): Promise<ForumReply> {
    const [reply] = await db
      .insert(forumReplies)
      .values(data)
      .returning();
    
    // Update reply count on the post
    await db
      .update(forumPosts)
      .set({ 
        replyCount: sql`${forumPosts.replyCount} + 1`,
        lastReplyAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(forumPosts.id, data.postId));
    
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
          updatedAt: new Date()
        })
        .where(eq(forumReplies.id, replyId));
    } catch (error) {
      // Ignore if already liked
    }
  }

  async unlikeForumReply(replyId: string, userId: string): Promise<void> {
    const result = await db
      .delete(forumReplyLikes)
      .where(
        and(
          eq(forumReplyLikes.replyId, replyId),
          eq(forumReplyLikes.userId, userId)
        )
      );
    
    if ((result.rowCount ?? 0) > 0) {
      // Update like count
      await db
        .update(forumReplies)
        .set({ 
          likeCount: sql`GREATEST(${forumReplies.likeCount} - 1, 0)`,
          updatedAt: new Date()
        })
        .where(eq(forumReplies.id, replyId));
    }
  }


  // Data export operations
  async exportUserData(userId: string): Promise<any> {
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
      .innerJoin(tournaments, eq(tournamentParticipants.tournamentId, tournaments.id))
      .where(eq(tournamentParticipants.userId, userId));

    // Get friend relationships
    const friends = await db
      .select()
      .from(friendships)
      .where(
        or(
          eq(friendships.requesterId, userId),
          eq(friendships.addresseeId, userId)
        )
      );

    return {
      user: userData,
      socialLinks,
      gamingProfiles,
      matchmakingPreferences: matchmakingPrefs,
      tournaments: userTournaments.map((t: any) => t.tournament),
      friends,
      exportDate: new Date().toISOString(),
      platform: 'Shuffle & Sync',
    };
  }

  // Account deletion operations
  async deleteUserAccount(userId: string): Promise<boolean> {
    try {
      // Cascade delete all user data in the correct order to respect foreign key constraints
      
      // Delete tournament participations
      await db.delete(tournamentParticipants).where(eq(tournamentParticipants.userId, userId));
      
      // Delete tournaments organized by user
      await db.delete(tournaments).where(eq(tournaments.organizerId, userId));
      
      // Delete matchmaking preferences
      await db.delete(matchmakingPreferences).where(eq(matchmakingPreferences.userId, userId));
      
      // Delete friend relationships
      await db.delete(friendships).where(
        or(
          eq(friendships.requesterId, userId),
          eq(friendships.addresseeId, userId)
        )
      );
      
      // Delete platform tokens
      await db.delete(platformTokens).where(eq(platformTokens.userId, userId));
      
      // Delete social posts
      await db.delete(socialPosts).where(eq(socialPosts.userId, userId));
      
      // Delete social links
      await db.delete(userSocialLinks).where(eq(userSocialLinks.userId, userId));
      
      // Delete gaming profiles
      await db.delete(userGamingProfiles).where(eq(userGamingProfiles.userId, userId));
      
      // Finally delete the user
      const result = await db.delete(users).where(eq(users.id, userId));
      
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting user account:', error);
      return false;
    }
  }

  // Platform integration operations
  async getUserPlatformTokens(userId: string): Promise<PlatformToken[]> {
    return await db
      .select()
      .from(platformTokens)
      .where(and(eq(platformTokens.userId, userId), eq(platformTokens.isActive, true)))
      .orderBy(platformTokens.platform);
  }

  async getPlatformToken(userId: string, platform: string): Promise<PlatformToken | undefined> {
    const [token] = await db
      .select()
      .from(platformTokens)
      .where(and(
        eq(platformTokens.userId, userId),
        eq(platformTokens.platform, platform),
        eq(platformTokens.isActive, true)
      ));
    return token;
  }

  async savePlatformToken(data: InsertPlatformToken): Promise<PlatformToken> {
    const [token] = await db
      .insert(platformTokens)
      .values(data)
      .onConflictDoUpdate({
        target: [platformTokens.userId, platformTokens.platform],
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();
    return token;
  }

  async updatePlatformToken(userId: string, platform: string, data: Partial<InsertPlatformToken>): Promise<PlatformToken> {
    const [token] = await db
      .update(platformTokens)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(platformTokens.userId, userId), eq(platformTokens.platform, platform)))
      .returning();
    return token;
  }

  async deletePlatformToken(userId: string, platform: string): Promise<void> {
    await db
      .delete(platformTokens)
      .where(and(eq(platformTokens.userId, userId), eq(platformTokens.platform, platform)));
  }

  async refreshPlatformToken(userId: string, platform: string, newTokenData: Partial<InsertPlatformToken>): Promise<PlatformToken> {
    const [token] = await db
      .update(platformTokens)
      .set({
        ...newTokenData,
        lastUsed: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(platformTokens.userId, userId), eq(platformTokens.platform, platform)))
      .returning();
    return token;
  }

  // Social media posting operations
  async createSocialPost(data: InsertSocialPost): Promise<SocialPost> {
    const [post] = await db
      .insert(socialPosts)
      .values(data)
      .returning();
    return post;
  }

  async getUserSocialPosts(userId: string, options?: { status?: string; limit?: number }): Promise<SocialPost[]> {
    const whereConditions = [eq(socialPosts.userId, userId)];
    
    if (options?.status) {
      whereConditions.push(eq(socialPosts.status, options.status));
    }

    const query = db
      .select()
      .from(socialPosts)
      .where(and(...whereConditions))
      .orderBy(desc(socialPosts.createdAt));

    if (options?.limit) {
      return await query.limit(options.limit);
    }

    return await query;
  }

  async updateSocialPost(postId: string, data: Partial<InsertSocialPost>): Promise<SocialPost> {
    const [post] = await db
      .update(socialPosts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, postId))
      .returning();
    return post;
  }

  async deleteSocialPost(postId: string): Promise<void> {
    await db
      .delete(socialPosts)
      .where(eq(socialPosts.id, postId));
  }

  async getScheduledPosts(userId?: string): Promise<SocialPost[]> {
    const whereConditions = [eq(socialPosts.status, "scheduled")];
    
    if (userId) {
      whereConditions.push(eq(socialPosts.userId, userId));
    }

    return await db
      .select()
      .from(socialPosts)
      .where(and(...whereConditions))
      .orderBy(socialPosts.scheduledFor);
  }

  // Webhook operations
  async getWebhookConfigs(platform?: string): Promise<WebhookConfig[]> {
    const whereConditions = [eq(webhookConfigs.isActive, true)];
    
    if (platform) {
      whereConditions.push(eq(webhookConfigs.platform, platform));
    }

    return await db
      .select()
      .from(webhookConfigs)
      .where(and(...whereConditions))
      .orderBy(webhookConfigs.platform);
  }

  async createWebhookConfig(data: InsertWebhookConfig): Promise<WebhookConfig> {
    const [config] = await db
      .insert(webhookConfigs)
      .values(data)
      .returning();
    return config;
  }

  async updateWebhookConfig(id: string, data: Partial<InsertWebhookConfig>): Promise<WebhookConfig> {
    const [config] = await db
      .update(webhookConfigs)
      .set(data)
      .where(eq(webhookConfigs.id, id))
      .returning();
    return config;
  }

  async deleteWebhookConfig(id: string): Promise<void> {
    await db
      .delete(webhookConfigs)
      .where(eq(webhookConfigs.id, id));
  }

  async logWebhookTrigger(id: string): Promise<void> {
    await db
      .update(webhookConfigs)
      .set({
        lastTriggered: new Date(),
        triggerCount: sql`${webhookConfigs.triggerCount} + 1`,
      })
      .where(eq(webhookConfigs.id, id));
  }
}

export const storage = new DatabaseStorage();
