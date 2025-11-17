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
import { Timestamp } from 'firebase/firestore';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import type { CreateRoomData, RoomType } from '@/features/rooms/types/room.types';
import type {
  InterventionStatus,
  InterventionPriority,
  InterventionType,
  InterventionCategory,
} from '@/shared/types/status.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  warnings: ImportWarning[];
  missingValues: MissingListValues;
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
  value?: unknown;
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
  value: unknown;
  suggestion?: string;
}

export interface MissingListValues {
  types: Set<string>;
  categories: Set<string>;
  priorities: Set<string>;
  locations: Set<string>;
  statuses: Set<string>;
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
 * Schema pour l'import d'interventions - VERSION 2.0 (21 colonnes)
 */
const InterventionImportSchema = z.object({
  // ============================================================================
  // CHAMPS OBLIGATOIRES (2) ⚠️
  // ============================================================================
  titre: z.string().min(1, 'Le titre est requis').max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  statut: z.string().min(1, 'Le statut est requis'),

  // ============================================================================
  // CHAMP DESCRIPTION (optionnel mais recommandé)
  // ============================================================================
  description: z.string().max(5000, 'La description ne peut pas dépasser 5000 caractères').optional().default(''),

  // ============================================================================
  // CHAMPS OPTIONNELS - Classification (4)
  // ============================================================================
  type: z.string().optional().default(''),
  categorie: z.string().optional().default(''),
  priorite: z.string().optional().default(''),
  localisation: z.string().max(200, 'La localisation ne peut pas dépasser 200 caractères').optional().default(''),

  // ============================================================================
  // CHAMPS OPTIONNELS - Localisation détaillée (3)
  // ============================================================================
  numerochambre: z.string().max(20, 'Le numéro de chambre ne peut pas dépasser 20 caractères').optional().default(''),
  etage: z.string().optional().default(''),
  batiment: z.string().max(50, 'Le bâtiment ne peut pas dépasser 50 caractères').optional().default(''),

  // ============================================================================
  // CHAMPS OPTIONNELS - Personnes (2)
  // ============================================================================
  technicien: z.string().max(100, 'Le nom du technicien ne peut pas dépasser 100 caractères').optional().default(''),
  createur: z.string().max(100, 'Le nom du créateur ne peut pas dépasser 100 caractères').optional().default(''),

  // ============================================================================
  // CHAMPS OPTIONNELS - Dates et durée (4)
  // ============================================================================
  datecreation: z.string().optional().default(''),
  dateplanifiee: z.string().optional().default(''),
  heureplanifiee: z.string().optional().default(''),
  dureeestimee: z.string().optional().default(''),

  // ============================================================================
  // CHAMPS OPTIONNELS - Notes et métadonnées (4)
  // ============================================================================
  notesinternes: z.string().max(2000, 'Les notes internes ne peuvent pas dépasser 2000 caractères').optional().default(''),
  notesresolution: z.string().max(2000, 'Les notes de résolution ne peuvent pas dépasser 2000 caractères').optional().default(''),
  datelimite: z.string().optional().default(''),
  tags: z.string().optional().default(''),
  referenceexterne: z.string().max(100, 'La référence externe ne peut pas dépasser 100 caractères').optional().default(''),
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
    val => (val === '' || val === null || val === undefined ? 2 : val),
    z.coerce.number().int().positive('La capacité doit être un nombre positif')
  ),
  prix: z.preprocess(
    val => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number().positive('Le prix doit être un nombre positif').optional()
  ),
  surface: z.preprocess(
    val => (val === '' || val === null || val === undefined ? undefined : val),
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
export const parseExcelFile = (file: File): Promise<Record<string, unknown>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
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
const normalizeObject = (obj: Record<string, unknown>, keyMapping: Record<string, string>): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {};

  // Vérifier que obj existe et est un objet
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
 * Mapping des colonnes pour interventions - VERSION 2.0 (21 colonnes)
 */
const INTERVENTION_KEY_MAPPING: Record<string, string> = {
  // Titre
  titre: 'titre',
  title: 'titre',

  // Description
  description: 'description',
  desc: 'description',

  // Statut (nouveau dans V2)
  statut: 'statut',
  status: 'statut',
  etat: 'statut',

  // Type
  type: 'type',

  // Catégorie
  categorie: 'categorie',
  category: 'categorie',

  // Priorité
  priorite: 'priorite',
  priority: 'priorite',

  // Localisation
  localisation: 'localisation',
  location: 'localisation',
  emplacement: 'localisation',
  lieu: 'localisation',

  // Numéro chambre
  numerochambre: 'numerochambre',
  chambre: 'numerochambre',
  room: 'numerochambre',
  roomnumber: 'numerochambre',

  // Étage
  etage: 'etage',
  floor: 'etage',
  niveau: 'etage',

  // Bâtiment
  batiment: 'batiment',
  building: 'batiment',

  // Technicien (nouveau format dans V2)
  technicien: 'technicien',
  technician: 'technicien',
  assignea: 'technicien',

  // Créateur (nouveau dans V2)
  createur: 'createur',
  creator: 'createur',
  creepar: 'createur',

  // Date création (nouveau dans V2)
  datecreation: 'datecreation',
  creationdate: 'datecreation',
  datecrea: 'datecreation',

  // Date planifiée
  dateplanifiee: 'dateplanifiee',
  scheduleddate: 'dateplanifiee',
  dateprevue: 'dateplanifiee',

  // Heure planifiée
  heureplanifiee: 'heureplanifiee',
  scheduledtime: 'heureplanifiee',
  heure: 'heureplanifiee',

  // Durée estimée
  dureeestimee: 'dureeestimee',
  estimatedduration: 'dureeestimee',
  duree: 'dureeestimee',

  // Notes internes
  notesinternes: 'notesinternes',
  internalnotes: 'notesinternes',
  notes: 'notesinternes',

  // Notes résolution (nouveau dans V2)
  notesresolution: 'notesresolution',
  resolutionnotes: 'notesresolution',

  // Date limite
  datelimite: 'datelimite',
  duedate: 'datelimite',
  deadline: 'datelimite',

  // Tags (nouveau dans V2)
  tags: 'tags',
  etiquettes: 'tags',

  // Référence externe
  referenceexterne: 'referenceexterne',
  externalreference: 'referenceexterne',
  reference: 'referenceexterne',
  ref: 'referenceexterne',
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
// FONCTIONS UTILITAIRES POUR DATES
// ============================================================================

/**
 * Parse une date au format JJ/MM/AAAA
 */
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || !dateStr.trim()) return null;

  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // 0-indexed
  const year = parseInt(parts[2]);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900) return null;

  const date = new Date(year, month, day);

  // Vérifier que la date est valide
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }

