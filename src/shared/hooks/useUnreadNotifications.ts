/**
 * Hook useUnreadNotifications
 *
 * Hook pour récupérer le nombre de notifications non lues en temps réel
 * À utiliser dans le Header pour afficher le badge
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import notificationService from '@/shared/services/notificationService';

/**
 * Hook pour obtenir le nombre de notifications non lues
 */
export const useUnreadNotifications = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    // S'abonner aux notifications en temps réel
    const unsubscribe = notificationService.subscribeToNotifications(
      user.id,
      notifications => {
        const count = notifications.filter(n => !n.isRead).length;
        setUnreadCount(count);
        setIsLoading(false);
      },
      50 // Limiter à 50 notifications pour la performance
    );

    return () => unsubscribe();
  }, [user?.id]);

  return { unreadCount, isLoading };
};

export default useUnreadNotifications;
