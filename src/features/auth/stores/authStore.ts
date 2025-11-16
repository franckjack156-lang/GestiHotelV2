/**
 * Auth Store
 *
 * Store Zustand pour gérer l'état d'authentification
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User, UserRole } from '@/shared/types';
import { ROLE_PERMISSIONS, Permission } from '@/features/users/types/role.types';

interface AuthState {
  // État
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;

  // Helpers
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccessEstablishment: (establishmentId: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        user: null,
        firebaseUser: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,

        // Actions
        setUser: user =>
          set({
            user,
            isAuthenticated: !!user,
            error: null,
          }),

        setFirebaseUser: firebaseUser =>
          set({
            firebaseUser,
          }),

        setLoading: loading =>
          set({
            isLoading: loading,
          }),

        setError: error =>
          set({
            error,
          }),

        logout: () =>
          set({
            user: null,
            firebaseUser: null,
            isAuthenticated: false,
            error: null,
          }),

        updateUser: updates =>
          set(state => ({
            user: state.user ? { ...state.user, ...updates } : null,
          })),

        // Helpers
        hasRole: role => {
          const { user } = get();
          return user?.role === role;
        },

        hasPermission: permission => {
          const { user } = get();
          if (!user) return false;

          // Super admin a toutes les permissions
          if (user.role === 'super_admin') return true;

          // Récupérer les permissions du rôle de l'utilisateur
          const rolePermissions = ROLE_PERMISSIONS[user.role as UserRole];
          if (!rolePermissions) return false;

          // Vérifier si la permission est dans la liste des permissions du rôle
          // Convertir la string en Permission enum si nécessaire
          return rolePermissions.some((perm: Permission) => perm === permission);
        },

        canAccessEstablishment: establishmentId => {
          const { user } = get();
          if (!user) return false;

          // Super admin peut accéder à tous les établissements
          if (user.role === 'super_admin') return true;

          // Vérifier si l'utilisateur a accès à cet établissement
          return user.establishmentIds.includes(establishmentId);
        },
      }),
      {
        name: 'auth-storage',
        partialize: state => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'AuthStore',
    }
  )
);
