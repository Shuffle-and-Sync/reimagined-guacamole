/**
 * Per-user undo stack implementation
 * Manages command history and current position for a single user
 */

import { Command, UndoStack as IUndoStack } from "./types";

export class UndoStack implements IUndoStack {
  public commands: Command[];
  public position: number;
  public branches: Map<string, Command[]>;

  constructor(public readonly userId: string) {
    this.commands = [];
    this.position = -1;
    this.branches = new Map();
  }

  /**
   * Push a new command onto the stack
   * Clears any redo history beyond current position
   */
  push(command: Command): void {
    // Remove any commands after current position (they are now inaccessible)
    this.commands = this.commands.slice(0, this.position + 1);

    // Add new command
    this.commands.push(command);
    this.position = this.commands.length - 1;
  }

  /**
   * Get the command at current position (for undo)
   * Returns null if at the beginning of history
   */
  getCurrentCommand(): Command | null {
    if (this.position < 0 || this.position >= this.commands.length) {
      return null;
    }
    return this.commands[this.position];
  }

  /**
   * Get the next command (for redo)
   * Returns null if at the end of history
   */
  getNextCommand(): Command | null {
    const nextPosition = this.position + 1;
    if (nextPosition >= this.commands.length) {
      return null;
    }
    return this.commands[nextPosition];
  }

  /**
   * Move position back (after undo)
   */
  moveBack(): void {
    if (this.position >= 0) {
      this.position--;
    }
  }

  /**
   * Move position forward (after redo)
   */
  moveForward(): void {
    if (this.position < this.commands.length - 1) {
      this.position++;
    }
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.position >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.position < this.commands.length - 1;
  }

  /**
   * Get all commands in this stack
   */
  getCommands(): Command[] {
    return [...this.commands];
  }

  /**
   * Get commands up to current position (actual history)
   */
  getActiveHistory(): Command[] {
    return this.commands.slice(0, this.position + 1);
  }

  /**
   * Create a branch for speculative operations
   */
  createBranch(branchId: string): void {
    // Save current state as a branch
    this.branches.set(branchId, this.getActiveHistory());
  }

  /**
   * Restore from a branch
   */
  restoreBranch(branchId: string): boolean {
    const branchCommands = this.branches.get(branchId);
    if (!branchCommands) {
      return false;
    }

    this.commands = [...branchCommands];
    this.position = this.commands.length - 1;
    return true;
  }

  /**
   * Delete a branch
   */
  deleteBranch(branchId: string): boolean {
    return this.branches.delete(branchId);
  }

  /**
   * Get all branch IDs
   */
  getBranches(): string[] {
    return Array.from(this.branches.keys());
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.commands = [];
    this.position = -1;
    this.branches.clear();
  }

  /**
   * Get stack statistics
   */
  getStats(): {
    totalCommands: number;
    position: number;
    canUndo: boolean;
    canRedo: boolean;
    branches: number;
  } {
    return {
      totalCommands: this.commands.length,
      position: this.position,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      branches: this.branches.size,
    };
  }
}
