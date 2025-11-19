/**
 * ============================================================================
 * ROOM STATUS BADGE COMPONENT
 * ============================================================================
 *
 * Badge displaying the current status of a room (available, blocked, etc.)
 */

import { Badge } from '@/shared/components/ui/badge';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface RoomStatusBadgeProps {
  isBlocked?: boolean;
  status?: 'available' | 'blocked' | 'cleaning' | 'maintenance' | 'occupied';
  className?: string;
  showIcon?: boolean;
}

const STATUS_CONFIG = {
  available: {
    label: 'Disponible',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  blocked: {
    label: 'Bloquée',
    icon: Lock,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
  cleaning: {
    label: 'Nettoyage',
    icon: AlertCircle,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  maintenance: {
    label: 'Maintenance',
    icon: AlertCircle,
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  },
  occupied: {
    label: 'Occupée',
    icon: AlertCircle,
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
};

export const RoomStatusBadge: React.FC<RoomStatusBadgeProps> = ({
  isBlocked,
  status,
  className,
  showIcon = true,
}) => {
  // Determine status - isBlocked takes precedence
  const effectiveStatus = isBlocked ? 'blocked' : status || 'available';
  const config = STATUS_CONFIG[effectiveStatus];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
};
