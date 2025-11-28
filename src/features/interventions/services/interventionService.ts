/**
 * Intervention Service - VERSION FINALE CORRIGÉE
 *
 * Correspond EXACTEMENT à ce que le hook attend
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  QueryConstraint,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { enrichInterventions } from '../utils/enrichInterventions';
import { logStatusChange, logAssignment } from './historyService';
import {
  notifyInterventionAssigned,
  notifyInterventionUrgent,
  notifyStatusChanged,
  notifyInterventionCompleted,
} from '@/shared/services/notificationService';
import { calculateDueDate, SLA_TARGETS } from './slaService';
import {
  createBlockageFromIntervention,
  resolveBlockageForIntervention,
} from '@/features/rooms/services/blockageService';
import type {
  Intervention,
  CreateInterventionData,
  UpdateInterventionData,
  InterventionFilters,
  InterventionSortOptions,
  StatusChangeData,
  AssignmentData,
} from '../types/intervention.types';
import type { InterventionStatus } from '@/shared/types/status.types';
import type { Room } from '@/features/rooms/types/room.types';
import { logger } from '@/core/utils/logger';

/**
 * Obtenir la référence de la collection interventions
 */
const getInterventionsCollection = (establishmentId: string) => {
  return collection(db, 'establishments', establishmentId, 'interventions');
};

/**
 * Générer une référence unique
 */
const generateReference = async (establishmentId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const collectionRef = getInterventionsCollection(establishmentId);
  const q = query(
    collectionRef,
    where('createdAt', '>=', Timestamp.fromDate(new Date(year, 0, 1)))
  );
  const snapshot = await getDocs(q);
  const count = snapshot.size + 1;
  return `INT-${year}-${String(count).padStart(4, '0')}`;
};

/**
 * Créer une nouvelle intervention
 */
