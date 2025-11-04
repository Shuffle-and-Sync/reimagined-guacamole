/**
 * Game Authorization Middleware
 *
 * Implements authorization checks for game actions including:
 * - Session participation verification
 * - Turn-based action validation
 * - Session capacity checks
 * - Permission verification for game actions
 */

import { z } from "zod";
import type { GameSession } from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { storage } from "../storage";

/**
 * Game action types that require turn validation
 */
const TURN_BASED_ACTIONS = [
  "play_card",
  "attack",
  "end_turn",
  "draw_card",
  "move_piece",
  "cast_spell",
  "activate_ability",
];

/**
 * Zod schemas for different game action types
 */
export const gameActionSchemas = {
  // Basic game action schema
  baseAction: z.object({
    type: z.string().min(1),
    sessionId: z.string().uuid(),
    userId: z.string(),
    timestamp: z.number().optional(),
  }),

  // Card play action
  playCard: z.object({
    type: z.literal("play_card"),
    sessionId: z.string().uuid(),
    userId: z.string(),
    cardId: z.string(),
    position: z
      .object({
        x: z.number().int().min(0),
        y: z.number().int().min(0),
      })
      .optional(),
    targets: z.array(z.string()).optional(),
    timestamp: z.number().optional(),
  }),

  // Draw card action
  drawCard: z.object({
    type: z.literal("draw_card"),
    sessionId: z.string().uuid(),
    userId: z.string(),
    count: z.number().int().min(1).max(10).default(1),
    timestamp: z.number().optional(),
  }),

  // Attack action
  attack: z.object({
    type: z.literal("attack"),
    sessionId: z.string().uuid(),
    userId: z.string(),
    attackerId: z.string(),
    targetId: z.string(),
    timestamp: z.number().optional(),
  }),

  // End turn action
  endTurn: z.object({
    type: z.literal("end_turn"),
    sessionId: z.string().uuid(),
    userId: z.string(),
    timestamp: z.number().optional(),
  }),

  // Move piece action
  movePiece: z.object({
    type: z.literal("move_piece"),
    sessionId: z.string().uuid(),
    userId: z.string(),
    pieceId: z.string(),
    from: z.object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
    }),
    to: z.object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
    }),
    timestamp: z.number().optional(),
  }),

  // Generic action for extensibility
  generic: z.object({
    type: z.string().min(1),
    sessionId: z.string().uuid(),
    userId: z.string(),
    data: z.record(z.unknown()).optional(),
    timestamp: z.number().optional(),
  }),
};

/**
 * Validate game action payload based on action type
 */
