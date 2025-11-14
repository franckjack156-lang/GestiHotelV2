/**
 * ============================================================================
 * IMPORT SERVICE
 * ============================================================================
 *
 * Service pour importer des données depuis des fichiers Excel
 * - Parse les fichiers XLSX
 * - Valide les données avec Zod
 * - Génère des rapports d'erreurs détaillés
 * - Support interventions et chambres
 */

import * as XLSX from 'xlsx';
import { z } from 'zod';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import type { Room } from '@/features/rooms/types/room.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
  };
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: any;
}

export interface ImportOptions {
  skipEmptyRows?: boolean;
  maxRows?: number;
  startRow?: number; // Ligne de début (0-indexed, après l'entête)
}

// ============================================================================
// SCHEMAS DE VALIDATION
// ============================================================================

/**
 * Schema pour l'import d'interventions
 */
const InterventionImportSchema = z.object({
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional().default(''),
  type: z.string().min(1, 'Le type est requis'),
  categorie: z.string().optional().default(''),
  priorite: z.enum(['basse', 'normale', 'haute', 'urgente'], {
    errorMap: () => ({ message: 'Priorité invalide (basse, normale, haute, urgente)' }),
  }),
  localisation: z.string().optional().default(''),
  chambre: z.string().optional().default(''),
  etage: z.string().optional().default(''),
  urgent: z.enum(['oui', 'non', 'true', 'false', '1', '0', '']).optional().default('non'),
  bloquant: z.enum(['oui', 'non', 'true', 'false', '1', '0', '']).optional().default('non'),
});

/**
 * Schema pour l'import de chambres
 */
const RoomImportSchema = z.object({
  numero: z.string().min(1, 'Le numéro de chambre est requis'),
  nom: z.string().min(1, 'Le nom de la chambre est requis'),
  batiment: z.string().optional().default(''),
  etage: z.string().optional().default('0'),
  type: z.string().optional().default('double'),
  capacite: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 2 : val),
    z.coerce.number().int().positive('La capacité doit être un nombre positif')
  ),
  prix: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number().positive('Le prix doit être un nombre positif').optional()
  ),
  surface: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number().positive('La surface doit être un nombre positif').optional()
  ),
  description: z.string().optional().default(''),
  equipements: z.string().optional().default(''), // Séparés par des virgules
});

export type InterventionImportRow = z.infer<typeof InterventionImportSchema>;
export type RoomImportRow = z.infer<typeof RoomImportSchema>;

// ============================================================================
// FONCTIONS DE PARSING
// ============================================================================

/**
 * Parse un fichier Excel et retourne les données brutes
 */
export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Prendre la première feuille
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir en JSON avec header en ligne 1
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false, // Convertir tout en string
          defval: '', // Valeur par défaut pour cellules vides
        });

        resolve(jsonData);
      } catch (error) {
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
const normalizeKey = (key: string): string => {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9]/g, '') // Garder seulement alphanumériques
    .trim();
};

/**
 * Normalise les clés d'un objet pour correspondre au schéma
 */
const normalizeObject = (obj: any, keyMapping: Record<string, string>): any => {
  const normalized: any = {};

  // Vérifier que obj existe et est un objet
  if (!obj || typeof obj !== 'object') {
    return normalized;
  }

  Object.keys(obj).forEach((key) => {
    const normalizedKey = normalizeKey(key);
    const mappedKey = keyMapping[normalizedKey];

    if (mappedKey) {
      normalized[mappedKey] = obj[key];
    }
  });

  return normalized;
};

/**
 * Mapping des colonnes pour interventions
 */
const INTERVENTION_KEY_MAPPING: Record<string, string> = {
  titre: 'titre',
  title: 'titre',
  nom: 'titre',
  name: 'titre',
  description: 'description',
  desc: 'description',
  type: 'type',
  categorie: 'categorie',
  category: 'categorie',
  priorite: 'priorite',
  priority: 'priorite',
  localisation: 'localisation',
  location: 'localisation',
  emplacement: 'localisation',
  chambre: 'chambre',
  room: 'chambre',
  numerochambre: 'chambre',
  etage: 'etage',
  floor: 'etage',
  niveau: 'etage',
  urgent: 'urgent',
  urgence: 'urgent',
  bloquant: 'bloquant',
  blocking: 'bloquant',
};

