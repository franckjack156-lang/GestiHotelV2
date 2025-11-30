/**
 * ============================================================================
 * RECURRENCE SERVICE
 * ============================================================================
 *
 * Service pour créer et gérer les interventions récurrentes
 */

import {
  collection,
  doc,
  writeBatch,
  Timestamp,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { generateRecurrenceDates, generateRecurrenceGroupId } from '../utils/recurrence.utils';
import type {
  CreateInterventionData,
  RecurrenceConfig,
  Intervention,
} from '../types/intervention.types';
import { logger } from '@/core/utils/logger';

/**
 * Obtenir la référence de la collection interventions
 */
const getInterventionsCollection = (establishmentId: string) => {
  return collection(db, 'establishments', establishmentId, 'interventions');
};

/**
 * Génère une référence unique pour les interventions récurrentes
 */
const generateReference = async (establishmentId: string, baseIndex: number): Promise<string> => {
  const year = new Date().getFullYear();
  const collectionRef = getInterventionsCollection(establishmentId);
  const q = query(
    collectionRef,
    where('createdAt', '>=', Timestamp.fromDate(new Date(year, 0, 1)))
  );
  const snapshot = await getDocs(q);
  const count = snapshot.size + baseIndex + 1;
  return `INT-${year}-${String(count).padStart(4, '0')}`;
};

/**
 * Crée une série d'interventions récurrentes
 */
export const createRecurringInterventions = async (
  establishmentId: string,
  userId: string,
  data: CreateInterventionData,
  recurrenceConfig: RecurrenceConfig,
  startDate: Date
): Promise<{ groupId: string; count: number; interventionIds: string[] }> => {
  try {
    // Générer l'ID du groupe de récurrence
    const recurrenceGroupId = generateRecurrenceGroupId();

    // Générer les dates d'occurrence
    const occurrenceDates = generateRecurrenceDates(startDate, recurrenceConfig);

    if (occurrenceDates.length === 0) {
      throw new Error("Aucune date d'occurrence générée avec cette configuration");
    }

    logger.info(`Création de ${occurrenceDates.length} interventions récurrentes`, {
      groupId: recurrenceGroupId,
      startDate,
      config: recurrenceConfig,
    });

    // Récupérer le nom du créateur
    let createdByName = 'Inconnu';
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        createdByName = userData.displayName || userData.email || 'Inconnu';
      }
    } catch {
      // Ignorer les erreurs
    }

    // Utiliser un batch pour créer toutes les interventions
    const batch = writeBatch(db);
    const interventionIds: string[] = [];
    const collectionRef = getInterventionsCollection(establishmentId);

    for (let i = 0; i < occurrenceDates.length; i++) {
      const occurrenceDate = occurrenceDates[i];
      const docRef = doc(collectionRef);
      interventionIds.push(docRef.id);

      // Conserver l'heure de la date de départ
      const scheduledAt = new Date(occurrenceDate);
      scheduledAt.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);

      const reference = await generateReference(establishmentId, i);

      const interventionData: Record<string, unknown> = {
        establishmentId,
        title: data.title,
        description: data.description || '',
        type: data.type,
        category: data.category,
        priority: data.priority || 'normal',
        status: 'pending',
        location: data.location || '',
        roomNumber: data.roomNumber || null,
        floor: data.floor ?? null,
        building: data.building || null,
        createdBy: userId,
        createdByName,
        photos: [],
        photosCount: 0,
        reference,
        tags: data.tags || [],
        isUrgent: data.isUrgent || false,
        isBlocking: data.isBlocking || false,
        requiresValidation: false,
        viewsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
        // Planification
        scheduledAt: Timestamp.fromDate(scheduledAt),
        estimatedDuration: data.estimatedDuration || null,
        // Récurrence
        isRecurring: true,
        recurrenceConfig,
        recurrenceGroupId,
        parentInterventionId: i === 0 ? null : interventionIds[0],
        occurrenceIndex: i,
      };

      // Ajouter l'assignation si fournie
      if (data.assignedToIds && data.assignedToIds.length > 0) {
        interventionData.assignedToIds = data.assignedToIds;
        interventionData.assignedToNames = data.assignedToNames || [];
        interventionData.assignedAt = serverTimestamp();
      } else if (data.assignedTo) {
        interventionData.assignedTo = data.assignedTo;
        interventionData.assignedToName = data.assignedToName || null;
        interventionData.assignedAt = serverTimestamp();
      }

      batch.set(docRef, interventionData);
    }

    await batch.commit();

    logger.info(`${occurrenceDates.length} interventions récurrentes créées avec succès`, {
      groupId: recurrenceGroupId,
    });

    return {
      groupId: recurrenceGroupId,
      count: occurrenceDates.length,
      interventionIds,
    };
  } catch (error) {
    logger.error('Erreur lors de la création des interventions récurrentes:', error);
    throw error;
  }
};