export const createIntervention = async (
  establishmentId: string,
  userId: string,
  data: CreateInterventionData
): Promise<string> => {
  try {
    const collectionRef = getInterventionsCollection(establishmentId);
    const reference = await generateReference(establishmentId);

    // Récupérer le nom du créateur (seulement si non fourni dans data - pour import historique)
    let createdByName = data.createdByName || 'Inconnu';
    const createdBy = data.createdBy || userId;

    // Si createdByName n'est pas fourni et qu'on utilise userId, récupérer le nom
    if (!data.createdByName && !data.createdBy) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          createdByName = userData.displayName || userData.email || 'Inconnu';
        }
      } catch {
        // Ignorer les erreurs de récupération du nom d'utilisateur
      }
    }

    // Base data - only required fields
    const interventionData: Record<string, unknown> = {
      establishmentId,
      title: data.title,
      status: 'pending' as InterventionStatus,
      // N'inclure location que si elle est définie et non nulle
      ...(data.location && { location: data.location }),
      createdBy, // Utiliser createdBy fourni ou userId par défaut
      createdByName, // Utiliser createdByName fourni ou récupéré
      photos: [],
      photosCount: 0,
      reference,
      tags: data.tags || [],
      isUrgent: data.isUrgent || data.priority === 'urgent' || data.priority === 'critical',
      isBlocking: data.isBlocking || false,
      requiresValidation: false,
      viewsCount: 0,
      // Utiliser createdAt fourni (import historique) ou serverTimestamp() pour nouvelle intervention
      createdAt: data.createdAt
        ? data.createdAt instanceof Timestamp
          ? data.createdAt
          : Timestamp.fromDate(data.createdAt)
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false,
    };

    // Add optional fields only if they are defined and not empty
    if (data.description !== undefined && data.description !== '') {
      interventionData.description = data.description;
    }
    if (data.type) {
      interventionData.type = data.type;
    }
    if (data.category) {
      interventionData.category = data.category;
    }
    // Priorité: utiliser la valeur fournie ou 'normal' par défaut
    interventionData.priority = data.priority || 'normal';

    if (data.roomNumber !== undefined && data.roomNumber !== '') {
      interventionData.roomNumber = data.roomNumber;
    }
    if (data.floor !== undefined) {
      interventionData.floor = data.floor;
    }
    if (data.building !== undefined && data.building !== '') {
      interventionData.building = data.building;
    }
    // Gestion de l'assignation (support multi-techniciens + rétrocompatibilité)
    // S'assurer que assignedToIds est un tableau plat de strings
    const createFlattenedAssignedToIds = data.assignedToIds
      ? (Array.isArray(data.assignedToIds) ? data.assignedToIds : [data.assignedToIds])
          .flat()
          .filter((id): id is string => typeof id === 'string')
      : [];

    if (createFlattenedAssignedToIds.length > 0) {
      // Nouveau format: plusieurs techniciens
      interventionData.assignedToIds = createFlattenedAssignedToIds;

      // Utiliser assignedAt fourni (import historique) ou serverTimestamp()
      interventionData.assignedAt = data.assignedAt
        ? data.assignedAt instanceof Timestamp
          ? data.assignedAt
          : Timestamp.fromDate(data.assignedAt)
        : serverTimestamp();

      // Utiliser assignedToNames fourni (import historique) ou récupérer depuis la base
      if (
        data.assignedToNames &&
        data.assignedToNames.length === createFlattenedAssignedToIds.length
      ) {
        interventionData.assignedToNames = data.assignedToNames;
        interventionData.assignedToName = data.assignedToNames.join(', '); // Legacy
        interventionData.assignedTo = createFlattenedAssignedToIds[0]; // Legacy (premier technicien)
      } else {
        // Récupérer les noms des techniciens depuis Firestore
        try {
          const techNames: string[] = [];
          for (const techId of createFlattenedAssignedToIds) {
            const techDoc = await getDoc(doc(db, 'users', techId));
            if (techDoc.exists()) {
              const techData = techDoc.data();
              techNames.push(techData.displayName || techData.email || 'Inconnu');
            } else {
              techNames.push('Inconnu');
            }
          }
          interventionData.assignedToNames = techNames;
          interventionData.assignedToName = techNames.join(', '); // Legacy
          interventionData.assignedTo = createFlattenedAssignedToIds[0]; // Legacy (premier technicien)
        } catch (error) {
          logger.warn('⚠️ Impossible de récupérer les noms des techniciens:', error);
          interventionData.assignedToNames = createFlattenedAssignedToIds.map(() => 'Inconnu');
          interventionData.assignedToName = 'Inconnu';
          interventionData.assignedTo = createFlattenedAssignedToIds[0];
        }
      }
    } else if (data.assignedTo && typeof data.assignedTo === 'string') {
      // Legacy format: un seul technicien (s'assurer que c'est une string)
      // Stocker dans les deux formats pour compatibilité
      interventionData.assignedTo = data.assignedTo;
      interventionData.assignedToIds = [data.assignedTo];

      // Utiliser assignedAt fourni (import historique) ou serverTimestamp()
      interventionData.assignedAt = data.assignedAt
        ? data.assignedAt instanceof Timestamp
          ? data.assignedAt
          : Timestamp.fromDate(data.assignedAt)
        : serverTimestamp();

      // Utiliser assignedToName fourni (import historique) ou récupérer depuis la base
      if (data.assignedToName) {
        interventionData.assignedToName = data.assignedToName;
        interventionData.assignedToNames = [data.assignedToName];
      } else {
        // Récupérer le nom depuis Firestore pour le legacy format (un seul technicien)
        try {
          const techDoc = await getDoc(doc(db, 'users', data.assignedTo));
          if (techDoc.exists()) {
            const techData = techDoc.data();
            const techName = techData.displayName || techData.email || 'Inconnu';
            interventionData.assignedToName = techName;
            interventionData.assignedToNames = [techName];
          } else {
            interventionData.assignedToName = 'Inconnu';
            interventionData.assignedToNames = ['Inconnu'];
          }
        } catch (error) {
          logger.warn('⚠️ Impossible de récupérer le nom du technicien:', error);
          interventionData.assignedToNames = ['Inconnu'];
          interventionData.assignedToName = 'Inconnu';
        }
      }
    } else if (data.assignedToName) {
      // Cas spécial pour import historique: nom de technicien fourni sans ID utilisateur
      interventionData.assignedToName = data.assignedToName;
      interventionData.assignedToNames = [data.assignedToName];
      if (data.assignedAt) {
        interventionData.assignedAt =
          data.assignedAt instanceof Timestamp
            ? data.assignedAt
            : Timestamp.fromDate(data.assignedAt);
      }
    }
    if (data.scheduledAt) {
      interventionData.scheduledAt = Timestamp.fromDate(data.scheduledAt);
    }
    if (data.estimatedDuration !== undefined && data.estimatedDuration !== null) {
      interventionData.estimatedDuration = data.estimatedDuration;
    }
    if (data.internalNotes) {
      interventionData.internalNotes = data.internalNotes;
    }

    // Calculer les champs SLA
    const priority = (data.priority || 'normal') as keyof typeof SLA_TARGETS;
    const createdDate = new Date();
    const customDueDate = data.dueDate;

    logger.debug('🔍 DEBUG - Priority calculation', { priority, slaTarget: SLA_TARGETS[priority] });

    const dueDate = calculateDueDate(createdDate, priority, customDueDate);

    // S'assurer que slaTarget a une valeur (défaut: 8h pour normal)
    const slaTarget = SLA_TARGETS[priority] || SLA_TARGETS.normal || 480;
    logger.debug('🔍 DEBUG - Final slaTarget:', slaTarget);

    interventionData.slaTarget = slaTarget;
    interventionData.dueDate = Timestamp.fromDate(dueDate);
    interventionData.slaStatus = 'on_track';

    // Si l'intervention est assignée à la création, marquer la première réponse
    if (data.assignedTo || createFlattenedAssignedToIds.length > 0) {
      interventionData.firstResponseAt = serverTimestamp();
      interventionData.responseTime = 0; // Assignation immédiate
    }

    const docRef = await addDoc(collectionRef, interventionData);
    logger.debug('✅ Intervention créée:', docRef.id);

    // ========================================================================
    // BLOCAGE AUTOMATIQUE - Si isBlocking = true et roomNumber renseigné
    // ========================================================================
    if (data.isBlocking && data.roomNumber) {
      try {
        // Récupérer la chambre correspondante
        const roomsRef = collection(db, 'establishments', establishmentId, 'rooms');
        const roomQuery = query(roomsRef, where('number', '==', data.roomNumber));
        const roomSnapshot = await getDocs(roomQuery);

        if (!roomSnapshot.empty) {
          const roomDoc = roomSnapshot.docs[0];
          const room = { id: roomDoc.id, ...roomDoc.data() } as Room;

          // Créer le blocage lié à l'intervention
          const intervention: Intervention = {
            id: docRef.id,
            ...interventionData,
          } as Intervention;

          const blockageId = await createBlockageFromIntervention(
            intervention,
            room,
            establishmentId
          );

          logger.debug(
            `✅ Blocage créé automatiquement: ${blockageId} pour chambre ${room.number}`
          );
        } else {
          logger.warn(`⚠️ Chambre ${data.roomNumber} non trouvée pour bloquer`);
        }
      } catch (error) {
        logger.warn('⚠️ Erreur création blocage automatique:', error);
        // Ne pas bloquer la création de l'intervention si le blocage échoue
      }
    }

    // Envoyer une notification si urgente
    if (interventionData.isUrgent) {
      try {
        // Récupérer tous les admins de l'établissement pour les notifier
        const usersQuery = query(
          collection(db, 'users'),
          where('establishmentIds', 'array-contains', establishmentId),
          where('role', 'in', ['admin', 'super_admin', 'editor'])
        );
        const usersSnapshot = await getDocs(usersQuery);
        const adminIds = usersSnapshot.docs.map(doc => doc.id);

        if (adminIds.length > 0) {
          await notifyInterventionUrgent(
            adminIds,
            establishmentId,
            docRef.id,
            interventionData.title as string
          );
          logger.debug('✅ Notifications urgentes envoyées');
        }
      } catch (error) {
        logger.warn("⚠️ Impossible d'envoyer les notifications urgentes:", error);
      }
    }

    // Notifier les techniciens assignés lors de la création
    // Utiliser createFlattenedAssignedToIds (tableau plat de strings) pour éviter les problèmes de nested arrays
    if (createFlattenedAssignedToIds.length > 0) {
      try {
        const creatorName = data.createdByName || 'Un utilisateur';
        for (const technicianId of createFlattenedAssignedToIds) {
          // Ne pas notifier si c'est le créateur lui-même qui s'est assigné
          if (technicianId !== userId) {
            await notifyInterventionAssigned(
              technicianId,
              establishmentId,
              docRef.id,
              data.title,
              creatorName
            );
          }
        }
        logger.debug("✅ Notifications d'assignation envoyées");
      } catch (error) {
        logger.warn("⚠️ Impossible d'envoyer les notifications d'assignation:", error);
      }
    }

    return docRef.id;
  } catch (error) {
    logger.error('❌ Erreur création intervention:', error);
    throw new Error("Impossible de créer l'intervention");
  }
};

