/**
 * Magic: The Gathering Game Adapter
 *
 * Implements MTG-specific game rules and state management
 */

import { GameStateManager, createGameAction } from "../game-state-manager";
import {
  BaseGameAdapter,
  type GameConfig,
  type ValidationResult,
  type GameStateView,
  type PlayerAction,
} from "./base-game-adapter";
import type { TCGGameState, GameStateAction } from "../game-state-schema";

/**
 * MTG-specific adapter implementing Magic: The Gathering rules
 */
export class MTGAdapter extends BaseGameAdapter<TCGGameState> {
  readonly gameType = "mtg";
  readonly gameName = "Magic: The Gathering";
  readonly version = "1.0.0";

  private manager = new GameStateManager();

  createInitialState(config: GameConfig): TCGGameState {
    const players = config.players.map((p) => ({
      id: p.id,
      name: p.name,
      lifeTotal: 20,
      poisonCounters: 0,
      hand: [],
      graveyard: { cards: [], isPublic: true },
      library: { count: 60 },
      exile: { cards: [], isPublic: true },
      resources: {},
    }));

    return {
      version: 0,
      timestamp: Date.now(),
      lastModifiedBy: "system",
      gameType: "tcg",
      sessionId: `mtg-${Date.now()}`,
      players,
      turnOrder: players.map((p) => p.id),
      currentTurn: {
        playerId: players[0].id,
        phase: "untap",
        turnNumber: 1,
      },
      stack: [],
      battlefield: {
        permanents: [],
      },
    };
  }

