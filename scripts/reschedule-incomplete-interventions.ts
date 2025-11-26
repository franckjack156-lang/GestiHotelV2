/**
 * ============================================================================
 * SCRIPT: Décalage automatique des interventions non terminées
 * ============================================================================
 *
 * Ce script décale automatiquement au jour suivant les interventions
 * planifiées pour aujourd'hui mais non terminées.
 *
 * Critères:
 * - Intervention planifiée pour aujourd'hui (scheduledAt)
 * - Statut: pending, assigned, in_progress, on_hold (pas completed/validated/cancelled)
 * - Décale de 24h en conservant l'heure
 *
 * Utilisation:
 * - Peut être exécuté manuellement ou via une tâche cron (chaque jour à 23:00)
 * - Peut être intégré dans un Cloud Function Firebase
 *
 * Exécution depuis la console:
 * ```
 * import { rescheduleIncompleteInterventions } from './scripts/reschedule-incomplete-interventions';
 *
 * // Mode DRY RUN (simulation)
 * await rescheduleIncompleteInterventions({
 *   establishmentId: 'votre-id',
 *   dryRun: true
 * });
 *
 * // Mode PRODUCTION (applique les changements)
 * await rescheduleIncompleteInterventions({
 *   establishmentId: 'votre-id',
 *   dryRun: false
 * });
 * ```
 */

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../src/core/config/firebase';
import { startOfDay, endOfDay, addDays } from 'date-fns';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RescheduleOptions {
  establishmentId: string;
  dryRun?: boolean;
  targetDate?: Date; // Date à traiter (par défaut: aujourd'hui)
  notifyUsers?: boolean; // TODO: Implémenter notifications
}

interface RescheduleResult {
  success: boolean;
  processedCount: number;
  rescheduledCount: number;
  skippedCount: number;
  interventions: Array<{
    id: string;
    reference: string;
    title: string;
    oldDate: Date;
    newDate: Date;
    status: string;
    reason?: string;
  }>;
  error?: string;
}

// Statuts considérés comme "non terminés" (à décaler)
const INCOMPLETE_STATUSES = ['pending', 'assigned', 'in_progress', 'on_hold'];

/**
 * Décale les interventions non terminées au jour suivant
 */
