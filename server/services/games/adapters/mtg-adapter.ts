/**
 * Magic: The Gathering Game Adapter
 *
 * Implements MTG-specific game rules and state management.
 * Supports Commander format with simplified rules for demonstration.
 */

import crypto from "crypto";
import { BaseGameAdapter } from "./base-game-adapter";
import type {
  GameConfig,
  ValidationResult,
  WinResult,
  Phase,
  RenderedState,
  PlayerAction,
} from "../../../../shared/game-adapter-types";

// ============================================================================
// MTG-Specific Types
// ============================================================================

export type MTGZone =
  | "library"
  | "hand"
  | "battlefield"
  | "graveyard"
  | "exile"
  | "command";

export interface MTGCard {
  id: string;
  name: string;
  manaCost: string;
  type: string;
  power?: number;
  toughness?: number;
  abilities?: string[];
}

export interface MTGPlayer {
  id: string;
  name: string;
  life: number;
  zones: Record<MTGZone, MTGCard[]>;
  manaPool: Record<string, number>; // W, U, B, R, G, C
  maxHandSize: number;
  hasPlayedLand: boolean;
  commanderDamage: Record<string, number>; // damage from each opponent's commander
}

export interface MTGGameState {
  gameId: string;
  players: MTGPlayer[];
  activePlayerIndex: number;
  currentPhase: string;
  currentStep: string;
  turnNumber: number;
  priorityPlayerIndex: number;
  stack: MTGAction[];
  isGameOver: boolean;
  winner?: string;
}

export type MTGActionType =
  | "play_land"
  | "cast_spell"
  | "activate_ability"
  | "attack"
  | "block"
  | "pass_priority"
  | "draw_card"
  | "discard_card"
  | "advance_phase";

export interface MTGAction {
  type: MTGActionType;
  playerId: string;
  cardId?: string;
  targetIds?: string[];
  manaPayment?: Record<string, number>;
  timestamp: Date;
}

// ============================================================================
// MTG Game Adapter
// ============================================================================

export class MTGGameAdapter extends BaseGameAdapter<MTGGameState, MTGAction> {
  readonly gameId = "mtg";
  readonly gameName = "Magic: The Gathering";
  readonly version = "1.0.0";

  private readonly STARTING_LIFE = 40; // Commander format
  private readonly STARTING_HAND_SIZE = 7;
  private readonly COMMANDER_DAMAGE_LETHAL = 21;

  // ============================================================================
  // State Management
  // ============================================================================

  createInitialState(config: GameConfig): MTGGameState {
    const players: MTGPlayer[] = [];

    for (let i = 0; i < config.playerCount; i++) {
      const playerId = `player-${i}`;
      players.push({
        id: playerId,
        name: `Player ${i + 1}`,
        life: config.startingResources?.life ?? this.STARTING_LIFE,
        zones: {
          library: this.createLibrary(config.deckLists?.[i]),
          hand: [],
          battlefield: [],
          graveyard: [],
          exile: [],
          command: [],
        },
        manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
        maxHandSize: 7,
        hasPlayedLand: false,
        commanderDamage: {},
      });
    }

    // Draw starting hands
    players.forEach((player) => {
      this.drawCards(player, this.STARTING_HAND_SIZE);
    });

    return {
      gameId: crypto.randomUUID(),
      players,
      activePlayerIndex: 0,
      currentPhase: "beginning",
      currentStep: "untap",
      turnNumber: 1,
      priorityPlayerIndex: 0,
      stack: [],
      isGameOver: false,
    };
  }

  validateState(state: MTGGameState): ValidationResult {
    const errors: string[] = [];

    // Validate player count
    if (state.players.length < 2 || state.players.length > 6) {
      errors.push("Invalid player count. Must be between 2 and 6.");
    }

    // Validate active player index
    if (
      state.activePlayerIndex < 0 ||
      state.activePlayerIndex >= state.players.length
    ) {
      errors.push("Invalid active player index.");
    }

    // Validate each player
    state.players.forEach((player, index) => {
      if (player.life < 0) {
        errors.push(`Player ${index} has negative life.`);
      }

      // Validate zones exist
      const requiredZones: MTGZone[] = [
        "library",
        "hand",
        "battlefield",
        "graveyard",
        "exile",
        "command",
      ];
      requiredZones.forEach((zone) => {
        if (!Array.isArray(player.zones[zone])) {
          errors.push(`Player ${index} missing ${zone} zone.`);
        }
      });
    });

    return this.createValidationResult(
      errors.length === 0,
      errors.length > 0 ? errors : undefined,
    );
  }

