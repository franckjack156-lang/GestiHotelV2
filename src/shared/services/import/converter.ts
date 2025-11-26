/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * ============================================================================
 * IMPORT SERVICE - CONVERTER
 * ============================================================================
 *
 * Conversion des données d'import en objets Firestore
 */

import { Timestamp } from 'firebase/firestore';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import type { CreateRoomData, RoomType } from '@/features/rooms/types/room.types';
import type {
  InterventionStatus,
  InterventionPriority,
  InterventionType,
  InterventionCategory,
} from '@/shared/types/status.types';
import type { InterventionImportRow, RoomImportRow } from './schemas';
import type { UserInfo, ReferenceMappings } from './types';
import { parseDate, parseDateTime } from './dateUtils';
import { normalizeStatus } from './parser';

/**
 * Convertit les données d'import en objets Intervention pour Firestore
 */
export const convertToInterventions = (
  data: InterventionImportRow[],
  establishmentId: string,
  currentUserId: string,
  currentUserName: string,
  establishmentUsers: UserInfo[] = [],
  userMappings?: Map<string, string>,
  referenceMappings?: ReferenceMappings
): Partial<Intervention>[] => {
  return data.map(row => {
    // Matcher le créateur
    let createdBy = currentUserId;
    let createdByName = currentUserName;

    if (row.createur && row.createur.trim()) {
      const excelCreatorName = row.createur.trim();
      const mappedUserId = userMappings?.get(excelCreatorName);

      if (mappedUserId) {
        const mappedUser = establishmentUsers.find(u => u.id === mappedUserId);
        if (mappedUser) {
          createdBy = mappedUser.id;
          createdByName = mappedUser.displayName;
        }
      } else {
        const creatorName = excelCreatorName.toLowerCase();
        const matchedCreator = establishmentUsers.find(
          user => user.displayName.toLowerCase() === creatorName
        );

        if (matchedCreator) {
          createdBy = matchedCreator.id;
          createdByName = matchedCreator.displayName;
        } else {
          createdBy = currentUserId;
          createdByName = excelCreatorName;
        }
      }
    }

    // Matcher le technicien
    let assignedTo: string | undefined = undefined;
    let assignedToName: string | undefined = undefined;
    let assignedAt: Date | undefined = undefined;

    if (row.technicien && row.technicien.trim()) {
      const excelTechnicianName = row.technicien.trim();
      const mappedUserId = userMappings?.get(excelTechnicianName);

      if (mappedUserId) {
        const mappedUser = establishmentUsers.find(u => u.id === mappedUserId);
        if (mappedUser) {
          assignedTo = mappedUser.id;
          assignedToName = mappedUser.displayName;
          const parsedDate = row.datecreation ? parseDate(row.datecreation) : null;
          assignedAt = parsedDate || new Date();
        }
      } else {
        const technicianName = excelTechnicianName.toLowerCase();
        const matchedTechnician = establishmentUsers.find(
          user => user.displayName.toLowerCase() === technicianName
        );

        if (matchedTechnician) {
          assignedTo = matchedTechnician.id;
          assignedToName = matchedTechnician.displayName;
          const parsedDate = row.datecreation ? parseDate(row.datecreation) : null;
          assignedAt = parsedDate || new Date();
        } else {
          assignedTo = undefined;
          assignedToName = excelTechnicianName;
          const parsedDate = row.datecreation ? parseDate(row.datecreation) : null;
          assignedAt = parsedDate || new Date();
        }
      }
    }

    // Parser l'étage
    let floorNumber: number | undefined = undefined;
    if (row.etage && row.etage.trim()) {
      const parsed = parseInt(row.etage);
      if (!isNaN(parsed)) {
        floorNumber = parsed;
      }
    }

    // Parser la durée estimée
    let estimatedDurationMinutes: number | undefined = undefined;
    if (row.dureeestimee && row.dureeestimee.trim()) {
      const parsed = parseInt(row.dureeestimee);
      if (!isNaN(parsed) && parsed > 0) {
        estimatedDurationMinutes = parsed;
      }
    }

    // Parser les dates
    const createdAt = row.datecreation ? parseDate(row.datecreation) : new Date();
    const scheduledAt =
      row.dateplanifiee && row.heureplanifiee
        ? parseDateTime(row.dateplanifiee, row.heureplanifiee)
        : row.dateplanifiee
          ? parseDate(row.dateplanifiee)
          : undefined;
    const dueDate = row.datelimite ? parseDate(row.datelimite) : undefined;

    // Parser les tags
    const tags = row.tags
      ? row.tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0)
          .map(label => ({
            id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            label,
            color: '#3b82f6',
          }))
      : [];

    // Appliquer les mappings de référence
    const mappedBuilding = row.batiment && referenceMappings?.buildings?.get(row.batiment);
    const mappedLocation = row.localisation && referenceMappings?.locations?.get(row.localisation);
    const mappedType = row.type && referenceMappings?.types?.get(row.type);
    const mappedCategory = row.categorie && referenceMappings?.categories?.get(row.categorie);
    const mappedPriority = row.priorite && referenceMappings?.priorities?.get(row.priorite);

    // Construire l'intervention
    const intervention: Partial<Intervention> = {
      title: row.titre,
      description: row.description,
      status: normalizeStatus(row.statut || 'nouveau') as InterventionStatus,

      type: (row.type && row.type.trim()
        ? mappedType || row.type
        : undefined) as InterventionType | undefined,
      category: (row.categorie && row.categorie.trim()
        ? mappedCategory || row.categorie
        : undefined) as InterventionCategory | undefined,
      priority: (row.priorite && row.priorite.trim()
        ? mappedPriority || row.priorite
        : 'normal') as InterventionPriority,

      location: mappedLocation || row.localisation || '',
      roomNumber: row.numerochambre || undefined,
      floor: floorNumber,
      building: mappedBuilding || row.batiment || undefined,

      createdAt: createdAt ? Timestamp.fromDate(createdAt) : Timestamp.now(),
      scheduledAt: scheduledAt ? Timestamp.fromDate(scheduledAt) : undefined,
      dueDate: dueDate ? Timestamp.fromDate(dueDate) : undefined,
      estimatedDuration: estimatedDurationMinutes,

      internalNotes: row.notesinternes && row.notesinternes.trim() ? row.notesinternes : undefined,
      resolutionNotes:
        row.notesresolution && row.notesresolution.trim() ? row.notesresolution : undefined,

      tags: tags.length > 0 ? tags : undefined,
      externalReference:
        row.referenceexterne && row.referenceexterne.trim() ? row.referenceexterne : undefined,

      establishmentId,
      createdBy,
      createdByName,

      assignedTo: assignedTo || undefined,
      assignedToName: assignedToName || undefined,
      assignedAt: assignedAt ? Timestamp.fromDate(assignedAt) : undefined,

      isUrgent:
        row.priorite?.toLowerCase() === 'urgent' || row.priorite?.toLowerCase() === 'critical',
      isBlocking: false,
      requiresValidation: false,

      photos: [],
      photosCount: 0,
      viewsCount: 0,
      isDeleted: false,
    };

    return intervention;
  });
};

/**
 * Convertit les données d'import en objets CreateRoomData
 */
export const convertToRooms = (data: RoomImportRow[]): CreateRoomData[] => {
  return data.map(row => {
    let amenities: string[] | undefined = undefined;
    if (row.equipements && row.equipements.trim()) {
      amenities = row.equipements
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);
    }

    const room: CreateRoomData = {
      number: row.numero,
      floor: parseInt(row.etage) || 0,
      type: row.type as RoomType,
      capacity: row.capacite,
      description: row.description || undefined,
      building: row.batiment && row.batiment.trim() ? row.batiment : undefined,
      amenities: amenities && amenities.length > 0 ? amenities : undefined,
    };

    return room;
  });
};
