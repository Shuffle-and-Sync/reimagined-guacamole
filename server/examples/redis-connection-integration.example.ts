/**
 * Example Integration: Distributed Connection Manager with WebSocket Server
 *
 * This example demonstrates how to integrate the DistributedConnectionManager
 * with the existing WebSocket server for real-time game coordination across
 * multiple server instances using Redis for distributed state management.
 */

import { Server as HttpServer } from "http";
import { logger } from "../logger";
import { createDistributedConnectionManager } from "../services/distributed-connection-manager";
import { connectionManager } from "../utils/websocket-connection-manager";
import { EnhancedWebSocketServer } from "../utils/websocket-server-enhanced";

/**
 * Initialize distributed connection management for WebSocket server
 */
export async function setupDistributedConnections(httpServer: HttpServer) {
  // Initialize distributed connection manager with local WebSocket manager
  const distributedManager = await createDistributedConnectionManager(
    connectionManager,
    {
      redisUrl: process.env.REDIS_URL,
      serverHost: process.env.SERVER_HOST,
      serverPort: parseInt(process.env.PORT || "3000"),
    },
  );

  logger.info("Distributed connection manager initialized", {
    serverId: distributedManager.getServerId(),
  });

  // Initialize WebSocket server
  const wsServer = new EnhancedWebSocketServer(httpServer);

  /**
   * Extended WebSocket message handler
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wsServer.on("message", async (ws: any, data: any) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "join-game":
          await handleJoinGame(ws, message.gameId);
          break;

        case "leave-game":
          await handleLeaveGame(ws, message.gameId);
          break;

        case "game-action":
          await handleGameAction(ws, message);
          break;

        default:
          logger.warn("Unknown message type", { type: message.type });
      }
    } catch (error) {
      logger.error("Error handling WebSocket message", { error });
    }
  });

  /**
   * Handle user joining a game
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleJoinGame(ws: any, gameId: string) {
    try {
      const userId = ws.userId;
      const connectionId = ws.connectionId;

      if (!userId || !gameId || !connectionId) {
        logger.warn("Missing userId, gameId, or connectionId", {
          userId,
          gameId,
          connectionId,
        });
        return;
      }

      // Join the room in the distributed manager
      await distributedManager.joinRoom(connectionId, gameId);

      logger.info("User joined game", { userId, gameId, connectionId });

      // Notify user of successful join
      ws.send(
        JSON.stringify({
          type: "game-joined",
          gameId,
          success: true,
        }),
      );

      // Get and send current online players from distributed system
      const roomConnections =
        await distributedManager.getRoomConnections(gameId);
      ws.send(
        JSON.stringify({
          type: "online-players",
          gameId,
          players: roomConnections.map((conn) => conn.userId),
        }),
      );
    } catch (error) {
      logger.error("Error joining game", { error, gameId });
      ws.send(
        JSON.stringify({
          type: "error",
          error: "Failed to join game",
        }),
      );
    }
  }

  /**
   * Handle user leaving a game
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleLeaveGame(ws: any, gameId: string) {
    try {
      const userId = ws.userId;
      const connectionId = ws.connectionId;

      if (!userId || !gameId || !connectionId) {
        return;
      }

      // Leave the room in the distributed manager
      await distributedManager.leaveRoom(connectionId, gameId);

      logger.info("User left game", { userId, gameId, connectionId });

      ws.send(
        JSON.stringify({
          type: "game-left",
          gameId,
          success: true,
        }),
      );
    } catch (error) {
      logger.error("Error leaving game", { error, gameId });
    }
  }

  /**
   * Handle game action (e.g., play card, make move)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleGameAction(ws: any, message: any) {
    try {
      const { gameId, action, data } = message;
      const userId = ws.userId;

      if (!userId || !gameId) {
        return;
      }

      // Broadcast action to all servers via distributed manager
      await distributedManager.broadcastToRoom(gameId, {
        type: "game-action",
        userId,
        gameId,
        action,
        data,
        timestamp: Date.now(),
      });

      logger.debug("Game action broadcast", { userId, gameId, action });
    } catch (error) {
      logger.error("Error handling game action", { error });
    }
  }

  /**
   * Handle WebSocket connection
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wsServer.on("connection", async (ws: any) => {
    try {
      const userId = ws.userId;
      const connectionId = ws.connectionId;
      const authToken = ws.authToken;

      if (!userId || !connectionId) {
        logger.warn("Missing userId or connectionId on connection");
        return;
      }

      // Register with distributed manager
      await distributedManager.registerConnection(ws, userId, authToken);

      logger.info("User connected to distributed system", {
        userId,
        connectionId,
        serverId: distributedManager.getServerId(),
      });
    } catch (error) {
      logger.error("Error registering connection", { error });
    }
  });

  /**
   * Handle WebSocket disconnection
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wsServer.on("disconnect", async (ws: any) => {
    try {
      const userId = ws.userId;
      const connectionId = ws.connectionId;

      if (!userId || !connectionId) {
        return;
      }

      // Remove from distributed manager (auto-leaves all rooms)
      await distributedManager.removeConnection(connectionId);

      logger.info("User disconnected from distributed system", {
        userId,
        connectionId,
        serverId: distributedManager.getServerId(),
      });
    } catch (error) {
      logger.error("Error handling disconnection", { error });
    }
  });

  /**
   * Periodic stats logging
   */
  setInterval(async () => {
    try {
      const stats = await distributedManager.getDistributedStats();
      logger.info("Distributed connection stats", stats);
    } catch (error) {
      logger.error("Error getting connection stats", { error });
    }
  }, 60000); // Every minute

  /**
   * Graceful shutdown
   */
  process.on("SIGTERM", async () => {
    logger.info("Shutting down distributed connection manager");
    await distributedManager.shutdown();
  });

  process.on("SIGINT", async () => {
    logger.info("Shutting down distributed connection manager");
    await distributedManager.shutdown();
  });

  return {
    wsServer,
    distributedManager,
  };
}

