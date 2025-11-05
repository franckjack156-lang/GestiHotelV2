/**
 * InterventionsList Component
 * 
 * Liste des interventions avec pagination
 */

import { Grid3x3, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { InterventionCard } from '../cards/InterventionCard';
import { useInterventionActions } from '../../hooks/useInterventionActions';
import type { Intervention } from '../../types/intervention.types';

interface InterventionsListProps {
  interventions: Intervention[];
  isLoading?: boolean;
  view?: 'grid' | 'list' | 'compact';
  onViewChange?: (view: 'grid' | 'list' | 'compact') => void;
  showPhotos?: boolean;
  showAssignee?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export const InterventionsList = ({
  interventions,
  isLoading = false,
  view = 'grid',
  onViewChange,
  showPhotos = true,
  showAssignee = true,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: InterventionsListProps) => {
  const { navigateToDetails } = useInterventionActions();

  // Vue vide
  if (!isLoading && interventions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-gray-400 mb-4">
          <Grid3x3 size={64} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Aucune intervention trouvée
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          Aucune intervention ne correspond à vos critères de recherche.
          Essayez de modifier vos filtres.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-64 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de vue */}
      {onViewChange && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange('grid')}
          >
            <Grid3x3 size={16} />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange('list')}
          >
            <List size={16} />
          </Button>
        </div>
      )}

      {/* Grille d'interventions */}
      <div
        className={
          view === 'grid'
            ? 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : view === 'list'
            ? 'flex flex-col gap-4'
            : 'grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }
      >
        {interventions.map((intervention) => (
          <InterventionCard
            key={intervention.id}
            intervention={intervention}
            onClick={() => navigateToDetails(intervention.id)}
            showPhotos={showPhotos}
            showAssignee={showAssignee}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} sur {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Précédent
            </Button>
            
            {/* Numéros de pages */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={i}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
