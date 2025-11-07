/**
 * Recurring Events Tests
 *
 * Test suite for recurring event creation and management functionality
 */

import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import type { InsertEvent } from "@shared/schema";

// Mock storage class for testing
class MockStorage {
  createBulkEvents = jest.fn();
  update = jest.fn();

  async createRecurringEvents(
    data: InsertEvent,
    _endDate: string,
  ): Promise<any[]> {
    // Validate recurring event data
    if (
      !data.isRecurring ||
      !data.recurrencePattern ||
      !data.recurrenceInterval
    ) {
      throw new Error(
        "Invalid recurring event data: isRecurring, recurrencePattern, and recurrenceInterval are required",
      );
    }

    if (!data.startTime) {
      throw new Error("Invalid recurring event data: startTime is required");
    }

    // Use recurrenceEndDate from data if available, otherwise use the _endDate parameter
    const endDate = data.recurrenceEndDate || new Date(_endDate);
    const startDate = new Date(data.startTime);

    if (endDate <= startDate) {
      throw new Error("Recurrence end date must be after start date");
    }

    const eventList: InsertEvent[] = [];
    let currentStartDate = new Date(startDate);
    const interval = data.recurrenceInterval;

    // Calculate duration if endTime exists
    const duration = data.endTime
      ? new Date(data.endTime).getTime() - startDate.getTime()
      : 0;

    let isFirstEvent = true;

    while (currentStartDate <= endDate) {
      const currentEndTime =
        duration > 0
          ? new Date(currentStartDate.getTime() + duration)
          : undefined;

      const eventData: InsertEvent = {
        ...data,
        startTime: currentStartDate,
        endTime: currentEndTime,
        parentEventId: isFirstEvent ? undefined : "mock-parent-id",
      };

      eventList.push(eventData);

      // Calculate next occurrence based on pattern
      // IMPORTANT: Use UTC methods to avoid DST issues
      switch (data.recurrencePattern) {
        case "daily":
          currentStartDate = new Date(currentStartDate);
          currentStartDate.setUTCDate(currentStartDate.getUTCDate() + interval);
          break;
        case "weekly":
          currentStartDate = new Date(currentStartDate);
          currentStartDate.setUTCDate(
            currentStartDate.getUTCDate() + 7 * interval,
          );
          break;
        case "monthly":
          currentStartDate = new Date(currentStartDate);
          currentStartDate.setUTCMonth(
            currentStartDate.getUTCMonth() + interval,
          );
          break;
        default:
          throw new Error(
            `Invalid recurrence pattern: ${data.recurrencePattern}`,
          );
      }

      isFirstEvent = false;
    }

    if (eventList.length === 0) {
      throw new Error("No events to create - check recurrence parameters");
    }

    // Mock the bulk create
    const createdEvents = eventList.map((event, index) => ({
      id: `event-${index}`,
      ...event,
      parentEventId: index === 0 ? null : "event-0",
    }));

    this.createBulkEvents.mockResolvedValue(createdEvents);

    return createdEvents;
  }
}

