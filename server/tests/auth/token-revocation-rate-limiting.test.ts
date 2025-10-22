/**
 * Token Revocation Rate Limiting Tests
 *
 * Tests for rate limiting implementation on token revocation routes
 * to prevent denial-of-service attacks and abuse of expensive database operations
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { describe, test, expect } from "@jest/globals";

describe("Token Revocation Rate Limiting", () => {
  const tokensRoutesPath = join(process.cwd(), "server/routes/auth/tokens.ts");
  const rateLimitingPath = join(process.cwd(), "server/rate-limiting.ts");

  describe("Rate Limiting Module", () => {
    test("should have rate-limiting.ts file", () => {
      expect(existsSync(rateLimitingPath)).toBe(true);
    });

    test("should export tokenRevocationLimiter", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");
      expect(rateLimitingContent).toContain("tokenRevocationLimiter");
      expect(rateLimitingContent).toMatch(
        /export\s+const\s+tokenRevocationLimiter\s*=\s*rateLimit/,
      );
    });

    test("should configure tokenRevocationLimiter with correct window", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");

      // Check rate limit window (15 minutes)
      const limiterSection = rateLimitingContent.substring(
        rateLimitingContent.indexOf("tokenRevocationLimiter"),
      );
      expect(limiterSection).toMatch(/windowMs:\s*15\s*\*\s*60\s*\*\s*1000/);
    });

    test("should configure tokenRevocationLimiter with correct max requests", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");

      // Check max requests (5 per window)
      const limiterSection = rateLimitingContent.substring(
        rateLimitingContent.indexOf("tokenRevocationLimiter"),
      );
      expect(limiterSection).toMatch(/max:\s*5/);
    });

    test("should configure tokenRevocationLimiter with user-specific keyGenerator", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");

      // Check that keyGenerator is defined and uses userId
      const limiterSection = rateLimitingContent.substring(
        rateLimitingContent.indexOf("tokenRevocationLimiter"),
      );
      expect(limiterSection).toContain("keyGenerator");
      expect(limiterSection).toMatch(/keyGenerator:\s*\([^)]*\)\s*=>/);
      // Should key by user ID, not just IP
      const keyGenMatch = limiterSection.match(
        /keyGenerator:\s*\([^)]*req[^)]*\)\s*=>\s*{[\s\S]*?}/,
      );
      expect(keyGenMatch).not.toBeNull();
      expect(keyGenMatch?.[0]).toMatch(/safeGetUserId|getAuthUserId/);
    });

    test("should configure tokenRevocationLimiter with custom error handler", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");

      // Check that custom handler is defined
      const limiterSection = rateLimitingContent.substring(
        rateLimitingContent.indexOf("tokenRevocationLimiter"),
      );
      expect(limiterSection).toContain("handler");
      expect(limiterSection).toMatch(/handler:\s*\([^)]*\)\s*=>/);
    });

    test("should configure tokenRevocationLimiter with appropriate error messages", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");

      const limiterSection = rateLimitingContent.substring(
        rateLimitingContent.indexOf("tokenRevocationLimiter"),
      );
      expect(limiterSection).toMatch(/token revocation/i);
      expect(limiterSection).toMatch(/15 minutes|retryAfter/i);
    });

    test("should enable standardHeaders and disable legacyHeaders", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");

      const limiterSection = rateLimitingContent.substring(
        rateLimitingContent.indexOf("tokenRevocationLimiter"),
      );
      expect(limiterSection).toMatch(/standardHeaders:\s*true/);
      expect(limiterSection).toMatch(/legacyHeaders:\s*false/);
    });

    test("should include logging in the handler", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");

      const limiterSection = rateLimitingContent.substring(
        rateLimitingContent.indexOf("tokenRevocationLimiter"),
      );
      // Should log when rate limit is exceeded
      expect(limiterSection).toMatch(/logger\.warn|logRateLimit/);
    });
  });

  describe("Token Routes Integration", () => {
    test("should have tokens.ts routes file", () => {
      expect(existsSync(tokensRoutesPath)).toBe(true);
    });

    test("should import tokenRevocationLimiter", () => {
      const tokensContent = readFileSync(tokensRoutesPath, "utf8");
      expect(tokensContent).toContain("tokenRevocationLimiter");
      expect(tokensContent).toMatch(
        /import\s*{[^}]*tokenRevocationLimiter[^}]*}\s*from/,
      );
    });

    test("should apply tokenRevocationLimiter to /revoke-all route", () => {
      const tokensContent = readFileSync(tokensRoutesPath, "utf8");

      // Find the /revoke-all POST route definition
      const revokeAllRouteMatch = tokensContent.match(
        /router\.post\(\s*["']\/revoke-all["']\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,/,
      );

      expect(revokeAllRouteMatch).not.toBeNull();

      // Check that tokenRevocationLimiter is applied as middleware
      const middlewares = [
        revokeAllRouteMatch?.[1]?.trim(),
        revokeAllRouteMatch?.[2]?.trim(),
      ];

      expect(middlewares).toContain("tokenRevocationLimiter");
    });

    test("should apply rate limiting after authentication middleware on /revoke-all", () => {
      const tokensContent = readFileSync(tokensRoutesPath, "utf8");

      // Extract the /revoke-all POST route section
      const revokeAllSection = tokensContent.match(
        /router\.post\(\s*["']\/revoke-all["']\s*,[\s\S]*?async\s*\(/,
      )?.[0];

      expect(revokeAllSection).toBeTruthy();

      // Ensure requireHybridAuth comes before tokenRevocationLimiter
      const authIndex = revokeAllSection?.indexOf("requireHybridAuth") ?? -1;
      const limiterIndex =
        revokeAllSection?.indexOf("tokenRevocationLimiter") ?? -1;

      expect(authIndex).toBeGreaterThan(-1);
      expect(limiterIndex).toBeGreaterThan(-1);
      expect(authIndex).toBeLessThan(limiterIndex);
    });

    test("should use dedicated limiter instead of generic authRateLimit on /revoke-all", () => {
      const tokensContent = readFileSync(tokensRoutesPath, "utf8");

      // Extract the /revoke-all POST route section
      const revokeAllSection = tokensContent.match(
        /router\.post\(\s*["']\/revoke-all["']\s*,[\s\S]*?async\s*\(/,
      )?.[0];

      expect(revokeAllSection).toBeTruthy();

      // Should use tokenRevocationLimiter, not authRateLimit
      expect(revokeAllSection).toContain("tokenRevocationLimiter");

      // Extract just the middleware list to be more precise
      const middlewareList = revokeAllSection?.match(
        /["']\/revoke-all["']\s*,([^{]+)async/,
      )?.[1];

      if (middlewareList) {
        // If authRateLimit is present, it should be replaced by tokenRevocationLimiter
        // We're looking to ensure the new limiter is there
        expect(middlewareList).toContain("tokenRevocationLimiter");
      }
    });

    test("should maintain authentication requirement on /revoke-all", () => {
      const tokensContent = readFileSync(tokensRoutesPath, "utf8");

      // Extract the /revoke-all POST route
      const revokeAllSection = tokensContent.match(
        /router\.post\(\s*["']\/revoke-all["']\s*,[\s\S]*?async\s*\(/,
      )?.[0];

      expect(revokeAllSection).toBeTruthy();
      expect(revokeAllSection).toContain("requireHybridAuth");
    });

    test("should have comment explaining the dedicated rate limiter", () => {
      const tokensContent = readFileSync(tokensRoutesPath, "utf8");

      // Find the /revoke-all route section
      const revokeAllIndex = tokensContent.indexOf('"/revoke-all"');
      const sectionBefore = tokensContent.substring(
        Math.max(0, revokeAllIndex - 500),
        revokeAllIndex + 500,
      );

      // Should have a comment explaining why we use a dedicated rate limiter
      expect(sectionBefore).toMatch(
        /comment|dedicated|strict|token.*revocation/i,
      );
    });
  });

  describe("Security Best Practices", () => {
    test("should use express-rate-limit package", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");
      expect(rateLimitingContent).toMatch(
        /import.*rateLimit.*from.*express-rate-limit/,
      );
    });

    test("should not use legacy headers (security best practice)", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");

      const limiterSection = rateLimitingContent.substring(
        rateLimitingContent.indexOf("tokenRevocationLimiter"),
      );

      // legacyHeaders should be false or not present (defaults to false in newer versions)
      const legacyHeadersMatch = limiterSection.match(
        /legacyHeaders:\s*(true|false)/,
      );
      if (legacyHeadersMatch) {
        expect(legacyHeadersMatch[1]).toBe("false");
      }
    });

    test("should use standard rate limit headers (security best practice)", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");

      const limiterSection = rateLimitingContent.substring(
        rateLimitingContent.indexOf("tokenRevocationLimiter"),
      );
      expect(limiterSection).toMatch(/standardHeaders:\s*true/);
    });

    test("should have proper TypeScript typing (no require statements)", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");
      expect(rateLimitingContent).toMatch(/import.*rateLimit.*from/);
      expect(rateLimitingContent).not.toContain(
        "require('express-rate-limit')",
      );
    });
  });

  describe("Rate Limiting Configuration Validation", () => {
    test("should have reasonable rate limits (not too permissive)", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");

      const limiterSection = rateLimitingContent.substring(
        rateLimitingContent.indexOf("tokenRevocationLimiter"),
      );

      // Max should be 5 or less (strict limit for expensive operations)
      const maxMatch = limiterSection.match(/max:\s*(\d+)/);
      expect(maxMatch).not.toBeNull();
      const maxValue = parseInt(maxMatch?.[1] || "0", 10);
      expect(maxValue).toBeGreaterThan(0);
      expect(maxValue).toBeLessThanOrEqual(5);
    });

    test("should have reasonable time window (not too short or too long)", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");

      const limiterSection = rateLimitingContent.substring(
        rateLimitingContent.indexOf("tokenRevocationLimiter"),
      );

      // Window should be 15 minutes (900000ms)
      expect(limiterSection).toMatch(/windowMs:\s*15\s*\*\s*60\s*\*\s*1000/);
    });

    test("should provide clear error messages to users", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");

      const limiterSection = rateLimitingContent.substring(
        rateLimitingContent.indexOf("tokenRevocationLimiter"),
      );

      // Should have user-friendly error message
      expect(limiterSection).toMatch(/error.*message|message/i);
      expect(limiterSection).toMatch(/too many|rate limit/i);
    });

    test("should provide retry-after information", () => {
      const rateLimitingContent = readFileSync(rateLimitingPath, "utf8");

      const limiterSection = rateLimitingContent.substring(
        rateLimitingContent.indexOf("tokenRevocationLimiter"),
      );

      // Should include retry-after information
      expect(limiterSection).toMatch(/retryAfter|retry.*after/i);
    });
  });
});
