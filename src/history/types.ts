/**
 * Type definitions for undo/redo system with state history tracking
 *
 * Provides comprehensive types for command pattern implementation,
 * supporting both single-user and multi-user scenarios with state history.
 */

/**
 * Base command interface for all state mutations
 * Implements the Command pattern for undo/redo functionality
 */
export interface Command<T = any> {
  /** Unique identifier for this command */
  id: string;

  /** Type of command (e.g., 'MOVE_CARD', 'UPDATE_LIFE') */
  type: string;

  /** Timestamp when command was created */
  timestamp: number;

  /** User who initiated this command */
  userId: string;

  /** Execute the command, returning new state */
  execute(state: T): T;

  /** Undo the command, returning previous state */
  undo(state: T): T;

  /** Check if command can be undone given current state */
  canUndo(state: T): boolean;

  /** IDs of entities affected by this command (for dependency tracking) */
  affects: string[];

  /** Optional metadata for command */
  metadata?: Record<string, any>;
}

/**
 * Per-user undo/redo stack
 * Tracks command history and current position for a single user
 */
export interface UndoStack {
  /** User ID this stack belongs to */
  userId: string;

  /** Ordered list of commands executed by this user */
  commands: Command[];

  /** Current position in the command history (0-based) */
  position: number;

  /** Branched command histories for speculative operations */
  branches: Map<string, Command[]>;
}

/**
 * Main history manager interface
 * Coordinates undo/redo across multiple users
 */
export interface HistoryManager {
  /** Per-user undo stacks */
  undoStacks: Map<string, UndoStack>;

  /** Global chronological history of all commands */
  globalHistory: Command[];

  /** Per-user redo stacks */
  redoStacks: Map<string, Command[]>;
}

/**
 * Command dependency information
 * Tracks which commands depend on others for cascade undo
 */
export interface CommandDependency {
  /** Command that has dependencies */
  commandId: string;

  /** Commands that this command depends on */
  dependsOn: string[];

  /** Commands that depend on this command */
  dependents: string[];
}

/**
 * Conflict information when multiple commands affect same entities
 */
export interface CommandConflict<T = any> {
  /** Commands involved in the conflict */
  commands: Command<T>[];

  /** Entities affected by conflicting commands */
  affectedEntities: string[];

  /** Resolution strategy applied */
  resolution?: ConflictResolution;
}

/**
 * Conflict resolution strategies
 */
export enum ConflictResolution {
  /** Last write wins */
  LAST_WRITE_WINS = "LAST_WRITE_WINS",

  /** First write wins */
  FIRST_WRITE_WINS = "FIRST_WRITE_WINS",

  /** Merge changes if possible */
  MERGE = "MERGE",

  /** Manual resolution required */
  MANUAL = "MANUAL",
}

/**
 * Serialized command format for persistence
 */
export interface SerializedCommand {
  id: string;
  type: string;
  timestamp: number;
  userId: string;
  affects: string[];
  data: any;
  metadata?: Record<string, any>;
}

/**
 * History snapshot for persistence
 */
export interface HistorySnapshot {
  /** Snapshot timestamp */
  timestamp: number;

  /** Serialized commands */
  commands: SerializedCommand[];

  /** Per-user positions in history */
  userPositions: Map<string, number>;

  /** Version for migration support */
  version: string;
}

/**
 * History replay options
 */
export interface ReplayOptions {
  /** Stop at specific command ID */
  stopAt?: string;

  /** Skip specific command IDs */
  skip?: string[];

  /** Only replay commands from specific user */
  userId?: string;

  /** Start from specific command ID */
  startFrom?: string;
}

/**
 * History pruning configuration
 */
export interface PruneConfig {
  /** Maximum number of commands to keep */
  maxCommands?: number;

  /** Maximum age in milliseconds */
  maxAge?: number;

  /** Keep commands affecting specific entities */
  keepAffecting?: string[];

  /** Keep commands from specific users */
  keepFromUsers?: string[];
}

/**
 * History statistics
 */
export interface HistoryStats {
  /** Total commands in history */
  totalCommands: number;

  /** Commands per user */
  commandsByUser: Map<string, number>;

  /** Commands by type */
  commandsByType: Map<string, number>;

  /** Oldest command timestamp */
  oldestCommand?: number;

  /** Newest command timestamp */
  newestCommand?: number;

  /** Total memory usage estimate (bytes) */
  estimatedSize: number;
}