  // ============================================================================
  // Actions
  // ============================================================================

  validateAction(state: MTGGameState, action: MTGAction): boolean {
    if (state.isGameOver) {
      return false;
    }

    const player = state.players.find((p) => p.id === action.playerId);
    if (!player) {
      return false;
    }

    switch (action.type) {
      case "play_land":
        return this.canPlayLand(state, player);
      case "cast_spell":
        return this.canCastSpell(state, player, action);
      case "pass_priority":
        return true;
      case "draw_card":
        return player.zones.library.length > 0;
      case "advance_phase":
        return state.activePlayerIndex === state.players.indexOf(player);
      default:
        return false;
    }
  }

  applyAction(state: MTGGameState, action: MTGAction): MTGGameState {
    // Create a deep copy of the state
    const newState = JSON.parse(JSON.stringify(state)) as MTGGameState;
    const player = newState.players.find((p) => p.id === action.playerId);

    if (!player) {
      return newState;
    }

    switch (action.type) {
      case "play_land":
        this.applyPlayLand(newState, player, action);
        break;
      case "cast_spell":
        this.applyCastSpell(newState, player, action);
        break;
      case "draw_card":
        this.drawCards(player, 1);
        break;
      case "advance_phase":
        return this.advancePhase(newState);
      case "pass_priority":
        newState.priorityPlayerIndex =
          (newState.priorityPlayerIndex + 1) % newState.players.length;
        break;
    }

    return newState;
  }

  getAvailableActions(state: MTGGameState, playerId: string): MTGAction[] {
    if (state.isGameOver) {
      return [];
    }

    const actions: MTGAction[] = [];
    const player = state.players.find((p) => p.id === playerId);

    if (!player) {
      return actions;
    }

    const activePlayer = state.players[state.activePlayerIndex];
    const priorityPlayer = state.players[state.priorityPlayerIndex];

    if (!activePlayer || !priorityPlayer) {
      return actions;
    }

    const isActivePlayer = activePlayer.id === playerId;
    const hasPriority = priorityPlayer.id === playerId;

    // Always can pass priority if you have it
    if (hasPriority) {
      actions.push({
        type: "pass_priority",
        playerId,
        timestamp: new Date(),
      });
    }

    // Active player actions during main phase
    if (
      isActivePlayer &&
      hasPriority &&
      (state.currentPhase === "precombat_main" ||
        state.currentPhase === "postcombat_main")
    ) {
      // Can play land if haven't played one this turn
      if (!player.hasPlayedLand && player.zones.hand.length > 0) {
        actions.push({
          type: "play_land",
          playerId,
          timestamp: new Date(),
        });
      }

      // Can cast spells from hand
      player.zones.hand.forEach((card) => {
        actions.push({
          type: "cast_spell",
          playerId,
          cardId: card.id,
          timestamp: new Date(),
        });
      });
    }

    return actions;
  }

  // ============================================================================
  // Rules & Win Conditions
  // ============================================================================

  checkWinCondition(state: MTGGameState): WinResult | null {
    for (const player of state.players) {
      // Check if player lost due to life total
      if (player.life <= 0) {
        const winner = state.players.find(
          (p) => p.id !== player.id && p.life > 0,
        );
        if (winner) {
          return this.createWinResult(winner.id, "opponent_lost_life");
        }
      }

      // Check if player lost due to commander damage
      const commanderDamageEntries = Object.entries(player.commanderDamage);
      for (const [opponentId, damage] of commanderDamageEntries) {
        if (damage >= this.COMMANDER_DAMAGE_LETHAL) {
          return this.createWinResult(opponentId, "commander_damage");
        }
      }

      // Check if player lost due to drawing from empty library
      if (player.zones.library.length === 0) {
        const winner = state.players.find((p) => p.id !== player.id);
        if (winner) {
          return this.createWinResult(winner.id, "opponent_decked");
        }
      }
    }

    // Check if only one player remains
    const activePlayers = state.players.filter((p) => p.life > 0);
    if (activePlayers.length === 1 && activePlayers[0]) {
      return this.createWinResult(activePlayers[0].id, "last_player_standing");
    }

    return null;
  }

