/**
 * Intervention Types
 *
 * Types complets pour la gestion des interventions
 */

import type { Timestamp } from 'firebase/firestore';
import type { TimestampedDocument, Photo, Tag } from '@/shared/types/common.types';
import type {
  InterventionStatus,
  InterventionPriority,
  InterventionType,
  InterventionCategory,
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
  assignedTo?: string; // userId du technicien (deprecated - utiliser assignedToIds)
  assignedToName?: string; // Nom du technicien (dénormalisé - deprecated)
  assignedToIds?: string[]; // Liste des userIds des techniciens assignés
  assignedToNames?: string[]; // Noms des techniciens assignés (dénormalisés)
  assignedAt?: Timestamp;
  createdBy: string; // userId du créateur
  createdByName?: string; // Nom du créateur (dénormalisé)

  // Dates et durées
  scheduledAt?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  estimatedDuration?: number; // en minutes
  actualDuration?: number; // en minutes

  // SLA et deadlines
  dueDate?: Timestamp; // Date limite de résolution
  slaTarget?: number; // Objectif SLA en minutes (calculé selon priorité)
  responseTime?: number; // Temps de première réponse en minutes
  resolutionTime?: number; // Temps de résolution en minutes
  slaStatus?: 'on_track' | 'at_risk' | 'breached'; // Statut SLA
  slaBreachedAt?: Timestamp; // Date de dépassement du SLA
  firstResponseAt?: Timestamp; // Date de première réponse (assignation ou premier commentaire)

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

  // Récurrence
  isRecurring?: boolean;
  recurrenceConfig?: RecurrenceConfig;
  recurrenceGroupId?: string;
  parentInterventionId?: string;
  occurrenceIndex?: number;

  // Google Calendar Integration
  googleCalendarEventId?: string; // ID de l'événement dans Google Calendar
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
  assignedTo?: string; // Single technician (legacy - utiliser assignedToIds)
  assignedToIds?: string[]; // Multiple technicians
  scheduledAt?: Date;
  estimatedDuration?: number;
  internalNotes?: string;
  tags?: Tag[];
  isUrgent?: boolean;
  isBlocking?: boolean;
  photos?: File[];
  dueDate?: Date; // Date limite personnalisée

  // Champs optionnels pour import historique
  createdBy?: string; // Permet de spécifier le créateur pour les données historiques
  createdByName?: string; // Nom du créateur pour les données historiques
  createdAt?: Date | Timestamp; // Date de création pour les données historiques
  assignedToName?: string; // Nom du technicien assigné pour les données historiques (legacy)
  assignedToNames?: string[]; // Noms des techniciens assignés pour les données historiques
  assignedAt?: Date | Timestamp; // Date d'assignation pour les données historiques
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
  assignedTo?: string; // Single technician (legacy)
  assignedToIds?: string[]; // Multiple technicians
  scheduledAt?: Date;
  estimatedDuration?: number;
  internalNotes?: string;
  resolutionNotes?: string;
  tags?: Tag[];
  isUrgent?: boolean;
  isBlocking?: boolean;
  dueDate?: Date;
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

/**
 * Statut SLA
 */
export type SLAStatus = 'on_track' | 'at_risk' | 'breached';

/**
 * Informations SLA calculées
 */
export interface SLAInfo {
  status: SLAStatus;
  targetMinutes: number;
  elapsedMinutes: number;
  remainingMinutes: number;
  percentageUsed: number;
  dueDate: Date;
  isBreached: boolean;
  breachedAt?: Date;
  responseTime?: number;
  resolutionTime?: number;
}

// ============================================================================
// TYPES POUR INTERVENTIONS RÉCURRENTES
// ============================================================================

/**
 * Type de récurrence
 */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Configuration de récurrence
 */
export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number; // tous les X jours/semaines/mois/années
  count?: number; // nombre d'occurrences (si défini, prend priorité sur endDate)
  endDate?: Date; // date de fin de récurrence
  daysOfWeek?: number[]; // 0-6 (dimanche-samedi) pour récurrence hebdomadaire
  dayOfMonth?: number; // 1-31 pour récurrence mensuelle
  monthOfYear?: number; // 1-12 pour récurrence annuelle
}

/**
 * Métadonnées de récurrence (stockées dans Firestore)
 */
export interface RecurrenceMetadata {
  isRecurring: boolean;
  recurrenceConfig?: RecurrenceConfig;
  recurrenceGroupId?: string; // ID pour regrouper les interventions de la même série
  parentInterventionId?: string; // ID de l'intervention d'origine
  occurrenceIndex?: number; // Numéro dans la série (0 = première)
}
