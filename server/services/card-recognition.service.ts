/**
 * Card Recognition Service
 *
 * Service for identifying and retrieving Magic: The Gathering card data
 * using the Scryfall API. Implements caching and rate limiting for optimal performance.
 */

import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";

// Scryfall API response interface
interface ScryfallCardData {
  id: string;
  oracle_id?: string;
  name: string;
  mana_cost?: string;
  cmc?: number;
  type_line: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  colors?: string[];
  color_identity?: string[];
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
    art_crop?: string;
    border_crop?: string;
  };
  prices?: {
    usd?: string;
    usd_foil?: string;
    eur?: string;
    eur_foil?: string;
    tix?: string;
  };
  legalities?: Record<string, string>;
  released_at?: string;
  scryfall_uri?: string;
}

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
  private readonly API_TIMEOUT = 5000; // 5 second timeout for API requests
  private readonly MIN_QUERY_LENGTH = 2; // Minimum characters for a valid search query
  // Regex to remove special characters from queries (keeps: alphanumeric, spaces, hyphens, apostrophes, commas)
  private readonly VALID_QUERY_CHARS = /[^a-zA-Z0-9\s\-',]/g;
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

      // Sanitize query to handle malformed input
      const sanitizedQuery = this.sanitizeQuery(query);
      if (!sanitizedQuery) {
        // Return empty results for invalid queries
        return { cards: [], total: 0, page: 1, hasMore: false };
      }

      // Build Scryfall search query
      let searchQuery = sanitizedQuery;
      if (set) searchQuery += ` set:${set}`;
      if (format) searchQuery += ` legal:${format}`;

      const params = new URLSearchParams({
        q: searchQuery,
        page: page.toString(),
        unique: "cards",
      });

      await this.enforceRateLimit();
      const response = await this.fetchWithTimeout(
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
      const cards: MtgCard[] = (data.data as ScryfallCardData[]).map((card) =>
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
      logger.error("Error searching cards", toLoggableError(error), {
        query,
        options,
      });
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
      const response = await this.fetchWithTimeout(
        `${this.SCRYFALL_API_BASE}/cards/${id}`,
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Scryfall API error: ${response.statusText}`);
      }

      const data = await response.json();
      const card = this.transformScryfallCard(data as ScryfallCardData);

      // Cache the result
      this.cacheCard(card);

      return card;
    } catch (error) {
      logger.error("Error fetching card by ID", toLoggableError(error), { id });
      return null;
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
      const response = await this.fetchWithTimeout(
        `${this.SCRYFALL_API_BASE}/cards/named?${params}`,
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Scryfall API error: ${response.statusText}`);
      }

      const data = await response.json();
      const card = this.transformScryfallCard(data as ScryfallCardData);

      // Cache the result
      this.cacheCard(card);

      return card;
    } catch (error) {
      logger.error("Error fetching card by name", toLoggableError(error), {
        name,
        options,
      });
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
      const response = await this.fetchWithTimeout(
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
      logger.error("Error autocompleting card names", toLoggableError(error), {
        query,
      });
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
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`Scryfall API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformScryfallCard(data as ScryfallCardData);
    } catch (error) {
      logger.error("Error fetching random card", toLoggableError(error), {
        options,
      });
      throw error;
    }
  }

  /**
   * Transform Scryfall API response to our card format
   */
  private transformScryfallCard(scryfallCard: ScryfallCardData): MtgCard {
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
   * Fetch with timeout to prevent hanging requests
   */
  private async fetchWithTimeout(
    url: string,
    options?: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.API_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  }

  /**
   * Sanitize query string to remove invalid characters
   * Returns empty string if query is invalid
   *
   * Keeps only: alphanumeric characters, spaces, hyphens, apostrophes, and commas
   * (these are common in Magic: The Gathering card names like "Jace's Ingenuity")
   */
  private sanitizeQuery(query: string): string {
    // Remove characters that aren't useful for card searches
    const sanitized = query.replace(this.VALID_QUERY_CHARS, "").trim();

    // Require minimum length for a valid query
    return sanitized.length >= this.MIN_QUERY_LENGTH ? sanitized : "";
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
