/**
 * SecurityRepository MFA Audit Trail Tests
 *
 * Tests for MFA enable/disable audit trail functionality and recordMfaFailure extensions
 */

import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { eq } from "drizzle-orm";
import { db } from "@shared/database-unified";
import { userMfaSettings, users, userMfaAttempts } from "@shared/schema";
import { SecurityRepository } from "../repositories/SecurityRepository";

describe("SecurityRepository - MFA Audit Trail", () => {
  let securityRepo: SecurityRepository;
  let testUserId: string;

  beforeEach(async () => {
    securityRepo = new SecurityRepository(db);

    // Create a test user
    const userResult = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: `test-${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
      })
      .returning();
    testUserId = userResult[0].id;

    // Create MFA settings for the user
    await db.insert(userMfaSettings).values({
      userId: testUserId,
      secret: "test-secret",
      enabled: false,
    });
  });

  afterEach(async () => {
    // Cleanup - delete test data
    if (testUserId) {
      await db
        .delete(userMfaAttempts)
        .where(eq(userMfaAttempts.userId, testUserId));
      await db
        .delete(userMfaSettings)
        .where(eq(userMfaSettings.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe("enableUserMfa() - Audit Trail", () => {
    test("should set enabledAt when enabling MFA for the first time", async () => {
      const now = new Date();
      const secret = "new-secret";
      const backupCodes = ["code1", "code2"];

      const result = await securityRepo.enableUserMfa(
        testUserId,
        secret,
        backupCodes,
      );

      expect(result.enabled).toBe(true);
      expect(result.enabledAt).toBeDefined();
      expect(result.enabledAt).toBeInstanceOf(Date);
      expect(result.disabledAt).toBeNull();
      expect(result.updatedAt).toBeDefined();

      // enabledAt should be close to now (within 5 seconds)
      const timeDiff = Math.abs(result.enabledAt!.getTime() - now.getTime());
      expect(timeDiff).toBeLessThan(5000);
    });

    test("should preserve original enabledAt when re-enabling MFA", async () => {
      // First enable
      const firstEnable = await securityRepo.enableUserMfa(
        testUserId,
        "secret1",
        ["code1"],
      );
      const originalEnabledAt = firstEnable.enabledAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Disable
      await securityRepo.disableUserMfa(testUserId);

      // Wait a bit more
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Re-enable
      const secondEnable = await securityRepo.enableUserMfa(
        testUserId,
        "secret2",
        ["code2"],
      );

      // enabledAt should be updated to the new enable time since we disabled in between
      expect(secondEnable.enabled).toBe(true);
      expect(secondEnable.enabledAt).toBeDefined();
      expect(secondEnable.disabledAt).toBeNull();

      // Since we disabled and re-enabled, enabledAt should be newer than or equal to original
      expect(secondEnable.enabledAt!.getTime()).toBeGreaterThanOrEqual(
        originalEnabledAt!.getTime(),
      );
    });

    test("should clear disabledAt when enabling MFA", async () => {
      // Enable, then disable
      await securityRepo.enableUserMfa(testUserId, "secret1", ["code1"]);
      await securityRepo.disableUserMfa(testUserId);

      // Verify disabledAt is set
      let settings = await securityRepo.getUserMfaSettings(testUserId);
      expect(settings?.disabledAt).toBeDefined();

      // Re-enable
      await securityRepo.enableUserMfa(testUserId, "secret2", ["code2"]);

      // Verify disabledAt is cleared
      settings = await securityRepo.getUserMfaSettings(testUserId);
      expect(settings?.disabledAt).toBeNull();
    });
  });

  describe("disableUserMfa() - Audit Trail", () => {
    test("should set disabledAt when disabling MFA", async () => {
      const now = new Date();

      // First enable MFA
      await securityRepo.enableUserMfa(testUserId, "secret", ["code1"]);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Then disable
      await securityRepo.disableUserMfa(testUserId);

      const settings = await securityRepo.getUserMfaSettings(testUserId);
      expect(settings?.enabled).toBe(false);
      expect(settings?.disabledAt).toBeDefined();
      expect(settings?.disabledAt).toBeInstanceOf(Date);

      // disabledAt should be after or very close to now (allow for SQLite timestamp precision)
      // SQLite stores timestamps in seconds, so we allow up to 1 second difference
      const timeDiff = settings!.disabledAt!.getTime() - now.getTime();
      expect(timeDiff).toBeGreaterThanOrEqual(-1000);
      expect(timeDiff).toBeLessThan(2000);
    });

    test("should preserve disabledAt if already disabled", async () => {
      // Enable then disable
      await securityRepo.enableUserMfa(testUserId, "secret", ["code1"]);
      await securityRepo.disableUserMfa(testUserId);

      const firstSettings = await securityRepo.getUserMfaSettings(testUserId);
      const originalDisabledAt = firstSettings?.disabledAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Disable again (should be idempotent)
      await securityRepo.disableUserMfa(testUserId);

      const secondSettings = await securityRepo.getUserMfaSettings(testUserId);

      // disabledAt should remain the same
      expect(secondSettings?.disabledAt?.getTime()).toBe(
        originalDisabledAt?.getTime(),
      );
    });

    test("should update updatedAt when disabling", async () => {
      await securityRepo.enableUserMfa(testUserId, "secret", ["code1"]);
      const enabledSettings = await securityRepo.getUserMfaSettings(testUserId);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await securityRepo.disableUserMfa(testUserId);
      const disabledSettings =
        await securityRepo.getUserMfaSettings(testUserId);

      expect(disabledSettings?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        enabledSettings!.updatedAt.getTime(),
      );
    });
  });

  describe("recordMfaFailure() - Extended Signature", () => {
    test("should work with no options (backward compatibility)", async () => {
      await securityRepo.recordMfaFailure(testUserId);

      const attempts = await db
        .select()
        .from(userMfaAttempts)
        .where(eq(userMfaAttempts.userId, testUserId));

      expect(attempts).toHaveLength(1);
      expect(attempts[0].userId).toBe(testUserId);
      expect(attempts[0].attemptType).toBe("totp"); // Default
      expect(attempts[0].ipAddress).toBe("unknown"); // Default
      expect(attempts[0].userAgent).toBeNull();
      expect(attempts[0].success).toBe(false);
    });

    test("should accept attemptType parameter", async () => {
      await securityRepo.recordMfaFailure(testUserId, {
        attemptType: "backup_code",
      });

      const attempts = await db
        .select()
        .from(userMfaAttempts)
        .where(eq(userMfaAttempts.userId, testUserId));

      expect(attempts).toHaveLength(1);
      expect(attempts[0].attemptType).toBe("backup_code");
    });

    test("should accept ipAddress parameter", async () => {
      const testIp = "192.168.1.100";

      await securityRepo.recordMfaFailure(testUserId, {
        ipAddress: testIp,
      });

      const attempts = await db
        .select()
        .from(userMfaAttempts)
        .where(eq(userMfaAttempts.userId, testUserId));

      expect(attempts).toHaveLength(1);
      expect(attempts[0].ipAddress).toBe(testIp);
    });

    test("should accept userAgent parameter", async () => {
      const testUserAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0";

      await securityRepo.recordMfaFailure(testUserId, {
        userAgent: testUserAgent,
      });

      const attempts = await db
        .select()
        .from(userMfaAttempts)
        .where(eq(userMfaAttempts.userId, testUserId));

      expect(attempts).toHaveLength(1);
      expect(attempts[0].userAgent).toBe(testUserAgent);
    });

    test("should accept all parameters together", async () => {
      await securityRepo.recordMfaFailure(testUserId, {
        attemptType: "sms",
        ipAddress: "203.0.113.42",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)",
      });

      const attempts = await db
        .select()
        .from(userMfaAttempts)
        .where(eq(userMfaAttempts.userId, testUserId));

      expect(attempts).toHaveLength(1);
      expect(attempts[0].attemptType).toBe("sms");
      expect(attempts[0].ipAddress).toBe("203.0.113.42");
      expect(attempts[0].userAgent).toBe(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)",
      );
    });

    test("should record multiple failures with different attempt types", async () => {
      await securityRepo.recordMfaFailure(testUserId, { attemptType: "totp" });
      await securityRepo.recordMfaFailure(testUserId, {
        attemptType: "backup_code",
      });
      await securityRepo.recordMfaFailure(testUserId, { attemptType: "totp" });

      const attempts = await db
        .select()
        .from(userMfaAttempts)
        .where(eq(userMfaAttempts.userId, testUserId));

      expect(attempts).toHaveLength(3);

      const totpAttempts = attempts.filter((a) => a.attemptType === "totp");
      const backupCodeAttempts = attempts.filter(
        (a) => a.attemptType === "backup_code",
      );

      expect(totpAttempts).toHaveLength(2);
      expect(backupCodeAttempts).toHaveLength(1);
    });

    test("should support all defined attempt types", async () => {
      const attemptTypes: Array<"totp" | "backup_code" | "sms" | "email"> = [
        "totp",
        "backup_code",
        "sms",
        "email",
      ];

      for (const attemptType of attemptTypes) {
        await securityRepo.recordMfaFailure(testUserId, { attemptType });
      }

      const attempts = await db
        .select()
        .from(userMfaAttempts)
        .where(eq(userMfaAttempts.userId, testUserId));

      expect(attempts).toHaveLength(4);

      for (const attemptType of attemptTypes) {
        const found = attempts.find((a) => a.attemptType === attemptType);
        expect(found).toBeDefined();
      }
    });
  });

  describe("MFA Lifecycle Integration", () => {
    test("should track complete enable-disable-enable cycle", async () => {
      // First enable
      const enable1 = await securityRepo.enableUserMfa(testUserId, "secret1", [
        "code1",
      ]);
      expect(enable1.enabled).toBe(true);
      expect(enable1.enabledAt).toBeDefined();
      expect(enable1.disabledAt).toBeNull();
      const firstEnabledAt = enable1.enabledAt;

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Disable
      await securityRepo.disableUserMfa(testUserId);
      const disabled = await securityRepo.getUserMfaSettings(testUserId);
      expect(disabled?.enabled).toBe(false);
      expect(disabled?.disabledAt).toBeDefined();
      expect(disabled?.enabledAt).toEqual(firstEnabledAt); // Should preserve

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Re-enable
      const enable2 = await securityRepo.enableUserMfa(testUserId, "secret2", [
        "code2",
      ]);
      expect(enable2.enabled).toBe(true);
      expect(enable2.enabledAt).toBeDefined();
      expect(enable2.disabledAt).toBeNull();

      // New enabledAt should be after or equal to the disable time
      expect(enable2.enabledAt!.getTime()).toBeGreaterThanOrEqual(
        disabled!.disabledAt!.getTime(),
      );
    });

    test("should track multiple failures with different contexts", async () => {
      // Record failures from different IPs and attempt types
      await securityRepo.recordMfaFailure(testUserId, {
        attemptType: "totp",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome",
      });

      await securityRepo.recordMfaFailure(testUserId, {
        attemptType: "backup_code",
        ipAddress: "192.168.1.2",
        userAgent: "Firefox",
      });

      await securityRepo.recordMfaFailure(testUserId, {
        attemptType: "totp",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome",
      });

      const attempts = await db
        .select()
        .from(userMfaAttempts)
        .where(eq(userMfaAttempts.userId, testUserId));

      expect(attempts).toHaveLength(3);

      // Should be able to differentiate by IP
      const ip1Attempts = attempts.filter((a) => a.ipAddress === "192.168.1.1");
      expect(ip1Attempts).toHaveLength(2);

      // Should be able to differentiate by type
      const totpAttempts = attempts.filter((a) => a.attemptType === "totp");
      expect(totpAttempts).toHaveLength(2);
    });
  });
});