/**
 * Obtenir une intervention par ID
 */
export const getIntervention = async (
  establishmentId: string,
  interventionId: string
): Promise<Intervention | null> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Intervention;
  } catch (error) {
    logger.error('❌ Erreur récupération intervention:', error);
    throw new Error("Impossible de récupérer l'intervention");
  }
};

/**
 * Mettre à jour une intervention
 */
export const updateIntervention = async (
  establishmentId: string,
  interventionId: string,
  data: UpdateInterventionData
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.roomNumber !== undefined) updateData.roomNumber = data.roomNumber;
    if (data.floor !== undefined) updateData.floor = data.floor;
    if (data.building !== undefined) updateData.building = data.building;

    // Gestion de l'assignation (support multi-techniciens)
    // S'assurer que assignedToIds est un tableau plat de strings
    const flattenedAssignedToIds =
      data.assignedToIds !== undefined
        ? data.assignedToIds.flat().filter((id): id is string => typeof id === 'string')
        : [];

    if (flattenedAssignedToIds.length > 0) {
      // Nouveau format: plusieurs techniciens
      updateData.assignedToIds = flattenedAssignedToIds;
      updateData.assignedTo = flattenedAssignedToIds[0]; // Legacy (premier technicien)

      // Récupérer les noms des techniciens
      try {
        const techNames: string[] = [];
        for (const techId of flattenedAssignedToIds) {
          const techDoc = await getDoc(doc(db, 'users', techId));
          if (techDoc.exists()) {
            const techData = techDoc.data();
            techNames.push(techData.displayName || techData.email || 'Inconnu');
          } else {
            techNames.push('Inconnu');
          }
        }
        updateData.assignedToNames = techNames;
        updateData.assignedToName = techNames.join(', '); // Legacy
      } catch (error) {
        logger.warn('⚠️ Impossible de récupérer les noms des techniciens:', error);
        updateData.assignedToNames = flattenedAssignedToIds.map(() => 'Inconnu');
        updateData.assignedToName = 'Inconnu';
      }
    } else if (data.assignedTo !== undefined && typeof data.assignedTo === 'string') {
      // Legacy format: un seul technicien (s'assurer que c'est une string)
      updateData.assignedTo = data.assignedTo;
      updateData.assignedToIds = [data.assignedTo];

      // Récupérer le nom du technicien
      try {
        const techDoc = await getDoc(doc(db, 'users', data.assignedTo));
        if (techDoc.exists()) {
          const techData = techDoc.data();
          const techName = techData.displayName || techData.email || 'Inconnu';
          updateData.assignedToName = techName;
          updateData.assignedToNames = [techName];
        } else {
          updateData.assignedToName = 'Inconnu';
          updateData.assignedToNames = ['Inconnu'];
        }
      } catch (error) {
        logger.warn('⚠️ Impossible de récupérer le nom du technicien:', error);
        updateData.assignedToName = 'Inconnu';
        updateData.assignedToNames = ['Inconnu'];
      }
    }

    if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;
    if (data.resolutionNotes !== undefined) updateData.resolutionNotes = data.resolutionNotes;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isUrgent !== undefined) updateData.isUrgent = data.isUrgent;
    if (data.isBlocking !== undefined) updateData.isBlocking = data.isBlocking;

    // Gérer scheduledAt (peut être null pour supprimer la planification)
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt ? Timestamp.fromDate(data.scheduledAt) : null;
    }
    if (data.estimatedDuration !== undefined) {
      updateData.estimatedDuration = data.estimatedDuration;
    }

    // Gérer les changements de date limite personnalisée
    if (data.dueDate) {
      updateData.dueDate = Timestamp.fromDate(data.dueDate);
    }

    // Si la priorité change, recalculer la date limite SLA (sauf si date personnalisée)
    if (data.priority !== undefined && !data.dueDate) {
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists()) {
        const currentData = currentDoc.data();
        const createdAt = currentData.createdAt?.toDate() || new Date();
        const newDueDate = calculateDueDate(createdAt, data.priority);
        updateData.dueDate = Timestamp.fromDate(newDueDate);
        updateData.slaTarget = SLA_TARGETS[data.priority];
      }
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    logger.error('❌ Erreur mise à jour:', error);
    throw new Error("Impossible de mettre à jour l'intervention");
  }
};

