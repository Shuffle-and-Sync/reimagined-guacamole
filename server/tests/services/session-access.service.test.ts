/**
 * Session Access Service Unit Tests
 *
 * Tests for game session access control including:
 * - Public/private/invite-only session access
 * - Password protection
 * - Spectator limits
 * - Community membership requirements
 * - Invitation system
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import bcryptjs from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@shared/database-unified";
import {
  gameSessions,
  sessionInvitations,
  userCommunities,
  users,
  communities,
  games,
} from "@shared/schema";
import { sessionAccessService } from "../../features/game-sessions/session-access.service";

// Mock logger
jest.mock("../../logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("SessionAccessService", () => {
  const testUserId = "test-user-123";
  const testHostId = "test-host-456";
  let testSessionId: string; // Make dynamic
  let testCommunityId: string; // Make dynamic for test isolation
  let testGameId: string; // Make dynamic for test isolation

  // Set up test data before each test
  beforeEach(async () => {
    // Generate unique IDs for each test
    testSessionId = `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    testCommunityId = `test-community-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    testGameId = `test-game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Create test game
      await db.insert(games).values({
        id: testGameId,
        name: "Test Game",
        code: `TEST-${Date.now()}`,
        isActive: true,
      });

      // Create test users
      await db.insert(users).values([
        {
          id: testUserId,
          email: `test-user-${Date.now()}@example.com`,
          firstName: "Test",
          lastName: "User",
        },
        {
          id: testHostId,
          email: `test-host-${Date.now()}@example.com`,
          firstName: "Test",
          lastName: "Host",
        },
      ]);

      // Create test community with correct schema (no gameId or creatorId)
      await db.insert(communities).values({
        id: testCommunityId,
        name: `Test Community ${Date.now()}`,
        displayName: "Test Community",
        description: "A test community",
        themeColor: "#000000",
        iconClass: "game-icon",
        isActive: true,
      });
    } catch (error) {
      // Ignore if already exists
      console.error("Setup error:", error);
    }
  });

  // Clean up after tests
  afterEach(async () => {
    try {
      await db
        .delete(sessionInvitations)
        .where(eq(sessionInvitations.inviteeId, testUserId));
      await db.delete(gameSessions).where(eq(gameSessions.id, testSessionId));
      await db
        .delete(userCommunities)
        .where(eq(userCommunities.userId, testUserId));
      await db.delete(communities).where(eq(communities.id, testCommunityId));
      await db.delete(users).where(eq(users.id, testUserId));
      await db.delete(users).where(eq(users.id, testHostId));
      await db.delete(games).where(eq(games.id, testGameId));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("canAccessSession - Public Sessions", () => {
    it("should allow access to public session as player", async () => {
      // Create a public session
      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testHostId,
        gameType: "mtg",
        visibility: "public",
        status: "waiting",
        allowSpectators: true,
        maxSpectators: 10,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: "[]",
      });

      const result = await sessionAccessService.canAccessSession(
        testUserId,
        testSessionId,
        "player",
      );

      expect(result.allowed).toBe(true);
    });

    it("should allow access to public session as spectator", async () => {
      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testHostId,
        gameType: "mtg",
        visibility: "public",
        status: "waiting",
        allowSpectators: true,
        maxSpectators: 10,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: "[]",
      });

      const result = await sessionAccessService.canAccessSession(
        testUserId,
        testSessionId,
        "spectator",
      );

      expect(result.allowed).toBe(true);
    });

    it("should deny spectator access when spectators not allowed", async () => {
      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testHostId,
        gameType: "mtg",
        visibility: "public",
        status: "waiting",
        allowSpectators: false,
        maxSpectators: 10,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: "[]",
      });

      const result = await sessionAccessService.canAccessSession(
        testUserId,
        testSessionId,
        "spectator",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Spectators not allowed");
    });

    it("should deny access when spectator limit reached", async () => {
      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testHostId,
        gameType: "mtg",
        visibility: "public",
        status: "waiting",
        allowSpectators: true,
        maxSpectators: 2,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: '["user1", "user2"]', // 2 spectators already
      });

      const result = await sessionAccessService.canAccessSession(
        testUserId,
        testSessionId,
        "spectator",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Spectator limit reached");
    });

    it("should require password for password-protected session", async () => {
      const hashedPassword = await bcryptjs.hash("secret123", 10);

      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testHostId,
        gameType: "mtg",
        visibility: "public",
        status: "waiting",
        password: hashedPassword,
        allowSpectators: true,
        maxSpectators: 10,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: "[]",
      });

      // Without password
      const resultNoPass = await sessionAccessService.canAccessSession(
        testUserId,
        testSessionId,
        "player",
      );
      expect(resultNoPass.allowed).toBe(false);
      expect(resultNoPass.reason).toBe("Password required");

      // With wrong password
      const resultWrongPass = await sessionAccessService.canAccessSession(
        testUserId,
        testSessionId,
        "player",
        "wrongpassword",
      );
      expect(resultWrongPass.allowed).toBe(false);
      expect(resultWrongPass.reason).toBe("Incorrect password");

      // With correct password
      const resultCorrectPass = await sessionAccessService.canAccessSession(
        testUserId,
        testSessionId,
        "player",
        "secret123",
      );
      expect(resultCorrectPass.allowed).toBe(true);
    });

    it("should always allow host access", async () => {
      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testUserId, // User is the host
        gameType: "mtg",
        visibility: "private",
        status: "waiting",
        allowSpectators: true,
        maxSpectators: 10,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: "[]",
      });

      const result = await sessionAccessService.canAccessSession(
        testUserId,
        testSessionId,
        "player",
      );

      expect(result.allowed).toBe(true);
    });
  });

  describe("canAccessSession - Private/Invite-Only Sessions", () => {
    it("should deny access to private session without invitation", async () => {
      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testHostId,
        gameType: "mtg",
        visibility: "private",
        status: "waiting",
        allowSpectators: true,
        maxSpectators: 10,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: "[]",
      });

      const result = await sessionAccessService.canAccessSession(
        testUserId,
        testSessionId,
        "player",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Invitation required");
      expect(result.requiresInvite).toBe(true);
    });

    it("should allow access with accepted invitation", async () => {
      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testHostId,
        gameType: "mtg",
        visibility: "invite_only",
        status: "waiting",
        allowSpectators: true,
        maxSpectators: 10,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: "[]",
      });

      // Create an accepted invitation
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await db.insert(sessionInvitations).values({
        id: "invitation-123",
        sessionId: testSessionId,
        inviterId: testHostId,
        inviteeId: testUserId,
        role: "player",
        status: "accepted",
        expiresAt,
        createdAt: new Date(),
      });

      const result = await sessionAccessService.canAccessSession(
        testUserId,
        testSessionId,
        "player",
      );

      expect(result.allowed).toBe(true);
    });

    it("should deny access with invitation for wrong role", async () => {
      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testHostId,
        gameType: "mtg",
        visibility: "invite_only",
        status: "waiting",
        allowSpectators: true,
        maxSpectators: 10,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: "[]",
      });

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Invitation is for spectator
      await db.insert(sessionInvitations).values({
        id: "invitation-456",
        sessionId: testSessionId,
        inviterId: testHostId,
        inviteeId: testUserId,
        role: "spectator",
        status: "accepted",
        expiresAt,
        createdAt: new Date(),
      });

      // Try to join as player
      const result = await sessionAccessService.canAccessSession(
        testUserId,
        testSessionId,
        "player",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Invited as spectator");
    });
  });

  describe("canAccessSession - Community-Only Sessions", () => {
    it("should deny access to non-members", async () => {
      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testHostId,
        gameType: "mtg",
        visibility: "community_only",
        communityId: testCommunityId,
        status: "waiting",
        allowSpectators: true,
        maxSpectators: 10,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: "[]",
      });

      const result = await sessionAccessService.canAccessSession(
        testUserId,
        testSessionId,
        "player",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Must be a community member");
    });

    it("should allow access to community members", async () => {
      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testHostId,
        gameType: "mtg",
        visibility: "community_only",
        communityId: testCommunityId,
        status: "waiting",
        allowSpectators: true,
        maxSpectators: 10,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: "[]",
      });

      // Add user to community
      await db.insert(userCommunities).values({
        id: "membership-123",
        userId: testUserId,
        communityId: testCommunityId,
        isPrimary: false,
        joinedAt: new Date(),
      });

      const result = await sessionAccessService.canAccessSession(
        testUserId,
        testSessionId,
        "player",
      );

      expect(result.allowed).toBe(true);
    });

    it("should return error for session not found", async () => {
      const result = await sessionAccessService.canAccessSession(
        testUserId,
        "non-existent-session",
        "player",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Session not found");
    });
  });

  describe("createInvitation", () => {
    beforeEach(async () => {
      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testHostId,
        gameType: "mtg",
        visibility: "invite_only",
        status: "waiting",
        allowSpectators: true,
        maxSpectators: 10,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: "[]",
      });
    });

    it("should create invitation successfully", async () => {
      const invitation = await sessionAccessService.createInvitation({
        sessionId: testSessionId,
        inviterId: testHostId,
        inviteeId: testUserId,
        role: "player",
        message: "Join my game!",
      });

      expect(invitation.id).toBeDefined();
      expect(invitation.sessionId).toBe(testSessionId);
      expect(invitation.inviteeId).toBe(testUserId);
      expect(invitation.role).toBe("player");
      expect(invitation.status).toBe("pending");
      expect(invitation.message).toBe("Join my game!");
    });

    it("should set default expiration of 48 hours", async () => {
      const invitation = await sessionAccessService.createInvitation({
        sessionId: testSessionId,
        inviterId: testHostId,
        inviteeId: testUserId,
        role: "player",
      });

      const expiresAt = new Date(invitation.expiresAt);
      const now = new Date();
      const hoursDiff =
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeGreaterThan(47);
      expect(hoursDiff).toBeLessThan(49);
    });

    it("should accept custom expiration time", async () => {
      const invitation = await sessionAccessService.createInvitation({
        sessionId: testSessionId,
        inviterId: testHostId,
        inviteeId: testUserId,
        role: "spectator",
        expiresInHours: 12,
      });

      const expiresAt = new Date(invitation.expiresAt);
      const now = new Date();
      const hoursDiff =
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeGreaterThan(11);
      expect(hoursDiff).toBeLessThan(13);
    });
  });

  describe("respondToInvitation", () => {
    let invitationId: string;

    beforeEach(async () => {
      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testHostId,
        gameType: "mtg",
        visibility: "invite_only",
        status: "waiting",
        allowSpectators: true,
        maxSpectators: 10,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: "[]",
      });

      const invitation = await sessionAccessService.createInvitation({
        sessionId: testSessionId,
        inviterId: testHostId,
        inviteeId: testUserId,
        role: "player",
      });
      invitationId = invitation.id;
    });

    it("should accept invitation successfully", async () => {
      const result = await sessionAccessService.respondToInvitation(
        invitationId,
        testUserId,
        true,
      );

      expect(result.status).toBe("accepted");
      expect(result.respondedAt).toBeDefined();
    });

    it("should decline invitation successfully", async () => {
      const result = await sessionAccessService.respondToInvitation(
        invitationId,
        testUserId,
        false,
      );

      expect(result.status).toBe("declined");
      expect(result.respondedAt).toBeDefined();
    });

    it("should reject response from wrong user", async () => {
      await expect(
        sessionAccessService.respondToInvitation(
          invitationId,
          "wrong-user-id",
          true,
        ),
      ).rejects.toThrow("Not authorized to respond to this invitation");
    });

    it("should reject response to already responded invitation", async () => {
      // First response
      await sessionAccessService.respondToInvitation(
        invitationId,
        testUserId,
        true,
      );

      // Second response should fail
      await expect(
        sessionAccessService.respondToInvitation(
          invitationId,
          testUserId,
          false,
        ),
      ).rejects.toThrow("Invitation already responded to");
    });

    it("should reject response to non-existent invitation", async () => {
      await expect(
        sessionAccessService.respondToInvitation(
          "non-existent-id",
          testUserId,
          true,
        ),
      ).rejects.toThrow("Invitation not found");
    });
  });

  describe("getUserInvitations", () => {
    beforeEach(async () => {
      await db.insert(gameSessions).values({
        id: testSessionId,
        hostId: testHostId,
        gameType: "mtg",
        visibility: "invite_only",
        status: "waiting",
        allowSpectators: true,
        maxSpectators: 10,
        requireApproval: false,
        createdAt: new Date(),
        currentPlayers: 0,
        spectators: "[]",
      });
    });

    it("should return pending invitations", async () => {
      // Create invitations
      await sessionAccessService.createInvitation({
        sessionId: testSessionId,
        inviterId: testHostId,
        inviteeId: testUserId,
        role: "player",
      });

      const invitations =
        await sessionAccessService.getUserInvitations(testUserId);
      expect(invitations.length).toBeGreaterThan(0);
      expect(invitations.every((inv) => inv.status === "pending")).toBe(true);
    });

    it("should not return accepted invitations", async () => {
      const invitation = await sessionAccessService.createInvitation({
        sessionId: testSessionId,
        inviterId: testHostId,
        inviteeId: testUserId,
        role: "player",
      });

      // Accept the invitation
      await sessionAccessService.respondToInvitation(
        invitation.id,
        testUserId,
        true,
      );

      const invitations =
        await sessionAccessService.getUserInvitations(testUserId);
      expect(invitations.length).toBe(0);
    });

    it("should return empty array for user with no invitations", async () => {
      const invitations = await sessionAccessService.getUserInvitations(
        "user-with-no-invites",
      );
      expect(invitations).toEqual([]);
    });
  });
});
