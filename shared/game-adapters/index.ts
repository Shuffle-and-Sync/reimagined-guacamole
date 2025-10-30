/**
 * Game Adapters - Public API
 *
 * Central export point for all game adapters and related functionality
 */

// Export base types and classes
// Auto-register adapters
import { MTGAdapter } from "./mtg-adapter";
import { PokemonAdapter } from "./pokemon-adapter";
import { GameAdapterRegistry } from "./registry";

export type {
  GameAdapter,
  GameConfig,
  ValidationResult,
  GameStateView,
  PlayerAction,
} from "./base-game-adapter";

export {
  BaseGameAdapter,
  GameConfigSchema,
  ValidationResultSchema,
  PlayerActionSchema,
  isGameAdapter,
} from "./base-game-adapter";

// Export registry
export { GameAdapterRegistry, autoRegisterAdapters } from "./registry";

// Export specific adapters
export { MTGAdapter } from "./mtg-adapter";
export { PokemonAdapter, type PokemonGameState } from "./pokemon-adapter";

// Register default adapters
GameAdapterRegistry.register(new MTGAdapter());
GameAdapterRegistry.register(new PokemonAdapter());
