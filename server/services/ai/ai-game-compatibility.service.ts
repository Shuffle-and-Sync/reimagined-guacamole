/**
 * AI Game Compatibility Service
 * Handles game type compatibility analysis with cross-genre synergy
 */

import { logger } from "../../logger";
import type {
  GameCompatibilityResult,
  GamePreferences,
} from "./ai-algorithm-types";

export class AIGameCompatibilityService {
  private static instance: AIGameCompatibilityService;

  private readonly GAME_COMPATIBILITY_WEIGHTS = {
    directMatch: 0.4,
    genreSynergy: 0.25,
    crossGenre: 0.15,
    contentMix: 0.1,
    trendsAlignment: 0.1,
  };

  private constructor() {
    logger.debug("AI Game Compatibility Service initialized");
  }

  public static getInstance(): AIGameCompatibilityService {
    if (!AIGameCompatibilityService.instance) {
      AIGameCompatibilityService.instance = new AIGameCompatibilityService();
    }
    return AIGameCompatibilityService.instance;
  }

  /**
   * Comprehensive game compatibility analysis with cross-genre synergy
   */
  async analyzeCompatibility(
    userGames: string[],
    candidateGames: string[],
    _userPreferences?: GamePreferences,
    _candidatePreferences?: GamePreferences,
  ): Promise<GameCompatibilityResult> {
    try {
      // Direct game matches
      const sharedGames = userGames.filter((game) =>
        candidateGames.includes(game),
      );
      const directMatchScore =
        sharedGames.length / Math.max(userGames.length, candidateGames.length);

      // Genre synergy analysis
      const userGenres = this.extractGameGenres(userGames);
      const candidateGenres = this.extractGameGenres(candidateGames);
      const genreSynergy = this.calculateGenreSynergy(
        userGenres,
        candidateGenres,
      );

      // Cross-genre opportunities
      const crossGenreOpportunities = this.identifyCrossGenreOpportunities(
        userGenres,
        candidateGenres,
      );

      // Content mix potential
      const contentMixPotential = this.calculateContentMixPotential(
        userGames,
        candidateGames,
      );

      // Trending games alignment
      const trendingAlignment = await this.calculateTrendingAlignment(
        userGames,
        candidateGames,
      );

      // Complementary games (different but synergistic)
      const complementaryGames = this.findComplementaryGames(
        userGames,
        candidateGames,
      );

      // Calculate weighted compatibility score
      const compatibilityScore =
        directMatchScore * this.GAME_COMPATIBILITY_WEIGHTS.directMatch +
        genreSynergy * this.GAME_COMPATIBILITY_WEIGHTS.genreSynergy +
        crossGenreOpportunities.length *
          0.1 *
          this.GAME_COMPATIBILITY_WEIGHTS.crossGenre +
        contentMixPotential * this.GAME_COMPATIBILITY_WEIGHTS.contentMix +
        trendingAlignment * this.GAME_COMPATIBILITY_WEIGHTS.trendsAlignment;

      return {
        compatibilityScore: Math.min(100, compatibilityScore * 100),
        sharedGames,
        complementaryGames,
        synergyClusters: this.identifySynergyClusters(
          userGames,
          candidateGames,
        ),
        crossGenreOpportunities,
        contentMixPotential: contentMixPotential * 100,
      };
    } catch (error) {
      logger.error("Game compatibility analysis failed", {
        error,
        userGames,
        candidateGames,
      });
      return {
        compatibilityScore: 30,
        sharedGames: [],
        complementaryGames: [],
        synergyClusters: [],
        crossGenreOpportunities: [],
        contentMixPotential: 20,
      };
    }
  }

  private extractGameGenres(games: string[]): string[] {
    const genreMap: Record<string, string> = {
      "Magic: The Gathering": "Strategy",
      Pokemon: "Strategy",
      "Yu-Gi-Oh": "Strategy",
      Lorcana: "Strategy",
      Hearthstone: "Strategy",
      "Legends of Runeterra": "Strategy",
      Gwent: "Strategy",
      "Slay the Spire": "Roguelike",
      "Monster Train": "Strategy",
      Inscryption: "Puzzle",
    };

    const genres = games.map((game) => genreMap[game] || "Other");
    return Array.from(new Set(genres));
  }

