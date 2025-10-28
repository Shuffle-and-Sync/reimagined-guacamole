import { nanoid } from "nanoid";
import { RedisClientType, createClient } from "redis";
import { logger } from "../logger";

/**
 * Game event types for pub/sub messaging
 */
export interface GameEvent {
  type: string;
  userId?: string;
  gameId?: string;
  data?: unknown;
  timestamp: number;
  serverInstance?: string;
}

/**
 * Game session stored in Redis
 */
export interface GameSession {
  id: string;
  players: string[];
  spectators: string[];
  state: "waiting" | "active" | "paused" | "completed";
  createdAt: number;
  lastActivity: number;
  serverInstance: string;
}

/**
 * Player connection information
 */
export interface PlayerConnection {
  userId: string;
  socketId: string;
  gameIds: string[];
  lastSeen: number;
  serverInstance: string;
}

/**
 * Connection manager interface for distributed connections
 */
export interface ConnectionManager {
  connect(userId: string, socketId: string): Promise<void>;
  disconnect(userId: string, socketId: string): Promise<void>;
  joinGame(userId: string, gameId: string): Promise<void>;
  leaveGame(userId: string, gameId: string): Promise<void>;
  getOnlinePlayers(gameId: string): Promise<string[]>;
  broadcast(gameId: string, event: GameEvent): Promise<void>;
}

/**
 * Redis-based distributed connection manager
 * Handles real-time game sessions across multiple server instances
 */
export class RedisConnectionManager implements ConnectionManager {
  private redis: RedisClientType;
  private pubClient: RedisClientType;
  private subClient: RedisClientType;
  private serverInstanceId: string;
  private heartbeatInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private isInitialized = false;
  private eventHandlers = new Map<string, (event: GameEvent) => void>();

  constructor(redisUrl?: string) {
    this.serverInstanceId = nanoid();

    const config = redisUrl
      ? { url: redisUrl }
      : {
          socket: {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            connectTimeout: 10000,
          },
          password: process.env.REDIS_PASSWORD,
          database: parseInt(process.env.REDIS_DB || "0"),
        };

    this.redis = createClient(config);
    this.pubClient = createClient(config);
    this.subClient = createClient(config);

    this.setupErrorHandlers();
  }

  /**
   * Initialize the connection manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await Promise.all([
        this.redis.connect(),
        this.pubClient.connect(),
        this.subClient.connect(),
      ]);

      this.setupSubscriptions();
      this.setupHeartbeat();
      this.setupCleanup();
      this.isInitialized = true;

      logger.info("Redis connection manager initialized", {
        serverInstanceId: this.serverInstanceId,
      });
    } catch (error) {
      logger.error("Failed to initialize Redis connection manager", { error });
      throw error;
    }
  }

  /**
   * Setup error handlers for Redis clients
   */
  private setupErrorHandlers(): void {
    this.redis.on("error", (error) => {
      logger.error("Redis client error", { error });
    });

    this.pubClient.on("error", (error) => {
      logger.error("Redis pub client error", { error });
    });

    this.subClient.on("error", (error) => {
      logger.error("Redis sub client error", { error });
    });
  }

  /**
   * Setup pub/sub subscriptions
   */
  private setupSubscriptions(): void {
    // Listen for game event broadcasts
    this.subClient.on("message", (channel: string, message: string) => {
      try {
        const event: GameEvent = JSON.parse(message);

        // Don't process events from our own instance unless explicitly needed
        if (event.serverInstance === this.serverInstanceId) {
          return;
        }

        const handler = this.eventHandlers.get(channel);
        if (handler) {
          handler(event);
        }

        logger.debug("Received game event", { channel, event });
      } catch (error) {
        logger.error("Error processing game event", { error, channel });
      }
    });
  }

