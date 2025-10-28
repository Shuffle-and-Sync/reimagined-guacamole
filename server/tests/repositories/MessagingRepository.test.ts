/**
 * Messaging Repository Tests
 *
 * Unit tests for the messaging repository layer to ensure all message-specific
 * database operations are performed correctly.
 *
 * Tests cover:
 * - Get user messages with filters
 * - Cursor-based pagination
 * - Conversation queries
 * - Unread count
 * - Send message
 * - Mark as read (single and conversation)
 * - Delete operations
 * - Error handling
 */

import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import type { Database } from "@shared/database-unified";
import { DatabaseError } from "../../middleware/error-handling.middleware";
import { MessagingRepository } from "../../repositories/MessagingRepository";

// Mock database
const createMockDb = () => {
  const mockSelect = jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
        limit: jest.fn().mockResolvedValue([]),
      }),
    }),
  });

  const mockInsert = jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([
        {
          id: "msg-1",
          senderId: "user-1",
          recipientId: "user-2",
          content: "Test message",
          type: "direct",
          isRead: false,
          createdAt: new Date(),
        },
      ]),
    }),
  });

  const mockUpdate = jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    }),
  });

  const mockDelete = jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([]),
    }),
  });

  return {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  } as unknown as Database;
};

describe("MessagingRepository", () => {
  let mockDb: Database;
  let repository: MessagingRepository;

  beforeEach(() => {
    mockDb = createMockDb();
    repository = new MessagingRepository();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (repository as any).db = mockDb;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getUserMessages", () => {
    test("should get all messages for a user", async () => {
      const mockMessages = [
        {
          message: {
            id: "msg-1",
            senderId: "user-1",
            recipientId: "user-2",
            content: "Hello",
            type: "direct",
            isRead: false,
            createdAt: new Date(),
          },
          sender: {
            id: "user-1",
            email: "user1@example.com",
            firstName: "John",
            lastName: "Doe",
            name: "John Doe",
            username: "johndoe",
            profileImageUrl: null,
            status: "online",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockMessages),
            }),
          }),
        }),
      });

      const result = await repository.getUserMessages("user-1");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Hello");
      expect(mockDb.select).toHaveBeenCalled();
    });

    test("should filter by eventId when provided", async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      await repository.getUserMessages("user-1", { eventId: "event-123" });

      expect(mockDb.select).toHaveBeenCalled();
    });

    test("should filter unread messages when unreadOnly is true", async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      await repository.getUserMessages("user-1", { unreadOnly: true });

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe("getUserMessagesWithCursor", () => {
    test("should get messages with cursor-based pagination", async () => {
      const mockMessages = [
        {
          message: {
            id: "msg-3",
            senderId: "user-1",
            recipientId: "user-2",
            content: "Older message",
            type: "direct",
            isRead: false,
            createdAt: new Date("2025-01-01"),
          },
          sender: {
            id: "user-1",
            email: "user1@example.com",
            name: "John Doe",
          },
          event: null,
        },
      ];

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockMessages),
            }),
          }),
        }),
      });

      const result = await repository.getUserMessagesWithCursor("user-1", {
        cursor: "2025-01-15T00:00:00Z",
        limit: 20,
      });

      expect(result).toHaveLength(1);
    });
  });

  describe("getConversation", () => {
    test("should get conversation between two users", async () => {
      const mockConversation = [
        {
          message: {
            id: "msg-1",
            senderId: "user-1",
            recipientId: "user-2",
            content: "Hi there",
            type: "direct",
            isRead: true,
            createdAt: new Date(),
          },
          sender: {
            id: "user-1",
            email: "user1@example.com",
            name: "John Doe",
          },
        },
        {
          message: {
            id: "msg-2",
            senderId: "user-2",
            recipientId: "user-1",
            content: "Hello!",
            type: "direct",
            isRead: true,
            createdAt: new Date(),
          },
          sender: {
            id: "user-2",
            email: "user2@example.com",
            name: "Jane Smith",
          },
        },
      ];

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockConversation),
            }),
          }),
        }),
      });

      const result = await repository.getConversation("user-1", "user-2");

      expect(result).toHaveLength(2);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe("getUnreadCount", () => {
    test("should return unread message count", async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 3 }]),
        }),
      });

      const count = await repository.getUnreadCount("user-1");

      expect(count).toBe(3);
    });

    test("should return 0 when no unread messages", async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      const count = await repository.getUnreadCount("user-1");

      expect(count).toBe(0);
    });
  });

  describe("sendMessage", () => {
    test("should send a message", async () => {
      const messageData = {
        senderId: "user-1",
        recipientId: "user-2",
        content: "Test message",
        type: "direct" as const,
      };

      const mockCreated = {
        id: "msg-1",
        ...messageData,
        isRead: false,
        createdAt: new Date(),
      };

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreated]),
        }),
      });

      const result = await repository.sendMessage(messageData);

      expect(result).toEqual(mockCreated);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    test("should throw DatabaseError when sending fails", async () => {
      const messageData = {
        senderId: "user-1",
        recipientId: "user-2",
        content: "Test message",
        type: "direct" as const,
      };

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error("DB error")),
        }),
      });

      await expect(repository.sendMessage(messageData)).rejects.toThrow(
        DatabaseError,
      );
    });
  });

  describe("markMessageAsRead", () => {
    test("should mark a message as read", async () => {
      await repository.markMessageAsRead("msg-1");

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("markConversationAsRead", () => {
    test("should mark all messages in a conversation as read", async () => {
      await repository.markConversationAsRead("user-1", "user-2");

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("deleteMessage", () => {
    test("should delete a message", async () => {
      mockDb.delete = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: "msg-1" }]),
        }),
      });

      await repository.deleteMessage("msg-1");

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe("deleteConversation", () => {
    test("should delete all messages in a conversation", async () => {
      mockDb.delete = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([
              { id: "msg-1" },
              { id: "msg-2" },
              { id: "msg-3" },
            ]),
        }),
      });

      const count = await repository.deleteConversation("user-1", "user-2");

      expect(count).toBe(3);
    });
  });

  describe("deleteOldMessages", () => {
    test("should delete old messages", async () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      mockDb.delete = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([{ id: "msg-1" }, { id: "msg-2" }]),
        }),
      });

      const count = await repository.deleteOldMessages(ninetyDaysAgo);

      expect(count).toBe(2);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});
