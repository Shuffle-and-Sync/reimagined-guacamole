/**
 * Pokemon TCG Adapter
 * 
 * Adapter for Pokemon Trading Card Game via Pokemon TCG API
 * Official API: https://pokemontcg.io/
 */

import { logger } from '../../../logger';
import type { 
  ICardAdapter, 
  UniversalCard, 
  CardSearchResult, 
  AutocompleteResult 
} from './base.adapter';

// Pokemon TCG API base URL
const POKEMON_TCG_API_BASE = 'https://api.pokemontcg.io/v2';

interface PokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  evolvesTo?: string[];
  attacks?: Array<{
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  resistances?: Array<{
    type: string;
    value: string;
  }>;
  retreatCost?: string[];
  convertedRetreatCost?: number;
  set: {
    id: string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    releaseDate: string;
  };
  number: string;
  artist?: string;
  rarity?: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    prices?: any;
  };
}

interface PokemonApiResponse {
  data: PokemonCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

export class PokemonTCGAdapter implements ICardAdapter {
  private readonly POKEMON_GAME_ID = 'pokemon-tcg';
  private readonly API_KEY = process.env.POKEMON_TCG_API_KEY || '';

  getGameId(): string {
    return this.POKEMON_GAME_ID;
  }

  /**
   * Get headers for Pokemon TCG API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // API key is optional but recommended for higher rate limits
    if (this.API_KEY) {
      headers['X-Api-Key'] = this.API_KEY;
    }
    
    return headers;
  }

  /**
   * Transform Pokemon card to universal format
   */
  private transformToUniversal(pokemonCard: PokemonCard): UniversalCard {
    return {
      id: pokemonCard.id,
      gameId: this.POKEMON_GAME_ID,
      name: pokemonCard.name,
      setCode: pokemonCard.set.id,
      setName: pokemonCard.set.name,
      collectorNumber: pokemonCard.number,
      rarity: pokemonCard.rarity,
      externalId: pokemonCard.id,
      externalSource: 'pokemontcg',
      attributes: {
        supertype: pokemonCard.supertype,
        subtypes: pokemonCard.subtypes,
        hp: pokemonCard.hp,
        types: pokemonCard.types,
        evolvesFrom: pokemonCard.evolvesFrom,
        evolvesTo: pokemonCard.evolvesTo,
        attacks: pokemonCard.attacks,
        weaknesses: pokemonCard.weaknesses,
        resistances: pokemonCard.resistances,
        retreatCost: pokemonCard.retreatCost,
        convertedRetreatCost: pokemonCard.convertedRetreatCost,
        artist: pokemonCard.artist,
        flavorText: pokemonCard.flavorText,
        nationalPokedexNumbers: pokemonCard.nationalPokedexNumbers,
        series: pokemonCard.set.series,
        releaseDate: pokemonCard.set.releaseDate,
        tcgplayerUrl: pokemonCard.tcgplayer?.url,
        prices: pokemonCard.tcgplayer?.prices,
      },
      imageUris: {
        small: pokemonCard.images.small,
        large: pokemonCard.images.large,
      },
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
      const page = options?.page || 1;
      const pageSize = options?.limit || 20;
      
      // Build search query
      let searchQuery = `name:"${query}*"`;
      if (options?.set) {
        searchQuery += ` set.id:${options.set}`;
      }

      const url = `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(searchQuery)}&page=${page}&pageSize=${pageSize}`;
      
      logger.info('Pokemon TCG API search', { query, options, url });
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
      }

      const data: PokemonApiResponse = await response.json();
      
      return {
        cards: data.data.map(card => this.transformToUniversal(card)),
        total: data.totalCount,
        page: data.page,
        hasMore: data.page * data.pageSize < data.totalCount,
      };
    } catch (error) {
      logger.error('Pokemon TCG adapter search failed', error, { query, options });
      throw error;
    }
  }

  async getCardById(id: string): Promise<UniversalCard | null> {
    try {
      const url = `${POKEMON_TCG_API_BASE}/cards/${id}`;
      
      logger.info('Pokemon TCG API get by ID', { id, url });
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
      }

      const data: { data: PokemonCard } = await response.json();
      
      return this.transformToUniversal(data.data);
    } catch (error) {
      logger.error('Pokemon TCG adapter getCardById failed', error, { id });
      throw error;
    }
  }

  async getCardByName(
    name: string,
    options?: { set?: string }
  ): Promise<UniversalCard | null> {
    try {
      // Search for exact name match
      let searchQuery = `name:"${name}"`;
      if (options?.set) {
        searchQuery += ` set.id:${options.set}`;
      }

      const url = `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(searchQuery)}`;
      
      logger.info('Pokemon TCG API get by name', { name, options, url });
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
      }

      const data: PokemonApiResponse = await response.json();
      
      if (data.data.length === 0) {
        return null;
      }

      // Return the first exact match
      const firstCard = data.data[0];
      if (!firstCard) {
        return null;
      }
      return this.transformToUniversal(firstCard);
    } catch (error) {
      logger.error('Pokemon TCG adapter getCardByName failed', error, { name, options });
      throw error;
    }
  }

  async autocomplete(query: string, limit = 20): Promise<AutocompleteResult> {
    try {
      if (query.length < 2) {
        return { suggestions: [] };
      }

      // Search for cards matching the query
      const searchQuery = `name:"${query}*"`;
      const url = `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(searchQuery)}&pageSize=${limit}`;
      
      logger.info('Pokemon TCG API autocomplete', { query, limit, url });
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
      }

      const data: PokemonApiResponse = await response.json();
      
      // Remove duplicates by name
      const uniqueNames = new Map<string, string>();
      data.data.forEach(card => {
        if (!uniqueNames.has(card.name)) {
          uniqueNames.set(card.name, card.id);
        }
      });

      return {
        suggestions: Array.from(uniqueNames.entries()).map(([name, id]) => ({
          id,
          name,
        })),
      };
    } catch (error) {
      logger.error('Pokemon TCG adapter autocomplete failed', error, { query, limit });
      throw error;
    }
  }

  async getRandomCard(options?: {
    set?: string;
    format?: string;
  }): Promise<UniversalCard> {
    try {
      // Pokemon TCG API doesn't have a direct random endpoint
      // We'll get a random page and pick a random card
      let searchQuery = '';
      if (options?.set) {
        searchQuery = `set.id:${options.set}`;
      }

      const url = searchQuery 
        ? `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(searchQuery)}&pageSize=250`
        : `${POKEMON_TCG_API_BASE}/cards?pageSize=250`;
      
      logger.info('Pokemon TCG API get random', { options, url });
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
      }

      const data: PokemonApiResponse = await response.json();
      
      if (data.data.length === 0) {
        throw new Error('No Pokemon cards found');
      }

      // Pick a random card from the results
      const randomIndex = Math.floor(Math.random() * data.data.length);
      const randomCard = data.data[randomIndex];
      if (!randomCard) {
        throw new Error('No Pokemon cards found');
      }
      return this.transformToUniversal(randomCard);
    } catch (error) {
      logger.error('Pokemon TCG adapter getRandomCard failed', error, { options });
      throw error;
    }
  }
}

// Export singleton instance
export const pokemonTCGAdapter = new PokemonTCGAdapter();
