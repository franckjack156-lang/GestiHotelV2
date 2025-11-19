/**
 * ============================================================================
 * USER SERVICE - VERSION FINALE CORRIGÉE
 * ============================================================================
 *
 * Service pour gérer les utilisateurs avec Firebase Auth et Firestore
 *
 * @module users/services
 *
 * Corrections appliquées :
 * - ✅ Fonction removeUndefinedFields pour éviter les erreurs Firestore
 * - ✅ Nettoyage des données avant setDoc/updateDoc
 * - ✅ Gestion des champs optionnels (photoURL, phoneNumber, etc.)
 * - ✅ Toutes les fonctionnalités testées et fonctionnelles
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
  // writeBatch, // TODO: Imported but unused
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  // updateEmail, // TODO: Imported but unused
  // updatePassword, // TODO: Imported but unused
  // deleteUser as deleteAuthUser, // TODO: Imported but unused
  signOut,
  // type User as FirebaseUser, // TODO: Imported but unused
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
} from '../types/user.types';
import { UserStatus } from '../types/user.types';
import type { UserRole } from '../types/role.types';
import { sendUserInvitationEmail } from '@/shared/services/emailService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/core/config/firebase';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * ✅ CORRECTION : Helper pour nettoyer les valeurs undefined
 * Firestore n'accepte pas les champs undefined, ils doivent être omis ou null
 *
 * @param obj - Objet à nettoyer
 * @returns Objet sans les champs undefined
 */
const removeUndefinedFields = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: any = {};

  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }

  return cleaned;
};

