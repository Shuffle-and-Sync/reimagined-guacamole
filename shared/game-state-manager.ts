/**
 * Game State Manager with Versioning and Conflict Resolution
 *
 * Implements operational transformation for handling concurrent updates,
 * state history for undo/redo, and conflict resolution.
 *
 * Based on recommendations in Section 2.1 of TABLESYNC_ANALYSIS_AND_RECOMMENDATIONS.md
 */

import {
  TCGGameState,
  GameStateAction,
  GameActionType,
  TCGGameStateSchema,
  GameStateActionSchema,
} from "./game-state-schema";

// ============================================================================
// Game State Manager
// ============================================================================

/**
 * Manages game state with versioning, history, and conflict resolution
 */
export class GameStateManager {
  private stateHistory: Map<number, TCGGameState> = new Map();
  private actionLog: GameStateAction[] = [];
  private currentVersion: number = 0;
  private readonly maxHistorySize: number;

  /**
   * Create a new game state manager
   * @param maxHistorySize Maximum number of states to keep in history (default: 100)
   */
  constructor(maxHistorySize: number = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Initialize with an existing game state
   */
  initialize(state: TCGGameState): void {
    const validationResult = TCGGameStateSchema.safeParse(state);
    if (!validationResult.success) {
      throw new Error(
        `Invalid initial state: ${validationResult.error.message}`,
      );
    }

    this.currentVersion = state.version;
    this.stateHistory.set(state.version, state);
  }

  /**
   * Apply an action to the current state
   * Returns the new state or throws an error
   */
  applyAction(
    action: GameStateAction,
    currentState: TCGGameState,
  ): TCGGameState {
    // Validate action
    const validationResult = GameStateActionSchema.safeParse(action);
    if (!validationResult.success) {
      throw new Error(`Invalid action: ${validationResult.error.message}`);
    }

    // Check if action is based on current version
    if (action.previousStateVersion !== this.currentVersion) {
      // Handle conflict through operational transformation
      return this.resolveConflict(action, currentState);
    }

    // Apply action to create new state
    const newState = this.executeAction(action, currentState);
    newState.version = ++this.currentVersion;
    newState.timestamp = Date.now();
    newState.lastModifiedBy = action.playerId;

    // Store in history for undo/redo
    this.stateHistory.set(newState.version, newState);
    this.actionLog.push({
      ...action,
      resultingStateVersion: newState.version,
    });

    // Trim history to prevent unbounded growth
    this.trimHistory();

    return newState;
  }

  /**
   * Resolve conflicts when action is based on old version
   * Uses operational transformation to transform the action
   */
  private resolveConflict(
    action: GameStateAction,
    currentState: TCGGameState,
  ): TCGGameState {
    // Get all actions that happened since the action's base version
    const concurrentActions = this.getActionsSince(action.previousStateVersion);

    // Transform the action against all concurrent actions
    const transformedAction = this.transformAction(action, concurrentActions);

    // Apply the transformed action
    return this.executeAction(transformedAction, currentState);
  }

  /**
   * Transform an action against a list of concurrent actions
   * Implements operational transformation algorithm
   */
  private transformAction(
    action: GameStateAction,
    concurrentActions: GameStateAction[],
  ): GameStateAction {
    let transformed = { ...action };

    for (const concurrent of concurrentActions) {
      transformed = this.transformAgainst(transformed, concurrent);
    }

    return transformed;
  }

  /**
   * Transform one action against another
   * Returns the transformed action that can be safely applied
   */
  private transformAgainst(
    action: GameStateAction,
    against: GameStateAction,
  ): GameStateAction {
    // Handle specific action type combinations
    const key = `${action.type}:${against.type}`;

    switch (key) {
      // Both players trying to tap the same permanent
      case "tap:tap": {
        const cardId = action.payload.cardId;
        const againstCardId = against.payload.cardId;
        if (cardId === againstCardId) {
          // First action wins, second becomes no-op
          return { ...action, type: "pass_priority" };
        }
        break;
      }

      // Trying to tap a permanent that was untapped by another action
      case "tap:untap": {
        const cardId = action.payload.cardId;
        const againstCardId = against.payload.cardId;
        if (cardId === againstCardId) {
          // The untap happened first, so tap is still valid
          return action;
        }
        break;
      }

      // Both players drawing from their own libraries - both valid
      case "draw:draw": {
        if (action.playerId !== against.playerId) {
          return action; // Independent actions
        }
        // Same player drawing multiple times - both valid
        return action;
      }

      // Moving a card that was already moved
      case "move_zone:move_zone": {
        const cardId = action.payload.cardId;
        const againstCardId = against.payload.cardId;
        if (cardId === againstCardId) {
          // Card was moved by concurrent action, this action is invalid
          return { ...action, type: "pass_priority" };
        }
        break;
      }

      // Life changes are commutative
      case "change_life:change_life": {
        if (action.playerId === against.playerId) {
          // Both actions affect same player - apply both deltas
          return action;
        }
        break;
      }

      // Adding counters is commutative
      case "add_counter:add_counter": {
        const cardId = action.payload.cardId;
        const againstCardId = against.payload.cardId;
        if (cardId === againstCardId) {
          // Both adding counters to same card - both valid
          return action;
        }
        break;
      }

      // Default: most actions are independent
      default:
        return action;
    }

    return action;
  }

  /**
   * Execute an action against a state to produce a new state
   * This is where game rules are applied
   */
  private executeAction(
    action: GameStateAction,
    state: TCGGameState,
  ): TCGGameState {
    // Deep clone state to ensure immutability
    const newState = JSON.parse(JSON.stringify(state)) as TCGGameState;

    switch (action.type) {
      case "draw":
        return this.handleDraw(newState, action);
      case "play":
        return this.handlePlay(newState, action);
      case "tap":
        return this.handleTap(newState, action);
      case "untap":
        return this.handleUntap(newState, action);
      case "move_zone":
        return this.handleMoveZone(newState, action);
      case "change_life":
        return this.handleChangeLife(newState, action);
      case "add_counter":
        return this.handleAddCounter(newState, action);
      case "remove_counter":
        return this.handleRemoveCounter(newState, action);
      case "advance_phase":
        return this.handleAdvancePhase(newState, action);
      case "add_to_stack":
        return this.handleAddToStack(newState, action);
      case "resolve_stack":
        return this.handleResolveStack(newState, action);
      case "concede":
        return this.handleConcede(newState, action);
      case "pass_priority":
        // No-op action for conflict resolution
        return newState;
      default:
        // Unknown action type - return state unchanged
        return newState;
    }
  }

  /**
   * Handle draw action
   */
  private handleDraw(
    state: TCGGameState,
    action: GameStateAction,
  ): TCGGameState {
    const player = state.players.find((p) => p.id === action.playerId);
    if (!player) return state;

    const count = (action.payload.count as number) || 1;

    // Draw cards from library to hand
    for (let i = 0; i < count && player.library.count > 0; i++) {
      player.library.count--;
      player.hand.push({
        id: `card-${Date.now()}-${i}`,
        isFaceUp: false,
      });
    }

    return state;
  }

  /**
   * Handle play action (playing a card)
   */
  private handlePlay(
    state: TCGGameState,
    action: GameStateAction,
  ): TCGGameState {
    const player = state.players.find((p) => p.id === action.playerId);
    if (!player) return state;

    const cardId = action.payload.cardId as string;
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);

    if (cardIndex !== -1) {
      const card = player.hand[cardIndex];
      if (!card) return state;

      player.hand.splice(cardIndex, 1);

      // Add to battlefield as permanent
      state.battlefield.permanents.push({
        id: card.id,
        name: card.name,
        isTapped: false,
        isFaceUp: true,
        counters: card.counters,
        attachments: card.attachments,
        metadata: card.metadata,
        ownerId: action.playerId,
        controllerId: action.playerId,
      });
    }

    return state;
  }

