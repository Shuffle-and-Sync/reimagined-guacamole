import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { storage } from "../../storage";
import { CalendarSyncService } from "./calendar-sync.service";
import { googleCalendarService } from "./google-calendar.service";
import { outlookCalendarService } from "./outlook-calendar.service";

// Mock dependencies
jest.mock("../../storage");
jest.mock("./google-calendar.service");
jest.mock("./outlook-calendar.service");
jest.mock("../../logger");

describe("CalendarSyncService", () => {
  let calendarSyncService: CalendarSyncService;

  beforeEach(() => {
    jest.clearAllMocks();
    calendarSyncService = new CalendarSyncService();
  });

  describe("importEvents", () => {
    it("should throw error if connection not found", async () => {
      (storage.getCalendarConnection as jest.Mock).mockResolvedValue(undefined);

      await expect(
        calendarSyncService.importEvents("non-existent-id"),
      ).rejects.toThrow("Connection not found or sync disabled");
    });

    it("should throw error if sync is disabled", async () => {
      (storage.getCalendarConnection as jest.Mock).mockResolvedValue({
        id: "conn-1",
        userId: "user-1",
        provider: "google",
        providerAccountId: "google-user-1",
        accessToken: "token",
        refreshToken: null,
        expiresAt: null,
        calendarId: null,
        calendarName: null,
        syncEnabled: false,
        lastSyncAt: null,
        syncDirection: "both",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(calendarSyncService.importEvents("conn-1")).rejects.toThrow(
        "Connection not found or sync disabled",
      );
    });

    it("should import events from Google Calendar", async () => {
      const mockConnection = {
        id: "conn-1",
        userId: "user-1",
        provider: "google" as const,
        providerAccountId: "google-user-1",
        accessToken: "token",
        refreshToken: null,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        calendarId: null,
        calendarName: null,
        syncEnabled: true,
        lastSyncAt: null,
        syncDirection: "both" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (storage.getCalendarConnection as jest.Mock).mockResolvedValue(
        mockConnection,
      );
      (googleCalendarService.fetchEvents as jest.Mock).mockResolvedValue([]);
      (storage.upsertExternalEvent as jest.Mock).mockResolvedValue({
        id: "ext-1",
        connectionId: "conn-1",
        externalEventId: "google-event-1",
        internalEventId: null,
        title: "Test Event",
        description: null,
        location: null,
        startTime: new Date(),
        endTime: null,
        timezone: "UTC",
        isAllDay: false,
        status: "confirmed",
        rawData: "{}",
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (storage.updateCalendarConnection as jest.Mock).mockResolvedValue(
        mockConnection,
      );

      const result = await calendarSyncService.importEvents("conn-1");

      expect(result).toBe(0);
      expect(googleCalendarService.fetchEvents).toHaveBeenCalledWith(
        mockConnection,
        expect.objectContaining({
          timeMin: expect.any(Date),
          maxResults: 2500,
        }),
      );
    });
  });

  describe("exportEvent", () => {
    it("should throw error if connection not found", async () => {
      (storage.getCalendarConnection as jest.Mock).mockResolvedValue(undefined);
      (storage.getEvent as jest.Mock).mockResolvedValue({
        id: "event-1",
        title: "Test Event",
        type: "community",
        status: "active",
        location: null,
        description: null,
        timezone: "UTC",
        createdAt: new Date(),
        updatedAt: new Date(),
        startTime: new Date(),
        endTime: null,
        displayTimezone: null,
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
        isVirtual: false,
      });

      await expect(
        calendarSyncService.exportEvent("event-1", "non-existent-id"),
      ).rejects.toThrow("Connection not found");
    });

    it("should throw error if event not found", async () => {
      (storage.getCalendarConnection as jest.Mock).mockResolvedValue({
        id: "conn-1",
        userId: "user-1",
        provider: "google",
        providerAccountId: "google-user-1",
        accessToken: "token",
        refreshToken: null,
        expiresAt: null,
        calendarId: null,
        calendarName: null,
        syncEnabled: true,
        lastSyncAt: null,
        syncDirection: "both",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (storage.getEvent as jest.Mock).mockResolvedValue(undefined);

      await expect(
        calendarSyncService.exportEvent("non-existent-event", "conn-1"),
      ).rejects.toThrow("Event not found");
    });
  });
});
