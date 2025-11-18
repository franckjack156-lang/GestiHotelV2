/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ============================================================================
 * USE AUTH HOOK - Tests
 * ============================================================================
 *
 * Tests complets pour le hook useAuth
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { useAuthStore } from '../../stores/authStore';
import * as authService from '../../services/authService';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mock du navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock des services d'authentification
vi.mock('../../services/authService', () => ({
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  registerWithEmail: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn(),
}));

// Wrapper pour le hook
const wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Zustand store
    useAuthStore.setState({
      user: null,
      firebaseUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // INITIAL STATE TESTS
  // ============================================================================

  describe('Initial State', () => {
    it('should return initial unauthenticated state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.firebaseUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should provide all auth methods', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.loginWithGoogle).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.resetPassword).toBe('function');
      expect(typeof result.current.hasRole).toBe('function');
      expect(typeof result.current.hasPermission).toBe('function');
      expect(typeof result.current.canAccessEstablishment).toBe('function');
    });
  });

  // ============================================================================
  // LOGIN TESTS
  // ============================================================================

  describe('Login', () => {
    it('should call loginWithEmail service on login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      const credentials = { email: 'test@example.com', password: 'password123' };

      vi.mocked(authService.loginWithEmail).mockResolvedValue(undefined);

      await result.current.login(credentials);

      expect(authService.loginWithEmail).toHaveBeenCalledWith(credentials);
    });

    it('should set loading state during login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      const credentials = { email: 'test@example.com', password: 'password123' };

      vi.mocked(authService.loginWithEmail).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const loginPromise = result.current.login(credentials);

      // Vérifier que isLoading est true pendant la requête
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await loginPromise;

      // Vérifier que isLoading est false après
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle login errors', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      const credentials = { email: 'test@example.com', password: 'wrong' };
      const error = new Error('Invalid credentials');

      vi.mocked(authService.loginWithEmail).mockRejectedValue(error);

      await expect(result.current.login(credentials)).rejects.toThrow('Invalid credentials');
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('should clear error on new login attempt', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Premier login avec erreur
      vi.mocked(authService.loginWithEmail).mockRejectedValue(new Error('Error 1'));
      await expect(
        result.current.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow();

      // Deuxième login réussi
      vi.mocked(authService.loginWithEmail).mockResolvedValue(undefined);
      await result.current.login({ email: 'test@example.com', password: 'correct' });

      expect(result.current.error).toBeNull();
    });
  });

  // ============================================================================
  // GOOGLE LOGIN TESTS
  // ============================================================================

  describe('Google Login', () => {
    it('should call loginWithGoogle service', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      vi.mocked(authService.loginWithGoogle).mockResolvedValue(undefined);

      await result.current.loginWithGoogle();

      expect(authService.loginWithGoogle).toHaveBeenCalled();
    });

    it('should handle Google login errors', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      const error = new Error('Google login failed');

      vi.mocked(authService.loginWithGoogle).mockRejectedValue(error);

      await expect(result.current.loginWithGoogle()).rejects.toThrow('Google login failed');
      expect(result.current.error).toBe('Google login failed');
    });
  });

  // ============================================================================
  // REGISTER TESTS
  // ============================================================================

  describe('Register', () => {
    it('should call registerWithEmail service', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      vi.mocked(authService.registerWithEmail).mockResolvedValue(undefined);

      await result.current.register('test@example.com', 'password123', 'Test User');

      expect(authService.registerWithEmail).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'Test User'
      );
    });

    it('should handle registration errors', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      const error = new Error('Registration failed');

      vi.mocked(authService.registerWithEmail).mockRejectedValue(error);

      await expect(
        result.current.register('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow('Registration failed');
    });
  });

  // ============================================================================
  // LOGOUT TESTS
  // ============================================================================

  describe('Logout', () => {
    it('should call logout service', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      vi.mocked(authService.logout).mockResolvedValue(undefined);

      await result.current.logout();

      expect(authService.logout).toHaveBeenCalled();
    });

    it('should navigate to login page after logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      vi.mocked(authService.logout).mockResolvedValue(undefined);

      await result.current.logout();

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should clear user state on logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set authenticated state
      useAuthStore.setState({
        user: {
          id: 'test-id',
          email: 'test@example.com',
          displayName: 'Test User',
        } as any,
        isAuthenticated: true,
      });

      vi.mocked(authService.logout).mockResolvedValue(undefined);

      await result.current.logout();

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle logout errors', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      const error = new Error('Logout failed');

      vi.mocked(authService.logout).mockRejectedValue(error);

      await expect(result.current.logout()).rejects.toThrow('Logout failed');
    });
  });

  // ============================================================================
  // RESET PASSWORD TESTS
  // ============================================================================

  describe('Reset Password', () => {
    it('should call resetPassword service', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      const resetData = { email: 'test@example.com' };

      vi.mocked(authService.resetPassword).mockResolvedValue(undefined);

      await result.current.resetPassword(resetData);

      expect(authService.resetPassword).toHaveBeenCalledWith(resetData);
    });

    it('should handle reset password errors', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      const error = new Error('Reset failed');

      vi.mocked(authService.resetPassword).mockRejectedValue(error);

      await expect(result.current.resetPassword({ email: 'test@example.com' })).rejects.toThrow(
        'Reset failed'
      );
    });
  });

  // ============================================================================
  // ROLE & PERMISSION TESTS
  // ============================================================================

  describe('Role and Permissions', () => {
    it('should check if user has role', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      useAuthStore.setState({
        user: {
          id: 'test-id',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'admin',
        } as any,
        isAuthenticated: true,
      });

      expect(result.current.hasRole('admin')).toBe(true);
      expect(result.current.hasRole('super_admin')).toBe(false);
    });

    it('should return false for hasRole when no user', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasRole('admin')).toBe(false);
    });

    it('should grant all permissions to super_admin', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      useAuthStore.setState({
        user: {
          id: 'test-id',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'super_admin',
        } as any,
        isAuthenticated: true,
      });

      expect(result.current.hasPermission('any_permission')).toBe(true);
    });

    it('should deny permissions to non-super_admin', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      useAuthStore.setState({
        user: {
          id: 'test-id',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'admin',
        } as any,
        isAuthenticated: true,
      });

      expect(result.current.hasPermission('some_permission')).toBe(false);
    });

    it('should return false for hasPermission when no user', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission('any_permission')).toBe(false);
    });
  });

  // ============================================================================
  // ESTABLISHMENT ACCESS TESTS
  // ============================================================================

  describe('Establishment Access', () => {
    it('should allow access to establishment in user list', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      useAuthStore.setState({
        user: {
          id: 'test-id',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'manager',
          establishmentIds: ['establishment-1', 'establishment-2'],
        } as any,
        isAuthenticated: true,
      });

      expect(result.current.canAccessEstablishment('establishment-1')).toBe(true);
      expect(result.current.canAccessEstablishment('establishment-3')).toBe(false);
    });

    it('should allow super_admin to access any establishment', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      useAuthStore.setState({
        user: {
          id: 'test-id',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'super_admin',
          establishmentIds: [],
        } as any,
        isAuthenticated: true,
      });

      expect(result.current.canAccessEstablishment('any-establishment')).toBe(true);
    });

    it('should deny access when no user', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.canAccessEstablishment('establishment-1')).toBe(false);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration', () => {
    it('should maintain state across multiple operations', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      vi.mocked(authService.loginWithEmail).mockResolvedValue(undefined);

      // Login
      await result.current.login({ email: 'test@example.com', password: 'password123' });
      expect(authService.loginWithEmail).toHaveBeenCalled();

      // Reset password
      vi.mocked(authService.resetPassword).mockResolvedValue(undefined);
      await result.current.resetPassword({ email: 'test@example.com' });
      expect(authService.resetPassword).toHaveBeenCalled();

      // Logout
      vi.mocked(authService.logout).mockResolvedValue(undefined);
      await result.current.logout();
      expect(authService.logout).toHaveBeenCalled();
    });

    it('should handle concurrent operations', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      vi.mocked(authService.loginWithEmail).mockResolvedValue(undefined);
      vi.mocked(authService.resetPassword).mockResolvedValue(undefined);

      // Start multiple operations
      const loginPromise = result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
      const resetPromise = result.current.resetPassword({ email: 'test@example.com' });

      await Promise.all([loginPromise, resetPromise]);

      expect(authService.loginWithEmail).toHaveBeenCalled();
      expect(authService.resetPassword).toHaveBeenCalled();
    });
  });
});
