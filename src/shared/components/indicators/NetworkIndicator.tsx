/**
 * ============================================================================
 * NETWORK INDICATOR COMPONENT
 * ============================================================================
 *
 * Indicateur visuel de l'état du réseau
 * - Badge "Hors ligne" quand pas de connexion
 * - Toast de notification lors des changements
 * - Bouton de synchronisation manuelle
 */

import { useEffect, useState } from 'react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { offlineSyncManager } from '@/core/services/offlineSync';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { WifiOff, Wifi, RefreshCw, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const NetworkIndicator = () => {
  const { isOnline, effectiveType } = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState<{
    pending: number;
    failed: number;
    isSyncing: boolean;
  }>({ pending: 0, failed: 0, isSyncing: false });
  const [isSyncing, setIsSyncing] = useState(false);

  // Mettre à jour le statut de sync
  useEffect(() => {
    const updateSyncStatus = async () => {
      const status = await offlineSyncManager.getSyncStatus();
      setSyncStatus(status);
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  // Notification lors des changements de connexion
  useEffect(() => {
    if (isOnline) {
      toast.success('Connexion rétablie', {
        description: 'Synchronisation en cours...',
        icon: <Wifi className="h-4 w-4" />,
      });
      // Synchroniser automatiquement
      offlineSyncManager.forceSyncNow();
    } else {
      toast.error('Connexion perdue', {
        description: 'Mode hors ligne activé',
        icon: <WifiOff className="h-4 w-4" />,
        duration: 5000,
      });
    }
  }, [isOnline]);

  // Synchronisation manuelle
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const result = await offlineSyncManager.forceSyncNow();
      if (result.success > 0) {
        toast.success(`${result.success} modification(s) synchronisée(s)`);
      } else if (result.failed > 0) {
        toast.error(`${result.failed} erreur(s) de synchronisation`);
      } else {
        toast.info('Aucune modification à synchroniser');
      }
    } catch (error) {
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Badge statut réseau */}
      {!isOnline && (
        <Badge variant="destructive" className="flex items-center gap-1.5 px-2 py-1 animate-pulse">
          <WifiOff className="h-3 w-3" />
          <span className="text-xs font-medium">Hors ligne</span>
        </Badge>
      )}

      {/* Badge qualité connexion (si en ligne) */}
      {isOnline && effectiveType && effectiveType !== '4g' && (
        <Badge variant="secondary" className="flex items-center gap-1.5 px-2 py-1">
          <AlertCircle className="h-3 w-3" />
          <span className="text-xs font-medium">Connexion lente ({effectiveType})</span>
        </Badge>
      )}

      {/* Badge sync en attente */}
      {syncStatus.pending > 0 && (
        <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1">
          <RefreshCw className="h-3 w-3" />
          <span className="text-xs font-medium">{syncStatus.pending} en attente</span>
        </Badge>
      )}

      {/* Badge sync échoués */}
      {syncStatus.failed > 0 && (
        <Badge variant="destructive" className="flex items-center gap-1.5 px-2 py-1">
          <XCircle className="h-3 w-3" />
          <span className="text-xs font-medium">{syncStatus.failed} échoué(s)</span>
        </Badge>
      )}

      {/* Bouton de synchronisation manuelle */}
      {isOnline && (syncStatus.pending > 0 || syncStatus.failed > 0) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualSync}
          disabled={isSyncing || syncStatus.isSyncing}
          className="h-7 px-2"
        >
          {isSyncing || syncStatus.isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
};

/**
 * Bannière mode offline (affichée en haut de page)
 */
export const OfflineBanner = () => {
  const { isOnline } = useNetworkStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Afficher avec un délai pour éviter le flash au chargement
    if (!isOnline) {
      const timeout = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timeout);
    } else {
      setShow(false);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <Alert
      variant="default"
      className="fixed top-0 left-0 right-0 z-50 rounded-none border-b-2 border-amber-500 bg-amber-50 dark:bg-amber-950/30"
    >
      <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-amber-900 dark:text-amber-100">Mode hors ligne</span>
          <span className="text-sm text-amber-700 dark:text-amber-300">
            Vos modifications seront synchronisées automatiquement lorsque la connexion sera
            rétablie
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
};

/**
 * Hook pour afficher les notifications de sync
 */
export const useSyncNotifications = () => {
  useEffect(() => {
    const checkSync = async () => {
      const status = await offlineSyncManager.getSyncStatus();

      if (status.pending > 0) {
        toast.info(`${status.pending} modification(s) en attente de synchronisation`, {
          id: 'sync-pending',
        });
      }

      if (status.failed > 0) {
        toast.error(`${status.failed} erreur(s) de synchronisation`, {
          id: 'sync-failed',
          action: {
            label: 'Réessayer',
            onClick: () => offlineSyncManager.forceSyncNow(),
          },
        });
      }
    };

    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkSync, 30000);
    checkSync();

    return () => clearInterval(interval);
  }, []);
};
