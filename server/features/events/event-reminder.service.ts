import { eq, and, lte, inArray } from "drizzle-orm";
import { db } from "@shared/database-unified";
import {
  eventReminders,
  eventReminderSettings,
  events,
  eventAttendees,
  type Event,
  type EventReminderSettings,
  type InsertEventReminder,
} from "@shared/schema";
import { logger } from "../../logger";
import { notificationDeliveryService } from "../../services/notification-delivery.service";
import { storage } from "../../storage";

/**
 * Default reminder times in minutes before event
 */
const DEFAULT_REMINDER_TIMES = [60, 1440]; // 1 hour, 1 day

/**
 * Default notification channels for reminders
 */
const DEFAULT_CHANNELS = ["email", "in_app"];

export interface ReminderScheduleResult {
  success: boolean;
  remindersScheduled: number;
  errors?: string[];
}

export interface ReminderSendResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * Service for managing event reminders and notifications
 */
export class EventReminderService {
  /**
   * Schedule reminders for a specific event and its attendees
   */
  async scheduleReminders(
    eventId: string,
    attendeeUserIds?: string[],
  ): Promise<ReminderScheduleResult> {
    try {
      // Get event details
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (!event) {
        logger.warn("Event not found for reminder scheduling", { eventId });
        return {
          success: false,
          remindersScheduled: 0,
          errors: ["Event not found"],
        };
      }

      // Skip if event already started or is in the past
      const now = new Date();
      if (event.startTime && new Date(event.startTime) <= now) {
        logger.info("Event already started, skipping reminder scheduling", {
          eventId,
          startTime: event.startTime,
        });
        return { success: true, remindersScheduled: 0 };
      }

      // Get attendees to schedule reminders for
      let userIds = attendeeUserIds;
      if (!userIds) {
        // Get all confirmed/attending attendees
        const attendees = await db
          .select({ userId: eventAttendees.userId })
          .from(eventAttendees)
          .where(
            and(
              eq(eventAttendees.eventId, eventId),
              inArray(eventAttendees.status, ["confirmed", "attending"]),
            ),
          );
        userIds = attendees.map((a) => a.userId);
      }

      if (userIds.length === 0) {
        logger.info("No attendees to schedule reminders for", { eventId });
        return { success: true, remindersScheduled: 0 };
      }

      logger.info("Scheduling reminders for event", {
        eventId,
        attendeeCount: userIds.length,
      });

      const errors: string[] = [];
      let remindersScheduled = 0;

      // Schedule reminders for each user
      for (const userId of userIds) {
        try {
          const count = await this.scheduleRemindersForUser(userId, event);
          remindersScheduled += count;
        } catch (error) {
          const errorMsg = `Failed to schedule reminders for user ${userId}: ${error instanceof Error ? error.message : String(error)}`;
          logger.error(errorMsg, { eventId, userId, error });
          errors.push(errorMsg);
        }
      }

      logger.info("Reminder scheduling completed", {
        eventId,
        remindersScheduled,
        errors: errors.length,
      });

      return {
        success: errors.length === 0,
        remindersScheduled,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error("Failed to schedule event reminders", {
        error,
        eventId,
      });
      return {
        success: false,
        remindersScheduled: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Schedule reminders for a specific user and event
   */
  private async scheduleRemindersForUser(
    userId: string,
    event: Event,
  ): Promise<number> {
    // Get user's reminder settings
    const settings = await this.getUserReminderSettings(userId);

    if (!settings.isEnabled) {
      logger.debug("Reminders disabled for user", { userId });
      return 0;
    }

    // Parse reminder times and channels
    const reminderTimes = JSON.parse(settings.reminderTimes) as number[];
    const channels = JSON.parse(settings.channels) as string[];

    const eventStartTime = new Date(event.startTime);
    const now = new Date();
    let scheduled = 0;

    for (const minutesBefore of reminderTimes) {
      // Calculate when to send the reminder
      const reminderTime = new Date(
        eventStartTime.getTime() - minutesBefore * 60 * 1000,
      );

      // Skip if reminder time is in the past
      if (reminderTime <= now) {
        logger.debug("Skipping past reminder time", {
          userId,
          eventId: event.id,
          minutesBefore,
          reminderTime,
        });
        continue;
      }

      // Check if reminder already exists
      const existing = await db
        .select()
        .from(eventReminders)
        .where(
          and(
            eq(eventReminders.eventId, event.id),
            eq(eventReminders.userId, userId),
            eq(eventReminders.minutesBefore, minutesBefore),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        logger.debug("Reminder already exists", {
          userId,
          eventId: event.id,
          minutesBefore,
        });
        continue;
      }

      // Create reminder record
      const reminderData: InsertEventReminder = {
        eventId: event.id,
        userId,
        reminderTime,
        minutesBefore,
        channels: JSON.stringify(channels),
        status: "pending",
      };

      await db.insert(eventReminders).values(reminderData);
      scheduled++;

      logger.debug("Reminder scheduled", {
        userId,
        eventId: event.id,
        minutesBefore,
        reminderTime,
      });
    }

    return scheduled;
  }

  /**
   * Send a specific reminder
   */
  async sendReminder(reminderId: string): Promise<ReminderSendResult> {
    try {
      // Get reminder details
      const [reminder] = await db
        .select()
        .from(eventReminders)
        .where(eq(eventReminders.id, reminderId))
        .limit(1);

      if (!reminder) {
        return { success: false, error: "Reminder not found" };
      }

      if (reminder.status !== "pending") {
        logger.warn("Reminder already processed", {
          reminderId,
          status: reminder.status,
        });
        return {
          success: false,
          error: `Reminder status is ${reminder.status}`,
        };
      }

      // Get event details
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, reminder.eventId))
        .limit(1);

      if (!event) {
        await this.markReminderFailed(reminderId, "Event not found");
        return { success: false, error: "Event not found" };
      }

      // Get user details
      const user = await storage.getUser(reminder.userId);
      if (!user) {
        await this.markReminderFailed(reminderId, "User not found");
        return { success: false, error: "User not found" };
      }

      // Create notification
      const notification = await storage.createNotification({
        userId: reminder.userId,
        type: "event_reminder",
        priority: this.getReminderPriority(reminder.minutesBefore),
        title: this.buildReminderTitle(event, reminder.minutesBefore),
        message: this.buildReminderMessage(event, reminder.minutesBefore),
        data: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          eventType: event.type,
          startTime: event.startTime,
          location: event.location,
          minutesBefore: reminder.minutesBefore,
        }),
        actionUrl: `/events/${event.id}`,
        actionText: "View Event",
      });

      // Parse channels
      const channels = JSON.parse(reminder.channels) as string[];

      // Deliver notification through specified channels
      const channelConfig = {
        browser: channels.includes("in_app"),
        email: channels.includes("email"),
        push: channels.includes("push"),
        sms: false,
        webhook: false,
      };

      await notificationDeliveryService.deliverNotification(
        reminder.userId,
        notification,
        channelConfig,
      );

      // Mark reminder as sent
      await db
        .update(eventReminders)
        .set({
          status: "sent",
          sentAt: new Date(),
          notificationId: notification.id,
        })
        .where(eq(eventReminders.id, reminderId));

      logger.info("Event reminder sent successfully", {
        reminderId,
        eventId: event.id,
        userId: reminder.userId,
        minutesBefore: reminder.minutesBefore,
        channels,
      });

      return { success: true, notificationId: notification.id };
    } catch (error) {
      logger.error("Failed to send event reminder", {
        error,
        reminderId,
      });

      await this.markReminderFailed(
        reminderId,
        error instanceof Error ? error.message : String(error),
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Cancel all reminders for an event
   */
  async cancelReminders(eventId: string): Promise<number> {
    try {
      const result = await db
        .update(eventReminders)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(eventReminders.eventId, eventId),
            eq(eventReminders.status, "pending"),
          ),
        );

      const cancelledCount = result.changes || 0;

      logger.info("Event reminders cancelled", {
        eventId,
        cancelledCount,
      });

      return cancelledCount;
    } catch (error) {
      logger.error("Failed to cancel event reminders", {
        error,
        eventId,
      });
      return 0;
    }
  }

  /**
   * Cancel reminders for a specific user leaving an event
   */
  async cancelUserReminders(eventId: string, userId: string): Promise<number> {
    try {
      const result = await db
        .update(eventReminders)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(eventReminders.eventId, eventId),
            eq(eventReminders.userId, userId),
            eq(eventReminders.status, "pending"),
          ),
        );

      const cancelledCount = result.changes || 0;

      logger.info("User event reminders cancelled", {
        eventId,
        userId,
        cancelledCount,
      });

      return cancelledCount;
    } catch (error) {
      logger.error("Failed to cancel user event reminders", {
        error,
        eventId,
        userId,
      });
      return 0;
    }
  }

