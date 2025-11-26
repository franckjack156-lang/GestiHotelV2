/**
 * Tests pour firestore utils
 */

import { describe, it, expect } from 'vitest';
import { removeUndefinedFields } from '../firestore';

describe('firestore utils', () => {
  // ==========================================================================
  // TESTS - removeUndefinedFields
  // ==========================================================================

  describe('removeUndefinedFields', () => {
    it('devrait retourner l\'objet inchangé si pas d\'undefined', () => {
      const obj = {
        name: 'Test',
        age: 25,
        active: true,
      };

      const result = removeUndefinedFields(obj);

      expect(result).toEqual(obj);
      expect(result.name).toBe('Test');
      expect(result.age).toBe(25);
      expect(result.active).toBe(true);
    });

    it('devrait supprimer les champs undefined', () => {
      const obj = {
        name: 'Test',
        age: undefined,
        active: true,
        description: undefined,
      };

      const result = removeUndefinedFields(obj);

      expect(result).toEqual({
        name: 'Test',
        active: true,
      });
      expect('age' in result).toBe(false);
      expect('description' in result).toBe(false);
    });

    it('devrait conserver les valeurs null', () => {
      const obj = {
        name: 'Test',
        age: null,
        active: true,
      };

      const result = removeUndefinedFields(obj);

      expect(result).toEqual({
        name: 'Test',
        age: null,
        active: true,
      });
      expect(result.age).toBeNull();
    });

    it('devrait conserver les valeurs 0', () => {
      const obj = {
        name: 'Test',
        count: 0,
        active: true,
      };

      const result = removeUndefinedFields(obj);

      expect(result.count).toBe(0);
    });

    it('devrait conserver les chaînes vides', () => {
      const obj = {
        name: '',
        active: true,
      };

      const result = removeUndefinedFields(obj);

      expect(result.name).toBe('');
    });

    it('devrait conserver false', () => {
      const obj = {
        name: 'Test',
        active: false,
      };

      const result = removeUndefinedFields(obj);

      expect(result.active).toBe(false);
    });

    it('devrait nettoyer les objets imbriqués', () => {
      const obj = {
        name: 'Test',
        metadata: {
          created: '2025-01-15',
          updated: undefined,
          tags: {
            color: 'blue',
            priority: undefined,
          },
        },
      };

      const result = removeUndefinedFields(obj);

      expect(result).toEqual({
        name: 'Test',
        metadata: {
          created: '2025-01-15',
          tags: {
            color: 'blue',
          },
        },
      });
      expect('updated' in result.metadata).toBe(false);
      expect('priority' in (result.metadata as any).tags).toBe(false);
    });

    it('devrait nettoyer les tableaux', () => {
      const obj = {
        name: 'Test',
        items: ['a', undefined, 'b', undefined, 'c'],
      };

      const result = removeUndefinedFields(obj);

      expect(result.items).toEqual(['a', 'b', 'c']);
      expect(result.items).toHaveLength(3);
    });

    it('devrait nettoyer les objets dans les tableaux', () => {
      const obj = {
        name: 'Test',
        users: [
          { id: 1, name: 'Alice', age: undefined },
          { id: 2, name: 'Bob', role: undefined },
        ],
      };

      const result = removeUndefinedFields(obj);

      expect(result.users).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
      expect('age' in result.users[0]).toBe(false);
      expect('role' in result.users[1]).toBe(false);
    });

    it('devrait filtrer les undefined dans les tableaux', () => {
      const obj = {
        values: [1, 2, undefined, 3, undefined, 4],
      };

      const result = removeUndefinedFields(obj);

      expect(result.values).toEqual([1, 2, 3, 4]);
    });

    it('devrait gérer les tableaux vides', () => {
      const obj = {
        name: 'Test',
        items: [],
      };

      const result = removeUndefinedFields(obj);

      expect(result.items).toEqual([]);
    });

    it('devrait gérer les objets vides', () => {
      const obj = {};

      const result = removeUndefinedFields(obj);

      expect(result).toEqual({});
    });

    it('devrait retourner null inchangé', () => {
      const result = removeUndefinedFields(null);
      expect(result).toBeNull();
    });

    it('devrait retourner undefined inchangé', () => {
      const result = removeUndefinedFields(undefined);
      expect(result).toBeUndefined();
    });

    it('devrait retourner une string inchangée', () => {
      const result = removeUndefinedFields('test');
      expect(result).toBe('test');
    });

    it('devrait retourner un number inchangé', () => {
      const result = removeUndefinedFields(42);
      expect(result).toBe(42);
    });

    it('devrait retourner un boolean inchangé', () => {
      const result = removeUndefinedFields(true);
      expect(result).toBe(true);
    });

    it('devrait préserver les instances Date', () => {
      const date = new Date('2025-01-15T10:00:00.000Z');
      const obj = {
        name: 'Test',
        createdAt: date,
        updatedAt: undefined,
      };

      const result = removeUndefinedFields(obj);

      expect(result.createdAt).toBe(date);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('devrait gérer les objets complexes profondément imbriqués', () => {
      const obj = {
        level1: {
          name: 'Level 1',
          value: undefined,
          level2: {
            name: 'Level 2',
            extra: undefined,
            level3: {
              name: 'Level 3',
              data: undefined,
              items: [
                { id: 1, value: 'a', meta: undefined },
                { id: 2, value: 'b' },
              ],
            },
          },
        },
      };

      const result = removeUndefinedFields(obj);

      expect(result).toEqual({
        level1: {
          name: 'Level 1',
          level2: {
            name: 'Level 2',
            level3: {
              name: 'Level 3',
              items: [
                { id: 1, value: 'a' },
                { id: 2, value: 'b' },
              ],
            },
          },
        },
      });
    });

    it('devrait gérer un tableau de tableaux', () => {
      const obj = {
        matrix: [
          [1, undefined, 2],
          [3, 4, undefined],
          [undefined, 5, 6],
        ],
      };

      const result = removeUndefinedFields(obj);

      expect(result.matrix).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('devrait gérer les propriétés avec valeurs mixtes', () => {
      const obj = {
        string: 'test',
        number: 42,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined,
        zero: 0,
        emptyString: '',
        falsyBoolean: false,
        array: [1, undefined, 2],
        object: { a: 1, b: undefined },
      };

      const result = removeUndefinedFields(obj);

      expect(result).toEqual({
        string: 'test',
        number: 42,
        boolean: true,
        nullValue: null,
        zero: 0,
        emptyString: '',
        falsyBoolean: false,
        array: [1, 2],
        object: { a: 1 },
      });
    });
  });
});
