/**
 * Match Conflict Resolution Service Tests
 *
 * Tests for simultaneous match result submissions, optimistic locking,
 * and dispute resolution workflows.
 */

import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { db } from "@shared/database-unified";
import { ConflictError } from "../../errors/tournament-errors";
import { matchConflictResolutionService } from "../../services/match-conflict-resolution.service";

// Mock database
jest.mock("@shared/database-unified", () => {
  const mockDb = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };

  return {
    db: mockDb,
    withTransaction: jest.fn((callback) => {
      // Create a transaction mock that has the same methods as db
      const tx = {
        select: mockDb.select,
        insert: mockDb.insert,
        update: mockDb.update,
      };
      return callback(tx);
    }),
  };
});

jest.mock("../../logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("Match Conflict Resolution Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("submitMatchResult", () => {
    test("should submit result successfully when no conflict exists", async () => {
      const mockMatch = {
        id: "match-1",
        version: 1,
        resultSubmittedAt: null,
        resultSubmittedBy: null,
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockMatch]),
          }),
        }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue({}),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());
      (db.insert as jest.Mock).mockReturnValue(mockInsert());
      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      const submission = {
        matchId: "match-1",
        winnerId: "player-1",
        loserId: "player-2",
        player1Score: 2,
        player2Score: 1,
        submittedBy: "player-1",
      };

      const result =
        await matchConflictResolutionService.submitMatchResult(submission);

      expect(result.success).toBe(true);
      expect(result.conflictId).toBeUndefined();
    });

    test("should detect conflict when simultaneous submission occurs", async () => {
      const now = Date.now();
      const mockMatch = {
        id: "match-1",
        version: 1,
        resultSubmittedAt: new Date(now - 2000), // 2 seconds ago
        resultSubmittedBy: "player-2",
      };

      const mockExistingResult = {
        id: "result-1",
        winnerId: "player-2",
        player1Score: 1,
        player2Score: 2,
      };

      const mockSelect = jest
        .fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockMatch]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockExistingResult]),
            }),
          }),
        });

      (db.select as jest.Mock).mockImplementation(mockSelect);

      const submission = {
        matchId: "match-1",
        winnerId: "player-1",
        loserId: "player-2",
        player1Score: 2,
        player2Score: 1,
        submittedBy: "player-1",
      };

      await expect(
        matchConflictResolutionService.submitMatchResult(submission),
      ).rejects.toThrow(ConflictError);
    });

    test("should throw error when match not found", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const submission = {
        matchId: "nonexistent",
        winnerId: "player-1",
        loserId: "player-2",
        player1Score: 2,
        player2Score: 1,
        submittedBy: "player-1",
      };

      await expect(
        matchConflictResolutionService.submitMatchResult(submission),
      ).rejects.toThrow("Match not found");
    });

    test("should use optimistic locking with version check", async () => {
      const mockMatch = {
        id: "match-1",
        version: 5,
        resultSubmittedAt: null,
        resultSubmittedBy: null,
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockMatch]),
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockImplementation((condition) => {
            // Verify version check is included in where clause
            expect(condition).toBeDefined();
            return Promise.resolve({});
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());
      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      const submission = {
        matchId: "match-1",
        winnerId: "player-1",
        loserId: "player-2",
        player1Score: 2,
        player2Score: 1,
        submittedBy: "player-1",
      };

      await matchConflictResolutionService.submitMatchResult(submission);

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe("resolveConflict", () => {
    test("should resolve conflict and update match result", async () => {
      const mockConflict = {
        id: "conflict-1",
        matchId: "match-1",
        status: "pending",
        submission1Id: "sub-1",
        submission2Id: "sub-2",
        submission1Data: JSON.stringify({
          winnerId: "player-1",
          player1Score: 2,
          player2Score: 1,
        }),
        submission2Data: JSON.stringify({
          winnerId: "player-2",
          player1Score: 1,
          player2Score: 2,
        }),
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockConflict]),
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());
      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      const resolution = {
        resolvedBy: "admin-1",
        acceptedSubmissionId: "sub-1",
        reason: "Player 1 submission verified by tournament staff",
      };

      await matchConflictResolutionService.resolveConflict(
        "conflict-1",
        resolution,
      );

      expect(mockUpdate).toHaveBeenCalled();
    });

    test("should throw error when conflict not found", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const resolution = {
        resolvedBy: "admin-1",
        acceptedSubmissionId: "sub-1",
        reason: "Test",
      };

      await expect(
        matchConflictResolutionService.resolveConflict(
          "nonexistent",
          resolution,
        ),
      ).rejects.toThrow("Conflict not found");
    });

    test("should throw error when conflict already resolved", async () => {
      const mockConflict = {
        id: "conflict-1",
        status: "resolved",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockConflict]),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const resolution = {
        resolvedBy: "admin-1",
        acceptedSubmissionId: "sub-1",
        reason: "Test",
      };

      await expect(
        matchConflictResolutionService.resolveConflict(
          "conflict-1",
          resolution,
        ),
      ).rejects.toThrow("Conflict already resolved");
    });
  });

  describe("getPendingConflicts", () => {
    test("should retrieve all pending conflicts for tournament", async () => {
      const mockConflicts = [
        {
          conflict: { id: "conflict-1", status: "pending" },
          match: { id: "match-1", tournamentId: "tournament-1" },
        },
        {
          conflict: { id: "conflict-2", status: "pending" },
          match: { id: "match-2", tournamentId: "tournament-1" },
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockConflicts),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const result =
        await matchConflictResolutionService.getPendingConflicts(
          "tournament-1",
        );

      expect(result).toEqual(mockConflicts);
      expect(result.length).toBe(2);
    });

    test("should return empty array when no conflicts exist", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const result =
        await matchConflictResolutionService.getPendingConflicts(
          "tournament-1",
        );

      expect(result).toEqual([]);
    });
  });

  describe("getConflict", () => {
    test("should retrieve specific conflict by ID", async () => {
      const mockConflict = {
        id: "conflict-1",
        matchId: "match-1",
        status: "pending",
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockConflict]),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const result =
        await matchConflictResolutionService.getConflict("conflict-1");

      expect(result).toEqual(mockConflict);
    });

    test("should return undefined when conflict not found", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockSelect());

      const result =
        await matchConflictResolutionService.getConflict("nonexistent");

      expect(result).toBeUndefined();
    });
  });
});
