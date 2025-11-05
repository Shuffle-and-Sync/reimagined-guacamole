/**
 * System Monitoring Service
 *
 * Provides comprehensive system monitoring capabilities including:
 * - System metrics collection (CPU, memory, disk usage)
 * - Service health checks (database, Redis, application, filesystem)
 * - Alert generation and management
 * - Automated cleanup and retention management
 *
 * This service is critical for production monitoring, alerting, and incident response.
 * It runs continuously in the background collecting metrics and evaluating alert conditions.
 *
 * @module MonitoringService
 */

import { EventEmitter } from "events";
import fs from "fs/promises";
import os from "os";
import { sql } from "drizzle-orm";
import { db } from "@shared/database-unified";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { redisClient } from "./redis-client.service";

/**
 * System metrics snapshot
 *
 * @interface SystemMetrics
 * @property {Date} timestamp - When metrics were collected
 * @property {Object} cpu - CPU usage information
 * @property {number} cpu.usage - CPU usage percentage (0-100)
 * @property {number[]} cpu.loadAverage - System load average [1min, 5min, 15min]
 * @property {number} cpu.cores - Number of CPU cores
 * @property {Object} memory - Memory usage information
 * @property {number} memory.used - Used memory in bytes
 * @property {number} memory.free - Free memory in bytes
 * @property {number} memory.total - Total memory in bytes
 * @property {number} memory.usage - Memory usage percentage (0-100)
 * @property {Object} disk - Disk usage information
 * @property {Object} process - Node.js process metrics
 */
