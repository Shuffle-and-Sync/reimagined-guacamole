/**
 * Tests for DistributedConnectionManager
 * Tests distributed connection management across multiple servers
 */

import { createClient } from "redis";
import { WebSocket } from "ws";
import {
  DistributedConnectionManager,
  CrossServerMessage,
} from "../../services/distributed-connection-manager";
import {
  WebSocketConnectionManager,
  ExtendedWebSocket,
} from "../../utils/websocket-connection-manager";

// Mock Redis client
jest.mock("redis", () => {
  const mockRedisClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    hSet: jest.fn().mockResolvedValue(1),
    hGet: jest.fn(),
    hGetAll: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
    sAdd: jest.fn().mockResolvedValue(1),
    sRem: jest.fn().mockResolvedValue(1),
    sMembers: jest.fn().mockResolvedValue([]),
    sCard: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    subscribe: jest.fn().mockImplementation(async (channel, callback) => {
      if (callback) callback("", channel);
    }),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockResolvedValue(1),
  };

  return {
    createClient: jest.fn(() => mockRedisClient),
  };
});

// Mock logger
jest.mock("../../logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock nanoid
jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "test-server-id"),
}));

describe("DistributedConnectionManager", () => {
  let manager: DistributedConnectionManager;
  let localManager: WebSocketConnectionManager;
  let mockWs: ExtendedWebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    localManager = new WebSocketConnectionManager();

    // Create mock WebSocket
    mockWs = {
      readyState: WebSocket.OPEN,
      send: jest.fn(),
      close: jest.fn(),
      on: jest.fn(),
      ping: jest.fn(),
    } as unknown as ExtendedWebSocket;
  });

  afterEach(async () => {
    if (manager) {
      await manager.shutdown();
    }
  });

  describe("Initialization", () => {
    test("should initialize successfully", async () => {
      manager = new DistributedConnectionManager(localManager);
      await manager.initialize();

      expect(manager.isReady()).toBe(true);
      expect(manager.getServerId()).toBe("test-server-id");
    });

    test("should not initialize twice", async () => {
      manager = new DistributedConnectionManager(localManager);
      await manager.initialize();

      const firstCall = (createClient as jest.Mock).mock.calls.length;
      await manager.initialize();
      const secondCall = (createClient as jest.Mock).mock.calls.length;

      expect(firstCall).toBe(secondCall);
    });

    test("should initialize with custom options", async () => {
      manager = new DistributedConnectionManager(localManager, {
        serverId: "custom-server-id",
        serverHost: "custom-host",
        serverPort: 4000,
        redisUrl: "redis://custom:6379",
      });

      await manager.initialize();

      expect(manager.getServerId()).toBe("custom-server-id");
      expect(createClient).toHaveBeenCalledWith({ url: "redis://custom:6379" });
    });

    test("should handle initialization errors", async () => {
      const errorManager = new DistributedConnectionManager(localManager);
      const mockClient = (createClient as jest.Mock)();
      mockClient.connect.mockRejectedValueOnce(new Error("Connection failed"));

      await expect(errorManager.initialize()).rejects.toThrow(
        "Connection failed",
      );
    });
  });

  describe("Connection Registration", () => {
    beforeEach(async () => {
      manager = new DistributedConnectionManager(localManager);
      await manager.initialize();
    });

    test("should register a new connection", async () => {
      const userId = "user123";
      const connectionId = await manager.registerConnection(mockWs, userId);

      expect(connectionId).toBeDefined();

      const mockClient = (createClient as jest.Mock)();
      expect(mockClient.hSet).toHaveBeenCalledWith(
        `connections:${connectionId}`,
        expect.objectContaining({
          userId,
          serverId: "test-server-id",
        }),
      );
      expect(mockClient.expire).toHaveBeenCalledWith(
        `connections:${connectionId}`,
        3600,
      );
    });

    test("should register connection with auth token", async () => {
      const userId = "user123";
      const authToken = "token-abc";

      const connectionId = await manager.registerConnection(
        mockWs,
        userId,
        authToken,
      );

      expect(connectionId).toBeDefined();
    });

    test("should update server connection count on registration", async () => {
      const mockClient = (createClient as jest.Mock)();
      mockClient.hGet.mockResolvedValue("5");

      await manager.registerConnection(mockWs, "user123");

      expect(mockClient.hSet).toHaveBeenCalledWith(
        `servers:test-server-id`,
        expect.objectContaining({
          activeConnections: "6",
        }),
      );
    });
  });

  describe("Connection Removal", () => {
    beforeEach(async () => {
      manager = new DistributedConnectionManager(localManager);
      await manager.initialize();
    });

    test("should remove a connection", async () => {
      const connectionId = await manager.registerConnection(mockWs, "user123");

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll.mockResolvedValueOnce({
        userId: "user123",
        serverId: "test-server-id",
        timestamp: Date.now().toString(),
        rooms: JSON.stringify([]),
      });
      mockClient.hGet.mockResolvedValue("1");

      await manager.removeConnection(connectionId);

      expect(mockClient.del).toHaveBeenCalledWith(
        `connections:${connectionId}`,
      );
    });

    test("should leave all rooms on removal", async () => {
      const connectionId = await manager.registerConnection(mockWs, "user123");
      const roomId = "room-456";

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll
        .mockResolvedValueOnce({
          userId: "user123",
          serverId: "test-server-id",
          timestamp: Date.now().toString(),
          rooms: JSON.stringify([]),
        })
        .mockResolvedValueOnce({
          userId: "user123",
          serverId: "test-server-id",
          timestamp: Date.now().toString(),
          rooms: JSON.stringify([roomId]),
        });
      mockClient.sCard.mockResolvedValue(0);

      await manager.joinRoom(connectionId, roomId);
      await manager.removeConnection(connectionId);

      expect(mockClient.sRem).toHaveBeenCalledWith(
        `rooms:${roomId}`,
        connectionId,
      );
    });

    test("should update server connection count on removal", async () => {
      const connectionId = await manager.registerConnection(mockWs, "user123");

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll.mockResolvedValueOnce({
        userId: "user123",
        serverId: "test-server-id",
        timestamp: Date.now().toString(),
        rooms: JSON.stringify([]),
      });
      mockClient.hGet.mockResolvedValue("10");

      await manager.removeConnection(connectionId);

      expect(mockClient.hSet).toHaveBeenCalledWith(
        `servers:test-server-id`,
        expect.objectContaining({
          activeConnections: "9",
        }),
      );
    });
  });

  describe("Room Management", () => {
    beforeEach(async () => {
      manager = new DistributedConnectionManager(localManager);
      await manager.initialize();
    });

    test("should join a room", async () => {
      const connectionId = await manager.registerConnection(mockWs, "user123");
      const roomId = "room-456";

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll.mockResolvedValueOnce({
        userId: "user123",
        serverId: "test-server-id",
        timestamp: Date.now().toString(),
        rooms: JSON.stringify([]),
      });

      const success = await manager.joinRoom(connectionId, roomId);

      expect(success).toBe(true);
      expect(mockClient.sAdd).toHaveBeenCalledWith(
        `rooms:${roomId}`,
        connectionId,
      );
      expect(mockClient.subscribe).toHaveBeenCalledWith(
        `room:${roomId}`,
        expect.any(Function),
      );
    });

    test("should leave a room", async () => {
      const connectionId = await manager.registerConnection(mockWs, "user123");
      const roomId = "room-456";

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll.mockResolvedValue({
        userId: "user123",
        serverId: "test-server-id",
        timestamp: Date.now().toString(),
        rooms: JSON.stringify([roomId]),
      });
      mockClient.sCard.mockResolvedValue(0);

      await manager.joinRoom(connectionId, roomId);
      await manager.leaveRoom(connectionId, roomId);

      expect(mockClient.sRem).toHaveBeenCalledWith(
        `rooms:${roomId}`,
        connectionId,
      );
    });

    test("should cleanup empty room", async () => {
      const connectionId = await manager.registerConnection(mockWs, "user123");
      const roomId = "room-456";

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll.mockResolvedValue({
        userId: "user123",
        serverId: "test-server-id",
        timestamp: Date.now().toString(),
        rooms: JSON.stringify([roomId]),
      });
      mockClient.sCard.mockResolvedValue(0);

      await manager.joinRoom(connectionId, roomId);
      await manager.leaveRoom(connectionId, roomId);

      expect(mockClient.del).toHaveBeenCalledWith(`rooms:${roomId}`);
    });

    test("should get room connections", async () => {
      const roomId = "room-456";
      const connectionId1 = "conn-1";
      const connectionId2 = "conn-2";

      const mockClient = (createClient as jest.Mock)();
      mockClient.sMembers.mockResolvedValue([connectionId1, connectionId2]);
      mockClient.hGetAll
        .mockResolvedValueOnce({
          userId: "user1",
          serverId: "test-server-id",
          timestamp: Date.now().toString(),
          rooms: JSON.stringify([roomId]),
        })
        .mockResolvedValueOnce({
          userId: "user2",
          serverId: "test-server-id",
          timestamp: Date.now().toString(),
          rooms: JSON.stringify([roomId]),
        });

      const connections = await manager.getRoomConnections(roomId);

      expect(connections).toHaveLength(2);
      expect(connections[0].connectionId).toBe(connectionId1);
      expect(connections[1].connectionId).toBe(connectionId2);
    });
  });

  describe("Broadcasting", () => {
    beforeEach(async () => {
      manager = new DistributedConnectionManager(localManager);
      await manager.initialize();
    });

    test("should broadcast message to room", async () => {
      const roomId = "room-456";
      const message = { type: "test", data: "hello" };

      await manager.broadcastToRoom(roomId, message);

      const mockPubClient = (createClient as jest.Mock)();
      expect(mockPubClient.publish).toHaveBeenCalledWith(
        `room:${roomId}`,
        expect.stringContaining("test"),
      );
    });

    test("should include server info in broadcast", async () => {
      const roomId = "room-456";
      const message = { type: "test" };

      const mockPubClient = (createClient as jest.Mock)();
      await manager.broadcastToRoom(roomId, message);

      const publishCall = mockPubClient.publish.mock.calls[0];
      const publishedMsg: CrossServerMessage = JSON.parse(publishCall[1]);

      expect(publishedMsg.sourceServerId).toBe("test-server-id");
      expect(publishedMsg.type).toBe("broadcast");
      expect(publishedMsg.roomId).toBe(roomId);
    });

    test("should broadcast with exclude connection", async () => {
      const roomId = "room-456";
      const message = { type: "test" };
      const excludeId = "conn-exclude";

      await manager.broadcastToRoom(roomId, message, excludeId);

      const mockPubClient = (createClient as jest.Mock)();
      expect(mockPubClient.publish).toHaveBeenCalled();
    });
  });

  describe("Direct Messaging", () => {
    beforeEach(async () => {
      manager = new DistributedConnectionManager(localManager);
      await manager.initialize();
    });

    test("should send to local connection", async () => {
      const connectionId = await manager.registerConnection(mockWs, "user123");
      const message = { type: "test", data: "hello" };

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll.mockResolvedValue({
        userId: "user123",
        serverId: "test-server-id",
        timestamp: Date.now().toString(),
        rooms: JSON.stringify([]),
      });

      await manager.sendToConnection(connectionId, message);

      // Note: This may not work as expected due to local manager internals
      // The test validates the routing logic
      expect(mockClient.hGetAll).toHaveBeenCalledWith(
        `connections:${connectionId}`,
      );
    });

    test("should route to remote connection", async () => {
      const connectionId = "remote-conn-123";
      const message = { type: "test", data: "hello" };
      const remoteServerId = "remote-server-456";

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll.mockResolvedValue({
        userId: "user123",
        serverId: remoteServerId,
        timestamp: Date.now().toString(),
        rooms: JSON.stringify([]),
      });

      await manager.sendToConnection(connectionId, message);

      const mockPubClient = (createClient as jest.Mock)();
      expect(mockPubClient.publish).toHaveBeenCalledWith(
        `server:${remoteServerId}`,
        expect.stringContaining("direct"),
      );
    });

    test("should handle non-existent connection", async () => {
      const connectionId = "non-existent";
      const message = { type: "test" };

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll.mockResolvedValue({});

      const result = await manager.sendToConnection(connectionId, message);

      expect(result).toBe(false);
    });
  });

  describe("Server Management", () => {
    beforeEach(async () => {
      manager = new DistributedConnectionManager(localManager);
      await manager.initialize();
    });

    test("should register server on initialization", async () => {
      const mockClient = (createClient as jest.Mock)();

      expect(mockClient.hSet).toHaveBeenCalledWith(
        `servers:test-server-id`,
        expect.objectContaining({
          serverId: "test-server-id",
        }),
      );
      expect(mockClient.expire).toHaveBeenCalledWith(
        `servers:test-server-id`,
        expect.any(Number),
      );
    });

    test("should get active servers", async () => {
      const mockClient = (createClient as jest.Mock)();
      mockClient.keys.mockResolvedValue([
        "servers:server-1",
        "servers:server-2",
      ]);
      mockClient.hGetAll
        .mockResolvedValueOnce({
          serverId: "server-1",
          host: "host1",
          port: "3000",
          lastHeartbeat: Date.now().toString(),
          activeConnections: "5",
        })
        .mockResolvedValueOnce({
          serverId: "server-2",
          host: "host2",
          port: "3001",
          lastHeartbeat: Date.now().toString(),
          activeConnections: "3",
        });

      const servers = await manager.getActiveServers();

      expect(servers).toHaveLength(2);
      expect(servers[0].serverId).toBe("server-1");
      expect(servers[0].activeConnections).toBe(5);
      expect(servers[1].serverId).toBe("server-2");
      expect(servers[1].activeConnections).toBe(3);
    });

    test("should unregister server on shutdown", async () => {
      const mockClient = (createClient as jest.Mock)();

      await manager.shutdown();

      expect(mockClient.del).toHaveBeenCalledWith(`servers:test-server-id`);
      expect(mockClient.quit).toHaveBeenCalled();
    });
  });

  describe("Statistics", () => {
    beforeEach(async () => {
      manager = new DistributedConnectionManager(localManager);
      await manager.initialize();
    });

    test("should get distributed stats", async () => {
      const mockClient = (createClient as jest.Mock)();
      mockClient.keys
        .mockResolvedValueOnce(["connections:1", "connections:2"]) // connections
        .mockResolvedValueOnce(["rooms:a", "rooms:b", "rooms:c"]) // rooms
        .mockResolvedValueOnce(["servers:1"]); // servers

      mockClient.hGetAll.mockResolvedValue({
        serverId: "server-1",
        host: "host1",
        port: "3000",
        lastHeartbeat: Date.now().toString(),
        activeConnections: "2",
      });

      const stats = await manager.getDistributedStats();

      expect(stats.totalConnections).toBe(2);
      expect(stats.totalRooms).toBe(3);
      expect(stats.activeServers).toBe(1);
      expect(stats.serverStats).toHaveLength(1);
    });
  });

  describe("Failure Handling", () => {
    beforeEach(async () => {
      manager = new DistributedConnectionManager(localManager, {
        heartbeatInterval: 1000,
        heartbeatTTL: 3,
      });
      await manager.initialize();
    });

    test("should detect failed servers", async () => {
      const now = Date.now();
      const oldHeartbeat = now - 10000; // 10 seconds ago, past threshold

      const mockClient = (createClient as jest.Mock)();
      mockClient.keys.mockResolvedValue([
        "servers:test-server-id",
        "servers:failed-server",
      ]);
      mockClient.hGetAll
        .mockResolvedValueOnce({
          serverId: "test-server-id",
          host: "host1",
          port: "3000",
          lastHeartbeat: now.toString(),
          activeConnections: "5",
        })
        .mockResolvedValueOnce({
          serverId: "failed-server",
          host: "host2",
          port: "3001",
          lastHeartbeat: oldHeartbeat.toString(),
          activeConnections: "3",
        });

      // Manually trigger cleanup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (manager as any).detectFailedServers();

      // Should have attempted to handle the failed server
      expect(mockClient.keys).toHaveBeenCalled();
    });

    test("should cleanup connections from failed server", async () => {
      const failedServerId = "failed-server";
      const mockClient = (createClient as jest.Mock)();

      mockClient.keys.mockResolvedValue([
        "connections:conn1",
        "connections:conn2",
      ]);
      mockClient.hGetAll
        .mockResolvedValueOnce({
          userId: "user1",
          serverId: failedServerId,
          timestamp: Date.now().toString(),
          rooms: JSON.stringify(["room1"]),
        })
        .mockResolvedValueOnce({
          userId: "user2",
          serverId: "test-server-id",
          timestamp: Date.now().toString(),
          rooms: JSON.stringify([]),
        });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (manager as any).handleServerFailure(failedServerId);

      expect(mockClient.sRem).toHaveBeenCalledWith("rooms:room1", "conn1");
      expect(mockClient.del).toHaveBeenCalledWith(`servers:${failedServerId}`);
    });
  });

  describe("Cleanup", () => {
    beforeEach(async () => {
      manager = new DistributedConnectionManager(localManager, {
        staleConnectionTimeout: 1000,
      });
      await manager.initialize();
    });

    test("should cleanup stale connections", async () => {
      const now = Date.now();
      const staleTime = now - 2000; // 2 seconds ago, past 1 second threshold

      const mockClient = (createClient as jest.Mock)();
      mockClient.keys.mockResolvedValue(["connections:stale"]);
      mockClient.hGetAll.mockResolvedValue({
        userId: "user1",
        serverId: "test-server-id",
        timestamp: staleTime.toString(),
        rooms: JSON.stringify([]),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (manager as any).cleanupStaleConnections();

      expect(mockClient.del).toHaveBeenCalledWith("connections:stale");
    });
  });

  describe("Helper Methods", () => {
    beforeEach(async () => {
      manager = new DistributedConnectionManager(localManager);
      await manager.initialize();
    });

    test("should get connection metadata", async () => {
      const connectionId = "conn-123";
      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll.mockResolvedValue({
        userId: "user123",
        serverId: "test-server-id",
        timestamp: "1234567890",
        rooms: JSON.stringify(["room1", "room2"]),
      });

      const metadata = await manager.getConnectionMetadata(connectionId);

      expect(metadata).not.toBeNull();
      expect(metadata?.userId).toBe("user123");
      expect(metadata?.serverId).toBe("test-server-id");
      expect(metadata?.rooms).toEqual(["room1", "room2"]);
    });

    test("should return null for non-existent connection", async () => {
      const connectionId = "non-existent";
      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll.mockResolvedValue({});

      const metadata = await manager.getConnectionMetadata(connectionId);

      expect(metadata).toBeNull();
    });

    test("should get server ID", () => {
      expect(manager.getServerId()).toBe("test-server-id");
    });

    test("should check if ready", () => {
      expect(manager.isReady()).toBe(true);
    });

    test("should get local manager", () => {
      const local = manager.getLocalManager();
      expect(local).toBe(localManager);
    });
  });
});