  return date;
};

/**
 * Parse une date + heure (JJ/MM/AAAA + HH:MM)
 */
const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
  const date = parseDate(dateStr);
  if (!date) return null;

  if (!timeStr || !timeStr.trim()) return date;

  const timeParts = timeStr.trim().split(':');
  if (timeParts.length !== 2) return date;

  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);

  if (isNaN(hours) || isNaN(minutes)) return date;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return date;

  date.setHours(hours, minutes, 0, 0);
  return date;
};

// ============================================================================
// DÉTECTION DES VALEURS MANQUANTES DANS LES LISTES
// ============================================================================

/**
 * Détecte les valeurs qui n'existent pas dans les listes de référence
 */
const detectMissingValues = (
  data: InterventionImportRow[],
  existingLists: {
    types: string[];
    categories: string[];
    priorities: string[];
    locations: string[];
    statuses: string[];
  }
): MissingListValues => {
  const missing: MissingListValues = {
    types: new Set(),
    categories: new Set(),
    priorities: new Set(),
    locations: new Set(),
    statuses: new Set(),
  };

  data.forEach(row => {
    // Vérifier TYPE (si renseigné)
    if (row.type && row.type.trim() && !existingLists.types.includes(row.type.toLowerCase())) {
      missing.types.add(row.type);
    }

    // Vérifier CATEGORIE (si renseignée)
    if (row.categorie && row.categorie.trim() && !existingLists.categories.includes(row.categorie.toLowerCase())) {
      missing.categories.add(row.categorie);
    }

    // Vérifier PRIORITE (si renseignée)
    if (row.priorite && row.priorite.trim() && !existingLists.priorities.includes(row.priorite.toLowerCase())) {
      missing.priorities.add(row.priorite);
    }

    // Vérifier LOCALISATION (si renseignée)
    if (row.localisation && row.localisation.trim() && !existingLists.locations.includes(row.localisation.toLowerCase())) {
      missing.locations.add(row.localisation);
    }

    // Vérifier STATUT (obligatoire)
    if (row.statut && row.statut.trim() && !existingLists.statuses.includes(row.statut.toLowerCase())) {
      missing.statuses.add(row.statut);
    }
  });

  return missing;
};

