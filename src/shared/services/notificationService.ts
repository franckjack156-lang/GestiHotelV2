/**
 * ============================================================================
 * NOTIFICATION SERVICE - COMPLET
 * ============================================================================
 *
 * Service pour gérer les notifications in-app
 * - Création de notifications
 * - Marquer comme lu
 * - Récupération temps réel
 * - Types de notifications multiples
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { logger } from '@/core/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType =
  | 'intervention_assigned'
  | 'intervention_updated'
  | 'intervention_completed'
  | 'intervention_urgent'
  | 'message_received'
  | 'status_changed'
  | 'room_blocked'
  | 'room_unblocked'
  | 'mention'
  | 'validation_required';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  establishmentId: string;
  isRead: boolean;

  // Lien vers l'entité concernée
  relatedId?: string; // ID de l'intervention, message, etc.
  relatedType?: 'intervention' | 'message' | 'user' | 'room';

  // Métadonnées
  metadata?: Record<string, any>;

  // Dates
  createdAt: Timestamp;
  readAt?: Timestamp;
}

interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  establishmentId: string;
  relatedId?: string;
  relatedType?: 'intervention' | 'message' | 'user' | 'room';
  metadata?: Record<string, any>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  intervention_assigned: '📋',
  intervention_updated: '✏️',
  intervention_completed: '✅',
  intervention_urgent: '🚨',
  message_received: '💬',
  status_changed: '🔄',
  room_blocked: '🔒',
  room_unblocked: '🔓',
  mention: '👤',
  validation_required: '⚠️',
};

// ============================================================================
// HELPERS
// ============================================================================

const getNotificationsCollection = () => {
  return collection(db, 'notifications');
};

// ============================================================================
// CREATE
// ============================================================================

/**
 * Créer une notification
 */
