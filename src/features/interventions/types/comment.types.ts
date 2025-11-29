/**
 * Comment Types
 *
 * Types pour les commentaires sur les interventions
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Commentaire sur une intervention
 */
export interface Comment {
  id: string;
  interventionId: string;
  establishmentId: string;

  // Contenu
  content: string;
  contentType: 'text' | 'system'; // text = commentaire utilisateur, system = action système

  // Auteur
  authorId: string;
  authorName: string;
  authorRole: string;
  authorPhotoURL?: string;

  // Métadonnées
  mentions?: string[]; // IDs des utilisateurs mentionnés (@user)
  attachments?: CommentAttachment[];

  // Édition
  isEdited: boolean;
  editedAt?: Timestamp;

  // Suppression (soft delete)
  isDeleted: boolean;
  deletedAt?: Timestamp;
  deletedBy?: string;

  // Dates
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Pièce jointe d'un commentaire
 */
export interface CommentAttachment {
  id: string;
  name: string;
  url: string;
  type: string; // MIME type
  size: number;
}

/**
 * Données pour créer un commentaire
 */
export interface CreateCommentData {
  content: string;
  contentType?: 'text' | 'system';
  mentions?: string[];
  attachments?: File[];
}

/**
 * Données pour mettre à jour un commentaire
 */
export interface UpdateCommentData {
  content: string;
}

/**
 * Action système (génère un commentaire système automatique)
 */
export type SystemAction =
  | 'status_changed'
  | 'assigned'
  | 'unassigned'
  | 'priority_changed'
  | 'scheduled'
  | 'started'
  | 'completed'
  | 'cancelled'
  | 'reopened';

/**
 * Données d'une action système
 */
export interface SystemActionData {
  action: SystemAction;
  metadata?: Record<string, unknown>;
  userId: string;
  userName: string;
}
