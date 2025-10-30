/**
 * WebSocket Message Batching Integration Tests
 *
 * Tests the integration of message batcher with the WebSocket connection manager
 */

import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { WebSocket } from "ws";
import {
  WebSocketConnectionManager,
  ExtendedWebSocket,
} from "../../utils/websocket-connection-manager";

// Mock the logger
jest.mock("../../logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("WebSocket Message Batching Integration", () => {
  let manager: WebSocketConnectionManager;

  beforeEach(() => {
    manager = new WebSocketConnectionManager();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("Message Batching Behavior", () => {
    test("should batch multiple normal priority messages", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      await manager.joinGameRoom(connectionId, "session-456");

      // Send 3 messages (below batch size limit)
      manager.broadcastToGameRoom("session-456", {
        type: "message",
        sessionId: "session-456",
        user: { id: "user-123", name: "User" },
        content: "Message 1",
      });
      manager.broadcastToGameRoom("session-456", {
        type: "message",
        sessionId: "session-456",
        user: { id: "user-123", name: "User" },
        content: "Message 2",
      });
      manager.broadcastToGameRoom("session-456", {
        type: "message",
        sessionId: "session-456",
        user: { id: "user-123", name: "User" },
        content: "Message 3",
      });

      // Messages should not be sent yet
      expect(mockWs.send).not.toHaveBeenCalled();

      // Advance time by 50ms (default batch delay)
      jest.advanceTimersByTime(50);

      // Now batch should be flushed
      expect(mockWs.send).toHaveBeenCalledTimes(1);

      // Check that it's a batched message
      const sentData = JSON.parse(
        (mockWs.send as jest.Mock).mock.calls[0][0] as string,
      );
      expect(sentData.type).toBe("batch");
      expect(sentData.messages).toHaveLength(3);
    });

    test("should flush batch when size limit reached", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      await manager.joinGameRoom(connectionId, "session-456");

      // Send 10 messages (exactly at batch size limit)
      for (let i = 0; i < 10; i++) {
        manager.broadcastToGameRoom("session-456", {
          type: "message",
          sessionId: "session-456",
          user: { id: "user-123", name: "User" },
          content: `Message ${i + 1}`,
        });
      }

      // Batch should be flushed immediately due to size
      expect(mockWs.send).toHaveBeenCalledTimes(1);

      const sentData = JSON.parse(
        (mockWs.send as jest.Mock).mock.calls[0][0] as string,
      );
      expect(sentData.type).toBe("batch");
      expect(sentData.messages).toHaveLength(10);
    });

    test("should send high priority messages with shorter delay", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      await manager.joinGameRoom(connectionId, "session-456");

      // Send a high priority message (game_action) - should have shorter delay
      manager.broadcastToGameRoom("session-456", {
        type: "game_action",
        sessionId: "session-456",
        action: "draw",
        user: { id: "user-123", name: "User" },
        data: {},
      });

      // High priority message should not be sent yet (still batched, just with shorter delay)
      expect(mockWs.send).not.toHaveBeenCalled();

      // Advance time by 25ms (high priority delay)
      jest.advanceTimersByTime(25);

      // Now message should be sent
      expect(mockWs.send).toHaveBeenCalledTimes(1);

      const sentData = JSON.parse(
        (mockWs.send as jest.Mock).mock.calls[0][0] as string,
      );
      // Single high-priority message sent directly (not as batch)
      expect(sentData.type).toBe("game_action");
    });

    test("should handle mixed priority messages correctly", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      await manager.joinGameRoom(connectionId, "session-456");

      // Send high priority message first - has shorter delay
      manager.broadcastToGameRoom("session-456", {
        type: "game_action",
        sessionId: "session-456",
        action: "play_card",
        user: { id: "user-123", name: "User" },
        data: {},
      });

      expect(mockWs.send).not.toHaveBeenCalled();

      // Send normal message after
      manager.broadcastToGameRoom("session-456", {
        type: "message",
        sessionId: "session-456",
        user: { id: "user-123", name: "User" },
        content: "Normal message",
      });

      // Both messages batched but with shorter delay from high priority
      expect(mockWs.send).not.toHaveBeenCalled();

      // Advance time by 25ms (high priority delay)
      jest.advanceTimersByTime(25);

      // Both should be flushed together
      expect(mockWs.send).toHaveBeenCalledTimes(1);

      // Verify it's a batch with both messages
      const firstCall = JSON.parse(
        (mockWs.send as jest.Mock).mock.calls[0][0] as string,
      );
      expect(firstCall.type).toBe("batch");
      expect(firstCall.messages).toHaveLength(2);
    });

    test("should send single message without batching overhead", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      await manager.joinGameRoom(connectionId, "session-456");

      // Send a single message
      manager.broadcastToGameRoom("session-456", {
        type: "message",
        sessionId: "session-456",
        user: { id: "user-123", name: "User" },
        content: "Single message",
      });

      // Advance time to flush
      jest.advanceTimersByTime(50);

      // Should be sent as a single message, not batched
      expect(mockWs.send).toHaveBeenCalledTimes(1);

      const sentData = JSON.parse(
        (mockWs.send as jest.Mock).mock.calls[0][0] as string,
      );
      expect(sentData.type).toBe("message");
      expect(sentData.content).toBe("Single message");
    });
  });

  describe("Batching Metrics", () => {
    test("should track batching metrics", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      await manager.joinGameRoom(connectionId, "session-456");

      // Send multiple batches
      for (let batch = 0; batch < 3; batch++) {
        for (let i = 0; i < 5; i++) {
          manager.broadcastToGameRoom("session-456", {
            type: "message",
            sessionId: "session-456",
            user: { id: "user-123", name: "User" },
            content: `Batch ${batch} Message ${i}`,
          });
        }
        jest.advanceTimersByTime(50);
      }

      const metrics = manager.getBatchingMetrics();
      expect(metrics.totalBatches).toBe(3);
      expect(metrics.totalMessages).toBe(15);
      expect(metrics.averageBatchSize).toBe(5);
      expect(metrics.flushReasons.time).toBe(3);
    });

    test("should track size-based flushes", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      await manager.joinGameRoom(connectionId, "session-456");

      // Send 10 messages to trigger size-based flush
      for (let i = 0; i < 10; i++) {
        manager.broadcastToGameRoom("session-456", {
          type: "message",
          sessionId: "session-456",
          user: { id: "user-123", name: "User" },
          content: `Message ${i}`,
        });
      }

      const metrics = manager.getBatchingMetrics();
      expect(metrics.totalBatches).toBe(1);
      expect(metrics.totalMessages).toBe(10);
      expect(metrics.flushReasons.size).toBe(1);
    });

    test("should track high-priority message flushes", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      await manager.joinGameRoom(connectionId, "session-456");

      // Send high priority messages that will flush with shorter delay
      for (let i = 0; i < 5; i++) {
        manager.broadcastToGameRoom("session-456", {
          type: "game_action",
          sessionId: "session-456",
          action: `action${i}`,
          user: { id: "user-123", name: "User" },
          data: {},
        });
      }

      // Advance time by 25ms to flush high-priority messages
      jest.advanceTimersByTime(25);

      const metrics = manager.getBatchingMetrics();
      expect(metrics.totalBatches).toBe(1);
      expect(metrics.totalMessages).toBe(5);
      expect(metrics.flushReasons.time).toBe(1);
    });
  });

  describe("Multiple Connections", () => {
    test("should batch messages independently per connection", async () => {
      const mockWs1 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs2 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const conn1 = manager.registerConnection(mockWs1, "user-123");
      const conn2 = manager.registerConnection(mockWs2, "user-456");

      await manager.joinGameRoom(conn1, "session-456");
      await manager.joinGameRoom(conn2, "session-456");

      // Send 3 messages to both connections
      for (let i = 0; i < 3; i++) {
        manager.broadcastToGameRoom("session-456", {
          type: "message",
          sessionId: "session-456",
          user: { id: "user-123", name: "User" },
          content: `Message ${i}`,
        });
      }

      // Advance time
      jest.advanceTimersByTime(50);

      // Both connections should receive the batched messages
      expect(mockWs1.send).toHaveBeenCalledTimes(1);
      expect(mockWs2.send).toHaveBeenCalledTimes(1);

      const sentData1 = JSON.parse(
        (mockWs1.send as jest.Mock).mock.calls[0][0] as string,
      );
      const sentData2 = JSON.parse(
        (mockWs2.send as jest.Mock).mock.calls[0][0] as string,
      );

      expect(sentData1.type).toBe("batch");
      expect(sentData2.type).toBe("batch");
      expect(sentData1.messages).toHaveLength(3);
      expect(sentData2.messages).toHaveLength(3);
    });
  });

  describe("Connection Cleanup", () => {
    test("should flush pending batches when connection is removed", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      await manager.joinGameRoom(connectionId, "session-456");

      // Send a message
      manager.broadcastToGameRoom("session-456", {
        type: "message",
        sessionId: "session-456",
        user: { id: "user-123", name: "User" },
        content: "Message before disconnect",
      });

      // Remove connection (should flush pending messages)
      manager.removeConnection(connectionId);

      // Message should have been flushed
      expect(mockWs.send).toHaveBeenCalledTimes(1);
    });
  });
});
