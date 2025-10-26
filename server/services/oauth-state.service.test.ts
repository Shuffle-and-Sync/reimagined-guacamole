/**
 * OAuth State Service Tests
 * Tests Redis-backed OAuth state management with fallback
 */

import { describe, it, expect, afterEach } from "@jest/globals";
import {
  setOAuthState,
  getOAuthState,
  deleteOAuthState,
  cleanupExpiredStates,
  type OAuthState,
} from "./oauth-state.service";

describe("OAuth State Service", () => {
  const testState = "test-state-" + Date.now();
  const testData: OAuthState = {
    userId: "user-123",
    platform: "twitch",
    timestamp: Date.now(),
    codeVerifier: "test-verifier-123",
  };

  afterEach(async () => {
    // Clean up test state
    await deleteOAuthState(testState);
  });

  describe("setOAuthState", () => {
    it("should store OAuth state", async () => {
      await setOAuthState(testState, testData);
      const retrieved = await getOAuthState(testState);

      expect(retrieved).toBeDefined();
      expect(retrieved?.userId).toBe(testData.userId);
      expect(retrieved?.platform).toBe(testData.platform);
      expect(retrieved?.codeVerifier).toBe(testData.codeVerifier);
    });

    it("should handle state with all fields", async () => {
      await setOAuthState(testState, testData);
      const retrieved = await getOAuthState(testState);

      expect(retrieved).toEqual(testData);
    });

    it("should handle state without optional codeVerifier", async () => {
      const stateWithoutVerifier: OAuthState = {
        userId: "user-456",
        platform: "youtube",
        timestamp: Date.now(),
      };

      await setOAuthState(testState, stateWithoutVerifier);
      const retrieved = await getOAuthState(testState);

      expect(retrieved).toBeDefined();
      expect(retrieved?.userId).toBe(stateWithoutVerifier.userId);
      expect(retrieved?.codeVerifier).toBeUndefined();
    });
  });

  describe("getOAuthState", () => {
    it("should retrieve stored state", async () => {
      await setOAuthState(testState, testData);
      const retrieved = await getOAuthState(testState);

      expect(retrieved).toBeDefined();
      expect(retrieved?.userId).toBe(testData.userId);
    });

    it("should return null for non-existent state", async () => {
      const retrieved = await getOAuthState("non-existent-state");
      expect(retrieved).toBeNull();
    });
  });

  describe("deleteOAuthState", () => {
    it("should delete stored state", async () => {
      await setOAuthState(testState, testData);
      await deleteOAuthState(testState);
      const retrieved = await getOAuthState(testState);

      expect(retrieved).toBeNull();
    });

    it("should handle deleting non-existent state", async () => {
      await expect(
        deleteOAuthState("non-existent-state"),
      ).resolves.not.toThrow();
    });
  });

  describe("cleanupExpiredStates", () => {
    it("should remove expired in-memory states", () => {
      // This test primarily validates the function doesn't throw
      expect(() => cleanupExpiredStates()).not.toThrow();
    });
  });

  describe("platform validation", () => {
    it("should handle all supported platforms", async () => {
      const platforms = ["twitch", "youtube", "facebook"];

      for (const platform of platforms) {
        const state = `test-${platform}-${Date.now()}`;
        const data: OAuthState = {
          userId: "user-123",
          platform,
          timestamp: Date.now(),
        };

        await setOAuthState(state, data);
        const retrieved = await getOAuthState(state);

        expect(retrieved?.platform).toBe(platform);
        await deleteOAuthState(state);
      }
    });
  });
});
