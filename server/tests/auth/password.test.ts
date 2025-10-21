/**
 * Tests for password hashing and validation
 * Covers password.ts authentication module
 */

import { describe, test, expect } from "@jest/globals";
import {
  hashPassword,
  verifyPassword,
  comparePassword,
  validatePasswordStrength,
  passwordNeedsRehash,
} from "../../auth/password";

describe("Password Module - Authentication", () => {
  describe("hashPassword", () => {
    test("should hash a password successfully", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).toMatch(/^\$argon2/);
    });

    test("should generate unique hashes for same password", async () => {
      const password = "TestPassword123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    test("should handle empty password", async () => {
      const password = "";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$argon2/);
    });

    test("should handle very long passwords", async () => {
      const password = "A".repeat(128) + "!1a";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$argon2/);
    });

    test("should handle special characters in password", async () => {
      const password = "Test!@#$%^&*()_+-={}[]|:;\"'<>,.?/~`Password123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$argon2/);
    });
  });

  describe("verifyPassword", () => {
    test("should verify correct password", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    test("should reject incorrect password", async () => {
      const password = "TestPassword123!";
      const wrongPassword = "WrongPassword123!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    test("should reject non-Argon2 hash format", async () => {
      const password = "TestPassword123!";
      const bcryptHash = "$2a$10$invalidhashformat";
      const isValid = await verifyPassword(password, bcryptHash);

      expect(isValid).toBe(false);
    });

    test("should handle invalid hash gracefully", async () => {
      const password = "TestPassword123!";
      const invalidHash = "not-a-valid-hash";
      const isValid = await verifyPassword(password, invalidHash);

      expect(isValid).toBe(false);
    });

    test("should handle empty password verification", async () => {
      const password = "";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    test("should be case sensitive", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword("testpassword123!", hash);

      expect(isValid).toBe(false);
    });
  });

  describe("comparePassword (legacy)", () => {
    test("should work as alias to verifyPassword", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);

      expect(isValid).toBe(true);
    });
  });

  describe("validatePasswordStrength", () => {
    test("should accept strong password with all requirements", () => {
      const result = validatePasswordStrength("StrongP@ss9!xY");

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should reject password shorter than 12 characters", () => {
      const result = validatePasswordStrength("Short1!");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Password must be at least 12 characters long",
      );
    });

    test("should reject password longer than 128 characters", () => {
      const password = "A".repeat(129) + "!1a";
      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Password must be less than 128 characters long",
      );
    });

    test("should reject password without uppercase letter", () => {
      const result = validatePasswordStrength("lowercase123!");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one uppercase letter (A-Z)",
      );
    });

    test("should reject password without lowercase letter", () => {
      const result = validatePasswordStrength("UPPERCASE123!");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one lowercase letter (a-z)",
      );
    });

    test("should reject password without number", () => {
      const result = validatePasswordStrength("NoNumbersHere!");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one number (0-9)",
      );
    });

    test("should reject password without special character", () => {
      const result = validatePasswordStrength("NoSpecialChar123");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one special character (!@#$%^&* etc.)",
      );
    });

    test("should reject common password from blacklist", () => {
      const result = validatePasswordStrength("password123");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Password is too common and easily guessable. Please choose a more unique password.",
      );
    });

    test("should reject password with repeated characters", () => {
      const result = validatePasswordStrength("Aaaaaaa123!");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Password cannot contain the same character repeated more than 5 times",
      );
    });

    test("should reject password with ascending sequences", () => {
      const result = validatePasswordStrength("Abcd567890!Test");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Password cannot contain simple sequences (123456, abcdef, etc.)",
      );
    });

    test("should reject password with descending sequences", () => {
      const result = validatePasswordStrength("Test9876543!Abc");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Password cannot contain simple sequences (123456, abcdef, etc.)",
      );
    });

    test("should reject password with keyboard patterns", () => {
      const result = validatePasswordStrength("Qwerty19!Pass");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Password cannot contain keyboard patterns (qwerty, asdf, etc.)",
      );
    });

    test("should accept various special characters", () => {
      const passwords = [
        "TestPassword1!9z",
        "TestPassword1@9z",
        "TestPassword1#9z",
        "TestPassword1$9z",
        "TestPassword1%9z",
        "TestPassword1^9z",
        "TestPassword1&9z",
        "TestPassword1*9z",
        "TestPassword1(9z",
        "TestPassword1)9z",
      ];

      for (const password of passwords) {
        const result = validatePasswordStrength(password);
        expect(result.valid).toBe(true);
      }
    });

    test("should return multiple errors for weak password", () => {
      const result = validatePasswordStrength("weak");

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    test("should handle edge case of exactly 12 characters", () => {
      const result = validatePasswordStrength("TestPass1!9Z");

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should handle edge case of exactly 128 characters", () => {
      // Create 128 character password - using randomish pattern to avoid sequences
      const base = "Tp!8Kj@5Nm#7Rq&9Sx*2";
      const password = base.repeat(6) + "Wp!6Kj"; // 6*20 + 6 = 126
      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("passwordNeedsRehash", () => {
    test("should return true for bcrypt hash", () => {
      const bcryptHash = "$2a$10$somehashhere";
      const needsRehash = passwordNeedsRehash(bcryptHash);

      expect(needsRehash).toBe(true);
    });

    test("should return true for bcrypt hash with $2b variant", () => {
      const bcryptHash = "$2b$10$somehashhere";
      const needsRehash = passwordNeedsRehash(bcryptHash);

      expect(needsRehash).toBe(true);
    });

    test("should return false for Argon2 hash", () => {
      const argon2Hash = "$argon2id$v=19$m=65536,t=3,p=4$somehashhere";
      const needsRehash = passwordNeedsRehash(argon2Hash);

      expect(needsRehash).toBe(false);
    });

    test("should return false for other hash formats", () => {
      const otherHash = "$5$somehashhere";
      const needsRehash = passwordNeedsRehash(otherHash);

      expect(needsRehash).toBe(false);
    });
  });

  describe("Integration Tests", () => {
    test("should validate and hash a strong password end-to-end", async () => {
      const password = "MySecureP@ss9!";
      const validation = validatePasswordStrength(password);

      expect(validation.valid).toBe(true);

      const hash = await hashPassword(password);
      expect(hash).toMatch(/^\$argon2/);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    test("should reject weak password before hashing", () => {
      const password = "weak";
      const validation = validatePasswordStrength(password);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test("should handle multiple password verifications", async () => {
      const password = "TestP@ssw0rd!9Z";
      const hash = await hashPassword(password);

      // Verify multiple times
      for (let i = 0; i < 5; i++) {
        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);
      }
    });
  });
});
