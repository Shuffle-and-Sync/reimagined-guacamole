/**
 * API Utilities
 *
 * Common utilities for API endpoints including response formatting,
 * error handling, pagination helpers, and query parameter parsing.
 * Consolidates API logic to reduce duplication across route handlers.
 *
 * @module api.utils
 */

import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { ApiResponse, type PaginationMeta } from "./ApiResponse";
import type { Request, Response } from "express";

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 50,
  maxLimit: 100,
} as const;

/**
 * Parse pagination parameters from query string
 */
export function parsePaginationParams(req: Request): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(
    1,
    parseInt(req.query.page as string, 10) || PAGINATION_DEFAULTS.page,
  );
  const limit = Math.min(
    PAGINATION_DEFAULTS.maxLimit,
    Math.max(
      1,
      parseInt(req.query.limit as string, 10) || PAGINATION_DEFAULTS.limit,
    ),
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Parse sort parameters from query string
 */
export function parseSortParams(
  req: Request,
  defaultField = "createdAt",
  defaultDirection: "asc" | "desc" = "desc",
): {
  field: string;
  direction: "asc" | "desc";
} {
  const field = (req.query.sortBy as string) || defaultField;
  const direction =
    (req.query.order as string)?.toLowerCase() === "asc"
      ? "asc"
      : defaultDirection;

  return { field, direction };
}

/**
 * Parse filter parameters from query string
 * Supports dot notation for nested filters (e.g., user.status=active)
 */
export function parseFilterParams(
  req: Request,
  allowedFilters: string[],
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  for (const key of allowedFilters) {
    const value = req.query[key];
    if (value !== undefined && value !== "") {
      // Parse comma-separated values as arrays
      if (typeof value === "string" && value.includes(",")) {
        filters[key] = value.split(",").map((v) => v.trim());
      } else {
        filters[key] = value;
      }
    }
  }

  return filters;
}

/**
 * Parse boolean query parameter
 */
export function parseBooleanParam(
  req: Request,
  paramName: string,
  defaultValue = false,
): boolean {
  const value = req.query[paramName];
  if (value === undefined) return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }
  return defaultValue;
}

/**
 * Parse integer query parameter
 */
export function parseIntParam(
  req: Request,
  paramName: string,
  defaultValue?: number,
): number | undefined {
  const value = req.query[paramName];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value as string, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse array query parameter (comma-separated or multiple values)
 */
export function parseArrayParam(
  req: Request,
  paramName: string,
  defaultValue: string[] = [],
): string[] {
  const value = req.query[paramName];
  if (!value) return defaultValue;

  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return defaultValue;
}

/**
 * Parse date range from query parameters
 */
export function parseDateRangeParams(req: Request): {
  startDate?: Date;
  endDate?: Date;
} {
  const startDateStr = req.query.startDate as string;
  const endDateStr = req.query.endDate as string;

  const result: { startDate?: Date; endDate?: Date } = {};

  if (startDateStr) {
    const startDate = new Date(startDateStr);
    if (!isNaN(startDate.getTime())) {
      result.startDate = startDate;
    }
  }

  if (endDateStr) {
    const endDate = new Date(endDateStr);
    if (!isNaN(endDate.getTime())) {
      result.endDate = endDate;
    }
  }

  return result;
}

/**
 * Send success response with data
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
): Response {
  return res.status(statusCode).json(ApiResponse.success(data, message));
}

/**
 * Send paginated success response
 */
export function sendPaginatedSuccess<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  message?: string,
): Response {
  return res.status(200).json(ApiResponse.paginated(data, pagination, message));
}

/**
 * Send created response (201)
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message?: string,
): Response {
  return sendSuccess(
    res,
    data,
    message || "Resource created successfully",
    201,
  );
}

/**
 * Send no content response (204)
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: Array<{ field?: string; message: string; code?: string }>,
): Response {
  if (statusCode >= 500) {
    return res.status(statusCode).json(ApiResponse.error(message, errors));
  }
  return res.status(statusCode).json(ApiResponse.fail(message, errors));
}

/**
 * Send validation error response (400)
 */