/**
 * Changer le statut d'une intervention
 */
export const changeStatus = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  statusData: StatusChangeData
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);

    // Récupérer l'intervention actuelle pour obtenir l'ancien statut
    const interventionDoc = await getDoc(docRef);
    if (!interventionDoc.exists()) {
      throw new Error('Intervention non trouvée');
    }

    const interventionData = interventionDoc.data();
    const oldStatus = interventionData.status;
    const interventionTitle = interventionData.title || 'Intervention';

    const updateData: Record<string, unknown> = {
      status: statusData.newStatus,
      updatedAt: serverTimestamp(),
    };

    if (statusData.newStatus === 'in_progress') {
      updateData.startedAt = serverTimestamp();
      // Marquer la première réponse si pas encore définie
      if (!interventionData.firstResponseAt) {
        updateData.firstResponseAt = serverTimestamp();
        const createdAt = interventionData.createdAt?.toDate();
        if (createdAt) {
          const responseTime = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60));
          updateData.responseTime = responseTime;
        }
      }
    } else if (statusData.newStatus === 'completed') {
      const completedAt = new Date();
      updateData.completedAt = serverTimestamp();

      // Calculer le temps de résolution
      const createdAt = interventionData.createdAt?.toDate();
      if (createdAt) {
        const resolutionTime = Math.floor(
          (completedAt.getTime() - createdAt.getTime()) / (1000 * 60)
        );
        updateData.resolutionTime = resolutionTime;

        // Vérifier si le SLA a été respecté
        const dueDate = interventionData.dueDate?.toDate();
        if (dueDate && completedAt > dueDate) {
          updateData.slaStatus = 'breached';
          updateData.slaBreachedAt = Timestamp.fromDate(dueDate);
        } else {
          updateData.slaStatus = 'on_track';
        }
      }

      if (statusData.resolutionNotes) {
        updateData.resolutionNotes = statusData.resolutionNotes;
      }

      // ========================================================================
      // DÉBLOCAGE AUTOMATIQUE - Résoudre le blocage de la chambre
      // ========================================================================
      if (interventionData.isBlocking) {
        try {
          await resolveBlockageForIntervention(interventionId, establishmentId);
          logger.debug(`✅ Blocage résolu automatiquement pour intervention ${interventionId}`);
        } catch (error) {
          logger.warn('⚠️ Erreur résolution blocage automatique:', error);
          // Ne pas bloquer la complétion de l'intervention si la résolution échoue
        }
      }

      // ========================================================================
      // NOTIFICATION DE COMPLÉTION - Notifier le créateur
      // ========================================================================
      try {
        // Notifier le créateur si différent de l'utilisateur qui complète
        if (interventionData.createdBy && interventionData.createdBy !== userId) {
          // Récupérer le nom de l'utilisateur qui complète
          let completedByName = 'Utilisateur';
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              completedByName = userData.displayName || userData.email || 'Utilisateur';
            }
          } catch {
            // Ignorer
          }

          await notifyInterventionCompleted(
            interventionData.createdBy,
            establishmentId,
            interventionId,
            interventionTitle,
            completedByName
          );
          logger.debug('✅ Notification de complétion envoyée au créateur');
        }
      } catch (error) {
        logger.warn("⚠️ Impossible d'envoyer la notification de complétion:", error);
      }
    }

    await updateDoc(docRef, updateData);

    // Notifier les personnes concernées du changement de statut
    try {
      const statusLabels: Record<string, string> = {
        pending: 'En attente',
        assigned: 'Assignée',
        in_progress: 'En cours',
        completed: 'Terminée',
        cancelled: 'Annulée',
        on_hold: 'En pause',
      };

      // Notifier le créateur et la personne assignée (s'ils sont différents de celui qui change le statut)
      const usersToNotify: string[] = [];

      if (interventionData.createdBy && interventionData.createdBy !== userId) {
        usersToNotify.push(interventionData.createdBy);
      }

      if (
        interventionData.assignedTo &&
        interventionData.assignedTo !== userId &&
        !usersToNotify.includes(interventionData.assignedTo)
      ) {
        usersToNotify.push(interventionData.assignedTo);
      }

      // Envoyer les notifications
      for (const userToNotify of usersToNotify) {
        await notifyStatusChanged(
          userToNotify,
          establishmentId,
          interventionId,
          interventionTitle,
          statusLabels[oldStatus] || oldStatus,
          statusLabels[statusData.newStatus] || statusData.newStatus
        );
      }

      if (usersToNotify.length > 0) {
        logger.debug(`✅ ${usersToNotify.length} notifications de changement de statut envoyées`);
      }
    } catch (error) {
      logger.warn("⚠️ Impossible d'envoyer les notifications de changement de statut:", error);
    }

    // Logger le changement de statut dans l'historique
    try {
      // Récupérer les infos utilisateur
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userName = userDoc.exists()
        ? userDoc.data().displayName || userDoc.data().email || 'Utilisateur'
        : 'Utilisateur';
      const userRole = userDoc.exists() ? userDoc.data().role : undefined;

      await logStatusChange(
        establishmentId,
        interventionId,
        userId,
        userName,
        userRole,
        oldStatus,
        statusData.newStatus
      );
    } catch (error) {
      logger.warn('⚠️ Erreur logging historique statut:', error);
    }
  } catch (error) {
    logger.error('❌ Erreur changement statut:', error);
    throw new Error('Impossible de changer le statut');
  }
};

