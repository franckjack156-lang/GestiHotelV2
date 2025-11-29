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

// LogContext accepte tout type pour flexibilité maximale
type LogContext = unknown;

// Type strict pour les objets de contexte (utilisé internement)
type LogContextObject = Record<string, unknown>;
class Logger {
  private isDev = import.meta.env.DEV;
  private isTest = import.meta.env.MODE === 'test';

  /**
   * Log de debug (développement uniquement)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDev && !this.isTest) {
      console.debug(`[DEBUG] ${this.formatMessage(message)}`, context ?? '');
    }
  }

  /**
   * Log d'information (développement uniquement)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDev && !this.isTest) {
      console.info(`[INFO] ${this.formatMessage(message)}`, context ?? '');
    }
  }

  /**
   * Log d'avertissement (toujours affiché)
   */
  warn(message: string, context?: LogContext): void {
    if (!this.isTest) {
      console.warn(`[WARN] ${this.formatMessage(message)}`, context ?? '');

      // Envoyer à Sentry en production
      if (!this.isDev) {
        Sentry.captureMessage(message, {
          level: 'warning',
          contexts: { custom: this.toContextObject(context) },
        });
      }
    }
  }

  /**
   * Log d'erreur (toujours affiché + envoyé à Sentry)
   * Supporte deux signatures:
   * - error(message: string, error?: Error | unknown, context?: LogContext)
   * - error(error: unknown) - raccourci pour logger une erreur directement
   */
  error(messageOrError: string | unknown, error?: Error | unknown, context?: LogContext): void {
    if (!this.isTest) {
      // Si le premier argument n'est pas une string, c'est une erreur directe
      if (typeof messageOrError !== 'string') {
        const err = messageOrError;
        const errMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
        console.error(`[ERROR] ${this.formatMessage(errMessage)}`, err);

        if (err instanceof Error) {
          Sentry.captureException(err);
        } else {
          Sentry.captureMessage(errMessage, { level: 'error' });
        }
        return;
      }

      // Signature classique: message + error + context
      const message = messageOrError;
      console.error(`[ERROR] ${this.formatMessage(message)}`, error ?? '', context ?? '');

      // Toujours envoyer à Sentry
      if (error instanceof Error) {
        Sentry.captureException(error, {
          contexts: { custom: { message, ...this.toContextObject(context) } },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          contexts: { custom: this.toContextObject(context) },
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
   * Convertit un contexte quelconque en objet pour Sentry
   */
  private toContextObject(context: LogContext): LogContextObject | undefined {
    if (context === undefined || context === null) {
      return undefined;
    }
    if (typeof context === 'object' && !Array.isArray(context)) {
      return context as LogContextObject;
    }
    return { value: context };
  }

  /**
   * Créer un logger avec contexte pré-rempli
   */
  withContext(baseContext: LogContextObject): Logger {
    const contextLogger = new Logger();

    // Override des méthodes pour inclure le contexte de base
    const originalDebug = contextLogger.debug.bind(contextLogger);
    const originalInfo = contextLogger.info.bind(contextLogger);
    const originalWarn = contextLogger.warn.bind(contextLogger);
    const originalError = contextLogger.error.bind(contextLogger);

    contextLogger.debug = (message: string, context?: LogContext) =>
      originalDebug(message, { ...baseContext, ...this.toContextObject(context) });

    contextLogger.info = (message: string, context?: LogContext) =>
      originalInfo(message, { ...baseContext, ...this.toContextObject(context) });

    contextLogger.warn = (message: string, context?: LogContext) =>
      originalWarn(message, { ...baseContext, ...this.toContextObject(context) });

    contextLogger.error = (message: string, error?: Error | unknown, context?: LogContext) =>
      originalError(message, error, { ...baseContext, ...this.toContextObject(context) });

    return contextLogger;
  }
}

// Instance singleton
export const logger = new Logger();

// Export de la classe pour les tests
export { Logger };
