/**
 * Service pour la gestion des tickets de support
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type { SupportRequest, SupportResponse, SupportRequestStatus } from '../types/support.types';
import { createNotification } from '@/shared/services/notificationService';

const COLLECTION = 'supportRequests';
const RESPONSES_SUBCOLLECTION = 'responses';

/**
 * Récupère les tickets d'un utilisateur
 */
export const getUserTickets = async (userId: string): Promise<SupportRequest[]> => {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SupportRequest[];
};

/**
 * Récupère tous les tickets (admin)
 */
export const getAllTickets = async (): Promise<SupportRequest[]> => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SupportRequest[];
};

/**
 * Récupère un ticket par ID
 */
export const getTicketById = async (ticketId: string): Promise<SupportRequest | null> => {
  const docRef = doc(db, COLLECTION, ticketId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as SupportRequest;
};

/**
 * Récupère les réponses d'un ticket
 */
export const getTicketResponses = async (ticketId: string): Promise<SupportResponse[]> => {
  const q = query(
    collection(db, COLLECTION, ticketId, RESPONSES_SUBCOLLECTION),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SupportResponse[];
};

/**
 * Écoute les réponses d'un ticket en temps réel
 */
export const subscribeToTicketResponses = (
  ticketId: string,
  callback: (responses: SupportResponse[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTION, ticketId, RESPONSES_SUBCOLLECTION),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, snapshot => {
    const responses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SupportResponse[];
    callback(responses);
  });
};

/**
 * Ajoute une réponse à un ticket
 */
export const addTicketResponse = async (
  ticketId: string,
  response: Omit<SupportResponse, 'id' | 'createdAt'>
): Promise<string> => {
  const now = Timestamp.now();

  // Ajouter la réponse
  const docRef = await addDoc(collection(db, COLLECTION, ticketId, RESPONSES_SUBCOLLECTION), {
    ...response,
    createdAt: now,
  });

  // Récupérer le ticket pour avoir les infos de l'utilisateur
  const ticketRef = doc(db, COLLECTION, ticketId);
  const ticketSnap = await getDoc(ticketRef);
  const ticket = ticketSnap.exists() ? (ticketSnap.data() as SupportRequest) : null;

  // Mettre à jour le ticket avec les nouvelles métadonnées
  const updateData: Record<string, unknown> = {
    updatedAt: now,
    lastResponseAt: now,
    lastResponseBy: response.authorId,
    responseCount: increment(1),
  };

  // Si c'est une réponse admin, mettre le statut en cours si nouveau
  if (response.isAdmin) {
    updateData.status = 'in_progress';
  }

  await updateDoc(ticketRef, updateData);

  // Créer une notification pour le destinataire
  if (ticket && ticket.establishmentId) {
    try {
      if (response.isAdmin) {
        // Notification pour l'utilisateur (réponse du support)
        await createNotification({
          userId: ticket.userId,
          type: 'system',
          title: 'Nouvelle réponse du support',
          message: `Votre ticket "${ticket.subject}" a reçu une réponse.`,
          actionUrl: `/app/support/${ticketId}`,
          establishmentId: ticket.establishmentId,
        });
      }
      // Note: On ne crée pas de notification pour les admins car ils verront le badge "non lu"
    } catch (error) {
      console.error('Erreur création notification:', error);
      // Ne pas bloquer l'ajout de la réponse si la notification échoue
    }
  }

  return docRef.id;
};

/**
 * Marque un ticket comme lu par l'utilisateur
 */
export const markTicketAsReadByUser = async (ticketId: string): Promise<void> => {
  const ticketRef = doc(db, COLLECTION, ticketId);
  await updateDoc(ticketRef, {
    userLastReadAt: Timestamp.now(),
  });
};

/**
 * Marque un ticket comme lu par l'admin
 */
export const markTicketAsReadByAdmin = async (ticketId: string): Promise<void> => {
  const ticketRef = doc(db, COLLECTION, ticketId);
  await updateDoc(ticketRef, {
    adminLastReadAt: Timestamp.now(),
  });
};

/**
 * Vérifie si un ticket a des réponses non lues pour l'utilisateur
 */
export const hasUnreadResponsesForUser = (ticket: SupportRequest): boolean => {
  // Si pas de dernière réponse, pas de non lu
  if (!ticket.lastResponseAt) return false;

  // Si la dernière réponse est de l'utilisateur lui-même, pas de non lu
  if (ticket.lastResponseBy === ticket.userId) return false;

  // Si l'utilisateur n'a jamais lu, et qu'il y a des réponses, non lu
  if (!ticket.userLastReadAt) return true;

  // Comparer les timestamps
  return ticket.lastResponseAt.toMillis() > ticket.userLastReadAt.toMillis();
};

/**
 * Vérifie si un ticket a des réponses non lues pour l'admin
 */
export const hasUnreadResponsesForAdmin = (ticket: SupportRequest, adminUserId: string): boolean => {
  // Si pas de dernière réponse, pas de non lu
  if (!ticket.lastResponseAt) return false;

  // Si la dernière réponse est de l'admin lui-même, pas de non lu
  if (ticket.lastResponseBy === adminUserId) return false;

  // Si l'admin n'a jamais lu, et qu'il y a des réponses, non lu
  if (!ticket.adminLastReadAt) return !!ticket.responseCount && ticket.responseCount > 0;

  // Comparer les timestamps
  return ticket.lastResponseAt.toMillis() > ticket.adminLastReadAt.toMillis();
};

/**
 * Met à jour le statut d'un ticket
 */
export const updateTicketStatus = async (
  ticketId: string,
  status: SupportRequestStatus
): Promise<void> => {
  const ticketRef = doc(db, COLLECTION, ticketId);
  await updateDoc(ticketRef, {
    status,
    updatedAt: Timestamp.now(),
  });
};

/**
 * Écoute les tickets d'un utilisateur en temps réel
 */
export const subscribeToUserTickets = (
  userId: string,
  callback: (tickets: SupportRequest[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, snapshot => {
    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SupportRequest[];
    callback(tickets);
  });
};

/**
 * Écoute tous les tickets en temps réel (admin)
 */
export const subscribeToAllTickets = (
  callback: (tickets: SupportRequest[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));

  return onSnapshot(q, snapshot => {
    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SupportRequest[];
    callback(tickets);
  });
};
