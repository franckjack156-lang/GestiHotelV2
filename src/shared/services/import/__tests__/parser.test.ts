/**
 * Tests pour le module parser
 */

import { describe, it, expect } from 'vitest';
import { normalizeKey, normalizeObject, normalizeStatus } from '../parser';

describe('parser', () => {
  describe('normalizeKey', () => {
    it('devrait convertir en minuscules', () => {
      expect(normalizeKey('TITRE')).toBe('titre');
      expect(normalizeKey('TiTrE')).toBe('titre');
    });

    it('devrait enlever les accents', () => {
      expect(normalizeKey('Créé')).toBe('cree');
      expect(normalizeKey('étage')).toBe('etage');
      expect(normalizeKey('bâtiment')).toBe('batiment');
    });

    it('devrait enlever les espaces et caractères spéciaux', () => {
      expect(normalizeKey('Date Création')).toBe('datecreation');
      expect(normalizeKey('date-creation')).toBe('datecreation');
      expect(normalizeKey('date_creation')).toBe('datecreation');
      expect(normalizeKey('date (création)')).toBe('datecreation');
    });

    it('devrait gérer les chaînes vides', () => {
      expect(normalizeKey('')).toBe('');
      expect(normalizeKey('   ')).toBe('');
    });

    it('devrait enlever les astérisques', () => {
      expect(normalizeKey('TITRE *')).toBe('titre');
      expect(normalizeKey('*TITRE*')).toBe('titre');
    });
  });

  describe('normalizeObject', () => {
    it('devrait mapper les clés selon le mapping fourni', () => {
      const obj = { TITRE: 'Test', Description: 'Test desc' };
      const mapping = {
        titre: 'title',
        description: 'desc',
      };

      const result = normalizeObject(obj, mapping);

      expect(result).toEqual({
        title: 'Test',
        desc: 'Test desc',
      });
    });

    it('devrait ignorer les clés non mappées', () => {
      const obj = { titre: 'Test', autreChamp: 'Valeur' };
      const mapping = { titre: 'title' };

      const result = normalizeObject(obj, mapping);

      expect(result).toEqual({ title: 'Test' });
      expect(result).not.toHaveProperty('autreChamp');
    });

    it('devrait gérer les objets vides', () => {
      expect(normalizeObject({}, {})).toEqual({});
    });

    it('devrait gérer les objets null/undefined', () => {
      expect(normalizeObject(null as any, {})).toEqual({});
      expect(normalizeObject(undefined as any, {})).toEqual({});
    });

    it('devrait normaliser les clés avec accents et espaces', () => {
      const obj = { 'Numéro Chambre': '101', 'Date Création': '2025-01-01' };
      const mapping = {
        numerochambre: 'roomNumber',
        datecreation: 'createdAt',
      };

      const result = normalizeObject(obj, mapping);

      expect(result).toEqual({
        roomNumber: '101',
        createdAt: '2025-01-01',
      });
    });
  });

  describe('normalizeStatus', () => {
    it('devrait convertir les statuts français en anglais', () => {
      expect(normalizeStatus('Nouveau')).toBe('draft');
      expect(normalizeStatus('NOUVEAU')).toBe('draft');
      expect(normalizeStatus('Brouillon')).toBe('draft');
    });

    it('devrait gérer en_attente', () => {
      expect(normalizeStatus('En attente')).toBe('pending');
      expect(normalizeStatus('en_attente')).toBe('pending');
      expect(normalizeStatus('Attente')).toBe('pending');
    });

    it('devrait gérer assigné', () => {
      expect(normalizeStatus('Assigné')).toBe('assigned');
      expect(normalizeStatus('Assignée')).toBe('assigned');
      expect(normalizeStatus('assigne')).toBe('assigned');
    });

    it('devrait gérer en_cours', () => {
      expect(normalizeStatus('En cours')).toBe('in_progress');
      expect(normalizeStatus('en_cours')).toBe('in_progress');
      expect(normalizeStatus('EnCours')).toBe('in_progress');
    });

    it('devrait gérer terminé', () => {
      expect(normalizeStatus('Terminé')).toBe('completed');
      expect(normalizeStatus('Terminée')).toBe('completed');
      expect(normalizeStatus('Complété')).toBe('completed');
    });

    it('devrait gérer validé', () => {
      expect(normalizeStatus('Validé')).toBe('validated');
      expect(normalizeStatus('Validée')).toBe('validated');
    });

    it('devrait gérer annulé', () => {
      expect(normalizeStatus('Annulé')).toBe('cancelled');
      expect(normalizeStatus('Annulée')).toBe('cancelled');
    });

    it('devrait retourner le statut anglais inchangé', () => {
      expect(normalizeStatus('draft')).toBe('draft');
      expect(normalizeStatus('pending')).toBe('pending');
      expect(normalizeStatus('in_progress')).toBe('in_progress');
    });

    it('devrait gérer les statuts inconnus', () => {
      expect(normalizeStatus('statut_inconnu')).toBe('statut_inconnu');
      expect(normalizeStatus('unknown')).toBe('unknown');
    });

    it('devrait trim les espaces', () => {
      expect(normalizeStatus('  Nouveau  ')).toBe('draft');
      expect(normalizeStatus('  en cours  ')).toBe('in_progress');
    });
  });
});
