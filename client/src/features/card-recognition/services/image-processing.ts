/**
 * Image processing utilities for card recognition
 *
 * Enhances image quality for better OCR results
 */

/**
 * Preprocess image to improve OCR accuracy
 * - Increase contrast
 * - Reduce glare
 * - Sharpen edges
 */
export async function preprocessImage(
  imageData: ImageData,
): Promise<ImageData> {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.putImageData(imageData, 0, 0);

  // Apply preprocessing filters
  const processedImageData = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const data = processedImageData.data;

  // Increase contrast and reduce glare
  for (let i = 0; i < data.length; i += 4) {
    // Contrast enhancement
    const factor = 1.5;
    data[i] = clamp((data[i] - 128) * factor + 128); // R
    data[i + 1] = clamp((data[i + 1] - 128) * factor + 128); // G
    data[i + 2] = clamp((data[i + 2] - 128) * factor + 128); // B

    // Reduce glare (bright spots)
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (brightness > 220) {
      const reduction = 0.8;
      data[i] *= reduction;
      data[i + 1] *= reduction;
      data[i + 2] *= reduction;
    }
  }

  ctx.putImageData(processedImageData, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Capture frame from video element at click position
 */
export function captureVideoFrame(
  videoElement: HTMLVideoElement,
  clickX: number,
  clickY: number,
  width: number = 500,
  height: number = 700,
): ImageData | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    ctx.drawImage(videoElement, 0, 0);

    // Calculate region around click point
    const startX = Math.max(
      0,
      Math.min(clickX - width / 2, canvas.width - width),
    );
    const startY = Math.max(
      0,
      Math.min(clickY - height / 2, canvas.height - height),
    );
    const actualWidth = Math.min(width, canvas.width - startX);
    const actualHeight = Math.min(height, canvas.height - startY);

    return ctx.getImageData(startX, startY, actualWidth, actualHeight);
  } catch (error) {
    console.error("Failed to capture video frame:", error);
    return null;
  }
}

/**
 * Convert ImageData to data URL for preview
 */
export function imageDataToDataURL(imageData: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

/**
 * Clamp value between 0 and 255
 */
function clamp(value: number): number {
  return Math.max(0, Math.min(255, value));
}
