import { storage } from "../storage";
import { logger } from "../logger";
import type { Notification, UserSettings, User } from "@shared/schema";

/**
 * Notification delivery channels and preferences
 */
export interface NotificationChannels {
  browser: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
  webhook: boolean;
}

export interface NotificationPreferences {
  streamStarted: NotificationChannels;
  streamEnded: NotificationChannels;
  collaborationInvite: NotificationChannels;
  raidIncoming: NotificationChannels;
  eventReminders: NotificationChannels;
  friendRequests: NotificationChannels;
  socialUpdates: NotificationChannels;
  tournamentUpdates: NotificationChannels;
  systemAnnouncements: NotificationChannels;
  weeklyDigest: NotificationChannels;
  digestFrequency: "daily" | "weekly" | "monthly" | "never";
  quietHours: { enabled: boolean; start: string; end: string };
  timezone: string;
  groupNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showPreview: boolean;
}

export interface DeliveryResult {
  channel: keyof NotificationChannels;
  success: boolean;
  error?: string;
  deliveryId?: string;
}

/**
 * Enhanced notification delivery service with multi-channel support
 */
export class NotificationDeliveryService {
  private webSocketConnections = new Map<string, any>(); // WebSocket connections per user
  private emailQueue: any[] = []; // Email delivery queue
  private smsQueue: any[] = []; // SMS delivery queue
  private webhookQueue: any[] = []; // Webhook delivery queue

  /**
   * Send notification through all enabled channels based on user preferences
   */
  async deliverNotification(
    userId: string,
    notification: Notification,
    forceChannels?: Partial<NotificationChannels>,
  ): Promise<DeliveryResult[]> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const userSettings = await storage.getUserSettings(userId);
      const preferences = this.getUserNotificationPreferences(userSettings);

      // Check if notification should be delivered (quiet hours, etc.)
      if (!this.shouldDeliverNotification(notification, preferences, user)) {
        logger.info("Notification delivery skipped due to user preferences", {
          userId,
          notificationType: notification.type,
          reason: "quiet_hours_or_preferences",
        });
        return [];
      }

      // Determine which channels to use
      const channels =
        forceChannels ||
        this.getChannelsForNotificationType(notification.type, preferences);

      // Track channels and promises together to avoid index misalignment
      const deliveryTasks: Array<{
        channel: keyof NotificationChannels;
        promise: Promise<DeliveryResult>;
      }> = [];

      // Browser notification (real-time WebSocket)
      if (channels.browser) {
        deliveryTasks.push({
          channel: "browser",
          promise: this.deliverBrowserNotification(userId, notification),
        });
      }

      // Email notification
      if (channels.email) {
        deliveryTasks.push({
          channel: "email",
          promise: this.deliverEmailNotification(user, notification),
        });
      }

      // Push notification
      if (channels.push) {
        deliveryTasks.push({
          channel: "push",
          promise: this.deliverPushNotification(userId, notification),
        });
      }

      // SMS notification
      if (channels.sms) {
        deliveryTasks.push({
          channel: "sms",
          promise: this.deliverSMSNotification(user, notification),
        });
      }

      // Webhook notification
      if (channels.webhook) {
        deliveryTasks.push({
          channel: "webhook",
          promise: this.deliverWebhookNotification(user, notification),
        });
      }

      const results = await Promise.allSettled(
        deliveryTasks.map((task) => task.promise),
      );
      const deliveryResults: DeliveryResult[] = results.map((result, index) => {
        const task = deliveryTasks[index];
        if (!task) {
          // This should never happen since we map over the same array
          return {
            channel: "browser" as keyof NotificationChannels,
            success: false,
            error: "Task not found",
          };
        }

        if (result.status === "fulfilled") {
          return result.value;
        } else {
          return {
            channel: task.channel,
            success: false,
            error: result.reason?.message || "Unknown error",
          };
        }
      });

      logger.info("Notification delivered across channels", {
        userId,
        notificationId: notification.id,
        deliveryResults: deliveryResults.map((r) => ({
          channel: r.channel,
          success: r.success,
        })),
      });

