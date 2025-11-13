/**
 * TypeBadge Component
 *
 * Badge pour afficher le type d'intervention
 *
 * Destination: src/features/interventions/components/badges/TypeBadge.tsx
 */

import { Badge } from '@/shared/components/ui/badge';
import {
  Wrench,
  Zap,
  Droplet,
  Wind,
  Wifi,
  Settings,
  AlertTriangle,
  Hammer,
  Paintbrush,
  Sparkles,
  Lock,
  Square,
  Shirt,
  Shield,
  Trees,
  Waves
} from 'lucide-react';
import { InterventionType, INTERVENTION_TYPE_LABELS } from '@/shared/types/status.types';

interface TypeBadgeProps {
  type: InterventionType;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TYPE_CONFIG: Record<
  InterventionType,
  {
    label: string;
    icon: any;
    className: string;
  }
> = {
  [InterventionType.PLUMBING]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.PLUMBING],
    icon: Droplet,
    className: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400',
  },
  [InterventionType.ELECTRICITY]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.ELECTRICITY],
    icon: Zap,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  [InterventionType.HEATING]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.HEATING],
    icon: Wind,
    className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
  },
  [InterventionType.AIR_CONDITIONING]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.AIR_CONDITIONING],
    icon: Wind,
    className: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400',
  },
  [InterventionType.CARPENTRY]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.CARPENTRY],
    icon: Hammer,
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
  },
  [InterventionType.PAINTING]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.PAINTING],
    icon: Paintbrush,
    className: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400',
  },
  [InterventionType.CLEANING]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.CLEANING],
    icon: Sparkles,
    className: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400',
  },
  [InterventionType.LOCKSMITH]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.LOCKSMITH],
    icon: Lock,
    className: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400',
  },
  [InterventionType.GLAZING]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.GLAZING],
    icon: Square,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  },
  [InterventionType.MASONRY]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.MASONRY],
    icon: Wrench,
    className: 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-900/20 dark:text-stone-400',
  },
  [InterventionType.APPLIANCE]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.APPLIANCE],
    icon: Settings,
    className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
  },
  [InterventionType.FURNITURE]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.FURNITURE],
    icon: Shirt,
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400',
  },
  [InterventionType.IT]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.IT],
    icon: Wifi,
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400',
  },
  [InterventionType.SECURITY]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.SECURITY],
    icon: Shield,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  },
  [InterventionType.GARDEN]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.GARDEN],
    icon: Trees,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  },
  [InterventionType.POOL]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.POOL],
    icon: Waves,
    className: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400',
  },
  [InterventionType.OTHER]: {
    label: INTERVENTION_TYPE_LABELS[InterventionType.OTHER],
    icon: Settings,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
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

export const TypeBadge = ({
  type,
  showIcon = true,
  size = 'md',
  className = '',
}: TypeBadgeProps) => {
  // Vérifier que le type existe dans la configuration
  const config = TYPE_CONFIG[type];

  // Si le type n'est pas reconnu, utiliser OTHER comme fallback
  if (!config) {
    console.warn(`Type d'intervention non reconnu: "${type}". Utilisation du type OTHER.`);
    const fallbackConfig = TYPE_CONFIG[InterventionType.OTHER];
    const FallbackIcon = fallbackConfig.icon;

    return (
      <Badge
        variant="secondary"
        className={`${fallbackConfig.className} ${SIZE_CLASSES[size]} font-medium inline-flex items-center gap-1.5 ${className}`}
      >
        {showIcon && <FallbackIcon size={ICON_SIZES[size]} className="flex-shrink-0" />}
        <span>{String(type) || 'Non défini'}</span>
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
