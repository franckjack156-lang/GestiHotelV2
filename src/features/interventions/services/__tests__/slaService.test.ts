/**
 * Tests pour slaService
 *
 * Service critique gérant le calcul des SLA (Service Level Agreement)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SLA_TARGETS,
  calculateDueDate,
  calculateSLAStatus,
  formatRemainingTime,
  getSLABadgeColor,
  getSLAStatusLabel,
} from '../slaService';

describe('slaService', () => {
  let dateNowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Fixer la date pour les tests : 15 janvier 2025 à 10:00:00
    const fixedDate = new Date('2025-01-15T10:00:00.000Z');
    dateNowSpy = vi.spyOn(global.Date, 'now').mockReturnValue(fixedDate.getTime());
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  // ==========================================================================
  // TESTS - SLA_TARGETS
  // ==========================================================================

  describe('SLA_TARGETS', () => {
    it('devrait avoir des objectifs SLA pour toutes les priorités', () => {
      expect(SLA_TARGETS.low).toBe(24 * 60); // 24 heures
      expect(SLA_TARGETS.normal).toBe(8 * 60); // 8 heures
      expect(SLA_TARGETS.high).toBe(4 * 60); // 4 heures
      expect(SLA_TARGETS.urgent).toBe(2 * 60); // 2 heures
      expect(SLA_TARGETS.critical).toBe(1 * 60); // 1 heure
    });

    it('devrait avoir des objectifs en ordre décroissant', () => {
      expect(SLA_TARGETS.critical).toBeLessThan(SLA_TARGETS.urgent);
      expect(SLA_TARGETS.urgent).toBeLessThan(SLA_TARGETS.high);
      expect(SLA_TARGETS.high).toBeLessThan(SLA_TARGETS.normal);
      expect(SLA_TARGETS.normal).toBeLessThan(SLA_TARGETS.low);
    });
  });

  // ==========================================================================
  // TESTS - calculateDueDate
  // ==========================================================================

  describe('calculateDueDate', () => {
    it('devrait calculer la date limite pour priorité normale (8h)', () => {
      const createdAt = new Date('2025-01-15T10:00:00.000Z');
      const dueDate = calculateDueDate(createdAt, 'normal');

      const expectedDueDate = new Date('2025-01-15T18:00:00.000Z'); // +8h
      expect(dueDate.getTime()).toBe(expectedDueDate.getTime());
    });

    it('devrait calculer la date limite pour priorité critique (1h)', () => {
      const createdAt = new Date('2025-01-15T10:00:00.000Z');
      const dueDate = calculateDueDate(createdAt, 'critical');

      const expectedDueDate = new Date('2025-01-15T11:00:00.000Z'); // +1h
      expect(dueDate.getTime()).toBe(expectedDueDate.getTime());
    });

    it('devrait calculer la date limite pour priorité urgente (2h)', () => {
      const createdAt = new Date('2025-01-15T10:00:00.000Z');
      const dueDate = calculateDueDate(createdAt, 'urgent');

      const expectedDueDate = new Date('2025-01-15T12:00:00.000Z'); // +2h
      expect(dueDate.getTime()).toBe(expectedDueDate.getTime());
    });

    it('devrait calculer la date limite pour priorité haute (4h)', () => {
      const createdAt = new Date('2025-01-15T10:00:00.000Z');
      const dueDate = calculateDueDate(createdAt, 'high');

      const expectedDueDate = new Date('2025-01-15T14:00:00.000Z'); // +4h
      expect(dueDate.getTime()).toBe(expectedDueDate.getTime());
    });

    it('devrait calculer la date limite pour priorité basse (24h)', () => {
      const createdAt = new Date('2025-01-15T10:00:00.000Z');
      const dueDate = calculateDueDate(createdAt, 'low');

      const expectedDueDate = new Date('2025-01-16T10:00:00.000Z'); // +24h
      expect(dueDate.getTime()).toBe(expectedDueDate.getTime());
    });

    it('devrait utiliser customDueDate si fourni', () => {
      const createdAt = new Date('2025-01-15T10:00:00.000Z');
      const customDueDate = new Date('2025-01-20T15:30:00.000Z');

      const dueDate = calculateDueDate(createdAt, 'normal', customDueDate);

      expect(dueDate.getTime()).toBe(customDueDate.getTime());
    });

    it('devrait ignorer SLA automatique si customDueDate fourni', () => {
      const createdAt = new Date('2025-01-15T10:00:00.000Z');
      const customDueDate = new Date('2025-01-16T10:00:00.000Z'); // 24h plus tard

      // Même avec priorité critical (1h), devrait utiliser la date personnalisée
      const dueDate = calculateDueDate(createdAt, 'critical', customDueDate);

      expect(dueDate.getTime()).toBe(customDueDate.getTime());
    });
  });

  // ==========================================================================
  // TESTS - calculateSLAStatus
  // ==========================================================================

  describe('calculateSLAStatus', () => {
    it('devrait retourner "on_track" si moins de 75% du temps écoulé', () => {
      const status = calculateSLAStatus(50, false);
      expect(status).toBe('on_track');
    });

    it('devrait retourner "on_track" si exactement 74% du temps écoulé', () => {
      const status = calculateSLAStatus(74, false);
      expect(status).toBe('on_track');
    });

    it('devrait retourner "at_risk" si 75% du temps écoulé', () => {
      const status = calculateSLAStatus(75, false);
      expect(status).toBe('at_risk');
    });

    it('devrait retourner "at_risk" si 90% du temps écoulé', () => {
      const status = calculateSLAStatus(90, false);
      expect(status).toBe('at_risk');
    });

    it('devrait retourner "breached" si 100% du temps écoulé', () => {
      const status = calculateSLAStatus(100, false);
      expect(status).toBe('breached');
    });

    it('devrait retourner "breached" si plus de 100% du temps écoulé', () => {
      const status = calculateSLAStatus(150, false);
      expect(status).toBe('breached');
    });

    it('devrait retourner "on_track" si terminé avant 100%', () => {
      const status = calculateSLAStatus(80, true); // isCompleted = true
      expect(status).toBe('on_track');
    });

    it('devrait retourner "breached" si terminé après 100%', () => {
      const status = calculateSLAStatus(120, true); // isCompleted = true
      expect(status).toBe('breached');
    });
  });

  // ==========================================================================
  // TESTS - formatRemainingTime
  // ==========================================================================

  describe('formatRemainingTime', () => {
    it('devrait retourner "Dépassé" si temps négatif', () => {
      expect(formatRemainingTime(-10)).toBe('Dépassé');
    });

    it('devrait retourner "Dépassé" si temps = 0', () => {
      expect(formatRemainingTime(0)).toBe('Dépassé');
    });

    it('devrait formater les minutes seulement (<1h)', () => {
      expect(formatRemainingTime(30)).toBe('30min');
      expect(formatRemainingTime(45)).toBe('45min');
      expect(formatRemainingTime(59)).toBe('59min');
    });

    it('devrait formater les heures exactes', () => {
      expect(formatRemainingTime(60)).toBe('1h');
      expect(formatRemainingTime(120)).toBe('2h');
      expect(formatRemainingTime(180)).toBe('3h');
    });

    it('devrait formater heures + minutes', () => {
      expect(formatRemainingTime(90)).toBe('1h 30min');
      expect(formatRemainingTime(135)).toBe('2h 15min');
      expect(formatRemainingTime(245)).toBe('4h 5min');
    });

    it('devrait formater 1 jour exact', () => {
      expect(formatRemainingTime(24 * 60)).toBe('1j');
    });

    it('devrait formater 1 jour + heures', () => {
      expect(formatRemainingTime(24 * 60 + 120)).toBe('1j 2h'); // 1 jour 2 heures
      expect(formatRemainingTime(24 * 60 + 60)).toBe('1j 1h'); // 1 jour 1 heure
    });

    it('devrait formater plusieurs jours exacts', () => {
      expect(formatRemainingTime(2 * 24 * 60)).toBe('2j');
      expect(formatRemainingTime(3 * 24 * 60)).toBe('3j');
      expect(formatRemainingTime(7 * 24 * 60)).toBe('7j');
    });

    it('devrait formater plusieurs jours + heures', () => {
      expect(formatRemainingTime(2 * 24 * 60 + 180)).toBe('2j 3h'); // 2 jours 3 heures
      expect(formatRemainingTime(5 * 24 * 60 + 240)).toBe('5j 4h'); // 5 jours 4 heures
    });

    it('ne devrait pas afficher les minutes si >= 1 jour', () => {
      const timeInMinutes = 24 * 60 + 125; // 1 jour + 2h 5min
      const result = formatRemainingTime(timeInMinutes);
      expect(result).toBe('1j 2h'); // Minutes ignorées
      expect(result).not.toContain('min');
    });
  });

  // ==========================================================================
  // TESTS - getSLABadgeColor
  // ==========================================================================

  describe('getSLABadgeColor', () => {
    it('devrait retourner classes vertes pour "on_track"', () => {
      const color = getSLABadgeColor('on_track');
      expect(color).toContain('green');
      expect(color).toContain('bg-green-100');
      expect(color).toContain('text-green-800');
    });

    it('devrait retourner classes oranges pour "at_risk"', () => {
      const color = getSLABadgeColor('at_risk');
      expect(color).toContain('orange');
      expect(color).toContain('bg-orange-100');
      expect(color).toContain('text-orange-800');
    });

    it('devrait retourner classes rouges pour "breached"', () => {
      const color = getSLABadgeColor('breached');
      expect(color).toContain('red');
      expect(color).toContain('bg-red-100');
      expect(color).toContain('text-red-800');
    });

    it('devrait inclure classes dark mode', () => {
      const onTrackColor = getSLABadgeColor('on_track');
      expect(onTrackColor).toContain('dark:');

      const atRiskColor = getSLABadgeColor('at_risk');
      expect(atRiskColor).toContain('dark:');

      const breachedColor = getSLABadgeColor('breached');
      expect(breachedColor).toContain('dark:');
    });
  });

  // ==========================================================================
  // TESTS - getSLAStatusLabel
  // ==========================================================================

  describe('getSLAStatusLabel', () => {
    it('devrait retourner "Dans les temps" pour on_track', () => {
      expect(getSLAStatusLabel('on_track')).toBe('Dans les temps');
    });

    it('devrait retourner "À risque" pour at_risk', () => {
      expect(getSLAStatusLabel('at_risk')).toBe('À risque');
    });

    it('devrait retourner "Dépassé" pour breached', () => {
      expect(getSLAStatusLabel('breached')).toBe('Dépassé');
    });
  });
});
