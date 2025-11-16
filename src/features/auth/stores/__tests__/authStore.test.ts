/**
 * Tests pour authStore
 *
 * Tests unitaires du store Zustand d'authentification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { User } from '@/shared/types';
import { UserRole } from '@/features/users/types/role.types';

describe('authStore', () => {
  // Réinitialiser le store avant chaque test
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      firebaseUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe('État initial', () => {
    it('devrait avoir un état initial correct', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.firebaseUser).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('devrait définir l utilisateur et isAuthenticated à true', () => {
      const mockUser: User = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'admin',
        establishmentIds: ['est1'],
        isActive: true,
        isEmailVerified: true,
        preferences: {
          theme: 'light',
          language: 'fr',
          notifications: {
            email: true,
            push: true,
            inApp: true,
          },
          dashboard: {
            layout: 'grid',
            widgets: [],
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('devrait définir isAuthenticated à false si user est null', () => {
      useAuthStore.getState().setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('devrait définir isLoading', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('devrait définir l erreur', () => {
      const errorMessage = 'Une erreur est survenue';
      useAuthStore.getState().setError(errorMessage);

      expect(useAuthStore.getState().error).toBe(errorMessage);
    });

    it('devrait pouvoir réinitialiser l erreur à null', () => {
      useAuthStore.getState().setError('Erreur');
      useAuthStore.getState().setError(null);

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('logout', () => {
    it('devrait réinitialiser le store', () => {
      // Définir un état
      const mockUser: User = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'admin',
        establishmentIds: ['est1'],
        isActive: true,
        isEmailVerified: true,
        preferences: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setError('Erreur');

      // Logout
      useAuthStore.getState().logout();

      // Vérifier la réinitialisation
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.firebaseUser).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('devrait mettre à jour l utilisateur', () => {
      const mockUser: User = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'admin',
        establishmentIds: ['est1'],
        isActive: true,
        isEmailVerified: true,
        preferences: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      useAuthStore.getState().setUser(mockUser);

      // Mettre à jour
      useAuthStore.getState().updateUser({
        displayName: 'Updated Name',
        phoneNumber: '0123456789',
      });

      const state = useAuthStore.getState();
      expect(state.user?.displayName).toBe('Updated Name');
      expect(state.user?.phoneNumber).toBe('0123456789');
      expect(state.user?.email).toBe('test@example.com'); // Inchangé
    });

    it('ne devrait rien faire si user est null', () => {
      useAuthStore.getState().updateUser({
        displayName: 'Updated Name',
      });

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('devrait retourner true si l utilisateur a le rôle', () => {
      const mockUser: User = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'admin',
        establishmentIds: ['est1'],
        isActive: true,
        isEmailVerified: true,
        preferences: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      useAuthStore.getState().setUser(mockUser);

      expect(useAuthStore.getState().hasRole(UserRole.ADMIN)).toBe(true);
      expect(useAuthStore.getState().hasRole(UserRole.TECHNICIAN)).toBe(false);
    });

    it('devrait retourner false si user est null', () => {
      expect(useAuthStore.getState().hasRole(UserRole.ADMIN)).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('devrait retourner true pour super_admin (toutes permissions)', () => {
      const mockUser: User = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'super_admin',
        establishmentIds: ['est1'],
        isActive: true,
        isEmailVerified: true,
        preferences: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      useAuthStore.getState().setUser(mockUser);

      expect(useAuthStore.getState().hasPermission('any.permission')).toBe(true);
    });

    it('devrait retourner false si user est null', () => {
      expect(useAuthStore.getState().hasPermission('interventions.create')).toBe(false);
    });
  });

  describe('canAccessEstablishment', () => {
    it('devrait retourner true si super_admin', () => {
      const mockUser: User = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'super_admin',
        establishmentIds: [],
        isActive: true,
        isEmailVerified: true,
        preferences: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      useAuthStore.getState().setUser(mockUser);

      expect(useAuthStore.getState().canAccessEstablishment('any-id')).toBe(true);
    });

    it('devrait retourner true si établissement dans la liste', () => {
      const mockUser: User = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'admin',
        establishmentIds: ['est1', 'est2'],
        isActive: true,
        isEmailVerified: true,
        preferences: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      useAuthStore.getState().setUser(mockUser);

      expect(useAuthStore.getState().canAccessEstablishment('est1')).toBe(true);
      expect(useAuthStore.getState().canAccessEstablishment('est3')).toBe(false);
    });

    it('devrait retourner false si user est null', () => {
      expect(useAuthStore.getState().canAccessEstablishment('est1')).toBe(false);
    });
  });
});
