/**
 * Pokemon Trading Card Game Adapter
 *
 * Implements Pokemon TCG-specific game rules and state management.
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
// Pokemon-Specific Types
// ============================================================================

export type PokemonZone =
  | "deck"
  | "hand"
  | "active"
  | "bench"
  | "discard"
  | "prizes";

export type PokemonType =
  | "Grass"
  | "Fire"
  | "Water"
  | "Lightning"
  | "Psychic"
  | "Fighting"
  | "Darkness"
  | "Metal"
  | "Fairy"
  | "Dragon"
  | "Colorless";

export interface PokemonCard {
  id: string;
  name: string;
  type: "pokemon" | "trainer" | "energy";
  subtype?: string;
  pokemonType?: PokemonType;
  hp?: number;
  attacks?: Array<{
    name: string;
    cost: PokemonType[];
    damage: number;
  }>;
  weakness?: PokemonType;
  resistance?: PokemonType;
  retreatCost?: number;
  attachedEnergy?: PokemonCard[];
  damage?: number; // Damage counters on this Pokemon
}

export interface PokemonPlayer {
  id: string;
  name: string;
  zones: Record<PokemonZone, PokemonCard[]>;
  hasPlayedSupporterThisTeurn: boolean;
  hasAttachedEnergyThisTurn: boolean;
}

export interface PokemonGameState {
  gameId: string;
  players: PokemonPlayer[];
  activePlayerIndex: number;
  currentPhase: string;
  turnNumber: number;
  isGameOver: boolean;
  winner?: string;
}

export type PokemonActionType =
  | "draw_card"
  | "play_pokemon"
  | "attach_energy"
  | "play_trainer"
  | "attack"
  | "retreat"
  | "switch_active"
  | "advance_phase"
  | "end_turn";

export interface PokemonAction {
  type: PokemonActionType;
  playerId: string;
  cardId?: string;
  targetId?: string;
  attackIndex?: number;
  timestamp: Date;
}

// ============================================================================
// Pokemon Game Adapter
// ============================================================================

export class PokemonGameAdapter extends BaseGameAdapter<
  PokemonGameState,
  PokemonAction
> {
  readonly gameId = "pokemon";
  readonly gameName = "Pokemon Trading Card Game";
  readonly version = "1.0.0";

  private readonly STARTING_HAND_SIZE = 7;
  private readonly PRIZE_COUNT = 6; // Standard format
  private readonly MAX_BENCH_SIZE = 5;

  // ============================================================================
  // State Management
  // ============================================================================

  createInitialState(config: GameConfig): PokemonGameState {
    if (config.playerCount !== 2) {
      throw new Error("Pokemon TCG only supports 2 players");
    }

    const players: PokemonPlayer[] = [];

    for (let i = 0; i < config.playerCount; i++) {
      const playerId = `player-${i}`;
      players.push({
        id: playerId,
        name: `Player ${i + 1}`,
        zones: {
          deck: this.createDeck(config.deckLists?.[i]),
          hand: [],
          active: [],
          bench: [],
          discard: [],
          prizes: [],
        },
        hasPlayedSupporterThisTeurn: false,
        hasAttachedEnergyThisTurn: false,
      });
    }

    // Setup: Draw hands and set prizes
    players.forEach((player) => {
      this.drawCards(player, this.STARTING_HAND_SIZE);
      this.setPrizes(player);
    });

    return {
      gameId: crypto.randomUUID(),
      players,
      activePlayerIndex: 0,
      currentPhase: "setup",
      turnNumber: 1,
      isGameOver: false,
    };
  }

  validateState(state: PokemonGameState): ValidationResult {
    const errors: string[] = [];

    // Validate player count
    if (state.players.length !== 2) {
      errors.push("Pokemon TCG must have exactly 2 players.");
    }

    // Validate each player
    state.players.forEach((player, index) => {
      // Check for active Pokemon (after setup)
      if (state.currentPhase !== "setup" && player.zones.active.length === 0) {
        errors.push(`Player ${index} has no active Pokemon.`);
      }

      // Check bench size
      if (player.zones.bench.length > this.MAX_BENCH_SIZE) {
        errors.push(
          `Player ${index} has too many benched Pokemon (max ${this.MAX_BENCH_SIZE}).`,
        );
      }

      // Validate zones exist
      const requiredZones: PokemonZone[] = [
        "deck",
        "hand",
        "active",
        "bench",
        "discard",
        "prizes",
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

  validateAction(state: PokemonGameState, action: PokemonAction): boolean {
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

    if (!isActivePlayer && action.type !== "switch_active") {
      return false; // Only active player can take most actions
    }

    switch (action.type) {
      case "draw_card":
        return player.zones.deck.length > 0;
      case "play_pokemon":
        return this.canPlayPokemon(player, action);
      case "attach_energy":
        return this.canAttachEnergy(player, action);
      case "attack":
        return this.canAttack(state, player, action);
      case "retreat":
        return this.canRetreat(player);
      case "end_turn":
        return isActivePlayer;
      default:
        return false;
    }
  }

  applyAction(
    state: PokemonGameState,
    action: PokemonAction,
  ): PokemonGameState {
    // Create a deep copy of the state
    const newState = JSON.parse(JSON.stringify(state)) as PokemonGameState;
    const player = newState.players.find((p) => p.id === action.playerId);

    if (!player) {
      return newState;
    }

    switch (action.type) {
      case "draw_card":
        this.drawCards(player, 1);
        break;
      case "play_pokemon":
        this.applyPlayPokemon(newState, player, action);
        break;
      case "attach_energy":
        this.applyAttachEnergy(newState, player, action);
        break;
      case "attack":
        this.applyAttack(newState, player, action);
        break;
      case "retreat":
        this.applyRetreat(newState, player, action);
        break;
      case "end_turn":
        return this.endTurn(newState);
      case "advance_phase":
        return this.advancePhase(newState);
    }

    return newState;
  }

  getAvailableActions(
    state: PokemonGameState,
    playerId: string,
  ): PokemonAction[] {
    if (state.isGameOver) {
      return [];
    }

    const actions: PokemonAction[] = [];
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

    if (state.currentPhase === "main") {
      // Can play Pokemon from hand
      player.zones.hand
        .filter((card) => card.type === "pokemon")
        .forEach((card) => {
          actions.push({
            type: "play_pokemon",
            playerId,
            cardId: card.id,
            timestamp: new Date(),
          });
        });

      // Can attach energy if haven't this turn
      if (!player.hasAttachedEnergyThisTurn) {
        player.zones.hand
          .filter((card) => card.type === "energy")
          .forEach((card) => {
            actions.push({
              type: "attach_energy",
              playerId,
              cardId: card.id,
              timestamp: new Date(),
            });
          });
      }

      // Can play trainer cards
      player.zones.hand
        .filter((card) => card.type === "trainer")
        .forEach((card) => {
          actions.push({
            type: "play_trainer",
            playerId,
            cardId: card.id,
            timestamp: new Date(),
          });
        });
    }

    // Can attack during attack phase if active Pokemon has enough energy
    if (state.currentPhase === "attack") {
      const activePokemon = player.zones.active[0];
      if (activePokemon?.attacks) {
        activePokemon.attacks.forEach((attack, index) => {
          if (this.hasEnoughEnergy(activePokemon, attack.cost)) {
            actions.push({
              type: "attack",
              playerId,
              attackIndex: index,
              timestamp: new Date(),
            });
          }
        });
      }

      // Can retreat instead of attacking
      if (this.canRetreat(player)) {
        actions.push({
          type: "retreat",
          playerId,
          timestamp: new Date(),
        });
      }
    }

    return actions;
  }

  // ============================================================================
  // Rules & Win Conditions
  // ============================================================================

  checkWinCondition(state: PokemonGameState): WinResult | null {
    for (const player of state.players) {
      const opponent = state.players.find((p) => p.id !== player.id);
      if (!opponent) continue;

      // Win if opponent has no prizes left
      if (opponent.zones.prizes.length === 0) {
        return this.createWinResult(player.id, "all_prizes_taken");
      }

      // Win if opponent has no Pokemon in play
      if (
        opponent.zones.active.length === 0 &&
        opponent.zones.bench.length === 0
      ) {
        return this.createWinResult(player.id, "opponent_no_pokemon");
      }

      // Win if opponent cannot draw at start of turn
      if (opponent.zones.deck.length === 0 && state.currentPhase === "draw") {
        return this.createWinResult(player.id, "opponent_deck_out");
      }
    }

    return null;
  }

  getGamePhases(): Phase[] {
    return [
      this.createPhase("setup", "Setup", 0, "Place active and benched Pokemon"),
      this.createPhase("draw", "Draw Phase", 1, "Draw a card", ["draw_card"]),
      this.createPhase(
        "main",
        "Main Phase",
        2,
        "Play Pokemon, attach energy, use trainers",
        ["play_pokemon", "attach_energy", "play_trainer"],
      ),
      this.createPhase("attack", "Attack Phase", 3, "Attack or retreat", [
        "attack",
        "retreat",
      ]),
    ];
  }

  advancePhase(state: PokemonGameState): PokemonGameState {
    const newState = { ...state };
    const phases = ["draw", "main", "attack"];
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
  }): PokemonCard[] {
    if (!deckList) {
      // Create a default 60-card deck for testing
      const cards: PokemonCard[] = [];

      // Add Pokemon (20 cards)
      for (let i = 0; i < 20; i++) {
        cards.push({
          id: `pokemon-${i}`,
          name: `Pokemon ${i}`,
          type: "pokemon",
          pokemonType: "Colorless",
          hp: 60,
          attacks: [
            {
              name: "Quick Attack",
              cost: ["Colorless"],
              damage: 20,
            },
          ],
          retreatCost: 1,
          damage: 0,
          attachedEnergy: [],
        });
      }

      // Add Trainer cards (20 cards)
      for (let i = 0; i < 20; i++) {
        cards.push({
          id: `trainer-${i}`,
          name: `Trainer ${i}`,
          type: "trainer",
          subtype: "Item",
        });
      }

      // Add Energy cards (20 cards)
      for (let i = 0; i < 20; i++) {
        cards.push({
          id: `energy-${i}`,
          name: "Colorless Energy",
          type: "energy",
          pokemonType: "Colorless",
        });
      }

      return this.shuffleDeck(cards);
    }

    // Convert deck list to cards (simplified)
    const cards: PokemonCard[] = [];
    deckList.cards.forEach((entry) => {
      for (let i = 0; i < entry.quantity; i++) {
        cards.push({
          id: `${entry.cardId}-${i}`,
          name: `Card ${entry.cardId}`,
          type: "pokemon",
          hp: 60,
        });
      }
    });

    return this.shuffleDeck(cards);
  }

  private shuffleDeck(cards: PokemonCard[]): PokemonCard[] {
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

  private drawCards(player: PokemonPlayer, count: number): void {
    for (let i = 0; i < count; i++) {
      const card = player.zones.deck.shift();
      if (card) {
        player.zones.hand.push(card);
      }
    }
  }

  private setPrizes(player: PokemonPlayer): void {
    for (let i = 0; i < this.PRIZE_COUNT; i++) {
      const card = player.zones.deck.shift();
      if (card) {
        player.zones.prizes.push(card);
      }
    }
  }

  private canPlayPokemon(
    player: PokemonPlayer,
    action: PokemonAction,
  ): boolean {
    if (!action.cardId) return false;
    const card = player.zones.hand.find((c) => c.id === action.cardId);
    return !!card && card.type === "pokemon";
  }

  private canAttachEnergy(
    player: PokemonPlayer,
    action: PokemonAction,
  ): boolean {
    if (player.hasAttachedEnergyThisTurn) return false;
    if (!action.cardId) return false;
    const card = player.zones.hand.find((c) => c.id === action.cardId);
    return !!card && card.type === "energy";
  }

  private canAttack(
    state: PokemonGameState,
    player: PokemonPlayer,
    action: PokemonAction,
  ): boolean {
    const activePokemon = player.zones.active[0];
    if (!activePokemon || !activePokemon.attacks) return false;

    if (action.attackIndex === undefined) return false;
    const attack = activePokemon.attacks[action.attackIndex];
    if (!attack) return false;

    return this.hasEnoughEnergy(activePokemon, attack.cost);
  }

  private canRetreat(player: PokemonPlayer): boolean {
    const activePokemon = player.zones.active[0];
    if (!activePokemon) return false;
    if (player.zones.bench.length === 0) return false;

    const retreatCost = activePokemon.retreatCost || 0;
    const energyCount = activePokemon.attachedEnergy?.length || 0;

    return energyCount >= retreatCost;
  }

  private hasEnoughEnergy(pokemon: PokemonCard, cost: PokemonType[]): boolean {
    const attachedEnergy = pokemon.attachedEnergy || [];
    return attachedEnergy.length >= cost.length;
  }

  private applyPlayPokemon(
    state: PokemonGameState,
    player: PokemonPlayer,
    action: PokemonAction,
  ): void {
    if (!action.cardId) return;

    const cardIndex = player.zones.hand.findIndex(
      (c) => c.id === action.cardId,
    );
    if (cardIndex >= 0) {
      const card = player.zones.hand.splice(cardIndex, 1)[0];
      if (!card) return;

      // Play to active if empty, otherwise to bench
      if (player.zones.active.length === 0) {
        player.zones.active.push(card);
      } else if (player.zones.bench.length < this.MAX_BENCH_SIZE) {
        player.zones.bench.push(card);
      }
    }
  }

  private applyAttachEnergy(
    state: PokemonGameState,
    player: PokemonPlayer,
    action: PokemonAction,
  ): void {
    if (!action.cardId) return;

    const cardIndex = player.zones.hand.findIndex(
      (c) => c.id === action.cardId,
    );
    if (cardIndex >= 0) {
      const energyCard = player.zones.hand.splice(cardIndex, 1)[0];
      if (!energyCard) return;

      const activePokemon = player.zones.active[0];

      if (activePokemon) {
        if (!activePokemon.attachedEnergy) {
          activePokemon.attachedEnergy = [];
        }
        activePokemon.attachedEnergy.push(energyCard);
        player.hasAttachedEnergyThisTurn = true;
      }
    }
  }

  private applyAttack(
    state: PokemonGameState,
    player: PokemonPlayer,
    action: PokemonAction,
  ): void {
    const activePokemon = player.zones.active[0];
    if (!activePokemon || !activePokemon.attacks) return;

    if (action.attackIndex === undefined) return;
    const attack = activePokemon.attacks[action.attackIndex];
    if (!attack) return;

    // Get opponent
    const opponent = state.players.find((p) => p.id !== player.id);
    if (!opponent) return;

    const defendingPokemon = opponent.zones.active[0];
    if (defendingPokemon) {
      // Apply damage
      defendingPokemon.damage = (defendingPokemon.damage || 0) + attack.damage;

      // Check if Pokemon is knocked out
      if (
        defendingPokemon.hp &&
        defendingPokemon.damage >= defendingPokemon.hp
      ) {
        this.knockOutPokemon(state, opponent, defendingPokemon);
        // Active player takes a prize
        const prize = player.zones.prizes.shift();
        if (prize) {
          player.zones.hand.push(prize);
        }
      }
    }
  }

  private applyRetreat(
    state: PokemonGameState,
    player: PokemonPlayer,
    action: PokemonAction,
  ): void {
    const activePokemon = player.zones.active[0];
    if (!activePokemon || player.zones.bench.length === 0) return;

    const retreatCost = activePokemon.retreatCost || 0;

    // Discard energy for retreat cost
    for (let i = 0; i < retreatCost; i++) {
      const energy = activePokemon.attachedEnergy?.shift();
      if (energy) {
        player.zones.discard.push(energy);
      }
    }

    // Move active to bench and promote benched Pokemon
    player.zones.bench.push(activePokemon);
    const newActive = player.zones.bench.shift();
    if (newActive) {
      player.zones.active = [newActive];
    }
  }

  private knockOutPokemon(
    state: PokemonGameState,
    player: PokemonPlayer,
    pokemon: PokemonCard,
  ): void {
    // Remove from active or bench
    player.zones.active = player.zones.active.filter(
      (p) => p.id !== pokemon.id,
    );
    player.zones.bench = player.zones.bench.filter((p) => p.id !== pokemon.id);

    // Discard attached energy
    if (pokemon.attachedEnergy) {
      player.zones.discard.push(...pokemon.attachedEnergy);
    }

    // Move to discard
    player.zones.discard.push(pokemon);
  }

  private endTurn(state: PokemonGameState): PokemonGameState {
    const newState = { ...state };
    const currentPlayer = newState.players[newState.activePlayerIndex];

    if (!currentPlayer) {
      return newState;
    }

    // Reset per-turn flags
    currentPlayer.hasPlayedSupporterThisTeurn = false;
    currentPlayer.hasAttachedEnergyThisTurn = false;

    // Switch to next player
    newState.activePlayerIndex =
      (newState.activePlayerIndex + 1) % newState.players.length;
    newState.turnNumber += 1;
    newState.currentPhase = "draw";

    return newState;
  }
}