  /**
   * Handle tap action
   */
  private handleTap(
    state: TCGGameState,
    action: GameStateAction,
  ): TCGGameState {
    const cardId = action.payload.cardId as string;
    const permanent = state.battlefield.permanents.find((p) => p.id === cardId);

    if (permanent && !permanent.isTapped) {
      permanent.isTapped = true;
    }

    return state;
  }

  /**
   * Handle untap action
   */
  private handleUntap(
    state: TCGGameState,
    action: GameStateAction,
  ): TCGGameState {
    const cardId = action.payload.cardId as string;
    const permanent = state.battlefield.permanents.find((p) => p.id === cardId);

    if (permanent && permanent.isTapped) {
      permanent.isTapped = false;
    }

    return state;
  }

  /**
   * Handle move zone action (moving a card between zones)
   */
  private handleMoveZone(
    state: TCGGameState,
    action: GameStateAction,
  ): TCGGameState {
    const cardId = action.payload.cardId as string;
    const fromZone = action.payload.fromZone as string;
    const toZone = action.payload.toZone as string;
    const playerId = action.payload.targetPlayerId as string | undefined;

    const player = state.players.find(
      (p) => p.id === (playerId || action.playerId),
    );
    if (!player) return state;

    // Find and remove card from source zone
    let card: any = null;

    if (fromZone === "battlefield") {
      const index = state.battlefield.permanents.findIndex(
        (p) => p.id === cardId,
      );
      if (index !== -1) {
        card = state.battlefield.permanents.splice(index, 1)[0];
      }
    } else if (fromZone === "hand") {
      const index = player.hand.findIndex((c) => c.id === cardId);
      if (index !== -1) {
        card = player.hand.splice(index, 1)[0];
      }
    }

    // Add to destination zone
    if (card) {
      if (toZone === "graveyard") {
        player.graveyard.cards.push(card);
      } else if (toZone === "exile") {
        player.exile.cards.push(card);
      } else if (toZone === "hand") {
        player.hand.push(card);
      }
    }

    return state;
  }

