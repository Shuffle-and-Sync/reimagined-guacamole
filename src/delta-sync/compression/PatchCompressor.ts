/**
 * PatchCompressor - Compress and decompress patch data
 *
 * Provides compression for patch messages to reduce bandwidth usage.
 * Uses gzip compression for patches above a configurable threshold.
 */

import { promisify } from "util";
import { gzip, gunzip } from "zlib";
import type { JsonPatch, CompressionConfig } from "../types";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export class PatchCompressor {
  private config: Required<CompressionConfig>;

  constructor(config: CompressionConfig = {}) {
    this.config = {
      minSize: config.minSize ?? 1024, // 1KB
      algorithm: config.algorithm ?? "gzip",
      level: config.level ?? 6,
    };
  }

  /**
   * Compress patches if they exceed the minimum size threshold
   */
  async compress(patches: JsonPatch[]): Promise<{
    data: string;
    compressed: boolean;
    originalSize: number;
    compressedSize: number;
  }> {
    const json = JSON.stringify(patches);
    const originalSize = Buffer.byteLength(json, "utf8");

    // Don't compress if below threshold
    if (originalSize < this.config.minSize) {
      return {
        data: json,
        compressed: false,
        originalSize,
        compressedSize: originalSize,
      };
    }

    try {
      const buffer = Buffer.from(json, "utf8");
      const compressed = await this.compressBuffer(buffer);
      const compressedSize = compressed.length;

      // Only use compression if it actually reduces size
      if (compressedSize < originalSize) {
        return {
          data: compressed.toString("base64"),
          compressed: true,
          originalSize,
          compressedSize,
        };
      } else {
        return {
          data: json,
          compressed: false,
          originalSize,
          compressedSize: originalSize,
        };
      }
    } catch {
      // Fallback to uncompressed on error
      return {
        data: json,
        compressed: false,
        originalSize,
        compressedSize: originalSize,
      };
    }
  }

  /**
   * Decompress patches
   */
  async decompress(data: string, compressed: boolean): Promise<JsonPatch[]> {
    if (!compressed) {
      return JSON.parse(data);
    }

    try {
      const buffer = Buffer.from(data, "base64");
      const decompressed = await this.decompressBuffer(buffer);
      const json = decompressed.toString("utf8");
      return JSON.parse(json);
    } catch (error) {
      throw new Error(`Failed to decompress patches: ${error}`);
    }
  }

  /**
   * Compress a buffer using the configured algorithm
   */
  private async compressBuffer(buffer: Buffer): Promise<Buffer> {
    switch (this.config.algorithm) {
      case "gzip":
        return gzipAsync(buffer, { level: this.config.level });
      case "deflate":
        // Note: deflate not implemented in this example, fallback to gzip
        return gzipAsync(buffer, { level: this.config.level });
      case "brotli":
        // Note: brotli not implemented in this example, fallback to gzip
        return gzipAsync(buffer, { level: this.config.level });
      default:
        throw new Error(
          `Unsupported compression algorithm: ${this.config.algorithm}`,
        );
    }
  }

  /**
   * Decompress a buffer
   */
  private async decompressBuffer(buffer: Buffer): Promise<Buffer> {
    // For now, always use gzip (matches our compress method)
    return gunzipAsync(buffer);
  }

  /**
   * Calculate compression ratio
   */
  calculateCompressionRatio(
    originalSize: number,
    compressedSize: number,
  ): number {
    if (originalSize === 0) {
      return 0;
    }
    return ((originalSize - compressedSize) / originalSize) * 100;
  }
}