/**
 * Mapping des colonnes pour chambres
 */
const ROOM_KEY_MAPPING: Record<string, string> = {
  numero: 'numero',
  number: 'numero',
  numerochambre: 'numero',
  roomnumber: 'numero',
  nom: 'nom',
  name: 'nom',
  batiment: 'batiment',
  building: 'batiment',
  etage: 'etage',
  floor: 'etage',
  niveau: 'etage',
  type: 'type',
  typechambre: 'type',
  roomtype: 'type',
  capacite: 'capacite',
  capacity: 'capacite',
  personnes: 'capacite',
  prix: 'prix',
  price: 'prix',
  tarif: 'prix',
  surface: 'surface',
  area: 'surface',
  taille: 'surface',
  description: 'description',
  desc: 'description',
  equipements: 'equipements',
  equipment: 'equipements',
  amenities: 'equipements',
};

// ============================================================================
// FONCTIONS D'IMPORT
// ============================================================================

/**
 * Importe des interventions depuis un fichier Excel
 */
export const importInterventions = async (
  file: File,
  options: ImportOptions = {}
): Promise<ImportResult<InterventionImportRow>> => {
  const { skipEmptyRows = true, maxRows = 1000, startRow = 0 } = options;

  try {
    // Parser le fichier
    const rawData = await parseExcelFile(file);

    // Filtrer lignes vides et invalides
    let data = skipEmptyRows
      ? rawData.filter((row) => row && typeof row === 'object' && Object.values(row).some((val) => val !== ''))
      : rawData.filter((row) => row && typeof row === 'object');

    // Limiter le nombre de lignes
    if (startRow > 0) {
      data = data.slice(startRow);
    }
    if (maxRows && data.length > maxRows) {
      data = data.slice(0, maxRows);
    }

    const validData: InterventionImportRow[] = [];
    const errors: ImportError[] = [];

    // Valider chaque ligne
    data.forEach((row, index) => {
      const rowNumber = index + startRow + 2; // +2 pour header + 0-indexed

      try {
        // Normaliser les clés
        const normalizedRow = normalizeObject(row, INTERVENTION_KEY_MAPPING);

        // Valider avec Zod
        const validated = InterventionImportSchema.parse(normalizedRow);

        validData.push(validated);
      } catch (error) {
        if (error instanceof z.ZodError && Array.isArray(error.errors)) {
          error.errors.forEach((err) => {
            errors.push({
              row: rowNumber,
              field: err.path.join('.'),
              message: err.message,
              value: err.path.length > 0 ? row[err.path[0] as string] : undefined,
            });
          });
        } else {
          errors.push({
            row: rowNumber,
            message: error instanceof Error ? error.message : 'Erreur de validation inconnue',
          });
        }
      }
    });

    return {
      success: errors.length === 0,
      data: validData,
      errors,
      stats: {
        total: data.length,
        valid: validData.length,
        invalid: errors.length,
      },
    };
  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      data: [],
      errors: [
        {
          row: 0,
          message: error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier',
        },
      ],
      stats: {
        total: 0,
        valid: 0,
        invalid: 1,
      },
    };
  }
};

/**
 * Importe des chambres depuis un fichier Excel
 */
