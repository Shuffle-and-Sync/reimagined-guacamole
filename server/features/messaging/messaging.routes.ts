import { Router } from "express";
import { toLoggableError } from "@shared/utils/type-guards";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import { logger } from "../../logger";
import {
  cacheStrategies,
  cacheInvalidation,
} from "../../middleware/cache.middleware";
import { assertRouteParam } from "../../shared/utils";
import { dbUtils } from "../../utils/database.utils";
import { messagingService } from "./messaging.service";

const router = Router();

// Notification Routes
router.get(
  "/",
  isAuthenticated,
  cacheStrategies.shortLived(),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);

      // Parse pagination and filter parameters
      const { page, limit, cursor, sort } = dbUtils.parsePaginationQuery(
        req.query,
      );
      const { unreadOnly } = req.query;

      // Warn if using offset pagination
      if (page && !cursor) {
        logger.warn("Using offset pagination on notifications endpoint", {
          endpoint: "/api/notifications",
          page,
          userId,
        });

        res.setHeader(
          "X-Pagination-Warning",
          "Offset pagination may have performance issues. Consider using cursor-based pagination.",
        );
      }

      const notifications = await messagingService.getUserNotifications(
        userId,
        {
          unreadOnly: unreadOnly === "true",
          pagination: { page, limit, cursor },
          sort,
        },
      );

      res.json(notifications);
    } catch (error) {
      logger.error("Failed to fetch notifications", toLoggableError(error), {
        userId: getAuthUserId(authenticatedReq),
      });
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

router.post("/", isAuthenticated, cacheInvalidation.all(), async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const notification = await messagingService.createNotification(
      userId,
      req.body,
    );
    res.status(201).json(notification);
  } catch (error) {
    logger.error("Failed to create notification", toLoggableError(error));
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch(
  "/:id/read",
  isAuthenticated,
  cacheInvalidation.all(),
  async (req, res) => {
    try {
      const id = assertRouteParam(req.params.id, "id");
      await messagingService.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      logger.error(
        "Failed to mark notification as read",
        toLoggableError(error),
        {
          notificationId: req.params.id,
        },
      );
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

router.patch(
  "/read-all",
  isAuthenticated,
  cacheInvalidation.all(),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      await messagingService.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      logger.error(
        "Failed to mark all notifications as read",
        toLoggableError(error),
        {
          userId: getAuthUserId(authenticatedReq),
        },
      );
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { router as notificationsRoutes };

// Separate router for messages (mounted at /api/messages)
export const messagesRouter = Router();

messagesRouter.get("/", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);

    // Parse pagination and filter parameters
    const { page, limit, cursor, sort } = dbUtils.parsePaginationQuery(
      req.query,
    );
    const { eventId, communityId, conversationId, unreadOnly } = req.query;

    // Warn if using offset pagination on potentially large dataset
    if (page && !cursor) {
      logger.warn("Using offset pagination on messages endpoint", {
        endpoint: "/api/messages",
        page,
        userId,
      });

      // Add deprecation warning header
      res.setHeader(
        "X-Pagination-Warning",
        "Offset pagination is deprecated for messages. Use cursor-based pagination for better performance.",
      );
    }

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
    logger.error("Failed to fetch messages", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

messagesRouter.post(
  "/",
  isAuthenticated,
  cacheInvalidation.all(),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const message = await messagingService.sendMessage(userId, req.body);
      res.status(201).json(message);
    } catch (error) {
      logger.error("Failed to send message", toLoggableError(error), {
        userId: getAuthUserId(authenticatedReq),
      });
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Separate router for conversations (mounted at /api/conversations)
export const conversationsRouter = Router();

conversationsRouter.get("/:userId", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = assertRouteParam(req.params.userId, "userId");

    const currentUserId = getAuthUserId(authenticatedReq);
    const conversation = await messagingService.getConversation(
      currentUserId,
      userId,
    );
    res.json(conversation);
  } catch (error) {
    logger.error("Failed to fetch conversation", toLoggableError(error), {
      userId: getAuthUserId(authenticatedReq),
    });
    res.status(500).json({ message: "Internal server error" });
  }
});
