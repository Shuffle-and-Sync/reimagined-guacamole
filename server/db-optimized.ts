import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";
import { logger } from './logger';

// Configure WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
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

// Optimized Drizzle configuration
export const db = drizzle({ 
  client: pool, 
  schema,
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery(query, params) {
      if (process.env.DB_LOG_QUERIES === 'true') {
        logger.debug('Database Query', { query, params });
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
    stats.count++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;
    this.queryStats.set(operation, stats);
  }

  public getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    this.queryStats.forEach((value, key) => {
      stats[key] = value;
    });
    return stats;
  }

  public getSlowQueries(threshold = 1000): Record<string, any> {
    const slowQueries: Record<string, any> = {};
    this.queryStats.forEach((value, key) => {
      if (value.avgTime > threshold) {
        slowQueries[key] = value;
      }
    });
    return slowQueries;
  }

  public reset(): void {
    this.queryStats.clear();
  }
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
    const start = Date.now();
    
    // Test query execution
    await db.execute(sql`SELECT 1 as health_check`);
    
    const queryTime = Date.now() - start;
    
    // Get pool statistics
    const poolStats = {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
    };

    return {
      status: 'healthy',
      poolStatus: poolStats,
      connectionCount: pool.totalCount,
      queryResponseTime: queryTime,
    };
  } catch (error) {
    logger.error('Database health check failed', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Query timing wrapper for performance monitoring
export function withQueryTiming<T>(operation: string, queryFunction: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const monitor = DatabaseMonitor.getInstance();
  
  return queryFunction()
    .then(result => {
      const duration = Date.now() - start;
      monitor.recordQuery(operation, duration);
      
      if (duration > 1000) { // Log slow queries (>1s)
        logger.warn('Slow database query detected', { 
          operation, 
          duration, 
          threshold: '1000ms' 
        });
      }
      
      return result;
    })
    .catch(error => {
      const duration = Date.now() - start;
      monitor.recordQuery(`${operation}_error`, duration);
      throw error;
    });
}

// Connection lifecycle management
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database connection pool', {
      maxConnections: poolConfig.max,
      minConnections: poolConfig.min,
      idleTimeout: poolConfig.idleTimeoutMillis,
    });

    // Test initial connection
    const health = await checkDatabaseHealth();
    if (health.status === 'unhealthy') {
      throw new Error(`Database initialization failed: ${health.error}`);
    }

    logger.info('Database connection pool initialized successfully', {
      poolStatus: health.poolStatus,
      queryResponseTime: health.queryResponseTime,
    });
  } catch (error) {
    logger.error('Failed to initialize database', error);
    throw error;
  }
}

export async function closeDatabaseConnections(): Promise<void> {
  try {
    logger.info('Closing database connections...');
    await pool.end();
    logger.info('Database connections closed successfully');
  } catch (error) {
    logger.error('Error closing database connections', error);
    throw error;
  }
}

// Export optimized database instance
export { db as database };