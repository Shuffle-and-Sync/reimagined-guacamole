import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";
import { getAuthUserId } from "./auth";

// Safe helper to get user ID without throwing error
function safeGetUserId(req: Request): string | undefined {
  try {
    return getAuthUserId(req);
  } catch {
    return undefined;
  }
}

// Input validation schemas
export const validateEmailSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
});

export const validateUserProfileUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  username: z
    .string()
    .min(2)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username must contain only letters, numbers, underscores, and hyphens",
    )
    .optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal("")),
  status: z.enum(["online", "offline", "away", "busy", "gaming"]).optional(),
  statusMessage: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
  isPrivate: z.boolean().optional(),
  showOnlineStatus: z.enum(["everyone", "friends_only"]).optional(),
  allowDirectMessages: z.enum(["everyone", "friends_only"]).optional(),
  primaryCommunity: z.string().max(50).optional(),
});

export const validateEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  type: z.enum([
    "tournament",
    "convention",
    "release",
    "community",
    "game_pod",
  ]),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  location: z.string().min(1, "Location is required").max(200),
  communityId: z.string().min(1, "Community ID is required").max(50),
  maxAttendees: z.number().int().min(1).max(10000).optional(),
  isPublic: z.boolean().optional(),
  // Game pod specific fields
  playerSlots: z.number().int().min(2).max(8).optional(),
  alternateSlots: z.number().int().min(0).max(8).optional(),
  gameFormat: z.string().max(50).optional(),
  powerLevel: z.number().int().min(1).max(10).optional(),
  // Recurring event fields
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(["daily", "weekly", "monthly"]).optional(),
  recurrenceInterval: z.number().int().min(1).max(365).optional(),
  recurrenceEndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional(),
});

export const validatePasswordResetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const validateSocialLinksSchema = z.object({
  links: z
    .array(
      z.object({
        platform: z.string().min(1).max(50),
        username: z.string().min(1).max(100),
        url: z.string().url(),
        isPublic: z.boolean().optional(),
      }),
    )
    .max(10, "Maximum 10 social links allowed"),
});

export const validateJoinCommunitySchema = z.object({
  communityId: z.string().min(1, "Community ID is required").max(50),
});

export const validateJoinEventSchema = z.object({
  eventId: z.string().min(1, "Event ID is required").max(50),
  status: z.enum(["attending", "maybe", "not_attending"]).optional(),
});

export const validateMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(2000),
  recipientId: z.string().max(50).optional(),
  eventId: z.string().max(50).optional(),
  communityId: z.string().max(50).optional(),
  messageType: z.enum(["direct", "event", "community"]).optional(),
});

export const validateGameSessionSchema = z.object({
  eventId: z.string().min(1, "Event ID is required").max(50),
  maxPlayers: z
    .number()
    .int()
    .min(2, "Must allow at least 2 players")
    .max(8, "Maximum 8 players allowed"),
  communityId: z.string().min(1, "Community ID is required").max(50),
  gameData: z
    .object({
      name: z.string().min(1, "Room name is required").max(100),
      format: z.string().min(1, "Game format is required").max(50),
      powerLevel: z.string().max(50).optional(),
      description: z.string().max(500).optional(),
    })
    .optional(),
});

// Common parameter validation schemas
export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
});

export const eventParamSchema = z.object({
  eventId: z.string().uuid("Invalid event ID format"),
});

export const userParamSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

export const communityParamSchema = z.object({
  communityId: z.string().uuid("Invalid community ID format"),
});

// Common query parameter schemas
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const searchQuerySchema = z.object({
  q: z
    .string()
    .min(1, "Search query is required")
    .max(100, "Search query too long"),
  ...paginationQuerySchema.shape,
});

// Rate limiting and sanitization utilities
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

export function validateUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Middleware factory for input validation
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const validationError = new z.ZodError(result.error.errors);
        return next(validationError);
      }

      // Replace req.body with validated and sanitized data
      req.body = result.data;
      next();
    } catch (error) {
      logger.error("Validation middleware error", error, {
        url: req.url,
        method: req.method,
      });
      next(error);
    }
  };
}

// Query parameter validation middleware
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const validationError = new z.ZodError(result.error.errors);
        return next(validationError);
      }

      // Replace req.query with validated and sanitized data
      req.query = result.data;
      next();
    } catch (error) {
      logger.error("Query validation middleware error", error, {
        url: req.url,
        method: req.method,
      });
      next(error);
    }
  };
}

// Parameter validation middleware
export function validateParams(
  paramName: string,
  validator: (value: string) => boolean,
  errorMessage: string,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const paramValue = req.params[paramName];

    if (!paramValue || !validator(paramValue)) {
      logger.warn("Parameter validation failed", {
        url: req.url,
        method: req.method,
        param: paramName,
        value: paramValue,
        userId: safeGetUserId(req),
      });

      const validationError = new z.ZodError([
        {
          code: "custom",
          path: [paramName],
          message: errorMessage,
        },
      ]);
      return next(validationError);
    }

    next();
  };
}

// Enhanced parameter validation with Zod schema
export function validateParamsWithSchema(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const validationError = new z.ZodError(result.error.errors);
        return next(validationError);
      }

      // Replace req.params with validated data
      req.params = result.data;
      next();
    } catch (error) {
      logger.error("Parameter validation middleware error", error, {
        url: req.url,
        method: req.method,
      });
      next(error);
    }
  };
}

// Security headers middleware
export function securityHeaders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy - different policies for dev vs production
  let csp: string;

  if (process.env.NODE_ENV === "development") {
    // Development CSP - more permissive for debugging
    csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://replit.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com https:",
      "font-src 'self' fonts.gstatic.com https:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https: wss: ws: replit.com",
      "frame-ancestors 'none'",
    ].join("; ");

    // Use report-only in development to avoid blocking during development
    res.setHeader("Content-Security-Policy-Report-Only", csp);
  } else {
    // Production CSP - strict but functional security policy
    csp = [
      "default-src 'self'",
      "script-src 'self' https://replit.com", // Allow Replit dev banner
      "style-src 'self' fonts.googleapis.com https://cdnjs.cloudflare.com", // Allow Font Awesome
      "font-src 'self' fonts.gstatic.com https://cdnjs.cloudflare.com", // Allow Font Awesome fonts
      "img-src 'self' data: blob: https:", // Allow HTTPS images for avatars/thumbnails
      "connect-src 'self' wss: ws: https://api.twitch.tv https://id.twitch.tv", // Specific API endpoints
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ");

    res.setHeader("Content-Security-Policy", csp);
  }

  // Don't set HSTS in development
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  next();
}
