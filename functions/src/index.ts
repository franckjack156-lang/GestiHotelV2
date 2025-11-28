/**
 * Firebase Cloud Functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import cors from 'cors';

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
      } catch (error: any) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        res.status(500).json({
          error: `Impossible d'envoyer l'email: ${error.message}`,
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
      } catch (error: any) {
        console.error("Erreur lors de l'envoi de l'email d'invitation:", error);
        res.status(500).json({
          error: `Impossible d'envoyer l'email: ${error.message}`,
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

      // Vérifier que l'appelant est admin
      if (!callerData || !['admin', 'super_admin'].includes(callerData.role)) {
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

      // Empêcher la suppression du dernier super_admin
      if (userData?.role === 'super_admin') {
        const superAdmins = await admin
          .firestore()
          .collection('users')
          .where('role', '==', 'super_admin')
          .get();

        if (superAdmins.size <= 1) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Impossible de supprimer le dernier super administrateur'
          );
        }
      }

      // Supprimer l'utilisateur de Firebase Auth
      try {
        await admin.auth().deleteUser(userId);
        console.log(`Utilisateur ${userId} supprimé de Firebase Auth`);
      } catch (authError: any) {
        // Si l'utilisateur n'existe pas dans Auth, continuer quand même
        if (authError.code !== 'auth/user-not-found') {
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
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);

      // Si c'est déjà une HttpsError, la relancer
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Sinon, créer une nouvelle HttpsError
      throw new functions.https.HttpsError(
        'internal',
        `Erreur lors de la suppression: ${error.message}`
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
    } catch (error: any) {
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

    if (!callerData || !['admin', 'super_admin'].includes(callerData.role)) {
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
    } catch (error: any) {
      console.error('[Purge manuelle] Erreur:', error);
      throw new functions.https.HttpsError('internal', `Erreur lors de la purge: ${error.message}`);
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
    } catch (error: any) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      console.error('[Restore] Erreur:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Erreur lors de la restauration: ${error.message}`
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
    } catch (error: any) {
      console.error('[GetDeleted] Erreur:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Erreur lors de la récupération: ${error.message}`
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
      } catch (error: any) {
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
          error: `Impossible d'envoyer la notification: ${error.message}`,
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
    } catch (error: any) {
      console.error('[Push Bulk] Erreur:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Erreur lors de l'envoi des notifications: ${error.message}`
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('[VerifyEmail] Erreur:', error);

      if (error.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError('not-found', 'Utilisateur non trouvé');
      }

      throw new functions.https.HttpsError(
        'internal',
        `Erreur lors de l'envoi de l'email de vérification: ${error.message}`
      );
    }
  });
