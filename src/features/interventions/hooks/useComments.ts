/**
 * Comments Hook
 *
 * Hook pour gérer les commentaires d'une intervention
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import {
  createComment,
  createSystemComment,
  subscribeToComments,
  updateComment,
  deleteComment,
  getCommentsCount,
} from '../services/commentService';
import type { Comment, CreateCommentData, SystemActionData } from '../types/comment.types';

export const useComments = (interventionId: string, establishmentId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(0);

  // Écouter les commentaires en temps réel
  useEffect(() => {
    if (!interventionId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToComments(interventionId, newComments => {
      setComments(newComments);
      setCount(newComments.length);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [interventionId]);

  /**
   * Ajouter un commentaire
   */
  const addComment = useCallback(
    async (data: CreateCommentData): Promise<boolean> => {
      if (!user || !interventionId || !establishmentId) {
        toast.error('Impossible de poster le commentaire');
        return false;
      }

      if (!data.content.trim()) {
        toast.error('Le commentaire ne peut pas être vide');
        return false;
      }

      setSubmitting(true);
      try {
        await createComment(
          interventionId,
          establishmentId,
          user.uid,
          user.displayName || user.email || 'Utilisateur',
          user.role || 'user',
          data,
          user.photoURL
        );

        return true;
      } catch (error: any) {
        console.error('Error adding comment:', error);
        toast.error('Erreur lors de l\'ajout du commentaire', {
          description: error.message,
        });
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [user, interventionId, establishmentId]
  );

  /**
   * Ajouter un commentaire système
   */
  const addSystemComment = useCallback(
    async (actionData: Omit<SystemActionData, 'userId' | 'userName'>): Promise<boolean> => {
      if (!user || !interventionId || !establishmentId) {
        return false;
      }

      try {
        await createSystemComment(interventionId, establishmentId, {
          ...actionData,
          userId: user.uid,
          userName: user.displayName || user.email || 'Système',
        });

        return true;
      } catch (error: any) {
        console.error('Error adding system comment:', error);
        return false;
      }
    },
    [user, interventionId, establishmentId]
  );

  /**
   * Modifier un commentaire
   */
  const editComment = useCallback(
    async (commentId: string, content: string): Promise<boolean> => {
      if (!content.trim()) {
        toast.error('Le commentaire ne peut pas être vide');
        return false;
      }

      try {
        await updateComment(commentId, { content });
        toast.success('Commentaire modifié');
        return true;
      } catch (error: any) {
        console.error('Error editing comment:', error);
        toast.error('Erreur lors de la modification', {
          description: error.message,
        });
        return false;
      }
    },
    []
  );

  /**
   * Supprimer un commentaire
   */
  const removeComment = useCallback(
    async (commentId: string): Promise<boolean> => {
      if (!user) {
        toast.error('Vous devez être connecté');
        return false;
      }

      try {
        await deleteComment(commentId, user.uid);
        toast.success('Commentaire supprimé');
        return true;
      } catch (error: any) {
        console.error('Error deleting comment:', error);
        toast.error('Erreur lors de la suppression', {
          description: error.message,
        });
        return false;
      }
    },
    [user]
  );

  /**
   * Vérifier si l'utilisateur peut modifier un commentaire
   */
  const canEdit = useCallback(
    (comment: Comment): boolean => {
      if (!user) return false;
      // L'auteur peut toujours éditer, sauf les commentaires système
      if (comment.contentType === 'system') return false;
      return comment.authorId === user.uid;
    },
    [user]
  );

  /**
   * Vérifier si l'utilisateur peut supprimer un commentaire
   */
  const canDelete = useCallback(
    (comment: Comment): boolean => {
      if (!user) return false;
      // L'auteur ou un admin peut supprimer
      if (comment.contentType === 'system') return false;
      return comment.authorId === user.uid || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    },
    [user]
  );

  return {
    comments,
    count,
    loading,
    submitting,
    addComment,
    addSystemComment,
    editComment,
    removeComment,
    canEdit,
    canDelete,
  };
};
