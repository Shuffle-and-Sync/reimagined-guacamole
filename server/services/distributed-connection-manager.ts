/**
 * Distributed Connection Manager
 *
 * Implements Redis-based distributed connection management for horizontal scaling.
 * This manager coordinates between multiple server instances, tracking which server
 * owns each connection and routing messages appropriately.
 *
 * Redis Data Structures:
 * - connections:{connectionId} -> hash {userId, serverId, timestamp}
 * - rooms:{sessionId} -> set of connectionIds
 * - servers:{serverId} -> hash {host, port, lastHeartbeat}
 *
 * Pub/Sub Channels:
 * - room:{sessionId} -> broadcasts to all room members
 * - server:{serverId} -> direct server messages
 */

import { nanoid } from "nanoid";
import { RedisClientType, createClient } from "redis";
import { logger } from "../logger";
import {
  ExtendedWebSocket,
  WebSocketConnectionManager,
} from "../utils/websocket-connection-manager";

/**
 * Server metadata stored in Redis
 */
export interface ServerInfo {
  serverId: string;
  host: string;
  port: number;
  lastHeartbeat: number;
  activeConnections: number;
}

/**
 * Connection metadata stored in Redis
 */
export interface ConnectionMetadata {
  connectionId: string;
  userId: string;
  serverId: string;
  timestamp: number;
  rooms: string[]; // List of room/session IDs this connection is in
}

/**
 * Cross-server message for routing
 */
export interface CrossServerMessage {
  type: "broadcast" | "direct" | "server-control";
  targetServerId?: string;
  targetConnectionId?: string;
  roomId?: string;
  payload: unknown;
  timestamp: number;
  sourceServerId: string;
}

/**
 * Distributed connection manager options
 */
export interface DistributedConnectionManagerOptions {
  redisUrl?: string;
  serverId?: string;
  serverHost?: string;
  serverPort?: number;
  heartbeatInterval?: number; // ms
  heartbeatTTL?: number; // seconds
  staleConnectionTimeout?: number; // ms
  cleanupInterval?: number; // ms
}

/**
 * DistributedConnectionManager
 *
 * Manages WebSocket connections across multiple server instances using Redis
 * for coordination. Local connections are managed by WebSocketConnectionManager
 * while distributed state is tracked in Redis.
 */
export class DistributedConnectionManager {
  private redis: RedisClientType;
  private pubClient: RedisClientType;
  private subClient: RedisClientType;
  private serverId: string;
  private serverHost: string;
  private serverPort: number;
  private localConnectionManager: WebSocketConnectionManager;
  private isInitialized = false;
  private heartbeatInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private heartbeatIntervalMs: number;
  private heartbeatTTL: number;
  private staleConnectionTimeout: number;
  private cleanupIntervalMs: number;

  // Track subscriptions to avoid duplicates
  private roomSubscriptions = new Set<string>();

  constructor(
    localConnectionManager: WebSocketConnectionManager,
    options: DistributedConnectionManagerOptions = {},
  ) {
    this.localConnectionManager = localConnectionManager;
    this.serverId = options.serverId || nanoid();
    this.serverHost =
      options.serverHost || process.env.SERVER_HOST || "localhost";
    this.serverPort =
      options.serverPort || parseInt(process.env.PORT || "3000");
    this.heartbeatIntervalMs = options.heartbeatInterval || 30000; // 30 seconds
    this.heartbeatTTL = options.heartbeatTTL || 90; // 90 seconds (3x heartbeat)
    this.staleConnectionTimeout =
      options.staleConnectionTimeout || 30 * 60 * 1000; // 30 min
    this.cleanupIntervalMs = options.cleanupInterval || 5 * 60 * 1000; // 5 minutes

    // Configure Redis clients
    const redisConfig = options.redisUrl
      ? { url: options.redisUrl }
      : {
          socket: {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            connectTimeout: 10000,
          },
          password: process.env.REDIS_PASSWORD,
          database: parseInt(process.env.REDIS_DB || "0"),
        };

    this.redis = createClient(redisConfig);
    this.pubClient = createClient(redisConfig);
    this.subClient = createClient(redisConfig);

    this.setupErrorHandlers();
  }

