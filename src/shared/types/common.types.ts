/**
 * Common Types
 * 
 * Types de base réutilisables dans toute l'application
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Timestamps Firebase
 */
export interface FirestoreTimestamp {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Document de base avec ID
 */
export interface BaseDocument {
  id: string;
}

/**
 * Document avec timestamps
 */
export interface TimestampedDocument extends BaseDocument, FirestoreTimestamp {}

/**
 * Document avec soft delete
 */
export interface SoftDeletableDocument extends TimestampedDocument {
  deletedAt?: Timestamp;
  deletedBy?: string;
  isDeleted: boolean;
}

/**
 * Métadonnées de création/modification
 */
export interface AuditMetadata {
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

/**
 * Pagination
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Résultat d'opération
 */
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Status générique
 */
export type Status = 'active' | 'inactive' | 'archived' | 'deleted';

/**
 * Adresse
 */
export interface Address {
  street?: string;
  city: string;
  postalCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Contact
 */
export interface Contact {
  email?: string;
  phone?: string;
  mobile?: string;
}

/**
 * Fichier/Photo
 */
export interface FileMetadata {
  id: string;
  name: string;
  url: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  thumbnailUrl?: string;
}

/**
 * Photo (alias pour FileMetadata)
 */
export type Photo = FileMetadata;

/**
 * Historique d'une action
 */
export interface HistoryEntry {
  id: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
}

/**
 * Tag
 */
export interface Tag {
  id: string;
  label: string;
  color?: string;
}

/**
 * Notification
 */
export interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Filtre générique
 */
export interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: unknown;
}

/**
 * Options de recherche
 */
export interface SearchOptions {
  query: string;
  filters?: Filter[];
  pagination?: PaginationParams;
}

/**
 * Statistiques de base
 */
export interface BaseStats {
  total: number;
  active: number;
  inactive: number;
}

/**
 * Période de temps
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Coordonnées GPS
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Options d'export
 */
export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  filters?: Filter[];
  fields?: string[];
  filename?: string;
}

/**
 * Signature électronique
 */
export interface Signature {
  id: string;
  imageUrl: string;
  signedBy: string;
  signedByName: string;
  signedAt: Timestamp;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Message/Note
 */
export interface Message {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  attachments?: FileMetadata[];
  isInternal?: boolean;
  readBy?: string[]; // Liste des userId qui ont lu le message
}

/**
 * Préférences utilisateur
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    widgets: string[];
  };
}

/**
 * Configuration de feature
 */
export interface FeatureConfig {
  enabled: boolean;
  settings?: Record<string, unknown>;
}

/**
 * Widget de dashboard
 */
export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config?: Record<string, unknown>;
}

/**
 * Type helper pour les champs optionnels
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Type helper pour les champs requis
 */
export type Required<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: T[P] };

/**
 * Type helper pour les valeurs d'un enum
 */
export type ValueOf<T> = T[keyof T];
