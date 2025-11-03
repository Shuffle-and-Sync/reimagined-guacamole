import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { logger } from "../../logger";
import type {
  CalendarConnection,
  CalendarEventData,
  CalendarEventUpdate,
} from "./types";
import type { Event } from "@microsoft/microsoft-graph-types";

/**
 * Outlook Calendar Service
 * Handles all interactions with Microsoft Graph Calendar API
 */
export class OutlookCalendarService {
  private getClient(accessToken: string): Client {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Refresh access token using Microsoft Identity Platform
   */
  async refreshAccessToken(connection: CalendarConnection): Promise<string> {
    try {
      if (
        !process.env.AZURE_TENANT_ID ||
        !process.env.AZURE_CLIENT_ID ||
        !process.env.AZURE_CLIENT_SECRET
      ) {
        throw new Error(
          "Azure credentials not configured. Set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET environment variables.",
        );
      }

      const credential = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID,
        process.env.AZURE_CLIENT_ID,
        process.env.AZURE_CLIENT_SECRET,
      );

      const tokenResponse = await credential.getToken(
        "https://graph.microsoft.com/.default",
      );
      return tokenResponse.token;
    } catch (error) {
      logger.error(
        "Failed to refresh Outlook access token",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId: connection.id },
      );
      throw error;
    }
  }

  /**
   * List available calendars
   */
  async listCalendars(
    connection: CalendarConnection,
  ): Promise<{ id?: string; name?: string; primary?: boolean }[]> {
    try {
      const client = this.getClient(connection.accessToken);
      const response = await client.api("/me/calendars").get();
      return response.value || [];
    } catch (error) {
      logger.error(
        "Failed to list Outlook calendars",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId: connection.id },
      );
      throw error;
    }
  }

  /**
   * Fetch events from Outlook Calendar
   */
  async fetchEvents(
    connection: CalendarConnection,
    options: {
      calendarId?: string;
      startDateTime?: Date;
      endDateTime?: Date;
      top?: number;
    } = {},
  ): Promise<Event[]> {
    try {
      const client = this.getClient(connection.accessToken);
      const calendarPath = options.calendarId
        ? `/me/calendars/${options.calendarId}/events`
        : "/me/calendar/events";

      let request = client.api(calendarPath).top(options.top || 100);

      if (options.startDateTime) {
        request = request.filter(
          `start/dateTime ge '${options.startDateTime.toISOString()}'`,
        );
      }

      if (options.endDateTime) {
        request = request.filter(
          `end/dateTime le '${options.endDateTime.toISOString()}'`,
        );
      }

      const response = await request.get();
      return response.value || [];
    } catch (error) {
      logger.error(
        "Failed to fetch Outlook Calendar events",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId: connection.id },
      );
      throw error;
    }
  }

  /**
   * Create an event in Outlook Calendar
   */
  async createEvent(
    connection: CalendarConnection,
    event: CalendarEventData,
  ): Promise<Event> {
    try {
      const client = this.getClient(connection.accessToken);

      const outlookEvent: Event = {
        subject: event.title,
        body: {
          contentType: "text",
          content: event.description || "",
        },
        location: event.location ? { displayName: event.location } : undefined,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: event.timezone || "UTC",
        },
        end: {
          dateTime:
            event.endTime?.toISOString() ||
            new Date(event.startTime.getTime() + 3600000).toISOString(),
          timeZone: event.timezone || "UTC",
        },
      };

      const calendarPath = connection.calendarId
        ? `/me/calendars/${connection.calendarId}/events`
        : "/me/calendar/events";

      return await client.api(calendarPath).post(outlookEvent);
    } catch (error) {
      logger.error(
        "Failed to create Outlook Calendar event",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId: connection.id },
      );
      throw error;
    }
  }

  /**
   * Update an event in Outlook Calendar
   */
  async updateEvent(
    connection: CalendarConnection,
    eventId: string,
    updates: CalendarEventUpdate,
  ): Promise<Event> {
    try {
      const client = this.getClient(connection.accessToken);

      const outlookEvent: Partial<Event> = {};

      if (updates.title) outlookEvent.subject = updates.title;
      if (updates.description) {
        outlookEvent.body = {
          contentType: "text",
          content: updates.description,
        };
      }
      if (updates.location) {
        outlookEvent.location = { displayName: updates.location };
      }
      if (updates.startTime) {
        outlookEvent.start = {
          dateTime: updates.startTime.toISOString(),
          timeZone: updates.timezone || "UTC",
        };
      }
      if (updates.endTime) {
        outlookEvent.end = {
          dateTime: updates.endTime.toISOString(),
          timeZone: updates.timezone || "UTC",
        };
      }

      return await client.api(`/me/events/${eventId}`).patch(outlookEvent);
    } catch (error) {
      logger.error(
        "Failed to update Outlook Calendar event",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId: connection.id, eventId },
      );
      throw error;
    }
  }

  /**
   * Delete an event from Outlook Calendar
   */
  async deleteEvent(
    connection: CalendarConnection,
    eventId: string,
  ): Promise<void> {
    try {
      const client = this.getClient(connection.accessToken);
      await client.api(`/me/events/${eventId}`).delete();
    } catch (error) {
      logger.error(
        "Failed to delete Outlook Calendar event",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId: connection.id, eventId },
      );
      throw error;
    }
  }

  /**
   * Convert Outlook event to internal format
   */
  convertToInternalEvent(outlookEvent: Event) {
    if (!outlookEvent.id) {
      throw new Error("Outlook Calendar event missing required id field");
    }
    return {
      externalEventId: outlookEvent.id,
      title: outlookEvent.subject || "Untitled Event",
      description: outlookEvent.body?.content || null,
      location: outlookEvent.location?.displayName || null,
      startTime: new Date(outlookEvent.start?.dateTime || ""),
      endTime: outlookEvent.end?.dateTime
        ? new Date(outlookEvent.end.dateTime)
        : null,
      timezone: outlookEvent.start?.timeZone || "UTC",
      isAllDay: outlookEvent.isAllDay || false,
      status: "confirmed",
      rawData: JSON.stringify(outlookEvent),
    };
  }
}

export const outlookCalendarService = new OutlookCalendarService();
