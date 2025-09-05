export interface NotificationFilters {
  unreadOnly?: boolean;
  limit?: number;
}

export interface CreateNotificationRequest {
  type: string;
  title: string;
  message: string;
  data?: any;
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