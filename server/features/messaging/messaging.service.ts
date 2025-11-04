import { withTransaction } from "@shared/database-unified";
import type { Notification, Message } from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../../logger";
import { storage } from "../../storage";
import type {
  NotificationFilters,
  CreateNotificationRequest,
  MessageFilters,
  SendMessageRequest,
} from "./messaging.types";

export class MessagingService {
  // Notification Management
  async getUserNotifications(userId: string, filters: NotificationFilters) {
    try {
      // Use cursor-based pagination if cursor is provided, otherwise use offset pagination
      if (filters.pagination?.cursor) {
        return await storage.getUserNotificationsWithCursor(userId, {
          unreadOnly: filters.unreadOnly,
          cursor: filters.pagination.cursor,
          limit: filters.pagination.limit || 50,
          sortField: filters.sort?.field || "createdAt",
          sortDirection: filters.sort?.direction || "desc",
        });
      } else {
        return await storage.getUserNotifications(userId, {
          unreadOnly: filters.unreadOnly,
          limit: filters.pagination?.limit || 50,
        });
      }
    } catch (error) {
      logger.error(
        "Failed to fetch notifications in MessagingService",
        toLoggableError(error),
        {
          userId,
          filters,
        },
      );
      throw error;
    }
  }

  async createNotification(
    userId: string,
    notificationData: CreateNotificationRequest,
  ): Promise<Notification> {
    try {
      const notification = await storage.createNotification({
        ...notificationData,
        data: notificationData.data
          ? JSON.stringify(notificationData.data)
          : undefined,
        userId,
      });

      logger.info("Notification created", {
        userId,
        type: notificationData.type,
        notificationId: notification.id,
      });
      return notification;
    } catch (error) {
      logger.error(
        "Failed to create notification in MessagingService",
        toLoggableError(error),
        {
          userId,
        },
      );
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await storage.markNotificationAsRead(notificationId);
      logger.info("Notification marked as read", { notificationId });
    } catch (error) {
      logger.error(
        "Failed to mark notification as read in MessagingService",
        toLoggableError(error),
        { notificationId },
      );
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await storage.markAllNotificationsAsRead(userId);
      logger.info("All notifications marked as read", { userId });
    } catch (error) {
      logger.error(
        "Failed to mark all notifications as read in MessagingService",
        toLoggableError(error),
        { userId },
      );
      throw error;
    }
  }

  // Message Management
  async getUserMessages(userId: string, filters: MessageFilters) {
    try {
      // Use cursor-based pagination if cursor is provided, otherwise use offset pagination
      if (filters.pagination?.cursor) {
        return await storage.getUserMessagesWithCursor(userId, {
          eventId: filters.eventId,
          communityId: filters.communityId,
          conversationId: filters.conversationId,
          unreadOnly: filters.unreadOnly,
          cursor: filters.pagination.cursor,
          limit: filters.pagination.limit || 50,
          sortField: filters.sort?.field || "createdAt",
          sortDirection: filters.sort?.direction || "desc",
        });
      } else {
        return await storage.getUserMessages(userId, {
          eventId: filters.eventId,
          communityId: filters.communityId,
          limit: filters.pagination?.limit || 50,
        });
      }
    } catch (error) {
      logger.error(
        "Failed to fetch messages in MessagingService",
        toLoggableError(error),
        {
          userId,
          filters,
        },
      );
      throw error;
    }
  }

  async sendMessage(
    userId: string,
    messageData: SendMessageRequest,
  ): Promise<Message> {
    try {
      // Use transaction to ensure message and notification are created atomically
      const result = await withTransaction(async (tx) => {
        // First, create the message
        const message = await storage.sendMessageWithTransaction(tx, {
          ...messageData,
          senderId: userId,
        });

        // Then, create a notification for the recipient (if different from sender)
        if (messageData.recipientId && messageData.recipientId !== userId) {
          await storage.createNotificationWithTransaction(tx, {
            userId: messageData.recipientId,
            type: "message",
            title: "New Message",
            message: `You received a new message from a user`,
            data: JSON.stringify({
              messageId: message.id,
              senderId: userId,
              messageType: messageData.type,
              conversationId: `${userId}-${messageData.recipientId}`,
            }),
            priority: "normal",
          });
        }

        return message;
      }, "send-message-with-notification");

      logger.info("Message sent with notification", {
        senderId: userId,
        recipientId: messageData.recipientId,
        messageId: result.id,
      });

      return result;
    } catch (error) {
      logger.error(
        "Failed to send message in MessagingService",
        toLoggableError(error),
        {
          userId,
          messageData,
        },
      );
      throw error;
    }
  }

  // Conversation Management
  async getConversation(currentUserId: string, targetUserId: string) {
    try {
      return await storage.getConversation(currentUserId, targetUserId);
    } catch (error) {
      logger.error(
        "Failed to fetch conversation in MessagingService",
        toLoggableError(error),
        {
          currentUserId,
          targetUserId,
        },
      );
      throw error;
    }
  }
}

export const messagingService = new MessagingService();
