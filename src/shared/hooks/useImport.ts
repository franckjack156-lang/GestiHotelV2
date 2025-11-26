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
import { logger } from '@/core/utils/logger';

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
  const [userMappings, setUserMappings] = useState<Map<string, string>>(new Map()); // Mappings excelName -> userId
  const [referenceMappings, setReferenceMappings] = useState<{
    buildings?: Map<string, string>;
    locations?: Map<string, string>;
    floors?: Map<string, string>;
    types?: Map<string, string>;
    categories?: Map<string, string>;
    priorities?: Map<string, string>;
  }>({});
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
        logger.error('Error loading users for import:', error);
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
          // NOUVELLE LOGIQUE: Combiner users ET listes de référence creators/technicians
          // Si une liste existe, on l'utilise; sinon tableau vide
          // Envoyer les utilisateurs complets pour permettre la correspondance partielle
          users: users.map(u => ({
            id: u.id,
            displayName: u.displayName,
            firstName: u.firstName,
            lastName: u.lastName,
            isTechnician: u.isTechnician,
          })),
          creators:
            referenceLists.lists['creators']?.items?.map(
              (item: { label: string }) => item.label
            ) || [],
          technicians:
            referenceLists.lists['technicians']?.items?.map(
              (item: { label: string }) => item.label
            ) || [],
          // NOUVELLES listes complètes pour le matching
          buildingsList: referenceLists.lists['buildings']?.items || [],
          locationsList: referenceLists.lists['interventionLocations']?.items || [],
          floorsList: referenceLists.lists['floors']?.items || [],
          typesList: referenceLists.lists['interventionTypes']?.items || [],
          categoriesList: referenceLists.lists['interventionCategories']?.items || [],
          prioritiesList: referenceLists.lists['interventionPriorities']?.items || [],
        }
      : undefined;

    const result = await importInterventions(file, {}, existingLists);

    // Afficher les suggestions de correspondance dans la console
    if (result.matchSuggestions) {
      logger.debug('\n🔍 SUGGESTIONS DE CORRESPONDANCE DÉTECTÉES:\n');

      if (result.matchSuggestions.technicians.size > 0) {
        logger.debug('👷 TECHNICIENS:');
        result.matchSuggestions.technicians.forEach((suggestions, excelName) => {
          logger.debug(`\n  "${excelName}" pourrait correspondre à:`);
          suggestions.forEach((sug, idx) => {
            const score = Math.round(sug.matchScore * 100);
            const emoji = sug.matchType === 'exact' ? '✅' : sug.matchType === 'partial' ? '⚡' : '💡';
            logger.debug(`    ${emoji} ${idx + 1}. ${sug.userName} (${score}% - ${sug.matchType})`);
          });
        });
      }

      if (result.matchSuggestions.creators.size > 0) {
        logger.debug('\n\n👤 CRÉATEURS:');
        result.matchSuggestions.creators.forEach((suggestions, excelName) => {
          logger.debug(`\n  "${excelName}" pourrait correspondre à:`);
          suggestions.forEach((sug, idx) => {
            const score = Math.round(sug.matchScore * 100);
            const emoji = sug.matchType === 'exact' ? '✅' : sug.matchType === 'partial' ? '⚡' : '💡';
            logger.debug(`    ${emoji} ${idx + 1}. ${sug.userName} (${score}% - ${sug.matchType})`);
          });
        });
      }

      // Afficher les suggestions pour les listes de référence
      const referenceCategories = [
        { key: 'buildings', label: '🏢 BÂTIMENTS', map: result.matchSuggestions.buildings },
        { key: 'locations', label: '📍 LOCALISATIONS', map: result.matchSuggestions.locations },
        { key: 'floors', label: '🏢 ÉTAGES', map: result.matchSuggestions.floors },
        { key: 'types', label: '🔧 TYPES', map: result.matchSuggestions.types },
        { key: 'categories', label: '📂 CATÉGORIES', map: result.matchSuggestions.categories },
        { key: 'priorities', label: '⚠️ PRIORITÉS', map: result.matchSuggestions.priorities },
      ];

      referenceCategories.forEach(({ label, map }) => {
        if (map.size > 0) {
          logger.debug(`\n\n${label}:`);
          map.forEach((suggestions, excelValue) => {
            logger.debug(`\n  "${excelValue}" pourrait correspondre à:`);
            suggestions.forEach((sug, idx) => {
              const score = Math.round(sug.matchScore * 100);
              const emoji = sug.matchType === 'exact' ? '✅' : sug.matchType === 'partial' ? '⚡' : '💡';
              logger.debug(
                `    ${emoji} ${idx + 1}. ${sug.referenceLabel} [${sug.referenceValue}] (${score}% - ${sug.matchType})`
              );
            });
          });
        }
      });
    }

    return result;
  };

  const handleConfirm = async (data: InterventionImportRow[]) => {
    setIsImporting(true);
    try {
      // Convertir avec la liste des utilisateurs pour le matching + mappings (utilisateurs ET références)
      const interventions = convertToInterventions(
        data,
        establishmentId,
        userId,
        userName || 'Utilisateur',
        users,
        userMappings,
        referenceMappings
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

  const handleCreateMissingValues = async (
    missingValues: MissingListValues,
    userMappings?: Map<string, string>,
    referenceMappings?: {
      buildings?: Map<string, string>;
      locations?: Map<string, string>;
      floors?: Map<string, string>;
      types?: Map<string, string>;
      categories?: Map<string, string>;
      priorities?: Map<string, string>;
    }
  ) => {
    if (!currentEstablishment?.id || !user?.id) {
      throw new Error('Établissement ou utilisateur non trouvé');
    }

    // Stocker les mappings utilisateur pour la conversion
    if (userMappings) {
      setUserMappings(userMappings);
      logger.debug('\n📌 Mappings utilisateur enregistrés:', Object.fromEntries(userMappings));
    }

    // Stocker les mappings de référence pour la conversion
    if (referenceMappings) {
      setReferenceMappings(referenceMappings);
      logger.debug('\n📌 Mappings de référence enregistrés:');
      Object.entries(referenceMappings).forEach(([key, map]) => {
        if (map && map.size > 0) {
          logger.debug(`  ${key}:`, Object.fromEntries(map));
        }
      });
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
      creators: 0,
      technicians: 0,
    };

    // Vérifier et créer les listes "creators" et "technicians" si elles n'existent pas
    const allLists = await referenceListsService.getAllLists(currentEstablishment.id);

    if (allLists && !allLists.lists['creators'] && missingValues.creators.size > 0) {
      await referenceListsService.createList(currentEstablishment.id, user.id, 'creators', {
        name: 'Créateurs',
        description: 'Liste des créateurs d\'interventions (historique)',
        allowCustom: true,
        isRequired: false,
        isSystem: false,
      });
      logger.debug('✅ Liste "creators" créée');
    }

    if (allLists && !allLists.lists['technicians'] && missingValues.technicians.size > 0) {
      await referenceListsService.createList(currentEstablishment.id, user.id, 'technicians', {
        name: 'Techniciens',
        description: 'Liste des techniciens (historique)',
        allowCustom: true,
        isRequired: false,
        isSystem: false,
      });
      logger.debug('✅ Liste "technicians" créée');
    }

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

    // Créer les créateurs manquants
    for (const label of missingValues.creators) {
      await referenceListsService.addItem(currentEstablishment.id, user.id, 'creators', {
        value: normalizeToValue(label),
        label: label,
        color: 'blue', // Couleur bleue pour les créateurs
      });
      createdCount.creators++;
    }

    // Créer les techniciens manquants
    for (const label of missingValues.technicians) {
      await referenceListsService.addItem(currentEstablishment.id, user.id, 'technicians', {
        value: normalizeToValue(label),
        label: label,
        color: 'indigo', // Couleur indigo pour les techniciens
      });
      createdCount.technicians++;
    }

    // Recharger les listes
    await reload();

    logger.debug('Valeurs créées:', createdCount);
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
