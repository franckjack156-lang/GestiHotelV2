/**
 * Firebase Cloud Functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import cors from 'cors';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';

// Helper function to extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// Helper function to check if error has code property
function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === code
  );
}

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Configure CORS
const corsHandler = cors({ origin: true });

/**
 * Interface pour les données d'invitation utilisateur
 */
interface UserInvitationData {
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
interface PartOrderData {
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
 * Cloud Function pour envoyer un email de commande de pièces
 */
export const sendPartOrderEmail = functions
  .region('europe-west1') // Région européenne pour RGPD
  .https.onRequest(async (req, res) => {
    // Gérer CORS
    return corsHandler(req, res, async () => {
      try {
        // Vérifier la méthode HTTP
        if (req.method !== 'POST') {
          res.status(405).json({ error: 'Méthode non autorisée' });
          return;
        }

        // Vérifier l'authentification Firebase
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({ error: 'Non authentifié' });
          return;
        }

        const token = authHeader.split('Bearer ')[1];
        try {
          await admin.auth().verifyIdToken(token);
        } catch (error) {
          res.status(401).json({ error: 'Token invalide' });
          return;
        }

        // Récupérer les données de la requête
        const data: PartOrderData = req.body;

        // Récupérer la clé API Resend depuis la config
        const config = functions.config();
        const resendApiKey = config.resend?.api_key || process.env.RESEND_API_KEY;

        if (!resendApiKey) {
          res.status(500).json({
            error:
              'Clé API Resend non configurée. Utilisez: firebase functions:config:set resend.api_key="votre_cle"',
          });
          return;
        }

        // Initialiser Resend
        const resend = new Resend(resendApiKey);

        // Calculer le total
        const total = data.parts.reduce((sum, part) => sum + part.quantity * part.unitPrice, 0);

        // Créer le contenu HTML de l'email
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .info-box {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 20px;
      border-left: 4px solid #667eea;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
    }
    .parts-table {
      width: 100%;
      background: white;
      border-radius: 6px;
      overflow: hidden;
      margin-top: 20px;
      border-collapse: collapse;
    }
    .parts-table th {
      background: #667eea;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    .parts-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .parts-table tr:last-child td {
      border-bottom: none;
    }
    .parts-table tr:hover {
      background: #f9fafb;
    }
    .total-row {
      background: #f3f4f6;
      font-weight: 700;
      font-size: 1.1em;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📦 Nouvelle demande de commande</h1>
  </div>

  <div class="content">
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Établissement :</span>
        <span>${data.establishmentName}</span>
      </div>
      ${
        data.interventionNumber
          ? `
      <div class="info-row">
        <span class="info-label">N° Intervention :</span>
        <span>${data.interventionNumber}</span>
      </div>
      `
          : ''
      }
      ${
        data.roomNumber
          ? `
      <div class="info-row">
        <span class="info-label">Chambre :</span>
        <span>${data.roomNumber}</span>
      </div>
      `
          : ''
      }
      <div class="info-row">
        <span class="info-label">Demandé par :</span>
        <span>${data.requestedBy}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date de demande :</span>
        <span>${data.requestedAt}</span>
      </div>
    </div>

    <h2 style="margin-top: 30px; color: #374151;">Pièces à commander</h2>

    <table class="parts-table">
      <thead>
        <tr>
          <th>Pièce</th>
          <th>Réf.</th>
          <th style="text-align: center;">Qté</th>
          <th style="text-align: right;">P.U.</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.parts
          .map(
            part => `
        <tr>
          <td>
            <strong>${part.name}</strong>
            ${part.supplier ? `<br><small style="color: #6b7280;">Fournisseur: ${part.supplier}</small>` : ''}
          </td>
          <td>${part.reference || '-'}</td>
          <td style="text-align: center;">${part.quantity}</td>
          <td style="text-align: right;">${part.unitPrice.toFixed(2)} €</td>
          <td style="text-align: right;"><strong>${(part.quantity * part.unitPrice).toFixed(2)} €</strong></td>
        </tr>
        `
          )
          .join('')}
        <tr class="total-row">
          <td colspan="4" style="text-align: right; padding: 16px;">TOTAL</td>
          <td style="text-align: right; padding: 16px;">${total.toFixed(2)} €</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>
      Cet email a été généré automatiquement par GestiHotel.<br>
      Pour toute question, veuillez contacter ${data.requestedBy}.
    </p>
  </div>
</body>
</html>
      `;

        // Envoyer l'email via Resend
        const result = await resend.emails.send({
          from: 'GestiHotel <onboarding@resend.dev>', // Vous devrez configurer votre domaine
          to: [data.to],
          subject: `Commande de pièces - ${data.establishmentName}${data.interventionNumber ? ` - ${data.interventionNumber}` : ''}`,
          html: htmlContent,
        });

        console.log('Email envoyé avec succès:', result);

        res.status(200).json({
          success: true,
          messageId: result.data?.id,
        });
      } catch (error: unknown) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        res.status(500).json({
          error: `Impossible d'envoyer l'email: ${getErrorMessage(error)}`,
        });
      }
    });
  });

/**
 * ✅ Cloud Function pour envoyer un email d'invitation utilisateur
 */
export const sendUserInvitationEmail = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        if (req.method !== 'POST') {
          res.status(405).json({ error: 'Méthode non autorisée' });
          return;
        }

        // Vérifier l'authentification
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({ error: 'Non authentifié' });
          return;
        }

        const token = authHeader.split('Bearer ')[1];
        try {
          await admin.auth().verifyIdToken(token);
        } catch (error) {
          res.status(401).json({ error: 'Token invalide' });
          return;
        }

        const data: UserInvitationData = req.body;

        // Récupérer clé API Resend
        const config = functions.config();
        const resendApiKey = config.resend?.api_key || process.env.RESEND_API_KEY;

        if (!resendApiKey) {
          res.status(500).json({
            error: 'Clé API Resend non configurée',
          });
          return;
        }

        const resend = new Resend(resendApiKey);

        // Créer le contenu HTML
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #f9fafb; padding: 40px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 24px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Vous avez été invité sur GestiHotel</h1>
  </div>
  <div class="content">
    <p style="font-size: 16px;">Bonjour <strong>${data.invitedUserName}</strong>,</p>

    <p><strong>${data.invitedByName}</strong> vous a invité à rejoindre <strong>${data.establishmentName}</strong> sur GestiHotel.</p>

    <div class="info-box">
      <p><strong>Votre rôle :</strong> ${data.role}</p>
      ${data.temporaryPassword ? `<p><strong>Mot de passe temporaire :</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${data.temporaryPassword}</code></p>` : ''}
      ${data.invitationMessage ? `<p><strong>Message :</strong><br>${data.invitationMessage}</p>` : ''}
    </div>

    <p style="text-align: center;">
      <a href="${data.appUrl}/login" class="button">Se connecter à GestiHotel</a>
    </p>

    <p style="font-size: 14px; color: #6b7280;">Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email en toute sécurité.</p>
  </div>
  <div class="footer">
    <p>Cet email a été généré automatiquement par GestiHotel.</p>
  </div>
</body>
</html>
        `;

        // Envoyer l'email
        const result = await resend.emails.send({
          from: 'GestiHotel <onboarding@resend.dev>',
          to: [data.to],
          subject: `Invitation à rejoindre ${data.establishmentName} sur GestiHotel`,
          html: htmlContent,
        });

        console.log("Email d'invitation envoyé:", result);

        res.status(200).json({
          success: true,
          messageId: result.data?.id,
        });
      } catch (error: unknown) {
        console.error("Erreur lors de l'envoi de l'email d'invitation:", error);
        res.status(500).json({
          error: `Impossible d'envoyer l'email: ${getErrorMessage(error)}`,
        });
      }
    });
  });

/**
 * ✅ Cloud Function pour supprimer un utilisateur Firebase Auth
 */
export const deleteAuthUser = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    try {
      // Vérifier que l'utilisateur est authentifié
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Vous devez être connecté pour supprimer un utilisateur'
        );
      }

      // Récupérer l'utilisateur appelant
      const callerUid = context.auth.uid;
      const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
      const callerData = callerDoc.data();

      // Vérifier que l'appelant est admin (editor a tous les privilèges)
      if (!callerData || !['admin', 'super_admin', 'editor'].includes(callerData.role)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Seuls les administrateurs peuvent supprimer des utilisateurs'
        );
      }

      const { userId } = data;

      if (!userId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId est requis');
      }

      // Vérifier que l'utilisateur à supprimer existe
      const userDoc = await admin.firestore().collection('users').doc(userId).get();

      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Utilisateur introuvable dans Firestore');
      }

      const userData = userDoc.data();

      // Empêcher la suppression du dernier super_admin ou editor
      if (userData?.role === 'super_admin' || userData?.role === 'editor') {
        const superAdmins = await admin
          .firestore()
          .collection('users')
          .where('role', 'in', ['super_admin', 'editor'])
          .get();

        if (superAdmins.size <= 1) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Impossible de supprimer le dernier super administrateur ou éditeur'
          );
        }
      }

      // Supprimer l'utilisateur de Firebase Auth
      try {
        await admin.auth().deleteUser(userId);
        console.log(`Utilisateur ${userId} supprimé de Firebase Auth`);
      } catch (authError: unknown) {
        // Si l'utilisateur n'existe pas dans Auth, continuer quand même
        if (!hasErrorCode(authError, 'auth/user-not-found')) {
          throw authError;
        }
        console.log(
          `Utilisateur ${userId} n'existe pas dans Auth, suppression Firestore uniquement`
        );
      }

      // Supprimer le document Firestore
      await admin.firestore().collection('users').doc(userId).delete();
      console.log(`Utilisateur ${userId} supprimé de Firestore`);

      return {
        success: true,
        message: 'Utilisateur supprimé avec succès',
        deletedUserId: userId,
      };
    } catch (error: unknown) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);

      // Si c'est déjà une HttpsError, la relancer
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Sinon, créer une nouvelle HttpsError
      throw new functions.https.HttpsError(
        'internal',
        `Erreur lors de la suppression: ${getErrorMessage(error)}`
      );
    }
  });

// ============================================================================
// PURGE AUTOMATIQUE DES ÉLÉMENTS SUPPRIMÉS (après 30 jours)
// ============================================================================

