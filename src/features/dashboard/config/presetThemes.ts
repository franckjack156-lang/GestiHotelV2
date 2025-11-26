/**
 * Preset Themes
 *
 * Thèmes prédéfinis pour le dashboard
 */

import type { DashboardTheme } from '../types/theme.types';

/**
 * Thème Classique - Style traditionnel et professionnel
 */
export const classicTheme: DashboardTheme = {
  id: 'classic',
  name: 'Classique',
  description: 'Style traditionnel et professionnel pour un environnement de travail',
  isCustom: false,
  colors: {
    primary: '#2563eb', // Blue-600
    secondary: '#64748b', // Slate-500
    accent: '#0ea5e9', // Sky-500

    background: '#ffffff',
    surface: '#f8fafc', // Slate-50

    textPrimary: '#0f172a', // Slate-900
    textSecondary: '#64748b', // Slate-500

    success: '#10b981', // Green-500
    warning: '#f59e0b', // Amber-500
    error: '#ef4444', // Red-500
    info: '#3b82f6', // Blue-500

    chart: {
      color1: '#3b82f6', // Blue
      color2: '#10b981', // Green
      color3: '#f59e0b', // Amber
      color4: '#8b5cf6', // Purple
      color5: '#ec4899', // Pink
      color6: '#06b6d4', // Cyan
    },

    border: '#e2e8f0', // Slate-200
    divider: '#cbd5e1', // Slate-300
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
};

/**
 * Thème Moderne - Design épuré et minimaliste
 */
export const modernTheme: DashboardTheme = {
  id: 'modern',
  name: 'Moderne',
  description: 'Design épuré et minimaliste avec des couleurs vives',
  isCustom: false,
  colors: {
    primary: '#6366f1', // Indigo-500
    secondary: '#a855f7', // Purple-500
    accent: '#ec4899', // Pink-500

    background: '#fafafa', // Neutral-50
    surface: '#ffffff',

    textPrimary: '#171717', // Neutral-900
    textSecondary: '#737373', // Neutral-500

    success: '#22c55e', // Green-500
    warning: '#eab308', // Yellow-500
    error: '#f43f5e', // Rose-500
    info: '#06b6d4', // Cyan-500

    chart: {
      color1: '#6366f1', // Indigo
      color2: '#a855f7', // Purple
      color3: '#ec4899', // Pink
      color4: '#14b8a6', // Teal
      color5: '#f97316', // Orange
      color6: '#84cc16', // Lime
    },

    border: '#e5e5e5', // Neutral-200
    divider: '#d4d4d4', // Neutral-300
  },
  typography: {
    fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.15)',
    lg: '0 10px 20px -3px rgb(0 0 0 / 0.15)',
    xl: '0 20px 30px -5px rgb(0 0 0 / 0.2)',
  },
};

/**
 * Thème Sombre - Mode nuit élégant
 */
export const darkTheme: DashboardTheme = {
  id: 'dark',
  name: 'Sombre',
  description: 'Mode nuit élégant pour réduire la fatigue oculaire',
  isCustom: false,
  colors: {
    primary: '#60a5fa', // Blue-400
    secondary: '#818cf8', // Indigo-400
    accent: '#a78bfa', // Violet-400

    background: '#0f172a', // Slate-900
    surface: '#1e293b', // Slate-800

    textPrimary: '#f1f5f9', // Slate-100
    textSecondary: '#94a3b8', // Slate-400

    success: '#34d399', // Emerald-400
    warning: '#fbbf24', // Amber-400
    error: '#f87171', // Red-400
    info: '#38bdf8', // Sky-400

    chart: {
      color1: '#60a5fa', // Blue-400
      color2: '#34d399', // Emerald-400
      color3: '#fbbf24', // Amber-400
      color4: '#a78bfa', // Violet-400
      color5: '#f472b6', // Pink-400
      color6: '#2dd4bf', // Teal-400
    },

    border: '#334155', // Slate-700
    divider: '#475569', // Slate-600
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.6)',
  },
};

/**
 * Thème Coloré - Palette vibrante et énergique
 */
export const colorfulTheme: DashboardTheme = {
  id: 'colorful',
  name: 'Coloré',
  description: 'Palette vibrante et énergique pour un dashboard dynamique',
  isCustom: false,
  colors: {
    primary: '#8b5cf6', // Violet-500
    secondary: '#ec4899', // Pink-500
    accent: '#f59e0b', // Amber-500

    background: '#fefce8', // Yellow-50
    surface: '#ffffff',

    textPrimary: '#1f2937', // Gray-800
    textSecondary: '#6b7280', // Gray-500

    success: '#10b981', // Emerald-500
    warning: '#f59e0b', // Amber-500
    error: '#ef4444', // Red-500
    info: '#3b82f6', // Blue-500

    chart: {
      color1: '#8b5cf6', // Violet
      color2: '#ec4899', // Pink
      color3: '#f59e0b', // Amber
      color4: '#10b981', // Emerald
      color5: '#3b82f6', // Blue
      color6: '#f97316', // Orange
    },

    border: '#fef3c7', // Amber-100
    divider: '#fde68a', // Amber-200
  },
  typography: {
    fontFamily: 'Poppins, Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 2px 4px 0 rgb(139 92 246 / 0.1)',
    md: '0 6px 12px -2px rgb(139 92 246 / 0.15)',
    lg: '0 12px 24px -4px rgb(139 92 246 / 0.2)',
    xl: '0 24px 48px -8px rgb(139 92 246 / 0.25)',
  },
};

/**
 * Thème Clair - Version lumineuse et aérée
 */
export const lightTheme: DashboardTheme = {
  id: 'light',
  name: 'Clair',
  description: 'Version lumineuse et aérée pour une clarté maximale',
  isCustom: false,
  colors: {
    primary: '#0ea5e9', // Sky-500
    secondary: '#06b6d4', // Cyan-500
    accent: '#14b8a6', // Teal-500

    background: '#ffffff',
    surface: '#f0f9ff', // Sky-50

    textPrimary: '#0c4a6e', // Sky-900
    textSecondary: '#075985', // Sky-800

    success: '#059669', // Emerald-600
    warning: '#d97706', // Amber-600
    error: '#dc2626', // Red-600
    info: '#2563eb', // Blue-600

    chart: {
      color1: '#0ea5e9', // Sky
      color2: '#06b6d4', // Cyan
      color3: '#14b8a6', // Teal
      color4: '#10b981', // Emerald
      color5: '#3b82f6', // Blue
      color6: '#6366f1', // Indigo
    },

    border: '#e0f2fe', // Sky-100
    divider: '#bae6fd', // Sky-200
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(14 165 233 / 0.05)',
    md: '0 4px 6px -1px rgb(14 165 233 / 0.1)',
    lg: '0 10px 15px -3px rgb(14 165 233 / 0.15)',
    xl: '0 20px 25px -5px rgb(14 165 233 / 0.2)',
  },
};

/**
 * Map de tous les thèmes prédéfinis
 */
export const presetThemes: Record<string, DashboardTheme> = {
  classic: classicTheme,
  modern: modernTheme,
  dark: darkTheme,
  colorful: colorfulTheme,
  light: lightTheme,
};

/**
 * Liste des thèmes prédéfinis
 */
export const presetThemesList: DashboardTheme[] = Object.values(presetThemes);

/**
 * Thème par défaut
 */
export const defaultTheme = classicTheme;
