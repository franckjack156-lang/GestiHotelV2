/**
 * StatusBadge Component
 *
 * Badge pour afficher le statut d'une intervention
 *
 * Destination: src/features/interventions/components/badges/StatusBadge.tsx
 */

import { Badge } from '@/shared/components/ui/badge';
import {
  FileEdit,
  Clock,
  UserCheck,
  Wrench,
  Pause,
  CheckCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { InterventionStatus, STATUS_LABELS } from '@/shared/types/status.types';

interface StatusBadgeProps {
  status: InterventionStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STATUS_CONFIG: Record<
  InterventionStatus,
  {
    label: string;
    icon: any;
    className: string;
  }
> = {
  [InterventionStatus.DRAFT]: {
    label: STATUS_LABELS[InterventionStatus.DRAFT],
    icon: FileEdit,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
  },
  [InterventionStatus.PENDING]: {
    label: STATUS_LABELS[InterventionStatus.PENDING],
    icon: Clock,
    className:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  [InterventionStatus.ASSIGNED]: {
    label: STATUS_LABELS[InterventionStatus.ASSIGNED],
    icon: UserCheck,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  },
  [InterventionStatus.IN_PROGRESS]: {
    label: STATUS_LABELS[InterventionStatus.IN_PROGRESS],
    icon: Wrench,
    className:
      'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400',
  },
  [InterventionStatus.ON_HOLD]: {
    label: STATUS_LABELS[InterventionStatus.ON_HOLD],
    icon: Pause,
    className:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
  },
  [InterventionStatus.COMPLETED]: {
    label: STATUS_LABELS[InterventionStatus.COMPLETED],
    icon: CheckCircle,
    className:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  },
  [InterventionStatus.VALIDATED]: {
    label: STATUS_LABELS[InterventionStatus.VALIDATED],
    icon: CheckCircle2,
    className:
      'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  [InterventionStatus.CANCELLED]: {
    label: STATUS_LABELS[InterventionStatus.CANCELLED],
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  },
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
} as const;

const ICON_SIZES = {
  sm: 12,
  md: 14,
  lg: 16,
} as const;

export const StatusBadge = ({
  status,
  showIcon = true,
  size = 'md',
  className = '',
}: StatusBadgeProps) => {
  // Vérifier que le statut existe dans la configuration
  const config = STATUS_CONFIG[status];

  // Si le statut n'est pas reconnu, utiliser PENDING comme fallback
  if (!config) {
    console.warn(`Statut d'intervention non reconnu: "${status}". Utilisation du statut PENDING.`);
    const fallbackConfig = STATUS_CONFIG[InterventionStatus.PENDING];
    const FallbackIcon = fallbackConfig.icon;

    return (
      <Badge
        variant="secondary"
        className={`${fallbackConfig.className} ${SIZE_CLASSES[size]} font-medium inline-flex items-center gap-1.5 ${className}`}
      >
        {showIcon && <FallbackIcon size={ICON_SIZES[size]} className="flex-shrink-0" />}
        <span>{String(status) || 'Non défini'}</span>
      </Badge>
    );
  }

  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={`${config.className} ${SIZE_CLASSES[size]} font-medium inline-flex items-center gap-1.5 ${className}`}
    >
      {showIcon && <Icon size={ICON_SIZES[size]} className="flex-shrink-0" />}
      <span>{config.label}</span>
    </Badge>
  );
};