  /**
   * Handle change life action
   */
  private handleChangeLife(
    state: TCGGameState,
    action: GameStateAction,
  ): TCGGameState {
    const player = state.players.find(
      (p) =>
        p.id === ((action.payload.targetPlayerId as string) || action.playerId),
    );
    if (!player) return state;

    const delta = action.payload.delta as number;
    player.lifeTotal += delta;

    // Check for loss condition
    if (player.lifeTotal <= 0) {
      player.hasLost = true;
      player.lossReason = "life total reached 0";
    }

    return state;
  }

  /**
   * Handle add counter action
   */
  private handleAddCounter(
    state: TCGGameState,
    action: GameStateAction,
  ): TCGGameState {
    const cardId = action.payload.cardId as string;
    const counterType = action.payload.counterType as string;
    const count = (action.payload.count as number) || 1;

    const permanent = state.battlefield.permanents.find((p) => p.id === cardId);
    if (permanent) {
      if (!permanent.counters) {
        permanent.counters = {};
      }
      permanent.counters[counterType] =
        (permanent.counters[counterType] || 0) + count;
    }

    return state;
  }

  /**
   * Handle remove counter action
   */
  private handleRemoveCounter(
    state: TCGGameState,
    action: GameStateAction,
  ): TCGGameState {
    const cardId = action.payload.cardId as string;
    const counterType = action.payload.counterType as string;
    const count = (action.payload.count as number) || 1;

    const permanent = state.battlefield.permanents.find((p) => p.id === cardId);
    if (permanent && permanent.counters && permanent.counters[counterType]) {
      permanent.counters[counterType] = Math.max(
        0,
        permanent.counters[counterType] - count,
      );
    }

    return state;
  }

  /**
   * Handle advance phase action
   */
  private handleAdvancePhase(
    state: TCGGameState,
    _action: GameStateAction,
  ): TCGGameState {
    const phases = [
      "untap",
      "upkeep",
      "draw",
      "main1",
      "combat_begin",
      "combat_attackers",
      "combat_blockers",
      "combat_damage",
      "combat_end",
      "main2",
      "end",
      "cleanup",
    ] as const;

    const currentPhaseIndex = phases.indexOf(state.currentTurn.phase);
    const nextPhaseIndex = (currentPhaseIndex + 1) % phases.length;

    const nextPhase = phases[nextPhaseIndex];
    if (nextPhase) {
      state.currentTurn.phase = nextPhase;
    }

    // If we wrapped around to untap, advance to next player
    if (nextPhaseIndex === 0) {
      const currentPlayerIndex = state.turnOrder.indexOf(
        state.currentTurn.playerId,
      );
      const nextPlayerIndex = (currentPlayerIndex + 1) % state.turnOrder.length;
      const nextPlayerId = state.turnOrder[nextPlayerIndex];
      if (nextPlayerId) {
        state.currentTurn.playerId = nextPlayerId;
      }
      state.currentTurn.turnNumber++;
    }

    return state;
  }

  /**
   * Handle add to stack action
   */
  private handleAddToStack(
    state: TCGGameState,
    action: GameStateAction,
  ): TCGGameState {
    const stackItem = action.payload.stackItem as any;
    if (stackItem) {
      state.stack.push(stackItem);
    }
    return state;
  }

