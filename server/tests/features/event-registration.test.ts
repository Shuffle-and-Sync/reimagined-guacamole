/**
 * Event Registration Service Tests
 *
 * Tests for event registration, capacity limits, and waitlist functionality
 */

import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { eq, and } from "drizzle-orm";
import { db } from "@shared/database-unified";
import { events, eventAttendees, users } from "@shared/schema";
import { eventRegistrationService } from "../../features/events/event-registration.service";

// Test utilities
const createTestUser = async (email: string) => {
  const user = await db
    .insert(users)
    .values({
      email,
      firstName: "Test",
      lastName: "User",
    })
    .returning();
  return user[0];
};

const createTestEvent = async (
  creatorId: string,
  maxAttendees: number | null = null,
) => {
  const event = await db
    .insert(events)
    .values({
      title: "Test Event",
      type: "tournament",
      startTime: new Date(Date.now() + 86400000), // Tomorrow
      endTime: new Date(Date.now() + 90000000), // Tomorrow + 1 hour
      timezone: "UTC",
      creatorId,
      maxAttendees,
    })
    .returning();
  return event[0];
};

const cleanupTestData = async () => {
  await db.delete(eventAttendees).execute();
  await db.delete(events).execute();
  await db.delete(users).where(eq(users.email, "test@example.com")).execute();
  await db.delete(users).where(eq(users.email, "test2@example.com")).execute();
  await db.delete(users).where(eq(users.email, "test3@example.com")).execute();
  await db.delete(users).where(eq(users.email, "test4@example.com")).execute();
};

