export interface EventFilters {
  userId?: string;
  communityId?: string;
  type?: string;
  upcoming?: boolean;
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
