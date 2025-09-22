// Auth adapter - provides backward compatibility during migration from Replit Auth to Auth.js v5
import { requireAuth, optionalAuth, type AuthenticatedRequest } from './auth.middleware';
import { Request } from 'express';

// Drop-in replacement for the old Replit Auth isAuthenticated middleware
// This allows existing routes to work without modification during migration
export const isAuthenticated = requireAuth;

// Optional auth middleware (doesn't require authentication)
export { optionalAuth };

// Helper function to safely get user ID during migration
// This abstracts away the difference between old (claims.sub) and new (user.id) formats
export function getAuthUserId(req: Request): string {
  // Try new Auth.js format first (via module augmentation)
  if (req.user?.id) {
    return req.user.id;
  }
  
  // Try Auth.js session data
  if (req.auth?.user?.id) {
    return req.auth.user.id;
  }
  
  // Fallback to old Replit Auth format for compatibility
  if ((req.user as any)?.claims?.sub) {
    return (req.user as any).claims.sub;
  }
  
  throw new Error('No authenticated user found');
}

// Helper function to safely get user email during migration
export function getAuthUserEmail(req: Request): string | null {
  // Try new Auth.js format first (via module augmentation)
  if (req.user?.email !== undefined) {
    return req.user.email;
  }
  
  // Try Auth.js session data
  if (req.auth?.user?.email !== undefined) {
    return req.auth.user.email;
  }
  
  // Fallback to old Replit Auth format for compatibility
  if ((req.user as any)?.claims?.email !== undefined) {
    return (req.user as any).claims.email;
  }
  
  return null;
}

// Export types for compatibility
export type { AuthenticatedRequest };

// Re-export everything from middleware for convenience
export * from './auth.middleware';

// Export JWT-specific middleware for direct usage  
export { requireJWTAuth, requireHybridAuth, optionalJWTAuth } from './auth.middleware';