/**
 * Example Integration: Redis Connection Manager with WebSocket Server
 *
 * This example demonstrates how to integrate the Redis distributed connection
 * manager with the existing WebSocket server for real-time game coordination.
 */

import { Server as HttpServer } from "http";
import { logger } from "../logger";
import {
  initializeConnectionManager,
  getConnectionManager,
  GameEvent,
} from "../services/redis-connection-manager";
import { EnhancedWebSocketServer } from "../utils/websocket-server-enhanced";

/**
 * Initialize distributed connection management for WebSocket server
 */
export async function setupDistributedConnections(httpServer: HttpServer) {
  // Initialize Redis connection manager
  const redisManager = await initializeConnectionManager(process.env.REDIS_URL);

  logger.info("Distributed connection manager initialized");

  // Initialize WebSocket server
  const wsServer = new EnhancedWebSocketServer(httpServer);

  // Track active game subscriptions
  const gameSubscriptions = new Map<string, () => void>();

  /**
   * Setup event forwarding from Redis to WebSocket clients
   */
  function setupGameEventForwarding(gameId: string) {
    if (gameSubscriptions.has(gameId)) {
      return; // Already subscribed
    }

    // Register handler for game events from other servers
    redisManager.onGameEvent(gameId, (event: GameEvent) => {
      logger.debug("Received distributed game event", {
        gameId,
        eventType: event.type,
        fromServer: event.serverInstance,
      });

      // Get local WebSocket connections for this game
      const localConnections =
        wsServer.connectionManager.getGameRoomConnections(gameId);

      // Broadcast to all local clients
      localConnections.forEach((ws) => {
        if (ws.readyState === 1) {
          // OPEN
          ws.send(
            JSON.stringify({
              type: "game-event",
              event,
            }),
          );
        }
      });
    });

    gameSubscriptions.set(gameId, () => {
      // Cleanup function (not used in current implementation)
    });

    logger.debug("Game event forwarding setup", { gameId });
  }

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

      if (!userId || !gameId) {
        logger.warn("Missing userId or gameId", { userId, gameId });
        return;
      }

      // Register with Redis distributed manager
      await redisManager.joinGame(userId, gameId);

      // Setup event forwarding for this game
      setupGameEventForwarding(gameId);

      // Also register with local WebSocket manager
      await wsServer.connectionManager.joinGameRoom(ws.connectionId, gameId);

      logger.info("User joined game", { userId, gameId });

      // Notify user of successful join
      ws.send(
        JSON.stringify({
          type: "game-joined",
          gameId,
          success: true,
        }),
      );

      // Get and send current online players
      const onlinePlayers = await redisManager.getOnlinePlayers(gameId);
      ws.send(
        JSON.stringify({
          type: "online-players",
          gameId,
          players: onlinePlayers,
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

      if (!userId || !gameId) {
        return;
      }

      // Remove from Redis distributed manager
      await redisManager.leaveGame(userId, gameId);

      logger.info("User left game", { userId, gameId });

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

      // Broadcast action to all servers via Redis
      await redisManager.broadcast(gameId, {
        type: "game-action",
        userId,
        gameId,
        data: { action, ...data },
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
      const socketId = ws.connectionId;

      if (!userId || !socketId) {
        logger.warn("Missing userId or socketId on connection");
        return;
      }

      // Register with Redis distributed manager
      await redisManager.connect(userId, socketId);

      logger.info("User connected to distributed system", {
        userId,
        socketId,
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
      const socketId = ws.connectionId;

      if (!userId || !socketId) {
        return;
      }

      // Remove from Redis distributed manager (auto-leaves all games)
      await redisManager.disconnect(userId, socketId);

      logger.info("User disconnected from distributed system", {
        userId,
        socketId,
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
      const stats = await redisManager.getStats();
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
    await redisManager.shutdown();
  });

  process.on("SIGINT", async () => {
    logger.info("Shutting down distributed connection manager");
    await redisManager.shutdown();
  });

  return {
    wsServer,
    redisManager,
  };
}

/**
 * Example: Using the distributed connection manager programmatically
 */
export async function exampleUsage() {
  const manager = getConnectionManager();

  // Connect a user
  await manager.connect("user-123", "socket-abc");

  // Join a game
  await manager.joinGame("user-123", "game-456");

  // Get online players
  const players = await manager.getOnlinePlayers("game-456");
  // eslint-disable-next-line no-console
  console.log(`${players.length} players online`);

  // Broadcast an event
  await manager.broadcast("game-456", {
    type: "game-state-update",
    data: {
      phase: "action",
      currentPlayer: "user-123",
    },
    timestamp: Date.now(),
  });

  // Register event handler
  manager.onGameEvent("game-456", (event) => {
    // eslint-disable-next-line no-console
    console.log(`Received event: ${event.type}`, event);
  });

  // Leave game
  await manager.leaveGame("user-123", "game-456");

  // Disconnect
  await manager.disconnect("user-123", "socket-abc");
}

/**
 * Example: Game-specific event handling
 */
export function setupGameEventHandlers(gameId: string) {
  const manager = getConnectionManager();

  manager.onGameEvent(gameId, (event) => {
    switch (event.type) {
      case "player-joined":
        // eslint-disable-next-line no-console
        console.log(`Player ${event.userId} joined game ${gameId}`);
        // Update UI, send notifications, etc.
        break;

      case "player-left":
        // eslint-disable-next-line no-console
        console.log(`Player ${event.userId} left game ${gameId}`);
        // Update UI, cleanup, etc.
        break;

      case "game-action":
        // eslint-disable-next-line no-console
        console.log(`Game action in ${gameId}:`, event.data);
        // Process game action, update state, etc.
        break;

      case "game-state-update":
        // eslint-disable-next-line no-console
        console.log(`Game state updated in ${gameId}:`, event.data);
        // Update game state, broadcast to clients, etc.
        break;

      default:
        // eslint-disable-next-line no-console
        console.log(`Unknown event type: ${event.type}`);
    }
  });
}
