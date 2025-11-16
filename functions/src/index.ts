/**
 * Firebase Cloud Functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Configure CORS
const corsHandler = cors({ origin: true });

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
            error: 'Clé API Resend non configurée. Utilisez: firebase functions:config:set resend.api_key="votre_cle"'
          });
          return;
        }

        // Initialiser Resend
        const resend = new Resend(resendApiKey);

      // Calculer le total
      const total = data.parts.reduce(
        (sum, part) => sum + part.quantity * part.unitPrice,
        0
      );

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
      ${data.interventionNumber ? `
      <div class="info-row">
        <span class="info-label">N° Intervention :</span>
        <span>${data.interventionNumber}</span>
      </div>
      ` : ''}
      ${data.roomNumber ? `
      <div class="info-row">
        <span class="info-label">Chambre :</span>
        <span>${data.roomNumber}</span>
      </div>
      ` : ''}
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
            (part) => `
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
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        res.status(500).json({
          error: `Impossible d'envoyer l'email: ${error.message}`
        });
      }
    });
  });
