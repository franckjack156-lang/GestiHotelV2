/**
 * Service de gestion de la corbeille (soft delete)
 * Permet de récupérer et restaurer les éléments supprimés
 */

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { logger } from '@/core/utils/logger';

/**
 * Types d'éléments pouvant être mis en corbeille
 */
export type TrashItemType =
  | 'intervention'
  | 'room'
  | 'user'
  | 'message'
  | 'conversation'
  | 'comment'
  | 'notification'
  | 'dashboard';

/**
 * Élément de la corbeille
 */
export interface TrashItem {
  id: string;
  type: TrashItemType;
  title: string;
  description?: string;
  deletedAt: Timestamp;
  deletedBy: string;
  deletedByName: string;
  originalPath: string;
  establishmentId: string;
  metadata?: Record<string, unknown>;
  canRestore: boolean;
  daysUntilPermanentDelete: number;
}

/**
 * Statistiques de la corbeille
 */
export interface TrashStats {
  total: number;
  byType: Record<TrashItemType, number>;
  oldestItem?: Date;
  newestItem?: Date;
}

/**
 * Configuration de la corbeille
 */
const TRASH_CONFIG = {
  /** Nombre de jours avant suppression permanente */
  retentionDays: 30,
  /** Limite de récupération par défaut */
  defaultLimit: 50,
};

/**
 * Configuration des collections par type
 */
const TYPE_CONFIG: Record<
  TrashItemType,
  {
    collection: string;
    isSubcollection: boolean;
    parentCollection?: string;
    titleField: string;
    descriptionField?: string;
  }
> = {
  intervention: {
    collection: 'interventions',
    isSubcollection: true,
    parentCollection: 'establishments',
    titleField: 'title',
    descriptionField: 'description',
  },
  room: {
    collection: 'rooms',
    isSubcollection: true,
    parentCollection: 'establishments',
    titleField: 'number',
    descriptionField: 'type',
  },
  user: {
    collection: 'users',
    isSubcollection: false,
    titleField: 'displayName',
    descriptionField: 'email',
  },
  message: {
    collection: 'messages',
    isSubcollection: true,
    parentCollection: 'conversations',
    titleField: 'content',
  },
  conversation: {
    collection: 'conversations',
    isSubcollection: false,
    titleField: 'name',
  },
  comment: {
    collection: 'comments',
    isSubcollection: true,
    parentCollection: 'interventions',
    titleField: 'content',
  },
  notification: {
    collection: 'notifications',
    isSubcollection: false,
    titleField: 'title',
    descriptionField: 'message',
  },
  dashboard: {
    collection: 'dashboards',
    isSubcollection: true,
    parentCollection: 'establishments',
    titleField: 'name',
  },
};

/**
 * Calculer les jours restants avant suppression permanente
 */
const calculateDaysRemaining = (deletedAt: Timestamp): number => {
  const deletedDate = deletedAt.toDate();
  const expirationDate = new Date(deletedDate);
  expirationDate.setDate(expirationDate.getDate() + TRASH_CONFIG.retentionDays);

  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
};

/**
 * Récupérer les éléments supprimés d'un établissement
 */
export const getDeletedItems = async (
  establishmentId: string,
  options: {
    type?: TrashItemType;
    limit?: number;
    sortBy?: 'deletedAt' | 'type';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<TrashItem[]> => {
  const { type, limit: queryLimit = TRASH_CONFIG.defaultLimit, sortOrder = 'desc' } = options;

  const trashItems: TrashItem[] = [];

  try {
    // Si un type spécifique est demandé, ne requêter que cette collection
    const typesToQuery = type ? [type] : (Object.keys(TYPE_CONFIG) as TrashItemType[]);

    for (const itemType of typesToQuery) {
      const config = TYPE_CONFIG[itemType];

      let collectionRef;
      if (config.isSubcollection && config.parentCollection === 'establishments') {
        collectionRef = collection(db, 'establishments', establishmentId, config.collection);
      } else if (!config.isSubcollection) {
        collectionRef = collection(db, config.collection);
      } else {
        // Skip subcollections non-gérées pour l'instant
        continue;
      }

      const q = query(
        collectionRef,
        where('isDeleted', '==', true),
        orderBy('deletedAt', sortOrder),
        limit(queryLimit)
      );

      const snapshot = await getDocs(q);

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();

        // Filtrer par établissement si nécessaire
        if (!config.isSubcollection && data.establishmentId !== establishmentId) {
          return;
        }

        const deletedAt = data.deletedAt as Timestamp;
        const daysRemaining = calculateDaysRemaining(deletedAt);

        trashItems.push({
          id: docSnap.id,
          type: itemType,
          title: data[config.titleField] || 'Sans titre',
          description: config.descriptionField ? data[config.descriptionField] : undefined,
          deletedAt,
          deletedBy: data.deletedBy || 'unknown',
          deletedByName: data.deletedByName || 'Utilisateur inconnu',
          originalPath: docSnap.ref.path,
          establishmentId,
          metadata: {
            status: data.status,
            priority: data.priority,
            type: data.type,
          },
          canRestore: daysRemaining > 0,
          daysUntilPermanentDelete: daysRemaining,
        });
      });
    }

    // Trier tous les résultats par date de suppression
    trashItems.sort((a, b) => {
      const comparison = b.deletedAt.toMillis() - a.deletedAt.toMillis();
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return trashItems.slice(0, queryLimit);
  } catch (error) {
    logger.error('Erreur lors de la récupération des éléments supprimés:', error);
    throw error;
  }
};

/**
 * Restaurer un élément de la corbeille
 */
export const restoreItem = async (itemPath: string, restoredBy: string): Promise<void> => {
  try {
    const docRef = doc(db, itemPath);

    await updateDoc(docRef, {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deletedByName: null,
      restoredAt: serverTimestamp(),
      restoredBy,
      updatedAt: serverTimestamp(),
    });

    logger.info('Élément restauré:', { path: itemPath, restoredBy });
  } catch (error) {
    logger.error('Erreur lors de la restauration:', error);
    throw error;
  }
};

/**
 * Restaurer plusieurs éléments
 */
export const restoreItems = async (
  items: Array<{ path: string }>,
  restoredBy: string
): Promise<{ success: number; failed: number }> => {
  const batch = writeBatch(db);
  let success = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const docRef = doc(db, item.path);
      batch.update(docRef, {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deletedByName: null,
        restoredAt: serverTimestamp(),
        restoredBy,
        updatedAt: serverTimestamp(),
      });
      success++;
    } catch {
      failed++;
    }
  }

  if (success > 0) {
    await batch.commit();
  }

  return { success, failed };
};