  getGamePhases(): Phase[] {
    return [
      this.createPhase(
        "beginning",
        "Beginning Phase",
        1,
        "Untap, Upkeep, Draw",
        ["untap", "draw_card"],
      ),
      this.createPhase(
        "precombat_main",
        "Pre-Combat Main Phase",
        2,
        "Play lands and spells",
        ["play_land", "cast_spell"],
      ),
      this.createPhase(
        "combat",
        "Combat Phase",
        3,
        "Declare attackers and blockers",
        ["attack", "block"],
      ),
      this.createPhase(
        "postcombat_main",
        "Post-Combat Main Phase",
        4,
        "Play more lands and spells",
        ["play_land", "cast_spell"],
      ),
      this.createPhase("ending", "Ending Phase", 5, "End step and cleanup", [
        "discard_card",
      ]),
    ];
  }

  advancePhase(state: MTGGameState): MTGGameState {
    const newState = { ...state };
    const phases = [
      "beginning",
      "precombat_main",
      "combat",
      "postcombat_main",
      "ending",
    ];
    const currentIndex = phases.indexOf(state.currentPhase);

    if (currentIndex < phases.length - 1) {
      // Move to next phase
      const nextPhase = phases[currentIndex + 1];
      if (nextPhase) {
        newState.currentPhase = nextPhase;
      }
    } else {
      // End of turn - move to next player
      const firstPhase = phases[0];
      if (firstPhase) {
        newState.currentPhase = firstPhase;
      }
      newState.activePlayerIndex =
        (state.activePlayerIndex + 1) % state.players.length;
      newState.turnNumber += 1;

      // Reset per-turn flags
      const activePlayer = newState.players[newState.activePlayerIndex];
      if (activePlayer) {
        activePlayer.hasPlayedLand = false;
      }
    }

    return newState;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private createLibrary(deckList?: {
    cards: Array<{ cardId: string; quantity: number }>;
  }): MTGCard[] {
    if (!deckList) {
      // Create a default 100-card Commander deck for testing
      const cards: MTGCard[] = [];
      for (let i = 0; i < 100; i++) {
        cards.push({
          id: `card-${i}`,
          name: `Card ${i}`,
          manaCost: "{1}",
          type: i === 0 ? "Legendary Creature - Commander" : "Creature",
        });
      }
      return this.shuffleDeck(cards);
    }

    // Convert deck list to cards
    const cards: MTGCard[] = [];
    deckList.cards.forEach((entry) => {
      for (let i = 0; i < entry.quantity; i++) {
        cards.push({
          id: `${entry.cardId}-${i}`,
          name: `Card ${entry.cardId}`,
          manaCost: "{1}",
          type: "Creature",
        });
      }
    });

    return this.shuffleDeck(cards);
  }

  private shuffleDeck(cards: MTGCard[]): MTGCard[] {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Use cryptographically secure random for CodeQL compliance
      const randomBuffer = crypto.randomBytes(4);
      const randomValue = randomBuffer.readUInt32BE(0) / 0xffffffff;
      const j = Math.floor(randomValue * (i + 1));
      const temp = shuffled[i];
      const swapCard = shuffled[j];
      if (temp && swapCard) {
        shuffled[i] = swapCard;
        shuffled[j] = temp;
      }
    }
    return shuffled;
  }

  private drawCards(player: MTGPlayer, count: number): void {
    for (let i = 0; i < count; i++) {
      const card = player.zones.library.shift();
      if (card) {
        player.zones.hand.push(card);
      }
    }
  }

  private canPlayLand(state: MTGGameState, player: MTGPlayer): boolean {
    return (
      !player.hasPlayedLand &&
      player.zones.hand.some((c) => c.type.includes("Land"))
    );
  }

  private canCastSpell(
    state: MTGGameState,
    player: MTGPlayer,
    action: MTGAction,
  ): boolean {
    if (!action.cardId) return false;
    const card = player.zones.hand.find((c) => c.id === action.cardId);
    return !!card && !card.type.includes("Land");
  }

  private applyPlayLand(
    state: MTGGameState,
    player: MTGPlayer,
    action: MTGAction,
  ): void {
    if (!action.cardId) return;

    const cardIndex = player.zones.hand.findIndex(
      (c) => c.id === action.cardId,
    );
    if (cardIndex >= 0) {
      const card = player.zones.hand.splice(cardIndex, 1)[0];
      if (card) {
        player.zones.battlefield.push(card);
        player.hasPlayedLand = true;
      }
    }
  }

