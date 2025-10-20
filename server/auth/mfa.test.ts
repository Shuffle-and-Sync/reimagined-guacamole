/**
 * MFA (Multi-Factor Authentication) Tests
 *
 * Comprehensive unit and integration tests for the MFA logic to ensure security and functionality.
 * Tests cover TOTP code generation, validation, expiration, backup codes, and end-to-end workflows.
 */

import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import speakeasy from "speakeasy";
import {
  generateTOTPSetup,
  verifyTOTPCode,
  generateBackupCodes,
  verifyBackupCode,
  hashBackupCode,
  validateMFASetupRequirements,
  validateBackupCodeFormat,
  getCurrentTOTPCode,
} from "./mfa";

// Mock logger to suppress console output during tests
jest.mock("../logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe("MFA Module - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("TOTP Code Generation and Validation", () => {
    test("should generate a valid TOTP setup with all required components", async () => {
      const userEmail = "test@example.com";
      const serviceName = "Shuffle & Sync";

      const setup = await generateTOTPSetup(userEmail, serviceName);

      expect(setup).toBeDefined();
      expect(setup.secret).toBeDefined();
      expect(setup.secret.length).toBeGreaterThan(0);
      expect(setup.qrCodeUrl).toBeDefined();
      expect(setup.qrCodeUrl).toContain("data:image/png;base64");
      expect(setup.backupCodes).toBeDefined();
      expect(setup.backupCodes.length).toBe(10);
      expect(setup.manualEntryKey).toBe(setup.secret);
    });

    test("should generate TOTP code that is exactly 6 digits", () => {
      // Generate a test secret
      const secret = speakeasy.generateSecret({ length: 32 });

      // Generate current TOTP code
      const code = getCurrentTOTPCode(secret.base32);

      // Verify it's exactly 6 digits
      expect(code).toBeDefined();
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    });

    test("should verify valid TOTP code", () => {
      // Generate a test secret
      const secret = speakeasy.generateSecret({ length: 32 });

      // Generate current TOTP code
      const currentCode = speakeasy.totp({
        secret: secret.base32,
        encoding: "base32",
      });

      // Verify the code
      const result = verifyTOTPCode(currentCode, secret.base32);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test("should reject invalid TOTP code", () => {
      const secret = speakeasy.generateSecret({ length: 32 });
      const invalidCode = "000000"; // Almost certainly invalid

      const result = verifyTOTPCode(invalidCode, secret.base32);

      expect(result.isValid).toBe(false);
    });

    test("should reject TOTP code with invalid format", () => {
      const secret = speakeasy.generateSecret({ length: 32 });
      const invalidFormats = ["12345", "1234567", "abcdef", "12-34-56", ""];

      invalidFormats.forEach((invalidCode) => {
        const result = verifyTOTPCode(invalidCode, secret.base32);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Invalid code format");
      });
    });

    test("should handle whitespace in TOTP code", () => {
      const secret = speakeasy.generateSecret({ length: 32 });
      const currentCode = speakeasy.totp({
        secret: secret.base32,
        encoding: "base32",
      });

      // Add whitespace to the code
      const codeWithSpaces = `${currentCode.slice(0, 3)} ${currentCode.slice(3)}`;

      const result = verifyTOTPCode(codeWithSpaces, secret.base32);

      expect(result.isValid).toBe(true);
    });

    test("should reject expired TOTP code", async () => {
      const secret = speakeasy.generateSecret({ length: 32 });

      // Generate a code from a past time (more than time window allows)
      // Speakeasy default window is 1, which allows ±30 seconds
      // We'll test by using a very old timestamp
      const oldCode = speakeasy.totp({
        secret: secret.base32,
        encoding: "base32",
        time: Math.floor(Date.now() / 1000) - 120, // 2 minutes ago
      });

      // Verify with narrow window (should fail for old codes)
      const result = verifyTOTPCode(oldCode, secret.base32, 0);

      expect(result.isValid).toBe(false);
    });

    test("should accept TOTP code within time window", () => {
      const secret = speakeasy.generateSecret({ length: 32 });

      // Generate a code from 30 seconds ago (within default window of 1)
      const recentCode = speakeasy.totp({
        secret: secret.base32,
        encoding: "base32",
        time: Math.floor(Date.now() / 1000) - 30,
      });

      // Verify with window of 1 (±30 seconds)
      const result = verifyTOTPCode(recentCode, secret.base32, 1);

      expect(result.isValid).toBe(true);
    });
  });

  describe("Backup Code Generation and Validation", () => {
    test("should generate correct number of backup codes", () => {
      const codes = generateBackupCodes(8);

      expect(codes).toBeDefined();
      expect(codes.length).toBe(8);
      expect(Array.isArray(codes)).toBe(true);
    });

    test("should generate backup codes with correct format", () => {
      const codes = generateBackupCodes(5);

      codes.forEach((code) => {
        // Format should be XXXX-XXXX-XXXX (12 alphanumeric chars + 2 dashes)
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
        expect(code.length).toBe(14); // 12 chars + 2 dashes
      });
    });

    test("should generate unique backup codes", () => {
      const codes = generateBackupCodes(10);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });

    test("should validate correct backup code format", () => {
      const validCodes = ["ABCD-1234-EFGH", "1234-5678-9012", "ZZZZ-0000-AAAA"];

      validCodes.forEach((code) => {
        const result = validateBackupCodeFormat(code);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    test("should reject invalid backup code formats", () => {
      const invalidCodes = [
        "123", // Too short
        "ABCD-1234", // Missing third group
        "ABCD-1234-EFGH-5678", // Too long
        "ABCD_1234_EFGH", // Wrong separator (underscores not removed)
        "",
      ];

      invalidCodes.forEach((code) => {
        const result = validateBackupCodeFormat(code);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test("should accept lowercase backup codes (normalized to uppercase)", () => {
      const lowercaseCode = "abcd-1234-efgh";
      const result = validateBackupCodeFormat(lowercaseCode);

      // Function normalizes to uppercase, so lowercase is valid
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test("should hash backup codes securely", async () => {
      const code = "ABCD-1234-EFGH";
      const hash = await hashBackupCode(code);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(code);
      expect(hash.length).toBeGreaterThan(50); // Argon2 hashes are long
      expect(hash).toContain("$argon2"); // Argon2 hash format
    });

    test("should verify valid backup code against hash", async () => {
      const code = "ABCD-1234-EFGH";
      const hash = await hashBackupCode(code);

      const result = await verifyBackupCode(code, [hash]);

      expect(result.isValid).toBe(true);
      expect(result.codeIndex).toBe(0);
    });

    test("should reject invalid backup code", async () => {
      const code = "ABCD-1234-EFGH";
      const wrongCode = "WXYZ-9876-5432";
      const hash = await hashBackupCode(code);

      const result = await verifyBackupCode(wrongCode, [hash]);

      expect(result.isValid).toBe(false);
      expect(result.codeIndex).toBeUndefined();
    });

    test("should handle backup codes with different formats (no dashes)", async () => {
      const code = "ABCD1234EFGH";
      const codeWithDashes = "ABCD-1234-EFGH";
      const hash = await hashBackupCode(codeWithDashes);

      // Should accept code without dashes if it matches
      const result = await verifyBackupCode(code, [hash]);

      expect(result.isValid).toBe(true);
    });

    test("should find correct backup code in array of hashes", async () => {
      const codes = ["AAAA-1111-BBBB", "CCCC-2222-DDDD", "EEEE-3333-FFFF"];
      const hashes = await Promise.all(codes.map(hashBackupCode));

      // Verify the second code
      const result = await verifyBackupCode(codes[1], hashes);

      expect(result.isValid).toBe(true);
      expect(result.codeIndex).toBe(1);
    });
  });

  describe("MFA Setup Requirements Validation", () => {
    test("should validate correct MFA setup", () => {
      const secret = speakeasy.generateSecret({ length: 32 });
      const code = speakeasy.totp({
        secret: secret.base32,
        encoding: "base32",
      });

      const validation = validateMFASetupRequirements(code, secret.base32);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test("should reject MFA setup with invalid code format", () => {
      const secret = speakeasy.generateSecret({ length: 32 });
      const invalidCode = "12345"; // Only 5 digits

      const validation = validateMFASetupRequirements(
        invalidCode,
        secret.base32,
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain("6 digits");
    });

    test("should reject MFA setup with invalid secret", () => {
      const invalidSecret = "not-a-valid-base32-secret!@#";
      const code = "123456";

      const validation = validateMFASetupRequirements(code, invalidSecret);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some((e) => e.includes("secret"))).toBe(true);
    });

    test("should reject MFA setup with incorrect code", () => {
      const secret = speakeasy.generateSecret({ length: 32 });
      const wrongCode = "000000";

      const validation = validateMFASetupRequirements(wrongCode, secret.base32);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(
        validation.errors.some((e) => e.includes("Invalid TOTP code")),
      ).toBe(true);
    });
  });

  describe("Edge Cases and Security", () => {
    test("should handle empty TOTP code gracefully", () => {
      const secret = speakeasy.generateSecret({ length: 32 });

      const result = verifyTOTPCode("", secret.base32);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Invalid code format");
    });

    test("should handle null/undefined TOTP code gracefully", () => {
      const secret = speakeasy.generateSecret({ length: 32 });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result1 = verifyTOTPCode(null as any, secret.base32);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result2 = verifyTOTPCode(undefined as any, secret.base32);

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
    });

    test("should handle invalid secret gracefully", () => {
      const result = verifyTOTPCode("123456", "invalid-secret");

      expect(result.isValid).toBe(false);
      // Error may or may not be set depending on whether speakeasy throws or returns false
    });

    test("should prevent getCurrentTOTPCode in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const secret = speakeasy.generateSecret({ length: 32 });

      expect(() => {
        getCurrentTOTPCode(secret.base32);
      }).toThrow("getCurrentTOTPCode is not available in production");

      process.env.NODE_ENV = originalEnv;
    });

    test("should generate different codes for different secrets", () => {
      const secret1 = speakeasy.generateSecret({ length: 32 });
      const secret2 = speakeasy.generateSecret({ length: 32 });

      const code1 = getCurrentTOTPCode(secret1.base32);
      const code2 = getCurrentTOTPCode(secret2.base32);

      // Codes should be different (statistically almost certain)
      expect(code1).not.toBe(code2);
    });

    test("should handle backup code verification with empty array", async () => {
      const code = "ABCD-1234-EFGH";

      const result = await verifyBackupCode(code, []);

      expect(result.isValid).toBe(false);
      expect(result.codeIndex).toBeUndefined();
    });

    test("should normalize backup codes for verification", async () => {
      const code = "abcd-1234-efgh"; // lowercase with dashes
      const normalizedCode = "ABCD1234EFGH";
      const hash = await hashBackupCode(normalizedCode);

      const result = await verifyBackupCode(code, [hash]);

      expect(result.isValid).toBe(true);
    });
  });
});

describe("MFA Module - Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("End-to-End MFA Setup and Verification", () => {
    test("should successfully enable and verify MFA (complete workflow)", async () => {
      const userEmail = "user@example.com";

      // Step 1: Generate TOTP setup
      const setup = await generateTOTPSetup(userEmail);

      expect(setup.secret).toBeDefined();
      expect(setup.qrCodeUrl).toBeDefined();
      expect(setup.backupCodes.length).toBe(10);

      // Step 2: User scans QR and generates code in authenticator app
      const totpCode = getCurrentTOTPCode(setup.secret);

      // Step 3: Validate setup requirements
      const validation = validateMFASetupRequirements(totpCode, setup.secret);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Step 4: Verify the TOTP code
      const verification = verifyTOTPCode(totpCode, setup.secret);

      expect(verification.isValid).toBe(true);

      // Step 5: Verify one of the backup codes
      const backupCode = setup.backupCodes[0];
      const hashedBackupCodes = await Promise.all(
        setup.backupCodes.map(hashBackupCode),
      );

      const backupVerification = await verifyBackupCode(
        backupCode,
        hashedBackupCodes,
      );

      expect(backupVerification.isValid).toBe(true);
      expect(backupVerification.codeIndex).toBe(0);
    });

    test("should fail MFA verification with incorrect code", async () => {
      const userEmail = "user@example.com";

      // Step 1: Generate TOTP setup
      const setup = await generateTOTPSetup(userEmail);

      // Step 2: User provides wrong code
      const wrongCode = "000000";

      // Step 3: Validation should fail
      const validation = validateMFASetupRequirements(wrongCode, setup.secret);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);

      // Step 4: Verification should fail
      const verification = verifyTOTPCode(wrongCode, setup.secret);

      expect(verification.isValid).toBe(false);
    });

    test("should simulate multiple failed MFA attempts", async () => {
      const userEmail = "user@example.com";
      const setup = await generateTOTPSetup(userEmail);

      const failedAttempts = [];
      const maxAttempts = 5;

      // Simulate multiple failed attempts
      for (let i = 0; i < maxAttempts; i++) {
        const wrongCode = String(i).repeat(6); // "000000", "111111", etc.
        const result = verifyTOTPCode(wrongCode, setup.secret);

        failedAttempts.push({
          attempt: i + 1,
          code: wrongCode,
          isValid: result.isValid,
          timestamp: Date.now(),
        });
      }

      // All attempts should fail
      expect(failedAttempts.every((attempt) => !attempt.isValid)).toBe(true);
      expect(failedAttempts.length).toBe(maxAttempts);

      // This test demonstrates that the MFA verification function itself
      // doesn't implement rate limiting - that's handled at the route level
      // The function can be called multiple times and will consistently reject bad codes
    });

    test("should handle backup code usage workflow", async () => {
      const userEmail = "user@example.com";
      const setup = await generateTOTPSetup(userEmail);

      // Hash all backup codes for storage
      const hashedBackupCodes = await Promise.all(
        setup.backupCodes.map(hashBackupCode),
      );

      // User loses access to authenticator app and uses backup code
      const backupCode = setup.backupCodes[3]; // Use the 4th backup code

      const verification = await verifyBackupCode(
        backupCode,
        hashedBackupCodes,
      );

      expect(verification.isValid).toBe(true);
      expect(verification.codeIndex).toBe(3);

      // Simulate removing the used code (would be done in route handler)
      const remainingCodes = hashedBackupCodes.filter(
        (_, index) => index !== 3,
      );

      expect(remainingCodes.length).toBe(hashedBackupCodes.length - 1);

      // Try to use the same code again - should fail
      const reusedVerification = await verifyBackupCode(
        backupCode,
        remainingCodes,
      );

      expect(reusedVerification.isValid).toBe(false);
    });
  });

  describe("MFA Security Scenarios", () => {
    test("should handle concurrent verification attempts", async () => {
      const userEmail = "user@example.com";
      const setup = await generateTOTPSetup(userEmail);
      const validCode = getCurrentTOTPCode(setup.secret);

      // Simulate concurrent verification attempts
      const verifications = await Promise.all([
        verifyTOTPCode(validCode, setup.secret),
        verifyTOTPCode(validCode, setup.secret),
        verifyTOTPCode(validCode, setup.secret),
      ]);

      // All should succeed (same code, same time window)
      expect(verifications.every((v) => v.isValid)).toBe(true);
    });

    test("should handle time-based code rotation", async () => {
      const secret = speakeasy.generateSecret({ length: 32 });

      // Generate code for current time
      const currentCode = getCurrentTOTPCode(secret.base32);

      // Verify it works
      const result1 = verifyTOTPCode(currentCode, secret.base32);
      expect(result1.isValid).toBe(true);

      // The code should remain valid for the duration of the time step (30 seconds)
      // We can't easily test the rotation without waiting 30+ seconds,
      // but we can verify the code works consistently within the window
      const result2 = verifyTOTPCode(currentCode, secret.base32);
      expect(result2.isValid).toBe(true);
    });

    test("should maintain cryptographic security of backup codes", async () => {
      const codes = generateBackupCodes(10);
      const hashes = await Promise.all(codes.map(hashBackupCode));

      // Verify each hash is unique
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);

      // Verify hashes don't contain original codes
      hashes.forEach((hash, index) => {
        expect(hash).not.toContain(codes[index]);
        expect(hash).toContain("$argon2"); // Argon2 format
      });

      // Verify all original codes can be verified
      for (let i = 0; i < codes.length; i++) {
        const result = await verifyBackupCode(codes[i], hashes);
        expect(result.isValid).toBe(true);
        expect(result.codeIndex).toBe(i);
      }
    });
  });
});
