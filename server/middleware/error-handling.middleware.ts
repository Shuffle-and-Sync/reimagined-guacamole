/**
 * Centralized Error Handling Middleware
 *
 * This module provides comprehensive error handling following Copilot best practices
 * for maintainable, scalable error management across the application.
 */

import { Server } from "http";
import { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";
import { ZodError } from "zod";
import { ErrorCode } from "../lib/error-codes";
import {
  AppError as StandardizedAppError,
  buildErrorResponse,
  errors as standardizedErrors,
} from "../lib/error-response";
import { logger } from "../logger";

// Custom error types for better error categorization
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = "INTERNAL_ERROR",
    isOperational: boolean = true,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, "VALIDATION_ERROR", true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(
    message: string = "Authentication required",
    context?: Record<string, unknown>,
  ) {
    super(message, 401, "AUTHENTICATION_ERROR", true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message: string = "Insufficient permissions",
    context?: Record<string, unknown>,
  ) {
    super(message, 403, "AUTHORIZATION_ERROR", true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(
    resource: string = "Resource",
    context?: Record<string, unknown>,
  ) {
    super(`${resource} not found`, 404, "NOT_FOUND_ERROR", true, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 409, "CONFLICT_ERROR", true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string = "Rate limit exceeded",
    context?: Record<string, unknown>,
  ) {
    super(message, 429, "RATE_LIMIT_ERROR", true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string = "Database operation failed",
    context?: Record<string, unknown>,
  ) {
    super(message, 500, "DATABASE_ERROR", true, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = "External service unavailable",
    context?: Record<string, unknown>,
  ) {
    super(
      `${service}: ${message}`,
      503,
      "EXTERNAL_SERVICE_ERROR",
      true,
      context,
    );
  }
}

// Error response interface (legacy - kept for backward compatibility)
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    requestId: string;
    timestamp: string;
    details?: unknown;
  };
}

// Re-export standardized errors for convenience
export { StandardizedAppError, standardizedErrors, ErrorCode };
export { errors as standardizedErrorCreators } from "../lib/error-response";

/**
 * Global error handling middleware
 * Should be the last middleware in the chain
 * Now integrates with standardized error response system
 */
export function globalErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (res.getHeader("X-Request-ID") as string) || nanoid();
  const timestamp = new Date().toISOString();

  // Set request ID header if not already set
  if (!res.getHeader("X-Request-ID")) {
    res.setHeader("X-Request-ID", requestId);
  }

  // Handle standardized errors
  if (error instanceof StandardizedAppError) {
    const errorResponse = buildErrorResponse(error, req, requestId);

    // Log error with appropriate level
    const errorLog = {
      requestId,
      timestamp,
      errorCode: error.code,
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      url: req.url,
      method: req.method,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      userId: (req as Request & { user?: { id: string } }).user?.id,
    };

    if (error.statusCode >= 500) {
      logger.error("Server error", error, errorLog);
    } else if (error.statusCode >= 400) {
      logger.warn("Client error", errorLog);
    }

    return res.status(error.statusCode).json(errorResponse);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError = standardizedErrors.validation(
      process.env.NODE_ENV !== "production"
        ? {
            issues: error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
              code: e.code,
            })),
          }
        : undefined,
    );

    const errorResponse = buildErrorResponse(validationError, req, requestId);
    logger.warn("Validation error", {
      requestId,
      timestamp,
      url: req.url,
      method: req.method,
      errors: error.errors,
    });

    return res.status(validationError.statusCode).json(errorResponse);
  }

  // Handle legacy AppError for backward compatibility
  if (error instanceof AppError) {
    // Map legacy error codes to standardized ones
    let standardizedError: StandardizedAppError;

    switch (error.errorCode) {
      case "AUTHENTICATION_ERROR":
        standardizedError = standardizedErrors.unauthorized(error.context);
        break;
      case "AUTHORIZATION_ERROR":
        standardizedError = standardizedErrors.forbidden(error.context);
        break;
      case "NOT_FOUND_ERROR":
        standardizedError = standardizedErrors.notFound(
          undefined,
          error.context,
        );
        break;
      case "VALIDATION_ERROR":
        standardizedError = standardizedErrors.validation(error.context);
        break;
      case "CONFLICT_ERROR":
        standardizedError = standardizedErrors.conflict(error.context);
        break;
      case "RATE_LIMIT_ERROR":
        standardizedError = standardizedErrors.rateLimitExceeded(error.context);
        break;
      case "DATABASE_ERROR":
        standardizedError = standardizedErrors.databaseError(error.context);
        break;
      case "EXTERNAL_SERVICE_ERROR":
        standardizedError = standardizedErrors.externalServiceError(
          "external",
          error.context,
        );
        break;
      default:
        standardizedError = standardizedErrors.internal(error.context);
    }

    const errorResponse = buildErrorResponse(standardizedError, req, requestId);

    logger.warn("Legacy error converted to standardized format", {
      requestId,
      oldCode: error.errorCode,
      newCode: standardizedError.code,
      url: req.url,
    });

    return res.status(standardizedError.statusCode).json(errorResponse);
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    const tokenError = standardizedErrors.tokenInvalid();
    const errorResponse = buildErrorResponse(tokenError, req, requestId);
    logger.warn("JWT error", { requestId, error: error.message });
    return res.status(tokenError.statusCode).json(errorResponse);
  }

  if (error.name === "TokenExpiredError") {
    const tokenError = standardizedErrors.tokenExpired();
    const errorResponse = buildErrorResponse(tokenError, req, requestId);
    logger.warn("Token expired", { requestId });
    return res.status(tokenError.statusCode).json(errorResponse);
  }

  // Handle duplicate key errors
  if (
    error.message?.includes("duplicate key") ||
    error.message?.includes("UNIQUE constraint")
  ) {
    const conflictError = standardizedErrors.alreadyExists();
    const errorResponse = buildErrorResponse(conflictError, req, requestId);
    logger.warn("Duplicate entry", { requestId, error: error.message });
    return res.status(conflictError.statusCode).json(errorResponse);
  }

  // Handle unexpected errors
  const internalError = standardizedErrors.internal(
    process.env.NODE_ENV !== "production"
      ? {
          message: error.message,
          stack: error.stack,
        }
      : undefined,
  );

  const errorResponse = buildErrorResponse(internalError, req, requestId);

  logger.error("Unexpected error", error, {
    requestId,
    timestamp,
    url: req.url,
    method: req.method,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    userId: (req as Request & { user?: { id: string } }).user?.id,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  res.status(internalError.statusCode).json(errorResponse);
}

/**
 * Async error handler wrapper
 * Use this to wrap async route handlers to automatically catch errors
 */
export function asyncHandler<T extends unknown[]>(
  fn: (
    req: Request,
    res: Response,
    next: NextFunction,
    ...args: T
  ) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction, ...args: T) => {
    Promise.resolve(fn(req, res, next, ...args)).catch(next);
  };
}

/**
 * Request ID middleware
 * Adds a unique request ID to each request for tracking
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = (req.headers["x-request-id"] as string) || nanoid();
  res.setHeader("X-Request-ID", requestId);
  (req as Request & { requestId?: string }).requestId = requestId;
  next();
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const error = new NotFoundError("Endpoint", {
    url: req.url,
    method: req.method,
  });
  next(error);
}

/**
 * Graceful shutdown handler
 * Properly closes server connections during shutdown
 */
export function createGracefulShutdownHandler(server: Server) {
  return function gracefulShutdown(signal: string) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    server.close((err: Error) => {
      if (err) {
        logger.error("Error during server shutdown", err);
        process.exit(1);
      }

      logger.info("Server closed successfully");
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error("Forcefully shutting down after timeout");
      process.exit(1);
    }, 10000);
  };
}