  /**
   * Initialize the distributed connection manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn("DistributedConnectionManager already initialized");
      return;
    }

    try {
      // Connect all Redis clients
      await Promise.all([
        this.redis.connect(),
        this.pubClient.connect(),
        this.subClient.connect(),
      ]);

      // Register this server instance
      await this.registerServer();

      // Setup subscriptions
      await this.setupSubscriptions();

      // Start heartbeat and cleanup
      this.startHeartbeat();
      this.startCleanup();

      this.isInitialized = true;

      logger.info("DistributedConnectionManager initialized", {
        serverId: this.serverId,
        host: this.serverHost,
        port: this.serverPort,
      });
    } catch (error) {
      logger.error("Failed to initialize DistributedConnectionManager", {
        error,
      });
      throw error;
    }
  }

  /**
   * Register a new WebSocket connection
   */
  async registerConnection(
    ws: ExtendedWebSocket,
    userId: string,
    authToken?: string,
  ): Promise<string> {
    // First register with local connection manager
    const connectionId = this.localConnectionManager.registerConnection(
      ws,
      userId,
      authToken,
    );

    // Then register in Redis for distributed tracking
    const metadata: ConnectionMetadata = {
      connectionId,
      userId,
      serverId: this.serverId,
      timestamp: Date.now(),
      rooms: [],
    };

    await this.redis.hSet(`connections:${connectionId}`, {
      userId,
      serverId: this.serverId,
      timestamp: metadata.timestamp.toString(),
      rooms: JSON.stringify(metadata.rooms),
    });

    // Set TTL on connection metadata
    await this.redis.expire(`connections:${connectionId}`, 3600); // 1 hour

    // Update server active connections count
    await this.updateServerConnectionCount(1);

    logger.debug("Connection registered in distributed system", {
      connectionId,
      userId,
      serverId: this.serverId,
    });

    return connectionId;
  }

  /**
   * Remove a connection from distributed tracking
   */
  async removeConnection(connectionId: string): Promise<void> {
    // Get connection metadata before removing
    const metadata = await this.getConnectionMetadata(connectionId);

    if (metadata) {
      // Leave all rooms
      for (const roomId of metadata.rooms) {
        await this.leaveRoom(connectionId, roomId);
      }
    }

    // Remove from Redis
    await this.redis.del(`connections:${connectionId}`);

    // Update server connection count
    await this.updateServerConnectionCount(-1);

    // Remove from local manager
    this.localConnectionManager.removeConnection(connectionId);

    logger.debug("Connection removed from distributed system", {
      connectionId,
      serverId: this.serverId,
    });
  }

  /**
   * Add connection to a room (game session or collaborative stream)
   */
  async joinRoom(connectionId: string, roomId: string): Promise<boolean> {
    // Join locally first
    const localSuccess = await this.localConnectionManager.joinGameRoom(
      connectionId,
      roomId,
    );

    if (!localSuccess) {
      return false;
    }

    // Add to Redis room set
    await this.redis.sAdd(`rooms:${roomId}`, connectionId);

    // Update connection metadata
    const metadata = await this.getConnectionMetadata(connectionId);
    if (metadata) {
      metadata.rooms.push(roomId);
      await this.redis.hSet(`connections:${connectionId}`, {
        rooms: JSON.stringify(metadata.rooms),
      });
    }

    // Subscribe to room channel if not already subscribed
    if (!this.roomSubscriptions.has(roomId)) {
      await this.subscribeToRoom(roomId);
    }

    logger.info("Connection joined room in distributed system", {
      connectionId,
      roomId,
      serverId: this.serverId,
    });

    return true;
  }

  /**
   * Remove connection from a room
   */
  async leaveRoom(connectionId: string, roomId: string): Promise<void> {
    // Remove from Redis room set
    await this.redis.sRem(`rooms:${roomId}`, connectionId);

    // Update connection metadata
    const metadata = await this.getConnectionMetadata(connectionId);
    if (metadata) {
      metadata.rooms = metadata.rooms.filter((r) => r !== roomId);
      await this.redis.hSet(`connections:${connectionId}`, {
        rooms: JSON.stringify(metadata.rooms),
      });
    }

    // Check if room is empty
    const roomSize = await this.redis.sCard(`rooms:${roomId}`);
    if (roomSize === 0) {
      // Cleanup empty room
      await this.redis.del(`rooms:${roomId}`);
      // Note: We keep subscription active for potential future joins
    }

    logger.debug("Connection left room in distributed system", {
      connectionId,
      roomId,
    });
  }

