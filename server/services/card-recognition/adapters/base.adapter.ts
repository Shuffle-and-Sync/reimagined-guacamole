/**
 * Base Card Adapter Interface
 *
 * Defines the contract for all card adapters in the Universal Deck-Building framework
 */

export interface UniversalCard {
  id: string;
  gameId: string;
  name: string;

  // Core identifiers
  setCode?: string;
  setName?: string;
  collectorNumber?: string;
  rarity?: string;

  // External references
  externalId?: string;
  externalSource?: string;

  // Flexible attributes for game-specific data
  attributes: Record<string, unknown>;

  // Visual data
  imageUris?: Record<string, string>;

  // Metadata
  isOfficial?: boolean;
  isCommunitySubmitted?: boolean;
}

export interface CardSearchResult {
  cards: UniversalCard[];
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
 * Base interface that all card adapters must implement
 */
export interface ICardAdapter {
  /**
   * Search for cards by query string
   */
  searchCards(
    query: string,
    options?: {
      set?: string;
      format?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<CardSearchResult>;

  /**
   * Get a specific card by ID
   */
  getCardById(id: string): Promise<UniversalCard | null>;

  /**
   * Get a card by exact name
   */
  getCardByName(
    name: string,
    options?: {
      set?: string;
    },
  ): Promise<UniversalCard | null>;

  /**
   * Autocomplete card names
   */
  autocomplete(query: string, limit?: number): Promise<AutocompleteResult>;

  /**
   * Get a random card
   */
  getRandomCard(options?: {
    set?: string;
    format?: string;
  }): Promise<UniversalCard>;

  /**
   * Get the game ID this adapter serves
   */
  getGameId(): string;
}
