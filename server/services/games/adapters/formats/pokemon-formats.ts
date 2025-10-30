/**
 * Pokemon TCG Format Variants
 *
 * Defines different Pokemon TCG formats and their rule variations
 */

import type { RuleVariant } from "../../../../../shared/game-adapter-types";

/**
 * Pokemon TCG Format configurations
 */
export const PokemonFormats = {
  // Standard format (current rotation)
  Standard: {
    id: "standard",
    name: "Standard",
    description: "Current rotation format with recent sets",
    modifications: {
      prizeCount: 6,
      maxBenchSize: 5,
      minDeckSize: 60,
      maxDeckSize: 60,
      maxCopies: 4,
      energyCardLimit: null,
      allowedSets: "standard", // Would be populated with actual set codes
    },
  } as RuleVariant,

  // Expanded format (larger card pool)
  Expanded: {
    id: "expanded",
    name: "Expanded",
    description: "Format with a larger card pool from older sets",
    modifications: {
      prizeCount: 6,
      maxBenchSize: 5,
      minDeckSize: 60,
      maxDeckSize: 60,
      maxCopies: 4,
      energyCardLimit: null,
      allowedSets: "expanded",
    },
  } as RuleVariant,

  // Unlimited format (all cards legal)
  Unlimited: {
    id: "unlimited",
    name: "Unlimited",
    description: "All Pokemon TCG cards are legal",
    modifications: {
      prizeCount: 6,
      maxBenchSize: 5,
      minDeckSize: 60,
      maxDeckSize: 60,
      maxCopies: 4,
      energyCardLimit: null,
      allowedSets: null, // All sets
    },
  } as RuleVariant,

  // Theme Deck format (pre-constructed decks)
  ThemeDeck: {
    id: "theme-deck",
    name: "Theme Deck",
    description: "Pre-constructed theme deck format",
    modifications: {
      prizeCount: 6,
      maxBenchSize: 5,
      minDeckSize: 60,
      maxDeckSize: 60,
      maxCopies: 4,
      energyCardLimit: null,
      preConstructedOnly: true,
    },
  } as RuleVariant,

  // GLC (Gym Leader Challenge) - singleton format
  GLC: {
    id: "glc",
    name: "Gym Leader Challenge",
    description: "Singleton format with type restrictions",
    modifications: {
      prizeCount: 4, // Reduced for faster games
      maxBenchSize: 5,
      minDeckSize: 60,
      maxDeckSize: 60,
      maxCopies: 1, // Singleton
      energyCardLimit: null,
      typeRestriction: true, // Mono-type deck
    },
  } as RuleVariant,
};

/**
 * Get all available Pokemon formats
 */
export function getAllPokemonFormats(): RuleVariant[] {
  return Object.values(PokemonFormats);
}

/**
 * Get format by ID
 */
export function getPokemonFormatById(
  formatId: string,
): RuleVariant | undefined {
  return Object.values(PokemonFormats).find((format) => format.id === formatId);
}

/**
 * Check if format is valid
 */
export function isValidPokemonFormat(formatId: string): boolean {
  return Object.values(PokemonFormats).some((format) => format.id === formatId);
}
