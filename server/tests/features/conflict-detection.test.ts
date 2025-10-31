/**
 * Conflict Detection Tests
 *
 * Tests for event scheduling conflict detection
 */

import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { conflictDetectionService } from "../../features/events/conflict-detection.service";
import { storage } from "../../storage";

// Mock storage
jest.mock("../../storage", () => ({
  storage: {
    getUserCreatedEvents: jest.fn(),
    getUserEventAttendance: jest.fn(),
  },
}));

describe("Conflict Detection Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Basic Time Overlap Detection", () => {
    test("should detect overlap when new event starts during existing event", async () => {
      const existingEvent = {
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
        existingEvent,
      ]);
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([]);

      const result = await conflictDetectionService.checkEventConflicts({
        startTime: new Date("2025-01-15T15:00:00Z"),
        endTime: new Date("2025-01-15T17:00:00Z"),
        creatorId: "user-1",
      });

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingEvents).toHaveLength(1);
      expect(result.conflictingEvents[0].eventId).toBe("event-1");
      expect(result.conflictingEvents[0].conflictType).toBe("creator");
    });

    test("should detect overlap when new event ends during existing event", async () => {
      const existingEvent = {
        id: "event-2",
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
        existingEvent,
      ]);
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([]);

      const result = await conflictDetectionService.checkEventConflicts({
        startTime: new Date("2025-01-15T13:00:00Z"),
        endTime: new Date("2025-01-15T15:00:00Z"),
        creatorId: "user-1",
      });

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingEvents).toHaveLength(1);
    });

    test("should detect overlap when new event completely contains existing event", async () => {
      const existingEvent = {
        id: "event-3",
        title: "Existing Event",
        startTime: new Date("2025-01-15T14:00:00Z"),
        endTime: new Date("2025-01-15T15:00:00Z"),
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
        existingEvent,
      ]);
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([]);

      const result = await conflictDetectionService.checkEventConflicts({
        startTime: new Date("2025-01-15T13:00:00Z"),
        endTime: new Date("2025-01-15T17:00:00Z"),
        creatorId: "user-1",
      });

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingEvents).toHaveLength(1);
    });

    test("should not detect conflict when events are sequential", async () => {
      const existingEvent = {
        id: "event-4",
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
        existingEvent,
      ]);
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([]);

      const result = await conflictDetectionService.checkEventConflicts({
        startTime: new Date("2025-01-15T16:00:00Z"),
        endTime: new Date("2025-01-15T18:00:00Z"),
        creatorId: "user-1",
      });

      expect(result.hasConflict).toBe(false);
      expect(result.conflictingEvents).toHaveLength(0);
    });
  });

  describe("Edge Cases", () => {
    test("should detect conflict with same start and end time", async () => {
      const existingEvent = {
        id: "event-5",
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
        existingEvent,
      ]);
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([]);

      const result = await conflictDetectionService.checkEventConflicts({
        startTime: new Date("2025-01-15T14:00:00Z"),
        endTime: new Date("2025-01-15T16:00:00Z"),
        creatorId: "user-1",
      });

      expect(result.hasConflict).toBe(true);
    });

    test("should handle events without end time (assume 2 hour duration)", async () => {
      const existingEvent = {
        id: "event-6",
        title: "Existing Event",
        startTime: new Date("2025-01-15T14:00:00Z"),
        endTime: null,
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
        existingEvent,
      ]);
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([]);

      const result = await conflictDetectionService.checkEventConflicts({
        startTime: new Date("2025-01-15T15:00:00Z"),
        endTime: null,
        creatorId: "user-1",
      });

      expect(result.hasConflict).toBe(true);
    });

    test("should exclude specific event when checking conflicts (for updates)", async () => {
      const existingEvent = {
        id: "event-7",
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
        existingEvent,
      ]);
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([]);

      const result = await conflictDetectionService.checkEventConflicts({
        startTime: new Date("2025-01-15T14:00:00Z"),
        endTime: new Date("2025-01-15T16:00:00Z"),
        creatorId: "user-1",
        excludeEventId: "event-7",
      });

      expect(result.hasConflict).toBe(false);
    });
  });

  describe("Attendee Conflicts", () => {
    test("should detect conflict when attendee is already attending another event", async () => {
      const existingEvent = {
        id: "event-8",
        title: "Existing Event",
        startTime: new Date("2025-01-15T14:00:00Z"),
        endTime: new Date("2025-01-15T16:00:00Z"),
        creatorId: "user-2",
        hostId: "user-2",
        type: "tournament",
        location: "Online",
        timezone: "UTC",
        isPublic: true,
        status: "active",
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (storage.getUserCreatedEvents as jest.Mock).mockResolvedValue([]);
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([
        {
          id: "attendance-1",
          eventId: "event-8",
          userId: "attendee-1",
          status: "attending",
          joinedAt: new Date(),
          event: existingEvent,
        },
      ]);

      const result = await conflictDetectionService.checkEventConflicts({
        startTime: new Date("2025-01-15T15:00:00Z"),
        endTime: new Date("2025-01-15T17:00:00Z"),
        creatorId: "user-1",
        attendeeIds: ["attendee-1"],
      });

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingEvents).toHaveLength(1);
      expect(result.conflictingEvents[0].conflictType).toBe("attendee");
    });

    test("should not detect conflict when attendee status is not attending", async () => {
      const existingEvent = {
        id: "event-9",
        title: "Existing Event",
        startTime: new Date("2025-01-15T14:00:00Z"),
        endTime: new Date("2025-01-15T16:00:00Z"),
        creatorId: "user-2",
        hostId: "user-2",
        type: "tournament",
        location: "Online",
        timezone: "UTC",
        isPublic: true,
        status: "active",
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (storage.getUserCreatedEvents as jest.Mock).mockResolvedValue([]);
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([
        {
          id: "attendance-2",
          eventId: "event-9",
          userId: "attendee-1",
          status: "maybe",
          joinedAt: new Date(),
          event: existingEvent,
        },
      ]);

      const result = await conflictDetectionService.checkEventConflicts({
        startTime: new Date("2025-01-15T15:00:00Z"),
        endTime: new Date("2025-01-15T17:00:00Z"),
        creatorId: "user-1",
        attendeeIds: ["attendee-1"],
      });

      expect(result.hasConflict).toBe(false);
    });
  });

  describe("Multiple Conflicts", () => {
    test("should detect multiple overlapping events", async () => {
      const existingEvents = [
        {
          id: "event-10",
          title: "Event 1",
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
        },
        {
          id: "event-11",
          title: "Event 2",
          startTime: new Date("2025-01-15T15:30:00Z"),
          endTime: new Date("2025-01-15T17:30:00Z"),
          creatorId: "user-1",
          hostId: "user-1",
          type: "stream",
          location: "Online",
          timezone: "UTC",
          isPublic: true,
          status: "active",
          isRecurring: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (storage.getUserCreatedEvents as jest.Mock).mockResolvedValue(
        existingEvents,
      );
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([]);

      const result = await conflictDetectionService.checkEventConflicts({
        startTime: new Date("2025-01-15T15:00:00Z"),
        endTime: new Date("2025-01-15T17:00:00Z"),
        creatorId: "user-1",
      });

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingEvents).toHaveLength(2);
    });
  });

  describe("User Availability Check", () => {
    test("should return true when user is available", async () => {
      (storage.getUserCreatedEvents as jest.Mock).mockResolvedValue([]);
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([]);

      const isAvailable = await conflictDetectionService.checkUserAvailability(
        "user-1",
        new Date("2025-01-15T14:00:00Z"),
        new Date("2025-01-15T16:00:00Z"),
      );

      expect(isAvailable).toBe(true);
    });

    test("should return false when user has conflicting event", async () => {
      const existingEvent = {
        id: "event-12",
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
        existingEvent,
      ]);
      (storage.getUserEventAttendance as jest.Mock).mockResolvedValue([]);

      const isAvailable = await conflictDetectionService.checkUserAvailability(
        "user-1",
        new Date("2025-01-15T15:00:00Z"),
        new Date("2025-01-15T17:00:00Z"),
      );

      expect(isAvailable).toBe(false);
    });
  });
});
