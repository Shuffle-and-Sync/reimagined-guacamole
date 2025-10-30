/**
 * Adaptive Rate Limiter
 *
 * Implements adaptive rate limiting that responds to server load and message priority.
 * This module provides dynamic rate limit adjustment based on real-time server metrics,
 * ensuring the system remains responsive under varying load conditions.
 *
 * Key Features:
 * - Server load-based rate limit adjustment
 * - Message priority queuing (low, normal, high)
 * - Differentiated limits for different user types
 * - Burst allowances for temporary traffic spikes
 * - Integration with PerformanceMonitor for load metrics
 *
 * @module AdaptiveRateLimiter
 */

import { logger } from "../logger";
import { PerformanceMonitor } from "../middleware/performance.middleware";

/**
 * Message priority levels
 * - high: Critical messages that should always go through
 * - normal: Standard messages with regular priority
 * - low: Non-urgent messages that can be deferred under load
 */
export type MessagePriority = "low" | "normal" | "high";

/**
 * User type for differentiated rate limits
 */
export type UserType = "anonymous" | "authenticated" | "premium";

/**
 * Configuration for adaptive rate limiter
 */
export interface AdaptiveRateLimiterConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window (base rate)
  burstAllowance?: number; // Additional requests allowed in burst (default: 20% of maxRequests)
  loadThresholds?: {
    high: number; // Load factor above which limits are reduced to 50% (default: 0.8)
    medium: number; // Load factor above which limits are reduced to 75% (default: 0.6)
    blockLowPriority: number; // Load factor above which low-priority messages are blocked (default: 0.7)
  };
  userTypeLimits?: {
    anonymous: number; // Multiplier for anonymous users (default: 0.5)
    authenticated: number; // Multiplier for authenticated users (default: 1.0)
    premium: number; // Multiplier for premium users (default: 2.0)
  };
}

/**
 * Rate limit entry for tracking
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
  burstUsed: number;
}

/**
 * Server load metrics
 */
export interface ServerLoadMetrics {
  loadFactor: number; // Normalized load factor (0.0 to 1.0)
  memoryUsagePercent: number;
  activeConnections: number;
  averageResponseTime: number;
}

/**
 * Adaptive Rate Limiter Class
 *
 * Dynamically adjusts rate limits based on server load and message priority.
 * Integrates with PerformanceMonitor to get real-time server metrics.
 */
export class AdaptiveRateLimiter {
  private config: Required<AdaptiveRateLimiterConfig>;
  private entries = new Map<string, RateLimitEntry>();
  private performanceMonitor: PerformanceMonitor;

