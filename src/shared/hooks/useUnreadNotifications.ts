/**
 * Hook useUnreadNotifications
 *
 * Hook pour récupérer le nombre de notifications non lues en temps réel
 * À utiliser dans le Header pour afficher le badge
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import notificationService from '@/shared/services/notificationService';

/**
 * Hook pour obtenir le nombre de notifications non lues
 */
export const useUnreadNotifications = () => {
  const { user } = useAuth();
  const { currentEstablishment } = useCurrentEstablishment();
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
        // Utiliser le champ 'read' (pas 'isRead')
        const count = notifications.filter(n => !n.read).length;
        setUnreadCount(count);
        setIsLoading(false);
      },
      50, // Limiter à 50 notifications pour la performance
      currentEstablishment?.id
    );

    return () => unsubscribe();
  }, [user?.id, currentEstablishment?.id]);

  return { unreadCount, isLoading };
};

export default useUnreadNotifications;
