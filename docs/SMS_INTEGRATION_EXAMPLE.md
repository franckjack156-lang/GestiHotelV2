# Exemple d'intégration des notifications SMS

Ce document montre comment intégrer les notifications SMS dans votre application.

## Exemple 1: Envoyer un SMS lors de la création d'une intervention urgente

```typescript
// Dans votre service d'interventions
import { sendInterventionAlert } from '@/shared/services/smsService';
import { getPreferences } from '@/shared/services/notificationService';

export const createIntervention = async (data: InterventionData) => {
  // Créer l'intervention
  const intervention = await db.collection('interventions').add(data);

  // Si l'intervention est urgente, envoyer un SMS aux techniciens disponibles
  if (data.priority === 'urgent') {
    // Récupérer les techniciens disponibles
    const technicians = await getTechniciansOnDuty();

    for (const tech of technicians) {
      // Vérifier les préférences de notification
      const prefs = await getPreferences(tech.id, data.establishmentId);

      if (prefs?.enableSMS && tech.phoneNumber) {
        await sendInterventionAlert({
          phoneNumber: tech.phoneNumber,
          intervention: {
            title: data.title,
            priority: data.priority,
            room: data.roomNumber,
            description: data.description,
          },
        });
      }
    }
  }

  return intervention;
};
```

## Exemple 2: Notification SMS lors de l'assignation d'une intervention

```typescript
import { sendInterventionAssignedAlert } from '@/shared/services/smsService';

export const assignIntervention = async (
  interventionId: string,
  technicianId: string
) => {
  // Récupérer l'intervention
  const intervention = await getIntervention(interventionId);

  // Récupérer le technicien
  const technician = await getUser(technicianId);

  // Assigner l'intervention
  await db.collection('interventions').doc(interventionId).update({
    assignedTo: technicianId,
    assignedAt: serverTimestamp(),
  });

  // Vérifier les préférences SMS
  const prefs = await getPreferences(technicianId, intervention.establishmentId);

  if (prefs?.enableSMS && technician.phoneNumber) {
    await sendInterventionAssignedAlert(
      technician.phoneNumber,
      intervention.title,
      intervention.roomNumber
    );
  }
};
```

## Exemple 3: Alerte SMS pour SLA à risque

```typescript
import { sendSLAAtRiskAlert } from '@/shared/services/smsService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const checkSLAStatus = async () => {
  // Récupérer les interventions en cours
  const interventions = await getActiveInterventions();

  for (const intervention of interventions) {
    const slaDeadline = intervention.slaDeadline.toDate();
    const now = new Date();
    const timeRemaining = slaDeadline.getTime() - now.getTime();

    // Si le SLA est dans moins de 30 minutes
    if (timeRemaining > 0 && timeRemaining < 30 * 60 * 1000) {
      // Notifier le technicien assigné
      if (intervention.assignedTo) {
        const technician = await getUser(intervention.assignedTo);
        const prefs = await getPreferences(
          intervention.assignedTo,
          intervention.establishmentId
        );

        if (prefs?.enableSMS && prefs.slaAtRisk && technician.phoneNumber) {
          const timeRemainingStr = formatDistanceToNow(slaDeadline, {
            locale: fr,
            addSuffix: true,
          });

          await sendSLAAtRiskAlert(
            technician.phoneNumber,
            intervention.title,
            timeRemainingStr
          );
        }
      }

      // Notifier les responsables
      const managers = await getManagers(intervention.establishmentId);
      for (const manager of managers) {
        const prefs = await getPreferences(manager.id, intervention.establishmentId);

        if (prefs?.enableSMS && prefs.slaAtRisk && manager.phoneNumber) {
          const timeRemainingStr = formatDistanceToNow(slaDeadline, {
            locale: fr,
            addSuffix: true,
          });

          await sendSLAAtRiskAlert(
            manager.phoneNumber,
            intervention.title,
            timeRemainingStr
          );
        }
      }
    }
  }
};
```

