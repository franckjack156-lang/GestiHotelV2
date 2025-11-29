/**
 * ============================================================================
 * USE INVENTORY HOOK
 * ============================================================================
 *
 * Hook pour gérer l'inventaire
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem as createInventoryItemService,
  updateInventoryItem as updateInventoryItemService,
  deleteInventoryItem as deleteInventoryItemService,
  createStockMovement as createStockMovementService,
  getStockMovements,
  getLowStockItems,
  getOutOfStockItems,
} from '../services/inventoryService';
import { logger } from '@/core/utils/logger';
import type {
  InventoryItem,
  StockMovement,
  CreateInventoryItemData,
  UpdateInventoryItemData,
  CreateStockMovementData,
  InventoryFilters,
} from '../types/inventory.types';

export const useInventory = (establishmentId: string | null) => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger les articles d'inventaire
   */
  const loadItems = useCallback(
    async (filters?: InventoryFilters) => {
      if (!establishmentId) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getInventoryItems(establishmentId, filters);
        setItems(data);
      } catch (err: unknown) {
        logger.error('Error loading inventory items:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        toast.error('Erreur de chargement', {
          description: "Impossible de charger l'inventaire",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [establishmentId]
  );

  /**
   * Charger au montage
   */
  useEffect(() => {
    if (establishmentId) {
      loadItems();
    }
  }, [establishmentId, loadItems]);

  /**
   * Récupérer un article par ID
   */
  const getItem = useCallback(
    (itemId: string): InventoryItem | undefined => {
      return items.find(item => item.id === itemId);
    },
    [items]
  );

  /**
   * Créer un article
   */
  const createItem = useCallback(
    async (data: CreateInventoryItemData): Promise<string | null> => {
      if (!establishmentId || !user) {
        toast.error('Erreur', { description: 'Établissement ou utilisateur non défini' });
        return null;
      }

      try {
        const id = await createInventoryItemService(establishmentId, user.id, data);
        toast.success('Article créé avec succès');
        await loadItems();
        return id;
      } catch (err: unknown) {
        logger.error('Error creating inventory item:', err);
        toast.error('Erreur de création', {
          description: err instanceof Error ? err.message : 'Erreur inconnue',
        });
        return null;
      }
    },
    [establishmentId, user, loadItems]
  );

  /**
   * Mettre à jour un article
   */
  const updateItem = useCallback(
    async (itemId: string, data: UpdateInventoryItemData): Promise<boolean> => {
      if (!establishmentId || !user) {
        toast.error('Erreur', { description: 'Établissement ou utilisateur non défini' });
        return false;
      }

      try {
        await updateInventoryItemService(establishmentId, itemId, user.id, data);
        toast.success('Article mis à jour');
        await loadItems();
        return true;
      } catch (err: unknown) {
        logger.error('Error updating inventory item:', err);
        toast.error('Erreur de mise à jour', {
          description: err instanceof Error ? err.message : 'Erreur inconnue',
        });
        return false;
      }
    },
    [establishmentId, user, loadItems]
  );

  /**
   * Supprimer un article
   */
  const deleteItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!establishmentId) {
        toast.error('Erreur', { description: 'Établissement non défini' });
        return false;
      }

      try {
        await deleteInventoryItemService(establishmentId, itemId);
        toast.success('Article supprimé');
        await loadItems();
        return true;
      } catch (err: unknown) {
        logger.error('Error deleting inventory item:', err);
        toast.error('Erreur de suppression', {
          description: err instanceof Error ? err.message : 'Erreur inconnue',
        });
        return false;
      }
    },
    [establishmentId, loadItems]
  );

  /**
   * Créer un mouvement de stock
   */
  const createMovement = useCallback(
    async (itemId: string, data: CreateStockMovementData): Promise<boolean> => {
      if (!establishmentId || !user) {
        toast.error('Erreur', { description: 'Établissement ou utilisateur non défini' });
        return false;
      }

      try {
        const userName = user.displayName || user.email || 'Utilisateur';
        await createStockMovementService(establishmentId, itemId, user.id, userName, data);

        const typeLabels = {
          in: 'Entrée de stock',
          out: 'Sortie de stock',
          adjustment: 'Ajustement',
          transfer: 'Transfert',
        };

        toast.success(typeLabels[data.type], {
          description: `Quantité: ${data.quantity}`,
        });

        await loadItems();
        return true;
      } catch (err: unknown) {
        logger.error('Error creating stock movement:', err);
        toast.error('Erreur de mouvement', {
          description: err instanceof Error ? err.message : 'Erreur inconnue',
        });
        return false;
      }
    },
    [establishmentId, user, loadItems]
  );

  return {
    items,
    isLoading,
    error,
    loadItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    createMovement,
  };
};

/**
 * Hook pour un article spécifique
 */
export const useInventoryItem = (establishmentId: string | null, itemId: string | null) => {
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItem = useCallback(async () => {
    if (!establishmentId || !itemId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [itemData, movementsData] = await Promise.all([
        getInventoryItem(establishmentId, itemId),
        getStockMovements(establishmentId, itemId),
      ]);

      setItem(itemData);
      setMovements(movementsData);
    } catch (err: unknown) {
      logger.error('Error loading inventory item:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast.error('Erreur de chargement', {
        description: "Impossible de charger l'article",
      });
    } finally {
      setIsLoading(false);
    }
  }, [establishmentId, itemId]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  return {
    item,
    movements,
    isLoading,
    error,
    reload: loadItem,
  };
};

/**
 * Hook pour les alertes de stock
 */
export const useStockAlerts = (establishmentId: string | null) => {
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [outOfStock, setOutOfStock] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAlerts = useCallback(async () => {
    if (!establishmentId) return;

    setIsLoading(true);

    try {
      const [low, out] = await Promise.all([
        getLowStockItems(establishmentId),
        getOutOfStockItems(establishmentId),
      ]);

      setLowStock(low);
      setOutOfStock(out);
    } catch (err: unknown) {
      logger.error('Error loading stock alerts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  return {
    lowStock,
    outOfStock,
    totalAlerts: lowStock.length + outOfStock.length,
    isLoading,
    reload: loadAlerts,
  };
};
