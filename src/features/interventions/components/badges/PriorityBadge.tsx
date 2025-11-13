/**
 * PriorityBadge Component
 *
 * Badge pour afficher la priorité d'une intervention
 * Utilise maintenant les listes de référence dynamiques
 *
 * Destination: src/features/interventions/components/badges/PriorityBadge.tsx
 */

import { DynamicBadge } from '@/shared/components/ui/DynamicBadge';
import { useAllReferenceLists } from '@/shared/hooks/useReferenceLists';
import { InterventionPriority } from '@/shared/types/status.types';

interface PriorityBadgeProps {
  priority: InterventionPriority | string;
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
  const { getItemByValue } = useAllReferenceLists({ realtime: false, autoLoad: true });

  // Récupérer l'item de la liste de référence
  const priorityItem = getItemByValue('interventionPriorities', priority);

  return (
    <DynamicBadge
      item={priorityItem}
      showIcon={showIcon}
      size={size}
      className={className}
      fallbackLabel={String(priority) || 'Non défini'}
    />
  );
};
