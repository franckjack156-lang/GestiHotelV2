/**
 * Tests pour le module validator
 */

import { describe, it, expect } from 'vitest';
import { detectMissingValues } from '../validator';
import type { InterventionImportRow, ExistingLists, UserInfo, ReferenceItem } from '../types';

describe('validator', () => {
  describe('detectMissingValues', () => {
    // ========================================================================
    // SETUP - Données de test
    // ========================================================================
    const mockUsers: UserInfo[] = [
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

    const mockReferenceList: ReferenceItem[] = [
      { value: 'plomberie', label: 'Plomberie', isActive: true },
      { value: 'electricite', label: 'Électricité', isActive: true },
      { value: 'chauffage', label: 'Chauffage', isActive: true },
    ];

    const baseExistingLists: ExistingLists = {
      types: ['plomberie', 'electricite'],
      categories: ['urgent', 'normal'],
      priorities: ['haute', 'moyenne', 'basse'],
      locations: ['hall', 'chambre'],
      statuses: ['draft', 'pending', 'in_progress', 'completed'],
      rooms: ['101', '102', '201'],
      floors: ['1', '2', '3'],
      buildings: ['tour_sud', 'tour_nord'],
      users: mockUsers,
      typesList: mockReferenceList,
    };

    // ========================================================================
    // TESTS - Détection des valeurs manquantes
    // ========================================================================

    it('devrait détecter les types manquants', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: 'menuiserie', // N'existe pas
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.types.has('menuiserie')).toBe(true);
      expect(result.missing.types.size).toBe(1);
    });

    it('devrait détecter les catégories manquantes', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: 'prioritaire', // N'existe pas
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.categories.has('prioritaire')).toBe(true);
      expect(result.missing.categories.size).toBe(1);
    });

    it('devrait détecter les priorités manquantes', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '',
          priorite: 'critique', // N'existe pas
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.priorities.has('critique')).toBe(true);
      expect(result.missing.priorities.size).toBe(1);
    });

    it('devrait détecter les localisations manquantes', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '',
          priorite: '',
          localisation: 'salle_de_bain', // N'existe pas
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.locations.has('salle_de_bain')).toBe(true);
      expect(result.missing.locations.size).toBe(1);
    });

    it('devrait normaliser et détecter les statuts manquants', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'En attente validation', // N'existe pas
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.statuses.has('En attente validation')).toBe(true);
    });

    it('devrait ignorer les statuts normalisés existants', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'En cours', // Normalise vers 'in_progress' qui existe
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.statuses.size).toBe(0);
    });

    it('devrait détecter les chambres manquantes', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '305', // N'existe pas
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.rooms.has('305')).toBe(true);
    });

    it('devrait détecter les étages manquants', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '5', // N'existe pas
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.floors.has('5')).toBe(true);
    });

    it('devrait détecter les bâtiments manquants', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: 'batiment_c', // N'existe pas
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.buildings.has('batiment_c')).toBe(true);
    });

    it('devrait ignorer les valeurs vides et whitespace', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '   ',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.types.size).toBe(0);
      expect(result.missing.categories.size).toBe(0);
    });

    it('devrait détecter plusieurs valeurs manquantes sur plusieurs lignes', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: 'menuiserie',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
        {
          titre: 'Test 2',
          statut: 'draft',
          type: 'peinture',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
        {
          titre: 'Test 3',
          statut: 'draft',
          type: 'menuiserie', // Dupliqué
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.types.size).toBe(2); // menuiserie et peinture (pas de doublons)
      expect(result.missing.types.has('menuiserie')).toBe(true);
      expect(result.missing.types.has('peinture')).toBe(true);
    });

    // ========================================================================
    // TESTS - Détection des techniciens manquants
    // ========================================================================

    it('devrait détecter un technicien manquant', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: 'Paul Dubois', // N'existe pas
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.technicians.has('Paul Dubois')).toBe(true);
    });

    it('devrait trouver un technicien existant (insensible à la casse)', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: 'MICHEL DUPONT', // Existe en minuscules
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.technicians.size).toBe(0);
    });

    it('devrait détecter un créateur manquant', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: 'Sophie Leclerc', // N'existe pas
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.creators.has('Sophie Leclerc')).toBe(true);
    });

    it('devrait trouver un créateur existant', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: 'jean durand', // Existe
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.creators.size).toBe(0);
    });

    // ========================================================================
    // TESTS - Génération de suggestions pour techniciens
    // ========================================================================

    it('devrait générer des suggestions pour techniciens avec correspondance partielle', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: 'Michel', // Partiel
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      const suggestions = result.suggestions.technicians.get('Michel');
      expect(suggestions).toBeDefined();
      expect(suggestions!.length).toBeGreaterThan(0);
      expect(suggestions![0].userId).toBe('1'); // Michel Dupont
      expect(suggestions![0].matchScore).toBeGreaterThanOrEqual(0.7);
    });

    it('ne devrait pas générer de suggestions si correspondance exacte', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: 'Michel Dupont', // Exact
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      const suggestions = result.suggestions.technicians.get('Michel Dupont');
      expect(suggestions).toBeUndefined(); // Pas de suggestions si match exact
      expect(result.missing.technicians.size).toBe(0);
    });

    it('devrait filtrer les non-techniciens pour les suggestions de techniciens', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: 'Jean', // Jean Durand n'est pas technicien
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      const suggestions = result.suggestions.technicians.get('Jean');
      // Ne devrait pas suggérer Jean Durand car il n'est pas technicien
      if (suggestions) {
        suggestions.forEach(s => {
          expect(s.userId).not.toBe('3');
        });
      }
    });

    it('devrait inclure les non-techniciens pour les suggestions de créateurs', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: 'Jean', // Partiel
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      const suggestions = result.suggestions.creators.get('Jean');
      expect(suggestions).toBeDefined();
      expect(suggestions!.some(s => s.userId === '3')).toBe(true); // Jean Durand peut être créateur
    });

    // ========================================================================
    // TESTS - Génération de suggestions pour listes de référence
    // ========================================================================

    it('devrait générer des suggestions pour valeurs de référence similaires', () => {
      const existingListsWithRefs: ExistingLists = {
        ...baseExistingLists,
        typesList: [
          { value: 'plomberie', label: 'Plomberie', isActive: true },
          { value: 'electricite', label: 'Électricité', isActive: true },
        ],
      };

      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: 'Plomb', // Similaire à "Plomberie"
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, existingListsWithRefs);

      const suggestions = result.suggestions.types.get('Plomb');
      expect(suggestions).toBeDefined();
      expect(suggestions!.length).toBeGreaterThan(0);
      expect(suggestions![0].referenceValue).toBe('plomberie');
    });

    it('ne devrait pas générer de suggestions si valeur exacte existe', () => {
      const existingListsWithRefs: ExistingLists = {
        ...baseExistingLists,
        typesList: [
          { value: 'plomberie', label: 'Plomberie', isActive: true },
          { value: 'electricite', label: 'Électricité', isActive: true },
        ],
      };

      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: 'plomberie', // Exact
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, existingListsWithRefs);

      const suggestions = result.suggestions.types.get('plomberie');
      expect(suggestions).toBeUndefined(); // Pas de suggestions si match exact
    });

    // ========================================================================
    // TESTS - Cas limites
    // ========================================================================

    it('devrait gérer des données vides', () => {
      const result = detectMissingValues([], baseExistingLists);

      expect(result.missing.types.size).toBe(0);
      expect(result.missing.categories.size).toBe(0);
      expect(result.suggestions.technicians.size).toBe(0);
    });

    it('devrait gérer des listes existantes vides', () => {
      const emptyLists: ExistingLists = {
        types: [],
        categories: [],
        priorities: [],
        locations: [],
        statuses: [],
      };

      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: 'plomberie',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, emptyLists);

      // Tout devrait être manquant
      expect(result.missing.types.has('plomberie')).toBe(true);
      expect(result.missing.statuses.has('draft')).toBe(true);
    });

    it('devrait trim les valeurs avant vérification', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          type: '  plomberie  ', // Existe dans la liste
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          description: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = detectMissingValues(data, baseExistingLists);

      expect(result.missing.types.size).toBe(0);
    });
  });
});
