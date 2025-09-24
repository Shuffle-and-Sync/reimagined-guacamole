/**
 * Game Statistics Feature Types
 * 
 * This file demonstrates proper TypeScript usage and type definitions
 * following the Shuffle & Sync repository conventions:
 * - Strict TypeScript configuration
 * - Comprehensive type definitions for all data structures
 * - Clear separation of concerns between different type categories
 * - Zod integration for runtime validation
 */

import { z } from 'zod';

// Base game statistics interface
export interface GameStats {
  id: string;
  userId: string;
  gameType: TCGType;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  favoriteFormat: string | null;
  lastPlayed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// TCG community types as defined in the platform
export type TCGType = 'mtg' | 'pokemon' | 'lorcana' | 'yugioh' | 'flesh-and-blood' | 'keyforge';

// Game session result for statistics tracking
export interface GameResult {
  id: string;
  userId: string;
  gameType: TCGType;
  format: string;
  result: 'win' | 'loss' | 'draw';
  opponentId?: string | null;
  duration: number; // in minutes
  notes?: string | null;
  createdAt: Date;
}

// API request/response types for RESTful endpoints
export interface CreateGameResultRequest {
  gameType: TCGType;
  format: string;
  result: 'win' | 'loss' | 'draw';
  opponentId?: string;
  duration: number;
  notes?: string;
}

export interface UpdateGameStatsRequest {
  gameType: TCGType;
  favoriteFormat?: string;
}

export interface GameStatsResponse {
  stats: GameStats[];
  recentGames: GameResult[];
  totalRecords: number;
}

// Pagination and filtering types following repository patterns
export interface GameStatsFilters {
  gameType?: TCGType;
  format?: string;
  dateFrom?: string;
  dateTo?: string;
  resultType?: 'win' | 'loss' | 'draw';
}

export interface GameStatsPagination {
  page: number;
  limit: number;
  offset: number;
}

export interface GameStatsQuery extends GameStatsFilters, GameStatsPagination {
  sortBy?: 'createdAt' | 'winRate' | 'totalGames';
  sortOrder?: 'asc' | 'desc';
}

// Zod schemas for runtime validation (following repository conventions)
export const gameResultSchema = z.object({
  gameType: z.enum(['mtg', 'pokemon', 'lorcana', 'yugioh', 'flesh-and-blood', 'keyforge']),
  format: z.string().min(1, 'Format is required'),
  result: z.enum(['win', 'loss', 'draw']),
  opponentId: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export const gameStatsFiltersSchema = z.object({
  gameType: z.enum(['mtg', 'pokemon', 'lorcana', 'yugioh', 'flesh-and-blood', 'keyforge']).optional(),
  format: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  resultType: z.enum(['win', 'loss', 'draw']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'winRate', 'totalGames']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type inference from Zod schemas
export type CreateGameResultData = z.infer<typeof gameResultSchema>;
export type GameStatsFiltersData = z.infer<typeof gameStatsFiltersSchema>;

// Component prop types following React conventions
export interface GameStatsCardProps {
  stats: GameStats;
  className?: string;
  onEdit?: (stats: GameStats) => void;
}

export interface GameResultFormProps {
  onSubmit: (data: CreateGameResultData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<CreateGameResultData>;
}

export interface GameStatsListProps {
  filters: GameStatsFilters;
  onFiltersChange: (filters: GameStatsFilters) => void;
  className?: string;
}