  private calculateGenreSynergy(
    userGenres: string[],
    candidateGenres: string[],
  ): number {
    const commonGenres = userGenres.filter((genre) =>
      candidateGenres.includes(genre),
    );
    const allGenres = [...userGenres, ...candidateGenres];
    const uniqueGenres = Array.from(new Set(allGenres));
    const totalGenres = uniqueGenres.length;
    return totalGenres > 0 ? commonGenres.length / totalGenres : 0;
  }

  private identifyCrossGenreOpportunities(
    userGenres: string[],
    candidateGenres: string[],
  ): string[] {
    const synergisticPairs: [string, string][] = [
      ["Strategy", "Roguelike"],
      ["Strategy", "Puzzle"],
      ["Roguelike", "Puzzle"],
    ];

    const opportunities: string[] = [];
    synergisticPairs.forEach(([genre1, genre2]) => {
      if (
        (userGenres.includes(genre1) && candidateGenres.includes(genre2)) ||
        (userGenres.includes(genre2) && candidateGenres.includes(genre1))
      ) {
        opportunities.push(`${genre1} + ${genre2} Crossover`);
      }
    });

    return opportunities;
  }

  private calculateContentMixPotential(
    userGames: string[],
    candidateGames: string[],
  ): number {
    const allGames = [...userGames, ...candidateGames];
    const uniqueGames = Array.from(new Set(allGames));
    const sharedGames = userGames.filter((game) =>
      candidateGames.includes(game),
    );

    // Higher potential when there's both overlap and diversity
    const overlapRatio =
      sharedGames.length / Math.min(userGames.length, candidateGames.length);
    const diversityRatio =
      (uniqueGames.length - sharedGames.length) / uniqueGames.length;

    return overlapRatio * 0.6 + diversityRatio * 0.4;
  }

  private async calculateTrendingAlignment(
    userGames: string[],
    candidateGames: string[],
  ): Promise<number> {
    // Simulated trending games - in production this would come from external APIs
    const trendingGames = ["Magic: The Gathering", "Pokemon", "Lorcana"];

    const userTrendingCount = userGames.filter((game) =>
      trendingGames.includes(game),
    ).length;
    const candidateTrendingCount = candidateGames.filter((game) =>
      trendingGames.includes(game),
    ).length;

    return (
      Math.min(userTrendingCount, candidateTrendingCount) / trendingGames.length
    );
  }

  private findComplementaryGames(
    userGames: string[],
    candidateGames: string[],
  ): string[] {
    // Games that work well together but aren't the same
    const complementaryPairs: Record<string, string[]> = {
      "Magic: The Gathering": ["Yu-Gi-Oh", "Pokemon"],
      Pokemon: ["Magic: The Gathering", "Lorcana"],
      "Yu-Gi-Oh": ["Magic: The Gathering", "Pokemon"],
      Lorcana: ["Pokemon", "Magic: The Gathering"],
    };

    const complementary: string[] = [];
    userGames.forEach((userGame) => {
      const pairs = complementaryPairs[userGame] || [];
      pairs.forEach((pair) => {
        if (candidateGames.includes(pair) && !complementary.includes(pair)) {
          complementary.push(pair);
        }
      });
    });

    return complementary;
  }

  private identifySynergyClusters(
    userGames: string[],
    candidateGames: string[],
  ): string[] {
    const clusters = [
      {
        name: "TCG Masters",
        games: ["Magic: The Gathering", "Pokemon", "Yu-Gi-Oh"],
      },
      {
        name: "Modern Strategy",
        games: ["Lorcana", "Hearthstone", "Legends of Runeterra"],
      },
      {
        name: "Digital Innovators",
        games: ["Hearthstone", "Legends of Runeterra", "Gwent"],
      },
    ];

    return clusters
      .filter((cluster) => {
        const userMatches = userGames.filter((game) =>
          cluster.games.includes(game),
        ).length;
        const candidateMatches = candidateGames.filter((game) =>
          cluster.games.includes(game),
        ).length;
        return userMatches >= 1 && candidateMatches >= 1;
      })
      .map((cluster) => cluster.name);
  }
}

export const aiGameCompatibility = AIGameCompatibilityService.getInstance();
