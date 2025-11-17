/**
 * ============================================================================
 * USE IMPORT HOOK
 * ============================================================================
 *
 * Hook pour gérer l'import de données depuis Excel
 */

import { useState, useEffect } from 'react';
import {
  importInterventions,
  importRooms,
  convertToInterventions,
  convertToRooms,
  type ImportResult,
  type InterventionImportRow,
  type RoomImportRow,
} from '@/shared/services/importService';
import { createIntervention } from '@/features/interventions/services/interventionService';
import type { CreateRoomData } from '@/features/rooms/types/room.types';
import type { CreateInterventionData } from '@/features/interventions/types/intervention.types';
import { useAllReferenceLists } from '@/shared/hooks/useReferenceLists';
import userService from '@/features/users/services/userService';
import type { User } from '@/features/users/types/user.types';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useImportInterventions = (establishmentId: string, userId: string, userName?: string) => {
  const [isImporting, setIsImporting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const { data: referenceLists } = useAllReferenceLists({ realtime: false, autoLoad: true });

  // Charger les utilisateurs de l'établissement au montage
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const establishmentUsers = await userService.getUsersByEstablishment(establishmentId);
        setUsers(establishmentUsers);
      } catch (error) {
        console.error('Error loading users for import:', error);
      }
    };

    if (establishmentId) {
      loadUsers();
    }
  }, [establishmentId]);

  const handleImport = async (file: File): Promise<ImportResult<InterventionImportRow>> => {
    // Préparer les listes existantes pour la détection des valeurs manquantes
    const existingLists = referenceLists
      ? {
          types: referenceLists.lists['interventionTypes']?.items?.map((item: { value: string }) => item.value.toLowerCase()) || [],
          categories: referenceLists.lists['interventionCategories']?.items?.map((item: { value: string }) => item.value.toLowerCase()) || [],
          priorities: referenceLists.lists['interventionPriorities']?.items?.map((item: { value: string }) => item.value.toLowerCase()) || [],
          locations: referenceLists.lists['locations']?.items?.map((item: { value: string }) => item.value.toLowerCase()) || [],
          statuses: referenceLists.lists['interventionStatuses']?.items?.map((item: { value: string }) => item.value.toLowerCase()) || [],
        }
      : undefined;

    return await importInterventions(file, {}, existingLists);
  };

  const handleConfirm = async (data: InterventionImportRow[]) => {
    setIsImporting(true);
    try {
      // Convertir avec la liste des utilisateurs pour le matching
      const interventions = convertToInterventions(
        data,
        establishmentId,
        userId,
        userName || 'Utilisateur',
        users
      );

      // Créer les interventions en batch (par groupes de 10)
      const batchSize = 10;
      for (let i = 0; i < interventions.length; i += batchSize) {
        const batch = interventions.slice(i, i + batchSize);
        await Promise.all(
          batch.map(intervention =>
            createIntervention(establishmentId, userId, intervention as CreateInterventionData)
          )
        );
      }
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isImporting,
    handleImport,
    handleConfirm,
  };
};

export const useImportRooms = () => {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (file: File): Promise<ImportResult<RoomImportRow>> => {
    return await importRooms(file);
  };

  const handleConfirm = async (
    data: RoomImportRow[],
    createRoomFn: (room: CreateRoomData) => Promise<string | null>
  ) => {
    setIsImporting(true);
    try {
      const rooms = convertToRooms(data);

      // Créer les chambres en batch (par groupes de 10)
      const batchSize = 10;
      for (let i = 0; i < rooms.length; i += batchSize) {
        const batch = rooms.slice(i, i + batchSize);
        await Promise.all(batch.map(room => createRoomFn(room)));
      }
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isImporting,
    handleImport,
    handleConfirm,
  };
};
