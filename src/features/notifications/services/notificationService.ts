/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Notification Service
 *
 * Service pour gérer les notifications in-app
 * Note: Les notifications push (FCM) nécessitent une configuration Firebase supplémentaire
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { logger } from '@/core/utils/logger';
import type {
  Notification,
  CreateNotificationData,
  NotificationFilters,
  NotificationSortOptions,
  NotificationStats,
  NotificationPreferences,
} from '../types/notification.types';

class NotificationService {
  private readonly COLLECTIONS = {
    notifications: 'notifications',
    preferences: 'notificationPreferences',
  };

  /**
   * Créer une notification
   */
  async createNotification(establishmentId: string, data: CreateNotificationData): Promise<string> {
    const notificationsRef = collection(db, this.COLLECTIONS.notifications);

    const notificationData: Omit<Notification, 'id'> = {
      establishmentId,
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      icon: data.icon,
      image: data.image,
      priority: data.priority || 'normal',
      channels: data.channels || ['in_app'],
      read: false,
      clicked: false,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      data: data.data,
      groupKey: data.groupKey,
      expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(notificationsRef, notificationData);
    return docRef.id;
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getNotifications(
    userId: string,
    establishmentId: string,
    filters?: NotificationFilters,
    sortOptions?: NotificationSortOptions,
    limitCount?: number
  ): Promise<Notification[]> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('establishmentId', '==', establishmentId),
    ];

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

    if (filters?.dateFrom) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.dateFrom)));
    }

    if (filters?.dateTo) {
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.dateTo)));
    }

    // Tri
    const sortField = sortOptions?.field || 'createdAt';
    const sortOrder = sortOptions?.order || 'desc';
    constraints.push(orderBy(sortField, sortOrder));

    // Limite
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const notificationsRef = collection(db, this.COLLECTIONS.notifications);
    const q = query(notificationsRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  }

  /**
   * S'abonner aux notifications en temps réel
   */
  subscribeToNotifications(
    userId: string,
    establishmentId: string,
    filters?: NotificationFilters,
    sortOptions?: NotificationSortOptions,
    limitCount?: number,
    onUpdate: (notifications: Notification[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('establishmentId', '==', establishmentId),
    ];

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

    // Limite
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const notificationsRef = collection(db, this.COLLECTIONS.notifications);
    const q = query(notificationsRef, ...constraints);

    return onSnapshot(
      q,
      snapshot => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        onUpdate(notifications);
      },
      error => {
        logger.error('Erreur notification subscription:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db, this.COLLECTIONS.notifications, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId: string, establishmentId: string): Promise<void> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('establishmentId', '==', establishmentId),
      where('read', '==', false),
    ];

    const notificationsRef = collection(db, this.COLLECTIONS.notifications);
    const q = query(notificationsRef, ...constraints);
    const snapshot = await getDocs(q);

    // Utiliser un batch pour mettre à jour toutes les notifications
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  /**
   * Marquer une notification comme cliquée
   */
  async markAsClicked(notificationId: string): Promise<void> {
    const notificationRef = doc(db, this.COLLECTIONS.notifications, notificationId);
    await updateDoc(notificationRef, {
      clicked: true,
      clickedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const notificationRef = doc(db, this.COLLECTIONS.notifications, notificationId);
    await deleteDoc(notificationRef);
  }

  /**
   * Supprimer toutes les notifications lues
   */
  async deleteAllRead(userId: string, establishmentId: string): Promise<void> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('establishmentId', '==', establishmentId),
      where('read', '==', true),
    ];

    const notificationsRef = collection(db, this.COLLECTIONS.notifications);
    const q = query(notificationsRef, ...constraints);
    const snapshot = await getDocs(q);

    // Utiliser un batch pour supprimer toutes les notifications
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  async getUnreadCount(userId: string, establishmentId: string): Promise<number> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('establishmentId', '==', establishmentId),
      where('read', '==', false),
    ];

    const notificationsRef = collection(db, this.COLLECTIONS.notifications);
    const q = query(notificationsRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.size;
  }

  /**
   * Obtenir les statistiques des notifications
   */
  async getStats(userId: string, establishmentId: string): Promise<NotificationStats> {
    const notifications = await this.getNotifications(userId, establishmentId);

    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {} as any,
      byPriority: {} as any,
      readRate: 0,
      clickRate: 0,
    };

    // Compter par type
    notifications.forEach(n => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
    });

    // Compter par priorité
    notifications.forEach(n => {
      stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
    });

    // Calculer les taux
    if (stats.total > 0) {
      stats.readRate = ((stats.total - stats.unread) / stats.total) * 100;
      const clicked = notifications.filter(n => n.clicked).length;
      stats.clickRate = (clicked / stats.total) * 100;
    }

    return stats;
  }

  /**
   * Obtenir les préférences de notification
   */
  async getPreferences(
    userId: string,
    establishmentId: string
  ): Promise<NotificationPreferences | null> {
    const preferencesRef = doc(db, this.COLLECTIONS.preferences, `${userId}_${establishmentId}`);
    const snapshot = await getDoc(preferencesRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as NotificationPreferences;
  }

  /**
   * Mettre à jour les préférences de notification
   */
  async updatePreferences(
    userId: string,
    establishmentId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const preferencesRef = doc(db, this.COLLECTIONS.preferences, `${userId}_${establishmentId}`);

    await updateDoc(preferencesRef, {
      ...preferences,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Créer les préférences par défaut
   */
  async createDefaultPreferences(userId: string, establishmentId: string): Promise<void> {
    const preferencesRef = doc(db, this.COLLECTIONS.preferences, `${userId}_${establishmentId}`);

    const defaultPreferences: Omit<NotificationPreferences, 'updatedAt'> = {
      userId,
      establishmentId,
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
      slaAtRisk: true,
      slaBreached: true,
      messageReceived: true,
      mention: true,
      system: true,
      quietHoursEnabled: false,
      groupSimilar: true,
      groupInterval: 5,
    };

    await updateDoc(preferencesRef, {
      ...defaultPreferences,
      updatedAt: serverTimestamp(),
    });
  }
}

export default new NotificationService();
