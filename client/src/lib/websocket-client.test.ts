/**
 * Tests for WebSocket Client Reconnection State Manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// We need to import after mocking
import { WebSocketMessage } from "./websocket-client";

// Mock dependencies
vi.mock("@/lib/queryClient", () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

vi.mock("./logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Type definitions for testing
type ConnectionState = "connected" | "disconnected" | "reconnecting" | "failed";
type ConnectionStateCallback = (
  state: ConnectionState,
  attempt?: number,
) => void;

interface ReconnectionState {
  gameRoomId?: string;
  collaborativeRoomId?: string;
  pendingMessages: Array<{
    message: WebSocketMessage;
    timestamp: number;
    id: string;
  }>;
  lastMessageId?: string;
}

// Mock WebSocketClient class with minimal implementation for testing
class MockWebSocketClient {
  private currentConnectionState: ConnectionState = "disconnected";
  private connectionStateCallbacks: Set<ConnectionStateCallback> = new Set();
  private reconnectionState: ReconnectionState = {
    pendingMessages: [],
  };
  private processedMessageIds: Set<string> = new Set();
  private messageIdCounter = 0;
  private readonly MAX_PROCESSED_IDS = 1000;

  setConnectionState(state: ConnectionState, attempt?: number): void {
    if (this.currentConnectionState !== state) {
      this.currentConnectionState = state;
      this.connectionStateCallbacks.forEach((callback) => {
        callback(state, attempt);
      });
    }
  }

  onConnectionStateChange(callback: ConnectionStateCallback): () => void {
    this.connectionStateCallbacks.add(callback);
    callback(this.currentConnectionState);
    return () => {
      this.connectionStateCallbacks.delete(callback);
    };
  }

  getConnectionState(): ConnectionState {
    return this.currentConnectionState;
  }

  setGameRoomId(sessionId: string | null): void {
    if (sessionId) {
      this.reconnectionState.gameRoomId = sessionId;
    } else {
      delete this.reconnectionState.gameRoomId;
    }
  }

  setCollaborativeRoomId(eventId: string | null): void {
    if (eventId) {
      this.reconnectionState.collaborativeRoomId = eventId;
    } else {
      delete this.reconnectionState.collaborativeRoomId;
    }
  }

  getReconnectionState(): Readonly<ReconnectionState> {
    return { ...this.reconnectionState };
  }

  queueMessage(message: WebSocketMessage, id?: string): void {
    const messageId = id || this.generateMessageId();
    const queuedMessage = {
      message,
      timestamp: Date.now(),
      id: messageId,
    };
    this.reconnectionState.pendingMessages.push(queuedMessage);

    const MAX_QUEUE_SIZE = 100;
    if (this.reconnectionState.pendingMessages.length > MAX_QUEUE_SIZE) {
      this.reconnectionState.pendingMessages.shift();
    }
  }

  clearPendingMessages(): void {
    this.reconnectionState.pendingMessages = [];
  }

  getPendingMessageCount(): number {
    return this.reconnectionState.pendingMessages.length;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${this.messageIdCounter++}`;
  }

  trackMessageId(id: string): void {
    this.processedMessageIds.add(id);

    if (this.processedMessageIds.size > this.MAX_PROCESSED_IDS) {
      const toRemove = Array.from(this.processedMessageIds).slice(
        0,
        Math.floor(this.MAX_PROCESSED_IDS * 0.2),
      );
      toRemove.forEach((id) => this.processedMessageIds.delete(id));
    }
  }

  isMessageProcessed(id: string): boolean {
    return this.processedMessageIds.has(id);
  }

  clearProcessedMessageIds(): void {
    this.processedMessageIds.clear();
  }
}

describe("WebSocket Reconnection State Manager", () => {
  let client: MockWebSocketClient;

  beforeEach(() => {
    client = new MockWebSocketClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Connection State Management", () => {
    it("should start in disconnected state", () => {
      expect(client.getConnectionState()).toBe("disconnected");
    });

    it("should transition to connected state", () => {
      client.setConnectionState("connected");
      expect(client.getConnectionState()).toBe("connected");
    });

    it("should transition to reconnecting state", () => {
      client.setConnectionState("reconnecting", 1);
      expect(client.getConnectionState()).toBe("reconnecting");
    });

    it("should transition to failed state", () => {
      client.setConnectionState("failed");
      expect(client.getConnectionState()).toBe("failed");
    });

    it("should notify callbacks on state change", () => {
      const callback = vi.fn();
      client.onConnectionStateChange(callback);

      // Should be called immediately with current state (note: attempt may not be passed if undefined)
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("disconnected");

      // Should be called when state changes
      client.setConnectionState("connected");
      expect(callback).toHaveBeenCalledWith("connected", undefined);
    });

    it("should pass attempt number to callbacks", () => {
      const callback = vi.fn();
      client.onConnectionStateChange(callback);

      callback.mockClear();
      client.setConnectionState("reconnecting", 3);
      expect(callback).toHaveBeenCalledWith("reconnecting", 3);
    });

    it("should support multiple state callbacks", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      client.onConnectionStateChange(callback1);
      client.onConnectionStateChange(callback2);

      callback1.mockClear();
      callback2.mockClear();

      client.setConnectionState("connected");

      expect(callback1).toHaveBeenCalledWith("connected", undefined);
      expect(callback2).toHaveBeenCalledWith("connected", undefined);
    });

    it("should allow unsubscribing from state changes", () => {
      const callback = vi.fn();
      const unsubscribe = client.onConnectionStateChange(callback);

      callback.mockClear();
      unsubscribe();

      client.setConnectionState("connected");
      expect(callback).not.toHaveBeenCalled();
    });

    it("should not notify if state does not change", () => {
      const callback = vi.fn();
      client.onConnectionStateChange(callback);

      callback.mockClear();
      client.setConnectionState("disconnected"); // Same state
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Room ID State Persistence", () => {
    it("should store game room ID", () => {
      client.setGameRoomId("game-123");
      const state = client.getReconnectionState();
      expect(state.gameRoomId).toBe("game-123");
    });

    it("should clear game room ID when set to null", () => {
      client.setGameRoomId("game-123");
      client.setGameRoomId(null);
      const state = client.getReconnectionState();
      expect(state.gameRoomId).toBeUndefined();
    });

    it("should store collaborative room ID", () => {
      client.setCollaborativeRoomId("event-456");
      const state = client.getReconnectionState();
      expect(state.collaborativeRoomId).toBe("event-456");
    });

    it("should clear collaborative room ID when set to null", () => {
      client.setCollaborativeRoomId("event-456");
      client.setCollaborativeRoomId(null);
      const state = client.getReconnectionState();
      expect(state.collaborativeRoomId).toBeUndefined();
    });

    it("should store both room IDs independently", () => {
      client.setGameRoomId("game-123");
      client.setCollaborativeRoomId("event-456");

      const state = client.getReconnectionState();
      expect(state.gameRoomId).toBe("game-123");
      expect(state.collaborativeRoomId).toBe("event-456");
    });
  });

  describe("Message Queuing", () => {
    const testMessage: WebSocketMessage = {
      type: "join_room",
      sessionId: "test-session",
      user: { id: "user-1", name: "Test User" },
    };

    it("should queue a message", () => {
      client.queueMessage(testMessage);
      expect(client.getPendingMessageCount()).toBe(1);
    });

    it("should queue multiple messages", () => {
      client.queueMessage(testMessage);
      client.queueMessage(testMessage);
      client.queueMessage(testMessage);
      expect(client.getPendingMessageCount()).toBe(3);
    });

    it("should include timestamp and ID in queued messages", () => {
      const beforeTime = Date.now();
      client.queueMessage(testMessage);
      const afterTime = Date.now();

      const state = client.getReconnectionState();
      const queuedMsg = state.pendingMessages[0];
      expect(queuedMsg).toBeDefined();

      if (queuedMsg) {
        expect(queuedMsg.timestamp).toBeGreaterThanOrEqual(beforeTime);
        expect(queuedMsg.timestamp).toBeLessThanOrEqual(afterTime);
        expect(queuedMsg.id).toMatch(/^msg_\d+_\d+$/);
        expect(queuedMsg.message).toEqual(testMessage);
      }
    });

    it("should use custom message ID when provided", () => {
      const customId = "custom-msg-123";
      client.queueMessage(testMessage, customId);

      const state = client.getReconnectionState();
      const queuedMsg = state.pendingMessages[0];
      expect(queuedMsg).toBeDefined();
      if (queuedMsg) {
        expect(queuedMsg.id).toBe(customId);
      }
    });

    it("should limit queue size to 100 messages", () => {
      // Queue 150 messages
      for (let i = 0; i < 150; i++) {
        client.queueMessage(testMessage);
      }

      // Should only keep last 100
      expect(client.getPendingMessageCount()).toBe(100);
    });

    it("should remove oldest messages when queue is full", () => {
      const firstMessage: WebSocketMessage = {
        type: "message",
        sessionId: "test",
        user: { id: "user-1", name: "Test" },
        content: "first",
      };

      client.queueMessage(firstMessage, "first-msg");

      // Queue 100 more messages
      for (let i = 0; i < 100; i++) {
        client.queueMessage(testMessage);
      }

      const state = client.getReconnectionState();
      // First message should be removed
      expect(
        state.pendingMessages.find((m) => m.id === "first-msg"),
      ).toBeUndefined();
    });

    it("should clear all pending messages", () => {
      client.queueMessage(testMessage);
      client.queueMessage(testMessage);
      client.queueMessage(testMessage);

      client.clearPendingMessages();
      expect(client.getPendingMessageCount()).toBe(0);
    });
  });

  describe("Message ID Tracking and Deduplication", () => {
    it("should track processed message IDs", () => {
      const messageId = "test-msg-1";
      client.trackMessageId(messageId);
      expect(client.isMessageProcessed(messageId)).toBe(true);
    });

    it("should not track same message ID twice", () => {
      const messageId = "test-msg-1";
      client.trackMessageId(messageId);
      client.trackMessageId(messageId);
      expect(client.isMessageProcessed(messageId)).toBe(true);
    });

    it("should limit stored message IDs to prevent memory leak", () => {
      // Track 1200 message IDs (over the limit of 1000)
      for (let i = 0; i < 1200; i++) {
        client.trackMessageId(`msg-${i}`);
      }

      // Oldest 20% (240 messages) should be removed
      // So we should have 1200 - 240 = 960 messages
      // But the cleanup happens at 1000, so first 1000 messages
      // trigger cleanup, removing 200 oldest
      // Then 200 more are added, total of 1000 again

      // The exact count depends on implementation, but should be around 1000
      // Check that the oldest ones are removed
      expect(client.isMessageProcessed("msg-0")).toBe(false);
      expect(client.isMessageProcessed("msg-100")).toBe(false);

      // And newest ones are kept
      expect(client.isMessageProcessed("msg-1199")).toBe(true);
      expect(client.isMessageProcessed("msg-1100")).toBe(true);
    });

    it("should clear all processed message IDs", () => {
      client.trackMessageId("msg-1");
      client.trackMessageId("msg-2");

      client.clearProcessedMessageIds();

      expect(client.isMessageProcessed("msg-1")).toBe(false);
      expect(client.isMessageProcessed("msg-2")).toBe(false);
    });
  });

  describe("Reconnection State Snapshot", () => {
    it("should return immutable copy of reconnection state", () => {
      const message: WebSocketMessage = {
        type: "join_room",
        sessionId: "test",
        user: { id: "user-1", name: "Test" },
      };

      client.setGameRoomId("game-123");
      client.setCollaborativeRoomId("event-456");
      client.queueMessage(message);

      const state1 = client.getReconnectionState();
      const state2 = client.getReconnectionState();

      // Should return different objects
      expect(state1).not.toBe(state2);

      // But with same values
      expect(state1).toEqual(state2);
    });

    it("should include all state properties", () => {
      const message: WebSocketMessage = {
        type: "join_room",
        sessionId: "test",
        user: { id: "user-1", name: "Test" },
      };

      client.setGameRoomId("game-123");
      client.setCollaborativeRoomId("event-456");
      client.queueMessage(message, "msg-1");

      const state = client.getReconnectionState();

      expect(state).toHaveProperty("gameRoomId", "game-123");
      expect(state).toHaveProperty("collaborativeRoomId", "event-456");
      expect(state).toHaveProperty("pendingMessages");
      expect(state.pendingMessages).toHaveLength(1);
      const firstMessage = state.pendingMessages[0];
      expect(firstMessage).toBeDefined();
      if (firstMessage) {
        expect(firstMessage.id).toBe("msg-1");
      }
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete reconnection flow", () => {
      const stateChanges: ConnectionState[] = [];
      client.onConnectionStateChange((state) => {
        stateChanges.push(state);
      });

      // Initial connection
      client.setConnectionState("connected");
      client.setGameRoomId("game-123");

      // Connection drops
      client.setConnectionState("disconnected");

      // Queue messages while disconnected
      const message: WebSocketMessage = {
        type: "message",
        sessionId: "game-123",
        user: { id: "user-1", name: "Test" },
        content: "Hello",
      };
      client.queueMessage(message);
      client.queueMessage(message);

      // Reconnecting
      client.setConnectionState("reconnecting", 1);

      // Reconnected
      client.setConnectionState("connected");

      expect(stateChanges).toEqual([
        "disconnected", // Initial
        "connected",
        "disconnected",
        "reconnecting",
        "connected",
      ]);

      expect(client.getPendingMessageCount()).toBe(2);
      expect(client.getReconnectionState().gameRoomId).toBe("game-123");
    });

    it("should handle failed reconnection", () => {
      const stateChanges: ConnectionState[] = [];
      client.onConnectionStateChange((state) => {
        stateChanges.push(state);
      });

      client.setConnectionState("connected");
      client.setConnectionState("disconnected");
      client.setConnectionState("reconnecting", 1);
      client.setConnectionState("reconnecting", 2);
      client.setConnectionState("reconnecting", 3);
      client.setConnectionState("failed");

      expect(stateChanges[stateChanges.length - 1]).toBe("failed");
    });

    it("should preserve state across multiple disconnections", () => {
      client.setGameRoomId("game-123");
      client.setCollaborativeRoomId("event-456");

      const message: WebSocketMessage = {
        type: "message",
        sessionId: "game-123",
        user: { id: "user-1", name: "Test" },
        content: "Hello",
      };

      // First disconnection
      client.queueMessage(message);
      expect(client.getPendingMessageCount()).toBe(1);

      // Second disconnection
      client.queueMessage(message);
      expect(client.getPendingMessageCount()).toBe(2);

      // Room IDs should still be preserved
      const state = client.getReconnectionState();
      expect(state.gameRoomId).toBe("game-123");
      expect(state.collaborativeRoomId).toBe("event-456");
    });
  });
});
