/**
 * ============================================================================
 * INVENTORY SERVICE
 * ============================================================================
 *
 * Service pour la gestion de l'inventaire dans Firestore
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type {
  InventoryItem,
  StockMovement,
  CreateInventoryItemData,
  UpdateInventoryItemData,
  CreateStockMovementData,
  InventoryFilters,
  InventoryStatus,
} from '../types/inventory.types';

/**
 * Utilitaire pour nettoyer les champs undefined
 */
const removeUndefinedFields = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const cleanedNested = removeUndefinedFields(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });
  return cleaned;
};

/**
 * Calculer le statut en fonction du stock
 */
const calculateStatus = (quantity: number, minQuantity: number): InventoryStatus => {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= minQuantity) return 'low_stock';
  return 'in_stock';
};

/**
 * Collection référence pour les articles
 */
const getInventoryCollection = (establishmentId: string) =>
  collection(db, 'establishments', establishmentId, 'inventory');

/**
 * Collection référence pour les mouvements
 */
const getStockMovementsCollection = (establishmentId: string) =>
  collection(db, 'establishments', establishmentId, 'stockMovements');

/**
 * Récupérer tous les articles d'inventaire avec filtres
 */
export const getInventoryItems = async (
  establishmentId: string,
  filters?: InventoryFilters
): Promise<InventoryItem[]> => {
  const constraints: QueryConstraint[] = [];

  // Filtres WHERE d'abord
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.supplierId) {
    constraints.push(where('supplierId', '==', filters.supplierId));
  }
  if (filters?.location) {
    constraints.push(where('location', '==', filters.location));
  }

  // Tri par défaut
  constraints.push(orderBy('name', 'asc'));

  const q = query(getInventoryCollection(establishmentId), ...constraints);
  const snapshot = await getDocs(q);

  let items = snapshot.docs.map(
    doc => ({ id: doc.id, ...doc.data() } as InventoryItem)
  );

  // Filtrage côté client pour la recherche
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    items = items.filter(
      item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.sku?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
    );
  }

  // Filtrage par tags
  if (filters?.tags && filters.tags.length > 0) {
    items = items.filter(item =>
      filters.tags?.some(tag => item.tags?.includes(tag))
    );
  }

  return items;
};

/**
 * Récupérer un article par ID
 */
export const getInventoryItem = async (
  establishmentId: string,
  itemId: string
): Promise<InventoryItem | null> => {
  const docRef = doc(db, 'establishments', establishmentId, 'inventory', itemId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return { id: snapshot.id, ...snapshot.data() } as InventoryItem;
};

/**
 * Créer un nouvel article
 */
export const createInventoryItem = async (
  establishmentId: string,
  userId: string,
  data: CreateInventoryItemData
): Promise<string> => {
  const unitPrice = data.unitPrice || 0;
  const totalValue = data.quantity * unitPrice;
  const status = calculateStatus(data.quantity, data.minQuantity);

  const itemData = {
    ...data,
    establishmentId,
    unitPrice,
    totalValue,
    status,
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
    lastStockUpdateAt: serverTimestamp(),
  };

  const cleanedData = removeUndefinedFields(itemData);
  const docRef = await addDoc(getInventoryCollection(establishmentId), cleanedData);

  return docRef.id;
};

/**
 * Mettre à jour un article
 */
export const updateInventoryItem = async (
  establishmentId: string,
  itemId: string,
  userId: string,
  data: UpdateInventoryItemData
): Promise<void> => {
  const docRef = doc(db, 'establishments', establishmentId, 'inventory', itemId);

  // Récupérer l'article actuel pour recalculer le statut si nécessaire
  const currentItem = await getInventoryItem(establishmentId, itemId);
  if (!currentItem) {
    throw new Error('Article non trouvé');
  }

  const quantity = data.quantity !== undefined ? data.quantity : currentItem.quantity;
  const minQuantity = data.minQuantity !== undefined ? data.minQuantity : currentItem.minQuantity;
  const unitPrice = data.unitPrice !== undefined ? data.unitPrice : (currentItem.unitPrice || 0);
  const totalValue = quantity * unitPrice;
  const status = calculateStatus(quantity, minQuantity);

  const updateData = {
    ...data,
    totalValue,
    status,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  const cleanedData = removeUndefinedFields(updateData);
  await updateDoc(docRef, cleanedData);
};

/**
 * Supprimer un article
 */
export const deleteInventoryItem = async (
  establishmentId: string,
  itemId: string
): Promise<void> => {
  const docRef = doc(db, 'establishments', establishmentId, 'inventory', itemId);
  await deleteDoc(docRef);
};

/**
 * Créer un mouvement de stock et mettre à jour l'article
 */
export const createStockMovement = async (
  establishmentId: string,
  itemId: string,
  userId: string,
  userName: string,
  data: CreateStockMovementData
): Promise<string> => {
  const batch = writeBatch(db);

  // 1. Récupérer l'article actuel
  const item = await getInventoryItem(establishmentId, itemId);
  if (!item) {
    throw new Error('Article non trouvé');
  }

  // 2. Calculer la nouvelle quantité
  let newQuantity = item.quantity;
  switch (data.type) {
    case 'in':
      newQuantity += data.quantity;
      break;
    case 'out':
      newQuantity -= data.quantity;
      if (newQuantity < 0) {
        throw new Error('Quantité insuffisante en stock');
      }
      break;
    case 'adjustment':
      newQuantity = data.quantity;
      break;
    case 'transfer':
      // Pour les transferts, on retire du stock actuel
      newQuantity -= data.quantity;
      if (newQuantity < 0) {
        throw new Error('Quantité insuffisante pour le transfert');
      }
      break;
  }

  // 3. Calculer le nouveau statut et la valeur totale
  const status = calculateStatus(newQuantity, item.minQuantity);
  const totalValue = newQuantity * (item.unitPrice || 0);

  // 4. Créer le mouvement de stock
  const movementData = {
    itemId,
    establishmentId,
    ...data,
    quantityBefore: item.quantity,
    quantityAfter: newQuantity,
    userId,
    userName,
    createdAt: serverTimestamp(),
  };

  const cleanedMovementData = removeUndefinedFields(movementData);
  const movementRef = doc(getStockMovementsCollection(establishmentId));
  batch.set(movementRef, cleanedMovementData);

  // 5. Mettre à jour l'article
  const itemRef = doc(db, 'establishments', establishmentId, 'inventory', itemId);
  batch.update(itemRef, {
    quantity: newQuantity,
    status,
    totalValue,
    lastStockUpdateAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  // 6. Exécuter le batch
  await batch.commit();

  return movementRef.id;
};

/**
 * Récupérer l'historique des mouvements pour un article
 */
export const getStockMovements = async (
  establishmentId: string,
  itemId?: string
): Promise<StockMovement[]> => {
  const constraints: QueryConstraint[] = [];

  if (itemId) {
    constraints.push(where('itemId', '==', itemId));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(getStockMovementsCollection(establishmentId), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    doc => ({ id: doc.id, ...doc.data() } as StockMovement)
  );
};

/**
 * Récupérer les articles en stock faible
 */
export const getLowStockItems = async (
  establishmentId: string
): Promise<InventoryItem[]> => {
  return getInventoryItems(establishmentId, { status: 'low_stock' });
};

/**
 * Récupérer les articles en rupture de stock
 */
export const getOutOfStockItems = async (
  establishmentId: string
): Promise<InventoryItem[]> => {
  return getInventoryItems(establishmentId, { status: 'out_of_stock' });
};
