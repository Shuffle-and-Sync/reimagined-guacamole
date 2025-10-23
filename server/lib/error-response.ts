/**
 * Error Response Builder
 *
 * Provides AppError class and convenience error creators for consistent error handling.
 */

import { Request } from "express";
import { ErrorCode, ERROR_MESSAGES, ERROR_STATUS_CODES } from "./error-codes";

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    timestamp: string;
    path: string;
    requestId: string;
  };
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(code: ErrorCode, details?: unknown, isOperational = true) {
    super(ERROR_MESSAGES[code]);
    this.code = code;
    this.statusCode = ERROR_STATUS_CODES[code];
    this.details = details;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function buildErrorResponse(
  error: AppError,
  req: Request,
  requestId: string,
): ErrorResponse {
  const response: ErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId,
    },
  };

  // Only include details in development/staging
  if (process.env.NODE_ENV !== "production" && error.details) {
    response.error.details = error.details;
  }

  return response;
}

// Convenience error creators
export const errors = {
  // Authentication
  unauthorized: (details?: unknown) =>
    new AppError(ErrorCode.UNAUTHORIZED, details),

  invalidCredentials: (details?: unknown) =>
    new AppError(ErrorCode.INVALID_CREDENTIALS, details),

  tokenExpired: (details?: unknown) =>
    new AppError(ErrorCode.TOKEN_EXPIRED, details),

  tokenInvalid: (details?: unknown) =>
    new AppError(ErrorCode.TOKEN_INVALID, details),

  forbidden: (details?: unknown) =>
    new AppError(ErrorCode.INSUFFICIENT_PERMISSIONS, details),

  deviceMismatch: (details?: unknown) =>
    new AppError(ErrorCode.DEVICE_MISMATCH, details),

  // Resources
  notFound: (resource?: string, details?: unknown) =>
    new AppError(
      ErrorCode.RESOURCE_NOT_FOUND,
      resource || details
        ? {
            ...(resource ? { resource } : {}),
            ...(typeof details === "object" && details !== null ? details : {}),
          }
        : undefined,
    ),

  alreadyExists: (resource?: string, details?: unknown) =>
    new AppError(
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      resource || details
        ? {
            ...(resource ? { resource } : {}),
            ...(typeof details === "object" && details !== null ? details : {}),
          }
        : undefined,
    ),

  conflict: (details?: unknown) =>
    new AppError(ErrorCode.RESOURCE_CONFLICT, details),

  locked: (details?: unknown) =>
    new AppError(ErrorCode.RESOURCE_LOCKED, details),

  // Validation
  validation: (details?: unknown) =>
    new AppError(ErrorCode.VALIDATION_FAILED, details),

  invalidEmail: (details?: unknown) =>
    new AppError(ErrorCode.INVALID_EMAIL, details),

  invalidPassword: (details?: unknown) =>
    new AppError(ErrorCode.INVALID_PASSWORD, details),

  requiredField: (field: string, details?: unknown) =>
    new AppError(ErrorCode.REQUIRED_FIELD_MISSING, {
      field,
      ...(typeof details === "object" && details !== null ? details : {}),
    }),

  invalidFormat: (field: string, details?: unknown) =>
    new AppError(ErrorCode.INVALID_FORMAT, {
      field,
      ...(typeof details === "object" && details !== null ? details : {}),
    }),

  // Rate limiting
  rateLimitExceeded: (details?: unknown) =>
    new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, details),

  // Server errors
  internal: (details?: unknown) =>
    new AppError(ErrorCode.INTERNAL_ERROR, details),

  serviceUnavailable: (details?: unknown) =>
    new AppError(ErrorCode.SERVICE_UNAVAILABLE, details),

  databaseError: (details?: unknown) =>
    new AppError(ErrorCode.DATABASE_ERROR, details),

  externalServiceError: (service: string, details?: unknown) =>
    new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, {
      service,
      ...(typeof details === "object" && details !== null ? details : {}),
    }),

  // Business logic
  paymentFailed: (details?: unknown) =>
    new AppError(ErrorCode.PAYMENT_FAILED, details),

  insufficientBalance: (details?: unknown) =>
    new AppError(ErrorCode.INSUFFICIENT_BALANCE, details),

  operationNotAllowed: (operation: string, details?: unknown) =>
    new AppError(ErrorCode.OPERATION_NOT_ALLOWED, {
      operation,
      ...(typeof details === "object" && details !== null ? details : {}),
    }),

  quotaExceeded: (quota: string, details?: unknown) =>
    new AppError(ErrorCode.QUOTA_EXCEEDED, {
      quota,
      ...(typeof details === "object" && details !== null ? details : {}),
    }),

  invalidState: (details?: unknown) =>
    new AppError(ErrorCode.INVALID_STATE, details),
};
