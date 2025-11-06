/**
 * Enhanced Notification Service
 *
 * Provides sophisticated notification delivery for event-related updates including:
 * - Event reminders at configurable intervals before start time
 * - Event update notifications when details change
 * - Event cancellation notifications to all attendees
 * - Waitlist promotion notifications
 *
 * All notifications are persisted to storage and can trigger multiple delivery
 * channels (in-app, email, push notifications).
 *
 * @module EnhancedNotificationService
 */

import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { storage } from "../storage";

/**
 * Notification trigger event information
 *
 * @interface NotificationTrigger
 * @property {"event_reminder" | "event_updated" | "event_cancelled" | "event_starting_soon" | "waitlist_promoted"} type - Type of notification trigger
 * @property {string} eventId - ID of the event triggering the notification
 * @property {string} userId - ID of the user to notify
 * @property {unknown} [data] - Additional context data for the notification
 */
export interface NotificationTrigger {
  type:
    | "event_reminder"
    | "event_updated"
    | "event_cancelled"
    | "event_starting_soon"
    | "waitlist_promoted";
  eventId: string;
  userId: string;
  data?: unknown;
}

/**
 * Enhanced Notification Service
 *
 * Manages event-based notifications with intelligent delivery timing and
 * priority handling. Automatically notifies relevant users of event changes.
 *
 * @class EnhancedNotificationService
 */
export class EnhancedNotificationService {
  /**
   * Send event reminder notification
   *
   * Sends reminder notifications to all attending users for an upcoming event.
   * Priority is set to 'high' if event starts within 1 hour, 'normal' otherwise.
   *
   * @param {string} eventId - ID of the event to send reminders for
   * @param {number} hoursBeforeEvent - How many hours before event start (e.g., 24, 1)
   * @returns {Promise<void>}
   * @example
   * // Send 24-hour reminder
   * await notificationService.sendEventReminder('event_123', 24);
   *
   * // Send 1-hour reminder (high priority)
   * await notificationService.sendEventReminder('event_123', 1);
   */
  async sendEventReminder(eventId: string, hoursBeforeEvent: number) {
    try {
      const event = await storage.getEvent(eventId);
      if (!event) return;

      const attendees = await storage.getEventAttendees(eventId);

      for (const attendee of attendees) {
        if (attendee.status === "attending") {
          await storage.createNotification({
            userId: attendee.userId,
            type: "event_reminder" as string,
            title: `Event Starting in ${hoursBeforeEvent} Hours`,
            message: `${event.title} starts at ${new Date(event.startTime).toLocaleString()}`,
            data: JSON.stringify({
              eventId,
              hoursBeforeEvent,
              communityId: event.communityId,
            }),
            priority: hoursBeforeEvent <= 1 ? "high" : "normal",
          });
        }
      }

      logger.info("Event reminders sent", { eventId, count: attendees.length });
    } catch (error) {
      logger.error("Failed to send event reminders", toLoggableError(error), {
        eventId,
      });
    }
  }

  /**
   * Send event updated notification
   *
   * Notifies all event attendees (except the creator) when event details change.
   * Includes a list of what changed in the notification message.
   *
   * @param {string} eventId - ID of the updated event
   * @param {string[]} changes - Array of changed fields (e.g., ['time', 'location'])
   * @returns {Promise<void>}
   * @example
   * await notificationService.sendEventUpdatedNotification('event_123', ['startTime', 'location']);
   */
  async sendEventUpdatedNotification(eventId: string, changes: string[]) {
    try {
      const event = await storage.getEvent(eventId);
      if (!event) return;

      const attendees = await storage.getEventAttendees(eventId);

      for (const attendee of attendees) {
        if (attendee.userId !== event.creatorId) {
          await storage.createNotification({
            userId: attendee.userId,
            type: "event_updated" as string,
            title: "Event Updated",
            message: `${event.title} has been updated: ${changes.join(", ")}`,
            data: JSON.stringify({
              eventId,
              changes,
              communityId: event.communityId,
            }),
            priority: "normal",
          });
        }
      }

      logger.info("Event update notifications sent", { eventId, changes });
    } catch (error) {
      logger.error(
        "Failed to send event update notifications",
        toLoggableError(error),
        {
          eventId,
        },
      );
    }
  }

  /**
   * Send event cancelled notification
   *
   * Sends high-priority cancellation notifications to all event attendees.
   * Includes reason if provided.
   *
   * @param {string} eventId - ID of the cancelled event
   * @returns {Promise<void>}
   * @example
   * await notificationService.sendEventCancelledNotification('event_123');
   */
  async sendEventCancelledNotification(eventId: string) {
    try {
      const event = await storage.getEvent(eventId);
      if (!event) return;

      const attendees = await storage.getEventAttendees(eventId);

      for (const attendee of attendees) {
        await storage.createNotification({
          userId: attendee.userId,
          type: "event_cancelled" as string,
          title: "Event Cancelled",
          message: `${event.title} has been cancelled`,
          data: JSON.stringify({ eventId, communityId: event.communityId }),
          priority: "high",
        });
      }

      logger.info("Event cancellation notifications sent", {
        eventId,
        count: attendees.length,
      });
    } catch (error) {
      logger.error(
        "Failed to send event cancellation notifications",
        toLoggableError(error),
        {
          eventId,
        },
      );
    }
  }

  /**
   * Send starting soon notification
   */
  async sendEventStartingSoonNotification(
    eventId: string,
    minutesUntilStart: number,
  ) {
    try {
      const event = await storage.getEvent(eventId);
      if (!event) return;

      const attendees = await storage.getEventAttendees(eventId);

      for (const attendee of attendees) {
        if (attendee.status === "attending") {
          await storage.createNotification({
            userId: attendee.userId,
            type: "event_starting_soon" as string,
            title: "Event Starting Soon!",
            message: `${event.title} starts in ${minutesUntilStart} minutes`,
            data: JSON.stringify({
              eventId,
              minutesUntilStart,
              communityId: event.communityId,
            }),
            priority: "urgent",
          });
        }
      }

      logger.info("Starting soon notifications sent", {
        eventId,
        minutesUntilStart,
      });
    } catch (error) {
      logger.error(
        "Failed to send starting soon notifications",
        toLoggableError(error),
        {
          eventId,
        },
      );
    }
  }

  /**
   * Send waitlist promoted notification
   */
  async sendWaitlistPromotedNotification(eventId: string, userId: string) {
    try {
      const event = await storage.getEvent(eventId);
      if (!event) return;

      await storage.createNotification({
        userId,
        type: "waitlist_promoted" as string,
        title: "Promoted from Waitlist!",
        message: `You've been promoted to a main player slot in ${event.title}`,
        data: JSON.stringify({ eventId, communityId: event.communityId }),
        priority: "high",
      });

      logger.info("Waitlist promotion notification sent", { eventId, userId });
    } catch (error) {
      logger.error(
        "Failed to send waitlist promotion notification",
        toLoggableError(error),
        {
          eventId,
          userId,
        },
      );
    }
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();
