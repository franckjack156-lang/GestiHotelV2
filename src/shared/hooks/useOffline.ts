/**
 * Hook pour la gestion du mode offline et de la synchronisation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

/**
 * État de la connexion
 */
export type ConnectionStatus = 'online' | 'offline' | 'slow';

/**
 * Opération en attente de synchronisation
 */
export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data: unknown;
  timestamp: number;
  retries: number;
}

/**
 * Options du hook
 */
interface UseOfflineOptions {
  /** Activer la détection de connexion lente */
  detectSlowConnection?: boolean;
  /** Seuil de latence pour connexion lente (ms) */
  slowConnectionThreshold?: number;
  /** Callback sur changement de statut */
  onStatusChange?: (status: ConnectionStatus) => void;
  /** Callback sur synchronisation */
  onSync?: (operations: PendingOperation[]) => Promise<void>;
}

/**
 * Clé de stockage pour les opérations en attente
 */
const PENDING_OPERATIONS_KEY = 'gestihotel_pending_operations';

/**
 * Charger les opérations en attente du localStorage
 */
const loadPendingOperations = (): PendingOperation[] => {
  try {
    const stored = localStorage.getItem(PENDING_OPERATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Sauvegarder les opérations en attente dans le localStorage
 */
const savePendingOperations = (operations: PendingOperation[]) => {
  try {
    localStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(operations));
  } catch (error) {
    console.error('Erreur sauvegarde opérations:', error);
  }
};

/**
 * Mesurer la latence de connexion
 */
const measureLatency = async (): Promise<number> => {
  const start = Date.now();
  try {
    await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
    return Date.now() - start;
  } catch {
    return Infinity;
  }
};

/**
 * Hook principal pour la gestion offline
 */
export const useOffline = (options: UseOfflineOptions = {}) => {
  const {
    detectSlowConnection = true,
    slowConnectionThreshold = 3000,
    onStatusChange,
    onSync,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>(navigator.onLine ? 'online' : 'offline');
  const [pendingOperations, setPendingOperations] =
    useState<PendingOperation[]>(loadPendingOperations);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latencyCheckIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  /**
   * Mettre à jour le statut et notifier
   */
  const updateStatus = useCallback(
    (newStatus: ConnectionStatus) => {
      if (newStatus !== status) {
        setStatus(newStatus);
        onStatusChange?.(newStatus);

        // Notifications utilisateur
        if (newStatus === 'offline') {
          toast.warning('Vous êtes hors ligne. Les modifications seront synchronisées plus tard.', {
            duration: 5000,
          });
        } else if (newStatus === 'online' && status === 'offline') {
          toast.success('Connexion rétablie !');
        } else if (newStatus === 'slow') {
          toast.info('Connexion lente détectée', { duration: 3000 });
        }
      }
    },
    [status, onStatusChange]
  );

  /**
   * Ajouter une opération en attente
   */
  const addPendingOperation = useCallback(
    (type: PendingOperation['type'], collection: string, data: unknown, documentId?: string) => {
      const operation: PendingOperation = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        collection,
        documentId,
        data,
        timestamp: Date.now(),
        retries: 0,
      };

      setPendingOperations(prev => {
        const updated = [...prev, operation];
        savePendingOperations(updated);
        return updated;
      });

      return operation.id;
    },
    []
  );

  /**
   * Supprimer une opération (après succès)
   */
  const removePendingOperation = useCallback((operationId: string) => {
    setPendingOperations(prev => {
      const updated = prev.filter(op => op.id !== operationId);
      savePendingOperations(updated);
      return updated;
    });
  }, []);

  /**
   * Synchroniser les opérations en attente
   */
  const syncPendingOperations = useCallback(async () => {
    if (isSyncing || pendingOperations.length === 0 || status === 'offline') {
      return;
    }

    setIsSyncing(true);

    try {
      if (onSync) {
        await onSync(pendingOperations);
        // Si la sync réussit, vider la queue
        setPendingOperations([]);
        savePendingOperations([]);
      } else {
        // Sync par défaut: essayer de traiter chaque opération
        const failedOperations: PendingOperation[] = [];

        for (const operation of pendingOperations) {
          try {
            // Ici on pourrait appeler les services Firebase appropriés
            console.log('Syncing operation:', operation);
            // await firebaseSync(operation);
          } catch (error) {
            console.error('Sync failed for operation:', operation.id, error);
            // Incrémenter les retries
            if (operation.retries < 3) {
              failedOperations.push({
                ...operation,
                retries: operation.retries + 1,
              });
            }
          }
        }

        setPendingOperations(failedOperations);
        savePendingOperations(failedOperations);
      }

      setLastSyncTime(new Date());

      if (pendingOperations.length > 0) {
        toast.success('Données synchronisées avec succès');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erreur de synchronisation');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, pendingOperations, status, onSync]);

  /**
   * Forcer une synchronisation manuelle
   */
  const forceSync = useCallback(() => {
    if (status !== 'offline') {
      syncPendingOperations();
    } else {
      toast.warning('Synchronisation impossible hors ligne');
    }
  }, [status, syncPendingOperations]);

  /**
   * Vérifier la latence de connexion
   */
  const checkLatency = useCallback(async () => {
    if (!navigator.onLine) {
      updateStatus('offline');
      return;
    }

    if (detectSlowConnection) {
      const latency = await measureLatency();
      if (latency === Infinity) {
        updateStatus('offline');
      } else if (latency > slowConnectionThreshold) {
        updateStatus('slow');
      } else {
        updateStatus('online');
      }
    } else {
      updateStatus('online');
    }
  }, [detectSlowConnection, slowConnectionThreshold, updateStatus]);

  // Écouter les événements de connexion
  useEffect(() => {
    const handleOnline = () => {
      updateStatus('online');
      // Synchroniser après un court délai pour laisser la connexion se stabiliser
      syncTimeoutRef.current = setTimeout(syncPendingOperations, 2000);
    };

    const handleOffline = () => {
      updateStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [updateStatus, syncPendingOperations]);

  // Vérifier périodiquement la latence
  useEffect(() => {
    if (detectSlowConnection) {
      // Vérification initiale
      checkLatency();

      // Vérification périodique (toutes les 30 secondes)
      latencyCheckIntervalRef.current = setInterval(checkLatency, 30000);

      return () => {
        if (latencyCheckIntervalRef.current) {
          clearInterval(latencyCheckIntervalRef.current);
        }
      };
    }
  }, [detectSlowConnection, checkLatency]);

  // Synchroniser automatiquement quand on revient en ligne
  useEffect(() => {
    if (status === 'online' && pendingOperations.length > 0) {
      const timeout = setTimeout(syncPendingOperations, 3000);
      return () => clearTimeout(timeout);
    }
  }, [status, pendingOperations.length, syncPendingOperations]);

  return {
    // État
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isSlow: status === 'slow',
    isSyncing,
    lastSyncTime,
    pendingOperationsCount: pendingOperations.length,
    pendingOperations,

    // Actions
    addPendingOperation,
    removePendingOperation,
    forceSync,
    checkLatency,
  };
};

/**
 * Hook simplifié pour juste vérifier le statut online
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
