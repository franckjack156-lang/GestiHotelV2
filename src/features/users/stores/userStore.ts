/**
 * ============================================================================
 * USER STORE
 * ============================================================================
 *
 * Store Zustand pour gérer l'état des utilisateurs
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  User,
  UserProfile,
  UserFilters,
  UserSortOptions,
  UsersListConfig,
  UserStats,
} from '../types/user.types';
import { UserStatus } from '../types/user.types';
import type { UserRole } from '../types/role.types';

// ============================================================================
// TYPES
// ============================================================================

interface UserState {
  // ========== DATA ==========
  /** Liste des utilisateurs */
  users: User[];

  /** Utilisateur sélectionné (pour détails) */
  selectedUser: User | null;

  /** Profil utilisateur en cours d'édition */
  editingProfile: UserProfile | null;

  /** Statistiques */
  stats: UserStats | null;

  // ========== UI STATE ==========
  /** Chargement en cours */
  isLoading: boolean;

  /** Erreur */
  error: string | null;

  /** Filtres actifs */
  filters: UserFilters;

  /** Options de tri */
  sortOptions: UserSortOptions;

  /** Configuration de la liste */
  listConfig: UsersListConfig;

  /** Page actuelle (pagination) */
  currentPage: number;

  /** Modal ouvert */
  isModalOpen: boolean;

  /** Mode du modal (create, edit, view) */
  modalMode: 'create' | 'edit' | 'view' | null;

  // ========== ACTIONS ==========
  /** Définir les utilisateurs */
  setUsers: (users: User[]) => void;

  /** Ajouter un utilisateur */
  addUser: (user: User) => void;

  /** Mettre à jour un utilisateur dans la liste */
  updateUserInList: (userId: string, data: Partial<User>) => void;

  /** Supprimer un utilisateur de la liste */
  removeUser: (userId: string) => void;

  /** Sélectionner un utilisateur */
  setSelectedUser: (user: User | null) => void;

  /** Définir le profil en édition */
  setEditingProfile: (profile: UserProfile | null) => void;

  /** Définir les stats */
  setStats: (stats: UserStats) => void;

  /** Définir le chargement */
  setLoading: (loading: boolean) => void;

  /** Définir l'erreur */
  setError: (error: string | null) => void;

  /** Définir les filtres */
  setFilters: (filters: Partial<UserFilters>) => void;

  /** Réinitialiser les filtres */
  resetFilters: () => void;

  /** Définir les options de tri */
  setSortOptions: (options: UserSortOptions) => void;

  /** Définir la configuration de la liste */
  setListConfig: (config: Partial<UsersListConfig>) => void;

  /** Changer de page */
  setCurrentPage: (page: number) => void;

  /** Ouvrir/fermer modal */
  setModalOpen: (open: boolean, mode?: 'create' | 'edit' | 'view') => void;

  /** Réinitialiser le store */
  reset: () => void;

  // ========== SELECTORS ==========
  /** Obtenir les utilisateurs filtrés et triés */
  getFilteredUsers: () => User[];

  /** Obtenir les utilisateurs par rôle */
  getUsersByRole: (role: UserRole) => User[];

  /** Obtenir les utilisateurs actifs */
  getActiveUsers: () => User[];

  /** Obtenir le nombre total d'utilisateurs */
  getTotalUsers: () => number;

  /** Obtenir le nombre d'utilisateurs filtrés */
  getFilteredCount: () => number;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialFilters: UserFilters = {
  search: undefined,
  role: undefined,
  status: undefined,
  establishmentId: undefined,
  department: undefined,
  activeOnly: false,
};

const initialSortOptions: UserSortOptions = {
  field: 'displayName',
  direction: 'asc',
};

const initialListConfig: UsersListConfig = {
  view: 'list',
  itemsPerPage: 20,
  visibleColumns: ['displayName', 'email', 'role', 'status', 'lastLoginAt'],
};

