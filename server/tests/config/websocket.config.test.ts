/**
 * WebSocket Configuration Tests
 *
 * Tests for WebSocket compression configuration
 */

import {
  WS_COMPRESSION_CONFIG,
  WS_SERVER_CONFIG,
  WS_FEATURES,
} from "../../config/websocket.config";

describe("WebSocket Configuration", () => {
  describe("WS_COMPRESSION_CONFIG", () => {
    test("should have valid compression level", () => {
      expect(WS_COMPRESSION_CONFIG.LEVEL).toBeGreaterThanOrEqual(1);
      expect(WS_COMPRESSION_CONFIG.LEVEL).toBeLessThanOrEqual(9);
    });

    test("should have reasonable threshold", () => {
      // Threshold should be at least 512 bytes (0.5KB)
      expect(WS_COMPRESSION_CONFIG.THRESHOLD).toBeGreaterThanOrEqual(512);
      // Threshold should not exceed 10KB for efficiency
      expect(WS_COMPRESSION_CONFIG.THRESHOLD).toBeLessThanOrEqual(10 * 1024);
    });

    test("should have valid memory level", () => {
      expect(WS_COMPRESSION_CONFIG.MEM_LEVEL).toBeGreaterThanOrEqual(1);
      expect(WS_COMPRESSION_CONFIG.MEM_LEVEL).toBeLessThanOrEqual(9);
    });

    test("should have valid window bits", () => {
      expect(WS_COMPRESSION_CONFIG.WINDOW_BITS).toBeGreaterThanOrEqual(8);
      expect(WS_COMPRESSION_CONFIG.WINDOW_BITS).toBeLessThanOrEqual(15);
    });

    test("should have positive chunk sizes", () => {
      expect(WS_COMPRESSION_CONFIG.CHUNK_SIZE).toBeGreaterThan(0);
      expect(WS_COMPRESSION_CONFIG.INFLATE_CHUNK_SIZE).toBeGreaterThan(0);
    });
  });

  describe("WS_SERVER_CONFIG", () => {
    test("should have valid WebSocket path", () => {
      expect(WS_SERVER_CONFIG.PATH).toMatch(/^\/\w+$/);
      expect(WS_SERVER_CONFIG.PATH).toBe("/ws");
    });

    test("should have reasonable max payload size", () => {
      // Max payload should be at least 1KB
      expect(WS_SERVER_CONFIG.MAX_PAYLOAD).toBeGreaterThanOrEqual(1024);
      // Max payload should not exceed 1MB for security
      expect(WS_SERVER_CONFIG.MAX_PAYLOAD).toBeLessThanOrEqual(1024 * 1024);
    });

    test("should have per-message deflate configuration", () => {
      expect(WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE).toBeDefined();
      expect(
        WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.zlibDeflateOptions,
      ).toBeDefined();
      expect(
        WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.zlibInflateOptions,
      ).toBeDefined();
      expect(WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.threshold).toBeDefined();
    });

    test("should have context takeover settings", () => {
      const deflateConfig = WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE;
      expect(deflateConfig.clientNoContextTakeover).toBe(true);
      expect(deflateConfig.serverNoContextTakeover).toBe(true);
    });

    test("should have window bits configuration", () => {
      const deflateConfig = WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE;
      expect(deflateConfig.serverMaxWindowBits).toBeDefined();
      expect(deflateConfig.clientMaxWindowBits).toBeDefined();
    });

    test("compression config should match base config", () => {
      const deflateConfig = WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE;
      expect(deflateConfig.zlibDeflateOptions.level).toBe(
        WS_COMPRESSION_CONFIG.LEVEL,
      );
      expect(deflateConfig.zlibDeflateOptions.memLevel).toBe(
        WS_COMPRESSION_CONFIG.MEM_LEVEL,
      );
      expect(deflateConfig.zlibDeflateOptions.chunkSize).toBe(
        WS_COMPRESSION_CONFIG.CHUNK_SIZE,
      );
      expect(deflateConfig.zlibInflateOptions.chunkSize).toBe(
        WS_COMPRESSION_CONFIG.INFLATE_CHUNK_SIZE,
      );
      expect(deflateConfig.threshold).toBe(WS_COMPRESSION_CONFIG.THRESHOLD);
      expect(deflateConfig.serverMaxWindowBits).toBe(
        WS_COMPRESSION_CONFIG.WINDOW_BITS,
      );
      expect(deflateConfig.clientMaxWindowBits).toBe(
        WS_COMPRESSION_CONFIG.WINDOW_BITS,
      );
    });
  });

  describe("WS_FEATURES", () => {
    test("should have compression enabled flag", () => {
      expect(typeof WS_FEATURES.COMPRESSION_ENABLED).toBe("boolean");
    });

    test("should have log compression stats flag", () => {
      expect(typeof WS_FEATURES.LOG_COMPRESSION_STATS).toBe("boolean");
    });

    test("compression should be enabled by default", () => {
      expect(WS_FEATURES.COMPRESSION_ENABLED).toBe(true);
    });
  });

  describe("Performance Characteristics", () => {
    test("should use balanced compression level", () => {
      // Level 3 is recommended for balanced performance
      expect(WS_COMPRESSION_CONFIG.LEVEL).toBe(3);
    });

    test("should have 1KB threshold for compression", () => {
      // 1KB is optimal - smaller messages have compression overhead
      expect(WS_COMPRESSION_CONFIG.THRESHOLD).toBe(1024);
    });

    test("should use reasonable window bits for memory", () => {
      // 10 bits = 1KB sliding window, good balance
      expect(WS_COMPRESSION_CONFIG.WINDOW_BITS).toBe(10);
    });
  });

  describe("RFC 7692 Compliance", () => {
    test("should support client context takeover control", () => {
      const deflateConfig = WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE;
      expect(deflateConfig).toHaveProperty("clientNoContextTakeover");
    });

    test("should support server context takeover control", () => {
      const deflateConfig = WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE;
      expect(deflateConfig).toHaveProperty("serverNoContextTakeover");
    });

    test("should support window bits negotiation", () => {
      const deflateConfig = WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE;
      expect(deflateConfig).toHaveProperty("serverMaxWindowBits");
      expect(deflateConfig).toHaveProperty("clientMaxWindowBits");
    });

    test("should have threshold for selective compression", () => {
      const deflateConfig = WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE;
      expect(deflateConfig).toHaveProperty("threshold");
      expect(deflateConfig.threshold).toBeGreaterThan(0);
    });
  });
});
