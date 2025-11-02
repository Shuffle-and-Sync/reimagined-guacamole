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
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId> (support multiple tabs)

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
          const fromUserId = this.getSocketUserId(socket.id);
          const targetSocketIds = this.userSockets.get(to);
          if (targetSocketIds && fromUserId) {
            // Send to all tabs/devices for this user
            targetSocketIds.forEach((targetSocketId) => {
              socket
                .to(targetSocketId)
                .emit("offer", { offer, from: fromUserId });
            });
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
          const fromUserId = this.getSocketUserId(socket.id);
          const targetSocketIds = this.userSockets.get(to);
          if (targetSocketIds && fromUserId) {
            // Send to all tabs/devices for this user
            targetSocketIds.forEach((targetSocketId) => {
              socket
                .to(targetSocketId)
                .emit("answer", { answer, from: fromUserId });
            });
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
          const fromUserId = this.getSocketUserId(socket.id);
          const targetSocketIds = this.userSockets.get(to);
          if (targetSocketIds && fromUserId) {
            // Send to all tabs/devices for this user
            targetSocketIds.forEach((targetSocketId) => {
              socket
                .to(targetSocketId)
                .emit("ice-candidate", { candidate, from: fromUserId });
            });
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

    // Track socket for this user (support multiple tabs)
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    const socketSet = this.userSockets.get(userId);
    if (socketSet) {
      socketSet.add(socket.id);
    }
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

    // Remove socket from user's socket set
    const socketSet = this.userSockets.get(userId);
    if (socketSet) {
      socketSet.delete(socket.id);
      // If no more sockets for this user, remove the entry and notify others
      if (socketSet.size === 0) {
        this.userSockets.delete(userId);
        // Notify other users only if this was the last connection for this user
        socket.to(roomId).emit("user-left", { userId });
      }
    }
    socket.leave(roomId);

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

  // Helper method to get userId from socketId
  private getSocketUserId(socketId: string): string | undefined {
    for (const room of this.rooms.values()) {
      if (room.users.has(socketId)) {
        return room.users.get(socketId);
      }
    }
    return undefined;
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
