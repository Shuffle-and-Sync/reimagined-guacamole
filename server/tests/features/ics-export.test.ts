/**
 * ICS Export Service Tests
 *
 * Tests for ICS (iCalendar) file generation functionality
 */

import { describe, test, expect } from "@jest/globals";
import { icsService } from "../../features/events/ics.service";

describe("ICS Service", () => {
  describe("generateSingleEventICS", () => {
    test("should generate valid ICS for single event", async () => {
      const event = {
        id: "test-123",
        title: "Test Tournament",
        description: "A test tournament event",
        location: "Online",
        startTime: new Date("2025-11-01T14:00:00"),
        endTime: new Date("2025-11-01T18:00:00"),
        timezone: "America/New_York",
        type: "tournament",
        creatorId: "user-1",
        communityId: "comm-1",
      };

      const result = await icsService.generateSingleEventICS(event);

      expect(result.error).toBeFalsy();
      expect(result.value).toBeDefined();
      expect(result.value).toContain("BEGIN:VCALENDAR");
      expect(result.value).toContain("END:VCALENDAR");
      expect(result.value).toContain("Test Tournament");
      expect(result.value).toContain("A test tournament event");
      expect(result.value).toContain("Online");
      expect(result.value).toContain("CATEGORIES:tournament");
    });

    test("should generate valid ICS with default end time when endTime is null", async () => {
      const event = {
        id: "test-456",
        title: "Quick Event",
        startTime: new Date("2025-11-01T14:00:00"),
        endTime: null,
        type: "community",
        creatorId: "user-1",
        location: null,
        description: null,
        timezone: null,
        communityId: null,
      };

      const result = await icsService.generateSingleEventICS(event);

      expect(result.error).toBeFalsy();
      expect(result.value).toBeDefined();
      expect(result.value).toContain("BEGIN:VCALENDAR");
      expect(result.value).toContain("Quick Event");
    });

    test("should include unique UID for each event", async () => {
      const event = {
        id: "unique-event-id",
        title: "Unique Event",
        startTime: new Date("2025-11-01T14:00:00"),
        endTime: new Date("2025-11-01T15:00:00"),
        type: "stream",
        creatorId: "user-1",
        location: null,
        description: null,
        timezone: null,
        communityId: null,
      };

      const result = await icsService.generateSingleEventICS(event);

      expect(result.error).toBeFalsy();
      expect(result.value).toContain(
        "UID:shuffle-sync-event-unique-event-id@shuffleandsync.com",
      );
    });
  });

  describe("generateMultipleEventsICS", () => {
    test("should generate valid ICS for multiple events", async () => {
      const events = [
        {
          id: "event-1",
          title: "First Event",
          startTime: new Date("2025-11-01T14:00:00"),
          endTime: new Date("2025-11-01T16:00:00"),
          type: "tournament",
          creatorId: "user-1",
          location: null,
          description: null,
          timezone: null,
          communityId: null,
        },
        {
          id: "event-2",
          title: "Second Event",
          startTime: new Date("2025-11-02T14:00:00"),
          endTime: new Date("2025-11-02T16:00:00"),
          type: "convention",
          creatorId: "user-1",
          location: null,
          description: null,
          timezone: null,
          communityId: null,
        },
      ];

      const result = await icsService.generateMultipleEventsICS(events);

      expect(result.error).toBeFalsy();
      expect(result.value).toBeDefined();
      expect(result.value).toContain("BEGIN:VCALENDAR");
      expect(result.value).toContain("First Event");
      expect(result.value).toContain("Second Event");
    });

    test("should handle empty events array", async () => {
      const events: Array<{
        id: string;
        title: string;
        startTime: Date;
        endTime: Date | null;
        type: string;
        creatorId: string;
        location: string | null;
        description: string | null;
        timezone: string | null;
        communityId: string | null;
      }> = [];

      const result = await icsService.generateMultipleEventsICS(events);

      expect(result.error).toBeFalsy();
      expect(result.value).toBeDefined();
      expect(result.value).toContain("BEGIN:VCALENDAR");
      expect(result.value).toContain("END:VCALENDAR");
    });
  });

  describe("generateFilename", () => {
    test("should generate filename with event title and date", () => {
      const event = {
        id: "test-123",
        title: "Magic Tournament 2025",
        startTime: new Date("2025-11-01T14:00:00"),
        endTime: new Date("2025-11-01T18:00:00"),
        type: "tournament",
        creatorId: "user-1",
        location: null,
        description: null,
        timezone: null,
        communityId: null,
      };

      const filename = icsService.generateFilename(event);

      expect(filename).toMatch(/magic-tournament-2025-\d{4}-\d{2}-\d{2}\.ics/);
    });

    test("should sanitize special characters in title", () => {
      const event = {
        id: "test-456",
        title: "Event @#$% with Special! Characters?",
        startTime: new Date("2025-11-01T14:00:00"),
        endTime: new Date("2025-11-01T18:00:00"),
        type: "community",
        creatorId: "user-1",
        location: null,
        description: null,
        timezone: null,
        communityId: null,
      };

      const filename = icsService.generateFilename(event);

      expect(filename).not.toContain("@");
      expect(filename).not.toContain("#");
      expect(filename).not.toContain("$");
      expect(filename).not.toContain("%");
      expect(filename).not.toContain("!");
      expect(filename).not.toContain("?");
      expect(filename).toContain("-");
    });

    test("should generate default filename when no event provided", () => {
      const filename = icsService.generateFilename();

      expect(filename).toMatch(/shuffle-sync-events-\d{4}-\d{2}-\d{2}\.ics/);
    });
  });
});
