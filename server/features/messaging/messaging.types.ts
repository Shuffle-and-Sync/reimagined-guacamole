export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface SortOptions {
  field?: string;
  direction?: 'asc' | 'desc';
}

export interface NotificationFilters {
  unreadOnly?: boolean;
  pagination?: PaginationOptions;
  sort?: SortOptions;
}

export interface NotificationData {
  eventId?: string;
  userId?: string;
  communityId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateNotificationRequest {
  type: 'event_join' | 'event_leave' | 'game_invite' | 'message' | 'system';
  title: string;
  message: string;
  data?: NotificationData;
}

export interface MessageFilters {
  eventId?: string;
  communityId?: string;
  conversationId?: string;
  unreadOnly?: boolean;
  pagination?: PaginationOptions;
  sort?: SortOptions;
}

export interface SendMessageRequest {
  content: string;
  recipientId?: string;
  eventId?: string;
  communityId?: string;
  type?: string;
}