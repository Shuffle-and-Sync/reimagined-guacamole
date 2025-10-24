/**
 * Standard API Response Wrapper
 *
 * Implements JSend specification for consistent API responses
 * @see https://github.com/omniti-labs/jsend
 *
 * Response statuses:
 * - success: All went well, and (usually) some data was returned
 * - fail: Request was invalid or cannot be completed (client error)
 * - error: Server error occurred
 */

import { nanoid } from "nanoid";

export type ResponseStatus = "success" | "fail" | "error";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponseMeta {
  timestamp: string;
  requestId: string;
  pagination?: PaginationMeta;
}

export interface ApiResponseData<T = unknown> {
  status: ResponseStatus;
  data?: T;
  message?: string;
  errors?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
  meta?: ApiResponseMeta;
}

/**
 * Standard API Response Builder
 * Provides consistent response formatting across all API endpoints
 */
export class ApiResponse {
  /**
   * Success response (2xx)
   * Used for successful operations
   */
  static success<T>(
    data: T,
    message?: string,
    meta?: Partial<ApiResponseMeta>,
  ): ApiResponseData<T> {
    return {
      status: "success",
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(),
        ...meta,
      },
    };
  }

  /**
   * Fail response (4xx - client error)
   * Used for validation errors or invalid requests
   */
  static fail(
    message: string,
    errors?: ApiResponseData["errors"],
  ): ApiResponseData {
    return {
      status: "fail",
      message,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(),
      },
    };
  }

  /**
   * Error response (5xx - server error)
   * Used for unexpected server errors
   */
  static error(
    message: string,
    errors?: ApiResponseData["errors"],
  ): ApiResponseData {
    return {
      status: "error",
      message,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(),
      },
    };
  }

  /**
   * Paginated success response
   * Used for endpoints that return paginated data
   */
  static paginated<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message?: string,
  ): ApiResponseData<T[]> {
    return {
      status: "success",
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(),
        pagination: {
          ...pagination,
          totalPages: Math.ceil(pagination.total / pagination.limit),
        },
      },
    };
  }

  /**
   * Generate or retrieve request ID
   * In production, this should integrate with request context/tracing
   */
  private static getRequestId(): string {
    // Generate a unique request ID
    // In future, could integrate with async context/distributed tracing
    return `req_${Date.now()}_${nanoid(9)}`;
  }
}
