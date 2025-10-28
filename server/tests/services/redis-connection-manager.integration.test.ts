/**
 * Integration tests for Redis Connection Manager
 * Tests distributed scenarios across multiple server instances
 */

import {
  RedisConnectionManager,
  GameEvent,
} from "../../services/redis-connection-manager";

// Mock Redis for integration tests
jest.mock("redis", () => {
  // Shared state across instances
  const sharedState = {
    data: new Map<string, any>(),
    sets: new Map<string, Set<string>>(),
    hashes: new Map<string, Map<string, string>>(),
    subscriptions: new Map<
      string,
      Array<(channel: string, message: string) => void>
    >(),
  };

  const createMockClient = () => {
    const client = {
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn((event: string, handler: any) => {
        if (event === "message") {
          client._messageHandler = handler;
        }
      }),
      _messageHandler: null as any,
      hSet: jest.fn((key: string, field: string, value: string) => {
        if (!sharedState.hashes.has(key)) {
          sharedState.hashes.set(key, new Map());
        }
        sharedState.hashes.get(key)!.set(field, value);
        return Promise.resolve(1);
      }),
      hGet: jest.fn((key: string, field: string) => {
        const hash = sharedState.hashes.get(key);
        return Promise.resolve(hash ? hash.get(field) || null : null);
      }),
      hDel: jest.fn((key: string, field: string) => {
        const hash = sharedState.hashes.get(key);
        if (hash) {
          hash.delete(field);
        }
        return Promise.resolve(1);
      }),
      hKeys: jest.fn((key: string) => {
        const hash = sharedState.hashes.get(key);
        return Promise.resolve(hash ? Array.from(hash.keys()) : []);
      }),
      hLen: jest.fn((key: string) => {
        const hash = sharedState.hashes.get(key);
        return Promise.resolve(hash ? hash.size : 0);
      }),
      sAdd: jest.fn((key: string, member: string) => {
        if (!sharedState.sets.has(key)) {
          sharedState.sets.set(key, new Set());
        }
        sharedState.sets.get(key)!.add(member);
        return Promise.resolve(1);
      }),
      sRem: jest.fn((key: string, member: string) => {
        const set = sharedState.sets.get(key);
        if (set) {
          set.delete(member);
        }
        return Promise.resolve(1);
      }),
      sMembers: jest.fn((key: string) => {
        const set = sharedState.sets.get(key);
        return Promise.resolve(set ? Array.from(set) : []);
      }),
      sIsMember: jest.fn((key: string, member: string) => {
        const set = sharedState.sets.get(key);
        return Promise.resolve(set ? set.has(member) : false);
      }),
      sCard: jest.fn((key: string) => {
        const set = sharedState.sets.get(key);
        return Promise.resolve(set ? set.size : 0);
      }),
      expire: jest.fn().mockResolvedValue(1),
      setEx: jest.fn((key: string, ttl: number, value: string) => {
        sharedState.data.set(key, value);
        return Promise.resolve("OK");
      }),
      get: jest.fn((key: string) => {
        return Promise.resolve(sharedState.data.get(key) || null);
      }),
      del: jest.fn((key: string) => {
        sharedState.data.delete(key);
        sharedState.sets.delete(key);
        sharedState.hashes.delete(key);
        return Promise.resolve(1);
      }),
      keys: jest.fn((pattern: string) => {
        // Combine all keys from data, sets, and hashes
        const allKeys = [
          ...Array.from(sharedState.data.keys()),
          ...Array.from(sharedState.sets.keys()),
          ...Array.from(sharedState.hashes.keys()),
        ];
        // Simple pattern matching
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        return Promise.resolve(allKeys.filter((k) => regex.test(k)));
      }),
      subscribe: jest.fn((channel: string, callback?: () => void) => {
        if (!sharedState.subscriptions.has(channel)) {
          sharedState.subscriptions.set(channel, []);
        }
        if (client._messageHandler) {
          sharedState.subscriptions.get(channel)!.push(client._messageHandler);
        }
        if (callback) callback();
        return Promise.resolve();
      }),
      unsubscribe: jest.fn((channel: string) => {
        sharedState.subscriptions.delete(channel);
        return Promise.resolve(undefined);
      }),
      publish: jest.fn((channel: string, message: string) => {
        const handlers = sharedState.subscriptions.get(channel) || [];
        // Simulate async delivery
        setTimeout(() => {
          handlers.forEach((handler) => handler(channel, message));
        }, 0);
        return Promise.resolve(handlers.length);
      }),
    };
    return client;
  };

  return {
    createClient: jest.fn(() => createMockClient()),
    _sharedState: sharedState, // For test inspection
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

// Mock nanoid to generate predictable IDs
let instanceCounter = 0;
jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => `server-instance-${++instanceCounter}`),
}));

