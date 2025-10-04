/**
 * Universal Card Service
 * 
 * Main service that routes card requests to appropriate adapters based on game ID
 * NOTE: games table not yet implemented in schema - custom games disabled
 */

import { eq } from 'drizzle-orm';
import { db } from '../../../shared/database-unified';
// TODO: Re-enable when games table is added to schema
// import { games } from '../../../shared/schema';
import { logger } from '../../logger';
import { ICardAdapter, UniversalCard, CardSearchResult, AutocompleteResult } from './adapters/base.adapter';
import { scryfallAdapter } from './adapters/scryfall.adapter';
import { pokemonTCGAdapter } from './adapters/pokemon.adapter';
import { yugiohAdapter } from './adapters/yugioh.adapter';
import { CustomGameAdapter } from './adapters/custom.adapter';

export class UniversalCardService {
  private adapters = new Map<string, ICardAdapter>();

  constructor() {
    // Register official game adapters
    this.adapters.set('mtg-official', scryfallAdapter);
    this.adapters.set('pokemon-tcg', pokemonTCGAdapter);
    this.adapters.set('yugioh-tcg', yugiohAdapter);
    logger.info('Universal Card Service initialized with MTG, Pokemon, and Yu-Gi-Oh adapters');
  }

  /**
   * Get or create adapter for a specific game
   */
  private async getAdapter(gameId: string): Promise<ICardAdapter> {
    // Check if adapter already exists
    if (this.adapters.has(gameId)) {
      return this.adapters.get(gameId)!;
    }

    // TODO: Re-enable when games table is added to schema
    // For now, only support official games
    /* Original implementation - disabled until games table exists
    // Load game configuration
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }
    */

    // Determine which adapter to use
    let adapter: ICardAdapter;

    // Check for official game adapters
    if (gameId === 'mtg-official') {
      adapter = scryfallAdapter;
    } else if (gameId === 'pokemon-tcg') {
      adapter = pokemonTCGAdapter;
    } else if (gameId === 'yugioh-tcg') {
      adapter = yugiohAdapter;
    } else {
      // Custom games not supported until games table is implemented
      throw new Error(`Custom games not yet supported - games table missing from schema. Supported games: mtg-official, pokemon-tcg, yugioh-tcg`);
      // Default to custom game adapter for all user-defined games
      // adapter = new CustomGameAdapter(gameId);
    }

    // Cache the adapter
    this.adapters.set(gameId, adapter);
    logger.info('Created adapter for game', { gameId, adapterType: adapter.constructor.name });

    return adapter;
  }

  /**
   * Search for cards in a specific game
   */
  async searchCards(
    gameId: string,
    query: string,
    options?: {
      set?: string;
      format?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<CardSearchResult> {
    try {
      const adapter = await this.getAdapter(gameId);
      return await adapter.searchCards(query, options);
    } catch (error) {
      logger.error('Universal card search failed', error, { gameId, query, options });
      throw error;
    }
  }

  /**
   * Get card by ID in a specific game
   */
  async getCardById(gameId: string, id: string): Promise<UniversalCard | null> {
    try {
      const adapter = await this.getAdapter(gameId);
      return await adapter.getCardById(id);
    } catch (error) {
      logger.error('Universal getCardById failed', error, { gameId, id });
      throw error;
    }
  }

  /**
   * Get card by name in a specific game
   */
  async getCardByName(
    gameId: string,
    name: string,
    options?: { set?: string }
  ): Promise<UniversalCard | null> {
    try {
      const adapter = await this.getAdapter(gameId);
      return await adapter.getCardByName(name, options);
    } catch (error) {
      logger.error('Universal getCardByName failed', error, { gameId, name, options });
      throw error;
    }
  }

  /**
   * Autocomplete card names in a specific game
   */
  async autocomplete(
    gameId: string,
    query: string,
    limit = 20
  ): Promise<AutocompleteResult> {
    try {
      const adapter = await this.getAdapter(gameId);
      return await adapter.autocomplete(query, limit);
    } catch (error) {
      logger.error('Universal autocomplete failed', error, { gameId, query, limit });
      throw error;
    }
  }

  /**
   * Get random card from a specific game
   */
  async getRandomCard(
    gameId: string,
    options?: {
      set?: string;
      format?: string;
    }
  ): Promise<UniversalCard> {
    try {
      const adapter = await this.getAdapter(gameId);
      return await adapter.getRandomCard(options);
    } catch (error) {
      logger.error('Universal getRandomCard failed', error, { gameId, options });
      throw error;
    }
  }

  /**
   * Clear adapter cache (useful for testing or when game config changes)
   */
  clearAdapterCache(): void {
    // Keep the official game adapters
    const mtgAdapter = this.adapters.get('mtg-official');
    const pokemonAdapter = this.adapters.get('pokemon-tcg');
    const yugiohAdapter = this.adapters.get('yugioh-tcg');
    
    this.adapters.clear();
    
    if (mtgAdapter) {
      this.adapters.set('mtg-official', mtgAdapter);
    }
    if (pokemonAdapter) {
      this.adapters.set('pokemon-tcg', pokemonAdapter);
    }
    if (yugiohAdapter) {
      this.adapters.set('yugioh-tcg', yugiohAdapter);
    }
    
    logger.info('Adapter cache cleared');
  }
}

// Export singleton instance
export const universalCardService = new UniversalCardService();

// Re-export types for convenience
export type { UniversalCard, CardSearchResult, AutocompleteResult };
