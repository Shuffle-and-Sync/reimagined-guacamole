/**
 * Event Reminder Service Tests
 *
 * Tests for event reminder scheduling, sending, and management
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterEach,
} from "@jest/globals";
import { eq, and } from "drizzle-orm";
import { db } from "@shared/database-unified";
import {
  events,
  eventAttendees,
  eventReminders,
  eventReminderSettings,
  users,
} from "@shared/schema";
import type { Event, User } from "@shared/schema";
import { eventReminderService } from "../../features/events/event-reminder.service";

// Mock dependencies
jest.mock("../../services/notification-delivery.service", () => ({
  notificationDeliveryService: {
    deliverNotification: jest.fn().mockResolvedValue([
      { channel: "email", success: true },
      { channel: "browser", success: true },
    ]),
  },
}));

jest.mock("../../storage", () => ({
  storage: {
    getUser: jest.fn().mockResolvedValue({
      id: "test-user-id",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
    }),
    createNotification: jest.fn().mockResolvedValue({
      id: "notification-id",
      userId: "test-user-id",
      type: "event_reminder",
      title: "Event Reminder",
      message: "Test event starts soon",
      createdAt: new Date(),
    }),
  },
}));

describe("EventReminderService", () => {
  let testEvent: Event;
  let testUser: User;

  beforeEach(async () => {
    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      })
      .returning();
    testUser = user;

    // Create test event (2 days in the future)
    const startTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const [event] = await db
      .insert(events)
      .values({
        title: "Test Event",
        type: "tournament",
        startTime,
        timezone: "UTC",
        creatorId: testUser.id,
      })
      .returning();
    testEvent = event;
  });

  afterEach(async () => {
    // Clean up test data
    await db
      .delete(eventReminders)
      .where(eq(eventReminders.eventId, testEvent.id));
    await db
      .delete(eventAttendees)
      .where(eq(eventAttendees.eventId, testEvent.id));
    await db
      .delete(eventReminderSettings)
      .where(eq(eventReminderSettings.userId, testUser.id));
    await db.delete(events).where(eq(events.id, testEvent.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  describe("scheduleReminders", () => {
    it("should schedule reminders for event attendees", async () => {
      // Add attendee
      await db.insert(eventAttendees).values({
        eventId: testEvent.id,
        userId: testUser.id,
        status: "confirmed",
      });

      // Schedule reminders
      const result = await eventReminderService.scheduleReminders(testEvent.id);

      expect(result.success).toBe(true);
      expect(result.remindersScheduled).toBeGreaterThan(0);

      // Verify reminders were created
      const reminders = await db
        .select()
        .from(eventReminders)
        .where(
          and(
            eq(eventReminders.eventId, testEvent.id),
            eq(eventReminders.userId, testUser.id),
          ),
        );

      expect(reminders.length).toBeGreaterThan(0);
      expect(reminders[0]?.status).toBe("pending");
    });

    it("should use default reminder settings for new users", async () => {
      await db.insert(eventAttendees).values({
        eventId: testEvent.id,
        userId: testUser.id,
        status: "confirmed",
      });

      const result = await eventReminderService.scheduleReminders(testEvent.id);

      expect(result.success).toBe(true);

      // Check that default reminders were created (1 hour and 1 day)
      const reminders = await db
        .select()
        .from(eventReminders)
        .where(eq(eventReminders.userId, testUser.id));

      // Should have 2 default reminders
      expect(reminders.length).toBe(2);
      const minutesBefore = reminders
        .map((r) => r.minutesBefore)
        .sort((a, b) => a - b);
      expect(minutesBefore).toEqual([60, 1440]);
    });

    it("should skip past reminder times", async () => {
      // Create event starting in 30 minutes
      const startTime = new Date(Date.now() + 30 * 60 * 1000);
      const [nearEvent] = await db
        .insert(events)
        .values({
          title: "Near Event",
          type: "stream",
          startTime,
          timezone: "UTC",
          creatorId: testUser.id,
        })
        .returning();

      await db.insert(eventAttendees).values({
        eventId: nearEvent.id,
        userId: testUser.id,
        status: "confirmed",
      });

      const result = await eventReminderService.scheduleReminders(nearEvent.id);

      // Should not schedule 1 hour (60 min) or 1 day (1440 min) reminders
      // because event is in 30 minutes
      expect(result.remindersScheduled).toBe(0);

      // Clean up
      await db.delete(events).where(eq(events.id, nearEvent.id));
    });

    it("should not schedule duplicate reminders", async () => {
      await db.insert(eventAttendees).values({
        eventId: testEvent.id,
        userId: testUser.id,
        status: "confirmed",
      });

      // Schedule once
      await eventReminderService.scheduleReminders(testEvent.id);

      // Try to schedule again
      const result = await eventReminderService.scheduleReminders(testEvent.id);

      // Should not create duplicates
      const reminders = await db
        .select()
        .from(eventReminders)
        .where(eq(eventReminders.userId, testUser.id));

      expect(reminders.length).toBe(2); // Still only 2 (default)
    });
  });

  describe("getUserReminderSettings", () => {
    it("should return user reminder settings", async () => {
      const settings = await eventReminderService.getReminderSettings(
        testUser.id,
      );

      expect(settings).toBeDefined();
      expect(settings.userId).toBe(testUser.id);
      expect(settings.isEnabled).toBe(true);

      // Check default values
      const reminderTimes = JSON.parse(settings.reminderTimes);
      const channels = JSON.parse(settings.channels);

      expect(reminderTimes).toContain(60);
      expect(reminderTimes).toContain(1440);
      expect(channels).toContain("email");
      expect(channels).toContain("in_app");
    });

    it("should create default settings for new users", async () => {
      // Get settings (should create them if they don't exist)
      const settings = await eventReminderService.getReminderSettings(
        testUser.id,
      );

      expect(settings).toBeDefined();
      expect(settings.isEnabled).toBe(true);

      // Verify they were saved to database
      const [saved] = await db
        .select()
        .from(eventReminderSettings)
        .where(eq(eventReminderSettings.userId, testUser.id));

      expect(saved).toBeDefined();
    });
  });

  describe("updateReminderSettings", () => {
    it("should update reminder times", async () => {
      const updated = await eventReminderService.updateReminderSettings(
        testUser.id,
        {
          reminderTimes: [30, 60, 120], // 30 min, 1 hour, 2 hours
        },
      );

      expect(updated).toBeDefined();
      const reminderTimes = JSON.parse(updated.reminderTimes);
      expect(reminderTimes).toEqual([30, 60, 120]);
    });

    it("should update notification channels", async () => {
      const updated = await eventReminderService.updateReminderSettings(
        testUser.id,
        {
          channels: ["email", "push"],
        },
      );

      expect(updated).toBeDefined();
      const channels = JSON.parse(updated.channels);
      expect(channels).toEqual(["email", "push"]);
    });

    it("should disable reminders", async () => {
      const updated = await eventReminderService.updateReminderSettings(
        testUser.id,
        {
          isEnabled: false,
        },
      );

      expect(updated.isEnabled).toBe(false);
    });
  });

  describe("cancelUserReminders", () => {
    it("should cancel pending reminders for a user", async () => {
      // Create attendee and reminders
      await db.insert(eventAttendees).values({
        eventId: testEvent.id,
        userId: testUser.id,
        status: "confirmed",
      });

      await eventReminderService.scheduleReminders(testEvent.id);

      // Cancel reminders
      const cancelledCount = await eventReminderService.cancelUserReminders(
        testEvent.id,
        testUser.id,
      );

      expect(cancelledCount).toBeGreaterThan(0);

      // Verify reminders are cancelled
      const reminders = await db
        .select()
        .from(eventReminders)
        .where(
          and(
            eq(eventReminders.eventId, testEvent.id),
            eq(eventReminders.userId, testUser.id),
          ),
        );

      reminders.forEach((reminder) => {
        expect(reminder.status).toBe("cancelled");
      });
    });

    it("should only cancel pending reminders, not already sent", async () => {
      // Create reminders
      await db.insert(eventAttendees).values({
        eventId: testEvent.id,
        userId: testUser.id,
        status: "confirmed",
      });

      await eventReminderService.scheduleReminders(testEvent.id);

      // Mark one as sent
      const [reminder] = await db
        .select()
        .from(eventReminders)
        .where(eq(eventReminders.userId, testUser.id))
        .limit(1);

      if (reminder) {
        await db
          .update(eventReminders)
          .set({ status: "sent" })
          .where(eq(eventReminders.id, reminder.id));
      }

      // Cancel reminders
      const cancelledCount = await eventReminderService.cancelUserReminders(
        testEvent.id,
        testUser.id,
      );

      // Should only cancel the pending ones
      const allReminders = await db
        .select()
        .from(eventReminders)
        .where(eq(eventReminders.userId, testUser.id));

      const sentReminders = allReminders.filter((r) => r.status === "sent");
      const cancelledReminders = allReminders.filter(
        (r) => r.status === "cancelled",
      );

      expect(sentReminders.length).toBe(1); // Still sent
      expect(cancelledReminders.length).toBe(cancelledCount);
    });
  });

  describe("cancelReminders", () => {
    it("should cancel all pending reminders for an event", async () => {
      // Create multiple attendees
      const [user2] = await db
        .insert(users)
        .values({
          email: "user2@example.com",
          firstName: "User",
          lastName: "Two",
        })
        .returning();

      await db.insert(eventAttendees).values([
        { eventId: testEvent.id, userId: testUser.id, status: "confirmed" },
        { eventId: testEvent.id, userId: user2.id, status: "confirmed" },
      ]);

      await eventReminderService.scheduleReminders(testEvent.id);

      // Cancel all reminders
      const cancelledCount = await eventReminderService.cancelReminders(
        testEvent.id,
      );

      expect(cancelledCount).toBeGreaterThan(0);

      // Verify all are cancelled
      const reminders = await db
        .select()
        .from(eventReminders)
        .where(eq(eventReminders.eventId, testEvent.id));

      reminders.forEach((reminder) => {
        expect(reminder.status).toBe("cancelled");
      });

      // Clean up
      await db.delete(users).where(eq(users.id, user2.id));
    });
  });

  describe("processUpcomingReminders", () => {
    it("should process due reminders", async () => {
      // Create a reminder that's due now
      const [reminder] = await db
        .insert(eventReminders)
        .values({
          eventId: testEvent.id,
          userId: testUser.id,
          reminderTime: new Date(Date.now() - 1000), // 1 second ago
          minutesBefore: 60,
          channels: JSON.stringify(["email", "in_app"]),
          status: "pending",
        })
        .returning();

      const result = await eventReminderService.processUpcomingReminders();

      expect(result.processed).toBeGreaterThan(0);
      expect(result.sent).toBeGreaterThan(0);

      // Verify reminder was marked as sent
      const [updated] = await db
        .select()
        .from(eventReminders)
        .where(eq(eventReminders.id, reminder.id));

      expect(updated?.status).toBe("sent");
    });

    it("should not process future reminders", async () => {
      // Create a reminder for the future
      await db.insert(eventReminders).values({
        eventId: testEvent.id,
        userId: testUser.id,
        reminderTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        minutesBefore: 60,
        channels: JSON.stringify(["email"]),
        status: "pending",
      });

      const result = await eventReminderService.processUpcomingReminders();

      // Should not process it
      expect(result.processed).toBe(0);
    });
  });
});
