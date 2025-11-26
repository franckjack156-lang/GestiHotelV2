/**
 * ============================================================================
 * REFERENCE LISTS SERVICE - VERSION CORRIGÉE
 * ============================================================================
 *
 * Service ultra-complet pour la gestion des listes de référence
 *
 * ✅ CORRECTION: DEFAULT_VALIDATION_RULES défini localement
 *
 * Destination: src/shared/services/referenceListsService.ts
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  // deleteDoc, // TODO: Imported but unused
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  // Timestamp, // TODO: Imported but unused
  increment,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import * as XLSX from 'xlsx';
import * as LucideIcons from 'lucide-react';
import { removeUndefinedFields } from '@/shared/utils/firestore';
import type {
  EstablishmentReferenceLists,
  ListKey,
  ListConfig,
  ReferenceItem,
  CreateItemInput,
  UpdateItemInput,
  ImportOptions,
  ImportResult,
  // ImportPreview, // TODO: Imported but unused
  ReferenceListsExportOptions,
  AuditEntry,
  AuditAction,
  ListAnalytics,
  ItemAnalytics,
  ValidationResult,
  SmartSuggestion,
  // ListDraft, // TODO: Imported but unused
  // ListTemplate, // TODO: Imported but unused
  DuplicateListsInput,
} from '@/shared/types/reference-lists.types';

// ============================================================================
// RÈGLES DE VALIDATION (définies localement)
// ============================================================================

const DEFAULT_VALIDATION_RULES = {
  value: {
    pattern: /^[a-z0-9_]+$/,
    minLength: 2,
    maxLength: 50,
    reserved: ['id', 'name', 'type', 'value', 'label'],
  },
  label: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  color: {
    allowed: ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink'],
  },
  description: {
    maxLength: 500,
  },
};

// ============================================================================
// UTILS
// ============================================================================

/**
 * Nettoyer un objet de toutes ses propriétés undefined
 * Firestore n'accepte pas les valeurs undefined
 */
const removeUndefined = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined) as T;
  if (typeof obj !== 'object') return obj;

  const cleaned: Record<string, unknown> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = removeUndefined(obj[key]);
    }
  }
  return cleaned as T;
};

// ============================================================================
// PATHS FIRESTORE
// ============================================================================

const getListsDocPath = (establishmentId: string) =>
  doc(db, 'establishments', establishmentId, 'config', 'reference-lists');

// TODO: These functions defined but unused
// const getAuditCollectionPath = (establishmentId: string) =>
//   collection(db, 'establishments', establishmentId, 'config', 'reference-lists-audit');
//
// const getVersionsCollectionPath = (establishmentId: string) =>
//   collection(db, 'establishments', establishmentId, 'config', 'reference-lists-versions');
//
// const getDraftsCollectionPath = (establishmentId: string) =>
//   collection(db, 'establishments', establishmentId, 'config', 'reference-lists-drafts');

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

async function performListOperation<T>(
  establishmentId: string,
  userId: string,
  listKey: ListKey,
  operation: (list: ListConfig) => T,
  auditAction: AuditAction,
  auditData?: { itemId?: string; before?: unknown; after?: unknown }
): Promise<T> {
  const allLists = await getAllLists(establishmentId);
  if (!allLists) throw new Error('Listes non trouvées');
  const list = allLists.lists[listKey];
  if (!list) throw new Error(`Liste "${listKey}" non trouvée`);

  const before = auditData?.before || JSON.parse(JSON.stringify(list));
  const result = operation(list);
  const after = auditData?.after || JSON.parse(JSON.stringify(list));

  const batch = writeBatch(db);

  // Nettoyer les valeurs undefined avant d'envoyer à Firestore
  batch.update(
    getListsDocPath(establishmentId),
    removeUndefined({
      [`lists.${listKey}`]: list,
      lastModified: serverTimestamp(),
      modifiedBy: userId,
    })
  );

  const auditRef = doc(collection(db, 'establishments', establishmentId, 'audit'));

  // ✅ CORRECTION : Créer l'objet sans valeurs undefined
  const auditEntry: Record<string, any> = {
    id: auditRef.id,
    timestamp: serverTimestamp(),
    userId,
    userName: 'User',
    userRole: 'admin',
    action: auditAction,
    listKey,
    listName: list.name,
    before,
    after,
  };

  // Ajouter itemId seulement s'il existe
  if (auditData?.itemId) {
    auditEntry.itemId = auditData.itemId;
  }

  batch.set(auditRef, auditEntry);

  await batch.commit();
  return result;
}

