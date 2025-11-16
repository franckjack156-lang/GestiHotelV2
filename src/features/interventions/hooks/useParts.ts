/**
 * Hook pour gérer les pièces d'une intervention
 */

import { useState, useEffect } from 'react';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  subscribeToParts,
  createPart,
  updatePart,
  deletePart,
  changePartStatus,
} from '../services/partsService';
import type {
  Part,
  CreatePartData,
  UpdatePartData,
  PartStatus,
} from '../types/subcollections.types';
import { toast } from 'sonner';

export const useParts = (interventionId: string) => {
  const { establishmentId } = useCurrentEstablishment();
  const { user } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // S'abonner aux pièces en temps réel
  useEffect(() => {
    if (!establishmentId || !interventionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeToParts(
      establishmentId,
      interventionId,
      data => {
        setParts(data);
        setIsLoading(false);
        setError(null);
      },
      err => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [establishmentId, interventionId]);

  /**
   * Obtenir pièces par statut
   */
  const getPartsByStatus = (status: PartStatus): Part[] => {
    return parts.filter(p => p.status === status);
  };

  /**
   * Calculer le coût total
   */
  const getTotalCost = (): number => {
    return parts.reduce((sum, part) => sum + part.quantity * part.unitPrice, 0);
  };

  /**
   * Ajouter une pièce
   */
  const add = async (data: CreatePartData): Promise<boolean> => {
    console.log('🔧 useParts.add called with data:', data);

    if (!establishmentId || !user) {
      toast.error("Impossible d'ajouter la pièce");
      return false;
    }

    setIsSubmitting(true);
    try {
      await createPart(
        establishmentId,
        interventionId,
        user.id,
        user.displayName || user.email || 'Utilisateur',
        data,
        user.role
      );
      toast.success('Pièce ajoutée');
      return true;
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Modifier une pièce
   */
  const update = async (partId: string, data: UpdatePartData): Promise<boolean> => {
    if (!establishmentId) {
      toast.error('Impossible de modifier la pièce');
      return false;
    }

    try {
      await updatePart(establishmentId, interventionId, partId, data);
      toast.success('Pièce modifiée');
      return true;
    } catch (error) {
      toast.error('Erreur lors de la modification');
      console.error(error);
      return false;
    }
  };

  /**
   * Supprimer une pièce
   */
  const remove = async (partId: string): Promise<boolean> => {
    if (!establishmentId) {
      toast.error('Impossible de supprimer la pièce');
      return false;
    }

    try {
      await deletePart(establishmentId, interventionId, partId);
      toast.success('Pièce supprimée');
      return true;
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
      return false;
    }
  };

  /**
   * Changer le statut d'une pièce
   */
  const changeStatus = async (partId: string, newStatus: PartStatus): Promise<boolean> => {
    if (!establishmentId) {
      toast.error('Impossible de changer le statut');
      return false;
    }

    try {
      await changePartStatus(establishmentId, interventionId, partId, newStatus);
      toast.success('Statut mis à jour');
      return true;
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
      console.error(error);
      return false;
    }
  };

  return {
    parts,
    isLoading,
    error,
    isSubmitting,
    getPartsByStatus,
    getTotalCost,
    add,
    update,
    remove,
    changeStatus,
  };
};
