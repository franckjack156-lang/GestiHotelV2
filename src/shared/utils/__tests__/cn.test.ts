/* eslint-disable no-constant-binary-expression */
/**
 * ============================================================================
 * CN UTILITY - Tests
 * ============================================================================
 *
 * Tests pour l'utilitaire de fusion de classes CSS
 */

import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'conditional', false && 'not-included');
    expect(result).toContain('base');
    expect(result).toContain('conditional');
    expect(result).not.toContain('not-included');
  });

  it('should handle undefined and null', () => {
    const result = cn('base', undefined, null, 'other');
    expect(result).toContain('base');
    expect(result).toContain('other');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('bg-red-500', 'bg-blue-500');
    // tailwind-merge devrait garder la dernière classe
    expect(result).toBe('bg-blue-500');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle arrays', () => {
    const result = cn(['class1', 'class2']);
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle objects', () => {
    const result = cn({
      class1: true,
      class2: false,
      class3: true,
    });
    expect(result).toContain('class1');
    expect(result).not.toContain('class2');
    expect(result).toContain('class3');
  });

  it('should merge complex scenarios', () => {
    const result = cn(
      'base-class',
      { 'conditional-class': true },
      ['array-class1', 'array-class2'],
      undefined,
      'final-class'
    );
    expect(result).toContain('base-class');
    expect(result).toContain('conditional-class');
    expect(result).toContain('array-class1');
    expect(result).toContain('array-class2');
    expect(result).toContain('final-class');
  });
});
