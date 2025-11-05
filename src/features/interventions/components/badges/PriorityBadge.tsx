/**
 * PriorityBadge Component
 *
 * Badge pour afficher la priorité d'une intervention
 *
 * Destination: src/features/interventions/components/badges/PriorityBadge.tsx
 */

import { Badge } from '@/shared/components/ui/badge';
import { AlertCircle, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import type { InterventionPriority } from '@/shared/types/status.types';

interface PriorityBadgeProps {
  priority: InterventionPriority;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PRIORITY_CONFIG = {
  critical: {
    label: 'Critique',
    icon: AlertCircle,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  },
  high: {
    label: 'Haute',
    icon: ArrowUp,
    className:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
  },
  medium: {
    label: 'Moyenne',
    icon: Minus,
    className:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  low: {
    label: 'Basse',
    icon: ArrowDown,
    className:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  },
} as const;

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
  const config = PRIORITY_CONFIG[priority];
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