export const createNotification = async (data: CreateNotificationData): Promise<string> => {
  try {
    const notificationData = {
      ...data,
      isRead: false,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(getNotificationsCollection(), notificationData);
    logger.debug('✅ Notification créée:', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('❌ Erreur création notification:', error);
    throw new Error('Impossible de créer la notification');
  }
};

/**
 * Créer une notification pour plusieurs utilisateurs
 */
export const createNotifications = async (
  userIds: string[],
  data: Omit<CreateNotificationData, 'userId'>
): Promise<string[]> => {
  try {
    const batch = writeBatch(db);
    const ids: string[] = [];

    userIds.forEach(userId => {
      const docRef = doc(getNotificationsCollection());
      ids.push(docRef.id);

      batch.set(docRef, {
        ...data,
        userId,
        isRead: false,
        createdAt: Timestamp.now(),
      });
    });

    await batch.commit();
    logger.debug(`✅ ${ids.length} notifications créées`);
    return ids;
  } catch (error) {
    logger.error('❌ Erreur création notifications:', error);
    throw new Error('Impossible de créer les notifications');
  }
};

// ============================================================================
// NOTIFICATIONS SPÉCIFIQUES
// ============================================================================

/**
 * Notifier l'assignation d'une intervention
 */
export const notifyInterventionAssigned = async (
  userId: string,
  establishmentId: string,
  interventionId: string,
  interventionTitle: string,
  assignedBy: string
): Promise<string> => {
  return createNotification({
    type: 'intervention_assigned',
    title: 'Nouvelle intervention assignée',
    message: `Vous avez été assigné à l'intervention "${interventionTitle}"`,
    userId,
    establishmentId,
    relatedId: interventionId,
    relatedType: 'intervention',
    metadata: { assignedBy },
  });
};

/**
 * Notifier une intervention urgente
 */
export const notifyInterventionUrgent = async (
  userIds: string[],
  establishmentId: string,
  interventionId: string,
  interventionTitle: string
): Promise<string[]> => {
  return createNotifications(userIds, {
    type: 'intervention_urgent',
    title: '🚨 Intervention urgente',
    message: `Nouvelle intervention urgente : "${interventionTitle}"`,
    establishmentId,
    relatedId: interventionId,
    relatedType: 'intervention',
  });
};

/**
 * Notifier un changement de statut
 */
export const notifyStatusChanged = async (
  userId: string,
  establishmentId: string,
  interventionId: string,
  interventionTitle: string,
  oldStatus: string,
  newStatus: string
): Promise<string> => {
  return createNotification({
    type: 'status_changed',
    title: 'Statut modifié',
    message: `L'intervention "${interventionTitle}" est passée de "${oldStatus}" à "${newStatus}"`,
    userId,
    establishmentId,
    relatedId: interventionId,
    relatedType: 'intervention',
    metadata: { oldStatus, newStatus },
  });
};

/**
 * Notifier un nouveau message
 */
export const notifyNewMessage = async (
  userId: string,
  establishmentId: string,
  interventionId: string,
  senderName: string,
  messagePreview: string
): Promise<string> => {
  return createNotification({
    type: 'message_received',
    title: `Nouveau message de ${senderName}`,
    message: messagePreview.substring(0, 100),
    userId,
    establishmentId,
    relatedId: interventionId,
    relatedType: 'intervention',
  });
};

/**
 * Notifier une mention
 */
export const notifyMention = async (
  userId: string,
  establishmentId: string,
  interventionId: string,
  mentionedBy: string,
  messagePreview: string
): Promise<string> => {
  return createNotification({
    type: 'mention',
    title: `${mentionedBy} vous a mentionné`,
    message: messagePreview.substring(0, 100),
    userId,
    establishmentId,
    relatedId: interventionId,
    relatedType: 'intervention',
  });
};

/**
 * Notifier une chambre bloquée
 */
export const notifyRoomBlocked = async (
  userIds: string[],
  establishmentId: string,
  roomNumber: string,
  reason: string
): Promise<string[]> => {
  return createNotifications(userIds, {
    type: 'room_blocked',
    title: 'Chambre bloquée',
    message: `La chambre ${roomNumber} a été bloquée : ${reason}`,
    establishmentId,
    metadata: { roomNumber, reason },
  });
};

// ============================================================================
// READ
// ============================================================================

/**
 * Récupérer les notifications d'un utilisateur (limite)
 */
export const getUserNotifications = async (
  userId: string,
  limitCount: number = 50
): Promise<Notification[]> => {
  try {
    const q = query(
      getNotificationsCollection(),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  } catch (error) {
    logger.error('❌ Erreur récupération notifications:', error);
    throw new Error('Impossible de récupérer les notifications');
  }
};

/**
 * S'abonner aux notifications en temps réel
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void,
  limitCount: number = 50
): (() => void) => {
  const q = query(
    getNotificationsCollection(),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    snapshot => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
      callback(notifications);
    },
    error => {
      logger.error('❌ Erreur subscription notifications:', error);
    }
  );
};

/**
 * Compter les notifications non lues
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      getNotificationsCollection(),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    logger.error('❌ Erreur comptage non lues:', error);
    return 0;
  }
};

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Marquer une notification comme lue
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    const docRef = doc(getNotificationsCollection(), notificationId);
    await updateDoc(docRef, {
      isRead: true,
      readAt: Timestamp.now(),
    });
    logger.debug('✅ Notification marquée comme lue');
  } catch (error) {
    logger.error('❌ Erreur marquage notification:', error);
    throw new Error('Impossible de marquer la notification comme lue');
  }
};

/**
 * Marquer toutes les notifications comme lues
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      getNotificationsCollection(),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach(document => {
      batch.update(document.ref, {
        isRead: true,
        readAt: Timestamp.now(),
      });
    });

    await batch.commit();
    logger.debug(`✅ ${snapshot.size} notifications marquées comme lues`);
  } catch (error) {
    logger.error('❌ Erreur marquage toutes notifications:', error);
    throw new Error('Impossible de marquer toutes les notifications comme lues');
  }
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  // Create
  createNotification,
  createNotifications,

  // Notifications spécifiques
  notifyInterventionAssigned,
  notifyInterventionUrgent,
  notifyStatusChanged,
  notifyNewMessage,
  notifyMention,
  notifyRoomBlocked,

  // Read
  getUserNotifications,
  subscribeToNotifications,
  getUnreadCount,

  // Update
  markAsRead,
  markAllAsRead,

  // Utils
  NOTIFICATION_ICONS,
};
