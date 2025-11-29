/**
 * ============================================================================
 * USE USERS HOOK
 * ============================================================================
 *
 * Hook principal pour gérer les utilisateurs avec temps réel
 */

import { useEffect, useCallback, useMemo, useState } from 'react';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useEstablishmentStore } from '@/features/establishments/stores/establishmentStore';
import userService from '../services/userService';
import type {
  User,
  CreateUserData,
  UpdateUserData,
  UpdateProfileData,
  UserFilters,
  UserSortOptions,
  InviteUserData,
} from '../types/user.types';
import { UserStatus } from '../types/user.types';
import { logger } from '@/core/utils/logger';

/**
 * Hook useUsers
 *
 * Gère la liste des utilisateurs avec temps réel, filtres et tri
 */
export const useUsers = () => {
  const { user } = useAuthStore();
  const { currentEstablishment } = useEstablishmentStore();
  const {
    users,
    isLoading,
    error,
    filters,
    sortOptions,
    listConfig,
    currentPage,
    stats,
    setUsers,
    setLoading,
    setError,
    setFilters,
    resetFilters,
    setSortOptions,
    setListConfig,
    setCurrentPage,
    setStats,
    getFilteredUsers,
    getTotalUsers,
    getFilteredCount,
  } = useUserStore();

  // Établissement actuel
  const establishmentId =
    currentEstablishment?.id || user?.currentEstablishmentId || user?.establishmentIds?.[0];

  /**
   * Charger les utilisateurs avec temps réel
   */
  useEffect(() => {
    if (!establishmentId || !user) {
      setError('Aucun établissement sélectionné');
      return;
    }

    setLoading(true);

    // S'abonner aux changements en temps réel
    const unsubscribe = userService.subscribeToEstablishmentUsers(
      establishmentId,
      users => {
        setUsers(users);
        setLoading(false);
      },
      error => {
        setError(error.message);
        setLoading(false);
      },
      { activeOnly: filters.activeOnly }
    );

    return () => {
      unsubscribe();
    };
  }, [establishmentId, user, filters.activeOnly, setUsers, setLoading, setError]);

  /**
   * Charger les statistiques
   */
  useEffect(() => {
    if (!establishmentId) return;

    userService
      .getUserStats(establishmentId)
      .then(setStats)
      .catch(err => logger.error('Error loading user stats:', err));
  }, [establishmentId, setStats]);

  /**
   * Obtenir les utilisateurs paginés
   */
  const paginatedUsers = useMemo(() => {
    const filtered = getFilteredUsers();
    const startIndex = (currentPage - 1) * listConfig.itemsPerPage;
    const endIndex = startIndex + listConfig.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [getFilteredUsers, currentPage, listConfig.itemsPerPage]);

  /**
   * Nombre total de pages
   */
  const totalPages = useMemo(() => {
    const filtered = getFilteredCount();
    return Math.ceil(filtered / listConfig.itemsPerPage);
  }, [getFilteredCount, listConfig.itemsPerPage]);

  /**
   * Appliquer des filtres
   */
  const applyFilters = useCallback(
    (newFilters: Partial<UserFilters>) => {
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
    (field: UserSortOptions['field'], direction?: 'asc' | 'desc') => {
      setSortOptions({
        field,
        direction:
          direction ||
          (sortOptions.field === field && sortOptions.direction === 'asc' ? 'desc' : 'asc'),
      });
    },
    [sortOptions, setSortOptions]
  );

  /**
   * Changer de page
   */
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages, setCurrentPage]
  );

  /**
   * Page suivante
   */
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages, setCurrentPage]);

  /**
   * Page précédente
   */
  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, setCurrentPage]);

  /**
   * Changer la vue
   */
  const changeView = useCallback(
    (view: 'list' | 'grid' | 'table') => {
      setListConfig({ view });
    },
    [setListConfig]
  );

  /**
   * Recharger manuellement
   */
  const refresh = useCallback(async () => {
    if (!establishmentId) return;

    try {
      setLoading(true);
      setError(null);

      const users =
        user?.role === 'editor' || user?.role === 'super_admin'
          ? await userService.getAllUsers(filters, sortOptions)
          : await userService.getUsersByEstablishment(establishmentId, filters, sortOptions);

      setUsers(users);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [establishmentId, user?.role, filters, sortOptions, setUsers, setLoading, setError]);

  return {
    // Data
    users: paginatedUsers,
    allUsers: users,
    isLoading,
    error,
    stats,

    // Filters & Sort
    filters,
    sortOptions,
    applyFilters,
    clearFilters,
    changeSort,

    // Pagination
    currentPage,
    totalPages,
    totalUsers: getTotalUsers(),
    filteredCount: getFilteredCount(),
    goToPage,
    nextPage,
    previousPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,

    // View
    listConfig,
    changeView,

    // Actions
    refresh,
  };
};

/**
 * Hook useUser
 *
 * Récupère un utilisateur spécifique avec temps réel
 */
export const useUser = (userId: string | undefined) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      return;
    }

    setIsLoading(true);

    const unsubscribe = userService.subscribeToUser(
      userId,
      userData => {
        setUser(userData);
        setIsLoading(false);
      },
      err => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return {
    user,
    isLoading,
    error,
  };
};

