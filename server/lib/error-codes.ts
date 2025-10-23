/**
 * Standardized Error Codes System
 *
 * Provides consistent error codes across the application with organized categories.
 * Each error code has a corresponding production-safe message and HTTP status code.
 */

// Error codes enum - organized by category
export enum ErrorCode {
  // Authentication errors (AUTH_xxx)
  UNAUTHORIZED = "AUTH_001",
  INVALID_CREDENTIALS = "AUTH_002",
  TOKEN_EXPIRED = "AUTH_003",
  TOKEN_INVALID = "AUTH_004",
  SESSION_EXPIRED = "AUTH_005",
  INSUFFICIENT_PERMISSIONS = "AUTH_006",
  DEVICE_MISMATCH = "AUTH_007",

  // Validation errors (VAL_xxx)
  VALIDATION_FAILED = "VAL_001",
  INVALID_EMAIL = "VAL_002",
  INVALID_PASSWORD = "VAL_003",
  REQUIRED_FIELD_MISSING = "VAL_004",
  INVALID_FORMAT = "VAL_005",
  INVALID_LENGTH = "VAL_006",
  INVALID_RANGE = "VAL_007",

  // Resource errors (RES_xxx)
  RESOURCE_NOT_FOUND = "RES_001",
  RESOURCE_ALREADY_EXISTS = "RES_002",
  RESOURCE_CONFLICT = "RES_003",
  RESOURCE_LOCKED = "RES_004",

  // Rate limiting (RATE_xxx)
  RATE_LIMIT_EXCEEDED = "RATE_001",
  TOO_MANY_REQUESTS = "RATE_002",

  // Server errors (SRV_xxx)
  INTERNAL_ERROR = "SRV_001",
  SERVICE_UNAVAILABLE = "SRV_002",
  DATABASE_ERROR = "SRV_003",
  EXTERNAL_SERVICE_ERROR = "SRV_004",
  CONFIGURATION_ERROR = "SRV_005",

  // Business logic errors (BIZ_xxx)
  PAYMENT_FAILED = "BIZ_001",
  INSUFFICIENT_BALANCE = "BIZ_002",
  OPERATION_NOT_ALLOWED = "BIZ_003",
  QUOTA_EXCEEDED = "BIZ_004",
  INVALID_STATE = "BIZ_005",

  // CORS errors (CORS_xxx)
  CORS_ORIGIN_NOT_ALLOWED = "CORS_001",
  CORS_METHOD_NOT_ALLOWED = "CORS_002",
}

// Production-safe error messages
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication
  [ErrorCode.UNAUTHORIZED]: "Authentication required",
  [ErrorCode.INVALID_CREDENTIALS]: "Invalid email or password",
  [ErrorCode.TOKEN_EXPIRED]: "Your session has expired. Please login again",
  [ErrorCode.TOKEN_INVALID]: "Invalid authentication token",
  [ErrorCode.SESSION_EXPIRED]: "Your session has expired",
  [ErrorCode.INSUFFICIENT_PERMISSIONS]:
    "You do not have permission to perform this action",
  [ErrorCode.DEVICE_MISMATCH]:
    "Login from unrecognized device. Please login again",

  // Validation
  [ErrorCode.VALIDATION_FAILED]: "The provided data is invalid",
  [ErrorCode.INVALID_EMAIL]: "Please provide a valid email address",
  [ErrorCode.INVALID_PASSWORD]: "Password does not meet requirements",
  [ErrorCode.REQUIRED_FIELD_MISSING]: "Required field is missing",
  [ErrorCode.INVALID_FORMAT]: "Invalid data format",
  [ErrorCode.INVALID_LENGTH]: "Value length is invalid",
  [ErrorCode.INVALID_RANGE]: "Value is outside acceptable range",

  // Resources
  [ErrorCode.RESOURCE_NOT_FOUND]: "The requested resource was not found",
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: "This resource already exists",
  [ErrorCode.RESOURCE_CONFLICT]: "This operation conflicts with existing data",
  [ErrorCode.RESOURCE_LOCKED]: "This resource is currently locked",

  // Rate limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: "Too many requests. Please try again later",
  [ErrorCode.TOO_MANY_REQUESTS]: "Request limit exceeded",

  // Server errors
  [ErrorCode.INTERNAL_ERROR]: "An unexpected error occurred",
  [ErrorCode.SERVICE_UNAVAILABLE]: "The service is temporarily unavailable",
  [ErrorCode.DATABASE_ERROR]: "A database error occurred",
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: "An external service error occurred",
  [ErrorCode.CONFIGURATION_ERROR]: "A server configuration error occurred",

  // Business logic
  [ErrorCode.PAYMENT_FAILED]: "Payment processing failed",
  [ErrorCode.INSUFFICIENT_BALANCE]: "Insufficient balance",
  [ErrorCode.OPERATION_NOT_ALLOWED]: "This operation is not allowed",
  [ErrorCode.QUOTA_EXCEEDED]: "Usage quota exceeded",
  [ErrorCode.INVALID_STATE]: "Invalid state for this operation",

  // CORS
  [ErrorCode.CORS_ORIGIN_NOT_ALLOWED]: "Origin not allowed",
  [ErrorCode.CORS_METHOD_NOT_ALLOWED]: "Method not allowed",
};

// HTTP status codes for each error
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  // 401 - Unauthorized
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.SESSION_EXPIRED]: 401,
  [ErrorCode.DEVICE_MISMATCH]: 401,

  // 403 - Forbidden
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.OPERATION_NOT_ALLOWED]: 403,
  [ErrorCode.CORS_ORIGIN_NOT_ALLOWED]: 403,
  [ErrorCode.CORS_METHOD_NOT_ALLOWED]: 403,

  // 404 - Not Found
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,

  // 400 - Bad Request
  [ErrorCode.VALIDATION_FAILED]: 400,
  [ErrorCode.INVALID_EMAIL]: 400,
  [ErrorCode.INVALID_PASSWORD]: 400,
  [ErrorCode.REQUIRED_FIELD_MISSING]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.INVALID_LENGTH]: 400,
  [ErrorCode.INVALID_RANGE]: 400,
  [ErrorCode.INVALID_STATE]: 400,

  // 409 - Conflict
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCode.RESOURCE_CONFLICT]: 409,
  [ErrorCode.RESOURCE_LOCKED]: 423,

  // 429 - Too Many Requests
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,

  // 500 - Internal Server Error
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.CONFIGURATION_ERROR]: 500,

  // 503 - Service Unavailable
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 503,

  // Business logic
  [ErrorCode.PAYMENT_FAILED]: 402,
  [ErrorCode.INSUFFICIENT_BALANCE]: 402,
  [ErrorCode.QUOTA_EXCEEDED]: 429,
};
