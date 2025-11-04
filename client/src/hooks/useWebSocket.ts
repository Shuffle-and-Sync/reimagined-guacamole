/**
 * Type-safe WebSocket hook with comprehensive message handling
 *
 * Provides a React hook for managing WebSocket connections with full type safety,
 * automatic reconnection, and message queuing.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  ServerToClientMessage,
  ClientToServerMessage,
  WebSocketState,
} from "@shared/types/websocket.types";

export interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: ServerToClientMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
    reconnectAttempts = 5,
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isReconnecting: false,
    error: null,
    lastMessage: null,
    subscribedEvents: new Set(),
    subscribedPods: new Set(),
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const messageQueueRef = useRef<ClientToServerMessage[]>([]);

  // Store callbacks in refs to avoid recreating connection when they change
  const onConnectRef = useRef(onConnect);
  const onMessageRef = useRef(onMessage);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        // WebSocket connected successfully
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isReconnecting: false,
          error: null,
        }));
        reconnectAttemptsRef.current = 0;
        onConnectRef.current?.();

        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          if (message && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerToClientMessage;
          setState((prev) => ({ ...prev, lastMessage: message }));
          onMessageRef.current?.(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        setState((prev) => ({ ...prev, error: new Error("WebSocket error") }));
        onErrorRef.current?.(event);
      };

      ws.onclose = () => {
        // WebSocket disconnected
        setState((prev) => ({
          ...prev,
          isConnected: false,
        }));
        onDisconnectRef.current?.();

        if (reconnect && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          setState((prev) => ({ ...prev, isReconnecting: true }));
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setState((prev) => ({
        ...prev,
        error: error as Error,
      }));
    }
    // Callbacks are now in refs and not included in dependencies
     
  }, [url, reconnect, reconnectInterval, reconnectAttempts]);

  const sendMessage = useCallback((message: ClientToServerMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected. Message queued:", message);
      messageQueueRef.current.push(message);
    }
  }, []);

  const subscribeToEvent = useCallback(
    (eventId: string) => {
      sendMessage({
        type: "subscribe_event",
        data: { eventId },
      });
      setState((prev) => ({
        ...prev,
        subscribedEvents: new Set(prev.subscribedEvents).add(eventId),
      }));
    },
    [sendMessage],
  );

  const unsubscribeFromEvent = useCallback(
    (eventId: string) => {
      sendMessage({
        type: "unsubscribe_event",
        data: { eventId },
      });
      setState((prev) => {
        const newSubscribed = new Set(prev.subscribedEvents);
        newSubscribed.delete(eventId);
        return { ...prev, subscribedEvents: newSubscribed };
      });
    },
    [sendMessage],
  );

  const joinPod = useCallback(
    (podId: string, userId: string) => {
      sendMessage({
        type: "join_pod",
        data: { podId, userId },
      });
      setState((prev) => ({
        ...prev,
        subscribedPods: new Set(prev.subscribedPods).add(podId),
      }));
    },
    [sendMessage],
  );

  const leavePod = useCallback(
    (podId: string, userId: string) => {
      sendMessage({
        type: "leave_pod",
        data: { podId, userId },
      });
      setState((prev) => {
        const newSubscribed = new Set(prev.subscribedPods);
        newSubscribed.delete(podId);
        return { ...prev, subscribedPods: newSubscribed };
      });
    },
    [sendMessage],
  );

  const sendChatMessage = useCallback(
    (podId: string, message: string) => {
      sendMessage({
        type: "send_chat",
        data: { podId, message },
      });
    },
    [sendMessage],
  );

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    state,
    sendMessage,
    subscribeToEvent,
    unsubscribeFromEvent,
    joinPod,
    leavePod,
    sendChatMessage,
    disconnect,
    reconnect: connect,
  };
}
