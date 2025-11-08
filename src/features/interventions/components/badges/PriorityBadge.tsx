/**
 * PriorityBadge Component - CORRIGÉ
 *
 * Badge pour afficher la priorité d'une intervention
 */

import { Badge } from '@/shared/components/ui/badge';
import { AlertCircle, ArrowUp, Minus, Flame } from 'lucide-react';
import { InterventionPriority, PRIORITY_LABELS } from '@/shared/types/status.types';

interface PriorityBadgeProps {
  priority: InterventionPriority | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const PRIORITY_CONFIG: Record<
  InterventionPriority,
  {
    label: string;
    icon: typeof AlertCircle;
    className: string;
  }
> = {
  [InterventionPriority.LOW]: {
    label: PRIORITY_LABELS[InterventionPriority.LOW],
    icon: Minus,
    className: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  [InterventionPriority.NORMAL]: {
    label: PRIORITY_LABELS[InterventionPriority.NORMAL],
    icon: Minus,
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  [InterventionPriority.HIGH]: {
    label: PRIORITY_LABELS[InterventionPriority.HIGH],
    icon: ArrowUp,
    className: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  [InterventionPriority.URGENT]: {
    label: PRIORITY_LABELS[InterventionPriority.URGENT],
    icon: AlertCircle,
    className: 'bg-red-100 text-red-800 border-red-300',
  },
  [InterventionPriority.CRITICAL]: {
    label: PRIORITY_LABELS[InterventionPriority.CRITICAL],
    icon: Flame,
    className: 'bg-red-600 text-white border-red-700',
  },
};

export const PriorityBadge = ({ priority, size = 'md', showIcon = true }: PriorityBadgeProps) => {
  // Normaliser la priorité
  const normalizedPriority = priority.toLowerCase() as InterventionPriority;

  // Utiliser la config ou fallback sur NORMAL
  const config =
    PRIORITY_CONFIG[normalizedPriority] || PRIORITY_CONFIG[InterventionPriority.NORMAL];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 font-medium ${config.className} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
};
