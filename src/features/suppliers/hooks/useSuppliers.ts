/**
 * ============================================================================
 * USE SUPPLIERS HOOK
 * ============================================================================
 *
 * Hook React pour la gestion des fournisseurs
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';
import type {
  Supplier,
  CreateSupplierData,
  UpdateSupplierData,
  SupplierFilters,
  SupplierSortOptions,
} from '../types/supplier.types';
import {
  getSuppliers as getSuppliersService,
  createSupplier as createSupplierService,
  updateSupplier as updateSupplierService,
  deleteSupplier as deleteSupplierService,
  archiveSupplier as archiveSupplierService,
  restoreSupplier as restoreSupplierService,
} from '../services/supplierService';

/**
 * Hook pour gérer les fournisseurs
 */
export const useSuppliers = (
  establishmentId: string | undefined,
  filters?: SupplierFilters,
  sortOptions?: SupplierSortOptions
) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger les fournisseurs
   */
  const loadSuppliers = async () => {
    if (!establishmentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getSuppliersService(establishmentId, filters, sortOptions);
      setSuppliers(data);
    } catch (err) {
      logger.error('Error loading suppliers:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des fournisseurs');
      toast.error('Impossible de charger les fournisseurs');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Créer un fournisseur
   */
  const createSupplier = async (
    userId: string,
    data: CreateSupplierData
  ): Promise<string | null> => {
    if (!establishmentId) return null;

    try {
      const id = await createSupplierService(establishmentId, userId, data);
      toast.success('Fournisseur créé avec succès');
      await loadSuppliers();
      return id;
    } catch (err) {
      logger.error('Error creating supplier:', err);
      toast.error('Erreur lors de la création du fournisseur');
      return null;
    }
  };

  /**
   * Mettre à jour un fournisseur
   */
  const updateSupplier = async (
    supplierId: string,
    userId: string,
    data: UpdateSupplierData
  ): Promise<boolean> => {
    if (!establishmentId) return false;

    try {
      await updateSupplierService(establishmentId, supplierId, userId, data);
      toast.success('Fournisseur mis à jour avec succès');
      await loadSuppliers();
      return true;
    } catch (err) {
      logger.error('Error updating supplier:', err);
      toast.error('Erreur lors de la mise à jour du fournisseur');
      return false;
    }
  };

  /**
   * Supprimer un fournisseur
   */
  const deleteSupplier = async (supplierId: string): Promise<boolean> => {
    if (!establishmentId) return false;

    try {
      await deleteSupplierService(establishmentId, supplierId);
      toast.success('Fournisseur supprimé avec succès');
      await loadSuppliers();
      return true;
    } catch (err) {
      logger.error('Error deleting supplier:', err);
      toast.error('Erreur lors de la suppression du fournisseur');
      return false;
    }
  };

  /**
   * Archiver un fournisseur
   */
  const archiveSupplier = async (supplierId: string, userId: string): Promise<boolean> => {
    if (!establishmentId) return false;

    try {
      await archiveSupplierService(establishmentId, supplierId, userId);
      toast.success('Fournisseur archivé avec succès');
      await loadSuppliers();
      return true;
    } catch (err) {
      logger.error('Error archiving supplier:', err);
      toast.error("Erreur lors de l'archivage du fournisseur");
      return false;
    }
  };

  /**
   * Restaurer un fournisseur
   */
  const restoreSupplier = async (supplierId: string, userId: string): Promise<boolean> => {
    if (!establishmentId) return false;

    try {
      await restoreSupplierService(establishmentId, supplierId, userId);
      toast.success('Fournisseur restauré avec succès');
      await loadSuppliers();
      return true;
    } catch (err) {
      logger.error('Error restoring supplier:', err);
      toast.error('Erreur lors de la restauration du fournisseur');
      return false;
    }
  };

  /**
   * Rafraîchir les fournisseurs
   */
  const refresh = () => {
    loadSuppliers();
  };

  // Charger au montage et quand les filtres changent
  useEffect(() => {
    loadSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establishmentId, JSON.stringify(filters), JSON.stringify(sortOptions)]);

  return {
    suppliers,
    isLoading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    archiveSupplier,
    restoreSupplier,
    refresh,
  };
};

/**
 * Hook pour obtenir un fournisseur spécifique
 */
export const useSupplier = (
  establishmentId: string | undefined,
  supplierId: string | undefined
) => {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSupplier = async () => {
      if (!establishmentId || !supplierId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const { getSupplierById } = await import('../services/supplierService');
        const data = await getSupplierById(establishmentId, supplierId);
        setSupplier(data);
      } catch (err) {
        logger.error('Error loading supplier:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement du fournisseur');
      } finally {
        setIsLoading(false);
      }
    };

    loadSupplier();
  }, [establishmentId, supplierId]);

  return {
    supplier,
    isLoading,
    error,
  };
};