  /**
   * Process all upcoming reminders that are due to be sent
   */
  async processUpcomingReminders(): Promise<{
    processed: number;
    sent: number;
    failed: number;
  }> {
    try {
      const now = new Date();

      // Get all pending reminders that are due
      const dueReminders = await db
        .select()
        .from(eventReminders)
        .where(
          and(
            eq(eventReminders.status, "pending"),
            lte(eventReminders.reminderTime, now),
          ),
        )
        .limit(100); // Process in batches

      if (dueReminders.length === 0) {
        logger.debug("No due reminders to process");
        return { processed: 0, sent: 0, failed: 0 };
      }

      logger.info("Processing due reminders", {
        count: dueReminders.length,
      });

      let sent = 0;
      let failed = 0;

      for (const reminder of dueReminders) {
        const result = await this.sendReminder(reminder.id);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }

      logger.info("Reminder processing completed", {
        processed: dueReminders.length,
        sent,
        failed,
      });

      return {
        processed: dueReminders.length,
        sent,
        failed,
      };
    } catch (error) {
      logger.error("Failed to process upcoming reminders", { error });
      return { processed: 0, sent: 0, failed: 0 };
    }
  }

  /**
   * Get or create user reminder settings
   */
  private async getUserReminderSettings(
    userId: string,
  ): Promise<EventReminderSettings> {
    const [settings] = await db
      .select()
      .from(eventReminderSettings)
      .where(eq(eventReminderSettings.userId, userId))
      .limit(1);

    if (settings) {
      return settings;
    }

    // Create default settings
    const defaultSettings = {
      userId,
      reminderTimes: JSON.stringify(DEFAULT_REMINDER_TIMES),
      channels: JSON.stringify(DEFAULT_CHANNELS),
      isEnabled: true,
    };

    const [newSettings] = await db
      .insert(eventReminderSettings)
      .values(defaultSettings)
      .returning();

    if (!newSettings) {
      throw new Error("Failed to create default reminder settings");
    }

    return newSettings;
  }

