/**
 * Integration tests for DistributedConnectionManager
 * Tests multi-server scenarios and cross-server communication
 */

import { createClient } from "redis";
import { WebSocket } from "ws";
import {
  DistributedConnectionManager,
  createDistributedConnectionManager,
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

// Mock nanoid to return predictable IDs
let serverIdCounter = 0;
jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => `server-${serverIdCounter++}`),
}));

describe("DistributedConnectionManager Integration Tests", () => {
  let server1Manager: DistributedConnectionManager;
  let server2Manager: DistributedConnectionManager;
  let localManager1: WebSocketConnectionManager;
  let localManager2: WebSocketConnectionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    serverIdCounter = 0;
    localManager1 = new WebSocketConnectionManager();
    localManager2 = new WebSocketConnectionManager();
  });

  afterEach(async () => {
    if (server1Manager) {
      await server1Manager.shutdown();
    }
    if (server2Manager) {
      await server2Manager.shutdown();
    }
  });

  describe("Multi-Server Setup", () => {
    test("should initialize multiple servers independently", async () => {
      server1Manager = new DistributedConnectionManager(localManager1, {
        serverHost: "server1.local",
        serverPort: 3000,
      });
      server2Manager = new DistributedConnectionManager(localManager2, {
        serverHost: "server2.local",
        serverPort: 3001,
      });

      await server1Manager.initialize();
      await server2Manager.initialize();

      expect(server1Manager.isReady()).toBe(true);
      expect(server2Manager.isReady()).toBe(true);
      expect(server1Manager.getServerId()).not.toBe(
        server2Manager.getServerId(),
      );
    });

    test("should register servers in Redis", async () => {
      server1Manager = new DistributedConnectionManager(localManager1);
      await server1Manager.initialize();

      const mockClient = (createClient as jest.Mock)();
      expect(mockClient.hSet).toHaveBeenCalledWith(
        expect.stringContaining("servers:"),
        expect.objectContaining({
          serverId: expect.any(String),
        }),
      );
    });

    test("should list all active servers", async () => {
      server1Manager = new DistributedConnectionManager(localManager1);
      server2Manager = new DistributedConnectionManager(localManager2);

      await server1Manager.initialize();
      await server2Manager.initialize();

      const mockClient = (createClient as jest.Mock)();
      mockClient.keys.mockResolvedValue([
        `servers:${server1Manager.getServerId()}`,
        `servers:${server2Manager.getServerId()}`,
      ]);
      mockClient.hGetAll
        .mockResolvedValueOnce({
          serverId: server1Manager.getServerId(),
          host: "localhost",
          port: "3000",
          lastHeartbeat: Date.now().toString(),
          activeConnections: "2",
        })
        .mockResolvedValueOnce({
          serverId: server2Manager.getServerId(),
          host: "localhost",
          port: "3001",
          lastHeartbeat: Date.now().toString(),
          activeConnections: "3",
        });

      const servers = await server1Manager.getActiveServers();

      expect(servers).toHaveLength(2);
      expect(servers[0].activeConnections).toBe(2);
      expect(servers[1].activeConnections).toBe(3);
    });
  });

  describe("Cross-Server Connection Management", () => {
    beforeEach(async () => {
      server1Manager = new DistributedConnectionManager(localManager1);
      server2Manager = new DistributedConnectionManager(localManager2);
      await server1Manager.initialize();
      await server2Manager.initialize();
    });

    test("should register connections on different servers", async () => {
      const ws1 = createMockWebSocket();
      const ws2 = createMockWebSocket();

      const conn1 = await server1Manager.registerConnection(ws1, "user1");
      const conn2 = await server2Manager.registerConnection(ws2, "user2");

      expect(conn1).toBeDefined();
      expect(conn2).toBeDefined();
      expect(conn1).not.toBe(conn2);

      const mockClient = (createClient as jest.Mock)();
      expect(mockClient.hSet).toHaveBeenCalledWith(
        `connections:${conn1}`,
        expect.objectContaining({
          userId: "user1",
          serverId: server1Manager.getServerId(),
        }),
      );
      expect(mockClient.hSet).toHaveBeenCalledWith(
        `connections:${conn2}`,
        expect.objectContaining({
          userId: "user2",
          serverId: server2Manager.getServerId(),
        }),
      );
    });

    test("should track which server owns each connection", async () => {
      const ws1 = createMockWebSocket();
      const conn1 = await server1Manager.registerConnection(ws1, "user1");

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll.mockResolvedValue({
        userId: "user1",
        serverId: server1Manager.getServerId(),
        timestamp: Date.now().toString(),
        rooms: JSON.stringify([]),
      });

      const metadata = await server2Manager.getConnectionMetadata(conn1);

      expect(metadata).not.toBeNull();
      expect(metadata?.serverId).toBe(server1Manager.getServerId());
    });
  });

  describe("Distributed Room Management", () => {
    beforeEach(async () => {
      server1Manager = new DistributedConnectionManager(localManager1);
      server2Manager = new DistributedConnectionManager(localManager2);
      await server1Manager.initialize();
      await server2Manager.initialize();
    });

    test("should allow connections from different servers to join same room", async () => {
      const ws1 = createMockWebSocket();
      const ws2 = createMockWebSocket();
      const roomId = "game-room-123";

      const conn1 = await server1Manager.registerConnection(ws1, "user1");
      const conn2 = await server2Manager.registerConnection(ws2, "user2");

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll.mockResolvedValue({
        userId: "user1",
        serverId: server1Manager.getServerId(),
        timestamp: Date.now().toString(),
        rooms: JSON.stringify([]),
      });

      await server1Manager.joinRoom(conn1, roomId);
      await server2Manager.joinRoom(conn2, roomId);

      expect(mockClient.sAdd).toHaveBeenCalledWith(`rooms:${roomId}`, conn1);
      expect(mockClient.sAdd).toHaveBeenCalledWith(`rooms:${roomId}`, conn2);
    });

    test("should get all connections in a room across servers", async () => {
      const roomId = "game-room-123";
      const conn1 = "conn1";
      const conn2 = "conn2";

      const mockClient = (createClient as jest.Mock)();
      mockClient.sMembers.mockResolvedValue([conn1, conn2]);
      mockClient.hGetAll
        .mockResolvedValueOnce({
          userId: "user1",
          serverId: server1Manager.getServerId(),
          timestamp: Date.now().toString(),
          rooms: JSON.stringify([roomId]),
        })
        .mockResolvedValueOnce({
          userId: "user2",
          serverId: server2Manager.getServerId(),
          timestamp: Date.now().toString(),
          rooms: JSON.stringify([roomId]),
        });

      const connections = await server1Manager.getRoomConnections(roomId);

      expect(connections).toHaveLength(2);
      expect(connections[0].serverId).toBe(server1Manager.getServerId());
      expect(connections[1].serverId).toBe(server2Manager.getServerId());
    });
  });

  describe("Cross-Server Messaging", () => {
    beforeEach(async () => {
      server1Manager = new DistributedConnectionManager(localManager1);
      server2Manager = new DistributedConnectionManager(localManager2);
      await server1Manager.initialize();
      await server2Manager.initialize();
    });

    test("should broadcast to room across all servers", async () => {
      const roomId = "game-room-123";
      const message = { type: "game-update", data: "test" };

      await server1Manager.broadcastToRoom(roomId, message);

      const mockPubClient = (createClient as jest.Mock)();
      expect(mockPubClient.publish).toHaveBeenCalledWith(
        `room:${roomId}`,
        expect.stringContaining("game-update"),
      );
    });

    test("should route direct message to remote server", async () => {
      const ws1 = createMockWebSocket();
      const conn1 = await server1Manager.registerConnection(ws1, "user1");
      const message = { type: "notification", data: "hello" };

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGetAll.mockResolvedValue({
        userId: "user1",
        serverId: server1Manager.getServerId(),
        timestamp: Date.now().toString(),
        rooms: JSON.stringify([]),
      });

      // Server 2 sends message to connection on Server 1
      await server2Manager.sendToConnection(conn1, message);

      const mockPubClient = (createClient as jest.Mock)();
      expect(mockPubClient.publish).toHaveBeenCalledWith(
        `server:${server1Manager.getServerId()}`,
        expect.stringContaining("direct"),
      );
    });
  });

  describe("Server Failure Scenarios", () => {
    beforeEach(async () => {
      server1Manager = new DistributedConnectionManager(localManager1, {
        heartbeatInterval: 1000,
        heartbeatTTL: 3,
      });
      server2Manager = new DistributedConnectionManager(localManager2, {
        heartbeatInterval: 1000,
        heartbeatTTL: 3,
      });
      await server1Manager.initialize();
      await server2Manager.initialize();
    });

    test("should detect when a server stops sending heartbeats", async () => {
      const now = Date.now();
      const staleHeartbeat = now - 10000; // 10 seconds ago

      const mockClient = (createClient as jest.Mock)();
      mockClient.keys.mockResolvedValue([
        `servers:${server1Manager.getServerId()}`,
        `servers:${server2Manager.getServerId()}`,
      ]);
      mockClient.hGetAll
        .mockResolvedValueOnce({
          serverId: server1Manager.getServerId(),
          host: "localhost",
          port: "3000",
          lastHeartbeat: now.toString(),
          activeConnections: "2",
        })
        .mockResolvedValueOnce({
          serverId: server2Manager.getServerId(),
          host: "localhost",
          port: "3001",
          lastHeartbeat: staleHeartbeat.toString(),
          activeConnections: "3",
        });

      const servers = await server1Manager.getActiveServers();
      const staleServer = servers.find(
        (s) => s.serverId === server2Manager.getServerId(),
      );

      expect(staleServer).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(now - staleServer!.lastHeartbeat).toBeGreaterThan(5000);
    });

    test("should cleanup connections from failed server", async () => {
      const failedServerId = server2Manager.getServerId();

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
          serverId: server1Manager.getServerId(),
          timestamp: Date.now().toString(),
          rooms: JSON.stringify([]),
        });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (server1Manager as any).handleServerFailure(failedServerId);

      expect(mockClient.del).toHaveBeenCalledWith(`servers:${failedServerId}`);
      expect(mockClient.sRem).toHaveBeenCalledWith("rooms:room1", "conn1");
    });

    test("should redistribute load after server failure", async () => {
      const ws1 = createMockWebSocket();
      const conn1 = await server1Manager.registerConnection(ws1, "user1");

      // Simulate server2 failure
      await server2Manager.shutdown();

      // New connections should only go to server1
      const ws2 = createMockWebSocket();
      const conn2 = await server1Manager.registerConnection(ws2, "user2");

      expect(conn1).toBeDefined();
      expect(conn2).toBeDefined();

      const stats = await server1Manager.getDistributedStats();
      expect(stats.localConnections).toBeGreaterThan(0);
    });
  });

  describe("Load Distribution", () => {
    beforeEach(async () => {
      server1Manager = new DistributedConnectionManager(localManager1);
      server2Manager = new DistributedConnectionManager(localManager2);
      await server1Manager.initialize();
      await server2Manager.initialize();
    });

    test("should distribute connections across multiple servers", async () => {
      const connections: string[] = [];

      // Create connections on both servers
      for (let i = 0; i < 5; i++) {
        const ws = createMockWebSocket();
        const conn = await server1Manager.registerConnection(ws, `user-${i}`);
        connections.push(conn);
      }

      for (let i = 5; i < 10; i++) {
        const ws = createMockWebSocket();
        const conn = await server2Manager.registerConnection(ws, `user-${i}`);
        connections.push(conn);
      }

      expect(connections).toHaveLength(10);
      expect(new Set(connections).size).toBe(10); // All unique
    });

    test("should track server connection counts", async () => {
      const ws1 = createMockWebSocket();
      const ws2 = createMockWebSocket();

      await server1Manager.registerConnection(ws1, "user1");
      await server2Manager.registerConnection(ws2, "user2");

      const mockClient = (createClient as jest.Mock)();

      // Verify both servers updated their connection counts
      expect(mockClient.hSet).toHaveBeenCalledWith(
        `servers:${server1Manager.getServerId()}`,
        expect.objectContaining({
          activeConnections: expect.any(String),
        }),
      );
      expect(mockClient.hSet).toHaveBeenCalledWith(
        `servers:${server2Manager.getServerId()}`,
        expect.objectContaining({
          activeConnections: expect.any(String),
        }),
      );
    });
  });

  describe("Factory Function", () => {
    test("should create and initialize manager with factory", async () => {
      const manager = await createDistributedConnectionManager(localManager1, {
        serverId: "test-factory",
      });

      expect(manager).toBeInstanceOf(DistributedConnectionManager);
      expect(manager.isReady()).toBe(true);
      expect(manager.getServerId()).toBe("test-factory");

      await manager.shutdown();
    });
  });
});

/**
 * Helper function to create mock WebSocket
 */
function createMockWebSocket(): ExtendedWebSocket {
  return {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    ping: jest.fn(),
  } as unknown as ExtendedWebSocket;
}
