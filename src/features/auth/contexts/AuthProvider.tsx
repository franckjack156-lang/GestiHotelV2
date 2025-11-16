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

          // Mettre à jour lastLoginAt
          try {
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              lastLoginAt: Timestamp.now(),
            });
          } catch (updateError) {
            // Ne pas bloquer la connexion si la mise à jour échoue
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
    } catch (error) {
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
