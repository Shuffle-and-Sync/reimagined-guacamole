/**
 * Game State Schema with Versioning and Validation
 *
 * Provides structured game state interfaces for multi-game support (MTG, Pokemon, etc.)
 * with version tracking for conflict resolution and undo/redo functionality.
 *
 * Based on recommendations in Section 2.1 of TABLESYNC_ANALYSIS_AND_RECOMMENDATIONS.md
 */

import { z } from "zod";

// ============================================================================
// Base Game State Interface
// ============================================================================

/**
 * Base interface for all game states with versioning
 */
export interface GameStateBase {
  /** Version number for state tracking and conflict resolution */
  version: number;
  /** Unix timestamp when state was last modified */
  timestamp: number;
  /** User ID of the player who last modified the state */
  lastModifiedBy: string;
  /** Type of game (e.g., "mtg", "pokemon", "yugioh") */
  gameType: string;
  /** Unique identifier for this game session */
  sessionId: string;
}

// ============================================================================
// Zone and Card Management
// ============================================================================

/**
 * Reference to a card in the game
 */
export interface CardReference {
  /** Unique card instance ID */
  id: string;
  /** Card name (visible in public zones) */
  name?: string;
  /** Whether the card is tapped/rotated */
  isTapped?: boolean;
  /** Counters on the card (e.g., +1/+1, loyalty, damage) */
  counters?: Record<string, number>;
  /** IDs of cards attached to this card (e.g., auras, equipment) */
  attachments?: string[];
  /** Face-up or face-down status */
  isFaceUp?: boolean;
  /** Additional metadata for game-specific properties */
  metadata?: Record<string, unknown>;
}

/**
 * Zone state representing a collection of cards
 */
export interface ZoneState {
  /** Cards in this zone */
  cards: CardReference[];
  /** Whether this zone is visible to all players */
  isPublic: boolean;
  /** Optional ordering information for zones that care about card order */
  order?: "top-to-bottom" | "unordered";
}

/**
 * Permanent on the battlefield with additional state
 */
export interface Permanent extends CardReference {
  /** Owner's player ID */
  ownerId: string;
  /** Current controller's player ID */
  controllerId: string;
  /** Power (for creatures) */
  power?: number;
  /** Toughness (for creatures) */
  toughness?: number;
  /** Whether the permanent has summoning sickness */
  summoningSickness?: boolean;
}

/**
 * Item on the stack (spell or ability)
 */
export interface StackItem {
  /** Unique ID for this stack item */
  id: string;
  /** Type of stack item */
  type: "spell" | "ability";
  /** Source card or permanent */
  source: CardReference;
  /** Player who controls this stack item */
  controller: string;
  /** Target IDs for this spell/ability */
  targets?: string[];
  /** Additional data about the spell/ability */
  data?: Record<string, unknown>;
}

// ============================================================================
// Turn and Phase Management
// ============================================================================

/**
 * Game phase for turn-based games
 */
export type GamePhase =
  | "untap"
  | "upkeep"
  | "draw"
  | "main1"
  | "combat_begin"
  | "combat_attackers"
  | "combat_blockers"
  | "combat_damage"
  | "combat_end"
  | "main2"
  | "end"
  | "cleanup";

/**
 * Current turn information
 */
export interface TurnState {
  /** Player ID of the active player */
  playerId: string;
  /** Current phase of the turn */
  phase: GamePhase;
  /** Optional step within the phase */
  step?: string;
  /** Turn number */
  turnNumber: number;
  /** Priority holder (for games with priority passing) */
  priorityPlayer?: string;
}

// ============================================================================
// Player State
// ============================================================================

/**
 * Player state in a TCG game
 */
export interface PlayerState {
  /** Unique player ID */
  id: string;
  /** Player display name */
  name: string;
  /** Life total */
  lifeTotal: number;
  /** Poison counters (for games that use them) */
  poisonCounters?: number;
  /** Energy counters (for games that use them) */
  energyCounters?: number;
  /** Player's hand (private zone) */
  hand: CardReference[];
  /** Player's graveyard (public zone) */
  graveyard: ZoneState;
  /** Player's library/deck (private, shows count only in most views) */
  library: {
    count: number;
    /** Optional: top card ID if revealed */
    topCard?: string;
  };
  /** Player's exile zone (public) */
  exile: ZoneState;
  /** Command zone (for Commander/EDH format) */
  commandZone?: ZoneState;
  /** Additional game-specific resources */
  resources?: Record<string, number>;
  /** Whether this player has lost */
  hasLost?: boolean;
  /** Reason for loss if applicable */
  lossReason?: string;
}

// ============================================================================
// TCG Game State
// ============================================================================

/**
 * Complete game state for Trading Card Games
 */
