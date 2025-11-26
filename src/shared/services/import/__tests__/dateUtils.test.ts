/**
 * Tests pour le module dateUtils
 */

import { describe, it, expect } from 'vitest';
import { parseDate, parseDateTime } from '../dateUtils';

describe('dateUtils', () => {
  describe('parseDate', () => {
    it('devrait parser le format JJ/MM/AAAA', () => {
      const date = parseDate('22/11/2025');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getDate()).toBe(22);
      expect(date?.getMonth()).toBe(10); // Novembre = 10 (0-indexed)
      expect(date?.getFullYear()).toBe(2025);
    });

    it('devrait parser le format MM/DD/YYYY', () => {
      const date = parseDate('11/22/2025');
      // Ambiguïté : 11 <= 12 et 22 > 12, donc MM/DD/YYYY
      expect(date).toBeInstanceOf(Date);
      expect(date?.getDate()).toBe(22);
      expect(date?.getMonth()).toBe(10);
      expect(date?.getFullYear()).toBe(2025);
    });

    it('devrait parser le format M/D/YY', () => {
      const date = parseDate('4/22/25');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getDate()).toBe(22);
      expect(date?.getMonth()).toBe(3); // Avril = 3
      expect(date?.getFullYear()).toBe(2025); // 25 -> 2025
    });

    it('devrait gérer les dates avec jour > 12 (JJ/MM/AAAA)', () => {
      const date = parseDate('25/12/2025');
      expect(date?.getDate()).toBe(25);
      expect(date?.getMonth()).toBe(11); // Décembre
      expect(date?.getFullYear()).toBe(2025);
    });

    it('devrait retourner null pour les chaînes vides', () => {
      expect(parseDate('')).toBeNull();
      expect(parseDate('   ')).toBeNull();
    });

    it('devrait retourner null pour les formats invalides', () => {
      expect(parseDate('invalid')).toBeNull();
      expect(parseDate('22-11-2025')).toBeNull();
      expect(parseDate('2025/11/22')).toBeNull();
    });

    it('devrait retourner null pour les dates invalides', () => {
      expect(parseDate('32/01/2025')).toBeNull(); // Jour invalide
      expect(parseDate('15/13/2025')).toBeNull(); // Mois invalide (15 > 12 et 13 > 12)
      expect(parseDate('29/02/2025')).toBeNull(); // 2025 n'est pas bissextile
    });

    it('devrait accepter les dates valides bissextiles', () => {
      const date = parseDate('29/02/2024'); // 2024 est bissextile
      expect(date).toBeInstanceOf(Date);
      expect(date?.getDate()).toBe(29);
      expect(date?.getMonth()).toBe(1); // Février
    });

    it('devrait gérer les années sur 2 chiffres', () => {
      const date = parseDate('1/1/99');
      expect(date?.getFullYear()).toBe(2099); // 99 -> 2099
    });
  });

  describe('parseDateTime', () => {
    it('devrait parser date + heure', () => {
      const dateTime = parseDateTime('22/11/2025', '14:30');
      expect(dateTime).toBeInstanceOf(Date);
      expect(dateTime?.getDate()).toBe(22);
      expect(dateTime?.getMonth()).toBe(10);
      expect(dateTime?.getFullYear()).toBe(2025);
      expect(dateTime?.getHours()).toBe(14);
      expect(dateTime?.getMinutes()).toBe(30);
    });

    it('devrait parser avec heure à minuit', () => {
      const dateTime = parseDateTime('22/11/2025', '00:00');
      expect(dateTime?.getHours()).toBe(0);
      expect(dateTime?.getMinutes()).toBe(0);
    });

    it('devrait parser avec heure en fin de journée', () => {
      const dateTime = parseDateTime('22/11/2025', '23:59');
      expect(dateTime?.getHours()).toBe(23);
      expect(dateTime?.getMinutes()).toBe(59);
    });

    it('devrait retourner la date seule si heure vide', () => {
      const dateTime = parseDateTime('22/11/2025', '');
      expect(dateTime).toBeInstanceOf(Date);
      expect(dateTime?.getHours()).toBe(0);
      expect(dateTime?.getMinutes()).toBe(0);
    });

    it('devrait retourner la date seule si heure invalide', () => {
      const dateTime = parseDateTime('22/11/2025', 'invalid');
      expect(dateTime).toBeInstanceOf(Date);
      // Devrait retourner la date avec heure par défaut
    });

    it('devrait retourner null si date invalide', () => {
      expect(parseDateTime('invalid', '14:30')).toBeNull();
      expect(parseDateTime('', '14:30')).toBeNull();
    });

    it('devrait ignorer les heures > 23', () => {
      const dateTime = parseDateTime('22/11/2025', '25:30');
      // Devrait retourner la date sans heure
      expect(dateTime).toBeInstanceOf(Date);
    });

    it('devrait ignorer les minutes > 59', () => {
      const dateTime = parseDateTime('22/11/2025', '14:70');
      // Devrait retourner la date sans heure
      expect(dateTime).toBeInstanceOf(Date);
    });

    it('devrait gérer le format HH:MM avec zéros', () => {
      const dateTime = parseDateTime('01/01/2025', '09:05');
      expect(dateTime?.getHours()).toBe(9);
      expect(dateTime?.getMinutes()).toBe(5);
    });
  });
});
