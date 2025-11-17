/**
 * ============================================================================
 * USE IMPORT HOOK
 * ============================================================================
 *
 * Hook pour gérer l'import de données depuis Excel
 */

import { useState } from 'react';
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

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useImportInterventions = (establishmentId: string, userId: string, userName?: string) => {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (file: File): Promise<ImportResult<InterventionImportRow>> => {
    return await importInterventions(file);
  };

  const handleConfirm = async (data: InterventionImportRow[]) => {
    setIsImporting(true);
    try {
      const interventions = convertToInterventions(data, establishmentId, userId, userName || 'Utilisateur');

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
