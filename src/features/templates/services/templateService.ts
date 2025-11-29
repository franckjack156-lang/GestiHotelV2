/**
 * ============================================================================
 * TEMPLATE SERVICE
 * ============================================================================
 *
 * Service pour gérer les modèles d'interventions dans Firestore
 * Collection: /establishments/{establishmentId}/interventionTemplates
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
  serverTimestamp,
  increment,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type {
  InterventionTemplate,
  CreateTemplateData,
  UpdateTemplateData,
} from '../types/template.types';

/**
 * Nettoyer un objet en supprimant les valeurs undefined
 */
const removeUndefinedFields = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      // Si c'est un objet imbriqué, le nettoyer récursivement
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const cleanedNested = removeUndefinedFields(value);
        // Ne garder l'objet que s'il a des propriétés
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });
  return cleaned;
};

/**
 * Récupérer tous les templates d'un établissement
 */
export const getTemplates = async (
  establishmentId: string,
  filters?: {
    category?: string;
    isActive?: boolean;
  }
): Promise<InterventionTemplate[]> => {
  const constraints: QueryConstraint[] = [];

  // Les WHERE doivent venir AVANT les ORDER BY
  // Filtrer par état actif/inactif
  if (filters?.isActive !== undefined) {
    constraints.push(where('isActive', '==', filters.isActive));
  }

  // Filtrer par catégorie
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }

  // Tri par usage décroissant puis par nom
  constraints.push(orderBy('usageCount', 'desc'));
  constraints.push(orderBy('name', 'asc'));

  const q = query(
    collection(db, 'establishments', establishmentId, 'interventionTemplates'),
    ...constraints
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as InterventionTemplate[];
};

/**
 * Récupérer un template par son ID
 */
export const getTemplateById = async (
  establishmentId: string,
  templateId: string
): Promise<InterventionTemplate | null> => {
  const docRef = doc(db, 'establishments', establishmentId, 'interventionTemplates', templateId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as InterventionTemplate;
};

/**
 * Créer un nouveau template
 */
export const createTemplate = async (
  establishmentId: string,
  userId: string,
  data: CreateTemplateData
): Promise<string> => {
  const templateData = {
    ...data,
    establishmentId,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    usageCount: 0,
    isActive: true,
  };

  // Nettoyer les champs undefined avant d'envoyer à Firestore
  const cleanedData = removeUndefinedFields(templateData);

  const docRef = await addDoc(
    collection(db, 'establishments', establishmentId, 'interventionTemplates'),
    cleanedData
  );

  return docRef.id;
};

/**
 * Mettre à jour un template
 */
export const updateTemplate = async (
  establishmentId: string,
  templateId: string,
  data: UpdateTemplateData
): Promise<void> => {
  const docRef = doc(db, 'establishments', establishmentId, 'interventionTemplates', templateId);

  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  // Nettoyer les champs undefined avant d'envoyer à Firestore
  const cleanedData = removeUndefinedFields(updateData);

  await updateDoc(docRef, cleanedData);
};

/**
 * Supprimer un template
 */
export const deleteTemplate = async (
  establishmentId: string,
  templateId: string
): Promise<void> => {
  const docRef = doc(db, 'establishments', establishmentId, 'interventionTemplates', templateId);
  await deleteDoc(docRef);
};

/**
 * Incrémenter le compteur d'utilisation d'un template
 */
export const incrementTemplateUsage = async (
  establishmentId: string,
  templateId: string
): Promise<void> => {
  const docRef = doc(db, 'establishments', establishmentId, 'interventionTemplates', templateId);

  await updateDoc(docRef, {
    usageCount: increment(1),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Dupliquer un template
 */
export const duplicateTemplate = async (
  establishmentId: string,
  templateId: string,
  userId: string
): Promise<string> => {
  // Récupérer le template original
  const original = await getTemplateById(establishmentId, templateId);

  if (!original) {
    throw new Error('Template introuvable');
  }

  // Créer une copie
  const duplicateData: CreateTemplateData = {
    name: `${original.name} (copie)`,
    description: original.description,
    category: original.category,
    templateData: { ...original.templateData },
  };

  return createTemplate(establishmentId, userId, duplicateData);
};

/**
 * Désactiver/Activer un template
 */
export const toggleTemplateActive = async (
  establishmentId: string,
  templateId: string,
  isActive: boolean
): Promise<void> => {
  await updateTemplate(establishmentId, templateId, { isActive });
};
