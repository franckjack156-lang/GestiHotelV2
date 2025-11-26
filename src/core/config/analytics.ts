/**
 * ============================================================================
 * GOOGLE ANALYTICS 4 CONFIGURATION
 * ============================================================================
 *
 * Configuration de Google Analytics 4 pour le tracking utilisateur
 * - Événements personnalisés
 * - Conversion tracking
 * - User properties
 */

import ReactGA from 'react-ga4';
import { logger } from '@/core/utils/logger';

/**
 * Initialise Google Analytics 4
 */
export const initGA4 = () => {
  // Ne pas tracker en développement
  if (import.meta.env.DEV) {
    logger.debug('🔧 Google Analytics disabled in development mode');
    return;
  }

  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

  if (!measurementId) {
    logger.warn('⚠️ VITE_GA4_MEASUREMENT_ID not configured - Analytics tracking disabled');
    return;
  }

  ReactGA.initialize(measurementId, {
    // Configuration
    gaOptions: {
      // Anonymise l'IP pour RGPD
      anonymize_ip: true,
      // Cookie settings
      cookie_flags: 'SameSite=None;Secure',
    },
    // Options de débug
    gtagOptions: {
      // Respecte le DNT (Do Not Track)
      send_page_view: false, // Géré manuellement via pageview()
    },
  });

  logger.debug('✅ Google Analytics 4 initialized:', measurementId);
};

/**
 * Track une page view
 */
export const trackPageView = (path: string, title?: string) => {
  if (import.meta.env.DEV) return;

  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title || document.title,
  });
};

/**
 * Track un événement personnalisé
 */
export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  if (import.meta.env.DEV) {
    logger.debug('📊 GA4 Event:', { category, action, label, value });
    return;
  }

  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

/**
 * Événements business spécifiques
 */

// Interventions
export const trackInterventionCreated = (interventionType: string, priority: string) => {
  trackEvent('Intervention', 'Created', `${interventionType} - ${priority}`);
};

export const trackInterventionStatusChanged = (from: string, to: string) => {
  trackEvent('Intervention', 'Status Changed', `${from} → ${to}`);
};

export const trackInterventionAssigned = (technicianRole?: string) => {
  trackEvent('Intervention', 'Assigned', technicianRole);
};

export const trackInterventionCompleted = (duration?: number) => {
  trackEvent('Intervention', 'Completed', undefined, duration);
};

// Authentification
export const trackUserLogin = (role: string) => {
  trackEvent('Auth', 'Login', role);
};

export const trackUserLogout = () => {
  trackEvent('Auth', 'Logout');
};

// PWA
export const trackPWAInstalled = () => {
  trackEvent('PWA', 'Installed');
};

export const trackPWAUpdated = () => {
  trackEvent('PWA', 'Updated');
};

export const trackOfflineUsage = () => {
  trackEvent('PWA', 'Offline Usage');
};

// Performance
export const trackPerformanceMetric = (metric: string, value: number) => {
  trackEvent('Performance', metric, undefined, Math.round(value));
};

// Errors
export const trackError = (errorType: string, message?: string) => {
  trackEvent('Error', errorType, message);
};

// Features
export const trackFeatureUsage = (featureName: string, action: string) => {
  trackEvent('Feature', action, featureName);
};

// Recherche
export const trackSearch = (searchTerm: string, resultsCount: number) => {
  trackEvent('Search', 'Query', searchTerm, resultsCount);
};

// Export
export const trackDataExport = (exportType: string, recordCount: number) => {
  trackEvent('Export', exportType, undefined, recordCount);
};

/**
 * Configure les propriétés utilisateur (RGPD compliant)
 */
export const setUserProperties = (properties: {
  role?: string;
  establishmentType?: string;
  isTechnician?: boolean;
}) => {
  if (import.meta.env.DEV) return;

  // Ne pas envoyer d'infos personnelles (email, nom, etc.)
  ReactGA.gtag('set', 'user_properties', {
    user_role: properties.role,
    establishment_type: properties.establishmentType,
    is_technician: properties.isTechnician,
  });
};

/**
 * Reset user (à la déconnexion)
 */
export const resetUser = () => {
  if (import.meta.env.DEV) return;

  ReactGA.gtag('config', import.meta.env.VITE_GA4_MEASUREMENT_ID, {
    user_id: undefined,
  });
};