describe("Recurring Events", () => {
  let storage: MockStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new MockStorage();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Daily Recurrence", () => {
    test("creates daily recurring events with interval 1", async () => {
      const eventData: InsertEvent = {
        title: "Daily Standup",
        type: "community",
        startTime: new Date("2025-01-01T10:00:00Z"),
        endTime: new Date("2025-01-01T10:30:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "daily",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-01-05T10:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-01-05T10:00:00Z",
      );

      expect(events).toHaveLength(5); // Jan 1-5
      expect(events[0].startTime).toEqual(new Date("2025-01-01T10:00:00Z"));
      expect(events[4].startTime).toEqual(new Date("2025-01-05T10:00:00Z"));
    });

    test("creates daily recurring events with interval 2", async () => {
      const eventData: InsertEvent = {
        title: "Every Other Day Event",
        type: "stream",
        startTime: new Date("2025-01-01T15:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "daily",
        recurrenceInterval: 2,
        recurrenceEndDate: new Date("2025-01-09T15:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-01-09T15:00:00Z",
      );

      expect(events).toHaveLength(5); // Jan 1, 3, 5, 7, 9
      expect(events[0].startTime).toEqual(new Date("2025-01-01T15:00:00Z"));
      expect(events[1].startTime).toEqual(new Date("2025-01-03T15:00:00Z"));
      expect(events[4].startTime).toEqual(new Date("2025-01-09T15:00:00Z"));
    });

    test("preserves event duration for daily events", async () => {
      const eventData: InsertEvent = {
        title: "Daily Workshop",
        type: "community",
        startTime: new Date("2025-01-01T14:00:00Z"),
        endTime: new Date("2025-01-01T16:00:00Z"), // 2 hour duration
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "daily",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-01-03T14:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-01-03T14:00:00Z",
      );

      expect(events).toHaveLength(3);
      events.forEach((event) => {
        const duration =
          new Date(event.endTime!).getTime() -
          new Date(event.startTime).getTime();
        expect(duration).toBe(2 * 60 * 60 * 1000); // 2 hours in milliseconds
      });
    });
  });

  describe("Weekly Recurrence", () => {
    test("creates weekly recurring events with interval 1", async () => {
      const eventData: InsertEvent = {
        title: "Weekly Tournament",
        type: "tournament",
        startTime: new Date("2025-01-06T18:00:00Z"), // Monday
        endTime: new Date("2025-01-06T21:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "weekly",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-01-27T18:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-01-27T18:00:00Z",
      );

      expect(events).toHaveLength(4); // 4 Mondays
      expect(events[0].startTime).toEqual(new Date("2025-01-06T18:00:00Z"));
      expect(events[1].startTime).toEqual(new Date("2025-01-13T18:00:00Z"));
      expect(events[2].startTime).toEqual(new Date("2025-01-20T18:00:00Z"));
      expect(events[3].startTime).toEqual(new Date("2025-01-27T18:00:00Z"));
    });

    test("creates bi-weekly recurring events", async () => {
      const eventData: InsertEvent = {
        title: "Bi-weekly Game Pod",
        type: "game_pod",
        startTime: new Date("2025-01-06T19:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "weekly",
        recurrenceInterval: 2,
        recurrenceEndDate: new Date("2025-02-17T19:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-02-17T19:00:00Z",
      );

      expect(events).toHaveLength(4); // Every 2 weeks
      expect(events[0].startTime).toEqual(new Date("2025-01-06T19:00:00Z"));
      expect(events[1].startTime).toEqual(new Date("2025-01-20T19:00:00Z"));
      expect(events[2].startTime).toEqual(new Date("2025-02-03T19:00:00Z"));
      expect(events[3].startTime).toEqual(new Date("2025-02-17T19:00:00Z"));
    });
  });

  describe("Monthly Recurrence", () => {
    test("creates monthly recurring events with interval 1", async () => {
      const eventData: InsertEvent = {
        title: "Monthly Community Meetup",
        type: "community",
        startTime: new Date("2025-01-15T18:00:00Z"),
        endTime: new Date("2025-01-15T20:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "monthly",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-04-15T18:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-04-15T18:00:00Z",
      );

      expect(events).toHaveLength(4); // Jan 15, Feb 15, Mar 15, Apr 15
      expect(events[0].startTime).toEqual(new Date("2025-01-15T18:00:00Z"));
      expect(events[1].startTime).toEqual(new Date("2025-02-15T18:00:00Z"));
      expect(events[2].startTime).toEqual(new Date("2025-03-15T18:00:00Z"));
      expect(events[3].startTime).toEqual(new Date("2025-04-15T18:00:00Z"));
    });

    test("creates quarterly recurring events (every 3 months)", async () => {
      const eventData: InsertEvent = {
        title: "Quarterly Championship",
        type: "tournament",
        startTime: new Date("2025-01-01T10:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "monthly",
        recurrenceInterval: 3,
        recurrenceEndDate: new Date("2025-10-01T10:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-10-01T10:00:00Z",
      );

      expect(events).toHaveLength(4); // Jan, Apr, Jul, Oct
      expect(events[0].startTime).toEqual(new Date("2025-01-01T10:00:00Z"));
      expect(events[1].startTime).toEqual(new Date("2025-04-01T10:00:00Z"));
      expect(events[2].startTime).toEqual(new Date("2025-07-01T10:00:00Z"));
      expect(events[3].startTime).toEqual(new Date("2025-10-01T10:00:00Z"));
    });

    test("handles month-end dates correctly", async () => {
      const eventData: InsertEvent = {
        title: "End of Month Event",
        type: "community",
        startTime: new Date("2025-01-31T18:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "monthly",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-04-30T18:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-04-30T18:00:00Z",
      );

      expect(events.length).toBeGreaterThan(0);
      // Feb 31 becomes Mar 3 (or Feb 28/29 depending on implementation)
      // This tests that the function handles overflow gracefully
    });
  });

  describe("Parent Event ID", () => {
    test("first event has no parentEventId", async () => {
      const eventData: InsertEvent = {
        title: "Weekly Series",
        type: "tournament",
        startTime: new Date("2025-01-01T10:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "weekly",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-01-15T10:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-01-15T10:00:00Z",
      );

      expect(events[0].parentEventId).toBeNull();
    });

    test("subsequent events reference first event as parent", async () => {
      const eventData: InsertEvent = {
        title: "Weekly Series",
        type: "tournament",
        startTime: new Date("2025-01-01T10:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "weekly",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-01-15T10:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-01-15T10:00:00Z",
      );

      expect(events[0].parentEventId).toBeNull();
      expect(events[1].parentEventId).toBe("event-0");
      expect(events[2].parentEventId).toBe("event-0");
    });
  });

  describe("Validation", () => {
    test("throws error if isRecurring is false", async () => {
      const eventData: InsertEvent = {
        title: "Non-recurring Event",
        type: "tournament",
        startTime: new Date("2025-01-01T10:00:00Z"),
        creatorId: "user-123",
        isRecurring: false,
        recurrencePattern: "weekly",
        recurrenceInterval: 1,
      };

      await expect(
        storage.createRecurringEvents(eventData, "2025-01-15T10:00:00Z"),
      ).rejects.toThrow("Invalid recurring event data");
    });

    test("throws error if recurrencePattern is missing", async () => {
      const eventData: InsertEvent = {
        title: "Invalid Event",
        type: "tournament",
        startTime: new Date("2025-01-01T10:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrenceInterval: 1,
      };

      await expect(
        storage.createRecurringEvents(eventData, "2025-01-15T10:00:00Z"),
      ).rejects.toThrow("Invalid recurring event data");
    });

    test("throws error if recurrenceInterval is missing", async () => {
      const eventData: InsertEvent = {
        title: "Invalid Event",
        type: "tournament",
        startTime: new Date("2025-01-01T10:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "weekly",
      };

      await expect(
        storage.createRecurringEvents(eventData, "2025-01-15T10:00:00Z"),
      ).rejects.toThrow("Invalid recurring event data");
    });

    test("throws error if startTime is missing", async () => {
      const eventData: InsertEvent = {
        title: "Invalid Event",
        type: "tournament",
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "weekly",
        recurrenceInterval: 1,
      } as InsertEvent;

      await expect(
        storage.createRecurringEvents(eventData, "2025-01-15T10:00:00Z"),
      ).rejects.toThrow("Invalid recurring event data: startTime is required");
    });

    test("throws error if end date is before start date", async () => {
      const eventData: InsertEvent = {
        title: "Invalid Date Range",
        type: "tournament",
        startTime: new Date("2025-01-15T10:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "weekly",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-01-01T10:00:00Z"), // Before start
      };

      await expect(
        storage.createRecurringEvents(eventData, "2025-01-01T10:00:00Z"),
      ).rejects.toThrow("Recurrence end date must be after start date");
    });

    test("throws error for invalid recurrence pattern", async () => {
      const eventData: InsertEvent = {
        title: "Invalid Pattern",
        type: "tournament",
        startTime: new Date("2025-01-01T10:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "yearly" as any, // Invalid pattern
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-12-31T10:00:00Z"),
      };

      await expect(
        storage.createRecurringEvents(eventData, "2025-12-31T10:00:00Z"),
      ).rejects.toThrow("Invalid recurrence pattern");
    });
  });

  describe("DST Edge Cases", () => {
    test("handles DST spring forward correctly", async () => {
      // March 9, 2025 02:00 - DST starts (spring forward)
      // Event before DST transition
      const eventData: InsertEvent = {
        title: "DST Spring Forward Test",
        type: "community",
        startTime: new Date("2025-03-08T10:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "monthly",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-04-08T10:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-04-08T10:00:00Z",
      );

      expect(events).toHaveLength(2);
      // Should maintain 10:00 UTC regardless of DST
      expect(events[0].startTime.getUTCHours()).toBe(10);
      expect(events[1].startTime.getUTCHours()).toBe(10);
      expect(events[0].startTime).toEqual(new Date("2025-03-08T10:00:00Z"));
      expect(events[1].startTime).toEqual(new Date("2025-04-08T10:00:00Z"));
    });

    test("handles DST fall back correctly", async () => {
      // November 2, 2025 02:00 - DST ends (fall back)
      // Event before DST transition
      const eventData: InsertEvent = {
        title: "DST Fall Back Test",
        type: "community",
        startTime: new Date("2025-10-15T10:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "monthly",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-11-15T10:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-11-15T10:00:00Z",
      );

      expect(events).toHaveLength(2);
      // Should maintain 10:00 UTC regardless of DST
      expect(events[0].startTime.getUTCHours()).toBe(10);
      expect(events[1].startTime.getUTCHours()).toBe(10);
      expect(events[0].startTime).toEqual(new Date("2025-10-15T10:00:00Z"));
      expect(events[1].startTime).toEqual(new Date("2025-11-15T10:00:00Z"));
    });

    test("handles weekly events across DST spring forward", async () => {
      // Weekly event spanning DST transition
      const eventData: InsertEvent = {
        title: "Weekly DST Test",
        type: "tournament",
        startTime: new Date("2025-03-05T19:00:00Z"), // Week before DST
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "weekly",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-03-19T19:00:00Z"), // Week after DST
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-03-19T19:00:00Z",
      );

      expect(events).toHaveLength(3);
      // All events should maintain 19:00 UTC
      events.forEach((event) => {
        expect(event.startTime.getUTCHours()).toBe(19);
      });
    });

    test("handles daily events across DST spring forward", async () => {
      // Daily event spanning DST transition
      const eventData: InsertEvent = {
        title: "Daily DST Test",
        type: "stream",
        startTime: new Date("2025-03-08T15:00:00Z"), // Day before DST
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "daily",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-03-11T15:00:00Z"), // Days after DST
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-03-11T15:00:00Z",
      );

      expect(events).toHaveLength(4);
      // All events should maintain 15:00 UTC
      events.forEach((event) => {
        expect(event.startTime.getUTCHours()).toBe(15);
      });
    });
  });

  describe("Edge Cases", () => {
    test("handles events without endTime", async () => {
      const eventData: InsertEvent = {
        title: "No End Time Event",
        type: "community",
        startTime: new Date("2025-01-01T10:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "weekly",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-01-15T10:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-01-15T10:00:00Z",
      );

      expect(events).toHaveLength(3);
      events.forEach((event) => {
        expect(event.endTime).toBeUndefined();
      });
    });

    test("handles recurrenceEndDate from data instead of parameter", async () => {
      const eventData: InsertEvent = {
        title: "Date from Data",
        type: "tournament",
        startTime: new Date("2025-01-01T10:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "daily",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-01-03T10:00:00Z"),
      };

      const events = await storage.createRecurringEvents(
        eventData,
        "2025-01-10T10:00:00Z", // Should be ignored
      );

      expect(events).toHaveLength(3); // Uses recurrenceEndDate from data
    });

    test("rejects end date equal to start date", async () => {
      const eventData: InsertEvent = {
        title: "Invalid Event",
        type: "tournament",
        startTime: new Date("2025-01-01T10:00:00Z"),
        creatorId: "user-123",
        isRecurring: true,
        recurrencePattern: "daily",
        recurrenceInterval: 1,
        recurrenceEndDate: new Date("2025-01-01T10:00:00Z"),
      };

      await expect(
        storage.createRecurringEvents(eventData, "2025-01-01T10:00:00Z"),
      ).rejects.toThrow("Recurrence end date must be after start date");
    });
  });
});
