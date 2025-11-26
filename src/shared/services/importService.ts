/**
 * ============================================================================
 * IMPORT SERVICE - LEGACY EXPORT
 * ============================================================================
 *
 * Ce fichier maintient la compatibilité avec l'ancienne API
 * Toutes les fonctions sont maintenant importées depuis le module refactorisé
 *
 * @deprecated Importez directement depuis '@/shared/services/import' pour le nouveau code
 */

export {
  // Types
  type ImportResult,
  type ImportError,
  type ImportWarning,
  type MissingListValues,
  type UserMatchSuggestion,
  type ReferenceMatchSuggestion,
  type ImportMatchSuggestions,
  type ImportOptions,

  // Schemas
  InterventionImportSchema,
  RoomImportSchema,
  type InterventionImportRow,
  type RoomImportRow,

  // Fonctions principales
  parseExcelFile,
  importInterventions,
  importRooms,
  convertToInterventions,
  convertToRooms,
  generateErrorReport,
  downloadErrorReport,
} from './import';
