/**
 * Utility to enrich interventions with user names
 *
 * For interventions that don't have assignedToName or createdByName
 * (created before the migration), fetch the names from the users collection
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type { Intervention } from '../types/intervention.types';

/**
 * Enrichir une intervention avec les noms des utilisateurs
 */
export const enrichIntervention = async (intervention: Intervention): Promise<Intervention> => {
  const enriched = { ...intervention };

  // Enrichir createdByName si manquant
  if (!enriched.createdByName && enriched.createdBy) {
    try {
      const userDoc = await getDoc(doc(db, 'users', enriched.createdBy));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        enriched.createdByName = userData.displayName || userData.email || 'Inconnu';
      } else {
        enriched.createdByName = 'Inconnu';
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération nom créateur:', error);
      enriched.createdByName = 'Inconnu';
    }
  }

  // Enrichir assignedToName si manquant
  if (!enriched.assignedToName && enriched.assignedTo) {
    try {
      const userDoc = await getDoc(doc(db, 'users', enriched.assignedTo));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        enriched.assignedToName = userData.displayName || userData.email || 'Inconnu';
      } else {
        enriched.assignedToName = 'Inconnu';
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération nom technicien:', error);
      enriched.assignedToName = 'Inconnu';
    }
  }

  return enriched;
};

/**
 * Enrichir un tableau d'interventions
 */
export const enrichInterventions = async (
  interventions: Intervention[]
): Promise<Intervention[]> => {
  // Créer un cache des utilisateurs pour éviter de multiples appels
  const userCache = new Map<string, string>();

  const enriched = await Promise.all(
    interventions.map(async intervention => {
      const enrichedIntervention = { ...intervention };

      // Enrichir createdByName si manquant
      if (!enrichedIntervention.createdByName && enrichedIntervention.createdBy) {
        // Vérifier que createdBy est bien une string
        const createdById =
          typeof enrichedIntervention.createdBy === 'string'
            ? enrichedIntervention.createdBy
            : String(enrichedIntervention.createdBy);

        if (userCache.has(createdById)) {
          enrichedIntervention.createdByName = userCache.get(createdById)!;
        } else {
          try {
            const userDoc = await getDoc(doc(db, 'users', createdById));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const name = userData.displayName || userData.email || 'Inconnu';
              userCache.set(createdById, name);
              enrichedIntervention.createdByName = name;
            } else {
              enrichedIntervention.createdByName = 'Inconnu';
              userCache.set(createdById, 'Inconnu');
            }
          } catch (error) {
            console.warn('⚠️ Erreur récupération nom créateur:', error);
            enrichedIntervention.createdByName = 'Inconnu';
          }
        }
      }

      // Enrichir assignedToName si manquant
      if (!enrichedIntervention.assignedToName && enrichedIntervention.assignedTo) {
        // Vérifier que assignedTo est bien une string
        const assignedToId =
          typeof enrichedIntervention.assignedTo === 'string'
            ? enrichedIntervention.assignedTo
            : String(enrichedIntervention.assignedTo);

        if (userCache.has(assignedToId)) {
          enrichedIntervention.assignedToName = userCache.get(assignedToId)!;
        } else {
          try {
            const userDoc = await getDoc(doc(db, 'users', assignedToId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const name = userData.displayName || userData.email || 'Inconnu';
              userCache.set(assignedToId, name);
              enrichedIntervention.assignedToName = name;
            } else {
              enrichedIntervention.assignedToName = 'Inconnu';
              userCache.set(assignedToId, 'Inconnu');
            }
          } catch (error) {
            console.warn('⚠️ Erreur récupération nom technicien:', error);
            enrichedIntervention.assignedToName = 'Inconnu';
          }
        }
      }

      return enrichedIntervention;
    })
  );

  return enriched;
};
