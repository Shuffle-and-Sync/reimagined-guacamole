/**
 * Database Pagination Performance Tests
 * 
 * Tests for the new pagination and database optimization features
 */

import { dbUtils } from '../../utils/database.utils';

describe('Database Pagination Utils', () => {
  describe('parsePaginationQuery', () => {
    it('should parse basic pagination parameters', () => {
      const query = {
        page: '2',
        limit: '25',
        sort: 'createdAt:desc'
      };
      
      const result = dbUtils.parsePaginationQuery(query);
      
      expect(result).toEqual({
        page: 2,
        limit: 25,
        cursor: undefined,
        sort: {
          field: 'createdAt',
          direction: 'desc'
        }
      });
    });

    it('should handle cursor-based pagination', () => {
      const query = {
        cursor: 'eyJmaWVsZCI6ImNyZWF0ZWRBdCJ9',
        limit: '50'
      };
      
      const result = dbUtils.parsePaginationQuery(query);
      
      expect(result.cursor).toBe('eyJmaWVsZCI6ImNyZWF0ZWRBdCJ9');
      expect(result.limit).toBe(50);
    });

    it('should enforce maximum limits', () => {
      const query = {
        limit: '500' // Over the max of 100
      };
      
      const result = dbUtils.parsePaginationQuery(query);
      
      expect(result.limit).toBe(100);
    });

    it('should handle invalid parameters gracefully', () => {
      const query = {
        page: 'invalid',
        limit: '-5',
        sort: 'invalid-format'
      };
      
      const result = dbUtils.parsePaginationQuery(query);
      
      expect(result.page).toBe(1); // Should default to 1 for invalid page
      expect(result.limit).toBe(1); // Should clamp negative to 1
      expect(result.sort).toBeUndefined(); // Invalid sort format should be undefined
    });
  });

  describe('generateCursor', () => {
    it('should generate a valid base64 cursor', () => {
      const item = {
        id: 'user-123',
        createdAt: '2024-01-10T15:30:00.000Z',
        name: 'Test User'
      };
      
      const cursor = dbUtils.generateCursor(item, 'createdAt');
      
      expect(cursor).toBeTruthy();
      expect(typeof cursor).toBe('string');
      
      // Should be valid base64
      expect(() => {
        Buffer.from(cursor, 'base64').toString('utf-8');
      }).not.toThrow();
    });

    it('should return empty string for invalid item', () => {
      const cursor = dbUtils.generateCursor(null, 'createdAt');
      expect(cursor).toBe('');
      
      const cursor2 = dbUtils.generateCursor({}, 'createdAt');
      expect(cursor2).toBe('');
    });
  });

  describe('parseCursor', () => {
    it('should parse a valid cursor', () => {
      const cursorData = {
        field: 'createdAt',
        value: '2024-01-10T15:30:00.000Z',
        id: 'user-123'
      };
      
      const cursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
      const parsed = dbUtils.parseCursor(cursor);
      
      expect(parsed).toEqual(cursorData);
    });

    it('should return null for invalid cursor', () => {
      expect(dbUtils.parseCursor('invalid-cursor')).toBeNull();
      expect(dbUtils.parseCursor('')).toBeNull();
    });
  });

  describe('calculatePagination', () => {
    it('should calculate correct pagination values', () => {
      const result = dbUtils.calculatePagination(2, 25);
      
      expect(result).toEqual({
        page: 2,
        limit: 25,
        offset: 25
      });
    });

    it('should handle edge cases', () => {
      // Negative page should default to 1
      const result1 = dbUtils.calculatePagination(-5, 25);
      expect(result1.page).toBe(1);
      expect(result1.offset).toBe(0);
      
      // Zero page should default to 1
      const result2 = dbUtils.calculatePagination(0, 25);
      expect(result2.page).toBe(1);
      
      // Large limit should be capped
      const result3 = dbUtils.calculatePagination(1, 500);
      expect(result3.limit).toBe(100);
    });
  });

  describe('buildPaginationMeta', () => {
    it('should build correct pagination metadata', () => {
      const meta = dbUtils.buildPaginationMeta(125, 3, 25);
      
      expect(meta).toEqual({
        total: 125,
        page: 3,
        limit: 25,
        totalPages: 5,
        hasNext: true,
        hasPrevious: true,
        startIndex: 51,
        endIndex: 75
      });
    });

    it('should handle first page correctly', () => {
      const meta = dbUtils.buildPaginationMeta(50, 1, 25);
      
      expect(meta.hasPrevious).toBe(false);
      expect(meta.hasNext).toBe(true);
      expect(meta.startIndex).toBe(1);
      expect(meta.endIndex).toBe(25);
    });

    it('should handle last page correctly', () => {
      const meta = dbUtils.buildPaginationMeta(45, 2, 25);
      
      expect(meta.hasPrevious).toBe(true);
      expect(meta.hasNext).toBe(false);
      expect(meta.totalPages).toBe(2);
      expect(meta.endIndex).toBe(45);
    });
  });
});