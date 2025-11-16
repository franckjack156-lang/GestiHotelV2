/**
 * ============================================================================
 * USE PRESENCE HOOK
 * ============================================================================
 *
 * Hook pour gérer la présence en temps réel des utilisateurs
 */

import { useEffect, useState } from 'react';
import {
  initializePresence,
  subscribeToEstablishmentPresence,
  getUserPresenceStatus,
  type UserPresence,
  type PresenceStatus,
} from '../services/presenceService';

// ============================================================================
// HOOK
// ============================================================================

export const usePresence = (establishmentId: string | undefined, userId: string | undefined) => {
  const [presences, setPresences] = useState<Map<string, UserPresence>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser la présence de l'utilisateur actuel
  useEffect(() => {
    if (!establishmentId || !userId) return;

    let cleanup: (() => void) | void;

    const init = async () => {
      try {
        cleanup = await initializePresence(userId, establishmentId);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing presence:', error);
      }
    };

    init();

    return () => {
      if (cleanup) cleanup();
    };
  }, [establishmentId, userId]);

  // S'abonner aux présences de tous les utilisateurs de l'établissement
  useEffect(() => {
    if (!establishmentId) return;

    const unsubscribe = subscribeToEstablishmentPresence(establishmentId, newPresences => {
      setPresences(newPresences);
    });

    return () => unsubscribe();
  }, [establishmentId]);

  // Helper pour obtenir le statut d'un utilisateur
  const getUserStatus = (targetUserId: string): PresenceStatus => {
    return getUserPresenceStatus(presences, targetUserId);
  };

  // Helper pour vérifier si un utilisateur est en ligne
  const isUserOnline = (targetUserId: string): boolean => {
    return getUserStatus(targetUserId) === 'online';
  };

  return {
    presences,
    getUserStatus,
    isUserOnline,
    isInitialized,
  };
};
