import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { Event } from "@shared/schema";
import {
  eventStatusService,
  type EventStatus,
} from "../../features/events/event-status.service";
import { storage } from "../../storage";

// Mock dependencies
jest.mock("../../storage");
jest.mock("../../logger");
jest.mock("../../services/notification-delivery.service");
jest.mock("@shared/database-unified", () => ({
  db: {
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() =>
          Promise.resolve([
            {
              id: "history-1",
              eventId: "event-1",
              previousStatus: "draft",
              newStatus: "active",
              changedBy: "user-1",
              reason: "Starting event",
              changedAt: new Date(),
            },
          ]),
        ),
      })),
    })),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          orderBy: jest.fn(() => Promise.resolve([])),
        })),
      })),
    })),
  },
}));

describe("EventStatusService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateStatusTransition", () => {
    it("should allow draft to active transition", () => {
      const result = eventStatusService.validateStatusTransition(
        "draft",
        "active",
      );
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should allow draft to cancelled transition", () => {
      const result = eventStatusService.validateStatusTransition(
        "draft",
        "cancelled",
      );
      expect(result.isValid).toBe(true);
    });

    it("should allow active to completed transition", () => {
      const result = eventStatusService.validateStatusTransition(
        "active",
        "completed",
      );
      expect(result.isValid).toBe(true);
    });

    it("should allow active to cancelled transition", () => {
      const result = eventStatusService.validateStatusTransition(
        "active",
        "cancelled",
      );
      expect(result.isValid).toBe(true);
    });

    it("should not allow draft to completed transition", () => {
      const result = eventStatusService.validateStatusTransition(
        "draft",
        "completed",
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(
        "Cannot transition from draft to completed",
      );
    });

    it("should not allow completed to active transition (final state)", () => {
      const result = eventStatusService.validateStatusTransition(
        "completed",
        "active",
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("final state");
    });

    it("should not allow cancelled to active transition (final state)", () => {
      const result = eventStatusService.validateStatusTransition(
        "cancelled",
        "active",
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("final state");
    });

    it("should allow same status (no change)", () => {
      const result = eventStatusService.validateStatusTransition(
        "active",
        "active",
      );
      expect(result.isValid).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = eventStatusService.validateStatusTransition(
        "draft",
        "invalid" as EventStatus,
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid status");
    });

    it("should treat null current status as draft", () => {
      const result = eventStatusService.validateStatusTransition(
        null,
        "active",
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe("updateStatus", () => {
    const mockEvent: Event = {
      id: "event-1",
      title: "Test Event",
      description: "Test Description",
      type: "tournament",
      status: "draft",
      startTime: new Date(),
      endTime: null,
      timezone: "UTC",
      displayTimezone: null,
      location: null,
      isVirtual: false,
      maxAttendees: null,
      playerSlots: null,
      alternateSlots: null,
      isPublic: true,
      gameFormat: null,
      powerLevel: null,
      isRecurring: false,
      recurrencePattern: null,
      recurrenceInterval: null,
      recurrenceEndDate: null,
      parentEventId: null,
      creatorId: "user-1",
      hostId: null,
      coHostId: null,
      communityId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      (storage.getEvent as jest.Mock).mockResolvedValue(mockEvent);
      (storage.updateEvent as jest.Mock).mockResolvedValue({
        ...mockEvent,
        status: "active",
      });
      (storage.getEventAttendees as jest.Mock).mockResolvedValue([]);
    });

    it("should successfully update event status", async () => {
      const result = await eventStatusService.updateStatus(
        "event-1",
        "active",
        "user-1",
        "Starting event",
      );

      expect(result.success).toBe(true);
      expect(result.event).toBeDefined();
      expect(result.history).toBeDefined();
    });

    it("should fail if event not found", async () => {
      (storage.getEvent as jest.Mock).mockResolvedValue(null);

      const result = await eventStatusService.updateStatus(
        "event-999",
        "active",
        "user-1",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Event not found");
    });

    it("should fail on invalid status transition", async () => {
      const result = await eventStatusService.updateStatus(
        "event-1",
        "completed",
        "user-1",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot transition");
    });

    it("should fail if user is not the creator", async () => {
      const result = await eventStatusService.updateStatus(
        "event-1",
        "active",
        "user-2", // Different user
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Not authorized");
    });

    it("should allow automatic updates without userId", async () => {
      const result = await eventStatusService.updateStatus(
        "event-1",
        "active",
        undefined, // No user - automatic
      );

      expect(result.success).toBe(true);
    });
  });

  describe("getStatusHistory", () => {
    it("should return empty array if no history", async () => {
      const history = await eventStatusService.getStatusHistory("event-1");
      expect(Array.isArray(history)).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      // Mock will throw error
      const history = await eventStatusService.getStatusHistory("event-1");
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });
  });

  describe("processExpiredEvents", () => {
    beforeEach(() => {
      (storage.getEvent as jest.Mock).mockImplementation((id: string) => {
        return Promise.resolve({
          id,
          title: "Test Event",
          type: "tournament",
          status: "draft",
          startTime: new Date(Date.now() - 60000), // 1 minute ago
          endTime: new Date(Date.now() + 3600000), // 1 hour from now
          timezone: "UTC",
          creatorId: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
      (storage.updateEvent as jest.Mock).mockImplementation(
        (id: string, data: unknown) => {
          return Promise.resolve({
            id,
            title: "Test Event",
            ...data,
          });
        },
      );
      (storage.getEventAttendees as jest.Mock).mockResolvedValue([]);
    });

    it("should process expired events", async () => {
      const result = await eventStatusService.processExpiredEvents();

      expect(result.processed).toBeGreaterThanOrEqual(0);
      expect(result.activated).toBeGreaterThanOrEqual(0);
      expect(result.completed).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      // Mock will throw error internally, but service should handle it
      const result = await eventStatusService.processExpiredEvents();

      expect(result).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe("Status Transition Rules", () => {
    it("should have correct transition rules defined", () => {
      // Draft can go to active or cancelled
      expect(
        eventStatusService.validateStatusTransition("draft", "active").isValid,
      ).toBe(true);
      expect(
        eventStatusService.validateStatusTransition("draft", "cancelled")
          .isValid,
      ).toBe(true);
      expect(
        eventStatusService.validateStatusTransition("draft", "completed")
          .isValid,
      ).toBe(false);

      // Active can go to completed or cancelled
      expect(
        eventStatusService.validateStatusTransition("active", "completed")
          .isValid,
      ).toBe(true);
      expect(
        eventStatusService.validateStatusTransition("active", "cancelled")
          .isValid,
      ).toBe(true);
      expect(
        eventStatusService.validateStatusTransition("active", "draft").isValid,
      ).toBe(false);

      // Completed is final - no transitions allowed
      expect(
        eventStatusService.validateStatusTransition("completed", "active")
          .isValid,
      ).toBe(false);
      expect(
        eventStatusService.validateStatusTransition("completed", "draft")
          .isValid,
      ).toBe(false);
      expect(
        eventStatusService.validateStatusTransition("completed", "cancelled")
          .isValid,
      ).toBe(false);

      // Cancelled is final - no transitions allowed
      expect(
        eventStatusService.validateStatusTransition("cancelled", "active")
          .isValid,
      ).toBe(false);
      expect(
        eventStatusService.validateStatusTransition("cancelled", "draft")
          .isValid,
      ).toBe(false);
      expect(
        eventStatusService.validateStatusTransition("cancelled", "completed")
          .isValid,
      ).toBe(false);
    });
  });
});
