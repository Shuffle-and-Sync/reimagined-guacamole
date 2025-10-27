/**
 * History Manager for undo/redo functionality
 * Manages command history across multiple users with dependency tracking
 */

import {
  Command,
  CommandDependency,
  CommandConflict,
  ConflictResolution,
  HistorySnapshot,
  SerializedCommand,
  ReplayOptions,
  PruneConfig,
  HistoryStats,
} from "./types";
import { UndoStack } from "./UndoStack";

export class HistoryManager<T = any> {
  public readonly undoStacks: Map<string, UndoStack>;
  public readonly globalHistory: Command<T>[];
  public readonly redoStacks: Map<string, Command<T>[]>;

  private dependencies: Map<string, CommandDependency>;
  private conflicts: CommandConflict<T>[];

  constructor() {
    this.undoStacks = new Map();
    this.globalHistory = [];
    this.redoStacks = new Map();
    this.dependencies = new Map();
    this.conflicts = [];
  }

  /**
   * Push a new command to history
   */
  push(command: Command<T>): void {
    // Get or create user's undo stack
    const stack = this.getOrCreateStack(command.userId);

    // Add to user's stack
    stack.push(command);

    // Add to global history
    this.globalHistory.push(command);

    // Clear redo stack for this user
    this.redoStacks.set(command.userId, []);

    // Track dependencies
    this.trackDependencies(command);

    // Detect conflicts
    this.detectConflicts(command);
  }

  /**
   * Undo the last command for a user
   */
  undo(userId: string, state: T): T {
    const stack = this.undoStacks.get(userId);
    if (!stack || !stack.canUndo()) {
      return state;
    }

    const command = stack.getCurrentCommand();
    if (!command) {
      return state;
    }

    // Check if command can be undone
    if (!command.canUndo(state)) {
      throw new Error(
        `Cannot undo command ${command.id}: state validation failed`,
      );
    }

    // Check for dependent commands that need cascade undo
    const dependents = this.getDependentCommands(command.id);
    if (dependents.length > 0) {
      // Cascade undo: undo dependents first
      let currentState = state;
      for (const dependent of dependents.reverse()) {
        currentState = this.undoCommand(dependent, currentState);
      }
      state = currentState;
    }

    // Undo the command
    const newState = command.undo(state);

    // Update stack position
    stack.moveBack();

    // Add to redo stack
    this.getRedoStack(userId).push(command);

    return newState;
  }

  /**
   * Redo the last undone command for a user
   */
  redo(userId: string, state: T): T {
    const redoStack = this.redoStacks.get(userId);
    if (!redoStack || redoStack.length === 0) {
      return state;
    }

    const command = redoStack.pop();
    if (!command) {
      return state;
    }

    // Execute the command
    const newState = command.execute(state);

    // Update stack position
    const stack = this.undoStacks.get(userId);
    if (stack) {
      stack.moveForward();
    }

    return newState;
  }

  /**
   * Undo a specific command in history (selective undo)
   */
  undoCommand(command: Command<T>, state: T): T {
    if (!command.canUndo(state)) {
      throw new Error(
        `Cannot undo command ${command.id}: state validation failed`,
      );
    }

    return command.undo(state);
  }

  /**
   * Get command history for a specific user
   */
  getHistory(userId: string): Command<T>[] {
    const stack = this.undoStacks.get(userId);
    return stack ? stack.getCommands() : [];
  }

  /**
   * Get global command history
   */
  getGlobalHistory(): Command<T>[] {
    return [...this.globalHistory];
  }

  /**
   * Get commands that can be undone for a user
   */
  getUndoableCommands(userId: string): Command<T>[] {
    const stack = this.undoStacks.get(userId);
    return stack ? stack.getActiveHistory() : [];
  }

  /**
   * Get commands that can be redone for a user
   */
  getRedoableCommands(userId: string): Command<T>[] {
    return this.getRedoStack(userId);
  }

  /**
   * Check if user can undo
   */
  canUndo(userId: string): boolean {
    const stack = this.undoStacks.get(userId);
    return stack ? stack.canUndo() : false;
  }

