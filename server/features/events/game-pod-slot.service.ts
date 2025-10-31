/**
 * Game Pod Slot Management Service
 *
 * Manages slot assignments for game pods, including:
 * - Player slot assignment and management
 * - Alternate slot tracking
 * - Automatic alternate promotion
 * - Position swapping
 * - Slot availability tracking
 *
 * @module GamePodSlotService
 */

import { eq, and, isNull, or, sql, count, asc } from "drizzle-orm";
import { db, withTransaction } from "@shared/database-unified";
import { events, eventAttendees, gameSessions } from "@shared/schema";
import type { EventAttendee, Event } from "@shared/schema";
import { logger } from "../../logger";
import { DatabaseError } from "../../middleware/error-handling.middleware";

/**
 * Slot type enumeration
 */
export type SlotType = "player" | "alternate" | "spectator";

/**
 * Slot availability information
 */
export interface SlotAvailability {
  eventId: string;
  playerSlots: {
    total: number;
    filled: number;
    available: number;
  };
  alternateSlots: {
    total: number;
    filled: number;
    available: number;
  };
  spectatorSlots: {
    unlimited: boolean;
    filled: number;
  };
}

/**
 * Slot assignment result
 */
export interface SlotAssignmentResult {
  success: boolean;
  attendee: EventAttendee;
  message: string;
}

/**
 * Service for managing game pod slot assignments
 */
export class GamePodSlotService {
  /**
   * Get available slots for an event
   */
  async getAvailableSlots(eventId: string): Promise<SlotAvailability> {
    try {
      // Get event details
      const eventResult = await db
        .select({
          playerSlots: events.playerSlots,
          alternateSlots: events.alternateSlots,
        })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (!eventResult || eventResult.length === 0) {
        throw new DatabaseError("Event not found", { eventId });
      }

      const event = eventResult[0];
      if (!event) {
        throw new DatabaseError("Event not found", { eventId });
      }
      const totalPlayerSlots = event.playerSlots ?? 0;
      const totalAlternateSlots = event.alternateSlots ?? 0;

      // Count filled player slots
      const playerSlotsResult = await db
        .select({ count: count() })
        .from(eventAttendees)
        .where(
          and(
            eq(eventAttendees.eventId, eventId),
            eq(eventAttendees.slotType, "player"),
          ),
        );

      const filledPlayerSlots = playerSlotsResult[0]?.count || 0;

      // Count filled alternate slots
      const alternateSlotsResult = await db
        .select({ count: count() })
        .from(eventAttendees)
        .where(
          and(
            eq(eventAttendees.eventId, eventId),
            eq(eventAttendees.slotType, "alternate"),
          ),
        );

      const filledAlternateSlots = alternateSlotsResult[0]?.count || 0;

      // Count spectators
      const spectatorSlotsResult = await db
        .select({ count: count() })
        .from(eventAttendees)
        .where(
          and(
            eq(eventAttendees.eventId, eventId),
            eq(eventAttendees.slotType, "spectator"),
          ),
        );

      const filledSpectatorSlots = spectatorSlotsResult[0]?.count || 0;

      return {
        eventId,
        playerSlots: {
          total: totalPlayerSlots,
          filled: filledPlayerSlots,
          available: Math.max(0, totalPlayerSlots - filledPlayerSlots),
        },
        alternateSlots: {
          total: totalAlternateSlots,
          filled: filledAlternateSlots,
          available: Math.max(0, totalAlternateSlots - filledAlternateSlots),
        },
        spectatorSlots: {
          unlimited: true,
          filled: filledSpectatorSlots,
        },
      };
    } catch (error) {
      logger.error(
        "Failed to get available slots",
        error instanceof Error ? error : new Error(String(error)),
        { eventId },
      );
      throw error;
    }
  }

