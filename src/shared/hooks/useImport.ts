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
  type MissingListValues,
} from '@/shared/services/importService';
import { createIntervention } from '@/features/interventions/services/interventionService';
import type { CreateRoomData } from '@/features/rooms/types/room.types';
import type { CreateInterventionData } from '@/features/interventions/types/intervention.types';
import { useAllReferenceLists } from '@/shared/hooks/useReferenceLists';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import referenceListsService from '@/shared/services/referenceListsService';
import userService from '@/features/users/services/userService';
import type { User } from '@/features/users/types/user.types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useImportInterventions = (
  establishmentId: string,
  userId: string,
  userName?: string
) => {
  const [isImporting, setIsImporting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const { data: referenceLists, reload } = useAllReferenceLists({
    realtime: false,
    autoLoad: true,
  });
  const { rooms } = useRooms(establishmentId);
  const { user } = useAuth();
  const { currentEstablishment } = useCurrentEstablishment();

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
    // Note: Ces variables ne sont plus utilisées car on passe directement les valeurs originales
    // dans existingLists ci-dessous pour préserver la casse

    // Préparer les listes existantes pour la détection des valeurs manquantes
    // IMPORTANT: On utilise les LABELS (affichage) au lieu des VALUES (technique)
    // pour permettre aux utilisateurs d'écrire "Salle de pause" au lieu de "sallepause"
    const existingLists = referenceLists
      ? {
          types:
            referenceLists.lists['interventionTypes']?.items?.map(
              (item: { label: string }) => item.label
            ) || [],
          categories:
            referenceLists.lists['interventionCategories']?.items?.map(
              (item: { label: string }) => item.label
            ) || [],
          priorities:
            referenceLists.lists['interventionPriorities']?.items?.map(
              (item: { label: string }) => item.label
            ) || [],
          locations:
            referenceLists.lists['interventionLocations']?.items?.map(
              (item: { label: string }) => item.label
            ) || [],
          statuses:
            referenceLists.lists['interventionStatuses']?.items?.map(
              (item: { label: string }) => item.label
            ) || [],
          // Combiner les chambres ET les listes de référence pour floors/buildings
          rooms: [...new Set(rooms.map(r => r.number))], // Garder la casse originale
          floors: [
            ...(referenceLists.lists['floors']?.items?.map(
              (item: { label: string }) => item.label
            ) || []),
            ...new Set(rooms.map(r => r.floor?.toString() || '').filter(f => f)),
          ],
          buildings: [
            ...(referenceLists.lists['buildings']?.items?.map(
              (item: { label: string }) => item.label
            ) || []),
            ...new Set(rooms.map(r => r.building || '').filter(b => b)),
          ],
          users: users.map(u => ({ displayName: u.displayName })),
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

  const handleCreateMissingValues = async (missingValues: MissingListValues) => {
    if (!currentEstablishment?.id || !user?.id) {
      throw new Error('Établissement ou utilisateur non trouvé');
    }

    /**
     * Convertit un label lisible en value technique (minuscules + underscores)
     * Ex: "Salle de pause" → "salle_de_pause"
     */
    const normalizeToValue = (label: string): string => {
      return label
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_') // Remplacer espaces par underscores
        .normalize('NFD') // Décomposer les caractères accentués
        .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
        .replace(/[^a-z0-9_]/g, '') // Garder seulement minuscules, chiffres et underscores
        .replace(/_+/g, '_') // Remplacer plusieurs underscores consécutifs par un seul
        .replace(/^_|_$/g, ''); // Enlever underscores au début et à la fin
    };

    const createdCount = {
      types: 0,
      categories: 0,
      priorities: 0,
      locations: 0,
    };

    // Créer les types manquants
    for (const label of missingValues.types) {
      await referenceListsService.addItem(currentEstablishment.id, user.id, 'interventionTypes', {
        value: normalizeToValue(label),
        label: label,
        color: 'blue',
      });
      createdCount.types++;
    }

    // Créer les catégories manquantes
    for (const label of missingValues.categories) {
      await referenceListsService.addItem(
        currentEstablishment.id,
        user.id,
        'interventionCategories',
        {
          value: normalizeToValue(label),
          label: label,
          color: 'green',
        }
      );
      createdCount.categories++;
    }

    // Créer les priorités manquantes
    for (const label of missingValues.priorities) {
      await referenceListsService.addItem(
        currentEstablishment.id,
        user.id,
        'interventionPriorities',
        {
          value: normalizeToValue(label),
          label: label,
          color: 'orange',
        }
      );
      createdCount.priorities++;
    }

    // Créer les localisations manquantes
    for (const label of missingValues.locations) {
      await referenceListsService.addItem(
        currentEstablishment.id,
        user.id,
        'interventionLocations',
        {
          value: normalizeToValue(label),
          label: label,
          color: 'purple',
        }
      );
      createdCount.locations++;
    }

    // Recharger les listes
    await reload();

    console.log('Valeurs créées:', createdCount);
  };

  return {
    isImporting,
    handleImport,
    handleConfirm,
    handleCreateMissingValues,
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
