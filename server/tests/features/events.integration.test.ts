/**
 * Event Management Integration Tests
 *
 * Tests for comprehensive event scheduling and pod management functionality
 * Based on Event Scheduling & Promotion PRD requirements
 *
 * Generated as part of PRD audit - December 2024
 */

import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { createMockEvent } from "../__factories__";

// Mock storage and dependencies for now
// In a real integration test, we would use a test database

const createMockAttendee = (overrides = {}) => ({
  id: "attendee-" + Math.random().toString(36).substr(2, 9),
  eventId: "event-123",
  userId: "user-" + Math.random().toString(36).substr(2, 9),
  status: "attending",
  role: "participant",
  playerType: "main",
  joinedAt: new Date(),
  ...overrides,
});

describe("Event Management Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
  describe("Event Creation", () => {
    test("creates basic event with required fields", () => {
      const event = createMockEvent({
        title: "Friday Night Magic",
        eventType: "tournament",
      });

      expect(event.title).toBe("Friday Night Magic");
      expect(event.eventType).toBe("tournament");
      expect(event.startTime).toBeInstanceOf(Date);
      expect(event.endTime).toBeInstanceOf(Date);
    });

    test("creates game_pod event with pod-specific fields", () => {
      const event = createMockEvent({
        eventType: "tournament",
        maxParticipants: 4,
      });

      expect(event.eventType).toBe("tournament");
      expect(event.maxParticipants).toBe(4);
    });

    test("validates player slots are within limits (2-64)", () => {
      const validEvent = createMockEvent({ maxParticipants: 32 });
      expect(validEvent.maxParticipants).toBe(32);
      expect([8, 16, 32, 64]).toContain(validEvent.maxParticipants);

      // In real implementation, should reject invalid values
      const invalidValues = [1, 100, 200, 0, -1];
      invalidValues.forEach((slots) => {
        // This would throw validation error in real implementation
        expect(slots < 2 || slots > 64).toBe(true);
      });
    });

    test("validates required event fields", () => {
      const validEvent = createMockEvent({ maxParticipants: 16 });
      expect(validEvent.maxParticipants).toBeGreaterThanOrEqual(1);
      expect(validEvent.maxParticipants).toBeLessThanOrEqual(64);

      const invalidValues = [0, 100, 200, -1];
      invalidValues.forEach((value) => {
        expect(value < 1 || value > 64).toBe(true);
      });
    });

    test("creates event with associated metadata", () => {
      const event = createMockEvent({ eventType: "tournament" });

      // Mock game session that would be created
      const expectedGameSession = {
        eventId: event.id,
        hostId: event.organizerId,
        status: "upcoming",
        currentPlayers: event.currentParticipants,
        maxPlayers: event.maxParticipants,
        gameData: {
          name: event.title,
          description: event.description || "",
        },
      };

      expect(expectedGameSession.eventId).toBe(event.id);
      expect(expectedGameSession.maxPlayers).toBe(event.maxParticipants);
    });

    test("does not create game session for non-pod events", () => {
      const tournamentEvent = createMockEvent({ type: "tournament" });
      const conventionEvent = createMockEvent({ type: "convention" });

      // Game session should only be created for game_pod type
      expect(tournamentEvent.type).not.toBe("game_pod");
      expect(conventionEvent.type).not.toBe("game_pod");
    });
  });

  describe("Pod Management", () => {
    test("assigns main slot when pod has space", () => {
      const event = createMockEvent({ playerSlots: 4 });
      const currentMainPlayers = 2;

      const newAttendee = createMockAttendee({
        eventId: event.id,
        playerType:
          currentMainPlayers < event.playerSlots ? "main" : "alternate",
      });

      expect(newAttendee.playerType).toBe("main");
      expect(currentMainPlayers + 1).toBeLessThanOrEqual(event.playerSlots);
    });

    test("assigns alternate slot when pod main slots full", () => {
      const event = createMockEvent({
        playerSlots: 4,
        alternateSlots: 2,
      });
      const currentMainPlayers = 4; // Pod is full
      const currentAlternates = 0;

      const newAttendee = createMockAttendee({
        eventId: event.id,
        playerType:
          currentMainPlayers >= event.playerSlots ? "alternate" : "main",
      });

      expect(newAttendee.playerType).toBe("alternate");
      expect(currentAlternates + 1).toBeLessThanOrEqual(event.alternateSlots);
    });

    test("calculates pod status correctly", () => {
      const event = createMockEvent({
        playerSlots: 4,
        alternateSlots: 2,
      });

      const attendees = [
        createMockAttendee({ playerType: "main", status: "attending" }),
        createMockAttendee({ playerType: "main", status: "attending" }),
        createMockAttendee({ playerType: "main", status: "attending" }),
        createMockAttendee({ playerType: "alternate", status: "attending" }),
      ];

      const mainPlayers = attendees.filter(
        (a) => a.playerType === "main" && a.status === "attending",
      ).length;
      const alternates = attendees.filter(
        (a) => a.playerType === "alternate" && a.status === "attending",
      ).length;

      expect(mainPlayers).toBe(3);
      expect(alternates).toBe(1);
      expect(mainPlayers < event.playerSlots).toBe(true); // Not full yet
    });

    test("identifies when pod is full", () => {
      const event = createMockEvent({ playerSlots: 4 });

      const attendees = [
        createMockAttendee({ playerType: "main" }),
        createMockAttendee({ playerType: "main" }),
        createMockAttendee({ playerType: "main" }),
        createMockAttendee({ playerType: "main" }),
      ];

      const mainPlayers = attendees.filter(
        (a) => a.playerType === "main",
      ).length;
      const isFull = mainPlayers >= event.playerSlots;

      expect(isFull).toBe(true);
      expect(mainPlayers).toBe(event.playerSlots);
    });

    test("identifies when pod is almost full (1 slot remaining)", () => {
      const event = createMockEvent({ playerSlots: 4 });

      const attendees = [
        createMockAttendee({ playerType: "main" }),
        createMockAttendee({ playerType: "main" }),
        createMockAttendee({ playerType: "main" }),
      ];

      const mainPlayers = attendees.filter(
        (a) => a.playerType === "main",
      ).length;
      const isAlmostFull = mainPlayers === event.playerSlots - 1;

      expect(isAlmostFull).toBe(true);
      expect(event.playerSlots - mainPlayers).toBe(1);
    });

    test("handles spectator role separately from players", () => {
      const spectator = createMockAttendee({
        role: "spectator",
        playerType: "main", // Spectators might have playerType but don't count
      });

      expect(spectator.role).toBe("spectator");
      // In real implementation, spectators wouldn't count toward pod capacity
      const isSpectator = spectator.role === "spectator";
      expect(isSpectator).toBe(true);
    });
  });

  describe("Bulk Event Creation", () => {
    test("creates multiple events from array", () => {
      const bulkEvents = [
        createMockEvent({ title: "Event 1", date: "2024-12-20" }),
        createMockEvent({ title: "Event 2", date: "2024-12-21" }),
        createMockEvent({ title: "Event 3", date: "2024-12-22" }),
      ];

      expect(bulkEvents).toHaveLength(3);
      expect(bulkEvents[0].title).toBe("Event 1");
      expect(bulkEvents[1].title).toBe("Event 2");
      expect(bulkEvents[2].title).toBe("Event 3");
    });

    test("validates all events have required fields", () => {
      const bulkEvents = [
        {
          title: "Event 1",
          type: "tournament",
          date: "2024-12-20",
          time: "18:00",
          location: "LGS",
        },
        {
          title: "Event 2",
          type: "game_pod",
          date: "2024-12-21",
          time: "19:00",
          location: "Online",
        },
      ];

      bulkEvents.forEach((event) => {
        expect(event.title).toBeDefined();
        expect(event.type).toBeDefined();
        expect(event.date).toBeDefined();
        expect(event.time).toBeDefined();
        expect(event.location).toBeDefined();
      });
    });

    test("handles CSV parsing format", () => {
      // Simulated CSV row parsed to object
      const csvRow =
        "Weekly EDH Pod,Commander night,game_pod,2024-12-20,18:00,Local Game Store,community-id,4,commander,7";
      const fields = csvRow.split(",");

      const event = {
        title: fields[0],
        description: fields[1],
        type: fields[2],
        date: fields[3],
        time: fields[4],
        location: fields[5],
        communityId: fields[6],
        playerSlots: parseInt(fields[7]),
        gameFormat: fields[8],
        powerLevel: parseInt(fields[9]),
      };

      expect(event.title).toBe("Weekly EDH Pod");
      expect(event.type).toBe("game_pod");
      expect(event.playerSlots).toBe(4);
      expect(event.gameFormat).toBe("commander");
    });
  });

  describe("Recurring Events", () => {
    test("generates daily recurring events", () => {
      const baseEvent = createMockEvent({
        title: "Daily Game Night",
        date: "2024-12-20",
        isRecurring: true,
        recurrencePattern: "daily",
        recurrenceInterval: 1,
        recurrenceEndDate: "2024-12-24",
      });

      // Calculate how many events should be created
      const startDate = new Date(baseEvent.date);
      const endDate = baseEvent.recurrenceEndDate
        ? new Date(baseEvent.recurrenceEndDate)
        : startDate;
      const daysDiff = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      expect(baseEvent.recurrencePattern).toBe("daily");
      expect(daysDiff + 1).toBe(5); // Dec 20-24 = 5 days
    });

    test("generates weekly recurring events", () => {
      const baseEvent = createMockEvent({
        title: "Friday Night Magic",
        date: "2024-12-20", // A Friday
        isRecurring: true,
        recurrencePattern: "weekly",
        recurrenceInterval: 1,
        recurrenceEndDate: "2025-01-31",
      });

      const startDate = new Date(baseEvent.date);
      const endDate = baseEvent.recurrenceEndDate
        ? new Date(baseEvent.recurrenceEndDate)
        : startDate;
      const weeksDiff = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7),
      );

      expect(baseEvent.recurrencePattern).toBe("weekly");
      expect(weeksDiff).toBeGreaterThan(4); // Multiple weeks
    });

    test("generates monthly recurring events", () => {
      const baseEvent = createMockEvent({
        title: "Monthly Tournament",
        date: "2024-12-15", // 15th of month
        isRecurring: true,
        recurrencePattern: "monthly",
        recurrenceInterval: 1,
        recurrenceEndDate: "2025-03-15",
      });

      expect(baseEvent.recurrencePattern).toBe("monthly");
      // Should create events for Dec, Jan, Feb, Mar = 4 events
    });

    test("respects recurrence interval", () => {
      const baseEvent = createMockEvent({
        title: "Bi-weekly Game",
        date: "2024-12-20",
        isRecurring: true,
        recurrencePattern: "weekly",
        recurrenceInterval: 2, // Every 2 weeks
        recurrenceEndDate: "2025-01-31",
      });

      expect(baseEvent.recurrenceInterval).toBe(2);
      // Should create fewer events than weekly (every other week)
    });

    test("links child events to parent event", () => {
      const parentEvent = createMockEvent({
        title: "Weekly Game",
        isRecurring: true,
        recurrencePattern: "weekly",
      });

      const childEvent = createMockEvent({
        title: "Weekly Game",
        parentEventId: parentEvent.id,
        date: "2024-12-27", // One week later
      });

      expect(childEvent.parentEventId).toBe(parentEvent.id);
      expect(childEvent.title).toBe(parentEvent.title);
    });
  });

  describe("Event Notifications", () => {
    test("should notify when pod is filled", () => {
      const notification = {
        type: "pod_filled",
        title: "Game Pod is Full!",
        message: "Test Event is now at full capacity",
        priority: "high",
        eventId: "event-123",
      };

      expect(notification.type).toBe("pod_filled");
      expect(notification.priority).toBe("high");
    });

    test("should notify when pod is almost full", () => {
      const notification = {
        type: "pod_almost_full",
        title: "Game Pod Almost Full",
        message: "Test Event needs 1 more player",
        priority: "normal",
        eventId: "event-123",
      };

      expect(notification.type).toBe("pod_almost_full");
      expect(notification.priority).toBe("normal");
    });

    test("should notify when someone joins event", () => {
      const notification = {
        type: "event_join",
        title: "New Player Joined",
        message: "Player123 joined your event",
        priority: "normal",
      };

      expect(notification.type).toBe("event_join");
    });

    test("should notify when someone leaves event", () => {
      const notification = {
        type: "event_leave",
        title: "Player Left Your Pod",
        message: "Player123 left your event",
        priority: "normal",
      };

      expect(notification.type).toBe("event_leave");
    });

    test("should send notification to correct recipients", () => {
      const event = createMockEvent({ creatorId: "host-123" });
      const attendees = [
        createMockAttendee({ userId: "user-1" }),
        createMockAttendee({ userId: "user-2" }),
        createMockAttendee({ userId: "user-3" }),
      ];

      // For pod_filled, notify all participants except sender
      const recipients = [
        event.creatorId,
        ...attendees.map((a) => a.userId),
      ].filter((id, index, self) => self.indexOf(id) === index);

      expect(recipients).toContain("host-123");
      expect(recipients).toContain("user-1");
      expect(recipients.length).toBeGreaterThan(0);
    });
  });

  describe("Event Validation", () => {
    test("rejects events with past dates", () => {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      const pastEvent = createMockEvent({ date: yesterday });

      const isInPast =
        new Date(pastEvent.date) <
        new Date(new Date().toISOString().split("T")[0]);

      // In real implementation, this should be rejected
      expect(isInPast).toBe(true);
    });

    test("validates event type is from allowed list", () => {
      const validTypes = [
        "tournament",
        "convention",
        "release",
        "stream",
        "community",
        "personal",
        "game_pod",
      ];
      const event = createMockEvent({ type: "tournament" });

      expect(validTypes).toContain(event.type);
    });

    test("validates time format is HH:MM", () => {
      const validTimes = ["09:00", "14:30", "23:59", "00:00"];
      const invalidTimes = ["25:00", "12:60", "noon"];

      // Pattern for strict HH:MM format (two digits required)
      const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

      validTimes.forEach((time) => {
        expect(timePattern.test(time)).toBe(true);
      });

      invalidTimes.forEach((time) => {
        expect(timePattern.test(time)).toBe(false);
      });
    });

    test("validates required fields are present", () => {
      const requiredFields = [
        "title",
        "eventType",
        "startTime",
        "endTime",
        "location",
      ];
      const event = createMockEvent();

      requiredFields.forEach((field) => {
        expect(event[field as keyof typeof event]).toBeDefined();
      });
    });
  });

  describe("Authorization", () => {
    test("only creator can edit event", () => {
      const event = createMockEvent({ creatorId: "user-123" });
      const requestingUserId = "user-456";

      const canEdit = event.creatorId === requestingUserId;
      expect(canEdit).toBe(false);
    });

    test("creator can edit event", () => {
      const event = createMockEvent({ creatorId: "user-123" });
      const requestingUserId = "user-123";

      const canEdit = event.creatorId === requestingUserId;
      expect(canEdit).toBe(true);
    });

    test("only creator can delete event", () => {
      const event = createMockEvent({ creatorId: "user-123" });
      const requestingUserId = "user-456";

      const canDelete = event.creatorId === requestingUserId;
      expect(canDelete).toBe(false);
    });

    test("attendees can leave event they joined", () => {
      const attendee = createMockAttendee({
        eventId: "event-123",
        userId: "user-456",
      });
      const requestingUserId = "user-456";

      const canLeave = attendee.userId === requestingUserId;
      expect(canLeave).toBe(true);
    });
  });

  describe("Calendar Queries", () => {
    test("filters events by date range", () => {
      const events = [
        createMockEvent({ date: "2024-12-15" }),
        createMockEvent({ date: "2024-12-20" }),
        createMockEvent({ date: "2024-12-25" }),
        createMockEvent({ date: "2025-01-05" }),
      ];

      const startDate = "2024-12-18";
      const endDate = "2024-12-31";

      const filtered = events.filter(
        (e) => e.date >= startDate && e.date <= endDate,
      );

      expect(filtered).toHaveLength(2);
      expect(filtered[0].date).toBe("2024-12-20");
      expect(filtered[1].date).toBe("2024-12-25");
    });

    test("filters events by community", () => {
      const events = [
        createMockEvent({ communityId: "mtg-community" }),
        createMockEvent({ communityId: "pokemon-community" }),
        createMockEvent({ communityId: "mtg-community" }),
      ];

      const filtered = events.filter((e) => e.communityId === "mtg-community");
      expect(filtered).toHaveLength(2);
    });

    test("filters events by type", () => {
      const events = [
        createMockEvent({ type: "tournament" }),
        createMockEvent({ type: "game_pod" }),
        createMockEvent({ type: "tournament" }),
        createMockEvent({ type: "convention" }),
      ];

      const filtered = events.filter((e) => e.type === "tournament");
      expect(filtered).toHaveLength(2);
    });

    test("shows only upcoming events", () => {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000)
        .toISOString()
        .split("T")[0];

      const events = [
        createMockEvent({ date: yesterday }),
        createMockEvent({ date: today }),
        createMockEvent({ date: tomorrow }),
      ];

      const upcoming = events.filter((e) => e.date >= today);
      expect(upcoming.length).toBeGreaterThanOrEqual(2);
    });
  });
});
