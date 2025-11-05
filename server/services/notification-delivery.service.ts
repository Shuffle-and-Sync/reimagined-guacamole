import sgMail from "@sendgrid/mail";
import type { Notification, UserSettings, User } from "@shared/schema";
import { logger } from "../logger";
import { storage } from "../storage";
import {
  emailTemplatesService,
  type EmailTemplateData,
} from "./email-templates";
import {
  pushNotificationService,
  type PushNotificationPayload,
} from "./push-notification.service";

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

interface EmailQueueItem {
  to: string;
  userId: string;
  notificationId: string;
  notificationType: string;
  data: EmailTemplateData;
  retryCount: number;
  createdAt: Date;
}

/**
 * Enhanced notification delivery service with multi-channel support
 */
export class NotificationDeliveryService {
  private webSocketConnections = new Map<string, any>(); // WebSocket connections per user
  private emailQueue: EmailQueueItem[] = []; // Email delivery queue
  private smsQueue: unknown[] = []; // SMS delivery queue
  private webhookQueue: unknown[] = []; // Webhook delivery queue
  private sendGridConfigured = false;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly BATCH_SIZE = 100;

  constructor() {
    // Initialize SendGrid if API key is available
    if (process.env.SENDGRID_API_KEY) {
      try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.sendGridConfigured = true;
        logger.info("SendGrid configured successfully");
      } catch (error) {
        logger.error("Failed to configure SendGrid", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      logger.warn(
        "SENDGRID_API_KEY not set - email notifications will be queued but not sent",
      );
    }
  }

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
      if (!user.email) {
        logger.warn("User has no email address", { userId: user.id });
        return {
          channel: "email",
          success: false,
          error: "User has no email address",
        };
      }

      // Build email template data
      const templateData = this.buildEmailTemplateData(user, notification);

      // Add to queue for batch processing
      this.emailQueue.push({
        to: user.email,
        userId: user.id,
        notificationId: notification.id,
        notificationType: notification.type,
        data: templateData,
        retryCount: 0,
        createdAt: new Date(),
      });

      logger.info("Email notification queued", {
        userId: user.id,
        email: user.email,
        notificationId: notification.id,
        queueSize: this.emailQueue.length,
      });

      // Process immediately if not configured (for testing) or if SendGrid is available
      if (this.sendGridConfigured) {
        // Process queue in background (don't await to avoid blocking)
        this.processEmailQueue().catch((error) => {
          logger.error("Background email processing failed", { error });
        });
      }

      return {
        channel: "email",
        success: true,
        deliveryId: `email_${Date.now()}_${user.id}`,
      };
    } catch (error) {
      logger.error("Failed to queue email notification", {
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
        notificationId: notification.id,
      });
      return {
        channel: "email",
        success: false,
        error: error instanceof Error ? error.message : "Email delivery failed",
      };
    }
  }

  /**
   * Build email template data from notification
   */
  private buildEmailTemplateData(
    user: User,
    notification: Notification,
  ): EmailTemplateData {
    const baseUrl = process.env.AUTH_URL || "https://shuffleandsync.com";
    const unsubscribeUrl = `${baseUrl}/settings/notifications`;

    // Parse notification data if it's a string
    let notificationData: any = {};
    if (notification.data) {
      if (typeof notification.data === "string") {
        try {
          notificationData = JSON.parse(notification.data);
        } catch {
          notificationData = {};
        }
      } else {
        notificationData = notification.data;
      }
    }

    // Build template data based on notification type
    const templateData: EmailTemplateData = {
      userName: user.firstName || user.username || "there",
      baseUrl,
      unsubscribeUrl,
      ...notificationData,
    };

    return templateData;
  }

  /**
   * Send email via SendGrid with retry logic
   */
  private async sendEmailWithRetry(
    item: EmailQueueItem,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.sendGridConfigured) {
      return { success: false, error: "SendGrid not configured" };
    }

    try {
      // Generate email template
      const emailTemplate = emailTemplatesService.getTemplate(
        item.notificationType,
        item.data,
      );

      const senderEmail =
        process.env.SENDGRID_SENDER || "noreply@shuffleandsync.com";

      // Send via SendGrid
      const msg = {
        to: item.to,
        from: {
          email: senderEmail,
          name: "Shuffle & Sync",
        },
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
        customArgs: {
          notification_id: item.notificationId,
          user_id: item.userId,
          notification_type: item.notificationType,
        },
      };

      await sgMail.send(msg);

      logger.info("Email sent successfully via SendGrid", {
        to: item.to,
        userId: item.userId,
        notificationId: item.notificationId,
        notificationType: item.notificationType,
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage =
        error?.response?.body?.errors?.[0]?.message ||
        error?.message ||
        "Unknown error";

      logger.error("SendGrid email delivery failed", {
        error: errorMessage,
        to: item.to,
        userId: item.userId,
        notificationId: item.notificationId,
        retryCount: item.retryCount,
        statusCode: error?.code || error?.response?.statusCode,
      });

      // Determine if we should retry
      const shouldRetry =
        item.retryCount < this.MAX_RETRY_ATTEMPTS &&
        this.isRetryableError(error);

      if (shouldRetry) {
        // Exponential backoff: 2s, 4s, 8s
        const delayMs = Math.pow(2, item.retryCount + 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        item.retryCount++;
        return this.sendEmailWithRetry(item);
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const statusCode = error?.code || error?.response?.statusCode;

    // Retry on temporary errors (5xx, rate limits, timeouts)
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(statusCode);
  }

  /**
   * Send batch of emails via SendGrid
   */
  private async sendBatchEmails(
    items: EmailQueueItem[],
  ): Promise<Array<{ success: boolean; error?: string }>> {
    if (!this.sendGridConfigured || items.length === 0) {
      return items.map(() => ({
        success: false,
        error: "SendGrid not configured",
      }));
    }

    try {
      // Prepare batch messages
      const messages = items.map((item) => {
        const emailTemplate = emailTemplatesService.getTemplate(
          item.notificationType,
          item.data,
        );

        const senderEmail =
          process.env.SENDGRID_SENDER || "noreply@shuffleandsync.com";

        return {
          to: item.to,
          from: {
            email: senderEmail,
            name: "Shuffle & Sync",
          },
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
          trackingSettings: {
            clickTracking: { enable: true },
            openTracking: { enable: true },
          },
          customArgs: {
            notification_id: item.notificationId,
            user_id: item.userId,
            notification_type: item.notificationType,
          },
        };
      });

      // Send batch
      await sgMail.send(messages);

      logger.info("Batch emails sent successfully", {
        count: items.length,
      });

      return items.map(() => ({ success: true }));
    } catch (error: any) {
      logger.error("Batch email sending failed", {
        error: error?.message || String(error),
        count: items.length,
      });

      // Fall back to individual sending
      return Promise.all(items.map((item) => this.sendEmailWithRetry(item)));
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
      if (!pushNotificationService.isConfigured()) {
        logger.warn("Push notifications not configured", {
          userId,
          notificationId: notification.id,
        });
        return {
          channel: "push",
          success: false,
          error: "Push notifications not configured",
        };
      }

      // Build push notification payload
      const payload = this.buildPushNotificationPayload(notification);

      // Send to all user's active subscriptions
      const result = await pushNotificationService.sendToUser(userId, payload);

      if (result.sentCount === 0 && result.failedCount === 0) {
        // No subscriptions found
        logger.info("No push subscriptions found for user", {
          userId,
          notificationId: notification.id,
        });
        return {
          channel: "push",
          success: true,
          deliveryId: `push_none_${Date.now()}`,
        };
      }

      logger.info("Push notification delivered", {
        userId,
        notificationId: notification.id,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
      });

      return {
        channel: "push",
        success: result.sentCount > 0,
        deliveryId: `push_${Date.now()}_${userId}`,
      };
    } catch (error) {
      logger.error("Failed to deliver push notification", {
        error: error instanceof Error ? error.message : String(error),
        userId,
        notificationId: notification.id,
      });
      return {
        channel: "push",
        success: false,
        error: error instanceof Error ? error.message : "Push delivery failed",
      };
    }
  }

  /**
   * Build push notification payload from notification
   */
  private buildPushNotificationPayload(
    notification: Notification,
  ): PushNotificationPayload {
    const baseUrl = process.env.AUTH_URL || "https://shuffleandsync.com";

    // Parse notification data if it's a string
    let notificationData: any = {};
    if (notification.data) {
      if (typeof notification.data === "string") {
        try {
          notificationData = JSON.parse(notification.data);
        } catch {
          notificationData = {};
        }
      } else {
        notificationData = notification.data;
      }
    }

    // Build payload with icon and badge
    const payload: PushNotificationPayload = {
      title: notification.title,
      body: notification.message || "",
      icon: `${baseUrl}/icons/notification-icon-192x192.png`,
      badge: `${baseUrl}/icons/notification-badge-96x96.png`,
      tag: notification.type,
      requireInteraction: notification.priority === "urgent",
      silent: notification.priority === "low",
      data: {
        notificationId: notification.id,
        type: notification.type,
        url: notification.actionUrl || "/notifications",
        ...notificationData,
      },
    };

    // Add action button if actionUrl and actionText are provided
    if (notification.actionUrl && notification.actionText) {
      payload.actions = [
        {
          action: "view",
          title: notification.actionText,
        },
      ];
    }

    return payload;
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
    _user: User,
  ): boolean {
    // Check quiet hours
    if (preferences.quietHours.enabled) {
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
   * Unused but kept for potential future email integration
   */
  // private getEmailTemplate(notificationType: string): string {
  //   const templates: Record<string, string> = {
  //     streamStarted: "stream-started",
  //     collaborationInvite: "collaboration-invite",
  //     eventReminders: "event-reminder",
  //     friendRequests: "friend-request",
  //     tournamentUpdates: "tournament-update",
  //     systemAnnouncements: "system-announcement",
  //   };
  //
  //   return templates[notificationType] || "default";
  // }

  /**
   * Register WebSocket connection for real-time notifications
   */
  registerWebSocketConnection(userId: string, connection: unknown): void {
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

    // Process in batches
    while (this.emailQueue.length > 0) {
      const batch = this.emailQueue.splice(0, this.BATCH_SIZE);

      try {
        // Use batch sending for efficiency
        if (batch.length > 1) {
          await this.sendBatchEmails(batch);
        } else {
          // Single email
          await this.sendEmailWithRetry(batch[0] as EmailQueueItem);
        }
      } catch (error) {
        logger.error("Email queue batch processing failed", {
          error: error instanceof Error ? error.message : String(error),
          batchSize: batch.length,
        });

        // Re-queue failed items with increased retry count
        batch.forEach((item) => {
          const emailItem = item as EmailQueueItem;
          if (emailItem.retryCount < this.MAX_RETRY_ATTEMPTS) {
            emailItem.retryCount++;
            this.emailQueue.push(emailItem);
          } else {
            logger.error("Email delivery permanently failed", {
              to: emailItem.to,
              notificationId: emailItem.notificationId,
            });
          }
        });
      }
    }

    logger.info("Email queue processing completed");
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
