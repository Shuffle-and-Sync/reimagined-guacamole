/**
 * Custom Game Adapter
 * 
 * Adapter for custom/user-defined games with database-backed cards
 * NOTE: Currently disabled - 'cards' table not yet implemented in schema
 */

import { eq, and, like, sql } from 'drizzle-orm';
import { db } from '../../../../shared/database-unified';
// TODO: Re-enable when cards table is added to schema
// import { cards } from '../../../../shared/schema';
import { logger } from '../../../logger';
import type { 
  ICardAdapter, 
  UniversalCard, 
  CardSearchResult, 
  AutocompleteResult 
} from './base.adapter';

export class CustomGameAdapter implements ICardAdapter {
  constructor(private gameId: string) {}

  getGameId(): string {
    return this.gameId;
  }

  /**
   * Transform database card to universal format
   */
  private transformToUniversal(dbCard: any): UniversalCard {
    return {
      id: dbCard.id,
      gameId: dbCard.gameId,
      name: dbCard.name,
      setCode: dbCard.setCode,
      setName: dbCard.setName,
      collectorNumber: dbCard.collectorNumber,
      rarity: dbCard.rarity,
      externalId: dbCard.externalId,
      externalSource: dbCard.externalSource,
      attributes: dbCard.attributes || {},
      imageUris: dbCard.imageUris || {},
      isOfficial: dbCard.isOfficial,
      isCommunitySubmitted: dbCard.isCommunitySubmitted,
    };
  }

  async searchCards(
    query: string,
    options?: {
      set?: string;
      format?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<CardSearchResult> {
    // TODO: Re-enable when cards table is added to schema
    throw new Error('Custom game adapter not yet implemented - cards table missing from schema');
    
    /* Original implementation - disabled until cards table exists
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const offset = (page - 1) * limit;

      let whereConditions = [
        eq(cards.gameId, this.gameId),
        like(cards.name, `%${query}%`),
      ];

      if (options?.set) {
        whereConditions.push(eq(cards.setCode, options.set));
      }

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(cards)
        .where(and(...whereConditions));

      const total = Number(countResult?.count || 0);

      // Get paginated results
      const results = await db
        .select()
        .from(cards)
        .where(and(...whereConditions))
        .limit(limit)
        .offset(offset);

      return {
        cards: results.map((card: any) => this.transformToUniversal(card)),
        total,
        page,
        hasMore: offset + results.length < total,
      };
    } catch (error) {
      logger.error('Custom adapter search failed', error, { gameId: this.gameId, query, options });
      throw error;
    }
    */
  }

  async getCardById(id: string): Promise<UniversalCard | null> {
    // TODO: Re-enable when cards table is added to schema
    throw new Error('Custom game adapter not yet implemented - cards table missing from schema');
    
    /* Original implementation - disabled until cards table exists
    try {
      const [card] = await db
        .select()
        .from(cards)
        .where(and(
          eq(cards.id, id),
          eq(cards.gameId, this.gameId)
        ))
        .limit(1);

      if (!card) return null;
      
      return this.transformToUniversal(card);
    } catch (error) {
      logger.error('Custom adapter getCardById failed', error, { gameId: this.gameId, id });
      throw error;
    }
    */
  }

  async getCardByName(
    name: string,
    options?: { set?: string }
  ): Promise<UniversalCard | null> {
    // TODO: Re-enable when cards table is added to schema
    throw new Error('Custom game adapter not yet implemented - cards table missing from schema');
    
    /* Original implementation - disabled until cards table exists
    try {
      let whereConditions = [
        eq(cards.gameId, this.gameId),
        eq(cards.name, name),
      ];

      if (options?.set) {
        whereConditions.push(eq(cards.setCode, options.set));
      }

      const [card] = await db
        .select()
        .from(cards)
        .where(and(...whereConditions))
        .limit(1);

      if (!card) return null;
      
      return this.transformToUniversal(card);
    } catch (error) {
      logger.error('Custom adapter getCardByName failed', error, { gameId: this.gameId, name, options });
      throw error;
    }
    */
  }

  async autocomplete(query: string, limit = 20): Promise<AutocompleteResult> {
    // TODO: Re-enable when cards table is added to schema
    throw new Error('Custom game adapter not yet implemented - cards table missing from schema');
    
    /* Original implementation - disabled until cards table exists
    try {
      if (query.length < 2) {
        return { suggestions: [] };
      }

      const results = await db
        .select({ id: cards.id, name: cards.name })
        .from(cards)
        .where(and(
          eq(cards.gameId, this.gameId),
          like(cards.name, `${query}%`)
        ))
        .limit(limit);

      return {
        suggestions: results.map((r: any) => ({ id: r.id, name: r.name })),
      };
    } catch (error) {
      logger.error('Custom adapter autocomplete failed', error, { gameId: this.gameId, query, limit });
      throw error;
    }
    */
  }

  async getRandomCard(options?: {
    set?: string;
    format?: string;
  }): Promise<UniversalCard> {
    // TODO: Re-enable when cards table is added to schema
    throw new Error('Custom game adapter not yet implemented - cards table missing from schema');
    
    /* Original implementation - disabled until cards table exists
    try {
      let whereConditions = [eq(cards.gameId, this.gameId)];

      if (options?.set) {
        whereConditions.push(eq(cards.setCode, options.set));
      }

      // Get random card using SQL random function
      const [card] = await db
        .select()
        .from(cards)
        .where(and(...whereConditions))
        .orderBy(sql`RANDOM()`)
        .limit(1);

      if (!card) {
        throw new Error('No cards found for this game');
      }

      return this.transformToUniversal(card);
    } catch (error) {
      logger.error('Custom adapter getRandomCard failed', error, { gameId: this.gameId, options });
      throw error;
    }
    */
  }
}
