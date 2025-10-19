import { storage } from "../../storage";
import { logger } from "../../logger";
import { withTransaction } from "@shared/database-unified";
import { BatchQueryOptimizer } from "../../utils/database.utils";
import { insertEventSchema } from "@shared/schema";
import type { Event, EventAttendee } from "@shared/schema";
// Note: User type reserved for future user-related event features
import type {
  EventFilters,
  CalendarEventFilters,
  CreateEventRequest,
  UpdateEventRequest,
  JoinEventRequest,
  BulkEventsRequest,
  RecurringEventRequest,
} from "./events.types";

export class EventsService {
  async getEvents(filters: EventFilters) {
    try {
      return await storage.getEvents(filters);
    } catch (error) {
      logger.error("Failed to fetch events in EventsService", error, {
        filters,
      });
      throw error;
    }
  }

  /**
   * Get events with attendees using optimized batch loading to prevent N+1 queries
   */
  async getEventsWithAttendees(filters: EventFilters) {
    try {
      // First, get the events
      const events = await storage.getEvents(filters);

      if (events.length === 0) {
        return { data: events };
      }

      // Use batch query optimization to load all attendees at once
      const attendeesMap = await BatchQueryOptimizer.batchQuery(
        events,
        (event: Event) => event.id,
        (eventIds: string[]) => storage.getEventAttendeesByEventIds(eventIds),
        (attendee: EventAttendee) => attendee.eventId,
      );

      // Attach attendees to each event
      const eventsWithAttendees = events.map((event: any) => ({
        ...event,
        attendees: attendeesMap.get(event.id) || [],
        attendeeCount: attendeesMap.get(event.id)?.length || 0,
      }));

      return {
        data: eventsWithAttendees,
      };
    } catch (error) {
      logger.error(
        "Failed to fetch events with attendees in EventsService",
        error,
        { filters },
      );
      throw error;
    }
  }

  async getEvent(id: string, userId?: string) {
    try {
      return await storage.getEvent(id, userId);
    } catch (error) {
      logger.error("Failed to fetch event in EventsService", error, {
        eventId: id,
        userId,
      });
      throw error;
    }
  }

  async createEvent(
    userId: string,
    eventData: CreateEventRequest,
  ): Promise<Event> {
    try {
      const parsedEventData = insertEventSchema.parse({
        ...eventData,
        creatorId: userId,
        hostId: userId, // Set host to the same user who created the event
      });

      const event = await storage.createEvent(parsedEventData);
      logger.info("Event created", {
        eventId: event.id,
        userId,
        title: event.title,
      });
      return event;
    } catch (error) {
      logger.error("Failed to create event in EventsService", error, {
        userId,
      });
      throw error;
    }
  }

  async updateEvent(
    eventId: string,
    userId: string,
    eventData: UpdateEventRequest,
  ): Promise<Event> {
    try {
      // Check if user owns the event
      const existingEvent = await storage.getEvent(eventId);
      if (!existingEvent) {
        throw new Error("Event not found");
      }
      if (existingEvent.creatorId !== userId) {
        throw new Error("Not authorized to edit this event");
      }

      const parsedEventData = insertEventSchema.partial().parse(eventData);
      const updatedEvent = await storage.updateEvent(eventId, parsedEventData);

      logger.info("Event updated", {
        eventId,
        userId,
        title: updatedEvent.title,
      });
      return updatedEvent;
    } catch (error) {
      logger.error("Failed to update event in EventsService", error, {
        eventId,
        userId,
      });
      throw error;
    }
  }

  async deleteEvent(eventId: string, userId: string): Promise<void> {
    try {
      // Check if user owns the event
      const existingEvent = await storage.getEvent(eventId);
      if (!existingEvent) {
        throw new Error("Event not found");
      }
      if (existingEvent.creatorId !== userId) {
        throw new Error("Not authorized to delete this event");
      }

      await storage.deleteEvent(eventId);
      logger.info("Event deleted", { eventId, userId });
    } catch (error) {
      logger.error("Failed to delete event in EventsService", error, {
        eventId,
        userId,
      });
      throw error;
    }
  }

  async joinEvent(
    eventId: string,
    userId: string,
    joinData: JoinEventRequest,
  ): Promise<EventAttendee> {
    try {
      // Use transaction to ensure event joining and notifications are created atomically
      const result = await withTransaction(async (tx) => {
        // Verify event exists
        const event = await storage.getEventWithTransaction(tx, eventId);
        if (!event) {
          throw new Error("Event not found");
        }

        const { status = "attending" } = joinData;

        // Create the event attendee record (note: schema doesn't have role/playerType fields)
        const attendee = await storage.joinEventWithTransaction(tx, {
          eventId,
          userId,
          status: status as "attending" | "maybe" | "not_attending",
        });

        // Create notification for the event host (if different from joiner)
        if (event.hostId && event.hostId !== userId && status === "attending") {
          await storage.createNotificationWithTransaction(tx, {
            userId: event.hostId,
            type: "event_join",
            title: "New Event Participant",
            message: `A user joined your event: ${event.title}`,
            data: JSON.stringify({
              eventId: event.id,
              participantId: userId,
              eventTitle: event.title,
            }),
            priority: "normal",
          });
        }

        return attendee;
      }, "join-event-with-notification");

      logger.info("User joined event with notification", {
        eventId,
        userId,
        status: joinData.status,
        role: joinData.role,
        playerType: joinData.playerType,
      });

      return result;
    } catch (error) {
      logger.error("Failed to join event in EventsService", error, {
        eventId,
        userId,
        joinData,
      });
      throw error;
    }
  }