  /**
   * Broadcast message to all connections in a room across all servers
   */
  async broadcastToRoom(
    roomId: string,
    message: unknown,
    excludeConnectionId?: string,
  ): Promise<void> {
    const crossServerMsg: CrossServerMessage = {
      type: "broadcast",
      roomId,
      payload: message,
      timestamp: Date.now(),
      sourceServerId: this.serverId,
    };

    // Publish to room channel - all servers subscribed to this room will receive it
    await this.pubClient.publish(
      `room:${roomId}`,
      JSON.stringify(crossServerMsg),
    );

    logger.debug("Broadcast message to room", {
      roomId,
      serverId: this.serverId,
      excludeConnectionId,
    });
  }

  /**
   * Send message directly to a specific connection
   * Routes to the appropriate server if not local
   */
  async sendToConnection(
    connectionId: string,
    message: unknown,
  ): Promise<boolean> {
    const metadata = await this.getConnectionMetadata(connectionId);

    if (!metadata) {
      logger.warn("Connection not found", { connectionId });
      return false;
    }

    // Check if connection is on this server
    if (metadata.serverId === this.serverId) {
      // Send directly via local manager
      const connections =
        this.localConnectionManager.getGameRoomConnections(connectionId);
      if (connections.length > 0) {
        const ws = connections[0];
        if (ws && ws.readyState === 1) {
          // OPEN
          ws.send(JSON.stringify(message));
          return true;
        }
      }
      return false;
    } else {
      // Route to appropriate server via pub/sub
      const crossServerMsg: CrossServerMessage = {
        type: "direct",
        targetServerId: metadata.serverId,
        targetConnectionId: connectionId,
        payload: message,
        timestamp: Date.now(),
        sourceServerId: this.serverId,
      };

      await this.pubClient.publish(
        `server:${metadata.serverId}`,
        JSON.stringify(crossServerMsg),
      );

      logger.debug("Routed message to remote server", {
        connectionId,
        targetServerId: metadata.serverId,
      });

      return true;
    }
  }

  /**
   * Get all connections in a room across all servers
   */
  async getRoomConnections(roomId: string): Promise<ConnectionMetadata[]> {
    const connectionIds = await this.redis.sMembers(`rooms:${roomId}`);
    const connections: ConnectionMetadata[] = [];

    for (const connectionId of connectionIds) {
      const metadata = await this.getConnectionMetadata(connectionId);
      if (metadata) {
        connections.push(metadata);
      }
    }

    return connections;
  }

  /**
   * Get metadata for a specific connection
   */
  async getConnectionMetadata(
    connectionId: string,
  ): Promise<ConnectionMetadata | null> {
    const data = await this.redis.hGetAll(`connections:${connectionId}`);

    if (!data || !data.userId) {
      return null;
    }

    return {
      connectionId,
      userId: data.userId,
      serverId: data.serverId || "",
      timestamp: parseInt(data.timestamp || "0"),
      rooms: JSON.parse(data.rooms || "[]"),
    };
  }

  /**
   * Get list of active servers
   */
  async getActiveServers(): Promise<ServerInfo[]> {
    const serverKeys = await this.redis.keys("servers:*");
    const servers: ServerInfo[] = [];

    for (const key of serverKeys) {
      const data = await this.redis.hGetAll(key);
      if (data && data.serverId) {
        servers.push({
          serverId: data.serverId,
          host: data.host || "",
          port: parseInt(data.port || "0"),
          lastHeartbeat: parseInt(data.lastHeartbeat || "0"),
          activeConnections: parseInt(data.activeConnections || "0"),
        });
      }
    }

    return servers;
  }

  /**
   * Get statistics about distributed connections
   */
  async getDistributedStats(): Promise<{
    totalConnections: number;
    totalRooms: number;
    activeServers: number;
    localConnections: number;
    serverStats: ServerInfo[];
  }> {
    const connectionKeys = await this.redis.keys("connections:*");
    const roomKeys = await this.redis.keys("rooms:*");
    const servers = await this.getActiveServers();
    const localStats = this.localConnectionManager.getStats();

    return {
      totalConnections: connectionKeys.length,
      totalRooms: roomKeys.length,
      activeServers: servers.length,
      localConnections: localStats.totalConnections,
      serverStats: servers,
    };
  }