describe("EventRegistrationService", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe("Event Capacity", () => {
    test("should get capacity information for unlimited event", async () => {
      const user = await createTestUser("test@example.com");
      const event = await createTestEvent(user.id, null); // No max

      const capacity = await eventRegistrationService.getEventCapacity(
        event.id,
      );

      expect(capacity.eventId).toBe(event.id);
      expect(capacity.maxAttendees).toBeNull();
      expect(capacity.confirmedCount).toBe(0);
      expect(capacity.waitlistCount).toBe(0);
      expect(capacity.spotsRemaining).toBeNull();
      expect(capacity.isFull).toBe(false);
    });

    test("should get capacity information for limited event", async () => {
      const user = await createTestUser("test@example.com");
      const event = await createTestEvent(user.id, 10);

      const capacity = await eventRegistrationService.getEventCapacity(
        event.id,
      );

      expect(capacity.eventId).toBe(event.id);
      expect(capacity.maxAttendees).toBe(10);
      expect(capacity.confirmedCount).toBe(0);
      expect(capacity.spotsRemaining).toBe(10);
      expect(capacity.isFull).toBe(false);
    });

    test("should detect when event is full", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, 2);

      // Register two users
      const user1 = await createTestUser("test2@example.com");
      const user2 = await createTestUser("test3@example.com");

      await eventRegistrationService.registerForEvent(event.id, user1.id);
      await eventRegistrationService.registerForEvent(event.id, user2.id);

      const capacity = await eventRegistrationService.getEventCapacity(
        event.id,
      );

      expect(capacity.confirmedCount).toBe(2);
      expect(capacity.spotsRemaining).toBe(0);
      expect(capacity.isFull).toBe(true);
    });
  });

  describe("Registration", () => {
    test("should register user for event with available spots", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, 10);
      const user = await createTestUser("test2@example.com");

      const result = await eventRegistrationService.registerForEvent(
        event.id,
        user.id,
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe("confirmed");
      expect(result.attendee.eventId).toBe(event.id);
      expect(result.attendee.userId).toBe(user.id);
      expect(result.attendee.status).toBe("confirmed");
      expect(result.waitlistPosition).toBeUndefined();
      expect(result.spotsRemaining).toBe(9);
    });

    test("should place user on waitlist when event is full", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, 2);

      // Fill event
      const user1 = await createTestUser("test2@example.com");
      const user2 = await createTestUser("test3@example.com");
      await eventRegistrationService.registerForEvent(event.id, user1.id);
      await eventRegistrationService.registerForEvent(event.id, user2.id);

      // Try to register third user
      const user3 = await createTestUser("test4@example.com");
      const result = await eventRegistrationService.registerForEvent(
        event.id,
        user3.id,
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe("waitlist");
      expect(result.attendee.status).toBe("waitlist");
      expect(result.waitlistPosition).toBe(1);
    });

    test("should prevent duplicate registration", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, 10);
      const user = await createTestUser("test2@example.com");

      // First registration
      await eventRegistrationService.registerForEvent(event.id, user.id);

      // Second registration should fail
      await expect(
        eventRegistrationService.registerForEvent(event.id, user.id),
      ).rejects.toThrow("User is already registered for this event");
    });

    test("should allow re-registration after cancellation", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, 10);
      const user = await createTestUser("test2@example.com");

      // Register
      await eventRegistrationService.registerForEvent(event.id, user.id);

      // Cancel
      await eventRegistrationService.cancelRegistration(event.id, user.id);

      // Re-register
      const result = await eventRegistrationService.registerForEvent(
        event.id,
        user.id,
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe("confirmed");
    });

    test("should register for unlimited capacity event", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, null); // Unlimited
      const user = await createTestUser("test2@example.com");

      const result = await eventRegistrationService.registerForEvent(
        event.id,
        user.id,
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe("confirmed");
      expect(result.spotsRemaining).toBeUndefined();
    });
  });

  describe("Cancellation", () => {
    test("should cancel confirmed registration", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, 10);
      const user = await createTestUser("test2@example.com");

      await eventRegistrationService.registerForEvent(event.id, user.id);

      const result = await eventRegistrationService.cancelRegistration(
        event.id,
        user.id,
      );

      expect(result.success).toBe(true);

      // Verify status is cancelled
      const attendee = await db
        .select()
        .from(eventAttendees)
        .where(
          and(
            eq(eventAttendees.eventId, event.id),
            eq(eventAttendees.userId, user.id),
          ),
        )
        .limit(1);

      expect(attendee[0].status).toBe("cancelled");
    });

    test("should promote from waitlist when confirmed cancels", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, 2);

      // Fill event
      const user1 = await createTestUser("test2@example.com");
      const user2 = await createTestUser("test3@example.com");
      await eventRegistrationService.registerForEvent(event.id, user1.id);
      await eventRegistrationService.registerForEvent(event.id, user2.id);

      // Add to waitlist
      const user3 = await createTestUser("test4@example.com");
      await eventRegistrationService.registerForEvent(event.id, user3.id);

      // Cancel one confirmed registration
      const result = await eventRegistrationService.cancelRegistration(
        event.id,
        user1.id,
      );

      expect(result.success).toBe(true);
      expect(result.promoted).toBeDefined();
      expect(result.promoted?.userId).toBe(user3.id);
      expect(result.promoted?.status).toBe("confirmed");
    });

    test("should throw error if registration not found", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, 10);
      const user = await createTestUser("test2@example.com");

      await expect(
        eventRegistrationService.cancelRegistration(event.id, user.id),
      ).rejects.toThrow("Registration not found");
    });
  });

  describe("Waitlist", () => {
    test("should get waitlist position", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, 1);

      // Fill event
      const user1 = await createTestUser("test2@example.com");
      await eventRegistrationService.registerForEvent(event.id, user1.id);

      // Add to waitlist
      const user2 = await createTestUser("test3@example.com");
      await eventRegistrationService.registerForEvent(event.id, user2.id);

      const position = await eventRegistrationService.getWaitlistPosition(
        event.id,
        user2.id,
      );

      expect(position).toBe(1);
    });

    test("should return null for non-waitlisted user", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, 10);
      const user = await createTestUser("test2@example.com");

      await eventRegistrationService.registerForEvent(event.id, user.id);

      const position = await eventRegistrationService.getWaitlistPosition(
        event.id,
        user.id,
      );

      expect(position).toBeNull();
    });

    test("should get full waitlist", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, 1);

      // Fill event
      const user1 = await createTestUser("test2@example.com");
      await eventRegistrationService.registerForEvent(event.id, user1.id);

      // Add multiple to waitlist
      const user2 = await createTestUser("test3@example.com");
      const user3 = await createTestUser("test4@example.com");
      await eventRegistrationService.registerForEvent(event.id, user2.id);
      await eventRegistrationService.registerForEvent(event.id, user3.id);

      const waitlist = await eventRegistrationService.getWaitlist(event.id);

      expect(waitlist).toHaveLength(2);
      expect(waitlist[0].waitlistPosition).toBe(1);
      expect(waitlist[1].waitlistPosition).toBe(2);
    });

    test("should maintain waitlist order after promotion", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, 1);

      // Fill event
      const user1 = await createTestUser("test2@example.com");
      await eventRegistrationService.registerForEvent(event.id, user1.id);

      // Add multiple to waitlist
      const user2 = await createTestUser("test3@example.com");
      const user3 = await createTestUser("test4@example.com");
      await eventRegistrationService.registerForEvent(event.id, user2.id);
      await eventRegistrationService.registerForEvent(event.id, user3.id);

      // Cancel to trigger promotion
      await eventRegistrationService.cancelRegistration(event.id, user1.id);

      // Check remaining waitlist
      const waitlist = await eventRegistrationService.getWaitlist(event.id);

      expect(waitlist).toHaveLength(1);
      expect(waitlist[0].userId).toBe(user3.id);
      expect(waitlist[0].waitlistPosition).toBe(1); // Should be reordered to position 1
    });
  });

  describe("Race Conditions", () => {
    test("should handle concurrent registrations at capacity", async () => {
      const creator = await createTestUser("test@example.com");
      const event = await createTestEvent(creator.id, 2);

      const user1 = await createTestUser("test2@example.com");
      const user2 = await createTestUser("test3@example.com");
      const user3 = await createTestUser("test4@example.com");

      // Register concurrently
      const results = await Promise.all([
        eventRegistrationService.registerForEvent(event.id, user1.id),
        eventRegistrationService.registerForEvent(event.id, user2.id),
        eventRegistrationService.registerForEvent(event.id, user3.id),
      ]);

      // Should have 2 confirmed and 1 waitlisted
      const confirmedCount = results.filter(
        (r) => r.status === "confirmed",
      ).length;
      const waitlistCount = results.filter(
        (r) => r.status === "waitlist",
      ).length;

      expect(confirmedCount).toBe(2);
      expect(waitlistCount).toBe(1);
    });
  });

  describe("Error Handling", () => {
    test("should throw error for non-existent event", async () => {
      const user = await createTestUser("test@example.com");

      await expect(
        eventRegistrationService.registerForEvent("non-existent-id", user.id),
      ).rejects.toThrow("Event not found");
    });

    test("should throw error when getting capacity for non-existent event", async () => {
      await expect(
        eventRegistrationService.getEventCapacity("non-existent-id"),
      ).rejects.toThrow("Event not found");
    });
  });
});
