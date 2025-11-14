/**
 * Intervention Types
 * 
 * Types complets pour la gestion des interventions
 */

import type { Timestamp } from 'firebase/firestore';
import type { 
  TimestampedDocument, 
  Photo, 
  HistoryEntry,
  Tag 
} from '@/shared/types/common.types';
import type { 
  InterventionStatus, 
  InterventionPriority, 
  InterventionType,
  InterventionCategory 
} from '@/shared/types/status.types';

/**
 * Intervention complète
 */
export interface Intervention extends TimestampedDocument {
  // Établissement
  establishmentId: string;
  
  // Informations de base
  title: string;
  description: string;
  type: InterventionType;
  category: InterventionCategory;
  priority: InterventionPriority;
  status: InterventionStatus;
  
  // Localisation
  roomNumber?: string;
  floor?: number;
  location: string; // Description textuelle du lieu
  building?: string;
  
  // Assignation
  assignedTo?: string; // userId du technicien
  assignedToName?: string; // Nom du technicien (dénormalisé)
  assignedAt?: Timestamp;
  createdBy: string; // userId du créateur
  createdByName?: string; // Nom du créateur (dénormalisé)
  
  // Dates et durées
  scheduledAt?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  estimatedDuration?: number; // en minutes
  actualDuration?: number; // en minutes
  
  // Photos
  photos: Photo[];
  photosCount: number;
  
  // Commentaires et notes
  internalNotes?: string; // Notes internes (non visibles par le client)
  resolutionNotes?: string; // Notes de résolution
  
  // Métadonnées
  tags?: Tag[];
  reference?: string; // Référence unique (ex: INT-2024-001)
  externalReference?: string; // Référence externe (PMS, etc.)
  
  // Statut avancé
  isUrgent: boolean;
  isBlocking: boolean; // Bloque-t-elle la chambre ?
  requiresValidation: boolean;
  validatedBy?: string;
  validatedAt?: Timestamp;
  
  // Statistiques
  viewsCount: number;
  lastViewedAt?: Timestamp;
  lastViewedBy?: string;
  
  // Soft delete
  isDeleted: boolean;
  deletedAt?: Timestamp;
  deletedBy?: string;
}

/**
 * Données pour créer une intervention
 */
export interface CreateInterventionData {
  title: string;
  description: string;
  type: InterventionType;
  category: InterventionCategory;
  priority: InterventionPriority;
  location: string;
  roomNumber?: string;
  floor?: number;
  building?: string;
  assignedTo?: string;
  scheduledAt?: Date;
  estimatedDuration?: number;
  internalNotes?: string;
  tags?: Tag[];
  isUrgent?: boolean;
  isBlocking?: boolean;
  photos?: File[];
}

/**
 * Données pour mettre à jour une intervention
 */
export interface UpdateInterventionData {
  title?: string;
  description?: string;
  type?: InterventionType;
  category?: InterventionCategory;
  priority?: InterventionPriority;
  status?: InterventionStatus;
  location?: string;
  roomNumber?: string;
  floor?: number;
  building?: string;
  assignedTo?: string;
  scheduledAt?: Date;
  estimatedDuration?: number;
  internalNotes?: string;
  resolutionNotes?: string;
  tags?: Tag[];
  isUrgent?: boolean;
  isBlocking?: boolean;
}

/**
 * Résumé d'intervention (pour listes)
 */
export interface InterventionSummary {
  id: string;
  title: string;
  type: InterventionType;
  category: InterventionCategory;
  priority: InterventionPriority;
  status: InterventionStatus;
  location: string;
  roomNumber?: string;
  assignedTo?: string;
  createdAt: Timestamp;
  scheduledAt?: Timestamp;
  isUrgent: boolean;
  photosCount: number;
}

/**
 * Filtres pour les interventions
 */
export interface InterventionFilters {
  status?: InterventionStatus[];
  priority?: InterventionPriority[];
  type?: InterventionType;
  category?: InterventionCategory;
  assignedTo?: string;
  createdBy?: string;
  isUrgent?: boolean;
  isBlocking?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string; // Recherche dans titre, description, roomNumber
  tags?: string[];
}

/**
 * Options de tri
 */
