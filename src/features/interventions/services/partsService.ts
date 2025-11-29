/**
 * ============================================================================
 * PARTS SERVICE
 * ============================================================================
 *
 * Gestion des pièces nécessaires pour les interventions
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type {
  Part,
  CreatePartData,
  UpdatePartData,
  PartStatus,
} from '../types/subcollections.types';
import { logPartAdded } from './historyService';
import { logger } from '@/core/utils/logger';

/**
 * Obtenir la référence de la collection parts
 */
const getPartsCollection = (establishmentId: string, interventionId: string) => {
  return collection(
    db,
    'establishments',
    establishmentId,
    'interventions',
    interventionId,
    'parts'
  );
};

/**
 * Créer une pièce
 */
export const createPart = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  userName: string,
  data: CreatePartData,
  userRole?: string
): Promise<string> => {
  try {
    const collectionRef = getPartsCollection(establishmentId, interventionId);

    logger.debug('📦 createPart - Received data:', data);

    const partData = {
      interventionId,
      name: data.name,
      reference: data.reference || null,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      supplier: data.supplier || null,
      notes: data.notes || null,
      status: data.status || 'to_order',
      createdBy: userId,
      createdByName: userName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    logger.debug('📦 createPart - Prepared partData:', partData);

    const docRef = await addDoc(collectionRef, partData);

    // Logger dans l'historique
    try {
      await logPartAdded(establishmentId, interventionId, userId, userName, userRole, data.name);
    } catch (error: unknown) {
      logger.warn('⚠️ Erreur logging historique pièce:', error);
    }

    return docRef.id;
  } catch (error: unknown) {
    logger.error('❌ Erreur création pièce:', error);
    throw new Error('Impossible de créer la pièce');
  }
};

/**
 * Mettre à jour une pièce
 */
export const updatePart = async (
  establishmentId: string,
  interventionId: string,
  partId: string,
  data: UpdatePartData
): Promise<void> => {
  try {
    const docRef = doc(
      db,
      'establishments',
      establishmentId,
      'interventions',
      interventionId,
      'parts',
      partId
    );

    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
    if (data.supplier !== undefined) updateData.supplier = data.supplier;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) {
      updateData.status = data.status;

      // Ajouter timestamp en fonction du statut
      if (data.status === 'ordered' && !updateData.orderedAt) {
        updateData.orderedAt = serverTimestamp();
      }
      if (data.status === 'received' && !updateData.receivedAt) {
        updateData.receivedAt = serverTimestamp();
      }
      if (data.status === 'installed' && !updateData.installedAt) {
        updateData.installedAt = serverTimestamp();
      }
    }

    await updateDoc(docRef, updateData);
  } catch (error: unknown) {
    logger.error('❌ Erreur mise à jour pièce:', error);
    throw new Error('Impossible de mettre à jour la pièce');
  }
};

/**
 * Supprimer une pièce
 */
export const deletePart = async (
  establishmentId: string,
  interventionId: string,
  partId: string
): Promise<void> => {
  try {
    const docRef = doc(
      db,
      'establishments',
      establishmentId,
      'interventions',
      interventionId,
      'parts',
      partId
    );

    await deleteDoc(docRef);
  } catch (error: unknown) {
    logger.error('❌ Erreur suppression pièce:', error);
    throw new Error('Impossible de supprimer la pièce');
  }
};

/**
 * S'abonner aux pièces en temps réel
 */
export const subscribeToParts = (
  establishmentId: string,
  interventionId: string,
  onSuccess: (parts: Part[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  try {
    const collectionRef = getPartsCollection(establishmentId, interventionId);

    const q = query(collectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const parts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Part[];

        onSuccess(parts);
      },
      error => {
        logger.error('❌ Erreur subscription pièces:', error);
        onError(error as Error);
      }
    );

    return unsubscribe;
  } catch (error: unknown) {
    logger.error('❌ Erreur création subscription:', error);
    onError(error as Error);
    return () => {};
  }
};

/**
 * Changer le statut d'une pièce
 */
export const changePartStatus = async (
  establishmentId: string,
  interventionId: string,
  partId: string,
  newStatus: PartStatus
): Promise<void> => {
  try {
    await updatePart(establishmentId, interventionId, partId, { status: newStatus });
  } catch (error: unknown) {
    logger.error('❌ Erreur changement statut:', error);
    throw new Error('Impossible de changer le statut');
  }
};

export default {
  createPart,
  updatePart,
  deletePart,
  subscribeToParts,
  changePartStatus,
};