// ============================================================================
// CRUD DE BASE
// ============================================================================

/**
 * Obtenir TOUTES les listes (1 lecture Firestore)
 */
export const getAllLists = async (
  establishmentId: string
): Promise<EstablishmentReferenceLists | null> => {
  try {
    const docRef = getListsDocPath(establishmentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      ...data,
      lastModified: data.lastModified?.toDate
        ? data.lastModified.toDate()
        : data.lastModified || new Date(),
      lists: Object.entries(data.lists || {}).reduce((acc, [key, config]: [string, any]) => {
        acc[key] = {
          ...config,
          items: (config.items || []).map((item: any) => ({
            ...item,
            createdAt: item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt,
            updatedAt: item.updatedAt?.toDate ? item.updatedAt.toDate() : item.updatedAt,
            lastUsed: item.lastUsed?.toDate ? item.lastUsed.toDate() : item.lastUsed,
          })),
        };
        return acc;
      }, {} as Record<string, ListConfig>),
    } as EstablishmentReferenceLists;
  } catch (error) {
    console.error('❌ Erreur chargement listes:', error);
    throw new Error('Impossible de charger les listes');
  }
};

/**
 * Obtenir UNE liste spécifique
 */
export const getList = async (
  establishmentId: string,
  listKey: ListKey
): Promise<ListConfig | null> => {
  const allLists = await getAllLists(establishmentId);
  return allLists?.lists[listKey] || null;
};

/**
 * Obtenir les items ACTIFS d'une liste
 */
export const getActiveItems = async (
  establishmentId: string,
  listKey: ListKey
): Promise<ReferenceItem[]> => {
  const list = await getList(establishmentId, listKey);
  if (!list) return [];

  return list.items.filter(item => item.isActive).sort((a, b) => a.order - b.order);
};

/**
 * Initialiser les listes (VIDES au départ)
 */
export const initializeEmptyLists = async (
  establishmentId: string,
  userId: string
): Promise<void> => {
  try {
    const docRef = getListsDocPath(establishmentId);

    const data: EstablishmentReferenceLists = {
      establishmentId,
      version: 1,
      lastModified: new Date(),
      modifiedBy: userId,
      lists: {} as Record<string, ListConfig>,
    };

    await setDoc(docRef, {
      ...data,
      lastModified: serverTimestamp(),
    });

    await logAudit(establishmentId, userId, 'CREATE_LIST', 'system', 'system', null, data);

    console.log('✅ Listes vides initialisées');
  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
    throw error;
  }
};

/**
 * Créer une nouvelle liste
 */
export const createList = async (
  establishmentId: string,
  userId: string,
  listKey: string,
  config: Omit<ListConfig, 'items'>
): Promise<void> => {
  try {
    const allLists = await getAllLists(establishmentId);
    if (!allLists) throw new Error('Listes non initialisées');

    if (allLists.lists[listKey]) {
      throw new Error('Cette liste existe déjà');
    }

    const newList: ListConfig = {
      ...config,
      items: [],
    };

    const docRef = getListsDocPath(establishmentId);
    await updateDoc(docRef, {
      [`lists.${listKey}`]: newList,
      lastModified: serverTimestamp(),
      modifiedBy: userId,
      version: increment(1),
    });

    await logAudit(establishmentId, userId, 'CREATE_LIST', listKey, config.name, null, newList);

    console.log(`✅ Liste créée: ${listKey}`);
  } catch (error) {
    console.error('❌ Erreur création liste:', error);
    throw error;
  }
};

/**
 * Supprimer une liste
 */
export const deleteList = async (
  establishmentId: string,
  userId: string,
  listKey: string
): Promise<void> => {
  try {
    const allLists = await getAllLists(establishmentId);
    if (!allLists) throw new Error('Listes non trouvées');

    const list = allLists.lists[listKey];
    if (!list) throw new Error('Liste non trouvée');

    if (list.isSystem) {
      throw new Error('Impossible de supprimer une liste système');
    }

    const { [listKey]: removed, ...remainingLists } = allLists.lists;

    const docRef = getListsDocPath(establishmentId);
    await updateDoc(docRef, {
      lists: remainingLists,
      lastModified: serverTimestamp(),
      modifiedBy: userId,
    });

    await logAudit(establishmentId, userId, 'DELETE_LIST', listKey, list.name, list, null);

    console.log(`✅ Liste supprimée: ${listKey}`);
  } catch (error) {
    console.error('❌ Erreur suppression liste:', error);
    throw error;
  }
};

