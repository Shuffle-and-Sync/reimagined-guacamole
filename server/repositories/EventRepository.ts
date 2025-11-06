/**
 * Event Repository
 *
 * Handles all database operations related to events and event attendees.
 * This repository manages:
 * - Event CRUD operations
 * - Event attendees management
 * - Calendar event queries
 * - Bulk and recurring event creation
 * - Event tracking and analytics
 *
 * @module EventRepository
 */

import { eq, and, gte, inArray, count, desc } from "drizzle-orm";
import {
  db,
  withQueryTiming,
  type Transaction,
} from "@shared/database-unified";
import {
  events,
  eventAttendees,
  users,
  communities,
  eventTracking,
  type Event,
  type InsertEvent,
  type EventAttendee,
  type InsertEventAttendee,
  type User,
  type Community,
  type EventTracking,
  type InsertEventTracking,
} from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { DatabaseError } from "../middleware/error-handling.middleware";
import { BaseRepository } from "./base";

/**
 * Event filters for querying events
 */
export interface EventFilters {
  userId?: string;
  communityId?: string;
  type?: string;
  upcoming?: boolean;
}

/**
 * Calendar event filters with time range
 */
export interface CalendarEventFilters {
  startTime: Date;
  endTime: Date;
  communityId?: string;
  userId?: string;
}

/**
 * Event with related data
 */
export interface EventWithDetails extends Event {
  creator: User;
  community: Community | null;
  attendeeCount: number;
  isUserAttending?: boolean;
}

/**
 * EventRepository
 *
 * Manages all event-related database operations including events,
 * attendees, and event tracking.
 */
export class EventRepository extends BaseRepository<
  typeof events,
  Event,
  InsertEvent