/**
 * Cloud Function planifiée pour purger les interventions supprimées
 * S'exécute tous les jours à 3h du matin (Europe/Paris)
 */
export const purgeDeletedInterventions = functions
  .region('europe-west1')
  .pubsub.schedule('0 3 * * *') // Tous les jours à 3h00
  .timeZone('Europe/Paris')
  .onRun(async () => {
    const RETENTION_DAYS = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

    console.log(
      `[Purge] Début de la purge des interventions supprimées avant le ${cutoffDate.toISOString()}`
    );

    let totalDeleted = 0;
    let totalErrors = 0;

    try {
      // Récupérer tous les établissements
      const establishmentsSnapshot = await db.collection('establishments').get();

      for (const establishmentDoc of establishmentsSnapshot.docs) {
        const establishmentId = establishmentDoc.id;

        // Récupérer les interventions supprimées depuis plus de 30 jours
        const deletedInterventions = await db
          .collection('establishments')
          .doc(establishmentId)
          .collection('interventions')
          .where('isDeleted', '==', true)
          .where('deletedAt', '<=', cutoffTimestamp)
          .get();

        if (deletedInterventions.empty) {
          continue;
        }

        console.log(
          `[Purge] Établissement ${establishmentId}: ${deletedInterventions.size} interventions à purger`
        );

        // Supprimer par batch (max 500 par batch)
        const batch = db.batch();
        let batchCount = 0;

        for (const doc of deletedInterventions.docs) {
          batch.delete(doc.ref);
          batchCount++;

          if (batchCount >= 500) {
            await batch.commit();
            totalDeleted += batchCount;
            batchCount = 0;
          }
        }

        // Commit du dernier batch
        if (batchCount > 0) {
          await batch.commit();
          totalDeleted += batchCount;
        }
      }

      console.log(`[Purge] Terminé. ${totalDeleted} interventions purgées définitivement.`);

      return { success: true, deletedCount: totalDeleted };
    } catch (error: unknown) {
      console.error('[Purge] Erreur lors de la purge:', error);
      totalErrors++;
      return {
        success: false,
        error: error.message,
        deletedCount: totalDeleted,
        errorCount: totalErrors,
      };
    }
  });

/**
 * Cloud Function callable pour purger manuellement les éléments supprimés
 * (accessible depuis l'interface admin)
 */
export const manualPurgeDeleted = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Vous devez être connecté pour effectuer cette action'
      );
    }

    // Vérifier les permissions (admin uniquement)
    const callerUid = context.auth.uid;
    const callerDoc = await db.collection('users').doc(callerUid).get();
    const callerData = callerDoc.data();

    if (!callerData || !['admin', 'super_admin', 'editor'].includes(callerData.role)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Seuls les administrateurs peuvent effectuer cette action'
      );
    }

    const { establishmentId, retentionDays = 30 } = data;

    if (!establishmentId) {
      throw new functions.https.HttpsError('invalid-argument', 'establishmentId est requis');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

    console.log(
      `[Purge manuelle] Purge des éléments supprimés avant le ${cutoffDate.toISOString()}`
    );

    let deletedInterventionsCount = 0;

    try {
      // Purger les interventions
      const deletedInterventions = await db
        .collection('establishments')
        .doc(establishmentId)
        .collection('interventions')
        .where('isDeleted', '==', true)
        .where('deletedAt', '<=', cutoffTimestamp)
        .get();

      if (!deletedInterventions.empty) {
        const batch = db.batch();
        deletedInterventions.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        deletedInterventionsCount = deletedInterventions.size;
      }

      console.log(`[Purge manuelle] Terminé. ${deletedInterventionsCount} interventions purgées.`);

      return {
        success: true,
        deletedInterventions: deletedInterventionsCount,
        message: `${deletedInterventionsCount} éléments purgés définitivement`,
      };
    } catch (error: unknown) {
      console.error('[Purge manuelle] Erreur:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Erreur lors de la purge: ${getErrorMessage(error)}`
      );
    }
  });

/**
 * Cloud Function callable pour restaurer une intervention supprimée
 */
export const restoreDeletedIntervention = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Vous devez être connecté');
    }

    const { establishmentId, interventionId } = data;

    if (!establishmentId || !interventionId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'establishmentId et interventionId sont requis'
      );
    }

    try {
      const interventionRef = db
        .collection('establishments')
        .doc(establishmentId)
        .collection('interventions')
        .doc(interventionId);

      const intervention = await interventionRef.get();

      if (!intervention.exists) {
        throw new functions.https.HttpsError('not-found', 'Intervention introuvable');
      }

      const interventionData = intervention.data();

      if (!interventionData?.isDeleted) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          "Cette intervention n'est pas supprimée"
        );
      }

      // Restaurer l'intervention
      await interventionRef.update({
        isDeleted: false,
        deletedAt: admin.firestore.FieldValue.delete(),
        deletedBy: admin.firestore.FieldValue.delete(),
        restoredAt: admin.firestore.FieldValue.serverTimestamp(),
        restoredBy: context.auth.uid,
      });

      console.log(`[Restore] Intervention ${interventionId} restaurée par ${context.auth.uid}`);

      return {
        success: true,
        message: 'Intervention restaurée avec succès',
        interventionId,
      };
    } catch (error: unknown) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      console.error('[Restore] Erreur:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Erreur lors de la restauration: ${getErrorMessage(error)}`
      );
    }
  });

/**
 * Cloud Function callable pour récupérer les éléments dans la corbeille
 */
export const getDeletedItems = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Vous devez être connecté');
    }

    const { establishmentId, type = 'interventions' } = data;

    if (!establishmentId) {
      throw new functions.https.HttpsError('invalid-argument', 'establishmentId est requis');
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let items: any[] = [];

      if (type === 'interventions' || type === 'all') {
        const deletedInterventions = await db
          .collection('establishments')
          .doc(establishmentId)
          .collection('interventions')
          .where('isDeleted', '==', true)
          .orderBy('deletedAt', 'desc')
          .limit(100)
          .get();

        items = deletedInterventions.docs.map(doc => ({
          id: doc.id,
          type: 'intervention',
          ...doc.data(),
          deletedAt: doc.data().deletedAt?.toDate?.() || null,
        }));
      }

      // Calculer les jours restants avant purge
      const now = new Date();
      items = items.map(item => {
        if (item.deletedAt) {
          const deletedDate = new Date(item.deletedAt);
          const purgeDate = new Date(deletedDate);
          purgeDate.setDate(purgeDate.getDate() + 30);
          const daysRemaining = Math.ceil(
            (purgeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return { ...item, daysBeforePurge: Math.max(0, daysRemaining) };
        }
        return { ...item, daysBeforePurge: 30 };
      });

      return {
        success: true,
        items,
        count: items.length,
      };
    } catch (error: unknown) {
      console.error('[GetDeleted] Erreur:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Erreur lors de la récupération: ${getErrorMessage(error)}`
      );
    }
  });

// ============================================================================
// PUSH NOTIFICATIONS (FCM)
// ============================================================================

/**
 * Interface pour les données de notification push
 */
interface PushNotificationData {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
}

/**
 * Cloud Function HTTP pour envoyer des notifications push via FCM
 * Appelée depuis le client via fetch
 */
export const sendPushNotification = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        // Vérifier la méthode HTTP
        if (req.method !== 'POST') {
          res.status(405).json({ error: 'Méthode non autorisée' });
          return;
        }

        // Vérifier l'authentification Firebase
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({ error: 'Non authentifié' });
          return;
        }

        const token = authHeader.split('Bearer ')[1];
        try {
          await admin.auth().verifyIdToken(token);
        } catch (error) {
          res.status(401).json({ error: 'Token invalide' });
          return;
        }

        // Récupérer les données de la requête
        const data: PushNotificationData = req.body;

        if (!data.userId || !data.title || !data.body) {
          res.status(400).json({
            error: 'userId, title et body sont requis',
          });
          return;
        }

        // Récupérer le FCM token de l'utilisateur
        const fcmTokenDoc = await db.collection('fcmTokens').doc(data.userId).get();

        if (!fcmTokenDoc.exists) {
          console.log(`[Push] Aucun token FCM pour l'utilisateur ${data.userId}`);
          res.status(200).json({
            success: false,
            reason: 'no_token',
            message: 'Aucun token FCM enregistré pour cet utilisateur',
          });
          return;
        }

        const fcmData = fcmTokenDoc.data();
        const fcmToken = fcmData?.token;

        if (!fcmToken) {
          res.status(200).json({
            success: false,
            reason: 'invalid_token',
            message: 'Token FCM invalide',
          });
          return;
        }

        // Construire le message FCM
        const message: admin.messaging.Message = {
          token: fcmToken,
          notification: {
            title: data.title,
            body: data.body,
          },
          webpush: {
            notification: {
              icon: data.icon || '/icons/icon-192x192.png',
              badge: data.badge || '/icons/icon-72x72.png',
              tag: data.tag,
              requireInteraction: data.priority === 'high',
            },
            fcmOptions: {
              link: data.data?.url || '/',
            },
          },
          data: data.data || {},
        };

        // Envoyer la notification
        const response = await admin.messaging().send(message);

        console.log(`[Push] Notification envoyée avec succès: ${response}`);

        res.status(200).json({
          success: true,
          messageId: response,
        });
      } catch (error: unknown) {
        console.error("[Push] Erreur lors de l'envoi de la notification:", error);

        // Gérer les erreurs de token invalide/expiré
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          // Supprimer le token invalide
          const data: PushNotificationData = req.body;
          if (data.userId) {
            await db.collection('fcmTokens').doc(data.userId).delete();
            console.log(`[Push] Token FCM supprimé pour l'utilisateur ${data.userId}`);
          }

          res.status(200).json({
            success: false,
            reason: 'token_expired',
            message: 'Token FCM expiré ou invalide, supprimé',
          });
          return;
        }

        res.status(500).json({
          error: `Impossible d'envoyer la notification: ${getErrorMessage(error)}`,
        });
      }
    });
  });

/**
 * Cloud Function callable pour envoyer des notifications push à plusieurs utilisateurs
 * (pour les notifications de groupe/établissement)
 */
