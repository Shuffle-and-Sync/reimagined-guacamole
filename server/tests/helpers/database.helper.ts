/**
 * Database Test Helpers
 *
 * Utilities for seeding test data and cleaning the database between tests.
 * These helpers ensure consistent test state and reduce boilerplate in test files.
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@shared/database-unified";
import {
  users,
  communities,
  userCommunities,
  events,
  tournaments,
  games,
  cards,
} from "@shared/schema";

/**
 * Test data generators for creating mock data
 */
export const testDataGenerators = {
  /**
   * Generate a mock user object
   */
  user: (overrides: Partial<typeof users.$inferInsert> = {}) => ({
    id: nanoid(),
    email: `test-${nanoid()}@example.com`,
    firstName: "Test",
    lastName: "User",
    username: `testuser-${nanoid()}`,
    status: "active" as const,
    role: "user" as const,
    isEmailVerified: true,
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Generate a mock community object
   */
  community: (overrides: Partial<typeof communities.$inferInsert> = {}) => ({
    id: nanoid(),
    name: `Test Community ${nanoid()}`,
    displayName: `Test Community Display ${nanoid()}`,
    description: "A test community",
    themeColor: "#3b82f6",
    iconClass: "fa-gamepad",
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  }),

  /**
   * Generate a mock event object
   */
  event: (overrides: Partial<typeof events.$inferInsert> = {}) => ({
    id: nanoid(),
    title: `Test Event ${nanoid()}`,
    description: "A test event",
    type: "tournament" as const,
    status: "active",
    startTime: new Date(Date.now() + 86400000), // Tomorrow
    endTime: new Date(Date.now() + 90000000), // Tomorrow + 1 hour
    location: "Online",
    isVirtual: true,
    maxAttendees: 8,
    creatorId: nanoid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Generate a mock tournament object
   */
  tournament: (overrides: Partial<typeof tournaments.$inferInsert> = {}) => ({
    id: nanoid(),
    name: `Test Tournament ${nanoid()}`,
    description: "A test tournament",
    gameType: "mtg",
    format: "Standard",
    status: "upcoming",
    startDate: new Date(Date.now() + 86400000),
    endDate: new Date(Date.now() + 90000000),
    maxParticipants: 32,
    currentParticipants: 0,
    organizerId: nanoid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Generate a mock game object
   */
  game: (overrides: Partial<typeof games.$inferInsert> = {}) => ({
    id: nanoid(),
    name: `Test Game ${nanoid()}`,
    code: `TG${Math.floor(Math.random() * 1000)}`,
    description: "A test trading card game",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Generate a mock card object
   */
  card: (overrides: Partial<typeof cards.$inferInsert> = {}) => ({
    id: nanoid(),
    name: `Test Card ${nanoid()}`,
    gameId: overrides.gameId || nanoid(),
    type: "Instant",
    rarity: "common",
    setCode: "TEST",
    setName: "Test Set",
    imageUrl: "https://example.com/card.jpg",
    metadata: JSON.stringify({ manaCost: "{R}", colors: ["R"] }),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

/**
 * Database seeding utilities
 */
export const seedDatabase = {
  /**
   * Create a test user in the database
   */
  async createUser(overrides: Partial<typeof users.$inferInsert> = {}) {
    const userData = testDataGenerators.user(overrides);
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },

  /**
   * Create multiple test users
   */
  async createUsers(
    count: number,
    overrides: Partial<typeof users.$inferInsert> = {},
  ) {
    const usersData = Array.from({ length: count }, () =>
      testDataGenerators.user(overrides),
    );
    return await db.insert(users).values(usersData).returning();
  },

  /**
   * Create a test community
   */
  async createCommunity(
    overrides: Partial<typeof communities.$inferInsert> = {},
  ) {
    const communityData = testDataGenerators.community(overrides);
    const [community] = await db
      .insert(communities)
      .values(communityData)
      .returning();
    return community;
  },

  /**
   * Create a test event
   */
  async createEvent(overrides: Partial<typeof events.$inferInsert> = {}) {
    const eventData = testDataGenerators.event(overrides);
    const [event] = await db.insert(events).values(eventData).returning();
    return event;
  },

  /**
   * Create a test tournament
   */
  async createTournament(
    overrides: Partial<typeof tournaments.$inferInsert> = {},
  ) {
    const tournamentData = testDataGenerators.tournament(overrides);
    const [tournament] = await db
      .insert(tournaments)
      .values(tournamentData)
      .returning();
    return tournament;
  },

  /**
   * Create a test game
   */
  async createGame(overrides: Partial<typeof games.$inferInsert> = {}) {
    const gameData = testDataGenerators.game(overrides);
    const [game] = await db.insert(games).values(gameData).returning();
    return game;
  },

  /**
   * Join a user to a community
   */
  async joinCommunity(
    userId: string,
    communityId: string,
    isPrimary: boolean = false,
  ) {
    const [membership] = await db
      .insert(userCommunities)
      .values({
        userId,
        communityId,
        isPrimary,
        joinedAt: new Date(),
      })
      .returning();
    return membership;
  },
};

/**
 * Database cleanup utilities
 */
export const cleanDatabase = {
  /**
   * Delete all test users
   */
  async deleteAllUsers() {
    try {
      await db.delete(users);
    } catch (error) {
      console.error("Error cleaning users:", error);
    }
  },

  /**
   * Delete a specific user by ID
   */
  async deleteUser(userId: string) {
    try {
      await db.delete(users).where(eq(users.id, userId));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  },

  /**
   * Delete all test communities
   */
  async deleteAllCommunities() {
    try {
      await db.delete(communities);
    } catch (error) {
      console.error("Error cleaning communities:", error);
    }
  },

  /**
   * Delete all test events
   */
  async deleteAllEvents() {
    try {
      await db.delete(events);
    } catch (error) {
      console.error("Error cleaning events:", error);
    }
  },

  /**
   * Delete all test tournaments
   */
  async deleteAllTournaments() {
    try {
      await db.delete(tournaments);
    } catch (error) {
      console.error("Error cleaning tournaments:", error);
    }
  },

  /**
   * Delete all test games
   */
  async deleteAllGames() {
    try {
      await db.delete(games);
    } catch (error) {
      console.error("Error cleaning games:", error);
    }
  },

  /**
   * Delete all test cards
   */
  async deleteAllCards() {
    try {
      await db.delete(cards);
    } catch (error) {
      console.error("Error cleaning cards:", error);
    }
  },

  /**
   * Clean all test data from the database
   * Use this in afterAll() hooks to ensure clean state
   */
  async cleanAll() {
    try {
      // Delete in order of dependencies
      await db.delete(userCommunities);
      await db.delete(cards);
      await db.delete(games);
      await db.delete(tournaments);
      await db.delete(events);
      await db.delete(communities);
      await db.delete(users);
    } catch (error) {
      console.error("Error cleaning database:", error);
    }
  },
};

/**
 * Transaction helpers for tests that need rollback
 */
export const transactionHelpers = {
  /**
   * Run a test within a transaction that will be rolled back
   * This is useful for integration tests that need to modify the database
   * but should not persist changes between tests.
   *
   * Note: This is a placeholder - actual transaction rollback implementation
   * would require database transaction support.
   */
  async withRollback<T>(callback: () => Promise<T>): Promise<T> {
    try {
      const result = await callback();
      return result;
    } finally {
      // In a real implementation, this would rollback the transaction
      await cleanDatabase.cleanAll();
    }
  },
};
