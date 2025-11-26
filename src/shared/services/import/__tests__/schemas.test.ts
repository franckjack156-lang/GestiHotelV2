/**
 * Tests pour le module schemas
 */

import { describe, it, expect } from 'vitest';
import { InterventionImportSchema, RoomImportSchema } from '../schemas';
import { ZodError } from 'zod';

describe('schemas', () => {
  describe('InterventionImportSchema', () => {
    // ========================================================================
    // TESTS - Champs obligatoires
    // ========================================================================

    it('devrait valider une intervention avec champs obligatoires minimum', () => {
      const data = {
        titre: 'Fuite d\'eau',
        statut: 'draft',
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titre).toBe('Fuite d\'eau');
        expect(result.data.statut).toBe('draft');
        // Vérifier les defaults
        expect(result.data.description).toBe('');
        expect(result.data.type).toBe('');
        expect(result.data.categorie).toBe('');
      }
    });

    it('devrait rejeter si titre manquant', () => {
      const data = {
        statut: 'draft',
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('titre');
      }
    });

    it('devrait rejeter si statut manquant', () => {
      const data = {
        titre: 'Test',
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('statut');
      }
    });

    it('devrait rejeter un titre vide', () => {
      const data = {
        titre: '',
        statut: 'draft',
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('requis');
      }
    });

    // ========================================================================
    // TESTS - Limites de longueur
    // ========================================================================

    it('devrait rejeter un titre trop long (>200 caractères)', () => {
      const data = {
        titre: 'A'.repeat(201),
        statut: 'draft',
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('200 caractères');
      }
    });

    it('devrait accepter un titre de 200 caractères exactement', () => {
      const data = {
        titre: 'A'.repeat(200),
        statut: 'draft',
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('devrait rejeter une description trop longue (>5000 caractères)', () => {
      const data = {
        titre: 'Test',
        statut: 'draft',
        description: 'A'.repeat(5001),
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5000 caractères');
      }
    });

    it('devrait accepter une description de 5000 caractères exactement', () => {
      const data = {
        titre: 'Test',
        statut: 'draft',
        description: 'A'.repeat(5000),
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('devrait rejeter une localisation trop longue (>200 caractères)', () => {
      const data = {
        titre: 'Test',
        statut: 'draft',
        localisation: 'A'.repeat(201),
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('200 caractères');
      }
    });

    it('devrait rejeter un numéro de chambre trop long (>20 caractères)', () => {
      const data = {
        titre: 'Test',
        statut: 'draft',
        numerochambre: '1'.repeat(21),
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('20 caractères');
      }
    });

    it('devrait rejeter un bâtiment trop long (>50 caractères)', () => {
      const data = {
        titre: 'Test',
        statut: 'draft',
        batiment: 'A'.repeat(51),
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('50 caractères');
      }
    });

    it('devrait rejeter un nom de technicien trop long (>100 caractères)', () => {
      const data = {
        titre: 'Test',
        statut: 'draft',
        technicien: 'A'.repeat(101),
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100 caractères');
      }
    });

    it('devrait rejeter des notes internes trop longues (>2000 caractères)', () => {
      const data = {
        titre: 'Test',
        statut: 'draft',
        notesinternes: 'A'.repeat(2001),
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2000 caractères');
      }
    });

    it('devrait rejeter une référence externe trop longue (>100 caractères)', () => {
      const data = {
        titre: 'Test',
        statut: 'draft',
        referenceexterne: 'A'.repeat(101),
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100 caractères');
      }
    });

    // ========================================================================
    // TESTS - Champs optionnels avec defaults
    // ========================================================================

    it('devrait appliquer les valeurs par défaut pour les champs optionnels', () => {
      const data = {
        titre: 'Test',
        statut: 'draft',
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('');
        expect(result.data.type).toBe('');
        expect(result.data.categorie).toBe('');
        expect(result.data.priorite).toBe('');
        expect(result.data.localisation).toBe('');
        expect(result.data.numerochambre).toBe('');
        expect(result.data.etage).toBe('');
        expect(result.data.batiment).toBe('');
        expect(result.data.technicien).toBe('');
        expect(result.data.createur).toBe('');
        expect(result.data.datecreation).toBe('');
        expect(result.data.dateplanifiee).toBe('');
        expect(result.data.heureplanifiee).toBe('');
        expect(result.data.dureeestimee).toBe('');
        expect(result.data.notesinternes).toBe('');
        expect(result.data.notesresolution).toBe('');
        expect(result.data.datelimite).toBe('');
        expect(result.data.tags).toBe('');
        expect(result.data.referenceexterne).toBe('');
      }
    });

    it('devrait valider une intervention complète avec tous les champs', () => {
      const data = {
        titre: 'Réparation fuite',
        statut: 'in_progress',
        description: 'Fuite importante dans la salle de bain',
        type: 'plomberie',
        categorie: 'urgent',
        priorite: 'haute',
        localisation: 'Salle de bain',
        numerochambre: '101',
        etage: '1',
        batiment: 'Tour Sud',
        technicien: 'Michel Dupont',
        createur: 'Marie Martin',
        datecreation: '15/01/2025',
        dateplanifiee: '16/01/2025',
        heureplanifiee: '14:30',
        dureeestimee: '120',
        notesinternes: 'Contacter le plombier externe',
        notesresolution: 'Problème résolu, joint remplacé',
        datelimite: '20/01/2025',
        tags: 'urgent, weekend',
        referenceexterne: 'EXT-2025-001',
      };

      const result = InterventionImportSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titre).toBe('Réparation fuite');
        expect(result.data.type).toBe('plomberie');
        expect(result.data.technicien).toBe('Michel Dupont');
      }
    });
  });

  // ==========================================================================
  // TESTS - RoomImportSchema
  // ==========================================================================

  describe('RoomImportSchema', () => {
    // ========================================================================
    // TESTS - Champs obligatoires
    // ========================================================================

    it('devrait valider une chambre avec champs obligatoires minimum', () => {
      const data = {
        numero: '101',
        nom: 'Chambre Standard',
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.numero).toBe('101');
        expect(result.data.nom).toBe('Chambre Standard');
        // Vérifier les defaults
        expect(result.data.batiment).toBe('');
        expect(result.data.etage).toBe('0');
        expect(result.data.type).toBe('double');
        expect(result.data.capacite).toBe(2);
      }
    });

    it('devrait rejeter si numero manquant', () => {
      const data = {
        nom: 'Chambre Test',
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('numero');
      }
    });

    it('devrait rejeter si nom manquant', () => {
      const data = {
        numero: '101',
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('nom');
      }
    });

    it('devrait rejeter un numero vide', () => {
      const data = {
        numero: '',
        nom: 'Chambre Test',
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    // ========================================================================
    // TESTS - Coercion de nombres
    // ========================================================================

    it('devrait convertir capacite en nombre', () => {
      const data = {
        numero: '101',
        nom: 'Chambre',
        capacite: '4',
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacite).toBe(4);
        expect(typeof result.data.capacite).toBe('number');
      }
    });

    it('devrait utiliser 2 comme capacité par défaut si vide', () => {
      const data = {
        numero: '101',
        nom: 'Chambre',
        capacite: '',
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacite).toBe(2);
      }
    });

    it('devrait rejeter une capacité négative', () => {
      const data = {
        numero: '101',
        nom: 'Chambre',
        capacite: -1,
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positif');
      }
    });

    it('devrait rejeter une capacité = 0', () => {
      const data = {
        numero: '101',
        nom: 'Chambre',
        capacite: 0,
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positif');
      }
    });

    it('devrait convertir prix en nombre si fourni', () => {
      const data = {
        numero: '101',
        nom: 'Chambre',
        prix: '120.50',
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prix).toBe(120.50);
        expect(typeof result.data.prix).toBe('number');
      }
    });

    it('devrait accepter prix vide comme undefined', () => {
      const data = {
        numero: '101',
        nom: 'Chambre',
        prix: '',
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prix).toBeUndefined();
      }
    });

    it('devrait rejeter un prix négatif', () => {
      const data = {
        numero: '101',
        nom: 'Chambre',
        prix: -50,
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positif');
      }
    });

    it('devrait convertir surface en nombre si fourni', () => {
      const data = {
        numero: '101',
        nom: 'Chambre',
        surface: '25.5',
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.surface).toBe(25.5);
        expect(typeof result.data.surface).toBe('number');
      }
    });

    it('devrait accepter surface vide comme undefined', () => {
      const data = {
        numero: '101',
        nom: 'Chambre',
        surface: '',
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.surface).toBeUndefined();
      }
    });

    // ========================================================================
    // TESTS - Chambre complète
    // ========================================================================

    it('devrait valider une chambre complète avec tous les champs', () => {
      const data = {
        numero: '205',
        nom: 'Suite Présidentielle',
        batiment: 'Tour Nord',
        etage: '2',
        type: 'suite',
        capacite: '4',
        prix: '350.00',
        surface: '45.5',
        description: 'Suite de luxe avec vue mer',
        equipements: 'TV, WiFi, Climatisation, Minibar',
      };

      const result = RoomImportSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.numero).toBe('205');
        expect(result.data.nom).toBe('Suite Présidentielle');
        expect(result.data.type).toBe('suite');
        expect(result.data.capacite).toBe(4);
        expect(result.data.prix).toBe(350.00);
        expect(result.data.surface).toBe(45.5);
      }
    });
  });
});
