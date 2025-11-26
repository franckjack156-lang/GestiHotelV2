/**
 * Single Intervention Hook
 *
 * Hook pour charger et gérer une intervention spécifique
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { useEstablishmentStore } from '@/features/establishments/stores/establishmentStore';
import type { Intervention } from '../types/intervention.types';
import { logger } from '@/core/utils/logger';

/**
 * Hook pour charger une intervention spécifique
 *
 * @param interventionId - ID de l'intervention
 * @returns Intervention data, loading state, and error
 */
export const useIntervention = (interventionId: string) => {
  const { currentEstablishment } = useEstablishmentStore();
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!interventionId) {
      setIntervention(null);
      setIsLoading(false);
      setError(new Error('No intervention ID provided'));
      return;
    }

    if (!currentEstablishment?.id) {
      setIntervention(null);
      setIsLoading(false);
      setError(new Error('No establishment selected'));
      return;
    }

    setIsLoading(true);
    setError(null);

    // Utiliser la même structure que le service : establishments/{establishmentId}/interventions/{interventionId}
    const docRef = doc(
      db,
      'establishments',
      currentEstablishment.id,
      'interventions',
      interventionId
    );

    const unsubscribe = onSnapshot(
      docRef,
      snapshot => {
        if (snapshot.exists()) {
          setIntervention({
            id: snapshot.id,
            ...snapshot.data(),
          } as Intervention);
          setError(null);
        } else {
          setIntervention(null);
          setError(new Error('Intervention not found'));
        }
        setIsLoading(false);
      },
      err => {
        logger.error('Error fetching intervention:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [interventionId, currentEstablishment?.id]);

  return {
    intervention,
    isLoading,
    error,
  };
};