export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
    usage: number;
  };
  disk: {
    used: number;
    free: number;
    total: number;
    usage: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

/**
 * Health check result for a service
 *
 * @interface ServiceHealth
 * @property {string} service - Name of the service being monitored
 * @property {"healthy" | "degraded" | "unhealthy"} status - Current health status
 * @property {number} [latency] - Response time in milliseconds
 * @property {Date} lastChecked - When the health check was performed
 * @property {string} [error] - Error message if unhealthy
 * @property {Record<string, unknown>} [details] - Additional service-specific details
 */
export interface ServiceHealth {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  lastChecked: Date;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Alert information
 *
 * @interface Alert
 * @property {string} id - Unique alert identifier
 * @property {"critical" | "warning" | "info"} severity - Alert severity level
 * @property {string} service - Service that generated the alert
 * @property {string} message - Human-readable alert message
 * @property {Date} timestamp - When the alert was created
 * @property {boolean} resolved - Whether the alert has been resolved
 * @property {Date} [resolvedAt] - When the alert was resolved
 * @property {Record<string, unknown>} [metadata] - Additional alert context
 */
export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  service: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Monitoring service configuration
 *
 * Defines intervals, thresholds, retention policies, and alerting settings
 * for the monitoring service. All values can be configured via environment variables.
 *
 * @interface MonitoringConfig
 */
export interface MonitoringConfig {
  enabled: boolean;
  intervals: {
    metrics: number; // System metrics collection interval (ms)
    healthCheck: number; // Health check interval (ms)
    alertCheck: number; // Alert evaluation interval (ms)
  };
  thresholds: {
    cpu: { warning: number; critical: number };
    memory: { warning: number; critical: number };
    disk: { warning: number; critical: number };
    responseTime: { warning: number; critical: number };
    errorRate: { warning: number; critical: number };
  };
  retention: {
    metrics: number; // Days to retain metrics
    alerts: number; // Days to retain alerts
  };
  alerting: {
    enabled: boolean;
    channels: string[]; // Alert delivery channels
    rateLimiting: {
      maxAlertsPerHour: number;
      cooldownMinutes: number;
    };
  };
}

/**
 * System Monitoring Service
 *
 * Extends EventEmitter to provide real-time monitoring events:
 * - 'metrics': Emitted when new metrics are collected
 * - 'healthUpdate': Emitted when service health status changes
 * - 'alert': Emitted when a new alert is created
 * - 'alertResolved': Emitted when an alert is resolved
 *
 * The service runs continuously collecting metrics, performing health checks,
 * and evaluating alert conditions based on configurable thresholds.
 *
 * @class MonitoringService
 * @extends EventEmitter
 */
class MonitoringService extends EventEmitter {
  private config: MonitoringConfig;
  private metrics: SystemMetrics[] = [];
  private healthStatus: Map<string, ServiceHealth> = new Map();
  private alerts: Alert[] = [];
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;
  private lastCpuUsage?: NodeJS.CpuUsage;

  /**
   * Initialize the monitoring service
   *
   * Loads configuration from environment variables with sensible defaults.
   * Initializes CPU usage tracking for accurate measurements.
   */
  constructor() {
    super();
    this.config = {
      enabled: process.env.MONITORING_ENABLED !== "false",
      intervals: {
        metrics: parseInt(process.env.MONITORING_METRICS_INTERVAL || "60000"), // 1 minute
        healthCheck: parseInt(
          process.env.MONITORING_HEALTH_INTERVAL || "30000",
        ), // 30 seconds
        alertCheck: parseInt(process.env.MONITORING_ALERT_INTERVAL || "10000"), // 10 seconds
      },
      thresholds: {
        cpu: {
          warning: parseInt(process.env.MONITORING_CPU_WARNING || "70"),
          critical: parseInt(process.env.MONITORING_CPU_CRITICAL || "90"),
        },
        memory: {
          warning: parseInt(process.env.MONITORING_MEMORY_WARNING || "80"),
          critical: parseInt(process.env.MONITORING_MEMORY_CRITICAL || "95"),
        },
        disk: {
          warning: parseInt(process.env.MONITORING_DISK_WARNING || "85"),
          critical: parseInt(process.env.MONITORING_DISK_CRITICAL || "95"),
        },
        responseTime: {
          warning: parseInt(process.env.MONITORING_RESPONSE_WARNING || "1000"),
          critical: parseInt(
            process.env.MONITORING_RESPONSE_CRITICAL || "5000",
          ),
        },
        errorRate: {
          warning: parseInt(process.env.MONITORING_ERROR_WARNING || "5"),
          critical: parseInt(process.env.MONITORING_ERROR_CRITICAL || "10"),
        },
      },
      retention: {
        metrics: parseInt(process.env.MONITORING_METRICS_RETENTION || "7"), // 7 days
        alerts: parseInt(process.env.MONITORING_ALERTS_RETENTION || "30"), // 30 days
      },
      alerting: {
        enabled: process.env.MONITORING_ALERTING_ENABLED !== "false",
        channels: (process.env.MONITORING_ALERT_CHANNELS || "")
          .split(",")
          .filter(Boolean),
        rateLimiting: {
          maxAlertsPerHour: parseInt(
            process.env.MONITORING_MAX_ALERTS_PER_HOUR || "20",
          ),
          cooldownMinutes: parseInt(
            process.env.MONITORING_ALERT_COOLDOWN || "15",
          ),
        },
      },
    };

    // Initialize CPU usage tracking
    this.lastCpuUsage = process.cpuUsage();
  }

  /**
   * Start monitoring services
   *
   * Initiates all monitoring intervals (metrics collection, health checks, alert evaluation)
   * and performs initial checks. This method is idempotent - calling it multiple times
   * or when already running has no effect.
   *
   * @returns {void}
   * @example
   * monitoringService.start();
   * // Service will now continuously monitor system metrics and health
   */
  start(): void {
    if (this.isRunning || !this.config.enabled) {
      return;
    }

    this.isRunning = true;
    logger.info("Monitoring service starting", { config: this.config });

    // Start metrics collection
    const metricsInterval = setInterval(() => {
      this.collectSystemMetrics().catch((error) => {
        logger.error(
          "Failed to collect system metrics",
          toLoggableError(error),
        );
      });
    }, this.config.intervals.metrics);
    this.intervals.set("metrics", metricsInterval);

    // Start health checks
    const healthInterval = setInterval(() => {
      this.performHealthChecks().catch((error) => {
        logger.error("Failed to perform health checks", toLoggableError(error));
      });
    }, this.config.intervals.healthCheck);
    this.intervals.set("health", healthInterval);

    // Start alert evaluation
    const alertInterval = setInterval(() => {
      this.evaluateAlerts().catch((error) => {
        logger.error("Failed to evaluate alerts", toLoggableError(error));
      });
    }, this.config.intervals.alertCheck);
    this.intervals.set("alerts", alertInterval);

    // Start cleanup
    const cleanupInterval = setInterval(
      () => {
        this.cleanup().catch((error) => {
          logger.error("Failed to cleanup old data", toLoggableError(error));
        });
      },
      24 * 60 * 60 * 1000,
    ); // Daily cleanup
    this.intervals.set("cleanup", cleanupInterval);

    // Perform initial checks
    this.collectSystemMetrics().catch((error) => {
      logger.error("Initial metrics collection failed", toLoggableError(error));
    });
    this.performHealthChecks().catch((error) => {
      logger.error("Initial health check failed", toLoggableError(error));
    });

    logger.info("Monitoring service started successfully");
  }

  /**
   * Stop monitoring services
   *
   * Stops all monitoring intervals and cleans up resources. Safe to call
   * even if service is not running.
   *
   * @returns {void}
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info("Monitoring service stopping");

    // Clear all intervals
    Array.from(this.intervals.entries()).forEach(([name, interval]) => {
      clearInterval(interval);
      logger.debug("Stopped monitoring interval", { interval: name });
    });
    this.intervals.clear();

    logger.info("Monitoring service stopped");
  }

  /**
   * Collect system metrics
   *
   * Gathers comprehensive system metrics including CPU usage, memory usage,
   * disk usage, and process information. Emits 'metrics' event with the collected data.
   *
   * @returns {Promise<SystemMetrics>} Collected system metrics
   * @throws {Error} If metrics collection fails
   * @example
   * const metrics = await monitoringService.collectSystemMetrics();
   * console.log(`CPU usage: ${metrics.cpu.usage}%`);
   * console.log(`Memory usage: ${metrics.memory.usage}%`);
   */
  async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      const timestamp = new Date();

      // CPU metrics
      const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
      this.lastCpuUsage = process.cpuUsage();
      const cpuPercent =
        ((currentCpuUsage.user + currentCpuUsage.system) / 1000000) * 100;
      const loadAverage = os.loadavg();

      // Memory metrics
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      // Process memory
      const processMemory = process.memoryUsage();

      // Disk metrics (basic implementation)
      let diskUsage = { used: 0, free: 0, total: 0, usage: 0 };
      try {
        const cwd = process.cwd();
        if (cwd) {
          const stats = await fs.statfs(cwd);
          diskUsage = {
            used: (stats.blocks - stats.bavail) * stats.bsize,
            free: stats.bavail * stats.bsize,
            total: stats.blocks * stats.bsize,
            usage: ((stats.blocks - stats.bavail) / stats.blocks) * 100,
          };
        }
      } catch (error) {
        // If statfs is not available or cwd is undefined, use reasonable defaults
        logger.debug(
          "Disk usage calculation failed, using defaults",
          error as Record<string, unknown>,
        );
      }

      const metrics: SystemMetrics = {
        timestamp,
        cpu: {
          usage: Math.min(cpuPercent, 100),
          loadAverage,
          cores: os.cpus().length,
        },
        memory: {
          used: usedMemory,
          free: freeMemory,
          total: totalMemory,
          usage: (usedMemory / totalMemory) * 100,
        },
        disk: diskUsage,
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          memoryUsage: processMemory,
          cpuUsage: currentCpuUsage,
        },
      };

      // Store metrics
      this.metrics.push(metrics);

      // Emit metrics event
      this.emit("metrics", metrics);

      logger.debug("System metrics collected", {
        cpu: metrics.cpu.usage,
        memory: metrics.memory.usage,
        disk: metrics.disk.usage,
      });

      return metrics;
    } catch (error) {
      logger.error("Failed to collect system metrics", toLoggableError(error));
      throw error;
    }
  }

  /**
   * Perform health checks on all services
   *
   * Runs health checks on database, Redis, application, and filesystem.
   * Updates the health status map and emits 'healthUpdate' event.
   *
   * @returns {Promise<Map<string, ServiceHealth>>} Map of service health statuses
   * @example
   * const health = await monitoringService.performHealthChecks();
   * health.forEach((status, service) => {
   *   console.log(`${service}: ${status.status}`);
   * });
   */
  async performHealthChecks(): Promise<Map<string, ServiceHealth>> {
    const checks = [
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkApplicationHealth(),
      this.checkFileSystemHealth(),
    ];

    const results = await Promise.allSettled(checks);

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        this.healthStatus.set(result.value.service, result.value);
      } else {
        const serviceNames = ["database", "redis", "application", "filesystem"];
        const serviceName = serviceNames[index] || "unknown";
        this.healthStatus.set(serviceName, {
          service: serviceName,
          status: "unhealthy",
          lastChecked: new Date(),
          error: result.reason?.message || "Health check failed",
        });
      }
    });

    // Emit health status update
    this.emit("healthUpdate", this.healthStatus);

    return this.healthStatus;
  }

  /**
   * Check database connectivity and performance
   *
   * Performs a simple query to verify database connectivity and measures response time.
   * Returns 'healthy' if latency < 1000ms, 'degraded' if slower, 'unhealthy' on failure.
   *
   * @private
   * @returns {Promise<ServiceHealth>} Database health status
   */
  private async checkDatabaseHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      // Simple connectivity test
      await db.run(sql`SELECT 1 as health_check`);

      const latency = Date.now() - startTime;

      return {
        service: "database",
        status: latency < 1000 ? "healthy" : "degraded",
        latency,
        lastChecked: new Date(),
        details: {
          connectionPool: "active",
          queryTime: `${latency}ms`,
        },
      };
    } catch (error) {
      return {
        service: "database",
        status: "unhealthy",
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        error:
          error instanceof Error ? error.message : "Database connection failed",
      };
    }
  }

  /**
   * Check Redis connectivity and performance
   */
  private async checkRedisHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      await redisClient.ping();

      const latency = Date.now() - startTime;

      return {
        service: "redis",
        status: latency < 500 ? "healthy" : "degraded",
        latency,
        lastChecked: new Date(),
        details: {
          connected: true,
          responseTime: `${latency}ms`,
        },
      };
    } catch (error) {
      return {
        service: "redis",
        status: "degraded", // Redis failure is not critical due to graceful degradation
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        error:
          error instanceof Error ? error.message : "Redis connection failed",
        details: {
          gracefulDegradation: true,
        },
      };
    }
  }

  /**
   * Check application health
   */
  private async checkApplicationHealth(): Promise<ServiceHealth> {
    try {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      return {
        service: "application",
        status: "healthy",
        lastChecked: new Date(),
        details: {
          uptime: `${Math.floor(uptime / 60)} minutes`,
          memoryUsage: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          nodeVersion: process.version,
          pid: process.pid,
        },
      };
    } catch (error) {
      return {
        service: "application",
        status: "unhealthy",
        lastChecked: new Date(),
        error:
          error instanceof Error
            ? error.message
            : "Application health check failed",
      };
    }
  }

  /**
   * Check filesystem health
   */
  private async checkFileSystemHealth(): Promise<ServiceHealth> {
    try {
      const testFile = "/tmp/health_check_test";

      // Test write/read/delete
      await fs.writeFile(testFile, "health_check");
      const content = await fs.readFile(testFile, "utf-8");
      await fs.unlink(testFile);

      if (content !== "health_check") {
        throw new Error("File content mismatch");
      }

      return {
        service: "filesystem",
        status: "healthy",
        lastChecked: new Date(),
        details: {
          readWrite: "operational",
          tempDirectory: "/tmp",
        },
      };
    } catch (error) {
      return {
        service: "filesystem",
        status: "unhealthy",
        lastChecked: new Date(),
        error:
          error instanceof Error
            ? error.message
            : "Filesystem health check failed",
      };
    }
  }

  /**
   * Evaluate alerts based on current metrics and health status
   */
  private async evaluateAlerts(): Promise<void> {
    if (!this.config.alerting.enabled) {
      return;
    }

    const currentMetrics = this.metrics[this.metrics.length - 1];
    if (!currentMetrics) {
      return;
    }

    // Check system thresholds
    await this.checkCpuAlerts(currentMetrics);
    await this.checkMemoryAlerts(currentMetrics);
    await this.checkDiskAlerts(currentMetrics);
    await this.checkServiceAlerts();

    // Clean up resolved alerts
    this.cleanupResolvedAlerts();
  }

  /**
   * Check CPU usage alerts
   */
  private async checkCpuAlerts(metrics: SystemMetrics): Promise<void> {
    const usage = metrics.cpu.usage;
    const { warning, critical } = this.config.thresholds.cpu;

    if (usage >= critical) {
      await this.createAlert({
        severity: "critical",
        service: "system",
        message: `Critical CPU usage: ${usage.toFixed(1)}%`,
        metadata: { usage, threshold: critical, metric: "cpu" },
      });
    } else if (usage >= warning) {
      await this.createAlert({
        severity: "warning",
        service: "system",
        message: `High CPU usage: ${usage.toFixed(1)}%`,
        metadata: { usage, threshold: warning, metric: "cpu" },
      });
    } else {
      // Resolve any existing CPU alerts
      this.resolveAlerts("system", "cpu");
    }
  }

  /**
   * Check memory usage alerts
   */
  private async checkMemoryAlerts(metrics: SystemMetrics): Promise<void> {
    const usage = metrics.memory.usage;
    const { warning, critical } = this.config.thresholds.memory;

    if (usage >= critical) {
      await this.createAlert({
        severity: "critical",
        service: "system",
        message: `Critical memory usage: ${usage.toFixed(1)}%`,
        metadata: { usage, threshold: critical, metric: "memory" },
      });
    } else if (usage >= warning) {
      await this.createAlert({
        severity: "warning",
        service: "system",
        message: `High memory usage: ${usage.toFixed(1)}%`,
        metadata: { usage, threshold: warning, metric: "memory" },
      });
    } else {
      this.resolveAlerts("system", "memory");
    }
  }

  /**
   * Check disk usage alerts
   */
  private async checkDiskAlerts(metrics: SystemMetrics): Promise<void> {
    const usage = metrics.disk.usage;
    const { warning, critical } = this.config.thresholds.disk;

    if (usage >= critical) {
      await this.createAlert({
        severity: "critical",
        service: "system",
        message: `Critical disk usage: ${usage.toFixed(1)}%`,
        metadata: { usage, threshold: critical, metric: "disk" },
      });
    } else if (usage >= warning) {
      await this.createAlert({
        severity: "warning",
        service: "system",
        message: `High disk usage: ${usage.toFixed(1)}%`,
        metadata: { usage, threshold: warning, metric: "disk" },
      });
    } else {
      this.resolveAlerts("system", "disk");
    }
  }

  /**
   * Check service health alerts
   */
  private async checkServiceAlerts(): Promise<void> {
    Array.from(this.healthStatus.entries()).forEach(
      async ([serviceName, health]) => {
        if (health.status === "unhealthy") {
          await this.createAlert({
            severity: "critical",
            service: serviceName,
            message: `Service ${serviceName} is unhealthy: ${health.error || "Unknown error"}`,
            metadata: { health, metric: "service_health" },
          });
        } else if (health.status === "degraded") {
          await this.createAlert({
            severity: "warning",
            service: serviceName,
            message: `Service ${serviceName} is degraded`,
            metadata: { health, metric: "service_health" },
          });
        } else {
          this.resolveAlerts(serviceName, "service_health");
        }
      },
    );
  }

  /**
   * Create a new alert
   */
  private async createAlert(
    alertData: Omit<Alert, "id" | "timestamp" | "resolved">,
  ): Promise<Alert> {
    // Check if similar alert already exists and is not resolved
    const existingAlert = this.alerts.find(
      (alert) =>
        alert.service === alertData.service &&
        alert.metadata?.metric === alertData.metadata?.metric &&
        !alert.resolved,
    );

    if (existingAlert) {
      // Update existing alert timestamp
      existingAlert.timestamp = new Date();
      return existingAlert;
    }

    // Rate limiting check
    if (!this.canCreateAlert(alertData.service, alertData.severity)) {
      logger.warn("Alert rate limited", {
        service: alertData.service,
        severity: alertData.severity,
      });
      // If rate limited and no existing alert, create a placeholder
      if (!existingAlert) {
        throw new Error(`Alert rate limited for ${alertData.service}`);
      }
      return existingAlert;
    }

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    };

    this.alerts.push(alert);

    // Emit alert event
    this.emit("alert", alert);

    // Send notification
    await this.sendAlertNotification(alert);

    logger.warn("Alert created", {
      id: alert.id,
      severity: alert.severity,
      service: alert.service,
      message: alert.message,
    });

    return alert;
  }

  /**
   * Resolve alerts for a specific service and metric
   */
  private resolveAlerts(service: string, metric: string): void {
    const alertsToResolve = this.alerts.filter(
      (alert) =>
        alert.service === service &&
        alert.metadata?.metric === metric &&
        !alert.resolved,
    );

    for (const alert of alertsToResolve) {
      alert.resolved = true;
      alert.resolvedAt = new Date();

      this.emit("alertResolved", alert);

      logger.info("Alert resolved", {
        id: alert.id,
        service: alert.service,
        duration: alert.resolvedAt.getTime() - alert.timestamp.getTime(),
      });
    }
  }

  /**
   * Check if alert can be created based on rate limiting
   */
  private canCreateAlert(service: string, _severity: string): boolean {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAlerts = this.alerts.filter(
      (alert) => alert.service === service && alert.timestamp > hourAgo,
    );

    return (
      recentAlerts.length < this.config.alerting.rateLimiting.maxAlertsPerHour
    );
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      // Log alert (basic notification)
      logger.warn("ALERT NOTIFICATION", {
        id: alert.id,
        severity: alert.severity,
        service: alert.service,
        message: alert.message,
        timestamp: alert.timestamp,
      });

      // In production, implement actual notification channels:
      // - Email notifications
      // - Slack/Discord webhooks
      // - SMS alerts
      // - PagerDuty integration
    } catch (error) {
      logger.error(
        "Failed to send alert notification",
        toLoggableError(error),
        {
          alertId: alert.id,
        },
      );
    }
  }

  /**
   * Clean up old metrics and alerts
   */
  private async cleanup(): Promise<void> {
    const now = new Date();

    // Clean up old metrics
    const metricsRetentionMs =
      this.config.retention.metrics * 24 * 60 * 60 * 1000;
    const metricsOldestDate = new Date(now.getTime() - metricsRetentionMs);
    this.metrics = this.metrics.filter(
      (metric) => metric.timestamp > metricsOldestDate,
    );

    // Clean up old alerts
    const alertsRetentionMs =
      this.config.retention.alerts * 24 * 60 * 60 * 1000;
    const alertsOldestDate = new Date(now.getTime() - alertsRetentionMs);
    this.alerts = this.alerts.filter(
      (alert) => alert.timestamp > alertsOldestDate,
    );

    logger.debug("Monitoring cleanup completed", {
      metricsRetained: this.metrics.length,
      alertsRetained: this.alerts.length,
    });
  }

  /**
   * Clean up resolved alerts older than cooldown period
   */
  private cleanupResolvedAlerts(): void {
    const cooldownMs =
      this.config.alerting.rateLimiting.cooldownMinutes * 60 * 1000;
    const cutoffTime = new Date(Date.now() - cooldownMs);

    this.alerts = this.alerts.filter((alert) => {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < cutoffTime) {
        return false; // Remove old resolved alerts
      }
      return true;
    });
  }

  /**
   * Get current monitoring status
   */
  getStatus(): {
    isRunning: boolean;
    config: MonitoringConfig;
    metrics: {
      latest: SystemMetrics | null;
      count: number;
    };
    health: Record<string, ServiceHealth>;
    alerts: {
      active: Alert[];
      total: number;
    };
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      metrics: {
        latest: this.metrics[this.metrics.length - 1] || null,
        count: this.metrics.length,
      },
      health: Object.fromEntries(this.healthStatus),
      alerts: {
        active: this.alerts.filter((alert) => !alert.resolved),
        total: this.alerts.length,
      },
    };
  }

  /**
   * Get metrics for a time range
   */
  getMetrics(since?: Date, limit = 100): SystemMetrics[] {
    let filteredMetrics = this.metrics;

    if (since) {
      filteredMetrics = filteredMetrics.filter(
        (metric) => metric.timestamp >= since,
      );
    }

    return filteredMetrics.slice(-limit);
  }

  /**
   * Get alerts with optional filtering
   */
  getAlerts(filters?: {
    service?: string;
    severity?: string;
    resolved?: boolean;
    since?: Date;
  }): Alert[] {
    let filteredAlerts = this.alerts;

    if (filters?.service) {
      filteredAlerts = filteredAlerts.filter(
        (alert) => alert.service === filters.service,
      );
    }

    if (filters?.severity) {
      filteredAlerts = filteredAlerts.filter(
        (alert) => alert.severity === filters.severity,
      );
    }

    if (filters?.resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(
        (alert) => alert.resolved === filters.resolved,
      );
    }

    if (filters?.since) {
      const sinceDate = filters.since;
      filteredAlerts = filteredAlerts.filter(
        (alert) => alert.timestamp >= sinceDate,
      );
    }

    return filteredAlerts.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }
}

export const monitoringService = new MonitoringService();
export { MonitoringService };
