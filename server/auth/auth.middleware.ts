// Auth.js v5 middleware for Express.js routes
import type { Request, Response, NextFunction } from "express";
import { Auth } from "@auth/core";
import { authConfig } from "./auth.config";
import { verifyAccessTokenJWT, validateTokenSecurity, type AccessTokenJWTPayload, revokeTokenByJTI } from "./tokens";
import { extractDeviceContext } from "./device-fingerprinting";
import { logger } from "../logger";
import { storage } from "../storage";
import { enhancedSessionManager } from "./session-security";

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
      // JWT-specific data
      jwtPayload?: {
        userId: string;
        email: string;
        type: 'access';
        sessionId?: string;
        iat: number;
        exp: number;
        iss: string;
        aud: string;
      };
      isJWTAuth?: boolean;
    }
  }
}

// Compatibility type during migration
export type AuthenticatedRequest = Request;

// Middleware to check if user is authenticated (replaces old isAuthenticated)
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Build the session check URL - ignore AUTH_URL in development to use actual request host
    const base = process.env.NODE_ENV === 'production' 
      ? (process.env.AUTH_URL || process.env.NEXTAUTH_URL || `${(req.headers["x-forwarded-proto"] as string) ?? req.protocol}://${(req.headers["x-forwarded-host"] as string) ?? req.get("host")}`)
      : `${(req.headers["x-forwarded-proto"] as string) ?? req.protocol}://${(req.headers["x-forwarded-host"] as string) ?? req.get("host")}`;
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

    // ENTERPRISE SESSION SECURITY VALIDATION
    try {
      const sessionSecurityValidation = await enhancedSessionManager.validateSessionSecurity(
        sessionData.user.id,
        sessionData.sessionToken || 'session_unknown',
        {
          headers: req.headers,
          ip: req.ip || req.connection.remoteAddress || 'unknown'
        }
      );

      // Handle security assessment results
      if (!sessionSecurityValidation.isValid) {
        logger.warn('Session terminated due to security assessment', {
          userId: sessionData.user.id,
          riskLevel: sessionSecurityValidation.assessment.riskLevel,
          riskScore: sessionSecurityValidation.assessment.riskScore,
          actions: sessionSecurityValidation.actions,
          ip: req.ip
        });
        
        return res.status(401).json({ 
          message: "Session terminated for security reasons",
          securityLevel: sessionSecurityValidation.assessment.riskLevel
        });
      }

      // Log successful security validation with warnings if any
      if (sessionSecurityValidation.assessment.securityWarnings?.length) {
        logger.warn('Session security warnings detected', {
          userId: sessionData.user.id,
          riskLevel: sessionSecurityValidation.assessment.riskLevel,
          securityWarnings: sessionSecurityValidation.assessment.securityWarnings,
          ip: req.ip
        });
      }

      // Proceed with normal authentication flow
      logger.debug('Session security validation passed', {
        userId: sessionData.user.id,
        riskLevel: sessionSecurityValidation.assessment.riskLevel,
        trustScore: sessionSecurityValidation.assessment.trustScore,
        actionsExecuted: sessionSecurityValidation.actions
      });

    } catch (error) {
      logger.error('Session security validation failed', {
        userId: sessionData.user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip
      });
      
      // Fail-safe: deny access on security validation failure
      return res.status(500).json({ 
        message: "Session security validation failed" 
      });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// Middleware to optionally get user session (doesn't require auth)
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Build the session check URL - ignore AUTH_URL in development to use actual request host
    const base = process.env.NODE_ENV === 'production' 
      ? (process.env.AUTH_URL || process.env.NEXTAUTH_URL || `${(req.headers["x-forwarded-proto"] as string) ?? req.protocol}://${(req.headers["x-forwarded-host"] as string) ?? req.get("host")}`)
      : `${(req.headers["x-forwarded-proto"] as string) ?? req.protocol}://${(req.headers["x-forwarded-host"] as string) ?? req.get("host")}`;
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

/**
 * JWT Authentication Middleware
 * Authenticates requests using JWT access tokens from Authorization header
 */
export async function requireJWTAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: "Authorization header with Bearer token required" });
      return;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Extract device context for enhanced security validation
    const deviceContext = extractDeviceContext(req.headers, req.ip || req.connection.remoteAddress || 'unknown');
    
    // Verify the JWT access token with enhanced security
    const { valid, payload, error, securityWarnings } = await verifyAccessTokenJWT(token, {
      deviceFingerprint: deviceContext.userAgent, // Use userAgent as device identifier
      ipAddress: deviceContext.ipAddress
    });
    
    if (!valid || !payload) {
      logger.warn('Invalid JWT token attempted', { 
        error, 
        ip: req.ip, 
        userAgent: req.headers['user-agent'],
        deviceFingerprint: deviceContext.userAgent
      });
      res.status(401).json({ message: "Invalid or expired access token" });
      return;
    }

    // Enhanced security validation
    if (payload.jti) {
      const securityValidation = await validateTokenSecurity(payload.jti, payload);
      
      if (!securityValidation.valid) {
        logger.warn('JWT token failed security validation', { 
          userId: payload.userId,
          jti: payload.jti,
          securityIssues: securityValidation.securityIssues,
          ip: req.ip
        });
        res.status(401).json({ 
          message: "Token security validation failed",
          securityIssues: securityValidation.securityIssues
        });
        return;
      }
    }
    
    // Get user from database to ensure they still exist and are active
    const user = await storage.getUser(payload.userId);
    if (!user) {
      logger.warn('JWT token for non-existent user', { userId: payload.userId, ip: req.ip });
      res.status(401).json({ message: "User not found" });
      return;
    }
    
    // Attach user and JWT info to request object
    req.user = {
      id: user.id,
      email: user.email || payload.email,
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || 'User'
    };
    
    req.jwtPayload = payload;
    req.isJWTAuth = true;
    
    // Log security warnings if present
    if (securityWarnings && securityWarnings.length > 0) {
      logger.warn('JWT token security warnings', {
        userId: user.id,
        jti: payload.jti,
        securityWarnings,
        ip: req.ip
      });
    }
    
    logger.debug('JWT authentication successful', {
      userId: user.id,
      sessionId: payload.sessionId,
      securityLevel: payload.securityLevel,
      mfaVerified: payload.mfaVerified,
      deviceBound: !!payload.deviceFingerprint,
      ip: req.ip
    });
    
    next();
    
  } catch (error) {
    logger.error('JWT authentication error', error, { ip: req.ip, userAgent: req.headers['user-agent'] });
    res.status(500).json({ message: "Authentication failed" });
  }
}

/**
 * Hybrid Authentication Middleware
 * Supports both session-based and JWT-based authentication
 * Tries JWT first, then falls back to session
 */
export async function requireHybridAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Check for JWT first
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Use JWT authentication
    await requireJWTAuth(req, res, next);
    return;
  }
  
  // Fall back to session authentication
  await requireAuth(req, res, next);
}

/**
 * Optional JWT Authentication Middleware
 * Attempts JWT authentication but doesn't fail if no token provided
 */
export async function optionalJWTAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No JWT token provided, continue without authentication
    return next();
  }
  
  try {
    const token = authHeader.substring(7);
    const { valid, payload } = await verifyAccessTokenJWT(token);
    
    if (valid && payload) {
      // Get user from database
      const user = await storage.getUser(payload.userId);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email || payload.email,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || 'User'
        };
        req.jwtPayload = payload;
        req.isJWTAuth = true;
      }
    }
  } catch (error) {
    logger.warn('Optional JWT auth failed', { error: error instanceof Error ? error.message : 'Unknown error', ip: req.ip });
    // Continue without authentication on error
  }
  
  next();
}