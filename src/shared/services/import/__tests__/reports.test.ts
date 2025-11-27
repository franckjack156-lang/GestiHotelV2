/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests pour le module reports
 */

import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { generateErrorReport, downloadErrorReport } from '../reports';
import type { ImportError } from '../types';

describe('reports', () => {
  describe('generateErrorReport', () => {
    it('devrait retourner "Aucune erreur" si liste vide', () => {
      const result = generateErrorReport([]);

      expect(result).toBe('Aucune erreur');
    });

    it('devrait générer un rapport pour une seule erreur', () => {
      const errors: ImportError[] = [
        {
          row: 5,
          field: 'titre',
          message: 'Le titre est requis',
        },
      ];

      const result = generateErrorReport(errors);

      expect(result).toContain("RAPPORT D'ERREURS D'IMPORT");
      expect(result).toContain('Ligne 5:');
      expect(result).toContain('Champ "titre"');
      expect(result).toContain('Le titre est requis');
    });

    it('devrait afficher la valeur reçue si présente', () => {
      const errors: ImportError[] = [
        {
          row: 3,
          field: 'titre',
          message: 'Le titre ne peut pas dépasser 200 caractères',
          value: 'A'.repeat(201),
        },
      ];

      const result = generateErrorReport(errors);

      expect(result).toContain('Ligne 3:');
      expect(result).toContain('Valeur reçue:');
    });

    it('devrait grouper les erreurs par ligne', () => {
      const errors: ImportError[] = [
        {
          row: 5,
          field: 'titre',
          message: 'Le titre est requis',
        },
        {
          row: 5,
          field: 'statut',
          message: 'Le statut est requis',
        },
        {
          row: 8,
          field: 'titre',
          message: 'Titre trop long',
        },
      ];

      const result = generateErrorReport(errors);

      expect(result).toContain('Ligne 5:');
      expect(result).toContain('Ligne 8:');
      // Vérifier que les 2 erreurs de la ligne 5 sont présentes
      const line5Section = result.split('Ligne 8:')[0];
      expect(line5Section).toContain('titre');
      expect(line5Section).toContain('statut');
    });

    it('devrait gérer les erreurs sans champ spécifique', () => {
      const errors: ImportError[] = [
        {
          row: 0,
          message: 'Erreur lors de la lecture du fichier Excel',
        },
      ];

      const result = generateErrorReport(errors);

      expect(result).toContain('Ligne 0:');
      expect(result).toContain('Erreur lors de la lecture du fichier Excel');
      expect(result).not.toContain('Champ');
    });

    it('devrait formater correctement un rapport avec plusieurs lignes', () => {
      const errors: ImportError[] = [
        {
          row: 2,
          field: 'titre',
          message: 'Le titre est requis',
        },
        {
          row: 5,
          field: 'statut',
          message: 'Statut invalide',
          value: 'inconnu',
        },
        {
          row: 10,
          field: 'priorite',
          message: 'Priorité non reconnue',
        },
      ];

      const result = generateErrorReport(errors);

      expect(result).toContain("RAPPORT D'ERREURS D'IMPORT");
      expect(result).toContain('='.repeat(50));
      expect(result).toContain('Ligne 2:');
      expect(result).toContain('Ligne 5:');
      expect(result).toContain('Ligne 10:');
    });

    it('devrait gérer les erreurs avec valeur undefined', () => {
      const errors: ImportError[] = [
        {
          row: 3,
          field: 'titre',
          message: 'Le titre est requis',
          value: undefined,
        },
      ];

      const result = generateErrorReport(errors);

      expect(result).toContain('Le titre est requis');
      expect(result).not.toContain('Valeur reçue:');
    });
  });

  describe('downloadErrorReport', () => {
    let createElementSpy: MockInstance<any>;
    let appendChildSpy: MockInstance<any>;
    let removeChildSpy: MockInstance<any>;
    let mockAnchor: any;

    beforeEach(() => {
      // Mock URL methods globally
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      // Mock createElement
      mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

      // Mock DOM methods
      appendChildSpy = vi
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => mockAnchor as any);
      removeChildSpy = vi
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => mockAnchor as any);
    });

    afterEach(() => {
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      vi.restoreAllMocks();
    });

    it('devrait appeler la fonction sans erreur', () => {
      const errors: ImportError[] = [
        {
          row: 5,
          field: 'titre',
          message: 'Le titre est requis',
        },
      ];

      // Vérifier que la fonction s'exécute sans erreur
      expect(() => downloadErrorReport(errors)).not.toThrow();
    });

    it('devrait créer un élément <a> avec le bon filename', () => {
      const errors: ImportError[] = [{ row: 1, message: 'Erreur test' }];

      downloadErrorReport(errors, 'mon-rapport.txt');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      const anchor = createElementSpy.mock.results[0].value;
      expect(anchor.download).toBe('mon-rapport.txt');
    });

    it('devrait utiliser le filename par défaut si non fourni', () => {
      const errors: ImportError[] = [{ row: 1, message: 'Erreur test' }];

      downloadErrorReport(errors);

      const anchor = createElementSpy.mock.results[0].value;
      expect(anchor.download).toBe('erreurs-import.txt');
    });

    it('devrait créer un URL depuis le Blob', () => {
      const errors: ImportError[] = [{ row: 1, message: 'Erreur test' }];

      downloadErrorReport(errors);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockAnchor.href).toBe('blob:mock-url');
    });

    it('devrait déclencher le téléchargement', () => {
      const errors: ImportError[] = [{ row: 1, message: 'Erreur test' }];

      downloadErrorReport(errors);

      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('devrait nettoyer le DOM après téléchargement', () => {
      const errors: ImportError[] = [{ row: 1, message: 'Erreur test' }];

      downloadErrorReport(errors);

      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it("devrait révoquer l'URL du Blob après téléchargement", () => {
      const errors: ImportError[] = [{ row: 1, message: 'Erreur test' }];

      downloadErrorReport(errors);

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
