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
import { readFileSync } from "fs";
import { resolve } from "path";

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
 * Initialize database schema from migration file
 * This reads the actual migration SQL and executes it
 */
export async function initTestSchema(
  db: BetterSQLite3Database<typeof schema>,
): Promise<void> {
  // Find the latest migration file
  try {
    const migrationPath = resolve(
      process.cwd(),
      "migrations/0000_pretty_bloodaxe.sql",
    );
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      if (statement && !statement.startsWith("--")) {
        // Use db.execute() with sql.raw() instead of db.run()
        await db.execute(sql.raw(statement));
      }
    }
  } catch (_error) {
    // If migration file doesn't exist, create minimal schema for tests
    console.warn("Migration file not found, creating minimal schema");
    await createMinimalSchema(db);
  }
}

/**
 * Create minimal schema for tests if migration file is not available
 */
async function createMinimalSchema(
  db: BetterSQLite3Database<typeof schema>,
): Promise<void> {
  // Create users table with all required columns
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      first_name TEXT,
      last_name TEXT,
      profile_image_url TEXT,
      primary_community TEXT,
      username TEXT UNIQUE,
      bio TEXT,
      location TEXT,
      website TEXT,
      status TEXT DEFAULT 'offline',
      status_message TEXT,
      timezone TEXT,
      date_of_birth TEXT,
      is_private INTEGER DEFAULT 0,
      show_online_status TEXT DEFAULT 'everyone',
      allow_direct_messages TEXT DEFAULT 'everyone',
      password_hash TEXT,
      is_email_verified INTEGER DEFAULT 0,
      email_verified_at INTEGER,
      failed_login_attempts INTEGER DEFAULT 0,
      last_failed_login INTEGER,
      account_locked_until INTEGER,
      password_changed_at INTEGER,
      mfa_enabled INTEGER DEFAULT 0,
      mfa_enabled_at INTEGER,
      last_login_at INTEGER,
      last_active_at INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    )
  `);

  // Create sessions table (for Auth.js)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      sessionToken TEXT UNIQUE NOT NULL,
      userId TEXT NOT NULL,
      expires INTEGER NOT NULL,
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
      created_at INTEGER,
      updated_at INTEGER
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
      startDate INTEGER,
      endDate INTEGER,
      created_at INTEGER,
      updated_at INTEGER,
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
      joinedAt INTEGER,
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
      startTime INTEGER NOT NULL,
      endTime INTEGER,
      location TEXT,
      maxParticipants INTEGER,
      currentParticipants INTEGER DEFAULT 0,
      status TEXT DEFAULT 'upcoming',
      organizerId TEXT NOT NULL,
      communityId TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (organizerId) REFERENCES users(id),
      FOREIGN KEY (communityId) REFERENCES communities(id)
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

  // Delete all data from tables (only ones that exist)
  const tables = [
    "events",
    "tournament_participants",
    "tournaments",
    "communities",
    "accounts",
    "sessions",
    "users",
  ];

  for (const table of tables) {
    try {
      // Use db.execute() with sql.raw() instead of db.run()
      await db.execute(sql.raw(`DELETE FROM ${table}`));
    } catch (_error) {
      // Table might not exist, skip it
      continue;
    }
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
      status: "online",
    },
    {
      id: "test-user-2",
      email: "user2@test.com",
      firstName: "Test",
      lastName: "User2",
      username: "testuser2",
      status: "online",
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
