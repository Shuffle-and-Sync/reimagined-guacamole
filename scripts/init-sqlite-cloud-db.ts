#!/usr/bin/env tsx
/**
 * Initialize SQLite Cloud Database
 *
 * This script connects to SQLite Cloud and creates all necessary tables
 * by executing SQL statements directly.
 */

import { Database as SQLiteCloudDatabase } from "@sqlitecloud/drivers";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local (or .env)
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

console.log("🚀 Initializing SQLite Cloud database...\n");

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set.");
  console.error("\n📝 Please set DATABASE_URL in your .env.local file:");
  console.error(
    "   DATABASE_URL=sqlitecloud://host:port/database?apikey=YOUR_API_KEY",
  );
  console.error("\n💡 Example:");
  console.error(
    "   DATABASE_URL=sqlitecloud://cgqwvg83nk.g4.sqlite.cloud:8860/shuffle-and-sync-v2?apikey=your-actual-api-key",
  );
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

async function initializeDatabase() {
  let db: SQLiteCloudDatabase | null = null;

  try {
    // Connect to SQLite Cloud
    console.log("📡 Connecting to SQLite Cloud...");
    db = new SQLiteCloudDatabase(databaseUrl);

    // Test connection
    await db.sql`SELECT 1 as test`;
    console.log("✅ Connected successfully!\n");

    // Create Auth.js tables
    console.log("📋 Creating Auth.js tables...");

    // Accounts table
    await db.sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE(provider, provider_account_id)
      )
    `;
    console.log("  ✅ accounts table created");

    // Sessions table
    await db.sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        session_token TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        expires INTEGER NOT NULL
      )
    `;
    console.log("  ✅ sessions table created");

    // Verification tokens table
    await db.sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires INTEGER NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `;
    console.log("  ✅ verification_tokens table created");

    // Users table
    console.log("\n📋 Creating Users table...");
    await db.sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        primary_community TEXT,
        username TEXT,
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
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ users table created");

    // Communities table
    console.log("\n📋 Creating Communities table...");
    await db.sql`
      CREATE TABLE IF NOT EXISTS communities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        theme_color TEXT NOT NULL,
        icon_class TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ communities table created");

    // User Communities (join table)
    console.log("\n📋 Creating User Communities table...");
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_communities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        community_id TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        joined_at INTEGER NOT NULL,
        UNIQUE(user_id, community_id)
      )
    `;
    console.log("  ✅ user_communities table created");

    // User Platform Accounts table
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_platform_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        handle TEXT NOT NULL,
        platform_user_id TEXT,
        channel_id TEXT,
        page_id TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at INTEGER,
        scopes TEXT,
        is_active INTEGER DEFAULT 1,
        last_verified INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(user_id, platform)
      )
    `;
    console.log("  ✅ user_platform_accounts table created");

    // Theme Preferences table
    await db.sql`
      CREATE TABLE IF NOT EXISTS theme_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        community_id TEXT,
        theme_mode TEXT DEFAULT 'dark',
        custom_colors TEXT,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ theme_preferences table created");

    // Events table
    console.log("\n📋 Creating Events table...");
    await db.sql`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        location TEXT,
        is_virtual INTEGER DEFAULT 0,
        max_attendees INTEGER,
        player_slots INTEGER,
        alternate_slots INTEGER,
        creator_id TEXT NOT NULL,
        host_id TEXT,
        co_host_id TEXT,
        community_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ events table created");

    // Event Attendees table
    await db.sql`
      CREATE TABLE IF NOT EXISTS event_attendees (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT DEFAULT 'attending',
        role TEXT DEFAULT 'participant',
        player_type TEXT DEFAULT 'main',
        joined_at INTEGER NOT NULL,
        UNIQUE(event_id, user_id)
      )
    `;
    console.log("  ✅ event_attendees table created");

    // Messages table
    console.log("\n📋 Creating Messages table...");
    await db.sql`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT,
        event_id TEXT,
        content TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        read_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ messages table created");

    // Notifications table
    await db.sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        priority TEXT DEFAULT 'normal',
        title TEXT NOT NULL,
        message TEXT,
        data TEXT,
        is_read INTEGER DEFAULT 0,
        read_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ notifications table created");

    // Game Sessions table
    console.log("\n📋 Creating Game Sessions table...");
    await db.sql`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id TEXT PRIMARY KEY,
        event_id TEXT,
        game_type TEXT NOT NULL,
        status TEXT DEFAULT 'waiting',
        max_players INTEGER,
        current_players INTEGER DEFAULT 0,
        host_id TEXT NOT NULL,
        co_host_id TEXT,
        board_state TEXT,
        started_at INTEGER,
        ended_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ game_sessions table created");

    // Authentication & Security tables
    console.log("\n📋 Creating Authentication & Security tables...");

    // Password Reset Tokens
    await db.sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        used_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ password_reset_tokens table created");

    // Email Verification Tokens
    await db.sql`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        verified_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ email_verification_tokens table created");

    // User MFA Settings
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_mfa_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        secret TEXT NOT NULL,
        backup_codes TEXT,
        enabled INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ user_mfa_settings table created");

    // Auth Audit Log
    await db.sql`
      CREATE TABLE IF NOT EXISTS auth_audit_log (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        event_type TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        is_successful INTEGER,
        failure_reason TEXT,
        details TEXT,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ auth_audit_log table created");

    // Social Features tables
    console.log("\n📋 Creating Social Features tables...");

    // Friendships
    await db.sql`
      CREATE TABLE IF NOT EXISTS friendships (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        friend_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        responded_at INTEGER,
        UNIQUE(user_id, friend_id)
      )
    `;
    console.log("  ✅ friendships table created");

    // User Activities
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_activities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        description TEXT,
        metadata TEXT,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ user_activities table created");

    // Tournament tables
    console.log("\n📋 Creating Tournament tables...");

    // Tournaments
    await db.sql`
      CREATE TABLE IF NOT EXISTS tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        game_type TEXT NOT NULL,
        format TEXT NOT NULL,
        status TEXT DEFAULT 'upcoming',
        max_participants INTEGER,
        current_participants INTEGER DEFAULT 0,
        prize_pool REAL,
        organizer_id TEXT NOT NULL,
        community_id TEXT,
        start_date INTEGER NOT NULL,
        end_date INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ tournaments table created");

    // Tournament Participants
    await db.sql`
      CREATE TABLE IF NOT EXISTS tournament_participants (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT DEFAULT 'registered',
        seed INTEGER,
        final_rank INTEGER,
        joined_at INTEGER NOT NULL,
        UNIQUE(tournament_id, user_id)
      )
    `;
    console.log("  ✅ tournament_participants table created");

    // Tournament Formats
    await db.sql`
      CREATE TABLE IF NOT EXISTS tournament_formats (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        game_type TEXT NOT NULL,
        description TEXT,
        rules TEXT DEFAULT '{}',
        structure TEXT NOT NULL,
        default_rounds INTEGER,
        is_official INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        UNIQUE(name, game_type)
      )
    `;
    console.log("  ✅ tournament_formats table created");

    // Tournament Rounds
    await db.sql`
      CREATE TABLE IF NOT EXISTS tournament_rounds (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        round_number INTEGER NOT NULL,
        name TEXT,
        status TEXT DEFAULT 'pending',
        start_time INTEGER,
        end_time INTEGER,
        created_at INTEGER NOT NULL,
        UNIQUE(tournament_id, round_number)
      )
    `;
    console.log("  ✅ tournament_rounds table created");

    // Tournament Matches
    await db.sql`
      CREATE TABLE IF NOT EXISTS tournament_matches (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        round_id TEXT NOT NULL,
        match_number INTEGER NOT NULL,
        player1_id TEXT,
        player2_id TEXT,
        winner_id TEXT,
        status TEXT DEFAULT 'pending',
        table_number INTEGER,
        start_time INTEGER,
        end_time INTEGER,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ tournament_matches table created");

    // Match Results
    await db.sql`
      CREATE TABLE IF NOT EXISTS match_results (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL UNIQUE,
        player1_score INTEGER,
        player2_score INTEGER,
        player1_deck TEXT,
        player2_deck TEXT,
        duration_minutes INTEGER,
        notes TEXT,
        reported_by TEXT NOT NULL,
        is_verified INTEGER DEFAULT 0,
        verified_by TEXT,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ match_results table created");

    // Streaming tables
    console.log("\n📋 Creating Streaming tables...");

    // Stream Sessions
    await db.sql`
      CREATE TABLE IF NOT EXISTS stream_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'scheduled',
        streamer_id TEXT NOT NULL,
        event_id TEXT,
        scheduled_start INTEGER,
        actual_start INTEGER,
        actual_end INTEGER,
        viewer_count INTEGER DEFAULT 0,
        peak_viewers INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ stream_sessions table created");

    // Stream Session Co-Hosts
    await db.sql`
      CREATE TABLE IF NOT EXISTS stream_session_co_hosts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'co_host',
        joined_at INTEGER NOT NULL,
        left_at INTEGER,
        UNIQUE(session_id, user_id)
      )
    `;
    console.log("  ✅ stream_session_co_hosts table created");

    // Stream Session Platforms
    await db.sql`
      CREATE TABLE IF NOT EXISTS stream_session_platforms (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        stream_url TEXT,
        stream_key TEXT,
        status TEXT DEFAULT 'idle',
        viewer_count INTEGER DEFAULT 0,
        started_at INTEGER,
        ended_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ stream_session_platforms table created");

    // Collaboration Requests
    await db.sql`
      CREATE TABLE IF NOT EXISTS collaboration_requests (
        id TEXT PRIMARY KEY,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        event_id TEXT,
        message TEXT,
        status TEXT DEFAULT 'pending',
        expires_at INTEGER,
        created_at INTEGER NOT NULL,
        responded_at INTEGER
      )
    `;
    console.log("  ✅ collaboration_requests table created");

    // Collaborative Stream Events
    await db.sql`
      CREATE TABLE IF NOT EXISTS collaborative_stream_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        scheduled_start_time INTEGER NOT NULL,
        estimated_duration INTEGER,
        community_id TEXT,
        creator_id TEXT NOT NULL,
        organizer_id TEXT NOT NULL,
        status TEXT DEFAULT 'planned',
        streaming_platforms TEXT DEFAULT '[]',
        content_type TEXT,
        target_audience TEXT,
        max_collaborators INTEGER,
        requires_approval INTEGER DEFAULT 1,
        is_private INTEGER DEFAULT 0,
        tags TEXT DEFAULT '[]',
        actual_start_time INTEGER,
        actual_end_time INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ collaborative_stream_events table created");

    // Stream Collaborators
    await db.sql`
      CREATE TABLE IF NOT EXISTS stream_collaborators (
        id TEXT PRIMARY KEY,
        stream_event_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        platform_handles TEXT DEFAULT '{}',
        streaming_capabilities TEXT DEFAULT '[]',
        available_time_slots TEXT DEFAULT '{}',
        content_specialties TEXT DEFAULT '[]',
        technical_setup TEXT DEFAULT '{}',
        invited_by_user_id TEXT,
        invited_by TEXT,
        invited_at INTEGER NOT NULL,
        responded_at INTEGER,
        joined_at INTEGER,
        left_at INTEGER,
        UNIQUE(event_id, user_id)
      )
    `;
    console.log("  ✅ stream_collaborators table created");

    // Stream Coordination Sessions
    await db.sql`
      CREATE TABLE IF NOT EXISTS stream_coordination_sessions (
        id TEXT PRIMARY KEY,
        stream_event_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        current_phase TEXT DEFAULT 'preparation',
        current_host TEXT,
        current_host_id TEXT,
        active_collaborators TEXT DEFAULT '[]',
        platform_statuses TEXT DEFAULT '{}',
        viewer_counts TEXT DEFAULT '{}',
        coordination_events TEXT DEFAULT '[]',
        chat_moderation_active INTEGER DEFAULT 0,
        stream_quality_settings TEXT DEFAULT '{}',
        audio_coordination TEXT DEFAULT '{}',
        stream_metrics TEXT DEFAULT '{}',
        phase_history TEXT DEFAULT '[]',
        notes TEXT,
        actual_start_time INTEGER,
        actual_end_time INTEGER,
        started_at INTEGER,
        ended_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ stream_coordination_sessions table created");

    // Forum tables
    console.log("\n📋 Creating Forum tables...");

    // Forum Posts
    await db.sql`
      CREATE TABLE IF NOT EXISTS forum_posts (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        community_id TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        is_pinned INTEGER DEFAULT 0,
        is_locked INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        reply_count INTEGER DEFAULT 0,
        last_activity_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ forum_posts table created");

    // Forum Replies
    await db.sql`
      CREATE TABLE IF NOT EXISTS forum_replies (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        content TEXT NOT NULL,
        parent_reply_id TEXT,
        like_count INTEGER DEFAULT 0,
        is_edited INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ forum_replies table created");

    // Forum Post Likes
    await db.sql`
      CREATE TABLE IF NOT EXISTS forum_post_likes (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(post_id, user_id)
      )
    `;
    console.log("  ✅ forum_post_likes table created");

    // Forum Reply Likes
    await db.sql`
      CREATE TABLE IF NOT EXISTS forum_reply_likes (
        id TEXT PRIMARY KEY,
        reply_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(reply_id, user_id)
      )
    `;
    console.log("  ✅ forum_reply_likes table created");

    // Analytics tables
    console.log("\n📋 Creating Analytics tables...");

    // Stream Analytics
    await db.sql`
      CREATE TABLE IF NOT EXISTS stream_analytics (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        viewer_count INTEGER DEFAULT 0,
        peak_viewers INTEGER DEFAULT 0,
        average_viewers INTEGER DEFAULT 0,
        chat_messages INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        duration_minutes INTEGER DEFAULT 0,
        timestamp INTEGER NOT NULL
      )
    `;
    console.log("  ✅ stream_analytics table created");

    // User Activity Analytics
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_activity_analytics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        count INTEGER DEFAULT 1,
        metadata TEXT DEFAULT '{}',
        date TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(user_id, activity_type, date)
      )
    `;
    console.log("  ✅ user_activity_analytics table created");

    // Community Analytics
    await db.sql`
      CREATE TABLE IF NOT EXISTS community_analytics (
        id TEXT PRIMARY KEY,
        community_id TEXT NOT NULL,
        metric_type TEXT NOT NULL,
        value INTEGER DEFAULT 0,
        metadata TEXT DEFAULT '{}',
        date TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(community_id, metric_type, date)
      )
    `;
    console.log("  ✅ community_analytics table created");

    // Platform Metrics
    await db.sql`
      CREATE TABLE IF NOT EXISTS platform_metrics (
        id TEXT PRIMARY KEY,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        metric_type TEXT NOT NULL,
        tags TEXT DEFAULT '{}',
        timestamp INTEGER NOT NULL
      )
    `;
    console.log("  ✅ platform_metrics table created");

    // Event Tracking
    await db.sql`
      CREATE TABLE IF NOT EXISTS event_tracking (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        event_name TEXT NOT NULL,
        event_category TEXT NOT NULL,
        event_properties TEXT DEFAULT '{}',
        session_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        timestamp INTEGER NOT NULL
      )
    `;
    console.log("  ✅ event_tracking table created");

    // Conversion Funnels
    await db.sql`
      CREATE TABLE IF NOT EXISTS conversion_funnels (
        id TEXT PRIMARY KEY,
        funnel_name TEXT NOT NULL,
        step_name TEXT NOT NULL,
        step_order INTEGER NOT NULL,
        user_id TEXT,
        session_id TEXT,
        completed INTEGER DEFAULT 0,
        completed_at INTEGER,
        metadata TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ conversion_funnels table created");

    // Email Management tables
    console.log("\n📋 Creating Email Management tables...");

    // Email Change Requests
    await db.sql`
      CREATE TABLE IF NOT EXISTS email_change_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        current_email TEXT NOT NULL,
        new_email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        verification_code TEXT,
        expires_at INTEGER NOT NULL,
        initiated_at INTEGER NOT NULL,
        completed_at INTEGER
      )
    `;
    console.log("  ✅ email_change_requests table created");

    // Email Change Tokens
    await db.sql`
      CREATE TABLE IF NOT EXISTS email_change_tokens (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        is_used INTEGER DEFAULT 0,
        expires_at INTEGER NOT NULL,
        used_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ email_change_tokens table created");

    // User Settings tables
    console.log("\n📋 Creating User Settings tables...");

    // User Settings
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        notifications_enabled INTEGER DEFAULT 1,
        email_notifications INTEGER DEFAULT 1,
        push_notifications INTEGER DEFAULT 0,
        notification_types TEXT DEFAULT '{}',
        privacy_settings TEXT DEFAULT '{}',
        display_preferences TEXT DEFAULT '{}',
        language TEXT DEFAULT 'en',
        timezone TEXT DEFAULT 'UTC',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ user_settings table created");

    // User Social Links
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_social_links (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        url TEXT NOT NULL,
        display_name TEXT,
        is_verified INTEGER DEFAULT 0,
        is_public INTEGER DEFAULT 1,
        order_index INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ user_social_links table created");

    // User Gaming Profiles
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_gaming_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        game_type TEXT NOT NULL,
        player_id TEXT,
        username TEXT,
        skill_level TEXT,
        preferred_formats TEXT DEFAULT '[]',
        achievements TEXT DEFAULT '[]',
        statistics TEXT DEFAULT '{}',
        is_public INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(user_id, game_type)
      )
    `;
    console.log("  ✅ user_gaming_profiles table created");

    // Matchmaking Preferences
    await db.sql`
      CREATE TABLE IF NOT EXISTS matchmaking_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        game_type TEXT NOT NULL,
        preferred_formats TEXT DEFAULT '[]',
        skill_level_range TEXT DEFAULT '[]',
        availability_schedule TEXT DEFAULT '{}',
        max_travel_distance INTEGER,
        preferred_location TEXT,
        play_style TEXT,
        communication_preferences TEXT DEFAULT '{}',
        blocked_users TEXT DEFAULT '[]',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ matchmaking_preferences table created");

    // MFA & Security Extension tables
    console.log("\n📋 Creating MFA & Security Extension tables...");

    // User MFA Attempts
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_mfa_attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        attempt_type TEXT NOT NULL,
        success INTEGER NOT NULL,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        failure_reason TEXT,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ user_mfa_attempts table created");

    // Device Fingerprints
    await db.sql`
      CREATE TABLE IF NOT EXISTS device_fingerprints (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        fingerprint_hash TEXT NOT NULL,
        device_info TEXT DEFAULT '{}',
        first_seen INTEGER NOT NULL,
        last_seen INTEGER NOT NULL,
        trust_score REAL DEFAULT 0.5,
        is_blocked INTEGER DEFAULT 0,
        UNIQUE(user_id, fingerprint_hash)
      )
    `;
    console.log("  ✅ device_fingerprints table created");

    // MFA Security Context
    await db.sql`
      CREATE TABLE IF NOT EXISTS mfa_security_context (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        context_type TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        location TEXT,
        device_fingerprint TEXT,
        risk_level TEXT DEFAULT 'low',
        requires_mfa INTEGER DEFAULT 0,
        mfa_completed INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ mfa_security_context table created");

    // Trusted Devices
    await db.sql`
      CREATE TABLE IF NOT EXISTS trusted_devices (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_fingerprint_id TEXT NOT NULL,
        device_name TEXT,
        trusted_at INTEGER NOT NULL,
        last_used INTEGER NOT NULL,
        expires_at INTEGER,
        is_revoked INTEGER DEFAULT 0,
        revoked_at INTEGER,
        revoked_reason TEXT,
        UNIQUE(user_id, device_fingerprint_id)
      )
    `;
    console.log("  ✅ trusted_devices table created");

    // Refresh Tokens
    await db.sql`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        device_info TEXT DEFAULT '{}',
        ip_address TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        last_used INTEGER NOT NULL,
        is_revoked INTEGER DEFAULT 0,
        revoked_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ refresh_tokens table created");

    // Revoked JWT Tokens
    await db.sql`
      CREATE TABLE IF NOT EXISTS revoked_jwt_tokens (
        id TEXT PRIMARY KEY,
        jti TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        revoked_at INTEGER NOT NULL,
        reason TEXT
      )
    `;
    console.log("  ✅ revoked_jwt_tokens table created");

    // TableSync Universal Framework tables
    console.log("\n📋 Creating TableSync Universal Framework tables...");

    // Games table
    await db.sql`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        creator_id TEXT NOT NULL,
        is_official INTEGER DEFAULT 0,
        is_published INTEGER DEFAULT 0,
        version TEXT DEFAULT '1.0.0',
        player_count TEXT DEFAULT '{"min":2,"max":4}',
        avg_game_duration INTEGER,
        complexity INTEGER,
        age_rating TEXT,
        card_types TEXT DEFAULT '[]',
        resource_types TEXT DEFAULT '[]',
        zones TEXT DEFAULT '[]',
        phase_structure TEXT DEFAULT '[]',
        deck_rules TEXT DEFAULT '{"minDeckSize":60,"maxDeckSize":null,"maxCopies":4,"allowedSets":null}',
        theme TEXT DEFAULT '{"primaryColor":"#1a1a1a","accentColor":"#ffd700","cardBackUrl":null}',
        total_cards INTEGER DEFAULT 0,
        total_players INTEGER DEFAULT 0,
        total_games_played INTEGER DEFAULT 0,
        moderation_status TEXT DEFAULT 'pending',
        approved_at INTEGER,
        approved_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ games table created");

    // Cards table
    await db.sql`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        name TEXT NOT NULL,
        set_code TEXT,
        set_name TEXT,
        collector_number TEXT,
        rarity TEXT,
        external_id TEXT,
        external_source TEXT,
        attributes TEXT DEFAULT '{}',
        image_uris TEXT DEFAULT '{}',
        created_by TEXT,
        is_official INTEGER DEFAULT 0,
        is_community_submitted INTEGER DEFAULT 0,
        moderation_status TEXT DEFAULT 'approved',
        approved_by TEXT,
        approved_at INTEGER,
        search_count INTEGER DEFAULT 0,
        cached_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(game_id, external_id)
      )
    `;
    console.log("  ✅ cards table created");

    // Game card attributes table
    await db.sql`
      CREATE TABLE IF NOT EXISTS game_card_attributes (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        attribute_name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        data_type TEXT NOT NULL,
        is_required INTEGER DEFAULT 0,
        validation_rules TEXT DEFAULT '{}',
        display_order INTEGER DEFAULT 0,
        category TEXT,
        help_text TEXT,
        created_at INTEGER NOT NULL,
        UNIQUE(game_id, attribute_name)
      )
    `;
    console.log("  ✅ game_card_attributes table created");

    // Game formats table
    await db.sql`
      CREATE TABLE IF NOT EXISTS game_formats (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        deck_rules TEXT DEFAULT '{"minDeckSize":60,"maxDeckSize":null,"sideboard":false,"sideboardSize":0}',
        banned_cards TEXT DEFAULT '[]',
        restricted_cards TEXT DEFAULT '[]',
        allowed_sets TEXT DEFAULT '[]',
        is_official INTEGER DEFAULT 0,
        created_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(game_id, name)
      )
    `;
    console.log("  ✅ game_formats table created");

    // Card submissions table
    await db.sql`
      CREATE TABLE IF NOT EXISTS card_submissions (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        submitted_by TEXT NOT NULL,
        card_name TEXT NOT NULL,
        card_data TEXT NOT NULL,
        image_url TEXT,
        submission_notes TEXT,
        source TEXT,
        status TEXT DEFAULT 'pending',
        moderator_id TEXT,
        moderation_notes TEXT,
        reviewed_at INTEGER,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        approved_card_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ card_submissions table created");

    // Game analytics table
    await db.sql`
      CREATE TABLE IF NOT EXISTS game_analytics (
        id TEXT PRIMARY KEY,
        game_id TEXT,
        date TEXT NOT NULL,
        sessions_started INTEGER DEFAULT 0,
        unique_players INTEGER DEFAULT 0,
        total_playtime INTEGER DEFAULT 0,
        cards_searched INTEGER DEFAULT 0,
        cards_added INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        UNIQUE(game_id, date)
      )
    `;
    console.log("  ✅ game_analytics table created");

    // Admin & Moderation tables
    console.log("\n📋 Creating Admin & Moderation tables...");

    // User roles table
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_roles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        permissions TEXT NOT NULL DEFAULT '[]',
        community_id TEXT,
        assigned_by TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        expires_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(user_id, role, community_id)
      )
    `;
    console.log("  ✅ user_roles table created");

    // User reputation table
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_reputation (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        score INTEGER DEFAULT 100,
        level TEXT DEFAULT 'new',
        positive_actions INTEGER DEFAULT 0,
        negative_actions INTEGER DEFAULT 0,
        reports_made INTEGER DEFAULT 0,
        reports_accurate INTEGER DEFAULT 0,
        moderation_history TEXT DEFAULT '[]',
        last_calculated INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ user_reputation table created");

    // Content reports table
    await db.sql`
      CREATE TABLE IF NOT EXISTS content_reports (
        id TEXT PRIMARY KEY,
        reporter_user_id TEXT,
        reported_user_id TEXT,
        content_type TEXT NOT NULL,
        content_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        evidence TEXT,
        is_system_generated INTEGER DEFAULT 0,
        automated_flags TEXT,
        confidence_score REAL,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        assigned_moderator TEXT,
        moderation_notes TEXT,
        resolution TEXT,
        action_taken TEXT,
        created_at INTEGER NOT NULL,
        resolved_at INTEGER
      )
    `;
    console.log("  ✅ content_reports table created");

    // Moderation actions table
    await db.sql`
      CREATE TABLE IF NOT EXISTS moderation_actions (
        id TEXT PRIMARY KEY,
        moderator_id TEXT NOT NULL,
        target_user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        reason TEXT NOT NULL,
        duration INTEGER,
        related_content_type TEXT,
        related_content_id TEXT,
        related_report_id TEXT,
        is_reversible INTEGER DEFAULT 1,
        is_public INTEGER DEFAULT 0,
        metadata TEXT,
        ip_address TEXT,
        user_agent TEXT,
        admin_notes TEXT,
        is_active INTEGER DEFAULT 1,
        reversed_by TEXT,
        reversed_at INTEGER,
        reversal_reason TEXT,
        expires_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ moderation_actions table created");

    // Moderation queue table
    await db.sql`
      CREATE TABLE IF NOT EXISTS moderation_queue (
        id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        priority INTEGER DEFAULT 5,
        status TEXT DEFAULT 'open',
        assigned_moderator TEXT,
        assigned_at INTEGER,
        risk_score REAL,
        user_reputation_score INTEGER,
        reporter_reputation_score INTEGER,
        ml_priority INTEGER,
        auto_generated INTEGER DEFAULT 0,
        summary TEXT,
        tags TEXT DEFAULT '[]',
        estimated_time_minutes INTEGER,
        metadata TEXT,
        resolution TEXT,
        action_taken TEXT,
        created_at INTEGER NOT NULL,
        completed_at INTEGER
      )
    `;
    console.log("  ✅ moderation_queue table created");

    // CMS content table
    await db.sql`
      CREATE TABLE IF NOT EXISTS cms_content (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        is_published INTEGER DEFAULT 0,
        published_at INTEGER,
        scheduled_publish_at INTEGER,
        author_id TEXT NOT NULL,
        last_edited_by TEXT NOT NULL,
        approved_by TEXT,
        approved_at INTEGER,
        change_log TEXT,
        previous_version_id TEXT,
        meta_description TEXT,
        meta_keywords TEXT,
        slug TEXT UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ cms_content table created");

    // Ban evasion tracking table
    await db.sql`
      CREATE TABLE IF NOT EXISTS ban_evasion_tracking (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        hashed_fingerprint TEXT,
        user_agent TEXT,
        screen_resolution TEXT,
        timezone TEXT,
        language TEXT,
        login_patterns TEXT,
        activity_signature TEXT,
        detection_method TEXT,
        confidence_score REAL,
        related_banned_user TEXT,
        status TEXT DEFAULT 'flagged',
        investigated_by TEXT,
        investigated_at INTEGER,
        notes TEXT,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ ban_evasion_tracking table created");

    // User appeals table
    await db.sql`
      CREATE TABLE IF NOT EXISTS user_appeals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        moderation_action_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        evidence TEXT,
        additional_info TEXT,
        status TEXT DEFAULT 'pending',
        reviewed_by TEXT,
        reviewed_at INTEGER,
        review_notes TEXT,
        decision TEXT,
        decision_reason TEXT,
        response_to_user TEXT,
        is_user_notified INTEGER DEFAULT 0,
        can_reappeal INTEGER DEFAULT 0,
        reappeal_cooldown_until INTEGER,
        resolved_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ user_appeals table created");

    // Moderation templates table
    await db.sql`
      CREATE TABLE IF NOT EXISTS moderation_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subject TEXT,
        content TEXT NOT NULL,
        variables TEXT DEFAULT '[]',
        is_active INTEGER DEFAULT 1,
        created_by TEXT NOT NULL,
        last_modified_by TEXT NOT NULL,
        usage_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ moderation_templates table created");

    // Admin audit log table
    await db.sql`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        category TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        target_identifier TEXT,
        old_values TEXT,
        new_values TEXT,
        parameters TEXT,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        session_id TEXT,
        success INTEGER DEFAULT 1,
        error_message TEXT,
        impact_assessment TEXT,
        created_at INTEGER NOT NULL
      )
    `;
    console.log("  ✅ admin_audit_log table created");

    // Create indexes
    console.log("\n📋 Creating indexes...");

    // Note: Skipping indexes for legacy tables (accounts, sessions, users, communities, events, messages, user_communities)
    // to avoid column name mismatches with existing tables

    // User Platform Accounts indexes (new table)
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_platform_user_id ON user_platform_accounts(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_platform_platform ON user_platform_accounts(platform)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_platform_active ON user_platform_accounts(user_id, is_active)`;

    // Event Attendees indexes (new table)
    await db.sql`CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id)`;

    // Notifications indexes (new table)
    await db.sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)`;

    // Game session indexes (new table)
    await db.sql`CREATE INDEX IF NOT EXISTS idx_game_sessions_event ON game_sessions(event_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_game_sessions_host ON game_sessions(host_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status)`;

    // Authentication & Security indexes (new tables)
    await db.sql`CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification_tokens(token)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_tokens(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON auth_audit_log(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_auth_audit_event ON auth_audit_log(event_type)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(created_at)`;

    // Social features indexes (new tables)
    await db.sql`CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_activities_created ON user_activities(created_at)`;

    // Tournament indexes (new tables)
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tournaments_organizer ON tournaments(organizer_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tournaments_community ON tournaments(community_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tournament_formats_game ON tournament_formats(game_type)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tournament_rounds_tournament ON tournament_rounds(tournament_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tournament_rounds_number ON tournament_rounds(tournament_id, round_number)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches(round_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_tournament_matches_players ON tournament_matches(player1_id, player2_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_match_results_match ON match_results(match_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_match_results_reporter ON match_results(reported_by)`;

    // Streaming indexes (new tables)
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_sessions_streamer ON stream_sessions(streamer_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_sessions_event ON stream_sessions(event_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_sessions_status ON stream_sessions(status)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_co_hosts_session ON stream_session_co_hosts(session_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_co_hosts_user ON stream_session_co_hosts(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_platforms_session ON stream_session_platforms(session_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_platforms_platform ON stream_session_platforms(platform)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_collaboration_requests_from ON collaboration_requests(from_user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_collaboration_requests_to ON collaboration_requests(to_user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_collaboration_requests_event ON collaboration_requests(event_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_collaboration_requests_status ON collaboration_requests(status)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_collab_stream_events_organizer ON collaborative_stream_events(organizer_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_collab_stream_events_community ON collaborative_stream_events(community_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_collab_stream_events_start ON collaborative_stream_events(scheduled_start_time)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_collab_stream_events_status ON collaborative_stream_events(status)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_collaborators_event ON stream_collaborators(event_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_collaborators_user ON stream_collaborators(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_collaborators_status ON stream_collaborators(status)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_coordination_event ON stream_coordination_sessions(event_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_coordination_phase ON stream_coordination_sessions(current_phase)`;

    // Forum indexes (new tables)
    await db.sql`CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_forum_posts_community ON forum_posts(community_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_forum_posts_activity ON forum_posts(last_activity_at)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON forum_replies(post_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_forum_replies_author ON forum_replies(author_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_forum_replies_parent ON forum_replies(parent_reply_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post ON forum_post_likes(post_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_forum_post_likes_user ON forum_post_likes(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_reply ON forum_reply_likes(reply_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_user ON forum_reply_likes(user_id)`;

    // Analytics indexes (new tables)
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_analytics_session ON stream_analytics(session_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_analytics_user ON stream_analytics(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_stream_analytics_timestamp ON stream_analytics(timestamp)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_analytics(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_analytics(activity_type)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_activity_date ON user_activity_analytics(date)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_community_analytics_community ON community_analytics(community_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_community_analytics_metric ON community_analytics(metric_type)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_community_analytics_date ON community_analytics(date)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_platform_metrics_name ON platform_metrics(metric_name)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_platform_metrics_timestamp ON platform_metrics(timestamp)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_event_tracking_user ON event_tracking(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_event_tracking_name ON event_tracking(event_name)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_event_tracking_category ON event_tracking(event_category)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_event_tracking_timestamp ON event_tracking(timestamp)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_conversion_funnel_name ON conversion_funnels(funnel_name)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_conversion_funnel_user ON conversion_funnels(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_conversion_funnel_session ON conversion_funnels(session_id)`;

    // Email management indexes (new tables)
    await db.sql`CREATE INDEX IF NOT EXISTS idx_email_change_user ON email_change_requests(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_email_change_status ON email_change_requests(status)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_email_change_new_email ON email_change_requests(new_email)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_email_change_token_request ON email_change_tokens(request_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_email_change_token_token ON email_change_tokens(token)`;

    // User settings indexes (new tables)
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_social_links_user ON user_social_links(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_social_links_platform ON user_social_links(platform)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_gaming_profiles_user ON user_gaming_profiles(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_user_gaming_profiles_game ON user_gaming_profiles(game_type)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_matchmaking_prefs_user ON matchmaking_preferences(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_matchmaking_prefs_game ON matchmaking_preferences(game_type)`;

    // MFA & Security indexes (new tables)
    await db.sql`CREATE INDEX IF NOT EXISTS idx_mfa_attempts_user ON user_mfa_attempts(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_mfa_attempts_created ON user_mfa_attempts(created_at)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_mfa_attempts_success ON user_mfa_attempts(success)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user ON device_fingerprints(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_mfa_context_user ON mfa_security_context(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_mfa_context_type ON mfa_security_context(context_type)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_mfa_context_created ON mfa_security_context(created_at)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_revoked_jwt_jti ON revoked_jwt_tokens(jti)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_revoked_jwt_user ON revoked_jwt_tokens(user_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_revoked_jwt_expires ON revoked_jwt_tokens(expires_at)`;

    // TableSync Universal Framework indexes
    await db.sql`CREATE INDEX IF NOT EXISTS idx_games_creator_id ON games(creator_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_games_published ON games(is_published)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_games_official ON games(is_official)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_games_name ON games(name)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_cards_game_id ON cards(game_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_cards_external_id ON cards(external_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_cards_set_code ON cards(set_code)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_game_card_attributes_game_id ON game_card_attributes(game_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_game_formats_game_id ON game_formats(game_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_card_submissions_game_id ON card_submissions(game_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_card_submissions_submitted_by ON card_submissions(submitted_by)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_card_submissions_status ON card_submissions(status)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_game_analytics_game_date ON game_analytics(game_id, date)`;

    // Admin & Moderation indexes (existing tables - may have legacy schemas)
    // Skip creating indexes on these tables to avoid schema conflicts

    console.log("  ✅ All indexes created");

    // Verify tables
    console.log("\n🔍 Verifying database schema...");
    const tables = await db.sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `;

    console.log("\n📊 Database tables:");
    for (const table of tables) {
      console.log(`  • ${table.name}`);
    }

    console.log("\n✅ Database initialization complete!");
    console.log("\n📝 Next steps:");
    console.log("  1. Verify the schema: npm run db:health");
    console.log("  2. Start the development server: npm run dev");
    console.log("  3. Test authentication flows");

    process.exit(0);
  } catch (error) {
    // Sanitize error message to prevent credential leaks
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Remove any potential DATABASE_URL or API keys from error message
    const sanitizedMessage = errorMessage.replace(
      /apikey=[^&\s]+/gi,
      "apikey=***",
    );
    console.error("\n❌ Database initialization failed:", sanitizedMessage);

    process.exit(1);
  } finally {
    // Ensure connection is always closed
    if (db) {
      try {
        await db.close();
        console.log("🔌 Connection closed.");
      } catch (closeError) {
        console.error("⚠️  Error closing connection");
      }
    }
  }
}

initializeDatabase();
