import { Router } from "express";
import { isAuthenticated } from "../../replitAuth";
import { messagingService } from "./messaging.service";
import { logger } from "../../logger";
import { AuthenticatedRequest } from "../../types";

const router = Router();

// Notification Routes
router.get('/', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const user = authenticatedReq.user as any;
    const { unreadOnly, limit } = req.query;
    
    const notifications = await messagingService.getUserNotifications(user.claims.sub, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit as string) : undefined,
    });
    
    res.json(notifications);
  } catch (error) {
    logger.error("Failed to fetch notifications", error, { userId: authenticatedReq.user.claims.sub });
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const user = authenticatedReq.user as any;
    const notification = await messagingService.createNotification(user.claims.sub, req.body);
    res.status(201).json(notification);
  } catch (error) {
    logger.error("Failed to create notification", error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id/read', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await messagingService.markNotificationAsRead(id);
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to mark notification as read", error, { notificationId: req.params.id });
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/read-all', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const user = authenticatedReq.user as any;
    await messagingService.markAllNotificationsAsRead(user.claims.sub);
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to mark all notifications as read", error, { userId: authenticatedReq.user.claims.sub });
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as notificationsRoutes };

// Separate router for messages (mounted at /api/messages)
export const messagesRouter = Router();

messagesRouter.get('/', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const user = authenticatedReq.user as any;
    const { eventId, communityId, limit } = req.query;
    
    const messages = await messagingService.getUserMessages(user.claims.sub, {
      eventId: eventId as string,
      communityId: communityId as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    
    res.json(messages);
  } catch (error) {
    logger.error("Failed to fetch messages", error, { userId: authenticatedReq.user.claims.sub });
    res.status(500).json({ message: 'Internal server error' });
  }
});

messagesRouter.post('/', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const user = authenticatedReq.user as any;
    const message = await messagingService.sendMessage(user.claims.sub, req.body);
    res.status(201).json(message);
  } catch (error) {
    logger.error("Failed to send message", error, { userId: authenticatedReq.user.claims.sub });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Separate router for conversations (mounted at /api/conversations)
export const conversationsRouter = Router();

conversationsRouter.get('/:userId', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const user = authenticatedReq.user as any;
    const { userId } = req.params;
    
    const conversation = await messagingService.getConversation(user.claims.sub, userId);
    res.json(conversation);
  } catch (error) {
    logger.error("Failed to fetch conversation", error, { userId: authenticatedReq.user.claims.sub });
    res.status(500).json({ message: 'Internal server error' });
  }
});