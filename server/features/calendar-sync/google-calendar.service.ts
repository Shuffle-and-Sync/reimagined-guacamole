import { OAuth2Client } from "google-auth-library";
import { google, calendar_v3 } from "googleapis";
import { logger } from "@/logger";
import type {
  CalendarConnection,
  CalendarEventData,
  CalendarEventUpdate,
} from "./types";

// Constants
const DEFAULT_MAX_RESULTS = 2500;
const DEFAULT_EVENT_DURATION_MS = 3600000; // 1 hour

/**
 * Google Calendar Service
 * Handles all interactions with Google Calendar API
 */
export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:3000/api/auth/callback/google",
    );
  }

  /**
   * Set credentials for a user's connection
   */
  private setCredentials(connection: CalendarConnection): void {
    this.oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken || undefined,
      expiry_date: connection.expiresAt
        ? connection.expiresAt * 1000
        : undefined,
    });
  }

  /**
   * Refresh access token if expired
   */
  async refreshAccessToken(connection: CalendarConnection): Promise<string> {
    try {
      this.setCredentials(connection);
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error("Failed to refresh access token");
      }

      return credentials.access_token;
    } catch (error) {
      logger.error(
        "Failed to refresh Google access token",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId: connection.id },
      );
      throw error;
    }
  }

  /**
   * List available calendars for the user
   */
  async listCalendars(
    connection: CalendarConnection,
  ): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    try {
      this.setCredentials(connection);
      const calendar = google.calendar({
        version: "v3",
        auth: this.oauth2Client,
      });

      const response = await calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      logger.error(
        "Failed to list Google calendars",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId: connection.id },
      );
      throw error;
    }
  }

  /**
   * Fetch events from Google Calendar
   */
  async fetchEvents(
    connection: CalendarConnection,
    options: {
      calendarId?: string;
      timeMin?: Date;
      timeMax?: Date;
      maxResults?: number;
    } = {},
  ): Promise<calendar_v3.Schema$Event[]> {
    try {
      this.setCredentials(connection);
      const calendar = google.calendar({
        version: "v3",
        auth: this.oauth2Client,
      });

      const response = await calendar.events.list({
        calendarId: options.calendarId || connection.calendarId || "primary",
        timeMin: options.timeMin?.toISOString(),
        timeMax: options.timeMax?.toISOString(),
        maxResults: options.maxResults || DEFAULT_MAX_RESULTS,
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items || [];
    } catch (error) {
      logger.error(
        "Failed to fetch Google Calendar events",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId: connection.id },
      );
      throw error;
    }
  }

  /**
   * Create an event in Google Calendar
   */
  async createEvent(
    connection: CalendarConnection,
    event: CalendarEventData,
  ): Promise<calendar_v3.Schema$Event> {
    try {
      this.setCredentials(connection);
      const calendar = google.calendar({
        version: "v3",
        auth: this.oauth2Client,
      });

      const googleEvent: calendar_v3.Schema$Event = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: event.timezone || "UTC",
        },
        end: {
          dateTime:
            event.endTime?.toISOString() ||
            new Date(
              event.startTime.getTime() + DEFAULT_EVENT_DURATION_MS,
            ).toISOString(),
          timeZone: event.timezone || "UTC",
        },
      };

      const response = await calendar.events.insert({
        calendarId: connection.calendarId || "primary",
        requestBody: googleEvent,
      });

      return response.data;
    } catch (error) {
      logger.error(
        "Failed to create Google Calendar event",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId: connection.id },
      );
      throw error;
    }
  }

  /**
   * Update an event in Google Calendar
   */
  async updateEvent(
    connection: CalendarConnection,
    eventId: string,
    updates: CalendarEventUpdate,
  ): Promise<calendar_v3.Schema$Event> {
    try {
      this.setCredentials(connection);
      const calendar = google.calendar({
        version: "v3",
        auth: this.oauth2Client,
      });

      const googleEvent: calendar_v3.Schema$Event = {};

      // Only include defined fields in the update
      if (updates.title !== undefined) {
        googleEvent.summary = updates.title;
      }
      if (updates.description !== undefined) {
        googleEvent.description = updates.description;
      }
      if (updates.location !== undefined) {
        googleEvent.location = updates.location;
      }

      if (updates.startTime !== undefined) {
        googleEvent.start = {
          dateTime: updates.startTime.toISOString(),
          timeZone: updates.timezone || "UTC",
        };
      }

      if (updates.endTime !== undefined) {
        googleEvent.end = {
          dateTime: updates.endTime.toISOString(),
          timeZone: updates.timezone || "UTC",
        };
      }

      const response = await calendar.events.patch({
        calendarId: connection.calendarId || "primary",
        eventId,
        requestBody: googleEvent,
      });

      return response.data;
    } catch (error) {
      logger.error(
        "Failed to update Google Calendar event",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId: connection.id, eventId },
      );
      throw error;
    }
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(
    connection: CalendarConnection,
    eventId: string,
  ): Promise<void> {
    try {
      this.setCredentials(connection);
      const calendar = google.calendar({
        version: "v3",
        auth: this.oauth2Client,
      });

      await calendar.events.delete({
        calendarId: connection.calendarId || "primary",
        eventId,
      });
    } catch (error) {
      logger.error(
        "Failed to delete Google Calendar event",
        error instanceof Error ? error : new Error(String(error)),
        { connectionId: connection.id, eventId },
      );
      throw error;
    }
  }

  /**
   * Convert Google Calendar event to internal format
   */
  convertToInternalEvent(googleEvent: calendar_v3.Schema$Event) {
    return {
      externalEventId: googleEvent.id!,
      title: googleEvent.summary || "Untitled Event",
      description: googleEvent.description || null,
      location: googleEvent.location || null,
      startTime: new Date(
        googleEvent.start?.dateTime || googleEvent.start?.date || "",
      ),
      endTime:
        googleEvent.end?.dateTime || googleEvent.end?.date
          ? new Date(googleEvent.end.dateTime || googleEvent.end.date)
          : null,
      timezone: googleEvent.start?.timeZone || "UTC",
      isAllDay: !!googleEvent.start?.date,
      status: googleEvent.status || "confirmed",
      rawData: JSON.stringify(googleEvent),
    };
  }
}

export const googleCalendarService = new GoogleCalendarService();