export function validateGameActionPayload(action: unknown): {
  valid: boolean;
  data?: z.infer<typeof gameActionSchemas.generic>;
  error?: string;
} {
  try {
    // First validate as generic action to extract type
    const genericResult = gameActionSchemas.generic.safeParse(action);
    if (!genericResult.success) {
      return {
        valid: false,
        error: `Invalid action format: ${genericResult.error.message}`,
      };
    }

    const actionType = genericResult.data.type;

    // Validate specific action type if schema exists
    const specificSchema = getSchemaForActionType(actionType);
    if (specificSchema) {
      const specificResult = specificSchema.safeParse(action);
      if (!specificResult.success) {
        return {
          valid: false,
          error: `Invalid ${actionType} action: ${specificResult.error.message}`,
        };
      }
      return { valid: true, data: specificResult.data };
    }

    // Fall back to generic validation
    return { valid: true, data: genericResult.data };
  } catch (error) {
    return {
      valid: false,
      error: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Get the appropriate schema for an action type
 */
function getSchemaForActionType(actionType: string): z.ZodSchema | null {
  const schemaMap: Record<string, z.ZodSchema> = {
    play_card: gameActionSchemas.playCard,
    draw_card: gameActionSchemas.drawCard,
    attack: gameActionSchemas.attack,
    end_turn: gameActionSchemas.endTurn,
    move_piece: gameActionSchemas.movePiece,
  };

  return schemaMap[actionType] || null;
}

/**
 * Check if an action type requires turn validation
 */
export function requiresTurnValidation(actionType: string): boolean {
  return TURN_BASED_ACTIONS.includes(actionType);
}

/**
 * Authorization result interface
 */
export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  sessionData?: GameSession & {
    host: { id: string; username: string };
    coHost?: { id: string; username: string };
    event: { id: string; title: string };
  };
}

/**
 * Check if user is authorized to join a game session
 */
export async function authorizeSessionJoin(
  sessionId: string,
  userId: string,
): Promise<AuthorizationResult> {
  try {
    // Get session data
    const session = await storage.getGameSessionById(sessionId);

    if (!session) {
      return {
        authorized: false,
        reason: "Session not found",
      };
    }

    // Check if session is in a joinable state
    if (session.status === "completed" || session.status === "cancelled") {
      return {
        authorized: false,
        reason: `Session is ${session.status}`,
      };
    }

    // Host and co-host can always join their own session
    if (session.hostId === userId || session.coHostId === userId) {
      return {
        authorized: true,
        sessionData: session,
      };
    }

    // Check if session is already full
    if (session.maxPlayers && session.currentPlayers >= session.maxPlayers) {
      return {
        authorized: false,
        reason: "Session is full",
      };
    }

    // TODO: Add checks for:
    // - User is not banned from the session
    // - Session is public or user is invited
    // - Community membership requirements
    // For now, allow joining if session is not full and active

    return {
      authorized: true,
      sessionData: session,
    };
  } catch (error) {
    logger.error(
      "Error checking session join authorization",
      toLoggableError(error),
      { sessionId, userId },
    );
    return {
      authorized: false,
      reason: "Authorization check failed",
    };
  }
}

/**
 * Check if user is authorized to perform a game action
 */
export async function authorizeGameAction(
  sessionId: string,
  userId: string,
  action: { type: string; [key: string]: unknown },
): Promise<AuthorizationResult> {
  try {
    // Get session data
    const session = await storage.getGameSessionById(sessionId);

    if (!session) {
      return {
        authorized: false,
        reason: "Session not found",
      };
    }

    // Check if session is active
    if (session.status !== "active" && session.status !== "waiting") {
      return {
        authorized: false,
        reason: `Cannot perform actions in ${session.status} session`,
      };
    }

    // Check if user is a participant (host, co-host, or joined player)
    const isHost = session.hostId === userId;
    const isCoHost = session.coHostId === userId;

    // For now, consider user as participant if they are host or co-host
    // TODO: Implement proper player tracking to check if user has joined
    const isParticipant = isHost || isCoHost;

    if (!isParticipant) {
      return {
        authorized: false,
        reason: "User is not a participant in this session",
      };
    }

    // Check turn-based actions
    if (requiresTurnValidation(action.type)) {
      let boardState = null;
      if (session.boardState) {
        try {
          boardState = JSON.parse(session.boardState);
        } catch (parseError) {
          logger.warn(
            "Failed to parse session.boardState during authorization",
            parseError instanceof Error
              ? parseError
              : new Error(String(parseError)),
            { sessionId, userId },
          );
          return {
            authorized: false,
            reason: "Session board state is corrupted or invalid",
          };
        }
      }

      if (
        boardState?.currentTurn?.playerId &&
        boardState.currentTurn.playerId !== userId
      ) {
        return {
          authorized: false,
          reason: "It is not your turn",
        };
      }
    }

    return {
      authorized: true,
      sessionData: session,
    };
  } catch (error) {
    logger.error(
      "Error checking game action authorization",
      toLoggableError(error),
      { sessionId, userId, actionType: action.type },
    );
    return {
      authorized: false,
      reason: "Authorization check failed",
    };
  }
}

/**
 * Check if user is authorized to spectate a game session
 */
export async function authorizeSpectate(
  sessionId: string,
  userId: string,
): Promise<AuthorizationResult> {
  try {
    // Get session data
    const session = await storage.getGameSessionById(sessionId);

    if (!session) {
      return {
        authorized: false,
        reason: "Session not found",
      };
    }

    // Check if session allows spectators
    // TODO: Add spectator limit and permission checks
    // For now, allow spectating any active session

    if (session.status === "completed" || session.status === "cancelled") {
      return {
        authorized: false,
        reason: `Cannot spectate ${session.status} session`,
      };
    }

    return {
      authorized: true,
      sessionData: session,
    };
  } catch (error) {
    logger.error(
      "Error checking spectate authorization",
      toLoggableError(error),
      { sessionId, userId },
    );
    return {
      authorized: false,
      reason: "Authorization check failed",
    };
  }
}

/**
 * Sanitize user input to prevent injection attacks
 * Uses a more robust approach that doesn't rely on regex for HTML tag removal
 */
export function sanitizeGameInput(input: string): string {
  // Trim whitespace first
  let sanitized = input.trim();

  // Limit length
  const maxLength = 1000;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Use a whitelist approach - only allow specific characters
  // This is more secure than trying to remove dangerous patterns
  // Allow: alphanumeric, spaces, common punctuation, but not < > characters
  sanitized = sanitized.replace(/[<>]/g, "");

  // Additional protection: remove any remaining potential script injection patterns
  // by replacing common attack vectors
  const dangerousPatterns = [
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /data:/gi,
    /vbscript:/gi,
  ];

  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, "");
  }

  return sanitized;
}

/**
 * Validate and sanitize game action data
 */
export function sanitizeGameActionData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeGameInput(value);
    } else if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === "string" ? sanitizeGameInput(item) : item,
        );
      } else {
        sanitized[key] = sanitizeGameActionData(
          value as Record<string, unknown>,
        );
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
