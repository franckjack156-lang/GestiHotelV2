/**
 * ============================================================================
 * LIST SKELETON
 * ============================================================================
 *
 * Skeleton loader pour les listes
 */

import { Skeleton } from '@/shared/components/ui/skeleton';

interface ListSkeletonProps {
  /**
   * Nombre d'items à afficher
   */
  items?: number;

  /**
   * Afficher un avatar
   */
  showAvatar?: boolean;
}

export const ListSkeleton = ({ items = 3, showAvatar = false }: ListSkeletonProps) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListSkeleton;
