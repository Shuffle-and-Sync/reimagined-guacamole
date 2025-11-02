/**
 * Card Recognition Service
 *
 * Main service that orchestrates OCR and card API integration
 */

import { searchCardByName } from "./card-api-service";
import { preprocessImage } from "./image-processing";
import { extractTextFromImage, extractCardNameRegion } from "./ocr-service";
import type {
  RecognitionRequest,
  RecognitionResult,
} from "../types/card-recognition.types";

/**
 * Recognize card from image data
 */
export async function recognizeCard(
  request: RecognitionRequest,
): Promise<RecognitionResult> {
  const startTime = Date.now();
  const { imageData, gameId } = request;

  try {
    // 1. Preprocess image for better OCR
    const processedImage = await preprocessImage(imageData);

    // 2. Extract card name region (top 20% of card)
    const nameRegion = extractCardNameRegion(processedImage);

    // 3. Perform OCR on the name region
    const ocrResult = await extractTextFromImage(nameRegion);
    const extractedText = ocrResult.text;
    const ocrConfidence = ocrResult.confidence;

    if (!extractedText || ocrConfidence < 0.3) {
      return {
        card: null,
        confidence: 0,
        processingTime: Date.now() - startTime,
        extractedText,
      };
    }

    // 4. Search for card by name
    const searchResults = await searchCardByName(extractedText, gameId);

    if (searchResults.length === 0) {
      return {
        card: null,
        confidence: 0,
        processingTime: Date.now() - startTime,
        extractedText,
      };
    }

    // 5. Return best match with combined confidence
    const bestMatch = searchResults[0];

    // Combine OCR confidence with match score
    // OCR confidence: 70%, match score: 30%
    const finalConfidence = ocrConfidence * 0.7 + bestMatch.matchScore * 0.3;

    return {
      card: bestMatch.card,
      confidence: finalConfidence,
      alternatives: searchResults.slice(1, 4).map((r) => r.card),
      processingTime: Date.now() - startTime,
      extractedText,
    };
  } catch (error) {
    console.error("Card recognition failed:", error);
    return {
      card: null,
      confidence: 0,
      processingTime: Date.now() - startTime,
      extractedText: "",
    };
  }
}

/**
 * Recognize card from video click
 */
export async function recognizeCardFromVideo(
  videoElement: HTMLVideoElement,
  clickX: number,
  clickY: number,
  gameId: string,
): Promise<RecognitionResult> {
  // Import here to avoid circular dependency
  const { captureVideoFrame } = await import("./image-processing");

  const imageData = captureVideoFrame(videoElement, clickX, clickY);

  if (!imageData) {
    return {
      card: null,
      confidence: 0,
      processingTime: 0,
      extractedText: "",
    };
  }

  return recognizeCard({ imageData, gameId });
}