/**
 * Database connection error handler
 */
export function handleDatabaseError(error: Error & { code?: string }): never {
  logger.error("Database connection error", error);

  if (error.code === "ECONNREFUSED") {
    throw new DatabaseError("Database connection refused", {
      code: error.code,
    });
  } else if (error.code === "ENOTFOUND") {
    throw new DatabaseError("Database host not found", { code: error.code });
  } else if (error.code === "28P01") {
    throw new DatabaseError("Database authentication failed", {
      code: error.code,
    });
  } else if (error.code === "3D000") {
    throw new DatabaseError("Database does not exist", { code: error.code });
  }

  throw new DatabaseError("Database operation failed", {
    code: error.code,
    message: error.message,
  });
}

/**
 * Validation helper for common patterns
 */
export function validateAndThrow(
  condition: boolean,
  message: string,
  ErrorClass = ValidationError,
): void {
  if (!condition) {
    throw new ErrorClass(message);
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    logger.warn("JSON parse failed, using fallback", {
      json,
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback;
  }
}

// Export error handling middleware collection
export const errorHandlingMiddleware = {
  requestId: requestIdMiddleware,
  notFound: notFoundHandler,
  global: globalErrorHandler,
  asyncHandler,
  createGracefulShutdown: createGracefulShutdownHandler,
};

// Export custom error classes
export const errors = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
};
