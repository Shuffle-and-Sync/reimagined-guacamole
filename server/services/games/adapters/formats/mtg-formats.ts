/**
 * MTG Format Variants
 *
 * Defines different Magic: The Gathering formats and their rule variations
 */

import type { RuleVariant } from "../../../../../shared/game-adapter-types";

/**
 * MTG Format configurations
 */
export const MTGFormats = {
  // Standard format (60-card constructed, 4-card limit)
  Standard: {
    id: "standard",
    name: "Standard",
    description: "60-card constructed format with recent sets",
    modifications: {
      startingLife: 20,
      startingHandSize: 7,
      minDeckSize: 60,
      maxDeckSize: null,
      maxCopies: 4,
      basicLandLimit: null,
      commanderRules: false,
    },
  } as RuleVariant,

  // Commander format (100-card singleton, legendary creature commander)
  Commander: {
    id: "commander",
    name: "Commander / EDH",
    description: "100-card singleton format with a legendary commander",
    modifications: {
      startingLife: 40,
      startingHandSize: 7,
      minDeckSize: 100,
      maxDeckSize: 100,
      maxCopies: 1,
      basicLandLimit: null,
      commanderRules: true,
      commanderDamageLethal: 21,
    },
  } as RuleVariant,

  // Modern format (60-card constructed, older card pool)
  Modern: {
    id: "modern",
    name: "Modern",
    description: "60-card constructed format with older sets",
    modifications: {
      startingLife: 20,
      startingHandSize: 7,
      minDeckSize: 60,
      maxDeckSize: null,
      maxCopies: 4,
      basicLandLimit: null,
      commanderRules: false,
    },
  } as RuleVariant,

  // Pauper format (commons only)
  Pauper: {
    id: "pauper",
    name: "Pauper",
    description: "Commons-only constructed format",
    modifications: {
      startingLife: 20,
      startingHandSize: 7,
      minDeckSize: 60,
      maxDeckSize: null,
      maxCopies: 4,
      basicLandLimit: null,
      commanderRules: false,
      rarityRestriction: "common",
    },
  } as RuleVariant,

  // Brawl format (60-card singleton with commander from Standard)
  Brawl: {
    id: "brawl",
    name: "Brawl",
    description: "60-card singleton format with Standard-legal commander",
    modifications: {
      startingLife: 25,
      startingHandSize: 7,
      minDeckSize: 60,
      maxDeckSize: 60,
      maxCopies: 1,
      basicLandLimit: null,
      commanderRules: true,
      commanderDamageLethal: 21,
    },
  } as RuleVariant,

  // Two-Headed Giant (team format)
  TwoHeadedGiant: {
    id: "two-headed-giant",
    name: "Two-Headed Giant",
    description: "Team format with shared life total",
    modifications: {
      startingLife: 30, // Per team
      startingHandSize: 7,
      minDeckSize: 60,
      maxDeckSize: null,
      maxCopies: 4,
      basicLandLimit: null,
      commanderRules: false,
      teamFormat: true,
      playersPerTeam: 2,
    },
  } as RuleVariant,
};

/**
 * Get all available MTG formats
 */
export function getAllMTGFormats(): RuleVariant[] {
  return Object.values(MTGFormats);
}

/**
 * Get format by ID
 */
export function getMTGFormatById(formatId: string): RuleVariant | undefined {
  return Object.values(MTGFormats).find((format) => format.id === formatId);
}

/**
 * Check if format is valid
 */
export function isValidMTGFormat(formatId: string): boolean {
  return Object.values(MTGFormats).some((format) => format.id === formatId);
}
