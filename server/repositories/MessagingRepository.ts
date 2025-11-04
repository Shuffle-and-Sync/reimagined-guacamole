/**
 * Messaging Repository
 *
 * Handles all database operations related to messaging and conversations.
 * This repository manages:
 * - User message queries
 * - Sending and receiving messages
 * - Conversation management
 * - Message read/unread status
 * - Cursor-based pagination for message feeds
 *
 * @module MessagingRepository
 */

import { eq, and, desc, lt, or, count } from "drizzle-orm";
import {
  db,
  withQueryTiming,
  type Transaction,
} from "@shared/database-unified";
import {
  messages,
  users,
  events,
  type Message,
  type InsertMessage,
  type User,
  type Event,
} from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { DatabaseError } from "../middleware/error-handling.middleware";
import { BaseRepository } from "./base";

/**
 * Message with related entities
 */
export interface MessageWithDetails extends Message {
  sender: User | null;
  recipient?: User | null;
  event?: Event | null;
}

/**
 * Message query options
 */
export interface MessageQueryOptions {
  eventId?: string;
  communityId?: string;
  conversationId?: string;
  unreadOnly?: boolean;
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

/**
 * MessagingRepository
 *
 * Manages all message-related database operations including sending,
 * retrieving, and managing conversations.
 */
export class MessagingRepository extends BaseRepository<
  typeof messages,
  Message,
  InsertMessage
> {
  constructor(dbInstance = db) {
    super(dbInstance, messages, "messages");
  }

  /**
   * Get messages for a user
   *
   * @param userId - User ID
   * @param options - Query options (filters, limit)
   * @returns Promise of messages with sender and recipient info
   *
   * @example
   * ```typescript
   * const messages = await messagingRepo.getUserMessages(
   *   'user-123',
   *   { unreadOnly: true, limit: 20 }
   * );
   * ```
   */
  async getUserMessages(
    userId: string,
    options: MessageQueryOptions = {},
  ): Promise<MessageWithDetails[]> {
    return withQueryTiming("MessagingRepository:getUserMessages", async () => {
      try {
        const conditions = [
          or(eq(messages.senderId, userId), eq(messages.recipientId, userId)),
        ];

        if (options.eventId) {
          conditions.push(eq(messages.eventId, options.eventId));
        }

        if (options.communityId) {
          conditions.push(eq(messages.communityId, options.communityId));
        }

        if (options.unreadOnly) {
          conditions.push(eq(messages.isRead, false));
          conditions.push(eq(messages.recipientId, userId)); // Only unread messages TO the user
        }

        const senderUser = {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          name: users.name,
          username: users.username,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        };

        const results = await this.db
          .select({
            message: messages,
            sender: senderUser,
          })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(and(...conditions))
          .orderBy(desc(messages.createdAt))
          .limit(options.limit || 50);

        return results.map((r) => ({
          ...r.message,
          sender: r.sender,
        })) as MessageWithDetails[];
      } catch (error) {
        logger.error("Failed to get user messages", toLoggableError(error), {
          userId,
          options,
        });
        throw new DatabaseError("Failed to get user messages", {
          cause: error,
        });
      }
    });
  }

  /**
   * Get messages with cursor-based pagination
   *
   * @param userId - User ID
   * @param options - Query options with cursor support
   * @returns Promise of messages
   *
   * @example
   * ```typescript
   * const messages = await messagingRepo.getUserMessagesWithCursor(
   *   'user-123',
   *   { cursor: '2025-01-01T00:00:00Z', limit: 50 }
   * );
   * ```
   */
  async getUserMessagesWithCursor(
    userId: string,
    options: MessageQueryOptions = {},
  ): Promise<MessageWithDetails[]> {
    return withQueryTiming(
      "MessagingRepository:getUserMessagesWithCursor",
      async () => {
        try {
          const conditions = [
            or(eq(messages.senderId, userId), eq(messages.recipientId, userId)),
          ];

          if (options.eventId) {
            conditions.push(eq(messages.eventId, options.eventId));
          }

          if (options.communityId) {
            conditions.push(eq(messages.communityId, options.communityId));
          }

          if (options.unreadOnly) {
            conditions.push(eq(messages.isRead, false));
            conditions.push(eq(messages.recipientId, userId));
          }

          if (options.cursor) {
            conditions.push(lt(messages.createdAt, new Date(options.cursor)));
          }

          const results = await this.db
            .select({
              message: messages,
              sender: users,
              event: events,
            })
            .from(messages)
            .leftJoin(users, eq(messages.senderId, users.id))
            .leftJoin(events, eq(messages.eventId, events.id))
            .where(and(...conditions))
            .orderBy(desc(messages.createdAt))
            .limit(options.limit || 50);

          return results.map((r) => ({
            ...r.message,
            sender: r.sender,
            event: r.event,
          })) as MessageWithDetails[];
        } catch (error) {
          logger.error(
            "Failed to get user messages with cursor",
            toLoggableError(error),
            { userId, options },
          );
          throw new DatabaseError("Failed to get user messages with cursor", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get conversation between two users
   *
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   * @param options - Query options (limit, cursor)
   * @returns Promise of messages in conversation
   *
   * @example
   * ```typescript
   * const conversation = await messagingRepo.getConversation(
   *   'user-123',
   *   'user-456',
   *   { limit: 100 }
   * );
   * ```
   */
  async getConversation(
    userId1: string,
    userId2: string,
    options: MessageQueryOptions = {},
  ): Promise<MessageWithDetails[]> {
    return withQueryTiming("MessagingRepository:getConversation", async () => {
      try {
        const conditions = [
          or(
            and(
              eq(messages.senderId, userId1),
              eq(messages.recipientId, userId2),
            ),
            and(
              eq(messages.senderId, userId2),
              eq(messages.recipientId, userId1),
            ),
          ),
        ];

        if (options.cursor) {
          conditions.push(lt(messages.createdAt, new Date(options.cursor)));
        }

        const results = await this.db
          .select({
            message: messages,
            sender: users,
          })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(and(...conditions))
          .orderBy(desc(messages.createdAt))
          .limit(options.limit || 50);

        return results.map((r) => ({
          ...r.message,
          sender: r.sender,
        })) as MessageWithDetails[];
      } catch (error) {
        logger.error("Failed to get conversation", toLoggableError(error), {
          userId1,
          userId2,
          options,
        });
        throw new DatabaseError("Failed to get conversation", {
          cause: error,
        });
      }
    });
  }

  /**
   * Get unread message count for a user
   *
   * @param userId - User ID
   * @returns Promise of unread count
   *
   * @example
   * ```typescript
   * const unreadCount = await messagingRepo.getUnreadCount('user-123');
   * console.log(`You have ${unreadCount} unread messages`);
   * ```
   */
  async getUnreadCount(userId: string): Promise<number> {
    return withQueryTiming("MessagingRepository:getUnreadCount", async () => {
      try {
        const result = await this.db
          .select({ count: count() })
          .from(messages)
          .where(
            and(eq(messages.recipientId, userId), eq(messages.isRead, false)),
          );

        return result[0]?.count || 0;
      } catch (error) {
        logger.error(
          "Failed to get unread message count",
          toLoggableError(error),
          { userId },
        );
        throw new DatabaseError("Failed to get unread message count", {
          cause: error,
        });
      }
    });
  }

  /**
   * Send a message
   *
   * @param data - Message data
   * @returns Promise of created message
   *
   * @example
   * ```typescript
   * const message = await messagingRepo.sendMessage({
   *   senderId: 'user-123',
   *   recipientId: 'user-456',
   *   content: 'Hello!',
   *   type: 'direct'
   * });
   * ```
   */
  async sendMessage(data: InsertMessage): Promise<Message> {
    return withQueryTiming("MessagingRepository:sendMessage", async () => {
      try {
        return await this.create(data);
      } catch (error) {
        logger.error("Failed to send message", toLoggableError(error), {
          data,
        });
        throw new DatabaseError("Failed to send message", { cause: error });
      }
    });
  }

  /**
   * Send a message within a transaction
   *
   * @param data - Message data
   * @param trx - Transaction object
   * @returns Promise of created message
   */
  async sendMessageWithTransaction(
    data: InsertMessage,
    trx: Transaction,
  ): Promise<Message> {
    try {
      const result = await trx.insert(messages).values(data).returning();
      if (!result[0]) {
        throw new DatabaseError("Failed to send message in transaction");
      }
      return result[0];
    } catch (error) {
      logger.error(
        "Failed to send message with transaction",
        toLoggableError(error),
        { data },
      );
      throw new DatabaseError("Failed to send message with transaction", {
        cause: error,
      });
    }
  }

  /**
   * Mark a message as read
   *
   * @param messageId - Message ID
   *
   * @example
   * ```typescript
   * await messagingRepo.markMessageAsRead('msg-123');
   * ```
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    return withQueryTiming(
      "MessagingRepository:markMessageAsRead",
      async () => {
        try {
          await this.db
            .update(messages)
            .set({ isRead: true, readAt: new Date() })
            .where(eq(messages.id, messageId));
        } catch (error) {
          logger.error(
            "Failed to mark message as read",
            toLoggableError(error),
            { messageId },
          );
          throw new DatabaseError("Failed to mark message as read", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Mark all messages as read for a conversation
   *
   * @param userId - Recipient user ID
   * @param senderId - Sender user ID
   *
   * @example
   * ```typescript
   * await messagingRepo.markConversationAsRead('user-123', 'user-456');
   * ```
   */
  async markConversationAsRead(
    userId: string,
    senderId: string,
  ): Promise<void> {
    return withQueryTiming(
      "MessagingRepository:markConversationAsRead",
      async () => {
        try {
          await this.db
            .update(messages)
            .set({ isRead: true, readAt: new Date() })
            .where(
              and(
                eq(messages.recipientId, userId),
                eq(messages.senderId, senderId),
                eq(messages.isRead, false),
              ),
            );
        } catch (error) {
          logger.error(
            "Failed to mark conversation as read",
            toLoggableError(error),
            { userId, senderId },
          );
          throw new DatabaseError("Failed to mark conversation as read", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Delete a message
   *
   * @param messageId - Message ID
   *
   * @example
   * ```typescript
   * await messagingRepo.deleteMessage('msg-123');
   * ```
   */
  async deleteMessage(messageId: string): Promise<void> {
    return withQueryTiming("MessagingRepository:deleteMessage", async () => {
      try {
        await this.delete(messageId);
      } catch (error) {
        logger.error("Failed to delete message", toLoggableError(error), {
          messageId,
        });
        throw new DatabaseError("Failed to delete message", { cause: error });
      }
    });
  }

  /**
   * Delete all messages in a conversation
   *
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   * @returns Promise of count of deleted messages
   *
   * @example
   * ```typescript
   * const deletedCount = await messagingRepo.deleteConversation('user-123', 'user-456');
   * ```
   */
  async deleteConversation(userId1: string, userId2: string): Promise<number> {
    return withQueryTiming(
      "MessagingRepository:deleteConversation",
      async () => {
        try {
          const result = await this.db
            .delete(messages)
            .where(
              or(
                and(
                  eq(messages.senderId, userId1),
                  eq(messages.recipientId, userId2),
                ),
                and(
                  eq(messages.senderId, userId2),
                  eq(messages.recipientId, userId1),
                ),
              ),
            )
            .returning();

          return result.length;
        } catch (error) {
          logger.error(
            "Failed to delete conversation",
            toLoggableError(error),
            { userId1, userId2 },
          );
          throw new DatabaseError("Failed to delete conversation", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Delete old messages older than a specified date
   *
   * @param olderThan - Delete messages created before this date
   * @returns Promise of count of deleted messages
   *
   * @example
   * ```typescript
   * // Delete messages older than 90 days
   * const ninetyDaysAgo = new Date();
   * ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
   * const deletedCount = await messagingRepo.deleteOldMessages(ninetyDaysAgo);
   * ```
   */
  async deleteOldMessages(olderThan: Date): Promise<number> {
    return withQueryTiming(
      "MessagingRepository:deleteOldMessages",
      async () => {
        try {
          const result = await this.db
            .delete(messages)
            .where(lt(messages.createdAt, olderThan))
            .returning();

          return result.length;
        } catch (error) {
          logger.error(
            "Failed to delete old messages",
            toLoggableError(error),
            { olderThan },
          );
          throw new DatabaseError("Failed to delete old messages", {
            cause: error,
          });
        }
      },
    );
  }
}
