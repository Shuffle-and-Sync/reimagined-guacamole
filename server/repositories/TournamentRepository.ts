/**
 * Tournament Repository
 *
 * Handles all database operations related to tournaments, participants, rounds, and matches.
 * This repository manages:
 * - Tournament CRUD operations
 * - Tournament participant management
 * - Tournament formats
 * - Tournament rounds and matches
 * - Bracket generation and management
 *
 * @module TournamentRepository
 */

import { eq, and, desc, sql, count, alias } from "drizzle-orm";
import {
  db,
  withQueryTiming,
  type Transaction,
} from "@shared/database-unified";
import {
  tournaments,
  tournamentParticipants,
  tournamentFormats,
  tournamentRounds,
  tournamentMatches,
  users,
  communities,
  type Tournament,
  type InsertTournament,
  type UpdateTournament,
  type TournamentParticipant,
  type TournamentFormat,
  type InsertTournamentFormat,
  type TournamentRound,
  type InsertTournamentRound,
  type TournamentMatch,
  type InsertTournamentMatch,
  type User,
  type Community,
} from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { DatabaseError } from "../middleware/error-handling.middleware";
import { BaseRepository } from "./base";

/**
 * Tournament with organizer and community details
 */
export interface TournamentWithDetails extends Tournament {
  organizer: User;
  community: Community;
  participantCount: number;
}

/**
 * Tournament with full participant list
 */
export interface TournamentWithParticipants extends Tournament {
  organizer: User;
  community: Community;
  participants: Array<TournamentParticipant & { user: User }>;
}

/**
 * Tournament match with player details
 */
export interface TournamentMatchWithPlayers extends TournamentMatch {
  player1?: User;
  player2?: User;
  winner?: User;
}

/**
 * TournamentRepository
 *
 * Manages all tournament-related database operations including tournaments,
 * participants, formats, rounds, and matches.
 */
export class TournamentRepository extends BaseRepository<
  typeof tournaments,
  Tournament,
  InsertTournament,
  UpdateTournament
