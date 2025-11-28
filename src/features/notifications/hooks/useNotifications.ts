/**
 * useNotifications Hook
 *
 * Hook pour gérer les notifications avec temps réel
 * Utilise le service unifié de notifications
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useEstablishmentStore } from '@/features/establishments/stores/establishmentStore';
import notificationService, {
  type Notification,
  type NotificationFilters,
  type NotificationSortOptions,
  type NotificationStats,
} from '@/shared/services/notificationService';
import { logger } from '@/core/utils/logger';

interface UseNotificationsOptions {
  autoLoad?: boolean;
  realTime?: boolean;
  limitCount?: number;
}

export const useNotifications = (
  options: UseNotificationsOptions = {
    autoLoad: true,
    realTime: true,
    limitCount: 50,
  }
) => {
  const { user } = useAuthStore();
  const { currentEstablishment } = useEstablishmentStore();
  const establishmentId =
    currentEstablishment?.id || user?.currentEstablishmentId || user?.establishmentIds?.[0];
  const userId = user?.id;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [sortOptions, setSortOptions] = useState<NotificationSortOptions>({
    field: 'createdAt',
    order: 'desc',
  });

  /**
   * Charger les notifications
   */
  const loadNotifications = useCallback(async () => {
    if (!userId || !establishmentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await notificationService.getUserNotifications(
        userId,
        establishmentId,
        filters,
        sortOptions,
        options.limitCount
      );
      setNotifications(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors du chargement des notifications';
      setError(errorMessage);
      logger.error('Erreur loadNotifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, establishmentId, filters, sortOptions, options.limitCount]);

  /**
   * Charger le compteur non lues
   */
  const loadUnreadCount = useCallback(async () => {
    if (!userId || !establishmentId) return;

    try {
      const count = await notificationService.getUnreadCount(userId, establishmentId);
      setUnreadCount(count);
    } catch (err) {
      logger.error('Erreur loadUnreadCount:', err);
    }
  }, [userId, establishmentId]);

  /**
   * Charger les statistiques
   */
  const loadStats = useCallback(async () => {
    if (!userId || !establishmentId) return;

    try {
      const data = await notificationService.getStats(userId, establishmentId);
      setStats(data);
    } catch (err) {
      logger.error('Erreur loadStats:', err);
    }
  }, [userId, establishmentId]);

  /**
   * Marquer comme lue
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Mise à jour locale
      setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      logger.error('Erreur markAsRead:', err);
    }
  }, []);

  /**
   * Marquer toutes comme lues
   */
  const markAllAsRead = useCallback(async () => {
    if (!userId || !establishmentId) return;

    try {
      await notificationService.markAllAsRead(userId, establishmentId);
      // Mise à jour locale
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      logger.error('Erreur markAllAsRead:', err);
    }
  }, [userId, establishmentId]);

  /**
   * Marquer comme cliquée
   */
  const markAsClicked = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsClicked(notificationId);
      // Mise à jour locale
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, clicked: true, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      logger.error('Erreur markAsClicked:', err);
    }
  }, []);

  /**
   * Supprimer une notification
   */
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const notification = notifications.find(n => n.id === notificationId);
        await notificationService.deleteNotification(notificationId);
        // Mise à jour locale
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (err) {
        logger.error('Erreur deleteNotification:', err);
      }
    },
    [notifications]
  );

  /**
   * Supprimer toutes les notifications lues
   */
  const deleteAllRead = useCallback(async () => {
    if (!userId || !establishmentId) return;

    try {
      await notificationService.deleteAllRead(userId, establishmentId);
      // Mise à jour locale
      setNotifications(prev => prev.filter(n => !n.read));
    } catch (err) {
      logger.error('Erreur deleteAllRead:', err);
    }
  }, [userId, establishmentId]);

  /**
   * Appliquer des filtres
   */
  const applyFilters = useCallback((newFilters: Partial<NotificationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Réinitialiser les filtres
   */
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Changer le tri
   */
  const changeSort = useCallback((newOptions: NotificationSortOptions) => {
    setSortOptions(newOptions);
  }, []);

  /**
   * Actualiser
   */
  const refresh = useCallback(() => {
    loadNotifications();
    loadUnreadCount();
    loadStats();
  }, [loadNotifications, loadUnreadCount, loadStats]);

  /**
   * Temps réel - Notifications principales
   */
  useEffect(() => {
    if (!options.realTime || !userId) return;

    setIsLoading(true);

    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      (notifs: Notification[]) => {
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
        setIsLoading(false);
      },
      options.limitCount || 50,
      establishmentId
    );

    return () => {
      unsubscribe();
    };
  }, [userId, establishmentId, options.realTime, options.limitCount]);

  /**
   * Auto-chargement (si pas de temps réel)
   */
  useEffect(() => {
    if (options.autoLoad && !options.realTime && userId && establishmentId) {
      loadNotifications();
      loadUnreadCount();
      loadStats();
    }
  }, [
    options.autoLoad,
    options.realTime,
    userId,
    establishmentId,
    loadNotifications,
    loadUnreadCount,
    loadStats,
  ]);

  return {
    // État
    notifications,
    unreadCount,
    stats,
    isLoading,
    error,
    filters,
    sortOptions,

    // Actions
    markAsRead,
    markAllAsRead,
    markAsClicked,
    deleteNotification,
    deleteAllRead,
    applyFilters,
    resetFilters,
    changeSort,
    refresh,

    // Utilitaires
    hasNotifications: notifications.length > 0,
    hasUnread: unreadCount > 0,
  };
};

export default useNotifications;
