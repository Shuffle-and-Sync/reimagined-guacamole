/**
 * Centralized Error Handling Middleware
 *
 * This module provides comprehensive error handling following Copilot best practices
 * for maintainable, scalable error management across the application.
 *
 * Now supports JSend-compliant response format via ApiResponse utility
 */

import { Server } from "http";
import { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";
import { ZodError } from "zod";
import { toLoggableError } from "@shared/utils/type-guards";
import { ErrorCode } from "../lib/error-codes";
import {
  AppError as StandardizedAppError,
  buildErrorResponse,
  errors as standardizedErrors,
} from "../lib/error-response";
import { logger } from "../logger";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

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
interface _ErrorResponse {
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

// Re-export new utilities for convenience
export { ApiError } from "../utils/ApiError";
export { ApiResponse } from "../utils/ApiResponse";
export { catchAsync } from "../utils/catchAsync";

/**
 * Global error handling middleware
 * Should be the last middleware in the chain
 * Now integrates with standardized error response system and JSend format
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

  // Handle new ApiError class (JSend format)
  if (error instanceof ApiError) {
    const errorLog = {
      requestId,
      timestamp,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      url: req.url,
      method: req.method,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      userId: (req as Request & { user?: { id: string } }).user?.id,
    };

    // Log with appropriate level
    if (error.statusCode >= 500) {
      logger.error("Server error", toLoggableError(error), errorLog);
    } else if (error.statusCode >= 400) {
      logger.warn("Client error", errorLog);
    }

    // Send JSend-formatted response
    const response =
      error.statusCode >= 500
        ? ApiResponse.error(error.message, error.errors)
        : ApiResponse.fail(error.message, error.errors);

    res.status(error.statusCode).json(response);
    return;
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
      logger.error("Server error", toLoggableError(error), errorLog);
    } else if (error.statusCode >= 400) {
      logger.warn("Client error", errorLog);
    }

    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle Zod validation errors with JSend format
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      code: e.code,
    }));

    logger.warn("Validation error", {
      requestId,
      timestamp,
      url: req.url,
      method: req.method,
      errors: validationErrors,
    });

    // Send JSend-formatted validation error
    const response = ApiResponse.fail("Validation failed", validationErrors);
    res.status(400).json(response);
    return;
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

    // Preserve custom message from original error if it's more specific
    // than the default standardized message
    const hasCustomMessage =
      error.message !== "Authentication required" &&
      error.message !== "Insufficient permissions" &&
      error.message !== "Validation failed" &&
      error.message !== "Database operation failed";

    if (hasCustomMessage) {
      // Override the standardized message with the custom one
      standardizedError = new StandardizedAppError(
        standardizedError.code,
        {
          ...error.context,
          originalMessage: error.message,
        },
        standardizedError.isOperational,
      );
      // Replace the message
      Object.defineProperty(standardizedError, "message", {
        value: error.message,
        writable: false,
        enumerable: false,
        configurable: false,
      });
    }

    const errorResponse = buildErrorResponse(standardizedError, req, requestId);

    logger.warn("Legacy error converted to standardized format", {
      requestId,
      oldCode: error.errorCode,
      newCode: standardizedError.code,
      url: req.url,
      preservedCustomMessage: hasCustomMessage,
    });

    res.status(standardizedError.statusCode).json(errorResponse);
    return;
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    const response = ApiResponse.fail("Invalid authentication token");
    logger.warn("JWT error", { requestId, error: error.message });
    res.status(401).json(response);
    return;
  }

  if (error.name === "TokenExpiredError") {
    const response = ApiResponse.fail(
      "Your session has expired. Please login again",
    );
    logger.warn("Token expired", { requestId });
    res.status(401).json(response);
    return;
  }

  // Handle duplicate key errors
  if (
    error.message?.includes("duplicate key") ||
    error.message?.includes("UNIQUE constraint")
  ) {
    const response = ApiResponse.fail("This resource already exists");
    logger.warn("Duplicate entry", { requestId, error: error.message });
    res.status(409).json(response);
    return;
  }

  // Handle unexpected errors
  logger.error("Unexpected error", toLoggableError(error), {
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

  // Send JSend error response (hide details in production)
  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : error.message;
  const response = ApiResponse.error(message);

  res.status(500).json(response);
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
  _res: Response,
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

    server.close((err?: Error) => {
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
  logger.error("Database connection error", toLoggableError(error));

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
