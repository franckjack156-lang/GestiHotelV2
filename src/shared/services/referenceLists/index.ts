/**
 * ============================================================================
 * REFERENCE LISTS - INDEX
 * ============================================================================
 *
 * Point d'entrée principal pour les listes de référence
 *
 * STATUT : Refactorisation en cours
 * Pour l'instant, réexporte tout depuis le service legacy
 *
 * TODO : Compléter la modularisation avec :
 * - crud.ts - Opérations CRUD
 * - items.ts - Gestion des items
 * - audit.ts - Audit trail
 * - analytics.ts - Analytics et KPIs
 * - validator.ts - Validation
 * - import.ts - Import/Export
 * - defaults.ts - Listes par défaut
 */

// Types
export type {
  EstablishmentReferenceLists,
  ListKey,
  ListConfig,
  ReferenceItem,
  CreateItemInput,
  UpdateItemInput,
  ImportOptions,
  ImportResult,
  ReferenceListsExportOptions,
  AuditEntry,
  AuditAction,
  ListAnalytics,
  ItemAnalytics,
  ValidationResult,
  SmartSuggestion,
  DuplicateListsInput,
} from './types';

// Constants
export { DEFAULT_VALIDATION_RULES } from './constants';

// Utils
export { removeUndefined } from './utils';

// Paths
export {
  getListsDocPath,
  getAuditCollectionPath,
  getVersionsCollectionPath,
  getDraftsCollectionPath,
} from './paths';

// Fonctions principales (temporairement depuis le service legacy)
export {
  getAllLists,
  getList,
  getActiveItems,
  initializeEmptyLists,
  createList,
  deleteList,
  addItem,
  updateItem,
  deactivateItem,
  deleteItem,
  reorderItems,
  exportToExcel,
  importFromFile,
  getListAnalytics,
  trackItemUsage,
  getAuditHistory,
  duplicateLists,
  validateItem,
  getSuggestions,
  logListsSummary,
  logListsCompact,
} from '../referenceListsService';
