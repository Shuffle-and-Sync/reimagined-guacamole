import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

// Common utility functions

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== "string") return "";

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential XSS characters
    .substring(0, 1000); // Limit length
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const parseBoolean = (
  value: string | undefined,
): boolean | undefined => {
  if (!value) return undefined;
  return value.toLowerCase() === "true";
};

export const parseInteger = (
  value: string | undefined,
  defaultValue?: number,
): number | undefined => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0] || "";
};

export const formatDateTime = (date: Date): string => {
  return date.toISOString();
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Operation failed, attempt ${attempt}/${maxRetries}`, {
        error: lastError.message,
      });

      if (attempt < maxRetries) {
        await delay(delayMs * attempt); // Exponential backoff
      }
    }
  }

  throw lastError || new Error("Operation failed after all retries");
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const groupBy = <T, K extends keyof any>(
  array: T[],
  getKey: (item: T) => K,
): Record<K, T[]> => {
  return array.reduce(
    (groups, item) => {
      const key = getKey(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<K, T[]>,
  );
};

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};

export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

// Type guard utilities for null/undefined checking
export const isNotNull = <T>(value: T | null): value is T => {
  return value !== null;
};

export const isNotUndefined = <T>(value: T | undefined): value is T => {
  return value !== undefined;
};

export const isNotNullOrUndefined = <T>(
  value: T | null | undefined,
): value is T => {
  return value !== null && value !== undefined;
};

export const assertNotNull = <T>(value: T | null, message?: string): T => {
  if (value === null) {
    throw new Error(message || "Value is null");
  }
  return value;
};

export const assertNotUndefined = <T>(
  value: T | undefined,
  message?: string,
): T => {
  if (value === undefined) {
    throw new Error(message || "Value is undefined");
  }
  return value;
};

export const assertNotNullOrUndefined = <T>(
  value: T | null | undefined,
  message?: string,
): T => {
  if (value === null || value === undefined) {
    throw new Error(message || "Value is null or undefined");
  }
  return value;
};

export const withDefault = <T>(
  value: T | null | undefined,
  defaultValue: T,
): T => {
  return value ?? defaultValue;
};

export const safeGet = <T extends object, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
): T[K] | undefined => {
  return obj?.[key];
};

export const safeCall = <T, Args extends any[]>(
  fn: ((...args: Args) => T) | null | undefined,
  ...args: Args
): T | undefined => {
  return fn?.(...args);
};

// Route parameter validation utilities for Express
export const assertRouteParam = (
  param: string | undefined,
  paramName: string,
): string => {
  if (!param) {
    throw new Error(`Required route parameter '${paramName}' is missing`);
  }
  return param;
};

export const validateRouteParam = (
  param: string | undefined,
  _paramName: string,
): param is string => {
  return param !== undefined && param.length > 0;
};
