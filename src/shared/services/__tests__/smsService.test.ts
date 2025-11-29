/**
 * Tests unitaires pour le service SMS
 */

import { describe, it, expect } from 'vitest';
import {
  isValidPhoneNumber,
  formatPhoneNumber,
  countSMSParts,
  estimateSMSCost,
} from '../smsService';

describe('SMS Service', () => {
  describe('isValidPhoneNumber', () => {
    it('devrait valider les numéros internationaux corrects', () => {
      expect(isValidPhoneNumber('+33612345678')).toBe(true);
      expect(isValidPhoneNumber('+14155551234')).toBe(true);
      expect(isValidPhoneNumber('+41791234567')).toBe(true);
      expect(isValidPhoneNumber('+32471234567')).toBe(true);
    });

    it('devrait rejeter les numéros sans indicatif international', () => {
      expect(isValidPhoneNumber('0612345678')).toBe(false);
      expect(isValidPhoneNumber('612345678')).toBe(false);
    });

    it('devrait rejeter les numéros trop courts', () => {
      expect(isValidPhoneNumber('+3361234')).toBe(false);
      expect(isValidPhoneNumber('+1234')).toBe(false);
    });

    it('devrait rejeter les numéros trop longs', () => {
      expect(isValidPhoneNumber('+123456789012345678')).toBe(false);
    });

    it('devrait rejeter les formats invalides', () => {
      expect(isValidPhoneNumber('abc')).toBe(false);
      expect(isValidPhoneNumber('++33612345678')).toBe(false);
      expect(isValidPhoneNumber('33612345678')).toBe(false);
      expect(isValidPhoneNumber('')).toBe(false);
    });
  });

  describe('formatPhoneNumber', () => {
    it('devrait formater un numéro français avec le code pays par défaut', () => {
      expect(formatPhoneNumber('0612345678')).toBe('+33612345678');
    });

    it('devrait formater un numéro avec un code pays personnalisé', () => {
      expect(formatPhoneNumber('0471234567', '+32')).toBe('+32471234567');
      expect(formatPhoneNumber('0791234567', '+41')).toBe('+41791234567');
    });

    it('devrait conserver un numéro déjà au format international', () => {
      expect(formatPhoneNumber('+33612345678')).toBe('+33612345678');
    });

    it('devrait nettoyer les espaces et caractères spéciaux', () => {
      expect(formatPhoneNumber('06 12 34 56 78')).toBe('+33612345678');
      expect(formatPhoneNumber('06-12-34-56-78')).toBe('+33612345678');
      expect(formatPhoneNumber('06.12.34.56.78')).toBe('+33612345678');
    });

    it('devrait gérer les numéros sans zéro initial', () => {
      expect(formatPhoneNumber('612345678')).toBe('+612345678');
    });
  });

  describe('countSMSParts', () => {
    it('devrait compter 1 partie pour un message court', () => {
      expect(countSMSParts('Bonjour')).toBe(1);
      expect(countSMSParts('A')).toBe(1);
    });

    it('devrait compter 1 partie pour un message de 160 caractères', () => {
      const message = 'A'.repeat(160);
      expect(countSMSParts(message)).toBe(1);
    });

    it('devrait compter 2 parties pour un message de 161 caractères', () => {
      const message = 'A'.repeat(161);
      expect(countSMSParts(message)).toBe(2);
    });

    it('devrait compter correctement les messages longs', () => {
      expect(countSMSParts('A'.repeat(153))).toBe(1);
      expect(countSMSParts('A'.repeat(154))).toBe(2);
      expect(countSMSParts('A'.repeat(306))).toBe(2);
      expect(countSMSParts('A'.repeat(307))).toBe(3);
    });

    it('devrait gérer les messages vides', () => {
      expect(countSMSParts('')).toBe(1);
    });
  });

  describe('estimateSMSCost', () => {
    it('devrait estimer le coût pour un message court', () => {
      expect(estimateSMSCost('Bonjour', 0.06)).toBe(0.06);
    });

    it('devrait estimer le coût pour un message long', () => {
      const message = 'A'.repeat(200);
      expect(estimateSMSCost(message, 0.06)).toBe(0.12); // 2 parties
    });

    it('devrait utiliser le prix par défaut', () => {
      expect(estimateSMSCost('Test')).toBe(0.06);
    });

    it('devrait calculer correctement pour plusieurs parties', () => {
      const message = 'A'.repeat(500);
      const parts = countSMSParts(message);
      const cost = estimateSMSCost(message, 0.06);
      expect(cost).toBe(parts * 0.06);
    });
  });

  describe('Format de numéros réels', () => {
    const testCases = [
      { input: '0612345678', country: '+33', expected: '+33612345678' },
      { input: '06 12 34 56 78', country: '+33', expected: '+33612345678' },
      { input: '0471234567', country: '+32', expected: '+32471234567' },
      { input: '04 71 23 45 67', country: '+32', expected: '+32471234567' },
      { input: '0791234567', country: '+41', expected: '+41791234567' },
      { input: '079 123 45 67', country: '+41', expected: '+41791234567' },
    ];

    testCases.forEach(({ input, country, expected }) => {
      it(`devrait formater ${input} (${country}) en ${expected}`, () => {
        expect(formatPhoneNumber(input, country)).toBe(expected);
      });
    });
  });

  describe('Validation de numéros réels', () => {
    const validNumbers = [
      '+33612345678', // France mobile
      '+33123456789', // France fixe
      '+14155551234', // USA
      '+447911123456', // UK
      '+41791234567', // Suisse
      '+32471234567', // Belgique
    ];

    validNumbers.forEach((number) => {
      it(`devrait valider ${number}`, () => {
        expect(isValidPhoneNumber(number)).toBe(true);
      });
    });

    const invalidNumbers = [
      '0612345678', // Pas d'indicatif
      '+33', // Trop court
      'abc', // Pas un numéro
      '+33 6 12 34 56 78', // Espaces
      '123', // Trop court
    ];

    invalidNumbers.forEach((number) => {
      it(`devrait rejeter ${number}`, () => {
        expect(isValidPhoneNumber(number)).toBe(false);
      });
    });
  });

  describe('Estimation de coûts réels', () => {
    it('devrait calculer le coût pour des scénarios réels', () => {
      // Message court
      const shortMessage = 'Nouvelle intervention: Fuite eau - Chambre 201';
      expect(estimateSMSCost(shortMessage, 0.07)).toBe(0.07);

      // Message moyen
      const mediumMessage =
        'URGENT - Intervention prioritaire\nTitre: Fuite importante\nChambre: 305\nDescription: Fuite d\'eau importante dans la salle de bain, action immédiate requise';
      const mediumParts = countSMSParts(mediumMessage);
      expect(estimateSMSCost(mediumMessage, 0.07)).toBe(mediumParts * 0.07);

      // Message long
      const longMessage =
        'Résumé quotidien:\n' +
        '- 5 interventions en attente\n' +
        '- 3 interventions en cours\n' +
        '- 2 interventions terminées\n' +
        'Détails des interventions urgentes:\n' +
        '1. Fuite eau chambre 201\n' +
        '2. Climatisation défaillante chambre 305\n' +
        '3. Problème électrique chambre 412';
      const longParts = countSMSParts(longMessage);
      expect(estimateSMSCost(longMessage, 0.07)).toBe(longParts * 0.07);
    });
  });
});