// ============================================================================
// GESTION DES ITEMS
// ============================================================================

/**
 * Ajouter un item
 */
export const addItem = async (
  establishmentId: string,
  userId: string,
  listKey: ListKey,
  input: CreateItemInput
): Promise<string> => {
  try {
    return await performListOperation(
      establishmentId,
      userId,
      listKey,
      list => {
        if (!list.allowCustom) throw new Error("Cette liste ne permet pas d'ajouter des valeurs");

        const validation = validateItem(input, listKey);
        if (!validation.isValid) throw new Error(validation.errors.join(', '));

        if (list.items.find(i => i.value === input.value)) {
          throw new Error('Cette valeur existe déjà');
        }

        // Construire l'item avec uniquement les champs définis (pas undefined)
        const newItem: ReferenceItem = {
          id: `${input.value}_${Date.now()}`,
          value: input.value,
          label: input.label,
          order: Math.max(...list.items.map(i => i.order), 0) + 1,
          isActive: true,
          createdAt: new Date(),
          createdBy: userId,
          usageCount: 0,
          color: input.color,
          icon: input.icon,
          description: input.description,
          labels: input.labels,
          metadata: input.metadata,
        };

        list.items.push(newItem);
        return newItem.id;
      },
      'ADD_ITEM'
    );
  } catch (error) {
    console.error('❌ Erreur ajout item:', error);
    throw error;
  }
};

/**
 * Mettre à jour un item
 */
export const updateItem = async (
  establishmentId: string,
  userId: string,
  listKey: ListKey,
  input: UpdateItemInput
): Promise<void> => {
  try {
    await performListOperation(
      establishmentId,
      userId,
      listKey,
      list => {
        const itemIndex = list.items.findIndex(i => i.id === input.itemId);
        if (itemIndex === -1) throw new Error('Item non trouvé');

        const oldItem = list.items[itemIndex];

        // Ne mettre à jour que les champs définis
        const updates: Partial<ReferenceItem> = {
          updatedAt: new Date(),
          updatedBy: userId,
        };

        if (input.value !== undefined) updates.value = input.value;
        if (input.label !== undefined) updates.label = input.label;
        if (input.color !== undefined) updates.color = input.color;
        if (input.icon !== undefined) updates.icon = input.icon;
        if (input.description !== undefined) updates.description = input.description;
        if (input.labels !== undefined) updates.labels = input.labels;
        if (input.metadata !== undefined) updates.metadata = input.metadata;
        if (input.isActive !== undefined) updates.isActive = input.isActive;
        if (input.order !== undefined) updates.order = input.order;

        list.items[itemIndex] = {
          ...oldItem,
          ...updates,
        };

        return { before: oldItem, after: list.items[itemIndex] };
      },
      'UPDATE_ITEM',
      { itemId: input.itemId }
    );
  } catch (error) {
    console.error('❌ Erreur mise à jour item:', error);
    throw error;
  }
};

/**
 * Désactiver un item (soft delete)
 */
export const deactivateItem = async (
  establishmentId: string,
  userId: string,
  listKey: ListKey,
  itemId: string
): Promise<void> => {
  await updateItem(establishmentId, userId, listKey, {
    itemId,
    isActive: false,
  });
};

/**
 * Supprimer définitivement un item
 */
export const deleteItem = async (
  establishmentId: string,
  userId: string,
  listKey: ListKey,
  itemId: string
): Promise<void> => {
  try {
    const usage = await checkItemUsage(establishmentId, listKey, itemId);
    if (usage.count > 0) {
      throw new Error(
        `Cet item est utilisé ${usage.count} fois. Désactivez-le au lieu de le supprimer.`
      );
    }

    await performListOperation(
      establishmentId,
      userId,
      listKey,
      list => {
        const item = list.items.find(i => i.id === itemId);
        if (!item) throw new Error('Item non trouvé');

        list.items = list.items.filter(i => i.id !== itemId);
        return { before: item, after: null };
      },
      'DELETE_ITEM',
      { itemId }
    );
  } catch (error) {
    console.error('❌ Erreur suppression item:', error);
    throw error;
  }
};

/**
 * Réorganiser les items
 */