## Exemple 4: Hook React personnalisé pour les notifications SMS

```typescript
// hooks/useSMSNotifications.ts
import { useState } from 'react';
import { sendSMS } from '@/shared/services/smsService';
import { useAuth } from '@/core/hooks/useAuth';
import { useEstablishment } from '@/core/hooks/useEstablishment';

export const useSMSNotifications = () => {
  const { user } = useAuth();
  const { currentEstablishment } = useEstablishment();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendNotification = async (
    phoneNumber: string,
    message: string,
    interventionId?: string
  ) => {
    if (!user || !currentEstablishment) {
      setError('Utilisateur ou établissement non défini');
      return false;
    }

    try {
      setSending(true);
      setError(null);

      const result = await sendSMS(phoneNumber, message, interventionId);

      if (!result.success) {
        setError(result.error || 'Erreur lors de l\'envoi');
        return false;
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setSending(false);
    }
  };

  return {
    sendNotification,
    sending,
    error,
  };
};

// Utilisation dans un composant
export const InterventionDetails = ({ intervention }) => {
  const { sendNotification, sending } = useSMSNotifications();

  const handleSendSMS = async () => {
    if (intervention.assignedTo?.phoneNumber) {
      await sendNotification(
        intervention.assignedTo.phoneNumber,
        `Rappel: Intervention "${intervention.title}" en cours`,
        intervention.id
      );
    }
  };

  return (
    <button onClick={handleSendSMS} disabled={sending}>
      {sending ? 'Envoi...' : 'Envoyer un rappel SMS'}
    </button>
  );
};
```

## Exemple 5: Fonction Cloud Trigger pour les SMS automatiques

```typescript
// Dans functions/src/index.ts ou functions/src/triggers.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Trigger Firestore: Envoyer un SMS quand une intervention urgente est créée
 */
export const onUrgentInterventionCreated = functions
  .region('europe-west1')
  .firestore.document('interventions/{interventionId}')
  .onCreate(async (snap, context) => {
    const intervention = snap.data();

    // Vérifier si c'est une intervention urgente
    if (intervention.priority !== 'urgent') {
      return null;
    }

    console.log(`[SMS Trigger] Intervention urgente créée: ${snap.id}`);

    try {
      // Récupérer les techniciens de garde
      const techniciansSnapshot = await admin
        .firestore()
        .collection('users')
        .where('establishmentId', '==', intervention.establishmentId)
        .where('role', '==', 'technician')
        .where('onDuty', '==', true)
        .get();

      for (const techDoc of techniciansSnapshot.docs) {
        const tech = techDoc.data();

        // Vérifier les préférences SMS
        const prefsDoc = await admin
          .firestore()
          .collection('notificationPreferences')
          .doc(`${techDoc.id}_${intervention.establishmentId}`)
          .get();

        const prefs = prefsDoc.data();

        if (prefs?.enableSMS && prefs?.interventionUrgent && tech.phoneNumber) {
          // Utiliser la fonction sendSMS
          const config = functions.config();
          const twilio = require('twilio')(
            config.twilio?.account_sid,
            config.twilio?.auth_token
          );

          const message = `🚨 URGENT - ${intervention.title}${intervention.roomNumber ? `\nChambre: ${intervention.roomNumber}` : ''}\nAction immediate requise!`;

          await twilio.messages.create({
            body: message,
            from: config.twilio?.phone_number,
            to: tech.phoneNumber,
          });

          console.log(`[SMS Trigger] SMS envoyé à ${tech.phoneNumber}`);

          // Logger dans Firestore
          await admin.firestore().collection('smsLogs').add({
            userId: techDoc.id,
            to: tech.phoneNumber,
            message: message,
            interventionId: snap.id,
            type: 'urgent_intervention',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    } catch (error: any) {
      console.error('[SMS Trigger] Erreur:', error);
    }

    return null;
  });
```

## Exemple 6: Scheduled Function pour les rappels quotidiens

