/**
 * Pokémon TCG Game Adapter
 *
 * Implements Pokémon-specific game rules and state management
 */

import { createGameAction } from "../game-state-manager";
import {
  BaseGameAdapter,
  type GameConfig,
  type ValidationResult,
  type GameStateView,
  type PlayerAction,
} from "./base-game-adapter";
import type { GameStateBase, GameStateAction } from "../game-state-schema";

/**
 * Pokémon-specific game state
 */
export interface PokemonGameState extends GameStateBase {
  gameType: "pokemon";
  players: Array<{
    id: string;
    name: string;
    prizeCards: number;
    activePokemon: string | null;
    bench: Array<{ id: string; name?: string }>;
    hand: Array<{ id: string }>;
    deck: { count: number };
    discardPile: {
      cards: Array<{ id: string; name?: string }>;
      isPublic: boolean;
    };
  }>;
  turnOrder: string[];
  currentTurn: {
    playerId: string;
    phase: "setup" | "draw" | "main" | "attack" | "end";
  };
}

/**
 * Pokémon TCG adapter (skeleton implementation)
 */
export class PokemonAdapter extends BaseGameAdapter<PokemonGameState> {
  readonly gameType = "pokemon";
  readonly gameName = "Pokémon Trading Card Game";
  readonly version = "1.0.0";

  override createInitialState(config: GameConfig): PokemonGameState {
    const players = config.players.map((p) => ({
      id: p.id,
      name: p.name,
      prizeCards: 6, // Standard format uses 6 prize cards
      activePokemon: null,
      bench: [],
      hand: [],
      deck: { count: 60 },
      discardPile: { cards: [], isPublic: true },
    }));

    return {
      version: 0,
      timestamp: Date.now(),
      lastModifiedBy: "system",
      gameType: "pokemon",
      sessionId: `pokemon-${Date.now()}`,
      players,
      turnOrder: players.map((p) => p.id),
      currentTurn: {
        playerId: players[0]?.id || "",
        phase: "setup",
      },
    };
  }

  validateState(state: PokemonGameState): ValidationResult {
    const errors: string[] = [];

    // Validate players
    if (!state.players || state.players.length !== 2) {
      errors.push("Pokémon TCG requires exactly 2 players");
    }

    // Validate prize cards
    for (const player of state.players) {
      if (player.prizeCards < 0) {
        errors.push(`Player ${player.name} has negative prize cards`);
      }
      if (player.prizeCards > 6) {
        errors.push(`Player ${player.name} has more than 6 prize cards`);
      }

      // Validate bench size (max 5 benched Pokémon)
      if (player.bench.length > 5) {
        errors.push(`Player ${player.name} has more than 5 benched Pokémon`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateAction(action: GameStateAction, state: PokemonGameState): boolean {
    // Simplified validation
    switch (action.type) {
      case "draw":
        return this.isPlayerTurn(state, action.playerId);
      case "play":
        return this.isPlayerTurn(state, action.playerId);
      case "declare_attackers": // Attack action in Pokemon
        return this.isPlayerTurn(state, action.playerId);
      case "concede":
        return true;
      default:
        return false;
    }
  }

  applyAction(
    action: GameStateAction,
    state: PokemonGameState,
  ): PokemonGameState {
    // Clone state for immutability
    const newState = this.cloneState(state);
    newState.version++;
    newState.timestamp = Date.now();
    newState.lastModifiedBy = action.playerId;

    // Apply action (simplified implementation)
    switch (action.type) {
      case "draw": {
        const player = newState.players.find((p) => p.id === action.playerId);
        if (player && player.deck.count > 0) {
          player.deck.count--;
          player.hand.push({ id: `card-${Date.now()}` });
        }
        break;
      }
      case "concede": {
        // Mark as game over
        const winner = newState.players.find((p) => p.id !== action.playerId);
        if (winner) {
          // Game ends
        }
        break;
      }
    }

    return newState;
  }

  getLegalActions(
    state: PokemonGameState,
    playerId: string,
  ): GameStateAction[] {
    const actions: GameStateAction[] = [];
    const isMyTurn = this.isPlayerTurn(state, playerId);

    if (!isMyTurn) {
      // Only concede when not your turn
      actions.push(createGameAction("concede", playerId, {}, state.version));
      return actions;
    }

    const player = this.findPlayer(state, playerId) as any;
    if (!player) return actions;

    // Phase-specific actions
    if (state.currentTurn.phase === "draw" && player.deck.count > 0) {
      actions.push(
        createGameAction("draw", playerId, { count: 1 }, state.version),
      );
    }

    if (state.currentTurn.phase === "main" && player.hand.length > 0) {
      // Can play cards from hand
      actions.push(
        createGameAction("play", playerId, { from: "hand" }, state.version),
      );
    }

    if (state.currentTurn.phase === "attack" && player.activePokemon) {
      // Can attack with active Pokémon
      actions.push(
        createGameAction("declare_attackers", playerId, {}, state.version),
      );
    }

    // Always available
    actions.push(createGameAction("concede", playerId, {}, state.version));

    return actions;
  }

  isGameOver(state: PokemonGameState): boolean {
    // Game is over when a player has no prize cards left
    const noPrizeCards = state.players.some((p) => p.prizeCards === 0);
    if (noPrizeCards) return true;

    // Game is over when a player has no Pokémon in play
    const noActivePokemon = state.players.some(
      (p) => !p.activePokemon && p.bench.length === 0,
    );
    if (noActivePokemon) return true;

    // Game is over when a player cannot draw (decked out)
    const deckedOut = state.players.some((p) => p.deck.count === 0);
    if (deckedOut) return true;

    return false;
  }

  getWinner(state: PokemonGameState): string | null {
    if (!this.isGameOver(state)) return null;

    // Winner is player with prize cards remaining
    const playersWithPrizes = state.players.filter((p) => p.prizeCards > 0);
    if (playersWithPrizes.length === 1) {
      return playersWithPrizes[0]?.id || null;
    }

    // Winner is player with Pokémon in play
    const playersWithPokemon = state.players.filter(
      (p) => p.activePokemon || p.bench.length > 0,
    );
    if (playersWithPokemon.length === 1) {
      return playersWithPokemon[0]?.id || null;
    }

    // Winner is player with cards in deck
    const playersWithDeck = state.players.filter((p) => p.deck.count > 0);
    if (playersWithDeck.length === 1) {
      return playersWithDeck[0]?.id || null;
    }

    return null;
  }

  renderState(state: PokemonGameState): GameStateView {
    const publicState = {
      currentTurn: state.currentTurn,
      players: state.players.map((p) => ({
        id: p.id,
        name: p.name,
        prizeCards: p.prizeCards,
        activePokemon: p.activePokemon,
        bench: p.bench,
        handSize: p.hand.length,
        deckSize: p.deck.count,
        discardPile: p.discardPile,
      })),
    };

    const playerStates = new Map<string, unknown>();
    for (const player of state.players) {
      playerStates.set(player.id, {
        hand: player.hand,
      });
    }

    return { publicState, playerStates };
  }

  getPlayerActions(state: PokemonGameState, playerId: string): PlayerAction[] {
    const legalActions = this.getLegalActions(state, playerId);

    return legalActions.map((action) => ({
      id: action.id,
      type: action.type,
      label: this.getActionLabel(action.type),
      icon: this.getActionIcon(action.type),
      enabled: true,
    }));
  }
}
