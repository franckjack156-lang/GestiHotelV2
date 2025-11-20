/**
 * ============================================================================
 * MIGRATION: Convertir les labels de bâtiment en values
 * ============================================================================
 *
 * Ce script migre les interventions qui stockent le LABEL du bâtiment
 * (ex: "Sud") vers la VALUE technique (ex: "sud")
 *
 * Exécution: Lancer depuis la console du navigateur ou via un endpoint admin
 */

import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../src/core/config/firebase';

interface MigrationOptions {
  establishmentId: string;
  buildings: Array<{ value: string; label: string }>;
  dryRun?: boolean; // Si true, affiche les changements sans les appliquer
}

export const migrateBuildingLabelsToValues = async (options: MigrationOptions) => {
  const { establishmentId, buildings, dryRun = false } = options;

  console.log('🔄 Migration des bâtiments : labels → values');
  console.log(`📍 Établissement: ${establishmentId}`);
  console.log(`🏗️ ${buildings.length} bâtiments dans la liste`);
  console.log(`🧪 Mode: ${dryRun ? 'DRY RUN (simulation)' : 'PRODUCTION'}`);
  console.log('');

  // Créer un mapping label → value (insensible à la casse)
  const labelToValue = new Map<string, string>();
  buildings.forEach(building => {
    labelToValue.set(building.label.toLowerCase(), building.value);
  });

  console.log('📋 Mapping des bâtiments:');
  labelToValue.forEach((value, label) => {
    console.log(`  "${label}" → "${value}"`);
  });
  console.log('');

  // Charger toutes les interventions
  const interventionsRef = collection(db, 'interventions');
  const snapshot = await getDocs(interventionsRef);

  console.log(`📊 ${snapshot.size} interventions trouvées`);
  console.log('');

  const toUpdate: Array<{ id: string; oldValue: string; newValue: string }> = [];

  snapshot.docs.forEach(docSnapshot => {
    const data = docSnapshot.data();
    const building = data.building;

    if (building && typeof building === 'string') {
      // Vérifier si c'est un label qui doit être converti
      const normalizedBuilding = building.toLowerCase();
      const targetValue = labelToValue.get(normalizedBuilding);

      if (targetValue && targetValue !== building) {
        toUpdate.push({
          id: docSnapshot.id,
          oldValue: building,
          newValue: targetValue,
        });
      }
    }
  });

  console.log(`🎯 ${toUpdate.length} interventions à migrer:`);
  console.log('');

  // Grouper par changement
  const changeGroups = new Map<string, number>();
  toUpdate.forEach(item => {
    const key = `${item.oldValue} → ${item.newValue}`;
    changeGroups.set(key, (changeGroups.get(key) || 0) + 1);
  });

  changeGroups.forEach((count, change) => {
    console.log(`  ${change} (${count} intervention${count > 1 ? 's' : ''})`);
  });
  console.log('');

  if (toUpdate.length === 0) {
    console.log('✅ Aucune migration nécessaire');
    return { migrated: 0, errors: [] };
  }

  if (dryRun) {
    console.log('🧪 DRY RUN - Aucune modification appliquée');
    return { migrated: 0, errors: [], wouldMigrate: toUpdate.length };
  }

  // Appliquer les mises à jour par batch (max 500/batch)
  const BATCH_SIZE = 500;
  const errors: Array<{ id: string; error: string }> = [];
  let migrated = 0;

  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const batchItems = toUpdate.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const item of batchItems) {
      try {
        const interventionRef = doc(db, 'interventions', item.id);
        batch.update(interventionRef, {
          building: item.newValue,
          updatedAt: new Date(),
        });
        migrated++;
      } catch (err) {
        errors.push({
          id: item.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    await batch.commit();
    console.log(
      `✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} committé (${batchItems.length} interventions)`
    );
  }

  console.log('');
  console.log(`✅ Migration terminée: ${migrated} interventions migrées`);
  if (errors.length > 0) {
    console.log(`⚠️ ${errors.length} erreurs:`);
    errors.forEach(err => console.log(`  - ${err.id}: ${err.error}`));
  }

  return { migrated, errors };
};

// Exemple d'utilisation dans la console:
/*
import { migrateBuildingLabelsToValues } from './scripts/migrate-building-labels-to-values';

// 1. DRY RUN pour voir ce qui serait changé
await migrateBuildingLabelsToValues({
  establishmentId: 'votre-id',
  buildings: [
    { value: 'sud', label: 'Sud' },
    { value: 'nord', label: 'Nord' },
    // ...
  ],
  dryRun: true
});

// 2. Appliquer la migration
await migrateBuildingLabelsToValues({
  establishmentId: 'votre-id',
  buildings: [
    { value: 'sud', label: 'Sud' },
    { value: 'nord', label: 'Nord' },
  ],
  dryRun: false
});
*/
