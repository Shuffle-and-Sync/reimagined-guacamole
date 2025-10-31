import type { Event } from "@shared/schema";
import { logger } from "../../logger";
import { storage } from "../../storage";

/**
 * Represents the type of conflict detected
 */
export type ConflictType = "creator" | "attendee" | "time_overlap";

/**
 * Represents a single conflicting event with details
 */
export interface ConflictingEvent {
  eventId: string;
  title: string;
  startTime: Date;
  endTime: Date | null;
  conflictType: ConflictType;
}

/**
 * Result of a conflict check operation
 */
export interface ConflictCheck {
  hasConflict: boolean;
  conflictingEvents: ConflictingEvent[];
  message?: string;
}

/**
 * Parameters for checking event conflicts
 */
export interface CheckConflictParams {
  startTime: Date;
  endTime: Date | null;
  creatorId: string;
  attendeeIds?: string[];
  excludeEventId?: string; // For update operations, exclude the event being updated
}

/**
 * Service for detecting and managing event scheduling conflicts
 */
export class ConflictDetectionService {
  /**
   * Check if two time ranges overlap
   */
  private timeRangesOverlap(
    start1: Date,
    end1: Date | null,
    start2: Date,
    end2: Date | null,
  ): boolean {
    // If either event has no end time, assume a default duration of 2 hours
    const effectiveEnd1 =
      end1 || new Date(start1.getTime() + 2 * 60 * 60 * 1000);
    const effectiveEnd2 =
      end2 || new Date(start2.getTime() + 2 * 60 * 60 * 1000);

    // Two ranges overlap if: start1 < end2 AND start2 < end1
    return start1 < effectiveEnd2 && start2 < effectiveEnd1;
  }

  /**
   * Check for conflicts when creating or updating an event
   */
  async checkEventConflicts(
    params: CheckConflictParams,
  ): Promise<ConflictCheck> {
    try {
      const {
        startTime,
        endTime,
        creatorId,
        attendeeIds = [],
        excludeEventId,
      } = params;

      const conflictingEvents: ConflictingEvent[] = [];

      // Check creator conflicts - creator can't have overlapping events
      const creatorEvents = await storage.getUserCreatedEvents(creatorId);

      for (const event of creatorEvents) {
        // Skip the event being updated
        if (excludeEventId && event.id === excludeEventId) {
          continue;
        }

        if (
          this.timeRangesOverlap(
            startTime,
            endTime,
            event.startTime,
            event.endTime,
          )
        ) {
          conflictingEvents.push({
            eventId: event.id,
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
            conflictType: "creator",
          });
        }
      }

      // Check attendee conflicts - attendees can't attend overlapping events
      for (const attendeeId of attendeeIds) {
        const attendeeEvents = await storage.getUserEventAttendance(attendeeId);

        for (const attendance of attendeeEvents) {
          const event = attendance.event;

          // Skip the event being updated
          if (excludeEventId && event.id === excludeEventId) {
            continue;
          }

          // Only consider events where user is attending
          if (attendance.status === "attending") {
            if (
              this.timeRangesOverlap(
                startTime,
                endTime,
                event.startTime,
                event.endTime,
              )
            ) {
              conflictingEvents.push({
                eventId: event.id,
                title: event.title,
                startTime: event.startTime,
                endTime: event.endTime,
                conflictType: "attendee",
              });
            }
          }
        }
      }

      const hasConflict = conflictingEvents.length > 0;

      return {
        hasConflict,
        conflictingEvents,
        message: hasConflict
          ? `Found ${conflictingEvents.length} conflicting event(s)`
          : "No conflicts detected",
      };
    } catch (error) {
      logger.error(
        "Failed to check event conflicts",
        error instanceof Error ? error : new Error(String(error)),
        {
          startTime: params.startTime.toISOString(),
          endTime: params.endTime?.toISOString(),
          creatorId: params.creatorId,
        },
      );
      throw error;
    }
  }

  /**
   * Check if a user is available during a specific time range
   */
  async checkUserAvailability(
    userId: string,
    startTime: Date,
    endTime: Date | null,
  ): Promise<boolean> {
    try {
      const conflicts = await this.checkEventConflicts({
        startTime,
        endTime,
        creatorId: userId,
        attendeeIds: [userId],
      });

      return !conflicts.hasConflict;
    } catch (error) {
      logger.error(
        "Failed to check user availability",
        error instanceof Error ? error : new Error(String(error)),
        { userId, startTime, endTime },
      );
      throw error;
    }
  }
}

export const conflictDetectionService = new ConflictDetectionService();