describe("RedisConnectionManager Integration Tests", () => {
  let manager1: RedisConnectionManager;
  let manager2: RedisConnectionManager;

  beforeEach(async () => {
    // Reset shared state between tests
    const redis = await import("redis");
    const redisModule = redis as unknown as {
      _sharedState?: {
        data: Map<string, unknown>;
        sets: Map<string, Set<string>>;
        hashes: Map<string, Map<string, string>>;
        subscriptions: Map<string, unknown[]>;
      };
    };
    if (redisModule._sharedState) {
      redisModule._sharedState.data.clear();
      redisModule._sharedState.sets.clear();
      redisModule._sharedState.hashes.clear();
      redisModule._sharedState.subscriptions.clear();
    }

    instanceCounter = 0;
    manager1 = new RedisConnectionManager();
    manager2 = new RedisConnectionManager();
    await manager1.initialize();
    await manager2.initialize();
  });

  afterEach(async () => {
    await manager1.shutdown();
    await manager2.shutdown();
  });

  describe("Multi-Server Connection Management", () => {
    test("should handle connections from multiple servers", async () => {
      const user1 = "user1";
      const user2 = "user2";
      const socket1 = "socket1";
      const socket2 = "socket2";

      // User1 connects to server1
      await manager1.connect(user1, socket1);

      // User2 connects to server2
      await manager2.connect(user2, socket2);

      // Both should be in online users
      const stats1 = await manager1.getStats();
      const stats2 = await manager2.getStats();

      expect(stats1.onlineUsers).toBe(2);
      expect(stats2.onlineUsers).toBe(2);
    });

    test("should handle same user connecting from multiple servers", async () => {
      const userId = "user1";
      const socket1 = "socket-server1";
      const socket2 = "socket-server2";

      // User connects to both servers
      await manager1.connect(userId, socket1);
      await manager2.connect(userId, socket2);

      const stats = await manager1.getStats();
      // In Redis, same user added twice to a set is still counted once
      // But our implementation uses hashes for connections per user
      expect(stats.onlineUsers).toBe(1); // Same user, counted once in online:users set
      expect(stats.totalConnections).toBe(2); // But two socket connections
    });

    test("should maintain connection after one server disconnects", async () => {
      const userId = "user1";
      const socket1 = "socket-server1";
      const socket2 = "socket-server2";

      await manager1.connect(userId, socket1);
      await manager2.connect(userId, socket2);

      // Disconnect from server1
      await manager1.disconnect(userId, socket1);

      // User should still be online (connected to server2)
      const stats = await manager2.getStats();
      expect(stats.onlineUsers).toBe(1);
      expect(stats.totalConnections).toBe(1);
    });
  });

  describe("Distributed Game Room Management", () => {
    test("should handle players joining from different servers", async () => {
      const gameId = "game123";
      const user1 = "user1";
      const user2 = "user2";

      // Connect users to different servers
      await manager1.connect(user1, "socket1");
      await manager2.connect(user2, "socket2");

      // Both join the same game
      await manager1.joinGame(user1, gameId);
      await manager2.joinGame(user2, gameId);

      // Both should see each other
      const players1 = await manager1.getOnlinePlayers(gameId);
      const players2 = await manager2.getOnlinePlayers(gameId);

      expect(players1).toContain(user1);
      expect(players1).toContain(user2);
      expect(players2).toContain(user1);
      expect(players2).toContain(user2);
    });

    test("should handle game events across servers", async () => {
      const gameId = "game123";
      const user1 = "user1";
      const user2 = "user2";

      await manager1.connect(user1, "socket1");
      await manager2.connect(user2, "socket2");

      // Setup event handlers
      const events1: GameEvent[] = [];
      const events2: GameEvent[] = [];

      manager1.onGameEvent(gameId, (event) => events1.push(event));
      manager2.onGameEvent(gameId, (event) => events2.push(event));

      // Join game
      await manager1.joinGame(user1, gameId);
      await manager2.joinGame(user2, gameId);

      // Wait for join events to propagate
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Server1 broadcasts an event
      await manager1.broadcast(gameId, {
        type: "game-move",
        userId: user1,
        data: { action: "play-card" },
        timestamp: Date.now(),
      });

      // Wait for event to propagate
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Server2 should receive the event
      const receivedOnServer2 = events2.some(
        (e) => e.type === "game-move" && e.userId === user1,
      );
      expect(receivedOnServer2).toBe(true);
    });

    test("should cleanup game when last player leaves from any server", async () => {
      const gameId = "game123";
      const user1 = "user1";
      const user2 = "user2";

      await manager1.connect(user1, "socket1");
      await manager2.connect(user2, "socket2");

      await manager1.joinGame(user1, gameId);
      await manager2.joinGame(user2, gameId);

      // First player leaves
      await manager1.leaveGame(user1, gameId);

      let players = await manager2.getOnlinePlayers(gameId);
      expect(players).toContain(user2);
      expect(players).not.toContain(user1);

      // Last player leaves - game should be cleaned up
      await manager2.leaveGame(user2, gameId);

      players = await manager1.getOnlinePlayers(gameId);
      expect(players).toEqual([]);
    });
  });

  describe("Presence and Failover", () => {
    test("should track user presence across servers", async () => {
      const userId = "user1";
      const socket1 = "socket1";

      await manager1.connect(userId, socket1);

      // Both servers should see the user online
      const players1 = await manager1.getOnlinePlayers("any-game");
      const players2 = await manager2.getOnlinePlayers("any-game");

      // Since user is not in "any-game", both should return empty
      // But we can check online status through stats
      const stats1 = await manager1.getStats();
      const stats2 = await manager2.getStats();

      expect(stats1.onlineUsers).toBe(1);
      expect(stats2.onlineUsers).toBe(1);
    });

    test("should handle server instance failure gracefully", async () => {
      const gameId = "game123";
      const user1 = "user1";
      const user2 = "user2";

      // Connect users to different servers
      await manager1.connect(user1, "socket1");
      await manager2.connect(user2, "socket2");

      await manager1.joinGame(user1, gameId);
      await manager2.joinGame(user2, gameId);

      // Simulate server1 going down
      await manager1.shutdown();

      // Server2 should still function
      const players = await manager2.getOnlinePlayers(gameId);
      expect(players).toContain(user2);

      // Can still broadcast from server2
      await manager2.broadcast(gameId, {
        type: "server-event",
        timestamp: Date.now(),
      });
    });
  });

  describe("Load Distribution", () => {
    test("should distribute load across server instances", async () => {
      const users = Array.from({ length: 10 }, (_, i) => `user${i}`);

      // Connect users alternating between servers
      for (let i = 0; i < users.length; i++) {
        const manager = i % 2 === 0 ? manager1 : manager2;
        await manager.connect(users[i], `socket${i}`);
      }

      const stats1 = await manager1.getStats();
      const stats2 = await manager2.getStats();

      // Both should see all 10 users online
      expect(stats1.onlineUsers).toBe(10);
      expect(stats2.onlineUsers).toBe(10);

      // Connections should be distributed
      expect(stats1.totalConnections).toBeGreaterThan(0);
      expect(stats2.totalConnections).toBeGreaterThan(0);
    });

    test("should handle multiple games across servers", async () => {
      const games = ["game1", "game2", "game3"];
      const users = ["user1", "user2", "user3"];

      // Connect all users
      for (let i = 0; i < users.length; i++) {
        const manager = i % 2 === 0 ? manager1 : manager2;
        await manager.connect(users[i], `socket${i}`);
      }

      // Distribute users across games
      await manager1.joinGame(users[0], games[0]);
      await manager2.joinGame(users[1], games[1]);
      await manager1.joinGame(users[2], games[2]);

      // Check stats
      const stats1 = await manager1.getStats();
      const stats2 = await manager2.getStats();

      // Both should see all active games
      expect(stats1.activeGames).toBe(3);
      expect(stats2.activeGames).toBe(3);
    });
  });

  describe("Rate Limiting Scenarios", () => {
    test("should handle rapid connections and disconnections", async () => {
      const userId = "user1";
      const socketIds = Array.from({ length: 5 }, (_, i) => `socket${i}`);

      // Rapid connections
      for (const socketId of socketIds) {
        await manager1.connect(userId, socketId);
      }

      const statsAfterConnect = await manager1.getStats();
      expect(statsAfterConnect.totalConnections).toBe(5);

      // Rapid disconnections
      for (const socketId of socketIds) {
        await manager1.disconnect(userId, socketId);
      }

      const statsAfterDisconnect = await manager1.getStats();
      expect(statsAfterDisconnect.totalConnections).toBe(0);
      expect(statsAfterDisconnect.onlineUsers).toBe(0);
    });

    test("should handle multiple join/leave operations", async () => {
      const userId = "user1";
      const gameIds = Array.from({ length: 3 }, (_, i) => `game${i}`);

      await manager1.connect(userId, "socket1");

      // Join multiple games
      for (const gameId of gameIds) {
        await manager1.joinGame(userId, gameId);
      }

      // Verify user is in all games
      for (const gameId of gameIds) {
        const players = await manager1.getOnlinePlayers(gameId);
        expect(players).toContain(userId);
      }

      // Leave all games
      for (const gameId of gameIds) {
        await manager1.leaveGame(userId, gameId);
      }

      // Verify user is not in any games
      for (const gameId of gameIds) {
        const players = await manager1.getOnlinePlayers(gameId);
        expect(players).not.toContain(userId);
      }
    });
  });
});
