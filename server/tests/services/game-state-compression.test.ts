/**
 * Tests for Game State Compression
 *
 * Tests compression and decompression functionality for large game states and deltas
 */

import { describe, test, expect } from "@jest/globals";
import {
  compressData,
  decompressData,
  shouldCompress,
  calculateCompressionRatio,
  compressDeltaIfNeeded,
  decompressDeltaIfNeeded,
  compressGameState,
  decompressGameState,
  createCompressedSyncMessage,
  decompressSyncMessage,
  COMPRESSION_CONFIG,
  GameStateDeltaCompressor,
} from "../../../shared/game-state-delta";
import {
  createInitialTCGState,
  GameStateManager,
  createGameAction,
} from "../../../shared/game-state-manager";
import type {
  TCGGameState,
  GameStateDelta,
} from "../../../shared/game-state-schema";

describe("Game State Compression", () => {
  let initialState: TCGGameState;
  let manager: GameStateManager;

  beforeEach(() => {
    initialState = createInitialTCGState(
      "test-session",
      ["player-1", "player-2"],
      ["Alice", "Bob"],
    );
    manager = new GameStateManager();
    manager.initialize(initialState);
  });

  describe("Basic Compression", () => {
    test("should compress and decompress data correctly", () => {
      const data = { test: "value", number: 42, nested: { key: "data" } };

      const compressed = compressData(data);
      expect(compressed).toBeTruthy();
      expect(typeof compressed).toBe("string");

      const decompressed = decompressData(compressed);
      expect(decompressed).toEqual(data);
    });

    test("should compress large strings efficiently", () => {
      const largeString = "x".repeat(10000);
      const data = { content: largeString };

      const compressed = compressData(data);
      const originalSize = JSON.stringify(data).length;
      const compressedSize = compressed.length;

      // Compression should reduce size significantly for repetitive data
      expect(compressedSize).toBeLessThan(originalSize);
    });

    test("should handle empty objects", () => {
      const data = {};
      const compressed = compressData(data);
      const decompressed = decompressData(compressed);
      expect(decompressed).toEqual(data);
    });

    test("should handle arrays", () => {
      const data = [1, 2, 3, { nested: "value" }];
      const compressed = compressData(data);
      const decompressed = decompressData(compressed);
      expect(decompressed).toEqual(data);
    });

    test("should handle null values", () => {
      const data = { value: null, array: [null, "test"] };
      const compressed = compressData(data);
      const decompressed = decompressData(compressed);
      expect(decompressed).toEqual(data);
    });
  });

  describe("Compression Decision Logic", () => {
    test("should not compress small data", () => {
      const smallData = { test: "value" };
      expect(shouldCompress(smallData)).toBe(false);
    });

    test("should compress large data", () => {
      const largeData = { content: "x".repeat(2000) };
      expect(shouldCompress(largeData)).toBe(true);
    });

    test("should respect compression threshold", () => {
      const thresholdData = {
        content: "x".repeat(COMPRESSION_CONFIG.MIN_SIZE_FOR_COMPRESSION),
      };
      expect(shouldCompress(thresholdData)).toBe(true);

      const belowThresholdData = {
        content: "x".repeat(COMPRESSION_CONFIG.MIN_SIZE_FOR_COMPRESSION - 100),
      };
      expect(shouldCompress(belowThresholdData)).toBe(false);
    });
  });

  describe("Compression Ratio Calculation", () => {
    test("should calculate compression ratio correctly", () => {
      const data = { content: "x".repeat(5000) };
      const compressed = compressData(data);
      const ratio = calculateCompressionRatio(data, compressed);

      expect(ratio).toBeGreaterThan(0);
      expect(ratio).toBeLessThanOrEqual(100);
    });

    test("should show high compression for repetitive data", () => {
      const repetitiveData = { content: "abcdef".repeat(1000) };
      const compressed = compressData(repetitiveData);
      const ratio = calculateCompressionRatio(repetitiveData, compressed);

      // Repetitive data should compress well
      expect(ratio).toBeGreaterThan(70);
    });

    test("should show lower compression for random data", () => {
      const randomData = { content: Math.random().toString(36).repeat(100) };
      const compressed = compressData(randomData);
      const ratio = calculateCompressionRatio(randomData, compressed);

      // Random data compresses less effectively
      expect(ratio).toBeGreaterThanOrEqual(0);
      expect(ratio).toBeLessThan(100);
    });
  });

  describe("Delta Compression", () => {
    test("should not compress small deltas", () => {
      const action = createGameAction(
        "change_life",
        "player-1",
        { delta: -1 },
        0,
      );
      const newState = manager.applyAction(action, initialState);
      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        newState,
      );

      const compressedDelta = compressDeltaIfNeeded(delta);

      // Small delta should not be compressed
      expect(compressedDelta.compressed).toBeUndefined();
    });

    test("should compress large deltas", () => {
      // Create a large delta by adding many operations
      const largeDelta: GameStateDelta = {
        baseVersion: 0,
        targetVersion: 1,
        operations: Array.from({ length: 500 }, (_, i) => ({
          op: "add" as const,
          path: `/test/path${i}`,
          value: `value${i}`.repeat(10),
        })),
        timestamp: Date.now(),
      };

      const compressedDelta = compressDeltaIfNeeded(largeDelta);

      // Large delta should be compressed
      expect(compressedDelta.compressed).toBe(true);
      expect(compressedDelta.operations.length).toBe(1);
      expect(compressedDelta.operations[0].path).toBe("/_compressed");
    });

    test("should roundtrip compressed delta", () => {
      // Create a large delta
      const largeDelta: GameStateDelta = {
        baseVersion: 0,
        targetVersion: 1,
        operations: Array.from({ length: 500 }, (_, i) => ({
          op: "add" as const,
          path: `/test/path${i}`,
          value: `value${i}`.repeat(10),
        })),
        timestamp: Date.now(),
      };

      const compressedDelta = compressDeltaIfNeeded(largeDelta);
      const decompressedDelta = decompressDeltaIfNeeded(compressedDelta);

      // Should restore original operations
      expect(decompressedDelta.operations).toEqual(largeDelta.operations);
      expect(decompressedDelta.compressed).toBe(false);
    });

    test("should not decompress uncompressed delta", () => {
      const action = createGameAction(
        "change_life",
        "player-1",
        { delta: -1 },
        0,
      );
      const newState = manager.applyAction(action, initialState);
      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        newState,
      );

      const decompressedDelta = decompressDeltaIfNeeded(delta);

      // Should return delta unchanged
      expect(decompressedDelta).toEqual(delta);
    });

    test("should throw error on invalid compressed delta", () => {
      const invalidDelta: GameStateDelta = {
        baseVersion: 0,
        targetVersion: 1,
        operations: [
          { op: "replace", path: "/_compressed", value: "invalid-base64" },
        ],
        timestamp: Date.now(),
        compressed: true,
      };

      expect(() => {
        decompressDeltaIfNeeded(invalidDelta);
      }).toThrow("Failed to decompress delta");
    });
  });

  describe("Game State Compression", () => {
    test("should compress and decompress game state", () => {
      const compressed = compressGameState(initialState);
      expect(compressed).toBeTruthy();
      expect(typeof compressed).toBe("string");

      const decompressed = decompressGameState(compressed);
      expect(decompressed).toEqual(initialState);
    });

    test("should preserve all game state properties", () => {
      // Add some cards and modify state
      let state = initialState;
      const drawAction = createGameAction("draw", "player-1", { count: 5 }, 0);
      state = manager.applyAction(drawAction, state);

      const compressed = compressGameState(state);
      const decompressed = decompressGameState(compressed);

      expect(decompressed.version).toBe(state.version);
      expect(decompressed.players[0].hand.length).toBe(
        state.players[0].hand.length,
      );
      expect(decompressed.currentTurn).toEqual(state.currentTurn);
      expect(decompressed.battlefield).toEqual(state.battlefield);
    });

    test("should handle large game states efficiently", () => {
      // Create a state with many cards
      let state = initialState;
      for (let i = 0; i < 50; i++) {
        const action = createGameAction("draw", "player-1", { count: 1 }, i);
        state = manager.applyAction(action, state);
      }

      const originalSize = JSON.stringify(state).length;
      const compressed = compressGameState(state);
      const compressedSize = compressed.length;

      // Should achieve some compression
      expect(compressedSize).toBeLessThan(originalSize);

      // Should decompress correctly
      const decompressed = decompressGameState(compressed);
      expect(decompressed.players[0].hand.length).toBe(
        state.players[0].hand.length,
      );
    });
  });

  describe("Compressed Sync Messages", () => {
    test("should create compressed full state message for large state", () => {
      // Create a large state
      let state = initialState;
      for (let i = 0; i < 100; i++) {
        const action = createGameAction("draw", "player-1", { count: 1 }, i);
        state = manager.applyAction(action, state);
      }

      const message = createCompressedSyncMessage("session-123", state, null);

      expect(message.type).toBe("game_state_sync");
      expect(message.sessionId).toBe("session-123");
      expect(message.syncType).toBe("full");

      if (shouldCompress(state)) {
        expect(message.compressed).toBe(true);
        expect(message.compressedPayload).toBeTruthy();
        expect(message.fullState).toBeUndefined();
      }
    });

    test("should create uncompressed full state message for small state", () => {
      const message = createCompressedSyncMessage(
        "session-123",
        initialState,
        null,
      );

      expect(message.type).toBe("game_state_sync");
      expect(message.syncType).toBe("full");

      // Small state should not be compressed
      expect(message.compressed).toBeUndefined();
      expect(message.fullState).toEqual(initialState);
    });

    test("should create compressed delta message for large delta", () => {
      const largeDelta: GameStateDelta = {
        baseVersion: 0,
        targetVersion: 1,
        operations: Array.from({ length: 500 }, (_, i) => ({
          op: "add" as const,
          path: `/test/path${i}`,
          value: `value${i}`.repeat(10),
        })),
        timestamp: Date.now(),
      };

      const message = createCompressedSyncMessage(
        "session-123",
        null,
        largeDelta,
      );

      expect(message.type).toBe("game_state_sync");
      expect(message.syncType).toBe("delta");
      expect(message.compressed).toBe(true);
      expect(message.delta?.compressed).toBe(true);
    });

    test("should create uncompressed delta message for small delta", () => {
      const action = createGameAction(
        "change_life",
        "player-1",
        { delta: -1 },
        0,
      );
      const newState = manager.applyAction(action, initialState);
      const delta = GameStateDeltaCompressor.createDelta(
        initialState,
        newState,
      );

      const message = createCompressedSyncMessage("session-123", null, delta);

      expect(message.type).toBe("game_state_sync");
      expect(message.syncType).toBe("delta");

      // Small delta should not be compressed
      expect(message.compressed).toBeUndefined();
      expect(message.delta).toEqual(delta);
    });

    test("should throw error if both state and delta provided", () => {
      const delta: GameStateDelta = {
        baseVersion: 0,
        targetVersion: 1,
        operations: [],
        timestamp: Date.now(),
      };

      expect(() => {
        createCompressedSyncMessage("session-123", initialState, delta);
      }).toThrow("Must provide either state or delta");
    });

    test("should throw error if neither state nor delta provided", () => {
      expect(() => {
        createCompressedSyncMessage("session-123", null, null);
      }).toThrow("Must provide either state or delta");
    });
  });

  describe("Sync Message Decompression", () => {
    test("should decompress full state message", () => {
      // Create a large state
      let state = initialState;
      for (let i = 0; i < 100; i++) {
        const action = createGameAction("draw", "player-1", { count: 1 }, i);
        state = manager.applyAction(action, state);
      }

      const message = createCompressedSyncMessage("session-123", state, null);

      if (message.compressed) {
        const decompressed = decompressSyncMessage(message);

        expect(decompressed.compressed).toBe(false);
        expect(decompressed.fullState).toBeTruthy();
        expect(decompressed.fullState?.version).toBe(state.version);
      }
    });

    test("should decompress delta message", () => {
      const largeDelta: GameStateDelta = {
        baseVersion: 0,
        targetVersion: 1,
        operations: Array.from({ length: 500 }, (_, i) => ({
          op: "add" as const,
          path: `/test/path${i}`,
          value: `value${i}`.repeat(10),
        })),
        timestamp: Date.now(),
      };

      const message = createCompressedSyncMessage(
        "session-123",
        null,
        largeDelta,
      );
      const decompressed = decompressSyncMessage(message);

      expect(decompressed.compressed).toBe(false);
      expect(decompressed.delta).toBeTruthy();
      expect(decompressed.delta?.compressed).toBe(false);
      expect(decompressed.delta?.operations).toEqual(largeDelta.operations);
    });

    test("should not decompress uncompressed message", () => {
      const message = createCompressedSyncMessage(
        "session-123",
        initialState,
        null,
      );
      const decompressed = decompressSyncMessage(message);

      // Should return message unchanged if not compressed
      expect(decompressed).toEqual(message);
    });

    test("should roundtrip compressed message", () => {
      // Create a large state
      let state = initialState;
      for (let i = 0; i < 100; i++) {
        const action = createGameAction("draw", "player-1", { count: 1 }, i);
        state = manager.applyAction(action, state);
      }

      const message = createCompressedSyncMessage("session-123", state, null);
      const decompressed = decompressSyncMessage(message);

      if (message.compressed) {
        expect(decompressed.fullState).toBeTruthy();
        expect(decompressed.fullState?.version).toBe(state.version);
        expect(decompressed.fullState?.players[0].hand.length).toBe(
          state.players[0].hand.length,
        );
      }
    });
  });

  describe("Compression Error Handling", () => {
    test("should handle compression failure gracefully", () => {
      // Compression should not throw, even with circular references
      const circularRef: any = { a: 1 };
      circularRef.self = circularRef;

      // JSON.stringify will throw on circular refs, but we catch it
      expect(() => {
        compressData(circularRef);
      }).toThrow();
    });

    test("should handle decompression of invalid data", () => {
      const invalidCompressed = "not-valid-base64-or-gzip";

      expect(() => {
        decompressData(invalidCompressed);
      }).toThrow();
    });

    test("should handle empty compressed string", () => {
      expect(() => {
        decompressData("");
      }).toThrow();
    });
  });

  describe("Performance and Edge Cases", () => {
    test("should handle very large game states", () => {
      // Create a very large state
      let state = initialState;
      for (let i = 0; i < 200; i++) {
        const action = createGameAction("draw", "player-1", { count: 1 }, i);
        state = manager.applyAction(action, state);
      }

      const compressed = compressGameState(state);
      const decompressed = decompressGameState(compressed);

      expect(decompressed.players[0].hand.length).toBe(
        state.players[0].hand.length,
      );
    });

    test("should handle minimal game state", () => {
      const minimalState = createInitialTCGState(
        "test",
        ["p1", "p2"],
        ["A", "B"],
      );

      const compressed = compressGameState(minimalState);
      const decompressed = decompressGameState(compressed);

      expect(decompressed).toEqual(minimalState);
    });

    test("should calculate size savings correctly", () => {
      const largeData = { content: "test".repeat(1000) };
      const compressed = compressData(largeData);
      const ratio = calculateCompressionRatio(largeData, compressed);

      const originalSize = JSON.stringify(largeData).length;
      const compressedSize = compressed.length;
      const expectedRatio =
        ((originalSize - compressedSize) / originalSize) * 100;

      expect(ratio).toBeCloseTo(expectedRatio, 2);
    });
  });
});
