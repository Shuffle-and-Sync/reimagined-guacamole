/**
 * Abstract base command class
 * Provides common functionality for all commands
 */

import { nanoid } from "nanoid";
import { Command } from "./types";

export abstract class BaseCommand<T = any> implements Command<T> {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly affects: string[];
  public metadata?: Record<string, any>;

  constructor(
    public readonly type: string,
    public readonly userId: string,
    affects: string[] = [],
    metadata?: Record<string, any>,
  ) {
    this.id = nanoid();
    this.timestamp = Date.now();
    this.affects = affects;
    this.metadata = metadata;
  }

  /**
   * Execute the command, returning new state
   * Must be implemented by subclasses
   */
  abstract execute(state: T): T;

  /**
   * Undo the command, returning previous state
   * Must be implemented by subclasses
   */
  abstract undo(state: T): T;

  /**
   * Check if command can be undone given current state
   * Default implementation validates state structure
   */
  canUndo(state: T): boolean {
    return this.validateState(state);
  }

  /**
   * Validate state structure for this command
   * Can be overridden by subclasses for specific validation
   */
  protected validateState(state: T): boolean {
    return state !== null && state !== undefined;
  }

  /**
   * Create a deep copy of data for immutable updates
   */
  protected deepCopy<D>(data: D): D {
    return JSON.parse(JSON.stringify(data));
  }

  /**
   * Serialize command for persistence
   */
  serialize(): {
    id: string;
    type: string;
    timestamp: number;
    userId: string;
    affects: string[];
    metadata?: Record<string, any>;
  } {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      userId: this.userId,
      affects: this.affects,
      metadata: this.metadata,
    };
  }
}
