/**
 * Universal Card Service
 *
 * Main service that routes card requests to appropriate adapters based on game ID
 * Supports database-backed game lookups for official and custom games
 */

import { eq } from "drizzle-orm";
import { toLoggableError } from "@shared/utils/type-guards";
import { db } from "../../../shared/database-unified";
import { games } from "../../../shared/schema";
import { logger } from "../../logger";
import {
  ICardAdapter,
  UniversalCard,
  CardSearchResult,
  AutocompleteResult,
} from "./adapters/base.adapter";
import { pokemonTCGAdapter } from "./adapters/pokemon.adapter";
import { scryfallAdapter } from "./adapters/scryfall.adapter";
import { yugiohAdapter } from "./adapters/yugioh.adapter";

// Map game codes from database to adapter instances
const ADAPTER_MAP: Record<string, ICardAdapter> = {
  MTG: scryfallAdapter,
  POKEMON: pokemonTCGAdapter,
  YUGIOH: yugiohAdapter,
  // Add more official adapters here as they become available
  // LORCANA: lorcanaAdapter, // Coming soon
};

export class UniversalCardService {
  private adapters = new Map<string, ICardAdapter>();
  private gameCache = new Map<
    string,
    { code: string; name: string; isActive: boolean }
  >();

  constructor() {
    // Register official game adapters by their legacy IDs for backward compatibility
    this.adapters.set("mtg-official", scryfallAdapter);
    this.adapters.set("pokemon-tcg", pokemonTCGAdapter);
    this.adapters.set("yugioh-tcg", yugiohAdapter);
    logger.info(
      "Universal Card Service initialized with MTG, Pokemon, and Yu-Gi-Oh adapters",
    );
  }

  /**
   * Validate that a game exists in the database and is active
   */
  private async validateGame(
    gameId: string,
  ): Promise<{ code: string; name: string }> {
    try {
      // Check cache first
      const cached = this.gameCache.get(gameId);
      if (cached && cached.isActive) {
        return { code: cached.code, name: cached.name };
      }

      // Query database for game
      const gameResult = await db
        .select()
        .from(games)
        .where(eq(games.id, gameId))
        .limit(1);

      if (gameResult.length === 0) {
        // Game not found by ID - try by code (for backward compatibility)
        const gameByCode = await db
          .select()
          .from(games)
          .where(eq(games.code, gameId.toUpperCase()))
          .limit(1);

        if (gameByCode.length === 0) {
          throw new Error(`Game not found: ${gameId}`);
        }

        const game = gameByCode[0];
        if (!game.isActive) {
          throw new Error(`Game is not active: ${gameId}`);
        }

        // Cache the result
        this.gameCache.set(gameId, {
          code: game.code,
          name: game.name,
          isActive: game.isActive,
        });

        return { code: game.code, name: game.name };
      }

      const game = gameResult[0];
      if (!game.isActive) {
        throw new Error(`Game is not active: ${gameId}`);
      }

      // Cache the result
      this.gameCache.set(gameId, {
        code: game.code,
        name: game.name,
        isActive: game.isActive,
      });

      return { code: game.code, name: game.name };
    } catch (error) {
      // If database query fails, fall back to hardcoded game IDs
      logger.warn(
        "Game validation failed, falling back to hardcoded IDs",
        error,
      );

      // Support legacy game IDs
      if (gameId === "mtg-official") {
        return { code: "MTG", name: "Magic: The Gathering" };
      } else if (gameId === "pokemon-tcg") {
        return { code: "POKEMON", name: "Pokemon Trading Card Game" };
      } else if (gameId === "yugioh-tcg") {
        return { code: "YUGIOH", name: "Yu-Gi-Oh! Trading Card Game" };
      }

      throw error;
    }
  }

