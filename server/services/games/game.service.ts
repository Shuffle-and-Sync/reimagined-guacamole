/**
 * Game Service
 * 
 * Service for managing user-defined games in the Universal Deck-Building framework
 */

import { eq, and } from 'drizzle-orm';
import { db } from '../../../shared/database-unified';
import { games } from '../../../shared/schema';
import { logger } from '../../logger';

export interface GameData {
  name: string;
  displayName: string;
  description?: string;
  creatorId: string;
  isOfficial?: boolean;
  version?: string;
  playerCount?: { min: number; max: number };
  avgGameDuration?: number;
  complexity?: number;
  ageRating?: string;
  cardTypes?: string[];
  resourceTypes?: any[];
  zones?: string[];
  phaseStructure?: string[];
  deckRules?: {
    minDeckSize?: number;
    maxDeckSize?: number | null;
    maxCopies?: number;
    allowedSets?: string[] | null;
  };
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    cardBackUrl?: string | null;
  };
  externalSource?: string;
}

export interface GameUpdate {
  displayName?: string;
  description?: string;
  version?: string;
  playerCount?: { min: number; max: number };
  avgGameDuration?: number;
  complexity?: number;
  ageRating?: string;
  cardTypes?: string[];
  resourceTypes?: any[];
  zones?: string[];
  phaseStructure?: string[];
  deckRules?: any;
  theme?: any;
}

export class GameService {
  /**
   * Create a new game
   */
  async createGame(userId: string, gameData: GameData) {
    try {
      logger.info('Creating new game', { userId, gameName: gameData.name });

      const [game] = await db.insert(games).values({
        name: gameData.name,
        displayName: gameData.displayName,
        description: gameData.description,
        creatorId: userId,
        isOfficial: gameData.isOfficial || false,
        isPublished: false, // New games start as unpublished
        version: gameData.version || '1.0.0',
        playerCount: gameData.playerCount || { min: 2, max: 4 },
        avgGameDuration: gameData.avgGameDuration,
        complexity: gameData.complexity,
        ageRating: gameData.ageRating,
        cardTypes: gameData.cardTypes || [],
        resourceTypes: gameData.resourceTypes || [],
        zones: gameData.zones || [],
        phaseStructure: gameData.phaseStructure || [],
        deckRules: gameData.deckRules || {
          minDeckSize: 60,
          maxDeckSize: null,
          maxCopies: 4,
          allowedSets: null,
        },
        theme: gameData.theme || {
          primaryColor: '#1a1a1a',
          accentColor: '#ffd700',
          cardBackUrl: null,
        },
        moderationStatus: 'pending',
      }).returning();

      logger.info('Game created successfully', { gameId: game?.id, userId });
      return game!;
    } catch (error) {
      logger.error('Failed to create game', error, { userId, gameName: gameData.name });
      throw error;
    }
  }

  /**
   * Get game by ID
   */
  async getGameById(gameId: string) {
    try {
      const [game] = await db.select()
        .from(games)
        .where(eq(games.id, gameId))
        .limit(1);

      return game || null;
    } catch (error) {
      logger.error('Failed to get game by ID', error, { gameId });
      throw error;
    }
  }

  /**
   * Get all games (with optional filters)
   */
  async getAllGames(filters?: { 
    isPublished?: boolean; 
    isOfficial?: boolean; 
    creatorId?: string;
  }) {
    try {
      let query = db.select().from(games);

      if (filters?.isPublished !== undefined) {
        query = query.where(eq(games.isPublished, filters.isPublished)) as any;
      }
      if (filters?.isOfficial !== undefined) {
        query = query.where(eq(games.isOfficial, filters.isOfficial)) as any;
      }
      if (filters?.creatorId) {
        query = query.where(eq(games.creatorId, filters.creatorId)) as any;
      }

      const result = await query;
      return result;
    } catch (error) {
      logger.error('Failed to get games', error, { filters });
      throw error;
    }
  }

  /**
   * Update game
   */
  async updateGame(gameId: string, userId: string, updates: GameUpdate) {
    try {
      // Verify ownership
      const game = await this.getGameById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }
      if (game.creatorId !== userId) {
        throw new Error('Not authorized to update this game');
      }

      logger.info('Updating game', { gameId, userId });

      const [updatedGame] = await db.update(games)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(games.id, gameId))
        .returning();

      logger.info('Game updated successfully', { gameId, userId });
      return updatedGame;
    } catch (error) {
      logger.error('Failed to update game', error, { gameId, userId });
      throw error;
    }
  }

  /**
   * Delete game
   */
  async deleteGame(gameId: string, userId: string) {
    try {
      // Verify ownership
      const game = await this.getGameById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }
      if (game.creatorId !== userId) {
        throw new Error('Not authorized to delete this game');
      }

      logger.info('Deleting game', { gameId, userId });

      await db.delete(games).where(eq(games.id, gameId));

      logger.info('Game deleted successfully', { gameId, userId });
      return true;
    } catch (error) {
      logger.error('Failed to delete game', error, { gameId, userId });
      throw error;
    }
  }

  /**
   * Publish game (make it publicly available)
   */
  async publishGame(gameId: string, userId: string) {
    try {
      // Verify ownership
      const game = await this.getGameById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }
      if (game.creatorId !== userId) {
        throw new Error('Not authorized to publish this game');
      }

      logger.info('Publishing game', { gameId, userId });

      const [publishedGame] = await db.update(games)
        .set({
          isPublished: true,
          updatedAt: new Date(),
        })
        .where(eq(games.id, gameId))
        .returning();

      logger.info('Game published successfully', { gameId, userId });
      return publishedGame;
    } catch (error) {
      logger.error('Failed to publish game', error, { gameId, userId });
      throw error;
    }
  }

  /**
   * Get game statistics
   */
  async getGameStats(gameId: string) {
    try {
      const game = await this.getGameById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      return {
        totalCards: game.totalCards,
        totalPlayers: game.totalPlayers,
        totalGamesPlayed: game.totalGamesPlayed,
      };
    } catch (error) {
      logger.error('Failed to get game stats', error, { gameId });
      throw error;
    }
  }
}

// Export singleton instance
export const gameService = new GameService();
