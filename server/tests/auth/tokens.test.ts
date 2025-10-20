/**
 * Tests for JWT token generation and verification
 * Covers tokens.ts authentication module
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  TOKEN_EXPIRY,
  generateEmailVerificationJWT,
  verifyEmailVerificationJWT,
  generateAccessTokenJWT,
  generateRefreshTokenJWT,
  verifyRefreshTokenJWT,
  generateRefreshTokenId,
  generatePasswordResetJWT,
  verifyPasswordResetJWT,
  validateTokenSecurity,
  verifyAccessTokenJWT,
} from "../../auth/tokens";

describe("Token Module - JWT Management", () => {
  const testUserId = "user-test-123";
  const testEmail = "test@example.com";

  describe("generateEmailVerificationJWT", () => {
    test("should generate email verification token successfully", async () => {
      const token = await generateEmailVerificationJWT(testUserId, testEmail);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT format
    });

    test("should include userId and email in token payload", async () => {
      const token = await generateEmailVerificationJWT(testUserId, testEmail);
      const result = await verifyEmailVerificationJWT(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.sub).toBe(testUserId);
      expect(result.payload?.email).toBe(testEmail.toLowerCase());
    });

    test("should normalize email to lowercase", async () => {
      const upperEmail = "TEST@EXAMPLE.COM";
      const token = await generateEmailVerificationJWT(testUserId, upperEmail);
      const result = await verifyEmailVerificationJWT(token);

      expect(result.payload?.email).toBe(upperEmail.toLowerCase());
    });

    test("should trim whitespace from email", async () => {
      const emailWithSpaces = "  test@example.com  ";
      const token = await generateEmailVerificationJWT(
        testUserId,
        emailWithSpaces,
      );
      const result = await verifyEmailVerificationJWT(token);

      expect(result.payload?.email).toBe("test@example.com");
    });

    test("should throw error for missing userId", async () => {
      await expect(generateEmailVerificationJWT("", testEmail)).rejects.toThrow(
        "User ID and email are required for email verification token",
      );
    });

    test("should throw error for missing email", async () => {
      await expect(
        generateEmailVerificationJWT(testUserId, ""),
      ).rejects.toThrow(
        "User ID and email are required for email verification token",
      );
    });

    test("should use custom expiry time", async () => {
      const customExpiry = 3600; // 1 hour
      const token = await generateEmailVerificationJWT(
        testUserId,
        testEmail,
        customExpiry,
      );

      expect(token).toBeDefined();
      // Token should be valid immediately
      const result = await verifyEmailVerificationJWT(token);
      expect(result.valid).toBe(true);
    });

    test("should use default expiry if not specified", async () => {
      const token = await generateEmailVerificationJWT(testUserId, testEmail);
      const result = await verifyEmailVerificationJWT(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.exp).toBeDefined();
    });
  });

  describe("verifyEmailVerificationJWT", () => {
    test("should verify valid email verification token", async () => {
      const token = await generateEmailVerificationJWT(testUserId, testEmail);
      const result = await verifyEmailVerificationJWT(token);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.payload).toBeDefined();
    });

    test("should reject invalid token format", async () => {
      const result = await verifyEmailVerificationJWT("invalid-token");

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("should reject empty token", async () => {
      const result = await verifyEmailVerificationJWT("");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid token format");
    });
  });

  describe("generateAccessTokenJWT", () => {
    test("should generate access token successfully", async () => {
      const token = await generateAccessTokenJWT(testUserId, testEmail);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    test("should include userId in access token", async () => {
      const token = await generateAccessTokenJWT(testUserId, testEmail);
      const result = await verifyAccessTokenJWT(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.sub).toBe(testUserId);
    });

    test("should use ACCESS_TOKEN expiry", async () => {
      const token = await generateAccessTokenJWT(testUserId, testEmail);
      const result = await verifyAccessTokenJWT(token);

      expect(result.valid).toBe(true);
      const iat = result.payload?.iat || 0;
      const exp = result.payload?.exp || 0;
      const actualExpiry = exp - iat;

      // Should be 15 minutes (with small tolerance for execution time)
      expect(actualExpiry).toBeGreaterThanOrEqual(
        TOKEN_EXPIRY.ACCESS_TOKEN - 5,
      );
      expect(actualExpiry).toBeLessThanOrEqual(TOKEN_EXPIRY.ACCESS_TOKEN + 5);
    });

    test("should throw error for missing userId", async () => {
      await expect(generateAccessTokenJWT("", testEmail)).rejects.toThrow();
    });
  });

  describe("generateRefreshTokenJWT", () => {
    test("should generate refresh token successfully", async () => {
      const tokenId = generateRefreshTokenId();
      const token = await generateRefreshTokenJWT(
        testUserId,
        testEmail,
        tokenId,
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    test("should include userId in refresh token", async () => {
      const tokenId = generateRefreshTokenId();
      const token = await generateRefreshTokenJWT(
        testUserId,
        testEmail,
        tokenId,
      );
      const result = await verifyRefreshTokenJWT(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.sub).toBe(testUserId);
    });

    test("should use REFRESH_TOKEN expiry", async () => {
      const tokenId = generateRefreshTokenId();
      const token = await generateRefreshTokenJWT(
        testUserId,
        testEmail,
        tokenId,
      );
      const result = await verifyRefreshTokenJWT(token);

      expect(result.valid).toBe(true);
      const iat = result.payload?.iat || 0;
      const exp = result.payload?.exp || 0;
      const actualExpiry = exp - iat;

      // Should be 7 days (with small tolerance)
      expect(actualExpiry).toBeGreaterThanOrEqual(
        TOKEN_EXPIRY.REFRESH_TOKEN - 5,
      );
      expect(actualExpiry).toBeLessThanOrEqual(TOKEN_EXPIRY.REFRESH_TOKEN + 5);
    });

    test("should throw error for missing userId", async () => {
      const tokenId = generateRefreshTokenId();
      await expect(
        generateRefreshTokenJWT("", testEmail, tokenId),
      ).rejects.toThrow();
    });

    test("should throw error for missing email", async () => {
      const tokenId = generateRefreshTokenId();
      await expect(
        generateRefreshTokenJWT(testUserId, "", tokenId),
      ).rejects.toThrow();
    });

    test("should throw error for missing tokenId", async () => {
      await expect(
        generateRefreshTokenJWT(testUserId, testEmail, ""),
      ).rejects.toThrow();
    });
  });

  describe("verifyRefreshTokenJWT", () => {
    test("should verify valid refresh token", async () => {
      const tokenId = generateRefreshTokenId();
      const token = await generateRefreshTokenJWT(
        testUserId,
        testEmail,
        tokenId,
      );
      const result = await verifyRefreshTokenJWT(token);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.payload).toBeDefined();
    });

    test("should reject invalid token", async () => {
      const result = await verifyRefreshTokenJWT("invalid-token");

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("should reject empty token", async () => {
      const result = await verifyRefreshTokenJWT("");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid token format");
    });

    test("should reject wrong token type", async () => {
      const emailToken = await generateEmailVerificationJWT(
        testUserId,
        testEmail,
      );
      const result = await verifyRefreshTokenJWT(emailToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid token type");
    });
  });

  describe("generateRefreshTokenId", () => {
    test("should generate unique refresh token IDs", () => {
      const id1 = generateRefreshTokenId();
      const id2 = generateRefreshTokenId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
      expect(typeof id2).toBe("string");
      expect(id1.length).toBeGreaterThan(0);
    });

    test("should generate consistent format", () => {
      const ids = Array.from({ length: 10 }, () => generateRefreshTokenId());

      ids.forEach((id) => {
        expect(typeof id).toBe("string");
        expect(id.length).toBeGreaterThan(10); // nanoid default is 21 chars
      });
    });
  });

  describe("generatePasswordResetJWT", () => {
    test("should generate password reset token successfully", async () => {
      const token = await generatePasswordResetJWT(testUserId, testEmail);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    test("should include userId and email in token", async () => {
      const token = await generatePasswordResetJWT(testUserId, testEmail);
      const result = await verifyPasswordResetJWT(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.sub).toBe(testUserId);
      expect(result.payload?.email).toBe(testEmail.toLowerCase());
    });

    test("should use PASSWORD_RESET expiry", async () => {
      const token = await generatePasswordResetJWT(testUserId, testEmail);
      const result = await verifyPasswordResetJWT(token);

      expect(result.valid).toBe(true);
      const iat = result.payload?.iat || 0;
      const exp = result.payload?.exp || 0;
      const actualExpiry = exp - iat;

      // Should be 1 hour (with small tolerance)
      expect(actualExpiry).toBeGreaterThanOrEqual(
        TOKEN_EXPIRY.PASSWORD_RESET - 5,
      );
      expect(actualExpiry).toBeLessThanOrEqual(TOKEN_EXPIRY.PASSWORD_RESET + 5);
    });

    test("should throw error for missing userId", async () => {
      await expect(generatePasswordResetJWT("", testEmail)).rejects.toThrow();
    });

    test("should throw error for missing email", async () => {
      await expect(generatePasswordResetJWT(testUserId, "")).rejects.toThrow();
    });
  });

  describe("verifyPasswordResetJWT", () => {
    test("should verify valid password reset token", async () => {
      const token = await generatePasswordResetJWT(testUserId, testEmail);
      const result = await verifyPasswordResetJWT(token);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.payload).toBeDefined();
    });

    test("should reject invalid token", async () => {
      const result = await verifyPasswordResetJWT("invalid-token");

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("should reject wrong token type", async () => {
      const tokenId = generateRefreshTokenId();
      const refreshToken = await generateRefreshTokenJWT(
        testUserId,
        testEmail,
        tokenId,
      );
      const result = await verifyPasswordResetJWT(refreshToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid token type");
    });
  });

  describe("validateTokenSecurity", () => {
    test("should validate secure token ID", () => {
      const tokenId = generateRefreshTokenId();
      const now = Math.floor(Date.now() / 1000);
      const payload = { sub: testUserId, iat: now };

      const isValid = validateTokenSecurity(tokenId, payload);

      expect(isValid).toBe(true);
    });

    test("should reject invalid token ID", () => {
      const tokenId = "";
      const now = Math.floor(Date.now() / 1000);
      const payload = { sub: testUserId, iat: now };

      const isValid = validateTokenSecurity(tokenId, payload);

      expect(isValid).toBe(false);
    });

    test("should handle old tokens (but still return true)", () => {
      const tokenId = generateRefreshTokenId();
      const oldTime =
        Math.floor(Date.now() / 1000) - TOKEN_EXPIRY.REFRESH_TOKEN - 1000;
      const payload = { sub: testUserId, iat: oldTime };

      // Should still return true but log a warning
      const isValid = validateTokenSecurity(tokenId, payload);

      expect(isValid).toBe(true);
    });
  });

  describe("TOKEN_EXPIRY constants", () => {
    test("should have correct expiry values", () => {
      expect(TOKEN_EXPIRY.ACCESS_TOKEN).toBe(15 * 60);
      expect(TOKEN_EXPIRY.REFRESH_TOKEN).toBe(7 * 24 * 60 * 60);
      expect(TOKEN_EXPIRY.EMAIL_VERIFICATION).toBe(24 * 60 * 60);
      expect(TOKEN_EXPIRY.PASSWORD_RESET).toBe(60 * 60);
    });
  });

  describe("Integration Tests", () => {
    test("should complete email verification flow", async () => {
      // Generate token
      const token = await generateEmailVerificationJWT(testUserId, testEmail);

      // Verify token
      const result = await verifyEmailVerificationJWT(token);
      expect(result.valid).toBe(true);
      expect(result.payload?.sub).toBe(testUserId);
      expect(result.payload?.email).toBe(testEmail);
    });

    test("should complete access/refresh token flow", async () => {
      // Generate tokens
      const accessToken = await generateAccessTokenJWT(testUserId, testEmail);
      const tokenId = generateRefreshTokenId();
      const refreshToken = await generateRefreshTokenJWT(
        testUserId,
        testEmail,
        tokenId,
      );

      // Verify access token
      const accessResult = await verifyAccessTokenJWT(accessToken);
      expect(accessResult.valid).toBe(true);

      // Verify refresh token
      const refreshResult = await verifyRefreshTokenJWT(refreshToken);
      expect(refreshResult.valid).toBe(true);

      // Both should have same user ID
      expect(accessResult.payload?.sub).toBe(testUserId);
      expect(refreshResult.payload?.sub).toBe(testUserId);
    });

    test("should complete password reset flow", async () => {
      // Generate token
      const token = await generatePasswordResetJWT(testUserId, testEmail);

      // Verify token
      const result = await verifyPasswordResetJWT(token);
      expect(result.valid).toBe(true);
      expect(result.payload?.sub).toBe(testUserId);
      expect(result.payload?.email).toBe(testEmail);
    });

    test("should not allow cross-token type usage", async () => {
      const emailToken = await generateEmailVerificationJWT(
        testUserId,
        testEmail,
      );
      const resetToken = await generatePasswordResetJWT(testUserId, testEmail);
      const tokenId = generateRefreshTokenId();
      const refreshToken = await generateRefreshTokenJWT(
        testUserId,
        testEmail,
        tokenId,
      );

      // Email token should not work as reset token
      const emailAsReset = await verifyPasswordResetJWT(emailToken);
      expect(emailAsReset.valid).toBe(false);

      // Reset token should not work as email token
      const resetAsEmail = await verifyEmailVerificationJWT(resetToken);
      expect(resetAsEmail.valid).toBe(false);

      // Refresh token should not work as email token
      const refreshAsEmail = await verifyEmailVerificationJWT(refreshToken);
      expect(refreshAsEmail.valid).toBe(false);
    });
  });
});
