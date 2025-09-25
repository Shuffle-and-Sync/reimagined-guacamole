/**
 * Database Utilities Module
 * 
 * This module provides utility functions for database operations,
 * following Copilot best practices for database interaction optimization.
 */

import { SQL, sql, eq, and, or, inArray, isNull, isNotNull, gte, lte, gt, lt, like, ilike } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { logger } from '../logger';
import { DatabaseError } from '../middleware/error-handling.middleware';

// Database operation types
export type DatabaseOperator = 
  | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' 
  | 'like' | 'ilike' | 'in' | 'notIn' 
  | 'isNull' | 'isNotNull' | 'between';

export interface FilterCondition {
  field: string;
  operator: DatabaseOperator;
  value: any;
  values?: any[]; // For 'in', 'notIn', 'between' operators
}

export interface QueryBuilder {
  filters?: FilterCondition[];
  search?: {
    fields: string[];
    term: string;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  pagination?: {
    page: number;
    limit: number;
  };
}

/**
 * Build WHERE conditions from filter array
 */
export function buildWhereConditions(
  filters: FilterCondition[],
  tableColumns: Record<string, PgColumn>
): SQL[] {
  const conditions: SQL[] = [];

  for (const filter of filters) {
    const column = tableColumns[filter.field];
    if (!column) {
      logger.warn('Invalid filter field', { field: filter.field, availableFields: Object.keys(tableColumns) });
      continue;
    }

    try {
      const condition = buildSingleCondition(column, filter);
      if (condition) {
        conditions.push(condition);
      }
    } catch (error) {
      logger.error('Error building filter condition', error, { filter });
      // Skip invalid conditions rather than failing the entire query
    }
  }

  return conditions;
}

/**
 * Build a single WHERE condition
 */
function buildSingleCondition(column: PgColumn, filter: FilterCondition): SQL | null {
  const { operator, value, values } = filter;

  switch (operator) {
    case 'eq':
      return eq(column, value);
    
    case 'ne':
      return sql`${column} != ${value}`;
    
    case 'gt':
      return gt(column, value);
    
    case 'gte':
      return gte(column, value);
    
    case 'lt':
      return lt(column, value);
    
    case 'lte':
      return lte(column, value);
    
    case 'like':
      return like(column, `%${value}%`);
    
    case 'ilike':
      return ilike(column, `%${value}%`);
    
    case 'in':
      if (!values || values.length === 0) return null;
      return inArray(column, values);
    
    case 'notIn':
      if (!values || values.length === 0) return null;
      return sql`${column} NOT IN ${values}`;
    
    case 'isNull':
      return isNull(column);
    
    case 'isNotNull':
      return isNotNull(column);
    
    case 'between':
      if (!values || values.length !== 2) return null;
      return and(
        gte(column, values[0]),
        lte(column, values[1])
      );
    
    default:
      logger.warn('Unknown filter operator', { operator });
      return null;
  }
}

/**
 * Build search conditions for full-text search
 */
export function buildSearchConditions(
  searchFields: string[],
  searchTerm: string,
  tableColumns: Record<string, PgColumn>
): SQL | null {
  if (!searchTerm.trim()) return null;

  const searchConditions: SQL[] = [];
  const term = searchTerm.trim();

  for (const fieldName of searchFields) {
    const column = tableColumns[fieldName];
    if (column) {
      searchConditions.push(
        ilike(column, `%${term}%`)
      );
    }
  }

  return searchConditions.length > 0 ? or(...searchConditions) : null;
}

/**
 * Build ORDER BY clauses
 */
export function buildOrderBy(
  sortOptions: { field: string; direction: 'asc' | 'desc' }[],
  tableColumns: Record<string, PgColumn>
): SQL[] {
  const orderClauses: SQL[] = [];

  for (const sort of sortOptions) {
    const column = tableColumns[sort.field];
    if (column) {
      if (sort.direction === 'desc') {
        orderClauses.push(sql`${column} DESC`);
      } else {
        orderClauses.push(sql`${column} ASC`);
      }
    }
  }

  return orderClauses;
}

/**
 * Calculate pagination offset
 */
export function calculatePagination(page: number, limit: number) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
  const offset = (safePage - 1) * safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    offset
  };
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
    startIndex: (page - 1) * limit + 1,
    endIndex: Math.min(page * limit, total)
  };
}

/**
 * Validate and sanitize database input with enhanced SQL injection protection
 */
