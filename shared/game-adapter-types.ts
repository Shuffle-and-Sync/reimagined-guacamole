/**
 * Game Adapter Pattern Types
 *
 * Defines the universal interface and types for supporting multiple card games
 * with game-specific rules while maintaining a common synchronization interface.
 */

import { z } from "zod";

// ============================================================================
// Core Types
// ============================================================================

/**
 * Validation result from state or action validation
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Win condition result
 */
export interface WinResult {
  winnerId: string;
  winCondition: string;
  timestamp: Date;
}

/**
 * Game phase representation
 */
export interface Phase {
  id: string;
  name: string;
  order: number;
  description?: string;
  allowedActions?: string[];
}

/**
 * State difference for synchronization
 */
export interface StateDiff {
  type: string;
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
  timestamp: Date;
}

/**
 * Deck list structure
 */
export interface DeckList {
  cards: Array<{
    cardId: string;
    quantity: number;
  }>;
  name?: string;
  format?: string;
}

/**
 * Game configuration options
 */
export interface GameConfig {
  playerCount: number;
  startingResources?: Record<string, number>;
  deckLists?: DeckList[];
  rules?: RuleVariant[];
  timeControls?: TimeControl;
}

/**
 * Rule variant (for different formats/modes)
 */
export interface RuleVariant {
  id: string;
  name: string;
  description?: string;
  modifications: Record<string, unknown>;
}

/**
 * Time control settings
 */
export interface TimeControl {
  type: "none" | "chess" | "turn" | "total";
  playerTime?: number; // milliseconds per player
  turnTime?: number; // milliseconds per turn
  increment?: number; // milliseconds added per action
}

// ============================================================================
// Game Adapter Interface
// ============================================================================

/**
 * Universal game adapter interface
 *
 * TState: The game-specific state type
 * TAction: The game-specific action type
 */
export interface IGameAdapter<TState = unknown, TAction = unknown> {
  // Metadata
  gameId: string;
  gameName: string;
  version: string;

  // State management
  createInitialState(config: GameConfig): TState;
  validateState(state: TState): ValidationResult;
  serializeState(state: TState): string;
  deserializeState(data: string): TState;

  // Actions
  validateAction(state: TState, action: TAction): boolean;
  applyAction(state: TState, action: TAction): TState;
  getAvailableActions(state: TState, playerId: string): TAction[];

  // Rules
  checkWinCondition(state: TState): WinResult | null;
  getGamePhases(): Phase[];
  advancePhase(state: TState): TState;

  // Sync
  getStateDiff(oldState: TState, newState: TState): StateDiff[];
  applyStateDiff(state: TState, diff: StateDiff[]): TState;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const WinResultSchema = z.object({
  winnerId: z.string(),
  winCondition: z.string(),
  timestamp: z.date(),
});

export const PhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
  description: z.string().optional(),
  allowedActions: z.array(z.string()).optional(),
});

export const StateDiffSchema = z.object({
  type: z.string(),
  path: z.string(),
  oldValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  timestamp: z.date(),
});

export const DeckListSchema = z.object({
  cards: z.array(
    z.object({
      cardId: z.string(),
      quantity: z.number().int().positive(),
    }),
  ),
  name: z.string().optional(),
  format: z.string().optional(),
});

export const RuleVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  modifications: z.record(z.unknown()),
});

export const TimeControlSchema = z.object({
  type: z.enum(["none", "chess", "turn", "total"]),
  playerTime: z.number().optional(),
  turnTime: z.number().optional(),
  increment: z.number().optional(),
});

export const GameConfigSchema = z.object({
  playerCount: z.number().int().min(1).max(10),
  startingResources: z.record(z.number()).optional(),
  deckLists: z.array(DeckListSchema).optional(),
  rules: z.array(RuleVariantSchema).optional(),
  timeControls: TimeControlSchema.optional(),
});
