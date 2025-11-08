/**
 * ============================================================================
 * REFERENCE LISTS - TYPES COMPLETS
 * ============================================================================
 * 
 * Système de listes de référence dynamiques pour GestiHôtel
 * 
 * Fonctionnalités:
 * - CRUD complet
 * - Import/Export
 * - Versionning
 * - Multi-langue
 * - Audit trail
 * - Analytics
 * - Templates
 * - Permissions
 * 
 * Destination: src/shared/types/reference-lists.types.ts
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Item de référence (valeur dans une liste)
 */
export interface ReferenceItem {
  id: string;
  value: string;              // Valeur technique (ex: "plumbing")
  label: string;              // Label affiché (ex: "Plomberie")
  color?: string;             // Couleur Tailwind (ex: "blue")
  icon?: string;              // Icône Lucide (ex: "Droplet")
  order: number;              // Ordre d'affichage
  isActive: boolean;          // Actif/Désactivé
  description?: string;       // Description optionnelle
  
  // Multi-langue
  labels?: Record<string, string>;  // { fr: "Plomberie", en: "Plumbing" }
  
  // Métadonnées
  metadata?: Record<string, any>;
  
  // Usage stats
  usageCount?: number;
  lastUsed?: Date;
  
  // Dates
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
}

/**
 * Configuration d'une liste
 */
export interface ListConfig {
  name: string;               // Nom de la liste
  description?: string;       // Description
  allowCustom: boolean;       // Permet d'ajouter des items custom
  isRequired: boolean;        // Champ obligatoire dans les forms
  isSystem: boolean;          // Liste système (non supprimable)
  
  // Items
  items: ReferenceItem[];
  
  // Contraintes
  minItems?: number;          // Nombre minimum d'items
  maxItems?: number;          // Nombre maximum d'items
  
  // Dépendances (listes conditionnelles)
  dependsOn?: {
    listKey: string;
    rules: ConditionalRule[];
  };
  
  // Multi-langue
  names?: Record<string, string>;
}

/**
 * Règle conditionnelle
 */
export interface ConditionalRule {
  when: string[];             // Valeurs qui déclenchent
  show: string[];             // Items à afficher
  hide?: string[];            // Items à masquer
}

/**
 * Document Firestore principal - TOUTES les listes
 */
export interface EstablishmentReferenceLists {
  // Meta
  establishmentId: string;
  version: number;
  lastModified: Date;
  modifiedBy: string;
  
  // TOUTES les listes
  lists: {
    // Interventions
    interventionTypes: ListConfig;
    interventionPriorities: ListConfig;
    interventionCategories: ListConfig;
    interventionStatuses: ListConfig;
    
    // Équipements
    equipmentTypes: ListConfig;
    equipmentBrands: ListConfig;
    equipmentLocations: ListConfig;
    
    // Chambres
    roomTypes: ListConfig;
    roomStatuses: ListConfig;
    bedTypes: ListConfig;
    
    // Fournisseurs
    supplierCategories: ListConfig;
    supplierTypes: ListConfig;
    
    // Maintenance
    maintenanceFrequencies: ListConfig;
    maintenanceTypes: ListConfig;
    
    // Documents
    documentCategories: ListConfig;
    documentTypes: ListConfig;
    
    // Finances
    expenseCategories: ListConfig;
    paymentMethods: ListConfig;
    
    // Staff
    staffRoles: ListConfig;
    staffDepartments: ListConfig;
    
    // Custom lists
    [key: string]: ListConfig;
  };
}

/**
 * Clés de listes typées
 */
export type ListKey = keyof EstablishmentReferenceLists['lists'];

/**
 * Clés de listes prédéfinies
 */
export const PREDEFINED_LIST_KEYS: ListKey[] = [
  'interventionTypes',
  'interventionPriorities',
  'interventionCategories',
  'interventionStatuses',
  'equipmentTypes',
  'equipmentBrands',
  'equipmentLocations',
  'roomTypes',
  'roomStatuses',
  'bedTypes',
  'supplierCategories',
  'supplierTypes',
  'maintenanceFrequencies',
  'maintenanceTypes',
  'documentCategories',
  'documentTypes',
  'expenseCategories',
  'paymentMethods',
  'staffRoles',
  'staffDepartments',
];

// ============================================================================
// AUDIT & HISTORY
// ============================================================================