export const importRooms = async (
  file: File,
  options: ImportOptions = {}
): Promise<ImportResult<RoomImportRow>> => {
  const { skipEmptyRows = true, maxRows = 1000, startRow = 0 } = options;

  try {
    // Parser le fichier
    const rawData = await parseExcelFile(file);

    // Filtrer lignes vides et invalides
    let data = skipEmptyRows
      ? rawData.filter((row) => row && typeof row === 'object' && Object.values(row).some((val) => val !== ''))
      : rawData.filter((row) => row && typeof row === 'object');

    // Limiter le nombre de lignes
    if (startRow > 0) {
      data = data.slice(startRow);
    }
    if (maxRows && data.length > maxRows) {
      data = data.slice(0, maxRows);
    }

    const validData: RoomImportRow[] = [];
    const errors: ImportError[] = [];

    // Valider chaque ligne
    data.forEach((row, index) => {
      const rowNumber = index + startRow + 2; // +2 pour header + 0-indexed

      try {
        // Normaliser les clés
        const normalizedRow = normalizeObject(row, ROOM_KEY_MAPPING);

        // Valider avec Zod
        const validated = RoomImportSchema.parse(normalizedRow);

        validData.push(validated);
      } catch (error) {
        if (error instanceof z.ZodError && Array.isArray(error.errors)) {
          error.errors.forEach((err) => {
            errors.push({
              row: rowNumber,
              field: err.path.join('.'),
              message: err.message,
              value: err.path.length > 0 ? row[err.path[0] as string] : undefined,
            });
          });
        } else {
          errors.push({
            row: rowNumber,
            message: error instanceof Error ? error.message : 'Erreur de validation inconnue',
          });
        }
      }
    });

    return {
      success: errors.length === 0,
      data: validData,
      errors,
      stats: {
        total: data.length,
        valid: validData.length,
        invalid: errors.length,
      },
    };
  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      data: [],
      errors: [
        {
          row: 0,
          message: error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier',
        },
      ],
      stats: {
        total: 0,
        valid: 0,
        invalid: 1,
      },
    };
  }
};

/**
 * Convertit les données d'import en objets Intervention pour Firestore
 */
export const convertToInterventions = (
  data: InterventionImportRow[],
  establishmentId: string,
  createdBy: string
): Partial<Intervention>[] => {
  return data.map((row) => ({
    title: row.titre,
    description: row.description || '',
    type: row.type,
    category: row.categorie || '',
    priority: row.priorite,
    location: row.localisation || '',
    roomNumber: row.chambre || '',
    floor: row.etage || '',
    isUrgent: ['oui', 'true', '1'].includes(row.urgent?.toLowerCase() || ''),
    isBlocking: ['oui', 'true', '1'].includes(row.bloquant?.toLowerCase() || ''),
    status: 'pending' as const,
    establishmentId,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

/**
 * Convertit les données d'import en objets Room pour Firestore
 */
export const convertToRooms = (
  data: RoomImportRow[],
  establishmentId: string,
  createdBy: string
): Partial<Room>[] => {
  return data.map((row) => {
    // Parse les équipements si présents
    let amenities: string[] | undefined = undefined;
    if (row.equipements && row.equipements.trim()) {
      amenities = row.equipements
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);
    }

    // Construire l'objet sans les valeurs undefined
    const room: Partial<Room> = {
      number: row.numero,
      name: row.nom || `Chambre ${row.numero}`,
      floor: parseInt(row.etage) || 0,
      type: row.type as any,
      capacity: row.capacite,
      description: row.description || '',
      status: 'available' as const,
      isBlocked: false,
      establishmentId,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Ajouter les champs optionnels seulement s'ils ont une valeur
    if (row.batiment && row.batiment.trim()) {
      room.building = row.batiment;
    }
    if (row.prix !== undefined) {
      room.price = row.prix;
    }
    if (row.surface !== undefined) {
      room.area = row.surface;
    }
    if (amenities && amenities.length > 0) {
      room.amenities = amenities;
    }

    return room;
  });
};

/**
 * Génère un rapport d'erreurs lisible
 */
export const generateErrorReport = (errors: ImportError[]): string => {
  if (errors.length === 0) {
    return 'Aucune erreur';
  }

  const lines = ['RAPPORT D\'ERREURS D\'IMPORT', '='.repeat(50), ''];

  const errorsByRow = errors.reduce((acc, error) => {
    if (!acc[error.row]) {
      acc[error.row] = [];
    }
    acc[error.row].push(error);
    return acc;
  }, {} as Record<number, ImportError[]>);

  Object.entries(errorsByRow).forEach(([row, rowErrors]) => {
    lines.push(`Ligne ${row}:`);
    rowErrors.forEach((error) => {
      if (error.field) {
        lines.push(`  - Champ "${error.field}": ${error.message}`);
        if (error.value !== undefined) {
          lines.push(`    Valeur reçue: "${error.value}"`);
        }
      } else {
        lines.push(`  - ${error.message}`);
      }
    });
    lines.push('');
  });

  return lines.join('\n');
};

/**
 * Télécharge un rapport d'erreurs en fichier texte
 */
export const downloadErrorReport = (errors: ImportError[], filename = 'erreurs-import.txt') => {
  const report = generateErrorReport(errors);
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
