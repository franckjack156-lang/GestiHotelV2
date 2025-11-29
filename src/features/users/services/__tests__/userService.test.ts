/**
 * Tests pour userService
 *
 * Service critique gérant les utilisateurs (CRUD)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import userService from '../userService';
import type {
  CreateUserData,
  UpdateUserData,
  UpdateProfileData,
  InviteUserData,
  UserFilters,
} from '../../types/user.types';
import { UserStatus } from '../../types/user.types';
import { UserRole } from '../../types/role.types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any

  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date: Date) => ({ toDate: () => date })),
  },
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Firebase Functions
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

// Mock Firebase config
vi.mock('@/core/config/firebase', () => ({
  db: {},
  auth: {
    currentUser: null,
  },
  functions: {},
}));

// Mock email service
vi.mock('@/shared/services/emailService', () => ({
  sendUserInvitationEmail: vi.fn(),
}));

// =============================================================================
// TEST SUITE
// =============================================================================

describe('userService', () => {
  const mockCreatedBy = 'creator-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // createUser
  // ===========================================================================

  describe('createUser', () => {
    it('devrait créer un utilisateur avec succès', async () => {
      // Arrange
      const data: CreateUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TECHNICIAN,
        establishmentIds: ['est-123'],
      };

      const mockUser = {
        uid: 'new-user-123',
        email: data.email,
      };

      const mockUserCredential = {
        user: mockUser,
      };

      // Mock auth.currentUser
      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = { uid: mockCreatedBy };

      const { createUserWithEmailAndPassword, updateProfile, signOut } = await import(
        'firebase/auth'
      );
      const { setDoc, getDoc } = await import('firebase/firestore');

      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(mockUserCredential as any);
      vi.mocked(updateProfile).mockResolvedValue(undefined);
      vi.mocked(signOut).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      } as any);

      // Act
      const result = await userService.createUser(data, mockCreatedBy);

      // Assert
      expect(result).toBe('new-user-123');
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        data.email,
        data.password
      );
      expect(setDoc).toHaveBeenCalled();
      expect(signOut).toHaveBeenCalled();
    });

    it('devrait rejeter si email invalide', async () => {
      // Arrange
      const data: CreateUserData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TECHNICIAN,
        establishmentIds: ['est-123'],
      };

      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = { uid: mockCreatedBy };

      // Act & Assert
      await expect(userService.createUser(data, mockCreatedBy)).rejects.toThrow('Email invalide');
    });

    it('devrait rejeter si mot de passe trop court', async () => {
      // Arrange
      const data: CreateUserData = {
        email: 'test@example.com',
        password: '12345', // Moins de 6 caractères
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TECHNICIAN,
        establishmentIds: ['est-123'],
      };

      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = { uid: mockCreatedBy };

      // Act & Assert
      await expect(userService.createUser(data, mockCreatedBy)).rejects.toThrow(
        'Le mot de passe doit contenir au moins 6 caractères'
      );
    });

    it('devrait gérer les erreurs email déjà utilisé', async () => {
      // Arrange
      const data: CreateUserData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TECHNICIAN,
        establishmentIds: ['est-123'],
      };

      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = { uid: mockCreatedBy };

      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      vi.mocked(createUserWithEmailAndPassword).mockRejectedValue({
        code: 'auth/email-already-in-use',
      });

      // Act & Assert
      await expect(userService.createUser(data, mockCreatedBy)).rejects.toThrow(
        'Cet email est déjà utilisé'
      );
    });

    it('devrait envoyer une invitation si demandé', async () => {
      // Arrange
      const data: CreateUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TECHNICIAN,
        establishmentIds: ['est-123'],
        sendInvitation: true,
      };

      const mockUser = {
        uid: 'new-user-123',
        email: data.email,
      };

      const { auth } = await import('@/core/config/firebase');
      (auth as any).currentUser = { uid: mockCreatedBy };

      const { createUserWithEmailAndPassword, updateProfile, signOut } = await import(
        'firebase/auth'
      );
      const { setDoc, getDoc } = await import('firebase/firestore');

      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);
      vi.mocked(updateProfile).mockResolvedValue(undefined);
      vi.mocked(signOut).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      } as any);

      // Act
      const result = await userService.createUser(data, mockCreatedBy);

      // Assert
      expect(result).toBe('new-user-123');
    });
  });

  // ===========================================================================
  // inviteUser
  // ===========================================================================

  describe('inviteUser', () => {
    it('devrait créer une invitation avec succès', async () => {
      // Arrange
      const data: InviteUserData = {
        email: 'invited@example.com',
        role: UserRole.TECHNICIAN,
        establishmentIds: ['est-123'],
        firstName: 'Jane',
        lastName: 'Smith',
        message: 'Bienvenue dans l\'équipe',
      };

      const mockInviterProfile = {
        id: mockCreatedBy,
        displayName: 'John Doe',
      };

      const { setDoc } = await import('firebase/firestore');
      vi.mocked(setDoc).mockResolvedValue(undefined);

      // Mock getUserProfile
      vi.spyOn(userService, 'getUserProfile').mockResolvedValue(mockInviterProfile as any);

      // Act
      const result = await userService.inviteUser(data, mockCreatedBy);

      // Assert
      expect(result).toBeDefined();
      expect(setDoc).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs d invitation', async () => {
      // Arrange
      const data: InviteUserData = {
        email: 'invited@example.com',
        role: UserRole.TECHNICIAN,
        establishmentIds: ['est-123'],
      };

      const { setDoc } = await import('firebase/firestore');
      vi.mocked(setDoc).mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(userService.inviteUser(data, mockCreatedBy)).rejects.toThrow(
        'Erreur lors de l\'invitation'
      );
    });
  });

  // ===========================================================================
  // getUser
  // ===========================================================================

  describe('getUser', () => {
    it('devrait récupérer un utilisateur par ID', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUserData = {
        email: 'user@example.com',
        displayName: 'Test User',
        role: UserRole.TECHNICIAN,
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: userId,
        data: () => mockUserData,
      } as any);

      // Act
      const result = await userService.getUser(userId);

      // Assert
      expect(result).toEqual({
        id: userId,
        ...mockUserData,
      });
    });

    it('devrait retourner null si utilisateur non trouvé', async () => {
      // Arrange
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      // Act
      const result = await userService.getUser('non-existent');

      // Assert
      expect(result).toBeNull();
    });

    it('devrait gérer les erreurs de récupération', async () => {
      // Arrange
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(userService.getUser('user-123')).rejects.toThrow(
        'Erreur lors de la récupération de l\'utilisateur'
      );
    });
  });

  // ===========================================================================
  // getUsersByEstablishment
  // ===========================================================================

  describe('getUsersByEstablishment', () => {
    it('devrait récupérer les utilisateurs d un établissement', async () => {
      // Arrange
      const establishmentId = 'est-123';
      const mockUsers = [
        {
          id: 'user-1',
          data: () => ({
            email: 'user1@example.com',
            displayName: 'User 1',
            role: UserRole.TECHNICIAN,
          }),
        },
        {
          id: 'user-2',
          data: () => ({
            email: 'user2@example.com',
            displayName: 'User 2',
            role: UserRole.ADMIN,
          }),
        },
      ];

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockUsers,
      } as any);

      // Act
      const result = await userService.getUsersByEstablishment(establishmentId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'user-1');
      expect(result[1]).toHaveProperty('id', 'user-2');
    });

    it('devrait filtrer par rôle', async () => {
      // Arrange
      const filters: UserFilters = {
        role: UserRole.TECHNICIAN,
      };

      const mockUsers = [
        {
          id: 'user-1',
          data: () => ({
            email: 'tech@example.com',
            displayName: 'Technician',
            role: UserRole.TECHNICIAN,
          }),
        },
      ];

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockUsers,
      } as any);

      // Act
      const result = await userService.getUsersByEstablishment('est-123', filters);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('technician');
    });

    it('devrait filtrer les utilisateurs actifs uniquement', async () => {
      // Arrange
      const filters: UserFilters = {
        activeOnly: true,
      };

      const mockUsers = [
        {
          id: 'user-1',
          data: () => ({
            email: 'active@example.com',
            displayName: 'Active User',
            isActive: true,
          }),
        },
      ];

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockUsers,
      } as any);

      // Act
      const result = await userService.getUsersByEstablishment('est-123', filters);

      // Assert
      expect(result).toHaveLength(1);
    });

    it('devrait gérer les erreurs de récupération', async () => {
      // Arrange
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockRejectedValue(new Error('Query failed'));

      // Act & Assert
      await expect(userService.getUsersByEstablishment('est-123')).rejects.toThrow(
        'Erreur lors de la récupération des utilisateurs'
      );
    });
  });

  // ===========================================================================
  // updateUser
  // ===========================================================================

  describe('updateUser', () => {
    it('devrait mettre à jour un utilisateur', async () => {
      // Arrange
      const userId = 'user-123';
      const data: UpdateUserData = {
        firstName: 'Updated',
        lastName: 'Name',
        role: UserRole.ADMIN,
      };

      const mockUserData = {
        firstName: 'Old',
        lastName: 'Name',
      };

      const { updateDoc, getDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      } as any);

      // Act
      await userService.updateUser(userId, data);

      // Assert
      expect(updateDoc).toHaveBeenCalled();
    });

    it('devrait mettre à jour displayName si firstName ou lastName change', async () => {
      // Arrange
      const userId = 'user-123';
      const data: UpdateUserData = {
        firstName: 'John',
        lastName: 'Smith',
      };

      const mockUserData = {
        firstName: 'Old',
        lastName: 'Name',
      };

      const { updateDoc, getDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      } as any);

      // Act
      await userService.updateUser(userId, data);

      // Assert
      expect(updateDoc).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de mise à jour', async () => {
      // Arrange
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(
        userService.updateUser('user-123', { firstName: 'Test' })
      ).rejects.toThrow('Erreur lors de la mise à jour de l\'utilisateur');
    });
  });

  // ===========================================================================
  // updateProfile
  // ===========================================================================

  describe('updateProfile', () => {
    it('devrait mettre à jour le profil utilisateur', async () => {
      // Arrange
      const userId = 'user-123';
      const data: UpdateProfileData = {
        displayName: 'New Display Name',
        phoneNumber: '0123456789',
        bio: 'My bio',
      };

      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      await userService.updateProfile(userId, data);

      // Assert
      expect(updateDoc).toHaveBeenCalled();
    });

    it('devrait extraire firstName et lastName de displayName', async () => {
      // Arrange
      const userId = 'user-123';
      const data: UpdateProfileData = {
        displayName: 'John Doe Smith',
      };

      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      await userService.updateProfile(userId, data);

      // Assert
      expect(updateDoc).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de mise à jour du profil', async () => {
      // Arrange
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(
        userService.updateProfile('user-123', { displayName: 'Test' })
      ).rejects.toThrow('Erreur lors de la mise à jour du profil');
    });
  });

  // ===========================================================================
  // changeUserStatus
  // ===========================================================================

  describe('changeUserStatus', () => {
    it('devrait changer le statut d un utilisateur', async () => {
      // Arrange
      const userId = 'user-123';
      const status = UserStatus.INACTIVE;

      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      await userService.changeUserStatus(userId, status);

      // Assert
      expect(updateDoc).toHaveBeenCalled();
    });

    it('devrait définir isActive à false pour statut INACTIVE', async () => {
      // Arrange
      const userId = 'user-123';
      const status = UserStatus.INACTIVE;

      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      await userService.changeUserStatus(userId, status);

      // Assert
      expect(updateDoc).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de changement de statut', async () => {
      // Arrange
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(userService.changeUserStatus('user-123', UserStatus.ACTIVE)).rejects.toThrow(
        'Erreur lors du changement de statut'
      );
    });
  });

  // ===========================================================================
  // deleteUser
  // ===========================================================================

  describe('deleteUser', () => {
    it('devrait supprimer un utilisateur (soft delete)', async () => {
      // Arrange
      const userId = 'user-123';

      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      await userService.deleteUser(userId);

      // Assert
      expect(updateDoc).toHaveBeenCalled();
    });

    it('devrait anonymiser les données utilisateur', async () => {
      // Arrange
      const userId = 'user-123';

      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      await userService.deleteUser(userId);

      // Assert
      expect(updateDoc).toHaveBeenCalledTimes(2); // Une fois pour le statut, une fois pour l'anonymisation
    });

    it('devrait gérer les erreurs de suppression', async () => {
      // Arrange
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockRejectedValue(new Error('Delete failed'));

      // Act & Assert
      await expect(userService.deleteUser('user-123')).rejects.toThrow(
        'Erreur lors de la suppression de l\'utilisateur'
      );
    });
  });

  // ===========================================================================
  // subscribeToUser
  // ===========================================================================

  describe('subscribeToUser', () => {
    it('devrait s abonner aux changements d un utilisateur', () => {
      // Arrange
      const userId = 'user-123';
      const onData = vi.fn();
      const onError = vi.fn();
      const mockUnsubscribe = vi.fn();

      const { onSnapshot } = require('firebase/firestore');
      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe);

      // Act
      const unsubscribe = userService.subscribeToUser(userId, onData, onError);

      // Assert
      expect(onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  // ===========================================================================
  // getUserStats
  // ===========================================================================

  describe('getUserStats', () => {
    it('devrait calculer les statistiques utilisateurs', async () => {
      // Arrange
      const establishmentId = 'est-123';
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          displayName: 'User 1',
          role: UserRole.TECHNICIAN,
          status: UserStatus.ACTIVE,
          isActive: true,
          createdAt: { toDate: () => new Date() },
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          displayName: 'User 2',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          isActive: true,
          createdAt: { toDate: () => new Date() },
        },
      ];

      vi.spyOn(userService, 'getUsersByEstablishment').mockResolvedValue(mockUsers as any);

      // Act
      const result = await userService.getUserStats(establishmentId);

      // Assert
      expect(result.totalUsers).toBe(2);
      expect(result.activeUsers).toBe(2);
      expect(result.inactiveUsers).toBe(0);
    });

    it('devrait compter les utilisateurs par rôle', async () => {
      // Arrange
      const establishmentId = 'est-123';
      const mockUsers = [
        {
          id: 'user-1',
          role: UserRole.TECHNICIAN,
          status: UserStatus.ACTIVE,
          isActive: true,
          createdAt: { toDate: () => new Date() },
        },
        {
          id: 'user-2',
          role: UserRole.TECHNICIAN,
          status: UserStatus.ACTIVE,
          isActive: true,
          createdAt: { toDate: () => new Date() },
        },
        {
          id: 'user-3',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          isActive: true,
          createdAt: { toDate: () => new Date() },
        },
      ];

      vi.spyOn(userService, 'getUsersByEstablishment').mockResolvedValue(mockUsers as any);

      // Act
      const result = await userService.getUserStats(establishmentId);

      // Assert
      expect(result.byRole.technician).toBe(2);
      expect(result.byRole.admin).toBe(1);
    });
  });

  // ===========================================================================
  // searchUsers
  // ===========================================================================

  describe('searchUsers', () => {
    it('devrait rechercher des utilisateurs par nom', async () => {
      // Arrange
      const searchTerm = 'John';
      const mockUsers = [
        {
          id: 'user-1',
          data: () => ({
            email: 'john@example.com',
            displayName: 'John Doe',
            isActive: true,
          }),
        },
        {
          id: 'user-2',
          data: () => ({
            email: 'jane@example.com',
            displayName: 'Jane Smith',
            isActive: true,
          }),
        },
      ];

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockUsers,
      } as any);

      // Act
      const result = await userService.searchUsers(searchTerm);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].displayName).toContain('John');
    });

    it('devrait rechercher par email', async () => {
      // Arrange
      const searchTerm = 'john@example.com';
      const mockUsers = [
        {
          id: 'user-1',
          data: () => ({
            email: 'john@example.com',
            displayName: 'John Doe',
            isActive: true,
          }),
        },
      ];

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockUsers,
      } as any);

      // Act
      const result = await userService.searchUsers(searchTerm);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('john@example.com');
    });

    it('devrait gérer les erreurs de recherche', async () => {
      // Arrange
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockRejectedValue(new Error('Search failed'));

      // Act & Assert
      await expect(userService.searchUsers('test')).rejects.toThrow('Erreur lors de la recherche');
    });
  });
});
