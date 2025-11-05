/**
 * PriorityBadge Component
 * 
 * Badge pour afficher la priorité d'une intervention
 */

import { Badge } from '@/shared/components/ui/badge';
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/shared/types/status.types';
import type { InterventionPriority } from '@/shared/types/status.types';
import { AlertCircle, AlertTriangle, Zap, Flame } from 'lucide-react';

interface PriorityBadgeProps {
  priority: InterventionPriority;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PriorityBadge = ({
  priority,
  showIcon = true,
  size = 'md',
  className = '',
}: PriorityBadgeProps) => {
  const label = PRIORITY_LABELS[priority];
  const colorClass = PRIORITY_COLORS[priority];

  // Icônes selon la priorité
  const getIcon = () => {
    switch (priority) {
      case 'low':
        return null;
      case 'normal':
        return AlertCircle;
      case 'high':
        return AlertTriangle;
      case 'urgent':
        return Zap;
      case 'critical':
        return Flame;
      default:
        return null;
    }
  };

  const Icon = getIcon();

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
