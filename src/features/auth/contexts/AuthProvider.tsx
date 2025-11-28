/**
 * AuthProvider - VERSION CORRIGÉE V2
 *
 * Corrections :
 * - ✅ Initialise le listener Firebase Auth au niveau module
 * - ✅ Met à jour lastLoginAt lors de la connexion
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/core/config/firebase';
import { useAuthStore } from '../stores/authStore';
import userService from '@/features/users/services/userService';
import { setSentryUser, clearSentryUser } from '@/core/config/sentry';
import { setUserProperties, resetUser, trackUserLogin } from '@/core/config/analytics';
import { logger } from '@/core/utils/logger';

interface AuthProviderProps {
  children: React.ReactNode;
}

// ✅ INITIALISER LE LISTENER AU NIVEAU MODULE (1 SEULE FOIS)
let listenerInitialized = false;
let initialLoadComplete = false;

const initAuthListener = () => {
  if (listenerInitialized) {
    return;
  }

  listenerInitialized = true;

  onAuthStateChanged(auth, async firebaseUser => {
    const { setUser, setFirebaseUser, setLoading, setError } = useAuthStore.getState();

    setLoading(true);

    try {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);

        const userData = await userService.getUser(firebaseUser.uid);

        if (userData) {
          setUser(userData);
          setError(null);

          // Configurer le contexte utilisateur Sentry
          setSentryUser({
            id: userData.id,
            role: userData.role,
            currentEstablishmentId: userData.currentEstablishmentId,
          });

          // Configurer Google Analytics
          setUserProperties({
            role: userData.role,
            isTechnician: userData.isTechnician,
          });

          // Track login
          trackUserLogin(userData.role);

          // Mettre à jour lastLoginAt et synchroniser emailVerified depuis Firebase Auth
          try {
            const updateData: Record<string, unknown> = {
              lastLoginAt: Timestamp.now(),
            };

            // Debug: afficher les états actuels
            console.log(
              '🔍 [AuthProvider] Firebase Auth emailVerified:',
              firebaseUser.emailVerified
            );
            console.log(
              '🔍 [AuthProvider] Firestore userData.emailVerified:',
              userData.emailVerified
            );

            // Synchroniser emailVerified de Firebase Auth vers Firestore
            // Si Firebase Auth indique que l'email est vérifié mais pas Firestore, on met à jour
            if (firebaseUser.emailVerified && !userData.emailVerified) {
              console.log('✅ [AuthProvider] Synchronisation emailVerified: true');
              updateData.emailVerified = true;
              // Mettre à jour le store également
              useAuthStore.getState().updateUser({ emailVerified: true });
              logger.info('Email verified status synchronized from Firebase Auth');
            }

            await updateDoc(doc(db, 'users', firebaseUser.uid), updateData);
            console.log('✅ [AuthProvider] Firestore mis à jour avec:', updateData);
          } catch (updateError) {
            // Ne pas bloquer la connexion si la mise à jour échoue
            console.error('❌ [AuthProvider] Erreur mise à jour:', updateError);
            logger.error('Failed to update user data:', updateError);
          }
        } else {
          setUser(null);
          setError('Profil utilisateur introuvable');
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setError(null);

        // Retirer le contexte utilisateur
        clearSentryUser();
        resetUser();
      }
    } catch {
      setUser(null);
      setError('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
      initialLoadComplete = true;
    }
  });
};

// ✅ INITIALISER IMMÉDIATEMENT (niveau module)
initAuthListener();

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [ready, setReady] = useState(initialLoadComplete);

  useEffect(() => {
    if (initialLoadComplete) {
      setReady(true);
      return;
    }

    const checkInterval = setInterval(() => {
      if (initialLoadComplete) {
        setReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      setReady(true);
      clearInterval(checkInterval);
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Initialisation...</p>
          <p className="mt-2 text-xs text-gray-400">Chargement de votre profil</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
