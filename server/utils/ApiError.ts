/**
 * Custom API Error Classes
 *
 * Provides specialized error classes for different error scenarios
 * Extends the existing error handling infrastructure with convenience methods
 */

/**
 * Base API Error Class
 * All API errors should extend this class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    errors?: ApiError["errors"],
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set the prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * 400 Bad Request
   */
  static badRequest(
    message: string = "Bad Request",
    errors?: ApiError["errors"],
  ): ApiError {
    return new ApiError(400, message, true, errors);
  }

  /**
   * 401 Unauthorized
   */
  static unauthorized(message: string = "Unauthorized"): ApiError {
    return new ApiError(401, message);
  }

  /**
   * 403 Forbidden
   */
  static forbidden(message: string = "Forbidden"): ApiError {
    return new ApiError(403, message);
  }

  /**
   * 404 Not Found
   */
  static notFound(resource: string = "Resource", id?: string): ApiError {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    return new ApiError(404, message);
  }

  /**
   * 409 Conflict
   */
  static conflict(message: string = "Conflict"): ApiError {
    return new ApiError(409, message);
  }

  /**
   * 422 Unprocessable Entity (Validation Error)
   */
  static validationError(
    errors: Array<{ field: string; message: string; code?: string }>,
  ): ApiError {
    return new ApiError(422, "Validation failed", true, errors);
  }

  /**
   * 429 Too Many Requests
   */
  static tooManyRequests(
    message: string = "Too many requests, please try again later",
  ): ApiError {
    return new ApiError(429, message);
  }

  /**
   * 500 Internal Server Error
   */
  static internal(
    message: string = "Internal server error",
    isOperational: boolean = true,
  ): ApiError {
    return new ApiError(500, message, isOperational);
  }

  /**
   * 503 Service Unavailable
   */
  static serviceUnavailable(
    message: string = "Service temporarily unavailable",
  ): ApiError {
    return new ApiError(503, message);
  }
}
