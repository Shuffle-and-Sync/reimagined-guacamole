/**
 * Game State Tracking Types
 *
 * Types for tracking game state during remote TCG gameplay
 */

export interface PlayerState {
  playerId: string;
  playerName: string;
  lifeTotal: number;
  commanderDamage?: Record<string, number>; // commanderId -> damage
  poisonCounters?: number;
  energyCounters?: number;
  stormCount?: number;
  customCounters?: Record<string, number>;
  isActive?: boolean;
}

export interface GameState {
  gameId: string;
  roomId: string;
  gameType: "mtg" | "pokemon" | "yugioh" | "lorcana";
  format?: string; // Commander, Standard, etc.
  players: Record<string, PlayerState>;
  currentTurn: string; // playerId of active player
  turnNumber: number;
  timerConfig?: TimerConfig;
  startingLifeTotal: number;
  gameStartTime?: Date;
  gameEndTime?: Date;
  isGameActive: boolean;
}

export interface TimerConfig {
  enabled: boolean;
  timePerTurn: number; // seconds
  timeRemaining: number; // seconds
  totalTime?: number; // seconds - optional total game time
}

export interface GameStateUpdate {
  gameId: string;
  type:
    | "life-change"
    | "commander-damage"
    | "turn-pass"
    | "counter-change"
    | "game-start"
    | "game-end";
  playerId?: string;
  data?: unknown;
  timestamp: Date;
}

export interface LifeChangeUpdate {
  playerId: string;
  delta: number;
  newTotal: number;
}

export interface CommanderDamageUpdate {
  victimId: string;
  commanderId: string;
  delta: number;
  newTotal: number;
}

export interface CounterChangeUpdate {
  playerId: string;
  counterType: "poison" | "energy" | "storm" | "custom";
  counterName?: string;
  delta: number;
  newTotal: number;
}

export interface TurnPassUpdate {
  nextPlayer: string;
  turnNumber: number;
}

export interface UseGameStateOptions {
  gameId: string;
  roomId: string;
  userId: string;
  socket: any; // Socket.IO socket
  gameType?: "mtg" | "pokemon" | "yugioh" | "lorcana";
  format?: string;
  startingLifeTotal?: number;
  playerNames?: Record<string, string>;
}