  /**
   * Get or create adapter for a specific game
   */
  private async getAdapter(gameId: string): Promise<ICardAdapter> {
    // Check if adapter already exists for this game ID
    if (this.adapters.has(gameId)) {
      const adapter = this.adapters.get(gameId);
      if (adapter) {
        return adapter;
      }
    }

    // Validate game exists and get its code
    const gameInfo = await this.validateGame(gameId);

    // Get adapter based on game code
    const adapter = ADAPTER_MAP[gameInfo.code];

    if (!adapter) {
      throw new Error(
        `No adapter available for game: ${gameInfo.name} (${gameInfo.code}). ` +
          `Supported games: ${Object.keys(ADAPTER_MAP).join(", ")}`,
      );
    }

    // Cache the adapter for this game ID
    this.adapters.set(gameId, adapter);
    logger.info("Mapped game to adapter", {
      gameId,
      gameCode: gameInfo.code,
      gameName: gameInfo.name,
      adapterType: adapter.constructor.name,
    });

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
    },
  ): Promise<CardSearchResult> {
    try {
      const adapter = await this.getAdapter(gameId);
      return await adapter.searchCards(query, options);
    } catch (error) {
      logger.error("Universal card search failed", toLoggableError(error), {
        gameId,
        query,
        options,
      });
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
      logger.error("Universal getCardById failed", toLoggableError(error), {
        gameId,
        id,
      });
      throw error;
    }
  }

  /**
   * Get card by name in a specific game
   */
  async getCardByName(
    gameId: string,
    name: string,
    options?: { set?: string },
  ): Promise<UniversalCard | null> {
    try {
      const adapter = await this.getAdapter(gameId);
      return await adapter.getCardByName(name, options);
    } catch (error) {
      logger.error("Universal getCardByName failed", toLoggableError(error), {
        gameId,
        name,
        options,
      });
      throw error;
    }
  }

  /**
   * Autocomplete card names in a specific game
   */
  async autocomplete(
    gameId: string,
    query: string,
    limit = 20,
  ): Promise<AutocompleteResult> {
    try {
      const adapter = await this.getAdapter(gameId);
      return await adapter.autocomplete(query, limit);
    } catch (error) {
      logger.error("Universal autocomplete failed", toLoggableError(error), {
        gameId,
        query,
        limit,
      });
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
    },
  ): Promise<UniversalCard> {
    try {
      const adapter = await this.getAdapter(gameId);
      return await adapter.getRandomCard(options);
    } catch (error) {
      logger.error("Universal getRandomCard failed", toLoggableError(error), {
        gameId,
        options,
      });
      throw error;
    }
  }

  /**
   * Clear adapter cache (useful for testing or when game config changes)
   */
  clearAdapterCache(): void {
    // Keep the official game adapters
    const mtgAdapter = this.adapters.get("mtg-official");
    const pokemonAdapter = this.adapters.get("pokemon-tcg");
    const yugiohAdapter = this.adapters.get("yugioh-tcg");

    this.adapters.clear();
    this.gameCache.clear();

    if (mtgAdapter) {
      this.adapters.set("mtg-official", mtgAdapter);
    }
    if (pokemonAdapter) {
      this.adapters.set("pokemon-tcg", pokemonAdapter);
    }
    if (yugiohAdapter) {
      this.adapters.set("yugioh-tcg", yugiohAdapter);
    }

    logger.info("Adapter cache cleared");
  }

  /**
   * Get list of supported games
   */
  async getSupportedGames(): Promise<
    Array<{ id: string; name: string; code: string }>
  > {
    try {
      const allGames = await db
        .select()
        .from(games)
        .where(eq(games.isActive, true));

      // If database has games, return them
      if (allGames.length > 0) {
        return allGames.map((game) => ({
          id: game.id,
          name: game.name,
          code: game.code,
        }));
      }

      // Otherwise return hardcoded fallback list
      logger.info("No games in database, returning hardcoded fallback list");
      return [
        { id: "mtg-official", name: "Magic: The Gathering", code: "MTG" },
        {
          id: "pokemon-tcg",
          name: "Pokemon Trading Card Game",
          code: "POKEMON",
        },
        {
          id: "yugioh-tcg",
          name: "Yu-Gi-Oh! Trading Card Game",
          code: "YUGIOH",
        },
      ];
    } catch (error) {
      logger.error(
        "Failed to get supported games from database",
        toLoggableError(error),
      );
      // Return hardcoded list as fallback
      return [
        { id: "mtg-official", name: "Magic: The Gathering", code: "MTG" },
        {
          id: "pokemon-tcg",
          name: "Pokemon Trading Card Game",
          code: "POKEMON",
        },
        {
          id: "yugioh-tcg",
          name: "Yu-Gi-Oh! Trading Card Game",
          code: "YUGIOH",
        },
      ];
    }
  }
}

// Export singleton instance
export const universalCardService = new UniversalCardService();

// Re-export types for convenience
export type { UniversalCard, CardSearchResult, AutocompleteResult };
