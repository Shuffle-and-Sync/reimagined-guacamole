/**
 * Socket.io initialization for real-time features
 *
 * Provides WebSocket support for:
 * - Video signaling (WebRTC)
 * - Game state synchronization
 * - Real-time messaging
 */

import { Server as HTTPServer } from "http";
import { Server as SocketServer } from "socket.io";
import { toLoggableError } from "@shared/utils/type-guards";
import { GameStateServer } from "../features/game-state/game-state-server";
import { VideoSignalingServer } from "../features/video/video-signaling";
import { logger } from "../logger";

export function initializeSocketIO(httpServer: HTTPServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.VITE_API_URL || "http://localhost:3000",
      credentials: true,
    },
    path: "/socket.io/",
    transports: ["websocket", "polling"],
  });

  // Initialize video signaling and expose for monitoring/administration
  const videoSignalingServer = new VideoSignalingServer(io);
  // Store instance for admin/monitoring access
  (
    io as unknown as { videoSignalingServer: VideoSignalingServer }
  ).videoSignalingServer = videoSignalingServer;

  // Initialize game state server
  const gameStateServer = new GameStateServer(io);
  // Store instance for admin/monitoring access
  (io as unknown as { gameStateServer: GameStateServer }).gameStateServer =
    gameStateServer;

  // Connection event
  io.on("connection", (socket) => {
    logger.info("Socket.io client connected", {
      socketId: socket.id,
      transport: socket.conn.transport.name,
    });

    // Track active connections
    socket.on("disconnect", (reason) => {
      logger.info("Socket.io client disconnected", {
        socketId: socket.id,
        reason,
      });
    });
  });

  // Health check for monitoring
  io.on("error", (error) => {
    logger.error("Socket.io error", toLoggableError(error));
  });

  logger.info("Socket.io initialized successfully");

  return io;
}

export { VideoSignalingServer, GameStateServer };
