/**
 * Theme Types
 *
 * Types pour la gestion des thèmes personnalisables du dashboard
 */

/**
 * Palette de couleurs pour un thème
 */
export interface ColorPalette {
  // Couleurs principales
  primary: string;
  secondary: string;
  accent: string;

  // Couleurs de fond
  background: string;
  surface: string;

  // Couleurs de texte
  textPrimary: string;
  textSecondary: string;

  // Couleurs de statut
  success: string;
  warning: string;
  error: string;
  info: string;

  // Couleurs des graphiques
  chart: {
    color1: string;
    color2: string;
    color3: string;
    color4: string;
    color5: string;
    color6: string;
  };

  // Bordures et séparateurs
  border: string;
  divider: string;
}

/**
 * Configuration de typographie
 */
export interface Typography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

/**
 * Configuration d'espacement
 */
export interface Spacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Configuration des bordures
 */
export interface BorderRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

/**
 * Configuration des ombres
 */
export interface Shadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Configuration complète d'un thème
 */
export interface DashboardTheme {
  id: string;
  name: string;
  description: string;
  colors: ColorPalette;
  typography?: Partial<Typography>;
  spacing?: Partial<Spacing>;
  borderRadius?: Partial<BorderRadius>;
  shadows?: Partial<Shadows>;
  isCustom: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Type de thème prédéfini
 */
export type PresetThemeType = 'classic' | 'modern' | 'dark' | 'light' | 'colorful';

/**
 * Configuration de graphique pour un thème
 */
export interface ChartThemeConfig {
  colors: string[];
  strokeWidth: number;
  gridColor: string;
  axisColor: string;
  tooltipBackground: string;
  tooltipText: string;
}

/**
 * Préférences de thème utilisateur
 */
export interface UserThemePreferences {
  userId: string;
  activeThemeId: string;
  customThemes: DashboardTheme[];
  autoSwitchDarkMode: boolean;
  preferredChartStyle: 'flat' | 'gradient' | '3d';
}

/**
 * Options d'export de thème
 */
export interface ThemeExportData {
  theme: DashboardTheme;
  exportDate: string;
  version: string;
}