  /**
   * Check if user can redo
   */
  canRedo(userId: string): boolean {
    const redoStack = this.redoStacks.get(userId);
    return redoStack ? redoStack.length > 0 : false;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStacks.clear();
    this.globalHistory.length = 0;
    this.redoStacks.clear();
    this.dependencies.clear();
    this.conflicts.length = 0;
  }

  /**
   * Clear history for specific user
   */
  clearUser(userId: string): void {
    this.undoStacks.delete(userId);
    this.redoStacks.delete(userId);

    // Remove user's commands from global history
    const userCommandIds = new Set(
      this.globalHistory
        .filter((cmd) => cmd.userId === userId)
        .map((cmd) => cmd.id),
    );

    // Remove from global history
    const newGlobalHistory = this.globalHistory.filter(
      (cmd) => cmd.userId !== userId,
    );
    this.globalHistory.length = 0;
    this.globalHistory.push(...newGlobalHistory);

    // Clean up dependencies
    for (const commandId of userCommandIds) {
      this.dependencies.delete(commandId);
    }
  }

  /**
   * Create a branch for speculative operations
   */
  createBranch(userId: string, branchId: string): boolean {
    const stack = this.undoStacks.get(userId);
    if (!stack) {
      return false;
    }

    stack.createBranch(branchId);
    return true;
  }

  /**
   * Restore from a branch
   */
  restoreBranch(userId: string, branchId: string): boolean {
    const stack = this.undoStacks.get(userId);
    if (!stack) {
      return false;
    }

    return stack.restoreBranch(branchId);
  }

  /**
   * Delete a branch
   */
  deleteBranch(userId: string, branchId: string): boolean {
    const stack = this.undoStacks.get(userId);
    if (!stack) {
      return false;
    }

    return stack.deleteBranch(branchId);
  }

  /**
   * Serialize history for persistence
   */
  serialize(): HistorySnapshot {
    const commands: SerializedCommand[] = this.globalHistory.map((cmd) => ({
      id: cmd.id,
      type: cmd.type,
      timestamp: cmd.timestamp,
      userId: cmd.userId,
      affects: cmd.affects,
      data: cmd.metadata,
      metadata: cmd.metadata,
    }));

    const userPositions = new Map<string, number>();
    for (const [userId, stack] of this.undoStacks) {
      userPositions.set(userId, stack.position);
    }

    return {
      timestamp: Date.now(),
      commands,
      userPositions,
      version: "1.0.0",
    };
  }

  /**
   * Replay commands from serialized history
   */
  replay(initialState: T, commands: Command<T>[], options?: ReplayOptions): T {
    let state = initialState;
    const skipSet = new Set(options?.skip || []);

    for (const command of commands) {
      // Apply filters
      if (options?.userId && command.userId !== options.userId) {
        continue;
      }

      if (skipSet.has(command.id)) {
        continue;
      }

      if (options?.startFrom && command.id === options.startFrom) {
        // Start executing from here
        continue;
      }

      if (options?.stopAt && command.id === options.stopAt) {
        break;
      }

      // Execute command
      state = command.execute(state);
    }

    return state;
  }

  /**
   * Prune old commands based on configuration
   */
  prune(config: PruneConfig): number {
    let removedCount = 0;
    const now = Date.now();
    const keepSet = new Set(config.keepAffecting || []);
    const keepUsers = new Set(config.keepFromUsers || []);

    const shouldKeep = (cmd: Command<T>): boolean => {
      // Keep if from specified users
      if (keepUsers.size > 0 && keepUsers.has(cmd.userId)) {
        return true;
      }

      // Keep if affects specified entities
      if (keepSet.size > 0) {
        for (const affected of cmd.affects) {
          if (keepSet.has(affected)) {
            return true;
          }
        }
      }

      // Check age limit
      if (config.maxAge && now - cmd.timestamp > config.maxAge) {
        return false;
      }

      return true;
    };

    // Prune global history
    if (config.maxCommands || config.maxAge) {
      const filtered = this.globalHistory.filter(shouldKeep);

      // Apply max commands limit
      if (config.maxCommands && filtered.length > config.maxCommands) {
        const toKeep = filtered.slice(-config.maxCommands);
        removedCount = this.globalHistory.length - toKeep.length;
        this.globalHistory.length = 0;
        this.globalHistory.push(...toKeep);
      } else {
        removedCount = this.globalHistory.length - filtered.length;
        this.globalHistory.length = 0;
        this.globalHistory.push(...filtered);
      }
    }

    return removedCount;
  }

