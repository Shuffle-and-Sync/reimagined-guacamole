/**
 * Yu-Gi-Oh Adapter
 *
 * Adapter for Yu-Gi-Oh Trading Card Game via YGOPRODeck API
 * Official API: https://ygoprodeck.com/api-guide/
 */

import { logger } from "../../../logger";
import type {
  ICardAdapter,
  UniversalCard,
  CardSearchResult,
  AutocompleteResult,
} from "./base.adapter";

// YGOPRODeck API base URL
const YUGIOH_API_BASE = "https://db.ygoprodeck.com/api/v7";

interface YuGiOhCard {
  id: number;
  name: string;
  type: string;
  frameType: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  attribute?: string;
  archetype?: string;
  scale?: number;
  linkval?: number;
  linkmarkers?: string[];
  card_sets?: Array<{
    set_name: string;
    set_code: string;
    set_rarity: string;
    set_rarity_code: string;
    set_price: string;
  }>;
  card_images: Array<{
    id: number;
    image_url: string;
    image_url_small: string;
    image_url_cropped: string;
  }>;
  card_prices: Array<{
    cardmarket_price: string;
    tcgplayer_price: string;
    ebay_price: string;
    amazon_price: string;
    coolstuffinc_price: string;
  }>;
}

interface YuGiOhApiResponse {
  data: YuGiOhCard[];
}

export class YuGiOhAdapter implements ICardAdapter {
  private readonly YUGIOH_GAME_ID = "yugioh-tcg";

  getGameId(): string {
    return this.YUGIOH_GAME_ID;
  }

  /**
   * Transform Yu-Gi-Oh card to universal format
   */
  private transformToUniversal(yugiohCard: YuGiOhCard): UniversalCard {
    const firstSet = yugiohCard.card_sets?.[0];
    const firstImage = yugiohCard.card_images[0];
    const firstPrice = yugiohCard.card_prices?.[0];

    return {
      id: yugiohCard.id.toString(),
      gameId: this.YUGIOH_GAME_ID,
      name: yugiohCard.name,
      setCode: firstSet?.set_code,
      setName: firstSet?.set_name,
      collectorNumber: firstSet?.set_code,
      rarity: firstSet?.set_rarity,
      externalId: yugiohCard.id.toString(),
      externalSource: "ygoprodeck",
      attributes: {
        type: yugiohCard.type,
        frameType: yugiohCard.frameType,
        description: yugiohCard.desc,
        atk: yugiohCard.atk,
        def: yugiohCard.def,
        level: yugiohCard.level,
        race: yugiohCard.race,
        attribute: yugiohCard.attribute,
        archetype: yugiohCard.archetype,
        scale: yugiohCard.scale,
        linkval: yugiohCard.linkval,
        linkmarkers: yugiohCard.linkmarkers,
        cardSets: yugiohCard.card_sets,
        prices: firstPrice,
      },
      imageUris: firstImage
        ? {
            small: firstImage.image_url_small,
            large: firstImage.image_url,
            cropped: firstImage.image_url_cropped,
          }
        : undefined,
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
    },
  ): Promise<CardSearchResult> {
    try {
      // YGOPRODeck API uses fname parameter for fuzzy name search
      const url = `${YUGIOH_API_BASE}/cardinfo.php?fname=${encodeURIComponent(query)}`;

      logger.info("Yu-Gi-Oh API search", { query, options, url });

      const response = await fetch(url);

      if (response.status === 404) {
        // No results found
        return {
          cards: [],
          total: 0,
          page: 1,
          hasMore: false,
        };
      }

      if (!response.ok) {
        throw new Error(
          `Yu-Gi-Oh API error: ${response.status} ${response.statusText}`,
        );
      }

      const data: YuGiOhApiResponse = await response.json();

      // Filter by set if specified
      let filteredCards = data.data;
      if (options?.set) {
        filteredCards = data.data.filter((card) =>
          card.card_sets?.some((set) =>
            set.set_code.toLowerCase().includes(options.set!.toLowerCase()),
          ),
        );
      }

      // Handle pagination manually since API doesn't support it
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedCards = filteredCards.slice(start, end);

      return {
        cards: paginatedCards.map((card) => this.transformToUniversal(card)),
        total: filteredCards.length,
        page: page,
        hasMore: end < filteredCards.length,
      };
    } catch (error) {
      logger.error("Yu-Gi-Oh adapter search failed", error, { query, options });
      throw error;
    }
  }

