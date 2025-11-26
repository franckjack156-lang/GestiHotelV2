/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * ============================================================================
 * IMPORT SERVICE - INDEX
 * ============================================================================
 *
 * Service modulaire pour l'import de données depuis Excel
 * Architecture refactorisée pour meilleure maintenabilité
 */

// Types
export type {
  ImportResult,
  ImportError,
  ImportWarning,
  MissingListValues,
  UserMatchSuggestion,
  ReferenceMatchSuggestion,
  ImportMatchSuggestions,
  ImportOptions,
  UserInfo,
  ReferenceItem,
  ExistingLists,
  ReferenceMappings,
} from './types';

// Schemas
export { InterventionImportSchema, RoomImportSchema } from './schemas';
export type { InterventionImportRow, RoomImportRow } from './schemas';

// Parser
export { parseExcelFile, normalizeKey, normalizeObject, normalizeStatus } from './parser';

// Mappings
export { INTERVENTION_KEY_MAPPING, ROOM_KEY_MAPPING } from './mappings';

// Date utils
export { parseDate, parseDateTime } from './dateUtils';

// Matcher
export { existsInList, findUserMatches, findReferenceMatches } from './matcher';

// Validator
export { detectMissingValues } from './validator';

// Converter
export { convertToInterventions, convertToRooms } from './converter';

// Importer
export { importInterventions, importRooms } from './importer';

// Reports
export { generateErrorReport, downloadErrorReport } from './reports';
