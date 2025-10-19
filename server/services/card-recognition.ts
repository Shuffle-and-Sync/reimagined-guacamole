/**
 * Card Recognition Service
 *
 * Service for identifying and retrieving Magic: The Gathering card data
 * using the Scryfall API. Implements caching and rate limiting for optimal performance.
 */

import { logger } from "../logger";

// Card data interface based on Scryfall API structure
export interface MtgCard {
  id: string;
  oracleId?: string;
  name: string;
  manaCost?: string;
  cmc?: number;
  typeLine: string;
  oracleText?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  colors?: string[];
  colorIdentity?: string[];
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  imageUris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
    artCrop?: string;
    borderCrop?: string;
  };
  prices?: {
    usd?: string;
    usdFoil?: string;
    eur?: string;
    eurFoil?: string;
    tix?: string;
  };
  legalities?: Record<string, string>;
  releasedAt?: string;
  scryfallUri?: string;
}

export interface CardSearchResult {
  cards: MtgCard[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface AutocompleteResult {
  suggestions: Array<{
    id?: string;
    name: string;
  }>;
}

/**
 * Card Recognition Service
 * Handles all card data retrieval and caching operations
 */
export class CardRecognitionService {
  private readonly SCRYFALL_API_BASE = "https://api.scryfall.com";
  private readonly RATE_LIMIT_DELAY = 100; // 100ms between requests (10 req/sec max)
  private lastRequestTime = 0;

  // In-memory cache for frequently accessed cards
  private cardCache = new Map<string, { card: MtgCard; cachedAt: number }>();
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  private readonly MAX_CACHE_SIZE = 1000;

  /**
   * Search for cards by name or other criteria
   */
  async searchCards(
    query: string,
    options: {
      set?: string;
      format?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<CardSearchResult> {
    try {
      const { set, format, page = 1, limit = 20 } = options;

      // Build Scryfall search query
      let searchQuery = query;
      if (set) searchQuery += ` set:${set}`;
      if (format) searchQuery += ` legal:${format}`;

      const params = new URLSearchParams({
        q: searchQuery,
        page: page.toString(),
        unique: "cards",
      });

      await this.enforceRateLimit();
      const response = await fetch(
        `${this.SCRYFALL_API_BASE}/cards/search?${params}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          return { cards: [], total: 0, page: 1, hasMore: false };
        }
        throw new Error(`Scryfall API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform Scryfall data to our format
      const cards: MtgCard[] = data.data.map((card: any) =>
        this.transformScryfallCard(card),
      );

      // Cache results
      cards.forEach((card) => this.cacheCard(card));

      return {
        cards: cards.slice(0, limit),
        total: data.total_cards || 0,
        page,
        hasMore: data.has_more || false,
      };
    } catch (error) {
      logger.error("Error searching cards", error, { query, options });
      throw error;
    }
  }

  /**
   * Get card details by Scryfall ID
   */
  async getCardById(id: string): Promise<MtgCard | null> {
    try {
      // Check cache first
      const cached = this.cardCache.get(id);
      if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL) {
        return cached.card;
      }

      await this.enforceRateLimit();
      const response = await fetch(`${this.SCRYFALL_API_BASE}/cards/${id}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Scryfall API error: ${response.statusText}`);
      }

      const data = await response.json();
      const card = this.transformScryfallCard(data);

      // Cache the result
      this.cacheCard(card);

      return card;
    } catch (error) {
      logger.error("Error fetching card by ID", error, { id });
      throw error;
    }
  }

  /**
   * Get card by exact name
   */
  async getCardByName(
    name: string,
    options: { set?: string } = {},
  ): Promise<MtgCard | null> {
    try {
      const params = new URLSearchParams({
        exact: name,
      });

      if (options.set) {
        params.append("set", options.set);
      }

      await this.enforceRateLimit();
      const response = await fetch(
        `${this.SCRYFALL_API_BASE}/cards/named?${params}`,
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Scryfall API error: ${response.statusText}`);
      }

      const data = await response.json();
      const card = this.transformScryfallCard(data);

      // Cache the result
      this.cacheCard(card);

      return card;
    } catch (error) {
      logger.error("Error fetching card by name", error, { name, options });
      throw error;
    }
  }

  /**
   * Autocomplete card names
   */
  async autocomplete(query: string, limit = 20): Promise<AutocompleteResult> {
    try {
      if (query.length < 2) {
        return { suggestions: [] };
      }

      const params = new URLSearchParams({
        q: query,
      });

      await this.enforceRateLimit();
      const response = await fetch(
        `${this.SCRYFALL_API_BASE}/cards/autocomplete?${params}`,
      );

      if (!response.ok) {
        throw new Error(`Scryfall API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        suggestions: data.data
          .slice(0, limit)
          .map((name: string) => ({ name })),
      };
    } catch (error) {
      logger.error("Error autocompleting card names", error, { query });
      throw error;
    }
  }

  /**
   * Get a random card (useful for testing and demos)
   */
  async getRandomCard(
    options: { set?: string; format?: string } = {},
  ): Promise<MtgCard> {
    try {
      let url = `${this.SCRYFALL_API_BASE}/cards/random`;
      const params = new URLSearchParams();

      if (options.set) params.append("q", `set:${options.set}`);
      if (options.format) params.append("q", `legal:${options.format}`);

      if (params.toString()) {
        url += `?${params}`;
      }

      await this.enforceRateLimit();
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Scryfall API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformScryfallCard(data);
    } catch (error) {
      logger.error("Error fetching random card", error, { options });
      throw error;
    }
  }

  /**
   * Transform Scryfall API response to our card format
   */
  private transformScryfallCard(scryfallCard: any): MtgCard {
    return {
      id: scryfallCard.id,
      oracleId: scryfallCard.oracle_id,
      name: scryfallCard.name,
      manaCost: scryfallCard.mana_cost,
      cmc: scryfallCard.cmc,
      typeLine: scryfallCard.type_line,
      oracleText: scryfallCard.oracle_text,
      power: scryfallCard.power,
      toughness: scryfallCard.toughness,
      loyalty: scryfallCard.loyalty,
      colors: scryfallCard.colors,
      colorIdentity: scryfallCard.color_identity,
      setCode: scryfallCard.set,
      setName: scryfallCard.set_name,
      collectorNumber: scryfallCard.collector_number,
      rarity: scryfallCard.rarity,
      imageUris: scryfallCard.image_uris
        ? {
            small: scryfallCard.image_uris.small,
            normal: scryfallCard.image_uris.normal,
            large: scryfallCard.image_uris.large,
            png: scryfallCard.image_uris.png,
            artCrop: scryfallCard.image_uris.art_crop,
            borderCrop: scryfallCard.image_uris.border_crop,
          }
        : undefined,
      prices: scryfallCard.prices,
      legalities: scryfallCard.legalities,
      releasedAt: scryfallCard.released_at,
      scryfallUri: scryfallCard.scryfall_uri,
    };
  }

  /**
   * Cache a card in memory
   */
  private cacheCard(card: MtgCard): void {
    // Implement simple LRU by removing oldest if cache is full
    if (this.cardCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cardCache.keys().next().value;
      if (oldestKey) {
        this.cardCache.delete(oldestKey);
      }
    }

    this.cardCache.set(card.id, {
      card,
      cachedAt: Date.now(),
    });
  }

  /**
   * Enforce rate limiting for Scryfall API (max 10 requests per second)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Clear the card cache
   */
  clearCache(): void {
    this.cardCache.clear();
    logger.info("Card cache cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cardCache.size,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }
}

// Export singleton instance
export const cardRecognitionService = new CardRecognitionService();
