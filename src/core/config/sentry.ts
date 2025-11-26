/**
 * ============================================================================
 * SENTRY CONFIGURATION
 * ============================================================================
 *
 * Configuration du monitoring d'erreurs avec Sentry
 * - Error tracking en production
 * - Performance monitoring
 * - User feedback
 */

import * as Sentry from '@sentry/react';
import { logger } from '@/core/utils/logger';

/**
 * Initialise Sentry pour le monitoring d'erreurs
 */
export const initSentry = () => {
  // Ne pas initialiser Sentry en développement local
  if (import.meta.env.DEV) {
    logger.debug('🔧 Sentry disabled in development mode');
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    logger.warn('⚠️ VITE_SENTRY_DSN not configured - Sentry tracking disabled');
    return;
  }

  Sentry.init({
    dsn,

    // Environment
    environment: import.meta.env.PROD ? 'production' : 'staging',

    // Release tracking (utilise le hash du commit Git)
    release: import.meta.env.VITE_APP_VERSION || 'development',

    // Performance Monitoring
    integrations: [
      // Browser Tracing pour les performances
      Sentry.browserTracingIntegration(),

      // Replay pour voir les sessions utilisateur
      Sentry.replayIntegration({
        maskAllText: true, // Masque le texte pour RGPD
        blockAllMedia: true, // Bloque les médias
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% en prod, 100% en staging

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% des sessions
    replaysOnErrorSampleRate: 1.0, // 100% des sessions avec erreurs

    // Ignore les erreurs connues/non critiques
    ignoreErrors: [
      // Erreurs réseau
      'Network request failed',
      'Failed to fetch',
      'NetworkError',

      // Erreurs navigateur
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',

      // Erreurs d'extensions navigateur
      /chrome-extension/,
      /moz-extension/,
    ],

    // Filtre les transactions non pertinentes
    beforeSend(event, hint) {
      // En développement, log l'erreur et ne l'envoie pas
      if (import.meta.env.DEV) {
        logger.error('Sentry Event (not sent):', event, hint);
        return null;
      }

      return event;
    },

    // Configure les données utilisateur (respecte RGPD)
    beforeSendTransaction(event) {
      // Retire les données sensibles
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      return event;
    },
  });

  logger.debug('✅ Sentry initialized:', {
    environment: Sentry.getCurrentScope().getClient()?.getOptions().environment,
    release: Sentry.getCurrentScope().getClient()?.getOptions().release,
  });
};

/**
 * Configure le contexte utilisateur Sentry
 */
export const setSentryUser = (user: {
  id: string;
  role?: string;
  currentEstablishmentId?: string;
}) => {
  Sentry.setUser({
    id: user.id,
    // Ne pas inclure d'infos personnelles (RGPD)
    // email, nom, etc. ne doivent PAS être envoyés
    role: user.role,
    currentEstablishmentId: user.currentEstablishmentId,
  });
};

/**
 * Retire le contexte utilisateur (à la déconnexion)
 */
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

/**
 * Capture une erreur manuellement
 */
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.setContext('additional_context', context);
  }
  Sentry.captureException(error);
};

/**
 * Capture un message (non-erreur)
 */
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * Ajoute un breadcrumb (fil d'Ariane pour débug)
 */
export const addBreadcrumb = (breadcrumb: {
  message: string;
  category?: string;
  level?: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}) => {
  Sentry.addBreadcrumb(breadcrumb);
};
