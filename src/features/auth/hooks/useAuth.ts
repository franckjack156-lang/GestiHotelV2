/**
 * useAuth Hook - VERSION AVEC PERMISSIONS AVANCÉES
 *
 * Le listener est maintenant dans AuthProvider
 * Intégration du permissionService pour gestion granulaire des permissions
 */

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import * as authService from '../services/authService';
import { permissionService } from '@/core/services/permissionService';
import type { Permission, UserRole } from '@/features/users/types/role.types';
import type { AuthCredentials, PasswordResetData } from '@/shared/types';

export const useAuth = () => {
  const navigate = useNavigate();

  // Sélecteurs Zustand
  const user = useAuthStore(state => state.user);
  const firebaseUser = useAuthStore(state => state.firebaseUser);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);

  const login = async (credentials: AuthCredentials): Promise<void> => {
    try {
      useAuthStore.getState().setLoading(true);
      useAuthStore.getState().setError(null);
      await authService.loginWithEmail(credentials);
    } catch (error) {
      const err = error as Error;
      useAuthStore.getState().setError(err.message);
      throw err;
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      useAuthStore.getState().setLoading(true);
      useAuthStore.getState().setError(null);
      await authService.loginWithGoogle();
    } catch (error) {
      const err = error as Error;
      useAuthStore.getState().setError(err.message);
      throw err;
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<void> => {
    try {
      useAuthStore.getState().setLoading(true);
      useAuthStore.getState().setError(null);
      await authService.registerWithEmail(email, password, displayName);
    } catch (error) {
      const err = error as Error;
      useAuthStore.getState().setError(err.message);
      throw err;
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      useAuthStore.getState().setLoading(true);
      await authService.logout();
      useAuthStore.getState().logout();
      navigate('/login');
    } catch (error) {
      const err = error as Error;
      useAuthStore.getState().setError(err.message);
      throw err;
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  };

  const resetPassword = async (data: PasswordResetData): Promise<void> => {
    try {
      useAuthStore.getState().setLoading(true);
      useAuthStore.getState().setError(null);
      await authService.resetPassword(data);
    } catch (error) {
      const err = error as Error;
      useAuthStore.getState().setError(err.message);
      throw err;
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  // ========================================
  // Permission Methods (using permissionService)
  // ========================================

  const hasPermission = (permission: Permission): boolean => {
    return permissionService.hasPermission(user, permission);
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissionService.hasAllPermissions(user, permissions);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissionService.hasAnyPermission(user, permissions);
  };

  const checkPermission = (
    permissions: Permission | Permission[],
    options?: {
      mode?: 'AND' | 'OR';
      establishmentId?: string;
      audit?: boolean;
    }
  ) => {
    const permArray = Array.isArray(permissions) ? permissions : [permissions];
    return permissionService.checkPermission({
      user,
      permissions: permArray,
      mode: options?.mode || 'AND',
      establishmentId: options?.establishmentId || user?.currentEstablishmentId,
      audit: options?.audit || false,
    });
  };

  const isAdmin = (): boolean => {
    return permissionService.isAdmin(user);
  };

  const isSuperAdmin = (): boolean => {
    return permissionService.isSuperAdmin(user);
  };

  const canAccessEstablishment = (establishmentId: string): boolean => {
    if (!user) return false;
    return permissionService.hasEstablishmentAccess(user, establishmentId);
  };

  const canManageUser = (targetUser: { role: UserRole; establishmentIds: string[] }): boolean => {
    if (!user) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return permissionService.canManageUser(user, targetUser as any);
  };

  const canAssignRole = (targetRole: UserRole): boolean => {
    if (!user) return false;
    return permissionService.canAssignRole(user, targetRole);
  };

  return {
    user,
    firebaseUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    hasRole,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    checkPermission,
    isAdmin,
    isSuperAdmin,
    canAccessEstablishment,
    canManageUser,
    canAssignRole,
  };
};
