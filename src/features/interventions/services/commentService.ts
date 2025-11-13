/**
 * Comment Service
 *
 * Service pour gérer les commentaires sur les interventions
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type {
  Comment,
  CreateCommentData,
  UpdateCommentData,
  SystemActionData,
} from '../types/comment.types';

const COLLECTION_NAME = 'comments';

/**
 * Créer un commentaire
 */
export const createComment = async (
  interventionId: string,
  establishmentId: string,
  userId: string,
  userName: string,
  userRole: string,
  data: CreateCommentData,
  userPhotoURL?: string
): Promise<string> => {
  try {
    const commentData = {
      interventionId,
      establishmentId,
      content: data.content,
      contentType: data.contentType || 'text',
      authorId: userId,
      authorName: userName,
      authorRole: userRole,
      authorPhotoURL: userPhotoURL || null,
      mentions: data.mentions || [],
      attachments: [],
      isEdited: false,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), commentData);
    console.log('✅ Commentaire créé:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur création commentaire:', error);
    throw new Error('Impossible de créer le commentaire');
  }
};

/**
 * Créer un commentaire système automatique
 */
export const createSystemComment = async (
  interventionId: string,
  establishmentId: string,
  actionData: SystemActionData
): Promise<string> => {
  const content = generateSystemCommentContent(actionData);

  return createComment(
    interventionId,
    establishmentId,
    actionData.userId,
    actionData.userName,
    'system',
    {
      content,
      contentType: 'system',
    }
  );
};

/**
 * Générer le contenu d'un commentaire système
 */
const generateSystemCommentContent = (actionData: SystemActionData): string => {
  const { action, metadata, userName } = actionData;

  switch (action) {
    case 'status_changed':
      return `${userName} a changé le statut de "${metadata?.oldStatus}" à "${metadata?.newStatus}"`;
    case 'assigned':
      return `${userName} a assigné l'intervention à ${metadata?.assigneeName}`;
    case 'unassigned':
      return `${userName} a désassigné l'intervention`;
    case 'priority_changed':
      return `${userName} a changé la priorité de "${metadata?.oldPriority}" à "${metadata?.newPriority}"`;
    case 'scheduled':
      return `${userName} a planifié l'intervention pour le ${metadata?.scheduledDate}`;
    case 'started':
      return `${userName} a démarré l'intervention`;
    case 'completed':
      return `${userName} a marqué l'intervention comme terminée`;
    case 'cancelled':
      return `${userName} a annulé l'intervention`;
    case 'reopened':
      return `${userName} a réouvert l'intervention`;
    default:
      return `${userName} a effectué une action sur l'intervention`;
  }
};

/**
 * Obtenir tous les commentaires d'une intervention
 */
export const getComments = async (interventionId: string): Promise<Comment[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('interventionId', '==', interventionId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt,
          updatedAt: doc.data().updatedAt,
        } as Comment)
    );
  } catch (error) {
    console.error('❌ Erreur chargement commentaires:', error);
    throw new Error('Impossible de charger les commentaires');
  }
};

/**
 * Écouter les commentaires en temps réel
 */
export const subscribeToComments = (
  interventionId: string,
  callback: (comments: Comment[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('interventionId', '==', interventionId),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    snapshot => {
      const comments = snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt,
            updatedAt: doc.data().updatedAt,
          } as Comment)
      );
      callback(comments);
    },
    error => {
      console.error('❌ Erreur snapshot commentaires:', error);
    }
  );
};

/**
 * Mettre à jour un commentaire
 */
export const updateComment = async (
  commentId: string,
  data: UpdateCommentData
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, commentId);
    await updateDoc(docRef, {
      content: data.content,
      isEdited: true,
      editedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Commentaire mis à jour');
  } catch (error) {
    console.error('❌ Erreur mise à jour commentaire:', error);
    throw new Error('Impossible de mettre à jour le commentaire');
  }
};

/**
 * Supprimer un commentaire (soft delete)
 */
export const deleteComment = async (commentId: string, userId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, commentId);
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userId,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Commentaire supprimé');
  } catch (error) {
    console.error('❌ Erreur suppression commentaire:', error);
    throw new Error('Impossible de supprimer le commentaire');
  }
};

/**
 * Compter les commentaires d'une intervention
 */
export const getCommentsCount = async (interventionId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('interventionId', '==', interventionId),
      where('isDeleted', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('❌ Erreur comptage commentaires:', error);
    return 0;
  }
};

export default {
  createComment,
  createSystemComment,
  getComments,
  subscribeToComments,
  updateComment,
  deleteComment,
  getCommentsCount,
};