export const sendBulkPushNotifications = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Vous devez être connecté pour envoyer des notifications'
      );
    }

    const { userIds, title, body, icon, data: notificationData } = data;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userIds doit être un tableau non vide'
      );
    }

    if (!title || !body) {
      throw new functions.https.HttpsError('invalid-argument', 'title et body sont requis');
    }

    // Limiter le nombre de destinataires
    if (userIds.length > 500) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Maximum 500 destinataires par appel'
      );
    }

    try {
      // Récupérer tous les FCM tokens
      const tokenPromises = userIds.map(userId => db.collection('fcmTokens').doc(userId).get());
      const tokenDocs = await Promise.all(tokenPromises);

      // Filtrer les tokens valides
      const validTokens: { userId: string; token: string }[] = [];
      tokenDocs.forEach((doc, index) => {
        if (doc.exists && doc.data()?.token) {
          validTokens.push({
            userId: userIds[index],
            token: doc.data()!.token,
          });
        }
      });

      if (validTokens.length === 0) {
        return {
          success: true,
          sent: 0,
          failed: userIds.length,
          message: 'Aucun token FCM valide trouvé',
        };
      }

      // Construire les messages
      const messages: admin.messaging.Message[] = validTokens.map(({ token }) => ({
        token,
        notification: {
          title,
          body,
        },
        webpush: {
          notification: {
            icon: icon || '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
          },
          fcmOptions: {
            link: notificationData?.url || '/',
          },
        },
        data: notificationData || {},
      }));

      // Envoyer en batch (max 500 par appel)
      const response = await admin.messaging().sendEach(messages);

      // Gérer les tokens invalides
      const invalidTokenUserIds: string[] = [];
      response.responses.forEach((resp, index) => {
        if (!resp.success && resp.error) {
          const errorCode = resp.error.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokenUserIds.push(validTokens[index].userId);
          }
        }
      });

      // Supprimer les tokens invalides
      if (invalidTokenUserIds.length > 0) {
        const deletePromises = invalidTokenUserIds.map(userId =>
          db.collection('fcmTokens').doc(userId).delete()
        );
        await Promise.all(deletePromises);
        console.log(`[Push Bulk] ${invalidTokenUserIds.length} tokens invalides supprimés`);
      }

      console.log(`[Push Bulk] ${response.successCount} envoyés, ${response.failureCount} échecs`);

      return {
        success: true,
        sent: response.successCount,
        failed: response.failureCount,
        invalidTokensRemoved: invalidTokenUserIds.length,
      };
    } catch (error: unknown) {
      console.error('[Push Bulk] Erreur:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Erreur lors de l'envoi des notifications: ${getErrorMessage(error)}`
      );
    }
  });

/**
 * Cloud Function Firestore Trigger - Envoyer une notification push quand une nouvelle notification est créée
 * (Alternative automatique à l'appel manuel depuis le client)
 */
export const onNotificationCreated = functions
  .region('europe-west1')
  .firestore.document('users/{userId}/notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const userId = context.params.userId;

    // Vérifier si la notification nécessite un push
    if (!notification || notification.channels?.push === false) {
      console.log(`[Push Trigger] Notification ${snap.id} ne nécessite pas de push`);
      return null;
    }

    // Vérifier la priorité (envoyer push uniquement pour high/urgent)
    if (notification.priority !== 'high' && notification.priority !== 'urgent') {
      console.log(
        `[Push Trigger] Notification ${snap.id} priorité ${notification.priority}, pas de push`
      );
      return null;
    }

    try {
      // Récupérer le FCM token de l'utilisateur
      const fcmTokenDoc = await db.collection('fcmTokens').doc(userId).get();

      if (!fcmTokenDoc.exists || !fcmTokenDoc.data()?.token) {
        console.log(`[Push Trigger] Pas de token FCM pour ${userId}`);
        return null;
      }

      const fcmToken = fcmTokenDoc.data()!.token;

      // Construire le message
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title: notification.title || 'Nouvelle notification',
          body: notification.message || notification.body || '',
        },
        webpush: {
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: notification.type || 'notification',
            requireInteraction: notification.priority === 'urgent',
          },
          fcmOptions: {
            link: notification.actionUrl || '/app/notifications',
          },
        },
        data: {
          notificationId: snap.id,
          type: notification.type || 'general',
          url: notification.actionUrl || '/app/notifications',
        },
      };

      // Envoyer
      const response = await admin.messaging().send(message);
      console.log(`[Push Trigger] Notification push envoyée: ${response}`);

      // Mettre à jour la notification pour indiquer que le push a été envoyé
      await snap.ref.update({
        pushSentAt: admin.firestore.FieldValue.serverTimestamp(),
        pushMessageId: response,
      });

      return { success: true, messageId: response };
    } catch (error: unknown) {
      console.error(`[Push Trigger] Erreur pour notification ${snap.id}:`, error);

      // Gérer les tokens invalides
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        await db.collection('fcmTokens').doc(userId).delete();
        console.log(`[Push Trigger] Token FCM invalide supprimé pour ${userId}`);
      }

      return { success: false, error: error.message };
    }
  });

// ============================================================================
// SUPPORT TICKETS
// ============================================================================

/**
 * Interface pour les données de ticket support
 */
interface SupportTicketData {
  type: 'bug' | 'question' | 'feature' | 'urgent' | 'other';
  subject: string;
  message: string;
  userId: string;
  userEmail: string;
  userName: string;
  establishmentId?: string;
  establishmentName?: string;
}

/**
 * Cloud Function Firestore Trigger - Envoyer un email quand un nouveau ticket support est créé
 */
export const onSupportRequestCreated = functions
  .region('europe-west1')
  .firestore.document('supportRequests/{ticketId}')
  .onCreate(async (snap, context) => {
    const ticket = snap.data() as SupportTicketData & { createdAt: admin.firestore.Timestamp };
    const ticketId = context.params.ticketId;

    console.log(`[Support] Nouveau ticket créé: ${ticketId}`);

    try {
      // Récupérer la clé API Resend
      const config = functions.config();
      const resendApiKey = config.resend?.api_key || process.env.RESEND_API_KEY;

      if (!resendApiKey) {
        console.warn('[Support] Clé API Resend non configurée, email non envoyé');
        return null;
      }

      const resend = new Resend(resendApiKey);

      // Email de destination du support (à configurer)
      const supportEmail = config.support?.email || 'music.music21@gmail.com';

      // Labels des types de demande
      const typeLabels: Record<string, string> = {
        bug: '🐛 Bug',
        question: '❓ Question',
        feature: '💡 Suggestion',
        urgent: '🚨 Urgent',
        other: '📝 Autre',
      };

      // Créer le contenu HTML de l'email
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #667eea; }
    .info-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #6b7280; }
    .message-box { background: white; padding: 20px; border-radius: 6px; margin-top: 20px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .urgent { background: #fef2f2; border-left-color: #ef4444; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📬 Nouvelle demande de support</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #${ticketId.substring(0, 8).toUpperCase()}</p>
  </div>

  <div class="content">
    <div class="info-box ${ticket.type === 'urgent' ? 'urgent' : ''}">
      <div class="info-row">
        <span class="info-label">Type :</span>
        <span>${typeLabels[ticket.type] || ticket.type}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Sujet :</span>
        <span><strong>${ticket.subject}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">De :</span>
        <span>${ticket.userName} (${ticket.userEmail})</span>
      </div>
      ${
        ticket.establishmentName
          ? `
      <div class="info-row">
        <span class="info-label">Établissement :</span>
        <span>${ticket.establishmentName}</span>
      </div>
      `
          : ''
      }
      <div class="info-row">
        <span class="info-label">Date :</span>
        <span>${ticket.createdAt?.toDate?.()?.toLocaleString('fr-FR') || 'N/A'}</span>
      </div>
    </div>

    <h3 style="color: #374151;">Message</h3>
    <div class="message-box">
      <p style="white-space: pre-wrap; margin: 0;">${ticket.message}</p>
    </div>

    <p style="text-align: center;">
      <a href="https://gestihotel-v2.web.app/app/settings/support/${ticketId}" class="button">
        Répondre au ticket
      </a>
    </p>
  </div>

  <div class="footer">
    <p>Cet email a été généré automatiquement par GestiHotel.</p>
  </div>
</body>
</html>
      `;

      // Envoyer l'email au support
      const result = await resend.emails.send({
        from: 'GestiHotel Support <onboarding@resend.dev>',
        to: [supportEmail],
        reply_to: ticket.userEmail,
        subject: `[${typeLabels[ticket.type] || ticket.type}] ${ticket.subject} - Ticket #${ticketId.substring(0, 8).toUpperCase()}`,
        html: htmlContent,
      });

      console.log(`[Support] Email envoyé au support:`, result);

      // Mettre à jour le ticket avec l'ID de l'email
      await snap.ref.update({
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        emailMessageId: result.data?.id,
      });

      // Envoyer un email de confirmation à l'utilisateur
      const userConfirmationHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .ticket-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Demande reçue</h1>
  </div>
  <div class="content">
    <p>Bonjour ${ticket.userName},</p>
    <p>Nous avons bien reçu votre demande de support. Notre équipe la traitera dans les plus brefs délais.</p>

    <div class="ticket-info">
      <p><strong>Numéro de ticket :</strong> #${ticketId.substring(0, 8).toUpperCase()}</p>
      <p><strong>Sujet :</strong> ${ticket.subject}</p>
    </div>

    <p>Vous pouvez suivre l'état de votre demande directement dans l'application GestiHotel, section "Mes demandes".</p>

    <p>Cordialement,<br>L'équipe GestiHotel</p>
  </div>
  <div class="footer">
    <p>Cet email a été généré automatiquement. Merci de ne pas y répondre directement.</p>
  </div>
</body>
</html>
      `;

      await resend.emails.send({
        from: 'GestiHotel Support <onboarding@resend.dev>',
        to: [ticket.userEmail],
        subject: `Votre demande a été reçue - Ticket #${ticketId.substring(0, 8).toUpperCase()}`,
        html: userConfirmationHtml,
      });

      console.log(`[Support] Email de confirmation envoyé à ${ticket.userEmail}`);

      return { success: true };
    } catch (error: unknown) {
      console.error('[Support] Erreur:', error);
      return { success: false, error: error.message };
    }
  });

