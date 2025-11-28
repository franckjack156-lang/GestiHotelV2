/**
 * Tests pour referenceListsService
 *
 * Service critique gérant les listes de référence de l'établissement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateItem,
  getSuggestions,
  getAllLists,
  getList,
  getActiveItems,
} from '../referenceListsService';
import type { ReferenceItem, ListKey } from '@/shared/types/reference-lists.types';

// ============================================================================
// MOCKS FIRESTORE
// ============================================================================

// Mock Firestore
vi.mock('@/core/config/firebase', () => ({
  db: {},
  auth: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    set: vi.fn(),
    commit: vi.fn(),
  })),
  serverTimestamp: vi.fn(() => new Date()),
  increment: vi.fn((n: number) => n),
}));

vi.mock('@/shared/utils/firestore', () => ({
  removeUndefinedFields: vi.fn((obj: any) => obj),
}));

// ============================================================================
// TESTS - validateItem
// ============================================================================

describe('referenceListsService', () => {
  describe('validateItem', () => {
    // ========================================================================
    // TESTS - Validation de la valeur (value)
    // ========================================================================

    it('devrait accepter une valeur valide', () => {
      const item: Partial<ReferenceItem> = {
        value: 'plomberie',
        label: 'Plomberie',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait accepter valeur avec underscores et chiffres', () => {
      const item: Partial<ReferenceItem> = {
        value: 'type_123_urgent',
        label: 'Type Urgent',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(true);
    });

    it('devrait rejeter une valeur vide', () => {
      const item: Partial<ReferenceItem> = {
        value: '',
        label: 'Test',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La valeur est obligatoire');
    });

    it('devrait rejeter une valeur absente', () => {
      const item: Partial<ReferenceItem> = {
        label: 'Test',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La valeur est obligatoire');
    });

    it('devrait rejeter une valeur avec majuscules', () => {
      const item: Partial<ReferenceItem> = {
        value: 'Plomberie',
        label: 'Plomberie',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('minuscules');
    });

    it('devrait rejeter une valeur avec espaces', () => {
      const item: Partial<ReferenceItem> = {
        value: 'plom berie',
        label: 'Plomberie',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('minuscules');
    });

    it('devrait rejeter une valeur avec caractères spéciaux', () => {
      const item: Partial<ReferenceItem> = {
        value: 'plomberie-01',
        label: 'Plomberie',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('minuscules');
    });

    it('devrait rejeter une valeur trop courte (<2 caractères) par défaut', () => {
      const item: Partial<ReferenceItem> = {
        value: 'a',
        label: 'A',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La valeur doit contenir au moins 2 caractères');
    });

    it('devrait accepter une valeur de 1 caractère pour floors', () => {
      const item: Partial<ReferenceItem> = {
        value: '0',
        label: 'RDC',
      };

      const result = validateItem(item, 'floors');

      expect(result.isValid).toBe(true);
    });

    it('devrait accepter une valeur de 1 caractère pour buildings', () => {
      const item: Partial<ReferenceItem> = {
        value: 'a',
        label: 'Bâtiment A',
      };

      const result = validateItem(item, 'buildings');

      expect(result.isValid).toBe(true);
    });

    it('devrait accepter une valeur négative pour floors (sous-sols)', () => {
      const item: Partial<ReferenceItem> = {
        value: '-1',
        label: 'Sous-sol 1',
      };

      const result = validateItem(item, 'floors');

      expect(result.isValid).toBe(true);
    });

    it('devrait rejeter une valeur trop longue (>50 caractères)', () => {
      const item: Partial<ReferenceItem> = {
        value: 'a'.repeat(51),
        label: 'Test',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La valeur doit contenir au maximum 50 caractères');
    });

    it('devrait rejeter les valeurs réservées', () => {
      const reservedValues = ['id', 'name', 'type', 'value', 'label'];

      reservedValues.forEach(reserved => {
        const item: Partial<ReferenceItem> = {
          value: reserved,
          label: 'Test',
        };

        const result = validateItem(item);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Cette valeur est réservée');
      });
    });

    // ========================================================================
    // TESTS - Validation du label
    // ========================================================================

    it('devrait rejeter un label vide', () => {
      const item: Partial<ReferenceItem> = {
        value: 'test',
        label: '',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le label est requis');
    });

    it('devrait rejeter un label absent', () => {
      const item: Partial<ReferenceItem> = {
        value: 'test',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le label est requis');
    });

    it('devrait rejeter un label trop court (<2 caractères)', () => {
      const item: Partial<ReferenceItem> = {
        value: 'test',
        label: 'A',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le label doit contenir au moins 2 caractères');
    });

    it('devrait rejeter un label trop long (>100 caractères)', () => {
      const item: Partial<ReferenceItem> = {
        value: 'test',
        label: 'A'.repeat(101),
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le label doit contenir au maximum 100 caractères');
    });

    it('devrait accepter un label de 100 caractères exactement', () => {
      const item: Partial<ReferenceItem> = {
        value: 'test',
        label: 'A'.repeat(100),
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(true);
    });

    // ========================================================================
    // TESTS - Validation de la couleur
    // ========================================================================

    it('devrait accepter les couleurs autorisées', () => {
      const allowedColors = [
        'gray',
        'red',
        'orange',
        'yellow',
        'green',
        'blue',
        'indigo',
        'purple',
        'pink',
      ];

      allowedColors.forEach(color => {
        const item: Partial<ReferenceItem> = {
          value: 'test',
          label: 'Test',
          color,
        };

        const result = validateItem(item);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('devrait rejeter une couleur non autorisée', () => {
      const item: Partial<ReferenceItem> = {
        value: 'test',
        label: 'Test',
        color: 'black',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Couleur invalide');
    });

    it('devrait accepter un item sans couleur', () => {
      const item: Partial<ReferenceItem> = {
        value: 'test',
        label: 'Test',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(true);
    });

    // ========================================================================
    // TESTS - Validation description
    // ========================================================================

    it('devrait accepter une description courte', () => {
      const item: Partial<ReferenceItem> = {
        value: 'test',
        label: 'Test',
        description: 'Une description normale',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('devrait warning si description trop longue (>500 caractères)', () => {
      const item: Partial<ReferenceItem> = {
        value: 'test',
        label: 'Test',
        description: 'A'.repeat(501),
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('La description est très longue (max 500 caractères)');
    });

    // ========================================================================
    // TESTS - Validation icône
    // ========================================================================

    it('devrait warning si icône inexistante dans Lucide', () => {
      const item: Partial<ReferenceItem> = {
        value: 'test',
        label: 'Test',
        icon: 'IconeInexistante',
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(true);
      expect(result.warnings[0]).toContain("n'existe pas dans Lucide");
    });

    it('devrait accepter une icône Lucide valide', () => {
      const item: Partial<ReferenceItem> = {
        value: 'test',
        label: 'Test',
        icon: 'AlertCircle', // Icône Lucide valide
      };

      const result = validateItem(item);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  // ==========================================================================
  // TESTS - getSuggestions
  // ==========================================================================

  describe('getSuggestions', () => {
    it('devrait suggérer une valeur technique depuis le label', () => {
      const item: Partial<ReferenceItem> = {
        label: 'Plomberie Urgente',
      };

      const suggestions = getSuggestions(item);

      const valueSuggestion = suggestions.find(s => s.type === 'value');
      expect(valueSuggestion).toBeDefined();
      expect(valueSuggestion?.suggestion).toBe('plomberie_urgente');
      expect(valueSuggestion?.confidence).toBe(0.9);
    });

    it('devrait retirer les accents dans la valeur suggérée', () => {
      const item: Partial<ReferenceItem> = {
        label: 'Électricité Générale',
      };

      const suggestions = getSuggestions(item);

      const valueSuggestion = suggestions.find(s => s.type === 'value');
      expect(valueSuggestion?.suggestion).toBe('electricite_generale');
    });

    it('devrait suggérer une icône pour "plomberie"', () => {
      const item: Partial<ReferenceItem> = {
        label: 'Plomberie',
      };

      const suggestions = getSuggestions(item);

      const iconSuggestion = suggestions.find(s => s.type === 'icon');
      expect(iconSuggestion).toBeDefined();
      expect(iconSuggestion?.suggestion).toBe('Droplet');
      expect(iconSuggestion?.confidence).toBe(0.8);
    });

    it('devrait suggérer une icône pour "électricité"', () => {
      const item: Partial<ReferenceItem> = {
        label: 'Électricité',
      };

      const suggestions = getSuggestions(item);

      const iconSuggestion = suggestions.find(s => s.type === 'icon');
      expect(iconSuggestion?.suggestion).toBe('Zap');
    });

    it('devrait suggérer une icône pour "urgent"', () => {
      const item: Partial<ReferenceItem> = {
        label: 'Priorité Urgente',
      };

      const suggestions = getSuggestions(item);

      const iconSuggestion = suggestions.find(s => s.type === 'icon');
      expect(iconSuggestion?.suggestion).toBe('AlertCircle');
    });

    it('devrait suggérer une couleur pour "urgent"', () => {
      const item: Partial<ReferenceItem> = {
        label: 'Urgent',
      };

      const suggestions = getSuggestions(item);

      const colorSuggestion = suggestions.find(s => s.type === 'color');
      expect(colorSuggestion).toBeDefined();
      expect(colorSuggestion?.suggestion).toBe('red');
      expect(colorSuggestion?.confidence).toBe(0.7);
    });

    it('devrait suggérer une couleur pour "haute priorité"', () => {
      const item: Partial<ReferenceItem> = {
        label: 'Haute priorité',
      };

      const suggestions = getSuggestions(item);

      const colorSuggestion = suggestions.find(s => s.type === 'color');
      expect(colorSuggestion?.suggestion).toBe('orange');
    });

    it('devrait suggérer une couleur pour "plomberie"', () => {
      const item: Partial<ReferenceItem> = {
        label: 'Plomberie',
      };

      const suggestions = getSuggestions(item);

      const colorSuggestion = suggestions.find(s => s.type === 'color');
      expect(colorSuggestion?.suggestion).toBe('blue');
    });

    it('ne devrait pas suggérer value si déjà défini', () => {
      const item: Partial<ReferenceItem> = {
        label: 'Plomberie',
        value: 'plomb',
      };

      const suggestions = getSuggestions(item);

      const valueSuggestion = suggestions.find(s => s.type === 'value');
      expect(valueSuggestion).toBeUndefined();
    });

    it('ne devrait pas suggérer icon si déjà défini', () => {
      const item: Partial<ReferenceItem> = {
        label: 'Plomberie',
        icon: 'Wrench',
      };

      const suggestions = getSuggestions(item);

      const iconSuggestion = suggestions.find(s => s.type === 'icon');
      expect(iconSuggestion).toBeUndefined();
    });

    it('ne devrait pas suggérer color si déjà défini', () => {
      const item: Partial<ReferenceItem> = {
        label: 'Urgent',
        color: 'blue',
      };

      const suggestions = getSuggestions(item);

      const colorSuggestion = suggestions.find(s => s.type === 'color');
      expect(colorSuggestion).toBeUndefined();
    });

    it('devrait retourner tableau vide si aucune suggestion', () => {
      const item: Partial<ReferenceItem> = {
        label: 'Test XYZ ABC',
        value: 'test',
        icon: 'Circle',
        color: 'gray',
      };

      const suggestions = getSuggestions(item);

      expect(suggestions).toHaveLength(0);
    });
  });

  // ==========================================================================
  // TESTS - CRUD Functions (Mocked)
  // ==========================================================================

  describe('CRUD operations (mocked)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('getAllLists devrait retourner null si document inexistant', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await getAllLists('test-establishment');

      expect(result).toBeNull();
    });

    it('getList devrait retourner null si liste inexistante', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          lists: {
            types: { name: 'Types', items: [] },
          },
        }),
      } as any);

      const result = await getList('test-establishment', 'categories' as ListKey);

      expect(result).toBeNull();
    });

    it('getActiveItems devrait filtrer les items inactifs', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          lists: {
            types: {
              name: 'Types',
              items: [
                {
                  id: '1',
                  value: 'plomb',
                  label: 'Plomberie',
                  order: 0,
                  isActive: true,
                  usageCount: 0,
                },
                {
                  id: '2',
                  value: 'elec',
                  label: 'Électricité',
                  order: 1,
                  isActive: false,
                  usageCount: 0,
                },
                {
                  id: '3',
                  value: 'chauf',
                  label: 'Chauffage',
                  order: 2,
                  isActive: true,
                  usageCount: 0,
                },
              ],
            },
          },
          lastModified: new Date(),
        }),
      } as any);

      const result = await getActiveItems('test-establishment', 'types' as ListKey);

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe('plomb');
      expect(result[1].value).toBe('chauf');
    });

    it('getActiveItems devrait trier par ordre', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          lists: {
            types: {
              name: 'Types',
              items: [
                { id: '1', value: 'z', label: 'Z', order: 2, isActive: true, usageCount: 0 },
                { id: '2', value: 'a', label: 'A', order: 0, isActive: true, usageCount: 0 },
                { id: '3', value: 'm', label: 'M', order: 1, isActive: true, usageCount: 0 },
              ],
            },
          },
          lastModified: new Date(),
        }),
      } as any);

      const result = await getActiveItems('test-establishment', 'types' as ListKey);

      expect(result[0].value).toBe('a'); // order: 0
      expect(result[1].value).toBe('m'); // order: 1
      expect(result[2].value).toBe('z'); // order: 2
    });
  });
});
