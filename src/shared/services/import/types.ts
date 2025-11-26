/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * ============================================================================
 * IMPORT SERVICE - TYPES
 * ============================================================================
 *
 * Types et interfaces pour l'import de données Excel
 */

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  warnings: ImportWarning[];
  missingValues: MissingListValues;
  matchSuggestions?: ImportMatchSuggestions;
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
  rooms: Set<string>;
  floors: Set<string>;
  buildings: Set<string>;
  technicians: Set<string>;
  creators: Set<string>;
}

export interface UserMatchSuggestion {
  excelName: string;
  userId: string;
  userName: string;
  matchScore: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
}

export interface ReferenceMatchSuggestion {
  excelValue: string;
  referenceValue: string;
  referenceLabel: string;
  matchScore: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
}

export interface ImportMatchSuggestions {
  technicians: Map<string, UserMatchSuggestion[]>;
  creators: Map<string, UserMatchSuggestion[]>;
  buildings: Map<string, ReferenceMatchSuggestion[]>;
  locations: Map<string, ReferenceMatchSuggestion[]>;
  floors: Map<string, ReferenceMatchSuggestion[]>;
  types: Map<string, ReferenceMatchSuggestion[]>;
  categories: Map<string, ReferenceMatchSuggestion[]>;
  priorities: Map<string, ReferenceMatchSuggestion[]>;
}

export interface ImportOptions {
  skipEmptyRows?: boolean;
  maxRows?: number;
  startRow?: number;
}

export interface UserInfo {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  isTechnician?: boolean;
}

export interface ReferenceItem {
  value: string;
  label: string;
  isActive: boolean;
}

export interface ExistingLists {
  types: string[];
  categories: string[];
  priorities: string[];
  locations: string[];
  statuses: string[];
  rooms?: string[];
  floors?: string[];
  buildings?: string[];
  users?: UserInfo[];
  creators?: string[];
  technicians?: string[];
  buildingsList?: ReferenceItem[];
  locationsList?: ReferenceItem[];
  floorsList?: ReferenceItem[];
  typesList?: ReferenceItem[];
  categoriesList?: ReferenceItem[];
  prioritiesList?: ReferenceItem[];
}

export interface ReferenceMappings {
  buildings?: Map<string, string>;
  locations?: Map<string, string>;
  floors?: Map<string, string>;
  types?: Map<string, string>;
  categories?: Map<string, string>;
  priorities?: Map<string, string>;
}