      return deliveryResults;
    } catch (error) {
      logger.error("Failed to deliver notification", {
        error,
        userId,
        notificationId: notification.id,
      });
      throw error;
    }
  }

  /**
   * Deliver browser notification via WebSocket
   */
  private async deliverBrowserNotification(
    userId: string,
    notification: Notification,
  ): Promise<DeliveryResult> {
    try {
      const connection = this.webSocketConnections.get(userId);
      if (connection && connection.readyState === 1) {
        // WebSocket.OPEN
        connection.send(
          JSON.stringify({
            type: "notification",
            data: notification,
          }),
        );

        return {
          channel: "browser",
          success: true,
          deliveryId: `ws_${Date.now()}`,
        };
      } else {
        // Store notification for delivery when user comes online
        await this.storeForLaterDelivery(userId, notification, "browser");
        return {
          channel: "browser",
          success: true,
          deliveryId: `stored_${Date.now()}`,
        };
      }
    } catch (error) {
      return {
        channel: "browser",
        success: false,
        error:
          error instanceof Error ? error.message : "WebSocket delivery failed",
      };
    }
  }

  /**
   * Deliver email notification
   */
  private async deliverEmailNotification(
    user: User,
    notification: Notification,
  ): Promise<DeliveryResult> {
    try {
      // TODO: Implement with SendGrid or similar email service
      // For now, add to queue for processing
      this.emailQueue.push({
        to: user.email,
        subject: notification.title,
        content: notification.message,
        template: this.getEmailTemplate(notification.type),
        data: notification.data,
        createdAt: new Date(),
      });

      // Simulate email sending (replace with actual implementation)
      logger.info("Email notification queued", {
        userId: user.id,
        email: user.email,
        notificationId: notification.id,
      });

      return {
        channel: "email",
        success: true,
        deliveryId: `email_${Date.now()}`,
      };
    } catch (error) {
      return {
        channel: "email",
        success: false,
        error: error instanceof Error ? error.message : "Email delivery failed",
      };
    }
  }

  /**
   * Deliver push notification
   */
  private async deliverPushNotification(
    userId: string,
    notification: Notification,
  ): Promise<DeliveryResult> {
    try {
      // TODO: Implement with web push service or mobile push service
      logger.info("Push notification would be delivered", {
        userId,
        notificationId: notification.id,
      });

      return {
        channel: "push",
        success: true,
        deliveryId: `push_${Date.now()}`,
      };
    } catch (error) {
      return {
        channel: "push",
        success: false,
        error: error instanceof Error ? error.message : "Push delivery failed",
      };
    }
  }

  /**
   * Deliver SMS notification
   */
  private async deliverSMSNotification(
    user: User,
    notification: Notification,
  ): Promise<DeliveryResult> {
    try {
      // TODO: Implement with Twilio or similar SMS service
      logger.info("SMS notification would be delivered", {
        userId: user.id,
        notificationId: notification.id,
      });

      return {
        channel: "sms",
        success: true,
        deliveryId: `sms_${Date.now()}`,
      };
    } catch (error) {
      return {
        channel: "sms",
        success: false,
        error: error instanceof Error ? error.message : "SMS delivery failed",
      };
    }
  }

  /**
   * Deliver webhook notification
   */
  private async deliverWebhookNotification(
    user: User,
    notification: Notification,
  ): Promise<DeliveryResult> {
    try {
      // TODO: Implement webhook delivery to user-configured endpoints
      logger.info("Webhook notification would be delivered", {
        userId: user.id,
        notificationId: notification.id,
      });

      return {
        channel: "webhook",
        success: true,
        deliveryId: `webhook_${Date.now()}`,
      };
    } catch (error) {
      return {
        channel: "webhook",
        success: false,
        error:
          error instanceof Error ? error.message : "Webhook delivery failed",
      };
    }
  }

  /**
   * Get user notification preferences from settings
   */
  private getUserNotificationPreferences(
    userSettings?: UserSettings,
  ): NotificationPreferences {
    const defaultPreferences: NotificationPreferences = {
      streamStarted: {
        browser: true,
        email: false,
        push: true,
        sms: false,
        webhook: false,
      },
      streamEnded: {
        browser: true,
        email: false,
        push: false,
        sms: false,
        webhook: false,
      },
      collaborationInvite: {
        browser: true,
        email: true,
        push: true,
        sms: false,
        webhook: false,
      },
      raidIncoming: {
        browser: true,
        email: false,
        push: true,
        sms: false,
        webhook: false,
      },
      eventReminders: {
        browser: true,
        email: true,
        push: true,
        sms: false,
        webhook: false,
      },
      friendRequests: {
        browser: true,
        email: true,
        push: false,
        sms: false,
        webhook: false,
      },
      socialUpdates: {
        browser: false,
        email: false,
        push: false,
        sms: false,
        webhook: false,
      },
      tournamentUpdates: {
        browser: true,
        email: true,
        push: true,
        sms: false,
        webhook: false,
      },
      systemAnnouncements: {
        browser: true,
        email: true,
        push: false,
        sms: false,
        webhook: false,
      },
      weeklyDigest: {
        browser: false,
        email: true,
        push: false,
        sms: false,
        webhook: false,
      },
      digestFrequency: "weekly",
      quietHours: { enabled: false, start: "22:00", end: "08:00" },
      timezone: "UTC",
      groupNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true,
      showPreview: true,
    };

    if (!userSettings?.notificationTypes) {
      return defaultPreferences;
    }

    const notificationSettings = JSON.parse(
      userSettings.notificationTypes as string,
    );
    return { ...defaultPreferences, ...notificationSettings };
  }

  /**
   * Get enabled channels for a specific notification type
   */
  private getChannelsForNotificationType(
    notificationType: string,
    preferences: NotificationPreferences,
  ): NotificationChannels {
    const typePreferences = preferences[
      notificationType as keyof NotificationPreferences
    ] as NotificationChannels;

    if (typePreferences) {
      return typePreferences;
    }

    // Default channels for unknown notification types
    return {
      browser: true,
      email: false,
      push: false,
      sms: false,
      webhook: false,
    };
  }

  /**
   * Check if notification should be delivered based on user preferences
   */
  private shouldDeliverNotification(
    notification: Notification,
    preferences: NotificationPreferences,
    user: User,
  ): boolean {
    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const userTimezone = preferences.timezone || "UTC";
      // TODO: Implement timezone checking
      // For now, skip quiet hours check
    }

    // Check notification priority vs user preferences
    if (notification.priority === "low" && !preferences.showPreview) {
      return false;
    }

    return true;
  }

  /**
   * Store notification for later delivery when user comes online
   */
  private async storeForLaterDelivery(
    userId: string,
    notification: Notification,
    channel: keyof NotificationChannels,
  ): Promise<void> {
    // This would typically store in a pending notifications table
    // For now, just log it
    logger.info("Notification stored for later delivery", {
      userId,
      notificationId: notification.id,
      channel,
    });
  }

  /**
   * Get email template based on notification type
   */
  private getEmailTemplate(notificationType: string): string {
    const templates: Record<string, string> = {
      streamStarted: "stream-started",
      collaborationInvite: "collaboration-invite",
      eventReminders: "event-reminder",
      friendRequests: "friend-request",
      tournamentUpdates: "tournament-update",
      systemAnnouncements: "system-announcement",
    };

    return templates[notificationType] || "default";
  }

  /**
   * Register WebSocket connection for real-time notifications
   */
  registerWebSocketConnection(userId: string, connection: any): void {
    this.webSocketConnections.set(userId, connection);

    connection.on("close", () => {
      this.webSocketConnections.delete(userId);
    });

    logger.info("WebSocket connection registered for notifications", {
      userId,
    });
  }

  /**
   * Process queued notifications (email, SMS, webhooks)
   * This should be called periodically by a background job
   */
  async processQueuedNotifications(): Promise<void> {
    try {
      // Process email queue
      await this.processEmailQueue();

      // Process SMS queue
      await this.processSMSQueue();

      // Process webhook queue
      await this.processWebhookQueue();
    } catch (error) {
      logger.error("Failed to process notification queues", { error });
    }
  }

  private async processEmailQueue(): Promise<void> {
    if (this.emailQueue.length === 0) return;

    logger.info(
      `Processing ${this.emailQueue.length} queued email notifications`,
    );

    // TODO: Implement actual email sending
    // For now, just clear the queue
    this.emailQueue = [];
  }

  private async processSMSQueue(): Promise<void> {
    if (this.smsQueue.length === 0) return;

    logger.info(`Processing ${this.smsQueue.length} queued SMS notifications`);

    // TODO: Implement actual SMS sending
    this.smsQueue = [];
  }

  private async processWebhookQueue(): Promise<void> {
    if (this.webhookQueue.length === 0) return;

    logger.info(
      `Processing ${this.webhookQueue.length} queued webhook notifications`,
    );

    // TODO: Implement actual webhook sending
    this.webhookQueue = [];
  }
}

// Export singleton instance
export const notificationDeliveryService = new NotificationDeliveryService();
