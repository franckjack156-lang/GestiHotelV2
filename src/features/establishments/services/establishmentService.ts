/**
 * Establishment Service
 *
 * Service pour gérer les opérations CRUD des établissements dans Firestore
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type {
  Establishment,
  CreateEstablishmentData,
  UpdateEstablishmentData,
  EstablishmentFilters,
  EstablishmentSummary,
} from '@/shared/types/establishment.types';

import {
  DEFAULT_ESTABLISHMENT_FEATURES,
  DEFAULT_ESTABLISHMENT_SETTINGS,
} from '@/shared/types/establishment.types';

const ESTABLISHMENTS_COLLECTION = 'establishments';

/**
 * Obtenir un établissement par son ID
 */
export const getEstablishment = async (establishmentId: string): Promise<Establishment | null> => {
  try {
    const establishmentDoc = await getDoc(doc(db, ESTABLISHMENTS_COLLECTION, establishmentId));

    if (!establishmentDoc.exists()) {
      return null;
    }

    return {
      id: establishmentDoc.id,
      ...establishmentDoc.data(),
    } as Establishment;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'établissement:", error);
    throw new Error("Impossible de récupérer l'établissement");
  }
};

/**
 * Obtenir tous les établissements
 */
export const getEstablishments = async (
  filters?: EstablishmentFilters,
  limitCount?: number
): Promise<Establishment[]> => {
  try {
    const establishmentsRef = collection(db, ESTABLISHMENTS_COLLECTION);
    const constraints = [];

    // Filtres
    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }

    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }

    if (filters?.isActive !== undefined) {
      constraints.push(where('isActive', '==', filters.isActive));
    }

    if (filters?.city) {
      constraints.push(where('address.city', '==', filters.city));
    }

    // Tri par nom
    constraints.push(orderBy('name', 'asc'));

    // Limite
    if (limitCount) {
      constraints.push(firestoreLimit(limitCount));
    }

    const q = query(establishmentsRef, ...constraints);
    const snapshot = await getDocs(q);

    const establishments: Establishment[] = [];
    snapshot.forEach(doc => {
      establishments.push({
        id: doc.id,
        ...doc.data(),
      } as Establishment);
    });

    // Filtre textuel côté client (si nécessaire)
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      return establishments.filter(
        est =>
          est.name.toLowerCase().includes(searchLower) ||
          est.displayName?.toLowerCase().includes(searchLower) ||
          est.address.city?.toLowerCase().includes(searchLower)
      );
    }

    return establishments;
  } catch (error) {
    console.error('Erreur lors de la récupération des établissements:', error);
    throw new Error('Impossible de récupérer les établissements');
  }
};

/**
 * Obtenir les établissements d'un utilisateur
 */
export const getUserEstablishments = async (
  userId: string,
  establishmentIds: string[]
): Promise<Establishment[]> => {
  try {
    if (establishmentIds.length === 0) {
      return [];
    }

    const establishmentsRef = collection(db, ESTABLISHMENTS_COLLECTION);

    // Firestore limite les requêtes "in" à 10 éléments
    // On doit donc faire plusieurs requêtes si nécessaire
    const chunks = [];
    for (let i = 0; i < establishmentIds.length; i += 10) {
      chunks.push(establishmentIds.slice(i, i + 10));
    }

    const establishments: Establishment[] = [];

    for (const chunk of chunks) {
      const q = query(
        establishmentsRef,
        where('__name__', 'in', chunk),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);
      snapshot.forEach(doc => {
        establishments.push({
          id: doc.id,
          ...doc.data(),
        } as Establishment);
      });
    }

    return establishments;
  } catch (error) {
    console.error("Erreur lors de la récupération des établissements de l'utilisateur:", error);
    throw new Error("Impossible de récupérer les établissements de l'utilisateur");
  }
};

/**
 * Créer un nouvel établissement
 */
