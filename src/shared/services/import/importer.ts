/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * ============================================================================
 * IMPORT SERVICE - IMPORTER
 * ============================================================================
 *
 * Fonctions principales d'import pour interventions et chambres
 */

import { z } from 'zod';
import type { ImportResult, ImportOptions, ImportError, ImportWarning, ExistingLists } from './types';
import type { InterventionImportRow, RoomImportRow } from './schemas';
import { InterventionImportSchema, RoomImportSchema } from './schemas';
import { parseExcelFile, normalizeObject, normalizeStatus } from './parser';
import { INTERVENTION_KEY_MAPPING, ROOM_KEY_MAPPING } from './mappings';
import { detectMissingValues } from './validator';

/**
 * Importe des interventions depuis un fichier Excel
 */
export const importInterventions = async (
  file: File,
  options: ImportOptions = {},
  existingLists?: ExistingLists
): Promise<ImportResult<InterventionImportRow>> => {
  const { skipEmptyRows = true, maxRows = 1000, startRow = 0 } = options;

  try {
    const rawData = await parseExcelFile(file);

    // Filtrer lignes vides
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
      const rowNumber = index + startRow + 2;

      try {
        const normalizedRow = normalizeObject(row, INTERVENTION_KEY_MAPPING);
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

    // Détecter les valeurs manquantes
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
            buildings: new Map(),
            locations: new Map(),
            floors: new Map(),
            types: new Map(),
            categories: new Map(),
            priorities: new Map(),
          },
        };

    const missingValues = detectionResult.missing;
    const matchSuggestions = detectionResult.suggestions;

    // Générer des warnings
    const warnings: ImportWarning[] = [];

    if (existingLists) {
      // Statuts invalides = erreur bloquante
      missingValues.statuses.forEach(invalidStatus => {
        validData.forEach((row, index) => {
          if (row.statut && row.statut.toLowerCase() === invalidStatus.toLowerCase()) {
            errors.push({
              row: index + startRow + 2,
              field: 'statut',
              message: `Le statut "${invalidStatus}" n'existe pas dans la liste des statuts. Cette ligne sera rejetée.`,
              value: invalidStatus,
            });
          }
        });
      });

      // Filtrer les données valides
      const validDataFiltered = validData.filter(row => {
        if (!row.statut) return true;
        const normalizedStatus = normalizeStatus(row.statut);
        return !Array.from(missingValues.statuses).some(
          invalidStatus => normalizeStatus(invalidStatus) === normalizedStatus
        );
      });

      validData.length = 0;
      validData.push(...validDataFiltered);

      // Warnings pour les autres champs
      missingValues.types.forEach(value => {
        warnings.push({
          row: 0,
          field: 'type',
          message: `La valeur "${value}" n'existe pas dans la liste des types`,
          value,
          suggestion: 'Voulez-vous créer cette valeur dans la liste des types ?',
        });
      });

      missingValues.categories.forEach(value => {
        warnings.push({
          row: 0,
          field: 'categorie',
          message: `La valeur "${value}" n'existe pas dans la liste des catégories`,
          value,
          suggestion: 'Voulez-vous créer cette valeur dans la liste des catégories ?',
        });
      });

      missingValues.priorities.forEach(value => {
        warnings.push({
          row: 0,
          field: 'priorite',
          message: `La valeur "${value}" n'existe pas dans la liste des priorités`,
          value,
          suggestion: 'Voulez-vous créer cette valeur dans la liste des priorités ?',
        });
      });

      missingValues.locations.forEach(value => {
        warnings.push({
          row: 0,
          field: 'localisation',
          message: `La valeur "${value}" n'existe pas dans la liste des localisations`,
          value,
          suggestion: 'Voulez-vous créer cette valeur dans la liste des localisations ?',
        });
      });

      missingValues.rooms.forEach(value => {
        warnings.push({
          row: 0,
          field: 'numerochambre',
          message: `La chambre "${value}" n'existe pas dans votre liste de chambres`,
          value,
          suggestion: 'Voulez-vous créer cette chambre ?',
        });
      });

      missingValues.floors.forEach(value => {
        warnings.push({
          row: 0,
          field: 'etage',
          message: `L'étage "${value}" n'existe pas dans votre liste d'étages`,
          value,
          suggestion: 'Voulez-vous créer cet étage dans la liste ?',
        });
      });

      missingValues.buildings.forEach(value => {
        warnings.push({
          row: 0,
          field: 'batiment',
          message: `Le bâtiment "${value}" n'existe pas dans votre liste de bâtiments`,
          value,
          suggestion: 'Voulez-vous créer ce bâtiment dans la liste ?',
        });
      });

      missingValues.technicians.forEach(value => {
        warnings.push({
          row: 0,
          field: 'technicien',
          message: `Le technicien "${value}" n'a pas été trouvé dans votre liste d'utilisateurs`,
          value,
          suggestion: "Vérifiez l'orthographe du nom ou créez cet utilisateur",
        });
      });

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
    const rawData = await parseExcelFile(file);

    let data = skipEmptyRows
      ? rawData.filter(
          row => row && typeof row === 'object' && Object.values(row).some(val => val !== '')
        )
      : rawData.filter(row => row && typeof row === 'object');

    if (startRow > 0) {
      data = data.slice(startRow);
    }
    if (maxRows && data.length > maxRows) {
      data = data.slice(0, maxRows);
    }

    const validData: RoomImportRow[] = [];
    const errors: ImportError[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + startRow + 2;

      try {
        const normalizedRow = normalizeObject(row, ROOM_KEY_MAPPING);
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
