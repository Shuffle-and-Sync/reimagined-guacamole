/**
 * Base Game Adapter
 *
 * Abstract base class providing common functionality for all game adapters.
 * Game-specific adapters should extend this class and implement the abstract methods.
 */

import type {
  IGameAdapter,
  ValidationResult,
  WinResult,
  Phase,
  StateDiff,
  GameConfig,
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
   * Basic implementation - can be overridden for more efficient diffing
   */
  getStateDiff(oldState: TState, newState: TState): StateDiff[] {
    const diffs: StateDiff[] = [];
    const timestamp = new Date();

    // Simple deep comparison - in production, use a proper diff library
    const oldJson = JSON.stringify(oldState);
    const newJson = JSON.stringify(newState);

    if (oldJson !== newJson) {
      diffs.push({
        type: "full_replace",
        path: "/",
        oldValue: oldState,
        newValue: newState,
        timestamp,
      });
    }

    return diffs;
  }

  /**
   * Apply state differences to a state
   * Basic implementation - can be overridden for more efficient patching
   */
  applyStateDiff(state: TState, diffs: StateDiff[]): TState {
    let newState = state;

    for (const diff of diffs) {
      if (diff.type === "full_replace" && diff.path === "/") {
        newState = diff.newValue as TState;
      }
      // Additional diff types can be implemented by subclasses
    }

    return newState;
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
}
