/**
 * AuthProvider - VERSION DÉFINITIVE
 *
 * Initialise le listener Firebase Auth au niveau module (pas dans useEffect)
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/config/firebase';
import { useAuthStore } from '../stores/authStore';
import { getUserById } from '@/features/users/services/userService';

interface AuthProviderProps {
  children: React.ReactNode;
}

// ✅ INITIALISER LE LISTENER AU NIVEAU MODULE (1 SEULE FOIS)
let listenerInitialized = false;
let initialLoadComplete = false;

const initAuthListener = () => {
  if (listenerInitialized) {
    console.log('🔵 AuthListener: Déjà initialisé');
    return;
  }

  console.log('🔵 AuthListener: Initialisation');
  listenerInitialized = true;

  onAuthStateChanged(auth, async firebaseUser => {
    console.log('🔵 AuthListener: Auth state changed', firebaseUser?.uid || 'null');

    const { setUser, setFirebaseUser, setLoading, setError } = useAuthStore.getState();

    setLoading(true);

    try {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        console.log('🔵 AuthListener: Chargement profil...');

        const userData = await getUserById(firebaseUser.uid);

        if (userData) {
          console.log('✅ AuthListener: Profil chargé', userData);
          setUser(userData);
          setError(null);
        } else {
          console.error('❌ AuthListener: Profil introuvable');
          setUser(null);
          setError('Profil utilisateur introuvable');
        }
      } else {
        console.log("🔵 AuthListener: Pas d'utilisateur");
        setFirebaseUser(null);
        setUser(null);
        setError(null);
      }
    } catch (error) {
      console.error('❌ AuthListener: Erreur', error);
      setUser(null);
      setError('Erreur lors du chargement du profil');
    } finally {
      console.log('🔵 AuthListener: Fin chargement');
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
    // Attendre que le chargement initial soit terminé
    if (initialLoadComplete) {
      console.log('✅ AuthProvider: Déjà chargé');
      setReady(true);
      return;
    }

    console.log('🔵 AuthProvider: Attente du chargement initial...');

    // Vérifier toutes les 100ms si le chargement est terminé
    const checkInterval = setInterval(() => {
      if (initialLoadComplete) {
        console.log('✅ AuthProvider: Chargement terminé');
        setReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    // Timeout de sécurité : 5 secondes max
    const timeout = setTimeout(() => {
      console.warn("⚠️ AuthProvider: Timeout atteint, forcer l'affichage");
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
