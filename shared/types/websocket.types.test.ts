/**
 * Tests for WebSocket message types and type guards
 */

import {
  isWebSocketMessage,
  isEventCreatedMessage,
  isEventUpdatedMessage,
  isEventDeletedMessage,
  isPlayerJoinedPodMessage,
  isPlayerLeftPodMessage,
  isPodFullMessage,
  isPodStatusChangedMessage,
  isChatMessageReceived,
  isSystemNotificationMessage,
  isConnectionStatusMessage,
  type EventCreatedMessage,
  type PlayerJoinedPodMessage,
  type PodStatusChangedMessage,
  type ChatMessageReceived,
} from "@shared/types/websocket.types";

describe("WebSocket Type Guards", () => {
  describe("isWebSocketMessage", () => {
    it("should return true for valid WebSocket messages", () => {
      const message = {
        type: "event:created",
        timestamp: "2025-01-03T12:00:00Z",
        data: {},
      };

      expect(isWebSocketMessage(message)).toBe(true);
    });

    it("should return false for invalid messages", () => {
      expect(isWebSocketMessage(null)).toBe(false);
      expect(isWebSocketMessage(undefined)).toBe(false);
      expect(isWebSocketMessage("string")).toBe(false);
      expect(isWebSocketMessage(123)).toBe(false);
      expect(isWebSocketMessage({})).toBe(false);
      expect(isWebSocketMessage({ type: "test" })).toBe(false);
      expect(isWebSocketMessage({ timestamp: "2025-01-03" })).toBe(false);
    });
  });

  describe("Event Message Type Guards", () => {
    it("should correctly identify event:created messages", () => {
      const message: EventCreatedMessage = {
        type: "event:created",
        timestamp: "2025-01-03T12:00:00Z",
        data: {
          eventId: "evt_123",
          title: "Test Event",
          startTime: "2025-01-10T19:00:00Z",
          createdBy: {
            id: "user_456",
            username: "testuser",
          },
        },
      };

      expect(isEventCreatedMessage(message)).toBe(true);
      expect(isEventUpdatedMessage(message)).toBe(false);
    });

    it("should correctly identify event:updated messages", () => {
      const message = {
        type: "event:updated",
        timestamp: "2025-01-03T12:00:00Z",
        data: {
          eventId: "evt_123",
          changes: { title: "Updated Title" },
          updatedBy: "user_456",
        },
      };

      expect(isEventUpdatedMessage(message)).toBe(true);
      expect(isEventCreatedMessage(message)).toBe(false);
    });

    it("should correctly identify event:deleted messages", () => {
      const message = {
        type: "event:deleted",
        timestamp: "2025-01-03T12:00:00Z",
        data: {
          eventId: "evt_123",
          deletedBy: "user_456",
        },
      };

      expect(isEventDeletedMessage(message)).toBe(true);
      expect(isEventCreatedMessage(message)).toBe(false);
    });
  });

  describe("Pod Message Type Guards", () => {
    it("should correctly identify pod:player_joined messages", () => {
      const message: PlayerJoinedPodMessage = {
        type: "pod:player_joined",
        timestamp: "2025-01-03T12:00:00Z",
        data: {
          podId: "pod_789",
          player: {
            userId: "user_456",
            username: "testuser",
            status: "ready",
          },
          currentPlayerCount: 3,
          maxPlayers: 4,
        },
      };

      expect(isPlayerJoinedPodMessage(message)).toBe(true);
      expect(isPlayerLeftPodMessage(message)).toBe(false);
    });

    it("should correctly identify pod:player_left messages", () => {
      const message = {
        type: "pod:player_left",
        timestamp: "2025-01-03T12:00:00Z",
        data: {
          podId: "pod_789",
          playerId: "user_456",
          currentPlayerCount: 2,
        },
      };

      expect(isPlayerLeftPodMessage(message)).toBe(true);
      expect(isPlayerJoinedPodMessage(message)).toBe(false);
    });

    it("should correctly identify pod:full messages", () => {
      const message = {
        type: "pod:full",
        timestamp: "2025-01-03T12:00:00Z",
        data: {
          podId: "pod_789",
          title: "Commander Pod #1",
          players: [
            { userId: "user_1", username: "player1" },
            { userId: "user_2", username: "player2" },
          ],
        },
      };

      expect(isPodFullMessage(message)).toBe(true);
      expect(isPodStatusChangedMessage(message)).toBe(false);
    });

    it("should correctly identify pod:status_changed messages", () => {
      const message: PodStatusChangedMessage = {
        type: "pod:status_changed",
        timestamp: "2025-01-03T12:00:00Z",
        data: {
          podId: "pod_789",
          oldStatus: "waiting",
          newStatus: "active",
        },
      };

      expect(isPodStatusChangedMessage(message)).toBe(true);
      expect(isPodFullMessage(message)).toBe(false);
    });
  });

  describe("Chat and System Message Type Guards", () => {
    it("should correctly identify chat:message messages", () => {
      const message: ChatMessageReceived = {
        type: "chat:message",
        timestamp: "2025-01-03T12:00:00Z",
        data: {
          podId: "pod_789",
          messageId: "msg_abc",
          userId: "user_456",
          username: "testuser",
          message: "Hello everyone!",
          timestamp: "2025-01-03T12:00:00Z",
        },
      };

      expect(isChatMessageReceived(message)).toBe(true);
      expect(isSystemNotificationMessage(message)).toBe(false);
    });

    it("should correctly identify system:notification messages", () => {
      const message = {
        type: "system:notification",
        timestamp: "2025-01-03T12:00:00Z",
        data: {
          severity: "info" as const,
          title: "System Update",
          message: "Maintenance in 1 hour",
        },
      };

      expect(isSystemNotificationMessage(message)).toBe(true);
      expect(isConnectionStatusMessage(message)).toBe(false);
    });

    it("should correctly identify system:connection_status messages", () => {
      const message = {
        type: "system:connection_status",
        timestamp: "2025-01-03T12:00:00Z",
        data: {
          status: "connected" as const,
          serverId: "server_1",
        },
      };

      expect(isConnectionStatusMessage(message)).toBe(true);
      expect(isSystemNotificationMessage(message)).toBe(false);
    });
  });

  describe("Type narrowing with type guards", () => {
    it("should narrow types correctly for event:created", () => {
      const message = {
        type: "event:created",
        timestamp: "2025-01-03T12:00:00Z",
        data: {
          eventId: "evt_123",
          title: "Test Event",
          startTime: "2025-01-10T19:00:00Z",
          createdBy: {
            id: "user_456",
            username: "testuser",
          },
        },
      } as const;

      if (isEventCreatedMessage(message)) {
        // TypeScript should know the exact structure
        expect(message.data.eventId).toBe("evt_123");
        expect(message.data.createdBy.username).toBe("testuser");
      }
    });

    it("should narrow types correctly for pod:player_joined", () => {
      const message = {
        type: "pod:player_joined",
        timestamp: "2025-01-03T12:00:00Z",
        data: {
          podId: "pod_789",
          player: {
            userId: "user_456",
            username: "testuser",
            status: "ready" as const,
          },
          currentPlayerCount: 3,
          maxPlayers: 4,
        },
      } as const;

      if (isPlayerJoinedPodMessage(message)) {
        // TypeScript should know the exact structure
        expect(message.data.player.status).toBe("ready");
        expect(message.data.currentPlayerCount).toBe(3);
      }
    });
  });
});
