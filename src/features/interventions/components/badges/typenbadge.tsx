/**
 * TypeBadge Component
 *
 * Badge pour afficher le type d'intervention
 *
 * Destination: src/features/interventions/components/badges/TypeBadge.tsx
 */

import { Badge } from '@/shared/components/ui/badge';
import { Wrench, Zap, Droplet, Wind, Wifi, Settings, AlertTriangle } from 'lucide-react';
import type { InterventionType } from '@/shared/types/status.types';

interface TypeBadgeProps {
  type: InterventionType;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TYPE_CONFIG = {
  maintenance: {
    label: 'Maintenance',
    icon: Wrench,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  },
  electrical: {
    label: 'Électrique',
    icon: Zap,
    className:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  plumbing: {
    label: 'Plomberie',
    icon: Droplet,
    className: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400',
  },
  hvac: {
    label: 'Climatisation',
    icon: Wind,
    className: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400',
  },
  it: {
    label: 'Informatique',
    icon: Wifi,
    className:
      'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400',
  },
  equipment: {
    label: 'Équipement',
    icon: Settings,
    className:
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
  },
  emergency: {
    label: 'Urgence',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  },
  other: {
    label: 'Autre',
    icon: Settings,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
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

export const TypeBadge = ({
  type,
  showIcon = true,
  size = 'md',
  className = '',
}: TypeBadgeProps) => {
  const config = TYPE_CONFIG[type];
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
