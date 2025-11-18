/**
 * ============================================================================
 * TEST LOGGING REFERENCE LISTS
 * ============================================================================
 *
 * Fichier de test pour vérifier les fonctions de logging
 * Utilisation dans la console du navigateur :
 *
 * import { testLogging } from '@/shared/services/testReferenceListsLogging'
 * testLogging('your-establishment-id')
 */

import referenceListsService from './referenceListsService';

/**
 * Tester les fonctions de logging avec un establishment ID
 */
export const testLogging = async (establishmentId: string) => {
  console.log('🧪 ========================================');
  console.log('🧪 TEST DES FONCTIONS DE LOGGING');
  console.log('🧪 ========================================\n');

  console.log(`📋 Testing avec l'établissement: ${establishmentId}\n`);

  // Test 1: Log compact
  console.log('📝 TEST 1: Log Compact');
  console.log('------------------------------------------');
  await referenceListsService.logListsCompact(establishmentId);
  console.log('\n');

  // Test 2: Log détaillé
  console.log('📝 TEST 2: Log Détaillé');
  console.log('------------------------------------------');
  await referenceListsService.logListsSummary(establishmentId);
  console.log('\n');

  console.log('🧪 ========================================');
  console.log('✅ Tests terminés !');
  console.log('🧪 ========================================\n');
};

/**
 * Exposer les fonctions dans window pour faciliter l'accès depuis la console
 */
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).debugReferenceLists = {
    logSummary: referenceListsService.logListsSummary,
    logCompact: referenceListsService.logListsCompact,
    test: testLogging,
  };

  console.log('🔧 Debug tools available in window.debugReferenceLists:');
  console.log('   • window.debugReferenceLists.logSummary(establishmentId)');
  console.log('   • window.debugReferenceLists.logCompact(establishmentId)');
  console.log('   • window.debugReferenceLists.test(establishmentId)');
}

export default {
  testLogging,
};
