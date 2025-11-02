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

  // Initialize video signaling
  new VideoSignalingServer(io);

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
    logger.error(
      "Socket.io error",
      error instanceof Error ? error : new Error(String(error)),
    );
  });

  logger.info("Socket.io initialized successfully");

  return io;
}

export { VideoSignalingServer };