```typescript
// Envoyer un SMS quotidien avec le résumé des interventions en cours

export const sendDailySummary = functions
  .region('europe-west1')
  .pubsub.schedule('0 8 * * *') // Tous les jours à 8h
  .timeZone('Europe/Paris')
  .onRun(async (context) => {
    console.log('[SMS Daily] Envoi du résumé quotidien');

    try {
      const db = admin.firestore();

      // Récupérer tous les établissements
      const establishmentsSnapshot = await db.collection('establishments').get();

      for (const estDoc of establishmentsSnapshot.docs) {
        const establishment = estDoc.data();

        // Récupérer les interventions en cours
        const interventionsSnapshot = await db
          .collection('interventions')
          .where('establishmentId', '==', estDoc.id)
          .where('status', 'in', ['pending', 'in_progress'])
          .get();

        if (interventionsSnapshot.empty) continue;

        // Récupérer les managers
        const managersSnapshot = await db
          .collection('users')
          .where('establishmentId', '==', estDoc.id)
          .where('role', 'in', ['manager', 'admin'])
          .get();

        for (const managerDoc of managersSnapshot.docs) {
          const manager = managerDoc.data();

          // Vérifier les préférences
          const prefsDoc = await db
            .collection('notificationPreferences')
            .doc(`${managerDoc.id}_${estDoc.id}`)
            .get();

          const prefs = prefsDoc.data();

          if (prefs?.enableSMS && manager.phoneNumber) {
            // Construire le message
            const pending = interventionsSnapshot.docs.filter(
              (d) => d.data().status === 'pending'
            ).length;
            const inProgress = interventionsSnapshot.docs.filter(
              (d) => d.data().status === 'in_progress'
            ).length;

            const message = `📊 Résumé ${establishment.name}\n${pending} en attente\n${inProgress} en cours\nTotal: ${interventionsSnapshot.size}`;

            const config = functions.config();
            const twilio = require('twilio')(
              config.twilio?.account_sid,
              config.twilio?.auth_token
            );

            await twilio.messages.create({
              body: message,
              from: config.twilio?.phone_number,
              to: manager.phoneNumber,
            });

            console.log(`[SMS Daily] Résumé envoyé à ${manager.phoneNumber}`);
          }
        }
      }
    } catch (error: any) {
      console.error('[SMS Daily] Erreur:', error);
    }

    return null;
  });
```

## Bonnes pratiques

1. **Toujours vérifier les préférences** avant d'envoyer un SMS
2. **Limiter les SMS** aux notifications vraiment importantes (urgentes, critiques)
3. **Respecter les heures calmes** configurées par l'utilisateur
4. **Logger tous les SMS** pour le suivi et la facturation
5. **Gérer les erreurs** gracieusement (numéro invalide, quota dépassé, etc.)
6. **Tester avec des numéros vérifiés** en mode trial
7. **Monitorer les coûts** via les logs Twilio et Firestore

## Tests

```typescript
// test/smsService.test.ts
import { isValidPhoneNumber, formatPhoneNumber, countSMSParts } from '@/shared/services/smsService';

describe('SMS Service', () => {
  describe('isValidPhoneNumber', () => {
    it('should validate international phone numbers', () => {
      expect(isValidPhoneNumber('+33612345678')).toBe(true);
      expect(isValidPhoneNumber('+14155551234')).toBe(true);
      expect(isValidPhoneNumber('0612345678')).toBe(false);
      expect(isValidPhoneNumber('+3361234')).toBe(false);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format French phone numbers', () => {
      expect(formatPhoneNumber('0612345678', '+33')).toBe('+33612345678');
    });
  });

  describe('countSMSParts', () => {
    it('should count SMS parts correctly', () => {
      expect(countSMSParts('Hello')).toBe(1);
      expect(countSMSParts('a'.repeat(160))).toBe(1);
      expect(countSMSParts('a'.repeat(161))).toBe(2);
    });
  });
});
```
