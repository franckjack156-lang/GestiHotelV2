/**
 * Indicateur de statut de connexion
 */

import { Wifi, WifiOff, CloudOff, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { cn } from '@/shared/utils/cn';
import { useOffline, type ConnectionStatus } from '@/shared/hooks/useOffline';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OfflineIndicatorProps {
  /** Mode d'affichage: compact (icône seulement) ou full (avec détails) */
  mode?: 'compact' | 'full';
  /** Afficher seulement quand hors ligne */
  showOnlyWhenOffline?: boolean;
  className?: string;
}

/**
 * Configuration par statut
 */
const STATUS_CONFIG: Record<
  ConnectionStatus,
  {
    icon: typeof Wifi;
    color: string;
    bgColor: string;
    label: string;
    description: string;
  }
> = {
  online: {
    icon: Wifi,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    label: 'En ligne',
    description: 'Connexion stable',
  },
  offline: {
    icon: WifiOff,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    label: 'Hors ligne',
    description: 'Pas de connexion internet',
  },
  slow: {
    icon: CloudOff,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    label: 'Connexion lente',
    description: 'Latence élevée détectée',
  },
};

export const OfflineIndicator = ({
  mode = 'compact',
  showOnlyWhenOffline = false,
  className,
}: OfflineIndicatorProps) => {
  const {
    status,
    isSyncing,
    pendingOperationsCount,
    lastSyncTime,
    forceSync,
  } = useOffline();

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // Ne rien afficher si en ligne et showOnlyWhenOffline est true
  if (showOnlyWhenOffline && status === 'online' && pendingOperationsCount === 0) {
    return null;
  }

  if (mode === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full',
                config.bgColor,
                className
              )}
            >
              <Icon size={14} className={config.color} />
              {pendingOperationsCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-4 min-w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {pendingOperationsCount}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p className="font-medium">{config.label}</p>
              <p className="text-gray-400">{config.description}</p>
              {pendingOperationsCount > 0 && (
                <p className="mt-1">
                  {pendingOperationsCount} opération{pendingOperationsCount > 1 ? 's' : ''} en
                  attente
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2', config.color, className)}
        >
          <Icon size={16} />
          <span className="hidden sm:inline">{config.label}</span>
          {pendingOperationsCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pendingOperationsCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          {/* Statut */}
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-full', config.bgColor)}>
              <Icon size={20} className={config.color} />
            </div>
            <div>
              <h4 className="font-medium">{config.label}</h4>
              <p className="text-xs text-gray-500">{config.description}</p>
            </div>
          </div>

          {/* Opérations en attente */}
          {pendingOperationsCount > 0 && (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm">Opérations en attente</span>
                <Badge>{pendingOperationsCount}</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {status === 'offline'
                  ? 'Seront synchronisées quand la connexion sera rétablie'
                  : 'En cours de synchronisation...'}
              </p>
            </div>
          )}

          {/* Dernière sync */}
          {lastSyncTime && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle size={12} className="text-green-500" />
              <span>
                Dernière sync{' '}
                {formatDistanceToNow(lastSyncTime, { addSuffix: true, locale: fr })}
              </span>
            </div>
          )}

          {/* Actions */}
          {status !== 'offline' && pendingOperationsCount > 0 && (
            <Button
              onClick={forceSync}
              disabled={isSyncing}
              size="sm"
              className="w-full gap-2"
            >
              <RefreshCw size={14} className={cn(isSyncing && 'animate-spin')} />
              {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Bannière hors ligne à afficher en haut de page
 */
export const OfflineBanner = () => {
  const { isOffline, pendingOperationsCount } = useOffline();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white py-2 px-4 text-center text-sm">
      <div className="flex items-center justify-center gap-2">
        <WifiOff size={16} />
        <span>
          Vous êtes hors ligne.
          {pendingOperationsCount > 0 &&
            ` ${pendingOperationsCount} modification${pendingOperationsCount > 1 ? 's' : ''} en attente.`}
        </span>
      </div>
    </div>
  );
};
