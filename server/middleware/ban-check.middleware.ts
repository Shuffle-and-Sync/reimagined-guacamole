/**
 * Ban Check Middleware
 *
 * Middleware to check if a user is banned before allowing access to resources
 * Supports global, community, and game session scoped bans
 */

import { toLoggableError } from "@shared/utils/type-guards";
import { banService } from "../features/moderation/ban.service";
import { logger } from "../logger";
import type { Request, Response, NextFunction } from "express";

export interface BanCheckOptions {
  scope?: "global" | "community" | "game_session";
  scopeIdParam?: string; // Name of the param that contains scopeId (e.g., 'communityId')
}

/**
 * Middleware to check if user is banned before allowing access
 */
export function checkBanStatus(options: BanCheckOptions = {}) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const userId = req.user.id;
    const { scope, scopeIdParam } = options;
    const scopeId = scopeIdParam ? req.params[scopeIdParam] : undefined;

    try {
      const banCheck = await banService.isUserBanned(userId, scope, scopeId);

      if (banCheck.banned) {
        logger.warn(`Banned user ${userId} attempted access`, {
          scope,
          scopeId,
          reason: banCheck.reason,
        });

        res.status(403).json({
          error: "Access forbidden",
          reason: "You have been banned from this resource",
          banReason: banCheck.ban?.reason,
          banExpiry: banCheck.ban?.endTime,
          isPermanent: !banCheck.ban?.endTime,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error(
        "Error checking ban status",
        toLoggableError(error),
        { userId },
      );
      // Fail open to avoid blocking legitimate users on errors
      next();
    }
  };
}
