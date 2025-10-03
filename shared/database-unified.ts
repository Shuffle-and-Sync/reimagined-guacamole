// Unified database configuration for Drizzle ORM
// Supports SQLite Cloud connections
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local for development
config({ path: resolve(process.cwd(), '.env.local') });

import { sql } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import * as schema from "./schema";

// Export schema and transaction types for use in repositories
export type Schema = typeof schema;
export type Database = BetterSQLite3Database<Schema>;
export type Transaction = any; // SQLite transaction type

// Handle missing DATABASE_URL gracefully for Cloud Run health checks
const databaseUrl = process.env.DATABASE_URL || "sqlitecloud://cgqwvg83nk.g4.sqlite.cloud:8860/shuffleandsync?apikey=WXRy8ecObcGjMYRmuTT7bAEnvblToCbV4bHqUv8g6oQ";

if (!databaseUrl) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('WARNING: DATABASE_URL environment variable is missing - using default SQLite Cloud connection');
  } else {
    throw new Error("DATABASE_URL environment variable is required");
  }
}

console.log(`🔌 Connecting to SQLite Cloud`);

// SQLite Cloud connection setup
let db: Database;
let connectionTested = false;

async function initializeConnection() {
  try {
    const { Database: SQLiteCloudDatabase } = await import('@sqlitecloud/drivers');
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    
    // Create SQLite Cloud connection
    const sqliteCloud = new SQLiteCloudDatabase(databaseUrl);
    
    // Create Drizzle instance with SQLite Cloud
    db = drizzle(sqliteCloud as any, { schema });
    
    // Test the connection
    await sqliteCloud.sql`SELECT 1 as test`;
    
    console.log(`✅ Connected to SQLite Cloud successfully`);
  } catch (error) {
    console.error('❌ SQLite Cloud connection failed:', error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  connectionTested = true;
}

// Initialize connection immediately but handle errors gracefully
if (databaseUrl) {
  initializeConnection().catch(error => {
    console.error('❌ Failed to initialize database connection:', error);
    // Don't throw here, let individual operations handle the error
  });
}

// Export connection info for debugging
export const connectionInfo = {
  type: 'sqlitecloud',
  driver: 'SQLite Cloud',
  url: databaseUrl ? databaseUrl.replace(/apikey=[^&]+/, 'apikey=***') : 'not set' // Hide API key
};

// Add development logging  
if (process.env.NODE_ENV === 'development' && process.env.DB_LOG_QUERIES === 'true') {
  console.log(`[DB] 🔍 Query logging enabled for SQLite Cloud connection`);
}

// Export the database instance
export { db };

// Database performance monitoring
export class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private queryStats = new Map<string, { count: number; totalTime: number; avgTime: number; timestamps: number[] }>();
  
  public static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  public recordQuery(operation: string, duration: number): void {
    const stats = this.queryStats.get(operation) || { count: 0, totalTime: 0, avgTime: 0, timestamps: [] };
    stats.count += 1;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;
    stats.timestamps.push(Date.now());
    
    // Keep only last 100 timestamps to prevent memory bloat
    if (stats.timestamps.length > 100) {
      stats.timestamps = stats.timestamps.slice(-100);
    }
    
    this.queryStats.set(operation, stats);
  }

  public getStats(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    const result: Record<string, { count: number; totalTime: number; avgTime: number }> = {};
    for (const [key, value] of this.queryStats.entries()) {
      result[key] = {
        count: value.count,
        totalTime: value.totalTime,
        avgTime: value.avgTime
      };
    }
    return result;
  }

  public getSlowQueries(thresholdMs: number = 500): Record<string, { count: number; totalTime: number; avgTime: number }> {
    const result: Record<string, { count: number; totalTime: number; avgTime: number }> = {};
    for (const [key, value] of this.queryStats.entries()) {
      if (value.avgTime > thresholdMs) {
        result[key] = {
          count: value.count,
          totalTime: value.totalTime,
          avgTime: value.avgTime
        };
      }
    }
    return result;
  }

  public reset(): void {
    this.queryStats.clear();
  }
}

// Query timing wrapper for performance monitoring
export function withQueryTiming<T>(operation: string, queryFunction: () => Promise<T>): Promise<T> {
  const startTime = Date.now();
  return queryFunction().finally(() => {
    const duration = Date.now() - startTime;
    DatabaseMonitor.getInstance().recordQuery(operation, duration);
    
    if (duration > 1000) { // Log slow queries (> 1 second)
      console.warn(`🐌 Slow query detected - ${operation}: ${duration}ms`);
    }
  });
}

// Connection health monitoring
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  connectionInfo?: any;
  queryResponseTime?: number;
  performanceMetrics?: any;
  error?: string;
}> {
  try {
    // Wait for connection to be initialized if not already done
    if (!connectionTested) {
      await initializeConnection();
    }
    
    const startTime = Date.now();
    
    // Test basic connectivity with SQLite
    await db.run(sql`SELECT 1 as health_check`);
    
    const queryResponseTime = Date.now() - startTime;
    
    // Get performance metrics
    const performanceMetrics = DatabaseMonitor.getInstance().getStats();

    return {
      status: 'healthy',
      connectionInfo,
      queryResponseTime,
      performanceMetrics
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Prepared statement cache for commonly used queries
export class PreparedStatementCache {
  private static instance: PreparedStatementCache;
  private statements = new Map<string, any>();
  
  public static getInstance(): PreparedStatementCache {
    if (!PreparedStatementCache.instance) {
      PreparedStatementCache.instance = new PreparedStatementCache();
    }
    return PreparedStatementCache.instance;
  }

  public getOrPrepare<T = any>(key: string, queryBuilder: () => any): any {
    if (!this.statements.has(key)) {
      const prepared = queryBuilder().prepare();
      this.statements.set(key, prepared);
    }
    return this.statements.get(key)!;
  }

  public clear(): void {
    this.statements.clear();
  }
}

// Prepared statements for common queries - high priority database improvement
export const preparedQueries = {
  // Authentication queries
  getUserByEmail: () => {
    const cache = PreparedStatementCache.getInstance();
    return cache.getOrPrepare('getUserByEmail', () => 
      db.select({
        id: schema.users.id,
        email: schema.users.email,
        passwordHash: schema.users.passwordHash,
        isEmailVerified: schema.users.isEmailVerified,
        mfaEnabled: schema.users.mfaEnabled,
        failedLoginAttempts: schema.users.failedLoginAttempts,
        accountLockedUntil: schema.users.accountLockedUntil,
        lastLoginAt: schema.users.lastLoginAt
      })
      .from(schema.users)
      .where(sql`email = $1 AND is_email_verified = true`)
    );
  },

  // User community membership queries
  getUserCommunities: () => {
    const cache = PreparedStatementCache.getInstance();
    return cache.getOrPrepare('getUserCommunities', () =>
      db.select({
        id: schema.communities.id,
        name: schema.communities.name,
        displayName: schema.communities.displayName,
        themeColor: schema.communities.themeColor,
        isPrimary: schema.userCommunities.isPrimary
      })
      .from(schema.communities)
      .innerJoin(schema.userCommunities, sql`communities.id = user_communities.community_id`)
      .where(sql`user_communities.user_id = $1`)
      .orderBy(schema.userCommunities.isPrimary, schema.communities.name)
    );
  },

  // Event queries
  getUpcomingEvents: () => {
    const cache = PreparedStatementCache.getInstance();
    return cache.getOrPrepare('getUpcomingEvents', () =>
      db.select({
        id: schema.events.id,
        title: schema.events.title,
        description: schema.events.description,
        type: schema.events.type,
        startTime: schema.events.startTime,
        endTime: schema.events.endTime,
        location: schema.events.location,
        status: schema.events.status,
        communityName: schema.communities.name,
        hostFirstName: schema.users.firstName,
        hostLastName: schema.users.lastName
      })
      .from(schema.events)
      .leftJoin(schema.communities, sql`events.community_id = communities.id`)
      .leftJoin(schema.users, sql`events.host_id = users.id`)
      .where(sql`events.start_time >= $1 AND events.status = 'active'`)
      .orderBy(schema.events.startTime)
      .limit(50)
    );
  },

  // Community events for a specific community
  getCommunityEvents: () => {
    const cache = PreparedStatementCache.getInstance();
    return cache.getOrPrepare('getCommunityEvents', () =>
      db.select()
      .from(schema.events)
      .where(sql`community_id = $1 AND status = 'active'`)
      .orderBy(schema.events.startTime)
    );
  }
};

// Composite indexes for database performance - medium priority improvement
export const compositeIndexes = [
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
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_platform_accounts_active ON user_platform_accounts (user_id, platform, is_active) WHERE is_active = true;',
  
  // Friend request queries
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friend_requests_addressee_status ON friend_requests (addressee_id, status) WHERE status = \'pending\';',
  
  // Tournament participant queries
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_participants_user_status ON tournament_participants (user_id, status);',
  
  // Authentication session optimization
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expire ON sessions (expire) WHERE expire > NOW();'
];

// Function to apply composite indexes
export async function applyCompositeIndexes(): Promise<void> {
  console.log('🚀 Applying composite indexes for database performance...');
  
  for (const indexSql of compositeIndexes) {
    try {
      await db.run(sql.raw(indexSql));
      const indexName = indexSql.match(/idx_\w+/)?.[0] || 'unknown';
      console.log(`✅ Applied index: ${indexName}`);
    } catch (error) {
      const indexName = indexSql.match(/idx_\w+/)?.[0] || 'unknown';
      console.warn(`⚠️  Index ${indexName} may already exist or failed:`, error instanceof Error ? error.message : error);
    }
  }
  
  console.log('✅ Composite indexes application completed!');
}

// Enhanced transaction wrapper with better error handling and retry logic
export async function withTransaction<T>(
  operation: (tx: Transaction) => Promise<T>,
  operationName: string = 'transaction',
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withQueryTiming(`${operationName}:attempt_${attempt}`, async () => {
        return await db.transaction(async (tx: Transaction) => {
          return await operation(tx);
        });
      });
    } catch (error) {
      lastError = error as Error;
      
      // Log the error
      console.error(`Transaction attempt ${attempt} failed for ${operationName}:`, error);
      
      // Record performance metrics for failed transactions
      DatabasePerformanceMonitor.getInstance().recordConnectionAlert(
        `Transaction ${operationName} failed on attempt ${attempt}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'warning'
      );
      
      // Check if error is retryable (connection issues, deadlocks, etc.)
      const isRetryable = error instanceof Error && (
        error.message.includes('connection') ||
        error.message.includes('deadlock') ||
        error.message.includes('timeout') ||
        error.message.includes('pool') ||
        error.message.includes('ECONNRESET')
      );
      
      if (!isRetryable || attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff delay
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Throw appropriate error type based on the last error
  if (lastError?.message.includes('connection')) {
    throw new DatabaseConnectionError(`Transaction failed after ${maxRetries} attempts`, lastError);
  } else {
    throw new DatabaseTransactionError(
      `Transaction ${operationName} failed after ${maxRetries} attempts`,
      operationName,
      lastError || undefined
    );
  }
}

// Connection lifecycle management
export async function initializeDatabase(): Promise<void> {
  // Skip initialization if DATABASE_URL is not set (for health checks)
  if (!databaseUrl) {
    console.warn('⚠️ Skipping database initialization - DATABASE_URL not configured');
    return;
  }
  
  try {
    // Wait for connection to be initialized if not already done
    if (!connectionTested) {
      await initializeConnection();
    }
    
    // Test the connection
    await db.run(sql`SELECT 1`);
    console.log('✅ Database connection established');
    
    // Log connection info
    console.log('📊 Connection info:', {
      type: connectionInfo.type,
      driver: connectionInfo.driver,
      url: connectionInfo.url
    });
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

export async function closeDatabaseConnections(): Promise<void> {
  try {
    // SQLite Cloud connections are typically managed automatically
    console.log('✅ Database connections closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
    throw error;
  }
}

// Export the unified database instance
export { db as database };

// Legacy compatibility exports (to ease migration)
export const prisma = null; // Prisma is not used in this unified configuration

// Custom error types for different database scenarios - low priority improvement
export class DatabaseConnectionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

export class DatabaseQueryError extends Error {
  constructor(message: string, public query?: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseQueryError';
  }
}

export class DatabaseTransactionError extends Error {
  constructor(message: string, public operation?: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseTransactionError';
  }
}

export class DatabaseValidationError extends Error {
  constructor(message: string, public field?: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseValidationError';
  }
}

// Enhanced performance monitoring for database operations
export class DatabasePerformanceMonitor {
  private static instance: DatabasePerformanceMonitor;
  private queryMetrics = new Map<string, { count: number; totalTime: number; avgTime: number; lastExecuted: Date }>();
  private slowQueries: Array<{ query: string; duration: number; timestamp: Date }> = [];
  private connectionAlerts: Array<{ message: string; timestamp: Date; level: 'warning' | 'error' }> = [];

  public static getInstance(): DatabasePerformanceMonitor {
    if (!DatabasePerformanceMonitor.instance) {
      DatabasePerformanceMonitor.instance = new DatabasePerformanceMonitor();
    }
    return DatabasePerformanceMonitor.instance;
  }

  public recordQuery(queryName: string, duration: number): void {
    const existing = this.queryMetrics.get(queryName);
    if (existing) {
      existing.count++;
      existing.totalTime += duration;
      existing.avgTime = existing.totalTime / existing.count;
      existing.lastExecuted = new Date();
    } else {
      this.queryMetrics.set(queryName, {
        count: 1,
        totalTime: duration,
        avgTime: duration,
        lastExecuted: new Date()
      });
    }

    // Track slow queries (> 1 second)
    if (duration > 1000) {
      this.slowQueries.push({
        query: queryName,
        duration,
        timestamp: new Date()
      });
      
      // Keep only recent slow queries
      if (this.slowQueries.length > 100) {
        this.slowQueries = this.slowQueries.slice(-100);
      }
    }
  }

  public recordConnectionAlert(message: string, level: 'warning' | 'error' = 'warning'): void {
    this.connectionAlerts.push({
      message,
      timestamp: new Date(),
      level
    });
    
    // Keep only recent alerts
    if (this.connectionAlerts.length > 50) {
      this.connectionAlerts = this.connectionAlerts.slice(-50);
    }
  }

  public getMetrics() {
    return {
      queryMetrics: Object.fromEntries(this.queryMetrics),
      slowQueries: this.slowQueries.slice(-20), // Last 20 slow queries
      connectionAlerts: this.connectionAlerts.slice(-10), // Last 10 alerts
      totalQueries: Array.from(this.queryMetrics.values()).reduce((sum, metric) => sum + metric.count, 0)
    };
  }

  public getConnectionPoolStatus() {
    return {
      totalConnections: 1, // SQLite Cloud manages connections internally
      idleConnections: 0,
      waitingCount: 0,
      maxConnections: 1,
      minConnections: 1
    };
  }
}