export const reorderItems = async (
  establishmentId: string,
  userId: string,
  listKey: ListKey,
  itemIds: string[]
): Promise<void> => {
  try {
    await performListOperation(
      establishmentId,
      userId,
      listKey,
      list => {
        const before = [...list.items];
        list.items = list.items.map(item => ({
          ...item,
          order: itemIds.indexOf(item.id) >= 0 ? itemIds.indexOf(item.id) : item.order,
        }));
        return { before, after: list.items };
      },
      'REORDER_ITEMS'
    );
  } catch (error) {
    console.error('❌ Erreur réorganisation:', error);
    throw error;
  }
};

// ============================================================================
// IMPORT / EXPORT
// ============================================================================

/**
 * Exporter les listes en Excel
 */
export const exportToExcel = async (
  establishmentId: string,
  options: ReferenceListsExportOptions
): Promise<Blob> => {
  try {
    const allLists = await getAllLists(establishmentId);
    if (!allLists) throw new Error('Listes non trouvées');

    const workbook = XLSX.utils.book_new();

    const listKeys = options.listKeys || Object.keys(allLists.lists);

    for (const listKey of listKeys) {
      const list = allLists.lists[listKey];
      if (!list) continue;

      const items = options.includeInactive ? list.items : list.items.filter(i => i.isActive);

      const data = items.map(item => ({
        ID: item.id,
        Valeur: item.value,
        Label: item.label,
        Couleur: item.color || '',
        Icône: item.icon || '',
        Ordre: item.order,
        Actif: item.isActive ? 'Oui' : 'Non',
        Description: item.description || '',
        ...(options.includeMetadata && item.usageCount !== undefined
          ? {
              'Nombre utilisations': item.usageCount,
              'Dernière utilisation': item.lastUsed ? item.lastUsed.toLocaleDateString() : '',
            }
          : {}),
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, listKey.substring(0, 31));
    }

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  } catch (error) {
    console.error('❌ Erreur export Excel:', error);
    throw error;
  }
};

/**
 * Importer depuis Excel/CSV
 */
export const importFromFile = async (
  establishmentId: string,
  userId: string,
  file: File,
  listKey: ListKey,
  options: ImportOptions
): Promise<ImportResult> => {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const items: ReferenceItem[] = [];
    const errors: Array<{ row: number; field: string; value: unknown; error: string }> = [];
    let itemsImported = 0;
    let itemsSkipped = 0;
    let itemsUpdated = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, unknown>;

      try {
        const item: ReferenceItem = {
          id: (row.ID as string) || `import_${Date.now()}_${i}`,
          value: (row.Valeur as string) || (row.value as string) || '',
          label: (row.Label as string) || (row.label as string) || '',
          color: (row.Couleur as string) || (row.color as string),
          icon: (row.Icône as string) || (row.icon as string),
          order: typeof row.Ordre === 'number' ? row.Ordre : i,
          isActive: row.Actif === 'Oui' || row.Actif === true || true,
          description: (row.Description as string) || (row.description as string),
          createdAt: new Date(),
          usageCount: 0,
        };

        if (options.validate) {
          const validation = validateItem(item, listKey);
          if (!validation.isValid) {
            errors.push({
              row: i + 2,
              field: 'validation',
              value: item,
              error: validation.errors.join(', '),
            });
            itemsSkipped++;
            continue;
          }
        }

        items.push(item);
        itemsImported++;
      } catch (error) {
        errors.push({
          row: i + 2,
          field: 'parse',
          value: row,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
        itemsSkipped++;
      }
    }

    if (options.dryRun) {
      return {
        success: true,
        itemsImported: 0,
        itemsSkipped,
        itemsUpdated: 0,
        errors,
        warnings: [],
      };
    }

    const allLists = await getAllLists(establishmentId);
    if (!allLists) throw new Error('Listes non trouvées');

    const list = allLists.lists[listKey];
    if (!list) throw new Error(`Liste "${listKey}" non trouvée`);

    let finalItems: ReferenceItem[];

    if (options.overwrite) {
      finalItems = items;
    } else if (options.merge) {
      const existingValues = new Set(list.items.map(i => i.value));
      const newItems = items.filter(i => !existingValues.has(i.value));
      finalItems = [...list.items, ...newItems];
      itemsUpdated = items.length - newItems.length;
    } else {
      throw new Error('Mode non spécifié (overwrite ou merge requis)');
    }

    const updatedList = {
      ...list,
      items: finalItems,
    };

    const docRef = getListsDocPath(establishmentId);
    await updateDoc(docRef, {
      [`lists.${listKey}`]: updatedList,
      lastModified: serverTimestamp(),
      modifiedBy: userId,
    });

    await logAudit(establishmentId, userId, 'IMPORT', listKey, list.name, list.items, finalItems);

    return {
      success: true,
      itemsImported,
      itemsSkipped,
      itemsUpdated,
      errors,
      warnings: [],
    };
  } catch (error) {
    console.error('❌ Erreur import:', error);
    throw error;
  }
};

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Obtenir les statistiques d'une liste
 */
export const getListAnalytics = async (
  establishmentId: string,
  listKey: ListKey
): Promise<ListAnalytics | null> => {
  try {
    const list = await getList(establishmentId, listKey);
    if (!list) return null;

    const totalItems = list.items.length;
    const activeItems = list.items.filter(i => i.isActive).length;
    const inactiveItems = totalItems - activeItems;

    const itemStats: ItemAnalytics[] = list.items.map(item => ({
      itemId: item.id,
      itemValue: item.value,
      itemLabel: item.label,
      usageCount: item.usageCount || 0,
      lastUsed: item.lastUsed,
      trendingUp: false,
      usageByMonth: [],
    }));

    const unusedItems = list.items.filter(i => !i.usageCount || i.usageCount === 0).map(i => i.id);

    const popularItems = [...list.items]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 10)
      .map(i => i.id);

    const duplicateCandidates: [string, string][] = [];
    for (let i = 0; i < list.items.length; i++) {
      for (let j = i + 1; j < list.items.length; j++) {
        const item1 = list.items[i];
        const item2 = list.items[j];
        const similarity = calculateSimilarity(item1.label, item2.label);
        if (similarity > 0.8) {
          duplicateCandidates.push([item1.id, item2.id]);
        }
      }
    }

    return {
      listKey,
      listName: list.name,
      totalItems,
      activeItems,
      inactiveItems,
      itemStats,
      unusedItems,
      popularItems,
      duplicateCandidates,
      usageTrend: 'stable',
      lastAnalyzed: new Date(),
    };
  } catch (error) {
    console.error('❌ Erreur analytics:', error);
    return null;
  }
};

/**
 * Enregistrer l'utilisation d'un item
 */
// TODO: context and contextId parameters unused
export const trackItemUsage = async (
  establishmentId: string,
  listKey: ListKey,
  itemValue: string
): Promise<void> => {
  try {
    const allLists = await getAllLists(establishmentId);
    if (!allLists) return;

    const list = allLists.lists[listKey];
    if (!list) return;

    const itemIndex = list.items.findIndex(i => i.value === itemValue);
    if (itemIndex === -1) return;

    const item = list.items[itemIndex];
    const updatedItem: ReferenceItem = {
      ...item,
      usageCount: (item.usageCount || 0) + 1,
      lastUsed: new Date(),
    };

    const updatedItems = [...list.items];
    updatedItems[itemIndex] = updatedItem;

    // TODO: updatedList unused
    // const updatedList = {
    //   ...list,
    //   items: updatedItems,
    // };

    const docRef = getListsDocPath(establishmentId);
    await updateDoc(docRef, {
      [`lists.${listKey}.items`]: updatedItems,
    });
  } catch (error) {
    console.error('❌ Erreur track usage:', error);
  }
};

// ============================================================================
// AUDIT TRAIL
// ============================================================================

/**
 * Logger une action dans l'audit trail
 */
const logAudit = async (
  establishmentId: string,
  userId: string,
  action: AuditAction,
  listKey: string,
  listName: string,
  before: unknown,
  after: unknown,
  comment?: string
): Promise<void> => {
  try {
    // ✅ Créer l'objet de base sans valeurs undefined
    const auditEntry: Record<string, any> = {
      timestamp: serverTimestamp(),
      userId,
      userName: 'User',
      userRole: 'admin',
      action,
      listKey,
      listName,
      before,
      after,
    };

    // Ajouter comment seulement s'il existe
    if (comment) {
      auditEntry.comment = comment;
    }

    const auditRef = doc(collection(db, 'establishments', establishmentId, 'audit'));
    await setDoc(auditRef, auditEntry);
  } catch (error) {
    console.error('❌ Erreur log audit:', error);
  }
};

/**
 * Obtenir l'historique d'audit
 */
export const getAuditHistory = async (
  establishmentId: string,
  filters?: {
    listKey?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<AuditEntry[]> => {
  try {
    let q = query(collection(db, 'establishments', establishmentId, 'audit'));

    if (filters?.listKey) {
      q = query(q, where('listKey', '==', filters.listKey));
    }
    if (filters?.action) {
      q = query(q, where('action', '==', filters.action));
    }

    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    })) as AuditEntry[];

    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error('❌ Erreur récupération audit:', error);
    return [];
  }
};

