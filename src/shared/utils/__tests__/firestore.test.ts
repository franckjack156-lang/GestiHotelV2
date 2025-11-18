/**
 * ============================================================================
 * FIRESTORE UTILS - Tests
 * ============================================================================
 *
 * Tests pour les utilitaires Firestore
 */

import { describe, it, expect } from 'vitest';
import { convertTimestamp, convertTimestamps } from '../firestore';

describe('Firestore Utils', () => {
  describe('convertTimestamp', () => {
    it('should convert Firestore timestamp to Date', () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15T10:30:00'),
        seconds: 1705318200,
        nanoseconds: 0,
      };

      const result = convertTimestamp(mockTimestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
    });

    it('should return Date as-is', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = convertTimestamp(date);
      expect(result).toBe(date);
    });

    it('should handle null', () => {
      const result = convertTimestamp(null);
      expect(result).toBeNull();
    });

    it('should handle undefined', () => {
      const result = convertTimestamp(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('convertTimestamps', () => {
    it('should convert all timestamps in object', () => {
      const mockData = {
        createdAt: {
          toDate: () => new Date('2024-01-15'),
          seconds: 1705276800,
          nanoseconds: 0,
        },
        updatedAt: {
          toDate: () => new Date('2024-01-16'),
          seconds: 1705363200,
          nanoseconds: 0,
        },
        name: 'Test',
      };

      const result = convertTimestamps(mockData);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.name).toBe('Test');
    });

    it('should handle nested objects', () => {
      const mockData = {
        metadata: {
          createdAt: {
            toDate: () => new Date('2024-01-15'),
            seconds: 1705276800,
            nanoseconds: 0,
          },
        },
      };

      const result = convertTimestamps(mockData);
      expect(result.metadata.createdAt).toBeInstanceOf(Date);
    });

    it('should handle arrays', () => {
      const mockData = {
        items: [
          {
            date: {
              toDate: () => new Date('2024-01-15'),
              seconds: 1705276800,
              nanoseconds: 0,
            },
          },
        ],
      };

      const result = convertTimestamps(mockData);
      expect(result.items[0].date).toBeInstanceOf(Date);
    });

    it('should handle null and undefined', () => {
      const result1 = convertTimestamps(null);
      const result2 = convertTimestamps(undefined);

      expect(result1).toBeNull();
      expect(result2).toBeUndefined();
    });

    it('should not modify other types', () => {
      const mockData = {
        string: 'test',
        number: 123,
        boolean: true,
        date: new Date('2024-01-15'),
      };

      const result = convertTimestamps(mockData);
      expect(result.string).toBe('test');
      expect(result.number).toBe(123);
      expect(result.boolean).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
    });
  });
});
