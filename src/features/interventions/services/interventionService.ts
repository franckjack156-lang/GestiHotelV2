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
} from '@/shared/services/notificationService';
import { calculateDueDate, SLA_TARGETS } from './slaService';
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
    let createdBy = data.createdBy || userId;

    // Si createdByName n'est pas fourni et qu'on utilise userId, récupérer le nom
    if (!data.createdByName && !data.createdBy) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          createdByName = userData.displayName || userData.email || 'Inconnu';
        }
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer le nom du créateur:', error);
      }
    }

    // Base data - only required fields
    const interventionData: Record<string, unknown> = {
      establishmentId,
      title: data.title,
      status: 'pending' as InterventionStatus,
      location: data.location,
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
        ? (data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(data.createdAt))
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false,
    };

    // Add optional fields only if they are defined and not empty
    if (data.description !== undefined && data.description !== '') {
      interventionData.description = data.description;
    }
    if (data.type !== undefined) {
      interventionData.type = data.type;
    }
    if (data.category !== undefined) {
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
    if (data.assignedTo) {
      // Gérer le cas où assignedTo peut être une string ou un array
      const assignedToIds = Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo];

      // Pour l'instant, on stocke seulement le premier technicien dans assignedTo
      // TODO: Créer un champ assignedToIds pour stocker tous les IDs
      interventionData.assignedTo = assignedToIds[0];

      // Utiliser assignedAt fourni (import historique) ou serverTimestamp() pour nouvelle assignation
      interventionData.assignedAt = data.assignedAt
        ? (data.assignedAt instanceof Timestamp ? data.assignedAt : Timestamp.fromDate(data.assignedAt))
        : serverTimestamp();

      // Utiliser assignedToName fourni (import historique) ou récupérer depuis la base
      if (data.assignedToName) {
        interventionData.assignedToName = data.assignedToName;
      } else {
        // Récupérer les noms de tous les techniciens assignés
        try {
          const techNames: string[] = [];

          for (const techId of assignedToIds) {
            const techDoc = await getDoc(doc(db, 'users', techId));

            if (techDoc.exists()) {
              const techData = techDoc.data();
              const techName = techData.displayName || techData.email || 'Inconnu';
              techNames.push(techName);
            } else {
              techNames.push('Inconnu');
            }
          }

          // Joindre les noms avec une virgule
          interventionData.assignedToName = techNames.join(', ');
        } catch (error) {
          console.warn('⚠️ Impossible de récupérer le nom du technicien:', error);
          interventionData.assignedToName = 'Inconnu';
        }
      }
    } else if (data.assignedToName) {
      // Cas spécial pour import historique: nom de technicien fourni sans ID utilisateur
      // (technicien dans liste de référence, pas dans users)
      interventionData.assignedToName = data.assignedToName;
      if (data.assignedAt) {
        interventionData.assignedAt = data.assignedAt instanceof Timestamp
          ? data.assignedAt
          : Timestamp.fromDate(data.assignedAt);
      }
    }
    if (data.scheduledAt) {
      interventionData.scheduledAt = Timestamp.fromDate(data.scheduledAt);
    }
    if (data.estimatedDuration) {
      interventionData.estimatedDuration = data.estimatedDuration;
    }
    if (data.internalNotes) {
      interventionData.internalNotes = data.internalNotes;
    }

    // Calculer les champs SLA
    const priority = (data.priority || 'normal') as keyof typeof SLA_TARGETS;
    const createdDate = new Date();
    const customDueDate = data.dueDate;
    const dueDate = calculateDueDate(createdDate, priority, customDueDate);

    interventionData.slaTarget = SLA_TARGETS[priority];
    interventionData.dueDate = Timestamp.fromDate(dueDate);
    interventionData.slaStatus = 'on_track';

    // Si l'intervention est assignée à la création, marquer la première réponse
    if (data.assignedTo) {
      interventionData.firstResponseAt = serverTimestamp();
      interventionData.responseTime = 0; // Assignation immédiate
    }

    const docRef = await addDoc(collectionRef, interventionData);
    console.log('✅ Intervention créée:', docRef.id);

    // Envoyer une notification si urgente
    if (interventionData.isUrgent) {
      try {
        // Récupérer tous les admins de l'établissement pour les notifier
        const usersQuery = query(
          collection(db, 'users'),
          where('establishmentIds', 'array-contains', establishmentId),
          where('role', 'in', ['admin', 'super_admin'])
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
          console.log('✅ Notifications urgentes envoyées');
        }
      } catch (error) {
        console.warn("⚠️ Impossible d'envoyer les notifications urgentes:", error);
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur création intervention:', error);
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
    console.error('❌ Erreur récupération intervention:', error);
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
    const updateData: Record<string, any> = { updatedAt: serverTimestamp() };

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
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;
    if (data.resolutionNotes !== undefined) updateData.resolutionNotes = data.resolutionNotes;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isUrgent !== undefined) updateData.isUrgent = data.isUrgent;
    if (data.isBlocking !== undefined) updateData.isBlocking = data.isBlocking;

    if (data.scheduledAt) {
      updateData.scheduledAt = Timestamp.fromDate(data.scheduledAt);
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
    console.error('❌ Erreur mise à jour:', error);
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

    const updateData: Record<string, any> = {
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
        const resolutionTime = Math.floor((completedAt.getTime() - createdAt.getTime()) / (1000 * 60));
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
        console.log(`✅ ${usersToNotify.length} notifications de changement de statut envoyées`);
      }
    } catch (error) {
      console.warn("⚠️ Impossible d'envoyer les notifications de changement de statut:", error);
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
      console.warn('⚠️ Erreur logging historique statut:', error);
    }
  } catch (error) {
    console.error('❌ Erreur changement statut:', error);
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
      console.warn('⚠️ Impossible de récupérer les noms des utilisateurs:', error);
    }

    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    const updateData: Record<string, any> = {
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
      console.log("✅ Notification d'assignation envoyée");
    } catch (error) {
      console.warn("⚠️ Impossible d'envoyer la notification d'assignation:", error);
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
      console.warn('⚠️ Erreur logging historique assignation:', error);
    }
  } catch (error) {
    console.error('❌ Erreur assignation:', error);
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
    console.error('❌ Erreur suppression:', error);
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
    console.error('❌ Erreur suppression permanente:', error);
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
    console.error('❌ Erreur lors de l\'incrémentation du compteur de vues:', error);
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
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }
    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }
    if (filters?.assignedTo) {
      constraints.push(where('assignedTo', '==', filters.assignedTo));
    }
    if (filters?.isUrgent !== undefined) {
      constraints.push(where('isUrgent', '==', filters.isUrgent));
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

        console.log(`📡 ${interventions.length} interventions reçues`);

        // Enrichir les interventions avec les noms manquants
        const enriched = await enrichInterventions(interventions);
        onSuccess(enriched);
      },
      error => {
        console.error('❌ Erreur subscription:', error);
        onError(error as Error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ Erreur création subscription:', error);
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

    // Appliquer les filtres
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }
    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }
    if (filters?.assignedTo) {
      constraints.push(where('assignedTo', '==', filters.assignedTo));
    }
    if (filters?.isUrgent !== undefined) {
      constraints.push(where('isUrgent', '==', filters.isUrgent));
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

    console.log(`✅ ${interventions.length} interventions récupérées`);

    // Enrichir les interventions avec les noms manquants
    const enriched = await enrichInterventions(interventions);
    return enriched;
  } catch (error) {
    console.error('❌ Erreur récupération:', error);
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
