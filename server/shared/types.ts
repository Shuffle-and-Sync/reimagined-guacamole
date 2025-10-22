import { Request } from "express";

// Common types used across features

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  auth?: {
    user?: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
    expires: string;
  };
  session?: unknown;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FilterParams {
  search?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface BaseListQuery
  extends PaginationParams,
    SortParams,
    FilterParams {}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}