export interface TCGGameState extends GameStateBase {
  gameType: "tcg";
  /** All players in the game */
  players: PlayerState[];
  /** Turn order (array of player IDs) */
  turnOrder: string[];
  /** Current turn state */
  currentTurn: TurnState;
  /** The stack (for games that use a stack) */
  stack: StackItem[];
  /** Shared battlefield state */
  battlefield: {
    /** All permanents on the battlefield */
    permanents: Permanent[];
  };
  /** Winner ID if game is complete */
  winnerId?: string;
  /** Win condition that was met */
  winCondition?: string;
  /** Game format (e.g., "standard", "commander", "limited") */
  format?: string;
}

// ============================================================================
// Game State Actions
// ============================================================================

/**
 * Type of game action
 */
export type GameActionType =
  | "draw"
  | "play"
  | "tap"
  | "untap"
  | "counter"
  | "damage"
  | "move_zone"
  | "add_to_stack"
  | "resolve_stack"
  | "declare_attackers"
  | "declare_blockers"
  | "change_life"
  | "add_counter"
  | "remove_counter"
  | "shuffle"
  | "reveal"
  | "pass_priority"
  | "advance_phase"
  | "concede";

/**
 * Game state action for tracking state changes
 */
export interface GameStateAction {
  /** Unique action ID */
  id: string;
  /** Type of action */
  type: GameActionType;
  /** Player ID who performed the action */
  playerId: string;
  /** Unix timestamp when action was performed */
  timestamp: number;
  /** Action-specific payload */
  payload: Record<string, unknown>;
  /** Version this action was applied to */
  previousStateVersion: number;
  /** Version after this action was applied */
  resultingStateVersion: number;
  /** Optional action description for history/logs */
  description?: string;
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

export const CardReferenceSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  isTapped: z.boolean().optional(),
  counters: z.record(z.number()).optional(),
  attachments: z.array(z.string()).optional(),
  isFaceUp: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ZoneStateSchema = z.object({
  cards: z.array(CardReferenceSchema),
  isPublic: z.boolean(),
  order: z.enum(["top-to-bottom", "unordered"]).optional(),
});

export const PermanentSchema = CardReferenceSchema.extend({
  ownerId: z.string().min(1),
  controllerId: z.string().min(1),
  power: z.number().optional(),
  toughness: z.number().optional(),
  summoningSickness: z.boolean().optional(),
});

export const StackItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["spell", "ability"]),
  source: CardReferenceSchema,
  controller: z.string().min(1),
  targets: z.array(z.string()).optional(),
  data: z.record(z.unknown()).optional(),
});

export const GamePhaseSchema = z.enum([
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
]);

export const TurnStateSchema = z.object({
  playerId: z.string().min(1),
  phase: GamePhaseSchema,
  step: z.string().optional(),
  turnNumber: z.number().int().min(1),
  priorityPlayer: z.string().optional(),
});

export const PlayerStateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lifeTotal: z.number().int(),
  poisonCounters: z.number().int().min(0).optional(),
  energyCounters: z.number().int().min(0).optional(),
  hand: z.array(CardReferenceSchema),
  graveyard: ZoneStateSchema,
  library: z.object({
    count: z.number().int().min(0),
    topCard: z.string().optional(),
  }),
  exile: ZoneStateSchema,
  commandZone: ZoneStateSchema.optional(),
  resources: z.record(z.number()).optional(),
  hasLost: z.boolean().optional(),
  lossReason: z.string().optional(),
});

export const GameStateBaseSchema = z.object({
  version: z.number().int().min(0),
  timestamp: z.number().int().positive(),
  lastModifiedBy: z.string().min(1),
  gameType: z.string().min(1),
  sessionId: z.string().min(1),
});

export const TCGGameStateSchema = GameStateBaseSchema.extend({
  gameType: z.literal("tcg"),
  players: z.array(PlayerStateSchema).min(2).max(10),
  turnOrder: z.array(z.string().min(1)),
  currentTurn: TurnStateSchema,
  stack: z.array(StackItemSchema),
  battlefield: z.object({
    permanents: z.array(PermanentSchema),
  }),
  winnerId: z.string().optional(),
  winCondition: z.string().optional(),
  format: z.string().optional(),
});

export const GameActionTypeSchema = z.enum([
  "draw",
  "play",
  "tap",
  "untap",
  "counter",
  "damage",
  "move_zone",
  "add_to_stack",
  "resolve_stack",
  "declare_attackers",
  "declare_blockers",
  "change_life",
  "add_counter",
  "remove_counter",
  "shuffle",
  "reveal",
  "pass_priority",
  "advance_phase",
  "concede",
]);

export const GameStateActionSchema = z.object({
  id: z.string().min(1),
  type: GameActionTypeSchema,
  playerId: z.string().min(1),
  timestamp: z.number().int().positive(),
  payload: z.record(z.unknown()),
  previousStateVersion: z.number().int().min(0),
  resultingStateVersion: z.number().int().min(0),
  description: z.string().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================
// Note: Types are already exported at their declaration sites above
// No need for redundant re-export which causes TS2484 conflicts
