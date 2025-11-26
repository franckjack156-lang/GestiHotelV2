/**
 * useTheme Hook
 *
 * Hook pour gérer les thèmes du dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import themeService from '../services/themeService';
import type { DashboardTheme, UserThemePreferences } from '../types/theme.types';
import { defaultTheme } from '../config/presetThemes';
import { logger } from '@/core/utils/logger';

export const useTheme = () => {
  const { user } = useAuthStore();
  const userId = user?.id;

  const [activeTheme, setActiveTheme] = useState<DashboardTheme>(defaultTheme);
  const [availableThemes, setAvailableThemes] = useState<DashboardTheme[]>([]);
  const [preferences, setPreferences] = useState<UserThemePreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger le thème actif
   */
  const loadActiveTheme = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const theme = await themeService.getActiveTheme(userId);
      setActiveTheme(theme);
      themeService.applyTheme(theme);
    } catch (err) {
      logger.error('Erreur loadActiveTheme:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement du thème');
      setActiveTheme(defaultTheme);
      themeService.applyTheme(defaultTheme);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Charger tous les thèmes disponibles
   */
  const loadAvailableThemes = useCallback(async () => {
    if (!userId) return;

    try {
      const themes = await themeService.getAllThemes(userId);
      setAvailableThemes(themes);
    } catch (err) {
      logger.error('Erreur loadAvailableThemes:', err);
    }
  }, [userId]);

  /**
   * Charger les préférences
   */
  const loadPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      let prefs = await themeService.getUserThemePreferences(userId);
      if (!prefs) {
        prefs = await themeService.createDefaultPreferences(userId);
      }
      setPreferences(prefs);
    } catch (err) {
      logger.error('Erreur loadPreferences:', err);
    }
  }, [userId]);

  /**
   * Changer de thème
   */
  const changeTheme = useCallback(
    async (themeId: string) => {
      if (!userId) return;

      try {
        await themeService.setActiveTheme(userId, themeId);
        const theme = await themeService.getTheme(themeId, userId);
        if (theme) {
          setActiveTheme(theme);
          themeService.applyTheme(theme);
        }
      } catch (err) {
        logger.error('Erreur changeTheme:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du changement de thème');
        throw err;
      }
    },
    [userId]
  );

  /**
   * Créer un thème personnalisé
   */
  const createCustomTheme = useCallback(
    async (theme: Omit<DashboardTheme, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!userId) return;

      try {
        const newTheme = await themeService.createCustomTheme(userId, theme);
        await loadAvailableThemes();
        await loadPreferences();
        return newTheme;
      } catch (err) {
        logger.error('Erreur createCustomTheme:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors de la création du thème');
        throw err;
      }
    },
    [userId, loadAvailableThemes, loadPreferences]
  );

  /**
   * Mettre à jour un thème personnalisé
   */
  const updateCustomTheme = useCallback(
    async (themeId: string, updates: Partial<DashboardTheme>) => {
      if (!userId) return;

      try {
        await themeService.updateCustomTheme(userId, themeId, updates);
        await loadAvailableThemes();

        // Si c'est le thème actif, le recharger
        if (activeTheme.id === themeId) {
          await loadActiveTheme();
        }
      } catch (err) {
        logger.error('Erreur updateCustomTheme:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du thème');
        throw err;
      }
    },
    [userId, activeTheme.id, loadAvailableThemes, loadActiveTheme]
  );

  /**
   * Supprimer un thème personnalisé
   */
  const deleteCustomTheme = useCallback(
    async (themeId: string) => {
      if (!userId) return;

      try {
        await themeService.deleteCustomTheme(userId, themeId);
        await loadAvailableThemes();
        await loadPreferences();

        // Si c'était le thème actif, recharger
        if (activeTheme.id === themeId) {
          await loadActiveTheme();
        }
      } catch (err) {
        logger.error('Erreur deleteCustomTheme:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du thème');
        throw err;
      }
    },
    [userId, activeTheme.id, loadAvailableThemes, loadPreferences, loadActiveTheme]
  );

  /**
   * Dupliquer un thème
   */
  const duplicateTheme = useCallback(
    async (themeId: string) => {
      if (!userId) return;

      try {
        const duplicated = await themeService.duplicateTheme(userId, themeId);
        await loadAvailableThemes();
        await loadPreferences();
        return duplicated;
      } catch (err) {
        logger.error('Erreur duplicateTheme:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors de la duplication du thème');
        throw err;
      }
    },
    [userId, loadAvailableThemes, loadPreferences]
  );

  /**
   * Exporter un thème
   */
  const exportTheme = useCallback((theme: DashboardTheme) => {
    const exportData = themeService.exportTheme(theme);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `theme-${theme.id}-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  /**
   * Importer un thème
   */
  const importTheme = useCallback(
    async (file: File) => {
      if (!userId) return;

      try {
        const text = await file.text();
        const exportData = JSON.parse(text);

        if (!exportData.theme) {
          throw new Error('Format de fichier invalide');
        }

        const imported = await themeService.importTheme(userId, exportData);
        await loadAvailableThemes();
        await loadPreferences();
        return imported;
      } catch (err) {
        logger.error('Erreur importTheme:', err);
        setError(err instanceof Error ? err.message : "Erreur lors de l'import du thème");
        throw err;
      }
    },
    [userId, loadAvailableThemes, loadPreferences]
  );

  /**
   * Mettre à jour les préférences
   */
  const updatePreferences = useCallback(
    async (updates: Partial<UserThemePreferences>) => {
      if (!userId) return;

      try {
        await themeService.updateThemePreferences(userId, updates);
        await loadPreferences();
      } catch (err) {
        logger.error('Erreur updatePreferences:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour des préférences');
        throw err;
      }
    },
    [userId, loadPreferences]
  );

  /**
   * Charger les données initiales
   */
  useEffect(() => {
    if (userId) {
      loadActiveTheme();
      loadAvailableThemes();
      loadPreferences();
    }
  }, [userId, loadActiveTheme, loadAvailableThemes, loadPreferences]);

  return {
    // État
    activeTheme,
    availableThemes,
    preferences,
    isLoading,
    error,

    // Actions
    changeTheme,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    duplicateTheme,
    exportTheme,
    importTheme,
    updatePreferences,

    // Utilitaires
    isCustomTheme: (themeId: string) => {
      return availableThemes.find(t => t.id === themeId)?.isCustom || false;
    },
    getThemeById: (themeId: string) => {
      return availableThemes.find(t => t.id === themeId);
    },
  };
};
