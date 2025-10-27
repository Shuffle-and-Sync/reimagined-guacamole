/**
 * Game Adapters Module
 *
 * Exports all game adapter functionality for use throughout the application.
 */

// Base adapter
export { BaseGameAdapter } from "./base-game-adapter";

// Specific game adapters
export { MTGGameAdapter } from "./mtg-adapter";
export type {
  MTGGameState,
  MTGAction,
  MTGPlayer,
  MTGCard,
  MTGZone,
  MTGActionType,
} from "./mtg-adapter";

export { PokemonGameAdapter } from "./pokemon-adapter";
export type {
  PokemonGameState,
  PokemonAction,
  PokemonPlayer,
  PokemonCard,
  PokemonZone,
  PokemonType,
  PokemonActionType,
} from "./pokemon-adapter";

// Registry and factory
export {
  GameAdapterRegistry,
  gameAdapterRegistry,
  createGameAdapter,
  getAvailableGames,
  isGameSupported,
} from "./game-adapter-registry";