export function sendValidationError(
  res: Response,
  errors: Array<{ field?: string; message: string; code?: string }>,
  message = "Validation failed",
): Response {
  return sendError(res, message, 400, errors);
}

/**
 * Send not found response (404)
 */
export function sendNotFound(
  res: Response,
  message = "Resource not found",
): Response {
  return sendError(res, message, 404);
}

/**
 * Send unauthorized response (401)
 */
export function sendUnauthorized(
  res: Response,
  message = "Unauthorized",
): Response {
  return sendError(res, message, 401);
}

/**
 * Send forbidden response (403)
 */
export function sendForbidden(res: Response, message = "Forbidden"): Response {
  return sendError(res, message, 403);
}

/**
 * Send conflict response (409)
 */
export function sendConflict(
  res: Response,
  message = "Resource already exists",
): Response {
  return sendError(res, message, 409);
}

/**
 * Send bad request response (400)
 */
export function sendBadRequest(
  res: Response,
  message = "Bad request",
): Response {
  return sendError(res, message, 400);
}

/**
 * Send internal server error response (500)
 */
export function sendInternalError(
  res: Response,
  message = "Internal server error",
): Response {
  return sendError(res, message, 500);
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Extract user ID from request (after authentication middleware)
 */
export function getUserIdFromRequest(req: Request): string {
  // Check various possible locations for user ID
  const userId =
    (req as any).userId || (req as any).user?.id || req.headers["x-user-id"];

  if (!userId) {
    throw new Error("User ID not found in request");
  }

  return String(userId);
}

/**
 * Extract optional user ID from request
 */
export function getOptionalUserIdFromRequest(req: Request): string | undefined {
  try {
    return getUserIdFromRequest(req);
  } catch {
    return undefined;
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[],
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (
      body[field] === undefined ||
      body[field] === null ||
      body[field] === ""
    ) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Build query string from params
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Log API request
 */
export function logApiRequest(req: Request, userId?: string): void {
  logger.info("API request", {
    method: req.method,
    path: req.path,
    userId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
}

/**
 * Log API error
 */
export function logApiError(
  req: Request,
  error: Error | unknown,
  userId?: string,
): void {
  logger.error(
    "API error",
    toLoggableError(error),
    {
      method: req.method,
      path: req.path,
      userId,
      ip: req.ip,
    },
  );
}

/**
 * Async handler wrapper to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response) => Promise<unknown>,
) {
  return (req: Request, res: Response): void => {
    Promise.resolve(fn(req, res)).catch((error) => {
      logApiError(req, error);
      sendInternalError(res);
    });
  };
}

/**
 * Check if request is from authenticated user
 */
export function isAuthenticated(req: Request): boolean {
  return !!(req as any).userId || !!(req as any).user?.id;
}

/**
 * Get client IP address
 */
export function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

/**
 * Parse search query parameter
 */
export function parseSearchQuery(req: Request): string | undefined {
  const query = req.query.q || req.query.search || req.query.query;
  return query ? String(query).trim() : undefined;
}

/**
 * Build links for pagination (HATEOAS)
 */
export function buildPaginationLinks(
  baseUrl: string,
  page: number,
  totalPages: number,
  params: Record<string, unknown> = {},
): {
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
} {
  const links: Record<string, string> = {};

  const buildUrl = (p: number) => {
    const queryParams = { ...params, page: p };
    return `${baseUrl}${buildQueryString(queryParams)}`;
  };

  if (page > 1) {
    links.first = buildUrl(1);
    links.prev = buildUrl(page - 1);
  }

  if (page < totalPages) {
    links.next = buildUrl(page + 1);
    links.last = buildUrl(totalPages);
  }

  return links;
}