/**
 * Cloud Function Firestore Trigger - Notifier l'utilisateur quand une réponse est ajoutée au ticket
 */
export const onSupportResponseAdded = functions
  .region('europe-west1')
  .firestore.document('supportRequests/{ticketId}/responses/{responseId}')
  .onCreate(async (snap, context) => {
    const response = snap.data();
    const ticketId = context.params.ticketId;

    console.log(`[Support] Nouvelle réponse sur le ticket ${ticketId}`);

    try {
      // Récupérer le ticket parent
      const ticketDoc = await db.collection('supportRequests').doc(ticketId).get();
      if (!ticketDoc.exists) {
        console.error(`[Support] Ticket ${ticketId} introuvable`);
        return null;
      }

      const ticket = ticketDoc.data() as SupportTicketData;

      // Vérifier que c'est une réponse du support (pas de l'utilisateur)
      if (response.isFromUser) {
        console.log("[Support] Réponse de l'utilisateur, pas de notification");
        return null;
      }

      // Récupérer la clé API Resend
      const config = functions.config();
      const resendApiKey = config.resend?.api_key || process.env.RESEND_API_KEY;

      if (!resendApiKey) {
        console.warn('[Support] Clé API Resend non configurée');
        return null;
      }

      const resend = new Resend(resendApiKey);

      // Envoyer l'email de notification à l'utilisateur
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .response-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📩 Nouvelle réponse à votre demande</h1>
  </div>
  <div class="content">
    <p>Bonjour ${ticket.userName},</p>
    <p>Vous avez reçu une réponse concernant votre ticket <strong>#${ticketId.substring(0, 8).toUpperCase()}</strong>.</p>

    <p><strong>Sujet original :</strong> ${ticket.subject}</p>

    <div class="response-box">
      <p style="white-space: pre-wrap; margin: 0;">${response.message}</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 15px; margin-bottom: 0;">
        - ${response.authorName || 'Équipe Support'}, ${response.createdAt?.toDate?.()?.toLocaleString('fr-FR') || 'maintenant'}
      </p>
    </div>

    <p style="text-align: center;">
      <a href="https://gestihotel-v2.web.app/app/support/tickets/${ticketId}" class="button">
        Voir la conversation
      </a>
    </p>
  </div>
  <div class="footer">
    <p>Cet email a été généré automatiquement par GestiHotel.</p>
  </div>
</body>
</html>
      `;

      await resend.emails.send({
        from: 'GestiHotel Support <onboarding@resend.dev>',
        to: [ticket.userEmail],
        subject: `Réponse à votre demande - Ticket #${ticketId.substring(0, 8).toUpperCase()}`,
        html: htmlContent,
      });

      console.log(`[Support] Notification envoyée à ${ticket.userEmail}`);

      // Mettre à jour le ticket
      await db
        .collection('supportRequests')
        .doc(ticketId)
        .update({
          lastResponseAt: admin.firestore.FieldValue.serverTimestamp(),
          status: response.status || 'in_progress',
        });

      return { success: true };
    } catch (error: unknown) {
      console.error('[Support] Erreur notification réponse:', error);
      return { success: false, error: error.message };
    }
  });

// ============================================================================
// SCHEDULED EXPORTS
// ============================================================================

/**
 * Interface pour les exports programmés
 */
interface ScheduledExportConfig {
  id: string;
  establishmentId: string;
  name: string;
  dataType: 'interventions' | 'users' | 'rooms' | 'analytics' | 'sla_report' | 'activity_log';
  format: 'xlsx' | 'csv' | 'pdf';
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  scheduledTime: string;
  recipients: string[];
  sendToCreator: boolean;
  isActive: boolean;
  nextRunAt: admin.firestore.Timestamp;
  createdBy: string;
}

/**
 * Cloud Function planifiée pour exécuter les exports programmés
 * S'exécute toutes les minutes et vérifie s'il y a des exports à lancer
 */
