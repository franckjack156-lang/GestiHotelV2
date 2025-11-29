/**
 * Tests pour useAuth hook
 *
 * Hook principal gérant l'authentification et les permissions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import * as authService from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '@/features/users/types/role.types';
import type { AuthCredentials, PasswordResetData } from '@/shared/types';
import { permissionService } from '@/core/services/permissionService';

// =============================================================================
// MOCKS
// =============================================================================

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock authService
vi.mock('../../services/authService', () => ({
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  registerWithEmail: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn(),
}));

// Mock authStore
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock permissionService
vi.mock('@/core/services/permissionService', () => ({
  permissionService: {
    hasPermission: vi.fn(),
    hasAllPermissions: vi.fn(),
    hasAnyPermission: vi.fn(),
    checkPermission: vi.fn(),
    isAdmin: vi.fn(),
    isSuperAdmin: vi.fn(),
    hasEstablishmentAccess: vi.fn(),
    canManageUser: vi.fn(),
    canAssignRole: vi.fn(),
  },
}));

// =============================================================================
// TEST SUITE
// =============================================================================

describe('useAuth', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'admin' as const,
    establishmentIds: ['est-123'],
    currentEstablishmentId: 'est-123',
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Mock du store par défaut
    (useAuthStore as any).mockImplementation((selector: any) => {
      const state = {
        user: null,
        firebaseUser: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        setLoading: vi.fn(),
        setError: vi.fn(),
        logout: vi.fn(),
      };

      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    // Mock de getState
    (useAuthStore as any).getState = vi.fn(() => ({
      user: null,
      setLoading: vi.fn(),
      setError: vi.fn(),
      logout: vi.fn(),
    }));
  });

  // ===========================================================================
  // login
  // ===========================================================================

  describe('login', () => {
    it('devrait connecter un utilisateur avec succès', async () => {
      // Arrange
      const credentials: AuthCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockSetLoading = vi.fn();
      const mockSetError = vi.fn();

      (useAuthStore as any).getState = vi.fn(() => ({
        setLoading: mockSetLoading,
        setError: mockSetError,
      }));

      vi.mocked(authService.loginWithEmail).mockResolvedValue({} as any);

      // Act
      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.login(credentials);
      });

      // Assert
      expect(authService.loginWithEmail).toHaveBeenCalledWith(credentials);
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      expect(mockSetError).toHaveBeenCalledWith(null);
    });

    it('devrait gérer les erreurs de connexion', async () => {
      // Arrange
      const credentials: AuthCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockSetError = vi.fn();
      const mockSetLoading = vi.fn();

      (useAuthStore as any).getState = vi.fn(() => ({
        setLoading: mockSetLoading,
        setError: mockSetError,
      }));

      const error = new Error('Invalid credentials');
      vi.mocked(authService.loginWithEmail).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      await expect(
        act(async () => {
          await result.current.login(credentials);
        })
      ).rejects.toThrow('Invalid credentials');

      expect(mockSetError).toHaveBeenCalledWith('Invalid credentials');
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });

  // ===========================================================================
  // loginWithGoogle
  // ===========================================================================

  describe('loginWithGoogle', () => {
    it('devrait connecter avec Google avec succès', async () => {
      // Arrange
      const mockSetLoading = vi.fn();
      const mockSetError = vi.fn();

      (useAuthStore as any).getState = vi.fn(() => ({
        setLoading: mockSetLoading,
        setError: mockSetError,
      }));

      vi.mocked(authService.loginWithGoogle).mockResolvedValue({} as any);

      // Act
      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.loginWithGoogle();
      });

      // Assert
      expect(authService.loginWithGoogle).toHaveBeenCalled();
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('devrait gérer les erreurs de connexion Google', async () => {
      // Arrange
      const mockSetError = vi.fn();
      const mockSetLoading = vi.fn();

      (useAuthStore as any).getState = vi.fn(() => ({
        setLoading: mockSetLoading,
        setError: mockSetError,
      }));

      const error = new Error('Google auth failed');
      vi.mocked(authService.loginWithGoogle).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      await expect(
        act(async () => {
          await result.current.loginWithGoogle();
        })
      ).rejects.toThrow('Google auth failed');

      expect(mockSetError).toHaveBeenCalledWith('Google auth failed');
    });
  });

  // ===========================================================================
  // register
  // ===========================================================================

  describe('register', () => {
    it('devrait créer un nouvel utilisateur avec succès', async () => {
      // Arrange
      const email = 'newuser@example.com';
      const password = 'password123';
      const displayName = 'New User';

      const mockSetLoading = vi.fn();
      const mockSetError = vi.fn();

      (useAuthStore as any).getState = vi.fn(() => ({
        setLoading: mockSetLoading,
        setError: mockSetError,
      }));

      vi.mocked(authService.registerWithEmail).mockResolvedValue({} as any);

      // Act
      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.register(email, password, displayName);
      });

      // Assert
      expect(authService.registerWithEmail).toHaveBeenCalledWith(email, password, displayName);
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('devrait gérer les erreurs d inscription', async () => {
      // Arrange
      const mockSetError = vi.fn();
      const mockSetLoading = vi.fn();

      (useAuthStore as any).getState = vi.fn(() => ({
        setLoading: mockSetLoading,
        setError: mockSetError,
      }));

      const error = new Error('Registration failed');
      vi.mocked(authService.registerWithEmail).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      await expect(
        act(async () => {
          await result.current.register('test@example.com', 'password', 'Test');
        })
      ).rejects.toThrow('Registration failed');

      expect(mockSetError).toHaveBeenCalledWith('Registration failed');
    });
  });

  // ===========================================================================
  // logout
  // ===========================================================================

  describe('logout', () => {
    it('devrait déconnecter l utilisateur avec succès', async () => {
      // Arrange
      const mockSetLoading = vi.fn();
      const mockLogout = vi.fn();

      (useAuthStore as any).getState = vi.fn(() => ({
        setLoading: mockSetLoading,
        setError: vi.fn(),
        logout: mockLogout,
      }));

      vi.mocked(authService.logout).mockResolvedValue();

      // Act
      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      expect(authService.logout).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('devrait gérer les erreurs de déconnexion', async () => {
      // Arrange
      const mockSetError = vi.fn();
      const mockSetLoading = vi.fn();

      (useAuthStore as any).getState = vi.fn(() => ({
        setLoading: mockSetLoading,
        setError: mockSetError,
        logout: vi.fn(),
      }));

      const error = new Error('Logout failed');
      vi.mocked(authService.logout).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      await expect(
        act(async () => {
          await result.current.logout();
        })
      ).rejects.toThrow('Logout failed');

      expect(mockSetError).toHaveBeenCalledWith('Logout failed');
    });
  });

  // ===========================================================================
  // resetPassword
  // ===========================================================================

  describe('resetPassword', () => {
    it('devrait envoyer un email de réinitialisation', async () => {
      // Arrange
      const data: PasswordResetData = {
        email: 'test@example.com',
      };

      const mockSetLoading = vi.fn();
      const mockSetError = vi.fn();

      (useAuthStore as any).getState = vi.fn(() => ({
        setLoading: mockSetLoading,
        setError: mockSetError,
      }));

      vi.mocked(authService.resetPassword).mockResolvedValue();

      // Act
      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.resetPassword(data);
      });

      // Assert
      expect(authService.resetPassword).toHaveBeenCalledWith(data);
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('devrait gérer les erreurs de réinitialisation', async () => {
      // Arrange
      const mockSetError = vi.fn();
      const mockSetLoading = vi.fn();

      (useAuthStore as any).getState = vi.fn(() => ({
        setLoading: mockSetLoading,
        setError: mockSetError,
      }));

      const error = new Error('Reset failed');
      vi.mocked(authService.resetPassword).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      await expect(
        act(async () => {
          await result.current.resetPassword({ email: 'test@example.com' });
        })
      ).rejects.toThrow('Reset failed');

      expect(mockSetError).toHaveBeenCalledWith('Reset failed');
    });
  });

  // ===========================================================================
  // hasRole
  // ===========================================================================

  describe('hasRole', () => {
    it('devrait retourner true si l utilisateur a le rôle', () => {
      // Arrange
      (useAuthStore as any).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: mockUser });
        }
        return mockUser;
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.hasRole('admin')).toBe(true);
    });

    it('devrait retourner false si l utilisateur n a pas le rôle', () => {
      // Arrange
      (useAuthStore as any).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: mockUser });
        }
        return mockUser;
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.hasRole('super_admin')).toBe(false);
    });

    it('devrait retourner false si pas d utilisateur', () => {
      // Arrange
      (useAuthStore as any).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: null });
        }
        return null;
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.hasRole('admin')).toBe(false);
    });
  });

  // ===========================================================================
  // hasPermission
  // ===========================================================================

  describe('hasPermission', () => {
    it('devrait utiliser permissionService pour vérifier les permissions', () => {
      // Arrange
      vi.mocked(permissionService.hasPermission).mockReturnValue(true);

      (useAuthStore as any).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: mockUser });
        }
        return mockUser;
      });

      // Act
      const { result } = renderHook(() => useAuth());
      const hasPermission = result.current.hasPermission('interventions.create' as any);

      // Assert
      expect(hasPermission).toBe(true);
      expect(permissionService.hasPermission).toHaveBeenCalledWith(
        mockUser,
        'interventions.create'
      );
    });
  });

  // ===========================================================================
  // isAdmin
  // ===========================================================================

  describe('isAdmin', () => {
    it('devrait vérifier si l utilisateur est admin', () => {
      // Arrange
      vi.mocked(permissionService.isAdmin).mockReturnValue(true);

      (useAuthStore as any).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: mockUser });
        }
        return mockUser;
      });

      // Act
      const { result } = renderHook(() => useAuth());
      const isAdmin = result.current.isAdmin();

      // Assert
      expect(isAdmin).toBe(true);
      expect(permissionService.isAdmin).toHaveBeenCalledWith(mockUser);
    });
  });

  // ===========================================================================
  // isSuperAdmin
  // ===========================================================================

  describe('isSuperAdmin', () => {
    it('devrait vérifier si l utilisateur est super admin', () => {
      // Arrange
      vi.mocked(permissionService.isSuperAdmin).mockReturnValue(false);

      (useAuthStore as any).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: mockUser });
        }
        return mockUser;
      });

      // Act
      const { result } = renderHook(() => useAuth());
      const isSuperAdmin = result.current.isSuperAdmin();

      // Assert
      expect(isSuperAdmin).toBe(false);
      expect(permissionService.isSuperAdmin).toHaveBeenCalledWith(mockUser);
    });
  });

  // ===========================================================================
  // canAccessEstablishment
  // ===========================================================================

  describe('canAccessEstablishment', () => {
    it('devrait vérifier l accès à un établissement', () => {
      // Arrange
      // permissionService déjà importé en haut
      vi.mocked(permissionService.hasEstablishmentAccess).mockReturnValue(true);

      (useAuthStore as any).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: mockUser });
        }
        return mockUser;
      });

      // Act
      const { result } = renderHook(() => useAuth());
      const canAccess = result.current.canAccessEstablishment('est-123');

      // Assert
      expect(canAccess).toBe(true);
      expect(permissionService.hasEstablishmentAccess).toHaveBeenCalledWith(mockUser, 'est-123');
    });

    it('devrait retourner false si pas d utilisateur', () => {
      // Arrange
      (useAuthStore as any).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: null });
        }
        return null;
      });

      // Act
      const { result } = renderHook(() => useAuth());
      const canAccess = result.current.canAccessEstablishment('est-123');

      // Assert
      expect(canAccess).toBe(false);
    });
  });

  // ===========================================================================
  // canManageUser
  // ===========================================================================

  describe('canManageUser', () => {
    it('devrait vérifier si l utilisateur peut gérer un autre utilisateur', () => {
      // Arrange
      const targetUser = {
        role: UserRole.TECHNICIAN,
        establishmentIds: ['est-123'],
      };

      // permissionService déjà importé en haut
      vi.mocked(permissionService.canManageUser).mockReturnValue(true);

      (useAuthStore as any).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: mockUser });
        }
        return mockUser;
      });

      // Act
      const { result } = renderHook(() => useAuth());
      const canManage = result.current.canManageUser(targetUser);

      // Assert
      expect(canManage).toBe(true);
      expect(permissionService.canManageUser).toHaveBeenCalledWith(mockUser, targetUser);
    });

    it('devrait retourner false si pas d utilisateur', () => {
      // Arrange
      (useAuthStore as any).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: null });
        }
        return null;
      });

      // Act
      const { result } = renderHook(() => useAuth());
      const canManage = result.current.canManageUser({
        role: UserRole.TECHNICIAN,
        establishmentIds: ['est-123'],
      });

      // Assert
      expect(canManage).toBe(false);
    });
  });

  // ===========================================================================
  // canAssignRole
  // ===========================================================================

  describe('canAssignRole', () => {
    it('devrait vérifier si l utilisateur peut assigner un rôle', () => {
      // Arrange
      // permissionService déjà importé en haut
      vi.mocked(permissionService.canAssignRole).mockReturnValue(true);

      (useAuthStore as any).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: mockUser });
        }
        return mockUser;
      });

      // Act
      const { result } = renderHook(() => useAuth());
      const canAssign = result.current.canAssignRole('technician' as any);

      // Assert
      expect(canAssign).toBe(true);
      expect(permissionService.canAssignRole).toHaveBeenCalledWith(mockUser, 'technician');
    });

    it('devrait retourner false si pas d utilisateur', () => {
      // Arrange
      (useAuthStore as any).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ user: null });
        }
        return null;
      });

      // Act
      const { result } = renderHook(() => useAuth());
      const canAssign = result.current.canAssignRole('technician' as any);

      // Assert
      expect(canAssign).toBe(false);
    });
  });
});
