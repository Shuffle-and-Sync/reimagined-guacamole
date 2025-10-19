import { Router } from "express";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import { messagingService } from "./messaging.service";
import { logger } from "../../logger";
import { dbUtils } from "../../utils/database.utils";
import { assertRouteParam } from "../../shared/utils";

const router = Router();

// Notification Routes
router.get("/", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const user = authenticatedReq.user as any;
    const userId = getAuthUserId(authenticatedReq);

    // Parse pagination and filter parameters
    const { page, limit, cursor, sort } = dbUtils.parsePaginationQuery(
      req.query,
    );
    const { unreadOnly } = req.query;

    const notifications = await messagingService.getUserNotifications(userId, {
      unreadOnly: unreadOnly === "true",
      pagination: { page, limit, cursor },
      sort,
    });

    res.json(notifications);
  } catch (error) {
    logger.error("Failed to fetch notifications", error, {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const user = authenticatedReq.user as any;
    const userId = getAuthUserId(authenticatedReq);
    const notification = await messagingService.createNotification(
      userId,
      req.body,
    );
    res.status(201).json(notification);
  } catch (error) {
    logger.error("Failed to create notification", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/read", isAuthenticated, async (req, res) => {
  try {
    const id = assertRouteParam(req.params.id, "id");
    await messagingService.markNotificationAsRead(id);
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to mark notification as read", error, {
      notificationId: req.params.id,
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/read-all", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const user = authenticatedReq.user as any;
    const userId = getAuthUserId(authenticatedReq);
    await messagingService.markAllNotificationsAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to mark all notifications as read", error, {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

export { router as notificationsRoutes };

// Separate router for messages (mounted at /api/messages)
export const messagesRouter = Router();

messagesRouter.get("/", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const user = authenticatedReq.user as any;
    const userId = getAuthUserId(authenticatedReq);

    // Parse pagination and filter parameters
    const { page, limit, cursor, sort } = dbUtils.parsePaginationQuery(
      req.query,
    );
    const { eventId, communityId, conversationId, unreadOnly } = req.query;

    const messages = await messagingService.getUserMessages(userId, {
      eventId: eventId as string,
      communityId: communityId as string,
      conversationId: conversationId as string,
      unreadOnly: unreadOnly === "true",
      pagination: { page, limit, cursor },
      sort,
    });

    res.json(messages);
  } catch (error) {
    logger.error("Failed to fetch messages", error, {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

messagesRouter.post("/", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const user = authenticatedReq.user as any;
    const userId = getAuthUserId(authenticatedReq);
    const message = await messagingService.sendMessage(userId, req.body);
    res.status(201).json(message);
  } catch (error) {
    logger.error("Failed to send message", error, {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

// Separate router for conversations (mounted at /api/conversations)
export const conversationsRouter = Router();

conversationsRouter.get("/:userId", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const user = authenticatedReq.user as any;
    const userId = assertRouteParam(req.params.userId, "userId");

    const currentUserId = getAuthUserId(authenticatedReq);
    const conversation = await messagingService.getConversation(
      currentUserId,
      userId,
    );
    res.json(conversation);
  } catch (error) {
    logger.error("Failed to fetch conversation", error, {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Internal server error" });
  }
});
