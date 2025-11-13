/**
 * useApplyPreferences Hook
 *
 * Hook pour appliquer les préférences utilisateur à l'interface
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserPreferences } from './useUserPreferences';

/**
 * Couleurs de thème disponibles
 */
const THEME_COLORS = {
  blue: {
    primary: '238.7 83.5% 66.7%',
    primaryDark: '238.7 83.5% 56%',
    primaryLight: '238.7 83.5% 76%',
    ring: '238.7 83.5% 66.7%',
  },
  green: {
    primary: '142 76% 46%',
    primaryDark: '142 76% 36%',
    primaryLight: '142 76% 56%',
    ring: '142 76% 46%',
  },
  purple: {
    primary: '262 83% 58%',
    primaryDark: '262 83% 48%',
    primaryLight: '262 83% 68%',
    ring: '262 83% 58%',
  },
  orange: {
    primary: '25 95% 53%',
    primaryDark: '25 95% 43%',
    primaryLight: '25 95% 63%',
    ring: '25 95% 53%',
  },
  red: {
    primary: '0 72% 51%',
    primaryDark: '0 72% 41%',
    primaryLight: '0 72% 61%',
    ring: '0 72% 51%',
  },
  pink: {
    primary: '330 81% 60%',
    primaryDark: '330 81% 50%',
    primaryLight: '330 81% 70%',
    ring: '330 81% 60%',
  },
};

export const useApplyPreferences = () => {
  const { displayPreferences } = useUserPreferences();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!displayPreferences) {
      console.log('❌ No display preferences found');
      return;
    }

    console.log('🎨 Applying preferences:', displayPreferences);

    const root = document.documentElement;

    // Appliquer le thème (clair/sombre/auto)
    const { theme } = displayPreferences;
    console.log('Theme:', theme);

    if (theme === 'dark') {
      root.classList.add('dark');
      console.log('✅ Applied dark theme');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      console.log('✅ Applied light theme');
    } else if (theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      console.log('✅ Applied auto theme (system:', isDark ? 'dark' : 'light', ')');
    }

    // Appliquer la couleur du thème
    const color = displayPreferences.themeColor || 'blue';
    const colorValues = THEME_COLORS[color];
    console.log('Color:', color, colorValues);

    root.style.setProperty('--primary', colorValues.primary);
    root.style.setProperty('--ring', colorValues.ring);
    root.style.setProperty('--theme-primary', colorValues.primary);
    root.style.setProperty('--theme-primary-dark', colorValues.primaryDark);
    root.style.setProperty('--theme-primary-light', colorValues.primaryLight);
    console.log('✅ Applied color theme:', color);

    // Appliquer la densité
    const { density } = displayPreferences;
    console.log('Density:', density);

    root.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    root.classList.add(`density-${density}`);
    console.log('✅ Applied density:', density, '- Classes:', root.classList.toString());

    // Appliquer la langue
    const language = displayPreferences.language;
    root.setAttribute('lang', language);

    // Ne changer la langue que si elle est différente (éviter la boucle infinie)
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
      console.log('✅ Applied language:', language);
    }

    // Écouter les changements de préférences système pour le mode auto
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const isDark = mediaQuery.matches;
        if (isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        console.log('🔄 System theme changed:', isDark ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [displayPreferences]);
};