  /**
   * Assign a player to a specific slot position
   */
  async assignPlayerSlot(
    eventId: string,
    userId: string,
    position?: number,
  ): Promise<SlotAssignmentResult> {
    const result = await withTransaction(async (tx) => {
      try {
        // Get event configuration within transaction
        const eventResult = await tx
          .select({
            playerSlots: events.playerSlots,
          })
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1);

        if (!eventResult || eventResult.length === 0) {
          throw new Error("Event not found");
        }

        const event = eventResult[0];
        if (!event) {
          throw new Error("Event not found");
        }
        const totalPlayerSlots = event.playerSlots ?? 0;

        // Count filled player slots within transaction
        const filledSlotsResult = await tx
          .select({ count: count() })
          .from(eventAttendees)
          .where(
            and(
              eq(eventAttendees.eventId, eventId),
              eq(eventAttendees.slotType, "player"),
            ),
          );

        const filledSlots = filledSlotsResult[0]?.count || 0;
        const availableSlots = Math.max(0, totalPlayerSlots - filledSlots);

        if (availableSlots === 0) {
          throw new Error("No player slots available");
        }

        // If position not specified, find next available position
        let assignedPosition: number;
        if (position === undefined || position === null) {
          const existingPositions = await tx
            .select({ slotPosition: eventAttendees.slotPosition })
            .from(eventAttendees)
            .where(
              and(
                eq(eventAttendees.eventId, eventId),
                eq(eventAttendees.slotType, "player"),
              ),
            )
            .orderBy(asc(eventAttendees.slotPosition));

          const usedPositions = existingPositions
            .map((p) => p.slotPosition)
            .filter((p): p is number => p !== null);

          // Find the first available position
          assignedPosition = 1;
          while (usedPositions.includes(assignedPosition)) {
            assignedPosition++;
          }
        } else {
          // Position was specified, validate it
          assignedPosition = position;

          // Validate position is not already taken
          const existingAtPosition = await tx
            .select()
            .from(eventAttendees)
            .where(
              and(
                eq(eventAttendees.eventId, eventId),
                eq(eventAttendees.slotType, "player"),
                eq(eventAttendees.slotPosition, assignedPosition),
              ),
            )
            .limit(1);

          if (existingAtPosition.length > 0) {
            throw new Error(`Position ${assignedPosition} is already taken`);
          }

          // Validate position is within bounds (using fresh data from transaction)
          if (assignedPosition < 1 || assignedPosition > totalPlayerSlots) {
            throw new Error(
              `Position must be between 1 and ${totalPlayerSlots}`,
            );
          }
        }

        // Check if user is already registered for this event
        const existingAttendee = await tx
          .select()
          .from(eventAttendees)
          .where(
            and(
              eq(eventAttendees.eventId, eventId),
              eq(eventAttendees.userId, userId),
            ),
          )
          .limit(1);

        let attendee: EventAttendee;

        if (existingAttendee.length > 0 && existingAttendee[0]) {
          // Update existing attendee
          const updated = await tx
            .update(eventAttendees)
            .set({
              slotType: "player",
              slotPosition: assignedPosition,
              assignedAt: new Date(),
              status: "confirmed",
            })
            .where(eq(eventAttendees.id, existingAttendee[0].id))
            .returning();

          if (!updated[0]) {
            throw new Error("Failed to update attendee");
          }
          attendee = updated[0];
        } else {
          // Create new attendee
          const inserted = await tx
            .insert(eventAttendees)
            .values({
              eventId,
              userId,
              slotType: "player",
              slotPosition: assignedPosition,
              assignedAt: new Date(),
              status: "confirmed",
              role: "participant",
            })
            .returning();

          if (!inserted[0]) {
            throw new Error("Failed to create attendee");
          }
          attendee = inserted[0];
        }

        logger.info("Player slot assigned", {
          eventId,
          userId,
          position: assignedPosition,
        });

        return {
          success: true,
          attendee,
          message: `Assigned to player slot ${assignedPosition}`,
        };
      } catch (error) {
        logger.error(
          "Failed to assign player slot",
          error instanceof Error ? error : new Error(String(error)),
          { eventId, userId, position },
        );
        throw error;
      }
    });

    // After successful assignment, check if all slots are filled and create game session
    if (result.success) {
      await this.checkAndCreateGameSession(eventId);
    }

