/**
 * Game Adapter Registry
 *
 * Central registry for managing multiple game type adapters
 */

import type { GameAdapter, GameStateBase } from "./base-game-adapter";

/**
 * Registry for managing game adapters
 * Provides centralized access to all supported game types
 */
export class GameAdapterRegistry {
  private static adapters = new Map<string, GameAdapter<GameStateBase>>();
  private static initialized = false;

  /**
   * Register a game adapter
   */
  static register<T extends GameStateBase>(adapter: GameAdapter<T>): void {
    if (this.adapters.has(adapter.gameType)) {
      console.warn(
        `Game adapter for "${adapter.gameType}" is already registered. Overwriting.`,
      );
    }

    this.adapters.set(adapter.gameType, adapter as GameAdapter<GameStateBase>);
  }

  /**
   * Get an adapter by game type
   */
  static get<T extends GameStateBase>(gameType: string): GameAdapter<T> | null {
    const adapter = this.adapters.get(gameType);
    return (adapter as GameAdapter<T>) || null;
  }

  /**
   * Check if a game type is supported
   */
  static isSupported(gameType: string): boolean {
    return this.adapters.has(gameType);
  }

  /**
   * Get all supported game types
   */
  static getSupportedGames(): Array<{
    type: string;
    name: string;
    version?: string;
  }> {
    return Array.from(this.adapters.values()).map((adapter) => ({
      type: adapter.gameType,
      name: adapter.gameName,
      version: adapter.version,
    }));
  }

  /**
   * Unregister a game adapter
   */
  static unregister(gameType: string): boolean {
    return this.adapters.delete(gameType);
  }

  /**
   * Clear all registered adapters
   */
  static clear(): void {
    this.adapters.clear();
    this.initialized = false;
  }

  /**
   * Get count of registered adapters
   */
  static count(): number {
    return this.adapters.size;
  }

  /**
   * Initialize with default adapters
   * This should be called once at application startup
   */
  static initializeDefaultAdapters(): void {
    if (this.initialized) {
      console.warn("Game adapters already initialized");
      return;
    }

    // Adapters are registered in their respective modules
    // This method exists for explicit initialization if needed
    this.initialized = true;
  }

  /**
   * Get all adapter game types
   */
  static getGameTypes(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if registry has been initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Auto-register adapters when imported
 * Import this file to automatically register all game adapters
 */
export function autoRegisterAdapters(): void {
  // Dynamic imports to avoid circular dependencies
  // Adapters should self-register when imported
  GameAdapterRegistry.initializeDefaultAdapters();
}
