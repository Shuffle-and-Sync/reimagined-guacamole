/**
 * Scryfall Adapter
 * 
 * Adapter for Magic: The Gathering cards via Scryfall API
 * Wraps the existing CardRecognitionService to provide the ICardAdapter interface
 */

import { cardRecognitionService } from '../../card-recognition';
import { logger } from '../../../logger';
import type { 
  ICardAdapter, 
  UniversalCard, 
  CardSearchResult, 
  AutocompleteResult 
} from './base.adapter';

export class ScryfallAdapter implements ICardAdapter {
  private readonly MTG_GAME_ID = 'mtg-official';

  getGameId(): string {
    return this.MTG_GAME_ID;
  }

  /**
   * Transform MTG card to universal format
   */
  private transformToUniversal(mtgCard: any): UniversalCard {
    return {
      id: mtgCard.id,
      gameId: this.MTG_GAME_ID,
      name: mtgCard.name,
      setCode: mtgCard.setCode,
      setName: mtgCard.setName,
      collectorNumber: mtgCard.collectorNumber,
      rarity: mtgCard.rarity,
      externalId: mtgCard.id,
      externalSource: 'scryfall',
      attributes: {
        manaCost: mtgCard.manaCost,
        cmc: mtgCard.cmc,
        typeLine: mtgCard.typeLine,
        oracleText: mtgCard.oracleText,
        power: mtgCard.power,
        toughness: mtgCard.toughness,
        loyalty: mtgCard.loyalty,
        colors: mtgCard.colors,
        colorIdentity: mtgCard.colorIdentity,
        legalities: mtgCard.legalities,
        prices: mtgCard.prices,
        releasedAt: mtgCard.releasedAt,
        scryfallUri: mtgCard.scryfallUri,
        oracleId: mtgCard.oracleId,
      },
      imageUris: mtgCard.imageUris,
      isOfficial: true,
      isCommunitySubmitted: false,
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
    try {
      const result = await cardRecognitionService.searchCards(query, options);
      
      return {
        cards: result.cards.map(card => this.transformToUniversal(card)),
        total: result.total,
        page: result.page,
        hasMore: result.hasMore,
      };
    } catch (error) {
      logger.error('Scryfall adapter search failed', error, { query, options });
      throw error;
    }
  }

  async getCardById(id: string): Promise<UniversalCard | null> {
    try {
      const card = await cardRecognitionService.getCardById(id);
      if (!card) return null;
      
      return this.transformToUniversal(card);
    } catch (error) {
      logger.error('Scryfall adapter getCardById failed', error, { id });
      throw error;
    }
  }

  async getCardByName(
    name: string,
    options?: { set?: string }
  ): Promise<UniversalCard | null> {
    try {
      const card = await cardRecognitionService.getCardByName(name, options);
      if (!card) return null;
      
      return this.transformToUniversal(card);
    } catch (error) {
      logger.error('Scryfall adapter getCardByName failed', error, { name, options });
      throw error;
    }
  }

  async autocomplete(query: string, limit = 20): Promise<AutocompleteResult> {
    try {
      const result = await cardRecognitionService.autocomplete(query, limit);
      return result;
    } catch (error) {
      logger.error('Scryfall adapter autocomplete failed', error, { query, limit });
      throw error;
    }
  }

  async getRandomCard(options?: {
    set?: string;
    format?: string;
  }): Promise<UniversalCard> {
    try {
      const card = await cardRecognitionService.getRandomCard(options);
      return this.transformToUniversal(card);
    } catch (error) {
      logger.error('Scryfall adapter getRandomCard failed', error, { options });
      throw error;
    }
  }
}

// Export singleton instance
export const scryfallAdapter = new ScryfallAdapter();
