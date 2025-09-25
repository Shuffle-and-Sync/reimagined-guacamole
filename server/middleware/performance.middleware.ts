/**
 * Performance Monitoring Middleware
 * 
 * This module provides comprehensive performance monitoring and metrics collection,
 * following Copilot best practices for application observability and performance optimization.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { DatabaseMonitor } from '@shared/database-unified';

// Performance metrics interface
export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  slowRequestCount: number;
  errorCount: number;
  activeConnections: number;
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuUsage: NodeJS.CpuUsage;
  uptime: number;
}

// Request timing interface
export interface RequestTiming {
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

/**
 * Performance Monitor Class
 * Singleton pattern for centralized performance tracking
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private requestTimings: RequestTiming[] = [];
  private maxTimings = 1000; // Keep last 1000 requests
  private activeConnections = 0;
  private requestCount = 0;
  private errorCount = 0;
  private slowRequestThreshold = 1000; // 1 second
  private startTime = Date.now();

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record a request timing
   */
  public recordRequest(timing: RequestTiming): void {
    this.requestTimings.push(timing);
    this.requestCount++;

    // Track errors
    if (timing.statusCode >= 400) {
      this.errorCount++;
    }

    // Keep only recent timings
    if (this.requestTimings.length > this.maxTimings) {
      this.requestTimings = this.requestTimings.slice(-this.maxTimings);
    }

    // Log slow requests
    if (timing.responseTime > this.slowRequestThreshold) {
      logger.warn('Slow request detected', {
        url: timing.url,
        method: timing.method,
        responseTime: timing.responseTime,
        statusCode: timing.statusCode,
        requestId: timing.requestId
      });
    }
  }

  /**
   * Increment active connections
   */
  public incrementConnections(): void {
    this.activeConnections++;
  }

  /**
   * Decrement active connections
   */
  public decrementConnections(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    const recentTimings = this.requestTimings.slice(-100); // Last 100 requests
    const averageResponseTime = recentTimings.length > 0
      ? recentTimings.reduce((sum, timing) => sum + timing.responseTime, 0) / recentTimings.length
      : 0;

    const slowRequestCount = this.requestTimings.filter(
      timing => timing.responseTime > this.slowRequestThreshold
    ).length;

    return {
      requestCount: this.requestCount,
      averageResponseTime: Math.round(averageResponseTime),
      slowRequestCount,
      errorCount: this.errorCount,
      activeConnections: this.activeConnections,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Get recent request timings
   */
  public getRecentTimings(limit: number = 50): RequestTiming[] {
    return this.requestTimings.slice(-limit);
  }

  /**
   * Get slow requests
   */
  public getSlowRequests(threshold: number = this.slowRequestThreshold): RequestTiming[] {
    return this.requestTimings.filter(timing => timing.responseTime > threshold);
  }

  /**
   * Reset metrics (useful for testing)
   */
  public reset(): void {
    this.requestTimings = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.activeConnections = 0;
    this.startTime = Date.now();
  }

  /**
   * Set slow request threshold
   */
  public setSlowRequestThreshold(threshold: number): void {
    this.slowRequestThreshold = threshold;
  }
}

/**
 * Performance monitoring middleware
 * Tracks request timing and performance metrics
 */
export function performanceMonitoringMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const monitor = PerformanceMonitor.getInstance();
  
  // Track active connections
  monitor.incrementConnections();

  // Get request ID from headers or generate one
  const requestId = (req as any).requestId || res.getHeader('X-Request-ID') as string || 'unknown';

  // Override end method to capture timing
  const originalEnd = res.end;
  res.end = function(this: Response, ...args: any[]): Response {
    const responseTime = Date.now() - startTime;
    
    // Record the request timing
    monitor.recordRequest({
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id
    });

    // Decrement active connections
    monitor.decrementConnections();

    // Add performance headers
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Call original end method
    return originalEnd.apply(this, args);
  };

  next();
}

/**
 * Memory monitoring middleware
 * Checks memory usage and warns if too high
 */
export function memoryMonitoringMiddleware(req: Request, res: Response, next: NextFunction): void {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
  const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;

  // Warn if memory usage is high
  if (memoryUsagePercent > 80) {
    logger.warn('High memory usage detected', {
      heapUsedMB: Math.round(heapUsedMB),
      heapTotalMB: Math.round(heapTotalMB),
      usagePercent: Math.round(memoryUsagePercent),
      url: req.url,
      method: req.method
    });
  }

  // Add memory usage to response headers in development
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-Memory-Usage', `${Math.round(heapUsedMB)}MB`);
  }

  next();
}

/**
 * Request size monitoring middleware
 * Tracks and logs large request payloads
 */