    return result;
  }

  /**
   * Assign a user to an alternate slot
   */
  async assignAlternateSlot(
    eventId: string,
    userId: string,
  ): Promise<SlotAssignmentResult> {
    return withTransaction(async (tx) => {
      try {
        // Get slot availability
        const availability = await this.getAvailableSlots(eventId);

        if (availability.alternateSlots.available === 0) {
          throw new Error("No alternate slots available");
        }

        // Find next available position
        const existingPositions = await tx
          .select({ slotPosition: eventAttendees.slotPosition })
          .from(eventAttendees)
          .where(
            and(
              eq(eventAttendees.eventId, eventId),
              eq(eventAttendees.slotType, "alternate"),
            ),
          )
          .orderBy(asc(eventAttendees.slotPosition));

        const usedPositions = existingPositions
          .map((p) => p.slotPosition)
          .filter((p): p is number => p !== null);

        let assignedPosition = 1;
        while (usedPositions.includes(assignedPosition)) {
          assignedPosition++;
        }

        // Check if user is already registered for this event
        const existingAttendee = await tx
          .select()
          .from(eventAttendees)
          .where(
            and(
              eq(eventAttendees.eventId, eventId),
              eq(eventAttendees.userId, userId),
            ),
          )
          .limit(1);

        let attendee: EventAttendee;

        if (existingAttendee.length > 0 && existingAttendee[0]) {
          // Update existing attendee
          const updated = await tx
            .update(eventAttendees)
            .set({
              slotType: "alternate",
              slotPosition: assignedPosition,
              assignedAt: new Date(),
              status: "waitlist",
            })
            .where(eq(eventAttendees.id, existingAttendee[0].id))
            .returning();

          if (!updated[0]) {
            throw new Error("Failed to update attendee");
          }
          attendee = updated[0];
        } else {
          // Create new attendee
          const inserted = await tx
            .insert(eventAttendees)
            .values({
              eventId,
              userId,
              slotType: "alternate",
              slotPosition: assignedPosition,
              assignedAt: new Date(),
              status: "waitlist",
              role: "participant",
            })
            .returning();

          if (!inserted[0]) {
            throw new Error("Failed to create attendee");
          }
          attendee = inserted[0];
        }

        logger.info("Alternate slot assigned", {
          eventId,
          userId,
          position: assignedPosition,
        });

        return {
          success: true,
          attendee,
          message: `Assigned to alternate slot ${assignedPosition}`,
        };
      } catch (error) {
        logger.error(
          "Failed to assign alternate slot",
          error instanceof Error ? error : new Error(String(error)),
          { eventId, userId },
        );
        throw error;
      }
    });
  }

  /**
   * Promote an alternate to a specific player slot position
   */
  async promoteAlternate(
    eventId: string,
    slotPosition: number,
  ): Promise<SlotAssignmentResult> {
    const result = await withTransaction(async (tx) => {
      try {
        // Verify the slot position is empty
        const existingPlayer = await tx
          .select()
          .from(eventAttendees)
          .where(
            and(
              eq(eventAttendees.eventId, eventId),
              eq(eventAttendees.slotType, "player"),
              eq(eventAttendees.slotPosition, slotPosition),
            ),
          )
          .limit(1);

        if (existingPlayer.length > 0) {
          throw new Error(`Player slot ${slotPosition} is already filled`);
        }

        // Find the next alternate in line (lowest position)
        const nextAlternate = await tx
          .select()
          .from(eventAttendees)
          .where(
            and(
              eq(eventAttendees.eventId, eventId),
              eq(eventAttendees.slotType, "alternate"),
            ),
          )
          .orderBy(asc(eventAttendees.slotPosition))
          .limit(1);

        if (nextAlternate.length === 0) {
          throw new Error("No alternates available to promote");
        }

        const alternate = nextAlternate[0];
        if (!alternate) {
          throw new Error("No alternates available to promote");
        }

        // Promote the alternate to player
        const updated = await tx
          .update(eventAttendees)
          .set({
            slotType: "player",
            slotPosition: slotPosition,
            assignedAt: new Date(),
            status: "confirmed",
          })
          .where(eq(eventAttendees.id, alternate.id))
          .returning();

        const promotedAttendee = updated[0];
        if (!promotedAttendee) {
          throw new Error("Failed to promote alternate");
        }

        logger.info("Alternate promoted to player", {
          eventId,
          userId: promotedAttendee.userId,
          fromPosition: alternate.slotPosition,
          toPosition: slotPosition,
        });

        return {
          success: true,
          attendee: promotedAttendee,
          message: `Promoted from alternate to player slot ${slotPosition}`,
        };
      } catch (error) {
        logger.error(
          "Failed to promote alternate",
          error instanceof Error ? error : new Error(String(error)),
          { eventId, slotPosition },
        );
        throw error;
      }
    });

    // After successful promotion, update game session or create if all slots filled
    if (result.success) {
      const sessionResult = await this.checkAndCreateGameSession(eventId);
      if (!sessionResult.sessionCreated) {
        // Session already exists, just update it
        await this.updateGameSession(eventId);
      }
    }

    return result;
  }

  /**
   * Swap two player positions
   */
  async swapPlayerPositions(
    eventId: string,
    userId1: string,
    userId2: string,
  ): Promise<{ success: boolean; message: string }> {
    const result = await withTransaction(async (tx) => {
      try {
        // Get both attendees
        const attendees = await tx
          .select()
          .from(eventAttendees)
          .where(
            and(
              eq(eventAttendees.eventId, eventId),
              or(
                eq(eventAttendees.userId, userId1),
                eq(eventAttendees.userId, userId2),
              ),
              eq(eventAttendees.slotType, "player"),
            ),
          );

        if (attendees.length !== 2) {
          throw new Error("Both users must be registered as players");
        }

        const attendee1 = attendees.find((a) => a.userId === userId1);
        const attendee2 = attendees.find((a) => a.userId === userId2);

        if (!attendee1 || !attendee2) {
          throw new Error("Both users must be registered as players");
        }

        const position1 = attendee1.slotPosition;
        const position2 = attendee2.slotPosition;

        if (position1 === null || position2 === null) {
          throw new Error("Both players must have assigned positions");
        }

        // Swap positions
        await tx
          .update(eventAttendees)
          .set({ slotPosition: position2 })
          .where(eq(eventAttendees.id, attendee1.id));

        await tx
          .update(eventAttendees)
          .set({ slotPosition: position1 })
          .where(eq(eventAttendees.id, attendee2.id));

        logger.info("Player positions swapped", {
          eventId,
          userId1,
          userId2,
          position1,
          position2,
        });

        return {
          success: true,
          message: `Swapped positions ${position1} and ${position2}`,
        };
      } catch (error) {
        logger.error(
          "Failed to swap player positions",
          error instanceof Error ? error : new Error(String(error)),
          { eventId, userId1, userId2 },
        );
        throw error;
      }
    });

    // After successful swap, update game session
    if (result.success) {
      await this.updateGameSession(eventId);
    }

    return result;
  }

  /**
   * Remove a player from their slot and promote next alternate if available
   */
  async removePlayerSlot(
    eventId: string,
    userId: string,
  ): Promise<{ success: boolean; promotedAlternate?: EventAttendee }> {
    const result = await withTransaction(async (tx) => {
      try {
        // Get the attendee
        const attendee = await tx
          .select()
          .from(eventAttendees)
          .where(
            and(
              eq(eventAttendees.eventId, eventId),
              eq(eventAttendees.userId, userId),
              eq(eventAttendees.slotType, "player"),
            ),
          )
          .limit(1);

        if (attendee.length === 0 || !attendee[0]) {
          throw new Error("Player not found in event");
        }

        const player = attendee[0];
        const playerPosition = player.slotPosition;

        // Remove the player from their slot
        // Note: We set slotType and slotPosition to null (rather than keeping the old values)
        // to indicate the slot is now free. The 'cancelled' status tracks that they left.
        // The schema allows null values for these fields to support flexible slot management.
        await tx
          .update(eventAttendees)
          .set({
            // TODO: If clearing slotType and slotPosition is required, update the schema to allow nulls.
            status: "cancelled",
          })
          .where(eq(eventAttendees.id, player.id));

        // Try to promote an alternate
        let promotedAlternate: EventAttendee | undefined;
        if (playerPosition !== null) {
          try {
            const result = await this.promoteAlternate(eventId, playerPosition);
            promotedAlternate = result.attendee;
          } catch (error) {
            // No alternates available or other promotion error
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            logger.info("Could not promote alternate", {
              eventId,
              error: errorMessage,
              reason: errorMessage.includes("No alternates")
                ? "no_alternates"
                : "promotion_failed",
            });
          }
        }

        logger.info("Player slot removed", {
          eventId,
          userId,
          promotedAlternate: promotedAlternate?.userId,
        });

        return {
          success: true,
          promotedAlternate,
        };
      } catch (error) {
        logger.error(
          "Failed to remove player slot",
          error instanceof Error ? error : new Error(String(error)),
          { eventId, userId },
        );
        throw error;
      }
    });

    // After removal and potential promotion, update game session
    if (result.success) {
      await this.updateGameSession(eventId);
    }

    return result;
  }

  /**
   * Get all slot assignments for an event
   */
  async getSlotAssignments(eventId: string): Promise<{
    players: EventAttendee[];
    alternates: EventAttendee[];
    spectators: EventAttendee[];
  }> {
    try {
      const allAttendees = await db
        .select()
        .from(eventAttendees)
        .where(eq(eventAttendees.eventId, eventId))
        .orderBy(asc(eventAttendees.slotPosition));

      const players = allAttendees.filter((a) => a.slotType === "player");
      const alternates = allAttendees.filter((a) => a.slotType === "alternate");
      const spectators = allAttendees.filter((a) => a.slotType === "spectator");

      return {
        players,
        alternates,
        spectators,
      };
    } catch (error) {
      logger.error(
        "Failed to get slot assignments",
        error instanceof Error ? error : new Error(String(error)),
        { eventId },
      );
      throw error;
    }
  }

  /**
   * Check if all player slots are filled and create game session if needed
   * This is called automatically after slot assignments
   */
  async checkAndCreateGameSession(eventId: string): Promise<{
    sessionCreated: boolean;
    sessionId?: string;
  }> {
    try {
      // Get event details
      const eventResult = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (!eventResult || eventResult.length === 0 || !eventResult[0]) {
        return { sessionCreated: false };
      }

      const event = eventResult[0];

      // Only create sessions for game_pod events
      if (event.type !== "game_pod") {
        return { sessionCreated: false };
      }

      // Check if all player slots are filled
      const availability = await this.getAvailableSlots(eventId);

      if (availability.playerSlots.available !== 0) {
        // Not all slots filled yet
        return { sessionCreated: false };
      }

      // Check if session already exists for this event
      const existingSession = await db
        .select()
        .from(gameSessions)
        .where(eq(gameSessions.eventId, eventId))
        .limit(1);

      if (existingSession.length > 0) {
        // Session already exists
        return { sessionCreated: false, sessionId: existingSession[0]?.id };
      }

      // Get all players for the session
      const assignments = await this.getSlotAssignments(eventId);

      // Create game session with player positions
      const gameData = {
        playerPositions: assignments.players.map((p) => ({
          userId: p.userId,
          position: p.slotPosition,
        })),
        eventId: eventId,
      };

      const sessionId = crypto.randomUUID();
      await db.insert(gameSessions).values({
        id: sessionId,
        eventId: eventId,
        gameType: event.gameFormat || "game_pod",
        communityId: event.communityId || undefined,
        status: "waiting",
        maxPlayers: event.playerSlots || assignments.players.length,
        currentPlayers: assignments.players.length,
        hostId: event.creatorId,
        gameData: JSON.stringify(gameData),
      });

      logger.info("Game session created for filled game pod", {
        eventId,
        sessionId,
        playerCount: assignments.players.length,
      });

      return { sessionCreated: true, sessionId };
    } catch (error) {
      logger.error(
        "Failed to check and create game session",
        error instanceof Error ? error : new Error(String(error)),
        { eventId },
      );
      // Don't throw - this is a non-critical operation
      return { sessionCreated: false };
    }
  }

  /**
   * Update game session when players change
   * Called after slot changes to sync with TableSync
   */
  async updateGameSession(eventId: string): Promise<boolean> {
    try {
      // Find existing session
      const existingSession = await db
        .select()
        .from(gameSessions)
        .where(eq(gameSessions.eventId, eventId))
        .limit(1);

      if (existingSession.length === 0 || !existingSession[0]) {
        // No session to update
        return false;
      }

      const session = existingSession[0];

      // Get current slot assignments
      const assignments = await this.getSlotAssignments(eventId);

      // Update game data with current player positions
      const gameData = {
        playerPositions: assignments.players.map((p) => ({
          userId: p.userId,
          position: p.slotPosition,
        })),
        eventId: eventId,
      };

      await db
        .update(gameSessions)
        .set({
          currentPlayers: assignments.players.length,
          gameData: JSON.stringify(gameData),
        })
        .where(eq(gameSessions.id, session.id));

      logger.info("Game session updated with new player positions", {
        eventId,
        sessionId: session.id,
        playerCount: assignments.players.length,
      });

      return true;
    } catch (error) {
      logger.error(
        "Failed to update game session",
        error instanceof Error ? error : new Error(String(error)),
        { eventId },
      );
      // Don't throw - this is a non-critical operation
      return false;
    }
  }
}

// Export singleton instance
export const gamePodSlotService = new GamePodSlotService();
