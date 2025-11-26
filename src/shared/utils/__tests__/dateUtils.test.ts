/**
 * Tests pour dateUtils (utilitaires de dates)
 */

import { describe, it, expect } from 'vitest';
import { toDate, isTimestamp, formatDate, formatTime } from '../dateUtils';
import { Timestamp } from 'firebase/firestore';

describe('dateUtils', () => {
  // ==========================================================================
  // TESTS - toDate
  // ==========================================================================

  describe('toDate', () => {
    it('devrait retourner la date actuelle si undefined', () => {
      const result = toDate(undefined);
      expect(result).toBeInstanceOf(Date);
      // Vérifier que c'est une date proche de maintenant (dans les 5 secondes)
      const now = new Date();
      expect(Math.abs(result.getTime() - now.getTime())).toBeLessThan(5000);
    });

    it('devrait retourner la date actuelle si null', () => {
      const result = toDate(null);
      expect(result).toBeInstanceOf(Date);
      const now = new Date();
      expect(Math.abs(result.getTime() - now.getTime())).toBeLessThan(5000);
    });

    it('devrait retourner la même Date si déjà une Date', () => {
      const date = new Date('2025-01-15T10:00:00.000Z');
      const result = toDate(date);

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(date.getTime());
    });

    it('devrait convertir un Timestamp Firestore en Date', () => {
      const timestamp = Timestamp.fromDate(new Date('2025-01-15T10:00:00.000Z'));
      const result = toDate(timestamp);

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // Janvier = 0
      expect(result.getDate()).toBe(15);
    });

    it('devrait gérer les Timestamps avec toDate() method', () => {
      const mockTimestamp = {
        toDate: () => new Date('2025-03-20T15:30:00.000Z'),
      };

      const result = toDate(mockTimestamp as any);

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(2); // Mars = 2
      expect(result.getDate()).toBe(20);
    });
  });

  // ==========================================================================
  // TESTS - isTimestamp
  // ==========================================================================

  describe('isTimestamp', () => {
    it('devrait retourner true pour un Timestamp Firestore', () => {
      const timestamp = Timestamp.fromDate(new Date('2025-01-15T10:00:00.000Z'));
      expect(isTimestamp(timestamp)).toBe(true);
    });

    it('devrait retourner true pour un objet avec méthode toDate', () => {
      const mockTimestamp = {
        toDate: () => new Date(),
      };

      expect(isTimestamp(mockTimestamp)).toBe(true);
    });

    it('devrait retourner false pour une Date', () => {
      const date = new Date();
      expect(isTimestamp(date)).toBe(false);
    });

    it('devrait retourner false pour null', () => {
      expect(isTimestamp(null)).toBe(false);
    });

    it('devrait retourner false pour undefined', () => {
      expect(isTimestamp(undefined)).toBe(false);
    });

    it('devrait retourner false pour un string', () => {
      expect(isTimestamp('2025-01-15')).toBe(false);
    });

    it('devrait retourner false pour un number', () => {
      expect(isTimestamp(1705315200000)).toBe(false);
    });

    it('devrait retourner false pour un objet sans toDate', () => {
      const obj = { seconds: 1705315200, nanoseconds: 0 };
      expect(isTimestamp(obj)).toBe(false);
    });

    it('devrait retourner false si toDate n\'est pas une fonction', () => {
      const obj = { toDate: 'not a function' };
      expect(isTimestamp(obj)).toBe(false);
    });
  });

  // ==========================================================================
  // TESTS - formatDate
  // ==========================================================================

  describe('formatDate', () => {
    it('devrait formater une Date au format français JJ/MM/AAAA', () => {
      const date = new Date('2025-01-15T10:00:00.000Z');
      const result = formatDate(date);

      // Format français: "15/01/2025"
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(result).toBe('15/01/2025');
    });

    it('devrait formater un Timestamp Firestore', () => {
      const timestamp = Timestamp.fromDate(new Date('2025-03-20T15:30:00.000Z'));
      const result = formatDate(timestamp);

      expect(result).toBe('20/03/2025');
    });

    it('devrait formater null comme date actuelle', () => {
      const result = formatDate(null);

      // Vérifier que c'est une date au format JJ/MM/AAAA
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);

      // Vérifier que c'est l'année actuelle
      const currentYear = new Date().getFullYear();
      expect(result).toContain(currentYear.toString());
    });

    it('devrait formater undefined comme date actuelle', () => {
      const result = formatDate(undefined);

      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      const currentYear = new Date().getFullYear();
      expect(result).toContain(currentYear.toString());
    });

    it('devrait formater les dates avec jour à 1 chiffre (01-09)', () => {
      const date = new Date('2025-01-05T10:00:00.000Z');
      const result = formatDate(date);

      expect(result).toBe('05/01/2025');
    });

    it('devrait formater les dates avec mois à 1 chiffre (01-09)', () => {
      const date = new Date('2025-03-25T10:00:00.000Z');
      const result = formatDate(date);

      expect(result).toBe('25/03/2025');
    });

    it('devrait formater le 31 décembre', () => {
      const date = new Date('2025-12-31T10:00:00.000Z');
      const result = formatDate(date);

      // Peut être 31/12/2025 ou 01/01/2026 selon timezone
      expect(result).toMatch(/^(31\/12\/2025|01\/01\/2026)$/);
    });

    it('devrait formater le 1er janvier', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      const result = formatDate(date);

      expect(result).toBe('01/01/2025');
    });
  });

  // ==========================================================================
  // TESTS - formatTime
  // ==========================================================================

  describe('formatTime', () => {
    it('devrait formater une heure au format HH:MM', () => {
      const date = new Date('2025-01-15T10:30:00.000Z');
      const result = formatTime(date);

      // Format français 24h: "10:30" (peut être "11:30" selon timezone)
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('devrait formater minuit (00:00)', () => {
      const date = new Date('2025-01-15T00:00:00.000Z');
      const result = formatTime(date);

      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('devrait formater midi', () => {
      const date = new Date('2025-01-15T12:00:00.000Z');
      const result = formatTime(date);

      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('devrait formater 23:59', () => {
      const date = new Date('2025-01-15T23:59:00.000Z');
      const result = formatTime(date);

      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('devrait formater un Timestamp Firestore', () => {
      const timestamp = Timestamp.fromDate(new Date('2025-01-15T14:45:00.000Z'));
      const result = formatTime(timestamp);

      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('devrait formater null comme heure actuelle', () => {
      const result = formatTime(null);

      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('devrait formater undefined comme heure actuelle', () => {
      const result = formatTime(undefined);

      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('devrait utiliser format 24h (pas AM/PM)', () => {
      const date = new Date('2025-01-15T15:30:00.000Z');
      const result = formatTime(date);

      // Format 24h ne contient pas "AM" ou "PM"
      expect(result).not.toContain('AM');
      expect(result).not.toContain('PM');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});