export const rescheduleIncompleteInterventions = async (
  options: RescheduleOptions
): Promise<RescheduleResult> => {
  const { establishmentId, dryRun = false, targetDate = new Date() } = options;

  console.log('🔄 Script de décalage des interventions non terminées');
  console.log(`📍 Établissement: ${establishmentId}`);
  console.log(`📅 Date cible: ${format(targetDate, 'dd MMMM yyyy', { locale: fr })}`);
  console.log(`🧪 Mode: ${dryRun ? 'DRY RUN (simulation)' : 'PRODUCTION'}`);
  console.log('');

  const result: RescheduleResult = {
    success: true,
    processedCount: 0,
    rescheduledCount: 0,
    skippedCount: 0,
    interventions: [],
  };

  try {
    // 1. Définir la plage horaire pour "aujourd'hui"
    const startOfTargetDay = startOfDay(targetDate);
    const endOfTargetDay = endOfDay(targetDate);

    console.log(
      `⏰ Recherche des interventions entre ${format(startOfTargetDay, 'HH:mm')} et ${format(endOfTargetDay, 'HH:mm')}`
    );
    console.log('');

    // 2. Récupérer les interventions planifiées pour aujourd'hui
    const interventionsRef = collection(db, 'interventions');
    const q = query(
      interventionsRef,
      where('establishmentId', '==', establishmentId),
      where('scheduledAt', '>=', Timestamp.fromDate(startOfTargetDay)),
      where('scheduledAt', '<=', Timestamp.fromDate(endOfTargetDay)),
      where('status', 'in', INCOMPLETE_STATUSES)
    );

    const snapshot = await getDocs(q);

    console.log(`📊 ${snapshot.size} intervention(s) trouvée(s) à traiter`);
    console.log('');

    if (snapshot.empty) {
      console.log('✅ Aucune intervention à décaler');
      return result;
    }

    // 3. Traiter chaque intervention
    for (const docSnapshot of snapshot.docs) {
      result.processedCount++;

      const intervention = docSnapshot.data();
      const oldScheduledAt = intervention.scheduledAt.toDate();

      console.log(`\n📝 Intervention #${result.processedCount}`);
      console.log(`   ID: ${docSnapshot.id}`);
      console.log(`   Référence: ${intervention.reference || 'N/A'}`);
      console.log(`   Titre: ${intervention.title}`);
      console.log(`   Statut: ${intervention.status}`);
      console.log(`   Planifiée: ${format(oldScheduledAt, 'dd MMM yyyy à HH:mm', { locale: fr })}`);

      // Vérifier si l'intervention doit vraiment être décalée
      let shouldReschedule = true;
      let skipReason: string | undefined;

      // Ne pas décaler si déjà démarrée aujourd'hui
      if (intervention.status === 'in_progress' && intervention.startedAt) {
        const startedDate = intervention.startedAt.toDate();
        if (startedDate >= startOfTargetDay && startedDate <= endOfTargetDay) {
          shouldReschedule = false;
          skipReason = 'Intervention déjà démarrée aujourd\'hui';
        }
      }

      // Ne pas décaler si urgente/critique et pas encore traitée
      if (
        (intervention.priority === 'urgent' || intervention.priority === 'critical') &&
        intervention.status === 'pending'
      ) {
        shouldReschedule = false;
        skipReason = 'Intervention urgente/critique - nécessite validation manuelle';
      }

      if (!shouldReschedule) {
        console.log(`   ⏭️  IGNORE: ${skipReason}`);
        result.skippedCount++;
        continue;
      }

      // Calculer la nouvelle date (24h plus tard)
      const newScheduledAt = addDays(oldScheduledAt, 1);

      console.log(
        `   ➡️  Nouvelle date: ${format(newScheduledAt, 'dd MMM yyyy à HH:mm', { locale: fr })}`
      );

      result.interventions.push({
        id: docSnapshot.id,
        reference: intervention.reference || docSnapshot.id,
        title: intervention.title,
        oldDate: oldScheduledAt,
        newDate: newScheduledAt,
        status: intervention.status,
      });

      // 4. Appliquer le changement (si pas en mode DRY RUN)
      if (!dryRun) {
        try {
          const interventionRef = doc(db, 'interventions', docSnapshot.id);
          await updateDoc(interventionRef, {
            scheduledAt: Timestamp.fromDate(newScheduledAt),
            updatedAt: Timestamp.now(),
            // Ajouter une note dans l'historique
            internalNotes: intervention.internalNotes
              ? `${intervention.internalNotes}\n\n[${format(new Date(), 'dd/MM/yyyy HH:mm')}] Intervention automatiquement décalée au ${format(newScheduledAt, 'dd/MM/yyyy à HH:mm')} (non terminée le jour prévu).`
              : `[${format(new Date(), 'dd/MM/yyyy HH:mm')}] Intervention automatiquement décalée au ${format(newScheduledAt, 'dd/MM/yyyy à HH:mm')} (non terminée le jour prévu).`,
          });

          result.rescheduledCount++;
          console.log('   ✅ Décalée avec succès');
        } catch (updateError) {
          console.error(`   ❌ Erreur lors du décalage:`, updateError);
        }
      } else {
        result.rescheduledCount++;
        console.log('   🧪 [DRY RUN] Serait décalée');
      }
    }

    // 5. Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`Interventions traitées: ${result.processedCount}`);
    console.log(`Interventions décalées: ${result.rescheduledCount}`);
    console.log(`Interventions ignorées: ${result.skippedCount}`);

    if (dryRun) {
      console.log('\n🧪 DRY RUN - Aucune modification appliquée');
    } else {
      console.log('\n✅ Modifications appliquées avec succès');
    }

    return result;
  } catch (error) {
    console.error('❌ Erreur lors du traitement:', error);
    return {
      ...result,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Version Cloud Function pour Firebase
 * À déployer avec Firebase Functions
 */
export const scheduledRescheduleInterventions = async () => {
  // TODO: Récupérer tous les établissements
  // Pour l'instant, hardcoder ou passer en variable d'environnement
  const establishmentId = process.env.ESTABLISHMENT_ID;

  if (!establishmentId) {
    console.error('❌ ESTABLISHMENT_ID non défini');
    return;
  }

  return await rescheduleIncompleteInterventions({
    establishmentId,
    dryRun: false,
  });
};

/**
 * Exemple d'utilisation avec Firebase Functions + Cloud Scheduler
 *
 * Dans functions/src/index.ts:
 *
 * import { scheduledRescheduleInterventions } from './reschedule-incomplete-interventions';
 * import * as functions from 'firebase-functions';
 *
 * // S'exécute tous les jours à 23:00 (heure de Paris)
 * export const dailyReschedule = functions
 *   .region('europe-west1')
 *   .pubsub
 *   .schedule('0 23 * * *')
 *   .timeZone('Europe/Paris')
 *   .onRun(async (context) => {
 *     await scheduledRescheduleInterventions();
 *   });
 */
