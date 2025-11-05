/**
 * InterventionsPage
 * 
 * Page principale de liste des interventions
 */

import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { InterventionsList } from '@/features/interventions/components/lists/InterventionsList';
import { InterventionFilters } from '@/features/interventions/components/filters/InterventionFilters';
import { useInterventions } from '@/features/interventions/hooks/useInterventions';
import { useState } from 'react';
import type { InterventionFilters as Filters } from '@/features/interventions/types/intervention.types';

export const InterventionsPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({});
  
  const {
    interventions,
    isLoading,
    error,
    pagination,
    goToPage,
  } = useInterventions(filters);

  const handleCreateNew = () => {
    navigate('/interventions/new');
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Interventions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez toutes vos interventions techniques
          </p>
        </div>
        
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle intervention
        </Button>
      </div>

      {/* Filtres */}
      <InterventionFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erreur: {error}</p>
        </div>
      )}

      {/* Liste */}
      <InterventionsList
        interventions={interventions}
        isLoading={isLoading}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={goToPage}
      />
    </div>
  );
};
