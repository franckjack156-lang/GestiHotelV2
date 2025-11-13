/**
 * useUserPreferences Hook
 *
 * Hook pour gérer les préférences utilisateur avec sauvegarde automatique
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import userService from '../services/userService';
import type { DisplayPreferences, NotificationPreferences } from '../types/user.types';
import { toast } from 'sonner';

export const useUserPreferences = () => {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Préférences par défaut
  const defaultDisplayPreferences: DisplayPreferences = {
    theme: 'light',
    themeColor: 'blue',
    density: 'comfortable',
    defaultView: 'list',
    itemsPerPage: 20,
    language: 'fr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    sidebarCollapsed: false,
  };

  const defaultNotificationPreferences: NotificationPreferences = {
    email: {
      enabled: true,
      interventions: true,
      assignments: true,
      statusChanges: true,
      messages: true,
      reports: true,
      dailyDigest: false,
    },
    push: {
      enabled: true,
      interventions: true,
      assignments: true,
      statusChanges: true,
      messages: true,
    },
    inApp: {
      enabled: true,
      sound: true,
      desktop: true,
    },
  };

  // Préférences actuelles (avec fallback sur les valeurs par défaut)
  const userDisplayPrefs = (user as any)?.displayPreferences;

  const displayPreferences: DisplayPreferences = {
    ...defaultDisplayPreferences,
    ...userDisplayPrefs,
  };

  console.log('👤 User display prefs from DB:', userDisplayPrefs);
  console.log('✨ Final display preferences:', displayPreferences);

  const notificationPreferences: NotificationPreferences = {
    email: {
      ...defaultNotificationPreferences.email,
      ...(user as any)?.notificationPreferences?.email,
    },
    push: {
      ...defaultNotificationPreferences.push,
      ...(user as any)?.notificationPreferences?.push,
    },
    inApp: {
      ...defaultNotificationPreferences.inApp,
      ...(user as any)?.notificationPreferences?.inApp,
    },
  };

  /**
   * Mettre à jour les préférences d'affichage
   */
  const updateDisplayPreferences = useCallback(
    async (updates: Partial<DisplayPreferences>) => {
      if (!user) return;

      try {
        setIsSaving(true);

        const newPreferences = {
          ...displayPreferences,
          ...updates,
        };

        await userService.updateProfile(user.id, {
          displayPreferences: newPreferences,
        });

        // Mettre à jour le store local
        setUser({
          ...user,
          displayPreferences: newPreferences,
        } as any);

        toast.success('Préférences enregistrées');
      } catch (error: any) {
        console.error('Error updating display preferences:', error);
        toast.error('Erreur lors de la sauvegarde');
      } finally {
        setIsSaving(false);
      }
    },
    [user, displayPreferences, setUser]
  );

  /**
   * Mettre à jour les préférences de notifications
   */
  const updateNotificationPreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      if (!user) return;

      try {
        setIsSaving(true);

        const newPreferences: NotificationPreferences = {
          email: {
            ...notificationPreferences.email,
            ...updates.email,
          },
          push: {
            ...notificationPreferences.push,
            ...updates.push,
          },
          inApp: {
            ...notificationPreferences.inApp,
            ...updates.inApp,
          },
        };

        await userService.updateProfile(user.id, {
          notificationPreferences: newPreferences,
        });

        // Mettre à jour le store local
        setUser({
          ...user,
          notificationPreferences: newPreferences,
        } as any);

        toast.success('Préférences enregistrées');
      } catch (error: any) {
        console.error('Error updating notification preferences:', error);
        toast.error('Erreur lors de la sauvegarde');
      } finally {
        setIsSaving(false);
      }
    },
    [user, notificationPreferences, setUser]
  );

  /**
   * Réinitialiser aux préférences par défaut
   */
  const resetToDefaults = useCallback(async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      await userService.updateProfile(user.id, {
        displayPreferences: defaultDisplayPreferences,
        notificationPreferences: defaultNotificationPreferences,
      });

      setUser({
        ...user,
        displayPreferences: defaultDisplayPreferences,
        notificationPreferences: defaultNotificationPreferences,
      } as any);

      toast.success('Préférences réinitialisées');
    } catch (error: any) {
      console.error('Error resetting preferences:', error);
      toast.error('Erreur lors de la réinitialisation');
    } finally {
      setIsSaving(false);
    }
  }, [user, setUser]);

  return {
    // Préférences actuelles
    displayPreferences,
    notificationPreferences,

    // Actions
    updateDisplayPreferences,
    updateNotificationPreferences,
    resetToDefaults,

    // État
    isLoading,
    isSaving,
  };
};
