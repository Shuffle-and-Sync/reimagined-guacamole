/**
 * EventRepository Tests
 *
 * Comprehensive test suite for the EventRepository class
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import type { Database } from "@shared/database-unified";
import type { InsertEvent, InsertEventAttendee } from "@shared/schema";
import { RepositoryFactory } from "../../repositories/base/RepositoryFactory";
import { EventRepository } from "../../repositories/EventRepository";

// Mock database
const createMockDb = () => {
  const mockSelect = jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
        orderBy: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
      }),
      leftJoin: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockReturnThis(),
    }),
  });

  const mockInsert = jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([
        {
          id: "test-event-id",
          title: "Test Event",
          type: "tournament",
          startTime: new Date("2025-12-01T10:00:00Z"),
          creatorId: "test-creator-id",
          hostId: "test-host-id",
          status: "scheduled",
        },
      ]),
    }),
  });

  const mockUpdate = jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([
          {
            id: "test-event-id",
            title: "Updated Event",
            type: "tournament",
            startTime: new Date("2025-12-01T10:00:00Z"),
            creatorId: "test-creator-id",
            hostId: "test-host-id",
            status: "scheduled",
          },
        ]),
      }),
    }),
  });

  const mockDelete = jest.fn().mockReturnValue({
    where: jest.fn().mockResolvedValue(undefined),
  });

  return {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  } as unknown as Database;
};

describe("EventRepository", () => {
  let repository: EventRepository;
  let mockDb: Database;

  beforeEach(() => {
    jest.clearAllMocks();
    RepositoryFactory.clearAll();
    mockDb = createMockDb();
    repository = new EventRepository(mockDb);
  });

  afterEach(() => {
    RepositoryFactory.clearAll();
    jest.clearAllTimers();
  });

  describe("constructor", () => {
    it("should create an instance with default database", () => {
      const repo = new EventRepository();
      expect(repo).toBeInstanceOf(EventRepository);
    });

    it("should create an instance with custom database", () => {
      const customRepo = new EventRepository(mockDb);
      expect(customRepo).toBeInstanceOf(EventRepository);
    });
  });

  describe("create", () => {
    it("should create a new event", async () => {
      const eventData: InsertEvent = {
        title: "Test Event",
        description: "Test Description",
        type: "tournament",
        startTime: new Date("2025-12-01T10:00:00Z"),
        endTime: new Date("2025-12-01T12:00:00Z"),
        location: "Test Location",
        creatorId: "test-creator-id",
        hostId: "test-host-id",
        isVirtual: false,
        status: "scheduled",
      };

      const event = await repository.create(eventData);

      expect(event).toBeDefined();
      expect(event.id).toBe("test-event-id");
      expect(event.title).toBe("Test Event");
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("getEvents", () => {
    it("should call database with correct query", async () => {
      const mockEvents = [
        {
          id: "event-1",
          title: "Event 1",
          type: "tournament",
          startTime: new Date("2025-12-01T10:00:00Z"),
          creatorId: "creator-1",
          hostId: "host-1",
          status: "scheduled",
          creator: { id: "creator-1", email: "test@example.com" },
          community: null,
        },
      ];

      (mockDb.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockResolvedValue(mockEvents),
        }),
      });

      // Also mock the attendee count query
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue(mockEvents),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              groupBy: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

      await repository.getEvents();

      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should handle filters correctly", async () => {
      const filters = {
        communityId: "test-community",
        type: "tournament",
        upcoming: true,
      };

      (mockDb.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockResolvedValue([]),
        }),
      });

      await repository.getEvents(filters);

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe("getEvent", () => {
    it("should retrieve event by ID", async () => {
      const mockEvent = {
        id: "event-1",
        title: "Single Event",
        type: "tournament",
        startTime: new Date("2025-12-01T10:00:00Z"),
        creatorId: "creator-1",
        hostId: "host-1",
        status: "scheduled",
        creator: { id: "creator-1", email: "test@example.com" },
        community: null,
      };

      (mockDb.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockEvent]),
          }),
        }),
      });

      const _event = await repository.getEvent("event-1");

      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should return null for non-existent event", async () => {
      (mockDb.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const event = await repository.getEvent("non-existent-id");
      expect(event).toBeNull();
    });
  });

  describe("update", () => {
    it("should update an event", async () => {
      const updated = await repository.update("test-event-id", {
        title: "Updated Title",
      });

      expect(updated).toBeDefined();
      expect(updated.title).toBe("Updated Event");
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete an event", async () => {
      (mockDb.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: "test-event-id" }]),
        }),
      });

      const result = await repository.delete("test-event-id");

      expect(mockDb.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe("createBulkEvents", () => {
    it("should create multiple events at once", async () => {
      const eventsData: InsertEvent[] = [
        {
          title: "Bulk Event 1",
          type: "tournament",
          startTime: new Date("2025-12-01T10:00:00Z"),
          creatorId: "creator-1",
          hostId: "host-1",
          status: "scheduled",
        },
        {
          title: "Bulk Event 2",
          type: "casual",
          startTime: new Date("2025-12-02T10:00:00Z"),
          creatorId: "creator-1",
          hostId: "host-1",
          status: "scheduled",
        },
      ];

      (mockDb.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            { id: "1", ...eventsData[0] },
            { id: "2", ...eventsData[1] },
          ]),
        }),
      });

      const _events = await repository.createBulkEvents(eventsData);

      expect(_events).toBeDefined();
      expect(_events.length).toBe(2);
    });

    it("should return empty array for empty input", async () => {
      (mockDb.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      const events = await repository.createBulkEvents([]);
      expect(events).toEqual([]);
    });
  });

  describe("joinEvent", () => {
    it("should add attendee to event", async () => {
      const attendeeData: InsertEventAttendee = {
        eventId: "event-123",
        userId: "user-123",
        status: "confirmed",
      };

      (mockDb.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([{ id: "attendee-1", ...attendeeData }]),
        }),
      });

      const attendee = await repository.joinEvent(attendeeData);

      expect(attendee).toBeDefined();
      expect(attendee.eventId).toBe("event-123");
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("leaveEvent", () => {
    it("should remove attendee from event", async () => {
      await repository.leaveEvent("event-123", "user-123");

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe("getEventAttendees", () => {
    it("should return all attendees for an event", async () => {
      const mockAttendees = [
        {
          id: "1",
          eventId: "event-123",
          userId: "user-1",
          status: "confirmed",
        },
        {
          id: "2",
          eventId: "event-123",
          userId: "user-2",
          status: "confirmed",
        },
      ];

      (mockDb.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockAttendees),
        }),
      });

      const attendees = await repository.getEventAttendees("event-123");

      expect(attendees).toBeDefined();
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe("RepositoryFactory integration", () => {
    it("should return singleton instance", () => {
      const repo1 = RepositoryFactory.getRepository(EventRepository);
      const repo2 = RepositoryFactory.getRepository(EventRepository);

      expect(repo1).toBe(repo2);
    });

    it("should clear instance", () => {
      const repo1 = RepositoryFactory.getRepository(EventRepository);
      RepositoryFactory.clear(EventRepository);
      const repo2 = RepositoryFactory.getRepository(EventRepository);

      expect(repo1).not.toBe(repo2);
    });
  });
});