export function requestSizeMonitoringMiddleware(req: Request, res: Response, next: NextFunction): void {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const largeSizeThreshold = 1024 * 1024; // 1MB

  if (contentLength > largeSizeThreshold) {
    logger.info('Large request payload detected', {
      contentLength,
      url: req.url,
      method: req.method,
      contentType: req.headers['content-type']
    });

    // Add header to track large requests
    res.setHeader('X-Large-Payload', 'true');
  }

  next();
}

/**
 * Cache performance monitoring middleware
 * Tracks cache hit/miss rates for optimizing caching strategies
 */
export function cacheMonitoringMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Override json method to capture cache information
  const originalJson = res.json;
  res.json = function(this: Response, obj: any): Response {
    const responseTime = Date.now() - startTime;

    // Check if response came from cache (would need cache implementation)
    const fromCache = res.getHeader('X-Cache-Hit') === 'true';
    
    if (fromCache) {
      logger.debug('Cache hit', {
        url: req.url,
        method: req.method,
        responseTime
      });
    } else {
      logger.debug('Cache miss', {
        url: req.url,
        method: req.method,
        responseTime
      });
    }

    return originalJson.call(this, obj);
  };

  next();
}

/**
 * Database performance monitoring middleware
 * Integrates with database monitoring for query performance tracking
 */
export function databaseMonitoringMiddleware(req: Request, res: Response, next: NextFunction): void {
  const dbMonitor = DatabaseMonitor.getInstance();
  
  // Log database stats periodically
  const originalEnd = res.end;
  res.end = function(this: Response, ...args: any[]): Response {
    // Log database stats for slow requests or errors
    if (res.statusCode >= 400 || (Date.now() - (req as any).startTime > 1000)) {
      const dbStats = dbMonitor.getStats();
      if (Object.keys(dbStats).length > 0) {
        logger.info('Database performance stats', {
          url: req.url,
          method: req.method,
          statusCode: res.statusCode,
          dbStats
        });
      }
    }

    return originalEnd.apply(this, args);
  };

  next();
}

/**
 * Health check endpoint generator
 * Creates a comprehensive health check endpoint
 */
export function createHealthCheckEndpoint() {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const monitor = PerformanceMonitor.getInstance();
      const dbMonitor = DatabaseMonitor.getInstance();
      const metrics = monitor.getMetrics();
      const dbStats = dbMonitor.getStats();

      // Check various health indicators
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: metrics.uptime,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        performance: {
          requestCount: metrics.requestCount,
          averageResponseTime: metrics.averageResponseTime,
          slowRequestCount: metrics.slowRequestCount,
          errorRate: metrics.requestCount > 0 ? (metrics.errorCount / metrics.requestCount) * 100 : 0,
          activeConnections: metrics.activeConnections
        },
        system: {
          memoryUsage: {
            heapUsedMB: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(metrics.memoryUsage.heapTotal / 1024 / 1024),
            rssMB: Math.round(metrics.memoryUsage.rss / 1024 / 1024)
          },
          cpuUsage: metrics.cpuUsage
        },
        database: {
          connected: true, // Would need actual database connection check
          queryStats: dbStats
        }
      };

      // Determine overall health status
      const memoryUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
      const errorRate = metrics.requestCount > 0 ? (metrics.errorCount / metrics.requestCount) * 100 : 0;

      if (memoryUsagePercent > 90 || errorRate > 10 || metrics.averageResponseTime > 2000) {
        health.status = 'degraded';
        res.status(503);
      } else if (memoryUsagePercent > 70 || errorRate > 5 || metrics.averageResponseTime > 1000) {
        health.status = 'warning';
      }

      res.json(health);
    } catch (error) {
      logger.error('Health check failed', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  };
}

/**
 * Performance metrics endpoint generator
 * Creates an endpoint for detailed performance metrics
 */
export function createMetricsEndpoint() {
  return (req: Request, res: Response): void => {
    try {
      const monitor = PerformanceMonitor.getInstance();
      const dbMonitor = DatabaseMonitor.getInstance();
      
      const limit = parseInt(req.query.limit as string) || 50;
      const includeTimings = req.query.timings === 'true';

      const metrics = {
        summary: monitor.getMetrics(),
        database: dbMonitor.getStats(),
        ...(includeTimings && {
          recentRequests: monitor.getRecentTimings(limit),
          slowRequests: monitor.getSlowRequests()
        })
      };

      res.json(metrics);
    } catch (error) {
      logger.error('Failed to get metrics', error);
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  };
}

// Export performance monitoring utilities
export const performanceMonitoring = {
  middleware: performanceMonitoringMiddleware,
  memory: memoryMonitoringMiddleware,
  requestSize: requestSizeMonitoringMiddleware,
  cache: cacheMonitoringMiddleware,
  database: databaseMonitoringMiddleware,
  healthCheck: createHealthCheckEndpoint(),
  metrics: createMetricsEndpoint(),
  monitor: PerformanceMonitor.getInstance()
};