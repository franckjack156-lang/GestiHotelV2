/**
 * Tests pour generateInterventionTemplate
 *
 * Module de génération de templates Excel pour l'import d'interventions
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import * as XLSX from 'xlsx';
import {
  generateBlankTemplate,
  generateExampleTemplate,
  downloadBlankTemplate,
  downloadExampleTemplate,
} from '../generateInterventionTemplate';

// Mock global URL API pour les tests de téléchargement
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

beforeAll(() => {
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('generateInterventionTemplate', () => {
  // ==========================================================================
  // TESTS - generateBlankTemplate
  // ==========================================================================

  describe('generateBlankTemplate', () => {
    it('devrait générer un buffer ArrayBuffer', () => {
      const buffer = generateBlankTemplate();

      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('devrait créer un fichier Excel valide', () => {
      const buffer = generateBlankTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });

      expect(workbook).toBeDefined();
      expect(workbook.SheetNames).toBeDefined();
    });

    it('devrait avoir une feuille nommée "Interventions"', () => {
      const buffer = generateBlankTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });

      expect(workbook.SheetNames).toContain('Interventions');
    });

    it('devrait avoir une ligne vierge avec tous les en-têtes', () => {
      const buffer = generateBlankTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Interventions'];
      const data = XLSX.utils.sheet_to_json(sheet);

      expect(data).toHaveLength(1);
      expect(data[0]).toHaveProperty('Titre ⚠️');
      expect(data[0]).toHaveProperty('Type ⚠️');
      expect(data[0]).toHaveProperty('Priorité ⚠️');
    });

    it('devrait avoir tous les champs obligatoires marqués avec ⚠️', () => {
      const buffer = generateBlankTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Interventions'];
      const range = XLSX.utils.decode_range(sheet['!ref']!);

      // Lire les en-têtes (première ligne)
      const headers: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = sheet[cellAddress];
        if (cell && cell.v) {
          headers.push(cell.v.toString());
        }
      }

      expect(headers).toContain('Titre ⚠️');
      expect(headers).toContain('Type ⚠️');
      expect(headers).toContain('Priorité ⚠️');
    });

    it('devrait avoir tous les champs attendus', () => {
      const buffer = generateBlankTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Interventions'];
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

      const expectedFields = [
        'Titre ⚠️',
        'Description',
        'Type ⚠️',
        'Catégorie',
        'Priorité ⚠️',
        'Localisation',
        'Chambre',
        'Étage',
        'Bâtiment',
        'Urgent',
        'Bloquant',
        'Notes Internes',
        'Référence Externe',
      ];

      expectedFields.forEach((field) => {
        expect(data[0]).toHaveProperty(field);
      });
    });

    it('devrait avoir toutes les valeurs vides', () => {
      const buffer = generateBlankTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Interventions'];
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      const row = data[0];
      Object.values(row).forEach((value) => {
        expect(value).toBe('');
      });
    });

    it('devrait générer un fichier de taille raisonnable (<50KB)', () => {
      const buffer = generateBlankTemplate();

      expect(buffer.byteLength).toBeLessThan(50 * 1024); // < 50KB
    });
  });

  // ==========================================================================
  // TESTS - generateExampleTemplate
  // ==========================================================================

  describe('generateExampleTemplate', () => {
    it('devrait générer un buffer ArrayBuffer', () => {
      const buffer = generateExampleTemplate();

      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('devrait créer un fichier Excel valide', () => {
      const buffer = generateExampleTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });

      expect(workbook).toBeDefined();
      expect(workbook.SheetNames).toBeDefined();
    });

    it('devrait avoir 2 feuilles (Interventions + Instructions)', () => {
      const buffer = generateExampleTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });

      expect(workbook.SheetNames).toHaveLength(2);
      expect(workbook.SheetNames).toContain('Interventions');
      expect(workbook.SheetNames).toContain('Instructions');
    });

    it('devrait avoir 5 exemples d\'interventions', () => {
      const buffer = generateExampleTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Interventions'];
      const data = XLSX.utils.sheet_to_json(sheet);

      expect(data).toHaveLength(5);
    });

    it('devrait avoir des exemples avec des données valides', () => {
      const buffer = generateExampleTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Interventions'];
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      const firstRow = data[0];
      expect(firstRow['Titre ⚠️']).toBeTruthy();
      expect(firstRow['Type ⚠️']).toBeTruthy();
      expect(firstRow['Priorité ⚠️']).toBeTruthy();
    });

    it('devrait avoir des exemples avec différentes priorités', () => {
      const buffer = generateExampleTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Interventions'];
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      const priorities = data.map((row) => row['Priorité ⚠️']);
      expect(priorities).toContain('urgente');
      expect(priorities).toContain('basse');
      expect(priorities).toContain('haute');
      expect(priorities).toContain('normale');
    });

    it('devrait avoir des exemples avec différents types', () => {
      const buffer = generateExampleTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Interventions'];
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      const types = data.map((row) => row['Type ⚠️']);
      expect(types).toContain('Plomberie');
      expect(types).toContain('Électricité');
      expect(types).toContain('Climatisation');
    });

    it('devrait avoir des exemples avec différentes valeurs de "Urgent"', () => {
      const buffer = generateExampleTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Interventions'];
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      const urgentValues = data.map((row) => row['Urgent']);
      expect(urgentValues).toContain('oui');
      expect(urgentValues).toContain('non');
      expect(urgentValues).toContain('no'); // Variante anglaise
      expect(urgentValues).toContain('1'); // Variante numérique
    });

    it('devrait avoir des exemples avec différentes valeurs de "Bloquant"', () => {
      const buffer = generateExampleTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Interventions'];
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      const bloquantValues = data.map((row) => row['Bloquant']);
      expect(bloquantValues).toContain('oui');
      expect(bloquantValues).toContain('non');
      expect(bloquantValues).toContain('yes'); // Variante anglaise
      expect(bloquantValues).toContain('0'); // Variante numérique
    });

    it('devrait avoir une feuille Instructions avec du contenu', () => {
      const buffer = generateExampleTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Instructions'];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      expect(data.length).toBeGreaterThan(10); // Au moins 10 lignes d'instructions
    });

    it('devrait avoir des instructions avec le titre correct', () => {
      const buffer = generateExampleTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Instructions'];
      const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

      const firstRow = data[0];
      expect(firstRow[0]).toContain('GUIDE');
      expect(firstRow[0]).toContain('TEMPLATE');
    });

    it('devrait avoir des instructions détaillées sur les champs obligatoires', () => {
      const buffer = generateExampleTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Instructions'];
      const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

      const allText = data.flat().join(' ');
      expect(allText).toContain('OBLIGATOIRES');
      expect(allText).toContain('Titre');
      expect(allText).toContain('Type');
      expect(allText).toContain('Priorité');
    });

    it('devrait avoir des instructions sur les valeurs de priorité', () => {
      const buffer = generateExampleTemplate();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets['Instructions'];
      const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

      const allText = data.flat().join(' ');
      expect(allText).toContain('basse');
      expect(allText).toContain('normale');
      expect(allText).toContain('haute');
      expect(allText).toContain('urgente');
    });

    it('devrait générer un fichier plus grand que le template vierge', () => {
      const blankBuffer = generateBlankTemplate();
      const exampleBuffer = generateExampleTemplate();

      expect(exampleBuffer.byteLength).toBeGreaterThan(blankBuffer.byteLength);
    });
  });

  // ==========================================================================
  // TESTS - downloadBlankTemplate
  // ==========================================================================

  describe('downloadBlankTemplate', () => {
    let createElementSpy: ReturnType<typeof vi.spyOn>;
    let mockAnchor: HTMLAnchorElement;

    beforeEach(() => {
      // Reset mocks
      mockCreateObjectURL.mockClear();
      mockRevokeObjectURL.mockClear();
      mockCreateObjectURL.mockReturnValue('blob:mock-url');

      // Mock document.createElement
      mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockReturnValue(mockAnchor);

      // Mock document.body
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor);
      vi.spyOn(document.body, 'removeChild').mockImplementation(
        () => mockAnchor
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('devrait créer un élément <a>', () => {
      downloadBlankTemplate();

      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('devrait créer un Blob avec le type correct', () => {
      downloadBlankTemplate();

      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blob.type).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('devrait définir le nom de fichier "template-interventions-vierge.xlsx"', () => {
      downloadBlankTemplate();

      expect(mockAnchor.download).toBe('template-interventions-vierge.xlsx');
    });

    it('devrait définir l\'URL du blob', () => {
      downloadBlankTemplate();

      expect(mockAnchor.href).toBe('blob:mock-url');
    });

    it('devrait déclencher le clic sur le lien', () => {
      downloadBlankTemplate();

      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('devrait ajouter puis supprimer l\'élément du DOM', () => {
      const appendSpy = vi.spyOn(document.body, 'appendChild');
      const removeSpy = vi.spyOn(document.body, 'removeChild');

      downloadBlankTemplate();

      expect(appendSpy).toHaveBeenCalledWith(mockAnchor);
      expect(removeSpy).toHaveBeenCalledWith(mockAnchor);
    });

    it('devrait révoquer l\'URL après téléchargement', () => {
      downloadBlankTemplate();

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  // ==========================================================================
  // TESTS - downloadExampleTemplate
  // ==========================================================================

  describe('downloadExampleTemplate', () => {
    let createElementSpy: ReturnType<typeof vi.spyOn>;
    let mockAnchor: HTMLAnchorElement;

    beforeEach(() => {
      // Reset mocks
      mockCreateObjectURL.mockClear();
      mockRevokeObjectURL.mockClear();
      mockCreateObjectURL.mockReturnValue('blob:mock-url-examples');

      // Mock document.createElement
      mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockReturnValue(mockAnchor);

      // Mock document.body
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor);
      vi.spyOn(document.body, 'removeChild').mockImplementation(
        () => mockAnchor
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('devrait créer un élément <a>', () => {
      downloadExampleTemplate();

      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('devrait créer un Blob avec le type correct', () => {
      downloadExampleTemplate();

      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blob.type).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('devrait définir le nom de fichier "template-interventions-exemples.xlsx"', () => {
      downloadExampleTemplate();

      expect(mockAnchor.download).toBe('template-interventions-exemples.xlsx');
    });

    it('devrait définir l\'URL du blob', () => {
      downloadExampleTemplate();

      expect(mockAnchor.href).toBe('blob:mock-url-examples');
    });

    it('devrait déclencher le clic sur le lien', () => {
      downloadExampleTemplate();

      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('devrait ajouter puis supprimer l\'élément du DOM', () => {
      const appendSpy = vi.spyOn(document.body, 'appendChild');
      const removeSpy = vi.spyOn(document.body, 'removeChild');

      downloadExampleTemplate();

      expect(appendSpy).toHaveBeenCalledWith(mockAnchor);
      expect(removeSpy).toHaveBeenCalledWith(mockAnchor);
    });

    it('devrait révoquer l\'URL après téléchargement', () => {
      downloadExampleTemplate();

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url-examples');
    });

    it('devrait créer un Blob non vide', () => {
      downloadExampleTemplate();

      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blob.size).toBeGreaterThan(0);
    });
  });
});