/**
 * Assigner une intervention
 */
export const assignIntervention = async (
  establishmentId: string,
  interventionId: string,
  assignmentData: AssignmentData,
  assignedByUserId?: string
): Promise<void> => {
  try {
    // Récupérer l'intervention pour obtenir son titre
    const interventionDoc = await getDoc(
      doc(db, 'establishments', establishmentId, 'interventions', interventionId)
    );
    const interventionTitle = interventionDoc.exists()
      ? interventionDoc.data().title
      : 'Intervention';

    // Récupérer le nom du technicien assigné et celui qui fait l'assignation
    let assignedToName = 'Inconnu';
    let assignedByName = 'Système';

    try {
      const techDoc = await getDoc(doc(db, 'users', assignmentData.technicianId));
      if (techDoc.exists()) {
        const techData = techDoc.data();
        assignedToName = techData.displayName || techData.email || 'Inconnu';
      }

      if (assignedByUserId) {
        const assignerDoc = await getDoc(doc(db, 'users', assignedByUserId));
        if (assignerDoc.exists()) {
          const assignerData = assignerDoc.data();
          assignedByName = assignerData.displayName || assignerData.email || 'Système';
        }
      }
    } catch (error) {
      logger.warn('⚠️ Impossible de récupérer les noms des utilisateurs:', error);
    }

    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    const updateData: Record<string, unknown> = {
      assignedTo: assignmentData.technicianId,
      assignedToName,
      assignedAt: serverTimestamp(),
      status: 'assigned',
      updatedAt: serverTimestamp(),
    };

    // Marquer la première réponse si pas encore définie
    const interventionData = interventionDoc.data();
    if (interventionData && !interventionData.firstResponseAt) {
      updateData.firstResponseAt = serverTimestamp();
      const createdAt = interventionData.createdAt?.toDate();
      if (createdAt) {
        const responseTime = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60));
        updateData.responseTime = responseTime;
      }
    }

    await updateDoc(docRef, updateData);

    // Envoyer notification au technicien assigné
    try {
      await notifyInterventionAssigned(
        assignmentData.technicianId,
        establishmentId,
        interventionId,
        interventionTitle,
        assignedByName
      );
      logger.debug("✅ Notification d'assignation envoyée");
    } catch (error) {
      logger.warn("⚠️ Impossible d'envoyer la notification d'assignation:", error);
    }

    // Logger l'assignation dans l'historique
    try {
      // Récupérer les infos de l'utilisateur qui fait l'assignation
      const userDoc = await getDoc(doc(db, 'users', assignmentData.technicianId));
      const userName = userDoc.exists()
        ? userDoc.data().displayName || userDoc.data().email || 'Utilisateur'
        : 'Utilisateur';
      const userRole = userDoc.exists() ? userDoc.data().role : undefined;

      await logAssignment(
        establishmentId,
        interventionId,
        assignmentData.technicianId,
        userName,
        userRole,
        assignedToName
      );
    } catch (error) {
      logger.warn('⚠️ Erreur logging historique assignation:', error);
    }
  } catch (error) {
    logger.error('❌ Erreur assignation:', error);
    throw new Error("Impossible d'assigner l'intervention");
  }
};

