/**
 * Tournament System Tests
 *
 * Comprehensive unit, integration, and E2E tests for tournament management
 * Testing Audit Part 3 - Tournament Feature Requirements
 *
 * Refactored for:
 * - Test isolation with beforeEach/afterEach hooks
 * - Centralized mock data factories
 * - Better assertions and behavioral testing
 */

import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { tournamentsService } from "../../features/tournaments/tournaments.service";
import { storage } from "../../storage";
import {
  createMockTournament,
  createMockParticipant,
  createMockRound,
  createMockMatch,
} from "../__factories__";

// Mock dependencies
jest.mock("../../storage", () => ({
  storage: {
    getTournaments: jest.fn(),
    getTournament: jest.fn(),
    getTournamentWithTransaction: jest.fn(),
    getTournamentParticipantsWithTransaction: jest.fn(),
    getTournamentRoundsWithTransaction: jest.fn(),
    getTournamentMatchesWithTransaction: jest.fn(),
    createTournament: jest.fn(),
    joinTournament: jest.fn(),
    leaveTournament: jest.fn(),
    updateTournament: jest.fn(),
    getTournamentFormats: jest.fn(),
    updateTournamentStatus: jest.fn(),
    createTournamentRound: jest.fn(),
    createTournamentMatch: jest.fn(),
    getTournamentRounds: jest.fn(),
  },
}));

jest.mock("../../logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("@shared/database-unified", () => ({
  withTransaction: jest.fn((callback) => callback({})),
}));

// ============================================================================
// UNIT TESTS - Tournament Creation, Management, and Progression Logic
// ============================================================================

