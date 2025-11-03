/**
 * Game Adapter Base Interface
 *
 * Provides a common interface for implementing different card game types
 * while maintaining shared state management and synchronization.
 *
 * Based on recommendations in Section 3 of TABLESYNC_ANALYSIS_AND_RECOMMENDATIONS.md
 */

import { z } from "zod";
import type { GameStateBase, GameStateAction } from "../game-state-schema";

// Re-export GameStateBase for convenience
export type { GameStateBase, GameStateAction };

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for initializing a new game
 */
export interface GameConfig {
  /** Maximum number of players */
  maxPlayers: number;
  /** Player information */
  players: Array<{ id: string; name: string }>;
  /** Game-specific configuration (deck lists, format, etc.) */
  gameSpecificConfig?: unknown;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Game state view for rendering
 */
export interface GameStateView {
  /** Public state visible to all players */
  publicState: unknown;
  /** Private state for each player */
  playerStates: Map<string, unknown>;
}

/**
 * Player action for UI
 */
export interface PlayerAction {
  id: string;
  type: string;
  label: string;
  icon?: string;
  requiresTarget?: boolean;
  targetType?: string;
  enabled?: boolean;
}

// ============================================================================
// Game Adapter Interface
// ============================================================================

/**
 * Base interface for game-specific adapters
 * Implement this interface to add support for a new card game type
 */
export interface GameAdapter<TState extends GameStateBase = GameStateBase> {
  /** Unique game type identifier (e.g., "mtg", "pokemon", "yugioh") */
  readonly gameType: string;

  /** Human-readable game name */
  readonly gameName: string;

  /** Game version/ruleset (optional) */
  readonly version?: string;

  // State Management

  /**
   * Create initial game state from configuration
   */
  createInitialState(config: GameConfig): TState;

  /**
   * Validate game state for consistency
   */
  validateState(state: TState): ValidationResult;

  // Action Handling

  /**
   * Validate if an action is legal in the current state
   */
  validateAction(action: GameStateAction, state: TState): boolean;

  /**
   * Apply an action to the state (should be called after validation)
   */
  applyAction(action: GameStateAction, state: TState): TState;

  /**
   * Get all legal actions for a player in the current state
   */
  getLegalActions(state: TState, playerId: string): GameStateAction[];

  // Game Rules

  /**
   * Check if the game is over
   */
  isGameOver(state: TState): boolean;

  /**
   * Get the winner (if game is over)
   */
  getWinner(state: TState): string | null;

  // UI Helpers

  /**
   * Render game state for display
   * Separates public and private information
   */
  renderState(state: TState): GameStateView;

  /**
   * Get player actions for UI
   */
  getPlayerActions(state: TState, playerId: string): PlayerAction[];
}

// ============================================================================
// Zod Schemas
// ============================================================================

export const GameConfigSchema = z.object({
  maxPlayers: z.number().int().min(2).max(10),
  players: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
    }),
  ),
  gameSpecificConfig: z.unknown().optional(),
});

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
});

export const PlayerActionSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  requiresTarget: z.boolean().optional(),
  targetType: z.string().optional(),
  enabled: z.boolean().optional(),
});

// ============================================================================
// Abstract Base Adapter
// ============================================================================

/**
 * Abstract base class providing common adapter functionality
 * Extend this class to implement a specific game adapter
 */
export abstract class BaseGameAdapter<TState extends GameStateBase>
  implements GameAdapter<TState>
{
  abstract readonly gameType: string;
  abstract readonly gameName: string;
  readonly version?: string;

  abstract createInitialState(config: GameConfig): TState;
  abstract validateState(state: TState): ValidationResult;
  abstract validateAction(action: GameStateAction, state: TState): boolean;
  abstract applyAction(action: GameStateAction, state: TState): TState;
  abstract getLegalActions(state: TState, playerId: string): GameStateAction[];
  abstract isGameOver(state: TState): boolean;
  abstract getWinner(state: TState): string | null;
  abstract renderState(state: TState): GameStateView;
  abstract getPlayerActions(state: TState, playerId: string): PlayerAction[];

  /**
   * Helper: Check if it's a player's turn
   */
  protected isPlayerTurn(state: TState, playerId: string): boolean {
    if ("currentTurn" in state && state.currentTurn) {
      const turn = state.currentTurn as { playerId: string };
      return turn.playerId === playerId;
    }
    return false;
  }

  /**
   * Helper: Find player in state
   */
  protected findPlayer(state: TState, playerId: string): unknown | null {
    if ("players" in state && Array.isArray(state.players)) {
      return (
        state.players.find((p: { id: string }) => p.id === playerId) || null
      );
    }
    return null;
  }

  /**
   * Helper: Deep clone state for immutable updates
   */
  protected cloneState(state: TState): TState {
    return JSON.parse(JSON.stringify(state)) as TState;
  }

  /**
   * Helper: Create action ID
   */
  protected createActionId(): string {
    return `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Helper: Get action label for UI
   */
  protected getActionLabel(actionType: string): string {
    const labels: Record<string, string> = {
      draw: "Draw Card",
      play: "Play Card",
      tap: "Tap",
      untap: "Untap",
      attack: "Attack",
      block: "Block",
      pass: "Pass Priority",
      concede: "Concede",
    };
    return labels[actionType] || actionType;
  }

  /**
   * Helper: Get action icon for UI
   */
  protected getActionIcon(actionType: string): string {
    const icons: Record<string, string> = {
      draw: "📥",
      play: "🃏",
      tap: "↻",
      untap: "↺",
      attack: "⚔️",
      block: "🛡️",
      pass: "⏭️",
      concede: "🏳️",
    };
    return icons[actionType] || "🎮";
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if an object implements GameAdapter interface
 */
export function isGameAdapter(obj: unknown): obj is GameAdapter {
  if (typeof obj !== "object" || obj === null) return false;

  const adapter = obj as Record<string, unknown>;
  return (
    typeof adapter.gameType === "string" &&
    typeof adapter.gameName === "string" &&
    typeof adapter.createInitialState === "function" &&
    typeof adapter.validateState === "function" &&
    typeof adapter.validateAction === "function" &&
    typeof adapter.applyAction === "function" &&
    typeof adapter.getLegalActions === "function" &&
    typeof adapter.isGameOver === "function" &&
    typeof adapter.getWinner === "function" &&
    typeof adapter.renderState === "function" &&
    typeof adapter.getPlayerActions === "function"
  );
}