  /**
   * Mark a reminder as failed
   */
  private async markReminderFailed(
    reminderId: string,
    reason: string,
  ): Promise<void> {
    try {
      await db
        .update(eventReminders)
        .set({
          status: "failed",
          failureReason: reason,
        })
        .where(eq(eventReminders.id, reminderId));
    } catch (error) {
      logger.error("Failed to mark reminder as failed", {
        error,
        reminderId,
      });
    }
  }

  /**
   * Get reminder priority based on time before event
   */
  private getReminderPriority(
    minutesBefore: number,
  ): "low" | "normal" | "high" | "urgent" {
    if (minutesBefore <= 60) return "high"; // 1 hour or less
    if (minutesBefore <= 1440) return "normal"; // 1 day or less
    return "low"; // More than 1 day
  }

  /**
   * Build reminder notification title
   */
  private buildReminderTitle(event: Event, minutesBefore: number): string {
    const timeText = this.formatTimeBeforeEvent(minutesBefore);
    return `Event Reminder: ${event.title} in ${timeText}`;
  }

  /**
   * Build reminder notification message
   */
  private buildReminderMessage(event: Event, minutesBefore: number): string {
    const timeText = this.formatTimeBeforeEvent(minutesBefore);
    const eventType = this.capitalizeFirst(event.type);

    let message = `${eventType} "${event.title}" starts in ${timeText}.`;

    if (event.location) {
      message += ` Location: ${event.location}.`;
    }

    return message;
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Format time before event in human-readable format
   */
  private formatTimeBeforeEvent(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else if (minutes < 10080) {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days !== 1 ? "s" : ""}`;
    } else {
      const weeks = Math.floor(minutes / 10080);
      return `${weeks} week${weeks !== 1 ? "s" : ""}`;
    }
  }

  /**
   * Get user's reminder settings (public interface)
   */
  async getReminderSettings(userId: string): Promise<EventReminderSettings> {
    return this.getUserReminderSettings(userId);
  }

  /**
   * Update user's reminder settings
   */
  async updateReminderSettings(
    userId: string,
    settings: {
      reminderTimes?: number[];
      channels?: string[];
      isEnabled?: boolean;
      eventType?: string | null;
    },
  ): Promise<EventReminderSettings> {
    try {
      const existing = await this.getUserReminderSettings(userId);

      const updateData: Partial<EventReminderSettings> = {
        updatedAt: new Date(),
      };

      if (settings.reminderTimes !== undefined) {
        updateData.reminderTimes = JSON.stringify(settings.reminderTimes);
      }

      if (settings.channels !== undefined) {
        updateData.channels = JSON.stringify(settings.channels);
      }

      if (settings.isEnabled !== undefined) {
        updateData.isEnabled = settings.isEnabled;
      }

      if (settings.eventType !== undefined) {
        updateData.eventType = settings.eventType;
      }

      const [updated] = await db
        .update(eventReminderSettings)
        .set(updateData)
        .where(eq(eventReminderSettings.id, existing.id))
        .returning();

      if (!updated) {
        throw new Error("Failed to update reminder settings");
      }

      logger.info("Reminder settings updated", {
        userId,
        settings: updateData,
      });

      return updated;
    } catch (error) {
      logger.error("Failed to update reminder settings", {
        error,
        userId,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const eventReminderService = new EventReminderService();
