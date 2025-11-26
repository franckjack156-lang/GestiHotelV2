/**
 * Tests pour le module converter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { convertToInterventions, convertToRooms } from '../converter';
import type { InterventionImportRow, RoomImportRow, UserInfo, ReferenceMappings } from '../types';

describe('converter', () => {
  describe('convertToInterventions', () => {
    // ========================================================================
    // SETUP - Données de test
    // ========================================================================
    const establishmentId = 'est_123';
    const currentUserId = 'user_admin';
    const currentUserName = 'Admin User';

    const mockUsers: UserInfo[] = [
      {
        id: 'user_1',
        displayName: 'Michel Dupont',
        firstName: 'Michel',
        lastName: 'Dupont',
        isTechnician: true,
      },
      {
        id: 'user_2',
        displayName: 'Marie Martin',
        firstName: 'Marie',
        lastName: 'Martin',
        isTechnician: true,
      },
    ];

    let dateNowSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Fixer la date pour les tests
      const fixedDate = new Date('2025-01-15T10:00:00.000Z');
      dateNowSpy = vi.spyOn(global.Date, 'now').mockReturnValue(fixedDate.getTime());
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    // ========================================================================
    // TESTS - Champs de base
    // ========================================================================

    it('devrait convertir les champs obligatoires de base', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Fuite d\'eau',
          statut: 'draft',
          description: 'Fuite importante',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName
      );

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Fuite d\'eau');
      expect(result[0].description).toBe('Fuite importante');
      expect(result[0].status).toBe('draft');
      expect(result[0].establishmentId).toBe(establishmentId);
    });

    it('devrait normaliser le statut', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'En cours', // Devrait être normalisé vers 'in_progress'
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName
      );

      expect(result[0].status).toBe('in_progress');
    });

    it('devrait utiliser "nouveau" comme statut par défaut si vide', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: '',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName
      );

      expect(result[0].status).toBe('draft'); // "nouveau" normalisé vers "draft"
    });

    // ========================================================================
    // TESTS - Priorité et flags
    // ========================================================================

    it('devrait marquer comme urgent si priorité = urgent', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          priorite: 'urgent',
          description: '',
          type: '',
          categorie: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName
      );

      expect(result[0].isUrgent).toBe(true);
      expect(result[0].priority).toBe('urgent');
    });

    it('devrait marquer comme urgent si priorité = critical', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          priorite: 'CRITICAL',
          description: '',
          type: '',
          categorie: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName
      );

      expect(result[0].isUrgent).toBe(true);
    });

    it('devrait utiliser "normal" comme priorité par défaut', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          priorite: '',
          description: '',
          type: '',
          categorie: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName
      );

      expect(result[0].priority).toBe('normal');
      expect(result[0].isUrgent).toBe(false);
    });

    // ========================================================================
    // TESTS - Parsing de nombres
    // ========================================================================

    it('devrait parser l\'étage en nombre', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          etage: '3',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          batiment: '',
          technicien: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName
      );

      expect(result[0].floor).toBe(3);
      expect(typeof result[0].floor).toBe('number');
    });

    it('devrait ignorer un étage invalide', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          etage: 'ABC',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          batiment: '',
          technicien: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName
      );

      expect(result[0].floor).toBeUndefined();
    });

    it('devrait parser la durée estimée en minutes', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          dureeestimee: '120',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName
      );

      expect(result[0].estimatedDuration).toBe(120);
    });

    it('devrait ignorer une durée négative ou zéro', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test 1',
          statut: 'draft',
          dureeestimee: '0',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          tags: '',
          referenceexterne: '',
        },
      ];

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName
      );

      expect(result[0].estimatedDuration).toBeUndefined();
    });

    // ========================================================================
    // TESTS - Tags
    // ========================================================================

    it('devrait parser les tags séparés par virgules', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          tags: 'urgent, weekend, externe',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          referenceexterne: '',
        },
      ];

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName
      );

      expect(result[0].tags).toHaveLength(3);
      expect(result[0].tags![0].label).toBe('urgent');
      expect(result[0].tags![1].label).toBe('weekend');
      expect(result[0].tags![2].label).toBe('externe');
    });

    it('devrait ignorer les tags vides', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          tags: 'urgent, , weekend',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
          createur: '',
          datecreation: '',
          dateplanifiee: '',
          heureplanifiee: '',
          dureeestimee: '',
          notesinternes: '',
          notesresolution: '',
          datelimite: '',
          referenceexterne: '',
        },
      ];

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName
      );

      expect(result[0].tags).toHaveLength(2);
    });

    // ========================================================================
    // TESTS - Matching utilisateurs (créateur)
    // ========================================================================

    it('devrait utiliser l\'utilisateur courant si aucun créateur spécifié', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          createur: '',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName,
        mockUsers
      );

      expect(result[0].createdBy).toBe(currentUserId);
      expect(result[0].createdByName).toBe(currentUserName);
    });

    it('devrait matcher le créateur par nom exact', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          createur: 'Michel Dupont',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName,
        mockUsers
      );

      expect(result[0].createdBy).toBe('user_1');
      expect(result[0].createdByName).toBe('Michel Dupont');
    });

    it('devrait matcher le créateur (insensible à la casse)', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          createur: 'MICHEL DUPONT',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName,
        mockUsers
      );

      expect(result[0].createdBy).toBe('user_1');
    });

    it('devrait utiliser le mapping utilisateur si fourni (créateur)', () => {
      const userMappings = new Map<string, string>([['Jean Nouveau', 'user_2']]);

      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          createur: 'Jean Nouveau', // Mappé vers user_2 (Marie Martin)
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName,
        mockUsers,
        userMappings
      );

      expect(result[0].createdBy).toBe('user_2');
      expect(result[0].createdByName).toBe('Marie Martin');
    });

    it('devrait conserver le nom Excel si créateur non trouvé', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          createur: 'Utilisateur Inconnu',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          technicien: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName,
        mockUsers
      );

      expect(result[0].createdBy).toBe(currentUserId);
      expect(result[0].createdByName).toBe('Utilisateur Inconnu');
    });

    // ========================================================================
    // TESTS - Matching utilisateurs (technicien)
    // ========================================================================

    it('devrait ne pas assigner de technicien si vide', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          technicien: '',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName,
        mockUsers
      );

      expect(result[0].assignedTo).toBeUndefined();
      expect(result[0].assignedToName).toBeUndefined();
      expect(result[0].assignedAt).toBeUndefined();
    });

    it('devrait assigner le technicien par nom exact', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          technicien: 'Marie Martin',
          datecreation: '15/01/2025',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName,
        mockUsers
      );

      expect(result[0].assignedTo).toBe('user_2');
      expect(result[0].assignedToName).toBe('Marie Martin');
      expect(result[0].assignedAt).toBeInstanceOf(Timestamp);
    });

    it('devrait utiliser le mapping utilisateur si fourni (technicien)', () => {
      const userMappings = new Map<string, string>([['Tech Externe', 'user_1']]);

      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          technicien: 'Tech Externe',
          datecreation: '15/01/2025',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName,
        mockUsers,
        userMappings
      );

      expect(result[0].assignedTo).toBe('user_1');
      expect(result[0].assignedToName).toBe('Michel Dupont');
    });

    it('devrait conserver le nom Excel si technicien non trouvé', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          technicien: 'Technicien Externe',
          description: '',
          type: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          batiment: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName,
        mockUsers
      );

      expect(result[0].assignedTo).toBeUndefined();
      expect(result[0].assignedToName).toBe('Technicien Externe');
      expect(result[0].assignedAt).toBeInstanceOf(Timestamp);
    });

    // ========================================================================
    // TESTS - Mappings de référence
    // ========================================================================

    it('devrait appliquer les mappings de référence', () => {
      const referenceMappings: ReferenceMappings = {
        buildings: new Map([['Ancien Bâtiment', 'batiment_a']]),
        types: new Map([['Plomb', 'plomberie']]),
      };

      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          batiment: 'Ancien Bâtiment',
          type: 'Plomb',
          description: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          technicien: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName,
        mockUsers,
        undefined,
        referenceMappings
      );

      expect(result[0].building).toBe('batiment_a');
      expect(result[0].type).toBe('plomberie');
    });

    it('devrait utiliser la valeur originale si pas de mapping', () => {
      const data: InterventionImportRow[] = [
        {
          titre: 'Test',
          statut: 'draft',
          batiment: 'Tour Sud',
          type: 'electricite',
          description: '',
          categorie: '',
          priorite: '',
          localisation: '',
          numerochambre: '',
          etage: '',
          technicien: '',
          createur: '',
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

      const result = convertToInterventions(
        data,
        establishmentId,
        currentUserId,
        currentUserName
      );

      expect(result[0].building).toBe('Tour Sud');
      expect(result[0].type).toBe('electricite');
    });
  });

  // ==========================================================================
  // TESTS - convertToRooms
  // ==========================================================================

  describe('convertToRooms', () => {
    it('devrait convertir les données de chambre basiques', () => {
      const data: RoomImportRow[] = [
        {
          numero: '101',
          etage: '1',
          type: 'standard',
          capacite: 2,
          description: '',
          batiment: '',
          equipements: '',
        },
      ];

      const result = convertToRooms(data);

      expect(result).toHaveLength(1);
      expect(result[0].number).toBe('101');
      expect(result[0].floor).toBe(1);
      expect(result[0].type).toBe('standard');
      expect(result[0].capacity).toBe(2);
    });

    it('devrait parser les équipements séparés par virgules', () => {
      const data: RoomImportRow[] = [
        {
          numero: '101',
          etage: '1',
          type: 'standard',
          capacite: 2,
          equipements: 'TV, WiFi, Climatisation',
          description: '',
          batiment: '',
        },
      ];

      const result = convertToRooms(data);

      expect(result[0].amenities).toHaveLength(3);
      expect(result[0].amenities).toContain('TV');
      expect(result[0].amenities).toContain('WiFi');
      expect(result[0].amenities).toContain('Climatisation');
    });

    it('devrait gérer un étage invalide en retournant 0', () => {
      const data: RoomImportRow[] = [
        {
          numero: '101',
          etage: 'RDC',
          type: 'standard',
          capacite: 2,
          description: '',
          batiment: '',
          equipements: '',
        },
      ];

      const result = convertToRooms(data);

      expect(result[0].floor).toBe(0);
    });

    it('devrait omettre les champs optionnels vides', () => {
      const data: RoomImportRow[] = [
        {
          numero: '101',
          etage: '1',
          type: 'standard',
          capacite: 2,
          description: '',
          batiment: '',
          equipements: '',
        },
      ];

      const result = convertToRooms(data);

      expect(result[0].description).toBeUndefined();
      expect(result[0].building).toBeUndefined();
      expect(result[0].amenities).toBeUndefined();
    });
  });
});
