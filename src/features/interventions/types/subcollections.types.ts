/**
 * ============================================================================
 * INTERVENTION SUB-COLLECTIONS TYPES
 * ============================================================================
 *
 * Types pour les sous-collections Firestore des interventions:
 * - comments: Commentaires et discussions
 * - photos: Photos avec catégorisation (before/during/after)
 * - parts: Pièces nécessaires à commander
 * - timeSessions: Sessions de suivi du temps
 * - history: Historique des modifications
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// COMMENTAIRES
// ============================================================================

export interface Comment {
  id: string;
  interventionId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  isInternal: boolean; // Commentaire visible uniquement en interne
  attachments?: string[]; // URLs des pièces jointes
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isEdited: boolean;
  isDeleted: boolean;
}

export interface CreateCommentData {
  content: string;
  isInternal?: boolean;
  attachments?: string[];
}

export interface UpdateCommentData {
  content: string;
}

// ============================================================================
// PHOTOS
// ============================================================================

export type PhotoCategory = 'before' | 'during' | 'after';

export interface Photo {
  id: string;
  interventionId: string;
  url: string;
  thumbnailUrl?: string;
  category: PhotoCategory;
  caption?: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Timestamp;
  metadata?: {
    size: number;
    type: string;
    width?: number;
    height?: number;
  };
}

export interface UploadPhotoData {
  file: File;
  category: PhotoCategory;
  caption?: string;
}

// ============================================================================
// PIÈCES
// ============================================================================

export type PartStatus = 'to_order' | 'ordered' | 'received' | 'installed';

export interface Part {
  id: string;
  interventionId: string;
  name: string;
  reference?: string;
  quantity: number;
  unitPrice: number;
  supplier?: string;
  notes?: string;
  status: PartStatus;
  orderedAt?: Timestamp;
  receivedAt?: Timestamp;
  installedAt?: Timestamp;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreatePartData {
  name: string;
  reference?: string;
  quantity: number;
  unitPrice: number;
  supplier?: string;
  notes?: string;
  status?: PartStatus;
}

export interface UpdatePartData {
  name?: string;
  reference?: string;
  quantity?: number;
  unitPrice?: number;
  supplier?: string;
  notes?: string;
  status?: PartStatus;
}

// ============================================================================
// SESSIONS DE TEMPS
// ============================================================================

export interface TimeSession {
  id: string;
  interventionId: string;
  technicianId: string;
  technicianName: string;
  duration: number; // en minutes
  startedAt: Timestamp;
  endedAt?: Timestamp;
  isManual: boolean; // true si saisie manuelle, false si chronomètre
  notes?: string;
  createdAt: Timestamp;
}

export interface CreateTimeSessionData {
  duration: number;
  startedAt?: Date;
  endedAt?: Date;
  isManual: boolean;
  notes?: string;
}

// ============================================================================
// HISTORIQUE
// ============================================================================

export type HistoryEventType =
  | 'created'
  | 'status_change'
  | 'assigned'
  | 'updated'
  | 'comment_added'
  | 'photo_added'
  | 'part_added'
  | 'part_status_changed'
  | 'time_added'
  | 'completed'
  | 'validated'
  | 'email_sent';

export interface HistoryEvent {
  id: string;
  interventionId: string;
  type: HistoryEventType;
  description: string;
  userId: string;
  userName: string;
  userRole?: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
  metadata?: Record<string, any>; // Données supplémentaires spécifiques à l'événement
  createdAt: Timestamp;
}

export interface CreateHistoryEventData {
  type: HistoryEventType;
  description: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// EMAIL COMMANDE PIÈCES
// ============================================================================

export interface PartsOrderEmail {
  interventionReference: string;
  interventionTitle: string;
  parts: Part[];
  totalCost: number;
  requestedBy: string;
  requestedByName: string;
  notes?: string;
}
