import { format } from "date-fns";
import { EventAttributes, createEvent, createEvents } from "ics";
import { logger } from "../../logger";

interface ShuffleEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime?: Date | null;
  timezone?: string | null;
  type: string;
  creatorId: string;
  communityId?: string | null;
}

export class ICSService {
  /**
   * Convert a Shuffle & Sync event to ICS EventAttributes format
   */
  private eventToICSAttributes(event: ShuffleEvent): EventAttributes {
    const start = new Date(event.startTime);
    const end = event.endTime
      ? new Date(event.endTime)
      : new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour if no end time

    // ICS format requires [year, month, day, hour, minute]
    const startArray: [number, number, number, number, number] = [
      start.getFullYear(),
      start.getMonth() + 1, // ICS months are 1-indexed
      start.getDate(),
      start.getHours(),
      start.getMinutes(),
    ];

    const endArray: [number, number, number, number, number] = [
      end.getFullYear(),
      end.getMonth() + 1,
      end.getDate(),
      end.getHours(),
      end.getMinutes(),
    ];

    const icsEvent: EventAttributes = {
      start: startArray,
      end: endArray,
      title: event.title,
      description: event.description || undefined,
      location: event.location || undefined,
      uid: `shuffle-sync-event-${event.id}@shuffleandsync.com`,
      productId: "shuffleandsync/calendar",
      status: "CONFIRMED",
      sequence: 0,
      startInputType: "local",
      startOutputType: "local",
      categories: [event.type],
      url: `https://shuffleandsync.com/events/${event.id}`,
    };

    return icsEvent;
  }

  /**
   * Generate ICS file content for a single event
   */
  async generateSingleEventICS(event: ShuffleEvent): Promise<{
    error?: Error;
    value?: string;
  }> {
    try {
      const icsAttributes = this.eventToICSAttributes(event);
      return createEvent(icsAttributes);
    } catch (error) {
      logger.error(
        "Failed to generate ICS for single event",
        error instanceof Error ? error : new Error(String(error)),
        { eventId: event.id },
      );
      throw error;
    }
  }

  /**
   * Generate ICS file content for multiple events
   */
  async generateMultipleEventsICS(events: ShuffleEvent[]): Promise<{
    error?: Error;
    value?: string;
  }> {
    try {
      const icsAttributesArray = events.map((event) =>
        this.eventToICSAttributes(event),
      );
      return createEvents(icsAttributesArray);
    } catch (error) {
      logger.error(
        "Failed to generate ICS for multiple events",
        error instanceof Error ? error : new Error(String(error)),
        { eventCount: events.length },
      );
      throw error;
    }
  }

  /**
   * Generate filename for ICS download
   */
  generateFilename(event?: ShuffleEvent): string {
    if (event) {
      const sanitizedTitle = event.title
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase();
      const date = format(new Date(event.startTime), "yyyy-MM-dd");
      return `${sanitizedTitle}-${date}.ics`;
    }
    return `shuffle-sync-events-${format(new Date(), "yyyy-MM-dd")}.ics`;
  }
}

export const icsService = new ICSService();
