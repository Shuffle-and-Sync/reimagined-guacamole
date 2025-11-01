/**
 * Session Access Middleware
 *
 * Middleware to check if user has access to game sessions based on
 * visibility settings, invitations, passwords, and spectator limits
 */

import { sessionAccessService } from "../features/game-sessions/session-access.service";
import { logger } from "../logger";
import type { Request, Response, NextFunction } from "express";

export interface SessionAccessOptions {
  role: "player" | "spectator";
  sessionIdParam?: string;
}

/**
 * Middleware to check session access permissions
 */
export function checkSessionAccess(options: SessionAccessOptions) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const sessionId = req.params[options.sessionIdParam || "sessionId"];
    const password = req.body.password; // Optional password for protected sessions

    if (!sessionId) {
      res.status(400).json({ error: "Session ID required" });
      return;
    }

    try {
      const accessCheck = await sessionAccessService.canAccessSession(
        req.user.id,
        sessionId,
        options.role,
        password,
      );

      if (!accessCheck.allowed) {
        logger.warn(
          `User ${req.user.id} denied access to session ${sessionId}`,
          {
            reason: accessCheck.reason,
            requiresInvite: accessCheck.requiresInvite,
          },
        );

        res.status(403).json({
          error: "Access denied",
          reason: accessCheck.reason,
          requiresInvite: accessCheck.requiresInvite,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error(
        "Error checking session access",
        error instanceof Error ? error : new Error(String(error)),
        { sessionId },
      );
      res.status(500).json({ error: "Error checking access" });
    }
  };
}
