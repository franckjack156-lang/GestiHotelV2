/**
 * SMS Notifications avec Twilio
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Interface pour les données de notification SMS
 */
interface SMSNotificationData {
  to: string;
  message: string;
  interventionId?: string;
}

/**
 * Cloud Function callable pour envoyer des SMS via Twilio
 */
export const sendSMS = functions
  .region('europe-west1')
  .https.onCall(async (data: SMSNotificationData, context) => {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'L\'utilisateur doit être authentifié pour envoyer un SMS'
      );
    }

    const { to, message, interventionId } = data;

    // Validation des données
    if (!to || !message) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Les champs "to" et "message" sont requis'
      );
    }

    try {
      // Récupérer les credentials Twilio depuis la config
      const config = functions.config();
      const accountSid = config.twilio?.account_sid || process.env.TWILIO_ACCOUNT_SID;
      const authToken = config.twilio?.auth_token || process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = config.twilio?.phone_number || process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Twilio n\'est pas configuré. Utilisez: firebase functions:config:set twilio.account_sid="xxx" twilio.auth_token="xxx" twilio.phone_number="+1xxx"'
        );
      }

      // Initialiser le client Twilio
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);

      // Envoyer le SMS
      const smsResult = await client.messages.create({
        body: message,
        from: fromNumber,
        to: to,
      });

      console.log(`[SMS] Message envoyé avec succès: ${smsResult.sid}`);

      // Enregistrer l'envoi dans Firestore pour le suivi
      if (interventionId) {
        const db = admin.firestore();
        await db.collection('smsLogs').add({
          userId: context.auth.uid,
          to: to,
          message: message,
          interventionId: interventionId,
          twilioSid: smsResult.sid,
          status: smsResult.status,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return {
        success: true,
        sid: smsResult.sid,
        status: smsResult.status,
      };
    } catch (error: any) {
      console.error('[SMS] Erreur lors de l\'envoi:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Erreur lors de l'envoi du SMS: ${error.message}`
      );
    }
  });