/**
 * Hook useUserActions
 *
 * Actions CRUD sur les utilisateurs
 */
export const useUserActions = () => {
  const { user } = useAuthStore();
  const { addUser, updateUserInList, removeUser } = useUserStore();

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /**
   * Créer un utilisateur
   */
  const createUser = useCallback(
    async (data: CreateUserData): Promise<string | null> => {
      if (!user) {
        setActionError('Utilisateur non connecté');
        return null;
      }

      try {
        setIsCreating(true);
        setActionError(null);

        const userId = await userService.createUser(data, user.id);

        // Récupérer l'utilisateur créé pour l'ajouter au store
        const newUser = await userService.getUser(userId);
        if (newUser) {
          addUser(newUser);
        }

        return userId;
      } catch (error: unknown) {
        setActionError(error instanceof Error ? error.message : 'Erreur inconnue');
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [user, addUser]
  );

  /**
   * Inviter un utilisateur
   */
  const inviteUser = useCallback(
    async (data: InviteUserData): Promise<string | null> => {
      if (!user) {
        setActionError('Utilisateur non connecté');
        return null;
      }

      try {
        setIsCreating(true);
        setActionError(null);

        const invitationId = await userService.inviteUser(data, user.id);
        return invitationId;
      } catch (error: unknown) {
        setActionError(error instanceof Error ? error.message : 'Erreur inconnue');
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [user]
  );

  /**
   * Mettre à jour un utilisateur
   */
  const updateUser = useCallback(
    async (userId: string, data: UpdateUserData): Promise<boolean> => {
      try {
        setIsUpdating(true);
        setActionError(null);

        await userService.updateUser(userId, data);
        updateUserInList(userId, data);

        return true;
      } catch (error: unknown) {
        setActionError(error instanceof Error ? error.message : 'Erreur inconnue');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [updateUserInList]
  );

  /**
   * Mettre à jour le profil
   */
  const updateProfile = useCallback(
    async (userId: string, data: UpdateProfileData): Promise<boolean> => {
      try {
        setIsUpdating(true);
        setActionError(null);

        await userService.updateProfile(userId, data);
        updateUserInList(userId, data);

        return true;
      } catch (error: unknown) {
        setActionError(error instanceof Error ? error.message : 'Erreur inconnue');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [updateUserInList]
  );

  /**
   * Changer le statut
   */
  const changeStatus = useCallback(
    async (userId: string, status: UserStatus): Promise<boolean> => {
      try {
        setIsUpdating(true);
        setActionError(null);

        await userService.changeUserStatus(userId, status);
        updateUserInList(userId, { status, isActive: status === UserStatus.ACTIVE });

        return true;
      } catch (error: unknown) {
        setActionError(error instanceof Error ? error.message : 'Erreur inconnue');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [updateUserInList]
  );

  /**
   * Activer/désactiver
   */
  const toggleActive = useCallback(
    async (userId: string, isActive: boolean): Promise<boolean> => {
      try {
        setIsUpdating(true);
        setActionError(null);

        await userService.toggleUserActive(userId, isActive);
        updateUserInList(userId, {
          isActive,
          status: isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE,
        });

        return true;
      } catch (error: unknown) {
        setActionError(error instanceof Error ? error.message : 'Erreur inconnue');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [updateUserInList]
  );

  /**
   * Supprimer un utilisateur
   */
  const deleteUser = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        setIsDeleting(true);
        setActionError(null);

        await userService.deleteUser(userId);
        removeUser(userId);

        return true;
      } catch (error: unknown) {
        setActionError(error instanceof Error ? error.message : 'Erreur inconnue');
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [removeUser]
  );

  /**
   * Rechercher des utilisateurs
   */
  const searchUsers = useCallback(
    async (searchTerm: string, establishmentId?: string): Promise<User[]> => {
      try {
        return await userService.searchUsers(searchTerm, establishmentId);
      } catch (error: unknown) {
        setActionError(error instanceof Error ? error.message : 'Erreur inconnue');
        return [];
      }
    },
    []
  );

  return {
    // States
    isCreating,
    isUpdating,
    isDeleting,
    actionError,

    // Actions
    createUser,
    inviteUser,
    updateUser,
    updateProfile,
    changeStatus,
    toggleActive,
    deleteUser,
    searchUsers,

    // Helpers
    clearError: () => setActionError(null),
  };
};
