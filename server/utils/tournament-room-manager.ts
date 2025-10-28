/**
 * Tournament Room Manager
 *
 * Manages WebSocket rooms for tournament real-time updates
 * Handles broadcasting tournament events to connected clients
 */

import { logger } from "../logger";
import type { ExtendedWebSocket } from "./websocket-connection-manager";

export interface TournamentRoom {
  tournamentId: string;
  connections: Set<ExtendedWebSocket>;
  matchRooms: Map<string, Set<ExtendedWebSocket>>; // matchId -> connections watching that match
}

export interface TournamentBroadcastMessage {
  type:
    | "tournament:match_started"
    | "tournament:match_completed"
    | "tournament:round_advanced"
    | "tournament:participant_joined"
    | "tournament:participant_left"
    | "tournament:bracket_updated"
    | "tournament:status_changed";
  tournamentId: string;
  [key: string]: unknown;
}

/**
 * Manages WebSocket rooms for tournament real-time updates
 */
export class TournamentRoomManager {
  private static instance: TournamentRoomManager;
  private rooms = new Map<string, TournamentRoom>();

  static getInstance(): TournamentRoomManager {
    if (!TournamentRoomManager.instance) {
      TournamentRoomManager.instance = new TournamentRoomManager();
    }
    return TournamentRoomManager.instance;
  }

  /**
   * Join a tournament room to receive updates
   */
  joinTournamentRoom(tournamentId: string, ws: ExtendedWebSocket): void {
    if (!this.rooms.has(tournamentId)) {
      this.rooms.set(tournamentId, {
        tournamentId,
        connections: new Set(),
        matchRooms: new Map(),
      });
    }

    const room = this.rooms.get(tournamentId)!;
    room.connections.add(ws);

    logger.info("User joined tournament room", {
      tournamentId,
      userId: ws.userId,
      roomSize: room.connections.size,
    });
  }

  /**
   * Leave a tournament room
   */
  leaveTournamentRoom(tournamentId: string, ws: ExtendedWebSocket): void {
    const room = this.rooms.get(tournamentId);
    if (!room) return;

    room.connections.delete(ws);

    // Also remove from any match rooms
    for (const [matchId, connections] of room.matchRooms) {
      connections.delete(ws);
      if (connections.size === 0) {
        room.matchRooms.delete(matchId);
      }
    }

    // Clean up empty rooms
    if (room.connections.size === 0 && room.matchRooms.size === 0) {
      this.rooms.delete(tournamentId);
      logger.info("Tournament room closed (empty)", { tournamentId });
    } else {
      logger.info("User left tournament room", {
        tournamentId,
        userId: ws.userId,
        roomSize: room.connections.size,
      });
    }
  }

  /**
   * Join a specific match room within a tournament
   */
  joinMatchRoom(
    tournamentId: string,
    matchId: string,
    ws: ExtendedWebSocket,
  ): void {
    const room = this.rooms.get(tournamentId);
    if (!room) {
      logger.warn("Attempted to join match room in non-existent tournament", {
        tournamentId,
        matchId,
        userId: ws.userId,
      });
      return;
    }

    if (!room.matchRooms.has(matchId)) {
      room.matchRooms.set(matchId, new Set());
    }

    room.matchRooms.get(matchId)!.add(ws);

    logger.info("User joined match room", {
      tournamentId,
      matchId,
      userId: ws.userId,
      matchRoomSize: room.matchRooms.get(matchId)!.size,
    });
  }

  /**
   * Leave a specific match room
   */
  leaveMatchRoom(
    tournamentId: string,
    matchId: string,
    ws: ExtendedWebSocket,
  ): void {
    const room = this.rooms.get(tournamentId);
    if (!room) return;

    const matchRoom = room.matchRooms.get(matchId);
    if (matchRoom) {
      matchRoom.delete(ws);
      if (matchRoom.size === 0) {
        room.matchRooms.delete(matchId);
      }
    }
  }

  /**
   * Broadcast message to all connections in a tournament room
   */
  broadcastToTournament(
    tournamentId: string,
    message: TournamentBroadcastMessage,
  ): void {
    const room = this.rooms.get(tournamentId);
    if (!room) {
      logger.info("No room found for tournament broadcast", { tournamentId });
      return;
    }

    const messageStr = JSON.stringify(message);
    let successCount = 0;
    let failureCount = 0;

    for (const ws of room.connections) {
      try {
        if (ws.readyState === 1) {
          // WebSocket.OPEN
          ws.send(messageStr);
          successCount++;
        } else {
          // Clean up closed connections
          room.connections.delete(ws);
        }
      } catch (error) {
        logger.error(
          "Failed to send tournament broadcast to connection",
          error instanceof Error ? error : new Error(String(error)),
          { tournamentId, userId: ws.userId },
        );
        failureCount++;
        room.connections.delete(ws);
      }
    }

    logger.info("Tournament broadcast sent", {
      tournamentId,
      messageType: message.type,
      recipients: successCount,
      failures: failureCount,
    });
  }

  /**
   * Broadcast message to all connections watching a specific match
   */
  broadcastToMatch(
    tournamentId: string,
    matchId: string,
    message: TournamentBroadcastMessage,
  ): void {
    const room = this.rooms.get(tournamentId);
    if (!room) return;

    const matchRoom = room.matchRooms.get(matchId);
    if (!matchRoom || matchRoom.size === 0) {
      logger.info("No viewers for match broadcast", { tournamentId, matchId });
      return;
    }

    const messageStr = JSON.stringify(message);
    let successCount = 0;

    for (const ws of matchRoom) {
      try {
        if (ws.readyState === 1) {
          ws.send(messageStr);
          successCount++;
        } else {
          matchRoom.delete(ws);
        }
      } catch (error) {
        logger.error(
          "Failed to send match broadcast to connection",
          error instanceof Error ? error : new Error(String(error)),
          { tournamentId, matchId, userId: ws.userId },
        );
        matchRoom.delete(ws);
      }
    }

    logger.info("Match broadcast sent", {
      tournamentId,
      matchId,
      messageType: message.type,
      recipients: successCount,
    });
  }

  /**
   * Remove a connection from all tournament and match rooms
   */
  removeConnection(ws: ExtendedWebSocket): void {
    for (const [tournamentId, room] of this.rooms) {
      if (room.connections.has(ws)) {
        this.leaveTournamentRoom(tournamentId, ws);
      }

      for (const [matchId, connections] of room.matchRooms) {
        if (connections.has(ws)) {
          this.leaveMatchRoom(tournamentId, matchId, ws);
        }
      }
    }
  }

  /**
   * Get statistics about current rooms
   */
  getStats(): {
    totalRooms: number;
    totalConnections: number;
    rooms: Array<{
      tournamentId: string;
      connections: number;
      matchRooms: number;
    }>;
  } {
    const roomStats = Array.from(this.rooms.entries()).map(
      ([tournamentId, room]) => ({
        tournamentId,
        connections: room.connections.size,
        matchRooms: room.matchRooms.size,
      }),
    );

    return {
      totalRooms: this.rooms.size,
      totalConnections: roomStats.reduce(
        (sum, room) => sum + room.connections,
        0,
      ),
      rooms: roomStats,
    };
  }

  /**
   * Clear all rooms (for testing)
   */
  clearAll(): void {
    this.rooms.clear();
    logger.info("All tournament rooms cleared");
  }
}

// Export singleton instance
export const tournamentRoomManager = TournamentRoomManager.getInstance();