// ============================================================================
// DUPLICATION
// ============================================================================

/**
 * Dupliquer les listes d'un établissement à un autre
 */
export const duplicateLists = async (userId: string, input: DuplicateListsInput): Promise<void> => {
  try {
    const sourceLists = await getAllLists(input.fromEstablishmentId);
    if (!sourceLists) throw new Error('Listes source non trouvées');

    const targetLists = await getAllLists(input.toEstablishmentId);

    const listKeys = input.listKeys || Object.keys(sourceLists.lists);

    const newLists = { ...targetLists?.lists };

    for (const listKey of listKeys) {
      const sourceList = sourceLists.lists[listKey];
      if (!sourceList) continue;

      if (input.overwrite || !newLists[listKey]) {
        // Nettoyer les valeurs undefined avant de copier
        newLists[listKey] = removeUndefinedFields(sourceList);
      }
    }

    // Nettoyer l'objet complet avant la mise à jour Firestore
    const cleanedLists = removeUndefinedFields(newLists);

    const docRef = getListsDocPath(input.toEstablishmentId);
    await updateDoc(docRef, {
      lists: cleanedLists,
      lastModified: serverTimestamp(),
      modifiedBy: userId,
    });

    await logAudit(
      input.toEstablishmentId,
      userId,
      'DUPLICATE',
      'multiple',
      'multiple',
      targetLists?.lists,
      cleanedLists
    );

    console.log('✅ Listes dupliquées');
  } catch (error) {
    console.error('❌ Erreur duplication:', error);
    throw error;
  }
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valider un item
 */
export const validateItem = (item: Partial<ReferenceItem>, listKey?: ListKey): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rules = DEFAULT_VALIDATION_RULES;

  // Listes qui acceptent des valeurs courtes (1 caractère minimum)
  const shortValueLists: ListKey[] = ['floors', 'buildings'];
  const allowShortValues = listKey && shortValueLists.includes(listKey);
  const minLength = allowShortValues ? 1 : rules.value.minLength;

  // Pattern de validation personnalisé pour les étages (accepte les négatifs)
  const pattern = listKey === 'floors'
    ? /^-?[a-z0-9_]+$/  // Accepte le tiret au début pour les sous-sols
    : rules.value.pattern;

  // Valeur
  if (item.value) {
    if (!pattern.test(item.value)) {
      const message = listKey === 'floors'
        ? 'La valeur doit contenir uniquement minuscules, chiffres, underscore et tiret (pour les sous-sols)'
        : 'La valeur doit contenir uniquement minuscules, chiffres et underscore';
      errors.push(message);
    }
    if (item.value.length < minLength) {
      errors.push(`La valeur doit contenir au moins ${minLength} caractère${minLength > 1 ? 's' : ''}`);
    }
    if (item.value.length > rules.value.maxLength) {
      errors.push(`La valeur doit contenir au maximum ${rules.value.maxLength} caractères`);
    }
    if (rules.value.reserved.includes(item.value)) {
      errors.push('Cette valeur est réservée');
    }
  } else {
    errors.push('La valeur est obligatoire');
  }

  // Label
  if (rules.label.required && !item.label) {
    errors.push('Le label est requis');
  }
  if (item.label) {
    if (item.label.length < minLength) {
      errors.push(`Le label doit contenir au moins ${minLength} caractère${minLength > 1 ? 's' : ''}`);
    }
    if (item.label.length > rules.label.maxLength) {
      errors.push(`Le label doit contenir au maximum ${rules.label.maxLength} caractères`);
    }
  }

  // Couleur
  if (item.color && !rules.color.allowed.includes(item.color)) {
    errors.push(`Couleur invalide. Utilisez: ${rules.color.allowed.join(', ')}`);
  }

  // Icône
  if (item.icon && !(LucideIcons as any)[item.icon]) {
    warnings.push(`L'icône "${item.icon}" n'existe pas dans Lucide`);
  }

  // Description
  if (item.description && item.description.length > rules.description.maxLength) {
    warnings.push(`La description est très longue (max ${rules.description.maxLength} caractères)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// ============================================================================
// SUGGESTIONS
// ============================================================================

/**
 * Suggérer des améliorations
 */
export const getSuggestions = (item: Partial<ReferenceItem>): SmartSuggestion[] => {
  const suggestions: SmartSuggestion[] = [];

  // Suggérer icône
  if (item.label && !item.icon) {
    const icon = suggestIcon(item.label);
    if (icon) {
      suggestions.push({
        type: 'icon',
        field: 'icon',
        suggestion: icon,
        confidence: 0.8,
        reason: `Icône suggérée pour "${item.label}"`,
      });
    }
  }

  // Suggérer couleur
  if (item.label && !item.color) {
    const color = suggestColor(item.label);
    if (color) {
      suggestions.push({
        type: 'color',
        field: 'color',
        suggestion: color,
        confidence: 0.7,
        reason: `Couleur suggérée pour "${item.label}"`,
      });
    }
  }

  // Suggérer valeur technique
  if (item.label && !item.value) {
    const value = suggestValue(item.label);
    suggestions.push({
      type: 'value',
      field: 'value',
      suggestion: value,
      confidence: 0.9,
      reason: `Valeur technique générée depuis "${item.label}"`,
    });
  }

  return suggestions;
};

const suggestIcon = (label: string): string | null => {
  const lower = label.toLowerCase();
  const iconMap: Record<string, string> = {
    plomberie: 'Droplet',
    électricité: 'Zap',
    chauffage: 'Flame',
    climatisation: 'Wind',
    menuiserie: 'Hammer',
    peinture: 'Paintbrush',
    serrurerie: 'Key',
    nettoyage: 'Sparkles',
    informatique: 'Monitor',
    urgent: 'AlertCircle',
    basse: 'ArrowDown',
    haute: 'ArrowUp',
  };

  for (const [key, icon] of Object.entries(iconMap)) {
    if (lower.includes(key)) return icon;
  }

  return null;
};

const suggestColor = (label: string): string | null => {
  const lower = label.toLowerCase();
  const colorMap: Record<string, string> = {
    urgent: 'red',
    critique: 'red',
    haute: 'orange',
    normale: 'blue',
    basse: 'green',
    électricité: 'yellow',
    plomberie: 'blue',
    chauffage: 'orange',
  };

  for (const [key, color] of Object.entries(colorMap)) {
    if (lower.includes(key)) return color;
  }

  return null;
};

const suggestValue = (label: string): string => {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

// ============================================================================
// UTILS
// ============================================================================

const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

const checkItemUsage = async (
  _establishmentId: string,
  _listKey: ListKey,
  _itemId: string
): Promise<{ count: number }> => {
  // TODO: Implémenter vérification usage dans interventions, etc.
  return { count: 0 };
};

// ============================================================================
// LOGGING & DEBUG
// ============================================================================

/**
 * Logger un résumé détaillé de toutes les listes d'un établissement
 */
export const logListsSummary = async (establishmentId: string): Promise<void> => {
  try {
    console.log('\n🔍 ========================================');
    console.log(`📊 RÉSUMÉ DES LISTES - Établissement: ${establishmentId}`);
    console.log('==========================================\n');

    const allLists = await getAllLists(establishmentId);

    if (!allLists) {
      console.log('❌ Aucune liste trouvée pour cet établissement');
      console.log('==========================================\n');
      return;
    }

    const listKeys = Object.keys(allLists.lists);
    const totalLists = listKeys.length;

    console.log(`📋 Nombre total de listes: ${totalLists}`);
    console.log(`📅 Dernière modification: ${allLists.lastModified}`);
    console.log(`👤 Modifié par: ${allLists.modifiedBy}`);
    console.log(`🔢 Version: ${allLists.version || 'N/A'}\n`);

    // Statistiques globales
    let totalItems = 0;
    let totalActiveItems = 0;
    let totalInactiveItems = 0;
    const systemLists: string[] = [];
    const customLists: string[] = [];
    const emptyLists: string[] = [];

    // Analyser chaque liste
    listKeys.forEach(listKey => {
      const list = allLists.lists[listKey];
      const itemCount = list.items.length;
      const activeCount = list.items.filter(i => i.isActive).length;
      const inactiveCount = itemCount - activeCount;

      totalItems += itemCount;
      totalActiveItems += activeCount;
      totalInactiveItems += inactiveCount;

      if (list.isSystem) systemLists.push(listKey);
      if (list.allowCustom) customLists.push(listKey);
      if (itemCount === 0) emptyLists.push(listKey);
    });

    console.log('📈 STATISTIQUES GLOBALES:');
    console.log(`   • Items totaux: ${totalItems}`);
    console.log(`   • Items actifs: ${totalActiveItems}`);
    console.log(`   • Items inactifs: ${totalInactiveItems}`);
    console.log(`   • Listes système: ${systemLists.length}`);
    console.log(`   • Listes personnalisables: ${customLists.length}`);
    console.log(`   • Listes vides: ${emptyLists.length}\n`);

    console.log('📝 DÉTAIL PAR LISTE:\n');

    // Afficher chaque liste
    listKeys.sort().forEach((listKey, index) => {
      const list = allLists.lists[listKey];
      const itemCount = list.items.length;
      const activeCount = list.items.filter(i => i.isActive).length;
      const inactiveCount = itemCount - activeCount;

      const badges: string[] = [];
      if (list.isSystem) badges.push('🔒 SYSTÈME');
      if (list.allowCustom) badges.push('✏️ PERSONNALISABLE');
      if (list.isRequired) badges.push('⚠️ REQUIS');
      if (itemCount === 0) badges.push('📭 VIDE');

      console.log(`${index + 1}. ${list.name} (${listKey})`);
      console.log(`   ${badges.join(' ')}`);
      console.log(`   📊 Items: ${itemCount} total | ${activeCount} actifs | ${inactiveCount} inactifs`);

      if (list.description) {
        console.log(`   📄 Description: ${list.description}`);
      }

      // Afficher les items si la liste n'est pas vide
      if (itemCount > 0 && itemCount <= 10) {
        console.log(`   📌 Items:`);
        list.items.forEach(item => {
          const status = item.isActive ? '✅' : '❌';
          const color = item.color ? `[${item.color}]` : '';
          const icon = item.icon ? `{${item.icon}}` : '';
          const usage = item.usageCount ? `(utilisé ${item.usageCount} fois)` : '';
          console.log(`      ${status} ${item.label} ${color} ${icon} ${usage}`);
        });
      } else if (itemCount > 10) {
        console.log(`   📌 Premiers items:`);
        list.items.slice(0, 5).forEach(item => {
          const status = item.isActive ? '✅' : '❌';
          const color = item.color ? `[${item.color}]` : '';
          const usage = item.usageCount ? `(utilisé ${item.usageCount} fois)` : '';
          console.log(`      ${status} ${item.label} ${color} ${usage}`);
        });
        console.log(`      ... et ${itemCount - 5} autres`);
      }

      console.log('');
    });

    console.log('==========================================');
    console.log('✅ Résumé terminé\n');
  } catch (error) {
    console.error('❌ Erreur lors du logging du résumé:', error);
  }
};

/**
 * Logger uniquement les noms des listes (vue compacte)
 */
export const logListsCompact = async (establishmentId: string): Promise<void> => {
  try {
    const allLists = await getAllLists(establishmentId);

    if (!allLists) {
      console.log(`❌ [${establishmentId}] Aucune liste trouvée`);
      return;
    }

    const listKeys = Object.keys(allLists.lists);
    console.log(`\n📋 [${establishmentId}] ${listKeys.length} listes:`);
    listKeys.sort().forEach((key, index) => {
      const list = allLists.lists[key];
      const badges = [];
      if (list.isSystem) badges.push('🔒');
      if (list.allowCustom) badges.push('✏️');
      if (list.items.length === 0) badges.push('📭');
      console.log(`   ${index + 1}. ${key.padEnd(30)} (${list.items.length} items) ${badges.join(' ')}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Erreur lors du logging compact:', error);
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // CRUD
  getAllLists,
  getList,
  getActiveItems,
  initializeEmptyLists,
  createList,
  deleteList,

  // Items
  addItem,
  updateItem,
  deactivateItem,
  deleteItem,
  reorderItems,

  // Import/Export
  exportToExcel,
  importFromFile,

  // Analytics
  getListAnalytics,
  trackItemUsage,

  // Audit
  getAuditHistory,

  // Duplication
  duplicateLists,

  // Validation
  validateItem,
  getSuggestions,

  // Logging & Debug
  logListsSummary,
  logListsCompact,
};
