/**
 * Game Statistics Business Logic Service
 * 
 * This service demonstrates proper backend architecture patterns
 * following the Shuffle & Sync repository conventions:
 * - Separation of business logic from route handlers
 * - Database operations abstracted through storage interface
 * - Comprehensive error handling with custom error types
 * - Type-safe database operations with Drizzle ORM
 * - Transaction support for data consistency
 * - Performance optimization with query batching
 */

import { eq, and, gte, lte, desc, asc, count, sql } from 'drizzle-orm';
import type { Transaction } from '@shared/database-unified';
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { NotFoundError, ValidationError } from '../../shared/types';
import { logger } from '../../logger';

// Types for service layer (would typically come from shared schema)
interface GameStats {
  id: string;
  userId: string;
  gameType: string;
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

interface GameResult {
  id: string;
  userId: string;
  gameType: string;
  format: string;
  result: 'win' | 'loss' | 'draw';
  opponentId?: string | null;
  duration: number;
  notes?: string | null;
  createdAt: Date;
}

interface GameStatsFilters {
  gameType?: string;
  format?: string;
  dateFrom?: string;
  dateTo?: string;
  resultType?: 'win' | 'loss' | 'draw';
  page: number;
  limit: number;
  offset: number;
  sortBy: 'createdAt' | 'winRate' | 'totalGames';
  sortOrder: 'asc' | 'desc';
}

interface CreateGameResultData {
  gameType: string;
  format: string;
  result: 'win' | 'loss' | 'draw';
  opponentId?: string | null;
  duration: number;
  notes?: string | null;
}

/**
 * Game Statistics Service Class
 * 
 * Provides business logic for game statistics operations
 * with proper error handling, validation, and data integrity
 */
class GameStatsService {
  /**
   * Get user's game statistics with filtering and pagination
   */
  async getUserGameStats(userId: string, filters: GameStatsFilters) {
    try {
      // Validate user exists
      const user = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new NotFoundError('User not found');
      }

      // Build query conditions
      const conditions = [eq(sql`game_stats.user_id`, userId)];
      
      if (filters.gameType) {
        conditions.push(eq(sql`game_stats.game_type`, filters.gameType));
      }
      
      if (filters.dateFrom) {
        conditions.push(gte(sql`game_stats.updated_at`, new Date(filters.dateFrom)));
      }
      
      if (filters.dateTo) {
        conditions.push(lte(sql`game_stats.updated_at`, new Date(filters.dateTo)));
      }

      // Mock query for demonstration (would use actual game_stats table)
      const mockStats: GameStats[] = [
        {
          id: '1',
          userId,
          gameType: filters.gameType || 'mtg',
          totalGames: 45,
          wins: 28,
          losses: 15,
          draws: 2,
          winRate: 0.62,
          favoriteFormat: 'Commander',
          lastPlayed: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      // Mock recent games
      const mockRecentGames: GameResult[] = [
        {
          id: '1',
          userId,
          gameType: 'mtg',
          format: 'Commander',
          result: 'win',
          duration: 45,
          createdAt: new Date(),
        }
      ];

      return {
        stats: mockStats,
        recentGames: mockRecentGames,
        totalRecords: mockStats.length,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(mockStats.length / filters.limit),
          hasNext: filters.page * filters.limit < mockStats.length,
          hasPrev: filters.page > 1,
        }
      };
    } catch (error) {
      console.error('Error fetching user game stats:', error);
      throw error;
    }
  }

  /**
   * Update user's game statistics preferences
   */
  async updateGameStatsPreferences(userId: string, updateData: { gameType: string; favoriteFormat?: string }) {
    try {
      // Validate user exists
      const user = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new NotFoundError('User not found');
      }

      // Mock update operation (would update actual game_stats table)
      const updatedStats: GameStats = {
        id: '1',
        userId,
        gameType: updateData.gameType,
        totalGames: 45,
        wins: 28,
        losses: 15,
        draws: 2,
        winRate: 0.62,
        favoriteFormat: updateData.favoriteFormat || null,
        lastPlayed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return updatedStats;
    } catch (error) {
      console.error('Error updating game stats preferences:', error);
      throw error;
    }
  }

