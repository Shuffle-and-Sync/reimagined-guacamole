/**
 * Card recognition types for TableSync
 */

export interface CardData {
  id: string;
  name: string;
  imageUrl: string;
  set?: string;
  collectorNumber?: string;
  type?: string;
  manaCost?: string;
  oracleText?: string;
  power?: string;
  toughness?: string;
  rarity?: string;
  artist?: string;
  gameType: "mtg" | "pokemon" | "yugioh" | "lorcana";
}

export interface RecognitionRequest {
  imageData: ImageData;
  gameId: string;
}

export interface RecognitionResult {
  card: CardData | null;
  confidence: number;
  alternatives?: CardData[];
  processingTime: number;
  extractedText?: string;
}

export interface CardSearchResult {
  card: CardData;
  matchScore: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  lines?: string[];
}

export interface UseCardRecognitionOptions {
  gameId: string;
  onCardRecognized?: (card: CardData) => void;
  onError?: (error: string) => void;
}
