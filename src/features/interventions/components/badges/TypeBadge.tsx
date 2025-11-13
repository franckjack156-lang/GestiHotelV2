/**
 * TypeBadge Component
 *
 * Badge pour afficher le type d'intervention
 * Utilise maintenant les listes de référence dynamiques
 *
 * Destination: src/features/interventions/components/badges/TypeBadge.tsx
 */

import { DynamicBadge } from '@/shared/components/ui/DynamicBadge';
import { useAllReferenceLists } from '@/shared/hooks/useReferenceLists';
import { InterventionType } from '@/shared/types/status.types';

interface TypeBadgeProps {
  type: InterventionType | string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TypeBadge = ({
  type,
  showIcon = true,
  size = 'md',
  className = '',
}: TypeBadgeProps) => {
  const { getItemByValue } = useAllReferenceLists({ realtime: false, autoLoad: true });

  // Récupérer l'item de la liste de référence
  const typeItem = getItemByValue('interventionTypes', type);

  return (
    <DynamicBadge
      item={typeItem}
      showIcon={showIcon}
      size={size}
      className={className}
      fallbackLabel={String(type) || 'Non défini'}
    />
  );
};
