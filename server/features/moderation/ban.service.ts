/**
 * Ban Service
 *
 * Manages user bans at different scopes (global, community, game_session)
 * Provides methods for creating, lifting, and checking active bans
 */

import { eq, and, or, isNull, gt } from "drizzle-orm";
import { db } from "@shared/database-unified";
import { userBans, type UserBan, type InsertUserBan } from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../../logger";

export class BanService {
  /**
   * Check if a user is currently banned (global or scope-specific)
   */
  async isUserBanned(
    userId: string,
    scope?: "global" | "community" | "game_session",
    scopeId?: string,
  ): Promise<{ banned: boolean; ban?: UserBan; reason?: string }> {
    const now = new Date();

    try {
      // Build query based on scope
      const conditions = [
        eq(userBans.userId, userId),
        eq(userBans.isActive, true),
        or(isNull(userBans.endTime), gt(userBans.endTime, now)),
      ];

      if (scope === "global") {
        conditions.push(eq(userBans.scope, "global"));
      } else if (scope && scopeId) {
        conditions.push(
          or(
            eq(userBans.scope, "global"),
            and(eq(userBans.scope, scope), eq(userBans.scopeId, scopeId)),
          ),
        );
      }

      const activeBans = await db
        .select()
        .from(userBans)
        .where(and(...conditions))
        .limit(1);

      const ban = activeBans[0];

      if (ban) {
        return {
          banned: true,
          ban,
          reason: ban.reason,
        };
      }

      return { banned: false };
    } catch (error) {
      logger.error(
        "Error checking ban status",
        toLoggableError(error),
        { userId, scope, scopeId },
      );
      // Fail open to avoid blocking legitimate users on database errors
      return { banned: false };
    }
  }

  /**
   * Create a new ban
   */
  async createBan(ban: InsertUserBan): Promise<UserBan> {
    try {
      const [newBan] = await db
        .insert(userBans)
        .values({
          ...ban,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!newBan) {
        throw new Error("Failed to create ban");
      }

      logger.info(`User ${ban.userId} banned`, {
        scope: ban.scope,
        scopeId: ban.scopeId,
        reason: ban.reason,
        bannedBy: ban.bannedBy,
      });

      return newBan;
    } catch (error) {
      logger.error(
        "Error creating ban",
        toLoggableError(error),
        { userId: ban.userId },
      );
      throw error;
    }
  }

  /**
   * Lift a ban (deactivate it)
   */
  async liftBan(banId: string, liftedBy: string): Promise<void> {
    try {
      // Fetch the existing ban to preserve previous notes
      const [existingBan] = await db
        .select()
        .from(userBans)
        .where(eq(userBans.id, banId));

      if (!existingBan) {
        throw new Error(`Ban ${banId} not found`);
      }

      const previousNotes = existingBan.notes ?? "";
      const liftedNote = `Lifted by ${liftedBy} at ${new Date().toISOString()}`;
      const newNotes = previousNotes
        ? `${previousNotes}\n${liftedNote}`
        : liftedNote;

      await db
        .update(userBans)
        .set({
          isActive: false,
          updatedAt: new Date(),
          notes: newNotes,
        })
        .where(eq(userBans.id, banId));

      logger.info(`Ban ${banId} lifted by ${liftedBy}`);
    } catch (error) {
      logger.error(
        "Error lifting ban",
        toLoggableError(error),
        { banId, liftedBy },
      );
      throw error;
    }
  }

  /**
   * Get active bans for a user
   */
  async getUserBans(userId: string): Promise<UserBan[]> {
    try {
      return await db
        .select()
        .from(userBans)
        .where(and(eq(userBans.userId, userId), eq(userBans.isActive, true)));
    } catch (error) {
      logger.error(
        "Error getting user bans",
        toLoggableError(error),
        { userId },
      );
      return [];
    }
  }

  /**
   * Get all bans for a specific scope
   */
  async getScopedBans(
    scope: "global" | "community" | "game_session",
    scopeId?: string,
  ): Promise<UserBan[]> {
    try {
      const conditions = [
        eq(userBans.scope, scope),
        eq(userBans.isActive, true),
      ];

      if (scopeId) {
        conditions.push(eq(userBans.scopeId, scopeId));
      }

      return await db
        .select()
        .from(userBans)
        .where(and(...conditions));
    } catch (error) {
      logger.error(
        "Error getting scoped bans",
        toLoggableError(error),
        { scope, scopeId },
      );
      return [];
    }
  }
}

export const banService = new BanService();
