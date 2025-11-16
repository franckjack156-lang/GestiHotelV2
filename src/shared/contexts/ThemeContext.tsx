/**
 * ============================================================================
 * THEME CONTEXT
 * ============================================================================
 *
 * Context pour gérer le thème (light/dark mode)
 * - Persistance dans localStorage
 * - Respect des préférences système
 * - Toggle facile entre les thèmes
 */

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'gestihotel-theme';

/**
 * Détecte si le système préfère le dark mode
 */
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const result = prefersDark ? 'dark' : 'light';
  console.log('🖥️ getSystemTheme:', { prefersDark, result });
  return result;
};

/**
 * Récupère le thème stocké ou 'system' par défaut
 */
const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  console.log('💾 localStorage theme:', stored);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }

  return 'system';
};

/**
 * Provider du contexte de thème
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme();
    console.log('🎯 Initial theme:', stored);
    return stored;
  });
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    const system = getSystemTheme();
    console.log('🎯 Initial systemTheme:', system);
    return system;
  });

  // Écouter les changements de préférence système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Calculer le thème actuel basé sur le choix de l'utilisateur
  const actualTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme;
  console.log('🔄 actualTheme calculation:', { theme, systemTheme, actualTheme });

  // Appliquer le thème au document
  useEffect(() => {
    console.log('🎨 Application du thème au DOM:', { actualTheme, theme, systemTheme });
    const root = document.documentElement;

    // Retirer les anciennes classes
    root.classList.remove('light', 'dark');

    // Ajouter la nouvelle classe
    root.classList.add(actualTheme);
    console.log('✅ Classes DOM:', root.classList.toString());

    // Mettre à jour la meta theme-color pour PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', actualTheme === 'dark' ? '#1f2937' : '#ffffff');
    }
  }, [actualTheme]);

  /**
   * Change le thème et persiste dans localStorage
   */
  const setTheme = (newTheme: Theme) => {
    console.log('📝 ThemeContext.setTheme appelé:', { current: theme, new: newTheme, actualTheme });
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    console.log('✅ Thème changé et sauvegardé dans localStorage');
  };

  /**
   * Toggle entre light et dark (ignore system)
   */
  const toggleTheme = () => {
    const newTheme = actualTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Hook pour utiliser le thème
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
