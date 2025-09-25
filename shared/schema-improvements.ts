// Schema improvements for Drizzle ORM implementation
// This file contains suggested improvements to the existing schema

import { pgEnum } from "drizzle-orm/pg-core";

// Define PostgreSQL enums for better type safety and performance
export const userStatusEnum = pgEnum('user_status', ['online', 'offline', 'away', 'busy', 'gaming']);
export const privacyLevelEnum = pgEnum('privacy_level', ['everyone', 'friends_only', 'private']);
export const eventTypeEnum = pgEnum('event_type', ['tournament', 'convention', 'release', 'stream', 'community', 'personal', 'game_pod']);
export const eventStatusEnum = pgEnum('event_status', ['active', 'cancelled', 'completed', 'draft']);
export const attendeeStatusEnum = pgEnum('attendee_status', ['attending', 'maybe', 'not_attending']);
export const gameSessionStatusEnum = pgEnum('game_session_status', ['waiting', 'active', 'paused', 'completed', 'cancelled']);
export const notificationTypeEnum = pgEnum('notification_type', ['event_join', 'event_leave', 'game_invite', 'message', 'system']);
export const notificationPriorityEnum = pgEnum('notification_priority', ['low', 'normal', 'high', 'urgent']);

// Additional composite indexes that would improve query performance
export const suggestedIndexes = [
  // User community membership queries (userId, communityId, isPrimary)
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_communities_primary ON user_communities (user_id, is_primary) WHERE is_primary = true;',
  
  // Event queries by community and date range
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_community_date_status ON events (community_id, date, status);',
  
  // User activity tracking
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_active ON users (last_active_at DESC) WHERE last_active_at IS NOT NULL;',
  
  // Notification queries by user and read status
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, created_at DESC) WHERE is_read = false;',
  
  // Game session matching
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_sessions_status_community ON game_sessions (status, community_id) WHERE status IN (\'waiting\', \'active\');',
  
  // Event attendee queries
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_attendees_status ON event_attendees (event_id, status, role);',
  
  // User platform accounts for streaming coordination
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_platform_accounts_active ON user_platform_accounts (user_id, platform, is_active) WHERE is_active = true;'
];

// Prepared statement definitions for commonly used queries
export const preparedStatements = {
  // User authentication
  getUserByEmail: `
    SELECT id, email, password_hash, is_email_verified, mfa_enabled, 
           failed_login_attempts, account_locked_until, last_login_at
    FROM users 
    WHERE email = $1 AND is_email_verified = true
  `,
  
  // User community membership
  getUserCommunities: `
    SELECT c.id, c.name, c.display_name, c.theme_color, uc.is_primary
    FROM communities c
    INNER JOIN user_communities uc ON c.id = uc.community_id
    WHERE uc.user_id = $1
    ORDER BY uc.is_primary DESC, c.name
  `,
  
  // Upcoming events for user
  getUpcomingEvents: `
    SELECT e.*, c.name as community_name, u.first_name, u.last_name
    FROM events e
    LEFT JOIN communities c ON e.community_id = c.id
    LEFT JOIN users u ON e.creator_id = u.id
    WHERE e.date >= CURRENT_DATE 
      AND e.status = 'active'
      AND (e.is_public = true OR EXISTS (
        SELECT 1 FROM user_communities uc 
        WHERE uc.user_id = $1 AND uc.community_id = e.community_id
      ))
    ORDER BY e.date, e.time
    LIMIT $2
  `,
  
  // Active game sessions for community
  getActiveGameSessions: `
    SELECT gs.*, u.first_name, u.last_name, u.username
    FROM game_sessions gs
    INNER JOIN users u ON gs.creator_id = u.id
    WHERE gs.community_id = $1 
      AND gs.status IN ('waiting', 'active')
    ORDER BY gs.created_at DESC
  `,
  
  // Unread notifications count
  getUnreadNotificationsCount: `
    SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = $1 AND is_read = false
  `
};

// Enhanced error handling types
export interface DatabaseError extends Error {
  code?: string;
  constraint?: string;
  table?: string;
  column?: string;
}

export class DatabaseOperationError extends Error {
  constructor(
    message: string,
    public operation: string,
    public table: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseOperationError';
  }
}

export class DatabaseConnectionError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

// Transaction helper with improved error handling
export async function withTransaction<T>(
  db: any,
  operation: (tx: any) => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await db.transaction(async (tx: any) => {
      try {
        return await operation(tx);
      } catch (error) {
        console.error(`Transaction failed for ${operationName}:`, error);
        throw new DatabaseOperationError(
          `Transaction failed: ${operationName}`,
          operationName,
          'unknown',
          error as Error
        );
      }
    });
  } catch (error) {
    if (error instanceof DatabaseOperationError) {
      throw error;
    }
    throw new DatabaseConnectionError(
      `Failed to start transaction for ${operationName}`,
      error as Error
    );
  }
}

// Migration suggestions for existing schema
export const migrationSuggestions = [
  {
    name: 'add_user_status_enum',
    description: 'Convert user status varchar to enum for better type safety',
    sql: `
      -- Create enum type
      CREATE TYPE user_status AS ENUM ('online', 'offline', 'away', 'busy', 'gaming');
      
      -- Add new column with enum type
      ALTER TABLE users ADD COLUMN status_new user_status DEFAULT 'offline';
      
      -- Migrate data
      UPDATE users SET status_new = CASE 
        WHEN status = 'online' THEN 'online'::user_status
        WHEN status = 'away' THEN 'away'::user_status
        WHEN status = 'busy' THEN 'busy'::user_status
        WHEN status = 'gaming' THEN 'gaming'::user_status
        ELSE 'offline'::user_status
      END;
      
      -- Drop old column and rename new one
      ALTER TABLE users DROP COLUMN status;
      ALTER TABLE users RENAME COLUMN status_new TO status;
    `
  },
  {
    name: 'add_event_status_enum',
    description: 'Convert event status varchar to enum',
    sql: `
      CREATE TYPE event_status AS ENUM ('active', 'cancelled', 'completed', 'draft');
      ALTER TABLE events ADD COLUMN status_new event_status DEFAULT 'active';
      UPDATE events SET status_new = CASE 
        WHEN status = 'active' THEN 'active'::event_status
        WHEN status = 'cancelled' THEN 'cancelled'::event_status
        WHEN status = 'completed' THEN 'completed'::event_status
        ELSE 'active'::event_status
      END;
      ALTER TABLE events DROP COLUMN status;
      ALTER TABLE events RENAME COLUMN status_new TO status;
    `
  }
];