import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef, useCallback } from "react";
import type { Community } from "@shared/schema";
import {
  isEventCreatedMessage,
  isEventUpdatedMessage,
  isEventDeletedMessage,
  isPodStatusChangedMessage,
  type ServerToClientMessage,
} from "@shared/types/websocket.types";
import { useToast } from "@/hooks/use-toast";

type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

interface UseCalendarWebSocketOptions {
  isAuthenticated: boolean;
  selectedCommunity: Community | null;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * Custom hook for managing WebSocket connection for calendar real-time updates
 * Handles connection lifecycle, reconnection logic, and event handling
 * Now uses typed WebSocket messages with type guards for type safety
 */
export function useCalendarWebSocket({
  isAuthenticated,
  selectedCommunity,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}: UseCalendarWebSocketOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const handleMessage = useCallback(
    (message: ServerToClientMessage) => {
      // Use type guards for type-safe message handling
      if (isEventCreatedMessage(message)) {
        // Invalidate queries to refetch events
        queryClient.invalidateQueries({ queryKey: ["/api/events"] });

        toast({
          title: "New Event Created",
          description: message.data.title || "Calendar updated with new event",
        });
      } else if (isEventUpdatedMessage(message)) {
        queryClient.invalidateQueries({ queryKey: ["/api/events"] });

        toast({
          title: "Event Updated",
          description: "Event information has changed",
        });
      } else if (isEventDeletedMessage(message)) {
        queryClient.invalidateQueries({ queryKey: ["/api/events"] });

        toast({
          title: "Event Deleted",
          description: "An event has been removed",
        });
      } else if (isPodStatusChangedMessage(message)) {
        queryClient.invalidateQueries({ queryKey: ["/api/events"] });

        toast({
          title: "Pod Status Updated",
          description: "A game pod status has changed",
        });
      }
    },
    [queryClient, toast],
  );

  // Use useEffect with proper cleanup instead of useCallback to avoid circular dependency
  useEffect(() => {
    if (!isAuthenticated || !selectedCommunity) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const ws = new WebSocket(`${protocol}//${window.location.host}`);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnectionStatus("connected");
          reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as ServerToClientMessage;
            handleMessage(message);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setConnectionStatus("disconnected");
        };

        ws.onclose = () => {
          setConnectionStatus("disconnected");

          // Attempt reconnection if under max attempts
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current += 1;
            setConnectionStatus("reconnecting");

            reconnectTimeoutRef.current = setTimeout(() => {
              // Reconnect if not already connected
              if (wsRef.current?.readyState !== WebSocket.OPEN) {
                connectWebSocket();
              }
            }, reconnectInterval);
          }
        };
      } catch (error) {
        console.error("Error creating WebSocket connection:", error);
        setConnectionStatus("disconnected");
      }
    };

    // Initial connection
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
      setConnectionStatus("disconnected");
      reconnectAttemptsRef.current = 0;
    };
  }, [
    isAuthenticated,
    selectedCommunity,
    handleMessage,
    reconnectInterval,
    maxReconnectAttempts,
  ]);

  const reconnect = useCallback(() => {
    // Close existing connection
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    // Reset reconnect attempts
    reconnectAttemptsRef.current = 0;
    // Effect will handle reconnection
  }, []);

  return {
    connectionStatus,
    reconnect,
  };
}
