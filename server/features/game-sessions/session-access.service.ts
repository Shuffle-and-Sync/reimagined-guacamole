/**
 * Session Access Service
 *
 * Manages access control for game sessions including:
 * - Public/private/invite-only session access
 * - Password-protected sessions
 * - Community membership requirements
 * - Spectator limits
 * - Session invitations
 */

import bcryptjs from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db } from "@shared/database-unified";
import {
  gameSessions,
  sessionInvitations,
  userCommunities,
  type SessionInvitation,
} from "@shared/schema";
import { logger } from "../../logger";

export class SessionAccessService {
  /**
   * Check if user can access a session
   */
  async canAccessSession(
    userId: string,
    sessionId: string,
    role: "player" | "spectator",
    password?: string,
  ): Promise<{
    allowed: boolean;
    reason?: string;
    requiresInvite?: boolean;
  }> {
    try {
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, sessionId),
      });

      if (!session) {
        return { allowed: false, reason: "Session not found" };
      }

      // Host always has access
      if (session.hostId === userId || session.coHostId === userId) {
        return { allowed: true };
      }

      // Check visibility rules
      switch (session.visibility) {
        case "public": {
          // Check spectator rules if joining as spectator
          if (role === "spectator") {
            if (!session.allowSpectators) {
              return { allowed: false, reason: "Spectators not allowed" };
            }

            // Count current spectators
            const spectators = JSON.parse(session.spectators || "[]");
            if (
              session.maxSpectators &&
              spectators.length >= session.maxSpectators
            ) {
              return { allowed: false, reason: "Spectator limit reached" };
            }
          }

          // Check if password protected
          if (session.password) {
            if (!password) {
              return { allowed: false, reason: "Password required" };
            }

            const passwordMatch = await bcryptjs.compare(
              password,
              session.password,
            );
            if (!passwordMatch) {
              return { allowed: false, reason: "Incorrect password" };
            }
          }

          return { allowed: true };
        }

        case "private":
        case "invite_only": {
          // Check for valid invitation
          const invitation = await db.query.sessionInvitations.findFirst({
            where: and(
              eq(sessionInvitations.sessionId, sessionId),
              eq(sessionInvitations.inviteeId, userId),
              eq(sessionInvitations.status, "accepted"),
            ),
          });

          if (!invitation) {
            return {
              allowed: false,
              reason: "Invitation required",
              requiresInvite: true,
            };
          }

          // Check if invitation role matches requested role
          if (invitation.role !== role) {
            return {
              allowed: false,
              reason: `Invited as ${invitation.role}, not ${role}`,
            };
          }

          return { allowed: true };
        }

        case "community_only": {
          // Check community membership
          if (!session.communityId) {
            return { allowed: false, reason: "Community not specified" };
          }

          const membership = await db.query.userCommunities.findFirst({
            where: and(
              eq(userCommunities.communityId, session.communityId),
              eq(userCommunities.userId, userId),
            ),
          });

          if (!membership) {
            return {
              allowed: false,
              reason: "Must be a community member",
            };
          }

          // Check spectator limits
          if (role === "spectator") {
            if (!session.allowSpectators) {
              return { allowed: false, reason: "Spectators not allowed" };
            }

            const spectators = JSON.parse(session.spectators || "[]");
            if (
              session.maxSpectators &&
              spectators.length >= session.maxSpectators
            ) {
              return { allowed: false, reason: "Spectator limit reached" };
            }
          }

          return { allowed: true };
        }

        default:
          return { allowed: false, reason: "Invalid session visibility" };
      }
    } catch (error) {
      logger.error(
        "Error checking session access",
        error instanceof Error ? error : new Error(String(error)),
        { userId, sessionId, role },
      );
      // Fail closed for security - deny access on errors
      return { allowed: false, reason: "Error checking access" };
    }
  }

  /**
   * Create a session invitation
   */
  async createInvitation(data: {
    sessionId: string;
    inviterId: string;
    inviteeId: string;
    role: "player" | "spectator";
    message?: string;
    expiresInHours?: number;
  }): Promise<SessionInvitation> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 48));

      const [invitation] = await db
        .insert(sessionInvitations)
        .values({
          id: crypto.randomUUID(),
          sessionId: data.sessionId,
          inviterId: data.inviterId,
          inviteeId: data.inviteeId,
          role: data.role,
          message: data.message,
          status: "pending",
          expiresAt,
          createdAt: new Date(),
        })
        .returning();

      if (!invitation) {
        throw new Error("Failed to create invitation");
      }

      logger.info(`Session invitation created`, {
        sessionId: data.sessionId,
        inviterId: data.inviterId,
        inviteeId: data.inviteeId,
        role: data.role,
      });

      return invitation;
    } catch (error) {
      logger.error(
        "Error creating invitation",
        error instanceof Error ? error : new Error(String(error)),
        { sessionId: data.sessionId },
      );
      throw error;
    }
  }

  /**
   * Respond to an invitation
   */
  async respondToInvitation(
    invitationId: string,
    userId: string,
    accept: boolean,
  ): Promise<SessionInvitation> {
    try {
      const invitation = await db.query.sessionInvitations.findFirst({
        where: eq(sessionInvitations.id, invitationId),
      });

      if (!invitation) {
        throw new Error("Invitation not found");
      }

      if (invitation.inviteeId !== userId) {
        throw new Error("Not authorized to respond to this invitation");
      }

      if (invitation.status !== "pending") {
        throw new Error("Invitation already responded to");
      }

      if (new Date() > invitation.expiresAt) {
        // Mark invitation as expired in the database
        await db
          .update(sessionInvitations)
          .set({
            status: "expired",
            respondedAt: new Date(),
          })
          .where(eq(sessionInvitations.id, invitationId));

        throw new Error("Invitation has expired");
      }

      const [updated] = await db
        .update(sessionInvitations)
        .set({
          status: accept ? "accepted" : "declined",
          respondedAt: new Date(),
        })
        .where(eq(sessionInvitations.id, invitationId))
        .returning();

      if (!updated) {
        throw new Error("Failed to update invitation");
      }

      logger.info(`Invitation ${accept ? "accepted" : "declined"}`, {
        invitationId,
        userId,
      });

      return updated;
    } catch (error) {
      logger.error(
        "Error responding to invitation",
        error instanceof Error ? error : new Error(String(error)),
        { invitationId, userId },
      );
      throw error;
    }
  }

  /**
   * Get user's pending invitations
   */
  async getUserInvitations(userId: string): Promise<SessionInvitation[]> {
    try {
      return await db
        .select()
        .from(sessionInvitations)
        .where(
          and(
            eq(sessionInvitations.inviteeId, userId),
            eq(sessionInvitations.status, "pending"),
          ),
        );
    } catch (error) {
      logger.error(
        "Error getting user invitations",
        error instanceof Error ? error : new Error(String(error)),
        { userId },
      );
      return [];
    }
  }
}

export const sessionAccessService = new SessionAccessService();
