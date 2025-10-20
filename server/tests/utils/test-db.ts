/**
 * Test Database Utilities
 *
 * Provides utilities for managing in-memory SQLite databases in tests.
 * Ensures test isolation by creating fresh database instances for each test.
 */

import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Create an in-memory SQLite database for testing
 * This creates a fresh, isolated database instance
 */
export function createTestDb(): {
  db: BetterSQLite3Database<typeof schema>;
  sqlite: Database.Database;
  close: () => void;
} {
  // Create in-memory SQLite database
  const sqlite = new Database(":memory:");

  // Enable foreign keys
  sqlite.pragma("foreign_keys = ON");

  // Create Drizzle instance
  const db = drizzle(sqlite, { schema });

  return {
    db,
    sqlite,
    close: () => {
      sqlite.close();
    },
  };
}

/**
 * Initialize database schema
 * Creates all tables and indexes
 */
export async function initTestSchema(
  db: BetterSQLite3Database<typeof schema>,
): Promise<void> {
  // Create users table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      firstName TEXT,
      lastName TEXT,
      username TEXT UNIQUE,
      status TEXT DEFAULT 'active',
      role TEXT DEFAULT 'user',
      isEmailVerified INTEGER DEFAULT 0,
      mfaEnabled INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create sessions table (for Auth.js)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      sessionToken TEXT UNIQUE NOT NULL,
      userId TEXT NOT NULL,
      expires TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create accounts table (for Auth.js)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      providerAccountId TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(provider, providerAccountId)
    )
  `);

  // Create communities table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS communities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      game TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create tournaments table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      format TEXT NOT NULL,
      maxParticipants INTEGER,
      status TEXT DEFAULT 'upcoming',
      organizerId TEXT NOT NULL,
      communityId TEXT,
      startDate TEXT,
      endDate TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizerId) REFERENCES users(id),
      FOREIGN KEY (communityId) REFERENCES communities(id)
    )
  `);

  // Create tournament_participants table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS tournament_participants (
      id TEXT PRIMARY KEY,
      tournamentId TEXT NOT NULL,
      userId TEXT NOT NULL,
      seed INTEGER,
      status TEXT DEFAULT 'active',
      joinedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournamentId) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(tournamentId, userId)
    )
  `);

  // Create events table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      eventType TEXT,
      startTime TEXT NOT NULL,
      endTime TEXT,
      location TEXT,
      maxParticipants INTEGER,
      currentParticipants INTEGER DEFAULT 0,
      status TEXT DEFAULT 'upcoming',
      organizerId TEXT NOT NULL,
      communityId TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizerId) REFERENCES users(id),
      FOREIGN KEY (communityId) REFERENCES communities(id)
    )
  `);

  // Create games table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      publisher TEXT,
      releaseYear INTEGER,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create cards table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gameId TEXT NOT NULL,
      setCode TEXT,
      cardNumber TEXT,
      rarity TEXT,
      imageUrl TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gameId) REFERENCES games(id)
    )
  `);
}

/**
 * Clear all data from database tables
 * Useful for resetting state between tests
 */
export async function clearTestDb(
  db: BetterSQLite3Database<typeof schema>,
): Promise<void> {
  // Disable foreign keys temporarily for cleanup
  await db.run(sql`PRAGMA foreign_keys = OFF`);

  // Delete all data from tables
  const tables = [
    "cards",
    "games",
    "events",
    "tournament_participants",
    "tournaments",
    "communities",
    "accounts",
    "sessions",
    "users",
  ];

  for (const table of tables) {
    await db.run(sql.raw(`DELETE FROM ${table}`));
  }

  // Re-enable foreign keys
  await db.run(sql`PRAGMA foreign_keys = ON`);
}

/**
 * Seed basic test data
 * Creates minimal data needed for most tests
 */
export async function seedTestData(
  db: BetterSQLite3Database<typeof schema>,
): Promise<{
  users: any[];
  communities: any[];
}> {
  const users = [
    {
      id: "test-user-1",
      email: "user1@test.com",
      firstName: "Test",
      lastName: "User1",
      username: "testuser1",
      status: "active",
      role: "user",
      isEmailVerified: true,
      mfaEnabled: false,
    },
    {
      id: "test-user-2",
      email: "user2@test.com",
      firstName: "Test",
      lastName: "User2",
      username: "testuser2",
      status: "active",
      role: "user",
      isEmailVerified: true,
      mfaEnabled: false,
    },
  ];

  const communities = [
    {
      id: "test-community-1",
      name: "Magic: The Gathering",
      slug: "mtg",
      description: "Magic community",
      game: "mtg",
      isActive: true,
    },
  ];

  // Insert users
  for (const user of users) {
    await db.insert(schema.users).values(user);
  }

  // Insert communities
  for (const community of communities) {
    await db.insert(schema.communities).values(community);
  }

  return { users, communities };
}
