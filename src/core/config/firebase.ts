/**
 * Firebase Configuration
 * 
 * Initialisation des services Firebase :
 * - Authentication
 * - Firestore Database
 * - Storage
 * - Analytics
 * - Performance Monitoring
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics';
import { getPerformance, type FirebasePerformance } from 'firebase/performance';

// Configuration Firebase depuis les variables d'environnement
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validation de la configuration
const validateConfig = () => {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingKeys = requiredKeys.filter(
    (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
  );

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase configuration keys: ${missingKeys.join(', ')}\n` +
        'Please check your .env file and ensure all VITE_FIREBASE_* variables are set.'
    );
  }
};

// Valider la configuration au chargement
validateConfig();

// Initialisation de Firebase
export const app: FirebaseApp = initializeApp(firebaseConfig);

// Services Firebase
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Analytics (seulement en production et si supporté)
let analyticsInstance: Analytics | null = null;
let performanceInstance: FirebasePerformance | null = null;

if (import.meta.env.PROD) {
  // Initialiser Analytics de manière asynchrone
  isSupported().then((supported) => {
    if (supported) {
      analyticsInstance = getAnalytics(app);
      console.log('✅ Firebase Analytics initialized');
    }
  }).catch((error) => {
    console.warn('⚠️ Firebase Analytics not supported:', error);
  });

  // Initialiser Performance Monitoring
  try {
    performanceInstance = getPerformance(app);
    console.log('✅ Firebase Performance Monitoring initialized');
  } catch (error) {
    console.warn('⚠️ Firebase Performance Monitoring not supported:', error);
  }
}

export const analytics = analyticsInstance;
export const performance = performanceInstance;

// Helper pour vérifier si Firebase est configuré
export const isFirebaseConfigured = (): boolean => {
  try {
    validateConfig();
    return true;
  } catch {
    return false;
  }
};

// Environnement
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const appVersion = import.meta.env.VITE_APP_VERSION || '2.0.0';
export const appName = import.meta.env.VITE_APP_NAME || 'GestiHôtel';

// Log de configuration (seulement en dev)
if (isDevelopment) {
  console.log('🔥 Firebase initialized:', {
    projectId: firebaseConfig.projectId,
    environment: import.meta.env.VITE_APP_ENV || 'development',
    version: appVersion,
  });
}

export default app;
