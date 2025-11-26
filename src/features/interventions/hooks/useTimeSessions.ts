/**
 * Hook pour gérer les sessions de suivi du temps d'une intervention
 */

import { useState, useEffect } from 'react';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  subscribeToTimeSessions,
  createTimeSession,
  deleteTimeSession,
} from '../services/timeSessionsService';
import type { TimeSession, CreateTimeSessionData } from '../types/subcollections.types';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';

export const useTimeSessions = (interventionId: string) => {
  const { establishmentId } = useCurrentEstablishment();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // S'abonner aux sessions en temps réel
  useEffect(() => {
    if (!establishmentId || !interventionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeToTimeSessions(
      establishmentId,
      interventionId,
      data => {
        setSessions(data);
        setIsLoading(false);
        setError(null);
      },
      err => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [establishmentId, interventionId]);

  /**
   * Calculer le temps total en minutes
   */
  const getTotalTime = (): number => {
    return sessions.reduce((sum, session) => sum + session.duration, 0);
  };

  /**
   * Ajouter une session de temps
   */
  const addSession = async (data: CreateTimeSessionData): Promise<boolean> => {
    if (!establishmentId || !user) {
      toast.error("Impossible d'ajouter la session");
      return false;
    }

    setIsSubmitting(true);
    try {
      await createTimeSession(
        establishmentId,
        interventionId,
        user.id,
        user.displayName || user.email || 'Utilisateur',
        data,
        user.role
      );
      toast.success('Session ajoutée');
      return true;
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la session");
      logger.error(error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Supprimer une session
   */
  const removeSession = async (sessionId: string): Promise<boolean> => {
    if (!establishmentId) {
      toast.error('Impossible de supprimer la session');
      return false;
    }

    try {
      await deleteTimeSession(establishmentId, interventionId, sessionId);
      toast.success('Session supprimée');
      return true;
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      logger.error(error);
      return false;
    }
  };

  return {
    sessions,
    isLoading,
    error,
    isSubmitting,
    getTotalTime,
    addSession,
    removeSession,
  };
};