export function sanitizeDatabaseInput(input: any): any {
  if (typeof input === 'string') {
    // Check for SQL injection patterns
    const suspiciousPatterns = [
      /(\b(union|select|insert|update|delete|drop|alter|create|exec|execute|sp_|xp_)\b)/gi,
      /(--|\/\*|\*\/|;|'|"|`)/g,
      /(\bor\b|\band\b).*[=<>]/gi,
      /(\bwhere\b|\bhaving\b).*[=<>]/gi
    ];
    
    // If any suspicious pattern is found, log it and return sanitized version
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        logger.warn('Potential SQL injection attempt detected', { 
          input: input.substring(0, 100), // Only log first 100 chars
          pattern: pattern.source 
        });
        // Sanitize aggressively
        input = input.replace(pattern, '');
      }
    }
    
    // Remove potential XSS and other malicious patterns
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeDatabaseInput(item));
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeDatabaseInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Database transaction wrapper with retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on specific database errors
      if (shouldRetryDatabaseOperation(error) && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        logger.warn(`Database operation failed, retrying in ${delay}ms`, {
          attempt,
          maxRetries,
          error: error.message
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      break;
    }
  }

  logger.error('Database operation failed after all retries', lastError);
  throw new DatabaseError(`Operation failed after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Determine if a database error should trigger a retry
 */
function shouldRetryDatabaseOperation(error: any): boolean {
  // Retry on connection errors, timeouts, and temporary failures
  const retryableCodes = [
    'ECONNRESET',
    'ECONNREFUSED', 
    'ETIMEDOUT',
    'ENOTFOUND',
    '08000', // PostgreSQL connection exception
    '08003', // PostgreSQL connection does not exist
    '08006', // PostgreSQL connection failure
    '57P01', // PostgreSQL admin shutdown
    '57P02', // PostgreSQL crash shutdown
    '57P03'  // PostgreSQL cannot connect now
  ];

  const errorCode = error.code || error.errno;
  return retryableCodes.includes(errorCode);
}

/**
 * Create a database health check query
 */
export function createHealthCheckQuery(): SQL {
  return sql`SELECT 1 as health_check, NOW() as timestamp`;
}

/**
 * Format database error for logging
 */
export function formatDatabaseError(error: any): Record<string, any> {
  return {
    message: error.message,
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    sqlMessage: error.sqlMessage,
    sql: error.sql,
    stack: error.stack
  };
}

/**
 * Common database constraints validation
 */
export const validators = {
  required: (value: any, fieldName: string): void => {
    if (value === null || value === undefined || value === '') {
      throw new DatabaseError(`${fieldName} is required`);
    }
  },

  maxLength: (value: string, maxLen: number, fieldName: string): void => {
    if (value && value.length > maxLen) {
      throw new DatabaseError(`${fieldName} cannot exceed ${maxLen} characters`);
    }
  },

  minLength: (value: string, minLen: number, fieldName: string): void => {
    if (value && value.length < minLen) {
      throw new DatabaseError(`${fieldName} must be at least ${minLen} characters`);
    }
  },

  email: (value: string, fieldName: string = 'Email'): void => {
    if (value && !isValidEmail(value)) {
      throw new DatabaseError(`${fieldName} must be a valid email address`);
    }
  },

  uuid: (value: string, fieldName: string): void => {
    if (value && !isValidUUID(value)) {
      throw new DatabaseError(`${fieldName} must be a valid UUID`);
    }
  },

  positive: (value: number, fieldName: string): void => {
    if (value !== null && value !== undefined && value <= 0) {
      throw new DatabaseError(`${fieldName} must be a positive number`);
    }
  },

  inRange: (value: number, min: number, max: number, fieldName: string): void => {
    if (value !== null && value !== undefined && (value < min || value > max)) {
      throw new DatabaseError(`${fieldName} must be between ${min} and ${max}`);
    }
  }
};

/**
 * Advanced pagination options with cursor support
 */
export interface CursorPaginationOptions {
  limit: number;
  cursor?: string; // Base64 encoded cursor for efficient pagination
  direction?: 'forward' | 'backward';
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Parse cursor-based pagination parameters
 */
export function parsePaginationQuery(query: any): {
  page?: number;
  limit?: number;
  cursor?: string;
  sort?: { field: string; direction: 'asc' | 'desc' };
} {
  const page = query.page ? Math.max(1, parseInt(query.page)) : undefined;
  const limit = query.limit ? Math.min(Math.max(1, parseInt(query.limit)), 100) : undefined;
  const cursor = query.cursor || undefined;
  
  let sort: { field: string; direction: 'asc' | 'desc' } | undefined;
  if (query.sort) {
    const [field, direction = 'asc'] = query.sort.split(':');
    sort = { 
      field, 
      direction: direction.toLowerCase() === 'desc' ? 'desc' : 'asc' 
    };
  }
  
  return { page, limit, cursor, sort };
}

/**
 * Generate cursor for next page in cursor-based pagination
 */
export function generateCursor(lastItem: any, sortField: string): string {
  if (!lastItem || !lastItem[sortField]) {
    return '';
  }
  
  const cursorData = {
    field: sortField,
    value: lastItem[sortField],
    id: lastItem.id // Include ID for tie-breaking
  };
  
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}

/**
 * Parse cursor data
 */
export function parseCursor(cursor: string): { field: string; value: any; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Database utility functions collection
 */
export const dbUtils = {
  buildWhereConditions,
  buildSearchConditions,  
  buildOrderBy,
  calculatePagination,
  buildPaginationMeta,
  parsePaginationQuery,
  generateCursor,
  parseCursor,
  sanitizeDatabaseInput,
  isValidUUID,
  isValidEmail,
  executeWithRetry,
  createHealthCheckQuery,
  formatDatabaseError,
  validators
};