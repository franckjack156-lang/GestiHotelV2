/**
 * ============================================================================
 * ESTABLISHMENT DELETION SERVICE
 * ============================================================================
 *
 * Service pour gérer la suppression sécurisée des établissements avec
 * un maximum de protections et de vérifications.
 */

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
  getDoc,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';

// ============================================================================
// TYPES
// ============================================================================

export interface DeletionCheck {
  canDelete: boolean;
  warnings: string[];
  blockers: string[];
  stats: {
    interventionsCount: number;
    usersCount: number;
    documentsCount: number;
  };
}

export interface DeletionOptions {
  /**
   * Si true, supprime également toutes les données liées (interventions, etc.)
   * ATTENTION: Cette action est IRRÉVERSIBLE
   */
  deleteRelatedData?: boolean;

  /**
   * Confirmation par saisie du nom de l'établissement (requis)
   */
  confirmationName: string;

  /**
   * ID de l'utilisateur effectuant la suppression (pour logs)
   */
  userId: string;
}

export interface DeletionResult {
  success: boolean;
  deletedEstablishmentId: string;
  deletedCollections: string[];
  errors: string[];
}

// ============================================================================
// VÉRIFICATIONS AVANT SUPPRESSION
// ============================================================================

/**
 * Vérifie si un établissement peut être supprimé
 * et retourne les avertissements/blockers
 */
export const checkEstablishmentDeletion = async (
  establishmentId: string
): Promise<DeletionCheck> => {
  const warnings: string[] = [];
  const blockers: string[] = [];
  const stats = {
    interventionsCount: 0,
    usersCount: 0,
    documentsCount: 0,
  };

  try {
    // 1. Vérifier si l'établissement existe
    const estDoc = await getDoc(doc(db, 'establishments', establishmentId));
    if (!estDoc.exists()) {
      blockers.push("L'établissement n'existe pas");
      return { canDelete: false, warnings, blockers, stats };
    }

    // 2. Compter les interventions
    const interventionsQuery = query(
      collection(db, 'interventions'),
      where('establishmentId', '==', establishmentId)
    );
    const interventionsSnapshot = await getDocs(interventionsQuery);
    stats.interventionsCount = interventionsSnapshot.size;

    if (stats.interventionsCount > 0) {
      warnings.push(
        `${stats.interventionsCount} intervention(s) seront définitivement supprimée(s)`
      );
    }

    // 3. Compter les utilisateurs ayant accès
    const usersQuery = query(
      collection(db, 'users'),
      where('establishmentIds', 'array-contains', establishmentId)
    );
    const usersSnapshot = await getDocs(usersQuery);
    stats.usersCount = usersSnapshot.size;

    if (stats.usersCount > 0) {
      warnings.push(`${stats.usersCount} utilisateur(s) perdront l'accès à cet établissement`);
    }

    // 4. Vérifier les sous-collections (config, reference-lists, etc.)
    const configDoc = await getDoc(
      doc(db, 'establishments', establishmentId, 'config', 'reference-lists')
    );
    if (configDoc.exists()) {
      stats.documentsCount++;
      warnings.push('Les listes de référence seront supprimées');
    }

    // 5. Vérifier s'il reste d'autres établissements pour les utilisateurs
    if (stats.usersCount > 0) {
      const usersWithOnlyThisEstablishment: string[] = [];
      usersSnapshot.forEach(userDoc => {
        const userData = userDoc.data();
        if (userData.establishmentIds?.length === 1) {
          usersWithOnlyThisEstablishment.push(userDoc.id);
        }
      });

      if (usersWithOnlyThisEstablishment.length > 0) {
        blockers.push(
          `${usersWithOnlyThisEstablishment.length} utilisateur(s) n'ont accès qu'à cet établissement. Ils perdraient tout accès à l'application.`
        );
      }
    }

    // 6. Vérifier si c'est le dernier établissement actif
    const activeEstablishmentsQuery = query(
      collection(db, 'establishments'),
      where('isActive', '==', true)
    );
    const activeEstablishmentsSnapshot = await getDocs(activeEstablishmentsQuery);
    if (activeEstablishmentsSnapshot.size === 1 && estDoc.data()?.isActive) {
      blockers.push("C'est le dernier établissement actif. Au moins un établissement doit rester.");
    }

    return {
      canDelete: blockers.length === 0,
      warnings,
      blockers,
      stats,
    };
  } catch (error) {
    console.error('Erreur lors de la vérification de suppression:', error);
    blockers.push('Erreur lors de la vérification: ' + (error as Error).message);
    return { canDelete: false, warnings, blockers, stats };
  }
};

// ============================================================================
// SUPPRESSION
// ============================================================================

/**
 * Supprime définitivement un établissement et toutes ses données
 * ATTENTION: Cette action est IRRÉVERSIBLE
 */
