/**
 * ============================================================================
 * TIME SESSIONS SERVICE
 * ============================================================================
 *
 * Gestion des sessions de suivi du temps pour les interventions
 */

import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type { TimeSession, CreateTimeSessionData } from '../types/subcollections.types';
import { logTimeAdded } from './historyService';
import { logger } from '@/core/utils/logger';

/**
 * Obtenir la référence de la collection timeSessions
 */
const getTimeSessionsCollection = (establishmentId: string, interventionId: string) => {
  return collection(
    db,
    'establishments',
    establishmentId,
    'interventions',
    interventionId,
    'timeSessions'
  );
};

/**
 * Créer une session de temps
 */
export const createTimeSession = async (
  establishmentId: string,
  interventionId: string,
  technicianId: string,
  technicianName: string,
  data: CreateTimeSessionData,
  userRole?: string
): Promise<string> => {
  try {
    const collectionRef = getTimeSessionsCollection(establishmentId, interventionId);

    const sessionData = {
      interventionId,
      technicianId,
      technicianName,
      duration: data.duration,
      startedAt: data.startedAt ? Timestamp.fromDate(data.startedAt) : serverTimestamp(),
      endedAt: data.endedAt ? Timestamp.fromDate(data.endedAt) : null,
      isManual: data.isManual,
      notes: data.notes || null,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collectionRef, sessionData);

    // Logger dans l'historique
    try {
      await logTimeAdded(
        establishmentId,
        interventionId,
        technicianId,
        technicianName,
        userRole,
        data.duration
      );
    } catch (error) {
      logger.warn('⚠️ Erreur logging historique temps:', error);
    }

    return docRef.id;
  } catch (error) {
    logger.error('❌ Erreur création session temps:', error);
    throw new Error('Impossible de créer la session de temps');
  }
};

/**
 * Supprimer une session de temps
 */
export const deleteTimeSession = async (
  establishmentId: string,
  interventionId: string,
  sessionId: string
): Promise<void> => {
  try {
    const docRef = doc(
      db,
      'establishments',
      establishmentId,
      'interventions',
      interventionId,
      'timeSessions',
      sessionId
    );

    await deleteDoc(docRef);
  } catch (error) {
    logger.error('❌ Erreur suppression session:', error);
    throw new Error('Impossible de supprimer la session');
  }
};

/**
 * S'abonner aux sessions en temps réel
 */
export const subscribeToTimeSessions = (
  establishmentId: string,
  interventionId: string,
  onSuccess: (sessions: TimeSession[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  try {
    const collectionRef = getTimeSessionsCollection(establishmentId, interventionId);

    const q = query(collectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const sessions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as TimeSession[];

        onSuccess(sessions);
      },
      error => {
        logger.error('❌ Erreur subscription sessions:', error);
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

export default {
  createTimeSession,
  deleteTimeSession,
  subscribeToTimeSessions,
};
