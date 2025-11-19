/**
 * Hook to get interventions for a specific room
 */

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type { Intervention } from '../types/intervention.types';

export const useRoomInterventions = (
  establishmentId: string | undefined,
  roomNumber: string | undefined
) => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!establishmentId || !roomNumber) {
      setIsLoading(false);
      setInterventions([]);
      return;
    }

    const loadInterventions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const interventionsRef = collection(db, `establishments/${establishmentId}/interventions`);
        const q = query(
          interventionsRef,
          where('roomNumber', '==', roomNumber),
          where('isDeleted', '==', false),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Intervention[];

        setInterventions(data);
      } catch (err) {
        console.error('Error loading room interventions:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInterventions();
  }, [establishmentId, roomNumber]);

  return { interventions, isLoading, error };
};
