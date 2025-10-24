/**
 * Connection Leak Detection and Monitoring
 *
 * Provides advanced monitoring for database connections including:
 * - Connection lifecycle tracking
 * - Leak detection with stack traces
 * - Connection pool analytics
 * - Performance metrics
 */

import { logger } from "../logger";

interface ConnectionMetrics {
  id: string;
  timestamp: number;
  endpoint: string;
  userId?: string;
  stackTrace: string;
  duration?: number;
  released: boolean;
}

interface ConnectionAlert {
  id: string;
  message: string;
  timestamp: Date;
  severity: "warning" | "error" | "critical";
  metadata?: Record<string, unknown>;
}

interface ConnectionPoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  averageAcquireTime: number;
  averageReleaseTime: number;
  peakConnections: number;
  totalAcquired: number;
  totalReleased: number;
}

/**
 * Connection Leak Detector
 *
 * Tracks database connections to identify leaks and performance issues.
 * Uses stack traces to identify where connections were acquired.
 */
export class ConnectionLeakDetector {
  private static instance: ConnectionLeakDetector;
  private activeConnections = new Map<string, ConnectionMetrics>();
  private historicalConnections: ConnectionMetrics[] = [];
  private connectionAlerts: ConnectionAlert[] = [];
  private leakThresholdMs: number = 30000; // 30 seconds default
  private checkIntervalMs: number = 10000; // Check every 10 seconds
  private checkTimer?: NodeJS.Timeout;
  private poolMetrics: ConnectionPoolMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    averageAcquireTime: 0,
    averageReleaseTime: 0,
    peakConnections: 0,
    totalAcquired: 0,
    totalReleased: 0,
  };

  private constructor() {
    // Start periodic leak detection
    this.startLeakDetection();
  }

  public static getInstance(): ConnectionLeakDetector {
    if (!ConnectionLeakDetector.instance) {
      ConnectionLeakDetector.instance = new ConnectionLeakDetector();
    }
    return ConnectionLeakDetector.instance;
  }

  /**
   * Track a new connection acquisition
   */
  public trackConnection(id: string, endpoint: string, userId?: string): void {
    const stackTrace = this.captureStackTrace();
    const timestamp = Date.now();

    const metrics: ConnectionMetrics = {
      id,
      timestamp,
      endpoint,
      userId,
      stackTrace,
      released: false,
    };

    this.activeConnections.set(id, metrics);
    this.poolMetrics.totalAcquired++;
    this.poolMetrics.activeConnections = this.activeConnections.size;

    if (this.poolMetrics.activeConnections > this.poolMetrics.peakConnections) {
      this.poolMetrics.peakConnections = this.poolMetrics.activeConnections;
    }

    logger.debug("Connection acquired", {
      connectionId: id,
      endpoint,
      userId,
      activeCount: this.activeConnections.size,
    });
  }

  /**
   * Track connection release
   */
  public releaseConnection(id: string): void {
    const metrics = this.activeConnections.get(id);
    if (!metrics) {
      logger.warn("Attempted to release unknown connection", {
        connectionId: id,
      });
      return;
    }

    const duration = Date.now() - metrics.timestamp;
    metrics.duration = duration;
    metrics.released = true;

    // Move to historical tracking
    this.historicalConnections.push(metrics);
    this.activeConnections.delete(id);

    // Keep only last 1000 historical connections
    if (this.historicalConnections.length > 1000) {
      this.historicalConnections = this.historicalConnections.slice(-1000);
    }

    this.poolMetrics.totalReleased++;
    this.poolMetrics.activeConnections = this.activeConnections.size;

    // Update average release time
    const totalDurations = this.historicalConnections
      .filter((c) => c.duration !== undefined)
      .reduce((sum, c) => sum + (c.duration || 0), 0);
    this.poolMetrics.averageReleaseTime =
      totalDurations / this.poolMetrics.totalReleased;

    logger.debug("Connection released", {
      connectionId: id,
      duration,
      activeCount: this.activeConnections.size,
    });
  }

  /**
   * Capture stack trace for debugging
   */
  private captureStackTrace(): string {
    const stack = new Error().stack || "";
    // Remove the first few lines which are internal to this monitoring system
    const lines = stack.split("\n").slice(3);
    return lines.join("\n");
  }

  /**
   * Start periodic leak detection
   */
  private startLeakDetection(): void {
    if (this.checkTimer) {
      return; // Already started
    }

    this.checkTimer = setInterval(() => {
      this.checkForLeaks();
    }, this.checkIntervalMs);

    // Ensure timer doesn't prevent process from exiting
    this.checkTimer.unref();
  }

  /**
   * Stop periodic leak detection
   */
  public stopLeakDetection(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = undefined;
    }
  }

  /**
   * Check for connection leaks
   */
  private checkForLeaks(): void {
    const now = Date.now();
    const leakedConnections: ConnectionMetrics[] = [];

    // Convert Map.entries() to array for compatibility
    Array.from(this.activeConnections.entries()).forEach(([_id, metrics]) => {
      const age = now - metrics.timestamp;
      if (age > this.leakThresholdMs) {
        leakedConnections.push(metrics);
      }
    });

    if (leakedConnections.length > 0) {
      const alert: ConnectionAlert = {
        id: `leak-${Date.now()}`,
        message: `Detected ${leakedConnections.length} potential connection leak(s)`,
        timestamp: new Date(),
        severity: leakedConnections.length > 5 ? "critical" : "warning",
        metadata: {
          count: leakedConnections.length,
          connections: leakedConnections.map((c) => ({
            id: c.id,
            endpoint: c.endpoint,
            age: now - c.timestamp,
            userId: c.userId,
          })),
        },
      };

      this.connectionAlerts.push(alert);

      // Keep only recent alerts (last 100)
      if (this.connectionAlerts.length > 100) {
        this.connectionAlerts = this.connectionAlerts.slice(-100);
      }

      logger.warn("Connection leak detected", {
        alertId: alert.id,
        leakCount: leakedConnections.length,
        severity: alert.severity,
      });

      // Log individual leaked connections with stack traces
      leakedConnections.forEach((conn) => {
        logger.error("Leaked connection details", {
          connectionId: conn.id,
          endpoint: conn.endpoint,
          age: now - conn.timestamp,
          userId: conn.userId,
          stackTrace: conn.stackTrace,
        });
      });
    }
  }

  /**
   * Get current connection metrics
   */
  public getMetrics(): {
    activeConnections: number;
    historicalCount: number;
    leakAlerts: number;
    poolMetrics: ConnectionPoolMetrics;
  } {
    return {
      activeConnections: this.activeConnections.size,
      historicalCount: this.historicalConnections.length,
      leakAlerts: this.connectionAlerts.length,
      poolMetrics: { ...this.poolMetrics },
    };
  }

  /**
   * Get active connections details
   */
  public getActiveConnections(): Array<{
    id: string;
    endpoint: string;
    userId?: string;
    age: number;
    released: boolean;
  }> {
    const now = Date.now();
    return Array.from(this.activeConnections.values()).map((conn) => ({
      id: conn.id,
      endpoint: conn.endpoint,
      userId: conn.userId,
      age: now - conn.timestamp,
      released: conn.released,
    }));
  }

  /**
   * Get recent alerts
   */
  public getAlerts(limit: number = 10): ConnectionAlert[] {
    return this.connectionAlerts.slice(-limit);
  }

  /**
   * Get connection statistics
   */
  public getStatistics(): {
    totalAcquired: number;
    totalReleased: number;
    currentlyActive: number;
    peakConnections: number;
    averageConnectionDuration: number;
    leakCount: number;
  } {
    const avgDuration =
      this.historicalConnections.length > 0
        ? this.historicalConnections
            .filter((c) => c.duration !== undefined)
            .reduce((sum, c) => sum + (c.duration || 0), 0) /
          this.historicalConnections.filter((c) => c.duration !== undefined)
            .length
        : 0;

    return {
      totalAcquired: this.poolMetrics.totalAcquired,
      totalReleased: this.poolMetrics.totalReleased,
      currentlyActive: this.activeConnections.size,
      peakConnections: this.poolMetrics.peakConnections,
      averageConnectionDuration: Math.round(avgDuration),
      leakCount: this.connectionAlerts.length,
    };
  }

  /**
   * Configure leak detection threshold
   */
  public setLeakThreshold(milliseconds: number): void {
    this.leakThresholdMs = milliseconds;
    logger.info("Connection leak threshold updated", {
      thresholdMs: milliseconds,
    });
  }

  /**
   * Configure check interval
   */
  public setCheckInterval(milliseconds: number): void {
    this.checkIntervalMs = milliseconds;

    // Restart detection with new interval
    this.stopLeakDetection();
    this.startLeakDetection();

    logger.info("Connection leak check interval updated", {
      intervalMs: milliseconds,
    });
  }

  /**
   * Reset all metrics and alerts
   */
  public reset(): void {
    this.activeConnections.clear();
    this.historicalConnections = [];
    this.connectionAlerts = [];
    this.poolMetrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingRequests: 0,
      averageAcquireTime: 0,
      averageReleaseTime: 0,
      peakConnections: 0,
      totalAcquired: 0,
      totalReleased: 0,
    };
    logger.info("Connection monitor metrics reset");
  }

  /**
   * Force connection leak check (for testing/debugging)
   */
  public forceLeakCheck(): void {
    this.checkForLeaks();
  }
}

