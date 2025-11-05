/**
 * User Service
 *
 * Service pour gérer les utilisateurs dans Firestore
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type {
  User,
  CreateUserData,
  UpdateUserData,
  UserFilters,
  UserSummary,
} from '@/shared/types';

const USERS_COLLECTION = 'users';

/**
 * Obtenir un utilisateur par son ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));

    if (!userDoc.exists()) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
    } as User;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    throw new Error("Impossible de récupérer l'utilisateur");
  }
};

/**
 * Créer un nouvel utilisateur
 */
export const createUser = async (userId: string, data: CreateUserData): Promise<User> => {
  try {
    const now = Timestamp.now();

    const userData: Omit<User, 'id'> = {
      email: data.email,
      displayName: data.displayName,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      establishmentIds: data.establishmentIds,
      phone: data.phone,
      mobile: data.mobile,
      photoURL: data.photoURL,
      position: data.position,
      department: data.department,
      isActive: true,
      isEmailVerified: false,
      preferences: {
        theme: 'system',
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
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, USERS_COLLECTION, userId), userData);

    return {
      id: userId,
      ...userData,
    };
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw new Error("Impossible de créer l'utilisateur");
  }
};

/**
 * Mettre à jour un utilisateur
 */
export const updateUser = async (userId: string, data: UpdateUserData): Promise<void> => {
  try {
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, USERS_COLLECTION, userId), updateData);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    throw new Error("Impossible de mettre à jour l'utilisateur");
  }
};

/**
 * Supprimer un utilisateur
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    throw new Error("Impossible de supprimer l'utilisateur");
  }
};

/**
 * Obtenir tous les utilisateurs avec filtres
 */
export const getUsers = async (filters?: UserFilters): Promise<User[]> => {
  try {
    let q = query(collection(db, USERS_COLLECTION));

    // Appliquer les filtres
    if (filters?.role) {
      q = query(q, where('role', '==', filters.role));
    }

    if (filters?.establishmentId) {
      q = query(q, where('establishmentIds', 'array-contains', filters.establishmentId));
    }

    if (filters?.isActive !== undefined) {
      q = query(q, where('isActive', '==', filters.isActive));
    }

    // Tri par nom
    q = query(q, orderBy('displayName', 'asc'));

    const snapshot = await getDocs(q);

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];

    // Filtre de recherche (côté client)
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      return users.filter(
        user =>
          user.displayName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    return users;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw new Error('Impossible de récupérer les utilisateurs');
  }
};

/**
 * Obtenir les utilisateurs d'un établissement
 */
export const getUsersByEstablishment = async (establishmentId: string): Promise<User[]> => {
  return getUsers({ establishmentId });
};

/**
 * Obtenir un résumé des utilisateurs (pour les listes)
 */
export const getUsersSummary = async (establishmentId?: string): Promise<UserSummary[]> => {
  try {
    let q = query(collection(db, USERS_COLLECTION));

    if (establishmentId) {
      q = query(q, where('establishmentIds', 'array-contains', establishmentId));
    }

    q = query(q, where('isActive', '==', true), orderBy('displayName', 'asc'));

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        displayName: data.displayName,
        email: data.email,
        photoURL: data.photoURL,
        role: data.role,
        isActive: data.isActive,
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des résumés utilisateurs:', error);
    throw new Error('Impossible de récupérer les résumés utilisateurs');
  }
};

/**
 * Rechercher des utilisateurs par email
 */
export const searchUsersByEmail = async (email: string): Promise<User[]> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('email', '>=', email),
      where('email', '<=', email + '\uf8ff'),
      limit(10)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  } catch (error) {
    console.error("Erreur lors de la recherche d'utilisateurs:", error);
    throw new Error('Impossible de rechercher les utilisateurs');
  }
};

/**
 * Activer/Désactiver un utilisateur
 */
export const toggleUserStatus = async (userId: string, isActive: boolean): Promise<void> => {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    throw new Error('Impossible de modifier le statut');
  }
};

/**
 * Mettre à jour le dernier login
 */
export const updateLastLogin = async (userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      lastLoginAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du dernier login:', error);
    // Ne pas throw ici car ce n'est pas critique
  }
};

export default {
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsers,
  getUsersByEstablishment,
  getUsersSummary,
  searchUsersByEmail,
  toggleUserStatus,
  updateLastLogin,
};