/**
 * Supprimer définitivement un élément
 */
export const permanentlyDeleteItem = async (itemPath: string): Promise<void> => {
  try {
    const docRef = doc(db, itemPath);
    await deleteDoc(docRef);

    logger.info('Élément supprimé définitivement:', { path: itemPath });
  } catch (error) {
    logger.error('Erreur lors de la suppression définitive:', error);
    throw error;
  }
};

/**
 * Supprimer définitivement plusieurs éléments
 */
export const permanentlyDeleteItems = async (
  items: Array<{ path: string }>
): Promise<{ success: number; failed: number }> => {
  const batch = writeBatch(db);
  let success = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const docRef = doc(db, item.path);
      batch.delete(docRef);
      success++;
    } catch {
      failed++;
    }
  }

  if (success > 0) {
    await batch.commit();
  }

  return { success, failed };
};

/**
 * Vider la corbeille (supprimer tous les éléments expirés)
 */
export const emptyTrash = async (
  establishmentId: string,
  options: {
    onlyExpired?: boolean;
    type?: TrashItemType;
  } = {}
): Promise<number> => {
  const { onlyExpired = true, type } = options;

  try {
    const items = await getDeletedItems(establishmentId, {
      type,
      limit: 500,
    });

    const itemsToDelete = onlyExpired
      ? items.filter(item => item.daysUntilPermanentDelete === 0)
      : items;

    if (itemsToDelete.length === 0) {
      return 0;
    }

    const batch = writeBatch(db);
    itemsToDelete.forEach(item => {
      const docRef = doc(db, item.originalPath);
      batch.delete(docRef);
    });

    await batch.commit();

    logger.info('Corbeille vidée:', {
      establishmentId,
      count: itemsToDelete.length,
      onlyExpired,
    });

    return itemsToDelete.length;
  } catch (error) {
    logger.error('Erreur lors du vidage de la corbeille:', error);
    throw error;
  }
};

/**
 * Obtenir les statistiques de la corbeille
 */
export const getTrashStats = async (establishmentId: string): Promise<TrashStats> => {
  try {
    const items = await getDeletedItems(establishmentId, { limit: 1000 });

    const byType: Record<TrashItemType, number> = {
      intervention: 0,
      room: 0,
      user: 0,
      message: 0,
      conversation: 0,
      comment: 0,
      notification: 0,
      dashboard: 0,
    };

    let oldestDate: Date | undefined;
    let newestDate: Date | undefined;

    items.forEach(item => {
      byType[item.type]++;

      const deletedDate = item.deletedAt.toDate();
      if (!oldestDate || deletedDate < oldestDate) {
        oldestDate = deletedDate;
      }
      if (!newestDate || deletedDate > newestDate) {
        newestDate = deletedDate;
      }
    });

    return {
      total: items.length,
      byType,
      oldestItem: oldestDate,
      newestItem: newestDate,
    };
  } catch (error) {
    logger.error('Erreur lors de la récupération des stats corbeille:', error);
    throw error;
  }
};

/**
 * Soft delete générique
 */
export const softDeleteItem = async (
  itemPath: string,
  deletedBy: string,
  deletedByName: string
): Promise<void> => {
  try {
    const docRef = doc(db, itemPath);

    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy,
      deletedByName,
      updatedAt: serverTimestamp(),
    });

    logger.info('Élément mis en corbeille:', { path: itemPath, deletedBy });
  } catch (error) {
    logger.error('Erreur lors de la mise en corbeille:', error);
    throw error;
  }
};
