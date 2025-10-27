/**
 * Operational Transformation (OT) Core Types
 *
 * Defines the foundational types for implementing Google Docs-style
 * operational transformation for real-time collaborative card game sessions.
 */

/**
 * Vector Clock for tracking operation causality and ordering
 */
export interface VectorClock {
  [clientId: string]: number;
}

/**
 * Base operation interface
 * All operations must extend this interface
 */
export interface Operation {
  type: string;
  clientId: string;
  timestamp: number;
  version: VectorClock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

/**
 * Result of transforming one operation against another
 */
export interface TransformResult {
  transformed: Operation;
  residual?: Operation;
}

/**
 * Function signature for transforming two operations
 */
export type TransformFunction = (
  op1: Operation,
  op2: Operation,
) => TransformResult;

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
 * Position represents coordinates for card placement
 */
export interface Position {
  x: number;
  y: number;
  zIndex?: number;
}

/**
 * Card operation types for card game interactions
 */
export type CardOperation =
  | MoveCardOperation
  | TapCardOperation
  | DrawCardOperation
  | PlayCardOperation
  | UpdateLifeOperation
  | AddCounterOperation;

export interface MoveCardOperation extends Operation {
  type: "MOVE_CARD";
  data: {
    cardId: string;
    from: Zone;
    to: Zone;
  };
}

export interface TapCardOperation extends Operation {
  type: "TAP_CARD";
  data: {
    cardId: string;
    tapped: boolean;
  };
}

export interface DrawCardOperation extends Operation {
  type: "DRAW_CARD";
  data: {
    playerId: string;
    cardId?: string;
  };
}

export interface PlayCardOperation extends Operation {
  type: "PLAY_CARD";
  data: {
    cardId: string;
    position: Position;
  };
}

export interface UpdateLifeOperation extends Operation {
  type: "UPDATE_LIFE";
  data: {
    playerId: string;
    delta: number;
  };
}

export interface AddCounterOperation extends Operation {
  type: "ADD_COUNTER";
  data: {
    cardId: string;
    counterType: string;
    amount: number;
  };
}

/**
 * Tombstone marker for deleted entities
 * Used to handle operations on cards that have been removed
 */
export interface Tombstone {
  id: string;
  deletedAt: number;
  deletedBy: string;
}
