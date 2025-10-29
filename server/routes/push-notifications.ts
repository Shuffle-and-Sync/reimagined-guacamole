/**
 * Push notification subscription management routes
 */

import { Router } from "express";
import { logger } from "../logger";
import { pushNotificationService } from "../services/push-notification.service";

const router = Router();

/**
 * Subscribe to push notifications
 * POST /api/push/subscribe
 */
router.post("/subscribe", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { subscription, deviceInfo } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        error:
          "Invalid subscription data. Must include endpoint and keys (p256dh, auth)",
      });
    }

    const userAgent = req.headers["user-agent"];

    const result = await pushNotificationService.subscribe(
      userId,
      subscription,
      userAgent,
      deviceInfo,
    );

    if (result.success) {
      return res.json({
        success: true,
        subscriptionId: result.subscriptionId,
        message: "Successfully subscribed to push notifications",
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to subscribe",
      });
    }
  } catch (error) {
    logger.error("Push subscription endpoint error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

/**
 * Unsubscribe from push notifications
 * POST /api/push/unsubscribe
 */
router.post("/unsubscribe", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        error: "Endpoint is required",
      });
    }

    const result = await pushNotificationService.unsubscribe(userId, endpoint);

    if (result.success) {
      return res.json({
        success: true,
        message: "Successfully unsubscribed from push notifications",
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to unsubscribe",
      });
    }
  } catch (error) {
    logger.error("Push unsubscribe endpoint error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

/**
 * Get user's active push subscriptions
 * GET /api/push/subscriptions
 */
router.get("/subscriptions", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const subscriptions =
      await pushNotificationService.getUserSubscriptions(userId);

    // Don't send sensitive keys to client
    const sanitizedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      endpoint: sub.endpoint,
      userAgent: sub.userAgent,
      deviceInfo: sub.deviceInfo,
      createdAt: sub.createdAt,
      lastUsed: sub.lastUsed,
      isActive: sub.isActive,
    }));

    return res.json({
      subscriptions: sanitizedSubscriptions,
    });
  } catch (error) {
    logger.error("Get subscriptions endpoint error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

/**
 * Get VAPID public key for client-side subscription
 * GET /api/push/vapid-public-key
 */
router.get("/vapid-public-key", (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return res.status(503).json({
      error: "Push notifications not configured",
    });
  }

  return res.json({
    publicKey,
  });
});

/**
 * Send test push notification (for testing purposes)
 * POST /api/push/test
 */
router.post("/test", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pushNotificationService.sendToUser(userId, {
      title: "Test Notification",
      body: "This is a test push notification from Shuffle & Sync!",
      icon: "/icons/notification-icon-192x192.png",
      badge: "/icons/notification-badge-96x96.png",
      tag: "test",
      data: {
        type: "test",
        url: "/notifications",
      },
    });

    return res.json({
      success: result.success,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      message: `Test notification sent to ${result.sentCount} device(s)`,
    });
  } catch (error) {
    logger.error("Test push notification error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default router;
