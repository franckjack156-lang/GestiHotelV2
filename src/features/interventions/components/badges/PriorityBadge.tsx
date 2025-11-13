/**
 * PriorityBadge Component
 *
 * Badge pour afficher la priorité d'une intervention
 *
 * Destination: src/features/interventions/components/badges/PriorityBadge.tsx
 */

import { Badge } from '@/shared/components/ui/badge';
import { AlertCircle, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { InterventionPriority, PRIORITY_LABELS } from '@/shared/types/status.types';

interface PriorityBadgeProps {
  priority: InterventionPriority;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PRIORITY_CONFIG: Record<
  InterventionPriority,
  {
    label: string;
    icon: any;
    className: string;
  }
> = {
  [InterventionPriority.CRITICAL]: {
    label: PRIORITY_LABELS[InterventionPriority.CRITICAL],
    icon: AlertCircle,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  },
  [InterventionPriority.URGENT]: {
    label: PRIORITY_LABELS[InterventionPriority.URGENT],
    icon: AlertCircle,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  },
  [InterventionPriority.HIGH]: {
    label: PRIORITY_LABELS[InterventionPriority.HIGH],
    icon: ArrowUp,
    className:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
  },
  [InterventionPriority.NORMAL]: {
    label: PRIORITY_LABELS[InterventionPriority.NORMAL],
    icon: Minus,
    className:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  [InterventionPriority.LOW]: {
    label: PRIORITY_LABELS[InterventionPriority.LOW],
    icon: ArrowDown,
    className:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
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

export const PriorityBadge = ({
  priority,
  showIcon = true,
  size = 'md',
  className = '',
}: PriorityBadgeProps) => {
  // Vérifier que la priorité existe dans la configuration
  const config = PRIORITY_CONFIG[priority];

  // Si la priorité n'est pas reconnue, utiliser NORMAL comme fallback
  if (!config) {
    console.warn(`Priorité d'intervention non reconnue: "${priority}". Utilisation de NORMAL.`);
    const fallbackConfig = PRIORITY_CONFIG[InterventionPriority.NORMAL];
    const FallbackIcon = fallbackConfig.icon;

    return (
      <Badge
        variant="secondary"
        className={`${fallbackConfig.className} ${SIZE_CLASSES[size]} font-medium inline-flex items-center gap-1.5 ${className}`}
      >
        {showIcon && <FallbackIcon size={ICON_SIZES[size]} className="flex-shrink-0" />}
        <span>{String(priority) || 'Non défini'}</span>
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
