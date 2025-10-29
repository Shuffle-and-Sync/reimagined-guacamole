/**
 * Matching Cache Service
 * Handles caching and performance optimization for real-time matching
 */

import { logger } from "../../logger";
import type {
  RealTimeMatchRequest,
  RealTimeMatchResponse,
  PerformanceMetric,
} from "./matching-types";

export class MatchingCacheService {
  private static instance: MatchingCacheService;

  private matchCache = new Map<string, RealTimeMatchResponse>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  private performanceHistory: PerformanceMetric[] = [];
  private readonly MAX_HISTORY = 10000;

  private constructor() {
    logger.debug("Matching Cache Service initialized");
    // Clean expired cache entries periodically
    setInterval(() => this.cleanExpiredCache(), 60000);
  }

  public static getInstance(): MatchingCacheService {
    if (!MatchingCacheService.instance) {
      MatchingCacheService.instance = new MatchingCacheService();
    }
    return MatchingCacheService.instance;
  }

  /**
   * Generate cache key from request
   */
  generateCacheKey(request: RealTimeMatchRequest): string {
    const key = {
      userId: request.userId,
      prefs: request.preferences,
      ctx: request.context,
    };
    return JSON.stringify(key);
  }

  /**
   * Get cached response
   */
  getCached(requestId: string): RealTimeMatchResponse | null {
    const expiry = this.cacheExpiry.get(requestId);
    if (expiry && Date.now() < expiry) {
      const cached = this.matchCache.get(requestId);
      if (cached) {
        logger.debug("Cache hit", { requestId });
        return cached;
      }
    }
    return null;
  }

  /**
   * Cache response
   */
  cacheResponse(
    requestId: string,
    response: RealTimeMatchResponse,
    ttl: number = this.CACHE_DURATION,
  ): void {
    // Enforce max cache size
    if (this.matchCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.matchCache.keys().next().value as string;
      if (oldestKey) {
        this.matchCache.delete(oldestKey);
        this.cacheExpiry.delete(oldestKey);
      }
    }

    this.matchCache.set(requestId, response);
    this.cacheExpiry.set(requestId, Date.now() + ttl);
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now >= expiry) {
        this.matchCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }

  /**
   * Record performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.performanceHistory.push(metric);
    if (this.performanceHistory.length > this.MAX_HISTORY) {
      this.performanceHistory.shift();
    }
  }

  /**
   * Calculate cache hit rate
   */
  calculateCacheHitRate(): number {
    if (this.performanceHistory.length === 0) return 0;
    const hits = this.performanceHistory.filter((m) => m.cacheHit).length;
    return hits / this.performanceHistory.length;
  }

  /**
   * Get performance stats
   */
  getPerformanceStats() {
    const recentMetrics = this.performanceHistory.slice(-100);
    const avgDuration =
      recentMetrics.reduce((sum, m) => sum + m.duration, 0) /
        recentMetrics.length || 0;
    const avgQuality =
      recentMetrics.reduce((sum, m) => sum + m.qualityScore, 0) /
        recentMetrics.length || 0;

    return {
      cacheSize: this.matchCache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      avgResponseTime: avgDuration,
      avgQualityScore: avgQuality,
      totalRequests: this.performanceHistory.length,
    };
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.matchCache.clear();
    this.cacheExpiry.clear();
    logger.info("Cache cleared");
  }
}

export const matchingCache = MatchingCacheService.getInstance();
