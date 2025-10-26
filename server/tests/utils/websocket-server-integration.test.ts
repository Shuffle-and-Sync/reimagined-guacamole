/**
 * WebSocket Server Configuration Tests
 *
 * Tests for WebSocket server compression configuration application
 */

import { WS_SERVER_CONFIG, WS_FEATURES } from "../../config/websocket.config";

describe("WebSocket Server Configuration Application", () => {
  describe("Configuration Availability", () => {
    test("WS_SERVER_CONFIG should be properly exported", () => {
      expect(WS_SERVER_CONFIG).toBeDefined();
      expect(WS_SERVER_CONFIG.PATH).toBeDefined();
      expect(WS_SERVER_CONFIG.MAX_PAYLOAD).toBeDefined();
      expect(WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE).toBeDefined();
    });

    test("WS_FEATURES should be properly exported", () => {
      expect(WS_FEATURES).toBeDefined();
      expect(WS_FEATURES.COMPRESSION_ENABLED).toBeDefined();
      expect(WS_FEATURES.LOG_COMPRESSION_STATS).toBeDefined();
    });
  });

  describe("Compression Configuration Structure", () => {
    test("should have valid per-message deflate configuration", () => {
      const deflateConfig = WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE;

      expect(deflateConfig).toHaveProperty("zlibDeflateOptions");
      expect(deflateConfig).toHaveProperty("zlibInflateOptions");
      expect(deflateConfig).toHaveProperty("threshold");
      expect(deflateConfig).toHaveProperty("clientNoContextTakeover");
      expect(deflateConfig).toHaveProperty("serverNoContextTakeover");
      expect(deflateConfig).toHaveProperty("serverMaxWindowBits");
      expect(deflateConfig).toHaveProperty("clientMaxWindowBits");
    });

    test("should have valid zlib deflate options", () => {
      const deflateOptions =
        WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.zlibDeflateOptions;

      expect(deflateOptions).toHaveProperty("chunkSize");
      expect(deflateOptions).toHaveProperty("memLevel");
      expect(deflateOptions).toHaveProperty("level");
      expect(deflateOptions.chunkSize).toBeGreaterThan(0);
      expect(deflateOptions.memLevel).toBeGreaterThanOrEqual(1);
      expect(deflateOptions.memLevel).toBeLessThanOrEqual(9);
      expect(deflateOptions.level).toBeGreaterThanOrEqual(1);
      expect(deflateOptions.level).toBeLessThanOrEqual(9);
    });

    test("should have valid zlib inflate options", () => {
      const inflateOptions =
        WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.zlibInflateOptions;

      expect(inflateOptions).toHaveProperty("chunkSize");
      expect(inflateOptions.chunkSize).toBeGreaterThan(0);
    });
  });

  describe("Compression Settings Validation", () => {
    test("compression should be enabled by default", () => {
      expect(WS_FEATURES.COMPRESSION_ENABLED).toBe(true);
    });

    test("threshold should be set to 1KB", () => {
      expect(WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.threshold).toBe(1024);
    });

    test("compression level should be 3 (balanced)", () => {
      expect(
        WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.zlibDeflateOptions.level,
      ).toBe(3);
    });

    test("context takeover should be disabled", () => {
      expect(WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.clientNoContextTakeover).toBe(
        true,
      );
      expect(WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.serverNoContextTakeover).toBe(
        true,
      );
    });

    test("window bits should be set to 10", () => {
      expect(WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.serverMaxWindowBits).toBe(10);
      expect(WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.clientMaxWindowBits).toBe(10);
    });
  });

  describe("Server Configuration Validation", () => {
    test("WebSocket path should be /ws", () => {
      expect(WS_SERVER_CONFIG.PATH).toBe("/ws");
    });

    test("max payload should be 16KB", () => {
      expect(WS_SERVER_CONFIG.MAX_PAYLOAD).toBe(16 * 1024);
    });
  });

  describe("Feature Flags", () => {
    test("compression should be enabled", () => {
      expect(WS_FEATURES.COMPRESSION_ENABLED).toBe(true);
    });

    test("log compression stats should be set based on environment", () => {
      expect(typeof WS_FEATURES.LOG_COMPRESSION_STATS).toBe("boolean");
    });
  });
});
