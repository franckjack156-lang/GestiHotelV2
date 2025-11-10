/**
 * ============================================================================
 * STATUS BADGE COMPONENT
 * ============================================================================
 */

import React from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { UserStatus } from '../types/user.types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Ban,
} from 'lucide-react';

interface StatusBadgeProps {
  /** Statut à afficher */
  status: UserStatus;
  /** Afficher l'icône */
  showIcon?: boolean;
  /** Taille */
  size?: 'sm' | 'md' | 'lg';
  /** Classe CSS additionnelle */
  className?: string;
}

const statusConfig = {
  [UserStatus.ACTIVE]: {
    label: 'Actif',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  },
  [UserStatus.INACTIVE]: {
    label: 'Inactif',
    icon: XCircle,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
  },
  [UserStatus.PENDING]: {
    label: 'En attente',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  [UserStatus.SUSPENDED]: {
    label: 'Suspendu',
    icon: Pause,
    className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
  },
  [UserStatus.BANNED]: {
    label: 'Banni',
    icon: Ban,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
  className,
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        sizeClasses[size],
        config.className,
        'inline-flex items-center gap-1.5 font-medium',
        className
      )}
    >
      {showIcon && <Icon className={iconSize[size]} />}
      <span>{config.label}</span>
    </Badge>
  );
};
