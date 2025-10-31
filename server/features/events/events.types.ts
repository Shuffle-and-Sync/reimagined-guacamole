export interface EventFilters {
  userId?: string;
  communityId?: string;
  type?: string;
  upcoming?: boolean;
  cursor?: string;
  limit?: number;
}

export interface CalendarEventFilters {
  communityId?: string;
  startDate: string;
  endDate: string;
  type?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  type: string;
  date: string;
  time: string;
  endTime?: string; // Optional end time for the event
  timezone?: string; // IANA timezone (e.g., "America/New_York")
  displayTimezone?: string; // Optional override timezone for display
  location: string;
  communityId?: string;
  maxAttendees?: number;
  isPublic?: boolean;
  playerSlots?: number;
  alternateSlots?: number;
  gameFormat?: string;
  powerLevel?: number;
  isRecurring?: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  type?: string;
  date?: string;
  time?: string;
  timezone?: string; // IANA timezone
  displayTimezone?: string; // Optional override timezone for display
  location?: string;
  communityId?: string;
  maxAttendees?: number;
  isPublic?: boolean;
  playerSlots?: number;
  alternateSlots?: number;
  gameFormat?: string;
  powerLevel?: number;
  status?: string;
}

export interface JoinEventRequest {
  status?: string;
  role?: string;
  playerType?: string;
}

export interface BulkEventsRequest {
  events: CreateEventRequest[];
}

export interface RecurringEventRequest extends CreateEventRequest {
  recurrenceEndDate: string;
}

export interface CheckConflictsRequest {
  startTime: string;
  endTime?: string;
  creatorId: string;
  attendeeIds?: string[];
}

export interface CheckConflictsResponse {
  hasConflict: boolean;
  conflicts: Array<{
    eventId: string;
    title: string;
    startTime: string;
    endTime: string | null;
    conflictType: string;
  }>;
  message?: string;
}
