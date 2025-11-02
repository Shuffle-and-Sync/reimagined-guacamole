/**
 * Game State Sync Service
 *
 * Handles real-time synchronization of game state via Socket.IO
 */

import type { GameState, GameStateUpdate } from "../types/game-state.types";

/**
 * Emit game state update to server
 */
export function emitGameStateUpdate(
  socket: any,
  update: GameStateUpdate,
): void {
  socket.emit("game-state-update", update);
}

/**
 * Request full game state from server
 */
export function requestGameState(
  socket: any,
  gameId: string,
): Promise<GameState | null> {
  return new Promise((resolve) => {
    socket.emit(
      "request-game-state",
      { gameId },
      (response: { state: GameState | null }) => {
        resolve(response.state);
      },
    );
  });
}

/**
 * Initialize game on server
 */
export function initializeGame(socket: any, gameState: GameState): void {
  socket.emit("initialize-game", gameState);
}

/**
 * End game on server
 */
export function endGame(socket: any, gameId: string, winnerId?: string): void {
  socket.emit("end-game", { gameId, winnerId, endTime: new Date() });
}
