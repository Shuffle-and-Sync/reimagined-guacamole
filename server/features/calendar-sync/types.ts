import type { CalendarConnection } from "@shared/schema";

export type { CalendarConnection };

export interface CalendarEventData {
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime?: Date;
  timezone?: string;
}

export interface CalendarEventUpdate {
  title?: string;
  description?: string;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  timezone?: string;
}

export interface SyncOptions {
  calendarId?: string;
  timeMin?: Date;
  timeMax?: Date;
  maxResults?: number;
}
