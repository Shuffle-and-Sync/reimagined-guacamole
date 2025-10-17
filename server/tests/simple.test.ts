/**
 * Simple Test to Verify Jest Configuration
 * 
 * Includes tests for ESM module support (e.g., nanoid)
 */

import { describe, test, expect } from '@jest/globals';
import { nanoid } from 'nanoid';

describe('Basic Test Suite', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle async test', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
});

describe('ESM Module Support', () => {
  test('should import and use nanoid (ESM package)', () => {
    const id = nanoid();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('should generate unique IDs', () => {
    const id1 = nanoid();
    const id2 = nanoid();
    expect(id1).not.toBe(id2);
  });

  test('should accept custom size parameter', () => {
    const id = nanoid(10);
    expect(id.length).toBe(10);
  });
});