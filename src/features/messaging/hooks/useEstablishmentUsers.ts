/**
 * Hook pour récupérer les utilisateurs d'un établissement
 * Utilisé dans la messagerie pour sélectionner les participants
 */

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type { User } from '@/features/users/types/user.types';
import { subscribeToEstablishmentPresence, type UserPresence } from '../services/presenceService';

export interface EstablishmentUser {
  id: string; // Utilisé comme clé React et pour identifier l'utilisateur
  userId: string; // ID utilisateur dans Firestore (pour compatibilité)
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  isOnline?: boolean;
}

/**
 * Hook pour récupérer en temps réel les utilisateurs d'un établissement
 */
export const useEstablishmentUsers = (establishmentId: string | undefined) => {
  const [users, setUsers] = useState<EstablishmentUser[]>([]);
  const [baseUsers, setBaseUsers] = useState<EstablishmentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [presences, setPresences] = useState<Map<string, UserPresence>>(new Map());

  // Écouter les utilisateurs de l'établissement
  useEffect(() => {
    if (!establishmentId) {
      setBaseUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Query pour récupérer les utilisateurs de l'établissement
    const usersQuery = query(
      collection(db, 'users'),
      where('establishmentIds', 'array-contains', establishmentId)
    );

    // Écouter les changements en temps réel
    const unsubscribe = onSnapshot(
      usersQuery,
      snapshot => {
        const usersList: EstablishmentUser[] = snapshot.docs.map(doc => {
          const data = doc.data() as User;
          return {
            id: doc.id, // Pour compatibilité avec NewConversationDialog
            userId: doc.id, // ID utilisateur Firestore
            name: data.displayName || data.email || 'Utilisateur',
            email: data.email || '',
            avatar: data.photoURL,
            role: data.role,
            isOnline: false,
          };
        });

        setBaseUsers(usersList);
        setIsLoading(false);
      },
      err => {
        console.error('Error fetching establishment users:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [establishmentId]);

  // S'abonner aux présences en temps réel
  useEffect(() => {
    if (!establishmentId) {
      setPresences(new Map());
      return;
    }

    const unsubscribe = subscribeToEstablishmentPresence(establishmentId, newPresences => {
      setPresences(newPresences);
    });

    return () => unsubscribe();
  }, [establishmentId]);

  // Combiner les utilisateurs de base avec les présences
  useEffect(() => {
    const usersWithPresence = baseUsers.map(user => ({
      ...user,
      isOnline: presences.get(user.id)?.status === 'online',
    }));

    setUsers(usersWithPresence);
  }, [baseUsers, presences]);

  return { users, isLoading, error };
};