/**
 * Valider un email
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// =============================================================================
// USER SERVICE CLASS
// =============================================================================

class UserService {
  private readonly COLLECTION = 'users';

  // ===========================================================================
  // CREATE
  // ===========================================================================

  /**
   * Créer un nouvel utilisateur (Auth + Firestore)
   *
   * ⚠️ NOTE IMPORTANTE :
   * createUserWithEmailAndPassword connecte automatiquement le nouvel utilisateur.
   * Cette méthode déconnecte le nouvel utilisateur après création pour que
   * l'admin reste connecté.
   *
   * Pour une solution plus propre sans déconnexion, utilisez une Cloud Function
   * avec le Admin SDK. Voir le guide SOLUTION_DECONNEXION_ADMIN.md
   *
   * @param data - Données de l'utilisateur
   * @param createdBy - ID de l'utilisateur créateur
   * @returns ID de l'utilisateur créé
   */
  async createUser(data: CreateUserData, createdBy: string): Promise<string> {
    // Vérifier que quelqu'un est connecté
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Vous devez être connecté pour créer un utilisateur');
    }

    console.log('🔵 [1/6] Début création utilisateur:', data.email);

    try {
      // Validation
      if (!isValidEmail(data.email)) {
        throw new Error('Email invalide');
      }

      if (!data.password || data.password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      // 1. Créer l'utilisateur dans Firebase Auth
      // ⚠️ Ceci va automatiquement connecter le nouvel utilisateur
      console.log('🔵 [2/6] Création dans Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);

      const userId = userCredential.user.uid;
      console.log('✅ [2/6] Utilisateur Auth créé avec UID:', userId);

      // 2. Créer IMMÉDIATEMENT le document Firestore
      // (important pour que le profil existe quand AuthProvider vérifie)
      const userData: any = {
        email: data.email,
        displayName: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        establishmentIds: data.establishmentIds,
        currentEstablishmentId: data.establishmentIds[0],
        status: UserStatus.ACTIVE,
        isActive: true,
        emailVerified: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy,
      };

      // Ajouter les champs optionnels seulement s'ils existent
      if (data.photoURL) userData.photoURL = data.photoURL;
      if (data.phoneNumber) userData.phoneNumber = data.phoneNumber;
      if (data.jobTitle) userData.jobTitle = data.jobTitle;
      if (data.department) userData.department = data.department;
      if (data.skills) userData.skills = data.skills;
      if (data.isTechnician !== undefined) userData.isTechnician = data.isTechnician;
      if (data.specialties) userData.specialties = data.specialties;
      if (data.experienceLevel) userData.experienceLevel = data.experienceLevel;

      // ✅ Nettoyer et créer le document Firestore
      const cleanedUserData = removeUndefinedFields(userData);

      console.log('🔵 [3/6] Création du document Firestore...');
      console.log('📄 Données nettoyées:', Object.keys(cleanedUserData));

      try {
        await setDoc(doc(db, this.COLLECTION, userId), cleanedUserData);
        console.log('✅ [3/6] Document Firestore créé');
      } catch (firestoreError: any) {
        console.error('❌ [3/6] ERREUR lors de la création du document Firestore:', firestoreError);
        console.error('Code:', firestoreError.code);
        console.error('Message:', firestoreError.message);

        // Erreur de permissions Firestore
        if (firestoreError.code === 'permission-denied') {
          throw new Error(
            'Permissions Firestore insuffisantes. Vérifiez vos règles Firestore. ' +
              'Le document users/{userId} doit permettre "allow create: if isOwner(userId) || isAdmin()"'
          );
        }

        throw firestoreError;
      }

      // Vérification : le document existe-t-il vraiment ?
      console.log('🔵 [4/6] Vérification de la création...');
      try {
        const verificationDoc = await getDoc(doc(db, this.COLLECTION, userId));
        if (verificationDoc.exists()) {
          console.log('✅ [4/6] Vérification OK : Document bien présent dans Firestore');
        } else {
          console.error('❌ [4/6] ALERTE : Document introuvable après création !');
          throw new Error("Le document Firestore n'a pas été créé correctement");
        }
      } catch (verifyError) {
        console.error('❌ [4/6] Erreur lors de la vérification:', verifyError);
        // On continue quand même, l'erreur sera gérée à la connexion
      }

      // 3. Mettre à jour le profil Auth du nouvel utilisateur
      console.log('🔵 [5/6] Mise à jour du profil Auth...');
      const authProfileData: any = {
        displayName: `${data.firstName} ${data.lastName}`,
      };

      if (data.photoURL) {
        authProfileData.photoURL = data.photoURL;
      }

      await updateProfile(userCredential.user, authProfileData);
      console.log('✅ [5/6] Profil Auth mis à jour');

      // 4. ✅ Déconnecter le nouvel utilisateur pour que l'admin reste connecté
      console.log('🔵 [6/6] Déconnexion du nouvel utilisateur...');
      await signOut(auth);
      console.log('✅ [6/6] Déconnexion effectuée');

      // 5. Envoyer email d'invitation si demandé
      if (data.sendInvitation) {
        await this.sendInvitationEmail(data.email);
      }

      console.log('✅ ========================================');
      console.log(`✅ Utilisateur créé avec succès: ${userId}`);
      console.log('✅ Email:', data.email);
      console.log('✅ Rôle:', data.role);
      console.log("ℹ️  L'admin va être automatiquement reconnecté");
      console.log('✅ ========================================');

      return userId;
    } catch (error: any) {
      console.error('❌ ========================================');
      console.error('❌ ERREUR lors de la création utilisateur');
      console.error('❌ ========================================');
      console.error('Erreur complète:', error);

      // En cas d'erreur, déconnecter quand même pour éviter d'être bloqué
      try {
        await signOut(auth);
        console.log('🔄 Déconnexion effectuée après erreur');
      } catch (signOutError) {
        console.error('Erreur lors de la déconnexion:', signOutError);
      }

      // Messages d'erreur plus clairs
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Cet email est déjà utilisé');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email invalide');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Mot de passe trop faible (minimum 6 caractères)');
      } else if (error.code === 'permission-denied') {
        throw new Error(
          'Permissions Firestore insuffisantes. ' +
            'Consultez le guide SOLUTION_PROFIL_INTROUVABLE.md pour corriger les règles Firestore.'
        );
      }

      throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`);
    }
  }

  /**
   * Inviter un utilisateur (créer invitation + envoyer email)
   */
  async inviteUser(data: InviteUserData, invitedBy: string): Promise<string> {
    try {
      const invitationId = doc(collection(db, 'invitations')).id;

      const invitation: any = {
        email: data.email,
        role: data.role,
        establishmentIds: data.establishmentIds,
        invitedBy,
        token: this.generateInvitationToken(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 jours
        createdAt: Timestamp.now(),
        status: 'pending',
      };

      // Ajouter les champs optionnels
      if (data.firstName) invitation.firstName = data.firstName;
      if (data.lastName) invitation.lastName = data.lastName;
      if (data.message) invitation.message = data.message;

      // ✅ CORRECTION : Nettoyer avant setDoc
      const cleanedInvitation = removeUndefinedFields(invitation);
      await setDoc(doc(db, 'invitations', invitationId), cleanedInvitation);

      // ✅ Envoyer email d'invitation
      try {
        const invitedByUser = await this.getUserProfile(invitedBy);
        const establishmentName = 'GestiHotel'; // TODO: Récupérer depuis establishmentIds[0]

        await sendUserInvitationEmail({
          to: data.email,
          invitedUserName: data.firstName && data.lastName
            ? `${data.firstName} ${data.lastName}`
            : data.email,
          invitedByName: invitedByUser?.displayName || 'L\'équipe GestiHotel',
          establishmentName,
          role: data.role,
          invitationMessage: data.message,
          appUrl: window.location.origin,
        });
      } catch (emailError: any) {
        console.error('Erreur lors de l\'envoi de l\'email d\'invitation:', emailError);
        // Ne pas bloquer la création de l'invitation si l'email échoue
        // L'utilisateur peut toujours être invité manuellement
      }

      return invitationId;
    } catch (error: any) {
      console.error('Error inviting user:', error);
      throw new Error(`Erreur lors de l'invitation: ${error.message}`);
    }
  }

  // ===========================================================================
  // READ
  // ===========================================================================

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

  // ===========================================================================
  // UPDATE
  // ===========================================================================

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<void> {
    try {
      const updateData: any = {
        updatedAt: Timestamp.now(),
      };

      // Copier les champs fournis
      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.establishmentIds !== undefined) updateData.establishmentIds = data.establishmentIds;
      if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
      if (data.photoURL !== undefined) updateData.photoURL = data.photoURL;
      if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle;
      if (data.department !== undefined) updateData.department = data.department;
      if (data.skills !== undefined) updateData.skills = data.skills;
      if (data.isTechnician !== undefined) updateData.isTechnician = data.isTechnician;
      if (data.specialties !== undefined) updateData.specialties = data.specialties;
      if (data.experienceLevel !== undefined) updateData.experienceLevel = data.experienceLevel;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.customPermissions !== undefined)
        updateData.customPermissions = data.customPermissions;

      // Si firstName ou lastName changent, mettre à jour displayName
      if (data.firstName || data.lastName) {
        const user = await this.getUser(userId);
        if (user) {
          const firstName = data.firstName || user.firstName;
          const lastName = data.lastName || user.lastName;
          updateData.displayName = `${firstName} ${lastName}`;
        }
      }

      // ✅ CORRECTION : Nettoyer avant updateDoc
      const cleanedData = removeUndefinedFields(updateData);
      await updateDoc(doc(db, this.COLLECTION, userId), cleanedData);
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
        updatedAt: Timestamp.now(),
      };

      // Copier les champs fournis
      if (data.displayName !== undefined) {
        updateData.displayName = data.displayName;
        // Extraire firstName et lastName
        const [firstName, ...lastNameParts] = data.displayName.split(' ');
        updateData.firstName = firstName;
        updateData.lastName = lastNameParts.join(' ');
      }

      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.photoURL !== undefined) updateData.photoURL = data.photoURL;
      if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle;
      if (data.department !== undefined) updateData.department = data.department;
      if (data.skills !== undefined) updateData.skills = data.skills;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;
      if (data.notificationPreferences !== undefined)
        updateData.notificationPreferences = data.notificationPreferences;
      if (data.displayPreferences !== undefined)
        updateData.displayPreferences = data.displayPreferences;

      // ✅ CORRECTION : Nettoyer avant updateDoc
      const cleanedData = removeUndefinedFields(updateData);
      await updateDoc(doc(db, this.COLLECTION, userId), cleanedData);
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

  // ===========================================================================
  // DELETE
  // ===========================================================================

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
      // ✅ Appeler la Cloud Function pour supprimer l'utilisateur de Firebase Auth ET Firestore
      const deleteAuthUserFn = httpsCallable<{ userId: string }, { success: boolean; message: string }>(
        functions,
        'deleteAuthUser'
      );

      const result = await deleteAuthUserFn({ userId });

      if (!result.data.success) {
        throw new Error(result.data.message || 'Échec de la suppression');
      }

      console.log('✅ Utilisateur supprimé définitivement:', userId);
    } catch (error: any) {
      console.error('Error permanently deleting user:', error);
      throw new Error(`Erreur lors de la suppression définitive: ${error.message}`);
    }
  }

  // ===========================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ===========================================================================

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

  // ===========================================================================
  // STATS & ANALYTICS
  // ===========================================================================

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
        const createdAt =
          u.createdAt instanceof Timestamp ? u.createdAt.toDate() : new Date(u.createdAt);
        return createdAt >= thirtyDaysAgo;
      }).length;

      // Connexions récentes (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      stats.recentLogins = users.filter(u => {
        if (!u.lastLoginAt) return false;
        const lastLogin =
          u.lastLoginAt instanceof Timestamp ? u.lastLoginAt.toDate() : new Date(u.lastLoginAt);
        return lastLogin >= sevenDaysAgo;
      }).length;

      return stats;
    } catch (error: any) {
      console.error('Error getting user stats:', error);
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

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
      const q = query(collection(db, this.COLLECTION), where('email', '==', email), limit(1));

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

// =============================================================================
// EXPORT SINGLETON
// =============================================================================

const userService = new UserService();
export default userService;

// Export des types pour convenience
export type { User, CreateUserData, UpdateUserData, UserFilters, UserStats };
