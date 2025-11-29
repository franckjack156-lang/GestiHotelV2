/**
 * ============================================================================
 * SUPPLIERS PAGE
 * ============================================================================
 *
 * Page de gestion des fournisseurs
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { SuppliersList, SupplierForm } from '@/features/suppliers/components';
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers';
import type {
  Supplier,
  CreateSupplierData,
  UpdateSupplierData,
} from '@/features/suppliers/types/supplier.types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEstablishments } from '@/features/establishments/hooks/useEstablishments';

export const SuppliersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentEstablishment } = useEstablishments();

  const {
    suppliers,
    isLoading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    archiveSupplier,
    restoreSupplier,
  } = useSuppliers(currentEstablishment?.id);

  // États des dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Créer un fournisseur
   */
  const handleCreate = async (data: CreateSupplierData) => {
    if (!user) return;

    setIsSubmitting(true);
    const id = await createSupplier(user.id, data);
    setIsSubmitting(false);

    if (id) {
      setIsCreateDialogOpen(false);
    }
  };

  /**
   * Modifier un fournisseur
   */
  const handleEdit = async (data: UpdateSupplierData) => {
    if (!user || !selectedSupplier) return;

    setIsSubmitting(true);
    const success = await updateSupplier(selectedSupplier.id, user.id, data);
    setIsSubmitting(false);

    if (success) {
      setIsEditDialogOpen(false);
      setSelectedSupplier(null);
    }
  };

  /**
   * Supprimer un fournisseur
   */
  const handleDelete = async () => {
    if (!selectedSupplier) return;

    setIsSubmitting(true);
    const success = await deleteSupplier(selectedSupplier.id);
    setIsSubmitting(false);

    if (success) {
      setIsDeleteDialogOpen(false);
      setSelectedSupplier(null);
    }
  };

  /**
   * Archiver un fournisseur
   */
  const handleArchive = async (supplier: Supplier) => {
    if (!user) return;
    await archiveSupplier(supplier.id, user.id);
  };

  /**
   * Restaurer un fournisseur
   */
  const handleRestore = async (supplier: Supplier) => {
    if (!user) return;
    await restoreSupplier(supplier.id, user.id);
  };

  /**
   * Voir les détails d'un fournisseur
   */
  const handleClick = (supplier: Supplier) => {
    navigate(`/app/suppliers/${supplier.id}`);
  };

  /**
   * Ouvrir le dialog d'édition
   */
  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsEditDialogOpen(true);
  };

  /**
   * Ouvrir le dialog de suppression
   */
  const openDeleteDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fournisseurs</h1>
          <p className="text-muted-foreground">Gérez vos fournisseurs et leurs informations</p>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau fournisseur
        </Button>
      </div>

      {/* Liste des fournisseurs */}
      <SuppliersList
        suppliers={suppliers}
        isLoading={isLoading}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        onArchive={handleArchive}
        onRestore={handleRestore}
        onClick={handleClick}
      />

      {/* Dialog de création */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau fournisseur</DialogTitle>
            <DialogDescription>
              Créez un nouveau fournisseur pour votre établissement
            </DialogDescription>
          </DialogHeader>

          <SupplierForm
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSubmit={handleCreate as any}
            onCancel={() => setIsCreateDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le fournisseur</DialogTitle>
            <DialogDescription>Modifiez les informations du fournisseur</DialogDescription>
          </DialogHeader>

          {selectedSupplier && (
            <SupplierForm
              supplier={selectedSupplier}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onSubmit={handleEdit as any}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedSupplier(null);
              }}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le fournisseur "{selectedSupplier?.name}" ? Cette
              action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedSupplier(null);
              }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
