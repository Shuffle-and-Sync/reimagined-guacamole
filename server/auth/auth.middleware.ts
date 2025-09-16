// Auth.js v5 middleware for Express.js routes
import type { Request, Response, NextFunction } from "express";
import { Auth } from "@auth/core";
import authConfig from "./auth.config";

// Auth.js session type
export interface AuthSession {
  user?: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  expires: string;
}

// Module augmentation to extend Express Request without conflicts
declare global {
  namespace Express {
    interface Request {
      auth?: AuthSession;
      user?: {
        id: string;
        email?: string | null;
        name?: string | null;
        image?: string | null;
        // For backward compatibility with old Replit Auth routes
        claims?: {
          sub: string;
          email?: string | null;
        };
      };
    }
  }
}

// Compatibility type during migration
export type AuthenticatedRequest = Request;

// Middleware to check if user is authenticated (replaces old isAuthenticated)
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Build the session check URL
    const base = process.env.AUTH_URL || 
      `${(req.headers["x-forwarded-proto"] as string) ?? req.protocol}://${(req.headers["x-forwarded-host"] as string) ?? req.get("host")}`;
    const sessionUrl = `${base}/api/auth/session`;
    
    // Create Auth.js session request
    const sessionRequest = new Request(sessionUrl, {
      method: "GET",
      headers: {
        // Forward the cookies to get the session
        cookie: req.headers.cookie || "",
      },
    });

    // Get session from Auth.js
    const response = await Auth(sessionRequest, authConfig);
    
    if (!response.ok) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sessionData = await response.json();
    
    // Check if user is authenticated
    if (!sessionData || !sessionData.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Add auth session and user data to request (avoiding session conflicts)
    req.auth = sessionData;
    req.user = {
      id: sessionData.user.id,
      email: sessionData.user.email,
      name: sessionData.user.name,
      image: sessionData.user.image,
      // For backward compatibility with old Replit Auth routes
      claims: {
        sub: sessionData.user.id,
        email: sessionData.user.email,
      },
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// Middleware to optionally get user session (doesn't require auth)
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Build the session check URL
    const base = process.env.AUTH_URL || 
      `${(req.headers["x-forwarded-proto"] as string) ?? req.protocol}://${(req.headers["x-forwarded-host"] as string) ?? req.get("host")}`;
    const sessionUrl = `${base}/api/auth/session`;
    
    // Create Auth.js session request
    const sessionRequest = new Request(sessionUrl, {
      method: "GET",
      headers: {
        cookie: req.headers.cookie || "",
      },
    });

    // Get session from Auth.js
    const response = await Auth(sessionRequest, authConfig);
    const sessionData = response.ok ? await response.json() : null;
    
    // Add auth session data to request (avoiding session conflicts)
    req.auth = sessionData;
    if (sessionData?.user) {
      req.user = {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
        image: sessionData.user.image,
        claims: {
          sub: sessionData.user.id,
          email: sessionData.user.email,
        },
      };
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    // Continue without authentication on error
    next();
  }
}

// Get current user ID from session
export function getCurrentUserId(req: AuthenticatedRequest): string | undefined {
  return req.user?.id;
}

// Check if user is authenticated
export function isAuthenticated(req: AuthenticatedRequest): boolean {
  return !!req.user?.id;
}

// Drop-in replacement for the old Replit Auth isAuthenticated middleware
// This allows existing routes to work without modification
export const isAuthenticatedCompat = requireAuth;