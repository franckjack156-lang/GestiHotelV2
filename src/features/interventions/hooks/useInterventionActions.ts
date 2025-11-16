/**
 * useInterventionActions Hook
 *
 * Hook pour gérer les actions CRUD sur les interventions
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterventionStore } from '../stores/interventionStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import interventionService from '../services/interventionService';
import * as photoService from '../services/photosService';
import type {
  CreateInterventionData,
  UpdateInterventionData,
  StatusChangeData,
  AssignmentData,
  Intervention,
} from '../types/intervention.types';

export const useInterventionActions = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addIntervention, updateInterventionInList, removeIntervention, setSelectedIntervention } =
    useInterventionStore();

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const establishmentId = user?.currentEstablishmentId || user?.establishmentIds[0];
  const userId = user?.id || '';

  /**
   * Créer une nouvelle intervention
   */
  const createIntervention = useCallback(
    async (data: CreateInterventionData): Promise<string | null> => {
      if (!establishmentId || !userId) {
        setActionError('Utilisateur ou établissement non défini');
        return null;
      }

      try {
        setIsCreating(true);
        setActionError(null);

        // Créer l'intervention
        const interventionId = await interventionService.createIntervention(
          establishmentId,
          userId,
          data
        );

        // Uploader les photos si présentes
        if (data.photos && data.photos.length > 0) {
          const userName = user?.displayName || user?.email || 'Unknown';
          for (const photo of data.photos) {
            await photoService.uploadPhoto(establishmentId, interventionId, userId, userName, {
              file: photo,
              category: 'before',
            });
          }
        }

        // Récupérer l'intervention créée
        const intervention = await interventionService.getIntervention(
          establishmentId,
          interventionId
        );

        if (intervention) {
          addIntervention(intervention);
        }

        return interventionId;
      } catch (error: any) {
        setActionError(error.message);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [establishmentId, userId, addIntervention]
  );

  /**
   * Mettre à jour une intervention
   */
  const updateIntervention = useCallback(
    async (interventionId: string, data: UpdateInterventionData): Promise<boolean> => {
      if (!establishmentId) {
        setActionError('Établissement non défini');
        return false;
      }

      try {
        setIsUpdating(true);
        setActionError(null);

        await interventionService.updateIntervention(establishmentId, interventionId, data);

        // Mettre à jour dans le store - cast car UpdateInterventionData est compatible
        updateInterventionInList(interventionId, data as any);

        return true;
      } catch (error: any) {
        setActionError(error.message);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [establishmentId, updateInterventionInList]
  );

  /**
   * Changer le statut d'une intervention
   */
  const changeStatus = useCallback(
    async (interventionId: string, statusData: StatusChangeData): Promise<boolean> => {
      if (!establishmentId || !userId) {
        setActionError('Utilisateur ou établissement non défini');
        return false;
      }

      try {
        setIsUpdating(true);
        setActionError(null);

        await interventionService.changeStatus(establishmentId, interventionId, userId, statusData);

        // Mettre à jour dans le store
        updateInterventionInList(interventionId, {
          status: statusData.newStatus,
        });

        return true;
      } catch (error: any) {
        setActionError(error.message);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [establishmentId, userId, updateInterventionInList]
  );

  /**
   * Assigner une intervention à un technicien
   */
  const assignIntervention = useCallback(
    async (interventionId: string, assignmentData: AssignmentData): Promise<boolean> => {
      if (!establishmentId) {
        setActionError('Établissement non défini');
        return false;
      }

      try {
        setIsUpdating(true);
        setActionError(null);

        await interventionService.assignIntervention(
          establishmentId,
          interventionId,
          assignmentData
        );

        // Mettre à jour dans le store
        updateInterventionInList(interventionId, {
          assignedTo: assignmentData.technicianId,
          status: 'assigned' as any,
        });

        return true;
      } catch (error: any) {
        setActionError(error.message);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [establishmentId, updateInterventionInList]
  );

  /**
   * Supprimer une intervention
   */
  const deleteIntervention = useCallback(
    async (interventionId: string): Promise<boolean> => {
      if (!establishmentId || !userId) {
        setActionError('Utilisateur ou établissement non défini');
        return false;
      }

      try {
        setIsDeleting(true);
        setActionError(null);

        await interventionService.deleteIntervention(establishmentId, interventionId, userId);

        // Retirer du store
        removeIntervention(interventionId);

        return true;
      } catch (error: any) {
        setActionError(error.message);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [establishmentId, userId, removeIntervention]
  );

  /**
   * Obtenir une intervention spécifique
   */
  const getIntervention = useCallback(
    async (interventionId: string): Promise<Intervention | null> => {
      if (!establishmentId) {
        setActionError('Établissement non défini');
        return null;
      }

      try {
        const intervention = await interventionService.getIntervention(
          establishmentId,
          interventionId
        );

        if (intervention) {
          setSelectedIntervention(intervention);

          // TODO: Incrémenter le compteur de vues
          // if (userId) {
          //   interventionService.incrementViewCount(
          //     establishmentId,
          //     interventionId,
          //     userId
          //   );
          // }
        }

        return intervention;
      } catch (error: any) {
        setActionError(error.message);
        return null;
      }
    },
    [establishmentId, userId, setSelectedIntervention]
  );

  /**
   * Uploader des photos
   */
  const uploadPhotos = useCallback(
    async (interventionId: string, files: File[]): Promise<boolean> => {
      if (!establishmentId || !userId || !user) {
        setActionError('Utilisateur ou établissement non défini');
        return false;
      }

      try {
        setIsUpdating(true);
        setActionError(null);

        const userName = user?.displayName || user?.email || 'Unknown';
        for (const file of files) {
          await photoService.uploadPhoto(establishmentId, interventionId, userId, userName, {
            file,
            category: 'during',
          });
        }

        return true;
      } catch (error: any) {
        setActionError(error.message);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [establishmentId, userId, user]
  );

  /**
   * Supprimer une photo
   */
  const deletePhoto = useCallback(
    async (interventionId: string, photoId: string): Promise<boolean> => {
      if (!establishmentId) {
        setActionError('Établissement non défini');
        return false;
      }

      try {
        setIsUpdating(true);
        setActionError(null);

        // Récupérer l'intervention pour obtenir la photo
        const intervention = await interventionService.getIntervention(
          establishmentId,
          interventionId
        );

        if (!intervention) {
          throw new Error('Intervention non trouvée');
        }

        // Trouver la photo pour obtenir son URL
        const photo = intervention.photos?.find((p: any) => p.id === photoId);
        if (!photo) {
          throw new Error('Photo non trouvée');
        }

        await photoService.deletePhoto(
          establishmentId,
          interventionId,
          photoId,
          photo.url,
          photo.thumbnailUrl
        );

        return true;
      } catch (error: any) {
        setActionError(error.message);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [establishmentId]
  );

  /**
   * Naviguer vers la création
   */
  const navigateToCreate = useCallback(() => {
    navigate('/interventions/new');
  }, [navigate]);

  /**
   * Naviguer vers les détails
   */
  const navigateToDetails = useCallback(
    (interventionId: string) => {
      navigate(`/interventions/${interventionId}`);
    },
    [navigate]
  );

  /**
   * Naviguer vers l'édition
   */
  const navigateToEdit = useCallback(
    (interventionId: string) => {
      navigate(`/interventions/${interventionId}/edit`);
    },
    [navigate]
  );

  return {
    // États de chargement
    isCreating,
    isUpdating,
    isDeleting,
    actionError,

    // Actions CRUD
    createIntervention,
    updateIntervention,
    deleteIntervention,
    getIntervention,

    // Actions spécifiques
    changeStatus,
    assignIntervention,
    uploadPhotos,
    deletePhoto,

    // Navigation
    navigateToCreate,
    navigateToDetails,
    navigateToEdit,

    // Utilitaires
    clearError: () => setActionError(null),
  };
};
