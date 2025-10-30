/**
 * Yu-Gi-Oh Trading Card Game Adapter
 *
 * Implements Yu-Gi-Oh-specific game rules and state management.
 * Supports standard format with simplified rules for demonstration.
 */

import crypto from "crypto";
import { BaseGameAdapter } from "./base-game-adapter";
import type {
  GameConfig,
  ValidationResult,
  WinResult,
  Phase,
} from "../../../../shared/game-adapter-types";

// ============================================================================
// Yu-Gi-Oh-Specific Types
// ============================================================================

export type YuGiOhZone =
  | "deck"
  | "hand"
  | "monster_zones"
  | "spell_trap_zones"
  | "field_zone"
  | "extra_deck"
  | "graveyard"
  | "banished";

export type YuGiOhCardType =
  | "Monster"
  | "Spell"
  | "Trap"
  | "Fusion"
  | "Synchro"
  | "Xyz"
  | "Link";

export type YuGiOhAttribute =
  | "DARK"
  | "LIGHT"
  | "EARTH"
  | "WATER"
  | "FIRE"
  | "WIND"
  | "DIVINE";

export interface YuGiOhCard {
  id: string;
  name: string;
  type: YuGiOhCardType;
  attribute?: YuGiOhAttribute;
  level?: number;
  rank?: number; // For Xyz monsters
  link?: number; // For Link monsters
  atk?: number;
  def?: number;
  effect?: string;
  position?:
    | "face-up-attack"
    | "face-up-defense"
    | "face-down-attack"
    | "face-down-defense";
}

export interface YuGiOhPlayer {
  id: string;
  name: string;
  lifePoints: number;
  zones: Record<YuGiOhZone, YuGiOhCard[]>;
  normalSummonUsed: boolean;
}

export interface YuGiOhGameState {
  gameId: string;
  players: YuGiOhPlayer[];
  activePlayerIndex: number;
  currentPhase: string;
  turnNumber: number;
  chainStack: YuGiOhAction[];
  isGameOver: boolean;
  winner?: string;
}

export type YuGiOhActionType =
  | "draw_card"
  | "normal_summon"
  | "special_summon"
  | "set_monster"
  | "set_spell_trap"
  | "activate_spell"
  | "activate_trap"
  | "change_battle_position"
  | "declare_attack"
  | "activate_effect"
  | "advance_phase"
  | "end_turn";

export interface YuGiOhAction {
  type: YuGiOhActionType;
  playerId: string;
  cardId?: string;
  targetId?: string;
  position?: "attack" | "defense";
  timestamp: Date;
}

// ============================================================================
// Yu-Gi-Oh Game Adapter
// ============================================================================

export class YuGiOhGameAdapter extends BaseGameAdapter<
  YuGiOhGameState,
  YuGiOhAction
