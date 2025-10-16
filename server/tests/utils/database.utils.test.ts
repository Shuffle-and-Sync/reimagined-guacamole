/**
 * Database Utils Tests
 * 
 * Unit tests for database utility functions following testing best practices.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { 
  buildWhereConditions, 
  buildSearchConditions,
  buildOrderBy,
  calculatePagination,
  buildPaginationMeta,
  sanitizeDatabaseInput,
  isValidUUID,
  isValidEmail,
  validators,
  type FilterCondition
} from '../../utils/database.utils';
import { sql } from 'drizzle-orm';

// Mock database column for testing
const mockColumn = {
  name: 'test_column',
} as any;

const mockColumns = {
  name: mockColumn,
  email: mockColumn,
  age: mockColumn,
  status: mockColumn
};

describe('Database Utils', () => {
  describe('buildWhereConditions', () => {
    test('should build equality condition', () => {
      const filters: FilterCondition[] = [
        { field: 'name', operator: 'eq', value: 'John' }
      ];
      
      const conditions = buildWhereConditions(filters, mockColumns);
      expect(conditions).toHaveLength(1);
    });

    test('should build multiple conditions', () => {
      const filters: FilterCondition[] = [
        { field: 'name', operator: 'eq', value: 'John' },
        { field: 'age', operator: 'gte', value: 18 }
      ];
      
      const conditions = buildWhereConditions(filters, mockColumns);
      expect(conditions).toHaveLength(2);
    });

    test('should skip invalid fields', () => {
      const filters: FilterCondition[] = [
        { field: 'invalid_field', operator: 'eq', value: 'test' },
        { field: 'name', operator: 'eq', value: 'John' }
      ];
      
      const conditions = buildWhereConditions(filters, mockColumns);
      expect(conditions).toHaveLength(1);
    });

    test('should handle in operator with values array', () => {
      const filters: FilterCondition[] = [
        { field: 'status', operator: 'in', values: ['active', 'pending'] }
      ];
      
      const conditions = buildWhereConditions(filters, mockColumns);
      expect(conditions).toHaveLength(1);
    });

    test('should handle between operator', () => {
      const filters: FilterCondition[] = [
        { field: 'age', operator: 'between', values: [18, 65] }
      ];
      
      const conditions = buildWhereConditions(filters, mockColumns);
      expect(conditions).toHaveLength(1);
    });
  });

  describe('buildSearchConditions', () => {
    test('should build search conditions for multiple fields', () => {
      const searchFields = ['name', 'email'];
      const searchTerm = 'john';
      
      const condition = buildSearchConditions(searchFields, searchTerm, mockColumns);
      expect(condition).toBeTruthy();
    });

    test('should return null for empty search term', () => {
      const searchFields = ['name', 'email'];
      const searchTerm = '';
      
      const condition = buildSearchConditions(searchFields, searchTerm, mockColumns);
      expect(condition).toBeNull();
    });

    test('should handle trimmed search term', () => {
      const searchFields = ['name'];
      const searchTerm = '  john  ';
      
      const condition = buildSearchConditions(searchFields, searchTerm, mockColumns);
      expect(condition).toBeTruthy();
    });
  });

  describe('calculatePagination', () => {
    test('should calculate correct pagination', () => {
      const result = calculatePagination(2, 10);
      
      expect(result).toEqual({
        page: 2,
        limit: 10,
        offset: 10
      });
    });

    test('should handle invalid page numbers', () => {
      const result = calculatePagination(-1, 10);
      
      expect(result.page).toBe(1);
      expect(result.offset).toBe(0);
    });

    test('should enforce maximum limit', () => {
      const result = calculatePagination(1, 200);
      
      expect(result.limit).toBe(100);
    });

    test('should enforce minimum limit', () => {
      const result = calculatePagination(1, -5);
      
      expect(result.limit).toBe(1);
    });
  });

  describe('buildPaginationMeta', () => {
    test('should build correct pagination metadata', () => {
      const meta = buildPaginationMeta(100, 2, 10);
      
      expect(meta).toEqual({
        total: 100,
        page: 2,
        limit: 10,
        totalPages: 10,
        hasNext: true,
        hasPrevious: true,
        startIndex: 11,
        endIndex: 20
      });
    });

    test('should handle first page', () => {
      const meta = buildPaginationMeta(50, 1, 10);
      
      expect(meta.hasPrevious).toBe(false);
      expect(meta.hasNext).toBe(true);
      expect(meta.startIndex).toBe(1);
    });

    test('should handle last page', () => {
      const meta = buildPaginationMeta(25, 3, 10);
      
      expect(meta.hasPrevious).toBe(true);
      expect(meta.hasNext).toBe(false);
      expect(meta.endIndex).toBe(25);
    });
  });

  describe('sanitizeDatabaseInput', () => {
    test('should sanitize string input', () => {
      const input = '<script>alert("xss")</script>hello';
      const result = sanitizeDatabaseInput(input);
      
      // Quotes and angle brackets are removed for security
      expect(result).toBe('scriptalert(xss)/scripthello');
    });

    test('should sanitize nested objects', () => {
      const input = {
        name: '<b>John</b>',
        data: {
          description: 'Test<script>',
          tags: ['<tag1>', 'tag2']
        }
      };
      
      const result = sanitizeDatabaseInput(input);
      
      expect(result.name).toBe('bJohn/b');
      expect(result.data.description).toBe('Testscript');
      expect(result.data.tags[0]).toBe('tag1');
    });

    test('should handle arrays', () => {
      const input = ['<test1>', 'test2', { name: '<test3>' }];
      const result = sanitizeDatabaseInput(input);
      
      expect(result[0]).toBe('test1');
      expect(result[1]).toBe('test2');
      expect(result[2].name).toBe('test3');
    });

    test('should handle null and undefined', () => {
      expect(sanitizeDatabaseInput(null)).toBeNull();
      expect(sanitizeDatabaseInput(undefined)).toBeUndefined();
    });
  });

  describe('isValidUUID', () => {
    test('should validate correct UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      ];
      
      validUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(true);
      });
    });

    test('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456-42661417400', // too short
        '123e4567-e89b-12d3-a456-4266141740000', // too long
        '123e4567-e89b-92d3-a456-426614174000', // invalid version
        '123e4567-e89b-12d3-c456-426614174000' // invalid variant
      ];
      
      invalidUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(false);
      });
    });
  });

  describe('isValidEmail', () => {
    test('should validate correct emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];
      
      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    test('should reject invalid emails', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user@domain',
        'user name@example.com'
      ];
      
      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('validators', () => {
    describe('required', () => {
      test('should pass for valid values', () => {
        expect(() => validators.required('test', 'field')).not.toThrow();
        expect(() => validators.required(0, 'field')).not.toThrow();
        expect(() => validators.required(false, 'field')).not.toThrow();
      });

      test('should throw for invalid values', () => {
        expect(() => validators.required(null, 'field')).toThrow('field is required');
        expect(() => validators.required(undefined, 'field')).toThrow('field is required');
        expect(() => validators.required('', 'field')).toThrow('field is required');
      });
    });

    describe('maxLength', () => {
      test('should pass for valid lengths', () => {
        expect(() => validators.maxLength('test', 10, 'field')).not.toThrow();
        expect(() => validators.maxLength('test', 4, 'field')).not.toThrow();
      });

      test('should throw for excessive length', () => {
        expect(() => validators.maxLength('toolong', 5, 'field')).toThrow('field cannot exceed 5 characters');
      });
    });

    describe('email', () => {
      test('should pass for valid emails', () => {
        expect(() => validators.email('test@example.com', 'Email')).not.toThrow();
      });

      test('should throw for invalid emails', () => {
        expect(() => validators.email('invalid-email', 'Email')).toThrow('Email must be a valid email address');
      });
    });

    describe('uuid', () => {
      test('should pass for valid UUIDs', () => {
        expect(() => validators.uuid('123e4567-e89b-12d3-a456-426614174000', 'ID')).not.toThrow();
      });

      test('should throw for invalid UUIDs', () => {
        expect(() => validators.uuid('not-a-uuid', 'ID')).toThrow('ID must be a valid UUID');
      });
    });

    describe('positive', () => {
      test('should pass for positive numbers', () => {
        expect(() => validators.positive(1, 'field')).not.toThrow();
        expect(() => validators.positive(0.1, 'field')).not.toThrow();
      });

      test('should throw for non-positive numbers', () => {
        expect(() => validators.positive(0, 'field')).toThrow('field must be a positive number');
        expect(() => validators.positive(-1, 'field')).toThrow('field must be a positive number');
      });
    });

    describe('inRange', () => {
      test('should pass for values in range', () => {
        expect(() => validators.inRange(5, 1, 10, 'field')).not.toThrow();
        expect(() => validators.inRange(1, 1, 10, 'field')).not.toThrow();
        expect(() => validators.inRange(10, 1, 10, 'field')).not.toThrow();
      });

      test('should throw for values out of range', () => {
        expect(() => validators.inRange(0, 1, 10, 'field')).toThrow('field must be between 1 and 10');
        expect(() => validators.inRange(11, 1, 10, 'field')).toThrow('field must be between 1 and 10');
      });
    });
  });
});