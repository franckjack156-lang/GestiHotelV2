/**
 * Theme Service
 *
 * Service pour gérer les thèmes du dashboard
 */

import { db } from '@/core/config/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import type { DashboardTheme, UserThemePreferences, ThemeExportData } from '../types/theme.types';
import { presetThemes, defaultTheme } from '../config/presetThemes';

class ThemeService {
  private themesCollection = 'dashboardThemes';
  private preferencesCollection = 'themePreferences';

  /**
   * Récupérer les préférences de thème d'un utilisateur
   */
  async getUserThemePreferences(userId: string): Promise<UserThemePreferences | null> {
    try {
      const docRef = doc(db, this.preferencesCollection, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserThemePreferences;
      }

      return null;
    } catch (error) {
      console.error('Erreur getUserThemePreferences:', error);
      throw error;
    }
  }

  /**
   * Créer les préférences par défaut
   */
  async createDefaultPreferences(userId: string): Promise<UserThemePreferences> {
    const defaultPreferences: UserThemePreferences = {
      userId, // Ajout du userId requis par les règles Firestore
      activeThemeId: defaultTheme.id,
      customThemes: [],
      autoSwitchDarkMode: false,
      preferredChartStyle: 'flat',
    };

    try {
      await setDoc(doc(db, this.preferencesCollection, userId), defaultPreferences);
      return defaultPreferences;
    } catch (error) {
      console.error('Erreur createDefaultPreferences:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les préférences de thème
   */
  async updateThemePreferences(
    userId: string,
    updates: Partial<UserThemePreferences>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.preferencesCollection, userId);
      await updateDoc(docRef, updates as any);
    } catch (error) {
      console.error('Erreur updateThemePreferences:', error);
      throw error;
    }
  }

  /**
   * Récupérer un thème (prédéfini ou personnalisé)
   */
  async getTheme(themeId: string, userId?: string): Promise<DashboardTheme | null> {
    // Vérifier d'abord les thèmes prédéfinis
    if (presetThemes[themeId]) {
      return presetThemes[themeId];
    }

    // Sinon, chercher dans les thèmes personnalisés de l'utilisateur
    if (!userId) return null;

    try {
      const preferences = await this.getUserThemePreferences(userId);
      if (!preferences) return null;

      const customTheme = preferences.customThemes.find(t => t.id === themeId);
      return customTheme || null;
    } catch (error) {
      console.error('Erreur getTheme:', error);
      return null;
    }
  }

  /**
   * Récupérer le thème actif d'un utilisateur
   */
  async getActiveTheme(userId: string): Promise<DashboardTheme> {
    try {
      const preferences = await this.getUserThemePreferences(userId);

      if (!preferences) {
        await this.createDefaultPreferences(userId);
        return defaultTheme;
      }

      const theme = await this.getTheme(preferences.activeThemeId, userId);
      return theme || defaultTheme;
    } catch (error) {
      console.error('Erreur getActiveTheme:', error);
      return defaultTheme;
    }
  }

  /**
   * Définir le thème actif
   */
  async setActiveTheme(userId: string, themeId: string): Promise<void> {
    try {
      await this.updateThemePreferences(userId, { activeThemeId: themeId });
    } catch (error) {
      console.error('Erreur setActiveTheme:', error);
      throw error;
    }
  }

  /**
   * Créer un thème personnalisé
   */
  async createCustomTheme(userId: string, theme: Omit<DashboardTheme, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardTheme> {
    try {
      const preferences = await this.getUserThemePreferences(userId);
      if (!preferences) {
        await this.createDefaultPreferences(userId);
      }

      const newTheme: DashboardTheme = {
        ...theme,
        id: `custom_${Date.now()}`,
        isCustom: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const currentPrefs = await this.getUserThemePreferences(userId);
      const customThemes = currentPrefs?.customThemes || [];

      await this.updateThemePreferences(userId, {
        customThemes: [...customThemes, newTheme],
      });

      return newTheme;
    } catch (error) {
      console.error('Erreur createCustomTheme:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un thème personnalisé
   */
  async updateCustomTheme(userId: string, themeId: string, updates: Partial<DashboardTheme>): Promise<void> {
    try {
      const preferences = await this.getUserThemePreferences(userId);
      if (!preferences) return;

      const customThemes = preferences.customThemes.map(theme => {
        if (theme.id === themeId) {
          return {
            ...theme,
            ...updates,
            updatedAt: new Date(),
          };
        }
        return theme;
      });

      await this.updateThemePreferences(userId, { customThemes });
    } catch (error) {
      console.error('Erreur updateCustomTheme:', error);
      throw error;
    }
  }

  /**
   * Supprimer un thème personnalisé
   */
  async deleteCustomTheme(userId: string, themeId: string): Promise<void> {
    try {
      const preferences = await this.getUserThemePreferences(userId);
      if (!preferences) return;

      const customThemes = preferences.customThemes.filter(theme => theme.id !== themeId);

      // Si le thème supprimé était actif, revenir au thème par défaut
      const updates: Partial<UserThemePreferences> = { customThemes };
      if (preferences.activeThemeId === themeId) {
        updates.activeThemeId = defaultTheme.id;
      }

      await this.updateThemePreferences(userId, updates);
    } catch (error) {
      console.error('Erreur deleteCustomTheme:', error);
      throw error;
    }
  }

  /**
   * Dupliquer un thème
   */
  async duplicateTheme(userId: string, themeId: string): Promise<DashboardTheme> {
    try {
      const sourceTheme = await this.getTheme(themeId, userId);
      if (!sourceTheme) {
        throw new Error('Thème source introuvable');
      }

      const duplicatedTheme = await this.createCustomTheme(userId, {
        ...sourceTheme,
        name: `${sourceTheme.name} (Copie)`,
        description: sourceTheme.description,
        isCustom: true,
      });

      return duplicatedTheme;
    } catch (error) {
      console.error('Erreur duplicateTheme:', error);
      throw error;
    }
  }

  /**
   * Exporter un thème
   */
  exportTheme(theme: DashboardTheme): ThemeExportData {
    return {
      theme,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
  }

  /**
   * Importer un thème
   */
  async importTheme(userId: string, exportData: ThemeExportData): Promise<DashboardTheme> {
    try {
      const { theme } = exportData;

      // Créer un nouveau thème personnalisé à partir du thème importé
      const importedTheme = await this.createCustomTheme(userId, {
        ...theme,
        name: `${theme.name} (Importé)`,
        description: theme.description,
        colors: theme.colors,
        typography: theme.typography,
        spacing: theme.spacing,
        borderRadius: theme.borderRadius,
        shadows: theme.shadows,
        isCustom: true,
      });

      return importedTheme;
    } catch (error) {
      console.error('Erreur importTheme:', error);
      throw error;
    }
  }

  /**
   * Obtenir tous les thèmes disponibles (prédéfinis + personnalisés)
   */
  async getAllThemes(userId: string): Promise<DashboardTheme[]> {
    try {
      const preferences = await this.getUserThemePreferences(userId);
      const customThemes = preferences?.customThemes || [];
      const presetThemesList = Object.values(presetThemes);

      return [...presetThemesList, ...customThemes];
    } catch (error) {
      console.error('Erreur getAllThemes:', error);
      return Object.values(presetThemes);
    }
  }

  /**
   * Appliquer un thème (génère le CSS)
   */
  applyTheme(theme: DashboardTheme): void {
    const root = document.documentElement;

    // Appliquer les couleurs
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-error', theme.colors.error);
    root.style.setProperty('--color-info', theme.colors.info);
    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-divider', theme.colors.divider);

    // Appliquer les couleurs de graphiques
    root.style.setProperty('--chart-color-1', theme.colors.chart.color1);
    root.style.setProperty('--chart-color-2', theme.colors.chart.color2);
    root.style.setProperty('--chart-color-3', theme.colors.chart.color3);
    root.style.setProperty('--chart-color-4', theme.colors.chart.color4);
    root.style.setProperty('--chart-color-5', theme.colors.chart.color5);
    root.style.setProperty('--chart-color-6', theme.colors.chart.color6);

    // Appliquer la typographie si définie
    if (theme.typography?.fontFamily) {
      root.style.setProperty('--font-family', theme.typography.fontFamily);
    }

    // Appliquer les bordures arrondies si définies
    if (theme.borderRadius) {
      if (theme.borderRadius.sm) root.style.setProperty('--radius-sm', theme.borderRadius.sm);
      if (theme.borderRadius.md) root.style.setProperty('--radius-md', theme.borderRadius.md);
      if (theme.borderRadius.lg) root.style.setProperty('--radius-lg', theme.borderRadius.lg);
      if (theme.borderRadius.xl) root.style.setProperty('--radius-xl', theme.borderRadius.xl);
    }
  }

  /**
   * Réinitialiser au thème par défaut
   */
  resetToDefaultTheme(): void {
    this.applyTheme(defaultTheme);
  }
}

export default new ThemeService();
