/**
 * ============================================================================
 * IMPORT SERVICE - PARSER
 * ============================================================================
 *
 * Fonctions de parsing et normalisation de fichiers Excel
 */

import * as XLSX from 'xlsx';

/**
 * Parse un fichier Excel et retourne les données brutes
 */
export const parseExcelFile = (file: File): Promise<Record<string, unknown>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
        }) as Record<string, unknown>[];

        resolve(jsonData);
      } catch {
        reject(new Error('Erreur lors de la lecture du fichier Excel'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsBinaryString(file);
  });
};

/**
 * Normalise les clés d'un objet (enlève espaces, accents, met en minuscules)
 */
export const normalizeKey = (key: string): string => {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * Normalise les clés d'un objet pour correspondre au schéma
 */
export const normalizeObject = (
  obj: Record<string, unknown>,
  keyMapping: Record<string, string>
): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {};

  if (!obj || typeof obj !== 'object') {
    return normalized;
  }

  Object.keys(obj).forEach(key => {
    const normalizedKey = normalizeKey(key);
    const mappedKey = keyMapping[normalizedKey];

    if (mappedKey) {
      normalized[mappedKey] = obj[key];
    }
  });

  return normalized;
};

/**
 * Map des statuts français vers anglais
 */
const STATUS_FR_TO_EN: Record<string, string> = {
  nouveau: 'draft',
  brouillon: 'draft',
  en_attente: 'pending',
  attente: 'pending',
  assigne: 'assigned',
  assignee: 'assigned',
  en_cours: 'in_progress',
  encours: 'in_progress',
  en_pause: 'on_hold',
  pause: 'on_hold',
  termine: 'completed',
  terminee: 'completed',
  complete: 'completed',
  valide: 'validated',
  validee: 'validated',
  annule: 'cancelled',
  annulee: 'cancelled',
  reporte: 'cancelled',
  reportee: 'cancelled',
};

/**
 * Normalise un statut (gère le français et l'anglais)
 */
export const normalizeStatus = (status: string): string => {
  // Normaliser: trim + minuscules + enlever accents + remplacer espaces par underscore
  const normalized = status
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/\s+/g, '_'); // Remplacer espaces par underscore

  // Si le statut est en français, le traduire
  return STATUS_FR_TO_EN[normalized] || normalized;
};
