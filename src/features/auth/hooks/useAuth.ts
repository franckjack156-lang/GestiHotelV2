/**
 * useAuth Hook - SOLUTION DÉFINITIVE
 *
 * Remplacer TOUT le contenu de src/features/auth/hooks/useAuth.ts par ce fichier
 */

import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/core/config/firebase';
import { useAuthStore } from '../stores/authStore';
import * as authService from '../services/authService';
import { getUserById } from '@/features/users/services/userService';
import type { AuthCredentials, PasswordResetData } from '@/shared/types';

export const useAuth = () => {
  const navigate = useNavigate();
  const store = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    // Éviter la double initialisation en mode strict
    if (initialized.current) return;
    initialized.current = true;

    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      const { setUser, setFirebaseUser, setLoading, setError } = useAuthStore.getState();

      setLoading(true);

      if (firebaseUser) {
        setFirebaseUser(firebaseUser);

        try {
          const userData = await getUserById(firebaseUser.uid);

          if (userData) {
            setUser(userData);
            setError(null);
          } else {
            setUser(null);
            setError('Profil utilisateur introuvable');
          }
        } catch (error) {
          setUser(null);
          setError('Erreur lors du chargement du profil');
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      initialized.current = false;
      unsubscribe();
    };
  }, []);

  const login = async (credentials: AuthCredentials): Promise<void> => {
    try {
      store.setLoading(true);
      store.setError(null);
      await authService.loginWithEmail(credentials);
    } catch (error) {
      const err = error as Error;
      store.setError(err.message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      store.setLoading(true);
      store.setError(null);
      await authService.loginWithGoogle();
    } catch (error) {
      const err = error as Error;
      store.setError(err.message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<void> => {
    try {
      store.setLoading(true);
      store.setError(null);
      await authService.registerWithEmail(email, password, displayName);
    } catch (error) {
      const err = error as Error;
      store.setError(err.message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      store.setLoading(true);
      await authService.logout();
      store.logout();
      navigate('/login');
    } catch (error) {
      const err = error as Error;
      store.setError(err.message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  };

  const resetPassword = async (data: PasswordResetData): Promise<void> => {
    try {
      store.setLoading(true);
      store.setError(null);
      await authService.resetPassword(data);
    } catch (error) {
      const err = error as Error;
      store.setError(err.message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  };

  const hasRole = (role: string): boolean => {
    return store.user?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    if (!store.user) return false;
    if (store.user.role === 'super_admin') return true;
    return false;
  };

  const canAccessEstablishment = (establishmentId: string): boolean => {
    if (!store.user) return false;
    if (store.user.role === 'super_admin') return true;
    return store.user.establishmentIds.includes(establishmentId);
  };

  return {
    user: store.user,
    firebaseUser: store.firebaseUser,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
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
