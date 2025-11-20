/**
 * ============================================================================
 * UPDATE INTERVENTIONS BY REFERENCE SERVICE
 * ============================================================================
 *
 * Service pour mettre à jour en cascade les interventions quand une valeur
 * de liste de référence est modifiée
 */

import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type { ListKey } from '@/shared/types/reference-lists.types';

// ============================================================================
// TYPES
// ============================================================================

interface UpdateByReferenceOptions {
  /** ID de l'établissement */
  establishmentId: string;
  /** Clé de la liste de référence */
  listKey: ListKey;
  /** Ancienne valeur à remplacer */
  oldValue: string;
  /** Nouvelle valeur */
  newValue: string;
  /** ID de l'utilisateur effectuant la modification */
  userId: string;
}

interface UpdateByReferenceResult {
  /** Nombre d'interventions mises à jour */
  updatedCount: number;
  /** IDs des interventions mises à jour */
  updatedIds: string[];
  /** Erreurs éventuelles */
  errors: Array<{ interventionId: string; error: string }>;
}

// Mapping entre les clés de liste et les champs d'intervention
const FIELD_MAPPING: Record<ListKey, string[]> = {
  buildings: ['building'],
  floors: ['floor'],
  interventionTypes: ['type'],
  interventionPriorities: ['priority'],
  interventionCategories: ['category'],
  interventionStatuses: ['status'],
  interventionLocations: ['location'],
  equipmentTypes: ['equipmentType'],
  equipmentBrands: ['equipmentBrand'],
  equipmentLocations: ['equipmentLocation'],
  roomTypes: ['roomType'],
  roomStatuses: ['roomStatus'],
  bedTypes: ['bedType'],
  supplierCategories: ['supplierCategory'],
  supplierTypes: ['supplierType'],
  maintenanceFrequencies: ['maintenanceFrequency'],
  maintenanceTypes: ['maintenanceType'],
  documentCategories: ['documentCategory'],
  documentTypes: ['documentType'],
  expenseCategories: ['expenseCategory'],
  paymentMethods: ['paymentMethod'],
  staffDepartments: ['assignedDepartment'],
  staffRoles: ['assignedRole'],
  staffSkills: ['requiredSkills'],
  technicalSpecialties: ['technicalSpecialty'],
};

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Met à jour en cascade toutes les interventions utilisant une ancienne valeur
 * de référence pour la remplacer par une nouvelle valeur
 */
export const updateInterventionsByReferenceValue = async (
  options: UpdateByReferenceOptions
): Promise<UpdateByReferenceResult> => {
  const { establishmentId, listKey, oldValue, newValue, userId } = options;

  const result: UpdateByReferenceResult = {
    updatedCount: 0,
    updatedIds: [],
    errors: [],
  };

  // Obtenir les champs à mettre à jour pour cette liste
  const fields = FIELD_MAPPING[listKey];
  if (!fields || fields.length === 0) {
    throw new Error(`No field mapping found for list key: ${listKey}`);
  }

  try {
    const interventionsRef = collection(db, 'interventions');
    const interventionsToUpdate: Array<{ id: string; fields: string[] }> = [];

    // Rechercher toutes les interventions concernées par champ
    for (const field of fields) {
      const q = query(
        interventionsRef,
        where('establishmentId', '==', establishmentId),
        where(field, '==', oldValue)
      );

      const snapshot = await getDocs(q);

      snapshot.docs.forEach(docSnapshot => {
        const existingEntry = interventionsToUpdate.find(i => i.id === docSnapshot.id);
        if (existingEntry) {
          // Ajouter le champ à la liste si pas déjà présent
          if (!existingEntry.fields.includes(field)) {
            existingEntry.fields.push(field);
          }
        } else {
          interventionsToUpdate.push({
            id: docSnapshot.id,
            fields: [field],
          });
        }
      });
    }

    if (interventionsToUpdate.length === 0) {
      return result; // Rien à mettre à jour
    }

    // Mettre à jour par lots (max 500 opérations par batch)
    const BATCH_SIZE = 500;
    const batches = [];

    for (let i = 0; i < interventionsToUpdate.length; i += BATCH_SIZE) {
      const batchItems = interventionsToUpdate.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const item of batchItems) {
        try {
          const interventionRef = doc(db, 'interventions', item.id);
          const updateData: Record<string, unknown> = {
            updatedAt: serverTimestamp(),
            lastModifiedBy: userId,
          };

          // Mettre à jour tous les champs concernés
          for (const field of item.fields) {
            updateData[field] = newValue;
          }

          batch.update(interventionRef, updateData);

          result.updatedIds.push(item.id);
        } catch (err) {
          result.errors.push({
            interventionId: item.id,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      batches.push(batch);
    }

    // Commit tous les batches
    await Promise.all(batches.map(batch => batch.commit()));

    result.updatedCount = result.updatedIds.length;

    console.log(`✅ Updated ${result.updatedCount} interventions: ${oldValue} → ${newValue}`);

    return result;
  } catch (error) {
    console.error('Error updating interventions by reference value:', error);
    throw error;
  }
};

/**
 * Compte le nombre d'interventions utilisant une valeur de référence
 * (version optimisée sans charger les documents complets)
 */
export const countInterventionsByReferenceValue = async (
  establishmentId: string,
  listKey: ListKey,
  value: string
): Promise<number> => {
  const fields = FIELD_MAPPING[listKey];
  if (!fields || fields.length === 0) {
    console.warn(`⚠️ No field mapping for listKey: ${listKey}`);
    return 0;
  }

  console.log('🔍 Counting interventions:', {
    establishmentId,
    listKey,
    fields,
    value,
  });

  try {
    const interventionsRef = collection(db, 'interventions');
    const interventionIds = new Set<string>();

    for (const field of fields) {
      console.log(`  🔎 Querying field "${field}" with value "${value}"`);

      const q = query(
        interventionsRef,
        where('establishmentId', '==', establishmentId),
        where(field, '==', value)
      );

      const snapshot = await getDocs(q);
      console.log(`  ✅ Found ${snapshot.size} documents for field "${field}"`);

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`    📄 Doc ${doc.id}: ${field} = "${data[field]}"`);
        interventionIds.add(doc.id);
      });
    }

    console.log(`📊 Total unique interventions found: ${interventionIds.size}`);
    return interventionIds.size;
  } catch (error) {
    console.error('❌ Error counting interventions by reference value:', error);
    return 0;
  }
};
