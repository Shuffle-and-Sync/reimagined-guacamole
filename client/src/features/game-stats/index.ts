/**
 * Game Statistics Feature Exports
 * 
 * This index file demonstrates proper feature-based organization
 * following the Shuffle & Sync repository conventions:
 * - Clean feature exports with clear public API
 * - Separation of types, components, and hooks
 * - Consistent naming conventions
 * - Type-only vs value exports distinction
 */

// Type exports
export type {
  GameStats,
  GameResult,
  TCGType,
  CreateGameResultData,
  GameStatsResponse,
  GameStatsFilters,
  GameStatsPagination,
  GameStatsQuery,
  GameStatsCardProps,
  GameResultFormProps,
  GameStatsListProps,
} from './types';

// Component exports
export { GameStatsCard, GameStatsCardSkeleton } from './components/game-stats-card';

// Hook exports
export { 
  useGameStats, 
  useAggregateGameStats,
  useGameStatsLeaderboard 
} from './hooks/use-game-stats';

// Schema exports for validation
export { 
  gameResultSchema, 
  gameStatsFiltersSchema 
} from './types';