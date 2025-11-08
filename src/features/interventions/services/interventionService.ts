/**
 * Intervention Service - VERSION FINALE CORRIGÉE
 *
 * Correspond EXACTEMENT à ce que le hook attend
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
 * Obtenir la référence de la collection interventions
 */
const getInterventionsCollection = (establishmentId: string) => {
  return collection(db, 'establishments', establishmentId, 'interventions');
};

/**
 * Générer une référence unique
 */
const generateReference = async (establishmentId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const collectionRef = getInterventionsCollection(establishmentId);
  const q = query(
    collectionRef,
    where('createdAt', '>=', Timestamp.fromDate(new Date(year, 0, 1)))
  );
  const snapshot = await getDocs(q);
  const count = snapshot.size + 1;
  return `INT-${year}-${String(count).padStart(4, '0')}`;
};

/**
 * Créer une nouvelle intervention
 */
export const createIntervention = async (
  establishmentId: string,
  userId: string,
  data: CreateInterventionData
): Promise<string> => {
  try {
    const collectionRef = getInterventionsCollection(establishmentId);
    const reference = await generateReference(establishmentId);

    const interventionData: any = {
      establishmentId,
      title: data.title,
      description: data.description,
      type: data.type,
      category: data.category,
      priority: data.priority,
      status: 'pending' as InterventionStatus,
      location: data.location,
      createdBy: userId,
      photos: [],
      photosCount: 0,
      reference,
      tags: data.tags || [],
      isUrgent: data.isUrgent || data.priority === 'urgent' || data.priority === 'critical',
      isBlocking: data.isBlocking || false,
      requiresValidation: false,
      viewsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false,
    };

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

    const docRef = await addDoc(collectionRef, interventionData);
    console.log('✅ Intervention créée:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur création intervention:', error);
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
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Intervention;
  } catch (error) {
    console.error('❌ Erreur récupération intervention:', error);
    throw new Error("Impossible de récupérer l'intervention");
  }
};

/**
 * Mettre à jour une intervention
 */
export const updateIntervention = async (
  establishmentId: string,
  interventionId: string,
  data: UpdateInterventionData
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    const updateData: Record<string, any> = { updatedAt: serverTimestamp() };

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

    if (data.scheduledAt) {
      updateData.scheduledAt = Timestamp.fromDate(data.scheduledAt);
    }
    if (data.estimatedDuration !== undefined) {
      updateData.estimatedDuration = data.estimatedDuration;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('❌ Erreur mise à jour:', error);
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
    console.error('❌ Erreur changement statut:', error);
    throw new Error('Impossible de changer le statut');
  }
};

/**
 * Assigner une intervention
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
    console.error('❌ Erreur assignation:', error);
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
    console.error('❌ Erreur suppression:', error);
    throw new Error("Impossible de supprimer l'intervention");
  }
};

/**
 * Supprimer définitivement
 */
export const permanentlyDeleteIntervention = async (
  establishmentId: string,
  interventionId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('❌ Erreur suppression permanente:', error);
    throw new Error('Impossible de supprimer définitivement');
  }
};

/**
 * ✅ CORRIGÉ: S'abonner aux interventions en temps réel
 * AVEC TOUS LES PARAMÈTRES QUE LE HOOK ENVOIE
 */
export const subscribeToInterventions = (
  establishmentId: string,
  filters: InterventionFilters | undefined,
  sortOptions: InterventionSortOptions | undefined,
  limitCount: number | undefined,
  onSuccess: (interventions: Intervention[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  try {
    const collectionRef = getInterventionsCollection(establishmentId);

    // Construire la query de base
    const constraints: QueryConstraint[] = [where('isDeleted', '==', false)];

    // Appliquer les filtres
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }
    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }
    if (filters?.assignedTo) {
      constraints.push(where('assignedTo', '==', filters.assignedTo));
    }
    if (filters?.isUrgent !== undefined) {
      constraints.push(where('isUrgent', '==', filters.isUrgent));
    }

    // Appliquer le tri
    const sortField = sortOptions?.field || 'createdAt';
    const sortOrder = sortOptions?.order || 'desc';
    constraints.push(orderBy(sortField, sortOrder));

    // Appliquer la limite
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collectionRef, ...constraints);

    // S'abonner aux changements
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const interventions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Intervention[];

        console.log(`📡 ${interventions.length} interventions reçues`);
        onSuccess(interventions);
      },
      error => {
        console.error('❌ Erreur subscription:', error);
        onError(error as Error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ Erreur création subscription:', error);
    onError(error as Error);
    return () => {};
  }
};

/**
 * ✅ CORRIGÉ: Obtenir les interventions (sans temps réel)
 * AVEC TOUS LES PARAMÈTRES
 */
export const getInterventions = async (
  establishmentId: string,
  filters?: InterventionFilters,
  sortOptions?: InterventionSortOptions,
  limitCount?: number
): Promise<Intervention[]> => {
  try {
    const collectionRef = getInterventionsCollection(establishmentId);

    const constraints: QueryConstraint[] = [where('isDeleted', '==', false)];

    // Appliquer les filtres
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }
    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }
    if (filters?.assignedTo) {
      constraints.push(where('assignedTo', '==', filters.assignedTo));
    }
    if (filters?.isUrgent !== undefined) {
      constraints.push(where('isUrgent', '==', filters.isUrgent));
    }

    // Appliquer le tri
    const sortField = sortOptions?.field || 'createdAt';
    const sortOrder = sortOptions?.order || 'desc';
    constraints.push(orderBy(sortField, sortOrder));

    // Appliquer la limite
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    const interventions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Intervention[];

    console.log(`✅ ${interventions.length} interventions récupérées`);
    return interventions;
  } catch (error) {
    console.error('❌ Erreur récupération:', error);
    throw new Error('Impossible de récupérer les interventions');
  }
};

// ✅ EXPORT FINAL COMPLET
export default {
  createIntervention,
  getIntervention,
  updateIntervention,
  changeStatus,
  assignIntervention,
  deleteIntervention,
  permanentlyDeleteIntervention,
  subscribeToInterventions, // ✅ CORRIGÉ
  getInterventions, // ✅ CORRIGÉ
};
