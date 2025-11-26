/**
 * Auth Service
 *
 * Service pour gérer l'authentification avec Firebase
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updateEmail,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/core/config/firebase';
import type { AuthCredentials, PasswordResetData, ChangePasswordData } from '@/shared/types';
import { logger } from '@/core/utils/logger';

/**
 * Connexion avec email/mot de passe
 */
export const loginWithEmail = async (credentials: AuthCredentials): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );
    return userCredential.user;
  } catch (error: any) {
    logger.error('Erreur lors de la connexion avec email:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Connexion avec Google
 */
export const loginWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error: any) {
    logger.error('Erreur lors de la connexion avec Google:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Inscription avec email/mot de passe
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Mettre à jour le profil
    await updateProfile(user, { displayName });

    // Envoyer email de vérification
    await sendEmailVerification(user);

    return user;
  } catch (error: any) {
    logger.error("Erreur lors de l'inscription:", error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Déconnexion
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    logger.error('Erreur lors de la déconnexion:', error);
    throw new Error(error.message || 'Erreur lors de la déconnexion');
  }
};

/**
 * Réinitialisation du mot de passe
 */
export const resetPassword = async (data: PasswordResetData): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, data.email);
  } catch (error: any) {
    logger.error('Erreur lors de la réinitialisation du mot de passe:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Changer le mot de passe
 */
export const changePassword = async (data: ChangePasswordData): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    // Réauthentifier d'abord
    await signInWithEmailAndPassword(auth, user.email!, data.currentPassword);

    // Puis changer le mot de passe
    await updatePassword(user, data.newPassword);
  } catch (error: any) {
    logger.error('Erreur lors du changement de mot de passe:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Mettre à jour l'email
 */
export const changeEmail = async (newEmail: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    await updateEmail(user, newEmail);
    await sendEmailVerification(user);
  } catch (error: any) {
    logger.error("Erreur lors du changement d'email:", error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Renvoyer l'email de vérification
 */
export const resendVerificationEmail = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    await sendEmailVerification(user);
  } catch (error: any) {
    logger.error("Erreur lors de l'envoi de l'email de vérification:", error);
    throw new Error(getAuthErrorMessage(error.code) || "Erreur lors de l'envoi de l'email");
  }
};

/**
 * Mettre à jour le profil
 */
export const updateUserProfile = async (data: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    await updateProfile(user, data);
  } catch (error: any) {
    logger.error('Erreur lors de la mise à jour du profil:', error);
    throw new Error(error.message || 'Erreur lors de la mise à jour du profil');
  }
};

/**
 * Obtenir l'utilisateur actuel
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Vérifier si l'utilisateur est connecté
 */
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};

/**
 * Obtenir le token ID
 */
export const getIdToken = async (forceRefresh = false): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    logger.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};

/**
 * Messages d'erreur Firebase Auth
 */
const getAuthErrorMessage = (code: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Cet email est déjà utilisé',
    'auth/invalid-email': 'Email invalide',
    'auth/operation-not-allowed': 'Opération non autorisée',
    'auth/weak-password': 'Mot de passe trop faible (min. 6 caractères)',
    'auth/user-disabled': 'Ce compte a été désactivé',
    'auth/user-not-found': 'Aucun compte trouvé avec cet email',
    'auth/wrong-password': 'Mot de passe incorrect',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard',
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion',
    'auth/invalid-credential': 'Identifiants invalides',
    'auth/account-exists-with-different-credential':
      'Un compte existe déjà avec un autre mode de connexion',
    'auth/requires-recent-login': 'Cette opération nécessite une reconnexion',
  };

  return errorMessages[code] || "Une erreur est survenue lors de l'authentification";
};

export default {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  logout,
  resetPassword,
  changePassword,
  changeEmail,
  resendVerificationEmail,
  updateUserProfile,
  getCurrentUser,
  isAuthenticated,
  getIdToken,
};
