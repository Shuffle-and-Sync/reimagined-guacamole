import { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

// Modern Auth.js-compatible request type
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  auth?: {
    user?: AuthenticatedUser;
    expires: string;
  };
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