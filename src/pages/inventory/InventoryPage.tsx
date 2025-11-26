/**
 * ============================================================================
 * INVENTORY PAGE
 * ============================================================================
 *
 * Page principale de gestion de l'inventaire
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useInventory, useStockAlerts } from '@/features/inventory/hooks/useInventory';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import {
  InventoryItemsList,
  InventoryItemForm,
  StockMovementDialog,
} from '@/features/inventory/components';
import { LoadingSkeleton } from '@/shared/components/ui-extended';
import type {
  InventoryItem,
  CreateInventoryItemData,
  InventoryFilters,
} from '@/features/inventory/types/inventory.types';

export const InventoryPage = () => {
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { items, isLoading, createItem, updateItem, deleteItem: deleteItemFn, createMovement, loadItems } =
    useInventory(establishmentId);
  const { lowStock, outOfStock, totalAlerts } = useStockAlerts(establishmentId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);

  const handleCreate = async (data: CreateInventoryItemData) => {
    const id = await createItem(data);
    if (id) {
      setCreateDialogOpen(false);
    }
  };

  const handleUpdate = async (data: CreateInventoryItemData) => {
    if (!editItem) return;

    const success = await updateItem(editItem.id, data);
    if (success) {
      setEditItem(null);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    const success = await deleteItemFn(itemToDelete.id);
    if (success) {
      setItemToDelete(null);
    }
  };

  const handleStockMovement = async (data: { type: 'in' | 'out' | 'transfer' | 'adjustment'; quantity: number; reason?: string; notes?: string }): Promise<boolean> => {
    if (!movementItem) return false;
    const result = await createMovement(movementItem.id, data);
    return result !== undefined;
  };

  const handleFiltersChange = (filters: InventoryFilters) => {
    loadItems(filters);
  };

  if (isLoading && items.length === 0) {
    return <LoadingSkeleton />;
  }

  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* En-tête - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Inventaire</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gestion des stocks et des articles
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="flex-shrink-0">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden xs:inline">Nouvel article</span>
          <span className="xs:hidden">+</span>
        </Button>
      </div>

      {/* Statistiques - Responsive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total articles</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Valeur totale</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{totalValue.toFixed(2)} €</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:bg-muted/50 transition-colors ${
            lowStock.length > 0 ? 'border-orange-500' : ''
          }`}
          onClick={() => loadItems({ status: 'low_stock' })}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Stock faible</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{lowStock.length}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:bg-muted/50 transition-colors ${
            outOfStock.length > 0 ? 'border-red-500' : ''
          }`}
          onClick={() => loadItems({ status: 'out_of_stock' })}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Rupture</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{outOfStock.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {totalAlerts > 0 && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium">Alertes de stock</p>
                <p className="text-sm text-muted-foreground">
                  {totalAlerts} article{totalAlerts > 1 ? 's' : ''} nécessite{totalAlerts > 1 ? 'nt' : ''} votre attention
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des articles */}
      <InventoryItemsList
        items={items}
        onEdit={setEditItem}
        onDelete={setItemToDelete}
        onStockMovement={setMovementItem}
        onItemClick={item => navigate(`/app/inventory/${item.id}`)}
        onFiltersChange={handleFiltersChange}
      />

      {/* Dialog de création */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvel article</DialogTitle>
          </DialogHeader>
          <InventoryItemForm
            onSubmit={handleCreate}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition */}
      {editItem && (
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier l'article</DialogTitle>
            </DialogHeader>
            <InventoryItemForm
              item={editItem}
              onSubmit={handleUpdate}
              onCancel={() => setEditItem(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de suppression */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'article "{itemToDelete?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de mouvement de stock */}
      <StockMovementDialog
        item={movementItem}
        open={!!movementItem}
        onOpenChange={() => setMovementItem(null)}
        onSubmit={handleStockMovement}
      />
    </div>
  );
};
