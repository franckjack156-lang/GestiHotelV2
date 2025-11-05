/**
 * StatusBadge Component
 * 
 * Badge pour afficher le statut d'une intervention
 */

import { Badge } from '@/shared/components/ui/badge';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_ICONS,
} from '@/shared/types/status.types';
import type { InterventionStatus } from '@/shared/types/status.types';
import * as Icons from 'lucide-react';

interface StatusBadgeProps {
  status: InterventionStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge = ({
  status,
  showIcon = true,
  size = 'md',
  className = '',
}: StatusBadgeProps) => {
  const label = STATUS_LABELS[status];
  const colorClass = STATUS_COLORS[status];
  const iconName = STATUS_ICONS[status];

  // Obtenir l'icône dynamiquement
  const Icon = Icons[iconName as keyof typeof Icons] as any;

  // Tailles d'icônes
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  // Classes de taille
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge
      variant="secondary"
      className={`${colorClass} ${sizeClasses[size]} font-medium inline-flex items-center gap-1.5 ${className}`}
    >
      {showIcon && Icon && (
        <Icon className="flex-shrink-0" size={iconSizes[size]} />
      )}
      <span>{label}</span>
    </Badge>
  );
};