  private applyCastSpell(
    state: MTGGameState,
    player: MTGPlayer,
    action: MTGAction,
  ): void {
    if (!action.cardId) return;

    const cardIndex = player.zones.hand.findIndex(
      (c) => c.id === action.cardId,
    );
    if (cardIndex >= 0) {
      const card = player.zones.hand.splice(cardIndex, 1)[0];
      state.stack.push({
        ...action,
        timestamp: new Date(),
      });
      // Spell will resolve from stack later
    }
  }

  // ============================================================================
  // UI Helper Methods
  // ============================================================================

  renderState(state: MTGGameState, viewingPlayerId?: string): RenderedState {
    const phases = this.getGamePhases();
    const currentPhaseInfo =
      phases.find((p) => p.id === state.currentPhase) || phases[0];

    return {
      players: state.players.map((player, index) => ({
        id: player.id,
        name: player.name,
        isActive: index === state.activePlayerIndex,
        resources: {
          life: player.life,
          manaPool:
            Object.entries(player.manaPool)
              .filter(([_, value]) => value > 0)
              .map(([color, amount]) => `${color}:${amount}`)
              .join(", ") || "None",
        },
        zones: {
          library: {
            count: player.zones.library.length,
            visible: false,
          },
          hand: {
            count: player.zones.hand.length,
            visible: player.id === viewingPlayerId,
          },
          battlefield: {
            count: player.zones.battlefield.length,
            visible: true,
          },
          graveyard: {
            count: player.zones.graveyard.length,
            visible: true,
          },
          exile: {
            count: player.zones.exile.length,
            visible: true,
          },
          command: {
            count: player.zones.command.length,
            visible: true,
          },
        },
        status: player.life <= 0 ? "eliminated" : undefined,
      })),
      currentPhase: {
        id: currentPhaseInfo!.id,
        name: currentPhaseInfo!.name,
        description: currentPhaseInfo!.description,
      },
      turnNumber: state.turnNumber,
      gameStatus: state.isGameOver ? "finished" : "active",
      winner: state.winner,
      metadata: {
        gameId: this.gameId,
        gameName: this.gameName,
        priorityPlayer: state.players[state.priorityPlayerIndex]?.name,
        stackSize: state.stack.length,
      },
    };
  }

  getPlayerActions(state: MTGGameState, playerId: string): PlayerAction[] {
    const availableActions = this.getAvailableActions(state, playerId);
    const player = state.players.find((p) => p.id === playerId);

    if (!player) {
      return [];
    }

    return availableActions.map((action) => {
      const baseAction: PlayerAction = {
        id: `${action.type}-${action.timestamp.getTime()}`,
        type: action.type,
        label: this.formatMTGActionLabel(action.type),
        description: this.formatMTGActionDescription(action, player),
        icon: this.getMTGActionIcon(action.type),
      };

      if (action.cardId) {
        const card = player.zones.hand.find((c) => c.id === action.cardId);
        if (card) {
          baseAction.description = `${baseAction.label}: ${card.name} (${card.manaCost})`;
        }
      }

      return baseAction;
    });
  }

  private formatMTGActionLabel(actionType: MTGActionType): string {
    const labels: Record<MTGActionType, string> = {
      play_land: "Play Land",
      cast_spell: "Cast Spell",
      activate_ability: "Activate Ability",
      attack: "Declare Attack",
      block: "Declare Block",
      pass_priority: "Pass Priority",
      draw_card: "Draw Card",
      discard_card: "Discard Card",
      advance_phase: "Advance Phase",
    };
    return labels[actionType] || actionType;
  }

  private formatMTGActionDescription(
    action: MTGAction,
    player: MTGPlayer,
  ): string {
    switch (action.type) {
      case "play_land":
        return "Play a land card from your hand";
      case "cast_spell":
        return "Cast a spell from your hand";
      case "pass_priority":
        return "Pass priority to the next player";
      case "draw_card":
        return `Draw a card (${player.zones.library.length} remaining)`;
      default:
        return this.formatMTGActionLabel(action.type);
    }
  }

  private getMTGActionIcon(actionType: MTGActionType): string {
    const icons: Partial<Record<MTGActionType, string>> = {
      play_land: "🏞️",
      cast_spell: "✨",
      activate_ability: "⚡",
      attack: "⚔️",
      block: "🛡️",
      pass_priority: "👉",
      draw_card: "📥",
      discard_card: "🗑️",
      advance_phase: "⏭️",
    };
    return icons[actionType] || "🎴";
  }
}
