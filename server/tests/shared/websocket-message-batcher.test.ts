/**
 * Tests for WebSocket Message Batcher
 *
 * Tests batching logic, flushing behavior, and metrics tracking
 */

import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import {
  WebSocketMessageBatcher,
  MessagePriority,
  getMessagePriority,
  type BatchedMessage,
} from "../../../shared/websocket-message-batcher";
import type { WebSocketMessage } from "../../../client/src/lib/websocket-client";

describe("WebSocketMessageBatcher", () => {
  let sendCallback: jest.Mock<(message: any) => void>;
  let batcher: WebSocketMessageBatcher;

  beforeEach(() => {
    sendCallback = jest.fn();
    batcher = new WebSocketMessageBatcher(sendCallback);
    jest.useFakeTimers();
  });

  afterEach(() => {
    batcher.destroy();
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    test("should initialize with default config", () => {
      const metrics = batcher.getMetrics();
      expect(metrics.totalBatches).toBe(0);
      expect(metrics.totalMessages).toBe(0);
      expect(batcher.getBatchSize()).toBe(0);
    });

    test("should accept custom config", () => {
      const customBatcher = new WebSocketMessageBatcher(sendCallback, {
        maxBatchDelay: 100,
        maxBatchSize: 20,
        enableCompression: false,
      });

      expect(customBatcher.getBatchSize()).toBe(0);
      customBatcher.destroy();
    });
  });

  describe("Message Batching", () => {
    test("should batch multiple messages", () => {
      const message1: WebSocketMessage = {
        type: "message",
        sessionId: "test-1",
        user: { id: "user1", name: "User 1" },
        content: "Hello",
      };

      const message2: WebSocketMessage = {
        type: "message",
        sessionId: "test-1",
        user: { id: "user2", name: "User 2" },
        content: "World",
      };

      batcher.addMessage(message1);
      batcher.addMessage(message2);

      expect(batcher.getBatchSize()).toBe(2);
      expect(sendCallback).not.toHaveBeenCalled();
    });

    test("should flush batch when size limit reached", () => {
      const customBatcher = new WebSocketMessageBatcher(sendCallback, {
        maxBatchSize: 3,
      });

      const message: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user1", name: "User" },
        content: "Test",
      };

      customBatcher.addMessage(message);
      customBatcher.addMessage(message);
      customBatcher.addMessage(message); // Should trigger flush

      expect(sendCallback).toHaveBeenCalledTimes(1);
      const sentMessage = sendCallback.mock.calls[0][0] as BatchedMessage;
      expect(sentMessage.type).toBe("batch");
      expect(sentMessage.messages).toHaveLength(3);
      expect(customBatcher.getBatchSize()).toBe(0);

      customBatcher.destroy();
    });

    test("should flush batch after time delay", () => {
      const message: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user1", name: "User" },
        content: "Test",
      };

      batcher.addMessage(message);

      expect(sendCallback).not.toHaveBeenCalled();

      // Advance time by 50ms (default delay)
      jest.advanceTimersByTime(50);

      expect(sendCallback).toHaveBeenCalledTimes(1);
      expect(batcher.getBatchSize()).toBe(0);
    });

    test("should send single message directly without batching", () => {
      const message: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user1", name: "User" },
        content: "Test",
      };

      batcher.addMessage(message);
      jest.advanceTimersByTime(50);

      expect(sendCallback).toHaveBeenCalledTimes(1);
      const sentMessage = sendCallback.mock.calls[0][0];
      expect(sentMessage.type).toBe("message"); // Not a batch
    });
  });

  describe("Priority Handling", () => {
    test("should send critical messages immediately", () => {
      const message: WebSocketMessage = {
        type: "game_state_sync",
        sessionId: "test",
        syncType: "full",
        timestamp: Date.now(),
      };

      batcher.addMessage(message, MessagePriority.CRITICAL);

      expect(sendCallback).toHaveBeenCalledTimes(1);
      expect(sendCallback).toHaveBeenCalledWith(message);
      expect(batcher.getBatchSize()).toBe(0);
    });

    test("should use shorter delay for high priority messages", () => {
      const message: WebSocketMessage = {
        type: "game_action",
        sessionId: "test",
        action: "draw",
        user: { id: "user1", name: "User" },
        data: {},
      };

      batcher.addMessage(message, MessagePriority.HIGH);

      // High priority uses 50% of default (25ms)
      jest.advanceTimersByTime(25);

      expect(sendCallback).toHaveBeenCalledTimes(1);
      expect(batcher.getBatchSize()).toBe(0);
    });

    test("should use longer delay for low priority messages", () => {
      const message: WebSocketMessage = {
        type: "collaborator_status_update",
        eventId: "test",
        statusUpdate: { status: "online" },
      };

      batcher.addMessage(message, MessagePriority.LOW);

      // Low priority uses 200% of default (100ms)
      jest.advanceTimersByTime(50);
      expect(sendCallback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(sendCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("Manual Flush", () => {
    test("should flush batch on manual flush call", () => {
      const message: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user1", name: "User" },
        content: "Test",
      };

      batcher.addMessage(message);
      batcher.addMessage(message);

      batcher.flush("manual");

      expect(sendCallback).toHaveBeenCalledTimes(1);
      expect(batcher.getBatchSize()).toBe(0);
    });

    test("should not flush empty batch", () => {
      batcher.flush();
      expect(sendCallback).not.toHaveBeenCalled();
    });
  });

  describe("Metrics", () => {
    test("should track batch statistics", () => {
      const customBatcher = new WebSocketMessageBatcher(sendCallback, {
        maxBatchSize: 5,
      });

      const message: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user1", name: "User" },
        content: "Test",
      };

      // Add 10 messages (will create 2 batches of 5)
      for (let i = 0; i < 10; i++) {
        customBatcher.addMessage(message);
      }

      const metrics = customBatcher.getMetrics();
      expect(metrics.totalBatches).toBe(2);
      expect(metrics.totalMessages).toBe(10);
      expect(metrics.averageBatchSize).toBe(5);
      expect(metrics.flushReasons.size).toBe(2);

      customBatcher.destroy();
    });

    test("should track time-based flushes", () => {
      const message: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user1", name: "User" },
        content: "Test",
      };

      batcher.addMessage(message);
      jest.advanceTimersByTime(50);

      const metrics = batcher.getMetrics();
      expect(metrics.flushReasons.time).toBe(1);
    });

    test("should track critical message flushes", () => {
      const message: WebSocketMessage = {
        type: "game_state_sync",
        sessionId: "test",
        syncType: "full",
        timestamp: Date.now(),
      };

      batcher.addMessage(message, MessagePriority.CRITICAL);

      const metrics = batcher.getMetrics();
      expect(metrics.flushReasons.priority).toBe(1);
    });

    test("should reset metrics", () => {
      const message: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user1", name: "User" },
        content: "Test",
      };

      batcher.addMessage(message);
      jest.advanceTimersByTime(50);

      batcher.resetMetrics();

      const metrics = batcher.getMetrics();
      expect(metrics.totalBatches).toBe(0);
      expect(metrics.totalMessages).toBe(0);
      expect(metrics.averageBatchSize).toBe(0);
    });
  });

  describe("Compression", () => {
    test("should mark large batches as compressed", () => {
      const customBatcher = new WebSocketMessageBatcher(sendCallback, {
        maxBatchSize: 10,
        enableCompression: true,
        compressionThreshold: 5,
      });

      const message: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user1", name: "User" },
        content: "Test",
      };

      // Add 6 messages (above compression threshold)
      for (let i = 0; i < 6; i++) {
        customBatcher.addMessage(message);
      }

      customBatcher.flush();

      const sentMessage = sendCallback.mock.calls[0][0] as BatchedMessage;
      expect(sentMessage.compressed).toBe(true);

      const metrics = customBatcher.getMetrics();
      expect(metrics.compressionSavings).toBeGreaterThan(0);

      customBatcher.destroy();
    });

    test("should not compress small batches", () => {
      const customBatcher = new WebSocketMessageBatcher(sendCallback, {
        maxBatchSize: 10,
        enableCompression: true,
        compressionThreshold: 5,
      });

      const message: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user1", name: "User" },
        content: "Test",
      };

      // Add 3 messages (below compression threshold)
      for (let i = 0; i < 3; i++) {
        customBatcher.addMessage(message);
      }

      customBatcher.flush();

      const sentMessage = sendCallback.mock.calls[0][0] as BatchedMessage;
      expect(sentMessage.compressed).toBeUndefined();

      customBatcher.destroy();
    });
  });

  describe("Configuration", () => {
    test("should update configuration", () => {
      batcher.updateConfig({
        maxBatchSize: 20,
        maxBatchDelay: 100,
      });

      // Verify new config is applied
      const message: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user1", name: "User" },
        content: "Test",
      };

      batcher.addMessage(message);
      jest.advanceTimersByTime(50);
      expect(sendCallback).not.toHaveBeenCalled(); // Should wait 100ms now

      jest.advanceTimersByTime(50);
      expect(sendCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("Cleanup", () => {
    test("should clear batch without sending", () => {
      const message: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user1", name: "User" },
        content: "Test",
      };

      batcher.addMessage(message);
      batcher.clearBatch();

      expect(batcher.getBatchSize()).toBe(0);
      expect(sendCallback).not.toHaveBeenCalled();
    });

    test("should flush pending messages on destroy", () => {
      const message: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user1", name: "User" },
        content: "Test",
      };

      batcher.addMessage(message);
      batcher.addMessage(message);

      batcher.destroy();

      expect(sendCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("Priority Helper Function", () => {
    test("should identify critical messages", () => {
      const message: WebSocketMessage = {
        type: "game_state_sync",
        sessionId: "test",
        syncType: "full",
        timestamp: Date.now(),
      };

      expect(getMessagePriority(message)).toBe(MessagePriority.CRITICAL);
    });

    test("should identify high priority messages", () => {
      const webrtcMessage: WebSocketMessage = {
        type: "webrtc_offer",
        sessionId: "test",
        targetPlayer: "player2",
        offer: { type: "offer", sdp: "test" },
      };

      expect(getMessagePriority(webrtcMessage)).toBe(MessagePriority.HIGH);

      const gameActionMessage: WebSocketMessage = {
        type: "game_action",
        sessionId: "test",
        action: "draw",
        user: { id: "user1", name: "User" },
        data: {},
      };

      expect(getMessagePriority(gameActionMessage)).toBe(MessagePriority.HIGH);
    });

    test("should identify normal priority messages", () => {
      const message: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user1", name: "User" },
        content: "Hello",
      };

      expect(getMessagePriority(message)).toBe(MessagePriority.NORMAL);
    });

    test("should identify low priority messages", () => {
      const message: WebSocketMessage = {
        type: "collaborator_status_update",
        eventId: "test",
        statusUpdate: { status: "online" },
      };

      expect(getMessagePriority(message)).toBe(MessagePriority.LOW);
    });
  });
});
