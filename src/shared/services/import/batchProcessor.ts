/**
 * ============================================================================
 * BATCH PROCESSOR - Traitement par lots avec gestion d'erreurs avancée
 * ============================================================================
 *
 * Gère l'import de grandes quantités de données avec :
 * - Traitement par lots (batch)
 * - Retry automatique sur erreur
 * - Progression en temps réel
 * - Pause/reprise
 * - Rapport d'erreurs détaillé
 */

import { logger } from '@/core/utils/logger';

/**
 * Options du batch processor
 */
export interface BatchProcessorOptions<T> {
  /** Taille d'un lot */
  batchSize?: number;
  /** Nombre maximum de tentatives par élément */
  maxRetries?: number;
  /** Délai entre les tentatives (ms) */
  retryDelay?: number;
  /** Délai entre les lots (ms) pour éviter la surcharge */
  batchDelay?: number;
  /** Fonction appelée à chaque progression */
  onProgress?: (progress: BatchProgress) => void;
  /** Fonction appelée à chaque erreur */
  onError?: (error: BatchError<T>) => void;
  /** Signal d'annulation */
  abortSignal?: AbortSignal;
}

/**
 * État de progression
 */
export interface BatchProgress {
  /** Nombre total d'éléments */
  total: number;
  /** Nombre traités */
  processed: number;
  /** Nombre réussis */
  succeeded: number;
  /** Nombre échoués */
  failed: number;
  /** Pourcentage de progression */
  percentage: number;
  /** Lot actuel */
  currentBatch: number;
  /** Nombre total de lots */
  totalBatches: number;
  /** Temps estimé restant (ms) */
  estimatedTimeRemaining?: number;
  /** Temps écoulé (ms) */
  elapsedTime: number;
}

/**
 * Erreur d'un élément
 */
export interface BatchError<T> {
  /** Élément qui a échoué */
  item: T;
  /** Index de l'élément */
  index: number;
  /** Message d'erreur */
  error: string;
  /** Nombre de tentatives effectuées */
  attempts: number;
  /** Erreur originale */
  originalError?: unknown;
}

/**
 * Résultat du traitement
 */
export interface BatchResult<T, R> {
  /** Résultats réussis */
  succeeded: Array<{ item: T; result: R; index: number }>;
  /** Éléments échoués */
  failed: Array<BatchError<T>>;
  /** Statistiques */
  stats: {
    total: number;
    succeeded: number;
    failed: number;
    duration: number;
    averageTimePerItem: number;
  };
  /** A été annulé */
  aborted: boolean;
}

/**
 * Délai avec support d'annulation
 */
const delay = (ms: number, signal?: AbortSignal): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Aborted'));
      });
    }
  });
};

/**
 * Traite un élément avec retry
 */
async function processWithRetry<T, R>(
  item: T,
  index: number,
  processor: (item: T, index: number) => Promise<R>,
  options: BatchProcessorOptions<T>
): Promise<{ success: true; result: R } | { success: false; error: BatchError<T> }> {
  const { maxRetries = 3, retryDelay = 1000, onError } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await processor(item, index);
      return { success: true, result };
    } catch (error) {
      lastError = error;
      logger.warn(`Tentative ${attempt}/${maxRetries} échouée pour l'élément ${index}`, { error });

      if (attempt < maxRetries) {
        // Attendre avant de réessayer avec backoff exponentiel
        await delay(retryDelay * attempt, options.abortSignal);
      }
    }
  }

  const batchError: BatchError<T> = {
    item,
    index,
    error: lastError instanceof Error ? lastError.message : String(lastError),
    attempts: maxRetries,
    originalError: lastError,
  };

  onError?.(batchError);

  return { success: false, error: batchError };
}

/**
 * Traite un lot d'éléments en parallèle
 */
async function processBatch<T, R>(
  batch: T[],
  startIndex: number,
  processor: (item: T, index: number) => Promise<R>,
  options: BatchProcessorOptions<T>
): Promise<{
  succeeded: Array<{ item: T; result: R; index: number }>;
  failed: Array<BatchError<T>>;
}> {
  const results = await Promise.all(
    batch.map((item, i) => processWithRetry(item, startIndex + i, processor, options))
  );

  const succeeded: Array<{ item: T; result: R; index: number }> = [];
  const failed: Array<BatchError<T>> = [];

  results.forEach((result, i) => {
    if (result.success) {
      succeeded.push({
        item: batch[i],
        result: result.result,
        index: startIndex + i,
      });
    } else {
      failed.push(result.error);
    }
  });

  return { succeeded, failed };
}

/**
 * Processor principal pour traitement par lots
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: BatchProcessorOptions<T> = {}
): Promise<BatchResult<T, R>> {
  const { batchSize = 10, batchDelay = 100, onProgress, abortSignal } = options;

  const startTime = Date.now();
  const totalBatches = Math.ceil(items.length / batchSize);

  const allSucceeded: Array<{ item: T; result: R; index: number }> = [];
  const allFailed: Array<BatchError<T>> = [];

  let processed = 0;

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    // Vérifier l'annulation
    if (abortSignal?.aborted) {
      logger.info("Traitement annulé par l'utilisateur");
      break;
    }

    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, items.length);
    const batch = items.slice(start, end);

    logger.debug(`Traitement du lot ${batchIndex + 1}/${totalBatches} (${batch.length} éléments)`);

    const { succeeded, failed } = await processBatch(batch, start, processor, options);

    allSucceeded.push(...succeeded);
    allFailed.push(...failed);

    processed = end;

    // Calculer le temps estimé restant
    const elapsedTime = Date.now() - startTime;
    const avgTimePerItem = elapsedTime / processed;
    const remainingItems = items.length - processed;
    const estimatedTimeRemaining = Math.round(avgTimePerItem * remainingItems);

    // Émettre la progression
    onProgress?.({
      total: items.length,
      processed,
      succeeded: allSucceeded.length,
      failed: allFailed.length,
      percentage: Math.round((processed / items.length) * 100),
      currentBatch: batchIndex + 1,
      totalBatches,
      estimatedTimeRemaining,
      elapsedTime,
    });

    // Pause entre les lots pour éviter la surcharge
    if (batchIndex < totalBatches - 1 && batchDelay > 0) {
      await delay(batchDelay, abortSignal);
    }
  }

  const duration = Date.now() - startTime;

  return {
    succeeded: allSucceeded,
    failed: allFailed,
    stats: {
      total: items.length,
      succeeded: allSucceeded.length,
      failed: allFailed.length,
      duration,
      averageTimePerItem: duration / items.length,
    },
    aborted: abortSignal?.aborted || false,
  };
}

/**
 * Crée un controller d'annulation
 */
export function createAbortController(): {
  controller: AbortController;
  abort: () => void;
  signal: AbortSignal;
} {
  const controller = new AbortController();
  return {
    controller,
    abort: () => controller.abort(),
    signal: controller.signal,
  };
}