/**
 * Supprimer une intervention (soft delete)
 */
export const deleteIntervention = async (
  establishmentId: string,
  interventionId: string,
  userId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('❌ Erreur suppression:', error);
    throw new Error("Impossible de supprimer l'intervention");
  }
};

/**
 * Supprimer définitivement
 */
export const permanentlyDeleteIntervention = async (
  establishmentId: string,
  interventionId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error('❌ Erreur suppression permanente:', error);
    throw new Error('Impossible de supprimer définitivement');
  }
};

/**
 * ✅ Incrémenter le compteur de vues d'une intervention
 */
export const incrementViewCount = async (
  establishmentId: string,
  interventionId: string,
  userId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    await updateDoc(docRef, {
      viewCount: increment(1),
      lastViewedAt: serverTimestamp(),
      lastViewedBy: userId,
    });
  } catch (error) {
    logger.error("❌ Erreur lors de l'incrémentation du compteur de vues:", error);
    // Ne pas bloquer l'affichage de l'intervention si l'incrémentation échoue
    // L'erreur est loggée mais pas relancée
  }
};

/**
 * ✅ CORRIGÉ: S'abonner aux interventions en temps réel
 * AVEC TOUS LES PARAMÈTRES QUE LE HOOK ENVOIE
 */
export const subscribeToInterventions = (
  establishmentId: string,
  filters: InterventionFilters | undefined,
  sortOptions: InterventionSortOptions | undefined,
  limitCount: number | undefined,
  onSuccess: (interventions: Intervention[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  try {
    const collectionRef = getInterventionsCollection(establishmentId);

    // Construire la query de base
    const constraints: QueryConstraint[] = [where('isDeleted', '==', false)];

    // Appliquer les filtres
    // Status - support multi-valeurs avec 'in' (max 10 valeurs)
    if (filters?.status && filters.status.length > 0) {
      if (filters.status.length === 1) {
        constraints.push(where('status', '==', filters.status[0]));
      } else {
        // Firestore 'in' supporte max 10 valeurs
        const statusValues = filters.status.slice(0, 10);
        constraints.push(where('status', 'in', statusValues));
      }
    }

    // Priority - support multi-valeurs avec 'in' (max 10 valeurs)
    if (filters?.priority && filters.priority.length > 0) {
      if (filters.priority.length === 1) {
        constraints.push(where('priority', '==', filters.priority[0]));
      } else {
        // Firestore 'in' supporte max 10 valeurs
        const priorityValues = filters.priority.slice(0, 10);
        constraints.push(where('priority', 'in', priorityValues));
      }
    }

    // Type - valeur simple
    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }

    // Category - valeur simple
    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }

    // Assigned To - valeur simple
    if (filters?.assignedTo) {
      constraints.push(where('assignedTo', '==', filters.assignedTo));
    }

    // Created By - valeur simple
    if (filters?.createdBy) {
      constraints.push(where('createdBy', '==', filters.createdBy));
    }

    // Is Urgent - booléen
    if (filters?.isUrgent !== undefined) {
      constraints.push(where('isUrgent', '==', filters.isUrgent));
    }

    // Is Blocking - booléen
    if (filters?.isBlocking !== undefined) {
      constraints.push(where('isBlocking', '==', filters.isBlocking));
    }

    // Date From - filtrer les interventions créées après cette date
    if (filters?.dateFrom) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.dateFrom)));
    }

    // Date To - filtrer les interventions créées avant cette date
    if (filters?.dateTo) {
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.dateTo)));
    }

    // Appliquer le tri
    const sortField = sortOptions?.field || 'createdAt';
    const sortOrder = sortOptions?.order || 'desc';
    constraints.push(orderBy(sortField, sortOrder));

    // Appliquer la limite
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collectionRef, ...constraints);

    // S'abonner aux changements
    const unsubscribe = onSnapshot(
      q,
      async snapshot => {
        const interventions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Intervention[];

        logger.debug(`📡 ${interventions.length} interventions reçues`);

        // Enrichir les interventions avec les noms manquants
        const enriched = await enrichInterventions(interventions);
        onSuccess(enriched);
      },
      error => {
        logger.error('❌ Erreur subscription:', error);
        onError(error as Error);
      }
    );

    return unsubscribe;
  } catch (error) {
    logger.error('❌ Erreur création subscription:', error);
    onError(error as Error);
    return () => {};
  }
};

