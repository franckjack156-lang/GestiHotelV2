/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Notification Types
 *
 * Types pour le système de notifications push et in-app
 */

import type { Timestamp } from 'firebase/firestore';
import type { TimestampedDocument } from '@/shared/types/common.types';

/**
 * Type de notification
 */
export type NotificationType =
  | 'intervention_created'
  | 'intervention_assigned'
  | 'intervention_status_changed'
  | 'intervention_completed'
  | 'intervention_comment'
  | 'intervention_overdue'
  | 'intervention_urgent'
  | 'sla_at_risk'
  | 'sla_breached'
  | 'message_received'
  | 'mention'
  | 'room_blocked'
  | 'room_unblocked'
  | 'validation_required'
  | 'system'
  | 'other';

/**
 * Priorité de notification
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Canal de notification
 */
export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms';

/**
 * Notification
 */
export interface Notification extends TimestampedDocument {
  // Destinataire
  userId: string;
  establishmentId: string;

  // Contenu
  type: NotificationType;
  title: string;
  body?: string; // Peut être undefined, utiliser message à la place
  message?: string; // Alias principal pour le contenu
  icon?: string;
  image?: string;

  // Priorité et canal
  priority: NotificationPriority;
  channels: NotificationChannel[];

  // État
  read: boolean;
  readAt?: Timestamp;
  clicked?: boolean;
  clickedAt?: Timestamp;

  // Action
  actionUrl?: string; // URL vers laquelle rediriger au clic
  actionLabel?: string; // Label du bouton d'action

  // Données additionnelles (pour navigation)
  data?: {
    interventionId?: string;
    messageId?: string;
    userId?: string;
    roomId?: string;
    [key: string]: any;
  };

  // Métadonnées
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  failedAt?: Timestamp;
  errorMessage?: string;

  // Groupement
  groupKey?: string; // Pour regrouper des notifications similaires
  groupCount?: number; // Nombre de notifications dans le groupe

  // Expiration
  expiresAt?: Timestamp;
}

/**
 * Données pour créer une notification
 */
export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, any>;
  groupKey?: string;
  expiresAt?: Date;
}

/**
 * Préférences de notification utilisateur
 */
export interface NotificationPreferences {
  userId: string;
  establishmentId: string;

  // Canaux activés
  enableInApp: boolean;
  enablePush: boolean;
  enableEmail: boolean;
  enableSMS: boolean;

  // Types de notifications activées
  interventionCreated: boolean;
  interventionAssigned: boolean;
  interventionStatusChanged: boolean;
  interventionCompleted: boolean;
  interventionComment: boolean;
  interventionOverdue: boolean;
  interventionUrgent: boolean;
  slaAtRisk: boolean;
  slaBreached: boolean;
  messageReceived: boolean;
  mention: boolean;
  roomBlocked: boolean;
  system: boolean;

  // Périodes de silence (Do Not Disturb)
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format (ex: "22:00")
  quietHoursEnd?: string; // HH:mm format (ex: "08:00")
  quietDays?: number[]; // 0-6 (dimanche-samedi)

  // Regroupement
  groupSimilar: boolean;
  groupInterval?: number; // Minutes

  // Métadonnées
  updatedAt: Timestamp;
}

/**
 * Token de notification push (FCM)
 */
export interface NotificationToken {
  userId: string;
  token: string;
  platform: 'web' | 'ios' | 'android';
  device?: string;
  browser?: string;
  createdAt: Timestamp;
  lastUsedAt: Timestamp;
  isActive: boolean;
}

/**
 * Statistiques de notifications
 */
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  readRate: number; // %
  clickRate: number; // %
}

/**
 * Filtres de notifications
 */
export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * Options de tri
 */
export type NotificationSortField = 'createdAt' | 'priority' | 'read';

export interface NotificationSortOptions {
  field: NotificationSortField;
  order: 'asc' | 'desc';
}

/**
 * Notification push payload (Firebase Cloud Messaging)
 */
export interface PushNotificationPayload {
  notification: {
    title: string;
    body: string;
    icon?: string;
    image?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
  };
  data?: Record<string, string>; // FCM data must be string key-value pairs
  fcmOptions?: {
    link?: string;
  };
}

/**
 * Résultat d'envoi de notification
 */
export interface NotificationSendResult {
  success: boolean;
  notificationId?: string;
  error?: string;
  channels: {
    in_app?: {
      success: boolean;
      error?: string;
    };
    push?: {
      success: boolean;
      error?: string;
      messageId?: string;
    };
    email?: {
      success: boolean;
      error?: string;
    };
    sms?: {
      success: boolean;
      error?: string;
    };
  };
}
