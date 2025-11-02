/**
 * useCardRecognition Hook
 *
 * React hook for card recognition functionality
 */

import { useState, useCallback } from "react";
import { recognizeCardFromVideo } from "../services/card-recognition";
import type {
  CardData,
  UseCardRecognitionOptions,
} from "../types/card-recognition.types";

export const useCardRecognition = (options: UseCardRecognitionOptions) => {
  const { gameId, onCardRecognized, onError } = options;

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedCard, setRecognizedCard] = useState<CardData | null>(null);
  const [alternatives, setAlternatives] = useState<CardData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [extractedText, setExtractedText] = useState<string>("");

  /**
   * Recognize card from video element at click coordinates
   */
  const recognizeFromClick = useCallback(
    async (videoElement: HTMLVideoElement, clickX: number, clickY: number) => {
      setIsRecognizing(true);
      setError(null);
      setExtractedText("");

      try {
        const result = await recognizeCardFromVideo(
          videoElement,
          clickX,
          clickY,
          gameId,
        );

        setExtractedText(result.extractedText || "");

        if (result.card) {
          setRecognizedCard(result.card);
          setConfidence(result.confidence);
          setAlternatives(result.alternatives || []);
          setError(null);

          if (onCardRecognized) {
            onCardRecognized(result.card);
          }
        } else {
          setRecognizedCard(null);
          setConfidence(0);
          setAlternatives([]);

          const errorMsg = result.extractedText
            ? `Could not identify card. OCR text: "${result.extractedText}"`
            : "Could not extract text from image. Try clicking on a clearer area.";

          setError(errorMsg);

          if (onError) {
            onError(errorMsg);
          }
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to recognize card";
        console.error("Card recognition error:", err);
        setError(errorMsg);
        setRecognizedCard(null);
        setConfidence(0);
        setAlternatives([]);

        if (onError) {
          onError(errorMsg);
        }
      } finally {
        setIsRecognizing(false);
      }
    },
    [gameId, onCardRecognized, onError],
  );

  /**
   * Clear recognition results
   */
  const clearRecognition = useCallback(() => {
    setRecognizedCard(null);
    setAlternatives([]);
    setError(null);
    setConfidence(0);
    setExtractedText("");
  }, []);

  /**
   * Select an alternative card from the results
   */
  const selectAlternative = useCallback(
    (card: CardData) => {
      setRecognizedCard(card);
      setError(null);

      if (onCardRecognized) {
        onCardRecognized(card);
      }
    },
    [onCardRecognized],
  );

  return {
    isRecognizing,
    recognizedCard,
    alternatives,
    error,
    confidence,
    extractedText,
    recognizeFromClick,
    clearRecognition,
    selectAlternative,
  };
};
