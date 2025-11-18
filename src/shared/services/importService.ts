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
  matchSuggestions?: ImportMatchSuggestions; // Suggestions de correspondance pour techniciens/créateurs
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
  rooms: Set<string>; // Numéros de chambre inconnus
  floors: Set<string>; // Étages inconnus
  buildings: Set<string>; // Bâtiments inconnus
  technicians: Set<string>; // Noms de techniciens non trouvés
  creators: Set<string>; // Noms de créateurs non trouvés
}

/**
 * Suggestion de correspondance pour un nom dans Excel
 */
export interface UserMatchSuggestion {
  excelName: string; // Nom dans le fichier Excel (ex: "Michel")
  userId: string; // ID de l'utilisateur suggéré
  userName: string; // Nom complet de l'utilisateur (ex: "Michel Man...")
  matchScore: number; // Score de correspondance (0-1)
  matchType: 'exact' | 'partial' | 'fuzzy'; // Type de correspondance
}

/**
 * Suggestions de correspondance pour l'import
 */
export interface ImportMatchSuggestions {
  technicians: Map<string, UserMatchSuggestion[]>; // excelName -> suggestions
  creators: Map<string, UserMatchSuggestion[]>; // excelName -> suggestions
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
  titre: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  statut: z.string().min(1, 'Le statut est requis'),

  // ============================================================================
  // CHAMP DESCRIPTION (optionnel mais recommandé)
  // ============================================================================
  description: z
    .string()
    .max(5000, 'La description ne peut pas dépasser 5000 caractères')
    .optional()
    .default(''),

  // ============================================================================
  // CHAMPS OPTIONNELS - Classification (4)
  // ============================================================================
  type: z.string().optional().default(''),
  categorie: z.string().optional().default(''),
  priorite: z.string().optional().default(''),
  localisation: z
    .string()
    .max(200, 'La localisation ne peut pas dépasser 200 caractères')
    .optional()
    .default(''),

  // ============================================================================
  // CHAMPS OPTIONNELS - Localisation détaillée (3)
  // ============================================================================
  numerochambre: z
    .string()
    .max(20, 'Le numéro de chambre ne peut pas dépasser 20 caractères')
    .optional()
    .default(''),
  etage: z.string().optional().default(''),
  batiment: z
    .string()
    .max(50, 'Le bâtiment ne peut pas dépasser 50 caractères')
    .optional()
    .default(''),