  /**
   * Get history statistics
   */
  getStats(): HistoryStats {
    const commandsByUser = new Map<string, number>();
    const commandsByType = new Map<string, number>();
    let oldestCommand: number | undefined;
    let newestCommand: number | undefined;
    let estimatedSize = 0;

    for (const command of this.globalHistory) {
      // Count by user
      commandsByUser.set(
        command.userId,
        (commandsByUser.get(command.userId) || 0) + 1,
      );

      // Count by type
      commandsByType.set(
        command.type,
        (commandsByType.get(command.type) || 0) + 1,
      );

      // Track timestamps
      if (!oldestCommand || command.timestamp < oldestCommand) {
        oldestCommand = command.timestamp;
      }
      if (!newestCommand || command.timestamp > newestCommand) {
        newestCommand = command.timestamp;
      }

      // Estimate size (rough approximation)
      estimatedSize += JSON.stringify(command.serialize()).length;
    }

    return {
      totalCommands: this.globalHistory.length,
      commandsByUser,
      commandsByType,
      oldestCommand,
      newestCommand,
      estimatedSize,
    };
  }

  /**
   * Get conflicts detected
   */
  getConflicts(): CommandConflict<T>[] {
    return [...this.conflicts];
  }

  /**
   * Resolve a conflict
   */
  resolveConflict(
    conflict: CommandConflict<T>,
    resolution: ConflictResolution,
  ): void {
    conflict.resolution = resolution;
  }

  // Private helper methods

  private getOrCreateStack(userId: string): UndoStack {
    let stack = this.undoStacks.get(userId);
    if (!stack) {
      stack = new UndoStack(userId);
      this.undoStacks.set(userId, stack);
    }
    return stack;
  }

  private getRedoStack(userId: string): Command<T>[] {
    let stack = this.redoStacks.get(userId);
    if (!stack) {
      stack = [];
      this.redoStacks.set(userId, stack);
    }
    return stack;
  }

  private trackDependencies(command: Command<T>): void {
    const dependency: CommandDependency = {
      commandId: command.id,
      dependsOn: [],
      dependents: [],
    };

    // Find commands this one depends on (commands affecting same entities)
    for (const prevCommand of this.globalHistory) {
      if (prevCommand.id === command.id) {
        continue;
      }

      // Check if they affect common entities
      const hasCommonEntity = command.affects.some((entity) =>
        prevCommand.affects.includes(entity),
      );

      if (hasCommonEntity && prevCommand.timestamp < command.timestamp) {
        dependency.dependsOn.push(prevCommand.id);

        // Update the previous command's dependents
        const prevDep = this.dependencies.get(prevCommand.id);
        if (prevDep) {
          prevDep.dependents.push(command.id);
        }
      }
    }

    this.dependencies.set(command.id, dependency);
  }

  private getDependentCommands(commandId: string): Command<T>[] {
    const dependency = this.dependencies.get(commandId);
    if (!dependency) {
      return [];
    }

    const dependents: Command<T>[] = [];
    for (const depId of dependency.dependents) {
      const cmd = this.globalHistory.find((c) => c.id === depId);
      if (cmd) {
        dependents.push(cmd);
      }
    }

    return dependents;
  }

  private detectConflicts(command: Command<T>): void {
    // Find recent commands affecting same entities by different users
    const recentCommands = this.globalHistory
      .slice(-10)
      .filter(
        (cmd) =>
          cmd.userId !== command.userId &&
          cmd.affects.some((entity) => command.affects.includes(entity)),
      );

    if (recentCommands.length > 0) {
      const affectedEntities = command.affects.filter((entity) =>
        recentCommands.some((cmd) => cmd.affects.includes(entity)),
      );

      if (affectedEntities.length > 0) {
        this.conflicts.push({
          commands: [...recentCommands, command],
          affectedEntities,
        });
      }
    }
  }
}