export const processScheduledExports = functions
  .region('europe-west1')
  .pubsub.schedule('every 1 minutes')
  .timeZone('Europe/Paris')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    console.log(`[Scheduled Exports] Vérification des exports à ${now.toDate().toISOString()}`);

    let totalProcessed = 0;
    let totalErrors = 0;

    try {
      // Récupérer tous les établissements
      const establishmentsSnapshot = await db.collection('establishments').get();

      for (const establishmentDoc of establishmentsSnapshot.docs) {
        const establishmentId = establishmentDoc.id;
        const establishmentName = establishmentDoc.data().name || 'Établissement';

        // Récupérer les exports à exécuter
        const pendingExports = await db
          .collection('establishments')
          .doc(establishmentId)
          .collection('scheduledExports')
          .where('isActive', '==', true)
          .where('nextRunAt', '<=', now)
          .get();

        if (pendingExports.empty) {
          continue;
        }

        console.log(
          `[Scheduled Exports] ${establishmentId}: ${pendingExports.size} exports à traiter`
        );

        for (const exportDoc of pendingExports.docs) {
          const exportConfig = { id: exportDoc.id, ...exportDoc.data() } as ScheduledExportConfig;

          try {
            // Exécuter l'export
            await executeScheduledExport(establishmentId, establishmentName, exportConfig);
            totalProcessed++;
          } catch (error: unknown) {
            console.error(`[Scheduled Exports] Erreur pour ${exportConfig.name}:`, error);
            totalErrors++;

            // Mettre à jour avec l'erreur
            await exportDoc.ref.update({
              lastError: error.message,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      }

      console.log(
        `[Scheduled Exports] Terminé. ${totalProcessed} traités, ${totalErrors} erreurs.`
      );
      return { success: true, processed: totalProcessed, errors: totalErrors };
    } catch (error: unknown) {
      console.error('[Scheduled Exports] Erreur globale:', error);
      return { success: false, error: error.message };
    }
  });

/**
 * Génère un fichier Excel stylé avec en-têtes formatés et colonnes ajustées
 */
function generateStyledExcel(data: any[], dataType: string, establishmentName: string): Buffer {
  // Créer un nouveau workbook
  const wb = XLSX.utils.book_new();

  // Configuration des colonnes selon le type de données
  const columnConfigs: Record<string, { header: string; key: string; width: number }[]> = {
    interventions: [
      { header: 'N° Intervention', key: 'interventionNumber', width: 15 },
      { header: 'Titre', key: 'title', width: 35 },
      { header: 'Statut', key: 'status', width: 12 },
      { header: 'Priorité', key: 'priority', width: 12 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Chambre', key: 'roomNumber', width: 10 },
      { header: 'Étage', key: 'floor', width: 8 },
      { header: 'Assigné à', key: 'assignedToName', width: 20 },
      { header: 'Créé par', key: 'createdByName', width: 20 },
      { header: 'Date création', key: 'createdAt', width: 18 },
      { header: 'Date mise à jour', key: 'updatedAt', width: 18 },
      { header: 'Description', key: 'description', width: 50 },
    ],
    users: [
      { header: 'Nom', key: 'displayName', width: 25 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Rôle', key: 'role', width: 15 },
      { header: 'Statut', key: 'status', width: 12 },
      { header: 'Date création', key: 'createdAt', width: 18 },
    ],
    rooms: [
      { header: 'Numéro', key: 'number', width: 12 },
      { header: 'Nom', key: 'name', width: 25 },
      { header: 'Étage', key: 'floor', width: 10 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Capacité', key: 'capacity', width: 10 },
      { header: 'Statut', key: 'status', width: 12 },
    ],
  };

  // Labels français pour les statuts et priorités
  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
    on_hold: 'En pause',
  };

  const priorityLabels: Record<string, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente',
  };

  // Obtenir la config de colonnes ou utiliser toutes les clés
  const config = columnConfigs[dataType];
  let headers: string[];
  let keys: string[];
  let widths: number[];

  if (config) {
    headers = config.map(c => c.header);
    keys = config.map(c => c.key);
    widths = config.map(c => c.width);
  } else {
    // Si pas de config, utiliser les clés du premier élément
    keys = Object.keys(data[0] || {});
    headers = keys.map(k => k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1'));
    widths = keys.map(() => 15);
  }

  // Préparer les données avec traduction des valeurs
  const formattedData = data.map(row => {
    const formattedRow: Record<string, any> = {};
    keys.forEach(key => {
      let value = row[key];

      // Traduire les statuts et priorités
      if (key === 'status' && statusLabels[value]) {
        value = statusLabels[value];
      }
      if (key === 'priority' && priorityLabels[value]) {
        value = priorityLabels[value];
      }

      // Formater les dates
      if ((key === 'createdAt' || key === 'updatedAt') && value) {
        if (typeof value === 'string' && value.includes('T')) {
          const date = new Date(value);
          value = date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }

      formattedRow[key] = value ?? '';
    });
    return formattedRow;
  });

  // Créer les données du worksheet avec ligne de titre
  const titleRow = [`Export ${dataType} - ${establishmentName}`];
  const dateRow = [
    `Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
  ];
  const emptyRow: string[] = [];

  // Convertir les données en tableau de tableaux
  const dataRows = formattedData.map(row => keys.map(key => row[key]));

  // Assembler toutes les lignes
  const allRows = [titleRow, dateRow, emptyRow, headers, ...dataRows];

  // Créer le worksheet
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Définir les largeurs de colonnes
  ws['!cols'] = widths.map(w => ({ wch: w }));

  // Fusionner les cellules du titre (ligne 1)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: Math.min(keys.length - 1, 5) } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: Math.min(keys.length - 1, 5) } },
  ];

  // Ajouter le worksheet au workbook
  const sheetName = dataType.charAt(0).toUpperCase() + dataType.slice(1);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Générer le buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return buffer;
}

/**
 * Exécuter un export programmé
 */
async function executeScheduledExport(
  establishmentId: string,
  establishmentName: string,
  config: ScheduledExportConfig
): Promise<void> {
  console.log(`[Export] Début export "${config.name}" (${config.dataType})`);

  // Récupérer les données selon le type
  let data: any[] = [];

  switch (config.dataType) {
    case 'interventions':
      const interventionsSnap = await db
        .collection('establishments')
        .doc(establishmentId)
        .collection('interventions')
        .where('isDeleted', '!=', true)
        .orderBy('isDeleted')
        .orderBy('createdAt', 'desc')
        .limit(1000)
        .get();
      data = interventionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || '',
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || '',
      }));
      break;

    case 'users':
      const usersSnap = await db
        .collection('users')
        .where('establishmentIds', 'array-contains', establishmentId)
        .get();
      data = usersSnap.docs.map(doc => ({
        id: doc.id,
        displayName: doc.data().displayName,
        email: doc.data().email,
        role: doc.data().role,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || '',
      }));
      break;

    case 'rooms':
      const roomsSnap = await db
        .collection('establishments')
        .doc(establishmentId)
        .collection('rooms')
        .get();
      data = roomsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      break;

    default:
      console.log(`[Export] Type ${config.dataType} non implémenté`);
      data = [];
  }

  console.log(`[Export] ${data.length} enregistrements récupérés`);

  if (data.length === 0) {
    console.log(`[Export] Aucune donnée à exporter`);
    // Mettre à jour quand même la prochaine exécution
    await updateNextRunDate(establishmentId, config);
    return;
  }

  // Générer le fichier selon le format demandé
  let fileBuffer: Buffer;
  let contentType: string;
  let fileExtension: string;

  if (config.format === 'xlsx') {
    // Générer un fichier Excel stylé
    const excelBuffer = generateStyledExcel(data, config.dataType, establishmentName);
    fileBuffer = excelBuffer;
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    fileExtension = 'xlsx';
  } else if (config.format === 'csv') {
    // Générer CSV classique
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            const strVal = String(val).replace(/"/g, '""');
            return `"${strVal}"`;
          })
          .join(',')
      ),
    ];
    const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM pour Excel
    fileBuffer = Buffer.from(csvContent, 'utf8');
    contentType = 'text/csv;charset=utf-8';
    fileExtension = 'csv';
  } else {
    // PDF non supporté pour l'instant
    throw new Error('Format PDF non supporté pour les exports programmés');
  }

  // Upload vers Firebase Storage
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${config.dataType}_${timestamp}.${fileExtension}`;
  const filePath = `exports/${establishmentId}/${config.id}/${fileName}`;

  const bucket = admin.storage().bucket();
  const file = bucket.file(filePath);

  await file.save(fileBuffer, {
    metadata: {
      contentType,
      metadata: {
        exportId: config.id,
        exportName: config.name,
        dataType: config.dataType,
        recordCount: String(data.length),
      },
    },
  });

  // Rendre le fichier public et obtenir l'URL
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

  console.log(`[Export] Fichier uploadé: ${filePath}`);

  // Créer l'enregistrement d'exécution
  await db.collection('establishments').doc(establishmentId).collection('exportExecutions').add({
    scheduledExportId: config.id,
    establishmentId,
    status: 'completed',
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    fileUrl: publicUrl,
    filePath,
    fileSize: fileBuffer.length,
    recordCount: data.length,
  });

  // Envoyer par email
  const recipients = [...config.recipients];
  if (config.sendToCreator) {
    const creatorDoc = await db.collection('users').doc(config.createdBy).get();
    const creatorEmail = creatorDoc.data()?.email;
    if (creatorEmail && !recipients.includes(creatorEmail)) {
      recipients.push(creatorEmail);
    }
  }

  if (recipients.length > 0) {
    await sendExportEmail(config, establishmentName, publicUrl, data.length, recipients);
  }

  // Mettre à jour l'export avec la prochaine date d'exécution
  await updateNextRunDate(establishmentId, config);

  console.log(`[Export] Export "${config.name}" terminé avec succès`);
}

/**
 * Envoyer l'email avec le lien de téléchargement
 */
async function sendExportEmail(
  config: ScheduledExportConfig,
  establishmentName: string,
  downloadUrl: string,
  recordCount: number,
  recipients: string[]
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY || functions.config().resend?.api_key;

  if (!resendApiKey) {
    console.warn('[Export] Clé API Resend non configurée, email non envoyé');
    return;
  }

  const resend = new Resend(resendApiKey);

  const dataTypeLabels: Record<string, string> = {
    interventions: 'Interventions',
    users: 'Utilisateurs',
    rooms: 'Chambres',
    analytics: 'Analytics',
    sla_report: 'Rapport SLA',
    activity_log: "Journal d'activité",
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Export programmé</h1>
  </div>
  <div class="content">
    <p>Bonjour,</p>
    <p>Votre export programmé <strong>"${config.name}"</strong> est prêt.</p>

    <div class="info-box">
      <p><strong>Établissement :</strong> ${establishmentName}</p>
      <p><strong>Type de données :</strong> ${dataTypeLabels[config.dataType] || config.dataType}</p>
      <p><strong>Nombre d'enregistrements :</strong> ${recordCount}</p>
      <p><strong>Format :</strong> ${config.format.toUpperCase()}</p>
      <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
    </div>

    <p style="text-align: center;">
      <a href="${downloadUrl}" class="button">📥 Télécharger l'export</a>
    </p>

    <p style="color: #6b7280; font-size: 14px;">
      Ce lien est valide pendant 7 jours. Pour modifier ou désactiver cet export,
      rendez-vous dans les paramètres d'intégrations de GestiHotel.
    </p>
  </div>
  <div class="footer">
    <p>Cet email a été généré automatiquement par GestiHotel.</p>
  </div>
</body>
</html>
  `;

  await resend.emails.send({
    from: 'GestiHotel <onboarding@resend.dev>',
    to: recipients,
    subject: `📊 Export "${config.name}" - ${establishmentName}`,
    html: htmlContent,
  });

  console.log(`[Export] Email envoyé à ${recipients.join(', ')}`);
}

/**
 * Calculer et mettre à jour la prochaine date d'exécution
 */
async function updateNextRunDate(
  establishmentId: string,
  config: ScheduledExportConfig
): Promise<void> {
  const now = new Date();
  const [hours, minutes] = config.scheduledTime.split(':').map(Number);
  const nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  // Si l'heure est déjà passée, passer au prochain jour
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  switch (config.frequency) {
    case 'daily':
      // Déjà configuré
      break;
    case 'weekly':
      // Ajouter 7 jours
      nextRun.setDate(nextRun.getDate() + 6); // +6 car on a déjà ajouté 1
      break;
    case 'monthly':
      // Passer au mois suivant
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
    case 'once':
      // Désactiver l'export
      await db
        .collection('establishments')
        .doc(establishmentId)
        .collection('scheduledExports')
        .doc(config.id)
        .update({
          isActive: false,
          lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
          runCount: admin.firestore.FieldValue.increment(1),
          lastError: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      return;
  }

  // Mettre à jour la prochaine exécution
  await db
    .collection('establishments')
    .doc(establishmentId)
    .collection('scheduledExports')
    .doc(config.id)
    .update({
      nextRunAt: admin.firestore.Timestamp.fromDate(nextRun),
      lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
      runCount: admin.firestore.FieldValue.increment(1),
      lastError: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Cloud Function callable pour exécuter un export manuellement
 */
export const runExportNow = functions.region('europe-west1').https.onCall(async (data, context) => {
  // Vérifier l'authentification
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Vous devez être connecté pour effectuer cette action'
    );
  }

  const { establishmentId, exportId } = data;

  if (!establishmentId || !exportId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'establishmentId et exportId sont requis'
    );
  }

  try {
    // Récupérer l'export
    const exportDoc = await db
      .collection('establishments')
      .doc(establishmentId)
      .collection('scheduledExports')
      .doc(exportId)
      .get();

    if (!exportDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Export non trouvé');
    }

    // Récupérer l'établissement
    const establishmentDoc = await db.collection('establishments').doc(establishmentId).get();
    const establishmentName = establishmentDoc.data()?.name || 'Établissement';

    const exportConfig = { id: exportDoc.id, ...exportDoc.data() } as ScheduledExportConfig;

    // Exécuter l'export
    await executeScheduledExport(establishmentId, establishmentName, exportConfig);

    return {
      success: true,
      message: `Export "${exportConfig.name}" exécuté avec succès`,
    };
  } catch (error: unknown) {
    console.error('[Export Manual] Erreur:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      `Erreur lors de l'exécution de l'export: ${getErrorMessage(error)}`
    );
  }
});

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

/**
 * Cloud Function callable pour envoyer un email de vérification à un utilisateur
 * Utilise le Firebase Admin SDK pour générer le lien de vérification
 */
export const sendVerificationEmail = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Vous devez être connecté pour effectuer cette action'
      );
    }

    const { userId } = data;

    if (!userId) {
      throw new functions.https.HttpsError('invalid-argument', 'userId est requis');
    }

    try {
      // Récupérer l'utilisateur depuis Firebase Auth
      const userRecord = await admin.auth().getUser(userId);

      if (!userRecord.email) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          "L'utilisateur n'a pas d'adresse email"
        );
      }

      if (userRecord.emailVerified) {
        throw new functions.https.HttpsError('already-exists', "L'email est déjà vérifié");
      }

      // Générer le lien de vérification
      const verificationLink = await admin.auth().generateEmailVerificationLink(userRecord.email, {
        url: process.env.APP_URL || 'https://gestihotel-v2.web.app/login',
        handleCodeInApp: false,
      });

      // Envoyer l'email via Resend
      const resendApiKey = process.env.RESEND_API_KEY || functions.config().resend?.api_key;

      if (!resendApiKey) {
        console.warn('[VerifyEmail] Clé API Resend non configurée, email non envoyé');
        // Retourner quand même le lien pour permettre un envoi manuel
        return {
          success: true,
          message: 'Lien de vérification généré (email non envoyé - Resend non configuré)',
          verificationLink,
        };
      }

      const resend = new Resend(resendApiKey);

      // Récupérer le nom de l'utilisateur depuis Firestore
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const displayName = userData?.displayName || userRecord.displayName || 'Utilisateur';

      // Envoyer l'email
      // Note: Utiliser onboarding@resend.dev tant que le domaine gestihotel.fr n'est pas vérifié
      const emailResult = await resend.emails.send({
        from: 'GestiHôtel <onboarding@resend.dev>',
        to: userRecord.email,
        subject: 'Vérifiez votre adresse email - GestiHôtel',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vérification email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🏨 GestiHôtel</h1>
            </div>

            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #1f2937; margin-top: 0;">Bonjour ${displayName},</h2>

              <p>Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte GestiHôtel.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}"
                   style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  ✓ Vérifier mon email
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                <br>
                <a href="${verificationLink}" style="color: #4f46e5; word-break: break-all;">${verificationLink}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

              <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
                Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email.
              </p>
            </div>

            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} GestiHôtel - Gestion hôtelière simplifiée</p>
            </div>
          </body>
          </html>
        `,
      });

      console.log(`[VerifyEmail] Email de vérification envoyé à ${userRecord.email}:`, emailResult);

      return {
        success: true,
        message: `Email de vérification envoyé à ${userRecord.email}`,
      };
    } catch (error: unknown) {
      console.error('[VerifyEmail] Erreur:', error);

      if (error.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError('not-found', 'Utilisateur non trouvé');
      }

      throw new functions.https.HttpsError(
        'internal',
        `Erreur lors de l'envoi de l'email de vérification: ${getErrorMessage(error)}`
      );
    }
  });

// ============================================================================
// CALENDAR INTEGRATION - iCal FEED
// ============================================================================

/**
 * Formater une date en format iCal (RFC 5545)
 */
function formatICalDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * Échapper les caractères spéciaux iCal
 */
function escapeICalString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/**
 * Cloud Function HTTP pour générer un flux iCal (URL d'abonnement)
 * Accessible publiquement avec un token unique
 */
export const getICalFeed = functions.region('europe-west1').https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Récupérer les paramètres
      const { establishmentId, token } = req.query;

      if (!establishmentId || !token) {
        res.status(400).send('establishmentId et token sont requis');
        return;
      }

      // Vérifier le token d'accès
      const integrationQuery = await db
        .collection('establishments')
        .doc(establishmentId as string)
        .collection('calendarIntegrations')
        .where('feedToken', '==', token)
        .where('syncEnabled', '==', true)
        .limit(1)
        .get();

      if (integrationQuery.empty) {
        res.status(403).send('Token invalide ou intégration désactivée');
        return;
      }

      const integration = integrationQuery.docs[0].data();

      // Récupérer les interventions
      // Note: On utilise isDeleted == false pour une requête plus simple
      // Les documents sans le champ isDeleted ou avec isDeleted = false seront inclus
      let interventionsQuery = db
        .collection('establishments')
        .doc(establishmentId as string)
        .collection('interventions')
        .where('isDeleted', '==', false)
        .orderBy('scheduledAt', 'desc')
        .limit(500);

      // Appliquer les filtres si configurés
      if (integration.filterByStatus?.length > 0) {
        interventionsQuery = interventionsQuery.where('status', 'in', integration.filterByStatus);
      }

      const interventionsSnap = await interventionsQuery.get();

      // Récupérer le nom de l'établissement
      const establishmentDoc = await db
        .collection('establishments')
        .doc(establishmentId as string)
        .get();
      const establishmentName = establishmentDoc.data()?.name || 'GestiHotel';

      // Générer le contenu iCal
      const events: string[] = [];

      for (const doc of interventionsSnap.docs) {
        const intervention = doc.data();

        // Ignorer les interventions sans date planifiée
        if (!intervention.scheduledAt) continue;

        const startDate = intervention.scheduledAt.toDate();
        const duration = intervention.estimatedDuration || 60;
        const endDate = new Date(startDate.getTime() + duration * 60000);

        const statusLabels: Record<string, string> = {
          pending: 'En attente',
          in_progress: 'En cours',
          completed: 'Terminée',
          cancelled: 'Annulée',
        };

        const description = [
          intervention.description || '',
          '',
          `Réf: ${intervention.reference || doc.id}`,
          `Statut: ${statusLabels[intervention.status] || intervention.status}`,
          `Priorité: ${intervention.priority}`,
          intervention.assignedToNames?.length
            ? `Assigné à: ${intervention.assignedToNames.join(', ')}`
            : null,
        ]
          .filter(Boolean)
          .join('\\n');

        const location = [
          intervention.location,
          intervention.roomNumber ? `Chambre ${intervention.roomNumber}` : null,
        ]
          .filter(Boolean)
          .join(' - ');

        const event = [
          'BEGIN:VEVENT',
          `UID:${doc.id}@gestihotel.app`,
          `DTSTAMP:${formatICalDate(new Date())}`,
          `DTSTART:${formatICalDate(startDate)}`,
          `DTEND:${formatICalDate(endDate)}`,
          `SUMMARY:${escapeICalString(`[${intervention.priority?.toUpperCase() || 'NORMAL'}] ${intervention.title || 'Intervention'}`)}`,
          `DESCRIPTION:${escapeICalString(description)}`,
          location ? `LOCATION:${escapeICalString(location)}` : null,
          `STATUS:${intervention.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
          `CATEGORIES:${intervention.type || 'intervention'}`,
          'END:VEVENT',
        ]
          .filter(Boolean)
          .join('\r\n');

        events.push(event);
      }

      // Construire le fichier iCal complet
      const icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//GestiHotel//Interventions//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${escapeICalString(establishmentName)} - Interventions`,
        'X-WR-TIMEZONE:Europe/Paris',
        ...events,
        'END:VCALENDAR',
      ].join('\r\n');

      // Définir les headers pour le fichier iCal
      res.set('Content-Type', 'text/calendar; charset=utf-8');
      res.set('Content-Disposition', `attachment; filename="interventions.ics"`);
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');

      res.status(200).send(icalContent);

      // Mettre à jour la date de dernière synchronisation
      await integrationQuery.docs[0].ref.update({
        lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error: unknown) {
      console.error('[iCal Feed] Erreur:', error);
      res.status(500).send(`Erreur: ${getErrorMessage(error)}`);
    }
  });
});

/**
 * Cloud Function callable pour générer un token de flux iCal
 */
export const generateCalendarFeedToken = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Non authentifié');
    }

    const { establishmentId, integrationId } = data;

    if (!establishmentId || !integrationId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'establishmentId et integrationId sont requis'
      );
    }

    try {
      // Générer un token unique
      const token = crypto.randomBytes(32).toString('hex');

      // Mettre à jour l'intégration avec le token
      await db
        .collection('establishments')
        .doc(establishmentId)
        .collection('calendarIntegrations')
        .doc(integrationId)
        .update({
          feedToken: token,
          feedTokenGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Construire l'URL du flux
      const feedUrl = `https://europe-west1-gestihotel-v2.cloudfunctions.net/getICalFeed?establishmentId=${establishmentId}&token=${token}`;

      return {
        success: true,
        feedUrl,
        token,
      };
    } catch (error: unknown) {
      console.error('[Generate Feed Token] Erreur:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

// ============================================================================
// WEBHOOKS - FIRESTORE TRIGGERS
// ============================================================================

/**
 * Interface pour les webhooks
 */
interface WebhookConfig {
  id: string;
  establishmentId: string;
  name: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  events: string[];
  isActive: boolean;
  authType?: string;
  authConfig?: {
    token?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  headers?: Record<string, string>;
  retryEnabled: boolean;
  maxRetries: number;
  retryDelay: number;
  includeMetadata: boolean;
}

/**
 * Envoyer un webhook
 */
async function sendWebhookNotification(
  webhook: WebhookConfig,
  eventType: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const payload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    establishmentId: webhook.establishmentId,
    data,
    ...(webhook.includeMetadata ? { webhookId: webhook.id } : {}),
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'GestiHotel-Webhook/1.0',
    ...webhook.headers,
  };

  // Ajouter l'authentification
  if (webhook.authType === 'bearer' && webhook.authConfig?.token) {
    headers['Authorization'] = `Bearer ${webhook.authConfig.token}`;
  } else if (webhook.authType === 'api_key' && webhook.authConfig?.apiKey) {
    const headerName = webhook.authConfig.apiKeyHeader || 'X-API-Key';
    headers[headerName] = webhook.authConfig.apiKey;
  }

  try {
    const response = await fetch(webhook.url, {
      method: webhook.method,
      headers,
      body: JSON.stringify(payload),
    });

    return {
      success: response.ok,
      statusCode: response.status,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Déclencher les webhooks pour un événement
 */
async function triggerWebhooksForEvent(
  establishmentId: string,
  eventType: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const webhooksSnap = await db
      .collection('establishments')
      .doc(establishmentId)
      .collection('webhooks')
      .where('isActive', '==', true)
      .where('events', 'array-contains', eventType)
      .get();

    if (webhooksSnap.empty) {
      return;
    }

    console.log(`[Webhooks] ${webhooksSnap.size} webhooks à déclencher pour ${eventType}`);

    const promises = webhooksSnap.docs.map(async doc => {
      const webhook = { id: doc.id, ...doc.data() } as WebhookConfig;
      const result = await sendWebhookNotification(webhook, eventType, data);

      // Mettre à jour les stats du webhook
      await doc.ref.update({
        lastTriggeredAt: admin.firestore.FieldValue.serverTimestamp(),
        lastDeliveryStatus: result.success ? 'success' : 'failed',
        successCount: result.success
          ? admin.firestore.FieldValue.increment(1)
          : admin.firestore.FieldValue.increment(0),
        failureCount: !result.success
          ? admin.firestore.FieldValue.increment(1)
          : admin.firestore.FieldValue.increment(0),
      });

      // Logger la livraison
      await db
        .collection('establishments')
        .doc(establishmentId)
        .collection('webhookDeliveries')
        .add({
          webhookId: webhook.id,
          eventType,
          status: result.success ? 'success' : 'failed',
          statusCode: result.statusCode,
          error: result.error,
          triggeredAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      return result;
    });

    await Promise.all(promises);
  } catch (error: unknown) {
    console.error('[Webhooks] Erreur:', error);
  }
}

/**
 * Trigger: Nouvelle intervention créée
 */
export const onInterventionCreated = functions
  .region('europe-west1')
  .firestore.document('establishments/{establishmentId}/interventions/{interventionId}')
  .onCreate(async (snap, context) => {
    const intervention = snap.data();
    const { establishmentId, interventionId } = context.params;

    console.log(`[Webhook Trigger] Intervention créée: ${interventionId}`);

    await triggerWebhooksForEvent(establishmentId, 'intervention.created', {
      id: interventionId,
      ...intervention,
      createdAt: intervention.createdAt?.toDate?.()?.toISOString(),
    });
  });

/**
 * Trigger: Intervention mise à jour
 */
export const onInterventionUpdated = functions
  .region('europe-west1')
  .firestore.document('establishments/{establishmentId}/interventions/{interventionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { establishmentId, interventionId } = context.params;

    // Vérifier les changements spécifiques
    const events: string[] = ['intervention.updated'];

    // Changement de statut
    if (before.status !== after.status) {
      events.push('intervention.status_changed');

      if (after.status === 'completed') {
        events.push('intervention.completed');
      }
    }

    // Assignation
    if (JSON.stringify(before.assignedTo) !== JSON.stringify(after.assignedTo)) {
      events.push('intervention.assigned');
    }

    console.log(
      `[Webhook Trigger] Intervention mise à jour: ${interventionId}, events: ${events.join(', ')}`
    );

    for (const eventType of events) {
      await triggerWebhooksForEvent(establishmentId, eventType, {
        id: interventionId,
        before: {
          status: before.status,
          assignedTo: before.assignedTo,
        },
        after: {
          ...after,
          createdAt: after.createdAt?.toDate?.()?.toISOString(),
          updatedAt: after.updatedAt?.toDate?.()?.toISOString(),
        },
      });
    }
  });

/**
 * Trigger: Intervention supprimée
 */
export const onInterventionDeleted = functions
  .region('europe-west1')
  .firestore.document('establishments/{establishmentId}/interventions/{interventionId}')
  .onDelete(async (snap, context) => {
    const intervention = snap.data();
    const { establishmentId, interventionId } = context.params;

    console.log(`[Webhook Trigger] Intervention supprimée: ${interventionId}`);

    await triggerWebhooksForEvent(establishmentId, 'intervention.deleted', {
      id: interventionId,
      title: intervention.title,
      reference: intervention.reference,
      deletedAt: new Date().toISOString(),
    });
  });

// ============================================================================
// PDF REPORTS GENERATION
// ============================================================================

/**
 * Interface pour les configurations de rapports
 */
interface ReportConfig {
  id: string;
  establishmentId: string;
  name: string;
  type: string;
  frequency: string;
  isActive: boolean;
  emailConfig?: {
    enabled: boolean;
    recipients: string[];
  };
}

/**
 * Cloud Function callable pour générer un rapport PDF
 */
export const generatePdfReport = functions
  .region('europe-west1')
  .runWith({ memory: '512MB', timeoutSeconds: 120 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Non authentifié');
    }

    const { establishmentId, reportConfigId, dateRange } = data;

    if (!establishmentId || !reportConfigId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'establishmentId et reportConfigId sont requis'
      );
    }

    try {
      // Récupérer la configuration du rapport
      const configDoc = await db
        .collection('establishments')
        .doc(establishmentId)
        .collection('reportConfigs')
        .doc(reportConfigId)
        .get();

      if (!configDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Configuration de rapport non trouvée');
      }

      const config = { id: configDoc.id, ...configDoc.data() } as ReportConfig;

      // Récupérer l'établissement
      const establishmentDoc = await db.collection('establishments').doc(establishmentId).get();
      const establishmentName = establishmentDoc.data()?.name || 'Établissement';

      // Récupérer les données selon le type de rapport
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reportData: Record<string, any> = {};
      const now = new Date();
      const startDate = dateRange?.start
        ? new Date(dateRange.start)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = dateRange?.end ? new Date(dateRange.end) : now;

      switch (config.type) {
        case 'interventions_summary':
        case 'interventions_detailed':
          const interventionsSnap = await db
            .collection('establishments')
            .doc(establishmentId)
            .collection('interventions')
            .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
            .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(endDate))
            .orderBy('createdAt', 'desc')
            .get();

          reportData.interventions = interventionsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
          }));

          // Calculer les statistiques
          reportData.stats = {
            total: reportData.interventions.length,
            byStatus: {} as Record<string, number>,
            byPriority: {} as Record<string, number>,
            avgResolutionTime: 0,
          };

          for (const intervention of reportData.interventions) {
            reportData.stats.byStatus[intervention.status] =
              (reportData.stats.byStatus[intervention.status] || 0) + 1;
            reportData.stats.byPriority[intervention.priority] =
              (reportData.stats.byPriority[intervention.priority] || 0) + 1;
          }
          break;

        case 'technician_performance':
          // Récupérer les interventions groupées par technicien
          const techInterventionsSnap = await db
            .collection('establishments')
            .doc(establishmentId)
            .collection('interventions')
            .where('status', '==', 'completed')
            .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
            .where('completedAt', '<=', admin.firestore.Timestamp.fromDate(endDate))
            .get();

          const techStats: Record<string, { name: string; completed: number; totalTime: number }> =
            {};

          for (const doc of techInterventionsSnap.docs) {
            const intervention = doc.data();
            for (const techId of intervention.assignedTo || []) {
              if (!techStats[techId]) {
                const techIndex = intervention.assignedTo?.indexOf(techId) || 0;
                techStats[techId] = {
                  name: intervention.assignedToNames?.[techIndex] || techId,
                  completed: 0,
                  totalTime: 0,
                };
              }
              techStats[techId].completed++;
              if (intervention.actualDuration) {
                techStats[techId].totalTime += intervention.actualDuration;
              }
            }
          }

          reportData.technicians = Object.entries(techStats).map(([id, stats]) => ({
            id,
            ...stats,
            avgTime: stats.completed > 0 ? Math.round(stats.totalTime / stats.completed) : 0,
          }));
          break;

        default:
          reportData.message = `Type de rapport "${config.type}" non implémenté`;
      }

      // Générer le contenu HTML du rapport
      const htmlContent = generateReportHtml(
        config,
        establishmentName,
        reportData,
        startDate,
        endDate
      );

      // Pour l'instant, on retourne le HTML (la génération PDF nécessite puppeteer ou une autre lib)
      // Sauvegarder le rapport généré
      const reportRef = await db
        .collection('establishments')
        .doc(establishmentId)
        .collection('generatedReports')
        .add({
          configId: reportConfigId,
          configName: config.name,
          type: config.type,
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          generatedBy: context.auth.uid,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
          status: 'completed',
          format: 'html', // Pour l'instant HTML, PDF à implémenter
          data: reportData.stats || {},
        });

      // Mettre à jour la config avec la dernière génération
      await configDoc.ref.update({
        lastGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastReportId: reportRef.id,
      });

      // Envoyer par email si configuré
      if (config.emailConfig?.enabled && config.emailConfig.recipients?.length > 0) {
        const resendApiKey = process.env.RESEND_API_KEY || functions.config().resend?.api_key;

        if (resendApiKey) {
          const resend = new Resend(resendApiKey);

          await resend.emails.send({
            from: 'GestiHotel <onboarding@resend.dev>',
            to: config.emailConfig.recipients,
            subject: `📊 Rapport "${config.name}" - ${establishmentName}`,
            html: htmlContent,
          });

          console.log(`[PDF Report] Email envoyé à ${config.emailConfig.recipients.join(', ')}`);
        }
      }

      return {
        success: true,
        reportId: reportRef.id,
        message: 'Rapport généré avec succès',
        stats: reportData.stats,
      };
    } catch (error: unknown) {
      console.error('[PDF Report] Erreur:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Générer le HTML du rapport
 */
function generateReportHtml(
  config: ReportConfig,
  establishmentName: string,
  data: any,
  startDate: Date,
  endDate: Date
): string {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
    on_hold: 'En pause',
  };

  const priorityLabels: Record<string, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente',
  };

  let statsHtml = '';
  if (data.stats) {
    const statusStats = Object.entries(data.stats.byStatus || {})
      .map(
        ([status, count]) => `<li>${statusLabels[status] || status}: <strong>${count}</strong></li>`
      )
      .join('');

    const priorityStats = Object.entries(data.stats.byPriority || {})
      .map(
        ([priority, count]) =>
          `<li>${priorityLabels[priority] || priority}: <strong>${count}</strong></li>`
      )
      .join('');

    statsHtml = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0;">
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
          <h3 style="color: #15803d; margin: 0; font-size: 32px;">${data.stats.total}</h3>
          <p style="color: #166534; margin: 5px 0 0;">Total interventions</p>
        </div>
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px;">
          <h4 style="margin: 0 0 10px; color: #1e40af;">Par statut</h4>
          <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">${statusStats || '<li>-</li>'}</ul>
        </div>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px;">
          <h4 style="margin: 0 0 10px; color: #92400e;">Par priorité</h4>
          <ul style="margin: 0; padding-left: 20px; color: #78350f;">${priorityStats || '<li>-</li>'}</ul>
        </div>
      </div>
    `;
  }

  let technicianHtml = '';
  if (data.technicians?.length > 0) {
    const techRows = data.technicians
      .sort((a: any, b: any) => b.completed - a.completed)
      .map(
        (tech: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${tech.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${tech.completed}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${tech.avgTime} min</td>
        </tr>
      `
      )
      .join('');

    technicianHtml = `
      <h3 style="margin-top: 30px;">Performance des techniciens</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Technicien</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Interventions terminées</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Durée moyenne</th>
          </tr>
        </thead>
        <tbody>
          ${techRows}
        </tbody>
      </table>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rapport - ${config.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">📊 ${config.name}</h1>
    <p style="margin: 10px 0 0; opacity: 0.9;">${establishmentName}</p>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="color: #6b7280; margin-top: 0;">
      Période : <strong>${formatDate(startDate)}</strong> au <strong>${formatDate(endDate)}</strong>
    </p>

    ${statsHtml}
    ${technicianHtml}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-bottom: 0;">
      Rapport généré automatiquement par GestiHotel le ${formatDate(new Date())}
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Cloud Function planifiée pour générer les rapports programmés
 */
export const processScheduledReports = functions
  .region('europe-west1')
  .pubsub.schedule('0 6 * * *') // Tous les jours à 6h
  .timeZone('Europe/Paris')
  .onRun(async () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Dimanche
    const dayOfMonth = now.getDate();

    console.log(`[Scheduled Reports] Vérification des rapports programmés`);

    let totalGenerated = 0;

    try {
      // Récupérer tous les établissements
      const establishmentsSnap = await db.collection('establishments').get();

      for (const estDoc of establishmentsSnap.docs) {
        const establishmentId = estDoc.id;

        // Récupérer les configurations de rapports actives
        const configsSnap = await db
          .collection('establishments')
          .doc(establishmentId)
          .collection('reportConfigs')
          .where('isActive', '==', true)
          .get();

        for (const configDoc of configsSnap.docs) {
          const config = configDoc.data();

          // Vérifier si le rapport doit être généré aujourd'hui
          let shouldGenerate = false;

          switch (config.frequency) {
            case 'daily':
              shouldGenerate = true;
              break;
            case 'weekly':
              // Générer le lundi (1)
              shouldGenerate = dayOfWeek === 1;
              break;
            case 'monthly':
              // Générer le 1er du mois
              shouldGenerate = dayOfMonth === 1;
              break;
          }

          if (shouldGenerate) {
            console.log(`[Scheduled Reports] Génération du rapport "${config.name}"`);

            // Calculer la période
            let startDate: Date;
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() - 1); // Jusqu'à hier

            switch (config.frequency) {
              case 'daily':
                startDate = new Date(endDate);
                break;
              case 'weekly':
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 7);
                break;
              case 'monthly':
                startDate = new Date(endDate);
                startDate.setMonth(startDate.getMonth() - 1);
                break;
              default:
                startDate = new Date(endDate);
            }

            // Simuler l'appel de génération
            // Note: Idéalement, on appellerait directement la logique de generatePdfReport
            try {
              // Pour l'instant, on marque juste comme traité
              await configDoc.ref.update({
                lastScheduledRun: admin.firestore.FieldValue.serverTimestamp(),
              });
              totalGenerated++;
            } catch (err: any) {
              console.error(`[Scheduled Reports] Erreur pour ${config.name}:`, err);
            }
          }
        }
      }

      console.log(`[Scheduled Reports] ${totalGenerated} rapports traités`);
      return { success: true, generated: totalGenerated };
    } catch (error: unknown) {
      console.error('[Scheduled Reports] Erreur globale:', error);
      return { success: false, error: error.message };
    }
  });

// ============================================================================
// GOOGLE CALENDAR INTEGRATION
// ============================================================================

/**
 * Cloud Function pour gérer le callback OAuth Google Calendar
 */
export const googleCalendarCallback = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        // Récupérer le code d'autorisation et le state
        const { code, state } = req.query;

        if (!code || typeof code !== 'string') {
          res.status(400).json({ error: "Code d'autorisation manquant" });
          return;
        }

        // Décoder le state pour récupérer userId
        let userId: string;

        if (state && typeof state === 'string') {
          try {
            const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
            userId = stateData.userId;
          } catch (error) {
            console.error('Erreur décodage state:', error);
            res.status(400).json({ error: 'State invalide' });
            return;
          }
        } else {
          res.status(400).json({ error: 'State manquant' });
          return;
        }

        // Vérifier que l'utilisateur existe
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
          res.status(404).json({ error: 'Utilisateur non trouvé' });
          return;
        }

        // Configuration OAuth Google
        const config = functions.config();
        const clientId = config.google?.client_id || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = config.google?.client_secret || process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = config.google?.redirect_uri || process.env.GOOGLE_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
          res.status(500).json({
            error: 'Configuration Google OAuth manquante',
          });
          return;
        }

        // Échanger le code contre des tokens
        // Note: En production, il faudrait utiliser la bibliothèque googleapis côté serveur
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          console.error('Erreur échange token:', errorData);
          res.status(500).json({ error: "Échec de l'échange de tokens" });
          return;
        }

        const tokens = await tokenResponse.json();

        // Stocker les tokens dans Firestore
        await db
          .collection('users')
          .doc(userId)
          .update({
            googleCalendarTokens: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              scope: tokens.scope,
              token_type: tokens.token_type,
              expiry_date: Date.now() + tokens.expires_in * 1000,
            },
            googleCalendarSyncEnabled: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        console.log(`Google Calendar connecté pour user ${userId}`);

        // Rediriger vers l'application avec succès
        const appUrl = config.app?.url || process.env.APP_URL || 'http://localhost:5173';
        res.redirect(
          `${appUrl}/app/settings/integrations?google_calendar=success&tab=google-calendar`
        );
      } catch (error) {
        console.error('Erreur googleCalendarCallback:', error);
        res.status(500).json({
          error: 'Erreur serveur',
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    });
  });

/**
 * Cloud Function pour déconnecter Google Calendar
 */
export const disconnectGoogleCalendar = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Non authentifié');
    }

    const userId = context.auth.uid;

    try {
      // Supprimer les tokens Google Calendar
      await db.collection('users').doc(userId).update({
        googleCalendarTokens: admin.firestore.FieldValue.delete(),
        googleCalendarSyncEnabled: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Google Calendar déconnecté pour user ${userId}`);

      return {
        success: true,
        message: 'Google Calendar déconnecté avec succès',
      };
    } catch (error) {
      console.error('Erreur disconnectGoogleCalendar:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Erreur lors de la déconnexion'
      );
    }
  });