> {
  constructor(dbInstance = db) {
    super(dbInstance, events, "events");
  }

  /**
   * Get events with filters and related data
   *
   * @param filters - Optional filters for events
   * @returns Promise of events with creator, community, and attendee information
   *
   * @example
   * ```typescript
   * const upcomingEvents = await eventRepo.getEvents({
   *   communityId: 'community-123',
   *   upcoming: true
   * });
   * ```
   */
  async getEvents(filters?: EventFilters): Promise<EventWithDetails[]> {
    return withQueryTiming("EventRepository:getEvents", async () => {
      try {
        // Build base query with joins
        const baseQuery = this.db
          .select({
            id: events.id,
            title: events.title,
            description: events.description,
            type: events.type,
            startTime: events.startTime,
            endTime: events.endTime,
            location: events.location,
            communityId: events.communityId,
            creatorId: events.creatorId,
            hostId: events.hostId,
            coHostId: events.coHostId,
            maxAttendees: events.maxAttendees,
            isVirtual: events.isVirtual,
            status: events.status,
            createdAt: events.createdAt,
            updatedAt: events.updatedAt,
            creator: users,
            community: communities,
          })
          .from(events)
          .leftJoin(users, eq(events.creatorId, users.id))
          .leftJoin(communities, eq(events.communityId, communities.id));

        // Build conditions
        const conditions = [];
        if (filters?.communityId) {
          conditions.push(eq(events.communityId, filters.communityId));
        }
        if (filters?.type) {
          conditions.push(eq(events.type, filters.type));
        }
        if (filters?.upcoming) {
          conditions.push(gte(events.startTime, new Date()));
        }

        // Apply conditions
        const query =
          conditions.length > 0
            ? baseQuery.where(and(...conditions))
            : baseQuery;

        const rawEvents = await query.orderBy(events.startTime);

        // Get attendee counts separately
        const eventIds = rawEvents.map((e) => e.id);
        const attendeeCounts =
          eventIds.length > 0
            ? await this.db
                .select({
                  eventId: eventAttendees.eventId,
                  count: count(eventAttendees.id).as("count"),
                })
                .from(eventAttendees)
                .where(inArray(eventAttendees.eventId, eventIds))
                .groupBy(eventAttendees.eventId)
            : [];

        // Get user attendance if userId is provided
        const userAttendance =
          filters?.userId && eventIds.length > 0
            ? await this.db
                .select({
                  eventId: eventAttendees.eventId,
                })
                .from(eventAttendees)
                .where(
                  and(
                    inArray(eventAttendees.eventId, eventIds),
                    eq(eventAttendees.userId, filters.userId),
                  ),
                )
            : [];

        // Map attendee counts to events
        const attendeeCountMap = new Map(
          attendeeCounts.map((ac) => [ac.eventId, Number(ac.count)]),
        );
        const userAttendanceSet = new Set(
          userAttendance.map((ua) => ua.eventId),
        );

        // Combine data
        return rawEvents.map((event) => {
          // Creator must exist since we're joining
          if (!event.creator) {
            throw new DatabaseError("Event creator not found");
          }

          return {
            ...event,
            creator: event.creator,
            attendeeCount: attendeeCountMap.get(event.id) || 0,
            isUserAttending: filters?.userId
              ? userAttendanceSet.has(event.id)
              : undefined,
          };
        }) as EventWithDetails[];
      } catch (error) {
        logger.error("Failed to get events", toLoggableError(error), {
          filters,
        });
        throw new DatabaseError("Failed to get events", { cause: error });
      }
    });
  }

  /**
   * Get a single event by ID with related data
   *
   * @param id - Event ID
   * @param userId - Optional user ID to check attendance
   * @returns Promise of event with details or null
   *
   * @example
   * ```typescript
   * const event = await eventRepo.getEvent('event-123', 'user-456');
   * console.log(`User attending: ${event?.isUserAttending}`);
   * ```
   */
  async getEvent(
    id: string,
    userId?: string,
  ): Promise<EventWithDetails | null> {
    return withQueryTiming("EventRepository:getEvent", async () => {
      try {
        const result = await this.db
          .select({
            id: events.id,
            title: events.title,
            description: events.description,
            type: events.type,
            startTime: events.startTime,
            endTime: events.endTime,
            location: events.location,
            communityId: events.communityId,
            creatorId: events.creatorId,
            hostId: events.hostId,
            coHostId: events.coHostId,
            maxAttendees: events.maxAttendees,
            isVirtual: events.isVirtual,
            status: events.status,
            createdAt: events.createdAt,
            updatedAt: events.updatedAt,
            creator: users,
            community: communities,
          })
          .from(events)
          .leftJoin(users, eq(events.creatorId, users.id))
          .leftJoin(communities, eq(events.communityId, communities.id))
          .where(eq(events.id, id))
          .limit(1);

        if (result.length === 0) {
          return null;
        }

        const event = result[0];

        // Ensure creator exists
        if (!event.creator) {
          throw new DatabaseError("Event creator not found");
        }

        // Get attendee count
        const attendeeCountResult = await this.db
          .select({
            count: count(eventAttendees.id).as("count"),
          })
          .from(eventAttendees)
          .where(eq(eventAttendees.eventId, id));

        // Check if user is attending
        let isUserAttending: boolean | undefined;
        if (userId) {
          const attendance = await this.db
            .select()
            .from(eventAttendees)
            .where(
              and(
                eq(eventAttendees.eventId, id),
                eq(eventAttendees.userId, userId),
              ),
            )
            .limit(1);
          isUserAttending = attendance.length > 0;
        }

        return {
          ...event,
          creator: event.creator,
          attendeeCount: Number(attendeeCountResult[0]?.count || 0),
          isUserAttending,
        } as EventWithDetails;
      } catch (error) {
        logger.error("Failed to get event", toLoggableError(error), {
          id,
          userId,
        });
        throw new DatabaseError("Failed to get event", { cause: error });
      }
    });
  }

  /**
   * Get calendar events within a time range
   *
   * @param filters - Calendar filters with time range
   * @returns Promise of events within the time range
   *
   * @example
   * ```typescript
   * const events = await eventRepo.getCalendarEvents({
   *   startTime: new Date('2025-01-01'),
   *   endTime: new Date('2025-01-31'),
   *   communityId: 'community-123'
   * });
   * ```
   */
  async getCalendarEvents(
    filters: CalendarEventFilters,
  ): Promise<EventWithDetails[]> {
    return withQueryTiming("EventRepository:getCalendarEvents", async () => {
      try {
        const conditions = [
          gte(events.startTime, filters.startTime),
          gte(filters.endTime, events.startTime),
        ];

        if (filters.communityId) {
          conditions.push(eq(events.communityId, filters.communityId));
        }

        const rawEvents = await this.db
          .select({
            id: events.id,
            title: events.title,
            description: events.description,
            type: events.type,
            startTime: events.startTime,
            endTime: events.endTime,
            location: events.location,
            communityId: events.communityId,
            creatorId: events.creatorId,
            hostId: events.hostId,
            coHostId: events.coHostId,
            maxAttendees: events.maxAttendees,
            isVirtual: events.isVirtual,
            status: events.status,
            createdAt: events.createdAt,
            updatedAt: events.updatedAt,
            creator: users,
            community: communities,
          })
          .from(events)
          .leftJoin(users, eq(events.creatorId, users.id))
          .leftJoin(communities, eq(events.communityId, communities.id))
          .where(and(...conditions))
          .orderBy(events.startTime);

        // Get attendee counts
        const eventIds = rawEvents.map((e) => e.id);
        const attendeeCounts =
          eventIds.length > 0
            ? await this.db
                .select({
                  eventId: eventAttendees.eventId,
                  count: count(eventAttendees.id).as("count"),
                })
                .from(eventAttendees)
                .where(inArray(eventAttendees.eventId, eventIds))
                .groupBy(eventAttendees.eventId)
            : [];

        // Get user attendance if userId is provided
        const userAttendance =
          filters.userId && eventIds.length > 0
            ? await this.db
                .select({
                  eventId: eventAttendees.eventId,
                })
                .from(eventAttendees)
                .where(
                  and(
                    inArray(eventAttendees.eventId, eventIds),
                    eq(eventAttendees.userId, filters.userId),
                  ),
                )
            : [];

        const attendeeCountMap = new Map(
          attendeeCounts.map((ac) => [ac.eventId, Number(ac.count)]),
        );
        const userAttendanceSet = new Set(
          userAttendance.map((ua) => ua.eventId),
        );

        return rawEvents.map((event) => {
          // Creator must exist since we're joining
          if (!event.creator) {
            throw new DatabaseError("Event creator not found");
          }

          return {
            ...event,
            creator: event.creator,
            attendeeCount: attendeeCountMap.get(event.id) || 0,
            isUserAttending: filters.userId
              ? userAttendanceSet.has(event.id)
              : undefined,
          };
        }) as EventWithDetails[];
      } catch (error) {
        logger.error("Failed to get calendar events", toLoggableError(error), {
          filters,
        });
        throw new DatabaseError("Failed to get calendar events", {
          cause: error,
        });
      }
    });
  }

  /**
   * Create bulk events
   *
   * @param data - Array of events to create
   * @returns Promise of created events
   *
   * @example
   * ```typescript
   * const events = await eventRepo.createBulkEvents([
   *   { title: 'Event 1', ... },
   *   { title: 'Event 2', ... }
   * ]);
   * ```
   */
  async createBulkEvents(data: InsertEvent[]): Promise<Event[]> {
    return withQueryTiming("EventRepository:createBulkEvents", async () => {
      try {
        return await this.createMany(data);
      } catch (error) {
        logger.error("Failed to create bulk events", toLoggableError(error), {
          count: data.length,
        });
        throw new DatabaseError("Failed to create bulk events", {
          cause: error,
        });
      }
    });
  }

  /**
   * Create recurring events
   *
   * @param data - Base event data
   * @param endDate - End date for recurrence
   * @returns Promise of created events
   *
   * @example
   * ```typescript
   * const events = await eventRepo.createRecurringEvents(
   *   { title: 'Weekly Meeting', startTime: new Date(), ... },
   *   '2025-12-31'
   * );
   * ```
   */
  async createRecurringEvents(
    data: InsertEvent,
    endDate: string,
  ): Promise<Event[]> {
    return withQueryTiming(
      "EventRepository:createRecurringEvents",
      async () => {
        try {
          const events: InsertEvent[] = [];
          const startTime = new Date(data.startTime);
          const end = new Date(endDate);
          const eventDuration = data.endTime
            ? new Date(data.endTime).getTime() - startTime.getTime()
            : 0;

          let current = new Date(startTime);
          while (current <= end) {
            events.push({
              ...data,
              startTime: new Date(current),
              endTime: eventDuration
                ? new Date(current.getTime() + eventDuration)
                : data.endTime,
            });

            // Add 7 days for weekly recurrence
            current.setDate(current.getDate() + 7);
          }

          return await this.createMany(events);
        } catch (error) {
          logger.error(
            "Failed to create recurring events",
            toLoggableError(error),
            { endDate },
          );
          throw new DatabaseError("Failed to create recurring events", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Join an event (create event attendee)
   *
   * @param data - Attendee data
   * @returns Promise of created attendee
   *
   * @example
   * ```typescript
   * const attendee = await eventRepo.joinEvent({
   *   eventId: 'event-123',
   *   userId: 'user-456'
   * });
   * ```
   */
  async joinEvent(data: InsertEventAttendee): Promise<EventAttendee> {
    return withQueryTiming("EventRepository:joinEvent", async () => {
      try {
        const result = await this.db
          .insert(eventAttendees)
          .values(data)
          .returning();
        if (!result[0]) {
          throw new DatabaseError("Failed to join event - no result returned");
        }
        return result[0];
      } catch (error) {
        logger.error("Failed to join event", toLoggableError(error), { data });
        throw new DatabaseError("Failed to join event", { cause: error });
      }
    });
  }

  /**
   * Leave an event (delete event attendee)
   *
   * @param eventId - Event ID
   * @param userId - User ID
   *
   * @example
   * ```typescript
   * await eventRepo.leaveEvent('event-123', 'user-456');
   * ```
   */
  async leaveEvent(eventId: string, userId: string): Promise<void> {
    return withQueryTiming("EventRepository:leaveEvent", async () => {
      try {
        await this.db
          .delete(eventAttendees)
          .where(
            and(
              eq(eventAttendees.eventId, eventId),
              eq(eventAttendees.userId, userId),
            ),
          );
      } catch (error) {
        logger.error("Failed to leave event", toLoggableError(error), {
          eventId,
          userId,
        });
        throw new DatabaseError("Failed to leave event", { cause: error });
      }
    });
  }

  /**
   * Update event attendee data
   *
   * @param eventId - Event ID
   * @param userId - User ID
   * @param data - Partial attendee data to update
   * @returns Promise of updated attendee
   *
   * @example
   * ```typescript
   * const attendee = await eventRepo.updateEventAttendee(
   *   'event-123',
   *   'user-456',
   *   { status: 'confirmed' }
   * );
   * ```
   */
  async updateEventAttendee(
    eventId: string,
    userId: string,
    data: Partial<InsertEventAttendee>,
  ): Promise<EventAttendee> {
    return withQueryTiming("EventRepository:updateEventAttendee", async () => {
      try {
        const result = await this.db
          .update(eventAttendees)
          .set(data)
          .where(
            and(
              eq(eventAttendees.eventId, eventId),
              eq(eventAttendees.userId, userId),
            ),
          )
          .returning();

        if (result.length === 0) {
          throw new Error("Event attendee not found");
        }

        if (!result[0]) {
          throw new DatabaseError(
            "Failed to update event attendee - no result returned",
          );
        }

        return result[0];
      } catch (error) {
        logger.error(
          "Failed to update event attendee",
          toLoggableError(error),
          { eventId, userId, data },
        );
        throw new DatabaseError("Failed to update event attendee", {
          cause: error,
        });
      }
    });
  }

  /**
   * Get all attendees for an event
   *
   * @param eventId - Event ID
   * @returns Promise of event attendees
   *
   * @example
   * ```typescript
   * const attendees = await eventRepo.getEventAttendees('event-123');
   * ```
   */
  async getEventAttendees(eventId: string): Promise<EventAttendee[]> {
    return withQueryTiming("EventRepository:getEventAttendees", async () => {
      try {
        return await this.db
          .select()
          .from(eventAttendees)
          .where(eq(eventAttendees.eventId, eventId));
      } catch (error) {
        logger.error("Failed to get event attendees", toLoggableError(error), {
          eventId,
        });
        throw new DatabaseError("Failed to get event attendees", {
          cause: error,
        });
      }
    });
  }

  /**
   * Get attendees for multiple events (batch query optimization)
   *
   * @param eventIds - Array of event IDs
   * @returns Promise of event attendees
   *
   * @example
   * ```typescript
   * const attendees = await eventRepo.getEventAttendeesByEventIds([
   *   'event-123',
   *   'event-456'
   * ]);
   * ```
   */
  async getEventAttendeesByEventIds(
    eventIds: string[],
  ): Promise<EventAttendee[]> {
    return withQueryTiming(
      "EventRepository:getEventAttendeesByEventIds",
      async () => {
        try {
          if (eventIds.length === 0) {
            return [];
          }

          return await this.db
            .select()
            .from(eventAttendees)
            .where(inArray(eventAttendees.eventId, eventIds));
        } catch (error) {
          logger.error(
            "Failed to get event attendees by event IDs",
            toLoggableError(error),
            { eventIds },
          );
          throw new DatabaseError(
            "Failed to get event attendees by event IDs",
            { cause: error },
          );
        }
      },
    );
  }

  /**
   * Get user's event attendance
   *
   * @param userId - User ID
   * @param includeUpcoming - Whether to only include upcoming events
   * @returns Promise of events the user is attending
   *
   * @example
   * ```typescript
   * const myEvents = await eventRepo.getUserEventAttendance(
   *   'user-456',
   *   true
   * );
   * ```
   */
  async getUserEventAttendance(
    userId: string,
    includeUpcoming = false,
  ): Promise<EventWithDetails[]> {
    return withQueryTiming(
      "EventRepository:getUserEventAttendance",
      async () => {
        try {
          // Get event IDs the user is attending
          const attendance = await this.db
            .select({
              eventId: eventAttendees.eventId,
            })
            .from(eventAttendees)
            .where(eq(eventAttendees.userId, userId));

          if (attendance.length === 0) {
            return [];
          }

          // Get full event details
          return await this.getEvents({
            userId,
            upcoming: includeUpcoming,
          });
        } catch (error) {
          logger.error(
            "Failed to get user event attendance",
            toLoggableError(error),
            { userId, includeUpcoming },
          );
          throw new DatabaseError("Failed to get user event attendance", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get analytics event tracking data
   *
   * NOTE: The eventTracking table stores analytics events (page views, clicks, etc.)
   * not calendar event data. This function queries by eventName to find analytics
   * events of a specific type.
   *
   * @param eventName - Analytics event name/type to search for (e.g., 'page-view', 'button-click')
   * @returns Promise of event tracking records
   *
   * @example
   * ```typescript
   * const tracking = await eventRepo.getAnalyticsEventTracking('page-view');
   * ```
   */
  async getAnalyticsEventTracking(eventName: string): Promise<EventTracking[]> {
    return withQueryTiming(
      "EventRepository:getAnalyticsEventTracking",
      async () => {
        try {
          return await this.db
            .select()
            .from(eventTracking)
            .where(eq(eventTracking.eventName, eventName))
            .orderBy(desc(eventTracking.timestamp));
        } catch (error) {
          logger.error(
            "Failed to get analytics event tracking",
            toLoggableError(error),
            {
              eventName,
            },
          );
          throw new DatabaseError("Failed to get analytics event tracking", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * @deprecated Use getAnalyticsEventTracking instead for clarity
   * Get event tracking data by event name
   */
  async getEventTracking(eventId: string): Promise<EventTracking[]> {
    return this.getAnalyticsEventTracking(eventId);
  }

  /**
   * Create event tracking record
   *
   * @param data - Event tracking data
   * @returns Promise of created tracking record
   *
   * @example
   * ```typescript
   * const tracking = await eventRepo.createEventTracking({
   *   eventId: 'event-123',
   *   userId: 'user-456',
   *   action: 'view'
   * });
   * ```
   */
  async createEventTracking(data: InsertEventTracking): Promise<EventTracking> {
    return withQueryTiming("EventRepository:createEventTracking", async () => {
      try {
        const result = await this.db
          .insert(eventTracking)
          .values(data)
          .returning();
        if (!result[0]) {
          throw new DatabaseError(
            "Failed to create event tracking - no result returned",
          );
        }
        return result[0];
      } catch (error) {
        logger.error(
          "Failed to create event tracking",
          toLoggableError(error),
          { data },
        );
        throw new DatabaseError("Failed to create event tracking", {
          cause: error,
        });
      }
    });
  }

  /**
   * Get event with transaction (for atomic operations)
   *
   * @param id - Event ID
   * @param trx - Transaction object
   * @returns Promise of event or null
   */
  async getEventWithTransaction(
    id: string,
    trx: Transaction,
  ): Promise<Event | null> {
    try {
      const result = await trx
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error(
        "Failed to get event with transaction",
        toLoggableError(error),
        { id },
      );
      throw new DatabaseError("Failed to get event with transaction", {
        cause: error,
      });
    }
  }

  /**
   * Join event with transaction (for atomic operations)
   *
   * @param data - Attendee data
   * @param trx - Transaction object
   * @returns Promise of created attendee
   */
  async joinEventWithTransaction(
    data: InsertEventAttendee,
    trx: Transaction,
  ): Promise<EventAttendee> {
    try {
      const result = await trx.insert(eventAttendees).values(data).returning();
      if (!result[0]) {
        throw new DatabaseError("Failed to join event - no result returned");
      }
      return result[0];
    } catch (error) {
      logger.error(
        "Failed to join event with transaction",
        toLoggableError(error),
        { data },
      );
      throw new DatabaseError("Failed to join event with transaction", {
        cause: error,
      });
    }
  }
}