/**
 * Example: Using the distributed connection manager programmatically
 */
export async function exampleUsage() {
  // The distributed manager wraps the local connection manager
  // It handles both local WebSocket connections and distributed coordination

  // Initialize - normally done during server startup
  const distributedManager =
    await createDistributedConnectionManager(connectionManager);

  // Get stats across all servers
  const stats = await distributedManager.getDistributedStats();
  // eslint-disable-next-line no-console
  console.log(`Total connections: ${stats.totalConnections}`);
  // eslint-disable-next-line no-console
  console.log(`Active servers: ${stats.activeServers}`);
  // eslint-disable-next-line no-console
  console.log(`Local connections: ${stats.localConnections}`);

  // Broadcast to a room (reaches all servers)
  await distributedManager.broadcastToRoom("game-456", {
    type: "game-state-update",
    data: {
      phase: "action",
      currentPlayer: "user-123",
    },
  });

  // Get all connections in a room across all servers
  const roomConnections =
    await distributedManager.getRoomConnections("game-456");
  // eslint-disable-next-line no-console
  console.log(`Players in room: ${roomConnections.length}`);

  // List active servers
  const servers = await distributedManager.getActiveServers();
  // eslint-disable-next-line no-console
  console.log(`Active servers:`, servers);

  // Shutdown
  await distributedManager.shutdown();
}

/**
 * Example: Multi-server deployment setup
 */
export function multiServerDeploymentExample() {
  /*
   * In a multi-server deployment:
   *
   * 1. Each server instance runs with the same code but different SERVER_ID
   * 2. All servers connect to the same Redis instance
   * 3. Each server manages its own WebSocket connections locally
   * 4. Redis coordinates state and routing between servers
   *
   * Environment variables per server:
   *
   * Server 1:
   * - SERVER_HOST=server1.example.com
   * - PORT=3000
   * - REDIS_URL=redis://redis.example.com:6379
   *
   * Server 2:
   * - SERVER_HOST=server2.example.com
   * - PORT=3000
   * - REDIS_URL=redis://redis.example.com:6379
   *
   * Redis handles:
   * - Connection registry (which server owns each connection)
   * - Room membership (which connections are in each room)
   * - Server health monitoring
   * - Cross-server pub/sub messaging
   *
   * Benefits:
   * - Horizontal scaling: Add more servers as needed
   * - High availability: Server failures are detected and handled
   * - Load distribution: Connections spread across servers
   * - Seamless communication: Users on different servers can interact
   */
}
