import { logger } from "../../logger";
import { storage } from "../../storage";
import { googleCalendarService } from "./google-calendar.service";
import { outlookCalendarService } from "./outlook-calendar.service";
import type { CalendarConnection } from "./types";

// Constants
const TOKEN_EXPIRY_SECONDS = 3600; // 1 hour

/**
 * Calendar Sync Service
 * Orchestrates bidirectional sync between Shuffle & Sync and external calendars
 */
export class CalendarSyncService {
  /**
   * Sync events from external calendar to Shuffle & Sync
   */
  async importEvents(connectionId: string): Promise<number> {
    try {
      const connection = await storage.getCalendarConnection(connectionId);

      if (!connection || !connection.syncEnabled) {
        throw new Error("Connection not found or sync disabled");
      }

      // Check if token needs refresh
      if (connection.expiresAt && Date.now() / 1000 > connection.expiresAt) {
        await this.refreshConnectionToken(connection);
        // Re-fetch connection with updated token
        const updatedConnection =
          await storage.getCalendarConnection(connectionId);
        if (!updatedConnection) {
          throw new Error("Failed to refresh connection");
        }
        return await this.importEventsInternal(updatedConnection);
      }

      return await this.importEventsInternal(connection);
    } catch (error) {
      logger.error(
        "Failed to import events",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId },
      );
      throw error;
    }
  }

  private async importEventsInternal(
    connection: CalendarConnection,
  ): Promise<number> {
    let externalEvents: Array<{
      externalEventId: string;
      title: string;
      description: string | null;
      location: string | null;
      startTime: Date;
      endTime: Date | null;
      timezone: string;
      isAllDay: boolean;
      status: string;
      rawData: string;
    }> = [];

    if (connection.provider === "google") {
      const events = await googleCalendarService.fetchEvents(connection, {
        timeMin: new Date(),
        maxResults: 2500,
      });
      externalEvents = events.map((e) =>
        googleCalendarService.convertToInternalEvent(e),
      );
    } else if (connection.provider === "outlook") {
      const events = await outlookCalendarService.fetchEvents(connection, {
        startDateTime: new Date(),
      });
      externalEvents = events.map((e) =>
        outlookCalendarService.convertToInternalEvent(e),
      );
    } else {
      throw new Error(`Unsupported provider: ${connection.provider}`);
    }

    // Store external events
    let importedCount = 0;
    for (const event of externalEvents) {
      await storage.upsertExternalEvent({
        ...event,
        connectionId: connection.id,
        lastSyncedAt: new Date(),
      });
      importedCount++;
    }

    // Update last sync time
    await storage.updateCalendarConnection(connection.id, {
      lastSyncAt: Math.floor(Date.now() / 1000),
    });

    logger.info("Successfully imported events", {
      connectionId: connection.id,
      count: importedCount,
    });
    return importedCount;
  }

  /**
   * Export Shuffle & Sync event to external calendar
   */
  async exportEvent(eventId: string, connectionId: string): Promise<string> {
    try {
      const connection = await storage.getCalendarConnection(connectionId);
      const event = await storage.getEvent(eventId);

      if (!connection) {
        throw new Error("Connection not found");
      }

      if (!event) {
        throw new Error("Event not found");
      }

      // Check if token needs refresh
      if (connection.expiresAt && Date.now() / 1000 > connection.expiresAt) {
        await this.refreshConnectionToken(connection);
        // Re-fetch connection with updated token
        const updatedConnection =
          await storage.getCalendarConnection(connectionId);
        if (!updatedConnection) {
          throw new Error("Failed to refresh connection");
        }
        return await this.exportEventInternal(event, updatedConnection);
      }

      return await this.exportEventInternal(event, connection);
    } catch (error) {
      logger.error(
        "Failed to export event",
        error instanceof Error ? error : new Error(String(error)),
        { eventId, connectionId },
      );
      throw error;
    }
  }

  private async exportEventInternal(
    event: {
      id: string;
      title: string;
      description: string | null;
      location: string | null;
      startTime: Date;
      endTime: Date | null;
      timezone: string;
    },
    connection: CalendarConnection,
  ): Promise<string> {
    let externalEventId: string;

    const eventData = {
      title: event.title,
      description: event.description || undefined,
      location: event.location || undefined,
      startTime: new Date(event.startTime),
      endTime: event.endTime ? new Date(event.endTime) : undefined,
      timezone: event.timezone || "UTC",
    };

    if (connection.provider === "google") {
      const googleEvent = await googleCalendarService.createEvent(
        connection,
        eventData,
      );
      if (!googleEvent.id) {
        throw new Error("Google Calendar event created without ID");
      }
      externalEventId = googleEvent.id;
    } else if (connection.provider === "outlook") {
      const outlookEvent = await outlookCalendarService.createEvent(
        connection,
        eventData,
      );
      if (!outlookEvent.id) {
        throw new Error("Outlook Calendar event created without ID");
      }
      externalEventId = outlookEvent.id;
    } else {
      throw new Error("Unsupported provider");
    }

    // Link external event to internal event
    await storage.createExternalEvent({
      connectionId: connection.id,
      externalEventId,
      internalEventId: event.id,
      title: eventData.title,
      description: eventData.description || null,
      location: eventData.location || null,
      startTime: eventData.startTime,
      endTime: eventData.endTime || null,
      timezone: eventData.timezone,
      isAllDay: false,
      status: "confirmed",
      rawData: JSON.stringify({}),
      lastSyncedAt: new Date(),
    });

    logger.info("Successfully exported event", {
      eventId: event.id,
      connectionId: connection.id,
      externalEventId,
    });
    return externalEventId;
  }

  /**
   * Refresh access token for a connection
   */
  private async refreshConnectionToken(
    connection: CalendarConnection,
  ): Promise<void> {
    try {
      let newAccessToken: string;

      if (connection.provider === "google") {
        newAccessToken =
          await googleCalendarService.refreshAccessToken(connection);
      } else if (connection.provider === "outlook") {
        newAccessToken =
          await outlookCalendarService.refreshAccessToken(connection);
      } else {
        throw new Error("Unsupported provider");
      }

      await storage.updateCalendarConnection(connection.id, {
        accessToken: newAccessToken,
        expiresAt: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
      });

      logger.info("Successfully refreshed connection token", {
        connectionId: connection.id,
      });
    } catch (error) {
      logger.error(
        "Failed to refresh connection token",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId: connection.id },
      );
      throw error;
    }
  }

  /**
   * Periodic sync job - should be run via cron
   */
  async syncAllConnections(): Promise<void> {
    try {
      const connections = await storage.getAllActiveCalendarConnections();

      for (const connection of connections) {
        try {
          if (
            connection.syncDirection === "import" ||
            connection.syncDirection === "both"
          ) {
            await this.importEvents(connection.id);
          }
        } catch (error) {
          logger.error(
            "Failed to sync connection",
            error instanceof Error ? error : new Error(String(error)),
            { connectionId: connection.id },
          );
          // Continue with other connections
        }
      }
    } catch (error) {
      logger.error(
        "Failed to sync all connections",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}

export const calendarSyncService = new CalendarSyncService();
