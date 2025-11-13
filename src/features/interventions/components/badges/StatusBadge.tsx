/**
 * StatusBadge Component
 *
 * Badge pour afficher le statut d'une intervention
 * Utilise maintenant les listes de référence dynamiques
 *
 * Destination: src/features/interventions/components/badges/StatusBadge.tsx
 */

import { DynamicBadge } from '@/shared/components/ui/DynamicBadge';
import { useAllReferenceLists } from '@/shared/hooks/useReferenceLists';
import { InterventionStatus } from '@/shared/types/status.types';

interface StatusBadgeProps {
  status: InterventionStatus | string;
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
  const { getItemByValue } = useAllReferenceLists({ realtime: false, autoLoad: true });

  // Récupérer l'item de la liste de référence
  const statusItem = getItemByValue('interventionStatuses', status);

  return (
    <DynamicBadge
      item={statusItem}
      showIcon={showIcon}
      size={size}
      className={className}
      fallbackLabel={String(status) || 'Non défini'}
    />
  );
};
