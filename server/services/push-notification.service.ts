/**
 * Push Notification Service using Web Push API
 * Handles browser push notifications for real-time user engagement
 */

import { eq, and } from "drizzle-orm";
import webPush from "web-push";
import { db } from "@shared/database-unified";
import { pushSubscriptions } from "@shared/schema";
import { logger } from "../logger";

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Service for managing web push notifications
 */
export class PushNotificationService {
  private configured = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Web Push with VAPID keys
   */
  private initialize(): void {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject =
      process.env.VAPID_SUBJECT || "mailto:admin@shuffleandsync.com";

    if (!vapidPublicKey || !vapidPrivateKey) {
      logger.warn(
        "VAPID keys not configured - push notifications will be disabled",
      );
      return;
    }

    try {
      webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      this.configured = true;
      logger.info("Web Push configured successfully");
    } catch (error) {
      logger.error("Failed to configure Web Push", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if push notifications are configured
   */
  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribe(
    userId: string,
    subscription: PushSubscription,
    userAgent?: string,
    deviceInfo?: any,
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      // Check if subscription already exists
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
        .limit(1);

      if (existing.length > 0) {
        // Update existing subscription
        await db
          .update(pushSubscriptions)
          .set({
            userId,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            userAgent,
            deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
            isActive: true,
            lastUsed: new Date(),
          })
          .where(eq(pushSubscriptions.endpoint, subscription.endpoint));

        logger.info("Push subscription updated", {
          userId,
          endpoint: subscription.endpoint,
        });

        return { success: true, subscriptionId: existing[0]?.id };
      }

      // Create new subscription
      const subscriptionId = crypto.randomUUID();
      await db.insert(pushSubscriptions).values({
        id: subscriptionId,
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        isActive: true,
        createdAt: new Date(),
        lastUsed: new Date(),
        expiresAt: null,
      });

      logger.info("Push subscription created", {
        userId,
        subscriptionId,
        endpoint: subscription.endpoint,
      });

      return { success: true, subscriptionId };
    } catch (error) {
      logger.error("Failed to subscribe to push notifications", {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Subscription failed",
      };
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(
    userId: string,
    endpoint: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, userId),
            eq(pushSubscriptions.endpoint, endpoint),
          ),
        );

      logger.info("Push subscription deleted", { userId, endpoint });
      return { success: true };
    } catch (error) {
      logger.error("Failed to unsubscribe from push notifications", {
        error: error instanceof Error ? error.message : String(error),
        userId,
        endpoint,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unsubscribe failed",
      };
    }
  }

  /**
   * Get all active subscriptions for a user
   */
  async getUserSubscriptions(userId: string): Promise<any[]> {
    try {
      const subs = await db
        .select()
        .from(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, userId),
            eq(pushSubscriptions.isActive, true),
          ),
        );

      return subs;
    } catch (error) {
      logger.error("Failed to get user subscriptions", {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return [];
    }
  }

  /**
   * Send push notification to a user
   */
  async sendToUser(
    userId: string,
    payload: PushNotificationPayload,
  ): Promise<{ success: boolean; sentCount: number; failedCount: number }> {
    if (!this.configured) {
      logger.warn("Push notifications not configured - cannot send", {
        userId,
      });
      return { success: false, sentCount: 0, failedCount: 0 };
    }

    try {
      const subscriptions = await this.getUserSubscriptions(userId);

      if (subscriptions.length === 0) {
        logger.info("No push subscriptions found for user", { userId });
        return { success: true, sentCount: 0, failedCount: 0 };
      }

      const results = await Promise.allSettled(
        subscriptions.map((sub) => this.sendToSubscription(sub, payload)),
      );

      let sentCount = 0;
      let failedCount = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value.success) {
          sentCount++;
        } else {
          failedCount++;
          // If subscription is invalid, mark it as inactive
          if (
            result.status === "rejected" ||
            (result.status === "fulfilled" && !result.value.success)
          ) {
            const subscription = subscriptions[index];
            if (subscription) {
              this.markSubscriptionInactive(subscription.id).catch((error) => {
                logger.error("Failed to mark subscription inactive", {
                  error,
                  subscriptionId: subscription.id,
                });
              });
            }
          }
        }
      });

      logger.info("Push notifications sent", {
        userId,
        sentCount,
        failedCount,
      });

      return { success: true, sentCount, failedCount };
    } catch (error) {
      logger.error("Failed to send push notifications to user", {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return { success: false, sentCount: 0, failedCount: 0 };
    }
  }

  /**
   * Send push notification to a specific subscription
   */
  private async sendToSubscription(
    subscription: any,
    payload: PushNotificationPayload,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const pushSubscription: webPush.PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      const notificationPayload = JSON.stringify(payload);

      await webPush.sendNotification(pushSubscription, notificationPayload);

      // Update last used timestamp
      await db
        .update(pushSubscriptions)
        .set({ lastUsed: new Date() })
        .where(eq(pushSubscriptions.id, subscription.id));

      return { success: true };
    } catch (error: any) {
      logger.error("Failed to send push notification to subscription", {
        error: error instanceof Error ? error.message : String(error),
        subscriptionId: subscription.id,
        statusCode: error?.statusCode,
      });

      // Check if subscription is invalid (410 Gone means subscription expired)
      if (error?.statusCode === 410 || error?.statusCode === 404) {
        await this.markSubscriptionInactive(subscription.id);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Send failed",
      };
    }
  }

  /**
   * Mark subscription as inactive
   */
  private async markSubscriptionInactive(
    subscriptionId: string,
  ): Promise<void> {
    try {
      await db
        .update(pushSubscriptions)
        .set({ isActive: false })
        .where(eq(pushSubscriptions.id, subscriptionId));

      logger.info("Subscription marked as inactive", { subscriptionId });
    } catch (error) {
      logger.error("Failed to mark subscription as inactive", {
        error: error instanceof Error ? error.message : String(error),
        subscriptionId,
      });
    }
  }

  /**
   * Clean up expired or inactive subscriptions
   */
  async cleanupSubscriptions(): Promise<{ deletedCount: number }> {
    try {
      // Delete subscriptions that have been inactive for more than 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await db.delete(pushSubscriptions).where(
        and(
          eq(pushSubscriptions.isActive, false),
          // Note: This comparison might need adjustment based on your DB
        ),
      );

      logger.info("Push subscriptions cleaned up", {
        deletedCount: result.changes || 0,
      });

      return { deletedCount: result.changes || 0 };
    } catch (error) {
      logger.error("Failed to cleanup subscriptions", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { deletedCount: 0 };
    }
  }

  /**
   * Generate VAPID keys (for initial setup)
   * This should be run once and the keys stored as environment variables
   */
  static generateVapidKeys(): {
    publicKey: string;
    privateKey: string;
  } {
    const vapidKeys = webPush.generateVAPIDKeys();
    return {
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey,
    };
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
