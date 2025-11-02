import { eq, and, count, or } from "drizzle-orm";
import { db, withTransaction } from "@shared/database-unified";
import { events, eventAttendees } from "@shared/schema";
import type { EventAttendee } from "@shared/schema";
import { logger } from "../../logger";
import { eventReminderService } from "./event-reminder.service";

/**
 * Registration result with status and optional waitlist information
 */
export interface RegistrationResult {
  success: boolean;
  status: "confirmed" | "waitlist";
  attendee: EventAttendee;
  waitlistPosition?: number;
  spotsRemaining?: number;
  message: string;
}

/**
 * Event capacity information
 */
export interface EventCapacity {
  eventId: string;
  maxAttendees: number | null;
  confirmedCount: number;
  waitlistCount: number;
  spotsRemaining: number | null;
  isFull: boolean;
}

/**
 * Service for managing event registrations with capacity limits and waitlist
 */
export class EventRegistrationService {
  /**
   * Get current capacity information for an event
   */
  async getEventCapacity(eventId: string): Promise<EventCapacity> {
    // Get event details with max attendees
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event || event.length === 0) {
      throw new Error("Event not found");
    }

    const maxAttendees = event[0]?.maxAttendees ?? null;

    // Count confirmed attendees
    const confirmedResult = await db
      .select({ count: count() })
      .from(eventAttendees)
      .where(
        and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.status, "confirmed"),
        ),
      );

    const confirmedCount = confirmedResult[0]?.count || 0;

    // Count waitlisted attendees
    const waitlistResult = await db
      .select({ count: count() })
      .from(eventAttendees)
      .where(
        and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.status, "waitlist"),
        ),
      );

    const waitlistCount = waitlistResult[0]?.count || 0;

    // Calculate spots remaining (null if no max)
    const spotsRemaining =
      maxAttendees !== null ? maxAttendees - confirmedCount : null;
    const isFull = maxAttendees !== null && confirmedCount >= maxAttendees;

    return {
      eventId,
      maxAttendees,
      confirmedCount,
      waitlistCount,
      spotsRemaining,
      isFull,
    };
  }

  /**
   * Register a user for an event
   * Automatically places on waitlist if event is full
   */
  async registerForEvent(
    eventId: string,
    userId: string,
  ): Promise<RegistrationResult> {
    return await withTransaction(async () => {
      // Check if user is already registered
      const existing = await db
        .select()
        .from(eventAttendees)
        .where(
          and(
            eq(eventAttendees.eventId, eventId),
            eq(eventAttendees.userId, userId),
          ),
        )
        .limit(1);

      if (existing && existing.length > 0) {
        const existingAttendee = existing[0];
        if (!existingAttendee) {
          throw new Error("Attendee record is invalid");
        }

        // If cancelled or declined, allow re-registration
        if (
          existingAttendee.status === "cancelled" ||
          existingAttendee.status === "declined"
        ) {
          // Get current capacity
          const capacity = await this.getEventCapacity(eventId);

          let newStatus: "confirmed" | "waitlist" = "confirmed";
          let waitlistPosition: number | undefined = undefined;

          // Check if event is full
          if (capacity.isFull) {
            newStatus = "waitlist";
            waitlistPosition = capacity.waitlistCount + 1;
          }

          // Update existing record
          const updated = await db
            .update(eventAttendees)
            .set({
              status: newStatus,
              waitlistPosition: waitlistPosition || null,
              registeredAt: new Date(),
            })
            .where(eq(eventAttendees.id, existingAttendee.id))
            .returning();

          const updatedAttendee = updated[0];
          if (!updatedAttendee) {
            throw new Error("Failed to update registration");
          }

          // Schedule event reminders for the user (only if confirmed)
          if (newStatus === "confirmed") {
            try {
              await eventReminderService.scheduleReminders(eventId, [userId]);
            } catch (error) {
              logger.error("Failed to schedule event reminders", {
                error: error instanceof Error ? error.message : String(error),
                eventId,
                userId,
              });
            }
          }

          return {
            success: true,
            status: newStatus,
            attendee: updatedAttendee,
            waitlistPosition,
            spotsRemaining: capacity.spotsRemaining || undefined,
            message:
              newStatus === "waitlist"
                ? `Added to waitlist at position ${waitlistPosition}`
                : "Successfully registered for event",
          };
        }

        throw new Error("User is already registered for this event");
      }

      // Get current capacity
      const capacity = await this.getEventCapacity(eventId);

      let status: "confirmed" | "waitlist" = "confirmed";
      let waitlistPosition: number | undefined = undefined;

      // Check if event is full
      if (capacity.isFull) {
        status = "waitlist";
        waitlistPosition = capacity.waitlistCount + 1;
      }

      // Create new registration
      const newAttendee = await db
        .insert(eventAttendees)
        .values({
          eventId,
          userId,
          status,
          role: "participant",
          waitlistPosition: waitlistPosition || null,
          registeredAt: new Date(),
        })
        .returning();

      const attendee = newAttendee[0];
      if (!attendee) {
        throw new Error("Failed to create registration");
      }

      logger.info("User registered for event", {
        eventId,
        userId,
        status,
        waitlistPosition,
      });

      // Schedule event reminders for the user (only if confirmed, not waitlisted)
      if (status === "confirmed") {
        try {
          await eventReminderService.scheduleReminders(eventId, [userId]);
        } catch (error) {
          // Log error but don't fail the registration
          logger.error("Failed to schedule event reminders", {
            error: error instanceof Error ? error.message : String(error),
            eventId,
            userId,
          });
        }
      }

      return {
        success: true,
        status,
        attendee,
        waitlistPosition,
        spotsRemaining: capacity.spotsRemaining || undefined,
        message:
          status === "waitlist"
            ? `Added to waitlist at position ${waitlistPosition}`
            : "Successfully registered for event",
      };
    });
  }

  /**
   * Cancel a user's registration
   * Automatically promotes next person from waitlist if applicable
   */
  async cancelRegistration(
    eventId: string,
    userId: string,
  ): Promise<{ success: boolean; promoted?: EventAttendee }> {
    return await withTransaction(async () => {
      // Find user's registration
      const registration = await db
        .select()
        .from(eventAttendees)
        .where(
          and(
            eq(eventAttendees.eventId, eventId),
            eq(eventAttendees.userId, userId),
          ),
        )
        .limit(1);

      if (!registration || registration.length === 0) {
        throw new Error("Registration not found");
      }

      const attendee = registration[0];
      if (!attendee) {
        throw new Error("Attendee record is invalid");
      }

      // Update status to cancelled
      await db
        .update(eventAttendees)
        .set({
          status: "cancelled",
          waitlistPosition: null,
        })
        .where(eq(eventAttendees.id, attendee.id));

      logger.info("User cancelled event registration", {
        eventId,
        userId,
        previousStatus: attendee.status,
      });

      // Cancel event reminders for this user
      try {
        await eventReminderService.cancelUserReminders(eventId, userId);
      } catch (error) {
        logger.error("Failed to cancel event reminders", {
          error: error instanceof Error ? error.message : String(error),
          eventId,
          userId,
        });
      }

      // If user was confirmed, try to promote someone from waitlist
      let promoted: EventAttendee | undefined = undefined;
      if (attendee.status === "confirmed") {
        promoted = await this.promoteFromWaitlist(eventId);
      }

      return {
        success: true,
        promoted,
      };
    });
  }

  /**
   * Promote next person from waitlist to confirmed
   * Returns the promoted attendee or undefined if no one to promote
   */
  async promoteFromWaitlist(
    eventId: string,
  ): Promise<EventAttendee | undefined> {
    return await withTransaction(async () => {
      // Check if there are spots available
      const capacity = await this.getEventCapacity(eventId);

      if (capacity.isFull) {
        return undefined; // No spots available
      }

      // Find next person in waitlist (lowest position number)
      const nextInLine = await db
        .select()
        .from(eventAttendees)
        .where(
          and(
            eq(eventAttendees.eventId, eventId),
            eq(eventAttendees.status, "waitlist"),
          ),
        )
        .orderBy(eventAttendees.waitlistPosition)
        .limit(1);

      if (!nextInLine || nextInLine.length === 0) {
        return undefined; // No one on waitlist
      }

      const attendee = nextInLine[0];
      if (!attendee) {
        return undefined;
      }

      // Promote to confirmed
      const promoted = await db
        .update(eventAttendees)
        .set({
          status: "confirmed",
          waitlistPosition: null,
        })
        .where(eq(eventAttendees.id, attendee.id))
        .returning();

      const promotedAttendee = promoted[0];
      if (!promotedAttendee) {
        throw new Error("Failed to promote attendee");
      }

      logger.info("Promoted attendee from waitlist", {
        eventId,
        userId: attendee.userId,
        previousPosition: attendee.waitlistPosition,
      });

      // Schedule event reminders for the newly promoted user
      try {
        await eventReminderService.scheduleReminders(eventId, [
          attendee.userId,
        ]);
      } catch (error) {
        logger.error("Failed to schedule reminders for promoted attendee", {
          error: error instanceof Error ? error.message : String(error),
          eventId,
          userId: attendee.userId,
        });
      }

      // Reorder remaining waitlist
      await this.reorderWaitlist(eventId);

      return promotedAttendee;
    });
  }

  /**
   * Get user's waitlist position
   */
  async getWaitlistPosition(
    eventId: string,
    userId: string,
  ): Promise<number | null> {
    const registration = await db
      .select()
      .from(eventAttendees)
      .where(
        and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.userId, userId),
          eq(eventAttendees.status, "waitlist"),
        ),
      )
      .limit(1);

    if (!registration || registration.length === 0) {
      return null;
    }

    const attendee = registration[0];
    if (!attendee) {
      return null;
    }

    return attendee.waitlistPosition || null;
  }

  /**
   * Get all attendees on waitlist for an event
   */
  async getWaitlist(eventId: string): Promise<EventAttendee[]> {
    return await db
      .select()
      .from(eventAttendees)
      .where(
        and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.status, "waitlist"),
        ),
      )
      .orderBy(eventAttendees.waitlistPosition);
  }

  /**
   * Reorder waitlist positions after a promotion or cancellation
   * Ensures positions are consecutive (1, 2, 3, ...)
   */
  private async reorderWaitlist(eventId: string): Promise<void> {
    const waitlist = await this.getWaitlist(eventId);

    // Update positions to be consecutive
    for (let i = 0; i < waitlist.length; i++) {
      const attendee = waitlist[i];
      const newPosition = i + 1;

      if (attendee.waitlistPosition !== newPosition) {
        await db
          .update(eventAttendees)
          .set({ waitlistPosition: newPosition })
          .where(eq(eventAttendees.id, attendee.id));
      }
    }
  }
}

// Export singleton instance
export const eventRegistrationService = new EventRegistrationService();