export const createEstablishment = async (
  data: CreateEstablishmentData,
  ownerId: string
): Promise<string> => {
  try {
    const now = Timestamp.now();

    const establishmentData: Omit<Establishment, 'id'> = {
      // Informations de base
      name: data.name,
      displayName: data.name,
      type: data.type,
      category: data.category,
      description: data.description,

      // Adresse et contact
      address: data.address,
      contact: data.contact,
      website: data.website,

      // Capacité
      totalRooms: data.totalRooms,
      totalFloors: data.totalFloors,

      // Statut
      isActive: true,

      // Configuration features (par défaut)
      features: DEFAULT_ESTABLISHMENT_FEATURES,

      // Paramètres
      settings: {
        ...DEFAULT_ESTABLISHMENT_SETTINGS,
        timezone: data.timezone || 'Europe/Paris',
      },

      // Métadonnées
      ownerId,
      managerIds: [ownerId],

      // Timestamps
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, ESTABLISHMENTS_COLLECTION), establishmentData);

    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de la création de l'établissement:", error);
    throw new Error("Impossible de créer l'établissement");
  }
};

/**
 * Mettre à jour un établissement
 */
export const updateEstablishment = async (
  establishmentId: string,
  data: UpdateEstablishmentData
): Promise<void> => {
  try {
    const updateData: any = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, ESTABLISHMENTS_COLLECTION, establishmentId), updateData);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'établissement:", error);
    throw new Error("Impossible de mettre à jour l'établissement");
  }
};

/**
 * Supprimer un établissement (soft delete)
 */
export const deleteEstablishment = async (establishmentId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, ESTABLISHMENTS_COLLECTION, establishmentId), {
      isActive: false,
      deletedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'établissement:", error);
    throw new Error("Impossible de supprimer l'établissement");
  }
};

/**
 * Réactiver un établissement
 */
export const reactivateEstablishment = async (establishmentId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, ESTABLISHMENTS_COLLECTION, establishmentId), {
      isActive: true,
      deletedAt: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erreur lors de la réactivation de l'établissement:", error);
    throw new Error("Impossible de réactiver l'établissement");
  }
};

/**
 * Obtenir un résumé des établissements (pour listes)
 */
export const getEstablishmentsSummary = async (
  establishmentIds?: string[]
): Promise<EstablishmentSummary[]> => {
  try {
    const establishments = establishmentIds
      ? await getUserEstablishments('', establishmentIds)
      : await getEstablishments();

    return establishments.map(est => ({
      id: est.id,
      name: est.name,
      type: est.type,
      category: est.category,
      logoUrl: est.logoUrl,
      isActive: est.isActive,
      totalRooms: est.totalRooms,
      city: est.address.city || '',
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé des établissements:', error);
    throw new Error('Impossible de récupérer le résumé des établissements');
  }
};

/**
 * Mettre à jour les statistiques d'un établissement
 */
export const updateEstablishmentStats = async (
  establishmentId: string,
  stats: Partial<Establishment['stats']>
): Promise<void> => {
  try {
    await updateDoc(doc(db, ESTABLISHMENTS_COLLECTION, establishmentId), {
      stats: {
        ...stats,
        lastUpdated: new Date(),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error);
    throw new Error('Impossible de mettre à jour les statistiques');
  }
};

/**
 * Ajouter un manager à un établissement
 */
export const addManagerToEstablishment = async (
  establishmentId: string,
  managerId: string
): Promise<void> => {
  try {
    const establishment = await getEstablishment(establishmentId);
    if (!establishment) {
      throw new Error('Établissement introuvable');
    }

    const managerIds = establishment.managerIds || [];
    if (!managerIds.includes(managerId)) {
      managerIds.push(managerId);

      await updateDoc(doc(db, ESTABLISHMENTS_COLLECTION, establishmentId), {
        managerIds,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout du manager:", error);
    throw new Error("Impossible d'ajouter le manager");
  }
};

/**
 * Retirer un manager d'un établissement
 */
export const removeManagerFromEstablishment = async (
  establishmentId: string,
  managerId: string
): Promise<void> => {
  try {
    const establishment = await getEstablishment(establishmentId);
    if (!establishment) {
      throw new Error('Établissement introuvable');
    }

    const managerIds = (establishment.managerIds || []).filter(id => id !== managerId);

    await updateDoc(doc(db, ESTABLISHMENTS_COLLECTION, establishmentId), {
      managerIds,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors du retrait du manager:', error);
    throw new Error('Impossible de retirer le manager');
  }
};

export default {
  getEstablishment,
  getEstablishments,
  getUserEstablishments,
  createEstablishment,
  updateEstablishment,
  deleteEstablishment,
  reactivateEstablishment,
  getEstablishmentsSummary,
  updateEstablishmentStats,
  addManagerToEstablishment,
  removeManagerFromEstablishment,
};
