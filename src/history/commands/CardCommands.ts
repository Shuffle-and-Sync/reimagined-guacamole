/**
 * Card-related commands for undo/redo
 * Implements commands for card movements, tapping, and counters
 */

import { BaseCommand } from "../BaseCommand";

/**
 * Zone represents a location in the game where cards can be placed
 */
export type Zone =
  | "hand"
  | "battlefield"
  | "graveyard"
  | "library"
  | "exile"
  | "command"
  | "sideboard";

/**
 * Game state interface for card commands
 */
export interface GameState {
  board: {
    [zone in Zone]: string[];
  };
  cards: {
    [cardId: string]: {
      tapped: boolean;
      counters: { [type: string]: number };
    };
  };
  [key: string]: any;
}

/**
 * Move card command
 * Moves a card from one zone to another
 */
export class MoveCardCommand extends BaseCommand<GameState> {
  constructor(
    userId: string,
    private cardId: string,
    private fromZone: Zone,
    private toZone: Zone,
    private position?: number,
  ) {
    super("MOVE_CARD", userId, [cardId], {
      cardId,
      fromZone,
      toZone,
      position,
    });
  }

  execute(state: GameState): GameState {
    const newState = this.deepCopy(state);

    // Ensure zones exist
    if (!newState.board[this.fromZone] || !newState.board[this.toZone]) {
      throw new Error(`Invalid zone: ${this.fromZone} or ${this.toZone}`);
    }

    // Remove from source zone
    const fromZoneCards = newState.board[this.fromZone].filter(
      (id) => id !== this.cardId,
    );

    // Add to destination zone
    const toZoneCards = [...newState.board[this.toZone]];
    if (this.position !== undefined) {
      toZoneCards.splice(this.position, 0, this.cardId);
    } else {
      toZoneCards.push(this.cardId);
    }

    return {
      ...newState,
      board: {
        ...newState.board,
        [this.fromZone]: fromZoneCards,
        [this.toZone]: toZoneCards,
      },
    };
  }

  undo(state: GameState): GameState {
    // Move card back by creating reverse command
    const reverseCommand = new MoveCardCommand(
      this.userId,
      this.cardId,
      this.toZone,
      this.fromZone,
    );
    return reverseCommand.execute(state);
  }

  protected validateState(state: GameState): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    // Check if board exists
    if (!state.board) {
      return false;
    }

    // Check if card exists in the destination zone
    return (
      state.board[this.toZone] && state.board[this.toZone].includes(this.cardId)
    );
  }
}

/**
 * Tap/untap card command
 */
export class TapCardCommand extends BaseCommand<GameState> {
  constructor(
    userId: string,
    private cardId: string,
    private tapped: boolean,
  ) {
    super("TAP_CARD", userId, [cardId], { cardId, tapped });
  }

  execute(state: GameState): GameState {
    const newState = this.deepCopy(state);

    // Ensure card exists
    if (!newState.cards[this.cardId]) {
      newState.cards[this.cardId] = { tapped: false, counters: {} };
    }

    newState.cards[this.cardId].tapped = this.tapped;

    return newState;
  }

  undo(state: GameState): GameState {
    // Toggle back to previous state
    const reverseCommand = new TapCardCommand(
      this.userId,
      this.cardId,
      !this.tapped,
    );
    return reverseCommand.execute(state);
  }

  protected validateState(state: GameState): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    // Check if cards object exists
    if (!state.cards) {
      return false;
    }

    // Check if card exists and has correct tapped state
    return (
      state.cards[this.cardId] &&
      state.cards[this.cardId].tapped === this.tapped
    );
  }
}

/**
 * Add/remove counters command
 */
export class AddCounterCommand extends BaseCommand<GameState> {
  constructor(
    userId: string,
    private cardId: string,
    private counterType: string,
    private amount: number,
  ) {
    super("ADD_COUNTER", userId, [cardId], {
      cardId,
      counterType,
      amount,
    });
  }

  execute(state: GameState): GameState {
    const newState = this.deepCopy(state);

    // Ensure card exists
    if (!newState.cards[this.cardId]) {
      newState.cards[this.cardId] = { tapped: false, counters: {} };
    }

    // Ensure counters object exists
    if (!newState.cards[this.cardId].counters) {
      newState.cards[this.cardId].counters = {};
    }

    // Add counters
    const currentCount =
      newState.cards[this.cardId].counters[this.counterType] || 0;
    newState.cards[this.cardId].counters[this.counterType] =
      currentCount + this.amount;

    return newState;
  }

  undo(state: GameState): GameState {
    // Remove counters by adding negative amount
    const reverseCommand = new AddCounterCommand(
      this.userId,
      this.cardId,
      this.counterType,
      -this.amount,
    );
    return reverseCommand.execute(state);
  }

  protected validateState(state: GameState): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    // Check if card exists
    if (!state.cards || !state.cards[this.cardId]) {
      return false;
    }

    return true;
  }
}

/**
 * Draw card command
 */
export class DrawCardCommand extends BaseCommand<GameState> {
  private drawnCardId?: string;

  constructor(
    userId: string,
    private playerId: string,
    cardId?: string,
  ) {
    super("DRAW_CARD", userId, [playerId], { playerId, cardId });
    this.drawnCardId = cardId;
  }

  execute(state: GameState): GameState {
    const newState = this.deepCopy(state);

    // Get top card from library if not specified
    if (!this.drawnCardId) {
      const library = newState.board.library || [];
      if (library.length === 0) {
        throw new Error("Cannot draw from empty library");
      }
      this.drawnCardId = library[0];
    }

    // Move card from library to hand
    const moveCommand = new MoveCardCommand(
      this.userId,
      this.drawnCardId,
      "library",
      "hand",
    );

    return moveCommand.execute(newState);
  }

  undo(state: GameState): GameState {
    if (!this.drawnCardId) {
      throw new Error("Cannot undo draw: card ID not set");
    }

    // Move card back to top of library
    const moveCommand = new MoveCardCommand(
      this.userId,
      this.drawnCardId,
      "hand",
      "library",
      0,
    );

    return moveCommand.execute(state);
  }

  protected validateState(state: GameState): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    if (!this.drawnCardId) {
      return false;
    }

    // Check if card is in hand
    return state.board.hand && state.board.hand.includes(this.drawnCardId);
  }
}

/**
 * Play card command
 * Moves a card from hand to battlefield
 */
export class PlayCardCommand extends BaseCommand<GameState> {
  constructor(
    userId: string,
    private cardId: string,
    private position?: { x: number; y: number },
  ) {
    super("PLAY_CARD", userId, [cardId], { cardId, position });
  }

  execute(state: GameState): GameState {
    // Move card from hand to battlefield
    const moveCommand = new MoveCardCommand(
      this.userId,
      this.cardId,
      "hand",
      "battlefield",
    );

    const newState = moveCommand.execute(state);

    // Set position if provided
    if (this.position) {
      // Store position in metadata or game state
      // This is game-specific implementation
    }

    return newState;
  }

  undo(state: GameState): GameState {
    // Move card back to hand
    const moveCommand = new MoveCardCommand(
      this.userId,
      this.cardId,
      "battlefield",
      "hand",
    );

    return moveCommand.execute(state);
  }

  protected validateState(state: GameState): boolean {
    if (!super.validateState(state)) {
      return false;
    }

    // Check if card is on battlefield
    return (
      state.board.battlefield && state.board.battlefield.includes(this.cardId)
    );
  }
}
