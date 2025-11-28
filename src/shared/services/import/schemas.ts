/**
 * ============================================================================
 * IMPORT SERVICE - SCHEMAS
 * ============================================================================
 *
 * Schémas de validation Zod pour l'import Excel
 */

import { z } from 'zod';

/**
 * Schema pour l'import d'interventions - VERSION 2.0 (21 colonnes)
 */
export const InterventionImportSchema = z.object({
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
export const RoomImportSchema = z.object({
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
  equipements: z.string().optional().default(''),
});

export type InterventionImportRow = z.infer<typeof InterventionImportSchema>;
export type RoomImportRow = z.infer<typeof RoomImportSchema>;