/**
 * Entrée d'audit
 */
export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  
  action: AuditAction;
  
  listKey: string;
  listName: string;
  itemId?: string;
  
  before: any;
  after: any;
  
  comment?: string;
  
  // Métadonnées techniques
  ipAddress?: string;
  userAgent?: string;
}

export type AuditAction =
  | 'CREATE_LIST'
  | 'DELETE_LIST'
  | 'UPDATE_LIST'
  | 'ADD_ITEM'
  | 'UPDATE_ITEM'
  | 'DELETE_ITEM'
  | 'REORDER_ITEMS'
  | 'IMPORT'
  | 'EXPORT'
  | 'RESTORE'
  | 'DUPLICATE';

/**
 * Version d'une liste
 */
export interface ListVersion {
  version: number;
  timestamp: Date;
  createdBy: string;
  lists: Record<string, ListConfig>;
  changelog: string;
  tags: string[];
}

// ============================================================================
// IMPORT / EXPORT
// ============================================================================

/**
 * Options d'import
 */
export interface ImportOptions {
  format: 'xlsx' | 'csv' | 'json';
  overwrite: boolean;
  merge: boolean;
  validate: boolean;
  dryRun: boolean;
}

/**
 * Résultat d'import
 */
export interface ImportResult {
  success: boolean;
  itemsImported: number;
  itemsSkipped: number;
  itemsUpdated: number;
  errors: ImportError[];
  warnings: string[];
}

/**
 * Erreur d'import
 */
export interface ImportError {
  row: number;
  field: string;
  value: any;
  error: string;
}

/**
 * Aperçu d'import
 */
export interface ImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  preview: ReferenceItem[];
  errors: ImportError[];
}

/**
 * Options d'export
 */
export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'json';
  includeInactive: boolean;
  includeMetadata: boolean;
  listKeys?: ListKey[];
}

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * Template de listes
 */
export interface ListTemplate {
  id: string;
  name: string;
  description: string;
  category: 'hospitality' | 'student' | 'corporate' | 'custom';
  lists: Record<string, ListConfig>;
  isPublic: boolean;
  
  // Usage
  usageCount: number;
  rating: number;
  
  // Dates
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Statistiques d'une liste
 */
export interface ListAnalytics {
  listKey: string;
  listName: string;
  
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  
  itemStats: ItemAnalytics[];
  
  // Suggestions
  unusedItems: string[];
  popularItems: string[];
  duplicateCandidates: [string, string][];
  
  // Tendances
  usageTrend: 'up' | 'down' | 'stable';
  lastAnalyzed: Date;
}

/**
 * Statistiques d'un item
 */
export interface ItemAnalytics {
  itemId: string;
  itemValue: string;
  itemLabel: string;
  
  usageCount: number;
  lastUsed?: Date;
  trendingUp: boolean;
  
