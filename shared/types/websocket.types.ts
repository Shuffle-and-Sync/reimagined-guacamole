/**
 * Comprehensive WebSocket Message Type Definitions
 *
 * This file defines all WebSocket message types for the Shuffle & Sync platform,
 * including events, pods, chat, and system notifications.
 */

// ======================
// BASE MESSAGE STRUCTURE
// ======================

export interface BaseWebSocketMessage {
  type: string;
  timestamp: string;
  id?: string; // Optional message ID for tracking and deduplication
}

// ======================
// EVENT-RELATED MESSAGES (Server to Client)
// ======================

export interface EventCreatedMessage extends BaseWebSocketMessage {
  type: "event:created";
  data: {
    eventId: string;
    title: string;
    startTime: string;
    endTime?: string;
    createdBy: {
      id: string;
      username: string;
    };
  };
}

export interface EventUpdatedMessage extends BaseWebSocketMessage {
  type: "event:updated";
  data: {
    eventId: string;
    changes: {
      title?: string;
      startTime?: string;
      endTime?: string;
      status?: string;
      [key: string]: unknown;
    };
    updatedBy: string;
  };
}

export interface EventDeletedMessage extends BaseWebSocketMessage {
  type: "event:deleted";
  data: {
    eventId: string;
    deletedBy: string;
  };
}

// ======================
// POD-RELATED MESSAGES (Server to Client)
// ======================

export interface PlayerJoinedPodMessage extends BaseWebSocketMessage {
  type: "pod:player_joined";
  data: {
    podId: string;
    player: {
      userId: string;
      username: string;
      status: "ready" | "registered" | "waiting";
    };
    currentPlayerCount: number;
    maxPlayers: number;
  };
}

export interface PlayerLeftPodMessage extends BaseWebSocketMessage {
  type: "pod:player_left";
  data: {
    podId: string;
    playerId: string;
    currentPlayerCount: number;
  };
}

export interface PodFullMessage extends BaseWebSocketMessage {
  type: "pod:full";
  data: {
    podId: string;
    title: string;
    players: Array<{
      userId: string;
      username: string;
    }>;
  };
}

export interface PodStatusChangedMessage extends BaseWebSocketMessage {
  type: "pod:status_changed";
  data: {
    podId: string;
    oldStatus: string;
    newStatus: "waiting" | "active" | "finished" | "cancelled";
  };
}

// ======================
// CHAT MESSAGES (Server to Client)
// ======================

export interface ChatMessageReceived extends BaseWebSocketMessage {
  type: "chat:message";
  data: {
    podId: string;
    messageId: string;
    userId: string;
    username: string;
    message: string;
    timestamp: string;
  };
}

// ======================
// SYSTEM MESSAGES (Server to Client)
// ======================

export interface SystemNotificationMessage extends BaseWebSocketMessage {
  type: "system:notification";
  data: {
    severity: "info" | "warning" | "error" | "success";
    title: string;
    message: string;
    action?: {
      label: string;
      url: string;
    };
  };
}

export interface ConnectionStatusMessage extends BaseWebSocketMessage {
  type: "system:connection_status";
  data: {
    status: "connected" | "disconnected" | "reconnecting";
    serverId?: string;
  };
}

// ======================
// UNION TYPE OF ALL SERVER-TO-CLIENT MESSAGES
// ======================

export type ServerToClientMessage =
  | EventCreatedMessage
  | EventUpdatedMessage
  | EventDeletedMessage
  | PlayerJoinedPodMessage
  | PlayerLeftPodMessage
  | PodFullMessage
  | PodStatusChangedMessage
  | ChatMessageReceived
  | SystemNotificationMessage
  | ConnectionStatusMessage;

// ======================
// CLIENT-TO-SERVER MESSAGE TYPES
// ======================

export interface JoinPodRequest {
  type: "join_pod";
  data: {
    podId: string;
    userId: string;
  };
}

export interface LeavePodRequest {
  type: "leave_pod";
  data: {
    podId: string;
    userId: string;
  };
}

export interface SendChatMessageRequest {
  type: "send_chat";
  data: {
    podId: string;
    message: string;
  };
}

export interface SubscribeToEventRequest {
  type: "subscribe_event";
  data: {
    eventId: string;
  };
}

export interface UnsubscribeFromEventRequest {
  type: "unsubscribe_event";
  data: {
    eventId: string;
  };
}

export type ClientToServerMessage =
  | JoinPodRequest
  | LeavePodRequest
  | SendChatMessageRequest
  | SubscribeToEventRequest
  | UnsubscribeFromEventRequest;

// ======================
// WEBSOCKET CONNECTION STATE
// ======================

export interface WebSocketState {
  isConnected: boolean;
  isReconnecting: boolean;
  error: Error | null;
  lastMessage: ServerToClientMessage | null;
  subscribedEvents: Set<string>;
  subscribedPods: Set<string>;
}

// ======================
// TYPE GUARDS FOR RUNTIME TYPE CHECKING
// ======================

/**
 * Type guard to check if an unknown value is a WebSocket message
 */
export function isWebSocketMessage(
  message: unknown,
): message is ServerToClientMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    "timestamp" in message
  );
}

/**
 * Type guard for EventCreatedMessage
 */
export function isEventCreatedMessage(
  msg: ServerToClientMessage,
): msg is EventCreatedMessage {
  return msg.type === "event:created";
}

/**
 * Type guard for EventUpdatedMessage
 */
export function isEventUpdatedMessage(
  msg: ServerToClientMessage,
): msg is EventUpdatedMessage {
  return msg.type === "event:updated";
}

/**
 * Type guard for EventDeletedMessage
 */
export function isEventDeletedMessage(
  msg: ServerToClientMessage,
): msg is EventDeletedMessage {
  return msg.type === "event:deleted";
}

/**
 * Type guard for PlayerJoinedPodMessage
 */
export function isPlayerJoinedPodMessage(
  msg: ServerToClientMessage,
): msg is PlayerJoinedPodMessage {
  return msg.type === "pod:player_joined";
}

/**
 * Type guard for PlayerLeftPodMessage
 */
export function isPlayerLeftPodMessage(
  msg: ServerToClientMessage,
): msg is PlayerLeftPodMessage {
  return msg.type === "pod:player_left";
}

/**
 * Type guard for PodFullMessage
 */
export function isPodFullMessage(
  msg: ServerToClientMessage,
): msg is PodFullMessage {
  return msg.type === "pod:full";
}

/**
 * Type guard for PodStatusChangedMessage
 */
export function isPodStatusChangedMessage(
  msg: ServerToClientMessage,
): msg is PodStatusChangedMessage {
  return msg.type === "pod:status_changed";
}

/**
 * Type guard for ChatMessageReceived
 */
export function isChatMessageReceived(
  msg: ServerToClientMessage,
): msg is ChatMessageReceived {
  return msg.type === "chat:message";
}

/**
 * Type guard for SystemNotificationMessage
 */
export function isSystemNotificationMessage(
  msg: ServerToClientMessage,
): msg is SystemNotificationMessage {
  return msg.type === "system:notification";
}

/**
 * Type guard for ConnectionStatusMessage
 */
export function isConnectionStatusMessage(
  msg: ServerToClientMessage,
): msg is ConnectionStatusMessage {
  return msg.type === "system:connection_status";
}
