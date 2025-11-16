/**
 * useInterventions Hook
 *
 * Hook principal pour gérer les interventions avec temps réel
 */

import { useEffect, useCallback } from 'react';
import { useInterventionStore } from '../stores/interventionStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useEstablishmentStore } from '@/features/establishments/stores/establishmentStore';
import interventionService from '../services/interventionService';
import type { InterventionFilters, InterventionSortOptions } from '../types/intervention.types';

export const useInterventions = () => {
  const { user } = useAuthStore();
  const { currentEstablishment } = useEstablishmentStore();
  const {
    interventions,
    isLoading,
    error,
    filters,
    sortOptions,
    listConfig,
    currentPage,
    stats,
    setInterventions,
    setLoading,
    setError,
    setFilters,
    resetFilters,
    setSortOptions,
    setListConfig,
    // updateStats, // TODO: Imported but unused
  } = useInterventionStore();

  const establishmentId =
    currentEstablishment?.id || user?.currentEstablishmentId || user?.establishmentIds?.[0];

  /**
   * Charger les interventions avec temps réel
   */
  useEffect(() => {
    if (!establishmentId) {
      setError('Aucun établissement sélectionné');
      return;
    }

    setLoading(true);

    const unsubscribe = interventionService.subscribeToInterventions(
      establishmentId,
      filters,
      sortOptions,
      listConfig.itemsPerPage * 3, // Charger 3 pages à la fois pour la pagination côté client
      interventions => {
        setInterventions(interventions);
        setLoading(false);
      },
      error => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [
    establishmentId,
    filters,
    sortOptions,
    listConfig.itemsPerPage,
    setInterventions,
    setLoading,
    setError,
  ]);

  /**
   * Recharger les interventions manuellement
   */
  const refresh = useCallback(async () => {
    if (!establishmentId) return;

    try {
      setLoading(true);
      setError(null);

      const interventions = await interventionService.getInterventions(
        establishmentId,
        filters,
        sortOptions,
        listConfig.itemsPerPage * 3
      );

      setInterventions(interventions);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [
    establishmentId,
    filters,
    sortOptions,
    listConfig.itemsPerPage,
    setInterventions,
    setLoading,
    setError,
  ]);

  /**
   * Appliquer des filtres
   */
  const applyFilters = useCallback(
    (newFilters: Partial<InterventionFilters>) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  /**
   * Réinitialiser les filtres
   */
  const clearFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  /**
   * Changer le tri
   */
  const changeSort = useCallback(
    (options: InterventionSortOptions) => {
      setSortOptions(options);
    },
    [setSortOptions]
  );

  /**
   * Changer la vue
   */
  const changeView = useCallback(
    (view: 'grid' | 'list' | 'compact') => {
      setListConfig({ view });
    },
    [setListConfig]
  );

  /**
   * Obtenir les interventions paginées
   */
  const getPaginatedInterventions = useCallback(() => {
    const startIndex = (currentPage - 1) * listConfig.itemsPerPage;
    const endIndex = startIndex + listConfig.itemsPerPage;
    return interventions.slice(startIndex, endIndex);
  }, [interventions, currentPage, listConfig.itemsPerPage]);

  /**
   * Vérifier si des filtres sont actifs
   */
  const hasActiveFilters = useCallback(() => {
    return (
      (filters.status && filters.status.length > 0) ||
      (filters.priority && filters.priority.length > 0) ||
      filters.type !== undefined ||
      filters.category !== undefined ||
      filters.assignedTo !== undefined ||
      filters.createdBy !== undefined ||
      filters.isUrgent !== undefined ||
      filters.isBlocking !== undefined ||
      filters.dateFrom !== undefined ||
      filters.dateTo !== undefined ||
      (filters.search && filters.search.length > 0) ||
      (filters.tags && filters.tags.length > 0)
    );
  }, [filters]);

  /**
   * Compter les interventions filtrées
   */
  const getFilteredCount = useCallback(() => {
    return interventions.length;
  }, [interventions]);

  return {
    // État
    interventions: getPaginatedInterventions(),
    allInterventions: interventions,
    isLoading,
    error,
    filters,
    sortOptions,
    listConfig,
    stats,

    // Pagination
    currentPage,
    totalItems: interventions.length,
    totalPages: Math.ceil(interventions.length / listConfig.itemsPerPage),
    itemsPerPage: listConfig.itemsPerPage,

    // Actions
    refresh,
    applyFilters,
    clearFilters,
    changeSort,
    changeView,

    // Utilitaires
    hasActiveFilters: hasActiveFilters(),
    filteredCount: getFilteredCount(),
    isEmpty: interventions.length === 0,
  };
};
