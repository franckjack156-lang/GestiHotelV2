/**
 * Establishment Initialization Service
 *
 * Service pour initialiser un nouvel établissement avec toutes les données par défaut
 * - Features activées selon le type d'établissement
 * - Listes de référence par défaut
 * - Configuration initiale
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import {
  DEFAULT_REFERENCE_LISTS,
  getListsByFeatures,
} from '@/shared/services/defaultReferenceLists';
import type { EstablishmentReferenceLists } from '@/shared/types/reference-lists.types';
import type { EstablishmentFeatures } from '@/shared/types/establishment.types';

/**
 * Initialiser les listes de référence pour un établissement
 *
 * @param establishmentId - ID de l'établissement
 * @param userId - ID de l'utilisateur créateur
 * @param features - Features activées (optionnel, sinon utilise les features par défaut)
 */
export const initializeEstablishmentLists = async (
  establishmentId: string,
  userId: string,
  features?: EstablishmentFeatures
): Promise<void> => {
  try {
    // Obtenir les listes selon les features
    const listsToCreate = features
      ? getListsByFeatures({
          rooms: features.rooms?.enabled ?? true,
          exports: features.interventionImportExport?.enabled ?? true,
        })
      : DEFAULT_REFERENCE_LISTS;

    // Créer le document de listes
    const listsData: EstablishmentReferenceLists = {
      establishmentId,
      version: 1,
      lastModified: new Date(),
      modifiedBy: userId,
      lists: listsToCreate,
    };

    const docRef = doc(db, 'establishments', establishmentId, 'config', 'reference-lists');

    await setDoc(docRef, {
      ...listsData,
      lastModified: serverTimestamp(),
    });

    console.log(`✅ Listes de référence initialisées pour l'établissement ${establishmentId}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation des listes:", error);
    throw new Error("Impossible d'initialiser les listes de référence");
  }
};

/**
 * Initialiser complètement un établissement après sa création
 *
 * @param establishmentId - ID de l'établissement
 * @param userId - ID de l'utilisateur créateur
 * @param features - Features activées (optionnel)
 */
export const initializeEstablishment = async (
  establishmentId: string,
  userId: string,
  features?: EstablishmentFeatures
): Promise<void> => {
  try {
    // 1. Initialiser les listes de référence
    await initializeEstablishmentLists(establishmentId, userId, features);

    // 2. TODO: Initialiser d'autres données si nécessaire
    // - Créer des rôles/permissions custom
    // - Créer des templates d'intervention
    // - Créer des catégories par défaut
    // etc.

    console.log(`✅ Établissement ${establishmentId} initialisé avec succès`);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de l'établissement:", error);
    throw error;
  }
};

/**
 * Vérifier si un établissement est initialisé
 *
 * @param establishmentId - ID de l'établissement
 * @returns true si l'établissement est initialisé
 */
export const isEstablishmentInitialized = async (establishmentId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'config', 'reference-lists');
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Erreur lors de la vérification de l'initialisation:", error);
    return false;
  }
};

/**
 * Réinitialiser les listes d'un établissement (DANGER!)
 * À utiliser avec précaution, supprime toutes les listes existantes
 *
 * @param establishmentId - ID de l'établissement
 * @param userId - ID de l'utilisateur
 * @param keepCustomItems - Conserver les items custom ajoutés par l'utilisateur
 */
export const resetEstablishmentLists = async (
  establishmentId: string,
  userId: string,
  keepCustomItems = true
): Promise<void> => {
  try {
    if (keepCustomItems) {
      // TODO: Implémenter la logique pour conserver les items custom
      console.warn('Conservation des items custom non implémentée');
    }

    // Réinitialiser avec les listes par défaut
    await initializeEstablishmentLists(establishmentId, userId);

    console.log(`✅ Listes réinitialisées pour l'établissement ${establishmentId}`);
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation des listes:', error);
    throw error;
  }
};

// Importer getDoc qui manquait
import { getDoc, updateDoc } from 'firebase/firestore';

/**
 * Ajouter les listes manquantes à un établissement existant
 * Utile pour les migrations après ajout de nouvelles listes prédéfinies
 *
 * @param establishmentId - ID de l'établissement
 * @param userId - ID de l'utilisateur
 */
/**
 * Nettoyer les données pour Firestore (convertir Date en Timestamp)
 */
const cleanForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (obj instanceof Date) {
    return obj; // Firestore convertira automatiquement
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item));
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip undefined values
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned;
  }

  return obj;
};

export const addMissingLists = async (establishmentId: string, userId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'config', 'reference-lists');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Si le document n'existe pas, initialiser complètement
      await initializeEstablishmentLists(establishmentId, userId);
      return;
    }

    const currentData = docSnap.data() as EstablishmentReferenceLists;
    const allDefaultLists = DEFAULT_REFERENCE_LISTS;
    const missingLists: Record<string, any> = {};

    // Vérifier quelles listes prédéfinies manquent
    for (const [key, config] of Object.entries(allDefaultLists)) {
      if (!currentData.lists[key]) {
        // Nettoyer la config pour Firestore
        missingLists[key] = cleanForFirestore(config);
        console.log(`➕ Ajout de la liste manquante: ${key}`);
      }
    }

    // Si des listes manquent, les ajouter
    if (Object.keys(missingLists).length > 0) {
      await updateDoc(docRef, {
        lists: {
          ...currentData.lists,
          ...missingLists,
        },
        lastModified: serverTimestamp(),
        modifiedBy: userId,
        version: (currentData.version || 1) + 1,
      });

      console.log(
        `✅ ${Object.keys(missingLists).length} liste(s) ajoutée(s) pour l'établissement ${establishmentId}`
      );
    } else {
      console.log(`✅ Aucune liste manquante pour l'établissement ${establishmentId}`);
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout des listes manquantes:", error);
    throw error;
  }
};