  usageByMonth: {
    month: string;
    count: number;
  }[];
}

// ============================================================================
// PERMISSIONS
// ============================================================================

/**
 * Permission sur les listes
 */
export enum ListPermission {
  VIEW = 'lists.view',
  CREATE_LIST = 'lists.create',
  EDIT_LIST = 'lists.edit',
  DELETE_LIST = 'lists.delete',
  ADD_ITEM = 'lists.items.add',
  EDIT_ITEM = 'lists.items.edit',
  DELETE_ITEM = 'lists.items.delete',
  REORDER = 'lists.items.reorder',
  IMPORT = 'lists.import',
  EXPORT = 'lists.export',
  VIEW_HISTORY = 'lists.history.view',
  RESTORE = 'lists.history.restore',
  VIEW_ANALYTICS = 'lists.analytics.view',
}

/**
 * Permissions par rôle
 */
export const ROLE_PERMISSIONS: Record<string, ListPermission[]> = {
  SUPER_ADMIN: Object.values(ListPermission),
  ADMIN: [
    ListPermission.VIEW,
    ListPermission.CREATE_LIST,
    ListPermission.EDIT_LIST,
    ListPermission.ADD_ITEM,
    ListPermission.EDIT_ITEM,
    ListPermission.DELETE_ITEM,
    ListPermission.REORDER,
    ListPermission.IMPORT,
    ListPermission.EXPORT,
    ListPermission.VIEW_HISTORY,
    ListPermission.VIEW_ANALYTICS,
  ],
  MANAGER: [
    ListPermission.VIEW,
    ListPermission.ADD_ITEM,
    ListPermission.EDIT_ITEM,
    ListPermission.EXPORT,
  ],
  USER: [ListPermission.VIEW],
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Règles de validation
 */
export interface ValidationRules {
  value: {
    pattern: RegExp;
    minLength: number;
    maxLength: number;
    unique: boolean;
    reserved: string[];
  };
  label: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  color: {
    pattern: RegExp;
    allowed: string[];
  };
  icon: {
    pattern: RegExp;
    mustExist: boolean;
  };
}

/**
 * Résultat de validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// DRAFT MODE
// ============================================================================

/**
 * Brouillon de modifications
 */
export interface ListDraft {
  id: string;
  establishmentId: string;
  listKey: string;
  
  changes: ListConfig;
  
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewComment?: string;
}

// ============================================================================
// SUGGESTIONS
// ============================================================================

/**
 * Suggestions intelligentes
 */
export interface SmartSuggestion {
  type: 'icon' | 'color' | 'value' | 'duplicate' | 'translation';
  field: string;
  suggestion: any;
  confidence: number;
  reason: string;
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

/**
 * Usage d'un item
 */
export interface ItemUsage {
  itemId: string;
  itemValue: string;
  listKey: string;
  
  usedAt: Date;
  usedBy: string;
  context: 'intervention' | 'room' | 'equipment' | 'other';
  contextId: string;
}

// ============================================================================
// INPUT TYPES (pour formulaires)
// ============================================================================

export interface CreateListInput {
  name: string;
  description?: string;
  allowCustom: boolean;
  isRequired: boolean;
}

export interface UpdateListInput extends Partial<CreateListInput> {
  listKey: string;
}

export interface CreateItemInput {
  value: string;
  label: string;
  color?: string;
  icon?: string;
  description?: string;
  labels?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface UpdateItemInput extends Partial<CreateItemInput> {
  itemId: string;
  isActive?: boolean;
  order?: number;
}

export interface ReorderItemsInput {
  listKey: string;
  itemIds: string[];
}

export interface DuplicateListsInput {
  fromEstablishmentId: string;
  toEstablishmentId: string;
  listKeys?: ListKey[];
  overwrite: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Couleurs autorisées (Tailwind)
 */
export const ALLOWED_COLORS = [
  'gray', 'red', 'orange', 'amber', 'yellow', 'lime', 'green',
  'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet',
  'purple', 'fuchsia', 'pink', 'rose'
] as const;

export type AllowedColor = typeof ALLOWED_COLORS[number];

/**
 * Labels français des listes
 */
export const LIST_LABELS: Record<ListKey | string, string> = {
  interventionTypes: "Types d'intervention",
  interventionPriorities: 'Priorités',
  interventionCategories: "Catégories d'intervention",
  interventionStatuses: "Statuts d'intervention",
  equipmentTypes: "Types d'équipement",
  equipmentBrands: "Marques d'équipement",
  equipmentLocations: "Emplacements d'équipement",
  roomTypes: 'Types de chambres',
  roomStatuses: 'Statuts de chambres',
  bedTypes: 'Types de lits',
  supplierCategories: 'Catégories de fournisseurs',
  supplierTypes: 'Types de fournisseurs',
  maintenanceFrequencies: 'Fréquences de maintenance',
  maintenanceTypes: 'Types de maintenance',
  documentCategories: 'Catégories de documents',
  documentTypes: 'Types de documents',
  expenseCategories: 'Catégories de dépenses',
  paymentMethods: 'Moyens de paiement',
  staffRoles: 'Rôles du personnel',
  staffDepartments: 'Départements',
};

/**
 * Configuration de validation par défaut
 */
export const DEFAULT_VALIDATION_RULES: ValidationRules = {
  value: {
    pattern: /^[a-z0-9_]+$/,
    minLength: 2,
    maxLength: 50,
    unique: true,
    reserved: ['system', 'admin', 'test', 'default'],
  },
  label: {
    minLength: 2,
    maxLength: 100,
    required: true,
  },
  color: {
    pattern: /^[a-z]+$/,
    allowed: [...ALLOWED_COLORS],
  },
  icon: {
    pattern: /^[A-Z][a-zA-Z0-9]+$/,
    mustExist: true,
  },
};
