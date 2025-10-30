/**
 * WebSocket Connection Manager Tests
 *
 * Unit tests for WebSocket connection management with race condition prevention,
 * connection limits, and proper locking mechanisms.
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

describe("WebSocketConnectionManager", () => {
  let manager: WebSocketConnectionManager;

  beforeEach(() => {
    manager = new WebSocketConnectionManager();
  });

  afterEach(() => {
    // Clean up all connections
    jest.clearAllMocks();
  });

  describe("Connection Registration", () => {
    test("should register a new connection", () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");

      expect(connectionId).toBeDefined();
      expect(connectionId).toContain("ws_");
      expect(mockWs.connectionId).toBe(connectionId);
      expect(mockWs.userId).toBe("user-123");
      expect(mockWs.lastActivity).toBeDefined();
    });

    test("should register connection with auth token", () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(
        mockWs,
        "user-123",
        "auth-token-xyz",
      );

      expect(mockWs.authToken).toBe("auth-token-xyz");
      expect(mockWs.authExpiry).toBeDefined();
      expect(mockWs.authExpiry).toBeGreaterThan(Date.now());
    });

    test("should track total connections", () => {
      const mockWs1 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs2 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      manager.registerConnection(mockWs1, "user-123");
      manager.registerConnection(mockWs2, "user-456");

      const stats = manager.getStats();
      expect(stats.totalConnections).toBe(2);
    });
  });

  describe("Connection Limits", () => {
    test("should enforce per-user connection limit (3 connections)", () => {
      const mockWs1 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        close: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs2 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        close: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs3 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        close: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs4 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        close: jest.fn(),
      } as unknown as ExtendedWebSocket;

      // Register 3 connections for the same user
      const conn1 = manager.registerConnection(mockWs1, "user-123");
      const conn2 = manager.registerConnection(mockWs2, "user-123");
      const conn3 = manager.registerConnection(mockWs3, "user-123");

      // Verify all 3 are registered
      expect(manager.getUserConnectionCount("user-123")).toBe(3);

      // Register 4th connection - should close the oldest (conn1)
      const conn4 = manager.registerConnection(mockWs4, "user-123");

      expect(mockWs1.close).toHaveBeenCalledWith(
        1000,
        "Connection limit exceeded",
      );
      expect(manager.getUserConnectionCount("user-123")).toBe(3);

      // Verify the oldest connection was removed
      const userConns = manager.getUserConnections("user-123");
      expect(userConns).not.toContain(conn1);
      expect(userConns).toContain(conn2);
      expect(userConns).toContain(conn3);
      expect(userConns).toContain(conn4);
    });

    test("should get connection limits", () => {
      const limits = manager.getConnectionLimits();

      expect(limits.maxPerUser).toBe(3);
      expect(limits.maxTotal).toBe(10000);
    });

    test("should throw error when global connection limit is reached", () => {
      // Create a manager with a low limit for testing
      const testManager = new WebSocketConnectionManager();

      // Mock the connections map to simulate max capacity
      const originalSize = Object.getOwnPropertyDescriptor(
        Map.prototype,
        "size",
      );
      Object.defineProperty(Map.prototype, "size", {
        get: function () {
          if (this === (testManager as any).connections) {
            return 10000;
          }
          return originalSize?.get?.call(this) || 0;
        },
        configurable: true,
      });

      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      expect(() => {
        testManager.registerConnection(mockWs, "user-new");
      }).toThrow("Server at maximum capacity");

      // Restore original descriptor
      if (originalSize) {
        Object.defineProperty(Map.prototype, "size", originalSize);
      }
    });
  });

  describe("User Connection Tracking", () => {
    test("should track connections per user", () => {
      const mockWs1 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs2 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs3 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      manager.registerConnection(mockWs1, "user-123");
      manager.registerConnection(mockWs2, "user-123");
      manager.registerConnection(mockWs3, "user-456");

      expect(manager.getUserConnectionCount("user-123")).toBe(2);
      expect(manager.getUserConnectionCount("user-456")).toBe(1);
      expect(manager.getUserConnectionCount("user-789")).toBe(0);
    });

    test("should get all connection IDs for a user", () => {
      const mockWs1 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs2 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const conn1 = manager.registerConnection(mockWs1, "user-123");
      const conn2 = manager.registerConnection(mockWs2, "user-123");

      const userConns = manager.getUserConnections("user-123");
      expect(userConns).toHaveLength(2);
      expect(userConns).toContain(conn1);
      expect(userConns).toContain(conn2);
    });

    test("should clean up user tracking when all connections are removed", () => {
      const mockWs1 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs2 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const conn1 = manager.registerConnection(mockWs1, "user-123");
      const conn2 = manager.registerConnection(mockWs2, "user-123");

      expect(manager.getUserConnectionCount("user-123")).toBe(2);

      manager.removeConnection(conn1);
      expect(manager.getUserConnectionCount("user-123")).toBe(1);

      manager.removeConnection(conn2);
      expect(manager.getUserConnectionCount("user-123")).toBe(0);
      expect(manager.getUserConnections("user-123")).toHaveLength(0);
    });
  });

  describe("Room Joining with Locks", () => {
    test("should join game room", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      const result = await manager.joinGameRoom(connectionId, "session-456");

      expect(result).toBe(true);
      expect(mockWs.sessionId).toBe("session-456");

      const roomConnections = manager.getGameRoomConnections("session-456");
      expect(roomConnections).toHaveLength(1);
      expect(roomConnections[0]).toBe(mockWs);
    });

    test("should join collaborative room", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      const result = await manager.joinCollaborativeRoom(
        connectionId,
        "event-789",
      );

      expect(result).toBe(true);
      expect(mockWs.eventId).toBe("event-789");

      const roomConnections =
        manager.getCollaborativeRoomConnections("event-789");
      expect(roomConnections).toHaveLength(1);
      expect(roomConnections[0]).toBe(mockWs);
    });

    test("should return false when joining room with invalid connection ID", async () => {
      const result = await manager.joinGameRoom(
        "invalid-connection-id",
        "session-456",
      );
      expect(result).toBe(false);
    });

    test("should handle multiple connections joining the same room", async () => {
      const mockWs1 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs2 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs3 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const conn1 = manager.registerConnection(mockWs1, "user-123");
      const conn2 = manager.registerConnection(mockWs2, "user-456");
      const conn3 = manager.registerConnection(mockWs3, "user-789");

      // All join the same room
      await Promise.all([
        manager.joinGameRoom(conn1, "session-456"),
        manager.joinGameRoom(conn2, "session-456"),
        manager.joinGameRoom(conn3, "session-456"),
      ]);

      const roomConnections = manager.getGameRoomConnections("session-456");
      expect(roomConnections).toHaveLength(3);
    });

    test("should prevent race conditions with concurrent room joins", async () => {
      // Create multiple connections that will try to join the same room simultaneously
      const connections: ExtendedWebSocket[] = [];
      const connectionIds: string[] = [];

      for (let i = 0; i < 10; i++) {
        const mockWs = {
          readyState: WebSocket.OPEN,
          on: jest.fn(),
        } as unknown as ExtendedWebSocket;
        connections.push(mockWs);
        connectionIds.push(manager.registerConnection(mockWs, `user-${i}`));
      }

      // All connections try to join the same room at the same time
      const joinPromises = connectionIds.map((connId) =>
        manager.joinGameRoom(connId, "race-test-session"),
      );

      const results = await Promise.all(joinPromises);

      // All should succeed
      expect(results.every((r) => r === true)).toBe(true);

      // Verify all connections are in the room
      const roomConnections =
        manager.getGameRoomConnections("race-test-session");
      expect(roomConnections).toHaveLength(10);
    });
  });

  describe("Connection Removal", () => {
    test("should remove connection and clean up rooms", async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      await manager.joinGameRoom(connectionId, "session-456");

      expect(manager.getGameRoomConnections("session-456")).toHaveLength(1);

      manager.removeConnection(connectionId);

      expect(manager.getGameRoomConnections("session-456")).toHaveLength(0);
      expect(manager.getUserConnectionCount("user-123")).toBe(0);
    });

    test("should remove empty rooms after last connection leaves", async () => {
      const mockWs1 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs2 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const conn1 = manager.registerConnection(mockWs1, "user-123");
      const conn2 = manager.registerConnection(mockWs2, "user-456");

      await manager.joinGameRoom(conn1, "session-456");
      await manager.joinGameRoom(conn2, "session-456");

      expect(manager.getGameRoomConnections("session-456")).toHaveLength(2);

      manager.removeConnection(conn1);
      expect(manager.getGameRoomConnections("session-456")).toHaveLength(1);

      manager.removeConnection(conn2);
      expect(manager.getGameRoomConnections("session-456")).toHaveLength(0);
    });
  });

  describe("Broadcasting", () => {
    test("should broadcast to game room", async () => {
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

      const message = { type: "test", data: "hello" };
      manager.broadcastToGameRoom("session-456", message);

      expect(mockWs1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    test("should exclude sender when broadcasting", async () => {
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

      const message = { type: "test", data: "hello" };
      manager.broadcastToGameRoom("session-456", message, conn1);

      expect(mockWs1.send).not.toHaveBeenCalled();
      expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify(message));
    });
  });

  describe("Activity Tracking", () => {
    test("should update last activity timestamp", () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");
      const initialActivity = mockWs.lastActivity;

      // Wait a bit and update activity
      setTimeout(() => {
        manager.updateActivity(connectionId);
        expect(mockWs.lastActivity).toBeGreaterThan(initialActivity!);
      }, 10);
    });
  });

  describe("Authentication", () => {
    test("should check if auth token is expired", () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(
        mockWs,
        "user-123",
        "auth-token-xyz",
      );

      expect(manager.isAuthExpired(connectionId)).toBe(false);

      // Manually expire the auth
      mockWs.authExpiry = Date.now() - 1000;

      expect(manager.isAuthExpired(connectionId)).toBe(true);
    });

    test("should refresh authentication token", () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(
        mockWs,
        "user-123",
        "old-token",
      );

      const result = manager.refreshAuth(connectionId, "new-token");

      expect(result).toBe(true);
      expect(mockWs.authToken).toBe("new-token");
      expect(mockWs.authExpiry).toBeGreaterThan(Date.now());
    });
  });

  describe("Statistics", () => {
    test("should return accurate connection statistics", async () => {
      const mockWs1 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs2 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;
      const mockWs3 = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const conn1 = manager.registerConnection(mockWs1, "user-123");
      const conn2 = manager.registerConnection(mockWs2, "user-456");
      const conn3 = manager.registerConnection(mockWs3, "user-789");

      await manager.joinGameRoom(conn1, "session-456");
      await manager.joinCollaborativeRoom(conn2, "event-789");
      // conn3 remains unassigned

      const stats = manager.getStats();

      expect(stats.totalConnections).toBe(3);
      expect(stats.activeConnections).toBeGreaterThanOrEqual(0);
      expect(stats.connectionsByType.game_room).toBe(1);
      expect(stats.connectionsByType.collaborative_stream).toBe(1);
      expect(stats.connectionsByType.unassigned).toBe(1);
    });
  });

  describe("Stale Connection Cleanup", () => {
    test("should identify and clean up stale connections", () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        close: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(mockWs, "user-123");

      // Make the connection stale by setting old lastActivity
      mockWs.lastActivity = Date.now() - 31 * 60 * 1000; // 31 minutes ago

      const cleanedUp = manager.cleanupStaleConnections();

      expect(cleanedUp).toBe(1);
      expect(mockWs.close).toHaveBeenCalledWith(1000, "Connection cleanup");
      expect(manager.getUserConnectionCount("user-123")).toBe(0);
    });

    test("should clean up connections with expired auth", () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        on: jest.fn(),
        close: jest.fn(),
      } as unknown as ExtendedWebSocket;

      const connectionId = manager.registerConnection(
        mockWs,
        "user-123",
        "auth-token",
      );

      // Expire the auth
      mockWs.authExpiry = Date.now() - 1000;

      const cleanedUp = manager.cleanupStaleConnections();

      expect(cleanedUp).toBe(1);
      expect(mockWs.close).toHaveBeenCalledWith(1000, "Connection cleanup");
    });
  });
});
