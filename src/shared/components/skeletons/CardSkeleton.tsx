/**
 * ============================================================================
 * CARD SKELETON
 * ============================================================================
 *
 * Skeleton loader pour les cartes
 */

import { Skeleton } from '@/shared/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';

export const CardSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </CardContent>
    </Card>
  );
};

export default CardSkeleton;