  /**
   * Handle resolve stack action
   */
  private handleResolveStack(
    state: TCGGameState,
    _action: GameStateAction,
  ): TCGGameState {
    if (state.stack.length > 0) {
      // Resolve top item on stack (LIFO)
      state.stack.pop();
    }
    return state;
  }

  /**
   * Handle concede action
   */
  private handleConcede(
    state: TCGGameState,
    action: GameStateAction,
  ): TCGGameState {
    const player = state.players.find((p) => p.id === action.playerId);
    if (player) {
      player.hasLost = true;
      player.lossReason = "conceded";

      // Check if there's a winner
      const remainingPlayers = state.players.filter((p) => !p.hasLost);
      if (remainingPlayers.length === 1) {
        const winner = remainingPlayers[0];
        if (winner) {
          state.winnerId = winner.id;
          state.winCondition = "opponents conceded";
        }
      }
    }
    return state;
  }

  /**
   * Undo the last N state changes
   * Returns the previous state or null if not enough history
   */
  undo(steps: number = 1): TCGGameState | null {
    const targetVersion = this.currentVersion - steps;
    if (targetVersion < 0) {
      return null;
    }

    const previousState = this.stateHistory.get(targetVersion);
    if (previousState) {
      this.currentVersion = targetVersion;
      return previousState;
    }

    return null;
  }

  /**
   * Redo N state changes that were undone
   * Returns the next state or null if can't redo
   */
  redo(steps: number = 1): TCGGameState | null {
    const targetVersion = this.currentVersion + steps;
    const nextState = this.stateHistory.get(targetVersion);

    if (nextState) {
      this.currentVersion = targetVersion;
      return nextState;
    }

    return null;
  }

  /**
   * Get all actions since a specific version
   */
  getActionsSince(version: number): GameStateAction[] {
    return this.actionLog.filter(
      (action) => action.previousStateVersion >= version,
    );
  }

  /**
   * Get the current version number
   */
  getCurrentVersion(): number {
    return this.currentVersion;
  }

  /**
   * Get state at a specific version
   */
  getStateAtVersion(version: number): TCGGameState | null {
    return this.stateHistory.get(version) || null;
  }

  /**
   * Get all stored versions
   */
  getAvailableVersions(): number[] {
    return Array.from(this.stateHistory.keys()).sort((a, b) => a - b);
  }

  /**
   * Trim history to prevent unbounded growth
   */
  private trimHistory(): void {
    if (this.stateHistory.size > this.maxHistorySize) {
      const versions = this.getAvailableVersions();
      const versionsToRemove = versions.slice(
        0,
        versions.length - this.maxHistorySize,
      );

      for (const version of versionsToRemove) {
        this.stateHistory.delete(version);
      }

      // Also trim action log
      this.actionLog = this.actionLog.filter(
        (action) =>
          !versionsToRemove.includes(action.previousStateVersion) &&
          !versionsToRemove.includes(action.resultingStateVersion),
      );
    }
  }

  /**
   * Clear all history and reset to empty state
   */
  clear(): void {
    this.stateHistory.clear();
    this.actionLog = [];
    this.currentVersion = 0;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a new game state action
 */
export function createGameAction(
  type: GameActionType,
  playerId: string,
  payload: Record<string, unknown>,
  previousVersion: number,
): GameStateAction {
  return {
    id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type,
    playerId,
    timestamp: Date.now(),
    payload,
    previousStateVersion: previousVersion,
    resultingStateVersion: previousVersion + 1,
  };
}

/**
 * Create an initial TCG game state
 */
export function createInitialTCGState(
  sessionId: string,
  playerIds: string[],
  playerNames: string[],
): TCGGameState {
  const players = playerIds.map((id, index) => {
    const playerName = playerNames[index];
    return {
      id,
      name: playerName !== undefined ? playerName : `Player ${index + 1}`,
      lifeTotal: 20,
      poisonCounters: 0,
      hand: [],
      graveyard: { cards: [], isPublic: true },
      library: { count: 60 },
      exile: { cards: [], isPublic: true },
      resources: {},
    };
  });

  const firstPlayerId = playerIds[0];
  if (!firstPlayerId) {
    throw new Error("At least one player is required to create a game state");
  }

  return {
    version: 0,
    timestamp: Date.now(),
    lastModifiedBy: firstPlayerId,
    gameType: "tcg",
    sessionId,
    players,
    turnOrder: playerIds,
    currentTurn: {
      playerId: firstPlayerId,
      phase: "untap",
      turnNumber: 1,
    },
    stack: [],
    battlefield: {
      permanents: [],
    },
  };
}
