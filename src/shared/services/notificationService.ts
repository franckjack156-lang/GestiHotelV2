/**
 * ============================================================================
 * NOTIFICATION SERVICE - UNIFIÉ ET COMPLET
 * ============================================================================
 *
 * Service centralisé pour gérer toutes les notifications :
 * - In-app (Firestore)
 * - Push (Firebase Cloud Messaging)
 * - Email (via Cloud Functions)
 *
 * Ce service consolide les deux anciens services en un seul point d'entrée.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch,
  getDocs,
  getDoc,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';
import { db, app } from '@/core/config/firebase';
import { logger } from '@/core/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

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

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  body?: string; // Alias pour message (compatibilité)
  userId: string;
  establishmentId: string;

  // État de lecture
  read: boolean;
  readAt?: Timestamp;
  clicked?: boolean;
  clickedAt?: Timestamp;

  // Priorité et canaux
  priority: NotificationPriority;
  channels: NotificationChannel[];

  // Lien vers l'entité concernée
  relatedId?: string;
  relatedType?: 'intervention' | 'message' | 'user' | 'room';
  actionUrl?: string;
  actionLabel?: string;

  // Données additionnelles
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  icon?: string;
  image?: string;

  // Groupement
  groupKey?: string;
  groupCount?: number;

  // Dates
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  expiresAt?: Timestamp;
}

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  establishmentId: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  relatedId?: string;
  relatedType?: 'intervention' | 'message' | 'user' | 'room';
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  icon?: string;
  groupKey?: string;
  expiresAt?: Date;
}

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

  // Heures calmes
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietDays?: number[];

  // Regroupement
  groupSimilar: boolean;
  groupInterval?: number;

  updatedAt?: Timestamp;
}

export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface NotificationSortOptions {
  field: 'createdAt' | 'priority' | 'read';
  order: 'asc' | 'desc';
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  readRate: number;
  clickRate: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLLECTIONS = {
  notifications: 'notifications',
  preferences: 'notificationPreferences',
  tokens: 'fcmTokens',
};

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  intervention_created: '📋',
  intervention_assigned: '👤',
  intervention_status_changed: '🔄',
  intervention_completed: '✅',
  intervention_comment: '💬',
  intervention_overdue: '⏰',
  intervention_urgent: '🚨',
  sla_at_risk: '⚠️',
  sla_breached: '🔴',
  message_received: '💬',
  mention: '@',
  room_blocked: '🔒',
  room_unblocked: '🔓',
  validation_required: '✋',
  system: '⚙️',
  other: '📌',
};

const DEFAULT_PREFERENCES: Omit<
  NotificationPreferences,
  'userId' | 'establishmentId' | 'updatedAt'
> = {
  enableInApp: true,
  enablePush: true,
  enableEmail: true,
  enableSMS: false,
  interventionCreated: true,
  interventionAssigned: true,
  interventionStatusChanged: true,
  interventionCompleted: true,
  interventionComment: true,
  interventionOverdue: true,
  interventionUrgent: true,
  slaAtRisk: true,
  slaBreached: true,
  messageReceived: true,
  mention: true,
  roomBlocked: true,
  system: true,
  quietHoursEnabled: false,
  groupSimilar: true,
  groupInterval: 5,
};

// ============================================================================
// HELPERS
// ============================================================================

const getNotificationsCollection = () => collection(db, COLLECTIONS.notifications);
const getPreferencesCollection = () => collection(db, COLLECTIONS.preferences);

/**
 * Mapper NotificationType vers la clé de préférence
 */
const getPreferenceKeyForType = (type: NotificationType): keyof NotificationPreferences | null => {
  const mapping: Partial<Record<NotificationType, keyof NotificationPreferences>> = {
    intervention_created: 'interventionCreated',
    intervention_assigned: 'interventionAssigned',
    intervention_status_changed: 'interventionStatusChanged',
    intervention_completed: 'interventionCompleted',
    intervention_comment: 'interventionComment',
    intervention_overdue: 'interventionOverdue',
    intervention_urgent: 'interventionUrgent',
    sla_at_risk: 'slaAtRisk',
    sla_breached: 'slaBreached',
    message_received: 'messageReceived',
    mention: 'mention',
    room_blocked: 'roomBlocked',
    system: 'system',
  };
  return mapping[type] || null;
};

