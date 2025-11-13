/**
 * DynamicBadge Component
 *
 * Badge générique pour afficher n'importe quelle valeur de liste de référence
 * Remplace les badges hardcodés (PriorityBadge, TypeBadge, StatusBadge)
 *
 * Destination: src/shared/components/ui/DynamicBadge.tsx
 */

import { Badge } from '@/shared/components/ui/badge';
import * as Icons from 'lucide-react';
import type { ReferenceItem, AllowedColor } from '@/shared/types/reference-lists.types';

interface DynamicBadgeProps {
  item: ReferenceItem | null | undefined;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallbackLabel?: string;
}

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

/**
 * Générer les classes Tailwind pour les couleurs
 * Utilise les classes standard de Tailwind pour chaque couleur
 */
const getColorClasses = (color?: string): string => {
  if (!color) {
    return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
  }

  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
    red: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
    orange: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
    amber: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
    lime: 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/20 dark:text-lime-400',
    green: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400',
    teal: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400',
    sky: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400',
    blue: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400',
    violet: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400',
    purple: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900/20 dark:text-fuchsia-400',
    pink: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400',
    rose: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400',
  };

  return colorMap[color] || colorMap.gray;
};

/**
 * Récupérer l'icône Lucide à partir du nom
 */
const getIcon = (iconName?: string): React.ComponentType<{ size?: number; className?: string }> | null => {
  if (!iconName) return null;

  // @ts-ignore - Dynamic icon access
  const Icon = Icons[iconName];

  return Icon || null;
};

export const DynamicBadge = ({
  item,
  showIcon = true,
  size = 'md',
  className = '',
  fallbackLabel = 'Non défini',
}: DynamicBadgeProps) => {
  // Si pas d'item, afficher le fallback
  if (!item) {
    return (
      <Badge
        variant="secondary"
        className={`bg-gray-100 text-gray-800 border-gray-200 ${SIZE_CLASSES[size]} font-medium inline-flex items-center gap-1.5 ${className}`}
      >
        <span>{fallbackLabel}</span>
      </Badge>
    );
  }

  const colorClasses = getColorClasses(item.color);
  const Icon = showIcon ? getIcon(item.icon) : null;

  return (
    <Badge
      variant="secondary"
      className={`${colorClasses} ${SIZE_CLASSES[size]} font-medium inline-flex items-center gap-1.5 ${className}`}
    >
      {Icon && <Icon size={ICON_SIZES[size]} className="flex-shrink-0" />}
      <span>{item.label}</span>
    </Badge>
  );
};

/**
 * Hook helper pour utiliser DynamicBadge avec les listes de référence
 *
 * Usage:
 * ```tsx
 * const { getItem } = useReferenceLists();
 * const priorityItem = getItem('interventionPriorities', intervention.priority);
 *
 * return <DynamicBadge item={priorityItem} />;
 * ```
 */
export default DynamicBadge;
