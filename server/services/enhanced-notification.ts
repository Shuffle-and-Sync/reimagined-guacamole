import { storage } from "../storage";
import { logger } from "../logger";
import { notificationDeliveryService } from "./notification-delivery";
import {
  notificationTemplateService,
  type TemplateContext,
} from "./notification-templates";
import type { InsertNotification, Notification } from "@shared/schema";

/**
 * Enhanced notification service with multi-channel delivery and templating
 */
export class EnhancedNotificationService {
  /**
   * Send a templated notification with multi-channel delivery
   */
  async sendNotification(
    userId: string,
    type: string,
    context: TemplateContext,
    options?: {
      priority?: "low" | "normal" | "high" | "urgent";
      communityId?: string;
      expiresAt?: Date;
      forceChannels?: {
        browser?: boolean;
        email?: boolean;
        push?: boolean;
        sms?: boolean;
        webhook?: boolean;
      };
    },
  ): Promise<{ notification: Notification; deliveryResults: unknown[] }> {
    try {
      // Generate notification from template
      const template = notificationTemplateService.generateNotification(
        type,
        context,
      );

      // Create notification in database
      const notificationData: InsertNotification = {
        userId,
        type: type as any, // Type assertion for notification type enum
        title: template.title,
        message: template.message,
        priority: options?.priority || template.priority,
        data: JSON.stringify({
          actionUrl: template.actionUrl,
          actionText: template.actionText,
          emailSubject: template.emailSubject,
          emailTemplate: template.emailTemplate,
          pushTitle: template.pushTitle,
          pushBody: template.pushBody,
          smsMessage: template.smsMessage,
          context,
          communityId: options?.communityId, // Include in data instead
        }),
      };

      const notification = await storage.createNotification(notificationData);

      // Deliver notification through appropriate channels
      const deliveryResults =
        await notificationDeliveryService.deliverNotification(
          userId,
          notification,
          options?.forceChannels,
        );

      logger.info("Enhanced notification sent successfully", {
        userId,
        notificationId: notification.id,
        type,
        deliveryChannels: deliveryResults.map((r) => r.channel),
        successfulDeliveries: deliveryResults.filter((r) => r.success).length,
      });

      return { notification, deliveryResults };
    } catch (error) {
      logger.error("Failed to send enhanced notification", {
        error,
        userId,
        type,
        context,
      });
      throw error;
    }
  }

  /**
   * Send stream started notification
   */
  async notifyStreamStarted(
    streamSession: any,
    followers: string[] = [],
  ): Promise<void> {
    const context: TemplateContext = {
      fromUser: { id: streamSession.hostUserId },
      stream: {
        id: streamSession.id,
        title: streamSession.title,
        platform: streamSession.platforms?.[0]?.platform || "streaming",
      },
    };

    // Notify followers
    const notificationPromises = followers.map((userId) =>
      this.sendNotification(userId, "streamStarted", context, {
        priority: "normal",
        communityId: streamSession.communityId,
      }),
    );

    await Promise.allSettled(notificationPromises);
  }

  /**
   * Send collaboration invite notification
   */
  async notifyCollaborationInvite(
    fromUserId: string,
    toUserId: string,
    collaborationRequest: any,
  ): Promise<void> {
    const context: TemplateContext = {
      fromUser: { id: fromUserId },
      stream: { id: collaborationRequest.streamSessionId },
      type: collaborationRequest.type,
      requestId: collaborationRequest.id,
    };

    await this.sendNotification(toUserId, "collaborationInvite", context, {
      priority: "high",
    });
  }

  /**
   * Send event reminder notifications
   */
  async notifyEventReminder(
    event: any,
    attendees: string[],
    reminderTime: string = "15 minutes",
  ): Promise<void> {
    const context: TemplateContext = {
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
      },
      reminderTime,
    };

    const notificationPromises = attendees.map((userId) =>
      this.sendNotification(userId, "eventReminders", context, {
        priority: "normal",
        communityId: event.communityId,
      }),
    );