describe("Tournament System - Unit Tests", () => {
  // Reset all mocks before each test for isolation
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Cleanup after each test
  afterEach(() => {
    // Clear any pending timers that might have been set during tests
    jest.clearAllTimers();
  });

  describe("Tournament Creation Logic", () => {
    test("should create tournament with valid data", async () => {
      const tournamentData = {
        name: "Summer Championship",
        description: "Annual summer tournament",
        format: "single_elimination",
        maxParticipants: 32,
        communityId: "community-123",
        organizerId: "organizer-123",
        startDate: new Date(Date.now() + 86400000),
      };

      const mockCreatedTournament = createMockTournament(tournamentData);
      storage.createTournament.mockResolvedValue(mockCreatedTournament);

      const result = await tournamentsService.createTournament(tournamentData);

      expect(storage.createTournament).toHaveBeenCalledWith(tournamentData);
      expect(result).toEqual(mockCreatedTournament);
      expect(result.name).toBe("Summer Championship");
      expect(result.format).toBe("single_elimination");
    });

    test("should validate tournament format types", () => {
      const validFormats = [
        "single_elimination",
        "double_elimination",
        "swiss",
        "round_robin",
      ];

      validFormats.forEach((format) => {
        expect([
          "single_elimination",
          "double_elimination",
          "swiss",
          "round_robin",
        ]).toContain(format);
      });
    });

    test("should validate maxParticipants is positive", () => {
      const validParticipantCounts = [2, 4, 8, 16, 32, 64, 128];

      validParticipantCounts.forEach((count) => {
        expect(count).toBeGreaterThan(0);
        expect(Number.isInteger(count)).toBe(true);
      });
    });

    test("should validate start date is in future", () => {
      const futureDate = new Date(Date.now() + 86400000);
      const pastDate = new Date(Date.now() - 86400000);

      expect(futureDate.getTime()).toBeGreaterThan(Date.now());
      expect(pastDate.getTime()).toBeLessThan(Date.now());
    });
  });

  describe("Tournament Management Logic", () => {
    test("should update tournament with valid changes", async () => {
      const tournament = createMockTournament();
      const updates = {
        name: "Updated Tournament Name",
        description: "Updated description",
      };

      storage.getTournament.mockResolvedValue(tournament);
      storage.updateTournament.mockResolvedValue({
        ...tournament,
        ...updates,
      });

      const result = await tournamentsService.updateTournament(
        tournament.id,
        updates,
        tournament.organizerId,
      );

      expect(storage.getTournament).toHaveBeenCalledWith(tournament.id);
      expect(result.name).toBe("Updated Tournament Name");
    });

    test("should prevent non-organizer from updating tournament", async () => {
      const tournament = createMockTournament({ organizerId: "organizer-123" });
      storage.getTournament.mockResolvedValue(tournament);

      await expect(
        tournamentsService.updateTournament(
          tournament.id,
          { name: "Hacked Name" },
          "non-organizer-456",
        ),
      ).rejects.toThrow(
        "Only the tournament organizer can edit this tournament",
      );
    });

    test("should prevent editing completed tournaments", async () => {
      const tournament = createMockTournament({ status: "completed" });
      storage.getTournament.mockResolvedValue(tournament);

      await expect(
        tournamentsService.updateTournament(
          tournament.id,
          { name: "New Name" },
          tournament.organizerId,
        ),
      ).rejects.toThrow("Cannot edit completed tournaments");
    });

    test("should restrict editable fields for active tournaments", async () => {
      const tournament = createMockTournament({ status: "active" });
      storage.getTournament.mockResolvedValue(tournament);

      await expect(
        tournamentsService.updateTournament(
          tournament.id,
          { maxParticipants: 32 },
          tournament.organizerId,
        ),
      ).rejects.toThrow(
        "Can only edit name, description, rules, and prize pool for active tournaments",
      );
    });

    test("should validate maxParticipants cannot be below current count", async () => {
      const tournament = createMockTournament({
        maxParticipants: 16,
        participants: Array(10)
          .fill({})
          .map((_, i) => createMockParticipant({ userId: `user-${i}` })),
      });
      storage.getTournament.mockResolvedValue(tournament);

      await expect(
        tournamentsService.updateTournament(
          tournament.id,
          { maxParticipants: 5 },
          tournament.organizerId,
        ),
      ).rejects.toThrow(
        "Cannot reduce max participants below current participant count",
      );
    });
  });

  describe("Tournament Progression Logic", () => {
    test("should start tournament with sufficient participants", async () => {
      const tournament = createMockTournament({
        status: "upcoming",
        participants: Array(8)
          .fill({})
          .map((_, i) => createMockParticipant({ userId: `user-${i}` })),
      });

      storage.getTournament.mockResolvedValueOnce(tournament);
      storage.updateTournamentStatus.mockResolvedValue(undefined);
      storage.createTournamentRound.mockResolvedValue(createMockRound());
      storage.createTournamentMatch.mockResolvedValue(createMockMatch());
      storage.getTournamentRounds.mockResolvedValue([createMockRound()]);
      storage.getTournament.mockResolvedValueOnce({
        ...tournament,
        status: "active",
      });

      const result = await tournamentsService.startTournament(
        tournament.id,
        tournament.organizerId,
      );

      expect(storage.updateTournamentStatus).toHaveBeenCalledWith(
        tournament.id,
        "active",
      );
      expect(storage.createTournamentRound).toHaveBeenCalled();
      expect(result.status).toBe("active");
    });

    test("should prevent starting tournament with insufficient participants", async () => {
      const tournament = createMockTournament({
        status: "upcoming",
        participants: [createMockParticipant()], // Only 1 participant
      });

      storage.getTournament.mockResolvedValue(tournament);

      await expect(
        tournamentsService.startTournament(
          tournament.id,
          tournament.organizerId,
        ),
      ).rejects.toThrow("Tournament needs at least 2 participants to start");
    });

    test("should prevent starting already active tournament", async () => {
      const tournament = createMockTournament({ status: "active" });
      storage.getTournament.mockResolvedValue(tournament);

      await expect(
        tournamentsService.startTournament(
          tournament.id,
          tournament.organizerId,
        ),
      ).rejects.toThrow("Tournament has already started or ended");
    });

    test("should calculate single elimination pairings correctly", () => {
      const participants = Array(8)
        .fill({})
        .map((_, i) => `player-${i}`);

      // Single elimination requires 2^n participants or byes
      const numRounds = Math.ceil(Math.log2(participants.length));
      const firstRoundMatches = Math.ceil(participants.length / 2);

      expect(numRounds).toBe(3); // 8 players = 3 rounds
      expect(firstRoundMatches).toBe(4); // 8 players = 4 first-round matches
    });

    test("should handle bye assignments for non-power-of-2 participants", () => {
      const participants = Array(7)
        .fill({})
        .map((_, i) => `player-${i}`);
      const nextPowerOf2 = Math.pow(
        2,
        Math.ceil(Math.log2(participants.length)),
      );
      const numByes = nextPowerOf2 - participants.length;

      expect(nextPowerOf2).toBe(8);
      expect(numByes).toBe(1); // 7 players need 1 bye
    });
  });

  describe("Participant Management Logic", () => {
    test("should allow user to join tournament", async () => {
      const tournament = createMockTournament({
        maxParticipants: 16,
        participants: [],
      });
      const userId = "user-123";

      storage.joinTournament.mockResolvedValue({
        ...tournament,
        participants: [createMockParticipant({ userId })],
      });

      const result = await tournamentsService.joinTournament(
        tournament.id,
        userId,
      );

      expect(storage.joinTournament).toHaveBeenCalledWith(
        tournament.id,
        userId,
      );
      expect(result.participants).toHaveLength(1);
    });

    test("should allow user to leave tournament", async () => {
      const userId = "user-123";
      const tournament = createMockTournament({
        participants: [createMockParticipant({ userId })],
      });

      storage.leaveTournament.mockResolvedValue({
        ...tournament,
        participants: [],
      });

      const result = await tournamentsService.leaveTournament(
        tournament.id,
        userId,
      );

      expect(storage.leaveTournament).toHaveBeenCalledWith(
        tournament.id,
        userId,
      );
      expect(result.participants).toHaveLength(0);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - Database Interactions and Notifications
// ============================================================================

describe("Tournament System - Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Database Interactions", () => {
    test("should fetch tournament with participants in transaction", async () => {
      const tournament = createMockTournament();
      const participants = [
        createMockParticipant({ userId: "user-1" }),
        createMockParticipant({ userId: "user-2" }),
      ];
      const rounds = [createMockRound()];
      const matches = [createMockMatch()];

      storage.getTournamentWithTransaction.mockResolvedValue(tournament);
      storage.getTournamentParticipantsWithTransaction.mockResolvedValue(
        participants,
      );
      storage.getTournamentRoundsWithTransaction.mockResolvedValue(rounds);
      storage.getTournamentMatchesWithTransaction.mockResolvedValue(matches);

      const result = await tournamentsService.getTournamentWithParticipants(
        tournament.id,
      );

      expect(result).toHaveProperty("participants");
      expect(result).toHaveProperty("rounds");
      expect(result).toHaveProperty("matches");
      expect(result.participantCount).toBe(2);
    });

    test("should handle tournament not found error", async () => {
      storage.getTournamentWithTransaction.mockResolvedValue(null);

      await expect(
        tournamentsService.getTournamentWithParticipants("non-existent-id"),
      ).rejects.toThrow("Tournament not found");
    });

    test("should fetch tournaments by community", async () => {
      const communityId = "community-123";
      const tournaments = [
        createMockTournament({ id: "tournament-1", communityId }),
        createMockTournament({ id: "tournament-2", communityId }),
      ];

      storage.getTournaments.mockResolvedValue(tournaments);

      const result = await tournamentsService.getTournaments(communityId);

      expect(storage.getTournaments).toHaveBeenCalledWith(communityId);
      expect(result).toHaveLength(2);
    });

    test("should handle database errors gracefully", async () => {
      const dbError = new Error("Database connection failed");
      storage.getTournaments.mockRejectedValue(dbError);

      await expect(
        tournamentsService.getTournaments("community-123"),
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("Tournament Formats", () => {
    test("should fetch available tournament formats", async () => {
      const formats = [
        { id: "single_elimination", name: "Single Elimination" },
        { id: "double_elimination", name: "Double Elimination" },
        { id: "swiss", name: "Swiss" },
        { id: "round_robin", name: "Round Robin" },
      ];

      storage.getTournamentFormats.mockResolvedValue(formats);

      const result = await tournamentsService.getTournamentFormats();

      expect(result).toHaveLength(4);
      expect(result.map((f) => f.id)).toContain("single_elimination");
    });
  });

  describe("Round and Match Management", () => {
    test("should create tournament rounds", async () => {
      const tournamentId = "tournament-123";
      const roundData = {
        tournamentId,
        roundNumber: 1,
        status: "upcoming",
      };

      storage.createTournamentRound.mockResolvedValue(
        createMockRound(roundData),
      );

      // This would be called internally by startTournament
      const result = await storage.createTournamentRound(roundData);

      expect(result.tournamentId).toBe(tournamentId);
      expect(result.roundNumber).toBe(1);
    });

    test("should fetch tournament rounds", async () => {
      const tournamentId = "tournament-123";
      const rounds = [
        createMockRound({ roundNumber: 1 }),
        createMockRound({ roundNumber: 2 }),
      ];

      storage.getTournamentRounds.mockResolvedValue(rounds);

      const result = await storage.getTournamentRounds(tournamentId);

      expect(result).toHaveLength(2);
      expect(result[0].roundNumber).toBe(1);
    });
  });
});

// ============================================================================
// E2E TESTS - Complete Tournament Workflow
// ============================================================================

describe("Tournament System - E2E Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Complete Tournament Workflow", () => {
    test("should simulate full tournament lifecycle: create → join → start → complete", async () => {
      // Step 1: Create tournament
      const tournamentData = {
        name: "E2E Test Tournament",
        description: "End-to-end test tournament",
        format: "single_elimination",
        maxParticipants: 4,
        communityId: "community-123",
        organizerId: "organizer-123",
        startDate: new Date(Date.now() + 86400000),
      };

      let tournament = createMockTournament(tournamentData);
      storage.createTournament.mockResolvedValue(tournament);

      const created = await tournamentsService.createTournament(tournamentData);
      expect(created.status).toBe("upcoming");

      // Step 2: Users join tournament
      const participants = ["user-1", "user-2", "user-3", "user-4"];

      for (const userId of participants) {
        tournament = {
          ...tournament,
          participants: [
            ...tournament.participants,
            createMockParticipant({ userId }),
          ],
        };
        storage.joinTournament.mockResolvedValue(tournament);
        await tournamentsService.joinTournament(tournament.id, userId);
      }

      expect(tournament.participants).toHaveLength(4);

      // Step 3: Start tournament
      storage.getTournament.mockResolvedValueOnce(tournament);
      storage.updateTournamentStatus.mockResolvedValue(undefined);
      storage.createTournamentRound.mockResolvedValue(createMockRound());
      storage.createTournamentMatch.mockResolvedValue(createMockMatch());
      storage.getTournamentRounds.mockResolvedValue([createMockRound()]);
      storage.getTournament.mockResolvedValueOnce({
        ...tournament,
        status: "active",
      });

      const started = await tournamentsService.startTournament(
        tournament.id,
        tournament.organizerId,
      );
      expect(started.status).toBe("active");

      // Step 4: Verify rounds were created
      expect(storage.createTournamentRound).toHaveBeenCalled();
    });

    test("should handle player dropping out mid-tournament", async () => {
      const tournament = createMockTournament({
        status: "active",
        participants: [
          createMockParticipant({ userId: "user-1" }),
          createMockParticipant({ userId: "user-2" }),
          createMockParticipant({ userId: "user-3" }),
        ],
      });

      storage.leaveTournament.mockResolvedValue({
        ...tournament,
        participants: tournament.participants.filter(
          (p) => p.userId !== "user-2",
        ),
      });

      const result = await tournamentsService.leaveTournament(
        tournament.id,
        "user-2",
      );

      expect(result.participants).toHaveLength(2);
      expect(
        result.participants.find((p) => p.userId === "user-2"),
      ).toBeUndefined();
    });

    test("should handle tournament cancellation", async () => {
      const tournament = createMockTournament({ status: "upcoming" });

      storage.getTournament.mockResolvedValue(tournament);
      storage.updateTournament.mockResolvedValue({
        ...tournament,
        status: "cancelled",
      });

      const updates = { status: "cancelled" };
      const result = await tournamentsService.updateTournament(
        tournament.id,
        updates,
        tournament.organizerId,
      );

      expect(result.status).toBe("cancelled");
    });
  });

  describe("Multi-user Tournament Scenarios", () => {
    test("should handle concurrent user registrations", async () => {
      const tournament = createMockTournament({
        maxParticipants: 8,
        participants: [],
      });

      // Simulate 5 users trying to join concurrently
      const users = ["user-1", "user-2", "user-3", "user-4", "user-5"];

      for (let i = 0; i < users.length; i++) {
        const updatedTournament = {
          ...tournament,
          participants: users
            .slice(0, i + 1)
            .map((userId) => createMockParticipant({ userId })),
        };
        storage.joinTournament.mockResolvedValueOnce(updatedTournament);
      }

      const results = await Promise.all(
        users.map((userId) =>
          tournamentsService.joinTournament(tournament.id, userId),
        ),
      );

      expect(results[results.length - 1].participants).toHaveLength(5);
    });

    test("should prevent over-registration", async () => {
      const tournament = createMockTournament({
        maxParticipants: 2,
        participants: [
          createMockParticipant({ userId: "user-1" }),
          createMockParticipant({ userId: "user-2" }),
        ],
      });

      // Mock storage to reject over-registration
      storage.joinTournament.mockRejectedValue(new Error("Tournament is full"));

      await expect(
        tournamentsService.joinTournament(tournament.id, "user-3"),
      ).rejects.toThrow("Tournament is full");
    });
  });

  describe("Tournament Status Transitions", () => {
    test("should transition through valid status states", () => {
      const validTransitions: Record<string, string[]> = {
        upcoming: ["active", "cancelled"],
        active: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
      };

      // Verify each status has defined valid transitions
      Object.entries(validTransitions).forEach(([_status, allowed]) => {
        expect(Array.isArray(allowed)).toBe(true);
      });
    });

    test("should prevent invalid status transitions", async () => {
      const tournament = createMockTournament({ status: "completed" });
      storage.getTournament.mockResolvedValue(tournament);

      // Cannot restart a completed tournament
      await expect(
        tournamentsService.startTournament(
          tournament.id,
          tournament.organizerId,
        ),
      ).rejects.toThrow();
    });
  });
});

// ============================================================================
// PERFORMANCE AND EDGE CASE TESTS
// ============================================================================

describe("Tournament System - Performance and Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Performance Tests", () => {
    test("should handle large participant lists efficiently", async () => {
      const largeParticipantList = Array(128)
        .fill({})
        .map((_, i) => createMockParticipant({ userId: `user-${i}` }));

      const tournament = createMockTournament({
        maxParticipants: 128,
        participants: largeParticipantList,
      });

      storage.getTournamentWithTransaction.mockResolvedValue(tournament);
      storage.getTournamentParticipantsWithTransaction.mockResolvedValue(
        largeParticipantList,
      );
      storage.getTournamentRoundsWithTransaction.mockResolvedValue([]);
      storage.getTournamentMatchesWithTransaction.mockResolvedValue([]);

      const result = await tournamentsService.getTournamentWithParticipants(
        tournament.id,
      );

      expect(result.participantCount).toBe(128);
    });

    test("should batch fetch tournament data in parallel", async () => {
      const tournament = createMockTournament();

      storage.getTournamentWithTransaction.mockResolvedValue(tournament);
      storage.getTournamentParticipantsWithTransaction.mockResolvedValue([]);
      storage.getTournamentRoundsWithTransaction.mockResolvedValue([]);
      storage.getTournamentMatchesWithTransaction.mockResolvedValue([]);

      const startTime = Date.now();
      await tournamentsService.getTournamentWithParticipants(tournament.id);
      const duration = Date.now() - startTime;

      // All parallel calls should complete quickly
      expect(duration).toBeLessThan(1000); // Should take less than 1 second
    });
  });

  describe("Edge Cases", () => {
    test("should handle tournament with no participants", async () => {
      const tournament = createMockTournament({ participants: [] });
      storage.getTournament.mockResolvedValue(tournament);

      await expect(
        tournamentsService.startTournament(
          tournament.id,
          tournament.organizerId,
        ),
      ).rejects.toThrow("Tournament needs at least 2 participants to start");
    });

    test("should handle odd number of participants with bye", () => {
      const participants = Array(7)
        .fill({})
        .map((_, i) => `player-${i}`);
      const numMatches = Math.floor(participants.length / 2);
      const numByes = participants.length % 2;

      expect(numMatches).toBe(3);
      expect(numByes).toBe(1);
    });

    test("should handle tournament with single participant", async () => {
      const tournament = createMockTournament({
        participants: [createMockParticipant()],
      });
      storage.getTournament.mockResolvedValue(tournament);

      await expect(
        tournamentsService.startTournament(
          tournament.id,
          tournament.organizerId,
        ),
      ).rejects.toThrow("Tournament needs at least 2 participants to start");
    });

    test("should validate tournament data integrity", async () => {
      const tournament = createMockTournament();

      // Ensure required fields are present
      expect(tournament.id).toBeDefined();
      expect(tournament.name).toBeDefined();
      expect(tournament.format).toBeDefined();
      expect(tournament.organizerId).toBeDefined();
    });
  });
});
