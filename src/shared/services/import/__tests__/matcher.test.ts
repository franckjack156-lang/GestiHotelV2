/**
 * Tests pour le module matcher
 */

import { describe, it, expect } from 'vitest';
import { existsInList, findUserMatches, findReferenceMatches } from '../matcher';
import type { UserInfo, ReferenceItem } from '../types';

describe('matcher', () => {
  describe('existsInList', () => {
    const list = ['draft', 'pending', 'in_progress', 'completed'];

    it('devrait trouver une valeur exacte', () => {
      expect(existsInList('draft', list)).toBe(true);
      expect(existsInList('pending', list)).toBe(true);
    });

    it('devrait être insensible à la casse', () => {
      expect(existsInList('DRAFT', list)).toBe(true);
      expect(existsInList('Draft', list)).toBe(true);
      expect(existsInList('PeNdInG', list)).toBe(true);
    });

    it('devrait ignorer les espaces', () => {
      expect(existsInList('  draft  ', list)).toBe(true);
      expect(existsInList(' pending ', list)).toBe(true);
    });

    it('devrait retourner false si valeur absente', () => {
      expect(existsInList('unknown', list)).toBe(false);
      expect(existsInList('invalid', list)).toBe(false);
    });

    it('devrait gérer les listes vides', () => {
      expect(existsInList('draft', [])).toBe(false);
    });
  });

  describe('findUserMatches', () => {
    const users: UserInfo[] = [
      {
        id: '1',
        displayName: 'Michel Dupont',
        firstName: 'Michel',
        lastName: 'Dupont',
        isTechnician: true,
      },
      {
        id: '2',
        displayName: 'Marie Martin',
        firstName: 'Marie',
        lastName: 'Martin',
        isTechnician: true,
      },
      {
        id: '3',
        displayName: 'Jean Durand',
        firstName: 'Jean',
        lastName: 'Durand',
        isTechnician: false,
      },
    ];

    it('devrait trouver une correspondance exacte (100%)', () => {
      const matches = findUserMatches('Michel Dupont', users);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchScore).toBe(1.0);
      expect(matches[0].matchType).toBe('exact');
      expect(matches[0].userId).toBe('1');
    });

    it('devrait trouver par prénom exact (90%)', () => {
      const matches = findUserMatches('Michel', users);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchScore).toBe(0.9);
      expect(matches[0].matchType).toBe('partial');
    });

    it('devrait trouver par nom exact (90%)', () => {
      const matches = findUserMatches('Dupont', users);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchScore).toBe(0.9);
      expect(matches[0].matchType).toBe('partial');
    });

    it('devrait filtrer les techniciens si demandé', () => {
      const matches = findUserMatches('Jean', users, true);
      // Jean n'est pas technicien, ne devrait pas être trouvé
      expect(matches.length).toBe(0);
    });

    it('devrait inclure les non-techniciens si filterTechnician=false', () => {
      const matches = findUserMatches('Jean', users, false);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].userId).toBe('3');
    });

    it('devrait être insensible à la casse', () => {
      const matches = findUserMatches('MICHEL DUPONT', users);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchScore).toBe(1.0);
    });

    it('devrait ne retourner que des scores >= 70%', () => {
      const matches = findUserMatches('M', users);
      // "M" seul ne devrait pas donner de bon match
      matches.forEach(match => {
        expect(match.matchScore).toBeGreaterThanOrEqual(0.7);
      });
    });

    it('devrait trier par score décroissant', () => {
      const matches = findUserMatches('Michel', users);
      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].matchScore).toBeGreaterThanOrEqual(matches[i + 1].matchScore);
      }
    });

    it('devrait gérer les noms partiels', () => {
      const matches = findUserMatches('Mich', users);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchScore).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('findReferenceMatches', () => {
    const referenceList: ReferenceItem[] = [
      { value: 'tour_sud', label: 'Tour Sud', isActive: true },
      { value: 'tour_nord', label: 'Tour Nord', isActive: true },
      { value: 'batiment_a', label: 'Bâtiment A', isActive: true },
      { value: 'ancien', label: 'Ancien Bâtiment', isActive: false },
    ];

    it('devrait trouver par value exact (100%)', () => {
      const matches = findReferenceMatches('tour_sud', referenceList);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchScore).toBe(1.0);
      expect(matches[0].matchType).toBe('exact');
      expect(matches[0].referenceValue).toBe('tour_sud');
    });

    it('devrait trouver par label exact (100%)', () => {
      const matches = findReferenceMatches('Tour Sud', referenceList);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchScore).toBe(1.0);
      expect(matches[0].matchType).toBe('exact');
    });

    it('devrait ignorer les items inactifs', () => {
      // Recherche avec le value exact d'un item inactif
      const matches = findReferenceMatches('ancien', referenceList);
      // Ne devrait pas trouver l'item inactif, même si le value correspond
      expect(matches.every(m => m.referenceValue !== 'ancien')).toBe(true);
    });

    it('devrait trouver par correspondance partielle', () => {
      const matches = findReferenceMatches('Sud', referenceList);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchScore).toBeGreaterThanOrEqual(0.75);
    });

    it('devrait être insensible à la casse', () => {
      const matches = findReferenceMatches('TOUR SUD', referenceList);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchScore).toBe(1.0);
    });

    it('devrait trier par score décroissant', () => {
      const matches = findReferenceMatches('tour', referenceList);
      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].matchScore).toBeGreaterThanOrEqual(matches[i + 1].matchScore);
      }
    });

    it('devrait ne retourner que des scores >= 70%', () => {
      const matches = findReferenceMatches('bat', referenceList);
      matches.forEach(match => {
        expect(match.matchScore).toBeGreaterThanOrEqual(0.7);
      });
    });

    it('devrait gérer les listes vides', () => {
      const matches = findReferenceMatches('test', []);
      expect(matches.length).toBe(0);
    });
  });
});
