/**
 * Hook pour gérer l'historique d'une intervention
 */

import { useState, useEffect } from 'react';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { subscribeToHistory } from '../services/historyService';
import type { HistoryEvent, HistoryEventType } from '../types/subcollections.types';

export const useHistory = (interventionId: string) => {
  const { establishmentId } = useCurrentEstablishment();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // S'abonner à l'historique en temps réel
  useEffect(() => {
    if (!establishmentId || !interventionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeToHistory(
      establishmentId,
      interventionId,
      data => {
        setEvents(data);
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
   * Filtrer les événements par type
   */
  const getEventsByType = (type: HistoryEventType): HistoryEvent[] => {
    return events.filter(e => e.type === type);
  };

  /**
   * Obtenir le nombre d'événements
   */
  const getEventsCount = (): number => {
    return events.length;
  };

  return {
    events,
    isLoading,
    error,
    getEventsByType,
    getEventsCount,
  };
};