  /**
   * Gracefully shutdown the distributed connection manager
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down DistributedConnectionManager", {
      serverId: this.serverId,
    });

    // Stop heartbeat and cleanup
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Unregister server
    await this.unregisterServer();

    // Close Redis connections
    await Promise.all([
      this.redis.quit(),
      this.pubClient.quit(),
      this.subClient.quit(),
    ]);

    this.isInitialized = false;

    logger.info("DistributedConnectionManager shutdown complete", {
      serverId: this.serverId,
    });
  }

  /**
   * Setup error handlers for Redis clients
   */
  private setupErrorHandlers(): void {
    this.redis.on("error", (error) => {
      logger.error("Redis client error", { error, serverId: this.serverId });
    });

    this.pubClient.on("error", (error) => {
      logger.error("Redis pub client error", {
        error,
        serverId: this.serverId,
      });
    });

    this.subClient.on("error", (error) => {
      logger.error("Redis sub client error", {
        error,
        serverId: this.serverId,
      });
    });
  }

  /**
   * Setup pub/sub subscriptions
   */
  private async setupSubscriptions(): Promise<void> {
    // Subscribe to server-specific channel for direct messages
    await this.subClient.subscribe(
      `server:${this.serverId}`,
      this.handleServerMessage.bind(this),
    );

    logger.debug("Subscribed to server channel", {
      channel: `server:${this.serverId}`,
    });
  }

  /**
   * Subscribe to a room channel
   */
  private async subscribeToRoom(roomId: string): Promise<void> {
    if (this.roomSubscriptions.has(roomId)) {
      return;
    }

    await this.subClient.subscribe(
      `room:${roomId}`,
      this.handleRoomMessage.bind(this),
    );

    this.roomSubscriptions.add(roomId);

    logger.debug("Subscribed to room channel", { roomId });
  }

  /**
   * Handle messages on server channel
   */
  private async handleServerMessage(
    message: string,
    channel: string,
  ): Promise<void> {
    try {
      const msg: CrossServerMessage = JSON.parse(message);

      // Ignore messages from self
      if (msg.sourceServerId === this.serverId) {
        return;
      }

      if (msg.type === "direct" && msg.targetConnectionId) {
        // Direct message to a specific connection on this server
        const ws = this.localConnectionManager.getGameRoomConnections(
          msg.targetConnectionId,
        )[0];

        if (ws && ws.readyState === 1) {
          ws.send(JSON.stringify(msg.payload));
        }
      } else if (msg.type === "server-control") {
        // Handle server control messages (future: load balancing, etc.)
        logger.debug("Received server control message", { msg });
      }
    } catch (error) {
      logger.error("Error handling server message", { error, channel });
    }
  }

  /**
   * Handle messages on room channel
   */
  private async handleRoomMessage(
    message: string,
    channel: string,
  ): Promise<void> {
    try {
      const msg: CrossServerMessage = JSON.parse(message);

      // Ignore messages from self
      if (msg.sourceServerId === this.serverId) {
        return;
      }

      if (msg.type === "broadcast" && msg.roomId) {
        // Broadcast to all local connections in this room
        this.localConnectionManager.broadcastToGameRoom(
          msg.roomId,
          msg.payload,
        );
      }
    } catch (error) {
      logger.error("Error handling room message", { error, channel });
    }
  }

  /**
   * Register this server instance in Redis
   */
  private async registerServer(): Promise<void> {
    const serverInfo: ServerInfo = {
      serverId: this.serverId,
      host: this.serverHost,
      port: this.serverPort,
      lastHeartbeat: Date.now(),
      activeConnections: 0,
    };

    await this.redis.hSet(`servers:${this.serverId}`, {
      serverId: this.serverId,
      host: this.serverHost,
      port: this.serverPort.toString(),
      lastHeartbeat: serverInfo.lastHeartbeat.toString(),
      activeConnections: "0",
    });

    // Set TTL slightly longer than heartbeat interval
    await this.redis.expire(`servers:${this.serverId}`, this.heartbeatTTL);

    logger.info("Server registered in distributed system", {
      serverId: this.serverId,
    });
  }

  /**
   * Unregister this server instance from Redis
   */
  private async unregisterServer(): Promise<void> {
    await this.redis.del(`servers:${this.serverId}`);
    logger.info("Server unregistered from distributed system", {
      serverId: this.serverId,
    });
  }