/**
 * Cloud Function pour synchroniser une intervention avec Google Calendar
 */
export const syncInterventionToGoogleCalendar = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Non authentifié');
    }

    const { interventionId, establishmentId } = data;

    if (!interventionId || !establishmentId) {
      throw new functions.https.HttpsError('invalid-argument', 'Paramètres manquants');
    }

    const userId = context.auth.uid;

    try {
      // Récupérer l'utilisateur
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.googleCalendarTokens || !userData?.googleCalendarSyncEnabled) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Google Calendar non configuré'
        );
      }

      // Récupérer l'intervention
      const interventionDoc = await db
        .collection('establishments')
        .doc(establishmentId)
        .collection('interventions')
        .doc(interventionId)
        .get();

      if (!interventionDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Intervention non trouvée');
      }

      const intervention = interventionDoc.data();

      // Vérifier si le token a expiré
      const tokens = userData.googleCalendarTokens;
      const now = Date.now();
      const expiryWithMargin = (tokens.expiry_date || 0) - 5 * 60 * 1000;

      let accessToken = tokens.access_token;

      // Rafraîchir le token si nécessaire
      if (now >= expiryWithMargin && tokens.refresh_token) {
        const config = functions.config();
        const clientId = config.google?.client_id || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = config.google?.client_secret || process.env.GOOGLE_CLIENT_SECRET;

        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            refresh_token: tokens.refresh_token,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
          }),
        });

        const newTokens = await refreshResponse.json();
        accessToken = newTokens.access_token;

        // Mettre à jour les tokens
        await db
          .collection('users')
          .doc(userId)
          .update({
            'googleCalendarTokens.access_token': accessToken,
            'googleCalendarTokens.expiry_date': Date.now() + newTokens.expires_in * 1000,
          });
      }

      // Créer l'événement Google Calendar
      const startTime = intervention.scheduledAt?.toDate() || intervention.createdAt.toDate();
      const durationMinutes = intervention.estimatedDuration || 60;
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

      const event = {
        summary: `[${intervention.priority.toUpperCase()}] ${intervention.title}`,
        description: buildInterventionDescription(intervention, interventionId, establishmentId),
        location: buildInterventionLocation(intervention),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Europe/Paris',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Europe/Paris',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      // Appeler l'API Google Calendar
      const calendarResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!calendarResponse.ok) {
        const errorData = await calendarResponse.json();
        console.error('Erreur création événement:', errorData);
        throw new functions.https.HttpsError('internal', "Échec de création de l'événement");
      }

      const calendarEvent = await calendarResponse.json();

      // Mettre à jour l'intervention avec l'ID de l'événement Google
      await db
        .collection('establishments')
        .doc(establishmentId)
        .collection('interventions')
        .doc(interventionId)
        .update({
          googleCalendarEventId: calendarEvent.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(
        `Intervention ${interventionId} synchronisée avec Google Calendar (event: ${calendarEvent.id})`
      );

      return {
        success: true,
        eventId: calendarEvent.id,
        message: 'Intervention synchronisée avec Google Calendar',
      };
    } catch (error) {
      console.error('Erreur syncInterventionToGoogleCalendar:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Erreur lors de la synchronisation'
      );
    }
  });

