/**
 * Types pour le système de support/tickets
 */

import { Timestamp } from 'firebase/firestore';

export type SupportRequestType = 'bug' | 'question' | 'feature' | 'urgent' | 'other';
export type SupportRequestStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
export type SupportRequestDestination = 'internal' | 'external';

export interface SupportRequest {
  id: string;
  type: SupportRequestType;
  destination: SupportRequestDestination;
  subject: string;
  message: string;
  userId: string;
  userEmail: string;
  userName: string;
  establishmentId: string | null;
  establishmentName: string | null;
  status: SupportRequestStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  userAgent?: string;
  url?: string;
  /** Nombre de réponses sur le ticket */
  responseCount?: number;
  /** Timestamp de la dernière réponse */
  lastResponseAt?: Timestamp;
  /** ID de l'auteur de la dernière réponse (pour savoir si c'est une réponse admin ou user) */
  lastResponseBy?: string;
  /** Timestamp de la dernière lecture par l'utilisateur */
  userLastReadAt?: Timestamp;
  /** Timestamp de la dernière lecture par l'admin */
  adminLastReadAt?: Timestamp;
}

export interface SupportResponse {
  id: string;
  requestId: string;
  message: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  isAdmin: boolean;
  createdAt: Timestamp;
}

export const REQUEST_TYPE_LABELS: Record<SupportRequestType, string> = {
  bug: 'Bug',
  question: 'Question',
  feature: 'Suggestion',
  urgent: 'Urgent',
  other: 'Autre',
};

export const REQUEST_STATUS_LABELS: Record<SupportRequestStatus, string> = {
  new: 'Nouveau',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

export const REQUEST_STATUS_COLORS: Record<SupportRequestStatus, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
};

export const REQUEST_TYPE_COLORS: Record<SupportRequestType, string> = {
  bug: 'text-red-500',
  question: 'text-blue-500',
  feature: 'text-yellow-500',
  urgent: 'text-orange-500',
  other: 'text-gray-500',
};

export const REQUEST_DESTINATION_LABELS: Record<SupportRequestDestination, string> = {
  internal: 'Support interne (Admin)',
  external: 'Support technique (Développeur)',
};

export const REQUEST_DESTINATION_COLORS: Record<SupportRequestDestination, string> = {
  internal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  external: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
};