  // ============================================================================
  // CHAMPS OPTIONNELS - Personnes (2)
  // ============================================================================
  technicien: z
    .string()
    .max(100, 'Le nom du technicien ne peut pas dépasser 100 caractères')
    .optional()
    .default(''),
  createur: z
    .string()
    .max(100, 'Le nom du créateur ne peut pas dépasser 100 caractères')
    .optional()
    .default(''),

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
  notesinternes: z
    .string()
    .max(2000, 'Les notes internes ne peuvent pas dépasser 2000 caractères')
    .optional()
    .default(''),
  notesresolution: z
    .string()
    .max(2000, 'Les notes de résolution ne peuvent pas dépasser 2000 caractères')
    .optional()
    .default(''),
  datelimite: z.string().optional().default(''),
  tags: z.string().optional().default(''),
  referenceexterne: z
    .string()
    .max(100, 'La référence externe ne peut pas dépasser 100 caractères')
    .optional()
    .default(''),
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
const normalizeObject = (
  obj: Record<string, unknown>,
  keyMapping: Record<string, string>
): Record<string, unknown> => {
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

// ============================================================================
// NORMALISATION DES STATUTS (FR → EN)
// ============================================================================

/**
 * Map des statuts français vers anglais (pour compatibilité import Excel)
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
  reporte: 'cancelled', // Reporté = annulé pour le moment
  reportee: 'cancelled',
};

/**
 * Normalise un statut (gère le français et l'anglais)
 */
const normalizeStatus = (status: string): string => {
  const normalized = status.toLowerCase().trim();
  // Si le statut est en français, le traduire
  return STATUS_FR_TO_EN[normalized] || normalized;
};

// ============================================================================
// MAPPING DES COLONNES EXCEL VERS SCHÉMA
// ============================================================================

/**
 * Mapping des colonnes pour interventions - VERSION 2.0 (21 colonnes)
 */
const INTERVENTION_KEY_MAPPING: Record<string, string> = {
  // Titre
  titre: 'titre',
  title: 'titre',
  // HEADERS avec astérisques obligatoires
  'titre*': 'titre', // Template peut avoir "TITRE *"

  // Description
  description: 'description',
  desc: 'description',
  'description*': 'description', // Template peut avoir "DESCRIPTION *"

  // Statut (nouveau dans V2)
  statut: 'statut',
  status: 'statut',
  etat: 'statut',
  'statut*': 'statut', // Template peut avoir "STATUT *"

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
  numero_chambre: 'numerochambre', // Template utilise numero_chambre avec underscore
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
  technicienprenomnom: 'technicien', // HEADER Excel: "TECHNICIEN (Prenom Nom)"

  // Créateur (nouveau dans V2)
  createur: 'createur',
  creator: 'createur',
  creepar: 'createur',
  createurprenomnom: 'createur', // HEADER Excel: "CREATEUR (Prenom Nom)"

  // Date création (nouveau dans V2)
  datecreation: 'datecreation',
  date_creation: 'datecreation', // Template utilise date_creation avec underscore
  creationdate: 'datecreation',
  datecrea: 'datecreation',
  datecreationjjmmaaaa: 'datecreation', // HEADER Excel: "DATE CREATION (JJ/MM/AAAA)"

  // Date planifiée
  dateplanifiee: 'dateplanifiee',
  date_planifiee: 'dateplanifiee', // Template utilise date_planifiee avec underscore
  scheduleddate: 'dateplanifiee',
  dateprevue: 'dateplanifiee',
  dateplanifieejjmmaaaa: 'dateplanifiee', // HEADER Excel: "DATE PLANIFIEE (JJ/MM/AAAA)"

  // Heure planifiée
  heureplanifiee: 'heureplanifiee',
  heure_planifiee: 'heureplanifiee', // Template utilise heure_planifiee avec underscore
  scheduledtime: 'heureplanifiee',
  heure: 'heureplanifiee',
  heureplanifieehhmm: 'heureplanifiee', // HEADER Excel: "HEURE PLANIFIEE (HH:MM)"

  // Durée estimée
  dureeestimee: 'dureeestimee',
  duree_estimee: 'dureeestimee', // Template utilise duree_estimee avec underscore
  estimatedduration: 'dureeestimee',
  duree: 'dureeestimee',
  dureeestimeeminutes: 'dureeestimee', // HEADER Excel: "DUREE ESTIMEE (minutes)"

  // Notes internes
  notesinternes: 'notesinternes',
  notes_internes: 'notesinternes', // Template utilise notes_internes avec underscore
  internalnotes: 'notesinternes',
  notes: 'notesinternes',

  // Notes résolution (nouveau dans V2)
  notesresolution: 'notesresolution',
  notes_resolution: 'notesresolution', // Template utilise notes_resolution avec underscore
  resolutionnotes: 'notesresolution',

  // Date limite
  datelimite: 'datelimite',
  date_limite: 'datelimite', // Template utilise date_limite avec underscore
  duedate: 'datelimite',
  deadline: 'datelimite',
  datelimitejjmmaaaa: 'datelimite', // HEADER Excel: "DATE LIMITE (JJ/MM/AAAA)"

  // Tags (nouveau dans V2)
  tags: 'tags',
  etiquettes: 'tags',
  tagsseparesparvirgules: 'tags', // HEADER Excel: "TAGS (separés par virgules)"

  // Référence externe
  referenceexterne: 'referenceexterne',
  reference_externe: 'referenceexterne', // Template utilise reference_externe avec underscore
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
 * Vérifie si une valeur existe dans une liste (insensible à la casse)
 * @param value - Valeur à chercher
 * @param list - Liste de valeurs existantes
 * @returns true si la valeur existe (insensible à la casse), false sinon
 */
const existsInList = (value: string, list: string[]): boolean => {
  const normalizedValue = value.trim().toLowerCase();
  return list.some(item => item.toLowerCase() === normalizedValue);
};

/**
 * Trouve les correspondances partielles pour un nom dans la liste d'utilisateurs
 * @param excelName Nom depuis Excel (ex: "Michel")
 * @param users Liste des utilisateurs
 * @param filterTechnician Si true, filtre uniquement les techniciens
 * @returns Liste de suggestions triées par score décroissant
 */
const findUserMatches = (
  excelName: string,
  users: Array<{ id: string; displayName: string; firstName: string; lastName: string; isTechnician?: boolean }>,
  filterTechnician: boolean = false
): UserMatchSuggestion[] => {
  const searchName = excelName.trim().toLowerCase();
  const suggestions: UserMatchSuggestion[] = [];

  // Filtrer les utilisateurs si nécessaire
  const filteredUsers = filterTechnician
    ? users.filter(u => u.isTechnician === true)
    : users;

  for (const user of filteredUsers) {
    const fullName = user.displayName.toLowerCase();
    const firstName = user.firstName.toLowerCase();
    const lastName = user.lastName.toLowerCase();

    let matchScore = 0;
    let matchType: 'exact' | 'partial' | 'fuzzy' = 'fuzzy';

    // 1. Correspondance exacte (100%)
    if (fullName === searchName) {
      matchScore = 1.0;
      matchType = 'exact';
    }
    // 2. Correspondance exacte prénom ou nom (90%)
    else if (firstName === searchName || lastName === searchName) {
      matchScore = 0.9;
      matchType = 'partial';
    }
    // 3. Nom complet commence par le texte recherché (80%)
    else if (fullName.startsWith(searchName)) {
      matchScore = 0.8;
      matchType = 'partial';
    }
    // 4. Prénom commence par le texte recherché (75%)
    else if (firstName.startsWith(searchName)) {
      matchScore = 0.75;
      matchType = 'partial';
    }
    // 5. Nom commence par le texte recherché (70%)
    else if (lastName.startsWith(searchName)) {
      matchScore = 0.7;
      matchType = 'partial';
    }
    // 6. Nom complet contient le texte recherché (60%)
    else if (fullName.includes(searchName)) {
      matchScore = 0.6;
      matchType = 'fuzzy';
    }
    // 7. Similarité par mots (50-40%)
    else {
      const searchWords = searchName.split(/\s+/);
      const nameWords = fullName.split(/\s+/);

      let matchingWords = 0;
      for (const searchWord of searchWords) {
        if (nameWords.some(nameWord => nameWord.includes(searchWord) || searchWord.includes(nameWord))) {
          matchingWords++;
        }
      }

      if (matchingWords > 0) {
        matchScore = 0.4 + (matchingWords / searchWords.length) * 0.1;
        matchType = 'fuzzy';
      }
    }

    // Ajouter seulement si score >= 70% (éviter les faux positifs comme "Entreprise externe" vs "Michel Man")
    if (matchScore >= 0.7) {
      suggestions.push({
        excelName,
        userId: user.id,
        userName: user.displayName,
        matchScore,
        matchType,
      });
    }
  }

  // Trier par score décroissant
  return suggestions.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Détecte les valeurs qui n'existent pas dans les listes de référence
 * ET génère des suggestions de correspondance pour techniciens/créateurs
 */
const detectMissingValues = (
  data: InterventionImportRow[],
  existingLists: {
    types: string[];
    categories: string[];
    priorities: string[];
    locations: string[];
    statuses: string[];
    rooms?: string[]; // Optionnel : numéros de chambre existants
    floors?: string[]; // Optionnel : étages existants
    buildings?: string[]; // Optionnel : bâtiments existants
    users?: Array<{
      id: string;
      displayName: string;
      firstName: string;
      lastName: string;
      isTechnician?: boolean;
    }>; // Optionnel : utilisateurs complets pour matching
    creators?: string[]; // Optionnel : liste de référence des créateurs
    technicians?: string[]; // Optionnel : liste de référence des techniciens
  }
): { missing: MissingListValues; suggestions: ImportMatchSuggestions } => {
  const missing: MissingListValues = {
    types: new Set(),
    categories: new Set(),
    priorities: new Set(),
    locations: new Set(),
    statuses: new Set(),
    rooms: new Set(),
    floors: new Set(),
    buildings: new Set(),
    technicians: new Set(),
    creators: new Set(),
  };

  data.forEach(row => {
    // Vérifier TYPE (si renseigné) - INSENSIBLE À LA CASSE
    if (row.type && row.type.trim() && !existsInList(row.type, existingLists.types)) {
      missing.types.add(row.type);
    }

    // Vérifier CATEGORIE (si renseignée) - INSENSIBLE À LA CASSE
    if (
      row.categorie &&
      row.categorie.trim() &&
      !existsInList(row.categorie, existingLists.categories)
    ) {
      missing.categories.add(row.categorie);
    }

    // Vérifier PRIORITE (si renseignée) - INSENSIBLE À LA CASSE
    if (
      row.priorite &&
      row.priorite.trim() &&
      !existsInList(row.priorite, existingLists.priorities)
    ) {
      missing.priorities.add(row.priorite);
    }

    // Vérifier LOCALISATION (si renseignée) - INSENSIBLE À LA CASSE
    if (
      row.localisation &&
      row.localisation.trim() &&
      !existsInList(row.localisation, existingLists.locations)
    ) {
      missing.locations.add(row.localisation);
    }

    // Vérifier STATUT (obligatoire) - INSENSIBLE À LA CASSE + MAPPING FR/EN
    if (row.statut && row.statut.trim()) {
      const normalizedStatus = normalizeStatus(row.statut);
      if (!existsInList(normalizedStatus, existingLists.statuses)) {
        missing.statuses.add(row.statut); // Garder la valeur originale pour le message d'erreur
      }
    }

    // Vérifier NUMERO DE CHAMBRE (si liste fournie) - INSENSIBLE À LA CASSE
    if (existingLists.rooms && row.numerochambre && row.numerochambre.trim()) {
      if (!existsInList(row.numerochambre, existingLists.rooms)) {
        missing.rooms.add(row.numerochambre);
      }
    }

    // Vérifier ETAGE (si liste fournie) - INSENSIBLE À LA CASSE
    if (existingLists.floors && row.etage && row.etage.trim()) {
      if (!existsInList(row.etage, existingLists.floors)) {
        missing.floors.add(row.etage);
      }
    }

    // Vérifier BATIMENT (si liste fourni) - INSENSIBLE À LA CASSE
    if (existingLists.buildings && row.batiment && row.batiment.trim()) {
      if (!existsInList(row.batiment, existingLists.buildings)) {
        missing.buildings.add(row.batiment);
      }
    }

    // Vérifier TECHNICIEN (chercher dans users ET dans la liste de référence technicians)
    if (row.technicien && row.technicien.trim()) {
      const technicianName = row.technicien.trim().toLowerCase();

      // Chercher dans les utilisateurs
      const foundInUsers = existingLists.users?.some(
        user => user.displayName.toLowerCase() === technicianName
      ) || false;

      // Chercher dans la liste de référence technicians
      const foundInList = existingLists.technicians
        ? existsInList(row.technicien, existingLists.technicians)
        : false;

      // Si non trouvé ni dans users ni dans la liste de référence
      if (!foundInUsers && !foundInList) {
        missing.technicians.add(row.technicien);
      }
    }

    // Vérifier CREATEUR (chercher dans users ET dans la liste de référence creators)
    if (row.createur && row.createur.trim()) {
      const creatorName = row.createur.trim().toLowerCase();

      // Chercher dans les utilisateurs
      const foundInUsers = existingLists.users?.some(
        user => user.displayName.toLowerCase() === creatorName
      ) || false;

      // Chercher dans la liste de référence creators
      const foundInList = existingLists.creators
        ? existsInList(row.createur, existingLists.creators)
        : false;

      // Si non trouvé ni dans users ni dans la liste de référence
      if (!foundInUsers && !foundInList) {
        missing.creators.add(row.createur);
      }
    }
  });

  // Générer les suggestions de correspondance pour techniciens et créateurs
  const suggestions: ImportMatchSuggestions = {
    technicians: new Map(),
    creators: new Map(),
  };

  console.log('\n🔍 DEBUG SUGGESTIONS:');
  console.log('  Nombre de techniciens manquants:', missing.technicians.size);
  console.log('  Nombre de créateurs manquants:', missing.creators.size);
  console.log('  Nombre d\'utilisateurs disponibles:', existingLists.users?.length || 0);

  // NOUVELLE LOGIQUE: Générer des suggestions pour TOUS les techniciens/créateurs dans l'Excel
  // (pas seulement les manquants), pour permettre la correspondance partielle
  const allTechniciansInExcel = new Set<string>();
  const allCreatorsInExcel = new Set<string>();

  data.forEach(row => {
    if (row.technicien && row.technicien.trim()) {
      allTechniciansInExcel.add(row.technicien.trim());
    }
    if (row.createur && row.createur.trim()) {
      allCreatorsInExcel.add(row.createur.trim());
    }
  });

  console.log('  Nombre total de techniciens dans Excel:', allTechniciansInExcel.size);
  console.log('  Nombre total de créateurs dans Excel:', allCreatorsInExcel.size);

  // Générer suggestions pour TOUS les techniciens (y compris ceux avec correspondance partielle)
  if (existingLists.users && existingLists.users.length > 0) {
    allTechniciansInExcel.forEach(techName => {
      console.log(`  Recherche suggestions pour technicien: "${techName}"`);
      const matches = findUserMatches(techName, existingLists.users!, true); // Filtrer uniquement les techniciens
      console.log(`    → ${matches.length} correspondance(s) trouvée(s)`);

      // Ne proposer des suggestions QUE si pas de correspondance exacte (score < 100%)
      const hasExactMatch = matches.some(m => m.matchScore === 1.0);
      if (matches.length > 0 && !hasExactMatch) {
        suggestions.technicians.set(techName, matches);
        console.log(`    → Suggestions ajoutées (pas de match exact):`, matches.map(m => `${m.userName} (${Math.round(m.matchScore * 100)}%)`));
        // Ajouter aussi aux valeurs manquantes pour permettre la création
        missing.technicians.add(techName);
      } else if (hasExactMatch) {
        console.log(`    → Match exact trouvé, pas de suggestions nécessaires`);
      }
    });

    // Générer suggestions pour TOUS les créateurs (y compris ceux avec correspondance partielle)
    allCreatorsInExcel.forEach(creatorName => {
      console.log(`  Recherche suggestions pour créateur: "${creatorName}"`);
      const matches = findUserMatches(creatorName, existingLists.users!, false); // Tous les utilisateurs
      console.log(`    → ${matches.length} correspondance(s) trouvée(s)`);

      // Ne proposer des suggestions QUE si pas de correspondance exacte (score < 100%)
      const hasExactMatch = matches.some(m => m.matchScore === 1.0);
      if (matches.length > 0 && !hasExactMatch) {
        suggestions.creators.set(creatorName, matches);
        console.log(`    → Suggestions ajoutées (pas de match exact):`, matches.map(m => `${m.userName} (${Math.round(m.matchScore * 100)}%)`));
        // Ajouter aussi aux valeurs manquantes pour permettre la création
        missing.creators.add(creatorName);
      } else if (hasExactMatch) {
        console.log(`    → Match exact trouvé, pas de suggestions nécessaires`);
      }
    });
  } else {
    console.log('  ⚠️ Aucun utilisateur disponible pour générer des suggestions');
  }

  return { missing, suggestions };
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
    rooms?: string[];
    floors?: string[];
    buildings?: string[];
    users?: Array<{
      id: string;
      displayName: string;
      firstName: string;
      lastName: string;
      isTechnician?: boolean;
    }>;
    creators?: string[];
    technicians?: string[];
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

        // 🔍 DEBUG - Afficher les clés brutes et normalisées pour les 3 premières lignes
        if (index < 3) {
          console.log(`\n🔍 DEBUG LIGNE ${index + 1}:`);
          console.log('  Clés brutes Excel:', Object.keys(row));
          console.log('  Clés normalisées:', Object.keys(row).map(k => `${k} → ${normalizeKey(k)}`));
          console.log('  Valeurs importantes:');
          console.log('    - createur (brut):', row['createur'] || row['CREATEUR'] || row['CREATEUR (Prenom Nom)']);
          console.log('    - date_creation (brut):', row['date_creation'] || row['DATE CREATION'] || row['DATE CREATION (JJ/MM/AAAA)']);
          console.log('    - technicien (brut):', row['technicien'] || row['TECHNICIEN'] || row['TECHNICIEN (Prenom Nom)']);
          console.log('  Row normalisée après mapping:');
          console.log('    - createur:', normalizedRow['createur']);
          console.log('    - datecreation:', normalizedRow['datecreation']);
          console.log('    - technicien:', normalizedRow['technicien']);
        }

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
    const detectionResult = existingLists
      ? detectMissingValues(validData, existingLists)
      : {
          missing: {
            types: new Set<string>(),
            categories: new Set<string>(),
            priorities: new Set<string>(),
            locations: new Set<string>(),
            statuses: new Set<string>(),
            rooms: new Set<string>(),
            floors: new Set<string>(),
            buildings: new Set<string>(),
            technicians: new Set<string>(),
            creators: new Set<string>(),
          },
          suggestions: {
            technicians: new Map(),
            creators: new Map(),
          },
        };

    const missingValues = detectionResult.missing;
    const matchSuggestions = detectionResult.suggestions;

    // Générer des warnings pour les valeurs manquantes
    const warnings: ImportWarning[] = [];

    if (existingLists) {
      // ⚠️ STATUTS INVALIDES = ERREUR BLOQUANTE
      // Les lignes avec statut invalide doivent être rejetées
      missingValues.statuses.forEach(invalidStatus => {
        // Trouver toutes les lignes avec ce statut invalide
        validData.forEach((row, index) => {
          if (row.statut && row.statut.toLowerCase() === invalidStatus.toLowerCase()) {
            errors.push({
              row: index + startRow + 2, // +2 pour header + 0-indexed
              field: 'statut',
              message: `Le statut "${invalidStatus}" n'existe pas dans la liste des statuts. Cette ligne sera rejetée.`,
              value: invalidStatus,
            });
          }
        });
      });

      // Filtrer les données valides : retirer les lignes avec statut invalide
      const validDataFiltered = validData.filter(row => {
        if (!row.statut) return true; // Pas de statut = on garde (sera géré par Zod)
        const normalizedStatus = normalizeStatus(row.statut);
        // Vérifier si le statut normalisé est dans les statuts manquants
        return !Array.from(missingValues.statuses).some(
          invalidStatus => normalizeStatus(invalidStatus) === normalizedStatus
        );
      });

      // Remplacer validData par la version filtrée
      validData.length = 0;
      validData.push(...validDataFiltered);

      // ✅ AUTRES CHAMPS = WARNINGS NON-BLOQUANTS
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

      // Warnings pour les numéros de chambre inconnus
      missingValues.rooms.forEach(value => {
        warnings.push({
          row: 0,
          field: 'numerochambre',
          message: `La chambre "${value}" n'existe pas dans votre liste de chambres`,
          value,
          suggestion: 'Voulez-vous créer cette chambre ?',
        });
      });

      // Warnings pour les étages inconnus
      missingValues.floors.forEach(value => {
        warnings.push({
          row: 0,
          field: 'etage',
          message: `L'étage "${value}" n'existe pas dans votre liste d'étages`,
          value,
          suggestion: 'Voulez-vous créer cet étage dans la liste ?',
        });
      });

      // Warnings pour les bâtiments inconnus
      missingValues.buildings.forEach(value => {
        warnings.push({
          row: 0,
          field: 'batiment',
          message: `Le bâtiment "${value}" n'existe pas dans votre liste de bâtiments`,
          value,
          suggestion: 'Voulez-vous créer ce bâtiment dans la liste ?',
        });
      });

      // Warnings pour les techniciens inconnus
      missingValues.technicians.forEach(value => {
        warnings.push({
          row: 0,
          field: 'technicien',
          message: `Le technicien "${value}" n'a pas été trouvé dans votre liste d'utilisateurs`,
          value,
          suggestion: "Vérifiez l'orthographe du nom ou créez cet utilisateur",
        });
      });

      // Warnings pour les créateurs inconnus
      missingValues.creators.forEach(value => {
        warnings.push({
          row: 0,
          field: 'createur',
          message: `Le créateur "${value}" n'a pas été trouvé dans votre liste d'utilisateurs`,
          value,
          suggestion:
            "L'intervention sera créée avec votre nom. Vérifiez l'orthographe ou créez cet utilisateur",
        });
      });
    }

    return {
      success: errors.length === 0,
      data: validData,
      errors,
      warnings,
      missingValues,
      matchSuggestions,
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
        rooms: new Set(),
        floors: new Set(),
        buildings: new Set(),
        technicians: new Set(),
        creators: new Set(),
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
        rooms: new Set(),
        floors: new Set(),
        buildings: new Set(),
        technicians: new Set(),
        creators: new Set(),
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
        rooms: new Set(),
        floors: new Set(),
        buildings: new Set(),
        technicians: new Set(),
        creators: new Set(),
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
  establishmentUsers: Array<{
    id: string;
    displayName: string;
    firstName: string;
    lastName: string;
  }> = [],
  userMappings?: Map<string, string> // Mappings excelName -> userId
): Partial<Intervention>[] => {
  return data.map((row, index) => {
    // 🔍 DEBUG - Première ligne seulement
    if (index === 0) {
      console.log('\n🔍 DEBUG CONVERSION LIGNE 1:');
      console.log('  row.createur:', row.createur);
      console.log('  row.datecreation:', row.datecreation);
      console.log('  row.technicien:', row.technicien);
      console.log('  establishmentUsers:', establishmentUsers.map(u => u.displayName));
    }
    // ========== MATCHING UTILISATEURS ==========
    // Matcher le créateur par nom complet (case-insensitive)
    // NOUVELLE LOGIQUE: Si trouvé dans users → utiliser l'ID utilisateur
    // Si NON trouvé → utiliser le nom depuis Excel (sera créé dans la liste de référence)
    let createdBy = currentUserId;
    let createdByName = currentUserName;

    if (row.createur && row.createur.trim()) {
      const excelCreatorName = row.createur.trim();

      // Vérifier d'abord si l'utilisateur a mappé ce nom vers un utilisateur existant
      const mappedUserId = userMappings?.get(excelCreatorName);

      if (mappedUserId) {
        // Utiliser le mapping défini par l'utilisateur
        const mappedUser = establishmentUsers.find(u => u.id === mappedUserId);
        if (mappedUser) {
          createdBy = mappedUser.id;
          createdByName = mappedUser.displayName;
          if (index === 0) {
            console.log(`  🎯 Créateur mappé: "${excelCreatorName}" → ${mappedUser.displayName} (${mappedUser.id})`);
          }
        }
      } else {
        // Logique de matching automatique (correspondance exacte)
        const creatorName = excelCreatorName.toLowerCase();
        const matchedCreator = establishmentUsers.find(
          user => user.displayName.toLowerCase() === creatorName
        );

        if (matchedCreator) {
          createdBy = matchedCreator.id;
          createdByName = matchedCreator.displayName;
          if (index === 0) {
            console.log(`  ✅ Créateur trouvé dans users: "${excelCreatorName}" → ${matchedCreator.displayName} (${matchedCreator.id})`);
          }
        } else {
          // NOUVELLE LOGIQUE: Garder le nom depuis Excel (sera dans la liste de référence)
          createdBy = currentUserId; // Utiliser l'utilisateur actuel pour createdBy (requis)
          createdByName = excelCreatorName; // Garder le nom depuis Excel pour l'affichage
          if (index === 0) {
            console.log(`  ⚠️ Créateur NON trouvé dans users: "${excelCreatorName}" → utilisera la liste de référence "creators"`);
          }
        }
      }
    } else {
      if (index === 0) {
        console.log(`  ℹ️ Pas de créateur dans Excel (utilisateur actuel par défaut: ${currentUserName})`);
      }
    }

    // Matcher le technicien par nom complet (case-insensitive)
    // NOUVELLE LOGIQUE: Si trouvé dans users → utiliser l'ID utilisateur
    // Si NON trouvé → utiliser le nom depuis Excel (sera créé dans la liste de référence)
    let assignedTo: string | undefined = undefined;
    let assignedToName: string | undefined = undefined;
    let assignedAt: Date | undefined = undefined;

    if (row.technicien && row.technicien.trim()) {
      const excelTechnicianName = row.technicien.trim();

      // Vérifier d'abord si l'utilisateur a mappé ce nom vers un utilisateur existant
      const mappedUserId = userMappings?.get(excelTechnicianName);

      if (mappedUserId) {
        // Utiliser le mapping défini par l'utilisateur
        const mappedUser = establishmentUsers.find(u => u.id === mappedUserId);
        if (mappedUser) {
          assignedTo = mappedUser.id;
          assignedToName = mappedUser.displayName;
          // Si un technicien est assigné, utiliser la date de création comme date d'assignation
          const parsedDate = row.datecreation ? parseDate(row.datecreation) : null;
          assignedAt = parsedDate || new Date();
          if (index === 0) {
            console.log(`  🎯 Technicien mappé: "${excelTechnicianName}" → ${mappedUser.displayName} (${mappedUser.id})`);
          }
        }
      } else {
        // Logique de matching automatique (correspondance exacte)
        const technicianName = excelTechnicianName.toLowerCase();
        const matchedTechnician = establishmentUsers.find(
          user => user.displayName.toLowerCase() === technicianName
        );

        if (matchedTechnician) {
          assignedTo = matchedTechnician.id;
          assignedToName = matchedTechnician.displayName;
          // Si un technicien est assigné, utiliser la date de création comme date d'assignation
          const parsedDate = row.datecreation ? parseDate(row.datecreation) : null;
          assignedAt = parsedDate || new Date();
          if (index === 0) {
            console.log(`  ✅ Technicien trouvé dans users: "${excelTechnicianName}" → ${matchedTechnician.displayName} (${matchedTechnician.id})`);
          }
        } else {
          // NOUVELLE LOGIQUE: Garder le nom depuis Excel (sera dans la liste de référence)
          assignedTo = undefined; // Pas d'ID utilisateur
          assignedToName = excelTechnicianName; // Garder le nom depuis Excel pour l'affichage
          // Si un technicien est assigné, utiliser la date de création comme date d'assignation
          const parsedDate = row.datecreation ? parseDate(row.datecreation) : null;
          assignedAt = parsedDate || new Date();
          if (index === 0) {
            console.log(`  ⚠️ Technicien NON trouvé dans users: "${excelTechnicianName}" → utilisera la liste de référence "technicians"`);
          }
        }
      }
    } else {
      if (index === 0) {
        console.log(`  ℹ️ Pas de technicien dans Excel (pas d'assignation)`);
      }
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

    if (index === 0) {
      console.log('\n  📅 PARSING DES DATES:');
      console.log('    - row.datecreation:', row.datecreation);
      console.log('    - createdAt (parsé):', createdAt);
      console.log('    - row.dateplanifiee:', row.dateplanifiee);
      console.log('    - scheduledAt (parsé):', scheduledAt);
    }

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
      status: normalizeStatus(row.statut || 'nouveau') as InterventionStatus,

      // ========== CHAMPS OPTIONNELS - Classification ==========
      type: (row.type && row.type.trim() ? row.type : undefined) as InterventionType | undefined,
      category: (row.categorie && row.categorie.trim() ? row.categorie : undefined) as
        | InterventionCategory
        | undefined,
      priority: (row.priorite && row.priorite.trim()
        ? row.priorite
        : 'normal') as InterventionPriority,

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
      assignedAt: assignedAt ? Timestamp.fromDate(assignedAt) : undefined,

      // ========== FLAGS ==========
      isUrgent:
        row.priorite?.toLowerCase() === 'urgent' || row.priorite?.toLowerCase() === 'critical',
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
