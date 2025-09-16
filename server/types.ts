import { Request } from "express";

export interface AuthenticatedUser {
  claims: {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  accessToken?: string;
  refreshToken?: string;
}

// Legacy type - use types from server/auth instead
export interface LegacyAuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}