export const deleteEstablishmentPermanently = async (
  establishmentId: string,
  options: DeletionOptions
): Promise<DeletionResult> => {
  const result: DeletionResult = {
    success: false,
    deletedEstablishmentId: establishmentId,
    deletedCollections: [],
    errors: [],
  };

  try {
    // 1. Vérification pré-suppression
    const check = await checkEstablishmentDeletion(establishmentId);
    if (!check.canDelete) {
      result.errors.push(...check.blockers);
      return result;
    }

    // 2. Vérifier le nom de confirmation
    const estDoc = await getDoc(doc(db, 'establishments', establishmentId));
    if (!estDoc.exists()) {
      result.errors.push("L'établissement n'existe pas");
      return result;
    }

    const establishmentData = estDoc.data();
    if (establishmentData.name !== options.confirmationName) {
      result.errors.push('Le nom de confirmation ne correspond pas');
      return result;
    }

    // 3. Logger l'action de suppression (avant de tout supprimer)
    await logDeletionAction(establishmentId, options.userId, check);

    const batch = writeBatch(db);

    // 4. Supprimer les interventions si demandé
    if (options.deleteRelatedData && check.stats.interventionsCount > 0) {
      const interventionsQuery = query(
        collection(db, 'interventions'),
        where('establishmentId', '==', establishmentId)
      );
      const interventionsSnapshot = await getDocs(interventionsQuery);

      interventionsSnapshot.forEach(interventionDoc => {
        batch.delete(interventionDoc.ref);
      });

      result.deletedCollections.push(`interventions (${check.stats.interventionsCount})`);
    } else if (check.stats.interventionsCount > 0) {
      result.errors.push(
        `Impossible de supprimer: ${check.stats.interventionsCount} intervention(s) existent. Activez deleteRelatedData pour forcer.`
      );
      return result;
    }

    // 5. Retirer l'établissement des utilisateurs
    if (check.stats.usersCount > 0) {
      const usersQuery = query(
        collection(db, 'users'),
        where('establishmentIds', 'array-contains', establishmentId)
      );
      const usersSnapshot = await getDocs(usersQuery);

      usersSnapshot.forEach(userDoc => {
        const userData = userDoc.data();
        const updatedEstablishmentIds = (userData.establishmentIds || []).filter(
          (id: string) => id !== establishmentId
        );

        batch.update(userDoc.ref, {
          establishmentIds: updatedEstablishmentIds,
          updatedAt: serverTimestamp(),
        });
      });

      result.deletedCollections.push(`users updated (${check.stats.usersCount})`);
    }

    // 6. Supprimer les sous-collections de l'établissement
    // Reference lists
    const referenceListsDoc = doc(
      db,
      'establishments',
      establishmentId,
      'config',
      'reference-lists'
    );
    const referenceListsSnapshot = await getDoc(referenceListsDoc);
    if (referenceListsSnapshot.exists()) {
      batch.delete(referenceListsDoc);
      result.deletedCollections.push('reference-lists');
    }

    // Autres sous-collections à vérifier
    const subCollections = ['config', 'settings', 'stats', 'audit'];
    for (const subCollection of subCollections) {
      const subCollectionRef = collection(db, 'establishments', establishmentId, subCollection);
      const subCollectionSnapshot = await getDocs(subCollectionRef);

      if (subCollectionSnapshot.size > 0) {
        subCollectionSnapshot.forEach(subDoc => {
          batch.delete(subDoc.ref);
        });
        result.deletedCollections.push(`${subCollection} (${subCollectionSnapshot.size})`);
      }
    }

    // 7. Supprimer l'établissement principal
    batch.delete(doc(db, 'establishments', establishmentId));

    // 8. Commit toutes les suppressions
    console.log('🔄 Committing batch deletion...');
    await batch.commit();
    console.log('✅ Batch committed successfully');

    result.success = true;
    console.log('✅ Établissement supprimé avec succès:', establishmentId);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    console.error('❌ Error details:', {
      message: (error as Error).message,
      code: (error as { code?: string }).code,
      details: error,
    });
    result.errors.push((error as Error).message);
  }

  return result;
};

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Logger l'action de suppression pour audit
 */
const logDeletionAction = async (
  establishmentId: string,
  userId: string,
  check: DeletionCheck
): Promise<void> => {
  try {
    const estDoc = await getDoc(doc(db, 'establishments', establishmentId));
    const establishmentData = estDoc.data();

    const logData = {
      action: 'ESTABLISHMENT_DELETION',
      establishmentId,
      establishmentName: establishmentData?.name || 'Unknown',
      userId,
      timestamp: serverTimestamp(),
      stats: check.stats,
      warnings: check.warnings,
    };

    // Logger dans une collection d'audit dédiée
    await addDoc(collection(db, 'audit-logs'), logData);

    console.log('📝 Suppression loggée:', logData);
  } catch (error) {
    console.error('Erreur lors du logging de suppression:', error);
    // Ne pas bloquer la suppression si le logging échoue
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  checkEstablishmentDeletion,
  deleteEstablishmentPermanently,
};
