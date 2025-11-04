/**
 * Card API Service
 *
 * Integrates with card databases to search and retrieve card information
 */

import type {
  CardData,
  CardSearchResult,
} from "../types/card-recognition.types";

const SCRYFALL_API_BASE = "https://api.scryfall.com";

/**
 * Search for cards by name using Scryfall API (Magic: The Gathering)
 */
export async function searchCardByName(
  cardName: string,
  gameId: string,
): Promise<CardSearchResult[]> {
  if (gameId === "mtg") {
    return searchMTGCard(cardName);
  }

  // Placeholder for other games
  console.warn(`Card search not yet implemented for game: ${gameId}`);
  return [];
}

/**
 * Search Magic: The Gathering cards via Scryfall
 */
async function searchMTGCard(cardName: string): Promise<CardSearchResult[]> {
  try {
    // Clean up the card name
    const cleanName = cardName
      .trim()
      .replace(/[^\w\s'-]/g, "") // Remove special characters except apostrophes and hyphens
      .replace(/\s+/g, " ");

    if (!cleanName) {
      return [];
    }

    // Use Scryfall's fuzzy search
    const response = await fetch(
      `${SCRYFALL_API_BASE}/cards/search?q=${encodeURIComponent(cleanName)}&order=edhrec`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        // No cards found
        return [];
      }
      throw new Error(`Scryfall API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return [];
    }

    // Map Scryfall cards to our CardData format
    const results: CardSearchResult[] = data.data.slice(0, 5).map(
      (
        card: {
          id: string;
          name: string;
          image_uris?: { normal?: string; large?: string };
          set_name: string;
          collector_number: string;
          type_line: string;
          mana_cost: string;
          oracle_text: string;
          power?: string;
          toughness?: string;
          rarity: string;
          artist: string;
        },
        index: number,
      ) => {
        const cardData: CardData = {
          id: card.id,
          name: card.name,
          imageUrl: card.image_uris?.normal || card.image_uris?.large || "",
          set: card.set_name,
          collectorNumber: card.collector_number,
          type: card.type_line,
          manaCost: card.mana_cost,
          oracleText: card.oracle_text,
          power: card.power,
          toughness: card.toughness,
          rarity: card.rarity,
          artist: card.artist,
          gameType: "mtg",
        };

        // Calculate match score based on name similarity
        const matchScore = calculateNameSimilarity(
          cleanName.toLowerCase(),
          card.name.toLowerCase(),
        );

        return {
          card: cardData,
          matchScore: matchScore - index * 0.05, // Slight preference for earlier results
        };
      },
    );

    // Sort by match score
    results.sort((a, b) => b.matchScore - a.matchScore);

    return results;
  } catch (error) {
    console.error("Error searching MTG cards:", error);
    return [];
  }
}

/**
 * Calculate similarity between two strings (0-1 scale)
 */
function calculateNameSimilarity(str1: string, str2: string): number {
  // Exact match
  if (str1 === str2) {
    return 1.0;
  }

  // Contains match
  if (str2.includes(str1) || str1.includes(str2)) {
    return 0.8;
  }

  // Levenshtein distance-based similarity
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);

  if (maxLength === 0) {
    return 1.0;
  }

  return 1 - distance / maxLength;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    const row = matrix[0];
    if (row) {
      row[j] = j;
    }
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      const currentRow = matrix[i];
      const prevRow = matrix[i - 1];
      const prevRowPrevCol = prevRow?.[j - 1];
      const prevRowCurCol = prevRow?.[j];
      const curRowPrevCol = currentRow?.[j - 1];

      if (
        currentRow &&
        prevRowPrevCol !== undefined &&
        prevRowCurCol !== undefined &&
        curRowPrevCol !== undefined
      ) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          currentRow[j] = prevRowPrevCol;
        } else {
          currentRow[j] = Math.min(
            prevRowPrevCol + 1, // substitution
            curRowPrevCol + 1, // insertion
            prevRowCurCol + 1, // deletion
          );
        }
      }
    }
  }

  const lastRow = matrix[str2.length];
  return lastRow?.[str1.length] ?? 0;
}

/**
 * Get card by exact ID (for follow-up lookups)
 */
export async function getCardById(
  cardId: string,
  gameId: string,
): Promise<CardData | null> {
  if (gameId === "mtg") {
    try {
      const response = await fetch(`${SCRYFALL_API_BASE}/cards/${cardId}`);

      if (!response.ok) {
        return null;
      }

      const card = await response.json();

      return {
        id: card.id,
        name: card.name,
        imageUrl: card.image_uris?.normal || card.image_uris?.large || "",
        set: card.set_name,
        collectorNumber: card.collector_number,
        type: card.type_line,
        manaCost: card.mana_cost,
        oracleText: card.oracle_text,
        power: card.power,
        toughness: card.toughness,
        rarity: card.rarity,
        artist: card.artist,
        gameType: "mtg",
      };
    } catch (error) {
      console.error("Error fetching card by ID:", error);
      return null;
    }
  }

  return null;
}