/**
 * Vérifier si on est dans les heures calmes
 */
const isInQuietHours = (prefs: NotificationPreferences): boolean => {
  if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const currentDay = now.getDay();

  // Vérifier le jour
  if (prefs.quietDays && prefs.quietDays.length > 0 && !prefs.quietDays.includes(currentDay)) {
    return false;
  }

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = prefs.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number);
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  // Gérer le cas où la plage traverse minuit
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }

  return currentTime >= startTime && currentTime < endTime;
};

// ============================================================================
// PRÉFÉRENCES
// ============================================================================

/**
 * Récupérer les préférences d'un utilisateur
 */
export const getPreferences = async (
  userId: string,
  establishmentId: string
): Promise<NotificationPreferences | null> => {
  try {
    const prefId = `${userId}_${establishmentId}`;
    const docRef = doc(getPreferencesCollection(), prefId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return { ...snapshot.data(), userId, establishmentId } as NotificationPreferences;
  } catch (error: any) {
    // Permission errors are expected when preferences don't exist yet
    // Log as debug instead of error to avoid console noise
    if (error?.code === 'permission-denied') {
      logger.debug('Préférences non accessibles (permissions ou document inexistant)');
    } else {
      logger.warn('⚠️ Erreur récupération préférences:', error);
    }
    return null;
  }
};

/**
 * Créer les préférences par défaut
 */
export const createDefaultPreferences = async (
  userId: string,
  establishmentId: string
): Promise<void> => {
  try {
    const prefId = `${userId}_${establishmentId}`;
    const docRef = doc(getPreferencesCollection(), prefId);

    await updateDoc(docRef, {
      userId,
      establishmentId,
      ...DEFAULT_PREFERENCES,
      updatedAt: serverTimestamp(),
    }).catch(async () => {
      // Si le document n'existe pas, le créer
      const { setDoc } = await import('firebase/firestore');
      await setDoc(docRef, {
        userId,
        establishmentId,
        ...DEFAULT_PREFERENCES,
        updatedAt: serverTimestamp(),
      });
    });

    logger.debug('✅ Préférences par défaut créées');
  } catch (error) {
    logger.error('❌ Erreur création préférences:', error);
  }
};

/**
 * Mettre à jour les préférences
 */
export const updatePreferences = async (
  userId: string,
  establishmentId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> => {
  try {
    const prefId = `${userId}_${establishmentId}`;
    const docRef = doc(getPreferencesCollection(), prefId);

    await updateDoc(docRef, {
      ...preferences,
      updatedAt: serverTimestamp(),
    });

    logger.debug('✅ Préférences mises à jour');
  } catch (error) {
    logger.error('❌ Erreur mise à jour préférences:', error);
    throw error;
  }
};

// ============================================================================
// VÉRIFICATION DES PRÉFÉRENCES AVANT ENVOI
// ============================================================================

/**
 * Vérifier si une notification doit être envoyée selon les préférences
 */
export const shouldSendNotification = async (
  userId: string,
  establishmentId: string,
  type: NotificationType,
  channel: NotificationChannel
): Promise<boolean> => {
  try {
    const prefs = await getPreferences(userId, establishmentId);

    // Si pas de préférences, envoyer par défaut
    if (!prefs) {
      return true;
    }

    // Vérifier les heures calmes (sauf urgences)
    if (type !== 'intervention_urgent' && type !== 'sla_breached' && isInQuietHours(prefs)) {
      return false;
    }

    // Vérifier le canal
    const channelEnabled = {
      in_app: prefs.enableInApp,
      push: prefs.enablePush,
      email: prefs.enableEmail,
      sms: prefs.enableSMS,
    };

    if (!channelEnabled[channel]) {
      return false;
    }

    // Vérifier le type de notification
    const prefKey = getPreferenceKeyForType(type);
    if (prefKey && prefs[prefKey] === false) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('❌ Erreur vérification préférences:', error);
    return true; // En cas d'erreur, envoyer quand même
  }
};

// ============================================================================
// CRÉATION DE NOTIFICATIONS
// ============================================================================

/**
 * Créer une notification avec vérification des préférences
 */
export const createNotification = async (data: CreateNotificationData): Promise<string | null> => {
  try {
    // Vérifier les préférences pour in_app
    const shouldSend = await shouldSendNotification(
      data.userId,
      data.establishmentId,
      data.type,
      'in_app'
    );

    if (!shouldSend) {
      logger.debug('⏭️ Notification ignorée (préférences utilisateur)');
      return null;
    }

    // Construire l'objet sans les champs undefined (Firestore les rejette)
    const notificationData: Record<string, any> = {
      ...data,
      body: data.message, // Alias pour compatibilité
      read: false,
      clicked: false,
      priority: data.priority || 'normal',
      channels: data.channels || ['in_app'],
      icon: data.icon || NOTIFICATION_ICONS[data.type] || '📌',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Ajouter expiresAt seulement si défini
    if (data.expiresAt) {
      notificationData.expiresAt = Timestamp.fromDate(data.expiresAt);
    }

    // Nettoyer les champs undefined
    Object.keys(notificationData).forEach(key => {
      if (notificationData[key] === undefined) {
        delete notificationData[key];
      }
    });

    const docRef = await addDoc(getNotificationsCollection(), notificationData);
    logger.debug('✅ Notification créée:', docRef.id);

    // Envoyer en push si activé
    if (data.channels?.includes('push') || data.priority === 'urgent') {
      await sendPushNotification(data.userId, {
        title: data.title,
        body: data.message,
        icon: data.icon,
        data: {
          notificationId: docRef.id,
          type: data.type,
          relatedId: data.relatedId,
          actionUrl: data.actionUrl,
        },
      }).catch(err => logger.warn('Push notification non envoyée:', err));
    }

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
    const now = serverTimestamp();

    for (const userId of userIds) {
      // Vérifier les préférences pour chaque utilisateur
      const shouldSend = await shouldSendNotification(
        userId,
        data.establishmentId,
        data.type,
        'in_app'
      );

      if (!shouldSend) {
        continue;
      }

      const docRef = doc(getNotificationsCollection());
      ids.push(docRef.id);

      batch.set(docRef, {
        ...data,
        userId,
        body: data.message,
        read: false,
        clicked: false,
        priority: data.priority || 'normal',
        channels: data.channels || ['in_app'],
        icon: data.icon || NOTIFICATION_ICONS[data.type] || '📌',
        createdAt: now,
        updatedAt: now,
      });
    }

    if (ids.length > 0) {
      await batch.commit();
      logger.debug(`✅ ${ids.length} notifications créées`);
    }

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
): Promise<string | null> => {
  return createNotification({
    type: 'intervention_assigned',
    title: 'Nouvelle intervention assignée',
    message: `Vous avez été assigné à l'intervention "${interventionTitle}"`,
    userId,
    establishmentId,
    priority: 'high',
    channels: ['in_app', 'push'],
    relatedId: interventionId,
    relatedType: 'intervention',
    actionUrl: `/app/interventions/${interventionId}`,
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
    priority: 'urgent',
    channels: ['in_app', 'push', 'email'],
    relatedId: interventionId,
    relatedType: 'intervention',
    actionUrl: `/app/interventions/${interventionId}`,
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
): Promise<string | null> => {
  return createNotification({
    type: 'intervention_status_changed',
    title: 'Statut modifié',
    message: `L'intervention "${interventionTitle}" est passée de "${oldStatus}" à "${newStatus}"`,
    userId,
    establishmentId,
    priority: 'normal',
    channels: ['in_app'],
    relatedId: interventionId,
    relatedType: 'intervention',
    actionUrl: `/app/interventions/${interventionId}`,
    metadata: { oldStatus, newStatus },
  });
};

/**
 * Notifier la complétion d'une intervention
 */
export const notifyInterventionCompleted = async (
  userId: string,
  establishmentId: string,
  interventionId: string,
  interventionTitle: string,
  completedBy: string
): Promise<string | null> => {
  return createNotification({
    type: 'intervention_completed',
    title: 'Intervention terminée',
    message: `L'intervention "${interventionTitle}" a été complétée par ${completedBy}`,
    userId,
    establishmentId,
    priority: 'normal',
    channels: ['in_app'],
    relatedId: interventionId,
    relatedType: 'intervention',
    actionUrl: `/app/interventions/${interventionId}`,
    metadata: { completedBy },
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
): Promise<string | null> => {
  return createNotification({
    type: 'message_received',
    title: `Nouveau message de ${senderName}`,
    message: messagePreview.substring(0, 100),
    userId,
    establishmentId,
    priority: 'normal',
    channels: ['in_app', 'push'],
    relatedId: interventionId,
    relatedType: 'intervention',
    actionUrl: `/app/interventions/${interventionId}`,
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
): Promise<string | null> => {
  return createNotification({
    type: 'mention',
    title: `${mentionedBy} vous a mentionné`,
    message: messagePreview.substring(0, 100),
    userId,
    establishmentId,
    priority: 'high',
    channels: ['in_app', 'push'],
    relatedId: interventionId,
    relatedType: 'intervention',
    actionUrl: `/app/interventions/${interventionId}`,
  });
};

/**
 * Notifier une intervention en retard
 */
export const notifyInterventionOverdue = async (
  userId: string,
  establishmentId: string,
  interventionId: string,
  interventionTitle: string,
  overdueBy: string
): Promise<string | null> => {
  return createNotification({
    type: 'intervention_overdue',
    title: '⏰ Intervention en retard',
    message: `L'intervention "${interventionTitle}" est en retard de ${overdueBy}`,
    userId,
    establishmentId,
    priority: 'high',
    channels: ['in_app', 'push'],
    relatedId: interventionId,
    relatedType: 'intervention',
    actionUrl: `/app/interventions/${interventionId}`,
  });
};

/**
 * Notifier un SLA à risque
 */
export const notifySlaAtRisk = async (
  userId: string,
  establishmentId: string,
  interventionId: string,
  interventionTitle: string,
  timeRemaining: string
): Promise<string | null> => {
  return createNotification({
    type: 'sla_at_risk',
    title: '⚠️ SLA à risque',
    message: `L'intervention "${interventionTitle}" risque de dépasser le SLA. Temps restant: ${timeRemaining}`,
    userId,
    establishmentId,
    priority: 'high',
    channels: ['in_app', 'push'],
    relatedId: interventionId,
    relatedType: 'intervention',
    actionUrl: `/app/interventions/${interventionId}`,
  });
};

/**
 * Notifier un SLA dépassé
 */
export const notifySlaBreached = async (
  userIds: string[],
  establishmentId: string,
  interventionId: string,
  interventionTitle: string
): Promise<string[]> => {
  return createNotifications(userIds, {
    type: 'sla_breached',
    title: '🔴 SLA dépassé',
    message: `L'intervention "${interventionTitle}" a dépassé le SLA`,
    establishmentId,
    priority: 'urgent',
    channels: ['in_app', 'push', 'email'],
    relatedId: interventionId,
    relatedType: 'intervention',
    actionUrl: `/app/interventions/${interventionId}`,
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
    priority: 'normal',
    channels: ['in_app'],
    relatedType: 'room',
    metadata: { roomNumber, reason },
  });
};

// ============================================================================
// LECTURE
// ============================================================================

/**
 * Récupérer les notifications d'un utilisateur
 */
export const getUserNotifications = async (
  userId: string,
  establishmentId?: string,
  filters?: NotificationFilters,
  sortOptions?: NotificationSortOptions,
  limitCount: number = 50
): Promise<Notification[]> => {
  try {
    const constraints: QueryConstraint[] = [where('userId', '==', userId)];

    if (establishmentId) {
      constraints.push(where('establishmentId', '==', establishmentId));
    }

    // Filtres
    if (filters?.read !== undefined) {
      constraints.push(where('read', '==', filters.read));
    }
    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }
    if (filters?.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }

    // Tri
    const sortField = sortOptions?.field || 'createdAt';
    const sortOrder = sortOptions?.order || 'desc';
    constraints.push(orderBy(sortField, sortOrder));
    constraints.push(limit(limitCount));

    const q = query(getNotificationsCollection(), ...constraints);
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
  limitCount: number = 50,
  establishmentId?: string
): (() => void) => {
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  ];

  if (establishmentId) {
    // Note: L'index Firestore doit exister pour cette requête
    constraints.splice(1, 0, where('establishmentId', '==', establishmentId));
  }

  const q = query(getNotificationsCollection(), ...constraints);

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
export const getUnreadCount = async (userId: string, establishmentId?: string): Promise<number> => {
  try {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('read', '==', false),
    ];

    if (establishmentId) {
      constraints.push(where('establishmentId', '==', establishmentId));
    }

    const q = query(getNotificationsCollection(), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    logger.error('❌ Erreur comptage non lues:', error);
    return 0;
  }
};

/**
 * Obtenir les statistiques des notifications
 */
export const getStats = async (
  userId: string,
  establishmentId: string
): Promise<NotificationStats> => {
  const notifications = await getUserNotifications(
    userId,
    establishmentId,
    undefined,
    undefined,
    500
  );

  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    byType: {} as Record<NotificationType, number>,
    byPriority: {} as Record<NotificationPriority, number>,
    readRate: 0,
    clickRate: 0,
  };

  notifications.forEach(n => {
    stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
    stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
  });

  if (stats.total > 0) {
    stats.readRate = ((stats.total - stats.unread) / stats.total) * 100;
    const clicked = notifications.filter(n => n.clicked).length;
    stats.clickRate = (clicked / stats.total) * 100;
  }

  return stats;
};

// ============================================================================
// MISE À JOUR
// ============================================================================

/**
 * Marquer une notification comme lue
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    const docRef = doc(getNotificationsCollection(), notificationId);
    await updateDoc(docRef, {
      read: true,
      readAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    logger.debug('✅ Notification marquée comme lue');
  } catch (error) {
    logger.error('❌ Erreur marquage notification:', error);
    throw new Error('Impossible de marquer la notification comme lue');
  }
};

/**
 * Marquer une notification comme cliquée
 */
export const markAsClicked = async (notificationId: string): Promise<void> => {
  try {
    const docRef = doc(getNotificationsCollection(), notificationId);
    await updateDoc(docRef, {
      clicked: true,
      clickedAt: serverTimestamp(),
      read: true,
      readAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('❌ Erreur marquage cliqué:', error);
  }
};

/**
 * Marquer toutes les notifications comme lues
 */
export const markAllAsRead = async (userId: string, establishmentId?: string): Promise<void> => {
  try {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('read', '==', false),
    ];

    if (establishmentId) {
      constraints.push(where('establishmentId', '==', establishmentId));
    }

    const q = query(getNotificationsCollection(), ...constraints);
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach(document => {
      batch.update(document.ref, {
        read: true,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
// SUPPRESSION
// ============================================================================

/**
 * Supprimer une notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const docRef = doc(getNotificationsCollection(), notificationId);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error('❌ Erreur suppression notification:', error);
    throw error;
  }
};

/**
 * Supprimer toutes les notifications lues
 */
export const deleteAllRead = async (userId: string, establishmentId?: string): Promise<void> => {
  try {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('read', '==', true),
    ];

    if (establishmentId) {
      constraints.push(where('establishmentId', '==', establishmentId));
    }

    const q = query(getNotificationsCollection(), ...constraints);
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach(document => {
      batch.delete(document.ref);
    });

    await batch.commit();
    logger.debug(`✅ ${snapshot.size} notifications supprimées`);
  } catch (error) {
    logger.error('❌ Erreur suppression notifications lues:', error);
    throw error;
  }
};

// ============================================================================
// PUSH NOTIFICATIONS (FCM)
// ============================================================================

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

/**
 * Initialiser Firebase Cloud Messaging
 */
export const initializeFCM = async (): Promise<boolean> => {
  try {
    const supported = await isSupported();
    if (!supported) {
      logger.warn('⚠️ Push notifications non supportées sur ce navigateur');
      return false;
    }

    messagingInstance = getMessaging(app);
    logger.debug('✅ FCM initialisé');
    return true;
  } catch (error) {
    logger.error('❌ Erreur initialisation FCM:', error);
    return false;
  }
};

/**
 * Demander la permission et obtenir le token FCM
 */
export const requestPushPermission = async (userId: string): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      logger.warn('⚠️ Permission notifications refusée');
      return null;
    }

    if (!messagingInstance) {
      const initialized = await initializeFCM();
      if (!initialized) return null;
    }

    // Obtenir le token FCM
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      logger.warn('⚠️ VAPID key non configurée');
      return null;
    }

    const token = await getToken(messagingInstance!, { vapidKey });

    if (token) {
      // Sauvegarder le token dans Firestore
      await saveFCMToken(userId, token);
      logger.debug('✅ Token FCM obtenu et sauvegardé');
      return token;
    }

    return null;
  } catch (error) {
    logger.error('❌ Erreur demande permission push:', error);
    return null;
  }
};

/**
 * Sauvegarder le token FCM
 */
const saveFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    const tokenDoc = doc(collection(db, COLLECTIONS.tokens), `${userId}_web`);
    const { setDoc } = await import('firebase/firestore');

    await setDoc(
      tokenDoc,
      {
        userId,
        token,
        platform: 'web',
        browser: navigator.userAgent,
        createdAt: serverTimestamp(),
        lastUsedAt: serverTimestamp(),
        isActive: true,
      },
      { merge: true }
    );
  } catch (error) {
    logger.error('❌ Erreur sauvegarde token FCM:', error);
  }
};

/**
 * Écouter les messages push en foreground
 */
export const onForegroundMessage = (callback: (payload: any) => void): (() => void) => {
  if (!messagingInstance) {
    logger.warn('⚠️ FCM non initialisé');
    return () => {};
  }

  return onMessage(messagingInstance, payload => {
    logger.debug('📬 Message push reçu:', payload);
    callback(payload);
  });
};

/**
 * Envoyer une notification push (via Cloud Function)
 */
const sendPushNotification = async (
  userId: string,
  notification: {
    title: string;
    body: string;
    icon?: string;
    data?: Record<string, any>;
  }
): Promise<void> => {
  // Cette fonction appelle une Cloud Function pour envoyer la notif
  // La Cloud Function récupère le token FCM et envoie via Firebase Admin SDK
  const cloudFunctionsUrl =
    import.meta.env.VITE_CLOUD_FUNCTIONS_URL ||
    'https://europe-west1-gestihotel-v2.cloudfunctions.net';

  try {
    // Récupérer le token d'authentification Firebase
    const auth = getAuth(app);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      logger.warn("⚠️ Pas d'utilisateur connecté, push notification annulée");
      return;
    }

    const idToken = await currentUser.getIdToken();

    const response = await fetch(`${cloudFunctionsUrl}/sendPushNotification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ userId, ...notification }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    logger.warn('⚠️ Envoi push échoué:', error);
  }
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  // Préférences
  getPreferences,
  createDefaultPreferences,
  updatePreferences,
  shouldSendNotification,

  // Création
  createNotification,
  createNotifications,

  // Notifications spécifiques
  notifyInterventionAssigned,
  notifyInterventionUrgent,
  notifyStatusChanged,
  notifyInterventionCompleted,
  notifyNewMessage,
  notifyMention,
  notifyInterventionOverdue,
  notifySlaAtRisk,
  notifySlaBreached,
  notifyRoomBlocked,

  // Lecture
  getUserNotifications,
  subscribeToNotifications,
  getUnreadCount,
  getStats,

  // Mise à jour
  markAsRead,
  markAsClicked,
  markAllAsRead,

  // Suppression
  deleteNotification,
  deleteAllRead,

  // Push
  initializeFCM,
  requestPushPermission,
  onForegroundMessage,

  // Utils
  NOTIFICATION_ICONS,
};
