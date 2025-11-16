/**
 * ============================================================================
 * SUPPLIERS - TYPE DEFINITIONS
 * ============================================================================
 *
 * Types pour la gestion des fournisseurs
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Catégories de fournisseurs
 */
export type SupplierCategory =
  | 'maintenance'
  | 'cleaning'
  | 'food'
  | 'beverage'
  | 'laundry'
  | 'equipment'
  | 'furniture'
  | 'technology'
  | 'security'
  | 'utilities'
  | 'other';

/**
 * Statut du fournisseur
 */
export type SupplierStatus = 'active' | 'inactive' | 'archived';

/**
 * Contact d'un fournisseur
 */
export interface SupplierContact {
  firstName: string;
  lastName: string;
  role?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  isPrimary: boolean;
}

/**
 * Adresse d'un fournisseur
 */
export interface SupplierAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  region?: string;
}

/**
 * Conditions de paiement
 */
export interface PaymentTerms {
  method?: string; // 'card', 'transfer', 'check', 'cash'
  delayDays?: number; // Délai de paiement (ex: 30 jours)
  discountPercent?: number; // Remise accordée
}

/**
 * Évaluation du fournisseur
 */
export interface SupplierRating {
  quality: number; // 1-5
  deliveryTime: number; // 1-5
  customerService: number; // 1-5
  priceValue: number; // 1-5
  overall: number; // Moyenne calculée
  reviewCount: number;
  lastReviewDate?: Timestamp;
}

/**
 * Fournisseur
 */
export interface Supplier {
  id: string;
  establishmentId: string;

  // Informations générales
  name: string;
  category: SupplierCategory;
  description?: string;
  logo?: string;
  website?: string;

  // Statut
  status: SupplierStatus;

  // Contact
  email?: string;
  phone?: string;
  fax?: string;
  contacts: SupplierContact[];

  // Adresse
  address?: SupplierAddress;

  // Informations commerciales
  siret?: string;
  vatNumber?: string;
  paymentTerms?: PaymentTerms;

  // Évaluation
  rating?: SupplierRating;

  // Statistiques
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: Timestamp;

  // Documents
  contractUrl?: string;
  certificatesUrls?: string[];

  // Notes
  notes?: string;
  tags?: string[];

  // Métadonnées
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

/**
 * Données pour créer un fournisseur
 */
export interface CreateSupplierData {
  name: string;
  category: SupplierCategory;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: SupplierAddress;
  contacts?: SupplierContact[];
  siret?: string;
  vatNumber?: string;
  paymentTerms?: PaymentTerms;
  notes?: string;
  tags?: string[];
}

/**
 * Données pour mettre à jour un fournisseur
 */
export interface UpdateSupplierData extends Partial<CreateSupplierData> {
  status?: SupplierStatus;
  logo?: string;
  contractUrl?: string;
  certificatesUrls?: string[];
}

/**
 * Filtres pour la liste des fournisseurs
 */
export interface SupplierFilters {
  category?: SupplierCategory;
  status?: SupplierStatus;
  search?: string;
  tags?: string[];
}

/**
 * Options de tri
 */
export interface SupplierSortOptions {
  field: 'name' | 'category' | 'createdAt' | 'lastOrderDate' | 'totalSpent' | 'rating';
  order: 'asc' | 'desc';
}

/**
 * Labels des catégories
 */
export const SUPPLIER_CATEGORY_LABELS: Record<SupplierCategory, string> = {
  maintenance: 'Maintenance',
  cleaning: 'Nettoyage',
  food: 'Alimentation',
  beverage: 'Boissons',
  laundry: 'Blanchisserie',
  equipment: 'Équipement',
  furniture: 'Mobilier',
  technology: 'Technologie',
  security: 'Sécurité',
  utilities: 'Utilités',
  other: 'Autre',
};

/**
 * Labels des statuts
 */
export const SUPPLIER_STATUS_LABELS: Record<SupplierStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  archived: 'Archivé',
};

/**
 * Couleurs des statuts
 */
export const SUPPLIER_STATUS_COLORS: Record<SupplierStatus, string> = {
  active: 'green',
  inactive: 'gray',
  archived: 'red',
};
