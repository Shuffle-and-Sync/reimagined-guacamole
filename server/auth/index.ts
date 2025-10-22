// Auth adapter for Auth.js v5 Express.js integration
import { Request } from "express";
import {
  requireAuth,
  optionalAuth,
  type AuthenticatedRequest,
} from "./auth.middleware";

// Auth middleware
export const isAuthenticated = requireAuth;

// Optional auth middleware (doesn't require authentication)
export { optionalAuth };

// Helper function to safely get user ID from Auth.js session
export function getAuthUserId(req: Request): string {
  // Try new Auth.js format first (via module augmentation)
  if (req.user?.id) {
    return req.user.id;
  }

  // Try Auth.js session data
  if (req.auth?.user?.id) {
    return req.auth.user.id;
  }

  throw new Error("No authenticated user found");
}

// Helper function to safely get user email from Auth.js session
export function getAuthUserEmail(req: Request): string | null {
  // Try new Auth.js format first (via module augmentation)
  if (req.user?.email !== undefined) {
    return req.user.email;
  }

  // Try Auth.js session data
  if (req.auth?.user?.email !== undefined) {
    return req.auth.user.email;
  }

  return null;
}

// Export types for compatibility
export type { AuthenticatedRequest };

// Re-export everything from middleware for convenience
export * from "./auth.middleware";

// Export JWT-specific middleware for direct usage
export {
  requireJWTAuth,
  requireHybridAuth,
  optionalJWTAuth,
} from "./auth.middleware";
