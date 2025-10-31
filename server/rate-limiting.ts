import { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { getAuthUserId } from "./auth";
import { logger } from "./logger";

// Safe helper to get user ID without throwing error
function safeGetUserId(req: Request): string | undefined {
  try {
    return getAuthUserId(req);
  } catch {
    return undefined;
  }
}

// Helper function to log rate limit events
const logRateLimit = (
  req: Request,
  limitType: string,
  additionalData?: unknown,
) => {
  logger.warn(`${limitType} rate limit exceeded`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    url: req.originalUrl,
    method: req.method,
    ...additionalData,
  });
};

// General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests",
    message: "You have exceeded the rate limit. Please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logRateLimit(req, "General API");
    res.status(429).json({
      error: "Too many requests",
      message: "You have exceeded the rate limit. Please try again later.",
    });
  },
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    logRateLimit(req, "Authentication");
    res.status(429).json({
      error: "Too many authentication attempts",
      message:
        "Too many authentication attempts. Please try again in 15 minutes.",
    });
  },
});

// Rate limiting for password reset
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  handler: (req: Request, res: Response) => {
    logRateLimit(req, "Password reset", { email: req.body?.email });
    res.status(429).json({
      error: "Too many password reset attempts",
      message: "Too many password reset requests. Please try again in 1 hour.",
    });
  },
});

// Rate limiting for message sending
export const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 messages per minute
  handler: (req: Request, res: Response) => {
    logRateLimit(req, "Message sending", { userId: safeGetUserId(req) });
    res.status(429).json({
      error: "Too many messages sent",
      message: "You are sending messages too quickly. Please slow down.",
    });
  },
});

// Rate limiting for event creation
export const eventCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 event creations per hour
  handler: (req: Request, res: Response) => {
    logRateLimit(req, "Event creation", { userId: safeGetUserId(req) });
    res.status(429).json({
      error: "Too many events created",
      message:
        "You have created too many events recently. Please try again later.",
    });
  },
});

// Strict rate limiter for token revocation operations
// This is stricter and user-specific to prevent abuse of expensive database operations
export const tokenRevocationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each user to 5 token revocation requests per windowMs
  message: {
    error: "Too many token revocation attempts",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers

  // Key by user ID to prevent one user from affecting others
  keyGenerator: (req: Request) => {
    const userId = safeGetUserId(req);
    return userId || req.ip || "unknown";
  },

  // Custom handler for better logging and error response
  handler: (req: Request, res: Response) => {
    const userId = safeGetUserId(req);
    logger.warn("Token revocation rate limit exceeded", {
      userId,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      url: req.originalUrl,
    });

    res.status(429).json({
      error: "Too many token revocation attempts",
      message:
        "You have made too many token revocation requests. Please try again in 15 minutes.",
      retryAfter: 15 * 60, // seconds
    });
  },
});

// Rate limiting for checking event conflicts
export const eventCheckConflictsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 conflict checks per 15 minutes
  handler: (req: Request, res: Response) => {
    logRateLimit(req, "Event conflict check", { userId: safeGetUserId(req) });
    res.status(429).json({
      error: "Too many conflict check requests",
      message:
        "You have made too many conflict check requests. Please try again later.",
    });
  },
});

// Rate limiting for joining events
export const eventJoinRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 join requests per minute
  handler: (req: Request, res: Response) => {
    logRateLimit(req, "Event join", { userId: safeGetUserId(req) });
    res.status(429).json({
      error: "Too many join requests",
      message: "You are joining events too quickly. Please slow down.",
    });
  },
});

// Rate limiting for bulk operations
export const eventBulkOperationsRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 bulk operations per hour
  handler: (req: Request, res: Response) => {
    logRateLimit(req, "Event bulk operations", { userId: safeGetUserId(req) });
    res.status(429).json({
      error: "Too many bulk operations",
      message:
        "You have performed too many bulk operations. Please try again later.",
    });
  },
});

// Rate limiting for recurring event creation
export const eventRecurringCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 recurring event creations per hour
  handler: (req: Request, res: Response) => {
    logRateLimit(req, "Recurring event creation", {
      userId: safeGetUserId(req),
    });
    res.status(429).json({
      error: "Too many recurring events created",
      message:
        "You have created too many recurring events. Please try again later.",
    });
  },
});
