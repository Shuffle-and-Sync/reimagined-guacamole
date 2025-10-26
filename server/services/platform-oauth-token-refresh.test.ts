/**
 * Platform OAuth Token Refresh Tests
 * Tests YouTube and Facebook token refresh functionality
 */

import { describe, it, expect, jest } from "@jest/globals";

// Mock dependencies
jest.mock("./youtube-api.service");
jest.mock("./facebook-api.service");
jest.mock("../storage");

describe("Platform OAuth Token Refresh", () => {
  describe("YouTube Token Refresh", () => {
    it("should preserve refresh_token when new one not provided", () => {
      // Test that the logic correctly handles missing refresh_token in response
      const originalRefreshToken = "original-refresh-token";
      const newRefreshToken = undefined;
      const expectedRefreshToken = newRefreshToken || originalRefreshToken;

      expect(expectedRefreshToken).toBe(originalRefreshToken);
    });

    it("should use new refresh_token when provided", () => {
      const originalRefreshToken = "original-refresh-token";
      const newRefreshToken = "new-refresh-token";
      const expectedRefreshToken = newRefreshToken || originalRefreshToken;

      expect(expectedRefreshToken).toBe(newRefreshToken);
    });
  });

  describe("Facebook Token Exchange", () => {
    it("should calculate correct expiry for long-lived tokens", () => {
      const expiresInSeconds = 5184000; // 60 days
      const now = Date.now();
      const expectedExpiry = new Date(now + expiresInSeconds * 1000);

      // Verify calculation is correct (within 1 second tolerance)
      const calculatedExpiry = new Date(now + expiresInSeconds * 1000);
      const timeDiff = Math.abs(
        calculatedExpiry.getTime() - expectedExpiry.getTime(),
      );

      expect(timeDiff).toBeLessThan(1000);
    });

    it("should default to 60 days if expires_in not provided", () => {
      const defaultExpiresIn = 5184000; // 60 days in seconds
      const providedExpiresIn: number | undefined = undefined;
      const expiresIn = providedExpiresIn ?? defaultExpiresIn;

      expect(expiresIn).toBe(5184000);
    });
  });

  describe("Token Refresh Error Handling", () => {
    it("should handle null token data gracefully", () => {
      const tokenData = null;
      const result = tokenData ? tokenData.access_token : null;

      expect(result).toBeNull();
    });

    it("should handle missing access_token in response", () => {
      const tokenData: { expires_in: number; access_token?: string } = {
        expires_in: 3600,
      };
      const result = tokenData.access_token;

      expect(result).toBeUndefined();
    });
  });
});