  async leaveEvent(eventId: string, userId: string): Promise<void> {
    try {
      await storage.leaveEvent(eventId, userId);
      logger.info("User left event", { eventId, userId });
    } catch (error) {
      logger.error("Failed to leave event in EventsService", error, {
        eventId,
        userId,
      });
      throw error;
    }
  }

  async getEventAttendees(eventId: string) {
    try {
      return await storage.getEventAttendees(eventId);
    } catch (error) {
      logger.error("Failed to fetch event attendees in EventsService", error, {
        eventId,
      });
      throw error;
    }
  }

  async getUserEvents(userId: string) {
    try {
      return await storage.getUserEventAttendance(userId);
    } catch (error) {
      logger.error("Failed to fetch user events in EventsService", error, {
        userId,
      });
      throw error;
    }
  }

  async createBulkEvents(
    userId: string,
    bulkRequest: BulkEventsRequest,
  ): Promise<Event[]> {
    try {
      const { events } = bulkRequest;

      if (!Array.isArray(events) || events.length === 0) {
        throw new Error("Events array is required");
      }

      // Add creator and host information to each event and transform date/time to startTime
      const eventData = events.map((event) => {
        const {
          date,
          time,
          recurrencePattern: _recurrencePattern, // Reserved for recurring events feature
          recurrenceInterval: _recurrenceInterval, // Reserved for recurring events feature
          recurrenceEndDate: _recurrenceEndDate, // Reserved for recurring events feature
          ...eventProps
        } = event;
        const startTime = new Date(`${date}T${time || "12:00"}`);

        return {
          ...eventProps,
          creatorId: userId,
          hostId: userId,
          startTime,
          type: event.type as
            | "tournament"
            | "convention"
            | "release"
            | "community"
            | "game_pod"
            | "stream"
            | "personal",
        };
      });

      const createdEvents = await storage.createBulkEvents(eventData);
      logger.info("Bulk events created", {
        userId,
        count: createdEvents.length,
      });
      return createdEvents;
    } catch (error) {
      logger.error("Failed to create bulk events in EventsService", error, {
        userId,
      });
      throw error;
    }
  }

  async createRecurringEvents(
    userId: string,
    recurringRequest: RecurringEventRequest,
  ): Promise<Event[]> {
    try {
      // Validate recurrencePattern
      const validPatterns = ["daily", "weekly", "monthly"] as const;
      const recurrencePattern = validPatterns.includes(
        recurringRequest.recurrencePattern as any,
      )
        ? (recurringRequest.recurrencePattern as "daily" | "weekly" | "monthly")
        : undefined;

      if (!recurrencePattern) {
        throw new Error(
          `Invalid recurrence pattern: ${recurringRequest.recurrencePattern}. Must be one of: ${validPatterns.join(", ")}`,
        );
      }

      // Create base event data without recurrence fields and transform date/time to startTime
      const {
        recurrencePattern: _pattern,
        recurrenceInterval: _interval,
        recurrenceEndDate: _endDate,
        date,
        time,
        ...eventBase
      } = recurringRequest;

      const startTime = new Date(`${date}T${time || "12:00"}`);

      const eventData = {
        ...eventBase,
        creatorId: userId,
        hostId: userId,
        startTime,
        type: recurringRequest.type as
          | "tournament"
          | "convention"
          | "release"
          | "community"
          | "game_pod"
          | "stream"
          | "personal",
      };

      const createdEvents = await storage.createRecurringEvents(
        eventData,
        recurringRequest.recurrenceEndDate,
      );
      logger.info("Recurring events created", {
        userId,
        count: createdEvents.length,
        pattern: recurrencePattern,
      });
      return createdEvents;
    } catch (error) {
      logger.error(
        "Failed to create recurring events in EventsService",
        error,
        { userId },
      );
      throw error;
    }
  }

  async getCalendarEvents(filters: CalendarEventFilters) {
    try {
      const { startDate, endDate } = filters;

      if (!startDate || !endDate) {
        throw new Error("startDate and endDate are required");
      }

      return await storage.getCalendarEvents(filters);
    } catch (error) {
      logger.error("Failed to fetch calendar events in EventsService", error, {
        filters,
      });
      throw error;
    }
  }
}

export const eventsService = new EventsService();
