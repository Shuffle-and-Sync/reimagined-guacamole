export interface NotificationFilters {
  unreadOnly?: boolean;
  limit?: number;
}

export interface NotificationData {
  eventId?: string;
  userId?: string;
  communityId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateNotificationRequest {
  type: string;
  title: string;
  message: string;
  data?: NotificationData;
}

export interface MessageFilters {
  eventId?: string;
  communityId?: string;
  limit?: number;
}

export interface SendMessageRequest {
  content: string;
  recipientId?: string;
  eventId?: string;
  communityId?: string;
  type?: string;
}