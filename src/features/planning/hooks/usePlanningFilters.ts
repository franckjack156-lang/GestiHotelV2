/**
 * Hook pour le filtrage des interventions dans le planning
 */

import { useState, useMemo, useCallback } from 'react';
import { isSameDay } from 'date-fns';
import type { PlanningFilters, CalendarPeriod, GroupMode } from '../types/planning.types';
import type { Intervention } from '@/features/interventions/types/intervention.types';

const DEFAULT_FILTERS: PlanningFilters = {
  searchKeyword: '',
  statuses: [],
  priorities: [],
  technicianIds: [],
  roomNumbers: [],
  types: [],
  showRecurringOnly: false,
};

interface UsePlanningFiltersOptions {
  initialFilters?: Partial<PlanningFilters>;
}

export const usePlanningFilters = (options: UsePlanningFiltersOptions = {}) => {
  const [filters, setFilters] = useState<PlanningFilters>({
    ...DEFAULT_FILTERS,
    ...options.initialFilters,
  });

  const [groupMode, setGroupMode] = useState<GroupMode>('default');

  /**
   * Met à jour un filtre spécifique
   */
  const updateFilter = useCallback(
    <K extends keyof PlanningFilters>(key: K, value: PlanningFilters[K]) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  /**
   * Réinitialise tous les filtres
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  /**
   * Vérifie si des filtres sont actifs
   */
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchKeyword.trim() !== '' ||
      filters.statuses.length > 0 ||
      filters.priorities.length > 0 ||
      filters.technicianIds.length > 0 ||
      filters.roomNumbers.length > 0 ||
      filters.types.length > 0 ||
      filters.showRecurringOnly
    );
  }, [filters]);

  /**
   * Compte le nombre de filtres actifs
   */
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchKeyword.trim()) count++;
    count += filters.statuses.length;
    count += filters.priorities.length;
    count += filters.technicianIds.length;
    count += filters.roomNumbers.length;
    count += filters.types.length;
    if (filters.showRecurringOnly) count++;
    return count;
  }, [filters]);

  /**
   * Filtre les interventions selon les critères
   */
  const filterInterventions = useCallback(
    (interventions: Intervention[], period?: CalendarPeriod): Intervention[] => {
      return interventions.filter(intervention => {
        // Filtre par période si fournie
        if (period) {
          if (!intervention.scheduledAt || typeof intervention.scheduledAt.toDate !== 'function') {
            return false;
          }
          const scheduledAt = intervention.scheduledAt.toDate();
          if (scheduledAt < period.start || scheduledAt > period.end) {
            return false;
          }
        }

        // Filtre par statut
        if (filters.statuses.length > 0 && !filters.statuses.includes(intervention.status)) {
          return false;
        }

        // Filtre par priorité
        if (
          filters.priorities.length > 0 &&
          !filters.priorities.includes(intervention.priority || 'normal')
        ) {
          return false;
        }

        // Filtre par technicien
        if (filters.technicianIds.length > 0) {
          const assignedTo = intervention.assignedTo || intervention.assignedToIds?.[0];
          if (!assignedTo || !filters.technicianIds.includes(assignedTo)) {
            return false;
          }
        }

        // Filtre par chambre
        if (filters.roomNumbers.length > 0) {
          if (!intervention.roomNumber || !filters.roomNumbers.includes(intervention.roomNumber)) {
            return false;
          }
        }

        // Filtre par type
        if (filters.types.length > 0 && !filters.types.includes(intervention.type)) {
          return false;
        }

        // Filtre récurrence uniquement
        if (filters.showRecurringOnly && !intervention.isRecurring) {
          return false;
        }

        // Filtre par mot-clé
        if (filters.searchKeyword.trim()) {
          const keyword = filters.searchKeyword.toLowerCase();
          const matchesTitle = intervention.title?.toLowerCase().includes(keyword);
          const matchesDescription = intervention.description?.toLowerCase().includes(keyword);
          const matchesLocation = intervention.location?.toLowerCase().includes(keyword);
          const matchesReference = intervention.reference?.toLowerCase().includes(keyword);
          const matchesRoom = intervention.roomNumber?.toLowerCase().includes(keyword);

          if (
            !matchesTitle &&
            !matchesDescription &&
            !matchesLocation &&
            !matchesReference &&
            !matchesRoom
          ) {
            return false;
          }
        }

        return true;
      });
    },
    [filters]
  );

  /**
   * Groupe les interventions selon le mode sélectionné
   */
  const groupInterventions = useCallback(
    (interventions: Intervention[]): Record<string, Intervention[]> => {
      if (groupMode === 'default') {
        return { default: interventions };
      }

      const groups: Record<string, Intervention[]> = {};

      interventions.forEach(intervention => {
        let key: string;

        switch (groupMode) {
          case 'technician':
            key = intervention.assignedTo || intervention.assignedToIds?.[0] || 'unassigned';
            break;
          case 'room':
            key = intervention.roomNumber || 'no-room';
            break;
          case 'priority':
            key = intervention.priority || 'normal';
            break;
          case 'status':
            key = intervention.status;
            break;
          default:
            key = 'default';
        }

        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(intervention);
      });

      return groups;
    },
    [groupMode]
  );

  /**
   * Obtient les interventions pour un jour spécifique
   */
  const getInterventionsForDay = useCallback(
    (interventions: Intervention[], day: Date): Intervention[] => {
      return interventions.filter(intervention => {
        if (!intervention.scheduledAt || typeof intervention.scheduledAt.toDate !== 'function') {
          return false;
        }
        return isSameDay(intervention.scheduledAt.toDate(), day);
      });
    },
    []
  );

  /**
   * Obtient les interventions pour une heure spécifique
   */
  const getInterventionsForHour = useCallback(
    (interventions: Intervention[], day: Date, hour: number): Intervention[] => {
      return interventions.filter(intervention => {
        if (!intervention.scheduledAt || typeof intervention.scheduledAt.toDate !== 'function') {
          return false;
        }
        const intDate = intervention.scheduledAt.toDate();
        return intDate.getHours() === hour && isSameDay(intDate, day);
      });
    },
    []
  );

  return {
    // État
    filters,
    groupMode,
    hasActiveFilters,
    activeFiltersCount,

    // Actions
    updateFilter,
    resetFilters,
    setFilters,
    setGroupMode,

    // Helpers
    filterInterventions,
    groupInterventions,
    getInterventionsForDay,
    getInterventionsForHour,
  };
};
