/**
 * Authorization Middleware Types
 *
 * Defines types for role-based access control, permissions, and authorization
 * decisions for game actions.
 */

import { z } from "zod";

// ============================================================================
// Core Authorization Types
// ============================================================================

/**
 * Game roles for authorization
 */
export type GameRole = "player" | "spectator" | "moderator" | "admin";

/**
 * Permission operators for condition evaluation
 */
export type PermissionOperator = "eq" | "ne" | "in" | "custom";

/**
 * Authorization context for game actions
 */
export interface AuthContext {
  userId: string;
  sessionId: string;
  gameId: string;
  role: GameRole;
  permissions: Permission[];
  metadata?: Record<string, any>;
}

/**
 * Permission definition with resource, action, and optional conditions
 */
export interface Permission {
  resource: string; // e.g., 'game.state', 'player.hand'
  action: string; // e.g., 'read', 'write', 'execute'
  conditions?: PermissionCondition[];
}

/**
 * Condition for evaluating permissions
 */
export interface PermissionCondition {
  field: string;
  operator: PermissionOperator;
  value: any;
  customCheck?: (context: AuthContext, state: any) => boolean;
}

/**
 * Result of an authorization check
 */
export interface AuthResult {
  authorized: boolean;
  reason?: string;
  requiredPermissions?: string[];
}

/**
 * Authorization rule for matching and evaluating actions
 */
export interface AuthorizationRule {
  name: string;
  priority: number;
  match: (action: string, context: AuthContext) => boolean;
  authorize: (action: string, context: AuthContext, state: any) => AuthResult;
}

/**
 * Audit log entry for authorization decisions
 */
export interface AuditLogEntry {
  userId: string;
  sessionId?: string;
  gameId?: string;
  action: string;
  result: boolean;
  reason?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Game request for middleware processing
 */
export interface GameRequest {
  gameId: string;
  action: string;
  payload?: any;
  timestamp?: number;
}

/**
 * Next function type for middleware chain
 */
export type NextFunction = (
  request: GameRequest,
  context: AuthContext,
) => Promise<any>;

/**
 * Unauthorized error class
 */
export class UnauthorizedError extends Error {
  constructor(
    message: string,
    public code = "UNAUTHORIZED",
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const GameRoleSchema = z.enum([
  "player",
  "spectator",
  "moderator",
  "admin",
]);

export const PermissionConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(["eq", "ne", "in", "custom"]),
  value: z.any(),
  customCheck: z.function().optional(),
});

export const PermissionSchema = z.object({
  resource: z.string(),
  action: z.string(),
  conditions: z.array(PermissionConditionSchema).optional(),
});

export const AuthContextSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  gameId: z.string(),
  role: GameRoleSchema,
  permissions: z.array(PermissionSchema),
  metadata: z.record(z.any()).optional(),
});

export const AuthResultSchema = z.object({
  authorized: z.boolean(),
  reason: z.string().optional(),
  requiredPermissions: z.array(z.string()).optional(),
});

export const AuditLogEntrySchema = z.object({
  userId: z.string(),
  sessionId: z.string().optional(),
  gameId: z.string().optional(),
  action: z.string(),
  result: z.boolean(),
  reason: z.string().optional(),
  timestamp: z.number(),
  metadata: z.record(z.any()).optional(),
});

export const GameRequestSchema = z.object({
  gameId: z.string(),
  action: z.string(),
  payload: z.any().optional(),
  timestamp: z.number().optional(),
});
