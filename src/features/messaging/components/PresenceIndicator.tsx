/**
 * Indicateur de présence utilisateur amélioré
 */

import { forwardRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Timestamp } from 'firebase/firestore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/utils/cn';
import type { UserPresence } from '../types/message.types';

/**
 * Convertir un timestamp Firebase ou Date en Date
 */
const toDate = (timestamp: Timestamp | Date | undefined): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (typeof (timestamp as Timestamp).toDate === 'function') {
    return (timestamp as Timestamp).toDate();
  }
  return null;
};

type PresenceStatus = 'available' | 'busy' | 'away' | 'offline';

interface PresenceIndicatorProps {
  presence?: UserPresence | null;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Couleurs et labels par statut
 */
const STATUS_CONFIG: Record<PresenceStatus, { color: string; bgColor: string; label: string }> = {
  available: {
    color: 'bg-green-500',
    bgColor: 'ring-green-500/20',
    label: 'En ligne',
  },
  busy: {
    color: 'bg-red-500',
    bgColor: 'ring-red-500/20',
    label: 'Occupé',
  },
  away: {
    color: 'bg-yellow-500',
    bgColor: 'ring-yellow-500/20',
    label: 'Absent',
  },
  offline: {
    color: 'bg-gray-400',
    bgColor: 'ring-gray-400/20',
    label: 'Hors ligne',
  },
};

/**
 * Tailles
 */
const SIZE_CONFIG = {
  sm: 'w-2 h-2 ring-1',
  md: 'w-3 h-3 ring-2',
  lg: 'w-4 h-4 ring-2',
};

export const PresenceIndicator = forwardRef<HTMLDivElement, PresenceIndicatorProps>(
  ({ presence, showTooltip = true, size = 'md', className }, ref) => {
    const status: PresenceStatus = presence?.isOnline
      ? (presence.status as PresenceStatus) || 'available'
      : 'offline';

    const config = STATUS_CONFIG[status];
    const sizeClass = SIZE_CONFIG[size];

    const indicator = (
      <div
        ref={ref}
        className={cn(
          'rounded-full ring ring-white dark:ring-gray-900',
          config.color,
          config.bgColor,
          sizeClass,
          className
        )}
      />
    );

    if (!showTooltip) {
      return indicator;
    }

    const lastSeenDate = toDate(presence?.lastSeen);
    const lastSeen = lastSeenDate
      ? formatDistanceToNow(lastSeenDate, { addSuffix: true, locale: fr })
      : null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{indicator}</TooltipTrigger>
          <TooltipContent side="right">
            <div className="text-xs">
              <p className="font-medium">{config.label}</p>
              {!presence?.isOnline && lastSeen && (
                <p className="text-gray-400">Dernière activité {lastSeen}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

PresenceIndicator.displayName = 'PresenceIndicator';

/**
 * Badge de présence avec nom d'utilisateur
 */
interface PresenceBadgeProps {
  userName: string;
  presence?: UserPresence | null;
  showStatus?: boolean;
  className?: string;
}

export const PresenceBadge = ({
  userName,
  presence,
  showStatus = true,
  className,
}: PresenceBadgeProps) => {
  const status: PresenceStatus = presence?.isOnline
    ? (presence.status as PresenceStatus) || 'available'
    : 'offline';

  const config = STATUS_CONFIG[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
          {userName.charAt(0).toUpperCase()}
        </div>
        <PresenceIndicator
          presence={presence}
          size="sm"
          className="absolute -bottom-0.5 -right-0.5"
          showTooltip={false}
        />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{userName}</p>
        {showStatus && (
          <p className={cn('text-xs', presence?.isOnline ? 'text-green-600' : 'text-gray-400')}>
            {config.label}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Liste d'utilisateurs avec présence
 */
interface PresenceListProps {
  users: Array<{
    id: string;
    name: string;
    presence?: UserPresence | null;
  }>;
  onUserClick?: (userId: string) => void;
}

export const PresenceList = ({ users, onUserClick }: PresenceListProps) => {
  // Trier par statut: en ligne d'abord
  const sortedUsers = [...users].sort((a, b) => {
    const aOnline = a.presence?.isOnline ? 1 : 0;
    const bOnline = b.presence?.isOnline ? 1 : 0;
    return bOnline - aOnline;
  });

  const onlineCount = users.filter(u => u.presence?.isOnline).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Utilisateurs</span>
        <span className="text-xs text-gray-500">
          {onlineCount} en ligne / {users.length}
        </span>
      </div>

      <div className="space-y-1">
        {sortedUsers.map(user => (
          <div
            key={user.id}
            onClick={() => onUserClick?.(user.id)}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg transition-colors',
              onUserClick && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <PresenceIndicator
                presence={user.presence}
                size="sm"
                className="absolute -bottom-0.5 -right-0.5"
                showTooltip={false}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              {user.presence?.isOnline ? (
                <p className="text-xs text-green-600">En ligne</p>
              ) : toDate(user.presence?.lastSeen) ? (
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(toDate(user.presence?.lastSeen)!, {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              ) : (
                <p className="text-xs text-gray-400">Hors ligne</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