/**
 * Récupère toutes les interventions d'un groupe de récurrence
 */
export const getRecurrenceGroup = async (
  establishmentId: string,
  recurrenceGroupId: string
): Promise<Intervention[]> => {
  const collectionRef = getInterventionsCollection(establishmentId);
  const q = query(
    collectionRef,
    where('recurrenceGroupId', '==', recurrenceGroupId),
    where('isDeleted', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Intervention[];
};

/**
 * Met à jour toutes les interventions futures d'un groupe de récurrence
 */
export const updateFutureRecurrences = async (
  establishmentId: string,
  recurrenceGroupId: string,
  fromDate: Date,
  updateData: Partial<CreateInterventionData>
): Promise<number> => {
  const collectionRef = getInterventionsCollection(establishmentId);
  const q = query(
    collectionRef,
    where('recurrenceGroupId', '==', recurrenceGroupId),
    where('scheduledAt', '>=', Timestamp.fromDate(fromDate)),
    where('isDeleted', '==', false)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach(docSnapshot => {
    const docRef = doc(collectionRef, docSnapshot.id);
    batch.update(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return snapshot.size;
};

/**
 * Supprime (soft delete) toutes les interventions futures d'un groupe de récurrence
 */
export const deleteFutureRecurrences = async (
  establishmentId: string,
  recurrenceGroupId: string,
  fromDate: Date,
  deletedBy: string
): Promise<number> => {
  const collectionRef = getInterventionsCollection(establishmentId);
  const q = query(
    collectionRef,
    where('recurrenceGroupId', '==', recurrenceGroupId),
    where('scheduledAt', '>=', Timestamp.fromDate(fromDate)),
    where('isDeleted', '==', false)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach(docSnapshot => {
    const docRef = doc(collectionRef, docSnapshot.id);
    batch.update(docRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return snapshot.size;
};

/**
 * Supprime une seule occurrence d'une récurrence
 */
export const deleteRecurrenceOccurrence = async (
  establishmentId: string,
  interventionId: string,
  deletedBy: string
): Promise<void> => {
  const collectionRef = getInterventionsCollection(establishmentId);
  const docRef = doc(collectionRef, interventionId);

  await updateDoc(docRef, {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    deletedBy,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Détache une intervention de son groupe de récurrence
 */
export const detachFromRecurrence = async (
  establishmentId: string,
  interventionId: string
): Promise<void> => {
  const collectionRef = getInterventionsCollection(establishmentId);
  const docRef = doc(collectionRef, interventionId);

  await updateDoc(docRef, {
    isRecurring: false,
    recurrenceConfig: null,
    recurrenceGroupId: null,
    parentInterventionId: null,
    occurrenceIndex: null,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Compte le nombre d'interventions dans un groupe de récurrence
 */
export const countRecurrenceOccurrences = async (
  establishmentId: string,
  recurrenceGroupId: string,
  includeDeleted = false
): Promise<{ total: number; completed: number; pending: number }> => {
  const collectionRef = getInterventionsCollection(establishmentId);

  let q = query(collectionRef, where('recurrenceGroupId', '==', recurrenceGroupId));

  if (!includeDeleted) {
    q = query(q, where('isDeleted', '==', false));
  }

  const snapshot = await getDocs(q);
  const interventions = snapshot.docs.map(doc => doc.data());

  return {
    total: interventions.length,
    completed: interventions.filter(i => i.status === 'completed').length,
    pending: interventions.filter(i => i.status !== 'completed').length,
  };
};
