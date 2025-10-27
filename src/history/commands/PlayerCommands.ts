/**
 * Player-related commands for undo/redo
 * Implements commands for player state changes
 */

import { BaseCommand } from "../BaseCommand";

/**
 * Player state interface
 */
export interface PlayerState {
  id: string;
  name: string;
  life: number;
  poison?: number;
  energy?: number;
}

/**
 * Game state with players
 */
export interface GameStateWithPlayers {
  players: { [playerId: string]: PlayerState };
  [key: string]: any;
}

/**
 * Update player life command
 */
export class UpdateLifeCommand extends BaseCommand<GameStateWithPlayers> {
  private previousLife?: number;

  constructor(
    userId: string,
    private playerId: string,
    private delta: number,
  ) {
    super("UPDATE_LIFE", userId, [playerId], { playerId, delta });
  }

  execute(state: GameStateWithPlayers): GameStateWithPlayers {
    const newState = this.deepCopy(state);

    if (!newState.players[this.playerId]) {
      throw new Error(`Player not found: ${this.playerId}`);
    }

    // Store previous life for undo
    this.previousLife = newState.players[this.playerId].life;

    // Update life
    newState.players[this.playerId].life += this.delta;

    return newState;
  }

  undo(state: GameStateWithPlayers): GameStateWithPlayers {
    if (this.previousLife === undefined) {
      // If we don't have previous life, just reverse the delta
      const reverseCommand = new UpdateLifeCommand(
        this.userId,
        this.playerId,
        -this.delta,
      );
      return reverseCommand.execute(state);
    }

    const newState = this.deepCopy(state);

    if (!newState.players[this.playerId]) {
      throw new Error(`Player not found: ${this.playerId}`);
    }

    // Restore previous life
    newState.players[this.playerId].life = this.previousLife;

    return newState;
  }

  protected validateState(state: GameStateWithPlayers): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    // Check if player exists
    return state.players && !!state.players[this.playerId];
  }
}

/**
 * Update player poison counters command
 */
export class UpdatePoisonCommand extends BaseCommand<GameStateWithPlayers> {
  private previousPoison?: number;

  constructor(
    userId: string,
    private playerId: string,
    private delta: number,
  ) {
    super("UPDATE_POISON", userId, [playerId], { playerId, delta });
  }

  execute(state: GameStateWithPlayers): GameStateWithPlayers {
    const newState = this.deepCopy(state);

    if (!newState.players[this.playerId]) {
      throw new Error(`Player not found: ${this.playerId}`);
    }

    // Store previous poison for undo
    this.previousPoison = newState.players[this.playerId].poison || 0;

    // Update poison
    newState.players[this.playerId].poison =
      (newState.players[this.playerId].poison || 0) + this.delta;

    return newState;
  }

  undo(state: GameStateWithPlayers): GameStateWithPlayers {
    if (this.previousPoison === undefined) {
      // If we don't have previous poison, just reverse the delta
      const reverseCommand = new UpdatePoisonCommand(
        this.userId,
        this.playerId,
        -this.delta,
      );
      return reverseCommand.execute(state);
    }

    const newState = this.deepCopy(state);

    if (!newState.players[this.playerId]) {
      throw new Error(`Player not found: ${this.playerId}`);
    }

    // Restore previous poison
    newState.players[this.playerId].poison = this.previousPoison;

    return newState;
  }

  protected validateState(state: GameStateWithPlayers): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    // Check if player exists
    return state.players && !!state.players[this.playerId];
  }
}

/**
 * Update player energy command
 */
export class UpdateEnergyCommand extends BaseCommand<GameStateWithPlayers> {
  private previousEnergy?: number;

  constructor(
    userId: string,
    private playerId: string,
    private delta: number,
  ) {
    super("UPDATE_ENERGY", userId, [playerId], { playerId, delta });
  }

  execute(state: GameStateWithPlayers): GameStateWithPlayers {
    const newState = this.deepCopy(state);

    if (!newState.players[this.playerId]) {
      throw new Error(`Player not found: ${this.playerId}`);
    }

    // Store previous energy for undo
    this.previousEnergy = newState.players[this.playerId].energy || 0;

    // Update energy
    newState.players[this.playerId].energy =
      (newState.players[this.playerId].energy || 0) + this.delta;

    return newState;
  }

  undo(state: GameStateWithPlayers): GameStateWithPlayers {
    if (this.previousEnergy === undefined) {
      // If we don't have previous energy, just reverse the delta
      const reverseCommand = new UpdateEnergyCommand(
        this.userId,
        this.playerId,
        -this.delta,
      );
      return reverseCommand.execute(state);
    }

    const newState = this.deepCopy(state);

    if (!newState.players[this.playerId]) {
      throw new Error(`Player not found: ${this.playerId}`);
    }

    // Restore previous energy
    newState.players[this.playerId].energy = this.previousEnergy;

    return newState;
  }

  protected validateState(state: GameStateWithPlayers): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    // Check if player exists
    return state.players && !!state.players[this.playerId];
  }
}

/**
 * Add player command
 */
export class AddPlayerCommand extends BaseCommand<GameStateWithPlayers> {
  constructor(
    userId: string,
    private player: PlayerState,
  ) {
    super("ADD_PLAYER", userId, [player.id], { player });
  }

  execute(state: GameStateWithPlayers): GameStateWithPlayers {
    const newState = this.deepCopy(state);

    if (!newState.players) {
      newState.players = {};
    }

    if (newState.players[this.player.id]) {
      throw new Error(`Player already exists: ${this.player.id}`);
    }

    newState.players[this.player.id] = this.player;

    return newState;
  }

  undo(state: GameStateWithPlayers): GameStateWithPlayers {
    const newState = this.deepCopy(state);

    if (!newState.players[this.player.id]) {
      throw new Error(`Player not found: ${this.player.id}`);
    }

    delete newState.players[this.player.id];

    return newState;
  }

  protected validateState(state: GameStateWithPlayers): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    // Check if player exists
    return state.players && !!state.players[this.player.id];
  }
}

/**
 * Remove player command
 */
export class RemovePlayerCommand extends BaseCommand<GameStateWithPlayers> {
  private removedPlayer?: PlayerState;

  constructor(
    userId: string,
    private playerId: string,
  ) {
    super("REMOVE_PLAYER", userId, [playerId], { playerId });
  }

  execute(state: GameStateWithPlayers): GameStateWithPlayers {
    const newState = this.deepCopy(state);

    if (!newState.players[this.playerId]) {
      throw new Error(`Player not found: ${this.playerId}`);
    }

    // Store player for undo
    this.removedPlayer = newState.players[this.playerId];

    delete newState.players[this.playerId];

    return newState;
  }

  undo(state: GameStateWithPlayers): GameStateWithPlayers {
    if (!this.removedPlayer) {
      throw new Error("Cannot undo: removed player not stored");
    }

    const newState = this.deepCopy(state);

    if (!newState.players) {
      newState.players = {};
    }

    newState.players[this.playerId] = this.removedPlayer;

    return newState;
  }

  protected validateState(state: GameStateWithPlayers): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    // Check if player is removed (should not exist)
    return !state.players || !state.players[this.playerId];
  }
}
