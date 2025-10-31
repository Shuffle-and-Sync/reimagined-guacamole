import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { Event } from "@shared/schema";
import { eventStatusService } from "../../features/events/event-status.service";
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
          orderBy: jest.fn(() =>
            Promise.resolve([
              {
                id: "history-1",
                eventId: "event-1",
                previousStatus: null,
                newStatus: "draft",
                changedBy: "user-1",
                reason: "Initial creation",
                changedAt: new Date("2024-01-01"),
              },
              {
                id: "history-2",
                eventId: "event-1",
                previousStatus: "draft",
                newStatus: "active",
                changedBy: "user-1",
                reason: "Event started",
                changedAt: new Date("2024-01-02"),
              },
            ]),
          ),
        })),
      })),
    })),
  },
}));

describe("Event Status Service Integration Tests", () => {
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
    jest.clearAllMocks();
    (storage.getEvent as jest.Mock).mockResolvedValue(mockEvent);
    (storage.updateEvent as jest.Mock).mockResolvedValue({
      ...mockEvent,
      status: "active",
    });
    (storage.getEventAttendees as jest.Mock).mockResolvedValue([]);
  });

  describe("Status history retrieval", () => {
    it("should retrieve status history for an event", async () => {
      const history = await eventStatusService.getStatusHistory("event-1");

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(2);
      expect(history[0].previousStatus).toBeNull();
      expect(history[0].newStatus).toBe("draft");
      expect(history[1].newStatus).toBe("active");
    });
  });

  describe("Status update workflow", () => {
    it("should complete full status workflow from draft to active", async () => {
      const result = await eventStatusService.updateStatus(
        "event-1",
        "active",
        "user-1",
        "Starting the event",
      );

      expect(result.success).toBe(true);
      expect(result.event).toBeDefined();
      expect(result.history).toBeDefined();
    });

    it("should fail to skip from draft to completed", async () => {
      const result = await eventStatusService.updateStatus(
        "event-1",
        "completed",
        "user-1",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot transition");
    });

    it("should allow cancellation from draft", async () => {
      const result = await eventStatusService.updateStatus(
        "event-1",
        "cancelled",
        "user-1",
        "Event cancelled",
      );

      expect(result.success).toBe(true);
    });

    it("should prevent transitions from final states", async () => {
      (storage.getEvent as jest.Mock).mockResolvedValue({
        ...mockEvent,
        status: "completed",
      });

      const result = await eventStatusService.updateStatus(
        "event-1",
        "active",
        "user-1",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("final state");
    });
  });

  describe("Authorization checks", () => {
    it("should allow creator to update status", async () => {
      const result = await eventStatusService.updateStatus(
        "event-1",
        "active",
        "user-1", // Same as creatorId
      );

      expect(result.success).toBe(true);
    });

    it("should prevent non-creator from updating status", async () => {
      const result = await eventStatusService.updateStatus(
        "event-1",
        "active",
        "user-2", // Different from creatorId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Not authorized");
    });

    it("should allow automatic updates without userId", async () => {
      const result = await eventStatusService.updateStatus(
        "event-1",
        "active",
        undefined, // Automatic update
      );

      expect(result.success).toBe(true);
    });
  });

  describe("Status validation", () => {
    it("should validate all allowed transitions", async () => {
      const validTransitions = [
        { from: "draft", to: "active", expected: true },
        { from: "draft", to: "cancelled", expected: true },
        { from: "active", to: "completed", expected: true },
        { from: "active", to: "cancelled", expected: true },
        { from: "draft", to: "completed", expected: false },
        { from: "completed", to: "active", expected: false },
        { from: "cancelled", to: "active", expected: false },
      ];

      for (const transition of validTransitions) {
        const result = eventStatusService.validateStatusTransition(
          transition.from as any,
          transition.to as any,
        );
        expect(result.isValid).toBe(transition.expected);
      }
    });
  });

  describe("Expired events processing", () => {
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
    });

    it("should process expired events and return results", async () => {
      const result = await eventStatusService.processExpiredEvents();

      expect(result).toBeDefined();
      expect(typeof result.processed).toBe("number");
      expect(typeof result.activated).toBe("number");
      expect(typeof result.completed).toBe("number");
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("should handle errors during processing gracefully", async () => {
      (storage.updateEvent as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      const result = await eventStatusService.processExpiredEvents();

      expect(result).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});
