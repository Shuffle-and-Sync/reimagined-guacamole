/**
 * Community Access Middleware
 *
 * Middleware to check community membership and role-based access control
 * Supports owner, moderator, and member roles with hierarchical permissions
 */

import { eq, and } from "drizzle-orm";
import { db } from "@shared/database-unified";
import { userCommunities, communities } from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import type { Request, Response, NextFunction } from "express";

export interface CommunityAccessOptions {
  communityIdParam?: string;
  // Note: The following options are defined for future enhancement but not currently implemented
  // requireRole?: "owner" | "moderator" | "member";
  // allowPublic?: boolean;
}

/**
 * Middleware to check community access and membership
 */
export function checkCommunityAccess(options: CommunityAccessOptions = {}) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const communityId = req.params[options.communityIdParam || "communityId"];

    if (!communityId) {
      res.status(400).json({ error: "Community ID required" });
      return;
    }

    try {
      // Get community details
      const community = await db.query.communities.findFirst({
        where: eq(communities.id, communityId),
      });

      if (!community) {
        res.status(404).json({ error: "Community not found" });
        return;
      }

      // Check if public access is allowed
      // Note: Future enhancement - requires adding "type" or "isPublic" field to communities table

      // Check membership
      const membership = await db.query.userCommunities.findFirst({
        where: and(
          eq(userCommunities.communityId, communityId),
          eq(userCommunities.userId, req.user.id),
        ),
      });

      if (!membership) {
        logger.warn(
          `User ${req.user.id} attempted access to community ${communityId} without membership`,
        );
        res.status(403).json({
          error: "Access denied",
          reason: "Community membership required",
        });
        return;
      }

      // Check role requirements if specified
      // Note: Future enhancement - requires adding "role" field to userCommunities table

      // Attach membership to request for use in controllers
      req.communityMembership = membership;
      next();
    } catch (error) {
      logger.error(
        "Error checking community access",
        toLoggableError(error),
        { communityId },
      );
      res.status(500).json({ error: "Error checking access" });
    }
  };
}

// Type declaration for Express Request extension
export interface CommunityMembership {
  id: string;
  userId: string;
  communityId: string;
  isPrimary: boolean | null;
  joinedAt: Date | null;
}

declare module "express-serve-static-core" {
  interface Request {
    communityMembership?: CommunityMembership;
  }
}
