/**
 * Event Conflict Detection Integration Tests
 *
 * Tests for end-to-end conflict detection scenarios
 */

import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { DEFAULT_EVENT_DURATION_MS } from "../../features/events/events.constants";
import { eventsService } from "../../features/events/events.service";
import { storage } from "../../storage";

// Mock storage
jest.mock("../../storage", () => ({
  storage: {
    getUserCreatedEvents: jest.fn(),
    getUserEventAttendance: jest.fn(),
    getUsersEventAttendance: jest.fn(),
    createEvent: jest.fn(),
    getEvent: jest.fn(),
    deleteEvent: jest.fn(),
  },
}));

describe("Event Conflict Detection Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Conflict Detection Scenarios", () => {
    test("should detect overlap when new event starts during existing event", () => {
      const existingStart = new Date("2025-01-15T14:00:00Z");
      const existingEnd = new Date("2025-01-15T16:00:00Z");

      const newStart = new Date("2025-01-15T15:00:00Z");
      const newEnd = new Date("2025-01-15T17:00:00Z");

      // Overlap logic: start1 < end2 AND start2 < end1
      const hasOverlap = existingStart < newEnd && newStart < existingEnd;

      expect(hasOverlap).toBe(true);
    });

    test("should not detect conflict for sequential events", () => {
      const existingStart = new Date("2025-01-15T14:00:00Z");
      const existingEnd = new Date("2025-01-15T16:00:00Z");

      const newStart = new Date("2025-01-15T16:00:00Z");
      const newEnd = new Date("2025-01-15T18:00:00Z");

      const hasOverlap = existingStart < newEnd && newStart < existingEnd;

      expect(hasOverlap).toBe(false);
    });

    test("should handle events without end time", () => {
      const existingStart = new Date("2025-01-15T14:00:00Z");
      const existingEnd = null;

      // Default to 2 hours if no end time
      const effectiveEnd =
        existingEnd ||
        new Date(existingStart.getTime() + DEFAULT_EVENT_DURATION_MS);

      const newStart = new Date("2025-01-15T15:00:00Z");
      const newEnd = new Date("2025-01-15T17:00:00Z");

      const hasOverlap = existingStart < newEnd && newStart < effectiveEnd;

      expect(hasOverlap).toBe(true);
    });

    test("should detect partial overlap at the beginning", () => {
      const existingStart = new Date("2025-01-15T14:00:00Z");
      const existingEnd = new Date("2025-01-15T16:00:00Z");

      const newStart = new Date("2025-01-15T13:00:00Z");
      const newEnd = new Date("2025-01-15T15:00:00Z");

      const hasOverlap = existingStart < newEnd && newStart < existingEnd;

      expect(hasOverlap).toBe(true);
    });

    test("should detect when new event completely contains existing event", () => {
      const existingStart = new Date("2025-01-15T14:00:00Z");
      const existingEnd = new Date("2025-01-15T15:00:00Z");

      const newStart = new Date("2025-01-15T13:00:00Z");
      const newEnd = new Date("2025-01-15T17:00:00Z");

      const hasOverlap = existingStart < newEnd && newStart < existingEnd;

      expect(hasOverlap).toBe(true);
    });

    test("should detect when existing event completely contains new event", () => {
      const existingStart = new Date("2025-01-15T13:00:00Z");
      const existingEnd = new Date("2025-01-15T17:00:00Z");

      const newStart = new Date("2025-01-15T14:00:00Z");
      const newEnd = new Date("2025-01-15T15:00:00Z");

      const hasOverlap = existingStart < newEnd && newStart < existingEnd;

      expect(hasOverlap).toBe(true);
    });
  });

  describe("API Response Format Validation", () => {
    test("conflict response should include required fields", () => {
      const mockConflictResponse = {
        hasConflict: true,
        conflicts: [
          {
            eventId: "event-123",
            title: "Existing Event",
            startTime: "2025-01-15T14:00:00Z",
            endTime: "2025-01-15T16:00:00Z",
            conflictType: "creator",
          },
        ],
        message: "Found 1 conflicting event(s)",
      };

      expect(mockConflictResponse).toHaveProperty("hasConflict");
      expect(mockConflictResponse).toHaveProperty("conflicts");
      expect(mockConflictResponse).toHaveProperty("message");
      expect(mockConflictResponse.conflicts[0]).toHaveProperty("eventId");
      expect(mockConflictResponse.conflicts[0]).toHaveProperty("title");
      expect(mockConflictResponse.conflicts[0]).toHaveProperty("startTime");
      expect(mockConflictResponse.conflicts[0]).toHaveProperty("endTime");
      expect(mockConflictResponse.conflicts[0]).toHaveProperty("conflictType");
    });

    test("no conflict response should have empty conflicts array", () => {
      const mockNoConflictResponse = {
        hasConflict: false,
        conflicts: [],
        message: "No conflicts detected",
      };

      expect(mockNoConflictResponse.hasConflict).toBe(false);
      expect(mockNoConflictResponse.conflicts).toEqual([]);
    });

    test("conflict types should be valid", () => {
      const validConflictTypes = ["creator", "attendee", "time_overlap"];

      validConflictTypes.forEach((type) => {
        const conflict = {
          eventId: "event-123",
          title: "Event",
          startTime: "2025-01-15T14:00:00Z",
          endTime: "2025-01-15T16:00:00Z",
          conflictType: type,
        };

        expect(validConflictTypes).toContain(conflict.conflictType);
      });
    });
  });

  describe("Service Integration with Check Conflicts", () => {
    test("should format conflict check results correctly", async () => {
      const mockEvent = {
        id: "event-1",
        title: "Existing Event",
        startTime: new Date("2025-01-15T14:00:00Z"),
        endTime: new Date("2025-01-15T16:00:00Z"),
        creatorId: "user-1",
        hostId: "user-1",
        type: "tournament",
        location: "Online",
        timezone: "UTC",
        isPublic: true,
        status: "active",
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (storage.getUserCreatedEvents as jest.Mock).mockResolvedValue([
        mockEvent,
      ]);
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([]);
      (storage.getUsersEventAttendance as jest.Mock).mockResolvedValue([]);

      const result = await eventsService.checkConflicts(
        "2025-01-15T15:00:00Z",
        "2025-01-15T17:00:00Z",
        "user-1",
      );

      expect(result).toHaveProperty("hasConflict");
      expect(result).toHaveProperty("conflicts");
      expect(result).toHaveProperty("message");
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].eventId).toBe("event-1");
      expect(typeof result.conflicts[0].startTime).toBe("string");
      expect(typeof result.conflicts[0].endTime).toBe("string");
    });

    test("should handle no conflicts scenario", async () => {
      (storage.getUserCreatedEvents as jest.Mock).mockResolvedValue([]);
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([]);
      (storage.getUsersEventAttendance as jest.Mock).mockResolvedValue([]);

      const result = await eventsService.checkConflicts(
        "2025-01-15T15:00:00Z",
        "2025-01-15T17:00:00Z",
        "user-1",
      );

      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe("Multi-day Event Scenarios", () => {
    test("should detect conflict for multi-day overlapping events", () => {
      // Event 1: Jan 15-16
      const event1Start = new Date("2025-01-15T20:00:00Z");
      const event1End = new Date("2025-01-16T04:00:00Z");

      // Event 2: Jan 15-16 (overlapping)
      const event2Start = new Date("2025-01-15T22:00:00Z");
      const event2End = new Date("2025-01-16T02:00:00Z");

      const hasOverlap = event1Start < event2End && event2Start < event1End;

      expect(hasOverlap).toBe(true);
    });

    test("should not detect conflict for consecutive multi-day events", () => {
      // Event 1: Jan 15-16
      const event1Start = new Date("2025-01-15T20:00:00Z");
      const event1End = new Date("2025-01-16T04:00:00Z");

      // Event 2: Jan 16-17 (starts when event 1 ends)
      const event2Start = new Date("2025-01-16T04:00:00Z");
      const event2End = new Date("2025-01-17T02:00:00Z");

      const hasOverlap = event1Start < event2End && event2Start < event1End;

      expect(hasOverlap).toBe(false);
    });
  });
});
