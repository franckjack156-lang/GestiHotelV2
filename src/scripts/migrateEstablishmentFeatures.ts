/**
 * Script de migration pour les fonctionnalités des établissements
 *
 * Ce script met à jour tous les établissements existants dans Firestore
 * pour s'assurer qu'ils ont toutes les fonctionnalités définies avec les
 * valeurs par défaut correctes.
 *
 * USAGE:
 * 1. Assurez-vous d'être authentifié avec Firebase
 * 2. Exécutez: npm run migrate:features
 * 3. Ou depuis la console développeur: migrateEstablishmentFeatures()
 */

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import {
  DEFAULT_ESTABLISHMENT_FEATURES,
  FEATURES_CATALOG,
  type EstablishmentFeatures,
} from '@/shared/types/establishment.types';

interface MigrationResult {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
  details: {
    id: string;
    name: string;
    status: 'updated' | 'skipped' | 'error';
    message?: string;
  }[];
}

/**
 * Vérifie si un établissement a besoin d'une mise à jour de ses features
 */
function needsUpdate(currentFeatures: EstablishmentFeatures | undefined): boolean {
  if (!currentFeatures) return true;

  // Vérifier si toutes les features du catalogue existent
  const allFeatureKeys = FEATURES_CATALOG.map(f => f.key);
  const missingKeys = allFeatureKeys.filter(key => !(key in currentFeatures));

  return missingKeys.length > 0;
}

/**
 * Fusionne les features existantes avec les valeurs par défaut
 * en forçant l'activation des features indispensables
 */
function mergeFeatures(currentFeatures: EstablishmentFeatures | undefined): EstablishmentFeatures {
  const merged: EstablishmentFeatures = {
    ...DEFAULT_ESTABLISHMENT_FEATURES,
    ...(currentFeatures || {}),
  };

  // Forcer l'activation des fonctionnalités indispensables
  FEATURES_CATALOG.forEach(feature => {
    if (feature.isRequired) {
      merged[feature.key] = { enabled: true };
    }
  });

  return merged;
}

/**
 * Migration principale
 */
export async function migrateEstablishmentFeatures(): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  console.log('🚀 Début de la migration des fonctionnalités...\n');

  try {
    // Récupérer tous les établissements
    const establishmentsRef = collection(db, 'establishments');
    const snapshot = await getDocs(establishmentsRef);

    result.total = snapshot.size;
    console.log(`📊 ${result.total} établissement(s) trouvé(s)\n`);

    // Traiter chaque établissement
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const establishmentId = docSnapshot.id;
      const establishmentName = data.name || 'Sans nom';

      console.log(`\n🏨 Traitement: ${establishmentName} (${establishmentId})`);

      try {
        const currentFeatures = data.features as EstablishmentFeatures | undefined;

        // Vérifier si une mise à jour est nécessaire
        if (!needsUpdate(currentFeatures)) {
          console.log('   ✓ Déjà à jour, aucune modification nécessaire');
          result.skipped++;
          result.details.push({
            id: establishmentId,
            name: establishmentName,
            status: 'skipped',
            message: 'Déjà à jour',
          });
          continue;
        }

        // Fusionner avec les valeurs par défaut
        const updatedFeatures = mergeFeatures(currentFeatures);

        // Mettre à jour dans Firestore
        const docRef = doc(db, 'establishments', establishmentId);
        await updateDoc(docRef, {
          features: updatedFeatures,
          updatedAt: new Date(),
        });

        console.log('   ✅ Mise à jour réussie');
        console.log(`   📝 ${Object.keys(updatedFeatures).length} fonctionnalités configurées`);

        result.updated++;
        result.details.push({
          id: establishmentId,
          name: establishmentName,
          status: 'updated',
          message: 'Features mises à jour avec succès',
        });
      } catch (error: any) {
        console.error(`   ❌ Erreur: ${error.message}`);
        result.errors++;
        result.details.push({
          id: establishmentId,
          name: establishmentName,
          status: 'error',
          message: error.message,
        });
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📋 RÉSUMÉ DE LA MIGRATION');
    console.log('='.repeat(60));
    console.log(`✅ Total traité:        ${result.total}`);
    console.log(`✅ Mis à jour:          ${result.updated}`);
    console.log(`⏭️  Déjà à jour:         ${result.skipped}`);
    console.log(`❌ Erreurs:             ${result.errors}`);
    console.log('='.repeat(60) + '\n');

    if (result.errors > 0) {
      console.log('⚠️  Détails des erreurs:');
      result.details
        .filter(d => d.status === 'error')
        .forEach(detail => {
          console.log(`   • ${detail.name}: ${detail.message}`);
        });
      console.log('');
    }

    return result;
  } catch (error: any) {
    console.error('❌ Erreur fatale lors de la migration:', error);
    throw error;
  }
}

/**
 * Prévisualisation de la migration (dry-run)
 * Ne modifie pas les données, affiche seulement ce qui serait fait
 */
export async function previewMigration(): Promise<void> {
  console.log('🔍 MODE PRÉVISUALISATION - Aucune modification ne sera effectuée\n');

  try {
    const establishmentsRef = collection(db, 'establishments');
    const snapshot = await getDocs(establishmentsRef);

    console.log(`📊 ${snapshot.size} établissement(s) trouvé(s)\n`);

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const establishmentName = data.name || 'Sans nom';
      const currentFeatures = data.features as EstablishmentFeatures | undefined;

      console.log(`\n🏨 ${establishmentName} (${docSnapshot.id})`);

      if (!currentFeatures) {
        console.log('   ⚠️  Aucune feature configurée');
        console.log('   → Toutes les features par défaut seraient ajoutées');
        continue;
      }

      const allFeatureKeys = FEATURES_CATALOG.map(f => f.key);
      const existingKeys = Object.keys(currentFeatures);
      const missingKeys = allFeatureKeys.filter(key => !existingKeys.includes(key));

      if (missingKeys.length === 0) {
        console.log('   ✓ Toutes les features sont présentes');
      } else {
        console.log(`   ⚠️  ${missingKeys.length} feature(s) manquante(s):`);
        missingKeys.forEach(key => {
          const feature = FEATURES_CATALOG.find(f => f.key === key);
          const defaultValue = DEFAULT_ESTABLISHMENT_FEATURES[key];
          console.log(
            `      • ${feature?.label || key}: ${defaultValue?.enabled ? '✅ activée' : '❌ désactivée'} par défaut`
          );
        });
      }

      // Vérifier les features indispensables
      const requiredFeatures = FEATURES_CATALOG.filter(f => f.isRequired);
      const disabledRequired = requiredFeatures.filter(f => !currentFeatures[f.key]?.enabled);

      if (disabledRequired.length > 0) {
        console.log(
          `   🔒 ${disabledRequired.length} feature(s) indispensable(s) seraient forcées à activée:`
        );
        disabledRequired.forEach(f => {
          console.log(`      • ${f.label}`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('ℹ️  Pour exécuter la migration réelle, utilisez: migrateEstablishmentFeatures()');
    console.log('='.repeat(60) + '\n');
  } catch (error: any) {
    console.error('❌ Erreur lors de la prévisualisation:', error);
    throw error;
  }
}

// Exporter pour utilisation dans la console
if (typeof window !== 'undefined') {
  (window as any).migrateEstablishmentFeatures = migrateEstablishmentFeatures;
  (window as any).previewMigration = previewMigration;

  console.log('✅ Scripts de migration chargés:');
  console.log('   • previewMigration() - Prévisualiser les changements');
  console.log('   • migrateEstablishmentFeatures() - Exécuter la migration');
}
