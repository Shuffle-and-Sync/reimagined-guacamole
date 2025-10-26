/**
 * Database Schema Validation Tests
 * Tests Zod validation schemas for critical tables
 */

import { describe, it, expect } from "@jest/globals";
import {
  insertStreamSessionCoHostSchema,
  insertStreamSessionPlatformSchema,
  insertCollaborationRequestSchema,
  insertUserPlatformAccountSchema,
  insertTournamentRoundSchema,
  insertTournamentMatchSchema,
  insertMatchResultSchema,
} from "@shared/schema";

describe("Database Schema Validation", () => {
  describe("insertStreamSessionCoHostSchema", () => {
    it("should validate valid co-host data", () => {
      const validData = {
        sessionId: "session-123",
        userId: "user-456",
        role: "co_host",
      };

      const result = insertStreamSessionCoHostSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate all role types", () => {
      const roles = ["co_host", "moderator", "guest"];

      roles.forEach((role) => {
        const data = {
          sessionId: "session-123",
          userId: "user-456",
          role,
        };

        const result = insertStreamSessionCoHostSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid role", () => {
      const invalidData = {
        sessionId: "session-123",
        userId: "user-456",
        role: "invalid_role",
      };

      const result = insertStreamSessionCoHostSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("insertStreamSessionPlatformSchema", () => {
    it("should validate valid platform data", () => {
      const validData = {
        sessionId: "session-123",
        platform: "twitch",
        status: "idle",
      };

      const result = insertStreamSessionPlatformSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate all platforms", () => {
      const platforms = ["twitch", "youtube", "facebook", "kick"];

      platforms.forEach((platform) => {
        const data = {
          sessionId: "session-123",
          platform,
        };

        const result = insertStreamSessionPlatformSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should reject negative viewer count", () => {
      const invalidData = {
        sessionId: "session-123",
        platform: "twitch",
        viewerCount: -10,
      };

      const result = insertStreamSessionPlatformSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept zero viewer count", () => {
      const validData = {
        sessionId: "session-123",
        platform: "twitch",
        viewerCount: 0,
      };

      const result = insertStreamSessionPlatformSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("insertCollaborationRequestSchema", () => {
    it("should validate valid collaboration request", () => {
      const validData = {
        fromUserId: "user-123",
        toUserId: "user-456",
        message: "Let's collaborate!",
        status: "pending",
      };

      const result = insertCollaborationRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate all status types", () => {
      const statuses = [
        "pending",
        "accepted",
        "declined",
        "expired",
        "cancelled",
      ];

      statuses.forEach((status) => {
        const data = {
          fromUserId: "user-123",
          toUserId: "user-456",
          status,
        };

        const result = insertCollaborationRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should reject message exceeding 1000 characters", () => {
      const invalidData = {
        fromUserId: "user-123",
        toUserId: "user-456",
        message: "a".repeat(1001),
      };

      const result = insertCollaborationRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("insertUserPlatformAccountSchema", () => {
    it("should validate valid platform account", () => {
      const validData = {
        userId: "user-123",
        platform: "twitch",
        handle: "streamer123",
        platformUserId: "twitch-456",
      };

      const result = insertUserPlatformAccountSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty handle", () => {
      const invalidData = {
        userId: "user-123",
        platform: "twitch",
        handle: "",
        platformUserId: "twitch-456",
      };

      const result = insertUserPlatformAccountSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty platformUserId", () => {
      const invalidData = {
        userId: "user-123",
        platform: "twitch",
        handle: "streamer123",
        platformUserId: "",
      };

      const result = insertUserPlatformAccountSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("insertTournamentRoundSchema", () => {
    it("should validate valid tournament round", () => {
      const validData = {
        tournamentId: "tournament-123",
        roundNumber: 1,
        status: "pending",
      };

      const result = insertTournamentRoundSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject zero round number", () => {
      const invalidData = {
        tournamentId: "tournament-123",
        roundNumber: 0,
      };

      const result = insertTournamentRoundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject negative round number", () => {
      const invalidData = {
        tournamentId: "tournament-123",
        roundNumber: -1,
      };

      const result = insertTournamentRoundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("insertTournamentMatchSchema", () => {
    it("should validate valid tournament match", () => {
      const validData = {
        tournamentId: "tournament-123",
        roundId: "round-123",
        matchNumber: 1,
        player1Id: "player-1",
        player2Id: "player-2",
        status: "pending",
      };

      const result = insertTournamentMatchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate all status types", () => {
      const statuses = ["pending", "in_progress", "completed", "cancelled"];

      statuses.forEach((status) => {
        const data = {
          tournamentId: "tournament-123",
          roundId: "round-123",
          matchNumber: 1,
          player1Id: "player-1",
          player2Id: "player-2",
          status,
        };

        const result = insertTournamentMatchSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("insertMatchResultSchema", () => {
    it("should validate valid match result", () => {
      const validData = {
        matchId: "match-123",
        winnerId: "player-1",
        player1Score: 2,
        player2Score: 1,
        reportedBy: "user-123",
      };

      const result = insertMatchResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject negative scores", () => {
      const invalidData = {
        matchId: "match-123",
        player1Score: -1,
        reportedBy: "user-123",
      };

      const result = insertMatchResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept zero scores", () => {
      const validData = {
        matchId: "match-123",
        player1Score: 0,
        player2Score: 0,
        reportedBy: "user-123",
      };

      const result = insertMatchResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject notes exceeding 1000 characters", () => {
      const invalidData = {
        matchId: "match-123",
        reportedBy: "user-123",
        notes: "a".repeat(1001),
      };

      const result = insertMatchResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