/**
 * Connection monitoring utilities
 */
export const connectionMonitor = {
  /**
   * Track a connection
   */
  track: (id: string, endpoint: string, userId?: string): void => {
    ConnectionLeakDetector.getInstance().trackConnection(id, endpoint, userId);
  },

  /**
   * Release a tracked connection
   */
  release: (id: string): void => {
    ConnectionLeakDetector.getInstance().releaseConnection(id);
  },

  /**
   * Get monitoring metrics
   */
  getMetrics: () => {
    return ConnectionLeakDetector.getInstance().getMetrics();
  },

  /**
   * Get active connections
   */
  getActiveConnections: () => {
    return ConnectionLeakDetector.getInstance().getActiveConnections();
  },

  /**
   * Get alerts
   */
  getAlerts: (limit?: number) => {
    return ConnectionLeakDetector.getInstance().getAlerts(limit);
  },

  /**
   * Get statistics
   */
  getStatistics: () => {
    return ConnectionLeakDetector.getInstance().getStatistics();
  },

  /**
   * Configure monitoring
   */
  configure: (options: {
    leakThresholdMs?: number;
    checkIntervalMs?: number;
  }) => {
    const detector = ConnectionLeakDetector.getInstance();
    if (options.leakThresholdMs) {
      detector.setLeakThreshold(options.leakThresholdMs);
    }
    if (options.checkIntervalMs) {
      detector.setCheckInterval(options.checkIntervalMs);
    }
  },

  /**
   * Reset monitoring
   */
  reset: () => {
    ConnectionLeakDetector.getInstance().reset();
  },
};
