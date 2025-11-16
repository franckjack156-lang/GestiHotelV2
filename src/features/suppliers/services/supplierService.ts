/**
 * ============================================================================
 * SUPPLIERS SERVICE
 * ============================================================================
 *
 * Service pour la gestion des fournisseurs dans Firestore
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type QueryConstraint,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type {
  Supplier,
  CreateSupplierData,
  UpdateSupplierData,
  SupplierFilters,
  SupplierSortOptions,
} from '../types/supplier.types';

/**
 * Collection name
 */
const COLLECTION_NAME = 'suppliers';

/**
 * Obtenir la référence de la collection
 */
const getSuppliersCollection = (establishmentId: string) => {
  return collection(db, 'establishments', establishmentId, COLLECTION_NAME);
};

/**
 * Nettoyer un objet en supprimant les valeurs undefined
 */
const removeUndefinedFields = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      // Si c'est un objet imbriqué, le nettoyer récursivement
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const cleanedNested = removeUndefinedFields(value);
        // Ne garder l'objet que s'il a des propriétés
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
 * Obtenir tous les fournisseurs d'un établissement
 */
export const getSuppliers = async (
  establishmentId: string,
  filters?: SupplierFilters,
  sortOptions?: SupplierSortOptions
): Promise<Supplier[]> => {
  const constraints: QueryConstraint[] = [];

  // Filtres
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  if (filters?.tags && filters.tags.length > 0) {
    constraints.push(where('tags', 'array-contains-any', filters.tags));
  }

  // Tri
  const sortField = sortOptions?.field || 'name';
  const sortOrder = sortOptions?.order || 'asc';
  constraints.push(orderBy(sortField, sortOrder));

  const q = query(getSuppliersCollection(establishmentId), ...constraints);

  const snapshot = await getDocs(q);

  let suppliers = snapshot.docs.map(
    doc =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Supplier
  );

  // Recherche textuelle côté client (Firestore ne supporte pas LIKE)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    suppliers = suppliers.filter(
      supplier =>
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.description?.toLowerCase().includes(searchLower) ||
        supplier.email?.toLowerCase().includes(searchLower)
    );
  }

  return suppliers;
};

/**
 * Obtenir un fournisseur par ID
 */
export const getSupplierById = async (
  establishmentId: string,
  supplierId: string
): Promise<Supplier | null> => {
  const docRef = doc(getSuppliersCollection(establishmentId), supplierId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Supplier;
};

/**
 * Créer un nouveau fournisseur
 */
export const createSupplier = async (
  establishmentId: string,
  userId: string,
  data: CreateSupplierData
): Promise<string> => {
  const supplierData = {
    ...data,
    establishmentId,
    status: 'active' as const,
    contacts: data.contacts || [],
    orderCount: 0,
    totalSpent: 0,
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  // Nettoyer les champs undefined avant d'envoyer à Firestore
  const cleanedData = removeUndefinedFields(supplierData);

  const docRef = await addDoc(getSuppliersCollection(establishmentId), cleanedData);

  return docRef.id;
};

/**
 * Mettre à jour un fournisseur
 */
export const updateSupplier = async (
  establishmentId: string,
  supplierId: string,
  userId: string,
  data: UpdateSupplierData
): Promise<void> => {
  const docRef = doc(getSuppliersCollection(establishmentId), supplierId);

  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  // Nettoyer les champs undefined avant d'envoyer à Firestore
  const cleanedData = removeUndefinedFields(updateData);

  await updateDoc(docRef, cleanedData);
};

/**
 * Supprimer un fournisseur
 */
export const deleteSupplier = async (
  establishmentId: string,
  supplierId: string
): Promise<void> => {
  const docRef = doc(getSuppliersCollection(establishmentId), supplierId);
  await deleteDoc(docRef);
};

/**
 * Archiver un fournisseur
 */
export const archiveSupplier = async (
  establishmentId: string,
  supplierId: string,
  userId: string
): Promise<void> => {
  await updateSupplier(establishmentId, supplierId, userId, {
    status: 'archived',
  });
};

/**
 * Restaurer un fournisseur archivé
 */
export const restoreSupplier = async (
  establishmentId: string,
  supplierId: string,
  userId: string
): Promise<void> => {
  await updateSupplier(establishmentId, supplierId, userId, {
    status: 'active',
  });
};

/**
 * Incrémenter le nombre de commandes
 */
export const incrementOrderCount = async (
  establishmentId: string,
  supplierId: string,
  amount: number
): Promise<void> => {
  const docRef = doc(getSuppliersCollection(establishmentId), supplierId);

  await updateDoc(docRef, {
    orderCount: increment(1),
    totalSpent: increment(amount),
    lastOrderDate: serverTimestamp(),
  });
};

/**
 * Mettre à jour l'évaluation
 */
export const updateSupplierRating = async (
  establishmentId: string,
  supplierId: string,
  rating: {
    quality: number;
    deliveryTime: number;
    customerService: number;
    priceValue: number;
  }
): Promise<void> => {
  const docRef = doc(getSuppliersCollection(establishmentId), supplierId);

  // Calculer la moyenne
  const overall =
    (rating.quality + rating.deliveryTime + rating.customerService + rating.priceValue) / 4;

  // Récupérer le fournisseur actuel pour incrémenter reviewCount
  const supplier = await getSupplierById(establishmentId, supplierId);
  const currentReviewCount = supplier?.rating?.reviewCount || 0;

  await updateDoc(docRef, {
    rating: {
      ...rating,
      overall,
      reviewCount: currentReviewCount + 1,
      lastReviewDate: serverTimestamp(),
    },
  });
};

/**
 * Obtenir les fournisseurs par catégorie
 */
export const getSuppliersByCategory = async (
  establishmentId: string,
  category: string
): Promise<Supplier[]> => {
  const q = query(
    getSuppliersCollection(establishmentId),
    where('category', '==', category),
    where('status', '==', 'active'),
    orderBy('name', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    doc =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Supplier
  );
};

/**
 * Obtenir les meilleurs fournisseurs (par évaluation)
 */
export const getTopRatedSuppliers = async (
  establishmentId: string,
  limitCount: number = 5
): Promise<Supplier[]> => {
  const q = query(
    getSuppliersCollection(establishmentId),
    where('status', '==', 'active'),
    orderBy('rating.overall', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    doc =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Supplier
  );
};

/**
 * Rechercher des fournisseurs
 */
export const searchSuppliers = async (
  establishmentId: string,
  searchTerm: string
): Promise<Supplier[]> => {
  // Récupérer tous les fournisseurs actifs
  const q = query(
    getSuppliersCollection(establishmentId),
    where('status', '==', 'active'),
    orderBy('name', 'asc')
  );

  const snapshot = await getDocs(q);

  const searchLower = searchTerm.toLowerCase();

  return snapshot.docs
    .map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Supplier
    )
    .filter(
      supplier =>
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.description?.toLowerCase().includes(searchLower) ||
        supplier.email?.toLowerCase().includes(searchLower) ||
        supplier.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
};
