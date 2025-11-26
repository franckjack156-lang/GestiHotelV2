/**
 * ============================================================================
 * LOGGER SYSTÈME - PRODUCTION-READY
 * ============================================================================
 *
 * Logger centralisé pour remplacer tous les console.log
 * - Désactive automatiquement les logs en production (sauf erreurs)
 * - Support de niveaux (debug, info, warn, error)
 * - Intégration Sentry pour les erreurs
 * - Formatage enrichi avec timestamps et contexte
 */

import * as Sentry from '@sentry/react';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// LogContext peut être un objet, une chaîne, unknown ou undefined pour flexibilité maximale
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogContext = Record<string, any> | string | unknown;

class Logger {
  private isDev = import.meta.env.DEV;
  private isTest = import.meta.env.MODE === 'test';

  /**
   * Log de debug (développement uniquement)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDev && !this.isTest) {
      console.debug(`[DEBUG] ${this.formatMessage(message)}`, context || '');
    }
  }

  /**
   * Log d'information (développement uniquement)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDev && !this.isTest) {
      console.info(`[INFO] ${this.formatMessage(message)}`, context || '');
    }
  }

  /**
   * Log d'avertissement (toujours affiché)
   */
  warn(message: string, context?: LogContext): void {
    if (!this.isTest) {
      console.warn(`[WARN] ${this.formatMessage(message)}`, context || '');

      // Envoyer à Sentry en production
      if (!this.isDev) {
        Sentry.captureMessage(message, {
          level: 'warning',
          contexts: { custom: context },
        });
      }
    }
  }

  /**
   * Log d'erreur (toujours affiché + envoyé à Sentry)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.isTest) {
      console.error(`[ERROR] ${this.formatMessage(message)}`, error || '', context || '');

      // Toujours envoyer à Sentry
      if (error instanceof Error) {
        Sentry.captureException(error, {
          contexts: { custom: { message, ...context } },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          contexts: { custom: context },
        });
      }
    }
  }

  /**
   * Log de performance (mesure de temps)
   */
  time(label: string): void {
    if (this.isDev && !this.isTest) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDev && !this.isTest) {
      console.timeEnd(label);
    }
  }

  /**
   * Formatage du message avec timestamp
   */
  private formatMessage(message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${message}`;
  }

  /**
   * Créer un logger avec contexte pré-rempli
   */
  withContext(baseContext: LogContext): Logger {
    const contextLogger = new Logger();

    // Override des méthodes pour inclure le contexte de base
    const originalDebug = contextLogger.debug.bind(contextLogger);
    const originalInfo = contextLogger.info.bind(contextLogger);
    const originalWarn = contextLogger.warn.bind(contextLogger);
    const originalError = contextLogger.error.bind(contextLogger);

    contextLogger.debug = (message: string, context?: LogContext) =>
      originalDebug(message, { ...baseContext, ...context });

    contextLogger.info = (message: string, context?: LogContext) =>
      originalInfo(message, { ...baseContext, ...context });

    contextLogger.warn = (message: string, context?: LogContext) =>
      originalWarn(message, { ...baseContext, ...context });

    contextLogger.error = (message: string, error?: Error | unknown, context?: LogContext) =>
      originalError(message, error, { ...baseContext, ...context });

    return contextLogger;
  }
}

// Instance singleton
export const logger = new Logger();

// Export de la classe pour les tests
export { Logger };
