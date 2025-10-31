import { eq, and, lte, isNotNull } from "drizzle-orm";
import { db } from "@shared/database-unified";
import {
  events,
  eventStatusHistory,
  type Event,
  type EventStatusHistory,
  type InsertEventStatusHistory,
} from "@shared/schema";
import { logger } from "../../logger";
import { storage } from "../../storage";

/**
 * Valid event status values
 */
export type EventStatus = "draft" | "active" | "completed" | "cancelled";

/**
 * Status transition map - defines valid transitions from each status
 */
const STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  draft: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [], // Final state
  cancelled: [], // Final state
};

export interface StatusUpdateResult {
  success: boolean;
  event?: Event;
  history?: EventStatusHistory;
  error?: string;
}

export interface StatusValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ExpiredEventsResult {
  processed: number;
  completed: number;
  activated: number;
  errors: string[];
}

/**
 * Service for managing event status lifecycle, transitions, and history
 */
export class EventStatusService {
  /**
   * Update event status with validation and history tracking
   */
  async updateStatus(
    eventId: string,
    newStatus: EventStatus,
    userId?: string,
    reason?: string,
  ): Promise<StatusUpdateResult> {
    try {
      // Get current event
      const event = await storage.getEvent(eventId);
      if (!event) {
        return {
          success: false,
          error: "Event not found",
        };
      }

      const currentStatus = event.status as EventStatus | null;

      // Validate status transition
      const validation = this.validateStatusTransition(
        currentStatus,
        newStatus,
      );
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Check permissions - only creator can change status (unless automatic)
      if (userId && event.creatorId !== userId) {
        return {
          success: false,
          error: "Not authorized to change event status",
        };
      }

      // Update event status
      const updatedEvent = await storage.updateEvent(eventId, {
        status: newStatus,
      });

      // Record status history
      const historyEntry: InsertEventStatusHistory = {
        eventId,
        previousStatus: currentStatus,
        newStatus,
        changedBy: userId || null,
        reason: reason || null,
      };

      const [history] = await db
        .insert(eventStatusHistory)
        .values(historyEntry)
        .returning();

      logger.info("Event status updated", {
        eventId,
        previousStatus: currentStatus,
        newStatus,
        changedBy: userId || "automatic",
        reason,
      });

      // Send notifications for status changes
      await this.notifyStatusChange(event, newStatus, currentStatus);

      return {
        success: true,
        event: updatedEvent,
        history,
      };
    } catch (error) {
      logger.error(
        "Failed to update event status",
        error instanceof Error ? error : new Error(String(error)),
        {
          eventId,
          newStatus,
          userId,
        },
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Validate if a status transition is allowed
   */
  validateStatusTransition(
    currentStatus: EventStatus | null,
    newStatus: EventStatus,
  ): StatusValidationResult {
    // If no current status, treat as draft (initial state)
    const current = currentStatus || "draft";

    // Check if status is valid
    if (!["draft", "active", "completed", "cancelled"].includes(newStatus)) {
      return {
        isValid: false,
        error: `Invalid status: ${newStatus}`,
      };
    }

    // Allow setting initial status
    if (current === newStatus) {
      return { isValid: true };
    }

    // Check if transition is allowed
    const allowedTransitions = STATUS_TRANSITIONS[current];
    if (!allowedTransitions.includes(newStatus)) {
      return {
        isValid: false,
        error: `Cannot transition from ${current} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(", ") || "none (final state)"}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Get status history for an event
   */
  async getStatusHistory(eventId: string): Promise<EventStatusHistory[]> {
    try {
      const history = await db
        .select()
        .from(eventStatusHistory)
        .where(eq(eventStatusHistory.eventId, eventId))
        .orderBy(eventStatusHistory.changedAt);

      return history;
    } catch (error) {
      logger.error(
        "Failed to get event status history",
        error instanceof Error ? error : new Error(String(error)),
        {
          eventId,
        },
      );
      return [];
    }
  }

  /**
   * Process expired events - automatically update statuses based on time
   * This should be called by a cron job periodically
   */
  async processExpiredEvents(): Promise<ExpiredEventsResult> {
    const result: ExpiredEventsResult = {
      processed: 0,
      completed: 0,
      activated: 0,
      errors: [],
    };

    try {
      const now = new Date();

      // Find draft events that should be activated (start time has passed)
      const draftEvents = await db
        .select()
        .from(events)
        .where(and(eq(events.status, "draft"), lte(events.startTime, now)));

      // Find active events that should be completed (end time has passed)
      const activeEvents = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.status, "active"),
            isNotNull(events.endTime),
            lte(events.endTime, now),
          ),
        );

      logger.info("Processing expired events", {
        draftEventsToActivate: draftEvents.length,
        activeEventsToComplete: activeEvents.length,
      });

      // Activate draft events
      for (const event of draftEvents) {
        const updateResult = await this.updateStatus(
          event.id,
          "active",
          undefined,
          "Automatic activation at start time",
        );

        result.processed++;
        if (updateResult.success) {
          result.activated++;
        } else {
          result.errors.push(
            `Failed to activate event ${event.id}: ${updateResult.error}`,
          );
        }
      }

      // Complete active events
      for (const event of activeEvents) {
        const updateResult = await this.updateStatus(
          event.id,
          "completed",
          undefined,
          "Automatic completion after end time",
        );

        result.processed++;
        if (updateResult.success) {
          result.completed++;
        } else {
          result.errors.push(
            `Failed to complete event ${event.id}: ${updateResult.error}`,
          );
        }
      }

      logger.info("Expired events processed", {
        processed: result.processed,
        activated: result.activated,
        completed: result.completed,
        errors: result.errors.length,
      });

      return result;
    } catch (error) {
      logger.error(
        "Failed to process expired events",
        error instanceof Error ? error : new Error(String(error)),
      );
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
      return result;
    }
  }

  /**
   * Send notifications when event status changes
   */
  private async notifyStatusChange(
    event: Event,
    newStatus: EventStatus,
    oldStatus: EventStatus | null,
  ): Promise<void> {
    try {
      // Get event attendees to notify
      const attendees = await storage.getEventAttendees(event.id);

      // Determine notification title and message based on status change
      let title = "";
      let message = "";

      if (newStatus === "active" && oldStatus === "draft") {
        title = "Event is Now Active";
        message = `${event.title} is now active and starting soon!`;
      } else if (newStatus === "completed") {
        title = "Event Completed";
        message = `${event.title} has been completed. Thank you for participating!`;
      } else if (newStatus === "cancelled") {
        title = "Event Cancelled";
        message = `${event.title} has been cancelled.`;
      } else {
        // For other transitions, still notify but with generic message
        title = "Event Status Updated";
        message = `${event.title} status has been updated to ${newStatus}.`;
      }

      // Notify all attendees
      // Note: For events with many attendees (100+), consider batching notifications
      // to avoid overwhelming the database. Current implementation uses Promise.all
      // which works well for typical event sizes but may need optimization for
      // large events. Consider using a batch size of 50 with sequential batches.
      const notificationPromises = attendees.map((attendee) =>
        storage.createNotification({
          userId: attendee.userId,
          type: "event_update",
          title,
          message,
          priority: newStatus === "cancelled" ? "high" : "normal",
          data: JSON.stringify({
            eventId: event.id,
            eventTitle: event.title,
            newStatus,
            oldStatus,
          }),
        }),
      );

      await Promise.all(notificationPromises);

      logger.info("Status change notifications sent", {
        eventId: event.id,
        newStatus,
        oldStatus,
        attendeesNotified: attendees.length,
      });
    } catch (error) {
      logger.error(
        "Failed to send status change notifications",
        error instanceof Error ? error : new Error(String(error)),
        {
          eventId: event.id,
          newStatus,
          oldStatus,
        },
      );
      // Don't throw - notification failure shouldn't fail the status update
    }
  }
}

// Export singleton instance
export const eventStatusService = new EventStatusService();
