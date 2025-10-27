/**
 * Game state commands for undo/redo
 * Implements commands for game-level state changes
 */

import { BaseCommand } from "../BaseCommand";

/**
 * Full game state interface
 */
export interface FullGameState {
  turn: number;
  phase: string;
  activePlayer: string;
  priority: string;
  [key: string]: any;
}

/**
 * Advance turn command
 */
export class AdvanceTurnCommand extends BaseCommand<FullGameState> {
  private previousTurn?: number;
  private previousActivePlayer?: string;

  constructor(
    userId: string,
    private nextActivePlayer: string,
  ) {
    super("ADVANCE_TURN", userId, ["turn", nextActivePlayer], {
      nextActivePlayer,
    });
  }

  execute(state: FullGameState): FullGameState {
    const newState = this.deepCopy(state);

    // Store previous values for undo
    this.previousTurn = newState.turn;
    this.previousActivePlayer = newState.activePlayer;

    // Advance turn
    newState.turn = (newState.turn || 0) + 1;
    newState.activePlayer = this.nextActivePlayer;
    newState.phase = "beginning"; // Reset to beginning phase

    return newState;
  }

  undo(state: FullGameState): FullGameState {
    if (this.previousTurn === undefined || !this.previousActivePlayer) {
      throw new Error("Cannot undo: previous state not stored");
    }

    const newState = this.deepCopy(state);

    // Restore previous values
    newState.turn = this.previousTurn;
    newState.activePlayer = this.previousActivePlayer;

    return newState;
  }

  protected validateState(state: FullGameState): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    // Check if turn advanced
    return (
      state.turn !== undefined && state.activePlayer === this.nextActivePlayer
    );
  }
}

/**
 * Change phase command
 */
export class ChangePhaseCommand extends BaseCommand<FullGameState> {
  private previousPhase?: string;

  constructor(
    userId: string,
    private newPhase: string,
  ) {
    super("CHANGE_PHASE", userId, ["phase"], { newPhase });
  }

  execute(state: FullGameState): FullGameState {
    const newState = this.deepCopy(state);

    // Store previous phase for undo
    this.previousPhase = newState.phase;

    // Change phase
    newState.phase = this.newPhase;

    return newState;
  }

  undo(state: FullGameState): FullGameState {
    if (this.previousPhase === undefined) {
      throw new Error("Cannot undo: previous phase not stored");
    }

    const newState = this.deepCopy(state);

    // Restore previous phase
    newState.phase = this.previousPhase;

    return newState;
  }

  protected validateState(state: FullGameState): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    // Check if phase changed
    return state.phase === this.newPhase;
  }
}

/**
 * Pass priority command
 */
export class PassPriorityCommand extends BaseCommand<FullGameState> {
  private previousPriority?: string;

  constructor(
    userId: string,
    private nextPriority: string,
  ) {
    super("PASS_PRIORITY", userId, ["priority", nextPriority], {
      nextPriority,
    });
  }

  execute(state: FullGameState): FullGameState {
    const newState = this.deepCopy(state);

    // Store previous priority for undo
    this.previousPriority = newState.priority;

    // Pass priority
    newState.priority = this.nextPriority;

    return newState;
  }

  undo(state: FullGameState): FullGameState {
    if (this.previousPriority === undefined) {
      throw new Error("Cannot undo: previous priority not stored");
    }

    const newState = this.deepCopy(state);

    // Restore previous priority
    newState.priority = this.previousPriority;

    return newState;
  }

  protected validateState(state: FullGameState): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    // Check if priority changed
    return state.priority === this.nextPriority;
  }
}

/**
 * Set game property command (generic)
 */
export class SetGamePropertyCommand<
  T = any,
> extends BaseCommand<FullGameState> {
  private previousValue?: T;

  constructor(
    userId: string,
    private propertyPath: string,
    private value: T,
  ) {
    super("SET_GAME_PROPERTY", userId, [propertyPath], {
      propertyPath,
      value,
    });
  }

  execute(state: FullGameState): FullGameState {
    const newState = this.deepCopy(state);

    // Store previous value for undo
    this.previousValue = this.getNestedProperty(newState, this.propertyPath);

    // Set new value
    this.setNestedProperty(newState, this.propertyPath, this.value);

    return newState;
  }

  undo(state: FullGameState): FullGameState {
    const newState = this.deepCopy(state);

    // Restore previous value
    if (this.previousValue !== undefined) {
      this.setNestedProperty(newState, this.propertyPath, this.previousValue);
    } else {
      // Delete property if it didn't exist before
      this.deleteNestedProperty(newState, this.propertyPath);
    }

    return newState;
  }

  protected validateState(state: FullGameState): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    // Check if property is set to the new value
    const currentValue = this.getNestedProperty(state, this.propertyPath);
    return JSON.stringify(currentValue) === JSON.stringify(this.value);
  }

  private getNestedProperty(obj: any, path: string): T | undefined {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  private setNestedProperty(obj: any, path: string, value: T): void {
    const keys = path.split(".");
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  private deleteNestedProperty(obj: any, path: string): void {
    const keys = path.split(".");
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        return;
      }
      current = current[key];
    }

    delete current[keys[keys.length - 1]];
  }
}
