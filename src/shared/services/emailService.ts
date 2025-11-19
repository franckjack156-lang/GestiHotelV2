/**
 * Service d'envoi d'emails via Firebase Cloud Functions
 */

import { auth } from '@/core/config/firebase';

/**
 * Interface pour les données d'invitation utilisateur
 */
export interface UserInvitationEmailData {
  to: string;
  invitedUserName: string;
  invitedByName: string;
  establishmentName: string;
  role: string;
  temporaryPassword?: string;
  invitationMessage?: string;
  appUrl: string;
}

/**
 * Interface pour les données de commande de pièces
 */
export interface PartOrderEmailData {
  to: string;
  establishmentName: string;
  interventionNumber?: string;
  roomNumber?: string;
  parts: Array<{
    name: string;
    reference?: string;
    quantity: number;
    unitPrice: number;
    supplier?: string;
  }>;
  requestedBy: string;
  requestedAt: string;
}

/**
 * Envoyer un email d'invitation utilisateur
 */
export const sendUserInvitationEmail = async (
  data: UserInvitationEmailData
): Promise<{ success: boolean; messageId?: string }> => {
  try {
    // Récupérer le token d'authentification
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    const token = await user.getIdToken();

    // Appeler la Cloud Function via HTTP
    const response = await fetch(
      `${import.meta.env.VITE_CLOUD_FUNCTIONS_URL || 'https://europe-west1-gestihotel-v2.cloudfunctions.net'}/sendUserInvitationEmail`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erreur lors de l'envoi de l'email d'invitation");
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("Erreur lors de l'envoi de l'email d'invitation:", error);
    throw new Error(error.message || "Impossible d'envoyer l'email d'invitation");
  }
};

/**
 * Envoyer un email de commande de pièces
 */
export const sendPartOrderEmail = async (
  data: PartOrderEmailData
): Promise<{ success: boolean; messageId?: string }> => {
  try {
    // Récupérer le token d'authentification
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    const token = await user.getIdToken();

    // Appeler la Cloud Function via HTTP
    const response = await fetch(
      `${import.meta.env.VITE_CLOUD_FUNCTIONS_URL || 'https://europe-west1-gestihotel-v2.cloudfunctions.net'}/sendPartOrderEmail`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erreur lors de l'envoi de l'email");
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    throw new Error(error.message || "Impossible d'envoyer l'email");
  }
};