export type InterventionSortField = 
  | 'createdAt' 
  | 'updatedAt' 
  | 'scheduledAt' 
  | 'priority' 
  | 'status'
  | 'title';

export interface InterventionSortOptions {
  field: InterventionSortField;
  order: 'asc' | 'desc';
}

/**
 * Statistiques des interventions
 */
export interface InterventionStats {
  total: number;
  byStatus: Record<InterventionStatus, number>;
  byPriority: Record<InterventionPriority, number>;
  byType: Record<InterventionType, number>;
  urgent: number;
  blocking: number;
  averageCompletionTime: number; // en minutes
  completionRate: number; // pourcentage
}

/**
 * Changement de statut
 */
export interface StatusChangeData {
  newStatus: InterventionStatus;
  notes?: string;
  completedAt?: Date;
  resolutionNotes?: string;
}

/**
 * Assignation
 */
export interface AssignmentData {
  technicianId: string;
  scheduledAt?: Date;
  notes?: string;
}

/**
 * Configuration d'affichage de liste
 */
export interface InterventionListConfig {
  view: 'grid' | 'list' | 'compact';
  itemsPerPage: number;
  showPhotos: boolean;
  showAssignee: boolean;
  groupBy?: 'status' | 'priority' | 'type' | 'date';
}

// ============================================================================
// NOUVEAUX TYPES POUR FICHE INTERVENTION TECHNICIEN
// ============================================================================

/**
 * Catégorie de photo
 */
export type PhotoCategory = 'before' | 'during' | 'after';

/**
 * Photo catégorisée pour intervention
 */
export interface CategorizedPhoto extends Photo {
  category: PhotoCategory;
  caption?: string;
  uploadedBy: string;
  uploadedByName: string;
}

/**
 * Commentaire d'intervention
 */
export interface InterventionComment {
  id: string;
  interventionId: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  content: string;
  mentions?: string[]; // IDs des utilisateurs mentionnés
  attachments?: Photo[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isEdited: boolean;
  isInternal: boolean; // Commentaire interne (non visible par le client)
}

/**
 * Données pour créer un commentaire
 */
export interface CreateCommentData {
  content: string;
  mentions?: string[];
  attachments?: File[];
  isInternal?: boolean;
}

/**
 * Statut de pièce à commander
 */
export type PartStatus = 'to_order' | 'ordered' | 'received' | 'installed';

/**
 * Pièce détachée / matériel à commander
 */
export interface InterventionPart {
  id: string;
  interventionId: string;
  name: string;
  reference?: string;
  quantity: number;
  unitPrice?: number;
  supplier?: string;
  status: PartStatus;
  orderedAt?: Timestamp;
  receivedAt?: Timestamp;
  installedAt?: Timestamp;
  notes?: string;
  addedBy: string;
  addedByName: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Données pour créer une pièce
 */
export interface CreatePartData {
  name: string;
  reference?: string;
  quantity: number;
  unitPrice?: number;
  supplier?: string;
  notes?: string;
}

/**
 * Données pour mettre à jour une pièce
 */
export interface UpdatePartData {
  name?: string;
  reference?: string;
  quantity?: number;
  unitPrice?: number;
  supplier?: string;
  status?: PartStatus;
  notes?: string;
}

/**
 * Mode de suivi du temps
 */
export type TimeTrackingMode = 'manual' | 'timer';

/**
 * Session de temps (pour chronomètre)
 */
export interface TimeSession {
  id: string;
  interventionId: string;
  technicianId: string;
  technicianName: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  duration: number; // en minutes
  notes?: string;
  createdAt: Timestamp;
}

/**
 * Données pour créer une session de temps
 */
export interface CreateTimeSessionData {
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  notes?: string;
}

/**
 * Résumé du temps passé
 */
export interface TimeTrackingSummary {
  totalMinutes: number;
  sessionsCount: number;
  sessions: TimeSession[];
  estimatedMinutes?: number;
  variance?: number; // différence entre estimé et réel en %
}

/**
 * Email pour commande de pièces
 */
export interface PartsOrderEmail {
  interventionId: string;
  interventionTitle: string;
  parts: InterventionPart[];
  totalAmount: number;
  recipientEmail: string;
  recipientName?: string;
  message?: string;
}
