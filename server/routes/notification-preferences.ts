import { Router, type Request, type Response } from "express";
import { enhancedNotificationService } from "../services/enhanced-notification";
import {
  requireAuth as isAuthenticated,
  type AuthenticatedRequest,
} from "../auth/auth.middleware";

// Helper function to get user ID from authenticated request
function getAuthUserId(req: AuthenticatedRequest): string {
  if (!req.user?.id) {
    throw new Error("User not authenticated");
  }
  return req.user.id;
}
import { logger } from "../logger";

const router = Router();

/**
 * Get user notification preferences
 */
router.get("/", isAuthenticated, async (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    const userId = getAuthUserId(authenticatedReq);
    const preferences =
      await enhancedNotificationService.getNotificationPreferences(userId);

    return res.json(preferences);
  } catch (error) {
    logger.error("Failed to get notification preferences", {
      error,
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Update user notification preferences
 */
router.put("/", isAuthenticated, async (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;

  try {
    const userId = getAuthUserId(authenticatedReq);
    const preferences = req.body;

    await enhancedNotificationService.updateNotificationPreferences(
      userId,
      preferences,
    );

    return res.json({
      success: true,
      message: "Notification preferences updated",
    });
  } catch (error) {
    logger.error("Failed to update notification preferences", {
      error,
      userId: getAuthUserId(authenticatedReq),
      preferences: req.body,
    });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Test notification delivery (development only)
 */
router.post("/test", isAuthenticated, async (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;

  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ message: "Not available in production" });
  }

  try {
    const userId = getAuthUserId(authenticatedReq);
    const { type, context, options } = req.body;

    const result = await enhancedNotificationService.sendNotification(
      userId,
      type || "systemAnnouncements",
      context || {
        title: "Test Notification",
        message:
          "This is a test notification from the enhanced notification system.",
      },
      options,
    );

    return res.json({
      success: true,
      notification: result.notification,
      deliveryResults: result.deliveryResults,
    });
  } catch (error) {
    logger.error("Failed to send test notification", {
      error,
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Send system announcement (admin only)
 */
router.post(
  "/announcement",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;

    try {
      const {
        title,
        message,
        userIds,
        priority,
        actionUrl,
        actionText,
        communityId,
      } = req.body;

      if (!title || !message || !userIds || !Array.isArray(userIds)) {
        return res
          .status(400)
          .json({
            message: "Missing required fields: title, message, userIds",
          });
      }

      await enhancedNotificationService.sendSystemAnnouncement(
        userIds,
        title,
        message,
        {
          priority,
          actionUrl,
          actionText,
          communityId,
        },
      );

      return res.json({
        success: true,
        message: `System announcement sent to ${userIds.length} users`,
      });
    } catch (error) {
      logger.error("Failed to send system announcement", {
        error,
        userId: getAuthUserId(authenticatedReq),
      });
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * Trigger weekly digest processing (admin only)
 */
router.post(
  "/digest/weekly",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;

    try {
      // This would typically be restricted to admin users
      await enhancedNotificationService.sendWeeklyDigests();

      return res.json({
        success: true,
        message: "Weekly digest processing started",
      });
    } catch (error) {
      logger.error("Failed to trigger weekly digest", {
        error,
        userId: getAuthUserId(authenticatedReq),
      });
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * Register WebSocket connection for real-time notifications
 */
router.post(
  "/websocket/register",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;

    try {
      const userId = getAuthUserId(authenticatedReq);
      const { connectionId } = req.body;

      // In a real implementation, you would associate the connection ID with the WebSocket
      // For now, just log the registration
      logger.info("WebSocket connection registered for notifications", {
        userId,
        connectionId,
      });

      return res.json({
        success: true,
        message: "WebSocket connection registered",
      });
    } catch (error) {
      logger.error("Failed to register WebSocket connection", {
        error,
        userId: getAuthUserId(authenticatedReq),
      });
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default router;
