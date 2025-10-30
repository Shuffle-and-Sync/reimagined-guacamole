/**
 * Base Game Adapter
 *
 * Abstract base class providing common functionality for all game adapters.
 * Game-specific adapters should extend this class and implement the abstract methods.
 */

import {
  calculateOptimizedDiff,
  applyOptimizedDiff,
} from "./utils/optimized-diff";
import type {
  IGameAdapter,
  ValidationResult,
  WinResult,
  Phase,
  StateDiff,
  GameConfig,
  RenderedState,
  PlayerAction,
} from "../../../../shared/game-adapter-types";

/**
 * Abstract base class for game adapters
 */
export abstract class BaseGameAdapter<TState = unknown, TAction = unknown>
  implements IGameAdapter<TState, TAction>
{
  // Metadata - must be provided by subclasses
  abstract readonly gameId: string;
  abstract readonly gameName: string;
  abstract readonly version: string;

  // ============================================================================
  // Abstract Methods - Must be implemented by subclasses
  // ============================================================================

  /**
   * Create initial game state from configuration
   */
  abstract createInitialState(config: GameConfig): TState;

  /**
   * Validate that a game state is valid
   */
  abstract validateState(state: TState): ValidationResult;

  /**
   * Validate that an action is legal in the current state
   */
  abstract validateAction(state: TState, action: TAction): boolean;

  /**
   * Apply an action to the state, returning the new state
   * State should be immutable - always return a new state object
   */
  abstract applyAction(state: TState, action: TAction): TState;

  /**
   * Get all available actions for a player in the current state
   */
  abstract getAvailableActions(state: TState, playerId: string): TAction[];

  /**
   * Check if the game has been won
   */
  abstract checkWinCondition(state: TState): WinResult | null;

  /**
   * Get the phases of this game
   */
  abstract getGamePhases(): Phase[];

  /**
   * Advance to the next phase
   */
  abstract advancePhase(state: TState): TState;

  // ============================================================================
  // Concrete Methods - Default implementations that can be overridden
  // ============================================================================

  /**
   * Serialize state to JSON string
   * Can be overridden for custom serialization
   */
  serializeState(state: TState): string {
    return JSON.stringify(state);
  }

  /**
   * Deserialize state from JSON string
   * Can be overridden for custom deserialization
   */
  deserializeState(data: string): TState {
    return JSON.parse(data) as TState;
  }

  /**
   * Get difference between two states
   * Uses optimized path-based diffing for efficient network sync
   */
  getStateDiff(oldState: TState, newState: TState): StateDiff[] {
    return calculateOptimizedDiff(oldState, newState);
  }

  /**
   * Apply state differences to a state
   * Uses optimized patch application
   */
  applyStateDiff(state: TState, diffs: StateDiff[]): TState {
    return applyOptimizedDiff(state, diffs) as TState;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Helper to create validation result
   */
  protected createValidationResult(
    valid: boolean,
    errors?: string[],
  ): ValidationResult {
    return { valid, errors };
  }

  /**
   * Helper to create win result
   */
  protected createWinResult(winnerId: string, winCondition: string): WinResult {
    return {
      winnerId,
      winCondition,
      timestamp: new Date(),
    };
  }

  /**
   * Helper to create phase
   */
  protected createPhase(
    id: string,
    name: string,
    order: number,
    description?: string,
    allowedActions?: string[],
  ): Phase {
    return {
      id,
      name,
      order,
      description,
      allowedActions,
    };
  }

  // ============================================================================
  // UI Helper Methods - Default implementations that can be overridden
  // ============================================================================

  /**
   * Render state for UI display
   * Basic implementation - game-specific adapters should override for better UX
   */
  renderState(state: TState, viewingPlayerId?: string): RenderedState {
    // This is a basic implementation that should be overridden by subclasses
    // It provides minimal functionality for generic state rendering
    return {
      players: [],
      currentPhase: {
        id: "unknown",
        name: "Unknown Phase",
      },
      turnNumber: 0,
      gameStatus: "active",
      metadata: {
        gameId: this.gameId,
        gameName: this.gameName,
        viewingPlayerId,
      },
    };
  }

  /**
   * Get player actions formatted for UI
   * Default implementation converts available actions to UI-friendly format
   */
  getPlayerActions(state: TState, playerId: string): PlayerAction[] {
    const availableActions = this.getAvailableActions(state, playerId);

    return availableActions.map((action, index) => {
      // Extract action properties with safe type access
      // Actions should have at minimum a 'type' property
      const actionObj = action as Record<string, unknown>;
      const actionType = (actionObj.type as string) || "unknown";

      return {
        id: `action-${index}-${actionType}`,
        type: actionType,
        label: this.formatActionLabel(actionType),
        description: this.formatActionDescription(actionType, actionObj),
        icon: this.getActionIcon(actionType),
      };
    });
  }

  /**
   * Format action type to human-readable label
   */
  protected formatActionLabel(actionType: string): string {
    return actionType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Format action description
   */
  protected formatActionDescription(
    actionType: string,
    action: Record<string, unknown>,
  ): string {
    if (action.cardId) {
      return `${this.formatActionLabel(actionType)} card`;
    }
    return this.formatActionLabel(actionType);
  }

  /**
   * Get icon name for action type
   */
  protected getActionIcon(actionType: string): string {
    const iconMap: Record<string, string> = {
      draw_card: "📥",
      play_card: "🎴",
      attack: "⚔️",
      defend: "🛡️",
      pass: "👉",
      end_turn: "🔄",
    };
    return iconMap[actionType] || "🎮";
  }
}
