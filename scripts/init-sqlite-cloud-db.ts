#!/usr/bin/env tsx
/**
 * Initialize SQLite Cloud Database
 * 
 * This script connects to SQLite Cloud and creates all necessary tables
 * by executing SQL statements directly.
 */

import { Database as SQLiteCloudDatabase } from '@sqlitecloud/drivers';

const databaseUrl = process.env.DATABASE_URL || "sqlitecloud://cgqwvg83nk.g4.sqlite.cloud:8860/shuffleandsync?apikey=WXRy8ecObcGjMYRmuTT7bAEnvblToCbV4bHqUv8g6oQ";

console.log('🚀 Initializing SQLite Cloud database...\n');

async function initializeDatabase() {
  try {
    // Connect to SQLite Cloud
    console.log('📡 Connecting to SQLite Cloud...');
    const db = new SQLiteCloudDatabase(databaseUrl);
    
    // Test connection
    await db.sql`SELECT 1 as test`;
    console.log('✅ Connected successfully!\n');
    
    // Create Auth.js tables
    console.log('📋 Creating Auth.js tables...');
    
    // Accounts table
    await db.sql`
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
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(provider, providerAccountId)
      )
    `;
    console.log('  ✅ accounts table created');
    
    // Sessions table
    await db.sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        sessionToken TEXT NOT NULL UNIQUE,
        userId TEXT NOT NULL,
        expires INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log('  ✅ sessions table created');
    
    // Verification tokens table
    await db.sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires INTEGER NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `;
    console.log('  ✅ verification_tokens table created');
    
    // Users table
    console.log('\n📋 Creating Users table...');
    await db.sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        emailVerified INTEGER,
        name TEXT,
        image TEXT,
        username TEXT UNIQUE,
        bio TEXT,
        location TEXT,
        website TEXT,
        twitchUsername TEXT,
        youtubeChannelId TEXT,
        discordId TEXT,
        primaryCommunityId TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log('  ✅ users table created');
    
    // Communities table
    console.log('\n📋 Creating Communities table...');
    await db.sql`
      CREATE TABLE IF NOT EXISTS communities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        displayName TEXT NOT NULL,
        description TEXT,
        iconUrl TEXT,
        bannerUrl TEXT,
        primaryColor TEXT,
        active INTEGER DEFAULT 1,
        memberCount INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log('  ✅ communities table created');
    
    // User Communities (join table)
    console.log('\n📋 Creating User Communities table...');
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_communities (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        communityId TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        joinedAt INTEGER NOT NULL,
        UNIQUE(userId, communityId)
      )
    `;
    console.log('  ✅ user_communities table created');
    
    // Events table
    console.log('\n📋 Creating Events table...');
    await db.sql`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        eventType TEXT NOT NULL,
        communityId TEXT,
        creatorId TEXT NOT NULL,
        startTime INTEGER NOT NULL,
        endTime INTEGER,
        location TEXT,
        isVirtual INTEGER DEFAULT 0,
        maxAttendees INTEGER,
        registrationDeadline INTEGER,
        status TEXT DEFAULT 'upcoming',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log('  ✅ events table created');
    
    // Messages table
    console.log('\n📋 Creating Messages table...');
    await db.sql`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        senderId TEXT NOT NULL,
        recipientId TEXT,
        communityId TEXT,
        content TEXT NOT NULL,
        messageType TEXT DEFAULT 'text',
        readAt INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log('  ✅ messages table created');
    
    // Create indexes
    console.log('\n📋 Creating indexes...');
    await db.sql`CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts(userId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_sessions_sessionToken ON sessions(sessionToken)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_communities_userId ON user_communities(userId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_communities_communityId ON user_communities(communityId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_events_communityId ON events(communityId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_events_creatorId ON events(creatorId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_messages_senderId ON messages(senderId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_messages_recipientId ON messages(recipientId)`;
    console.log('  ✅ All indexes created');
    
    // Verify tables
    console.log('\n🔍 Verifying database schema...');
    const tables = await db.sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `;
    
    console.log('\n📊 Database tables:');
    for (const table of tables) {
      console.log(`  • ${table.name}`);
    }
    
    console.log('\n✅ Database initialization complete!');
    console.log('\n📝 Next steps:');
    console.log('  1. Verify the schema: npm run db:health');
    console.log('  2. Start the development server: npm run dev');
    console.log('  3. Test authentication flows');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
