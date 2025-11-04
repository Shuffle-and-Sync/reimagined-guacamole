/**
 * OCR Service using Tesseract.js
 *
 * Extracts text from card images for recognition
 */

import { createWorker, type Worker } from "tesseract.js";
import type { OCRResult } from "../types/card-recognition.types";

let worker: Worker | null = null;

/**
 * Initialize Tesseract worker (lazy initialization)
 */
async function getWorker(): Promise<Worker> {
  if (worker) {
    return worker;
  }

  worker = await createWorker("eng");
  return worker;
}

/**
 * Extract text from image data using OCR
 */
export async function extractTextFromImage(
  imageData: ImageData,
): Promise<OCRResult> {
  try {
    const tesseractWorker = await getWorker();

    // Create canvas from ImageData
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    ctx.putImageData(imageData, 0, 0);

    // Perform OCR
    const result = await tesseractWorker.recognize(canvas);

    return {
      text: result.data.text.trim(),
      confidence: result.data.confidence / 100,
      lines:
        (result.data as any).lines?.map((line: any) => line.text.trim()) || [],
    };
  } catch (error) {
    console.error("OCR extraction failed:", error);
    throw error;
  }
}

/**
 * Extract card name region from image
 * Card names are typically in the top 15-20% of the card
 */
export function extractCardNameRegion(imageData: ImageData): ImageData {
  const canvas = document.createElement("canvas");
  const nameRegionHeight = Math.floor(imageData.height * 0.2);

  canvas.width = imageData.width;
  canvas.height = nameRegionHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Extract top portion of the image
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = imageData.width;
  sourceCanvas.height = imageData.height;
  const sourceCtx = sourceCanvas.getContext("2d");

  if (!sourceCtx) {
    throw new Error("Failed to get source canvas context");
  }

  sourceCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(
    sourceCanvas,
    0,
    0,
    imageData.width,
    nameRegionHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Cleanup Tesseract worker
 */
export async function terminateOCRWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
