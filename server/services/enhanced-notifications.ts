import { storage } from "../storage";
import { logger } from "../logger";

export interface NotificationTrigger {
  type: 'event_reminder' | 'event_updated' | 'event_cancelled' | 'event_starting_soon' | 'waitlist_promoted';
  eventId: string;
  userId: string;
  data?: any;
}

export class EnhancedNotificationService {
  /**
   * Send event reminder notification
   */
  async sendEventReminder(eventId: string, hoursBeforeEvent: number) {
    try {
      const event = await storage.getEvent(eventId);
      if (!event) return;

      const attendees = await storage.getEventAttendees(eventId);
      
      for (const attendee of attendees) {
        if (attendee.status === 'attending') {
          await storage.createNotification({
            userId: attendee.userId,
            type: 'event_reminder' as any,
            title: `Event Starting in ${hoursBeforeEvent} Hours`,
            message: `${event.title} starts at ${new Date(event.startTime).toLocaleString()}`,
            data: JSON.stringify({ eventId, hoursBeforeEvent, communityId: event.communityId }),
            priority: hoursBeforeEvent <= 1 ? 'high' : 'normal',
          });
        }
      }

      logger.info('Event reminders sent', { eventId, count: attendees.length });
    } catch (error) {
      logger.error('Failed to send event reminders', error, { eventId });
    }
  }

  /**
   * Send event updated notification
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
            type: 'event_updated' as any,
            title: 'Event Updated',
            message: `${event.title} has been updated: ${changes.join(', ')}`,
            data: JSON.stringify({ eventId, changes, communityId: event.communityId }),
            priority: 'normal',
          });
        }
      }

      logger.info('Event update notifications sent', { eventId, changes });
    } catch (error) {
      logger.error('Failed to send event update notifications', error, { eventId });
    }
  }

  /**
   * Send event cancelled notification
   */
  async sendEventCancelledNotification(eventId: string) {
    try {
      const event = await storage.getEvent(eventId);
      if (!event) return;

      const attendees = await storage.getEventAttendees(eventId);
      
      for (const attendee of attendees) {
        await storage.createNotification({
          userId: attendee.userId,
          type: 'event_cancelled' as any,
          title: 'Event Cancelled',
          message: `${event.title} has been cancelled`,
          data: JSON.stringify({ eventId, communityId: event.communityId }),
          priority: 'high',
        });
      }

      logger.info('Event cancellation notifications sent', { eventId, count: attendees.length });
    } catch (error) {
      logger.error('Failed to send event cancellation notifications', error, { eventId });
    }
  }

  /**
   * Send starting soon notification
   */
  async sendEventStartingSoonNotification(eventId: string, minutesUntilStart: number) {
    try {
      const event = await storage.getEvent(eventId);
      if (!event) return;

      const attendees = await storage.getEventAttendees(eventId);
      
      for (const attendee of attendees) {
        if (attendee.status === 'attending') {
          await storage.createNotification({
            userId: attendee.userId,
            type: 'event_starting_soon' as any,
            title: 'Event Starting Soon!',
            message: `${event.title} starts in ${minutesUntilStart} minutes`,
            data: JSON.stringify({ eventId, minutesUntilStart, communityId: event.communityId }),
            priority: 'urgent',
          });
        }
      }

      logger.info('Starting soon notifications sent', { eventId, minutesUntilStart });
    } catch (error) {
      logger.error('Failed to send starting soon notifications', error, { eventId });
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
        type: 'waitlist_promoted' as any,
        title: 'Promoted from Waitlist!',
        message: `You've been promoted to a main player slot in ${event.title}`,
        data: JSON.stringify({ eventId, communityId: event.communityId }),
        priority: 'high',
      });

      logger.info('Waitlist promotion notification sent', { eventId, userId });
    } catch (error) {
      logger.error('Failed to send waitlist promotion notification', error, { eventId, userId });
    }
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();