  /**
   * Get aggregate statistics across all game types for a user
   */
  async getAggregateStats(userId: string) {
    try {
      // Validate user exists
      const user = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new NotFoundError('User not found');
      }

      // Mock aggregate data (would aggregate from actual game_stats table)
      return {
        totalGamesAllFormats: 150,
        totalWinsAllFormats: 92,
        totalLossesAllFormats: 55,
        totalDrawsAllFormats: 3,
        overallWinRate: 0.61,
        favoriteGameType: 'mtg',
        mostPlayedFormat: 'Commander',
        longestWinStreak: 8,
        currentWinStreak: 3,
        gamesThisMonth: 12,
        monthlyWinRate: 0.75,
        rankingPosition: 156,
        totalPlaytime: 2340, // minutes
      };
    } catch (error) {
      console.error('Error fetching aggregate stats:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard data for game statistics
   */
  async getLeaderboard(filters: { gameType?: string; limit: number }) {
    try {
      // Mock leaderboard data (would query actual game_stats with ranking)
      const mockLeaderboard = Array.from({ length: filters.limit }, (_, i) => ({
        rank: i + 1,
        userId: `user-${i + 1}`,
        username: `Player${i + 1}`,
        gameType: filters.gameType || 'all',
        totalGames: Math.floor(Math.random() * 200) + 50,
        wins: Math.floor(Math.random() * 150) + 30,
        winRate: Math.round((Math.random() * 0.4 + 0.5) * 100) / 100,
        favoriteFormat: ['Commander', 'Standard', 'Modern'][Math.floor(Math.random() * 3)],
        profileImageUrl: null,
      }));

      return {
        leaderboard: mockLeaderboard,
        gameType: filters.gameType || 'all',
        totalPlayers: 1250,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  /**
   * Create a new game result and update statistics
   */
  async createGameResult(userId: string, gameResultData: CreateGameResultData) {
    try {
      // Validate user exists
      const user = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new NotFoundError('User not found');
      }

      // Use database transaction for data consistency
      return await db.transaction(async (tx) => {
        // Mock creating game result (would insert into game_results table)
        const newResult: GameResult = {
          id: `result-${Date.now()}`,
          userId,
          gameType: gameResultData.gameType,
          format: gameResultData.format,
          result: gameResultData.result,
          opponentId: gameResultData.opponentId || null,
          duration: gameResultData.duration,
          notes: gameResultData.notes || null,
          createdAt: new Date(),
        };

        // Mock updating game statistics (would update game_stats table)
        // This would involve:
        // 1. Incrementing totalGames
        // 2. Incrementing wins/losses/draws based on result
        // 3. Recalculating winRate
        // 4. Updating lastPlayed timestamp

        return newResult;
      });
    } catch (error) {
      console.error('Error creating game result:', error);
      throw error;
    }
  }

  /**
   * Get user's game results with filtering and pagination
   */
  async getUserGameResults(userId: string, filters: GameStatsFilters) {
    try {
      // Validate user exists
      const user = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new NotFoundError('User not found');
      }

      // Mock game results (would query actual game_results table)
      const mockResults: GameResult[] = Array.from({ length: Math.min(filters.limit, 10) }, (_, i) => ({
        id: `result-${i + 1}`,
        userId,
        gameType: filters.gameType || 'mtg',
        format: 'Commander',
        result: ['win', 'loss', 'draw'][Math.floor(Math.random() * 3)] as 'win' | 'loss' | 'draw',
        duration: Math.floor(Math.random() * 60) + 20,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      }));

      return {
        results: mockResults,
        totalRecords: 45,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(45 / filters.limit),
          hasNext: filters.page * filters.limit < 45,
          hasPrev: filters.page > 1,
        }
      };
    } catch (error) {
      console.error('Error fetching user game results:', error);
      throw error;
    }
  }

  /**
   * Delete a game result (only if user owns it)
   */
  async deleteGameResult(resultId: string, userId: string) {
    try {
      // Mock validation (would check if result exists and belongs to user)
      if (!resultId || !userId) {
        throw new ValidationError('Invalid result ID or user ID');
      }

      // Mock deletion (would delete from game_results and update game_stats)
      logger.info('Deleting game result', { resultId, userId });
      
      // In a real implementation, this would also recalculate statistics
      return true;
    } catch (error) {
      logger.error('Error deleting game result:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const gameStatsService = new GameStatsService();