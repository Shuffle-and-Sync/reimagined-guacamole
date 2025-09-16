// Authentication middleware for NextAuth.js
import type { Request, Response, NextFunction } from "express";
import { getToken } from "@auth/core/jwt";
import authConfig from "./auth.config";

export interface AuthenticatedRequest extends Omit<Request, 'session'> {
  user?: {
    id: string;
    email?: string;
    name?: string;
    image?: string;
  };
  session?: any;
}

// Middleware to check if user is authenticated
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = await getToken({ 
      req: req as any, 
      secret: process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET,
      cookieName: "authjs.session-token"
    });
    
    if (!token || !token.sub) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Add user info to request
    req.user = {
      id: token.sub,
      email: token.email as string,
      name: token.name as string,
      image: token.picture as string,
    };
    
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
}

// Middleware to optionally get user session (doesn't require auth)
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = await getToken({ 
      req: req as any, 
      secret: process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET,
      cookieName: "authjs.session-token"
    });
    
    if (token?.sub) {
      req.user = {
        id: token.sub,
        email: token.email as string,
        name: token.name as string,
        image: token.picture as string,
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