  /**
   * Send heartbeat to keep server registration alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.redis.hSet(`servers:${this.serverId}`, {
          lastHeartbeat: Date.now().toString(),
        });

        // Refresh TTL
        await this.redis.expire(`servers:${this.serverId}`, this.heartbeatTTL);

        logger.debug("Heartbeat sent", { serverId: this.serverId });
      } catch (error) {
        logger.error("Heartbeat failed", { error, serverId: this.serverId });
      }
    }, this.heartbeatIntervalMs);
  }

  /**
   * Start periodic cleanup of stale connections and failed servers
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupStaleConnections();
      await this.detectFailedServers();
    }, this.cleanupIntervalMs);
  }

  /**
   * Clean up stale connections that haven't been updated
   */
  private async cleanupStaleConnections(): Promise<void> {
    try {
      const now = Date.now();
      const connectionKeys = await this.redis.keys("connections:*");
      let cleanedCount = 0;

      for (const key of connectionKeys) {
        const data = await this.redis.hGetAll(key);
        const timestamp = parseInt(data.timestamp || "0");

        if (now - timestamp > this.staleConnectionTimeout) {
          const connectionId = key.replace("connections:", "");
          await this.removeConnection(connectionId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info("Cleaned up stale connections", {
          count: cleanedCount,
          serverId: this.serverId,
        });
      }
    } catch (error) {
      logger.error("Error cleaning stale connections", {
        error,
        serverId: this.serverId,
      });
    }
  }

  /**
   * Detect and handle failed servers
   */
  private async detectFailedServers(): Promise<void> {
    try {
      const servers = await this.getActiveServers();
      const now = Date.now();
      const failureThreshold = this.heartbeatTTL * 1000; // Convert to ms

      for (const server of servers) {
        if (
          server.serverId !== this.serverId &&
          now - server.lastHeartbeat > failureThreshold
        ) {
          logger.warn("Detected failed server", {
            failedServerId: server.serverId,
            lastHeartbeat: server.lastHeartbeat,
          });

          // Handle server failure: reassign or clean up connections
          await this.handleServerFailure(server.serverId);
        }
      }
    } catch (error) {
      logger.error("Error detecting failed servers", {
        error,
        serverId: this.serverId,
      });
    }
  }

  /**
   * Handle server failure by cleaning up its connections
   */
  private async handleServerFailure(failedServerId: string): Promise<void> {
    logger.info("Handling server failure", {
      failedServerId,
      currentServerId: this.serverId,
    });

    // Find all connections from failed server
    const connectionKeys = await this.redis.keys("connections:*");
    let cleanedCount = 0;

    for (const key of connectionKeys) {
      const data = await this.redis.hGetAll(key);

      if (data.serverId === failedServerId) {
        const connectionId = key.replace("connections:", "");

        // Remove connection from all rooms
        const rooms = JSON.parse(data.rooms || "[]");
        for (const roomId of rooms) {
          await this.redis.sRem(`rooms:${roomId}`, connectionId);
        }

        // Remove connection metadata
        await this.redis.del(key);
        cleanedCount++;
      }
    }

    // Remove failed server entry
    await this.redis.del(`servers:${failedServerId}`);

    logger.info("Server failure handled", {
      failedServerId,
      connectionsCleanedUp: cleanedCount,
    });
  }

  /**
   * Update server's active connection count
   */
  private async updateServerConnectionCount(delta: number): Promise<void> {
    const current = await this.redis.hGet(
      `servers:${this.serverId}`,
      "activeConnections",
    );
    const newCount = Math.max(0, parseInt(current ?? "0") + delta);

    await this.redis.hSet(`servers:${this.serverId}`, {
      activeConnections: newCount.toString(),
    });
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return this.serverId;
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get local connection manager (for backward compatibility)
   */
  getLocalManager(): WebSocketConnectionManager {
    return this.localConnectionManager;
  }
}

// Export factory function for easy initialization
export async function createDistributedConnectionManager(
  localConnectionManager: WebSocketConnectionManager,
  options: DistributedConnectionManagerOptions = {},
): Promise<DistributedConnectionManager> {
  const manager = new DistributedConnectionManager(
    localConnectionManager,
    options,
  );
  await manager.initialize();
  return manager;
}
