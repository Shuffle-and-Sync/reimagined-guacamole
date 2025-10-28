/**
 * Notification Repository Tests
 *
 * Unit tests for the notification repository layer to ensure all notification-specific
 * database operations are performed correctly.
 *
 * Tests cover:
 * - Get user notifications with filters
 * - Cursor-based pagination
 * - Unread count
 * - Create notification
 * - Mark as read (single and bulk)
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
import { NotificationRepository } from "../../repositories/NotificationRepository";

// Mock database
const createMockDb = () => {
  const mockSelect = jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([]),
        }),
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
      orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
      limit: jest.fn().mockResolvedValue([]),
    }),
  });

  const mockInsert = jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([
        {
          id: "notif-1",
          userId: "user-1",
          type: "event_reminder",
          content: "Test notification",
          isRead: false,
          createdAt: new Date(),
        },
      ]),
    }),
  });

  const mockUpdate = jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      }),
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

describe("NotificationRepository", () => {
  let mockDb: Database;
  let repository: NotificationRepository;

  beforeEach(() => {
    mockDb = createMockDb();
    repository = new NotificationRepository();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (repository as any).db = mockDb;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getUserNotifications", () => {
    test("should get all notifications for a user", async () => {
      const mockNotifications = [
        {
          id: "notif-1",
          userId: "user-1",
          type: "event_reminder",
          content: "Event starts soon",
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: "notif-2",
          userId: "user-1",
          type: "message",
          content: "New message",
          isRead: true,
          createdAt: new Date(),
        },
      ];

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(mockNotifications),
            }),
            orderBy: jest.fn().mockResolvedValue(mockNotifications),
          }),
        }),
      });

      const result = await repository.getUserNotifications("user-1");

      expect(result).toEqual(mockNotifications);
      expect(mockDb.select).toHaveBeenCalled();
    });

    test("should filter unread notifications when unreadOnly is true", async () => {
      const mockUnreadNotifications = [
        {
          id: "notif-1",
          userId: "user-1",
          type: "event_reminder",
          content: "Event starts soon",
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockUnreadNotifications),
          }),
        }),
      });

      const result = await repository.getUserNotifications("user-1", {
        unreadOnly: true,
      });

      expect(result).toEqual(mockUnreadNotifications);
    });

    test("should apply limit when provided", async () => {
      const mockLimitedNotifications = [
        {
          id: "notif-1",
          userId: "user-1",
          type: "event_reminder",
          content: "Event starts soon",
          isRead: false,
          createdAt: new Date(),
        },
      ];

      const mockLimit = jest.fn().mockReturnValue({
        orderBy: jest.fn().mockResolvedValue(mockLimitedNotifications),
      });

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: mockLimit,
          }),
        }),
      });

      const result = await repository.getUserNotifications("user-1", {
        limit: 10,
      });

      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockLimitedNotifications);
    });
  });

  describe("getUserNotificationsWithCursor", () => {
    test("should get notifications with cursor-based pagination", async () => {
      const mockNotifications = [
        {
          id: "notif-3",
          userId: "user-1",
          type: "event_reminder",
          content: "Older notification",
          isRead: false,
          createdAt: new Date("2025-01-01"),
        },
      ];

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockNotifications),
            }),
          }),
        }),
      });

      const result = await repository.getUserNotificationsWithCursor("user-1", {
        cursor: "2025-01-15T00:00:00Z",
        limit: 20,
      });

      expect(result).toEqual(mockNotifications);
    });
  });

  describe("getUnreadCount", () => {
    test("should return unread notification count", async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

      const count = await repository.getUnreadCount("user-1");

      expect(count).toBe(5);
    });

    test("should return 0 when no unread notifications", async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      const count = await repository.getUnreadCount("user-1");

      expect(count).toBe(0);
    });
  });

  describe("createNotification", () => {
    test("should create a notification", async () => {
      const notificationData = {
        userId: "user-1",
        type: "event_reminder" as const,
        content: "Test notification",
        isRead: false,
      };

      const mockCreated = {
        id: "notif-1",
        ...notificationData,
        createdAt: new Date(),
      };

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreated]),
        }),
      });

      const result = await repository.createNotification(notificationData);

      expect(result).toEqual(mockCreated);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    test("should throw DatabaseError when creation fails", async () => {
      const notificationData = {
        userId: "user-1",
        type: "event_reminder" as const,
        content: "Test notification",
        isRead: false,
      };

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error("DB error")),
        }),
      });

      await expect(
        repository.createNotification(notificationData),
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe("markNotificationAsRead", () => {
    test("should mark a notification as read", async () => {
      mockDb.update = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await repository.markNotificationAsRead("notif-1");

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("markAllNotificationsAsRead", () => {
    test("should mark all notifications as read for a user", async () => {
      mockDb.update = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await repository.markAllNotificationsAsRead("user-1");

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("deleteNotification", () => {
    test("should delete a notification", async () => {
      mockDb.delete = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: "notif-1" }]),
        }),
      });

      await repository.deleteNotification("notif-1");

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe("deleteAllUserNotifications", () => {
    test("should delete all notifications for a user", async () => {
      mockDb.delete = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([{ id: "notif-1" }, { id: "notif-2" }]),
        }),
      });

      const count = await repository.deleteAllUserNotifications("user-1");

      expect(count).toBe(2);
    });
  });

  describe("deleteOldReadNotifications", () => {
    test("should delete old read notifications", async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      mockDb.delete = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([
              { id: "notif-1" },
              { id: "notif-2" },
              { id: "notif-3" },
            ]),
        }),
      });

      const count = await repository.deleteOldReadNotifications(thirtyDaysAgo);

      expect(count).toBe(3);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});
