/**
 * Game Adapter Registry
 *
 * Central registry for managing game adapters. Enables hot-swapping of game
 * implementations and provides a factory for creating adapter instances.
 */

import { MTGGameAdapter } from "./mtg-adapter";
import { PokemonGameAdapter } from "./pokemon-adapter";
import type { IGameAdapter } from "../../../../shared/game-adapter-types";

/**
 * Registry for managing available game adapters
 */
export class GameAdapterRegistry {
  private adapters: Map<string, () => IGameAdapter>;

  constructor() {
    this.adapters = new Map();
    this.registerDefaultAdapters();
  }

  /**
   * Register default adapters
   */
  private registerDefaultAdapters(): void {
    this.register("mtg", () => new MTGGameAdapter());
    this.register("pokemon", () => new PokemonGameAdapter());
  }

  /**
   * Register a new game adapter
   * @param gameId - Unique identifier for the game
   * @param factory - Factory function that creates an adapter instance
   */
  register(gameId: string, factory: () => IGameAdapter): void {
    this.adapters.set(gameId.toLowerCase(), factory);
  }

  /**
   * Unregister a game adapter
   * @param gameId - Game identifier to remove
   */
  unregister(gameId: string): boolean {
    return this.adapters.delete(gameId.toLowerCase());
  }

  /**
   * Get an adapter by game ID
   * @param gameId - Game identifier
   * @returns Game adapter instance or undefined if not found
   */
  get(gameId: string): IGameAdapter | undefined {
    const factory = this.adapters.get(gameId.toLowerCase());
    return factory ? factory() : undefined;
  }

  /**
   * Check if a game adapter is registered
   * @param gameId - Game identifier
   */
  has(gameId: string): boolean {
    return this.adapters.has(gameId.toLowerCase());
  }

  /**
   * Get all registered game IDs
   */
  getRegisteredGames(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get metadata for all registered games
   */
  getGameMetadata(): Array<{
    gameId: string;
    gameName: string;
    version: string;
  }> {
    const metadata: Array<{
      gameId: string;
      gameName: string;
      version: string;
    }> = [];

    for (const gameId of this.adapters.keys()) {
      const adapter = this.get(gameId);
      if (adapter) {
        metadata.push({
          gameId: adapter.gameId,
          gameName: adapter.gameName,
          version: adapter.version,
        });
      }
    }

    return metadata;
  }

  /**
   * Clear all registered adapters
   */
  clear(): void {
    this.adapters.clear();
  }
}

/**
 * Singleton instance of the game adapter registry
 */
export const gameAdapterRegistry = new GameAdapterRegistry();

/**
 * Factory function to create a game adapter
 * @param gameId - Game identifier
 * @returns Game adapter instance
 * @throws Error if game adapter not found
 */
export function createGameAdapter(gameId: string): IGameAdapter {
  const adapter = gameAdapterRegistry.get(gameId);

  if (!adapter) {
    throw new Error(
      `Game adapter not found for: ${gameId}. ` +
        `Available games: ${gameAdapterRegistry.getRegisteredGames().join(", ")}`,
    );
  }

  return adapter;
}

/**
 * Helper to get all available games
 */
export function getAvailableGames(): Array<{
  gameId: string;
  gameName: string;
  version: string;
}> {
  return gameAdapterRegistry.getGameMetadata();
}

/**
 * Helper to check if a game is supported
 */
export function isGameSupported(gameId: string): boolean {
  return gameAdapterRegistry.has(gameId);
}
