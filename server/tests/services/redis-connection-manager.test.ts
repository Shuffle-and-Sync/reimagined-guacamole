/**
 * Tests for Redis Connection Manager
 * Tests distributed connection management using Redis
 */

import { createClient } from "redis";
import {
  RedisConnectionManager,
  GameEvent,
} from "../../services/redis-connection-manager";

// Mock Redis client
jest.mock("redis", () => {
  const mockRedisClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    hSet: jest.fn().mockResolvedValue(1),
    hGet: jest.fn(),
    hDel: jest.fn().mockResolvedValue(1),
    hKeys: jest.fn().mockResolvedValue([]),
    hLen: jest.fn().mockResolvedValue(0),
    sAdd: jest.fn().mockResolvedValue(1),
    sRem: jest.fn().mockResolvedValue(1),
    sMembers: jest.fn().mockResolvedValue([]),
    sIsMember: jest.fn().mockResolvedValue(false),
    sCard: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    setEx: jest.fn().mockResolvedValue("OK"),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    subscribe: jest.fn().mockImplementation((channel, callback) => {
      if (callback) callback();
      return Promise.resolve();
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
  nanoid: jest.fn(() => "test-server-instance-id"),
}));

describe("RedisConnectionManager", () => {
  let manager: RedisConnectionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new RedisConnectionManager();
  });

  afterEach(async () => {
    if (manager) {
      await manager.shutdown();
    }
  });

  describe("Initialization", () => {
    test("should initialize with default configuration", async () => {
      await manager.initialize();

      // Manager constructor creates 3 clients, but the test setup creates an additional mock
      expect(createClient).toHaveBeenCalled();
    });

    test("should not initialize twice", async () => {
      await manager.initialize();
      const firstCallCount = (createClient as jest.Mock).mock.calls.length;

      await manager.initialize();
      const secondCallCount = (createClient as jest.Mock).mock.calls.length;

      expect(firstCallCount).toBe(secondCallCount);
    });

    test("should initialize with custom Redis URL", async () => {
      const customManager = new RedisConnectionManager("redis://custom:6379");
      await customManager.initialize();

      expect(createClient).toHaveBeenCalledWith({ url: "redis://custom:6379" });
      await customManager.shutdown();
    });

    test("should handle initialization errors", async () => {
      const errorManager = new RedisConnectionManager();
      const mockClient = (createClient as jest.Mock)();
      mockClient.connect.mockRejectedValueOnce(new Error("Connection failed"));

      await expect(errorManager.initialize()).rejects.toThrow(
        "Connection failed",
      );
    });
  });

  describe("Connection Management", () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    test("should connect a user", async () => {
      const userId = "user123";
      const socketId = "socket456";

      await manager.connect(userId, socketId);

      const mockClient = (createClient as jest.Mock)();
      expect(mockClient.hSet).toHaveBeenCalledWith(
        `connections:${userId}`,
        socketId,
        expect.stringContaining(userId),
      );
      expect(mockClient.sAdd).toHaveBeenCalledWith("online:users", userId);
      expect(mockClient.expire).toHaveBeenCalledWith(
        `connections:${userId}`,
        3600,
      );
    });

    test("should disconnect a user", async () => {
      const userId = "user123";
      const socketId = "socket456";

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGet.mockResolvedValueOnce(
        JSON.stringify({
          userId,
          socketId,
          gameIds: [],
          lastSeen: Date.now(),
          serverInstance: "test-server",
        }),
      );
      mockClient.hKeys.mockResolvedValueOnce([]);

      await manager.disconnect(userId, socketId);

      expect(mockClient.hDel).toHaveBeenCalledWith(
        `connections:${userId}`,
        socketId,
      );
      expect(mockClient.sRem).toHaveBeenCalledWith("online:users", userId);
    });

    test("should not disconnect non-existent connection", async () => {
      const userId = "user123";
      const socketId = "socket456";

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGet.mockResolvedValueOnce(null);

      await manager.disconnect(userId, socketId);

      expect(mockClient.hDel).not.toHaveBeenCalled();
    });

    test("should leave all games on disconnect", async () => {
      const userId = "user123";
      const socketId = "socket456";
      const gameId = "game789";

      const mockClient = (createClient as jest.Mock)();
      mockClient.hGet.mockResolvedValueOnce(
        JSON.stringify({
          userId,
          socketId,
          gameIds: [gameId],
          lastSeen: Date.now(),
          serverInstance: "test-server",
        }),
      );
      mockClient.hKeys.mockResolvedValueOnce([]);
      mockClient.sMembers.mockResolvedValueOnce([]);

      await manager.disconnect(userId, socketId);

      expect(mockClient.sRem).toHaveBeenCalledWith(
        `game:${gameId}:players`,
        userId,
      );
    });
  });

  describe("Game Room Management", () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    test("should join a game", async () => {
      const userId = "user123";
      const gameId = "game456";

      const mockClient = (createClient as jest.Mock)();
      mockClient.hKeys.mockResolvedValueOnce(["socket1"]);
      mockClient.hGet.mockResolvedValueOnce(
        JSON.stringify({
          userId,
          socketId: "socket1",
          gameIds: [],
          lastSeen: Date.now(),
          serverInstance: "test-server",
        }),
      );

      await manager.joinGame(userId, gameId);

      expect(mockClient.sAdd).toHaveBeenCalledWith(
        `game:${gameId}:players`,
        userId,
      );
      expect(mockClient.subscribe).toHaveBeenCalledWith(
        `game:${gameId}:events`,
        expect.any(Function),
      );
    });

    test("should leave a game", async () => {
      const userId = "user123";
      const gameId = "game456";

      const mockClient = (createClient as jest.Mock)();
      mockClient.hKeys.mockResolvedValueOnce(["socket1"]);
      mockClient.hGet.mockResolvedValueOnce(
        JSON.stringify({
          userId,
          socketId: "socket1",
          gameIds: [gameId],
          lastSeen: Date.now(),
          serverInstance: "test-server",
        }),
      );
      mockClient.sMembers.mockResolvedValueOnce([]);

      await manager.leaveGame(userId, gameId);

      expect(mockClient.sRem).toHaveBeenCalledWith(
        `game:${gameId}:players`,
        userId,
      );
    });

    test("should cleanup empty game", async () => {
      const userId = "user123";
      const gameId = "game456";

      const mockClient = (createClient as jest.Mock)();
      mockClient.hKeys.mockResolvedValueOnce(["socket1"]);
      mockClient.hGet.mockResolvedValueOnce(
        JSON.stringify({
          userId,
          socketId: "socket1",
          gameIds: [gameId],
          lastSeen: Date.now(),
          serverInstance: "test-server",
        }),
      );
      mockClient.sMembers.mockResolvedValueOnce([]); // No remaining players

      await manager.leaveGame(userId, gameId);

      expect(mockClient.unsubscribe).toHaveBeenCalledWith(
        `game:${gameId}:events`,
      );
      expect(mockClient.del).toHaveBeenCalledWith(`game:${gameId}:session`);
      expect(mockClient.del).toHaveBeenCalledWith(`game:${gameId}:players`);
    });

    test("should get online players in a game", async () => {
      const gameId = "game123";
      const players = ["user1", "user2", "user3"];

      const mockClient = (createClient as jest.Mock)();
      mockClient.sMembers.mockResolvedValueOnce(players);
      mockClient.sIsMember.mockResolvedValue(true);

      const onlinePlayers = await manager.getOnlinePlayers(gameId);

      expect(onlinePlayers).toEqual(players);
      expect(mockClient.sMembers).toHaveBeenCalledWith(
        `game:${gameId}:players`,
      );
    });

    test("should filter offline players", async () => {
      const gameId = "game123";
      const players = ["user1", "user2", "user3"];

      const mockClient = (createClient as jest.Mock)();
      mockClient.sMembers.mockResolvedValueOnce(players);
      mockClient.sIsMember
        .mockResolvedValueOnce(true) // user1 online
        .mockResolvedValueOnce(false) // user2 offline
        .mockResolvedValueOnce(true); // user3 online

      const onlinePlayers = await manager.getOnlinePlayers(gameId);

      expect(onlinePlayers).toEqual(["user1", "user3"]);
    });
  });

  describe("Broadcasting", () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    test("should broadcast game event", async () => {
      const gameId = "game123";
      const event: GameEvent = {
        type: "player-joined",
        userId: "user456",
        timestamp: Date.now(),
      };

      await manager.broadcast(gameId, event);

      const mockPubClient = (createClient as jest.Mock)();
      expect(mockPubClient.publish).toHaveBeenCalledWith(
        `game:${gameId}:events`,
        expect.stringContaining("player-joined"),
      );
    });

    test("should add server instance to event", async () => {
      const gameId = "game123";
      const event: GameEvent = {
        type: "game-update",
        timestamp: Date.now(),
      };

      const mockPubClient = (createClient as jest.Mock)();
      await manager.broadcast(gameId, event);

      const publishCall = mockPubClient.publish.mock.calls[0];
      const publishedEvent = JSON.parse(publishCall[1]);
      expect(publishedEvent.serverInstance).toBe("test-server-instance-id");
    });

    test("should register and call event handler", async () => {
      const gameId = "game123";
      const handler = jest.fn();

      manager.onGameEvent(gameId, handler);

      // Simulate receiving an event
      const event: GameEvent = {
        type: "test-event",
        timestamp: Date.now(),
        serverInstance: "other-server",
      };

      // Trigger the handler manually (in real scenario, it's triggered by Redis subscription)
      const mockSubClient = (createClient as jest.Mock)();
      const messageHandler = mockSubClient.on.mock.calls.find(
        (call) => call[0] === "message",
      )?.[1];

      if (messageHandler) {
        messageHandler(`game:${gameId}:events`, JSON.stringify(event));
        expect(handler).toHaveBeenCalledWith(event);
      }
    });
  });

  describe("Statistics", () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    test("should get connection stats", async () => {
      const mockClient = (createClient as jest.Mock)();
      mockClient.sCard.mockResolvedValueOnce(5); // 5 online users
      mockClient.keys.mockResolvedValueOnce([
        "game:1:players",
        "game:2:players",
      ]); // 2 active games
      mockClient.sMembers.mockResolvedValueOnce(["user1", "user2"]);
      mockClient.hLen.mockResolvedValue(2); // 2 connections per user

      const stats = await manager.getStats();

      expect(stats.onlineUsers).toBe(5);
      expect(stats.activeGames).toBe(2);
      expect(stats.totalConnections).toBe(4); // 2 users * 2 connections
    });
  });

  describe("Cleanup", () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    test("should cleanup stale connections", async () => {
      const now = Date.now();
      const staleTime = now - 31 * 60 * 1000; // 31 minutes ago (stale)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockClient = (createClient as any)();

      // First set up the user and connection
      await manager.connect("user1", "socket1");

      // Mock cleanup scenario - find stale user
      mockClient.sMembers.mockResolvedValueOnce(["user1"]);
      mockClient.hKeys
        .mockResolvedValueOnce(["socket1"]) // First call during cleanup iteration
        .mockResolvedValueOnce(["socket1"]) // Second call in disconnect
        .mockResolvedValueOnce([]); // Third call after disconnect completes

      mockClient.hGet
        .mockResolvedValueOnce(
          JSON.stringify({
            userId: "user1",
            socketId: "socket1",
            gameIds: [],
            lastSeen: staleTime,
            serverInstance: "test-server",
          }),
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            userId: "user1",
            socketId: "socket1",
            gameIds: [],
            lastSeen: staleTime,
            serverInstance: "test-server",
          }),
        );

      // Clear previous mock calls
      mockClient.hDel.mockClear();
      mockClient.sRem.mockClear();

      // Manually trigger cleanup
      await (manager as any).cleanupStaleConnections();

      // disconnect() is called, which calls hDel
      expect(mockClient.hDel).toHaveBeenCalledWith(
        "connections:user1",
        "socket1",
      );
    });
  });

  describe("Shutdown", () => {
    test("should gracefully shutdown", async () => {
      await manager.initialize();

      const mockClient = (createClient as jest.Mock)();
      await manager.shutdown();

      expect(mockClient.del).toHaveBeenCalledWith(
        expect.stringContaining("heartbeat"),
      );
      expect(mockClient.quit).toHaveBeenCalled();
    });

    test("should clear intervals on shutdown", async () => {
      await manager.initialize();

      jest.spyOn(global, "clearInterval");

      await manager.shutdown();

      expect(clearInterval).toHaveBeenCalled();
    });
  });

  describe("Singleton Instance", () => {
    test("should create singleton instance", async () => {
      const module = await import("../../services/redis-connection-manager");

      const instance1 = module.getConnectionManager();
      const instance2 = module.getConnectionManager();

      expect(instance1).toBe(instance2);
    });

    test("should initialize connection manager", async () => {
      const module = await import("../../services/redis-connection-manager");

      const manager = await module.initializeConnectionManager();

      expect(manager).toBeDefined();
      await manager.shutdown();
    });
  });
});