/**
 * ✅ CORRIGÉ: Obtenir les interventions (sans temps réel)
 * AVEC TOUS LES PARAMÈTRES
 */
export const getInterventions = async (
  establishmentId: string,
  filters?: InterventionFilters,
  sortOptions?: InterventionSortOptions,
  limitCount?: number
): Promise<Intervention[]> => {
  try {
    const collectionRef = getInterventionsCollection(establishmentId);

    const constraints: QueryConstraint[] = [where('isDeleted', '==', false)];

    // Appliquer les filtres (même logique que subscribeToInterventions)
    // Status - support multi-valeurs avec 'in' (max 10 valeurs)
    if (filters?.status && filters.status.length > 0) {
      if (filters.status.length === 1) {
        constraints.push(where('status', '==', filters.status[0]));
      } else {
        const statusValues = filters.status.slice(0, 10);
        constraints.push(where('status', 'in', statusValues));
      }
    }

    // Priority - support multi-valeurs avec 'in' (max 10 valeurs)
    if (filters?.priority && filters.priority.length > 0) {
      if (filters.priority.length === 1) {
        constraints.push(where('priority', '==', filters.priority[0]));
      } else {
        const priorityValues = filters.priority.slice(0, 10);
        constraints.push(where('priority', 'in', priorityValues));
      }
    }

    // Type - valeur simple
    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }

    // Category - valeur simple
    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }

    // Assigned To - valeur simple
    if (filters?.assignedTo) {
      constraints.push(where('assignedTo', '==', filters.assignedTo));
    }

    // Created By - valeur simple
    if (filters?.createdBy) {
      constraints.push(where('createdBy', '==', filters.createdBy));
    }

    // Is Urgent - booléen
    if (filters?.isUrgent !== undefined) {
      constraints.push(where('isUrgent', '==', filters.isUrgent));
    }

    // Is Blocking - booléen
    if (filters?.isBlocking !== undefined) {
      constraints.push(where('isBlocking', '==', filters.isBlocking));
    }

    // Date From - filtrer les interventions créées après cette date
    if (filters?.dateFrom) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.dateFrom)));
    }

    // Date To - filtrer les interventions créées avant cette date
    if (filters?.dateTo) {
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.dateTo)));
    }

    // Appliquer le tri
    const sortField = sortOptions?.field || 'createdAt';
    const sortOrder = sortOptions?.order || 'desc';
    constraints.push(orderBy(sortField, sortOrder));

    // Appliquer la limite
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    const interventions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Intervention[];

    logger.debug(`✅ ${interventions.length} interventions récupérées`);

    // Enrichir les interventions avec les noms manquants
    const enriched = await enrichInterventions(interventions);
    return enriched;
  } catch (error) {
    logger.error('❌ Erreur récupération:', error);
    throw new Error('Impossible de récupérer les interventions');
  }
};

// ✅ EXPORT FINAL COMPLET
export default {
  createIntervention,
  getIntervention,
  updateIntervention,
  changeStatus,
  assignIntervention,
  deleteIntervention,
  permanentlyDeleteIntervention,
  incrementViewCount, // ✅ AJOUTÉ
  subscribeToInterventions, // ✅ CORRIGÉ
  getInterventions, // ✅ CORRIGÉ
};
