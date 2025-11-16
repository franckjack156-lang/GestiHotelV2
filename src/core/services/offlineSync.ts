/**
 * ============================================================================
 * OFFLINE SYNC SERVICE
 * ============================================================================
 *
 * Service de synchronisation différée
 * - Background Sync API
 * - Retry logic
 * - Conflict resolution
 */

import {
  getPendingSyncs,
  markSyncComplete,
  incrementSyncRetries,
  clearFailedSyncs,
  type PendingSync,
} from './offlineDatabase';
import {
  createIntervention,
  updateIntervention,
  deleteIntervention,
} from '@/features/interventions/services/interventionService';
import { toast } from 'sonner';

// ============================================================================
// SYNC MANAGER
// ============================================================================

export class OfflineSyncManager {
  private isSyncing = false;
  private syncInterval: number | null = null;

  /**
   * Démarrer la synchronisation automatique
   */
  startAutoSync(intervalMs: number = 30000) {
    if (this.syncInterval) {
      return;
    }

    // Synchroniser toutes les 30 secondes
    this.syncInterval = window.setInterval(() => {
      this.syncAll();
    }, intervalMs);

    // Synchroniser immédiatement
    this.syncAll();
  }

  /**
   * Arrêter la synchronisation automatique
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Synchroniser toutes les opérations en attente
   */
  async syncAll(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      return { success: 0, failed: 0 };
    }

    // Vérifier la connexion réseau
    if (!navigator.onLine) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      const pendingSyncs = await getPendingSyncs();

      for (const sync of pendingSyncs) {
        try {
          await this.syncOperation(sync);
          await markSyncComplete(sync.id!);
          successCount++;
        } catch (error) {
          console.error(`Sync failed for ${sync.collection}:${sync.documentId}`, error);
          await incrementSyncRetries(
            sync.id!,
            error instanceof Error ? error.message : 'Unknown error'
          );
          failedCount++;
        }
      }

      // Nettoyer les syncs échoués (> 5 tentatives)
      await clearFailedSyncs();

      if (successCount > 0) {
        toast.success(`${successCount} modification(s) synchronisée(s)`);
      }
    } finally {
      this.isSyncing = false;
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Synchroniser une opération
   */
  private async syncOperation(sync: PendingSync): Promise<void> {
    switch (sync.collection) {
      case 'interventions':
        return this.syncIntervention(sync);
      case 'rooms':
        return this.syncRoom(sync);
      // Ajouter d'autres collections ici
      default:
        throw new Error(`Unknown collection: ${sync.collection}`);
    }
  }

  /**
   * Synchroniser une intervention
   */
  private async syncIntervention(sync: PendingSync): Promise<void> {
    const { operation, data, documentId } = sync;

    switch (operation) {
      case 'create':
        if (!data.createdBy) {
          throw new Error('createdBy is required for intervention creation');
        }
        // Cast les données vers le type CreateInterventionData
        await createIntervention(data.establishmentId, data.createdBy, data as any);
        break;
      case 'update':
        // Synchroniser la mise à jour de l'intervention
        // Cast les données vers le type UpdateInterventionData
        await updateIntervention(data.establishmentId, documentId, data as any);
        break;
      case 'delete':
        // Synchroniser la suppression de l'intervention (soft delete)
        if (!data.userId) {
          throw new Error('userId is required for intervention deletion');
        }
        await deleteIntervention(data.establishmentId, documentId, data.userId);
        break;
    }
  }

  /**
   * Synchroniser une chambre
   */
  private async syncRoom(sync: PendingSync): Promise<void> {
    // TODO: Implémenter la synchronisation des chambres
    console.log('Sync room:', sync);
  }

  /**
   * Forcer une synchronisation immédiate
   */
  async forceSyncNow() {
    return this.syncAll();
  }

  /**
   * Obtenir le statut de synchronisation
   */
  async getSyncStatus() {
    const pendingSyncs = await getPendingSyncs();
    return {
      pending: pendingSyncs.length,
      failed: pendingSyncs.filter(s => s.retries > 0).length,
      isSyncing: this.isSyncing,
    };
  }
}

// Singleton instance
export const offlineSyncManager = new OfflineSyncManager();

// ============================================================================
// BACKGROUND SYNC (Service Worker API)
// ============================================================================

/**
 * Enregistrer une tâche de synchronisation en arrière-plan
 */
export const registerBackgroundSync = async (tag: string) => {
  // Vérifier le support de Background Sync API
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // Vérifier si la propriété sync existe (Background Sync API)
      if ('sync' in registration) {
        await (registration as any).sync.register(tag);
        console.log(`Background sync registered: ${tag}`);
      } else {
        // Background Sync API not supported, fallback
        console.warn('Background Sync API not supported');
        await offlineSyncManager.syncAll();
      }
    } catch (error) {
      console.error('Background sync registration failed:', error);
      // Fallback: synchroniser immédiatement
      await offlineSyncManager.syncAll();
    }
  } else {
    // Service Worker not supported
    console.warn('Service Worker not supported');
    await offlineSyncManager.syncAll();
  }
};

/**
 * Enregistrer une synchronisation après une opération offline
 */
export const requestSync = async () => {
  return registerBackgroundSync('gestihotel-sync');
};
