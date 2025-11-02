/**
 * Unit tests for useCardRecognition hook
 * Tests card recognition, OCR, and API integration
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useCardRecognition } from "../hooks/useCardRecognition";
import * as cardRecognitionService from "../services/card-recognition";
import type { CardData } from "../types/card-recognition.types";

// Mock the card recognition service
vi.mock("../services/card-recognition");

const mockCard: CardData = {
  id: "test-card-id",
  name: "Lightning Bolt",
  manaCost: "{R}",
  type: "Instant",
  text: "Lightning Bolt deals 3 damage to any target.",
  power: null,
  toughness: null,
  set: "LEA",
  rarity: "common",
  imageUrl: "https://example.com/lightning-bolt.jpg",
  artist: "Christopher Rush",
  scryfallUrl: "https://scryfall.com/card/test",
};

describe("useCardRecognition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() =>
      useCardRecognition({
        gameId: "mtg",
      }),
    );

    expect(result.current.isRecognizing).toBe(false);
    expect(result.current.recognizedCard).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.confidence).toBe(0);
  });

  it("should recognize card from video click", async () => {
    vi.mocked(cardRecognitionService.recognizeCard).mockResolvedValue({
      card: mockCard,
      confidence: 0.85,
      processingTime: 2000,
      alternatives: [],
    });

    const { result } = renderHook(() =>
      useCardRecognition({
        gameId: "mtg",
      }),
    );

    const mockVideo = document.createElement("video");
    mockVideo.videoWidth = 1280;
    mockVideo.videoHeight = 720;

    await act(async () => {
      await result.current.recognizeFromClick(mockVideo, 640, 360);
    });

    await waitFor(() => {
      expect(result.current.recognizedCard).toEqual(mockCard);
      expect(result.current.confidence).toBe(0.85);
      expect(result.current.isRecognizing).toBe(false);
    });
  });

  it("should handle recognition errors", async () => {
    vi.mocked(cardRecognitionService.recognizeCard).mockRejectedValue(
      new Error("OCR failed"),
    );

    const { result } = renderHook(() =>
      useCardRecognition({
        gameId: "mtg",
      }),
    );

    const mockVideo = document.createElement("video");
    mockVideo.videoWidth = 1280;
    mockVideo.videoHeight = 720;

    await act(async () => {
      await result.current.recognizeFromClick(mockVideo, 640, 360);
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.recognizedCard).toBeNull();
      expect(result.current.isRecognizing).toBe(false);
    });
  });

  it("should handle no card found", async () => {
    vi.mocked(cardRecognitionService.recognizeCard).mockResolvedValue({
      card: null,
      confidence: 0,
      processingTime: 2000,
      alternatives: [],
    });

    const { result } = renderHook(() =>
      useCardRecognition({
        gameId: "mtg",
      }),
    );

    const mockVideo = document.createElement("video");
    mockVideo.videoWidth = 1280;
    mockVideo.videoHeight = 720;

    await act(async () => {
      await result.current.recognizeFromClick(mockVideo, 640, 360);
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.recognizedCard).toBeNull();
    });
  });

  it("should clear recognition", () => {
    const { result } = renderHook(() =>
      useCardRecognition({
        gameId: "mtg",
      }),
    );

    act(() => {
      result.current.clearRecognition();
    });

    expect(result.current.recognizedCard).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.confidence).toBe(0);
  });

  it("should call onCardRecognized callback", async () => {
    const onCardRecognized = vi.fn();

    vi.mocked(cardRecognitionService.recognizeCard).mockResolvedValue({
      card: mockCard,
      confidence: 0.85,
      processingTime: 2000,
      alternatives: [],
    });

    const { result } = renderHook(() =>
      useCardRecognition({
        gameId: "mtg",
        onCardRecognized,
      }),
    );

    const mockVideo = document.createElement("video");
    mockVideo.videoWidth = 1280;
    mockVideo.videoHeight = 720;

    await act(async () => {
      await result.current.recognizeFromClick(mockVideo, 640, 360);
    });

    await waitFor(() => {
      expect(onCardRecognized).toHaveBeenCalledWith(mockCard);
    });
  });
});
