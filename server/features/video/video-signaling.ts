/**
 * Video Signaling Server
 *
 * Manages WebRTC signaling for video rooms using Socket.io
 */

import { Server as SocketServer } from "socket.io";
import { logger } from "../../logger";

interface VideoRoom {
  roomId: string;
  users: Map<string, string>; // socketId -> userId
  createdAt: Date;
}

export class VideoSignalingServer {
  private rooms: Map<string, VideoRoom> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(private io: SocketServer) {
    this.setupListeners();
  }

  private setupListeners() {
    this.io.on("connection", (socket) => {
      logger.info("Video signaling client connected", { socketId: socket.id });

      // Join video room
      socket.on(
        "join-video-room",
        ({ roomId, userId }: { roomId: string; userId: string }) => {
          this.handleJoinRoom(socket, roomId, userId);
        },
      );

      // Leave video room
      socket.on(
        "leave-video-room",
        ({ roomId, userId }: { roomId: string; userId: string }) => {
          this.handleLeaveRoom(socket, roomId, userId);
        },
      );

      // WebRTC signaling
      socket.on(
        "offer",
        ({
          to,
          offer,
        }: {
          roomId: string;
          to: string;
          offer: RTCSessionDescriptionInit;
        }) => {
          const targetSocketId = this.userSockets.get(to);
          if (targetSocketId) {
            socket.to(targetSocketId).emit("offer", { offer, from: socket.id });
          }
        },
      );

      socket.on(
        "answer",
        ({
          to,
          answer,
        }: {
          roomId: string;
          to: string;
          answer: RTCSessionDescriptionInit;
        }) => {
          const targetSocketId = this.userSockets.get(to);
          if (targetSocketId) {
            socket
              .to(targetSocketId)
              .emit("answer", { answer, from: socket.id });
          }
        },
      );

      socket.on(
        "ice-candidate",
        ({
          to,
          candidate,
        }: {
          roomId: string;
          to: string;
          candidate: RTCIceCandidateInit;
        }) => {
          const targetSocketId = this.userSockets.get(to);
          if (targetSocketId) {
            socket
              .to(targetSocketId)
              .emit("ice-candidate", { candidate, from: socket.id });
          }
        },
      );

      // Disconnect
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinRoom(
    socket: {
      id: string;
      join: (room: string) => void;
      emit: (event: string, data: unknown) => void;
      to: (room: string) => { emit: (event: string, data: unknown) => void };
    },
    roomId: string,
    userId: string,
  ) {
    // Create room if doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        roomId,
        users: new Map(),
        createdAt: new Date(),
      });
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn("Room not found for join", { roomId });
      return;
    }

    // Add user to room
    room.users.set(socket.id, userId);
    this.userSockets.set(userId, socket.id);
    socket.join(roomId);

    // Get list of existing users (excluding the new user)
    const existingUsers = Array.from(room.users.values()).filter(
      (id) => id !== userId,
    );

    // Send list of existing users to new user
    socket.emit("existing-users", { users: existingUsers });

    // Notify existing users of new user
    socket.to(roomId).emit("user-joined", { userId });

    logger.info("User joined video room", {
      roomId,
      userId,
      socketId: socket.id,
      totalUsers: room.users.size,
    });
  }

  private handleLeaveRoom(
    socket: {
      id: string;
      leave: (room: string) => void;
      to: (room: string) => { emit: (event: string, data: unknown) => void };
    },
    roomId: string,
    userId: string,
  ) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Remove user from room
    room.users.delete(socket.id);
    this.userSockets.delete(userId);
    socket.leave(roomId);

    // Notify other users
    socket.to(roomId).emit("user-left", { userId });

    // Delete room if empty
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      logger.info("Video room deleted (empty)", { roomId });
    }

    logger.info("User left video room", {
      roomId,
      userId,
      socketId: socket.id,
    });
  }

  private handleDisconnect(socket: {
    id: string;
    leave: (room: string) => void;
    to: (room: string) => { emit: (event: string, data: unknown) => void };
  }) {
    // Find which rooms the socket was in
    this.rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        const userId = room.users.get(socket.id);
        if (userId) {
          this.handleLeaveRoom(socket, roomId, userId);
        }
      }
    });

    logger.info("Video signaling client disconnected", { socketId: socket.id });
  }

  public getRoomInfo(roomId: string): VideoRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getAllRooms(): VideoRoom[] {
    return Array.from(this.rooms.values());
  }

  public getRoomCount(): number {
    return this.rooms.size;
  }

  public getTotalUsers(): number {
    return this.userSockets.size;
  }
}