  constructor(config: AdaptiveRateLimiterConfig) {
    // Set defaults for optional config values
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      burstAllowance:
        config.burstAllowance ?? Math.floor(config.maxRequests * 0.2),
      loadThresholds: {
        high: config.loadThresholds?.high ?? 0.8,
        medium: config.loadThresholds?.medium ?? 0.6,
        blockLowPriority: config.loadThresholds?.blockLowPriority ?? 0.7,
      },
      userTypeLimits: {
        anonymous: config.userTypeLimits?.anonymous ?? 0.5,
        authenticated: config.userTypeLimits?.authenticated ?? 1.0,
        premium: config.userTypeLimits?.premium ?? 2.0,
      },
    };

    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  /**
   * Calculate current server load factor
   * Returns a normalized value between 0.0 (no load) and 1.0 (maximum load)
   */
  public getServerLoad(): ServerLoadMetrics {
    const metrics = this.performanceMonitor.getMetrics();

    // Calculate memory usage percentage
    const memoryUsagePercent =
      (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;

    // Normalize memory usage to 0.0-1.0 scale
    const memoryLoadFactor = Math.min(memoryUsagePercent / 100, 1.0);

    // Normalize active connections (assume 100 connections = high load)
    const connectionLoadFactor = Math.min(metrics.activeConnections / 100, 1.0);

    // Normalize response time (assume 2000ms = high load)
    const responseTimeLoadFactor = Math.min(
      metrics.averageResponseTime / 2000,
      1.0,
    );

    // Calculate overall load factor (weighted average)
    const loadFactor =
      memoryLoadFactor * 0.5 +
      connectionLoadFactor * 0.3 +
      responseTimeLoadFactor * 0.2;

    return {
      loadFactor: Math.min(loadFactor, 1.0),
      memoryUsagePercent,
      activeConnections: metrics.activeConnections,
      averageResponseTime: metrics.averageResponseTime,
    };
  }

  /**
   * Get the rate limit multiplier based on current server load
   * Returns 0.5 (50%) when load > 0.8, 0.75 (75%) when load > 0.6, otherwise 1.0
   */
  private getLoadBasedMultiplier(): number {
    const { loadFactor } = this.getServerLoad();

    if (loadFactor > this.config.loadThresholds.high) {
      return 0.5; // Reduce to 50% under high load
    } else if (loadFactor > this.config.loadThresholds.medium) {
      return 0.75; // Reduce to 75% under medium load
    }

    return 1.0; // Normal limits under low load
  }

  /**
   * Get the effective rate limit for a user
   * Considers user type, server load, and priority
   */
  private getEffectiveLimit(
    userType: UserType,
    priority: MessagePriority,
  ): { limit: number; burstAllowance: number } {
    // Start with base limit
    let baseLimit = this.config.maxRequests;

    // Apply user type multiplier
    baseLimit = Math.floor(baseLimit * this.config.userTypeLimits[userType]);

    // Apply load-based multiplier
    const loadMultiplier = this.getLoadBasedMultiplier();
    const effectiveLimit = Math.floor(baseLimit * loadMultiplier);

    // High-priority messages always get full limit (but not burst)
    if (priority === "high") {
      return {
        limit: baseLimit, // Ignore load multiplier for high priority
        burstAllowance: 0, // No burst for high priority
      };
    }

    return {
      limit: effectiveLimit,
      burstAllowance: this.config.burstAllowance,
    };
  }

  /**
   * Check if a request should be allowed
   * Returns true if allowed, false if rate limited
   */
  public isAllowed(
    key: string,
    userType: UserType = "authenticated",
    priority: MessagePriority = "normal",
  ): boolean {
    const now = Date.now();
    const { loadFactor } = this.getServerLoad();

    // Block low-priority messages when load is high
    if (
      priority === "low" &&
      loadFactor > this.config.loadThresholds.blockLowPriority
    ) {
      logger.debug("Blocked low-priority request due to high server load", {
        key,
        loadFactor,
        threshold: this.config.loadThresholds.blockLowPriority,
      });
      return false;
    }

    // High-priority messages always go through
    if (priority === "high") {
      logger.debug("Allowed high-priority request", { key });
      // Still track it for monitoring purposes
      this.recordRequest(key, userType, priority);
      return true;
    }

    // Get or create rate limit entry
    let entry = this.entries.get(key);
    if (!entry || now >= entry.resetAt) {
      // Initialize or reset entry
      entry = {
        count: 0,
        resetAt: now + this.config.windowMs,
        burstUsed: 0,
      };
      this.entries.set(key, entry);
    }

    // Get effective limits
    const { limit, burstAllowance } = this.getEffectiveLimit(
      userType,
      priority,
    );

    // Check if under limit
    if (entry.count < limit) {
      entry.count++;
      return true;
    }

    // Check if burst allowance available
    if (entry.burstUsed < burstAllowance) {
      entry.count++;
      entry.burstUsed++;
      logger.debug("Used burst allowance", {
        key,
        burstUsed: entry.burstUsed,
        burstAllowance,
      });
      return true;
    }

    // Rate limit exceeded
    logger.warn("Rate limit exceeded", {
      key,
      userType,
      priority,
      count: entry.count,
      limit,
      loadFactor,
    });

    return false;
  }

  /**
   * Record a request for monitoring (used for high-priority requests)
   */
  private recordRequest(
    key: string,
    userType: UserType,
    priority: MessagePriority,
  ): void {
    const now = Date.now();
    let entry = this.entries.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = {
        count: 1,
        resetAt: now + this.config.windowMs,
        burstUsed: 0,
      };
    } else {
      entry.count++;
    }

    this.entries.set(key, entry);
  }

  /**
   * Get rate limit status for a key
   */
  public getStatus(
    key: string,
    userType: UserType = "authenticated",
    priority: MessagePriority = "normal",
  ): {
    remaining: number;
    resetAt: number;
    limit: number;
    burstRemaining: number;
    loadFactor: number;
  } {
    const now = Date.now();
    const entry = this.entries.get(key);
    const { limit, burstAllowance } = this.getEffectiveLimit(
      userType,
      priority,
    );
    const { loadFactor } = this.getServerLoad();

    if (!entry || now >= entry.resetAt) {
      return {
        remaining: limit,
        resetAt: now + this.config.windowMs,
        limit,
        burstRemaining: burstAllowance,
        loadFactor,
      };
    }

    return {
      remaining: Math.max(0, limit - entry.count),
      resetAt: entry.resetAt,
      limit,
      burstRemaining: Math.max(0, burstAllowance - entry.burstUsed),
      loadFactor,
    };
  }

  /**
   * Clean up expired entries
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (now >= entry.resetAt) {
        this.entries.delete(key);
      }
    }

    logger.debug("Cleaned up expired rate limit entries", {
      activeEntries: this.entries.size,
    });
  }

  /**
   * Reset rate limit for a specific key
   */
  public reset(key: string): void {
    this.entries.delete(key);
  }

  /**
   * Get statistics
   */
  public getStats(): {
    activeEntries: number;
    config: Required<AdaptiveRateLimiterConfig>;
    serverLoad: ServerLoadMetrics;
  } {
    return {
      activeEntries: this.entries.size,
      config: this.config,
      serverLoad: this.getServerLoad(),
    };
  }
}

/**
 * Create a default adaptive rate limiter instance
 */
export function createAdaptiveRateLimiter(
  config: AdaptiveRateLimiterConfig,
): AdaptiveRateLimiter {
  return new AdaptiveRateLimiter(config);
}

/**
 * Default adaptive rate limiter for general use
 */
export const defaultAdaptiveRateLimiter = new AdaptiveRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  burstAllowance: 20, // Additional 20 requests for bursts
});

// Set up periodic cleanup every 5 minutes
const cleanupInterval = setInterval(
  () => {
    defaultAdaptiveRateLimiter.cleanup();
  },
  5 * 60 * 1000,
);

// Clean up intervals on process termination
process.on("SIGTERM", () => clearInterval(cleanupInterval));
process.on("SIGINT", () => clearInterval(cleanupInterval));
