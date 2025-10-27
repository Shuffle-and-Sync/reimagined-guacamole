/**
 * PatchCompressor - Compress patches for network transmission
 *
 * Implements gzip compression for patches larger than a threshold
 * to minimize bandwidth usage.
 */

import { gzipSync, gunzipSync } from "zlib";
import { JsonPatch, CompressionOptions } from "../types";

export class PatchCompressor {
  private options: CompressionOptions;

  constructor(options: CompressionOptions = {}) {
    this.options = {
      threshold: 1024, // 1KB
      level: 6, // Default compression level
      ...options,
    };
  }

  /**
   * Get current options
   */
  getOptions(): CompressionOptions {
    return { ...this.options };
  }

  /**
   * Compress patches if they exceed the threshold
   */
  compress(patches: JsonPatch[]): { data: string; compressed: boolean } {
    const json = JSON.stringify(patches);
    const byteSize = Buffer.byteLength(json, "utf8");

    // Don't compress if below threshold
    if (byteSize < (this.options.threshold || 1024)) {
      return {
        data: json,
        compressed: false,
      };
    }

    try {
      const compressed = gzipSync(json, {
        level: this.options.level || 6,
      });

      return {
        data: compressed.toString("base64"),
        compressed: true,
      };
    } catch {
      // Fall back to uncompressed on error
      return {
        data: json,
        compressed: false,
      };
    }
  }

  /**
   * Decompress patches if they were compressed
   */
  decompress(data: string, compressed: boolean): JsonPatch[] {
    if (!compressed) {
      return JSON.parse(data);
    }

    try {
      const buffer = Buffer.from(data, "base64");
      const decompressed = gunzipSync(buffer);
      return JSON.parse(decompressed.toString("utf8"));
    } catch (error) {
      throw new Error(
        `Failed to decompress patches: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Calculate compression ratio
   */
  calculateRatio(original: JsonPatch[], compressed: string): number {
    const originalSize = Buffer.byteLength(JSON.stringify(original), "utf8");
    const compressedSize = Buffer.byteLength(compressed, "utf8");
    return compressedSize / originalSize;
  }

  /**
   * Get size information for patches
   */
  getSizeInfo(patches: JsonPatch[]): {
    originalSize: number;
    compressedSize: number;
    ratio: number;
    shouldCompress: boolean;
  } {
    const json = JSON.stringify(patches);
    const originalSize = Buffer.byteLength(json, "utf8");

    if (originalSize < (this.options.threshold || 1024)) {
      return {
        originalSize,
        compressedSize: originalSize,
        ratio: 1,
        shouldCompress: false,
      };
    }

    const compressed = gzipSync(json, {
      level: this.options.level || 6,
    });
    const compressedSize = compressed.length;

    return {
      originalSize,
      compressedSize,
      ratio: compressedSize / originalSize,
      shouldCompress: true,
    };
  }
}
