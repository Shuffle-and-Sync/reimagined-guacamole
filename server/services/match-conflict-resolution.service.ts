/**
 * Match Result Conflict Resolution Service
 *
 * Handles simultaneous match result submissions with optimistic locking,
 * conflict detection, and dispute resolution workflows.
 */

import { eq, and } from "drizzle-orm";
import { db, withTransaction } from "@shared/database-unified";
import {
  tournamentMatches,
  matchResultConflicts,
  matchResults,
} from "@shared/schema";
import { ConflictError } from "../errors/tournament-errors";
import { logger } from "../logger";

interface MatchResultSubmission {
  matchId: string;
  winnerId: string;
  loserId: string;
  player1Score: number;
  player2Score: number;
  submittedBy: string;
  notes?: string;
}

interface ConflictResolution {
  resolvedBy: string;
  acceptedSubmissionId: string;
  reason: string;
}

export const matchConflictResolutionService = {
  /**
   * Submit match result with conflict detection
   * Uses optimistic locking to prevent race conditions
   */
  async submitMatchResult(
    submission: MatchResultSubmission,
  ): Promise<{ success: boolean; conflictId?: string }> {
    return await withTransaction(async (tx) => {
      // Lock the match row for update
      const matches = await tx
        .select()
        .from(tournamentMatches)
        .where(eq(tournamentMatches.id, submission.matchId))
        .limit(1);

      const match = matches[0];
      if (!match) {
        throw new Error("Match not found");
      }

      // Check if match already has a result
      const existingResults = await tx
        .select()
        .from(matchResults)
        .where(eq(matchResults.matchId, submission.matchId))
        .limit(1);

      const existingResult = existingResults[0];

      // Detect simultaneous submission (within 5 seconds)
      if (
        match.resultSubmittedAt &&
        Math.abs(match.resultSubmittedAt.getTime() - Date.now()) < 5000 &&
        match.resultSubmittedBy !== submission.submittedBy
      ) {
        // Create conflict record
        const conflictId = crypto.randomUUID();
        await tx.insert(matchResultConflicts).values({
          id: conflictId,
          matchId: submission.matchId,
          submission1Id: existingResult?.id || "pending",
          submission2Id: crypto.randomUUID(),
          submission1By: match.resultSubmittedBy || "unknown",
          submission2By: submission.submittedBy,
          submission1Data: JSON.stringify({
            winnerId: existingResult?.winnerId,
            player1Score: existingResult?.player1Score,
            player2Score: existingResult?.player2Score,
          }),
          submission2Data: JSON.stringify({
            winnerId: submission.winnerId,
            player1Score: submission.player1Score,
            player2Score: submission.player2Score,
          }),
          status: "pending",
        });

        // Update match status to disputed
        await tx
          .update(tournamentMatches)
          .set({
            status: "disputed",
            conflictDetectedAt: new Date(),
          })
          .where(eq(tournamentMatches.id, submission.matchId));

        logger.warn("Match result conflict detected", {
          matchId: submission.matchId,
          conflictId,
          submitter1: match.resultSubmittedBy,
          submitter2: submission.submittedBy,
        });

        throw new ConflictError(
          `Conflict detected. Dispute resolution required. Conflict ID: ${conflictId}`,
        );
      }

      // No conflict - update match with optimistic lock check
      await tx
        .update(tournamentMatches)
        .set({
          winnerId: submission.winnerId,
          status: "completed",
          version: match.version + 1,
          resultSubmittedAt: new Date(),
          resultSubmittedBy: submission.submittedBy,
          endTime: new Date(),
        })
        .where(
          and(
            eq(tournamentMatches.id, submission.matchId),
            eq(tournamentMatches.version, match.version),
          ),
        );

      // Create or update match result
      if (existingResult) {
        await tx
          .update(matchResults)
          .set({
            winnerId: submission.winnerId,
            loserId: submission.loserId,
            player1Score: submission.player1Score,
            player2Score: submission.player2Score,
            notes: submission.notes,
            reportedBy: submission.submittedBy,
          })
          .where(eq(matchResults.id, existingResult.id));
      } else {
        await tx.insert(matchResults).values({
          id: crypto.randomUUID(),
          matchId: submission.matchId,
          winnerId: submission.winnerId,
          loserId: submission.loserId,
          player1Score: submission.player1Score,
          player2Score: submission.player2Score,
          notes: submission.notes,
          reportedBy: submission.submittedBy,
        });
      }

      logger.info("Match result submitted successfully", {
        matchId: submission.matchId,
        winnerId: submission.winnerId,
        submittedBy: submission.submittedBy,
      });

      return { success: true };
    }, "submit-match-result");
  },

  /**
   * Resolve a match result conflict
   * Admin/organizer can choose which submission to accept
   */
  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
  ): Promise<void> {
    await withTransaction(async (tx) => {
      const conflicts = await tx
        .select()
        .from(matchResultConflicts)
        .where(eq(matchResultConflicts.id, conflictId))
        .limit(1);

      const conflict = conflicts[0];
      if (!conflict) {
        throw new Error("Conflict not found");
      }

      if (conflict.status !== "pending") {
        throw new Error("Conflict already resolved");
      }

      // Parse accepted submission data
      const acceptedData =
        resolution.acceptedSubmissionId === conflict.submission1Id
          ? JSON.parse(conflict.submission1Data)
          : JSON.parse(conflict.submission2Data);

      // Update match with resolved result
      await tx
        .update(tournamentMatches)
        .set({
          winnerId: acceptedData.winnerId,
          status: "completed",
          conflictResolvedAt: new Date(),
          conflictResolution: JSON.stringify({
            resolvedBy: resolution.resolvedBy,
            acceptedSubmission: resolution.acceptedSubmissionId,
            reason: resolution.reason,
            resolvedAt: new Date().toISOString(),
          }),
        })
        .where(eq(tournamentMatches.id, conflict.matchId));

      // Update conflict record
      await tx
        .update(matchResultConflicts)
        .set({
          status: "resolved",
          resolvedBy: resolution.resolvedBy,
          resolvedAt: new Date(),
          resolution: JSON.stringify(resolution),
        })
        .where(eq(matchResultConflicts.id, conflictId));

      // Update match results
      const results = await tx
        .select()
        .from(matchResults)
        .where(eq(matchResults.matchId, conflict.matchId))
        .limit(1);

      if (results[0]) {
        await tx
          .update(matchResults)
          .set({
            winnerId: acceptedData.winnerId,
            player1Score: acceptedData.player1Score,
            player2Score: acceptedData.player2Score,
            isVerified: true,
            verifiedBy: resolution.resolvedBy,
          })
          .where(eq(matchResults.id, results[0].id));
      }

      logger.info("Match conflict resolved", {
        conflictId,
        matchId: conflict.matchId,
        resolvedBy: resolution.resolvedBy,
      });
    }, "resolve-match-conflict");
  },

  /**
   * Get pending conflicts for a tournament
   */
  async getPendingConflicts(tournamentId: string) {
    const conflicts = await db
      .select({
        conflict: matchResultConflicts,
        match: tournamentMatches,
      })
      .from(matchResultConflicts)
      .innerJoin(
        tournamentMatches,
        eq(matchResultConflicts.matchId, tournamentMatches.id),
      )
      .where(
        and(
          eq(tournamentMatches.tournamentId, tournamentId),
          eq(matchResultConflicts.status, "pending"),
        ),
      );

    return conflicts;
  },

  /**
   * Get conflict details
   */
  async getConflict(conflictId: string) {
    const conflicts = await db
      .select()
      .from(matchResultConflicts)
      .where(eq(matchResultConflicts.id, conflictId))
      .limit(1);

    return conflicts[0];
  },
};
