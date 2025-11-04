/**
 * Analytics Repository
 *
 * Handles all database operations related to analytics, metrics, and tracking.
 * This repository manages:
 * - User activity analytics
 * - Platform metrics
 * - Event tracking
 * - Conversion funnels
 * - General analytics queries
 *
 * @module AnalyticsRepository
 */

import { eq, and, desc, gte, lte, count } from "drizzle-orm";
import { db, withQueryTiming } from "@shared/database-unified";
import {
  userActivityAnalytics,
  platformMetrics,
  eventTracking,
  conversionFunnel,
  type UserActivityAnalytics,
  type InsertUserActivityAnalytics,
  type PlatformMetrics,
  type InsertPlatformMetrics,
  type EventTracking,
  type InsertEventTracking,
  type ConversionFunnel,
  type InsertConversionFunnel,
} from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { DatabaseError } from "../middleware/error-handling.middleware";
import { BaseRepository } from "./base";

/**
 * Analytics date range filter
 */
export interface AnalyticsDateRange {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Platform metrics summary
 */
export interface PlatformMetricsSummary {
  totalUsers: number;
  activeUsers: number;
  totalEvents: number;
  avgSessionDuration: number;
}

/**
 * Conversion funnel step data
 */
export interface FunnelStepData {
  step: string;
  count: number;
  dropoffRate: number;
}

/**
 * AnalyticsRepository
 *
 * Manages all analytics-related database operations including user activity,
 * platform metrics, event tracking, and conversion funnels.
 */
export class AnalyticsRepository extends BaseRepository<
  typeof userActivityAnalytics,
  UserActivityAnalytics,
  InsertUserActivityAnalytics
> {
  constructor(dbInstance = db) {
    super(dbInstance, userActivityAnalytics, "userActivityAnalytics");
  }

  /**
   * Record user activity analytics
   *
   * @param data - Analytics data
   * @returns Promise of created analytics record
   *
   * @example
   * ```typescript
   * await analyticsRepo.recordUserActivityAnalytics({
   *   userId: 'user-123',
   *   activityType: 'page_view',
   *   metadata: { page: '/dashboard' }
   * });
   * ```
   */
  async recordUserActivityAnalytics(
    data: InsertUserActivityAnalytics,
  ): Promise<UserActivityAnalytics> {
    return withQueryTiming(
      "AnalyticsRepository:recordUserActivityAnalytics",
      async () => {
        try {
          return await this.create(data);
        } catch (error) {
          logger.error(
            "Failed to record user activity analytics",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to record user activity analytics", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get user activity analytics
   *
   * @param userId - User ID
   * @param dateRange - Optional date range filter
   * @returns Promise of analytics records
   *
   * @example
   * ```typescript
   * const analytics = await analyticsRepo.getUserActivityAnalytics(
   *   'user-123',
   *   { startDate: new Date('2025-01-01'), endDate: new Date('2025-01-31') }
   * );
   * ```
   */
  async getUserActivityAnalytics(
    userId: string,
    dateRange?: AnalyticsDateRange,
  ): Promise<UserActivityAnalytics[]> {
    return withQueryTiming(
      "AnalyticsRepository:getUserActivityAnalytics",
      async () => {
        try {
          const conditions = [eq(userActivityAnalytics.userId, userId)];

          if (dateRange?.startDate) {
            conditions.push(
              gte(userActivityAnalytics.timestamp, dateRange.startDate),
            );
          }

          if (dateRange?.endDate) {
            conditions.push(
              lte(userActivityAnalytics.timestamp, dateRange.endDate),
            );
          }

          return await this.db
            .select()
            .from(userActivityAnalytics)
            .where(and(...conditions))
            .orderBy(desc(userActivityAnalytics.timestamp));
        } catch (error) {
          logger.error(
            "Failed to get user activity analytics",
            toLoggableError(error),
            { userId, dateRange },
          );
          throw new DatabaseError("Failed to get user activity analytics", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get user activity count by type
   *
   * @param userId - User ID
   * @param activityType - Activity type
   * @param dateRange - Optional date range filter
   * @returns Promise of count
   *
   * @example
   * ```typescript
   * const pageViews = await analyticsRepo.getUserActivityCount(
   *   'user-123',
   *   'page_view',
   *   { startDate: new Date('2025-01-01') }
   * );
   * ```
   */
  async getUserActivityCount(
    userId: string,
    activityType: string,
    dateRange?: AnalyticsDateRange,
  ): Promise<number> {
    return withQueryTiming(
      "AnalyticsRepository:getUserActivityCount",
      async () => {
        try {
          const conditions = [
            eq(userActivityAnalytics.userId, userId),
            eq(userActivityAnalytics.activityType, activityType),
          ];

          if (dateRange?.startDate) {
            conditions.push(
              gte(userActivityAnalytics.timestamp, dateRange.startDate),
            );
          }

          if (dateRange?.endDate) {
            conditions.push(
              lte(userActivityAnalytics.timestamp, dateRange.endDate),
            );
          }

          const result = await this.db
            .select({ count: count() })
            .from(userActivityAnalytics)
            .where(and(...conditions));

          return result[0]?.count || 0;
        } catch (error) {
          logger.error(
            "Failed to get user activity count",
            toLoggableError(error),
            { userId, activityType, dateRange },
          );
          throw new DatabaseError("Failed to get user activity count", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Record platform metrics
   *
   * @param data - Metrics data
   * @returns Promise of created metrics record
   *
   * @example
   * ```typescript
   * await analyticsRepo.recordPlatformMetrics({
   *   metricType: 'daily_active_users',
   *   value: 1500,
   *   timestamp: new Date()
   * });
   * ```
   */
  async recordPlatformMetrics(
    data: InsertPlatformMetrics,
  ): Promise<PlatformMetrics> {
    return withQueryTiming(
      "AnalyticsRepository:recordPlatformMetrics",
      async () => {
        try {
          const result = await this.db
            .insert(platformMetrics)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to record platform metrics");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to record platform metrics",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to record platform metrics", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get platform metrics
   *
   * @param metricType - Optional metric type filter
   * @param dateRange - Optional date range filter
   * @returns Promise of metrics records
   *
   * @example
   * ```typescript
   * const metrics = await analyticsRepo.getPlatformMetrics(
   *   'daily_active_users',
   *   { startDate: new Date('2025-01-01') }
   * );
   * ```
   */
  async getPlatformMetrics(
    metricType?: string,
    dateRange?: AnalyticsDateRange,
  ): Promise<PlatformMetrics[]> {
    return withQueryTiming(
      "AnalyticsRepository:getPlatformMetrics",
      async () => {
        try {
          const conditions = [];

          if (metricType) {
            conditions.push(eq(platformMetrics.metricType, metricType));
          }

          if (dateRange?.startDate) {
            conditions.push(
              gte(platformMetrics.timestamp, dateRange.startDate),
            );
          }

          if (dateRange?.endDate) {
            conditions.push(lte(platformMetrics.timestamp, dateRange.endDate));
          }

          let query = this.db
            .select()
            .from(platformMetrics)
            .orderBy(desc(platformMetrics.timestamp));

          if (conditions.length > 0) {
            query = query.where(and(...conditions)) as typeof query;
          }

          return await query;
        } catch (error) {
          logger.error(
            "Failed to get platform metrics",
            toLoggableError(error),
            { metricType, dateRange },
          );
          throw new DatabaseError("Failed to get platform metrics", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get platform metrics summary
   *
   * @param dateRange - Date range filter
   * @returns Promise of metrics summary
   *
   * @example
   * ```typescript
   * const summary = await analyticsRepo.getPlatformMetricsSummary({
   *   startDate: new Date('2025-01-01'),
   *   endDate: new Date('2025-01-31')
   * });
   * ```
   */
  async getPlatformMetricsSummary(
    dateRange: AnalyticsDateRange,
  ): Promise<PlatformMetricsSummary> {
    return withQueryTiming(
      "AnalyticsRepository:getPlatformMetricsSummary",
      async () => {
        try {
          // This is a simplified implementation
          // In a real app, you'd aggregate specific metrics
          const conditions = [];

          if (dateRange.startDate) {
            conditions.push(
              gte(platformMetrics.timestamp, dateRange.startDate),
            );
          }

          if (dateRange.endDate) {
            conditions.push(lte(platformMetrics.timestamp, dateRange.endDate));
          }

          const metrics = await this.db
            .select()
            .from(platformMetrics)
            .where(and(...conditions));

          // Aggregate metrics (simplified)
          const summary: PlatformMetricsSummary = {
            totalUsers: 0,
            activeUsers: 0,
            totalEvents: 0,
            avgSessionDuration: 0,
          };

          metrics.forEach((metric) => {
            if (metric.metricType === "total_users") {
              summary.totalUsers = Number(metric.value);
            } else if (metric.metricType === "active_users") {
              summary.activeUsers = Number(metric.value);
            } else if (metric.metricType === "total_events") {
              summary.totalEvents = Number(metric.value);
            }
          });

          return summary;
        } catch (error) {
          logger.error(
            "Failed to get platform metrics summary",
            toLoggableError(error),
            { dateRange },
          );
          throw new DatabaseError("Failed to get platform metrics summary", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Record event tracking
   *
   * @param data - Event tracking data
   * @returns Promise of created tracking record
   *
   * @example
   * ```typescript
   * await analyticsRepo.recordEventTracking({
   *   eventName: 'user_signup',
   *   userId: 'user-123',
   *   metadata: { source: 'google' }
   * });
   * ```
   */
  async recordEventTracking(data: InsertEventTracking): Promise<EventTracking> {
    return withQueryTiming(
      "AnalyticsRepository:recordEventTracking",
      async () => {
        try {
          const result = await this.db
            .insert(eventTracking)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to record event tracking");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to record event tracking",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to record event tracking", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get event tracking data
   *
   * @param eventName - Optional event name filter
   * @param dateRange - Optional date range filter
   * @returns Promise of tracking records
   *
   * @example
   * ```typescript
   * const events = await analyticsRepo.getEventTracking(
   *   'user_signup',
   *   { startDate: new Date('2025-01-01') }
   * );
   * ```
   */
  async getEventTracking(
    eventName?: string,
    dateRange?: AnalyticsDateRange,
  ): Promise<EventTracking[]> {
    return withQueryTiming("AnalyticsRepository:getEventTracking", async () => {
      try {
        const conditions = [];

        if (eventName) {
          conditions.push(eq(eventTracking.eventName, eventName));
        }

        if (dateRange?.startDate) {
          conditions.push(gte(eventTracking.timestamp, dateRange.startDate));
        }

        if (dateRange?.endDate) {
          conditions.push(lte(eventTracking.timestamp, dateRange.endDate));
        }

        let query = this.db
          .select()
          .from(eventTracking)
          .orderBy(desc(eventTracking.timestamp));

        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as typeof query;
        }

        return await query;
      } catch (error) {
        logger.error("Failed to get event tracking", toLoggableError(error), {
          eventName,
          dateRange,
        });
        throw new DatabaseError("Failed to get event tracking", {
          cause: error,
        });
      }
    });
  }

  /**
   * Get event count by name
   *
   * @param eventName - Event name
   * @param dateRange - Optional date range filter
   * @returns Promise of event count
   *
   * @example
   * ```typescript
   * const signupCount = await analyticsRepo.getEventCount('user_signup');
   * ```
   */
  async getEventCount(
    eventName: string,
    dateRange?: AnalyticsDateRange,
  ): Promise<number> {
    return withQueryTiming("AnalyticsRepository:getEventCount", async () => {
      try {
        const conditions = [eq(eventTracking.eventName, eventName)];

        if (dateRange?.startDate) {
          conditions.push(gte(eventTracking.timestamp, dateRange.startDate));
        }

        if (dateRange?.endDate) {
          conditions.push(lte(eventTracking.timestamp, dateRange.endDate));
        }

        const result = await this.db
          .select({ count: count() })
          .from(eventTracking)
          .where(and(...conditions));

        return result[0]?.count || 0;
      } catch (error) {
        logger.error("Failed to get event count", toLoggableError(error), {
          eventName,
          dateRange,
        });
        throw new DatabaseError("Failed to get event count", { cause: error });
      }
    });
  }

  /**
   * Record conversion funnel step
   *
   * @param data - Funnel data
   * @returns Promise of created funnel record
   *
   * @example
   * ```typescript
   * await analyticsRepo.recordConversionFunnel({
   *   funnelName: 'signup_flow',
   *   step: 'email_verification',
   *   userId: 'user-123'
   * });
   * ```
   */
  async recordConversionFunnel(
    data: InsertConversionFunnel,
  ): Promise<ConversionFunnel> {
    return withQueryTiming(
      "AnalyticsRepository:recordConversionFunnel",
      async () => {
        try {
          const result = await this.db
            .insert(conversionFunnel)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to record conversion funnel");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to record conversion funnel",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to record conversion funnel", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get conversion funnel data
   *
   * @param funnelName - Funnel name
   * @param dateRange - Optional date range filter
   * @returns Promise of funnel step data
   *
   * @example
   * ```typescript
   * const funnelData = await analyticsRepo.getConversionFunnelData(
   *   'signup_flow',
   *   { startDate: new Date('2025-01-01') }
   * );
   * ```
   */
  async getConversionFunnelData(
    funnelName: string,
    dateRange?: AnalyticsDateRange,
  ): Promise<FunnelStepData[]> {
    return withQueryTiming(
      "AnalyticsRepository:getConversionFunnelData",
      async () => {
        try {
          const conditions = [eq(conversionFunnel.funnelName, funnelName)];

          if (dateRange?.startDate) {
            conditions.push(
              gte(conversionFunnel.timestamp, dateRange.startDate),
            );
          }

          if (dateRange?.endDate) {
            conditions.push(lte(conversionFunnel.timestamp, dateRange.endDate));
          }

          const records = await this.db
            .select()
            .from(conversionFunnel)
            .where(and(...conditions));

          // Group by step and calculate metrics
          const stepCounts = new Map<string, number>();
          records.forEach((record) => {
            const step = record.step || "unknown";
            stepCounts.set(step, (stepCounts.get(step) || 0) + 1);
          });

          // Convert to array and calculate dropoff rates
          const steps = Array.from(stepCounts.entries());
          const _totalUsers = steps.length > 0 ? steps[0][1] : 0;

          return steps.map(([step, count], index) => ({
            step,
            count,
            dropoffRate:
              index > 0
                ? ((steps[index - 1][1] - count) / steps[index - 1][1]) * 100
                : 0,
          }));
        } catch (error) {
          logger.error(
            "Failed to get conversion funnel data",
            toLoggableError(error),
            { funnelName, dateRange },
          );
          throw new DatabaseError("Failed to get conversion funnel data", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get analytics data for a user (general purpose)
   *
   * @param userId - User ID
   * @returns Promise of analytics data
   *
   * @example
   * ```typescript
   * const data = await analyticsRepo.getAnalyticsData('user-123');
   * ```
   */
  async getAnalyticsData(userId: string): Promise<{
    activityCount: number;
    recentActivities: UserActivityAnalytics[];
    eventCount: number;
  }> {
    return withQueryTiming("AnalyticsRepository:getAnalyticsData", async () => {
      try {
        const activityResult = await this.db
          .select({ count: count() })
          .from(userActivityAnalytics)
          .where(eq(userActivityAnalytics.userId, userId));

        const recentActivities = await this.db
          .select()
          .from(userActivityAnalytics)
          .where(eq(userActivityAnalytics.userId, userId))
          .orderBy(desc(userActivityAnalytics.timestamp))
          .limit(10);

        const eventResult = await this.db
          .select({ count: count() })
          .from(eventTracking)
          .where(eq(eventTracking.userId, userId));

        return {
          activityCount: activityResult[0]?.count || 0,
          recentActivities,
          eventCount: eventResult[0]?.count || 0,
        };
      } catch (error) {
        logger.error("Failed to get analytics data", toLoggableError(error), {
          userId,
        });
        throw new DatabaseError("Failed to get analytics data", {
          cause: error,
        });
      }
    });
  }
}
