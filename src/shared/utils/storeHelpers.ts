/**
 * ============================================================================
 * STORE HELPERS - RÉDUCTION DE DUPLICATION
 * ============================================================================
 *
 * Helpers pour gérer les patterns répétitifs dans les stores Zustand
 * - withLoading : Wrapper pour opérations async avec loading/error
 * - withErrorHandling : Gestion centralisée des erreurs
 * - withRetry : Retry automatique avec backoff exponentiel
 */

import { logger } from '@/core/utils/logger';

/**
 * Interface pour les stores avec loading/error
 */
export interface LoadingStore {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Wrapper pour opérations async avec gestion automatique du loading/error
 *
 * @example
 * const login = (credentials: AuthCredentials) =>
 *   withLoading(useAuthStore.getState(), async () => {
 *     return await authService.loginWithEmail(credentials);
 *   });
 */
export const withLoading = async <T>(
  store: LoadingStore,
  fn: () => Promise<T>,
  options?: {
    errorMessage?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
  }
): Promise<T> => {
  store.setLoading(true);
  store.setError(null);

  try {
    const result = await fn();

    if (options?.onSuccess) {
      options.onSuccess(result);
    }

    return result;
  } catch (error) {
    const errorMessage =
      options?.errorMessage ||
      (error instanceof Error ? error.message : 'Une erreur est survenue');

    store.setError(errorMessage);

    logger.error('Erreur dans withLoading', error as Error, {
      errorMessage,
    });

    if (options?.onError && error instanceof Error) {
      options.onError(error);
    }

    throw error;
  } finally {
    store.setLoading(false);
  }
};

/**
 * Wrapper pour retry automatique avec backoff exponentiel
 *
 * @example
 * const data = await withRetry(
 *   () => fetchDataFromAPI(),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Dernière tentative ou erreur non-retriable
      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      logger.warn(`Tentative ${attempt + 1}/${maxRetries} échouée, retry dans ${delay}ms`, {
        error: lastError.message,
      });

      // Attendre avant de retry
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Augmenter le délai avec backoff exponentiel
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
};

/**
 * Wrapper pour gestion des erreurs avec fallback
 *
 * @example
 * const user = await withErrorHandling(
 *   () => userService.getUser(id),
 *   { fallback: null, logError: true }
 * );
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  options: {
    fallback?: T;
    logError?: boolean;
    errorMessage?: string;
    rethrow?: boolean;
  } = {}
): Promise<T | undefined> => {
  const { fallback, logError = true, errorMessage, rethrow = false } = options;

  try {
    return await fn();
  } catch (error) {
    if (logError) {
      const message = errorMessage || 'Erreur dans withErrorHandling';
      logger.error(message, error as Error);
    }

    if (rethrow) {
      throw error;
    }

    return fallback;
  }
};

/**
 * Debounce pour éviter les appels trop fréquents
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   searchService.search(query);
 * }, 300);
 */
export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

/**
 * Throttle pour limiter la fréquence d'exécution
 *
 * @example
 * const throttledScroll = throttle(() => {
 *   handleScroll();
 * }, 100);
 */
export const throttle = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};
