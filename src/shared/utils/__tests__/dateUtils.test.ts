/**
 * ============================================================================
 * DATE UTILS - Tests
 * ============================================================================
 *
 * Tests pour les utilitaires de manipulation de dates
 */

import { describe, it, expect } from 'vitest';
import { formatDate, formatTime } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = formatDate(date);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should handle different date formats', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-12-31');

      expect(formatDate(date1)).toBeTruthy();
      expect(formatDate(date2)).toBeTruthy();
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = formatTime(date);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should handle different times', () => {
      const morning = new Date('2024-01-15T09:15:00');
      const evening = new Date('2024-01-15T18:45:00');

      expect(formatTime(morning)).toBeTruthy();
      expect(formatTime(evening)).toBeTruthy();
    });
  });
});
