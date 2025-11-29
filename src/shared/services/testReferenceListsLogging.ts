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
import { logger } from '@/core/utils/logger';

/**
 * Tester les fonctions de logging avec un establishment ID
 */
export const testLogging = async (establishmentId: string) => {
  logger.debug('🧪 ========================================');
  logger.debug('🧪 TEST DES FONCTIONS DE LOGGING');
  logger.debug('🧪 ========================================\n');

  logger.debug(`📋 Testing avec l'établissement: ${establishmentId}\n`);

  // Test 1: Log compact
  logger.debug('📝 TEST 1: Log Compact');
  logger.debug('------------------------------------------');
  await referenceListsService.logListsCompact(establishmentId);
  logger.debug('\n');

  // Test 2: Log détaillé
  logger.debug('📝 TEST 2: Log Détaillé');
  logger.debug('------------------------------------------');
  await referenceListsService.logListsSummary(establishmentId);
  logger.debug('\n');

  logger.debug('🧪 ========================================');
  logger.debug('✅ Tests terminés !');
  logger.debug('🧪 ========================================\n');
};

/**
 * Exposer les fonctions dans window pour faciliter l'accès depuis la console
 */
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as unknown).debugReferenceLists = {
    logSummary: referenceListsService.logListsSummary,
    logCompact: referenceListsService.logListsCompact,
    test: testLogging,
  };

  logger.debug('🔧 Debug tools available in window.debugReferenceLists:');
  logger.debug('   • window.debugReferenceLists.logSummary(establishmentId)');
  logger.debug('   • window.debugReferenceLists.logCompact(establishmentId)');
  logger.debug('   • window.debugReferenceLists.test(establishmentId)');
}

export default {
  testLogging,
};
