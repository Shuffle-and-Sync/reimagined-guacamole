/**
 * Response Compression Middleware
 *
 * Reduces response payload size through compression.
 * Supports gzip and deflate compression algorithms.
 */

import { gzipSync } from "zlib";
import { logger } from "../logger";
import type { Request, Response, NextFunction } from "express";

/**
 * Compression configuration
 */
export interface CompressionConfig {
  threshold: number; // Minimum response size in bytes to compress
  level: number; // Compression level (0-9, higher = better compression but slower)
  filter: (req: Request, res: Response) => boolean; // Function to determine if response should be compressed
}

/**
 * Default compression configuration
 */
export const defaultCompressionConfig: CompressionConfig = {
  // Only compress responses larger than 1kb
  threshold: 1024,

  // Compression level (0-9, higher = better compression but slower)
  level: 6,

  // Filter - only compress text-based responses
  filter: (req: Request, res: Response): boolean => {
    // Don't compress if client doesn't support it
    if (req.headers["x-no-compression"]) {
      return false;
    }

    // Check Accept-Encoding header
    const acceptEncoding = req.headers["accept-encoding"];
    if (!acceptEncoding || !acceptEncoding.includes("gzip")) {
      return false;
    }

    // Get content type from response
    const contentType = res.getHeader("Content-Type");
    if (!contentType) {
      return true; // Compress by default if no content type
    }

    // Only compress text-based content types
    const textTypes = [
      "text/",
      "application/json",
      "application/javascript",
      "application/xml",
      "application/x-javascript",
    ];

    return textTypes.some(
      (type) => typeof contentType === "string" && contentType.includes(type),
    );
  },
};

/**
 * Compression middleware
 *
 * @example
 * ```typescript
 * app.use(compressionMiddleware);
 * ```
 */
export const compressionMiddleware = (
  config: Partial<CompressionConfig> = {},
) => {
  const finalConfig = { ...defaultCompressionConfig, ...config };

  return (req: Request, res: Response, next: NextFunction): void => {
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Override json method
    res.json = function (data: unknown): Response {
      if (!finalConfig.filter(req, res)) {
        return originalJson(data);
      }

      try {
        const jsonString = JSON.stringify(data);

        // Check threshold
        if (jsonString.length < finalConfig.threshold) {
          return originalJson(data);
        }

        // Compress the response
        const compressed = gzipSync(jsonString, { level: finalConfig.level });

        // Set compression headers
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Content-Length", compressed.length.toString());
        res.setHeader("Vary", "Accept-Encoding");

        logger.debug("Compressed JSON response", {
          original: jsonString.length,
          compressed: compressed.length,
          ratio:
            ((1 - compressed.length / jsonString.length) * 100).toFixed(2) +
            "%",
          path: req.path,
        });

        return res.end(compressed);
      } catch (error) {
        logger.error("Compression failed", error, { path: req.path });
        // Fall back to original response if compression fails
        return originalJson(data);
      }
    };

    // Override send method
    res.send = function (data: unknown): Response {
      if (!finalConfig.filter(req, res)) {
        return originalSend(data);
      }

      try {
        // Only compress string/buffer data
        if (typeof data !== "string" && !Buffer.isBuffer(data)) {
          return originalSend(data);
        }

        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

        // Check threshold
        if (buffer.length < finalConfig.threshold) {
          return originalSend(data);
        }

        // Compress the response
        const compressed = gzipSync(buffer, { level: finalConfig.level });

        // Set compression headers
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Content-Length", compressed.length.toString());
        res.setHeader("Vary", "Accept-Encoding");

        logger.debug("Compressed response", {
          original: buffer.length,
          compressed: compressed.length,
          ratio:
            ((1 - compressed.length / buffer.length) * 100).toFixed(2) + "%",
          path: req.path,
        });

        return res.end(compressed);
      } catch (error) {
        logger.error("Compression failed", error, { path: req.path });
        // Fall back to original response if compression fails
        return originalSend(data);
      }
    };

    next();
  };
};

/**
 * Default export
 */
export default compressionMiddleware;