  async getCardById(id: string): Promise<UniversalCard | null> {
    try {
      const url = `${YUGIOH_API_BASE}/cardinfo.php?id=${id}`;

      logger.info("Yu-Gi-Oh API get by ID", { id, url });

      const response = await fetch(url);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(
          `Yu-Gi-Oh API error: ${response.status} ${response.statusText}`,
        );
      }

      const data: YuGiOhApiResponse = await response.json();

      if (data.data.length === 0) {
        return null;
      }

      const firstCard = data.data[0];
      if (!firstCard) {
        return null;
      }
      return this.transformToUniversal(firstCard);
    } catch (error) {
      logger.error("Yu-Gi-Oh adapter getCardById failed", error, { id });
      throw error;
    }
  }

  async getCardByName(
    name: string,
    options?: { set?: string },
  ): Promise<UniversalCard | null> {
    try {
      // Use exact name search
      const url = `${YUGIOH_API_BASE}/cardinfo.php?name=${encodeURIComponent(name)}`;

      logger.info("Yu-Gi-Oh API get by name", { name, options, url });

      const response = await fetch(url);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(
          `Yu-Gi-Oh API error: ${response.status} ${response.statusText}`,
        );
      }

      const data: YuGiOhApiResponse = await response.json();

      if (data.data.length === 0) {
        return null;
      }

      // If set is specified, try to find a version from that set
      if (options?.set) {
        const cardFromSet = data.data.find((card) =>
          card.card_sets?.some((set) =>
            set.set_code.toLowerCase().includes(options.set!.toLowerCase()),
          ),
        );
        if (cardFromSet) {
          return this.transformToUniversal(cardFromSet);
        }
      }

      const firstCard = data.data[0];
      if (!firstCard) {
        return null;
      }
      return this.transformToUniversal(firstCard);
    } catch (error) {
      logger.error("Yu-Gi-Oh adapter getCardByName failed", error, {
        name,
        options,
      });
      throw error;
    }
  }

  async autocomplete(query: string, limit = 20): Promise<AutocompleteResult> {
    try {
      if (query.length < 2) {
        return { suggestions: [] };
      }

      // Search for cards matching the query
      const url = `${YUGIOH_API_BASE}/cardinfo.php?fname=${encodeURIComponent(query)}`;

      logger.info("Yu-Gi-Oh API autocomplete", { query, limit, url });

      const response = await fetch(url);

      if (response.status === 404) {
        return { suggestions: [] };
      }

      if (!response.ok) {
        throw new Error(
          `Yu-Gi-Oh API error: ${response.status} ${response.statusText}`,
        );
      }

      const data: YuGiOhApiResponse = await response.json();

      // Get unique card names (cards can have multiple printings)
      const uniqueNames = new Map<string, string>();
      data.data.forEach((card) => {
        if (!uniqueNames.has(card.name) && uniqueNames.size < limit) {
          uniqueNames.set(card.name, card.id.toString());
        }
      });

      return {
        suggestions: Array.from(uniqueNames.entries()).map(([name, id]) => ({
          id,
          name,
        })),
      };
    } catch (error) {
      logger.error("Yu-Gi-Oh adapter autocomplete failed", error, {
        query,
        limit,
      });
      throw error;
    }
  }

  async getRandomCard(options?: {
    set?: string;
    format?: string;
  }): Promise<UniversalCard> {
    try {
      // YGOPRODeck API has a random card endpoint
      const url = `${YUGIOH_API_BASE}/randomcard.php`;

      logger.info("Yu-Gi-Oh API get random", { options, url });

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Yu-Gi-Oh API error: ${response.status} ${response.statusText}`,
        );
      }

      const data: YuGiOhApiResponse = await response.json();

      if (data.data.length === 0) {
        throw new Error("No Yu-Gi-Oh cards found");
      }

      const firstCard = data.data[0];
      if (!firstCard) {
        throw new Error("No Yu-Gi-Oh cards found");
      }
      return this.transformToUniversal(firstCard);
    } catch (error) {
      logger.error("Yu-Gi-Oh adapter getRandomCard failed", error, { options });
      throw error;
    }
  }
}

// Export singleton instance
export const yugiohAdapter = new YuGiOhAdapter();