> {
  constructor(dbInstance = db) {
    super(dbInstance, tournaments, "tournaments");
  }

  /**
   * Get tournaments with optional community filter
   *
   * @param communityId - Optional community ID to filter by
   * @returns Promise of tournaments with details
   *
   * @example
   * ```typescript
   * const tournaments = await tournamentRepo.getTournaments('community-123');
   * ```
   */
  async getTournaments(communityId?: string): Promise<TournamentWithDetails[]> {
    return withQueryTiming("TournamentRepository:getTournaments", async () => {
      try {
        let query = this.db
          .select({
            tournament: tournaments,
            organizer: users,
            community: communities,
            participantCount:
              sql<number>`COUNT(${tournamentParticipants.id})::int`.as(
                "participantCount",
              ),
          })
          .from(tournaments)
          .innerJoin(users, eq(tournaments.organizerId, users.id))
          .innerJoin(communities, eq(tournaments.communityId, communities.id))
          .leftJoin(
            tournamentParticipants,
            eq(tournaments.id, tournamentParticipants.tournamentId),
          )
          .groupBy(tournaments.id, users.id, communities.id)
          .orderBy(desc(tournaments.startDate));

        if (communityId) {
          query = query.where(
            eq(tournaments.communityId, communityId),
          ) as typeof query;
        }

        const results = await query;
        return results.map((result) => ({
          ...result.tournament,
          organizer: result.organizer,
          community: result.community,
          participantCount: result.participantCount,
        }));
      } catch (error) {
        logger.error("Failed to get tournaments", toLoggableError(error), {
          communityId,
        });
        throw new DatabaseError("Failed to get tournaments", { cause: error });
      }
    });
  }

  /**
   * Get a single tournament with participants
   *
   * @param tournamentId - Tournament ID
   * @returns Promise of tournament with participants or null
   *
   * @example
   * ```typescript
   * const tournament = await tournamentRepo.getTournament('tournament-123');
   * ```
   */
  async getTournament(
    tournamentId: string,
  ): Promise<TournamentWithParticipants | null> {
    return withQueryTiming("TournamentRepository:getTournament", async () => {
      try {
        const result = await this.db
          .select({
            tournament: tournaments,
            organizer: users,
            community: communities,
          })
          .from(tournaments)
          .innerJoin(users, eq(tournaments.organizerId, users.id))
          .innerJoin(communities, eq(tournaments.communityId, communities.id))
          .where(eq(tournaments.id, tournamentId))
          .limit(1);

        if (result.length === 0) return null;

        const tournament = result[0];

        const participants = await this.db
          .select({
            participant: tournamentParticipants,
            user: users,
          })
          .from(tournamentParticipants)
          .innerJoin(users, eq(tournamentParticipants.userId, users.id))
          .where(eq(tournamentParticipants.tournamentId, tournamentId));

        return {
          ...tournament.tournament,
          organizer: tournament.organizer,
          community: tournament.community,
          participants: participants.map((p) => ({
            ...p.participant,
            user: p.user,
          })),
        };
      } catch (error) {
        logger.error("Failed to get tournament", toLoggableError(error), {
          tournamentId,
        });
        throw new DatabaseError("Failed to get tournament", { cause: error });
      }
    });
  }

  /**
   * Create a new tournament
   *
   * @param data - Tournament data
   * @returns Promise of created tournament
   *
   * @example
   * ```typescript
   * const tournament = await tournamentRepo.createTournament({
   *   name: 'Summer Championship',
   *   organizerId: 'user-123',
   *   communityId: 'community-456',
   *   startDate: new Date(),
   *   maxParticipants: 32
   * });
   * ```
   */
  async createTournament(data: InsertTournament): Promise<Tournament> {
    return withQueryTiming(
      "TournamentRepository:createTournament",
      async () => {
        try {
          return await this.create(data);
        } catch (error) {
          logger.error("Failed to create tournament", toLoggableError(error), {
            data,
          });
          throw new DatabaseError("Failed to create tournament", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Update a tournament
   *
   * @param tournamentId - Tournament ID
   * @param data - Tournament update data
   * @returns Promise of updated tournament
   *
   * @example
   * ```typescript
   * const updated = await tournamentRepo.updateTournament('tournament-123', {
   *   status: 'in_progress'
   * });
   * ```
   */
  async updateTournament(
    tournamentId: string,
    data: UpdateTournament,
  ): Promise<Tournament | null> {
    return withQueryTiming(
      "TournamentRepository:updateTournament",
      async () => {
        try {
          const updateData = {
            ...data,
            updatedAt: new Date(),
          };

          return await this.update(tournamentId, updateData);
        } catch (error) {
          logger.error("Failed to update tournament", toLoggableError(error), {
            tournamentId,
            data,
          });
          throw new DatabaseError("Failed to update tournament", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Update tournament status
   *
   * @param tournamentId - Tournament ID
   * @param status - New status
   * @returns Promise of updated tournament
   *
   * @example
   * ```typescript
   * await tournamentRepo.updateTournamentStatus('tournament-123', 'completed');
   * ```
   */
  async updateTournamentStatus(
    tournamentId: string,
    status: string,
  ): Promise<Tournament | null> {
    return withQueryTiming(
      "TournamentRepository:updateTournamentStatus",
      async () => {
        try {
          return await this.update(tournamentId, {
            status,
            updatedAt: new Date(),
          } as UpdateTournament);
        } catch (error) {
          logger.error(
            "Failed to update tournament status",
            toLoggableError(error),
            { tournamentId, status },
          );
          throw new DatabaseError("Failed to update tournament status", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Join a tournament
   *
   * @param tournamentId - Tournament ID
   * @param userId - User ID
   * @returns Promise of created participant
   *
   * @example
   * ```typescript
   * const participant = await tournamentRepo.joinTournament(
   *   'tournament-123',
   *   'user-456'
   * );
   * ```
   */
  async joinTournament(
    tournamentId: string,
    userId: string,
  ): Promise<TournamentParticipant> {
    return withQueryTiming("TournamentRepository:joinTournament", async () => {
      try {
        const result = await this.db
          .insert(tournamentParticipants)
          .values({
            tournamentId,
            userId,
          })
          .returning();

        if (!result[0]) {
          throw new DatabaseError("Failed to join tournament");
        }

        return result[0];
      } catch (error) {
        logger.error("Failed to join tournament", toLoggableError(error), {
          tournamentId,
          userId,
        });
        throw new DatabaseError("Failed to join tournament", { cause: error });
      }
    });
  }

  /**
   * Leave a tournament
   *
   * @param tournamentId - Tournament ID
   * @param userId - User ID
   * @returns Promise of boolean indicating success
   *
   * @example
   * ```typescript
   * const success = await tournamentRepo.leaveTournament(
   *   'tournament-123',
   *   'user-456'
   * );
   * ```
   */
  async leaveTournament(
    tournamentId: string,
    userId: string,
  ): Promise<boolean> {
    return withQueryTiming("TournamentRepository:leaveTournament", async () => {
      try {
        const result = await this.db
          .delete(tournamentParticipants)
          .where(
            and(
              eq(tournamentParticipants.tournamentId, tournamentId),
              eq(tournamentParticipants.userId, userId),
            ),
          )
          .returning();

        return result.length > 0;
      } catch (error) {
        logger.error("Failed to leave tournament", toLoggableError(error), {
          tournamentId,
          userId,
        });
        throw new DatabaseError("Failed to leave tournament", { cause: error });
      }
    });
  }

  /**
   * Get tournament formats
   *
   * @returns Promise of tournament formats
   *
   * @example
   * ```typescript
   * const formats = await tournamentRepo.getTournamentFormats();
   * ```
   */
  async getTournamentFormats(): Promise<TournamentFormat[]> {
    return withQueryTiming(
      "TournamentRepository:getTournamentFormats",
      async () => {
        try {
          return await this.db.select().from(tournamentFormats);
        } catch (error) {
          logger.error(
            "Failed to get tournament formats",
            toLoggableError(error),
          );
          throw new DatabaseError("Failed to get tournament formats", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Create a tournament format
   *
   * @param data - Format data
   * @returns Promise of created format
   *
   * @example
   * ```typescript
   * const format = await tournamentRepo.createTournamentFormat({
   *   name: 'Single Elimination',
   *   description: '...'
   * });
   * ```
   */
  async createTournamentFormat(
    data: InsertTournamentFormat,
  ): Promise<TournamentFormat> {
    return withQueryTiming(
      "TournamentRepository:createTournamentFormat",
      async () => {
        try {
          const result = await this.db
            .insert(tournamentFormats)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to create tournament format");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to create tournament format",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to create tournament format", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get tournament rounds
   *
   * @param tournamentId - Tournament ID
   * @returns Promise of tournament rounds
   *
   * @example
   * ```typescript
   * const rounds = await tournamentRepo.getTournamentRounds('tournament-123');
   * ```
   */
  async getTournamentRounds(tournamentId: string): Promise<TournamentRound[]> {
    return withQueryTiming(
      "TournamentRepository:getTournamentRounds",
      async () => {
        try {
          return await this.db
            .select()
            .from(tournamentRounds)
            .where(eq(tournamentRounds.tournamentId, tournamentId))
            .orderBy(tournamentRounds.roundNumber);
        } catch (error) {
          logger.error(
            "Failed to get tournament rounds",
            toLoggableError(error),
            { tournamentId },
          );
          throw new DatabaseError("Failed to get tournament rounds", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Create a tournament round
   *
   * @param data - Round data
   * @returns Promise of created round
   *
   * @example
   * ```typescript
   * const round = await tournamentRepo.createTournamentRound({
   *   tournamentId: 'tournament-123',
   *   roundNumber: 1,
   *   name: 'Round 1'
   * });
   * ```
   */
  async createTournamentRound(
    data: InsertTournamentRound,
  ): Promise<TournamentRound> {
    return withQueryTiming(
      "TournamentRepository:createTournamentRound",
      async () => {
        try {
          const result = await this.db
            .insert(tournamentRounds)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to create tournament round");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to create tournament round",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to create tournament round", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Update a tournament round
   *
   * @param roundId - Round ID
   * @param data - Round update data
   * @returns Promise of updated round
   *
   * @example
   * ```typescript
   * const updated = await tournamentRepo.updateTournamentRound('round-123', {
   *   status: 'completed'
   * });
   * ```
   */
  async updateTournamentRound(
    roundId: string,
    data: Partial<InsertTournamentRound>,
  ): Promise<TournamentRound> {
    return withQueryTiming(
      "TournamentRepository:updateTournamentRound",
      async () => {
        try {
          const result = await this.db
            .update(tournamentRounds)
            .set(data)
            .where(eq(tournamentRounds.id, roundId))
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to update tournament round");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to update tournament round",
            toLoggableError(error),
            { roundId, data },
          );
          throw new DatabaseError("Failed to update tournament round", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get tournament matches with player details
   *
   * @param tournamentId - Tournament ID
   * @param roundId - Optional round ID to filter by
   * @returns Promise of matches with player details
   *
   * @example
   * ```typescript
   * const matches = await tournamentRepo.getTournamentMatches('tournament-123');
   * ```
   */
  async getTournamentMatches(
    tournamentId: string,
    roundId?: string,
  ): Promise<TournamentMatchWithPlayers[]> {
    return withQueryTiming(
      "TournamentRepository:getTournamentMatches",
      async () => {
        try {
          const player1 = alias(users, "player1");
          const player2 = alias(users, "player2");
          const winner = alias(users, "winner");

          let query = this.db
            .select({
              match: tournamentMatches,
              player1,
              player2,
              winner,
            })
            .from(tournamentMatches)
            .leftJoin(player1, eq(tournamentMatches.player1Id, player1.id))
            .leftJoin(player2, eq(tournamentMatches.player2Id, player2.id))
            .leftJoin(winner, eq(tournamentMatches.winnerId, winner.id))
            .where(
              (() => {
                const conditions = [eq(tournamentMatches.tournamentId, tournamentId)];
                if (roundId) {
                  conditions.push(eq(tournamentMatches.roundId, roundId));
                }
                return and(...conditions);
              })(),
            );

          const results = await query;
          return results.map((result) => ({
            ...result.match,
            player1: result.player1 || undefined,
            player2: result.player2 || undefined,
            winner: result.winner || undefined,
          }));
        } catch (error) {
          logger.error(
            "Failed to get tournament matches",
            toLoggableError(error),
            { tournamentId, roundId },
          );
          throw new DatabaseError("Failed to get tournament matches", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Create a tournament match
   *
   * @param data - Match data
   * @returns Promise of created match
   *
   * @example
   * ```typescript
   * const match = await tournamentRepo.createTournamentMatch({
   *   tournamentId: 'tournament-123',
   *   roundId: 'round-456',
   *   player1Id: 'user-1',
   *   player2Id: 'user-2'
   * });
   * ```
   */
  async createTournamentMatch(
    data: InsertTournamentMatch,
  ): Promise<TournamentMatch> {
    return withQueryTiming(
      "TournamentRepository:createTournamentMatch",
      async () => {
        try {
          const result = await this.db
            .insert(tournamentMatches)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to create tournament match");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to create tournament match",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to create tournament match", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Update a tournament match
   *
   * @param matchId - Match ID
   * @param data - Match update data
   * @returns Promise of updated match
   *
   * @example
   * ```typescript
   * const updated = await tournamentRepo.updateTournamentMatch('match-123', {
   *   winnerId: 'user-1',
   *   status: 'completed'
   * });
   * ```
   */
  async updateTournamentMatch(
    matchId: string,
    data: Partial<InsertTournamentMatch>,
  ): Promise<TournamentMatch> {
    return withQueryTiming(
      "TournamentRepository:updateTournamentMatch",
      async () => {
        try {
          const result = await this.db
            .update(tournamentMatches)
            .set(data)
            .where(eq(tournamentMatches.id, matchId))
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to update tournament match");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to update tournament match",
            toLoggableError(error),
            { matchId, data },
          );
          throw new DatabaseError("Failed to update tournament match", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get tournament participants
   *
   * @param tournamentId - Tournament ID
   * @returns Promise of participants with user details
   *
   * @example
   * ```typescript
   * const participants = await tournamentRepo.getTournamentParticipants('tournament-123');
   * ```
   */
  async getTournamentParticipants(
    tournamentId: string,
  ): Promise<Array<TournamentParticipant & { user: User }>> {
    return withQueryTiming(
      "TournamentRepository:getTournamentParticipants",
      async () => {
        try {
          const results = await this.db
            .select({
              participant: tournamentParticipants,
              user: users,
            })
            .from(tournamentParticipants)
            .innerJoin(users, eq(tournamentParticipants.userId, users.id))
            .where(eq(tournamentParticipants.tournamentId, tournamentId));

          return results.map((r) => ({
            ...r.participant,
            user: r.user,
          }));
        } catch (error) {
          logger.error(
            "Failed to get tournament participants",
            toLoggableError(error),
            { tournamentId },
          );
          throw new DatabaseError("Failed to get tournament participants", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get participant count for a tournament
   *
   * @param tournamentId - Tournament ID
   * @returns Promise of participant count
   *
   * @example
   * ```typescript
   * const count = await tournamentRepo.getParticipantCount('tournament-123');
   * ```
   */
  async getParticipantCount(tournamentId: string): Promise<number> {
    return withQueryTiming(
      "TournamentRepository:getParticipantCount",
      async () => {
        try {
          const result = await this.db
            .select({ count: count() })
            .from(tournamentParticipants)
            .where(eq(tournamentParticipants.tournamentId, tournamentId));

          return result[0]?.count || 0;
        } catch (error) {
          logger.error(
            "Failed to get participant count",
            toLoggableError(error),
            { tournamentId },
          );
          throw new DatabaseError("Failed to get participant count", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get tournament with transaction (for atomic operations)
   *
   * @param tournamentId - Tournament ID
   * @param trx - Transaction object
   * @returns Promise of tournament or null
   */
  async getTournamentWithTransaction(
    tournamentId: string,
    trx: Transaction,
  ): Promise<Tournament | null> {
    try {
      const result = await trx
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      logger.error(
        "Failed to get tournament with transaction",
        toLoggableError(error),
        { tournamentId },
      );
      throw new DatabaseError("Failed to get tournament with transaction", {
        cause: error,
      });
    }
  }

  /**
   * Get tournament participants with transaction
   *
   * @param tournamentId - Tournament ID
   * @param trx - Transaction object
   * @returns Promise of participants
   */
  async getTournamentParticipantsWithTransaction(
    tournamentId: string,
    trx: Transaction,
  ): Promise<TournamentParticipant[]> {
    try {
      return await trx
        .select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.tournamentId, tournamentId));
    } catch (error) {
      logger.error(
        "Failed to get tournament participants with transaction",
        toLoggableError(error),
        { tournamentId },
      );
      throw new DatabaseError(
        "Failed to get tournament participants with transaction",
        { cause: error },
      );
    }
  }

  /**
   * Get tournament rounds with transaction
   *
   * @param tournamentId - Tournament ID
   * @param trx - Transaction object
   * @returns Promise of rounds
   */
  async getTournamentRoundsWithTransaction(
    tournamentId: string,
    trx: Transaction,
  ): Promise<TournamentRound[]> {
    try {
      return await trx
        .select()
        .from(tournamentRounds)
        .where(eq(tournamentRounds.tournamentId, tournamentId))
        .orderBy(tournamentRounds.roundNumber);
    } catch (error) {
      logger.error(
        "Failed to get tournament rounds with transaction",
        toLoggableError(error),
        { tournamentId },
      );
      throw new DatabaseError(
        "Failed to get tournament rounds with transaction",
        { cause: error },
      );
    }
  }
}
