/**
 * Hook pour la gestion de la corbeille
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  getDeletedItems,
  getTrashStats,
  restoreItem,
  restoreItems,
  permanentlyDeleteItem,
  permanentlyDeleteItems,
  emptyTrash,
  type TrashItem,
  type TrashItemType,
  type TrashStats,
} from '@/shared/services/trashService';

interface UseTrashOptions {
  type?: TrashItemType;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useTrash = (options: UseTrashOptions = {}) => {
  const { type, autoRefresh = false, refreshInterval = 60000 } = options;

  const { user } = useAuthStore();
  const establishmentId = user?.currentEstablishmentId || user?.establishmentIds?.[0];

  const [items, setItems] = useState<TrashItem[]>([]);
  const [stats, setStats] = useState<TrashStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  /**
   * Charger les éléments de la corbeille
   */
  const loadItems = useCallback(async () => {
    if (!establishmentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [itemsData, statsData] = await Promise.all([
        getDeletedItems(establishmentId, { type, limit: 100 }),
        getTrashStats(establishmentId),
      ]);

      setItems(itemsData);
      setStats(statsData);
    } catch (err) {
      setError('Erreur lors du chargement de la corbeille');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [establishmentId, type]);

  /**
   * Restaurer un élément
   */
  const restore = useCallback(
    async (item: TrashItem) => {
      if (!user) return false;

      try {
        await restoreItem(item.originalPath, user.id);
        toast.success(`"${item.title}" restauré avec succès`);
        await loadItems();
        return true;
      } catch {
        toast.error('Erreur lors de la restauration');
        return false;
      }
    },
    [user, loadItems]
  );

  /**
   * Restaurer les éléments sélectionnés
   */
  const restoreSelected = useCallback(async () => {
    if (!user || selectedItems.size === 0) return;

    const itemsToRestore = items
      .filter(item => selectedItems.has(item.id))
      .map(item => ({ path: item.originalPath }));

    try {
      const result = await restoreItems(itemsToRestore, user.id);
      toast.success(`${result.success} élément(s) restauré(s)`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} élément(s) n'ont pas pu être restaurés`);
      }
      setSelectedItems(new Set());
      await loadItems();
    } catch {
      toast.error('Erreur lors de la restauration');
    }
  }, [user, items, selectedItems, loadItems]);

  /**
   * Supprimer définitivement un élément
   */
  const permanentDelete = useCallback(
    async (item: TrashItem) => {
      try {
        await permanentlyDeleteItem(item.originalPath);
        toast.success(`"${item.title}" supprimé définitivement`);
        await loadItems();
        return true;
      } catch {
        toast.error('Erreur lors de la suppression');
        return false;
      }
    },
    [loadItems]
  );

  /**
   * Supprimer définitivement les éléments sélectionnés
   */
  const permanentDeleteSelected = useCallback(async () => {
    if (selectedItems.size === 0) return;

    const itemsToDelete = items
      .filter(item => selectedItems.has(item.id))
      .map(item => ({ path: item.originalPath }));

    try {
      const result = await permanentlyDeleteItems(itemsToDelete);
      toast.success(`${result.success} élément(s) supprimé(s) définitivement`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} élément(s) n'ont pas pu être supprimés`);
      }
      setSelectedItems(new Set());
      await loadItems();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }, [items, selectedItems, loadItems]);

  /**
   * Vider la corbeille
   */
  const empty = useCallback(
    async (onlyExpired = true) => {
      if (!establishmentId) return;

      try {
        const count = await emptyTrash(establishmentId, { onlyExpired, type });
        if (count > 0) {
          toast.success(`${count} élément(s) supprimé(s) définitivement`);
        } else {
          toast.info('La corbeille est déjà vide');
        }
        await loadItems();
      } catch {
        toast.error('Erreur lors du vidage de la corbeille');
      }
    },
    [establishmentId, type, loadItems]
  );

  /**
   * Sélectionner/désélectionner un élément
   */
  const toggleSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  /**
   * Sélectionner/désélectionner tous les éléments
   */
  const toggleSelectAll = useCallback(() => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  }, [items, selectedItems.size]);

  /**
   * Filtrer par type
   */
  const filterByType = useCallback(
    (filterType: TrashItemType | 'all') => {
      if (filterType === 'all') {
        return items;
      }
      return items.filter(item => item.type === filterType);
    },
    [items]
  );

  // Charger les données au montage
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Auto-refresh si activé
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadItems, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadItems]);

  return {
    // Données
    items,
    stats,
    isLoading,
    error,
    selectedItems,
    isAllSelected: selectedItems.size === items.length && items.length > 0,

    // Actions
    loadItems,
    restore,
    restoreSelected,
    permanentDelete,
    permanentDeleteSelected,
    empty,

    // Sélection
    toggleSelection,
    toggleSelectAll,

    // Filtres
    filterByType,
  };
};

export type { TrashItem, TrashItemType, TrashStats };