  /**
   * Setup heartbeat to keep server instance alive
   */
  private setupHeartbeat(): void {
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.redis.setEx(
          `server:${this.serverInstanceId}:heartbeat`,
          60, // TTL 60 seconds
          Date.now().toString(),
        );
      } catch (error) {
        logger.error("Heartbeat failed", { error });
      }
    }, 30 * 1000);
  }

  /**
   * Setup periodic cleanup of stale connections
   */
  private setupCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      async () => {
        await this.cleanupStaleConnections();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Register a new connection
   */
  async connect(userId: string, socketId: string): Promise<void> {
    const connection: PlayerConnection = {
      userId,
      socketId,
      gameIds: [],
      lastSeen: Date.now(),
      serverInstance: this.serverInstanceId,
    };

    // Store connection
    await this.redis.hSet(
      `connections:${userId}`,
      socketId,
      JSON.stringify(connection),
    );

    // Add to online users set
    await this.redis.sAdd("online:users", userId);

    // Set expiry (1 hour)
    await this.redis.expire(`connections:${userId}`, 3600);

    // Publish presence event
    await this.publishPresence(userId, "online");

    logger.debug("User connected", { userId, socketId });
  }

  /**
   * Disconnect a connection
   */
  async disconnect(userId: string, socketId: string): Promise<void> {
    // Get connection info
    const connStr = await this.redis.hGet(`connections:${userId}`, socketId);

    if (!connStr) {
      return;
    }

    const conn: PlayerConnection = JSON.parse(connStr);

    // Leave all games
    for (const gameId of conn.gameIds) {
      await this.leaveGame(userId, gameId);
    }

    // Remove connection
    await this.redis.hDel(`connections:${userId}`, socketId);

    // Check if user has other connections
    const remainingConns = await this.redis.hKeys(`connections:${userId}`);

    if (remainingConns.length === 0) {
      await this.redis.sRem("online:users", userId);
      await this.publishPresence(userId, "offline");
    }

    logger.debug("User disconnected", { userId, socketId });
  }

  /**
   * Join a game room
   */
  async joinGame(userId: string, gameId: string): Promise<void> {
    // Add user to game's player list
    await this.redis.sAdd(`game:${gameId}:players`, userId);

    // Update game session
    await this.updateGameActivity(gameId);

    // Add game to user's game list
    const socketIds = await this.redis.hKeys(`connections:${userId}`);

    for (const socketId of socketIds) {
      const connStr = await this.redis.hGet(`connections:${userId}`, socketId);
      if (!connStr) continue;

      const conn: PlayerConnection = JSON.parse(connStr);
      if (!conn.gameIds.includes(gameId)) {
        conn.gameIds.push(gameId);
      }

      await this.redis.hSet(
        `connections:${userId}`,
        socketId,
        JSON.stringify(conn),
      );
    }

    // Subscribe to game events
    await this.subClient.subscribe(`game:${gameId}:events`, () => {
      logger.debug("Subscribed to game events", { gameId });
    });

    // Publish join event
    await this.broadcast(gameId, {
      type: "player-joined",
      userId,
      gameId,
      timestamp: Date.now(),
    });

    logger.info("User joined game", { userId, gameId });
  }

  /**
   * Leave a game room
   */
  async leaveGame(userId: string, gameId: string): Promise<void> {
    // Remove from game's player list
    await this.redis.sRem(`game:${gameId}:players`, userId);

    // Remove game from user's connections
    const socketIds = await this.redis.hKeys(`connections:${userId}`);

    for (const socketId of socketIds) {
      const connStr = await this.redis.hGet(`connections:${userId}`, socketId);
      if (!connStr) continue;

      const conn: PlayerConnection = JSON.parse(connStr);
      conn.gameIds = conn.gameIds.filter((id) => id !== gameId);

      await this.redis.hSet(
        `connections:${userId}`,
        socketId,
        JSON.stringify(conn),
      );
    }

    // Publish leave event
    await this.broadcast(gameId, {
      type: "player-left",
      userId,
      gameId,
      timestamp: Date.now(),
    });

    // Check if game is empty
    const remainingPlayers = await this.redis.sMembers(
      `game:${gameId}:players`,
    );

    if (remainingPlayers.length === 0) {
      await this.cleanupGame(gameId);
    }

    logger.info("User left game", { userId, gameId });
  }

  /**
   * Get online players in a game
   */
  async getOnlinePlayers(gameId: string): Promise<string[]> {
    const players = await this.redis.sMembers(`game:${gameId}:players`);

    // Filter to only return players that are actually online
    const onlinePlayers: string[] = [];
    for (const userId of players) {
      const isOnline = await this.redis.sIsMember("online:users", userId);
      if (isOnline) {
        onlinePlayers.push(userId);
      }
    }

    return onlinePlayers;
  }

  /**
   * Broadcast event to all players in a game
   */
  async broadcast(gameId: string, event: GameEvent): Promise<void> {
    event.serverInstance = this.serverInstanceId;
    event.timestamp = event.timestamp || Date.now();

    await this.pubClient.publish(
      `game:${gameId}:events`,
      JSON.stringify(event),
    );

    logger.debug("Broadcast game event", { gameId, event: event.type });
  }

  /**
   * Register event handler for game events
   */
  onGameEvent(gameId: string, handler: (event: GameEvent) => void): void {
    this.eventHandlers.set(`game:${gameId}:events`, handler);
  }

  /**
   * Update game activity timestamp
   */
  private async updateGameActivity(gameId: string): Promise<void> {
    const sessionKey = `game:${gameId}:session`;
    const sessionStr = await this.redis.get(sessionKey);

    let session: GameSession;
    if (sessionStr) {
      session = JSON.parse(sessionStr);
      session.lastActivity = Date.now();
    } else {
      // Create new session
      session = {
        id: gameId,
        players: [],
        spectators: [],
        state: "waiting",
        createdAt: Date.now(),
        lastActivity: Date.now(),
        serverInstance: this.serverInstanceId,
      };
    }

    await this.redis.setEx(sessionKey, 7200, JSON.stringify(session)); // 2 hour TTL
  }

  /**
   * Publish presence event
   */
  private async publishPresence(
    userId: string,
    status: "online" | "offline",
  ): Promise<void> {
    await this.pubClient.publish(
      "presence:updates",
      JSON.stringify({
        userId,
        status,
        timestamp: Date.now(),
        serverInstance: this.serverInstanceId,
      }),
    );
  }

  /**
   * Cleanup empty game
   */
  private async cleanupGame(gameId: string): Promise<void> {
    // Unsubscribe from game events
    await this.subClient.unsubscribe(`game:${gameId}:events`);

    // Delete game session
    await this.redis.del(`game:${gameId}:session`);

    // Delete player list
    await this.redis.del(`game:${gameId}:players`);

    logger.info("Game cleaned up", { gameId });
  }

  /**
   * Cleanup stale connections
   */
  private async cleanupStaleConnections(): Promise<void> {
    try {
      const now = Date.now();
      const staleThreshold = 30 * 60 * 1000; // 30 minutes

      // Get all online users
      const onlineUsers = await this.redis.sMembers("online:users");

      for (const userId of onlineUsers) {
        const socketIds = await this.redis.hKeys(`connections:${userId}`);
        let hasActiveConnection = false;

        for (const socketId of socketIds) {
          const connStr = await this.redis.hGet(
            `connections:${userId}`,
            socketId,
          );
          if (!connStr) continue;

          const conn: PlayerConnection = JSON.parse(connStr);

          // Check if connection is stale
          if (now - conn.lastSeen > staleThreshold) {
            await this.disconnect(userId, socketId);
          } else {
            hasActiveConnection = true;
          }
        }

        // If no active connections, remove from online users
        if (!hasActiveConnection) {
          await this.redis.sRem("online:users", userId);
        }
      }

      logger.debug("Stale connections cleanup completed");
    } catch (error) {
      logger.error("Error during stale connections cleanup", { error });
    }
  }

  /**
   * Get connection stats
   */
  async getStats(): Promise<{
    onlineUsers: number;
    activeGames: number;
    totalConnections: number;
  }> {
    const onlineUsers = await this.redis.sCard("online:users");
    const keys = await this.redis.keys("game:*:players");
    const activeGames = keys.length;

    let totalConnections = 0;
    const users = await this.redis.sMembers("online:users");
    for (const userId of users) {
      const conns = await this.redis.hLen(`connections:${userId}`);
      totalConnections += conns;
    }

    return {
      onlineUsers,
      activeGames,
      totalConnections,
    };
  }

  /**
   * Gracefully shutdown
   */
  async shutdown(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Remove server instance heartbeat
    await this.redis.del(`server:${this.serverInstanceId}:heartbeat`);

    // Close all connections
    await Promise.all([
      this.redis.quit(),
      this.pubClient.quit(),
      this.subClient.quit(),
    ]);

    this.isInitialized = false;

    logger.info("Redis connection manager shutdown", {
      serverInstanceId: this.serverInstanceId,
    });
  }
}

// Export singleton instance (optional - can be initialized per need)
let connectionManagerInstance: RedisConnectionManager | null = null;

export function getConnectionManager(
  redisUrl?: string,
): RedisConnectionManager {
  if (!connectionManagerInstance) {
    connectionManagerInstance = new RedisConnectionManager(redisUrl);
  }
  return connectionManagerInstance;
}

export async function initializeConnectionManager(
  redisUrl?: string,
): Promise<RedisConnectionManager> {
  const manager = getConnectionManager(redisUrl);
  await manager.initialize();
  return manager;
}
