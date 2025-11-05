/**
 * useAuth Hook - VERSION SIMPLIFIÉE
 *
 * Le listener est maintenant dans AuthProvider
 */

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import * as authService from '../services/authService';
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

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return false;
  };

  const canAccessEstablishment = (establishmentId: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.establishmentIds.includes(establishmentId);
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
    canAccessEstablishment,
  };
};
