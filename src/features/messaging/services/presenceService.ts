/**
 * ============================================================================
 * PRESENCE SERVICE
 * ============================================================================
 *
 * Gère la présence en temps réel des utilisateurs (online/offline/away)
 * Utilise Firestore Real-time Database pour la synchronisation
 */

import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  collection,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';

// ============================================================================
// TYPES
// ============================================================================

export type PresenceStatus = 'online' | 'offline' | 'away';

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: Timestamp;
  establishmentId: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRESENCE_COLLECTION = 'presence';
const AWAY_TIMEOUT = 5 * 60 * 1000; // 5 minutes d'inactivité = away
const OFFLINE_TIMEOUT = 15 * 60 * 1000; // 15 minutes = offline

// ============================================================================
// PRESENCE MANAGEMENT
// ============================================================================

/**
 * Initialise la présence de l'utilisateur
 * À appeler lors de la connexion
 */
export const initializePresence = async (
  userId: string,
  establishmentId: string
): Promise<() => void> => {
  const presenceRef = doc(db, PRESENCE_COLLECTION, userId);

  await setDoc(
    presenceRef,
    {
      userId,
      establishmentId,
      status: 'online',
      lastSeen: serverTimestamp(),
    },
    { merge: true }
  );

  // Mettre à jour la présence toutes les 30 secondes
  const heartbeatInterval = setInterval(async () => {
    try {
      await updateDoc(presenceRef, {
        lastSeen: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating presence heartbeat:', error);
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  // Marquer comme offline lors de la fermeture
  const handleBeforeUnload = async () => {
    await setPresenceStatus(userId, 'offline');
    clearInterval(heartbeatInterval);
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // Gérer la visibilité de la page (away quand onglet inactif)
  const handleVisibilityChange = async () => {
    if (document.hidden) {
      await setPresenceStatus(userId, 'away');
    } else {
      await setPresenceStatus(userId, 'online');
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Retourner une fonction de nettoyage
  return () => {
    clearInterval(heartbeatInterval);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

/**
 * Définir le statut de présence de l'utilisateur
 */
export const setPresenceStatus = async (userId: string, status: PresenceStatus): Promise<void> => {
  const presenceRef = doc(db, PRESENCE_COLLECTION, userId);

  await updateDoc(presenceRef, {
    status,
    lastSeen: serverTimestamp(),
  });
};

/**
 * Écouter la présence d'un utilisateur spécifique
 */
export const subscribeToUserPresence = (
  userId: string,
  callback: (presence: UserPresence | null) => void
): (() => void) => {
  const presenceRef = doc(db, PRESENCE_COLLECTION, userId);

  const unsubscribe = onSnapshot(
    presenceRef,
    snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserPresence);
      } else {
        callback(null);
      }
    },
    error => {
      console.error('Error subscribing to user presence:', error);
      callback(null);
    }
  );

  return unsubscribe;
};

/**
 * Écouter la présence de tous les utilisateurs d'un établissement
 */
export const subscribeToEstablishmentPresence = (
  establishmentId: string,
  callback: (presences: Map<string, UserPresence>) => void
): (() => void) => {
  const presenceQuery = query(
    collection(db, PRESENCE_COLLECTION),
    where('establishmentId', '==', establishmentId)
  );

  const unsubscribe = onSnapshot(
    presenceQuery,
    snapshot => {
      const presences = new Map<string, UserPresence>();

      snapshot.docs.forEach(doc => {
        const presence = doc.data() as UserPresence;

        // Calculer le statut réel basé sur lastSeen
        const now = Date.now();
        const lastSeenTime = presence.lastSeen?.toMillis?.() || 0;
        const timeSinceLastSeen = now - lastSeenTime;

        let actualStatus: PresenceStatus = presence.status;

        // Si le lastSeen est trop ancien, forcer offline
        if (timeSinceLastSeen > OFFLINE_TIMEOUT) {
          actualStatus = 'offline';
        } else if (timeSinceLastSeen > AWAY_TIMEOUT && presence.status === 'online') {
          actualStatus = 'away';
        }

        presences.set(presence.userId, {
          ...presence,
          status: actualStatus,
        });
      });

      callback(presences);
    },
    error => {
      console.error('Error subscribing to establishment presence:', error);
      callback(new Map());
    }
  );

  return unsubscribe;
};

/**
 * Obtenir le statut de présence d'un utilisateur (snapshot unique)
 */
export const getUserPresenceStatus = (
  presences: Map<string, UserPresence>,
  userId: string
): PresenceStatus => {
  const presence = presences.get(userId);

  if (!presence) {
    return 'offline';
  }

  // Vérifier si le lastSeen n'est pas trop ancien
  const now = Date.now();
  const lastSeenTime = presence.lastSeen?.toMillis?.() || 0;
  const timeSinceLastSeen = now - lastSeenTime;

  if (timeSinceLastSeen > OFFLINE_TIMEOUT) {
    return 'offline';
  } else if (timeSinceLastSeen > AWAY_TIMEOUT && presence.status === 'online') {
    return 'away';
  }

  return presence.status;
};
