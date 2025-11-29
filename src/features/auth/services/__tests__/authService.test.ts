/**
 * Tests pour authService
 *
 * Service critique gérant l'authentification avec Firebase
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  logout,
  resetPassword,
  changePassword,
  changeEmail,
  resendVerificationEmail,
  updateUserProfile,
  getCurrentUser,
  isAuthenticated,
  getIdToken,
} from '../authService';
import * as firebaseAuth from 'firebase/auth';
import type { AuthCredentials, PasswordResetData, ChangePasswordData } from '@/shared/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
  updateProfile: vi.fn(),
  updateEmail: vi.fn(),
  updatePassword: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
}));

// Mock Firebase config
vi.mock('@/core/config/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock logger
vi.mock('@/core/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
}));

// =============================================================================
// TEST SUITE
// =============================================================================

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // loginWithEmail
  // ===========================================================================

  describe('loginWithEmail', () => {
    it('devrait connecter un utilisateur avec succès', async () => {
      // Arrange
      const credentials: AuthCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      const mockUserCredential = {
        user: mockUser,
      };

      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValue(
        mockUserCredential as any
      );

      // Act
      const result = await loginWithEmail(credentials);

      // Assert
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        credentials.email,
        credentials.password
      );
      expect(result).toEqual(mockUser);
    });

    it('devrait gérer les erreurs de connexion', async () => {
      // Arrange
      const credentials: AuthCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockError = {
        code: 'auth/wrong-password',
        message: 'Wrong password',
      };

      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValue(mockError);

      // Act & Assert
      await expect(loginWithEmail(credentials)).rejects.toThrow('Mot de passe incorrect');
    });

    it('devrait gérer les erreurs utilisateur non trouvé', async () => {
      // Arrange
      const credentials: AuthCredentials = {
        email: 'unknown@example.com',
        password: 'password123',
      };

      const mockError = {
        code: 'auth/user-not-found',
      };

      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValue(mockError);

      // Act & Assert
      await expect(loginWithEmail(credentials)).rejects.toThrow(
        'Aucun compte trouvé avec cet email'
      );
    });

    it('devrait gérer les erreurs réseau', async () => {
      // Arrange
      const credentials: AuthCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockError = {
        code: 'auth/network-request-failed',
      };

      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValue(mockError);

      // Act & Assert
      await expect(loginWithEmail(credentials)).rejects.toThrow(
        'Erreur réseau. Vérifiez votre connexion'
      );
    });
  });

  // ===========================================================================
  // loginWithGoogle
  // ===========================================================================

  describe('loginWithGoogle', () => {
    it('devrait connecter avec Google avec succès', async () => {
      // Arrange
      const mockUser = {
        uid: 'google-user-123',
        email: 'google@example.com',
        displayName: 'Google User',
      };

      const mockUserCredential = {
        user: mockUser,
      };

      vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValue(mockUserCredential as any);

      // Act
      const result = await loginWithGoogle();

      // Assert
      expect(firebaseAuth.GoogleAuthProvider).toHaveBeenCalled();
      expect(firebaseAuth.signInWithPopup).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('devrait gérer les erreurs de connexion Google', async () => {
      // Arrange
      const mockError = {
        code: 'auth/popup-closed-by-user',
        message: 'Popup closed',
      };

      vi.mocked(firebaseAuth.signInWithPopup).mockRejectedValue(mockError);

      // Act & Assert
      await expect(loginWithGoogle()).rejects.toThrow();
    });
  });

  // ===========================================================================
  // registerWithEmail
  // ===========================================================================

  describe('registerWithEmail', () => {
    it('devrait créer un nouvel utilisateur avec succès', async () => {
      // Arrange
      const email = 'newuser@example.com';
      const password = 'password123';
      const displayName = 'New User';

      const mockUser = {
        uid: 'new-user-123',
        email,
      };

      const mockUserCredential = {
        user: mockUser,
      };

      vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValue(
        mockUserCredential as any
      );
      vi.mocked(firebaseAuth.updateProfile).mockResolvedValue(undefined);
      vi.mocked(firebaseAuth.sendEmailVerification).mockResolvedValue(undefined);

      // Act
      const result = await registerWithEmail(email, password, displayName);

      // Assert
      expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        email,
        password
      );
      expect(firebaseAuth.updateProfile).toHaveBeenCalledWith(mockUser, { displayName });
      expect(firebaseAuth.sendEmailVerification).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('devrait gérer les erreurs email déjà utilisé', async () => {
      // Arrange
      const mockError = {
        code: 'auth/email-already-in-use',
      };

      vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockRejectedValue(mockError);

      // Act & Assert
      await expect(registerWithEmail('test@example.com', 'password', 'Test')).rejects.toThrow(
        'Cet email est déjà utilisé'
      );
    });

    it('devrait gérer les mots de passe faibles', async () => {
      // Arrange
      const mockError = {
        code: 'auth/weak-password',
      };

      vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockRejectedValue(mockError);

      // Act & Assert
      await expect(registerWithEmail('test@example.com', '123', 'Test')).rejects.toThrow(
        'Mot de passe trop faible'
      );
    });
  });

  // ===========================================================================
  // logout
  // ===========================================================================

  describe('logout', () => {
    it('devrait déconnecter l utilisateur avec succès', async () => {
      // Arrange
      vi.mocked(firebaseAuth.signOut).mockResolvedValue(undefined);

      // Act
      await logout();

      // Assert
      expect(firebaseAuth.signOut).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de déconnexion', async () => {
      // Arrange
      const mockError = new Error('Signout failed');
      vi.mocked(firebaseAuth.signOut).mockRejectedValue(mockError);

      // Act & Assert
      await expect(logout()).rejects.toThrow('Signout failed');
    });
  });

  // ===========================================================================
  // resetPassword
  // ===========================================================================

  describe('resetPassword', () => {
    it('devrait envoyer un email de réinitialisation avec succès', async () => {
      // Arrange
      const data: PasswordResetData = {
        email: 'test@example.com',
      };

      vi.mocked(firebaseAuth.sendPasswordResetEmail).mockResolvedValue(undefined);

      // Act
      await resetPassword(data);

      // Assert
      expect(firebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        data.email
      );
    });

    it('devrait gérer les erreurs utilisateur non trouvé', async () => {
      // Arrange
      const data: PasswordResetData = {
        email: 'unknown@example.com',
      };

      const mockError = {
        code: 'auth/user-not-found',
      };

      vi.mocked(firebaseAuth.sendPasswordResetEmail).mockRejectedValue(mockError);

      // Act & Assert
      await expect(resetPassword(data)).rejects.toThrow('Aucun compte trouvé avec cet email');
    });

    it('devrait gérer les emails invalides', async () => {
      // Arrange
      const data: PasswordResetData = {
        email: 'invalid-email',
      };

      const mockError = {
        code: 'auth/invalid-email',
      };

      vi.mocked(firebaseAuth.sendPasswordResetEmail).mockRejectedValue(mockError);

      // Act & Assert
      await expect(resetPassword(data)).rejects.toThrow('Email invalide');
    });
  });

  // ===========================================================================
  // changePassword
  // ===========================================================================

  describe('changePassword', () => {
    it('devrait changer le mot de passe avec succès', async () => {
      // Arrange
      const data: ChangePasswordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      };

      const mockUser = {
        email: 'test@example.com',
      };

      // Mock auth.currentUser
      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = mockUser;

      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);
      vi.mocked(firebaseAuth.updatePassword).mockResolvedValue(undefined);

      // Act
      await changePassword(data);

      // Assert
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        mockUser.email,
        data.currentPassword
      );
      expect(firebaseAuth.updatePassword).toHaveBeenCalledWith(mockUser, data.newPassword);
    });

    it('devrait échouer si aucun utilisateur connecté', async () => {
      // Arrange
      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = null;

      const data: ChangePasswordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      };

      // Act & Assert
      await expect(changePassword(data)).rejects.toThrow('Utilisateur non connecté');
    });

    it('devrait gérer les erreurs de mot de passe actuel incorrect', async () => {
      // Arrange
      const data: ChangePasswordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      const mockUser = {
        email: 'test@example.com',
      };

      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = mockUser;

      const mockError = {
        code: 'auth/wrong-password',
      };

      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValue(mockError);

      // Act & Assert
      await expect(changePassword(data)).rejects.toThrow('Mot de passe incorrect');
    });
  });

  // ===========================================================================
  // changeEmail
  // ===========================================================================

  describe('changeEmail', () => {
    it('devrait changer l email avec succès', async () => {
      // Arrange
      const newEmail = 'newemail@example.com';
      const mockUser = {
        email: 'oldemail@example.com',
      };

      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = mockUser;

      vi.mocked(firebaseAuth.updateEmail).mockResolvedValue(undefined);
      vi.mocked(firebaseAuth.sendEmailVerification).mockResolvedValue(undefined);

      // Act
      await changeEmail(newEmail);

      // Assert
      expect(firebaseAuth.updateEmail).toHaveBeenCalledWith(mockUser, newEmail);
      expect(firebaseAuth.sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    it('devrait échouer si aucun utilisateur connecté', async () => {
      // Arrange
      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = null;

      // Act & Assert
      await expect(changeEmail('newemail@example.com')).rejects.toThrow(
        'Utilisateur non connecté'
      );
    });
  });

  // ===========================================================================
  // resendVerificationEmail
  // ===========================================================================

  describe('resendVerificationEmail', () => {
    it('devrait renvoyer l email de vérification avec succès', async () => {
      // Arrange
      const mockUser = {
        email: 'test@example.com',
      };

      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = mockUser;

      vi.mocked(firebaseAuth.sendEmailVerification).mockResolvedValue(undefined);

      // Act
      await resendVerificationEmail();

      // Assert
      expect(firebaseAuth.sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    it('devrait échouer si aucun utilisateur connecté', async () => {
      // Arrange
      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = null;

      // Act & Assert
      await expect(resendVerificationEmail()).rejects.toThrow('Utilisateur non connecté');
    });
  });

  // ===========================================================================
  // updateUserProfile
  // ===========================================================================

  describe('updateUserProfile', () => {
    it('devrait mettre à jour le profil avec succès', async () => {
      // Arrange
      const profileData = {
        displayName: 'Updated Name',
        photoURL: 'https://example.com/photo.jpg',
      };

      const mockUser = {
        email: 'test@example.com',
      };

      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = mockUser;

      vi.mocked(firebaseAuth.updateProfile).mockResolvedValue(undefined);

      // Act
      await updateUserProfile(profileData);

      // Assert
      expect(firebaseAuth.updateProfile).toHaveBeenCalledWith(mockUser, profileData);
    });

    it('devrait échouer si aucun utilisateur connecté', async () => {
      // Arrange
      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = null;

      // Act & Assert
      await expect(
        updateUserProfile({ displayName: 'Test' })
      ).rejects.toThrow('Utilisateur non connecté');
    });
  });

  // ===========================================================================
  // getCurrentUser
  // ===========================================================================

  describe('getCurrentUser', () => {
    it('devrait retourner l utilisateur actuel', () => {
      // Arrange
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
      };

      const { auth } = require('@/core/config/firebase');
      auth.currentUser = mockUser;

      // Act
      const result = getCurrentUser();

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('devrait retourner null si aucun utilisateur connecté', () => {
      // Arrange
      const { auth } = require('@/core/config/firebase');
      auth.currentUser = null;

      // Act
      const result = getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // isAuthenticated
  // ===========================================================================

  describe('isAuthenticated', () => {
    it('devrait retourner true si utilisateur connecté', () => {
      // Arrange
      const { auth } = require('@/core/config/firebase');
      auth.currentUser = { uid: 'user123' };

      // Act
      const result = isAuthenticated();

      // Assert
      expect(result).toBe(true);
    });

    it('devrait retourner false si aucun utilisateur connecté', () => {
      // Arrange
      const { auth } = require('@/core/config/firebase');
      auth.currentUser = null;

      // Act
      const result = isAuthenticated();

      // Assert
      expect(result).toBe(false);
    });
  });

  // ===========================================================================
  // getIdToken
  // ===========================================================================

  describe('getIdToken', () => {
    it('devrait retourner le token ID', async () => {
      // Arrange
      const mockToken = 'mock-id-token-123';
      const mockUser = {
        getIdToken: vi.fn().mockResolvedValue(mockToken),
      };

      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = mockUser;

      // Act
      const result = await getIdToken();

      // Assert
      expect(mockUser.getIdToken).toHaveBeenCalledWith(false);
      expect(result).toBe(mockToken);
    });

    it('devrait forcer le rafraîchissement du token si demandé', async () => {
      // Arrange
      const mockToken = 'refreshed-token';
      const mockUser = {
        getIdToken: vi.fn().mockResolvedValue(mockToken),
      };

      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = mockUser;

      // Act
      const result = await getIdToken(true);

      // Assert
      expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
      expect(result).toBe(mockToken);
    });

    it('devrait retourner null si aucun utilisateur connecté', async () => {
      // Arrange
      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = null;

      // Act
      const result = await getIdToken();

      // Assert
      expect(result).toBeNull();
    });

    it('devrait gérer les erreurs de récupération du token', async () => {
      // Arrange
      const mockUser = {
        getIdToken: vi.fn().mockRejectedValue(new Error('Token error')),
      };

      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = mockUser;

      // Act
      const result = await getIdToken();

      // Assert
      expect(result).toBeNull();
    });
  });
});