/**
 * Fonction helper pour construire la description de l'événement
 */
function buildInterventionDescription(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intervention: any,
  interventionId: string,
  _establishmentId: string
): string {
  const lines: string[] = [
    `📋 ${intervention.description}`,
    '',
    `🏷️ Type: ${intervention.type}`,
    `📂 Catégorie: ${intervention.category}`,
    `⚡ Priorité: ${intervention.priority}`,
    `📊 Statut: ${intervention.status}`,
  ];

  if (intervention.roomNumber) {
    lines.push(`🚪 Chambre: ${intervention.roomNumber}`);
  }

  if (intervention.assignedToNames?.length) {
    lines.push(`👤 Assigné à: ${intervention.assignedToNames.join(', ')}`);
  }

  if (intervention.estimatedDuration) {
    lines.push(`⏱️ Durée estimée: ${intervention.estimatedDuration} minutes`);
  }

  if (intervention.internalNotes) {
    lines.push('', `📝 Notes: ${intervention.internalNotes}`);
  }

  // Ajouter un lien vers l'intervention
  const config = functions.config();
  const appUrl = config.app?.url || process.env.APP_URL || 'http://localhost:5173';
  lines.push('', `🔗 Voir l'intervention: ${appUrl}/app/interventions/${interventionId}`);

  return lines.join('\n');
}

/**
 * Fonction helper pour construire la localisation de l'événement
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildInterventionLocation(intervention: any): string {
  const parts: string[] = [];

  if (intervention.building) {
    parts.push(intervention.building);
  }

  if (intervention.floor !== undefined) {
    parts.push(`Étage ${intervention.floor}`);
  }

  if (intervention.roomNumber) {
    parts.push(`Chambre ${intervention.roomNumber}`);
  }

  if (intervention.location) {
    parts.push(intervention.location);
  }

  return parts.join(', ') || 'Non spécifié';
}

// ============================================================================
// SMS NOTIFICATIONS (TWILIO)
// ============================================================================

// Exporter la fonction SMS depuis le module séparé
export { sendSMS } from './sms';
