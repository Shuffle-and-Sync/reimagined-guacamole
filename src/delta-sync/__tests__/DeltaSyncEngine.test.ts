/**
 * Tests for DeltaSyncEngine
 */

import { describe, test, expect } from "@jest/globals";
import { DeltaSyncEngine } from "../DeltaSyncEngine";
import type { JsonPatch } from "../types";

describe("DeltaSyncEngine", () => {
  let engine: DeltaSyncEngine<any>;

  beforeEach(() => {
    engine = new DeltaSyncEngine();
  });

  describe("generatePatches", () => {
    test("should generate patches between states", () => {
      const oldState = { name: "Alice", age: 30 };
      const newState = { name: "Alice", age: 31 };

      const patches = engine.generatePatches(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0]).toEqual({
        op: "replace",
        path: "/age",
        value: 31,
      });
    });

    test("should optimize patches when enabled", () => {
      const engine = new DeltaSyncEngine({ enableOptimization: true });
      const oldState = { value: 1 };
      const newState = { value: 3 };

      const patches = engine.generatePatches(oldState, newState);

      expect(patches.length).toBeGreaterThan(0);
    });
  });

  describe("applyPatches", () => {
    test("should apply patches to state", () => {
      const state = { name: "Alice", age: 30 };
      const patches: JsonPatch[] = [{ op: "replace", path: "/age", value: 31 }];

      const result = engine.applyPatches(state, patches);

      expect(result.newState).toEqual({ name: "Alice", age: 31 });
      expect(result.applied).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
    });

    test("should handle patch failures", () => {
      const state = { name: "Alice" };
      const patches: JsonPatch[] = [{ op: "remove", path: "/nonexistent" }];

      const result = engine.applyPatches(state, patches);

      expect(result.failed.length).toBeGreaterThan(0);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });
  });

  describe("createPatchMessage", () => {
    test("should create patch message with metadata", async () => {
      const oldState = { value: 1 };
      const newState = { value: 2 };
      const baseVersion = { client1: 1 };
      const targetVersion = { client1: 2 };

      const message = await engine.createPatchMessage(
        oldState,
        newState,
        baseVersion,
        targetVersion,
      );

      expect(message.id).toBeDefined();
      expect(message.baseVersion).toEqual(baseVersion);
      expect(message.targetVersion).toEqual(targetVersion);
      expect(message.patches.length).toBeGreaterThan(0);
      expect(message.checksum).toBeDefined();
      expect(typeof message.compressed).toBe("boolean");
      expect(message.timestamp).toBeGreaterThan(0);
    });
  });

  describe("applyPatchMessage", () => {
    test("should apply patch message to state", async () => {
      const oldState = { value: 1 };
      const newState = { value: 2 };
      const baseVersion = { client1: 1 };
      const targetVersion = { client1: 2 };

      const message = await engine.createPatchMessage(
        oldState,
        newState,
        baseVersion,
        targetVersion,
      );

      const result = await engine.applyPatchMessage(oldState, message);

      expect(result.newState).toEqual(newState);
    });

    test("should validate checksum", async () => {
      const state = { value: 1 };
      const message = await engine.createPatchMessage(
        state,
        { value: 2 },
        { client1: 1 },
        { client1: 2 },
      );

      // Corrupt checksum
      message.checksum = "invalid";

      await expect(engine.applyPatchMessage(state, message)).rejects.toThrow(
        "Checksum mismatch",
      );
    });
  });

  describe("mergePatchSets", () => {
    test("should merge non-conflicting patches", () => {
      const base = { a: 1, b: 2 };
      const patches1: JsonPatch[] = [{ op: "replace", path: "/a", value: 5 }];
      const patches2: JsonPatch[] = [{ op: "replace", path: "/b", value: 6 }];

      const merged = engine.mergePatchSets(base, patches1, patches2);

      expect(merged).toHaveLength(2);
      expect(merged.find((p) => p.path === "/a")).toBeDefined();
      expect(merged.find((p) => p.path === "/b")).toBeDefined();
    });

    test("should resolve conflicting patches", () => {
      const base = { value: 1 };
      const patches1: JsonPatch[] = [
        { op: "replace", path: "/value", value: 2 },
      ];
      const patches2: JsonPatch[] = [
        { op: "replace", path: "/value", value: 3 },
      ];

      const merged = engine.mergePatchSets(base, patches1, patches2);

      expect(merged.length).toBeGreaterThan(0);
      // Should have resolved the conflict
    });
  });

  describe("sync protocol", () => {
    test("should create sync request", () => {
      const clientVersion = { client1: 5 };
      const requestedVersion = { client1: 10 };

      const request = engine.createSyncRequest(clientVersion, requestedVersion);

      expect(request.type).toBe("sync-request");
      expect(request.clientVersion).toEqual(clientVersion);
      expect(request.requestedVersion).toEqual(requestedVersion);
    });

    test("should create sync response", async () => {
      const clientVersion = { client1: 5 };
      const patches: any[] = [];

      const response = await engine.createSyncResponse(clientVersion, patches);

      expect(response.type).toBe("sync-response");
      expect(response.clientVersion).toEqual(clientVersion);
      expect(response.patches).toEqual(patches);
    });

    test("should create sync acknowledgment", () => {
      const clientVersion = { client1: 5 };

      const ack = engine.createSyncAck(clientVersion);

      expect(ack.type).toBe("sync-ack");
      expect(ack.clientVersion).toEqual(clientVersion);
    });

    test("should create sync error", () => {
      const clientVersion = { client1: 5 };
      const errorMsg = "Sync failed";

      const error = engine.createSyncError(clientVersion, errorMsg);

      expect(error.type).toBe("sync-error");
      expect(error.clientVersion).toEqual(clientVersion);
      expect(error.error).toBe(errorMsg);
    });
  });

  describe("calculateSyncStats", () => {
    test("should calculate statistics for patches", () => {
      const patches: JsonPatch[] = [
        { op: "add", path: "/a", value: 1 },
        { op: "replace", path: "/b", value: 2 },
        { op: "remove", path: "/c" },
      ];

      const stats = engine.calculateSyncStats(patches);

      expect(stats.patchCount).toBe(3);
      expect(stats.estimatedSize).toBeGreaterThan(0);
      expect(stats.operations.add).toBe(1);
      expect(stats.operations.replace).toBe(1);
      expect(stats.operations.remove).toBe(1);
    });
  });

  describe("integration", () => {
    test("should handle complete sync cycle", async () => {
      const client1 = new DeltaSyncEngine({ clientId: "client1" });
      const client2 = new DeltaSyncEngine({ clientId: "client2" });

      // Initial state
      let state1 = { players: [{ id: 1, name: "Alice", score: 100 }] };
      let state2 = { players: [{ id: 1, name: "Alice", score: 100 }] };

      // Client 1 makes a change
      const newState1 = { players: [{ id: 1, name: "Alice", score: 150 }] };
      const patches = client1.generatePatches(state1, newState1);
      state1 = newState1;

      // Client 2 applies the patches
      const result = client2.applyPatches(state2, patches);
      state2 = result.newState;

      // States should be synchronized
      expect(state2).toEqual(state1);
    });

    test("should handle complex nested changes", async () => {
      const oldState = {
        game: {
          players: [
            { id: 1, name: "Alice", cards: [1, 2, 3] },
            { id: 2, name: "Bob", cards: [4, 5, 6] },
          ],
          turn: 1,
        },
      };

      const newState = {
        game: {
          players: [
            { id: 1, name: "Alice", cards: [1, 2, 3, 7] },
            { id: 2, name: "Bob", cards: [4, 5] },
          ],
          turn: 2,
        },
      };

      const patches = engine.generatePatches(oldState, newState);
      const result = engine.applyPatches(oldState, patches);

      expect(result.newState).toEqual(newState);
    });
  });

  describe("getClientId", () => {
    test("should return client ID", () => {
      const engine = new DeltaSyncEngine({ clientId: "test-client" });
      expect(engine.getClientId()).toBe("test-client");
    });

    test("should generate ID if not provided", () => {
      const engine = new DeltaSyncEngine();
      expect(engine.getClientId()).toBeDefined();
      expect(engine.getClientId().length).toBeGreaterThan(0);
    });
  });
});
