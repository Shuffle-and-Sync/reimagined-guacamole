/**
 * Simple Test to Verify Jest Configuration
 */

import { describe, test, expect } from '@jest/globals';

describe('Basic Test Suite', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle async test', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
});