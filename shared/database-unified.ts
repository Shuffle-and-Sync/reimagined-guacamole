// Unified database configuration for Drizzle ORM
// Combines optimizations from server/db-optimized.ts with shared database access
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local for development
config({ path: resolve(process.cwd(), '.env.local') });

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import ws from "ws";
import * as schema from "./schema";

// Configure WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Optimized connection pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool optimization
  max: parseInt(process.env.DB_POOL_MAX_SIZE || '20'), // Max connections
  min: parseInt(process.env.DB_POOL_MIN_SIZE || '5'),  // Min connections
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000'), // 10 seconds
  // Neon-specific optimizations
  keepAlive: true,
  keepAliveInitialDelayMillis: 30000,
};

export const pool = new Pool(poolConfig);

// Enhanced Drizzle configuration with conditional logging
export const db = drizzle({ 
  client: pool, 
  schema,
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery(query, params) {
      if (process.env.DB_LOG_QUERIES === 'true') {
        console.log('🔍 DB Query:', query);
        if (params) console.log('📋 Params:', params);
      }
    }
  } : false
});

// Database performance monitoring
export class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private queryStats = new Map<string, { count: number; totalTime: number; avgTime: number }>();
  
  public static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  public recordQuery(operation: string, duration: number): void {
    const stats = this.queryStats.get(operation) || { count: 0, totalTime: 0, avgTime: 0 };
    stats.count += 1;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;
    this.queryStats.set(operation, stats);
  }

  public getStats(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    return Object.fromEntries(this.queryStats);
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
  poolStatus?: any;
  connectionCount?: number;
  queryResponseTime?: number;
  error?: string;
}> {
  try {
    const startTime = Date.now();
    
    // Test basic connectivity
    await pool.query('SELECT 1');
    
    const queryResponseTime = Date.now() - startTime;
    
    // Get pool status
    const poolStatus = {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingCount: pool.waitingCount
    };

    return {
      status: 'healthy',
      poolStatus,
      connectionCount: pool.totalCount,
      queryResponseTime
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

// Enhanced transaction wrapper with better error handling and retry logic
export async function withTransaction<T>(
  operation: (tx: Parameters<typeof db.transaction>[0]) => Promise<T>,
  operationName: string = 'transaction',
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withQueryTiming(`${operationName}:attempt_${attempt}`, async () => {
        return await db.transaction(async (tx) => {
          return await operation(tx);
        });
      });
    } catch (error) {
      lastError = error as Error;
      
      // Log the error
      console.error(`Transaction attempt ${attempt} failed for ${operationName}:`, error);
      
      // Check if error is retryable (connection issues, deadlocks, etc.)
      const isRetryable = error instanceof Error && (
        error.message.includes('connection') ||
        error.message.includes('deadlock') ||
        error.message.includes('timeout')
      );
      
      if (!isRetryable || attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff delay
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Transaction failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

// Connection lifecycle management
export async function initializeDatabase(): Promise<void> {
  try {
    // Test the connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection established');
    
    // Log pool configuration
    console.log('📊 Connection pool config:', {
      max: poolConfig.max,
      min: poolConfig.min,
      idleTimeout: poolConfig.idleTimeoutMillis,
      connectionTimeout: poolConfig.connectionTimeoutMillis
    });
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

export async function closeDatabaseConnections(): Promise<void> {
  try {
    await pool.end();
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