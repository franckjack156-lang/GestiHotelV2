/**
 * ============================================================================
 * SIMPLE TEST - Debug
 * ============================================================================
 */

import { describe, it, expect, test } from 'vitest';

describe('Simple Tests', () => {
  test('basic math', () => {
    expect(1 + 1).toBe(2);
  });

  it('should pass', () => {
    expect(true).toBe(true);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
  });

  it('should handle objects', () => {
    const obj = { name: 'test' };
    expect(obj.name).toBe('test');
  });
});

test('standalone test', () => {
  expect(2 + 2).toBe(4);
});
