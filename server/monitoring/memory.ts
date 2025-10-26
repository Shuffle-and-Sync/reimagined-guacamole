/**
 * Memory Monitoring Module
 *
 * Tracks Node.js process memory usage and alerts on high memory conditions.
 * Integrated with the main monitoring service for centralized alerting.
 */

import { logger } from "../logger";

export interface MemoryUsageMetrics {
  timestamp: Date;
  heapUsed: number;
  heapTotal: number;
  heapUsedMB: number;
  heapTotalMB: number;
  external: number;
  externalMB: number;
  arrayBuffers: number;
  arrayBuffersMB: number;
  rss: number;
  rssMB: number;
  heapUsagePercent: number;
}

export interface MemoryMonitorConfig {
  enabled: boolean;
  intervalMs: number;
  warningThreshold: number; // Percentage (default 80%)
  criticalThreshold: number; // Percentage (default 95%)
  logInterval: number; // Log every N checks (default 1 = every check)
}

export type MemoryAlertHandler = (
  level: "warning" | "critical",
  metrics: MemoryUsageMetrics,
) => void;

class MemoryMonitor {
  private config: MemoryMonitorConfig;
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastAlertLevel: "warning" | "critical" | null = null;
  private alertHandlers: MemoryAlertHandler[] = [];
  private checkCount = 0;

  constructor(config?: Partial<MemoryMonitorConfig>) {
    this.config = {
      enabled: config?.enabled !== false,
      intervalMs: config?.intervalMs || 60000, // 1 minute default
      warningThreshold: config?.warningThreshold || 80,
      criticalThreshold: config?.criticalThreshold || 95,
      logInterval: config?.logInterval || 1,
    };
  }

  /**
   * Start memory monitoring
   */
  start(): void {
    if (this.isRunning || !this.config.enabled) {
      logger.debug("Memory monitoring already running or disabled");
      return;
    }

    this.isRunning = true;
    logger.info("Memory monitoring started", {
      config: this.config,
    });

    // Perform initial check
    this.checkMemory();

    // Set up periodic checks
    this.interval = setInterval(() => {
      this.checkMemory();
    }, this.config.intervalMs);
  }

  /**
   * Stop memory monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;
    logger.info("Memory monitoring stopped");
  }

  /**
   * Register an alert handler
   */
  onAlert(handler: MemoryAlertHandler): void {
    this.alertHandlers.push(handler);
  }

  /**
   * Get current memory usage metrics
   */
  getMetrics(): MemoryUsageMetrics {
    const usage = process.memoryUsage();
    const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;

    return {
      timestamp: new Date(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
      external: usage.external,
      externalMB: Math.round(usage.external / 1024 / 1024),
      arrayBuffers: usage.arrayBuffers,
      arrayBuffersMB: Math.round(usage.arrayBuffers / 1024 / 1024),
      rss: usage.rss,
      rssMB: Math.round(usage.rss / 1024 / 1024),
      heapUsagePercent,
    };
  }

  /**
   * Check memory usage and trigger alerts if needed
   */
  private checkMemory(): void {
    this.checkCount++;
    const metrics = this.getMetrics();

    // Log metrics periodically
    if (this.checkCount % this.config.logInterval === 0) {
      logger.info("Memory usage", {
        heapUsed: `${metrics.heapUsedMB}MB`,
        heapTotal: `${metrics.heapTotalMB}MB`,
        heapUsagePercent: `${metrics.heapUsagePercent.toFixed(1)}%`,
        external: `${metrics.externalMB}MB`,
        rss: `${metrics.rssMB}MB`,
      });
    }

    // Check alert thresholds
    const currentLevel = this.determineAlertLevel(metrics.heapUsagePercent);

    // Only alert if level changed or on critical
    if (currentLevel && currentLevel !== this.lastAlertLevel) {
      this.triggerAlert(currentLevel, metrics);
      this.lastAlertLevel = currentLevel;
    } else if (currentLevel === "critical") {
      // Always log critical alerts
      this.triggerAlert(currentLevel, metrics);
    } else if (!currentLevel && this.lastAlertLevel) {
      // Memory usage returned to normal
      logger.info("Memory usage returned to normal", {
        heapUsagePercent: `${metrics.heapUsagePercent.toFixed(1)}%`,
      });
      this.lastAlertLevel = null;
    }
  }

  /**
   * Determine alert level based on usage percentage
   */
  private determineAlertLevel(
    usagePercent: number,
  ): "warning" | "critical" | null {
    if (usagePercent >= this.config.criticalThreshold) {
      return "critical";
    } else if (usagePercent >= this.config.warningThreshold) {
      return "warning";
    }
    return null;
  }

  /**
   * Trigger alert to all registered handlers
   */
  private triggerAlert(
    level: "warning" | "critical",
    metrics: MemoryUsageMetrics,
  ): void {
    const message =
      level === "critical"
        ? `Critical memory usage detected: ${metrics.heapUsagePercent.toFixed(1)}% (${metrics.heapUsedMB}MB / ${metrics.heapTotalMB}MB)`
        : `High memory usage detected: ${metrics.heapUsagePercent.toFixed(1)}% (${metrics.heapUsedMB}MB / ${metrics.heapTotalMB}MB)`;

    if (level === "critical") {
      logger.error(message, {
        metrics,
        threshold: this.config.criticalThreshold,
      });
    } else {
      logger.warn(message, {
        metrics,
        threshold: this.config.warningThreshold,
      });
    }

    // Notify all registered handlers
    this.alertHandlers.forEach((handler) => {
      try {
        handler(level, metrics);
      } catch (error) {
        logger.error(
          "Error in memory alert handler",
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    });
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isRunning: boolean;
    config: MemoryMonitorConfig;
    currentMetrics: MemoryUsageMetrics;
    lastAlertLevel: "warning" | "critical" | null;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      currentMetrics: this.getMetrics(),
      lastAlertLevel: this.lastAlertLevel,
    };
  }
}

// Export singleton instance
export const memoryMonitor = new MemoryMonitor({
  enabled: process.env.MEMORY_MONITORING_ENABLED !== "false",
  intervalMs: parseInt(process.env.MEMORY_MONITORING_INTERVAL || "60000"),
  warningThreshold: parseInt(process.env.MEMORY_WARNING_THRESHOLD || "80"),
  criticalThreshold: parseInt(process.env.MEMORY_CRITICAL_THRESHOLD || "95"),
  logInterval: parseInt(process.env.MEMORY_LOG_INTERVAL || "1"),
});

export { MemoryMonitor };
