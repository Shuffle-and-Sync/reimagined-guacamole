import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Input validation schemas
export const validateEmailSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
});

export const validateUserProfileUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  username: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username must contain only letters, numbers, underscores, and hyphens').optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  status: z.enum(['online', 'offline', 'away', 'busy', 'gaming']).optional(),
  statusMessage: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
  isPrivate: z.boolean().optional(),
  showOnlineStatus: z.enum(['everyone', 'friends_only']).optional(),
  allowDirectMessages: z.enum(['everyone', 'friends_only']).optional(),
  primaryCommunity: z.string().max(50).optional(),
});

export const validateEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['tournament', 'convention', 'release', 'community', 'game_pod']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  location: z.string().min(1, 'Location is required').max(200),
  communityId: z.string().min(1, 'Community ID is required').max(50),
  maxAttendees: z.number().int().min(1).max(10000).optional(),
  isPublic: z.boolean().optional(),
  // Game pod specific fields
  playerSlots: z.number().int().min(2).max(8).optional(),
  alternateSlots: z.number().int().min(0).max(8).optional(),
  gameFormat: z.string().max(50).optional(),
  powerLevel: z.number().int().min(1).max(10).optional(),
  // Recurring event fields
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurrenceInterval: z.number().int().min(1).max(365).optional(),
  recurrenceEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
});

export const validatePasswordResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const validateSocialLinksSchema = z.object({
  links: z.array(z.object({
    platform: z.string().min(1).max(50),
    username: z.string().min(1).max(100),
    url: z.string().url(),
    isPublic: z.boolean().optional(),
  })).max(10, 'Maximum 10 social links allowed'),
});

// Platform integration validation schemas
export const validatePlatformAuthSchema = z.object({
  platform: z.enum(['twitch', 'youtube', 'discord', 'twitter', 'instagram', 'tiktok']),
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

export const validateSocialPostSchema = z.object({
  content: z.string().min(1, 'Post content is required').max(2000, 'Post content too long'),
  platforms: z.array(z.string()).min(1, 'At least one platform is required'),
  scheduledFor: z.string().datetime().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  platformData: z.record(z.any()).optional(),
});

export const validateWebhookSchema = z.object({
  platform: z.enum(['twitch', 'youtube', 'discord']),
  eventType: z.string().min(1, 'Event type is required'),
  webhookUrl: z.string().url('Valid webhook URL is required'),
  secret: z.string().min(1, 'Webhook secret is required'),
});

export const validateJoinCommunitySchema = z.object({
  communityId: z.string().min(1, 'Community ID is required').max(50),
});

export const validateJoinEventSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required').max(50),
  status: z.enum(['attending', 'maybe', 'not_attending']).optional(),
});

export const validateMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(2000),
  recipientId: z.string().max(50).optional(),
  eventId: z.string().max(50).optional(),
  communityId: z.string().max(50).optional(),
  messageType: z.enum(['direct', 'event', 'community']).optional(),
});

// Rate limiting and sanitization utilities
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Middleware factory for input validation
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn('Input validation failed', { 
          url: req.url, 
          method: req.method, 
          errors,
          userId: (req as any).user?.claims?.sub 
        });
        
        return res.status(400).json({
          message: 'Invalid input',
          errors,
        });
      }
      
      // Replace req.body with validated and sanitized data
      req.body = result.data;
      next();
    } catch (error) {
      logger.error('Validation middleware error', error, { url: req.url, method: req.method });
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

// Parameter validation middleware
export function validateParams(paramName: string, validator: (value: string) => boolean, errorMessage: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const paramValue = req.params[paramName];
    
    if (!paramValue || !validator(paramValue)) {
      logger.warn('Parameter validation failed', { 
        url: req.url, 
        method: req.method, 
        param: paramName, 
        value: paramValue,
        userId: (req as any).user?.claims?.sub 
      });
      
      return res.status(400).json({
        message: errorMessage,
      });
    }
    
    next();
  };
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Proper Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' wss: ws:",
    "frame-ancestors 'none'"
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);
  
  // Don't set HSTS in development
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
}