/**
 * useEstablishments Hook
 *
 * Hook pour gérer les établissements
 */

import { useEffect, useCallback } from 'react';
import { useEstablishmentStore } from '../stores/establishmentStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import establishmentService from '../services/establishmentService';
import type {
  Establishment,
  CreateEstablishmentData,
  UpdateEstablishmentData,
} from '@/shared/types/establishment.types';

export const useEstablishments = () => {
  const { user } = useAuthStore();
  const {
    establishments,
    currentEstablishment,
    isLoading,
    error,
    filters,
    setEstablishments,
    updateEstablishmentInList,
    removeEstablishment,
    setCurrentEstablishment,
    setLoading,
    setError,
    setFilters,
    resetFilters,
    getEstablishmentById,
  } = useEstablishmentStore();

  /**
   * Charger les établissements de l'utilisateur
   */
  const loadEstablishments = useCallback(async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let fetchedEstablishments;

      // SuperAdmin: Charger TOUS les établissements
      if (user.role === 'super_admin') {
        fetchedEstablishments = await establishmentService.getEstablishments(filters);
      }
      // Autres rôles: Charger uniquement les établissements autorisés
      else {
        fetchedEstablishments = await establishmentService.getUserEstablishments(
          user.id,
          user.establishmentIds
        );
      }

      setEstablishments(fetchedEstablishments);

      // Si pas d'établissement actuel, sélectionner le premier
      if (!currentEstablishment && fetchedEstablishments.length > 0) {
        setCurrentEstablishment(fetchedEstablishments[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des établissements');
    } finally {
      setLoading(false);
    }
  }, [
    user,
    filters,
    currentEstablishment,
    setEstablishments,
    setCurrentEstablishment,
    setLoading,
    setError,
  ]);

  /**
   * Créer un nouvel établissement
   */
  const createEstablishment = useCallback(
    async (data: CreateEstablishmentData): Promise<string | null> => {
      if (!user) {
        setError('Utilisateur non connecté');
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const establishmentId = await establishmentService.createEstablishment(data, user.id);

        // Recharger les établissements
        await loadEstablishments();

        return establishmentId;
      } catch (err: any) {
        setError(err.message || "Erreur lors de la création de l'établissement");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, loadEstablishments, setLoading, setError]
  );

  /**
   * Mettre à jour un établissement
   */
  const updateEstablishment = useCallback(
    async (establishmentId: string, data: UpdateEstablishmentData): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        await establishmentService.updateEstablishment(establishmentId, data);

        // Mettre à jour localement - cast car UpdateEstablishmentData est compatible avec Partial<Establishment>
        updateEstablishmentInList(establishmentId, data as Partial<Establishment>);

        return true;
      } catch (err: any) {
        setError(err.message || "Erreur lors de la mise à jour de l'établissement");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [updateEstablishmentInList, setLoading, setError]
  );

  /**
   * Supprimer un établissement
   */
  const deleteEstablishment = useCallback(
    async (establishmentId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        await establishmentService.deleteEstablishment(establishmentId);

        // Retirer de la liste
        removeEstablishment(establishmentId);

        // Si c'était l'établissement actuel, en sélectionner un autre
        if (currentEstablishment?.id === establishmentId) {
          const remainingEstablishments = establishments.filter(est => est.id !== establishmentId);
          setCurrentEstablishment(
            remainingEstablishments.length > 0 ? remainingEstablishments[0] : null
          );
        }

        return true;
      } catch (err: any) {
        setError(err.message || "Erreur lors de la suppression de l'établissement");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      currentEstablishment,
      establishments,
      removeEstablishment,
      setCurrentEstablishment,
      setLoading,
      setError,
    ]
  );

  /**
   * Changer l'établissement actuel
   */
  const switchEstablishment = useCallback(
    async (establishmentId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        // Vérifier que l'utilisateur a accès à cet établissement
        if (!user) {
          throw new Error('Utilisateur non connecté');
        }

        if (user.role !== 'super_admin' && !user.establishmentIds.includes(establishmentId)) {
          throw new Error("Vous n'avez pas accès à cet établissement");
        }

        // Charger l'établissement
        const establishment = await establishmentService.getEstablishment(establishmentId);

        if (!establishment) {
          throw new Error('Établissement introuvable');
        }

        // Mettre à jour l'établissement actuel
        setCurrentEstablishment(establishment);

        // Mettre à jour le currentEstablishmentId de l'utilisateur
        // (dans un vrai système, on mettrait à jour Firestore)
        // TODO: Implémenter la mise à jour du profil utilisateur

        return true;
      } catch (err: any) {
        setError(err.message || "Erreur lors du changement d'établissement");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, setCurrentEstablishment, setLoading, setError]
  );

  /**
   * Charger les établissements au montage
   */
  useEffect(() => {
    if (user && establishments.length === 0 && !isLoading) {
      loadEstablishments();
    }
  }, [user, establishments.length, isLoading, loadEstablishments]);

  return {
    // État
    establishments,
    currentEstablishment,
    isLoading,
    error,
    filters,

    // Actions
    loadEstablishments,
    createEstablishment,
    updateEstablishment,
    deleteEstablishment,
    switchEstablishment,
    setFilters,
    resetFilters,

    // Utilitaires
    getEstablishmentById,
  };
};
