/**
 * Game State Management Server
 *
 * Handles game state synchronization via Socket.IO
 */

import { logger } from "@server/services/logger";
import { Server as SocketServer } from "socket.io";

interface GameState {
  gameId: string;
  roomId: string;
  players: Record<string, any>;
  currentTurn: string;
  turnNumber: number;
  startTime: Date;
  isActive: boolean;
}

export class GameStateServer {
  private games: Map<string, GameState> = new Map();

  constructor(private io: SocketServer) {
    this.setupListeners();
  }

  private setupListeners() {
    this.io.on("connection", (socket) => {
      // Initialize game
      socket.on("initialize-game", (gameState: GameState) => {
        this.handleInitializeGame(socket, gameState);
      });

      // Game state updates
      socket.on("game-state-update", (update: any) => {
        this.handleGameStateUpdate(socket, update);
      });

      // Request game state
      socket.on("request-game-state", ({ gameId }, callback) => {
        const state = this.games.get(gameId);
        callback({ state: state || null });
      });

      // End game
      socket.on("end-game", ({ gameId, winnerId, endTime }) => {
        this.handleEndGame(socket, gameId, winnerId, endTime);
      });
    });
  }

  private handleInitializeGame(socket: any, gameState: GameState) {
    this.games.set(gameState.gameId, {
      ...gameState,
      startTime: new Date(),
      isActive: true,
    });

    // Broadcast to room
    socket.to(gameState.roomId).emit("game-initialized", gameState);

    logger.info("Game initialized", {
      gameId: gameState.gameId,
      roomId: gameState.roomId,
      players: Object.keys(gameState.players).length,
    });
  }

  private handleGameStateUpdate(socket: any, update: any) {
    const game = this.games.get(update.gameId);
    if (!game) return;

    // Broadcast update to all players in the room
    socket.to(game.roomId).emit("game-state-update", update);

    logger.debug("Game state update", {
      gameId: update.gameId,
      type: update.type,
    });
  }

  private handleEndGame(
    socket: any,
    gameId: string,
    winnerId: string,
    endTime: Date,
  ) {
    const game = this.games.get(gameId);
    if (!game) return;

    game.isActive = false;

    // Broadcast to room
    socket.to(game.roomId).emit("game-ended", {
      gameId,
      winnerId,
      endTime,
    });

    // Clean up after 5 minutes
    setTimeout(
      () => {
        this.games.delete(gameId);
        logger.info("Game cleaned up", { gameId });
      },
      5 * 60 * 1000,
    );

    logger.info("Game ended", { gameId, winnerId });
  }

  public getGameState(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  public getAllGames(): GameState[] {
    return Array.from(this.games.values());
  }

  public getActiveGameCount(): number {
    return Array.from(this.games.values()).filter((g) => g.isActive).length;
  }
}