> {
  readonly gameId = "yugioh";
  readonly gameName = "Yu-Gi-Oh Trading Card Game";
  readonly version = "1.0.0";

  private readonly STARTING_LIFE_POINTS = 8000;
  private readonly STARTING_HAND_SIZE = 5;
  private readonly MAX_MONSTER_ZONES = 5;
  private readonly MAX_SPELL_TRAP_ZONES = 5;

  // ============================================================================
  // State Management
  // ============================================================================

  createInitialState(config: GameConfig): YuGiOhGameState {
    if (config.playerCount !== 2) {
      throw new Error("Yu-Gi-Oh TCG only supports 2 players");
    }

    const players: YuGiOhPlayer[] = [];

    for (let i = 0; i < config.playerCount; i++) {
      const playerId = `player-${i}`;
      players.push({
        id: playerId,
        name: `Player ${i + 1}`,
        lifePoints:
          config.startingResources?.lifePoints ?? this.STARTING_LIFE_POINTS,
        zones: {
          deck: this.createDeck(config.deckLists?.[i]),
          hand: [],
          monster_zones: [],
          spell_trap_zones: [],
          field_zone: [],
          extra_deck: [],
          graveyard: [],
          banished: [],
        },
        normalSummonUsed: false,
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
      currentPhase: "draw",
      turnNumber: 1,
      chainStack: [],
      isGameOver: false,
    };
  }

  validateState(state: YuGiOhGameState): ValidationResult {
    const errors: string[] = [];

    // Validate player count
    if (state.players.length !== 2) {
      errors.push("Yu-Gi-Oh TCG must have exactly 2 players.");
    }

    // Validate each player
    state.players.forEach((player, index) => {
      // Check life points
      if (player.lifePoints < 0) {
        errors.push(`Player ${index} has negative life points.`);
      }

      // Check monster zone limits
      if (player.zones.monster_zones.length > this.MAX_MONSTER_ZONES) {
        errors.push(
          `Player ${index} has too many monsters (max ${this.MAX_MONSTER_ZONES}).`,
        );
      }

      // Check spell/trap zone limits
      if (player.zones.spell_trap_zones.length > this.MAX_SPELL_TRAP_ZONES) {
        errors.push(
          `Player ${index} has too many spell/trap cards (max ${this.MAX_SPELL_TRAP_ZONES}).`,
        );
      }

      // Check field zone limit (0 or 1)
      if (player.zones.field_zone.length > 1) {
        errors.push(`Player ${index} has multiple field spells (max 1).`);
      }

      // Validate zones exist
      const requiredZones: YuGiOhZone[] = [
        "deck",
        "hand",
        "monster_zones",
        "spell_trap_zones",
        "field_zone",
        "extra_deck",
        "graveyard",
        "banished",
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

  validateAction(state: YuGiOhGameState, action: YuGiOhAction): boolean {
    if (state.isGameOver) {
      return false;
    }

    const player = state.players.find((p) => p.id === action.playerId);
    if (!player) {
      return false;
    }

    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer) {
      return false;
    }

    const isActivePlayer = activePlayer.id === action.playerId;

    // Only active player can take most actions
    if (!isActivePlayer) {
      return false;
    }

    switch (action.type) {
      case "draw_card":
        return state.currentPhase === "draw" && player.zones.deck.length > 0;
      case "normal_summon":
        return this.canNormalSummon(state, player, action);
      case "set_monster":
        return this.canSetMonster(state, player, action);
      case "set_spell_trap":
        return this.canSetSpellTrap(state, player, action);
      case "declare_attack":
        return state.currentPhase === "battle" && this.canAttack(player);
      case "end_turn":
        return isActivePlayer;
      default:
        return false;
    }
  }

  applyAction(state: YuGiOhGameState, action: YuGiOhAction): YuGiOhGameState {
    // Create a deep copy of the state
    const newState = JSON.parse(JSON.stringify(state)) as YuGiOhGameState;
    const player = newState.players.find((p) => p.id === action.playerId);

    if (!player) {
      return newState;
    }

    switch (action.type) {
      case "draw_card":
        this.drawCards(player, 1);
        break;
      case "normal_summon":
        this.applyNormalSummon(newState, player, action);
        break;
      case "set_monster":
        this.applySetMonster(newState, player, action);
        break;
      case "set_spell_trap":
        this.applySetSpellTrap(newState, player, action);
        break;
      case "declare_attack":
        this.applyAttack(newState, player, action);
        break;
      case "end_turn":
        return this.endTurn(newState);
      case "advance_phase":
        return this.advancePhase(newState);
    }

    return newState;
  }

  getAvailableActions(
    state: YuGiOhGameState,
    playerId: string,
  ): YuGiOhAction[] {
    if (state.isGameOver) {
      return [];
    }

    const actions: YuGiOhAction[] = [];
    const player = state.players.find((p) => p.id === playerId);

    if (!player) {
      return actions;
    }

    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer) {
      return actions;
    }

    const isActivePlayer = activePlayer.id === playerId;

    if (!isActivePlayer) {
      return actions;
    }

    // Always can end turn
    actions.push({
      type: "end_turn",
      playerId,
      timestamp: new Date(),
    });

    // Draw phase
    if (state.currentPhase === "draw" && player.zones.deck.length > 0) {
      actions.push({
        type: "draw_card",
        playerId,
        timestamp: new Date(),
      });
    }

    // Main phase 1 and 2
    if (state.currentPhase === "main1" || state.currentPhase === "main2") {
      // Can normal summon if not used yet
      if (!player.normalSummonUsed) {
        player.zones.hand
          .filter((card) => card.type === "Monster")
          .forEach((card) => {
            actions.push({
              type: "normal_summon",
              playerId,
              cardId: card.id,
              timestamp: new Date(),
            });
          });
      }

      // Can set monsters
      if (player.zones.monster_zones.length < this.MAX_MONSTER_ZONES) {
        player.zones.hand
          .filter((card) => card.type === "Monster")
          .forEach((card) => {
            actions.push({
              type: "set_monster",
              playerId,
              cardId: card.id,
              timestamp: new Date(),
            });
          });
      }

      // Can set spell/trap cards
      if (player.zones.spell_trap_zones.length < this.MAX_SPELL_TRAP_ZONES) {
        player.zones.hand
          .filter((card) => card.type === "Spell" || card.type === "Trap")
          .forEach((card) => {
            actions.push({
              type: "set_spell_trap",
              playerId,
              cardId: card.id,
              timestamp: new Date(),
            });
          });
      }
    }

    // Battle phase
    if (state.currentPhase === "battle") {
      const attackableMonsters = player.zones.monster_zones.filter(
        (card) =>
          card.position === "face-up-attack" ||
          card.position === "face-down-attack",
      );

      attackableMonsters.forEach((card) => {
        actions.push({
          type: "declare_attack",
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

  checkWinCondition(state: YuGiOhGameState): WinResult | null {
    for (const player of state.players) {
      const opponent = state.players.find((p) => p.id !== player.id);
      if (!opponent) continue;

      // Win if opponent's life points reach 0
      if (opponent.lifePoints <= 0) {
        return this.createWinResult(player.id, "opponent_life_points_zero");
      }

      // Win if opponent cannot draw (deck out)
      if (opponent.zones.deck.length === 0 && state.currentPhase === "draw") {
        return this.createWinResult(player.id, "opponent_deck_out");
      }

      // Win by special conditions (Exodia, etc.) - would be implemented in card effects
    }

    return null;
  }

  getGamePhases(): Phase[] {
    return [
      this.createPhase("draw", "Draw Phase", 1, "Draw a card", ["draw_card"]),
      this.createPhase(
        "standby",
        "Standby Phase",
        2,
        "Resolve standby phase effects",
        [],
      ),
      this.createPhase(
        "main1",
        "Main Phase 1",
        3,
        "Summon monsters, set cards, activate effects",
        ["normal_summon", "set_monster", "set_spell_trap", "activate_spell"],
      ),
      this.createPhase("battle", "Battle Phase", 4, "Declare attacks", [
        "declare_attack",
        "activate_trap",
      ]),
      this.createPhase(
        "main2",
        "Main Phase 2",
        5,
        "Additional actions after battle",
        ["normal_summon", "set_monster", "set_spell_trap", "activate_spell"],
      ),
      this.createPhase("end", "End Phase", 6, "Resolve end phase effects", []),
    ];
  }

  advancePhase(state: YuGiOhGameState): YuGiOhGameState {
    const newState = { ...state };
    const phases = ["draw", "standby", "main1", "battle", "main2", "end"];
    const currentIndex = phases.indexOf(state.currentPhase);

    if (currentIndex < phases.length - 1) {
      // Move to next phase
      const nextPhase = phases[currentIndex + 1];
      if (nextPhase) {
        newState.currentPhase = nextPhase;
      }
    } else {
      // End of turn
      return this.endTurn(newState);
    }

    return newState;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private createDeck(deckList?: {
    cards: Array<{ cardId: string; quantity: number }>;
  }): YuGiOhCard[] {
    if (!deckList) {
      // Create a default 40-card deck for testing
      const cards: YuGiOhCard[] = [];

      // Add Monster cards (20 cards)
      for (let i = 0; i < 20; i++) {
        cards.push({
          id: `monster-${i}`,
          name: `Monster ${i}`,
          type: "Monster",
          attribute: "DARK",
          level: 4,
          atk: 1800,
          def: 1200,
          effect: "Normal Monster",
        });
      }

      // Add Spell cards (12 cards)
      for (let i = 0; i < 12; i++) {
        cards.push({
          id: `spell-${i}`,
          name: `Spell ${i}`,
          type: "Spell",
          effect: "Normal Spell",
        });
      }

      // Add Trap cards (8 cards)
      for (let i = 0; i < 8; i++) {
        cards.push({
          id: `trap-${i}`,
          name: `Trap ${i}`,
          type: "Trap",
          effect: "Normal Trap",
        });
      }

      return this.shuffleDeck(cards);
    }

    // Convert deck list to cards
    const cards: YuGiOhCard[] = [];
    deckList.cards.forEach((entry) => {
      for (let i = 0; i < entry.quantity; i++) {
        cards.push({
          id: `${entry.cardId}-${i}`,
          name: `Card ${entry.cardId}`,
          type: "Monster",
          level: 4,
          atk: 1500,
          def: 1000,
        });
      }
    });

    return this.shuffleDeck(cards);
  }

  private shuffleDeck(cards: YuGiOhCard[]): YuGiOhCard[] {
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

  private drawCards(player: YuGiOhPlayer, count: number): void {
    for (let i = 0; i < count; i++) {
      const card = player.zones.deck.shift();
      if (card) {
        player.zones.hand.push(card);
      }
    }
  }

  private canNormalSummon(
    state: YuGiOhGameState,
    player: YuGiOhPlayer,
    action: YuGiOhAction,
  ): boolean {
    if (player.normalSummonUsed) return false;
    if (player.zones.monster_zones.length >= this.MAX_MONSTER_ZONES)
      return false;
    if (!action.cardId) return false;

    const card = player.zones.hand.find((c) => c.id === action.cardId);
    if (!card || card.type !== "Monster") return false;

    // Check if can tribute summon (level 5+ requires tributes)
    if (card.level && card.level >= 5) {
      const requiredTributes = card.level <= 6 ? 1 : 2;
      const availableTributes = player.zones.monster_zones.length;
      return availableTributes >= requiredTributes;
    }

    return true;
  }

  private canSetMonster(
    state: YuGiOhGameState,
    player: YuGiOhPlayer,
    action: YuGiOhAction,
  ): boolean {
    if (player.zones.monster_zones.length >= this.MAX_MONSTER_ZONES)
      return false;
    if (!action.cardId) return false;

    const card = player.zones.hand.find((c) => c.id === action.cardId);
    return !!card && card.type === "Monster";
  }

  private canSetSpellTrap(
    state: YuGiOhGameState,
    player: YuGiOhPlayer,
    action: YuGiOhAction,
  ): boolean {
    if (player.zones.spell_trap_zones.length >= this.MAX_SPELL_TRAP_ZONES)
      return false;
    if (!action.cardId) return false;

    const card = player.zones.hand.find((c) => c.id === action.cardId);
    return !!card && (card.type === "Spell" || card.type === "Trap");
  }

  private canAttack(player: YuGiOhPlayer): boolean {
    return player.zones.monster_zones.some(
      (card) =>
        card.position === "face-up-attack" ||
        card.position === "face-down-attack",
    );
  }

  private applyNormalSummon(
    state: YuGiOhGameState,
    player: YuGiOhPlayer,
    action: YuGiOhAction,
  ): void {
    if (!action.cardId) return;

    const cardIndex = player.zones.hand.findIndex(
      (c) => c.id === action.cardId,
    );
    if (cardIndex >= 0) {
      const card = player.zones.hand.splice(cardIndex, 1)[0];
      if (!card) return;

      card.position = "face-up-attack";
      player.zones.monster_zones.push(card);
      player.normalSummonUsed = true;
    }
  }

  private applySetMonster(
    state: YuGiOhGameState,
    player: YuGiOhPlayer,
    action: YuGiOhAction,
  ): void {
    if (!action.cardId) return;

    const cardIndex = player.zones.hand.findIndex(
      (c) => c.id === action.cardId,
    );
    if (cardIndex >= 0) {
      const card = player.zones.hand.splice(cardIndex, 1)[0];
      if (!card) return;

      card.position = "face-down-defense";
      player.zones.monster_zones.push(card);
      // Note: Setting a monster does NOT use the normal summon in Yu-Gi-Oh rules
    }
  }

  private applySetSpellTrap(
    state: YuGiOhGameState,
    player: YuGiOhPlayer,
    action: YuGiOhAction,
  ): void {
    if (!action.cardId) return;

    const cardIndex = player.zones.hand.findIndex(
      (c) => c.id === action.cardId,
    );
    if (cardIndex >= 0) {
      const card = player.zones.hand.splice(cardIndex, 1)[0];
      if (!card) return;

      player.zones.spell_trap_zones.push(card);
    }
  }

  private applyAttack(
    state: YuGiOhGameState,
    player: YuGiOhPlayer,
    action: YuGiOhAction,
  ): void {
    if (!action.cardId) return;

    const attackingCard = player.zones.monster_zones.find(
      (c) => c.id === action.cardId,
    );
    if (!attackingCard) return;

    // Get opponent
    const opponent = state.players.find((p) => p.id !== player.id);
    if (!opponent) return;

    // Direct attack if opponent has no monsters
    if (opponent.zones.monster_zones.length === 0) {
      opponent.lifePoints -= attackingCard.atk || 0;
      return;
    }

    // Attack first monster (simplified - in real game, player chooses target)
    const defendingCard = opponent.zones.monster_zones[0];
    if (!defendingCard) return;

    const attackPower = attackingCard.atk || 0;
    const defensePower = defendingCard.position?.includes("defense")
      ? defendingCard.def || 0
      : defendingCard.atk || 0;

    if (attackPower > defensePower) {
      // Destroy defending monster
      const index = opponent.zones.monster_zones.indexOf(defendingCard);
      opponent.zones.monster_zones.splice(index, 1);
      opponent.zones.graveyard.push(defendingCard);

      // Damage if attacking in attack position
      if (defendingCard.position?.includes("attack")) {
        opponent.lifePoints -= attackPower - defensePower;
      }
    } else if (attackPower < defensePower) {
      // Destroy attacking monster or damage player
      if (defendingCard.position?.includes("attack")) {
        const index = player.zones.monster_zones.indexOf(attackingCard);
        player.zones.monster_zones.splice(index, 1);
        player.zones.graveyard.push(attackingCard);
      }
      player.lifePoints -= defensePower - attackPower;
    } else {
      // Equal power - both destroyed if both in attack
      if (defendingCard.position?.includes("attack")) {
        const attackIndex = player.zones.monster_zones.indexOf(attackingCard);
        const defendIndex = opponent.zones.monster_zones.indexOf(defendingCard);
        player.zones.monster_zones.splice(attackIndex, 1);
        opponent.zones.monster_zones.splice(defendIndex, 1);
        player.zones.graveyard.push(attackingCard);
        opponent.zones.graveyard.push(defendingCard);
      }
    }
  }

  private endTurn(state: YuGiOhGameState): YuGiOhGameState {
    const newState = { ...state };
    const currentPlayer = newState.players[newState.activePlayerIndex];

    if (!currentPlayer) {
      return newState;
    }

    // Reset per-turn flags
    currentPlayer.normalSummonUsed = false;

    // Switch to next player
    newState.activePlayerIndex =
      (newState.activePlayerIndex + 1) % newState.players.length;
    newState.turnNumber += 1;
    newState.currentPhase = "draw";

    return newState;
  }
}
