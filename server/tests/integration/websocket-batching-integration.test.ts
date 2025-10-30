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

    test("should send critical messages immediately without batching", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      await manager.joinGameRoom(connectionId, "session-456");

      // Send a critical message (game_state_sync)
      manager.broadcastToGameRoom("session-456", {
        type: "game_state_sync",
        sessionId: "session-456",
        syncType: "full",
        timestamp: Date.now(),
      });

      // Critical message should be sent immediately
      expect(mockWs.send).toHaveBeenCalledTimes(1);

      const sentData = JSON.parse(
        (mockWs.send as jest.Mock).mock.calls[0][0] as string,
      );
      // Critical messages are not batched
      expect(sentData.type).toBe("game_state_sync");
    });

    test("should handle mixed priority messages correctly", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      await manager.joinGameRoom(connectionId, "session-456");

      // Send normal message
      manager.broadcastToGameRoom("session-456", {
        type: "message",
        sessionId: "session-456",
        user: { id: "user-123", name: "User" },
        content: "Normal message",
      });

      expect(mockWs.send).not.toHaveBeenCalled();

      // Send critical message - bypasses batching
      manager.broadcastToGameRoom("session-456", {
        type: "game_state_sync",
        sessionId: "session-456",
        syncType: "full",
        timestamp: Date.now(),
      });

      // Critical message should be sent immediately
      expect(mockWs.send).toHaveBeenCalledTimes(1);

      // Send another normal message
      manager.broadcastToGameRoom("session-456", {
        type: "message",
        sessionId: "session-456",
        user: { id: "user-123", name: "User" },
        content: "Another message",
      });

      // Advance time to flush batched normal messages
      jest.advanceTimersByTime(50);

      // Should have 2 sends total: 1 critical immediate + 1 batched normal messages
      expect(mockWs.send).toHaveBeenCalledTimes(2);

      // Verify the second call is a batch with both normal messages
      const secondCall = JSON.parse(
        (mockWs.send as jest.Mock).mock.calls[1][0] as string,
      );
      expect(secondCall.type).toBe("batch");
      expect(secondCall.messages).toHaveLength(2);
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

    test("should track priority-based bypasses", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        send: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      await manager.joinGameRoom(connectionId, "session-456");

      // Send critical messages
      for (let i = 0; i < 5; i++) {
        manager.broadcastToGameRoom("session-456", {
          type: "game_state_sync",
          sessionId: "session-456",
          syncType: "full",
          timestamp: Date.now(),
        });
      }

      const metrics = manager.getBatchingMetrics();
      expect(metrics.flushReasons.priority).toBe(5);
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
