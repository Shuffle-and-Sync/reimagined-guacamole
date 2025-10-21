/**
 * Database Test Helpers
 *
 * Utilities for setting up and managing test databases.
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../shared/schema";

/**
 * Create an in-memory test database
 */
export function createTestDatabase() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });

  return { db, sqlite };
}

/**
 * Setup test database with schema
 */
export async function setupTestDatabase() {
  const { db, sqlite } = createTestDatabase();

  // Create tables (simplified - adjust based on your actual schema)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE,
      firstName TEXT,
      lastName TEXT,
      status TEXT DEFAULT 'active',
      role TEXT DEFAULT 'user',
      isEmailVerified INTEGER DEFAULT 0,
      mfaEnabled INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (unixepoch()),
      updatedAt INTEGER DEFAULT (unixepoch())
    );
    
    CREATE TABLE IF NOT EXISTS communities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      game TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt INTEGER DEFAULT (unixepoch()),
      updatedAt INTEGER DEFAULT (unixepoch())
    );
    
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT,
      startTime INTEGER,
      endTime INTEGER,
      location TEXT,
      maxAttendees INTEGER,
      status TEXT DEFAULT 'upcoming',
      organizerId TEXT,
      communityId TEXT,
      createdAt INTEGER DEFAULT (unixepoch()),
      updatedAt INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (organizerId) REFERENCES users(id),
      FOREIGN KEY (communityId) REFERENCES communities(id)
    );
  `);

  return { db, sqlite };
}

/**
 * Clean up test database
 */
export function teardownTestDatabase(sqlite: Database.Database) {
  if (sqlite) {
    sqlite.close();
  }
}

/**
 * Seed test database with data
 */
export async function seedTestDatabase(db: unknown, data: unknown = {}) {
  const { users = [], communities = [], events = [] } = data;

  // Insert seed data
  for (const user of users) {
    await db.insert(schema.users).values(user);
  }

  for (const community of communities) {
    await db.insert(schema.communities).values(community);
  }

  for (const event of events) {
    await db.insert(schema.events).values(event);
  }
}

/**
 * Clear all data from test database
 */
export async function clearTestDatabase(sqlite: Database.Database) {
  sqlite.exec(`
    DELETE FROM events;
    DELETE FROM communities;
    DELETE FROM users;
  `);
}
