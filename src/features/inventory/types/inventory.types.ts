/**
 * ============================================================================
 * INVENTORY - TYPE DEFINITIONS
 * ============================================================================
 *
 * Types pour la gestion de l'inventaire
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Catégories d'articles d'inventaire
 */
export type InventoryCategory =
  | 'cleaning'
  | 'maintenance'
  | 'furniture'
  | 'electronics'
  | 'linens'
  | 'tools'
  | 'safety'
  | 'office'
  | 'kitchenware'
  | 'bathroom'
  | 'other';

/**
 * Unités de mesure
 */
export type MeasurementUnit =
  | 'piece'
  | 'box'
  | 'liter'
  | 'kilogram'
  | 'meter'
  | 'pack'
  | 'roll'
  | 'bottle'
  | 'set'
  | 'other';

/**
 * Statut de l'article
 */
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';

/**
 * Article d'inventaire
 */
export interface InventoryItem {
  id: string;
  establishmentId: string;

  // Informations de base
  name: string;
  sku?: string; // Code article
  category: InventoryCategory;
  description?: string;
  imageUrl?: string;

  // Stock
  quantity: number;
  unit: MeasurementUnit;
  minQuantity: number; // Seuil d'alerte
  maxQuantity?: number; // Stock maximum
  status: InventoryStatus;

  // Prix
  unitPrice?: number;
  totalValue: number; // quantity * unitPrice

  // Fournisseur
  supplierId?: string; // Référence au fournisseur
  supplierName?: string; // Dénormalisé pour performance

  // Localisation
  location?: string; // Zone de stockage
  room?: string; // Chambre/Local

  // Notes
  notes?: string;
  tags?: string[];

  // Métadonnées
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
  lastStockUpdateAt?: Timestamp;
}

/**
 * Mouvement de stock
 */
export interface StockMovement {
  id: string;
  itemId: string;
  establishmentId: string;

  // Type de mouvement
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;

  // Raison
  reason?: string;
  reference?: string; // Numéro de commande, etc.

  // Intervention liée (si mouvement pour intervention)
  interventionId?: string;

  // Utilisateur
  userId: string;
  userName: string;

  // Métadonnées
  createdAt: Timestamp;
  notes?: string;
}

/**
 * Données pour créer un article
 */
export interface CreateInventoryItemData {
  name: string;
  sku?: string;
  category: InventoryCategory;
  description?: string;
  quantity: number;
  unit: MeasurementUnit;
  minQuantity: number;
  maxQuantity?: number;
  unitPrice?: number;
  supplierId?: string;
  location?: string;
  room?: string;
  notes?: string;
  tags?: string[];
}

/**
 * Données pour mettre à jour un article
 */
export interface UpdateInventoryItemData extends Partial<CreateInventoryItemData> {
  imageUrl?: string;
}

/**
 * Données pour un mouvement de stock
 */
export interface CreateStockMovementData {
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reason?: string;
  reference?: string;
  interventionId?: string;
  notes?: string;
}

/**
 * Filtres pour la liste d'inventaire
 */
export interface InventoryFilters {
  category?: InventoryCategory;
  status?: InventoryStatus;
  supplierId?: string;
  location?: string;
  search?: string;
  tags?: string[];
}

/**
 * Options de tri
 */
export interface InventorySortOptions {
  field: 'name' | 'quantity' | 'category' | 'totalValue' | 'lastStockUpdateAt';
  order: 'asc' | 'desc';
}

/**
 * Labels des catégories
 */
export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  cleaning: "Produits d'entretien",
  maintenance: 'Maintenance',
  furniture: 'Mobilier',
  electronics: 'Électronique',
  linens: 'Linge',
  tools: 'Outils',
  safety: 'Sécurité',
  office: 'Bureautique',
  kitchenware: 'Ustensiles de cuisine',
  bathroom: 'Salle de bain',
  other: 'Autre',
};

/**
 * Labels des unités
 */
export const MEASUREMENT_UNIT_LABELS: Record<MeasurementUnit, string> = {
  piece: 'Pièce',
  box: 'Boîte',
  liter: 'Litre',
  kilogram: 'Kilogramme',
  meter: 'Mètre',
  pack: 'Paquet',
  roll: 'Rouleau',
  bottle: 'Bouteille',
  set: 'Ensemble',
  other: 'Autre',
};

/**
 * Labels des statuts
 */
export const INVENTORY_STATUS_LABELS: Record<InventoryStatus, string> = {
  in_stock: 'En stock',
  low_stock: 'Stock faible',
  out_of_stock: 'Rupture de stock',
  discontinued: 'Discontinué',
};

/**
 * Couleurs des statuts
 */
export const INVENTORY_STATUS_COLORS: Record<InventoryStatus, string> = {
  in_stock: 'green',
  low_stock: 'orange',
  out_of_stock: 'red',
  discontinued: 'gray',
};