  validateState(state: TCGGameState): ValidationResult {
    const errors: string[] = [];

    // Validate players exist
    if (!state.players || state.players.length < 2) {
      errors.push("Game must have at least 2 players");
    }

    // Validate player life totals
    for (const player of state.players) {
      if (player.lifeTotal < 0 && !this.isGameOver(state)) {
        errors.push(
          `Player ${player.name} has negative life but game is not over`,
        );
      }

      // Check poison counters
      if (
        player.poisonCounters &&
        player.poisonCounters >= 10 &&
        !this.isGameOver(state)
      ) {
        errors.push(
          `Player ${player.name} has 10+ poison counters but game is not over`,
        );
      }
    }

    // Validate turn order
    if (state.turnOrder.length !== state.players.length) {
      errors.push("Turn order does not match player count");
    }

    // Validate current turn
    if (!state.turnOrder.includes(state.currentTurn.playerId)) {
      errors.push("Current turn player not in turn order");
    }

    // Validate battlefield
    if (!state.battlefield) {
      errors.push("Battlefield is missing");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateAction(action: GameStateAction, state: TCGGameState): boolean {
    switch (action.type) {
      case "draw":
        return this.validateDraw(action, state);
      case "play":
        return this.validatePlay(action, state);
      case "tap":
      case "untap":
        return this.validateTapUntap(action, state);
      case "concede":
        return true; // Players can always concede
      case "pass_priority":
        return true; // Can always pass priority
      default:
        return false;
    }
  }

  applyAction(action: GameStateAction, state: TCGGameState): TCGGameState {
    // Delegate to the game state manager for actual state manipulation
    if (!this.manager.getCurrentVersion()) {
      this.manager.initialize(state);
    }

    return this.manager.applyAction(action, state);
  }

  getLegalActions(state: TCGGameState, playerId: string): GameStateAction[] {
    const actions: GameStateAction[] = [];
    const isMyTurn = this.isPlayerTurn(state, playerId);
    const player = this.findPlayer(state, playerId) as any;

    if (!player) return actions;

    // Draw action (during draw phase on your turn)
    if (
      isMyTurn &&
      state.currentTurn.phase === "draw" &&
      player.library.count > 0
    ) {
      actions.push(
        createGameAction("draw", playerId, { count: 1 }, state.version),
      );
    }

    // Play card actions (during main phases on your turn)
    if (
      isMyTurn &&
      (state.currentTurn.phase === "main1" ||
        state.currentTurn.phase === "main2")
    ) {
      if (player.hand.length > 0) {
        for (const card of player.hand) {
          actions.push(
            createGameAction(
              "play",
              playerId,
              { cardId: card.id },
              state.version,
            ),
          );
        }
      }
    }

    // Tap/untap permanents you control
    const myPermanents = state.battlefield.permanents.filter(
      (p) => p.controllerId === playerId,
    );

    for (const permanent of myPermanents) {
      if (!permanent.isTapped) {
        actions.push(
          createGameAction(
            "tap",
            playerId,
            { cardId: permanent.id },
            state.version,
          ),
        );
      } else {
        actions.push(
          createGameAction(
            "untap",
            playerId,
            { cardId: permanent.id },
            state.version,
          ),
        );
      }
    }

    // Pass priority (always available during your turn)
    if (isMyTurn) {
      actions.push(
        createGameAction("pass_priority", playerId, {}, state.version),
      );
    }

    // Concede (always available)
    actions.push(createGameAction("concede", playerId, {}, state.version));

    return actions;
  }

  isGameOver(state: TCGGameState): boolean {
    // Check life totals
    const alivePlayers = state.players.filter(
      (p) => p.lifeTotal > 0 && (p.poisonCounters || 0) < 10 && !p.hasLost,
    );

    // Game is over if 1 or fewer players remain
    if (alivePlayers.length <= 1) {
      return true;
    }

    // Check if game has a declared winner
    if (state.winnerId) {
      return true;
    }

    return false;
  }

  getWinner(state: TCGGameState): string | null {
    if (!this.isGameOver(state)) return null;

    // Check if winner is already declared
    if (state.winnerId) {
      return state.winnerId;
    }

    // Find remaining alive player
    const alivePlayers = state.players.filter(
      (p) => p.lifeTotal > 0 && (p.poisonCounters || 0) < 10 && !p.hasLost,
    );

    return alivePlayers[0]?.id || null;
  }

  renderState(state: TCGGameState): GameStateView {
    // Public state (visible to all)
    const publicState = {
      currentTurn: state.currentTurn,
      battlefield: state.battlefield,
      stack: state.stack,
      players: state.players.map((p) => ({
        id: p.id,
        name: p.name,
        lifeTotal: p.lifeTotal,
        poisonCounters: p.poisonCounters,
        handSize: p.hand.length,
        librarySize: p.library.count,
        graveyard: p.graveyard,
        exile: p.exile,
        hasLost: p.hasLost,
      })),
    };

    // Private states (per player)
    const playerStates = new Map<string, unknown>();
    for (const player of state.players) {
      playerStates.set(player.id, {
        hand: player.hand,
        libraryTop: player.library.topCard,
      });
    }

    return { publicState, playerStates };
  }

  getPlayerActions(state: TCGGameState, playerId: string): PlayerAction[] {
    const legalActions = this.getLegalActions(state, playerId);

    return legalActions.map((action) => ({
      id: action.id,
      type: action.type,
      label: this.getActionLabel(action.type),
      icon: this.getActionIcon(action.type),
      enabled: true,
    }));
  }

  // Private validation helpers

  private validateDraw(action: GameStateAction, state: TCGGameState): boolean {
    const player = this.findPlayer(state, action.playerId) as any;
    if (!player) return false;

    // Must have cards in library
    if (player.library.count <= 0) return false;

    // Must be player's turn and draw phase (simplified rule)
    return this.isPlayerTurn(state, action.playerId);
  }

  private validatePlay(action: GameStateAction, state: TCGGameState): boolean {
    const player = this.findPlayer(state, action.playerId) as any;
    if (!player) return false;

    // Must be player's turn
    if (!this.isPlayerTurn(state, action.playerId)) return false;

    // Must be in a main phase
    const phase = state.currentTurn.phase;
    if (phase !== "main1" && phase !== "main2") return false;

    // Must have the card in hand
    const cardId = action.payload.cardId as string;
    return player.hand.some((c: { id: string }) => c.id === cardId);
  }

  private validateTapUntap(
    action: GameStateAction,
    state: TCGGameState,
  ): boolean {
    const cardId = action.payload.cardId as string;
    const permanent = state.battlefield.permanents.find((p) => p.id === cardId);

    if (!permanent) return false;

    // Must control the permanent
    if (permanent.controllerId !== action.playerId) return false;

    // Check current tapped state matches action
    if (action.type === "tap" && permanent.isTapped) return false;
    if (action.type === "untap" && !permanent.isTapped) return false;

    return true;
  }
}
