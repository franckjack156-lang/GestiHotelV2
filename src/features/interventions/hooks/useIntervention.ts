/**
 * Single Intervention Hook
 *
 * Hook pour charger et gérer une intervention spécifique
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type { Intervention } from '../types/intervention.types';

const COLLECTION_NAME = 'interventions';

/**
 * Hook pour charger une intervention spécifique
 *
 * @param interventionId - ID de l'intervention
 * @returns Intervention data, loading state, and error
 */
export const useIntervention = (interventionId: string) => {
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

    setIsLoading(true);
    setError(null);

    const docRef = doc(db, COLLECTION_NAME, interventionId);

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
        console.error('Error fetching intervention:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [interventionId]);

  return {
    intervention,
    isLoading,
    error,
  };
};
