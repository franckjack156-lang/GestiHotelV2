/**
 * Intervention Store
 *
 * Store Zustand pour gérer l'état des interventions
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  Intervention,
  InterventionFilters,
  InterventionSortOptions,
  InterventionListConfig,
} from '../types/intervention.types';

interface InterventionState {
  // État des interventions
  interventions: Intervention[];
  selectedIntervention: Intervention | null;
  isLoading: boolean;
  error: string | null;

  // Filtres et tri
  filters: InterventionFilters;
  sortOptions: InterventionSortOptions;

  // Configuration d'affichage
  listConfig: InterventionListConfig;

  // Pagination
  currentPage: number;
  totalItems: number;

  // Statistiques
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    urgent: number;
  } | null;

  // Actions - État
  setInterventions: (interventions: Intervention[]) => void;
  addIntervention: (intervention: Intervention) => void;
  updateInterventionInList: (id: string, updates: Partial<Intervention>) => void;
  removeIntervention: (id: string) => void;
  setSelectedIntervention: (intervention: Intervention | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Filtres
  setFilters: (filters: Partial<InterventionFilters>) => void;
  resetFilters: () => void;
  setSortOptions: (options: InterventionSortOptions) => void;

  // Actions - Configuration
  setListConfig: (config: Partial<InterventionListConfig>) => void;

  // Actions - Pagination
  setCurrentPage: (page: number) => void;
  setTotalItems: (total: number) => void;

  // Actions - Statistiques
  updateStats: () => void;

  // Utilitaires
  getInterventionById: (id: string) => Intervention | undefined;
  clearAll: () => void;
}

const initialFilters: InterventionFilters = {
  status: undefined,
  priority: undefined,
  type: undefined,
  category: undefined,
  assignedTo: undefined,
  createdBy: undefined,
  isUrgent: undefined,
  isBlocking: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  search: undefined,
  tags: undefined,
};

const initialSortOptions: InterventionSortOptions = {
  field: 'createdAt',
  order: 'desc',
};

const initialListConfig: InterventionListConfig = {
  view: 'grid',
  itemsPerPage: 20,
  showPhotos: true,
  showAssignee: true,
  groupBy: undefined,
};

export const useInterventionStore = create<InterventionState>()(
  devtools(
    (set, get) => ({
      // État initial
      interventions: [],
      selectedIntervention: null,
      isLoading: false,
      error: null,
      filters: initialFilters,
      sortOptions: initialSortOptions,
      listConfig: initialListConfig,
      currentPage: 1,
      totalItems: 0,
      stats: null,

      // Actions - État
      setInterventions: interventions => {
        set({ interventions, error: null });
        get().updateStats();
      },

      addIntervention: intervention =>
        set(state => {
          const newInterventions = [intervention, ...state.interventions];
          return { interventions: newInterventions };
        }),

      updateInterventionInList: (id, updates) =>
        set(state => ({
          interventions: state.interventions.map(intervention =>
            intervention.id === id ? { ...intervention, ...updates } : intervention
          ),
          selectedIntervention:
            state.selectedIntervention?.id === id
              ? { ...state.selectedIntervention, ...updates }
              : state.selectedIntervention,
        })),

      removeIntervention: id =>
        set(state => ({
          interventions: state.interventions.filter(i => i.id !== id),
          selectedIntervention:
            state.selectedIntervention?.id === id ? null : state.selectedIntervention,
        })),

      setSelectedIntervention: intervention => set({ selectedIntervention: intervention }),

      setLoading: loading => set({ isLoading: loading }),

      setError: error => set({ error, isLoading: false }),

      // Actions - Filtres
      setFilters: newFilters =>
        set(state => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1, // Reset à la page 1 lors du changement de filtres
        })),

      resetFilters: () =>
        set({
          filters: initialFilters,
          currentPage: 1,
        }),

      setSortOptions: options =>
        set({
          sortOptions: options,
          currentPage: 1,
        }),

      // Actions - Configuration
      setListConfig: config =>
        set(state => ({
          listConfig: { ...state.listConfig, ...config },
        })),

      // Actions - Pagination
      setCurrentPage: page => set({ currentPage: page }),

      setTotalItems: total => set({ totalItems: total }),

      // Actions - Statistiques
      updateStats: () => {
        const { interventions } = get();

        const stats = {
          total: interventions.length,
          pending: interventions.filter(i => i.status === 'pending').length,
          inProgress: interventions.filter(i => i.status === 'in_progress').length,
          completed: interventions.filter(i => i.status === 'completed' || i.status === 'validated')
            .length,
          urgent: interventions.filter(i => i.isUrgent).length,
        };

        set({ stats });
      },

      // Utilitaires
      getInterventionById: id => {
        return get().interventions.find(i => i.id === id);
      },

      clearAll: () =>
        set({
          interventions: [],
          selectedIntervention: null,
          isLoading: false,
          error: null,
          filters: initialFilters,
          sortOptions: initialSortOptions,
          currentPage: 1,
          totalItems: 0,
          stats: null,
        }),
    }),
    { name: 'intervention-store' }
  )
);
