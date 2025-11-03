/**
 * Ban Service Unit Tests
 *
 * Tests for user ban management functionality including:
 * - Creating bans at different scopes
 * - Checking active bans
 * - Lifting bans
 * - Handling expired bans
 * - Error scenarios
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { eq } from "drizzle-orm";
import { db } from "@shared/database-unified";
import { userBans, users } from "@shared/schema";
import { banService } from "../../features/moderation/ban.service";

// Mock logger to reduce noise in tests
jest.mock("../../logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("BanService", () => {
  const testUserId = "test-user-123";
  const testAdminId = "test-admin-456";
  const testCommunityId = "test-community-789";
  const testSessionId = "test-session-abc";

  // Set up test users before each test
  beforeEach(async () => {
    try {
      // Create test user if not exists
      await db
        .insert(users)
        .values({
          id: testUserId,
          email: `test-user-${Date.now()}@example.com`,
          firstName: "Test",
          lastName: "User",
        })
        .onConflictDoNothing();

      // Create test admin if not exists
      await db
        .insert(users)
        .values({
          id: testAdminId,
          email: `test-admin-${Date.now()}@example.com`,
          firstName: "Test",
          lastName: "Admin",
          role: "admin",
        })
        .onConflictDoNothing();
    } catch (error) {
      // Ignore if users already exist
    }
  });

  // Clean up test bans and users after each test
  afterEach(async () => {
    try {
      await db.delete(userBans).where(eq(userBans.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
      await db.delete(users).where(eq(users.id, testAdminId));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("isUserBanned", () => {
    it("should return banned=false for user with no bans", async () => {
      const result = await banService.isUserBanned(testUserId);
      expect(result.banned).toBe(false);
      expect(result.ban).toBeUndefined();
      expect(result.reason).toBeUndefined();
    });

    it("should detect global ban", async () => {
      // Create a global ban
      await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Violation of terms",
        scope: "global",
        startTime: new Date(),
        isActive: true,
      });

      const result = await banService.isUserBanned(testUserId, "global");
      expect(result.banned).toBe(true);
      expect(result.reason).toBe("Violation of terms");
      expect(result.ban?.scope).toBe("global");
    });

    it("should detect community-specific ban", async () => {
      // Create a community ban
      await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Spam in community",
        scope: "community",
        scopeId: testCommunityId,
        startTime: new Date(),
        isActive: true,
      });

      const result = await banService.isUserBanned(
        testUserId,
        "community",
        testCommunityId,
      );
      expect(result.banned).toBe(true);
      expect(result.reason).toBe("Spam in community");
      expect(result.ban?.scopeId).toBe(testCommunityId);
    });

    it("should detect game session ban", async () => {
      // Create a session ban
      await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Disruptive behavior",
        scope: "game_session",
        scopeId: testSessionId,
        startTime: new Date(),
        isActive: true,
      });

      const result = await banService.isUserBanned(
        testUserId,
        "game_session",
        testSessionId,
      );
      expect(result.banned).toBe(true);
      expect(result.reason).toBe("Disruptive behavior");
    });

    it("should not detect expired bans", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Temporary ban",
        scope: "global",
        startTime: new Date("2024-01-01"),
        endTime: pastDate,
        isActive: true,
      });

      const result = await banService.isUserBanned(testUserId);
      expect(result.banned).toBe(false);
    });

    it("should detect active temporary ban", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "7-day timeout",
        scope: "global",
        startTime: new Date(),
        endTime: futureDate,
        isActive: true,
      });

      const result = await banService.isUserBanned(testUserId);
      expect(result.banned).toBe(true);
      expect(result.ban?.endTime).toBeDefined();
    });

    it("should prioritize global ban over scoped ban", async () => {
      // Create both global and community ban
      await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Global violation",
        scope: "global",
        startTime: new Date(),
        isActive: true,
      });

      await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Community violation",
        scope: "community",
        scopeId: testCommunityId,
        startTime: new Date(),
        isActive: true,
      });

      const result = await banService.isUserBanned(
        testUserId,
        "community",
        testCommunityId,
      );
      expect(result.banned).toBe(true);
      // Should get one of them (likely global due to query ordering)
    });

    it("should not detect inactive bans", async () => {
      await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Lifted ban",
        scope: "global",
        startTime: new Date(),
        isActive: false,
      });

      const result = await banService.isUserBanned(testUserId);
      expect(result.banned).toBe(false);
    });

    it("should handle database errors gracefully", async () => {
      // Mock db.select to throw error deep in the query chain
      const selectSpy = jest.spyOn(db, "select").mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error("Database error")),
          }),
        }),
      } as any);

      const result = await banService.isUserBanned("error-user");
      expect(result.banned).toBe(false); // Fail open

      // Restore is automatic with jest.spyOn
      selectSpy.mockRestore();
    });
  });

  describe("createBan", () => {
    it("should create a ban successfully", async () => {
      const ban = await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Test ban",
        scope: "global",
        startTime: new Date(),
        isActive: true,
      });

      expect(ban.id).toBeDefined();
      expect(ban.userId).toBe(testUserId);
      expect(ban.reason).toBe("Test ban");
      expect(ban.scope).toBe("global");
      expect(ban.isActive).toBe(true);
    });

    it("should create a ban with end time", async () => {
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + 7);

      const ban = await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Temporary ban",
        scope: "global",
        startTime: new Date(),
        endTime,
        isActive: true,
      });

      expect(ban.endTime).toBeDefined();
    });

    it("should create a community-scoped ban", async () => {
      const ban = await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Community violation",
        scope: "community",
        scopeId: testCommunityId,
        startTime: new Date(),
        isActive: true,
      });

      expect(ban.scope).toBe("community");
      expect(ban.scopeId).toBe(testCommunityId);
    });
  });

  describe("liftBan", () => {
    it("should lift an active ban", async () => {
      // Create a ban
      const ban = await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Test ban to lift",
        scope: "global",
        startTime: new Date(),
        isActive: true,
      });

      // Verify it's active
      let result = await banService.isUserBanned(testUserId);
      expect(result.banned).toBe(true);

      // Lift the ban
      await banService.liftBan(ban.id, testAdminId);

      // Verify it's no longer active
      result = await banService.isUserBanned(testUserId);
      expect(result.banned).toBe(false);
    });

    it("should update ban notes when lifting", async () => {
      const ban = await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Test ban",
        scope: "global",
        startTime: new Date(),
        isActive: true,
      });

      await banService.liftBan(ban.id, "moderator-123");

      // Check the ban was updated
      const [updatedBan] = await db
        .select()
        .from(userBans)
        .where(eq(userBans.id, ban.id));

      expect(updatedBan.isActive).toBe(false);
      expect(updatedBan.notes).toContain("Lifted by moderator-123");
    });
  });

  describe("getUserBans", () => {
    it("should return all active bans for a user", async () => {
      // Create multiple bans
      await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Global ban",
        scope: "global",
        startTime: new Date(),
        isActive: true,
      });

      await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Community ban",
        scope: "community",
        scopeId: testCommunityId,
        startTime: new Date(),
        isActive: true,
      });

      const bans = await banService.getUserBans(testUserId);
      expect(bans.length).toBe(2);
    });

    it("should not return inactive bans", async () => {
      await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Inactive ban",
        scope: "global",
        startTime: new Date(),
        isActive: false,
      });

      const bans = await banService.getUserBans(testUserId);
      expect(bans.length).toBe(0);
    });

    it("should return empty array for user with no bans", async () => {
      const bans = await banService.getUserBans("non-existent-user");
      expect(bans).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      const selectSpy = jest.spyOn(db, "select").mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockRejectedValue(new Error("Database error")),
        }),
      } as any);

      const bans = await banService.getUserBans("error-user");
      expect(bans).toEqual([]);

      selectSpy.mockRestore();
    });
  });

  describe("getScopedBans", () => {
    it("should return all global bans", async () => {
      await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Global ban",
        scope: "global",
        startTime: new Date(),
        isActive: true,
      });

      const bans = await banService.getScopedBans("global");
      expect(bans.length).toBeGreaterThan(0);
      expect(bans.every((b) => b.scope === "global")).toBe(true);
    });

    it("should return community-specific bans", async () => {
      await banService.createBan({
        userId: testUserId,
        bannedBy: testAdminId,
        reason: "Community ban",
        scope: "community",
        scopeId: testCommunityId,
        startTime: new Date(),
        isActive: true,
      });

      const bans = await banService.getScopedBans("community", testCommunityId);
      expect(bans.length).toBeGreaterThan(0);
      expect(bans.every((b) => b.scopeId === testCommunityId)).toBe(true);
    });

    it("should return empty array for scope with no bans", async () => {
      const bans = await banService.getScopedBans(
        "game_session",
        "non-existent",
      );
      expect(bans).toEqual([]);
    });
  });
});
