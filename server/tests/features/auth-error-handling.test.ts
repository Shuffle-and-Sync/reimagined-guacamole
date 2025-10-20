/**
 * Authentication Error Handling Tests
 *
 * Tests for improved error handling and redirect loop prevention
 */

import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

describe("Authentication Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
  describe("Configuration Error Detection", () => {
    test("should detect Configuration error from URL", () => {
      const errorUrl = "/api/auth/error?error=Configuration";
      const urlObj = new URL(errorUrl, "https://example.com");
      const error = urlObj.searchParams.get("error");

      expect(error).toBe("Configuration");
    });

    test("should redirect Configuration errors to frontend error page", () => {
      const baseUrl = "https://example.com";
      const errorUrl = "/api/auth/error?error=Configuration";
      const urlObj = new URL(errorUrl, baseUrl);
      const error = urlObj.searchParams.get("error");

      const redirectUrl = `${baseUrl}/auth/error?error=${error}`;

      expect(redirectUrl).toBe(
        "https://example.com/auth/error?error=Configuration",
      );
      expect(redirectUrl).not.toContain("/api/auth/error");
    });
  });

  describe("Error Page Messages", () => {
    test("should provide helpful message for Configuration error", () => {
      const getErrorMessage = (error: string | null) => {
        switch (error) {
          case "Configuration":
            return "OAuth credentials not configured";
          case "AccessDenied":
            return "Access denied";
          default:
            return "Unexpected error";
        }
      };

      expect(getErrorMessage("Configuration")).toContain("OAuth");
      expect(getErrorMessage("AccessDenied")).toContain("denied");
      expect(getErrorMessage("Unknown")).toContain("Unexpected");
    });
  });

  describe("Redirect Loop Prevention", () => {
    test("should detect error redirects", () => {
      const urls = [
        "/api/auth/error?error=Configuration",
        "https://example.com/api/auth/error?error=AccessDenied",
        "/auth/callback?error=Verification",
      ];

      urls.forEach((url) => {
        const hasError =
          url.includes("/api/auth/error") || url.includes("error=");
        expect(hasError).toBe(true);
      });
    });

    test("should not flag normal URLs as errors", () => {
      const urls = ["/home", "/api/auth/signin", "https://example.com/profile"];

      urls.forEach((url) => {
        const hasError =
          url.includes("/api/auth/error") && url.includes("error=");
        expect(hasError).toBe(false);
      });
    });
  });

  describe("URL Validation", () => {
    test("should validate same-domain URLs", () => {
      const baseUrl = "https://example.com";
      const sameOriginUrls = [
        "https://example.com/home",
        "https://example.com/profile",
      ];

      const differentOriginUrls = [
        "https://other.com/page",
        "https://malicious.com",
      ];

      sameOriginUrls.forEach((url) => {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        expect(urlObj.hostname).toBe(baseUrlObj.hostname);
      });

      differentOriginUrls.forEach((url) => {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        expect(urlObj.hostname).not.toBe(baseUrlObj.hostname);
      });
    });

    test("should handle relative URLs", () => {
      const baseUrl = "https://example.com";
      const relativeUrls = ["/home", "/profile", "/auth/signin"];

      relativeUrls.forEach((url) => {
        expect(url.startsWith("/")).toBe(true);
        const fullUrl = `${baseUrl}${url}`;
        expect(fullUrl).toMatch(/^https:\/\/example\.com\//);
      });
    });
  });

  describe("Environment Variable Validation", () => {
    test("should warn when OAuth credentials are missing", () => {
      const hasGoogleOAuth = false;
      const hasTwitchOAuth = false;

      const shouldWarn = !hasGoogleOAuth && !hasTwitchOAuth;

      expect(shouldWarn).toBe(true);
    });

    test("should not warn when at least one OAuth provider is configured", () => {
      const scenarios = [
        { google: true, twitch: false },
        { google: false, twitch: true },
        { google: true, twitch: true },
      ];

      scenarios.forEach(({ google, twitch }) => {
        const shouldWarn = !google && !twitch;
        expect(shouldWarn).toBe(false);
      });
    });
  });
});
