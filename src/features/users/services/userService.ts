/**
 * ============================================================================
 * USER SERVICE
 * ============================================================================
 * 
 * Service pour gérer les utilisateurs avec Firebase Auth et Firestore
 * 
 * @module users/services
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteUser as deleteAuthUser,
  type User as FirebaseUser,
} from 'firebase/auth';
import { db, auth } from '@/core/config/firebase';
import type {
  User,
  UserProfile,
  CreateUserData,
  UpdateUserData,
  UpdateProfileData,
  UserFilters,
  UserSortOptions,
  UserStats,
  InviteUserData,
  UserInvitation,
} from '../types/user.types';
import { UserStatus } from '../types/user.types';
import type { UserRole } from '../types/role.types';

class UserService {
  private readonly COLLECTION = 'users';

  // ==========================================================================
  // CREATE
  // ==========================================================================

  /**
   * Créer un nouvel utilisateur (Auth + Firestore)
   * 
   * @param data - Données de l'utilisateur
   * @param createdBy - ID de l'utilisateur créateur
   * @returns ID de l'utilisateur créé
   */
  async createUser(data: CreateUserData, createdBy: string): Promise<string> {
    try {
      // 1. Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const userId = userCredential.user.uid;

      // 2. Mettre à jour le profil Auth
      await updateProfile(userCredential.user, {
        displayName: `${data.firstName} ${data.lastName}`,
        photoURL: data.photoURL,
      });

      // 3. Créer le document Firestore
      const userData: Omit<User, 'id'> = {
        email: data.email,
        displayName: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        photoURL: data.photoURL,
        phoneNumber: data.phoneNumber,
        establishmentIds: data.establishmentIds,
        currentEstablishmentId: data.establishmentIds[0],
        status: UserStatus.ACTIVE,
        isActive: true,
        emailVerified: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy,
      };

      await setDoc(doc(db, this.COLLECTION, userId), userData);

      // 4. Envoyer email d'invitation si demandé
      if (data.sendInvitation) {
        await this.sendInvitationEmail(data.email);
      }

      return userId;
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`);
    }
  }

  /**
   * Inviter un utilisateur (créer invitation + envoyer email)
   */
  async inviteUser(data: InviteUserData, invitedBy: string): Promise<string> {
    try {
      const invitationId = doc(collection(db, 'invitations')).id;
      
      const invitation: Omit<UserInvitation, 'id'> = {
        email: data.email,
        role: data.role,
        establishmentIds: data.establishmentIds,
        invitedBy,
        token: this.generateInvitationToken(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 jours
        createdAt: Timestamp.now(),
        status: 'pending',
      };

      await setDoc(doc(db, 'invitations', invitationId), invitation);

      // TODO: Envoyer email avec lien d'invitation
      
      return invitationId;
    } catch (error: any) {
      console.error('Error inviting user:', error);
      throw new Error(`Erreur lors de l'invitation: ${error.message}`);
    }
  }

  // ==========================================================================
  // READ
  // ==========================================================================

  /**
   * Récupérer un utilisateur par ID
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, this.COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as User;
    } catch (error: any) {
      console.error('Error getting user:', error);
      throw new Error(`Erreur lors de la récupération de l'utilisateur: ${error.message}`);
    }
  }

  /**
   * Récupérer le profil complet d'un utilisateur
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const user = await this.getUser(userId);
      if (!user) return null;

      // TODO: Enrichir avec les données du profil si stockées séparément
      return user as UserProfile;
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      throw new Error(`Erreur lors de la récupération du profil: ${error.message}`);
    }
  }

  /**
   * Récupérer les utilisateurs d'un établissement
   */
  async getUsersByEstablishment(
    establishmentId: string,
    filters?: UserFilters,
    sortOptions?: UserSortOptions,
    limitCount?: number
  ): Promise<User[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION),
        where('establishmentIds', 'array-contains', establishmentId)
      );

      // Filtres
      if (filters?.role) {
        if (Array.isArray(filters.role)) {
          q = query(q, where('role', 'in', filters.role));
        } else {
          q = query(q, where('role', '==', filters.role));
        }
      }

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          q = query(q, where('status', 'in', filters.status));
        } else {
          q = query(q, where('status', '==', filters.status));
        }
      }

      if (filters?.activeOnly) {
        q = query(q, where('isActive', '==', true));
      }

      if (filters?.department) {
        q = query(q, where('department', '==', filters.department));
      }

      // Tri
      if (sortOptions) {
        q = query(q, orderBy(sortOptions.field, sortOptions.direction));
      } else {
        q = query(q, orderBy('displayName', 'asc'));
      }

      // Limite
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);

      let users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      // Filtres côté client (recherche texte)
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        users = users.filter(
          user =>
            user.displayName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
      }

      return users;
    } catch (error: any) {
      console.error('Error getting users by establishment:', error);
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
    }
  }

  /**
   * Récupérer tous les utilisateurs (Super Admin uniquement)
   */
  async getAllUsers(
    filters?: UserFilters,
    sortOptions?: UserSortOptions,
    limitCount?: number
  ): Promise<User[]> {
    try {
      let q = query(collection(db, this.COLLECTION));

      // Filtres
      if (filters?.role) {
        if (Array.isArray(filters.role)) {
          q = query(q, where('role', 'in', filters.role));
        } else {
          q = query(q, where('role', '==', filters.role));
        }
      }

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          q = query(q, where('status', 'in', filters.status));
        } else {
          q = query(q, where('status', '==', filters.status));
        }
      }

      if (filters?.activeOnly) {
        q = query(q, where('isActive', '==', true));
      }

      // Tri
      if (sortOptions) {
        q = query(q, orderBy(sortOptions.field, sortOptions.direction));
      } else {
        q = query(q, orderBy('createdAt', 'desc'));
      }

      // Limite
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);

      let users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      // Filtres côté client
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        users = users.filter(
          user =>
            user.displayName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
      }

      return users;
    } catch (error: any) {
      console.error('Error getting all users:', error);
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
    }
  }

  /**
   * Rechercher des utilisateurs par rôle
   */
  async getUsersByRole(role: UserRole, establishmentId?: string): Promise<User[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION),
        where('role', '==', role),
        where('isActive', '==', true)
      );

      if (establishmentId) {
        q = query(q, where('establishmentIds', 'array-contains', establishmentId));
      }

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
    } catch (error: any) {
      console.error('Error getting users by role:', error);
      throw new Error(`Erreur lors de la récupération des utilisateurs par rôle: ${error.message}`);
    }
  }

  // ==========================================================================
  // UPDATE
  // ==========================================================================

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<void> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      // Si firstName ou lastName changent, mettre à jour displayName
      if (data.firstName || data.lastName) {
        const user = await this.getUser(userId);
        if (user) {
          updateData.displayName = `${data.firstName || user.firstName} ${data.lastName || user.lastName}`;
        }
      }

      await updateDoc(doc(db, this.COLLECTION, userId), updateData);
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw new Error(`Erreur lors de la mise à jour de l'utilisateur: ${error.message}`);
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<void> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      if (data.displayName) {
        const [firstName, ...lastNameParts] = data.displayName.split(' ');
        updateData.firstName = firstName;
        updateData.lastName = lastNameParts.join(' ');
      }

      await updateDoc(doc(db, this.COLLECTION, userId), updateData);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(`Erreur lors de la mise à jour du profil: ${error.message}`);
    }
  }

  /**
   * Changer le statut d'un utilisateur
   */
  async changeUserStatus(userId: string, status: UserStatus): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, userId), {
        status,
        isActive: status === UserStatus.ACTIVE,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error('Error changing user status:', error);
      throw new Error(`Erreur lors du changement de statut: ${error.message}`);
    }
  }

  /**
   * Activer/désactiver un utilisateur
   */
  async toggleUserActive(userId: string, isActive: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, userId), {
        isActive,
        status: isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error('Error toggling user active:', error);
      throw new Error(`Erreur lors de l'activation/désactivation: ${error.message}`);
    }
  }

  /**
   * Mettre à jour la date de dernière connexion
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, userId), {
        lastLoginAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error('Error updating last login:', error);
      // Ne pas throw d'erreur, c'est une opération non-critique
    }
  }

  // ==========================================================================
  // DELETE
  // ==========================================================================

  /**
   * Supprimer un utilisateur (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.changeUserStatus(userId, UserStatus.INACTIVE);
      // Optionnel: Anonymiser les données
      await updateDoc(doc(db, this.COLLECTION, userId), {
        email: `deleted_${userId}@deleted.com`,
        displayName: 'Utilisateur supprimé',
        firstName: 'Supprimé',
        lastName: 'Supprimé',
        phoneNumber: null,
        photoURL: null,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      throw new Error(`Erreur lors de la suppression de l'utilisateur: ${error.message}`);
    }
  }

  /**
   * Supprimer définitivement un utilisateur (hard delete)
   * ⚠️ Utiliser avec précaution - impossible à annuler
   */
  async permanentlyDeleteUser(userId: string): Promise<void> {
    try {
      // 1. Supprimer le document Firestore
      await deleteDoc(doc(db, this.COLLECTION, userId));

      // 2. TODO: Supprimer l'utilisateur Firebase Auth
      // Note: Nécessite des privilèges admin ou Firebase Functions
      
    } catch (error: any) {
      console.error('Error permanently deleting user:', error);
      throw new Error(`Erreur lors de la suppression définitive: ${error.message}`);
    }
  }

  // ==========================================================================
  // REAL-TIME
  // ==========================================================================

  /**
   * S'abonner aux changements d'un utilisateur
   */
  subscribeToUser(
    userId: string,
    onData: (user: User | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const docRef = doc(db, this.COLLECTION, userId);

    return onSnapshot(
      docRef,
      snapshot => {
        if (snapshot.exists()) {
          onData({
            id: snapshot.id,
            ...snapshot.data(),
          } as User);
        } else {
          onData(null);
        }
      },
      error => {
        console.error('Error in user subscription:', error);
        onError?.(error as Error);
      }
    );
  }

  /**
   * S'abonner aux utilisateurs d'un établissement
   */
  subscribeToEstablishmentUsers(
    establishmentId: string,
    onData: (users: User[]) => void,
    onError?: (error: Error) => void,
    filters?: UserFilters
  ): Unsubscribe {
    let q = query(
      collection(db, this.COLLECTION),
      where('establishmentIds', 'array-contains', establishmentId),
      orderBy('displayName', 'asc')
    );

    if (filters?.activeOnly) {
      q = query(q, where('isActive', '==', true));
    }

    return onSnapshot(
      q,
      snapshot => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];

        onData(users);
      },
      error => {
        console.error('Error in users subscription:', error);
        onError?.(error as Error);
      }
    );
  }

  // ==========================================================================
  // STATS & ANALYTICS
  // ==========================================================================

  /**
   * Récupérer les statistiques utilisateurs d'un établissement
   */
  async getUserStats(establishmentId: string): Promise<UserStats> {
    try {
      const users = await this.getUsersByEstablishment(establishmentId);

      const stats: UserStats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        inactiveUsers: users.filter(u => !u.isActive).length,
        byRole: {} as Record<UserRole, number>,
        byStatus: {} as Record<UserStatus, number>,
        newUsersLast30Days: 0,
        recentLogins: 0,
        byEstablishment: {},
      };

      // Compter par rôle
      users.forEach(user => {
        stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
        stats.byStatus[user.status] = (stats.byStatus[user.status] || 0) + 1;
      });

      // Nouveaux utilisateurs (30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      stats.newUsersLast30Days = users.filter(u => {
        const createdAt = u.createdAt instanceof Timestamp ? u.createdAt.toDate() : new Date(u.createdAt);
        return createdAt >= thirtyDaysAgo;
      }).length;

      // Connexions récentes (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      stats.recentLogins = users.filter(u => {
        if (!u.lastLoginAt) return false;
        const lastLogin = u.lastLoginAt instanceof Timestamp ? u.lastLoginAt.toDate() : new Date(u.lastLoginAt);
        return lastLogin >= sevenDaysAgo;
      }).length;

      return stats;
    } catch (error: any) {
      console.error('Error getting user stats:', error);
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Générer un token d'invitation aléatoire
   */
  private generateInvitationToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Envoyer un email d'invitation
   */
  private async sendInvitationEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Error sending invitation email:', error);
      // Ne pas throw, c'est une erreur non-critique
    }
  }

  /**
   * Vérifier si un email existe déjà
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('email', '==', email),
        limit(1)
      );

      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error: any) {
      console.error('Error checking email:', error);
      return false;
    }
  }

  /**
   * Rechercher des utilisateurs (autocomplete)
   */
  async searchUsers(
    searchTerm: string,
    establishmentId?: string,
    limitCount: number = 10
  ): Promise<User[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION),
        where('isActive', '==', true),
        orderBy('displayName', 'asc'),
        limit(limitCount)
      );

      if (establishmentId) {
        q = query(q, where('establishmentIds', 'array-contains', establishmentId));
      }

      const snapshot = await getDocs(q);

      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      // Filtrer côté client
      const searchLower = searchTerm.toLowerCase();
      return users.filter(
        user =>
          user.displayName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    } catch (error: any) {
      console.error('Error searching users:', error);
      throw new Error(`Erreur lors de la recherche: ${error.message}`);
    }
  }
}

// Singleton
const userService = new UserService();
export default userService;
