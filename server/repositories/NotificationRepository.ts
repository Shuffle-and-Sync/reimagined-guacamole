/**
 * Notification Repository
 *
 * Handles all database operations related to user notifications.
 * This repository manages:
 * - Notification CRUD operations
 * - User notification queries with filtering
 * - Mark as read/unread operations
 * - Cursor-based pagination for notification feeds
 *
 * @module NotificationRepository
 */

import { eq, and, desc, lt, count } from "drizzle-orm";
import { db, withQueryTiming } from "@shared/database-unified";
import {
  notifications,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { logger } from "../logger";
import { DatabaseError } from "../middleware/error-handling.middleware";
import { BaseRepository } from "./base";

/**
 * Notification query options
 */
export interface NotificationQueryOptions {
  unreadOnly?: boolean;
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

/**
 * NotificationRepository
 *
 * Manages all notification-related database operations.
 */
export class NotificationRepository extends BaseRepository<
  typeof notifications,
  Notification,
  InsertNotification
> {
  constructor(dbInstance = db) {
    super(dbInstance, notifications, "notifications");
  }

  /**
   * Get notifications for a user
   *
   * @param userId - User ID
   * @param options - Query options (unreadOnly, limit)
   * @returns Promise of notifications
   *
   * @example
   * ```typescript
   * const notifications = await notificationRepo.getUserNotifications(
   *   'user-123',
   *   { unreadOnly: true, limit: 20 }
   * );
   * ```
   */
  async getUserNotifications(
    userId: string,
    options: NotificationQueryOptions = {},
  ): Promise<Notification[]> {
    return withQueryTiming(
      "NotificationRepository:getUserNotifications",
      async () => {
        try {
          const conditions = [eq(notifications.userId, userId)];

          if (options.unreadOnly) {
            conditions.push(eq(notifications.isRead, false));
          }

          const baseQuery = this.db
            .select()
            .from(notifications)
            .where(and(...conditions));

          const limitedQuery = options.limit
            ? baseQuery.limit(options.limit)
            : baseQuery;

          return await limitedQuery.orderBy(desc(notifications.createdAt));
        } catch (error) {
          logger.error(
            "Failed to get user notifications",
            error instanceof Error ? error : new Error(String(error)),
            { userId, options },
          );
          throw new DatabaseError("Failed to get user notifications", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get notifications with cursor-based pagination
   *
   * @param userId - User ID
   * @param options - Query options with cursor support
   * @returns Promise of notifications
   *
   * @example
   * ```typescript
   * const notifications = await notificationRepo.getUserNotificationsWithCursor(
   *   'user-123',
   *   { cursor: '2025-01-01T00:00:00Z', limit: 50 }
   * );
   * ```
   */
  async getUserNotificationsWithCursor(
    userId: string,
    options: NotificationQueryOptions = {},
  ): Promise<Notification[]> {
    return withQueryTiming(
      "NotificationRepository:getUserNotificationsWithCursor",
      async () => {
        try {
          const conditions = [eq(notifications.userId, userId)];

          if (options.unreadOnly) {
            conditions.push(eq(notifications.isRead, false));
          }

          if (options.cursor) {
            // Add cursor-based pagination condition
            conditions.push(
              lt(notifications.createdAt, new Date(options.cursor)),
            );
          }

          return await this.db
            .select()
            .from(notifications)
            .where(and(...conditions))
            .orderBy(desc(notifications.createdAt))
            .limit(options.limit || 50);
        } catch (error) {
          logger.error(
            "Failed to get user notifications with cursor",
            error instanceof Error ? error : new Error(String(error)),
            { userId, options },
          );
          throw new DatabaseError(
            "Failed to get user notifications with cursor",
            { cause: error },
          );
        }
      },
    );
  }

  /**
   * Get unread notification count for a user
   *
   * @param userId - User ID
   * @returns Promise of unread count
   *
   * @example
   * ```typescript
   * const unreadCount = await notificationRepo.getUnreadCount('user-123');
   * console.log(`You have ${unreadCount} unread notifications`);
   * ```
   */
  async getUnreadCount(userId: string): Promise<number> {
    return withQueryTiming(
      "NotificationRepository:getUnreadCount",
      async () => {
        try {
          const result = await this.db
            .select({ count: count() })
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, userId),
                eq(notifications.isRead, false),
              ),
            );

          return result[0]?.count || 0;
        } catch (error) {
          logger.error(
            "Failed to get unread notification count",
            error instanceof Error ? error : new Error(String(error)),
            { userId },
          );
          throw new DatabaseError("Failed to get unread notification count", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Create a notification
   *
   * @param data - Notification data
   * @returns Promise of created notification
   *
   * @example
   * ```typescript
   * const notification = await notificationRepo.createNotification({
   *   userId: 'user-123',
   *   type: 'event_reminder',
   *   content: 'Your event starts in 1 hour',
   *   isRead: false
   * });
   * ```
   */
  async createNotification(data: InsertNotification): Promise<Notification> {
    return withQueryTiming(
      "NotificationRepository:createNotification",
      async () => {
        try {
          return await this.create(data);
        } catch (error) {
          logger.error(
            "Failed to create notification",
            error instanceof Error ? error : new Error(String(error)),
            { data },
          );
          throw new DatabaseError("Failed to create notification", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Mark a notification as read
   *
   * @param notificationId - Notification ID
   *
   * @example
   * ```typescript
   * await notificationRepo.markNotificationAsRead('notif-123');
   * ```
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    return withQueryTiming(
      "NotificationRepository:markNotificationAsRead",
      async () => {
        try {
          await this.db
            .update(notifications)
            .set({ isRead: true, readAt: new Date() })
            .where(eq(notifications.id, notificationId));
        } catch (error) {
          logger.error(
            "Failed to mark notification as read",
            error instanceof Error ? error : new Error(String(error)),
            { notificationId },
          );
          throw new DatabaseError("Failed to mark notification as read", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Mark all notifications as read for a user
   *
   * @param userId - User ID
   *
   * @example
   * ```typescript
   * await notificationRepo.markAllNotificationsAsRead('user-123');
   * ```
   */
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    return withQueryTiming(
      "NotificationRepository:markAllNotificationsAsRead",
      async () => {
        try {
          await this.db
            .update(notifications)
            .set({ isRead: true, readAt: new Date() })
            .where(eq(notifications.userId, userId));
        } catch (error) {
          logger.error(
            "Failed to mark all notifications as read",
            error instanceof Error ? error : new Error(String(error)),
            { userId },
          );
          throw new DatabaseError("Failed to mark all notifications as read", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Delete a notification
   *
   * @param notificationId - Notification ID
   *
   * @example
   * ```typescript
   * await notificationRepo.deleteNotification('notif-123');
   * ```
   */
  async deleteNotification(notificationId: string): Promise<void> {
    return withQueryTiming(
      "NotificationRepository:deleteNotification",
      async () => {
        try {
          await this.delete(notificationId);
        } catch (error) {
          logger.error(
            "Failed to delete notification",
            error instanceof Error ? error : new Error(String(error)),
            { notificationId },
          );
          throw new DatabaseError("Failed to delete notification", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Delete all notifications for a user
   *
   * @param userId - User ID
   * @returns Promise of count of deleted notifications
   *
   * @example
   * ```typescript
   * const deletedCount = await notificationRepo.deleteAllUserNotifications('user-123');
   * ```
   */
  async deleteAllUserNotifications(userId: string): Promise<number> {
    return withQueryTiming(
      "NotificationRepository:deleteAllUserNotifications",
      async () => {
        try {
          return await this.deleteWhere({ userId });
        } catch (error) {
          logger.error(
            "Failed to delete all user notifications",
            error instanceof Error ? error : new Error(String(error)),
            { userId },
          );
          throw new DatabaseError("Failed to delete all user notifications", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Delete read notifications older than a specified date
   *
   * @param olderThan - Delete notifications read before this date
   * @returns Promise of count of deleted notifications
   *
   * @example
   * ```typescript
   * // Delete notifications read more than 30 days ago
   * const thirtyDaysAgo = new Date();
   * thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
   * const deletedCount = await notificationRepo.deleteOldReadNotifications(thirtyDaysAgo);
   * ```
   */
  async deleteOldReadNotifications(olderThan: Date): Promise<number> {
    return withQueryTiming(
      "NotificationRepository:deleteOldReadNotifications",
      async () => {
        try {
          const result = await this.db
            .delete(notifications)
            .where(
              and(
                eq(notifications.isRead, true),
                lt(notifications.readAt, olderThan),
              ),
            )
            .returning();

          return result.length;
        } catch (error) {
          logger.error(
            "Failed to delete old read notifications",
            error instanceof Error ? error : new Error(String(error)),
            { olderThan },
          );
          throw new DatabaseError("Failed to delete old read notifications", {
            cause: error,
          });
        }
      },
    );
  }
}