// ============================================================================
// STORE
// ============================================================================

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        // ========== INITIAL STATE ==========
        users: [],
        selectedUser: null,
        editingProfile: null,
        stats: null,
        isLoading: false,
        error: null,
        filters: initialFilters,
        sortOptions: initialSortOptions,
        listConfig: initialListConfig,
        currentPage: 1,
        isModalOpen: false,
        modalMode: null,

        // ========== ACTIONS ==========
        setUsers: users => set({ users }),

        addUser: user =>
          set(state => ({
            users: [user, ...state.users],
          })),

        updateUserInList: (userId, data) =>
          set(state => ({
            users: state.users.map(u => (u.id === userId ? { ...u, ...data } : u)),
            selectedUser:
              state.selectedUser?.id === userId
                ? { ...state.selectedUser, ...data }
                : state.selectedUser,
          })),

        removeUser: userId =>
          set(state => ({
            users: state.users.filter(u => u.id !== userId),
            selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser,
          })),

        setSelectedUser: user => set({ selectedUser: user }),

        setEditingProfile: profile => set({ editingProfile: profile }),

        setStats: stats => set({ stats }),

        setLoading: loading => set({ isLoading: loading }),

        setError: error => set({ error }),

        setFilters: newFilters =>
          set(state => ({
            filters: { ...state.filters, ...newFilters },
            currentPage: 1, // Reset page on filter change
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

        setListConfig: config =>
          set(state => ({
            listConfig: { ...state.listConfig, ...config },
          })),

        setCurrentPage: page => set({ currentPage: page }),

        setModalOpen: (open, mode) =>
          set({
            isModalOpen: open,
            modalMode: open ? mode || null : null,
          }),

        reset: () =>
          set({
            users: [],
            selectedUser: null,
            editingProfile: null,
            stats: null,
            isLoading: false,
            error: null,
            filters: initialFilters,
            sortOptions: initialSortOptions,
            currentPage: 1,
            isModalOpen: false,
            modalMode: null,
          }),

        // ========== SELECTORS ==========
        getFilteredUsers: () => {
          const { users, filters, sortOptions } = get();

          let filtered = [...users];

          // Appliquer les filtres
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(
              u =>
                u.displayName.toLowerCase().includes(searchLower) ||
                u.email.toLowerCase().includes(searchLower)
            );
          }

          if (filters.role) {
            if (Array.isArray(filters.role)) {
              filtered = filtered.filter(u => filters.role!.includes(u.role));
            } else {
              filtered = filtered.filter(u => u.role === filters.role);
            }
          }

          if (filters.status) {
            if (Array.isArray(filters.status)) {
              filtered = filtered.filter(u => filters.status!.includes(u.status));
            } else {
              filtered = filtered.filter(u => u.status === filters.status);
            }
          }

          if (filters.establishmentId) {
            filtered = filtered.filter(u => u.establishmentIds.includes(filters.establishmentId!));
          }

          if (filters.department) {
            filtered = filtered.filter(u => u.jobTitle === filters.department);
          }

          if (filters.activeOnly) {
            filtered = filtered.filter(u => u.isActive);
          }

          // Appliquer le tri
          filtered.sort((a, b) => {
            const aValue = a[sortOptions.field];
            const bValue = b[sortOptions.field];

            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;

            let comparison = 0;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
              comparison = aValue.localeCompare(bValue);
            } else if (aValue instanceof Date && bValue instanceof Date) {
              comparison = aValue.getTime() - bValue.getTime();
            } else {
              comparison = aValue > bValue ? 1 : -1;
            }

            return sortOptions.direction === 'asc' ? comparison : -comparison;
          });

          return filtered;
        },

        getUsersByRole: role => {
          const { users } = get();
          return users.filter(u => u.role === role && u.isActive);
        },

        getActiveUsers: () => {
          const { users } = get();
          return users.filter(u => u.isActive);
        },

        getTotalUsers: () => {
          const { users } = get();
          return users.length;
        },

        getFilteredCount: () => {
          return get().getFilteredUsers().length;
        },
      }),
      {
        name: 'gestihotel-users-store',
        partialize: state => ({
          filters: state.filters,
          sortOptions: state.sortOptions,
          listConfig: state.listConfig,
        }),
      }
    ),
    { name: 'UserStore' }
  )
);

// ============================================================================
// SELECTORS (hooks réutilisables)
// ============================================================================

/**
 * Hook pour obtenir les utilisateurs filtrés
 */
export const useFilteredUsers = () => {
  return useUserStore(state => state.getFilteredUsers());
};

/**
 * Hook pour obtenir un utilisateur par ID
 */
export const useUserById = (userId: string | undefined) => {
  return useUserStore(state => (userId ? state.users.find(u => u.id === userId) : null));
};

/**
 * Hook pour obtenir les utilisateurs par rôle
 */
export const useUsersByRole = (role: UserRole) => {
  return useUserStore(state => state.getUsersByRole(role));
};

/**
 * Hook pour obtenir les techniciens actifs
 */
export const useActiveTechnicians = () => {
  return useUserStore(state =>
    state.users.filter(u => (u.role === 'technician' || u.role === 'manager') && u.isActive)
  );
};

/**
 * Hook pour obtenir les statistiques
 */
export const useUserStats = () => {
  return useUserStore(state => state.stats);
};

// Export du type
export type { UserState };
