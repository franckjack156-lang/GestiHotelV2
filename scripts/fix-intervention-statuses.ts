/**
 * ============================================================================
 * MIGRATION: Compléter la liste des statuts d'intervention
 * ============================================================================
 *
 * Ce script ajoute les statuts manquants à la liste interventionStatuses
 * pour s'assurer que tous les 8 statuts sont présents avec leurs couleurs
 *
 * Exécution: À lancer depuis la console du navigateur
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../src/core/config/firebase';
import type { ListConfig, ReferenceItem } from '../src/shared/types/reference-lists.types';

interface MigrationOptions {
  establishmentId: string;
  dryRun?: boolean;
}

const createItem = (
  value: string,
  label: string,
  order: number,
  options?: {
    color?: string;
    icon?: string;
    description?: string;
  }
): ReferenceItem => {
  const item: ReferenceItem = {
    id: `${value}_${Date.now()}_${order}`,
    value,
    label,
    order,
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
  };

  if (options?.color) item.color = options.color;
  if (options?.icon) item.icon = options.icon;
  if (options?.description) item.description = options.description;

  return item;
};

// Tous les statuts qui doivent être présents
// Couleurs autorisées: gray, red, orange, yellow, green, blue, indigo, purple, pink
const REQUIRED_STATUSES = [
  createItem('draft', 'Brouillon', 1, { color: 'gray', icon: 'FileEdit' }),
  createItem('pending', 'En attente', 2, { color: 'yellow', icon: 'Clock' }),
  createItem('assigned', 'Assignée', 3, { color: 'blue', icon: 'UserCheck' }),
  createItem('in_progress', 'En cours', 4, { color: 'indigo', icon: 'PlayCircle' }),
  createItem('on_hold', 'En pause', 5, { color: 'orange', icon: 'PauseCircle' }),
  createItem('completed', 'Terminée', 6, { color: 'green', icon: 'CheckCircle' }),
  createItem('validated', 'Validée', 7, { color: 'purple', icon: 'CheckCheck' }),
  createItem('cancelled', 'Annulée', 8, { color: 'red', icon: 'XCircle' }),
];

export const fixInterventionStatuses = async (options: MigrationOptions) => {
  const { establishmentId, dryRun = false } = options;

  console.log('🔄 Migration : Compléter les statuts d\'intervention');
  console.log(`📍 Établissement: ${establishmentId}`);
  console.log(`🧪 Mode: ${dryRun ? 'DRY RUN (simulation)' : 'PRODUCTION'}`);
  console.log('');

  try {
    // Charger la liste actuelle
    const listsRef = doc(db, 'reference_lists', establishmentId);
    const listsDoc = await getDoc(listsRef);

    if (!listsDoc.exists()) {
      console.error('❌ Document reference_lists introuvable pour cet établissement');
      return { success: false, error: 'Document not found' };
    }

    const data = listsDoc.data();
    const interventionStatuses = data?.lists?.interventionStatuses as ListConfig | undefined;

    if (!interventionStatuses) {
      console.error('❌ Liste interventionStatuses introuvable');
      return { success: false, error: 'interventionStatuses list not found' };
    }

    console.log(`📊 Statuts actuels: ${interventionStatuses.items?.length || 0}`);
    console.log('');

    // Vérifier quels statuts manquent
    const existingValues = new Set(interventionStatuses.items?.map(item => item.value) || []);
    const missingStatuses = REQUIRED_STATUSES.filter(status => !existingValues.has(status.value));

    console.log('📋 Statuts existants:');
    interventionStatuses.items?.forEach(item => {
      console.log(`  ✅ ${item.value}: ${item.label} (${item.color || 'pas de couleur'})`);
    });
    console.log('');

    if (missingStatuses.length === 0) {
      console.log('✅ Tous les statuts sont déjà présents !');
      return { success: true, added: 0, existing: interventionStatuses.items?.length || 0 };
    }

    console.log(`🎯 ${missingStatuses.length} statuts manquants:`);
    missingStatuses.forEach(status => {
      console.log(`  ➕ ${status.value}: ${status.label} (${status.color})`);
    });
    console.log('');

    if (dryRun) {
      console.log('🧪 DRY RUN - Aucune modification appliquée');
      return { success: true, added: 0, wouldAdd: missingStatuses.length };
    }

    // Ajouter les statuts manquants
    const updatedItems = [...(interventionStatuses.items || []), ...missingStatuses];

    // Réorganiser par ordre
    updatedItems.sort((a, b) => a.order - b.order);

    await updateDoc(listsRef, {
      'lists.interventionStatuses.items': updatedItems,
      'lists.interventionStatuses.updatedAt': new Date(),
    });

    console.log(`✅ Migration terminée: ${missingStatuses.length} statuts ajoutés`);
    console.log(`📊 Total: ${updatedItems.length} statuts`);

    return {
      success: true,
      added: missingStatuses.length,
      total: updatedItems.length,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Exemple d'utilisation dans la console:
/*
import { fixInterventionStatuses } from './scripts/fix-intervention-statuses';

// 1. DRY RUN pour voir ce qui serait ajouté
await fixInterventionStatuses({
  establishmentId: 'votre-id',
  dryRun: true
});

// 2. Appliquer la migration
await fixInterventionStatuses({
  establishmentId: 'votre-id',
  dryRun: false
});
*/
