import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Session management constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

// Authentication middleware
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function isAuthenticated(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = req.session as any;
    
    if (!session || !session.userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Get user from database to ensure they still exist and are active
    const user = await storage.getUser(session.userId);
    
    if (!user) {
      // Clear invalid session
      session.destroy((err: any) => {
        if (err) console.error('Session destroy error:', err);
      });
      res.status(401).json({ message: 'User account not found' });
      return;
    }

    // Check if account is suspended or banned
    if (user.accountStatus !== 'active') {
      res.status(401).json({ 
        message: 'Account is suspended or banned',
        accountStatus: user.accountStatus 
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
}

// Optional authentication middleware (doesn't fail if user is not authenticated)
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = req.session as any;
    
    if (session?.userId) {
      const user = await storage.getUser(session.userId);
      if (user && user.accountStatus === 'active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
}

// Role-based authorization middleware
export function requireRole(roles: string | string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole 
      });
    }

    next();
  };
}

// Login validation and attempt tracking
export async function validateLoginAttempt(email: string): Promise<{
  allowed: boolean;
  attemptsRemaining?: number;
  lockedUntil?: Date;
}> {
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    return { allowed: true }; // Allow attempt even if user doesn't exist (don't leak information)
  }

  // Check if account is locked
  if (user.lockedUntil && new Date() < user.lockedUntil) {
    return {
      allowed: false,
      lockedUntil: user.lockedUntil
    };
  }

  // If lock has expired, reset attempts
  if (user.lockedUntil && new Date() >= user.lockedUntil) {
    await storage.updateLoginAttempts(email, 0);
    return { allowed: true };
  }

  const attemptsRemaining = MAX_LOGIN_ATTEMPTS - (user.loginAttempts || 0);
  return {
    allowed: attemptsRemaining > 0,
    attemptsRemaining
  };
}

export async function recordFailedLoginAttempt(email: string): Promise<void> {
  const user = await storage.getUserByEmail(email);
  if (!user) return;

  const newAttempts = (user.loginAttempts || 0) + 1;
  const lockedUntil = newAttempts >= MAX_LOGIN_ATTEMPTS 
    ? new Date(Date.now() + LOCKOUT_TIME)
    : undefined;

  await storage.updateLoginAttempts(email, newAttempts, lockedUntil);
}

export async function recordSuccessfulLogin(userId: string): Promise<void> {
  await storage.updateLastLogin(userId);
}

// Input validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateUsername(username: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  if (username.length > 20) {
    errors.push('Username must be no more than 20 characters long');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }
  if (/^[_-]/.test(username) || /[_-]$/.test(username)) {
    errors.push('Username cannot start or end with underscores or hyphens');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}