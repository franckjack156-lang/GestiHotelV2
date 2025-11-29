/**
 * ============================================================================
 * SERVICE SMS - TWILIO
 * ============================================================================
 *
 * Service pour envoyer des notifications SMS via Twilio
 * Utilise les Cloud Functions Firebase pour gérer les credentials de manière sécurisée
 */

import { httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { functions } from '@/core/config/firebase';
import { logger } from '@/core/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface SMSData {
  to: string;
  message: string;
  interventionId?: string;
}

export interface SMSResponse {
  success: boolean;
  sid?: string;
  status?: string;
  error?: string;
}

export interface InterventionAlertData {
  phoneNumber: string;
  intervention: {
    title: string;
    priority: string;
    room?: string;
    description?: string;
  };
}

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Envoyer un SMS via Twilio
 */
export const sendSMS = async (
  to: string,
  message: string,
  interventionId?: string
): Promise<SMSResponse> => {
  try {
    // Valider le numéro de téléphone
    if (!to || !isValidPhoneNumber(to)) {
      throw new Error('Numéro de téléphone invalide');
    }

    // Valider le message
    if (!message || message.trim().length === 0) {
      throw new Error('Le message ne peut pas être vide');
    }

    // Limiter la longueur du message (160 caractères pour un SMS standard)
    if (message.length > 1600) {
      logger.warn('[SMS] Message trop long, sera envoyé en plusieurs parties');
    }

    // Appeler la Cloud Function
    const sendSMSFunction = httpsCallable<SMSData, SMSResponse>(functions, 'sendSMS');
    const result: HttpsCallableResult<SMSResponse> = await sendSMSFunction({
      to,
      message,
      interventionId,
    });

    if (result.data.success) {
      logger.debug('[SMS] Envoyé avec succès:', result.data.sid);
      return result.data;
    } else {
      throw new Error(result.data.error || 'Erreur inconnue');
    }
  } catch (error: any) {
    logger.error('[SMS] Erreur lors de l\'envoi:', error);
    return {
      success: false,
      error: error.message || 'Impossible d\'envoyer le SMS',
    };
  }
};

/**
 * Envoyer une alerte SMS pour une nouvelle intervention
 */
export const sendInterventionAlert = async ({
  phoneNumber,
  intervention,
}: InterventionAlertData): Promise<SMSResponse> => {
  try {
    // Construire le message avec emojis pour une meilleure lisibilité
    const priorityEmoji = getPriorityEmoji(intervention.priority);

    let message = `${priorityEmoji} Nouvelle intervention: ${intervention.title}`;
    message += `\nPriorite: ${intervention.priority}`;

    if (intervention.room) {
      message += `\nChambre: ${intervention.room}`;
    }

    if (intervention.description && intervention.description.length < 100) {
      message += `\n${intervention.description}`;
    }

    return await sendSMS(phoneNumber, message);
  } catch (error: any) {
    logger.error('[SMS] Erreur alerte intervention:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Envoyer une alerte SMS pour une intervention urgente
 */
export const sendUrgentInterventionAlert = async ({
  phoneNumber,
  intervention,
}: InterventionAlertData): Promise<SMSResponse> => {
  const message = `🚨 URGENT - ${intervention.title}${intervention.room ? `\nChambre: ${intervention.room}` : ''}\nAction immediate requise!`;

  return await sendSMS(phoneNumber, message);
};

/**
 * Envoyer une alerte SMS pour une intervention assignée
 */
export const sendInterventionAssignedAlert = async (
  phoneNumber: string,
  interventionTitle: string,
  room?: string
): Promise<SMSResponse> => {
  let message = `📋 Vous avez ete assigne a: ${interventionTitle}`;

  if (room) {
    message += `\nChambre: ${room}`;
  }

  return await sendSMS(phoneNumber, message);
};

/**
 * Envoyer une alerte SMS pour un changement de statut
 */
export const sendStatusChangeAlert = async (
  phoneNumber: string,
  interventionTitle: string,
  newStatus: string
): Promise<SMSResponse> => {
  const message = `🔄 Statut modifie: ${interventionTitle}\nNouveau statut: ${newStatus}`;

  return await sendSMS(phoneNumber, message);
};

/**
 * Envoyer une alerte SMS pour une intervention terminée
 */
export const sendInterventionCompletedAlert = async (
  phoneNumber: string,
  interventionTitle: string
): Promise<SMSResponse> => {
  const message = `✅ Intervention terminee: ${interventionTitle}`;

  return await sendSMS(phoneNumber, message);
};

/**
 * Envoyer une alerte SMS pour un SLA à risque
 */
export const sendSLAAtRiskAlert = async (
  phoneNumber: string,
  interventionTitle: string,
  timeRemaining: string
): Promise<SMSResponse> => {
  const message = `⚠️ SLA a risque: ${interventionTitle}\nTemps restant: ${timeRemaining}`;

  return await sendSMS(phoneNumber, message);
};

/**
 * Envoyer une alerte SMS pour un SLA dépassé
 */
export const sendSLABreachedAlert = async (
  phoneNumber: string,
  interventionTitle: string
): Promise<SMSResponse> => {
  const message = `🔴 SLA DEPASSE: ${interventionTitle}\nAction urgente requise!`;

  return await sendSMS(phoneNumber, message);
};

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Valider un numéro de téléphone (format international)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Format international E.164: +[code pays][numéro]
  // Exemple: +33612345678, +14155551234
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

/**
 * Formater un numéro de téléphone au format international
 */
export const formatPhoneNumber = (phone: string, countryCode: string = '+33'): string => {
  // Supprimer tous les caractères non numériques
  let cleaned = phone.replace(/\D/g, '');

  // Si le numéro commence par 0, le remplacer par le code pays
  if (cleaned.startsWith('0')) {
    cleaned = countryCode.replace('+', '') + cleaned.substring(1);
  }

  // Ajouter le + si absent
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
};

/**
 * Obtenir l'emoji correspondant à la priorité
 */
const getPriorityEmoji = (priority: string): string => {
  const emojiMap: Record<string, string> = {
    low: '🔵',
    normal: '🟢',
    high: '🟡',
    urgent: '🔴',
  };

  return emojiMap[priority.toLowerCase()] || '📋';
};

/**
 * Compter le nombre de SMS requis pour un message
 * (160 caractères pour un SMS standard, 153 pour les SMS concaténés)
 */
export const countSMSParts = (message: string): number => {
  const length = message.length;

  if (length <= 160) {
    return 1;
  }

  // Pour les SMS concaténés, chaque partie fait 153 caractères
  return Math.ceil(length / 153);
};

/**
 * Estimer le coût d'un SMS (en fonction du nombre de parties)
 * Prix indicatif Twilio: ~0.06€ par SMS
 */
export const estimateSMSCost = (message: string, pricePerSMS: number = 0.06): number => {
  const parts = countSMSParts(message);
  return parts * pricePerSMS;
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  sendSMS,
  sendInterventionAlert,
  sendUrgentInterventionAlert,
  sendInterventionAssignedAlert,
  sendStatusChangeAlert,
  sendInterventionCompletedAlert,
  sendSLAAtRiskAlert,
  sendSLABreachedAlert,
  isValidPhoneNumber,
  formatPhoneNumber,
  countSMSParts,
  estimateSMSCost,
};
