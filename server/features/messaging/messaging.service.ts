import { storage } from "../../storage";
import { logger } from "../../logger";
import type { Notification, Message } from "@shared/schema";
import type { 
  NotificationFilters, 
  CreateNotificationRequest, 
  MessageFilters,
  SendMessageRequest
} from "./messaging.types";

export class MessagingService {
  // Notification Management
  async getUserNotifications(userId: string, filters: NotificationFilters) {
    try {
      return await storage.getUserNotifications(userId, {
        unreadOnly: filters.unreadOnly,
        limit: filters.limit,
      });
    } catch (error) {
      logger.error("Failed to fetch notifications in MessagingService", error, { userId, filters });
      throw error;
    }
  }

  async createNotification(userId: string, notificationData: CreateNotificationRequest): Promise<Notification> {
    try {
      const notification = await storage.createNotification({
        ...notificationData,
        userId,
      });
      
      logger.info("Notification created", { 
        userId, 
        type: notificationData.type, 
        notificationId: notification.id 
      });
      return notification;
    } catch (error) {
      logger.error("Failed to create notification in MessagingService", error, { userId });
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await storage.markNotificationAsRead(notificationId);
      logger.info("Notification marked as read", { notificationId });
    } catch (error) {
      logger.error("Failed to mark notification as read in MessagingService", error, { notificationId });
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await storage.markAllNotificationsAsRead(userId);
      logger.info("All notifications marked as read", { userId });
    } catch (error) {
      logger.error("Failed to mark all notifications as read in MessagingService", error, { userId });
      throw error;
    }
  }

  // Message Management
  async getUserMessages(userId: string, filters: MessageFilters) {
    try {
      return await storage.getUserMessages(userId, {
        eventId: filters.eventId,
        communityId: filters.communityId,
        limit: filters.limit,
      });
    } catch (error) {
      logger.error("Failed to fetch messages in MessagingService", error, { userId, filters });
      throw error;
    }
  }

  async sendMessage(userId: string, messageData: SendMessageRequest): Promise<Message> {
    try {
      const message = await storage.sendMessage({
        ...messageData,
        senderId: userId,
      });
      
      logger.info("Message sent", { 
        senderId: userId, 
        recipientId: messageData.recipientId,
        messageId: message.id 
      });
      return message;
    } catch (error) {
      logger.error("Failed to send message in MessagingService", error, { userId });
      throw error;
    }
  }

  // Conversation Management
  async getConversation(currentUserId: string, targetUserId: string) {
    try {
      return await storage.getConversation(currentUserId, targetUserId);
    } catch (error) {
      logger.error("Failed to fetch conversation in MessagingService", error, { currentUserId, targetUserId });
      throw error;
    }
  }
}

export const messagingService = new MessagingService();