    await Promise.allSettled(notificationPromises);
  }

  /**
   * Send friend request notification
   */
  async notifyFriendRequest(
    fromUserId: string,
    toUserId: string,
    friendship: any,
  ): Promise<void> {
    const context: TemplateContext = {
      fromUser: { id: fromUserId },
      requestId: friendship.id,
    };

    await this.sendNotification(toUserId, "friendRequests", context, {
      priority: "normal",
    });
  }

  /**
   * Send tournament update notification
   */
  async notifyTournamentUpdate(
    tournament: any,
    participants: string[],
    updateType: string,
    updateMessage: string,
  ): Promise<void> {
    const context: TemplateContext = {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
      },
      updateType,
      updateMessage,
    };

    const notificationPromises = participants.map((userId) =>
      this.sendNotification(userId, "tournamentUpdates", context, {
        priority: "normal",
        communityId: tournament.communityId,
      }),
    );

    await Promise.allSettled(notificationPromises);
  }

  /**
   * Send system announcement
   */
  async sendSystemAnnouncement(
    userIds: string[],
    title: string,
    message: string,
    options?: {
      priority?: "low" | "normal" | "high" | "urgent";
      actionUrl?: string;
      actionText?: string;
      communityId?: string;
    },
  ): Promise<void> {
    const context: TemplateContext = {
      title,
      message,
      actionUrl: options?.actionUrl,
      actionText: options?.actionText,
      priority: options?.priority || "normal",
    };

    const notificationPromises = userIds.map((userId) =>
      this.sendNotification(userId, "systemAnnouncements", context, {
        priority: options?.priority || "normal",
        communityId: options?.communityId,
      }),
    );

    await Promise.allSettled(notificationPromises);
  }

  /**
   * Send weekly digest notifications
   */
  async sendWeeklyDigests(): Promise<void> {
    try {
      // Get all users who have weekly digest enabled
      const users = await this.getUsersWithWeeklyDigestEnabled();

      for (const user of users) {
        try {
          const weeklyStats = await this.generateWeeklyStats(user.id);

          const context: TemplateContext = {
            user: {
              id: user.id,
              firstName: user.firstName,
              username: user.username,
            },
            weeklyStats,
          };

          await this.sendNotification(user.id, "weeklyDigest", context, {
            priority: "low",
            forceChannels: {
              email: true,
              browser: false,
              push: false,
              sms: false,
              webhook: false,
            },
          });
        } catch (error) {
          logger.error("Failed to send weekly digest to user", {
            error,
            userId: user.id,
          });
        }
      }

      logger.info("Weekly digest notifications completed", {
        totalUsers: users.length,
      });
    } catch (error) {
      logger.error("Failed to send weekly digest notifications", { error });
    }
  }

  /**
   * Process notification queue (called by background job)
   */
  async processNotificationQueue(): Promise<void> {
    await notificationDeliveryService.processQueuedNotifications();
  }

  /**
   * Register WebSocket for real-time notifications
   */
  registerWebSocketConnection(userId: string, connection: any): void {
    notificationDeliveryService.registerWebSocketConnection(userId, connection);
  }

  /**
   * Get users with weekly digest enabled
   */
  private async getUsersWithWeeklyDigestEnabled(): Promise<any[]> {
    // TODO: Implement query to get users with weekly digest enabled
    // This would query the userSettings table for users with digestFrequency = 'weekly'
    return [];
  }

  /**
   * Generate weekly stats for a user
   */
  private async generateWeeklyStats(_userId: string): Promise<any> {
    // TODO: Implement weekly stats generation
    // This would aggregate user activity, events attended, streams watched, etc.
    return {
      eventsAttended: 0,
      streamsWatched: 0,
      friendsAdded: 0,
      communitiesJoined: 0,
      gamesPlayed: 0,
    };
  }

  /**
   * Update notification preferences for a user
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: any,
  ): Promise<void> {
    try {
      const currentSettings = await storage.getUserSettings(userId);

      // Parse JSON strings from database
      const currentNotificationSettings = currentSettings?.notificationTypes
        ? JSON.parse(currentSettings.notificationTypes as string)
        : {};
      const currentPrivacySettings = currentSettings?.privacySettings
        ? JSON.parse(currentSettings.privacySettings as string)
        : {};
      const currentDisplayPreferences = currentSettings?.displayPreferences
        ? JSON.parse(currentSettings.displayPreferences as string)
        : {};

      const updatedSettings = {
        userId,
        notificationTypes: JSON.stringify({
          ...currentNotificationSettings,
          ...preferences,
        }),
        privacySettings: JSON.stringify(currentPrivacySettings),
        displayPreferences: JSON.stringify(currentDisplayPreferences),
      };

      await storage.upsertUserSettings(updatedSettings);

      logger.info("Notification preferences updated", {
        userId,
        preferences,
      });
    } catch (error) {
      logger.error("Failed to update notification preferences", {
        error,
        userId,
        preferences,
      });
      throw error;
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(userId: string): Promise<any> {
    try {
      const userSettings = await storage.getUserSettings(userId);
      if (!userSettings?.notificationTypes) {
        return {};
      }
      return JSON.parse(userSettings.notificationTypes as string);
    } catch (error) {
      logger.error("Failed to get notification preferences", {
        error,
        userId,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const enhancedNotificationService = new EnhancedNotificationService();
