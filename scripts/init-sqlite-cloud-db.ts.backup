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
    
    // Admin & Moderation tables
    console.log('\n📋 Creating Admin & Moderation tables...');
    
    // User roles table
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_roles (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        role TEXT NOT NULL,
        permissions TEXT NOT NULL DEFAULT '[]',
        communityId TEXT,
        assignedBy TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        expiresAt INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(userId, role, communityId)
      )
    `;
    console.log('  ✅ user_roles table created');
    
    // User reputation table
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_reputation (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        score INTEGER DEFAULT 100,
        level TEXT DEFAULT 'new',
        positiveActions INTEGER DEFAULT 0,
        negativeActions INTEGER DEFAULT 0,
        reportsMade INTEGER DEFAULT 0,
        reportsAccurate INTEGER DEFAULT 0,
        moderationHistory TEXT DEFAULT '[]',
        lastCalculated INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log('  ✅ user_reputation table created');
    
    // Content reports table
    await db.sql`
      CREATE TABLE IF NOT EXISTS content_reports (
        id TEXT PRIMARY KEY,
        reporterUserId TEXT,
        reportedUserId TEXT,
        contentType TEXT NOT NULL,
        contentId TEXT NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        evidence TEXT,
        isSystemGenerated INTEGER DEFAULT 0,
        automatedFlags TEXT,
        confidenceScore REAL,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        assignedModerator TEXT,
        moderationNotes TEXT,
        resolution TEXT,
        actionTaken TEXT,
        created_at INTEGER NOT NULL,
        resolvedAt INTEGER
      )
    `;
    console.log('  ✅ content_reports table created');
    
    // Moderation actions table
    await db.sql`
      CREATE TABLE IF NOT EXISTS moderation_actions (
        id TEXT PRIMARY KEY,
        moderatorId TEXT NOT NULL,
        targetUserId TEXT NOT NULL,
        action TEXT NOT NULL,
        reason TEXT NOT NULL,
        duration INTEGER,
        relatedContentType TEXT,
        relatedContentId TEXT,
        relatedReportId TEXT,
        isReversible INTEGER DEFAULT 1,
        isPublic INTEGER DEFAULT 0,
        metadata TEXT,
        ipAddress TEXT,
        userAgent TEXT,
        adminNotes TEXT,
        isActive INTEGER DEFAULT 1,
        reversedBy TEXT,
        reversedAt INTEGER,
        reversalReason TEXT,
        expiresAt INTEGER,
        created_at INTEGER NOT NULL
      )
    `;
    console.log('  ✅ moderation_actions table created');
    
    // Moderation queue table
    await db.sql`
      CREATE TABLE IF NOT EXISTS moderation_queue (
        id TEXT PRIMARY KEY,
        itemType TEXT NOT NULL,
        itemId TEXT NOT NULL,
        priority INTEGER DEFAULT 5,
        status TEXT DEFAULT 'open',
        assignedModerator TEXT,
        assignedAt INTEGER,
        riskScore REAL,
        userReputationScore INTEGER,
        reporterReputationScore INTEGER,
        mlPriority INTEGER,
        autoGenerated INTEGER DEFAULT 0,
        summary TEXT,
        tags TEXT DEFAULT '[]',
        estimatedTimeMinutes INTEGER,
        metadata TEXT,
        resolution TEXT,
        actionTaken TEXT,
        created_at INTEGER NOT NULL,
        completedAt INTEGER
      )
    `;
    console.log('  ✅ moderation_queue table created');
    
    // CMS content table
    await db.sql`
      CREATE TABLE IF NOT EXISTS cms_content (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        isPublished INTEGER DEFAULT 0,
        publishedAt INTEGER,
        scheduledPublishAt INTEGER,
        authorId TEXT NOT NULL,
        lastEditedBy TEXT NOT NULL,
        approvedBy TEXT,
        approvedAt INTEGER,
        changeLog TEXT,
        previousVersionId TEXT,
        metaDescription TEXT,
        metaKeywords TEXT,
        slug TEXT UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log('  ✅ cms_content table created');
    
    // Ban evasion tracking table
    await db.sql`
      CREATE TABLE IF NOT EXISTS ban_evasion_tracking (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        ipAddress TEXT NOT NULL,
        hashedFingerprint TEXT,
        userAgent TEXT,
        screenResolution TEXT,
        timezone TEXT,
        language TEXT,
        loginPatterns TEXT,
        activitySignature TEXT,
        detectionMethod TEXT,
        confidenceScore REAL,
        relatedBannedUser TEXT,
        status TEXT DEFAULT 'flagged',
        investigatedBy TEXT,
        investigatedAt INTEGER,
        notes TEXT,
        created_at INTEGER NOT NULL
      )
    `;
    console.log('  ✅ ban_evasion_tracking table created');
    
    // User appeals table
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_appeals (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        moderationActionId TEXT NOT NULL,
        reason TEXT NOT NULL,
        evidence TEXT,
        additionalInfo TEXT,
        status TEXT DEFAULT 'pending',
        reviewedBy TEXT,
        reviewedAt INTEGER,
        reviewNotes TEXT,
        decision TEXT,
        decisionReason TEXT,
        responseToUser TEXT,
        isUserNotified INTEGER DEFAULT 0,
        canReappeal INTEGER DEFAULT 0,
        reappealCooldownUntil INTEGER,
        resolvedAt INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log('  ✅ user_appeals table created');
    
    // Moderation templates table
    await db.sql`
      CREATE TABLE IF NOT EXISTS moderation_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subject TEXT,
        content TEXT NOT NULL,
        variables TEXT DEFAULT '[]',
        isActive INTEGER DEFAULT 1,
        createdBy TEXT NOT NULL,
        lastModifiedBy TEXT NOT NULL,
        usageCount INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log('  ✅ moderation_templates table created');
    
    // Admin audit log table
    await db.sql`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id TEXT PRIMARY KEY,
        adminUserId TEXT NOT NULL,
        action TEXT NOT NULL,
        category TEXT NOT NULL,
        targetType TEXT,
        targetId TEXT,
        targetIdentifier TEXT,
        oldValues TEXT,
        newValues TEXT,
        parameters TEXT,
        ipAddress TEXT NOT NULL,
        userAgent TEXT,
        sessionId TEXT,
        success INTEGER DEFAULT 1,
        errorMessage TEXT,
        impactAssessment TEXT,
        created_at INTEGER NOT NULL
      )
    `;
    console.log('  ✅ admin_audit_log table created');
    
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
    
    // Admin & Moderation indexes
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(userId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_reputation_user_id ON user_reputation(userId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporterUserId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_content_reports_reported ON content_reports(reportedUserId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderatorId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(targetUserId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON moderation_queue(priority)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON admin_audit_log(adminUserId)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action)`;
    
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