// ============================================================================
// FONCTIONS D'IMPORT
// ============================================================================

/**
 * Importe des interventions depuis un fichier Excel
 */
export const importInterventions = async (
  file: File,
  options: ImportOptions = {},
  existingLists?: {
    types: string[];
    categories: string[];
    priorities: string[];
    locations: string[];
    statuses: string[];
  }
): Promise<ImportResult<InterventionImportRow>> => {
  const { skipEmptyRows = true, maxRows = 1000, startRow = 0 } = options;

  try {
    // Parser le fichier
    const rawData = await parseExcelFile(file);

    // Filtrer lignes vides et invalides
    let data = skipEmptyRows
      ? rawData.filter(
          row => row && typeof row === 'object' && Object.values(row).some(val => val !== '')
        )
      : rawData.filter(row => row && typeof row === 'object');

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
        if (error instanceof z.ZodError && Array.isArray(error.issues)) {
          error.issues.forEach(err => {
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

    // Détecter les valeurs manquantes dans les listes (si existingLists fourni)
    const missingValues = existingLists
      ? detectMissingValues(validData, existingLists)
      : {
          types: new Set<string>(),
          categories: new Set<string>(),
          priorities: new Set<string>(),
          locations: new Set<string>(),
          statuses: new Set<string>(),
        };

    // Générer des warnings pour les valeurs manquantes
    const warnings: ImportWarning[] = [];

    if (existingLists) {
      // Warnings pour les types manquants
      missingValues.types.forEach(value => {
        warnings.push({
          row: 0,
          field: 'type',
          message: `La valeur "${value}" n'existe pas dans la liste des types`,
          value,
          suggestion: 'Voulez-vous créer cette valeur dans la liste des types ?',
        });
      });

      // Warnings pour les catégories manquantes
      missingValues.categories.forEach(value => {
        warnings.push({
          row: 0,
          field: 'categorie',
          message: `La valeur "${value}" n'existe pas dans la liste des catégories`,
          value,
          suggestion: 'Voulez-vous créer cette valeur dans la liste des catégories ?',
        });
      });

      // Warnings pour les priorités manquantes
      missingValues.priorities.forEach(value => {
        warnings.push({
          row: 0,
          field: 'priorite',
          message: `La valeur "${value}" n'existe pas dans la liste des priorités`,
          value,
          suggestion: 'Voulez-vous créer cette valeur dans la liste des priorités ?',
        });
      });

      // Warnings pour les localisations manquantes
      missingValues.locations.forEach(value => {
        warnings.push({
          row: 0,
          field: 'localisation',
          message: `La valeur "${value}" n'existe pas dans la liste des localisations`,
          value,
          suggestion: 'Voulez-vous créer cette valeur dans la liste des localisations ?',
        });
      });

      // Warnings pour les statuts manquants
      missingValues.statuses.forEach(value => {
        warnings.push({
          row: 0,
          field: 'statut',
          message: `La valeur "${value}" n'existe pas dans la liste des statuts`,
          value,
          suggestion: 'Voulez-vous créer cette valeur dans la liste des statuts ?',
        });
      });
    }

    return {
      success: errors.length === 0,
      data: validData,
      errors,
      warnings,
      missingValues,
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
      warnings: [],
      missingValues: {
        types: new Set(),
        categories: new Set(),
        priorities: new Set(),
        locations: new Set(),
        statuses: new Set(),
      },
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
      ? rawData.filter(
          row => row && typeof row === 'object' && Object.values(row).some(val => val !== '')
        )
      : rawData.filter(row => row && typeof row === 'object');

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
        if (error instanceof z.ZodError && Array.isArray(error.issues)) {
          error.issues.forEach(err => {
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
      warnings: [],
      missingValues: {
        types: new Set(),
        categories: new Set(),
        priorities: new Set(),
        locations: new Set(),
        statuses: new Set(),
      },
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
      warnings: [],
      missingValues: {
        types: new Set(),
        categories: new Set(),
        priorities: new Set(),
        locations: new Set(),
        statuses: new Set(),
      },
      stats: {
        total: 0,
        valid: 0,
        invalid: 1,
      },
    };
  }
};

/**
 * Convertit les données d'import en objets Intervention pour Firestore - VERSION V2.0 (21 colonnes)
 */
export const convertToInterventions = (
  data: InterventionImportRow[],
  establishmentId: string,
  currentUserId: string,
  currentUserName: string,
  establishmentUsers: Array<{ id: string; displayName: string; firstName: string; lastName: string }> = []
): Partial<Intervention>[] => {
  return data.map(row => {
    // ========== MATCHING UTILISATEURS ==========
    // Matcher le créateur par nom complet (case-insensitive)
    let createdBy = currentUserId;
    let createdByName = currentUserName;

    if (row.createur && row.createur.trim()) {
      const creatorName = row.createur.trim().toLowerCase();
      const matchedCreator = establishmentUsers.find(
        user => user.displayName.toLowerCase() === creatorName
      );

      if (matchedCreator) {
        createdBy = matchedCreator.id;
        createdByName = matchedCreator.displayName;
      }
      // Si non trouvé, on garde l'utilisateur actuel (fallback)
    }

    // Matcher le technicien par nom complet (case-insensitive)
    let assignedTo: string | undefined = undefined;
    let assignedToName: string | undefined = undefined;

    if (row.technicien && row.technicien.trim()) {
      const technicianName = row.technicien.trim().toLowerCase();
      const matchedTechnician = establishmentUsers.find(
        user => user.displayName.toLowerCase() === technicianName
      );

      if (matchedTechnician) {
        assignedTo = matchedTechnician.id;
        assignedToName = matchedTechnician.displayName;
      }
      // Si non trouvé, on laisse vide (ne sera pas assigné)
    }
    // Parse l'étage en nombre si possible
    let floorNumber: number | undefined = undefined;
    if (row.etage && row.etage.trim()) {
      const parsed = parseInt(row.etage);
      if (!isNaN(parsed)) {
        floorNumber = parsed;
      }
    }

    // Parse la durée estimée en nombre
    let estimatedDurationMinutes: number | undefined = undefined;
    if (row.dureeestimee && row.dureeestimee.trim()) {
      const parsed = parseInt(row.dureeestimee);
      if (!isNaN(parsed) && parsed > 0) {
        estimatedDurationMinutes = parsed;
      }
    }

    // Parser les dates
    const createdAt = row.datecreation ? parseDate(row.datecreation) : new Date();
    const scheduledAt =
      row.dateplanifiee && row.heureplanifiee
        ? parseDateTime(row.dateplanifiee, row.heureplanifiee)
        : row.dateplanifiee
          ? parseDate(row.dateplanifiee)
          : undefined;
    const dueDate = row.datelimite ? parseDate(row.datelimite) : undefined;

    // Parser les tags
    const tags = row.tags
      ? row.tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0)
          .map(label => ({
            id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            label,
            color: '#3b82f6', // Couleur par défaut bleu
          }))
      : [];

    // Construire l'objet intervention
    const intervention: Partial<Intervention> = {
      // ========== CHAMPS OBLIGATOIRES ==========
      title: row.titre,
      description: row.description,
      status: (row.statut || 'nouveau') as InterventionStatus,

      // ========== CHAMPS OPTIONNELS - Classification ==========
      type: (row.type && row.type.trim() ? row.type : undefined) as InterventionType | undefined,
      category: (row.categorie && row.categorie.trim() ? row.categorie : undefined) as InterventionCategory | undefined,
      priority: (row.priorite && row.priorite.trim() ? row.priorite : 'normal') as InterventionPriority,

      // ========== LOCALISATION ==========
      location: row.localisation || '',
      roomNumber: row.numerochambre || undefined,
      floor: floorNumber,
      building: row.batiment || undefined,

      // ========== DATES ==========
      createdAt: createdAt ? Timestamp.fromDate(createdAt) : Timestamp.now(),
      scheduledAt: scheduledAt ? Timestamp.fromDate(scheduledAt) : undefined,
      dueDate: dueDate ? Timestamp.fromDate(dueDate) : undefined,
      estimatedDuration: estimatedDurationMinutes,

      // ========== NOTES ==========
      internalNotes: row.notesinternes && row.notesinternes.trim() ? row.notesinternes : undefined,
      resolutionNotes:
        row.notesresolution && row.notesresolution.trim() ? row.notesresolution : undefined,

      // ========== MÉTADONNÉES ==========
      tags: tags.length > 0 ? tags : undefined,
      externalReference:
        row.referenceexterne && row.referenceexterne.trim() ? row.referenceexterne : undefined,

      // ========== SYSTÈME ==========
      establishmentId,
      createdBy,
      createdByName,

      // ========== ASSIGNATION ==========
      assignedTo: assignedTo || undefined,
      assignedToName: assignedToName || undefined,

      // ========== FLAGS ==========
      isUrgent: row.priorite?.toLowerCase() === 'urgent' || row.priorite?.toLowerCase() === 'critical',
      isBlocking: false, // Non géré dans V2.0
      requiresValidation: false,

      // ========== MÉTADONNÉES PAR DÉFAUT ==========
      photos: [],
      photosCount: 0,
      viewsCount: 0,
      isDeleted: false,
    };

    return intervention;
  });
};

/**
 * Convertit les données d'import en objets CreateRoomData
 */
export const convertToRooms = (data: RoomImportRow[]): CreateRoomData[] => {
  return data.map(row => {
    // Parse les équipements si présents
    let amenities: string[] | undefined = undefined;
    if (row.equipements && row.equipements.trim()) {
      amenities = row.equipements
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);
    }

    // Construire l'objet CreateRoomData
    const room: CreateRoomData = {
      number: row.numero,
      floor: parseInt(row.etage) || 0,
      type: row.type as RoomType,
      capacity: row.capacite,
      description: row.description || undefined,
      building: row.batiment && row.batiment.trim() ? row.batiment : undefined,
      amenities: amenities && amenities.length > 0 ? amenities : undefined,
    };

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

  const lines = ["RAPPORT D'ERREURS D'IMPORT", '='.repeat(50), ''];

  const errorsByRow = errors.reduce(
    (acc, error) => {
      if (!acc[error.row]) {
        acc[error.row] = [];
      }
      acc[error.row].push(error);
      return acc;
    },
    {} as Record<number, ImportError[]>
  );

  Object.entries(errorsByRow).forEach(([row, rowErrors]) => {
    lines.push(`Ligne ${row}:`);
    rowErrors.forEach(error => {
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
