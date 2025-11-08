/**
 * Intervention Service - FIXED
 *
 * Fix: Nettoyage des valeurs undefined avant envoi à Firestore
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
  limit,
  startAfter,
  onSnapshot,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type {
  Intervention,
  CreateInterventionData,
  UpdateInterventionData,
  InterventionFilters,
  InterventionSortOptions,
  StatusChangeData,
  AssignmentData,
} from '../types/intervention.types';
import type { InterventionStatus } from '@/shared/types/status.types';

/**
 * ✅ HELPER: Nettoyer les valeurs undefined d'un objet
 * Firestore n'accepte pas undefined, seulement null ou omission du champ
 */
const cleanUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: Partial<T> = {};

  Object.keys(obj).forEach(key => {
    const value = obj[key];

    // Ne garder que les valeurs définies (pas undefined)
    // null est OK pour Firestore
    if (value !== undefined) {
      cleaned[key as keyof T] = value;
    }
  });

  return cleaned;
};

/**
 * Obtenir la référence de la collection interventions pour un établissement
 */
const getInterventionsCollection = (establishmentId: string) => {
  return collection(db, 'establishments', establishmentId, 'interventions');
};

/**
 * Générer une référence unique pour l'intervention
 */
const generateReference = async (establishmentId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const collectionRef = getInterventionsCollection(establishmentId);

  // Compter les interventions de l'année en cours
  const q = query(
    collectionRef,
    where('createdAt', '>=', Timestamp.fromDate(new Date(year, 0, 1)))
  );

  const snapshot = await getDocs(q);
  const count = snapshot.size + 1;

  return `INT-${year}-${String(count).padStart(4, '0')}`;
};

/**
 * ✅ FIXED: Créer une nouvelle intervention avec nettoyage des undefined
 */
export const createIntervention = async (
  establishmentId: string,
  userId: string,
  data: CreateInterventionData
): Promise<string> => {
  try {
    const collectionRef = getInterventionsCollection(establishmentId);
    const reference = await generateReference(establishmentId);

    // ✅ Construction de l'objet SANS undefined
    const interventionData: any = {
      // Établissement
      establishmentId,

      // Données de base (OBLIGATOIRES)
      title: data.title,
      description: data.description,
      type: data.type,
      category: data.category,
      priority: data.priority,
      status: 'pending' as InterventionStatus,
      location: data.location,

      // Assignation
      createdBy: userId,

      // Photos
      photos: [],
      photosCount: 0,

      // Métadonnées
      reference,
      tags: data.tags || [],
      isUrgent: data.isUrgent || data.priority === 'urgent' || data.priority === 'critical',
      isBlocking: data.isBlocking || false,
      requiresValidation: false,

      // Statistiques
      viewsCount: 0,

      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),

      // Soft delete
      isDeleted: false,
    };

    // ✅ Ajouter les champs optionnels SEULEMENT s'ils sont définis
    if (data.roomNumber !== undefined && data.roomNumber !== '') {
      interventionData.roomNumber = data.roomNumber;
    }

    if (data.floor !== undefined) {
      interventionData.floor = data.floor;
    }

    if (data.building !== undefined && data.building !== '') {
      interventionData.building = data.building;
    }

    if (data.assignedTo) {
      interventionData.assignedTo = data.assignedTo;
      interventionData.assignedAt = serverTimestamp();
    }

    if (data.scheduledAt) {
      interventionData.scheduledAt = Timestamp.fromDate(data.scheduledAt);
    }

    if (data.estimatedDuration) {
      interventionData.estimatedDuration = data.estimatedDuration;
    }

    if (data.internalNotes) {
      interventionData.internalNotes = data.internalNotes;
    }

    console.log('📝 Création intervention:', interventionData);

    const docRef = await addDoc(collectionRef, interventionData);
    console.log('✅ Intervention créée:', docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'intervention:", error);
    throw new Error("Impossible de créer l'intervention");
  }
};

/**
 * Obtenir une intervention par ID
 */
export const getIntervention = async (
  establishmentId: string,
  interventionId: string
): Promise<Intervention | null> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Intervention;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'intervention:", error);
    throw new Error("Impossible de récupérer l'intervention");
  }
};

/**
 * ✅ FIXED: Mettre à jour une intervention avec nettoyage des undefined
 */
export const updateIntervention = async (
  establishmentId: string,
  interventionId: string,
  data: UpdateInterventionData
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);

    // ✅ Construction de l'objet SANS undefined
    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    // Ajouter uniquement les champs définis
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.roomNumber !== undefined) updateData.roomNumber = data.roomNumber;
    if (data.floor !== undefined) updateData.floor = data.floor;
    if (data.building !== undefined) updateData.building = data.building;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;
    if (data.resolutionNotes !== undefined) updateData.resolutionNotes = data.resolutionNotes;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isUrgent !== undefined) updateData.isUrgent = data.isUrgent;
    if (data.isBlocking !== undefined) updateData.isBlocking = data.isBlocking;

    // Convertir les dates si présentes
    if (data.scheduledAt) {
      updateData.scheduledAt = Timestamp.fromDate(data.scheduledAt);
    }

    if (data.estimatedDuration !== undefined) {
      updateData.estimatedDuration = data.estimatedDuration;
    }

    console.log('📝 Mise à jour intervention:', updateData);

    await updateDoc(docRef, updateData);
    console.log('✅ Intervention mise à jour');
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de l'intervention:", error);
    throw new Error("Impossible de mettre à jour l'intervention");
  }
};

/**
 * Changer le statut d'une intervention
 */
export const changeStatus = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  statusData: StatusChangeData
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);

    const updateData: Record<string, any> = {
      status: statusData.newStatus,
      updatedAt: serverTimestamp(),
    };

    // Ajouter timestamps selon le statut
    if (statusData.newStatus === 'in_progress') {
      updateData.startedAt = serverTimestamp();
    } else if (statusData.newStatus === 'completed') {
      updateData.completedAt = serverTimestamp();
      if (statusData.resolutionNotes) {
        updateData.resolutionNotes = statusData.resolutionNotes;
      }
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    throw new Error('Impossible de changer le statut');
  }
};

/**
 * Assigner une intervention à un technicien
 */
export const assignIntervention = async (
  establishmentId: string,
  interventionId: string,
  assignmentData: AssignmentData
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);

    await updateDoc(docRef, {
      assignedTo: assignmentData.technicianId,
      assignedAt: serverTimestamp(),
      status: 'assigned',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erreur lors de l'assignation:", error);
    throw new Error("Impossible d'assigner l'intervention");
  }
};

/**
 * Supprimer une intervention (soft delete)
 */
export const deleteIntervention = async (
  establishmentId: string,
  interventionId: string,
  userId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);

    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw new Error("Impossible de supprimer l'intervention");
  }
};

/**
 * Supprimer définitivement une intervention
 */
export const permanentlyDeleteIntervention = async (
  establishmentId: string,
  interventionId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erreur lors de la suppression permanente:', error);
    throw new Error("Impossible de supprimer définitivement l'intervention");
  }
};

// Export toutes les fonctions
export default {
  createIntervention,
  getIntervention,
  updateIntervention,
  changeStatus,
  assignIntervention,
  deleteIntervention,
  permanentlyDeleteIntervention,
};
