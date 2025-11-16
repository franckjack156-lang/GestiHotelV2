/**
 * Establishment Store
 *
 * Store Zustand pour gérer l'état des établissements
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Establishment, EstablishmentFilters } from '@/shared/types/establishment.types';

interface EstablishmentState {
  // État des établissements
  establishments: Establishment[];
  currentEstablishment: Establishment | null;
  isLoading: boolean;
  error: string | null;

  // Filtres
  filters: EstablishmentFilters;

  // Actions - État
  setEstablishments: (establishments: Establishment[]) => void;
  addEstablishment: (establishment: Establishment) => void;
  updateEstablishmentInList: (id: string, updates: Partial<Establishment>) => void;
  removeEstablishment: (id: string) => void;
  setCurrentEstablishment: (establishment: Establishment | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Filtres
  setFilters: (filters: Partial<EstablishmentFilters>) => void;
  resetFilters: () => void;

  // Utilitaires
  getEstablishmentById: (id: string) => Establishment | undefined;
  getCurrentEstablishmentId: () => string | null;
  clearAll: () => void;
}

const initialFilters: EstablishmentFilters = {
  type: undefined,
  category: undefined,
  isActive: true, // Par défaut, afficher seulement les actifs
  city: undefined,
  search: undefined,
};

export const useEstablishmentStore = create<EstablishmentState>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        establishments: [],
        currentEstablishment: null,
        isLoading: false,
        error: null,
        filters: initialFilters,

        // Actions - État
        setEstablishments: establishments =>
          set({
            establishments,
            error: null,
          }),

        addEstablishment: establishment =>
          set(state => ({
            establishments: [establishment, ...state.establishments],
          })),

        updateEstablishmentInList: (id, updates) =>
          set(state => ({
            establishments: state.establishments.map(est =>
              est.id === id ? { ...est, ...updates } : est
            ),
            currentEstablishment:
              state.currentEstablishment?.id === id
                ? { ...state.currentEstablishment, ...updates }
                : state.currentEstablishment,
          })),

        removeEstablishment: id =>
          set(state => ({
            establishments: state.establishments.filter(est => est.id !== id),
            currentEstablishment:
              state.currentEstablishment?.id === id ? null : state.currentEstablishment,
          })),

        setCurrentEstablishment: establishment =>
          set({
            currentEstablishment: establishment,
          }),

        setLoading: loading =>
          set({
            isLoading: loading,
          }),

        setError: error =>
          set({
            error,
          }),

        // Actions - Filtres
        setFilters: newFilters =>
          set(state => ({
            filters: {
              ...state.filters,
              ...newFilters,
            },
          })),

        resetFilters: () =>
          set({
            filters: initialFilters,
          }),

        // Utilitaires
        getEstablishmentById: id => {
          const state = get();
          return state.establishments.find(est => est.id === id);
        },

        getCurrentEstablishmentId: () => {
          const state = get();
          return state.currentEstablishment?.id || null;
        },

        clearAll: () =>
          set({
            establishments: [],
            currentEstablishment: null,
            isLoading: false,
            error: null,
            filters: initialFilters,
          }),
      }),
      {
        name: 'establishment-storage',
        partialize: state => ({
          currentEstablishment: state.currentEstablishment,
        }),
      }
    ),
    {
      name: 'EstablishmentStore',
    }
  )
);
