/**
 * ============================================================================
 * HISTORY SERVICE
 * ============================================================================
 *
 * Logging automatique de tous les changements sur les interventions
 */

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type { HistoryEvent, CreateHistoryEventData } from '../types/subcollections.types';
import { STATUS_CONFIG } from '../constants/statusConfig';
import { logger } from '@/core/utils/logger';

/**
 * Obtenir la référence de la collection history
 */
const getHistoryCollection = (establishmentId: string, interventionId: string) => {
  return collection(
    db,
    'establishments',
    establishmentId,
    'interventions',
    interventionId,
    'history'
  );
};

/**
 * Créer un événement d'historique
 */
export const createHistoryEvent = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  userName: string,
  userRole: string | undefined,
  data: CreateHistoryEventData
): Promise<string> => {
  try {
    const collectionRef = getHistoryCollection(establishmentId, interventionId);

    const eventData = {
      interventionId,
      type: data.type,
      description: data.description,
      userId,
      userName,
      userRole: userRole || null,
      oldValue: data.oldValue || null,
      newValue: data.newValue || null,
      details: data.details || null,
      metadata: data.metadata || null,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collectionRef, eventData);
    return docRef.id;
  } catch (error) {
    logger.error('❌ Erreur création événement historique:', error);
    throw new Error("Impossible de créer l'événement");
  }
};

/**
 * S'abonner à l'historique en temps réel
 */
export const subscribeToHistory = (
  establishmentId: string,
  interventionId: string,
  onSuccess: (events: HistoryEvent[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  try {
    const collectionRef = getHistoryCollection(establishmentId, interventionId);

    const q = query(collectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as HistoryEvent[];

        onSuccess(events);
      },
      error => {
        logger.error('❌ Erreur subscription historique:', error);
        onError(error as Error);
      }
    );

    return unsubscribe;
  } catch (error) {
    logger.error('❌ Erreur création subscription:', error);
    onError(error as Error);
    return () => {};
  }
};

/**
 * Helper pour logger un changement de statut
 */
export const logStatusChange = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  userName: string,
  userRole: string | undefined,
  oldStatus: string,
  newStatus: string
): Promise<void> => {
  // Obtenir les labels lisibles depuis la config
  const oldStatusLabel = STATUS_CONFIG[oldStatus as keyof typeof STATUS_CONFIG]?.label || oldStatus;
  const newStatusLabel = STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus;

  await createHistoryEvent(establishmentId, interventionId, userId, userName, userRole, {
    type: 'status_change',
    description: `Statut changé de "${oldStatusLabel}" à "${newStatusLabel}"`,
    oldValue: oldStatus,
    newValue: newStatus,
  });
};

/**
 * Helper pour logger une assignation
 */
export const logAssignment = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  userName: string,
  userRole: string | undefined,
  technicianName: string
): Promise<void> => {
  await createHistoryEvent(establishmentId, interventionId, userId, userName, userRole, {
    type: 'assigned',
    description: `Intervention assignée à ${technicianName}`,
    newValue: technicianName,
  });
};

/**
 * Helper pour logger un ajout de commentaire
 */
export const logCommentAdded = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  userName: string,
  userRole: string | undefined
): Promise<void> => {
  await createHistoryEvent(establishmentId, interventionId, userId, userName, userRole, {
    type: 'comment_added',
    description: 'Nouveau commentaire ajouté',
  });
};

/**
 * Helper pour logger un ajout de photo
 */
export const logPhotoAdded = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  userName: string,
  userRole: string | undefined,
  category: string
): Promise<void> => {
  // Convertir la catégorie en français
  const categoryLabels: Record<string, string> = {
    before: 'Avant',
    during: 'Pendant',
    after: 'Après',
  };

  const categoryLabel = categoryLabels[category] || category;

  await createHistoryEvent(establishmentId, interventionId, userId, userName, userRole, {
    type: 'photo_added',
    description: `Photo ajoutée (${categoryLabel})`,
    details: categoryLabel,
  });
};

/**
 * Helper pour logger un ajout de pièce
 */
export const logPartAdded = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  userName: string,
  userRole: string | undefined,
  partName: string
): Promise<void> => {
  await createHistoryEvent(establishmentId, interventionId, userId, userName, userRole, {
    type: 'part_added',
    description: `Pièce ajoutée : ${partName}`,
    details: partName,
  });
};

/**
 * Helper pour logger un ajout de temps
 */
export const logTimeAdded = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  userName: string,
  userRole: string | undefined,
  duration: number
): Promise<void> => {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  const durationText = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

  await createHistoryEvent(establishmentId, interventionId, userId, userName, userRole, {
    type: 'time_added',
    description: `Temps ajouté : ${durationText}`,
    details: durationText,
    metadata: { duration },
  });
};

/**
 * Helper pour logger l'envoi d'un email de commande
 */
export const logOrderEmailSent = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  userName: string,
  userRole: string | undefined,
  recipientEmail: string,
  partsCount: number
): Promise<void> => {
  await createHistoryEvent(establishmentId, interventionId, userId, userName, userRole, {
    type: 'email_sent',
    description: `Email de commande envoyé à ${recipientEmail}`,
    details: `${partsCount} pièce${partsCount > 1 ? 's' : ''} commandée${partsCount > 1 ? 's' : ''}`,
    metadata: { recipientEmail, partsCount },
  });
};

export default {
  createHistoryEvent,
  subscribeToHistory,
  logStatusChange,
  logAssignment,
  logCommentAdded,
  logPhotoAdded,
  logPartAdded,
  logTimeAdded,
  logOrderEmailSent,
};
