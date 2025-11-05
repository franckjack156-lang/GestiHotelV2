/**
 * Intervention Service
 * 
 * Service pour gérer les opérations CRUD des interventions avec Firebase
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
  startAfter,
  onSnapshot,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
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
 * Obtenir la référence de la collection interventions pour un établissement
 */
const getInterventionsCollection = (establishmentId: string) => {
  return collection(db, 'establishments', establishmentId, 'interventions');
};

/**
 * Générer une référence unique pour l'intervention
 */
const generateReference = async (establishmentId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const collectionRef = getInterventionsCollection(establishmentId);
  
  // Compter les interventions de l'année en cours
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
    
    const interventionData: Omit<Intervention, 'id'> = {
      // Établissement
      establishmentId,
      
      // Données de base
      title: data.title,
      description: data.description,
      type: data.type,
      category: data.category,
      priority: data.priority,
      status: 'pending' as InterventionStatus, // Statut initial
      
      // Localisation
      location: data.location,
      roomNumber: data.roomNumber,
      floor: data.floor,
      building: data.building,
      
      // Assignation
      createdBy: userId,
      assignedTo: data.assignedTo,
      assignedAt: data.assignedTo ? serverTimestamp() as Timestamp : undefined,
      
      // Dates
      scheduledAt: data.scheduledAt ? Timestamp.fromDate(data.scheduledAt) : undefined,
      estimatedDuration: data.estimatedDuration,
      
      // Notes
      internalNotes: data.internalNotes,
      
      // Photos (vides au départ, ajoutées après)
      photos: [],
      photosCount: 0,
      
      // Métadonnées
      reference,
      tags: data.tags || [],
      isUrgent: data.isUrgent || data.priority === 'urgent' || data.priority === 'critical',
      isBlocking: data.isBlocking || false,
      requiresValidation: false,
      
      // Statistiques
      viewsCount: 0,
      
      // Timestamps
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      
      // Soft delete
      isDeleted: false,
    };
    
    const docRef = await addDoc(collectionRef, interventionData);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de l\'intervention:', error);
    throw new Error('Impossible de créer l\'intervention');
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
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Intervention;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'intervention:', error);
    throw new Error('Impossible de récupérer l\'intervention');
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
    
    const updateData: Record<string, any> = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    
    // Convertir les dates
    if (data.scheduledAt) {
      updateData.scheduledAt = Timestamp.fromDate(data.scheduledAt);
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'intervention:', error);
    throw new Error('Impossible de mettre à jour l\'intervention');
  }
};

/**
 * Changer le statut d'une intervention
 */
export const changeStatus = async (
  establishmentId: string,
  interventionId: string,
  userId: string,
  data: StatusChangeData
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    
    const updateData: Record<string, any> = {
      status: data.newStatus,
      updatedAt: serverTimestamp(),
    };
    
    // Ajouter des timestamps selon le nouveau statut
    if (data.newStatus === 'in_progress' && !data.completedAt) {
      updateData.startedAt = serverTimestamp();
    }
    
    if (data.newStatus === 'completed') {
      updateData.completedAt = data.completedAt 
        ? Timestamp.fromDate(data.completedAt)
        : serverTimestamp();
      updateData.resolutionNotes = data.resolutionNotes;
    }
    
    if (data.newStatus === 'validated') {
      updateData.validatedBy = userId;
      updateData.validatedAt = serverTimestamp();
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    throw new Error('Impossible de changer le statut');
  }
};

/**
 * Assigner une intervention à un technicien
 */
export const assignIntervention = async (
  establishmentId: string,
  interventionId: string,
  data: AssignmentData
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    
    const updateData: Record<string, any> = {
      assignedTo: data.technicianId,
      assignedAt: serverTimestamp(),
      status: 'assigned',
      updatedAt: serverTimestamp(),
    };
    
    if (data.scheduledAt) {
      updateData.scheduledAt = Timestamp.fromDate(data.scheduledAt);
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Erreur lors de l\'assignation:', error);
    throw new Error('Impossible d\'assigner l\'intervention');
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
    console.error('Erreur lors de la suppression de l\'intervention:', error);
    throw new Error('Impossible de supprimer l\'intervention');
  }
};

/**
 * Supprimer définitivement une intervention
 */
export const permanentlyDeleteIntervention = async (
  establishmentId: string,
  interventionId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erreur lors de la suppression définitive:', error);
    throw new Error('Impossible de supprimer définitivement l\'intervention');
  }
};

/**
 * Construire une query avec filtres
 */
const buildQuery = (
  establishmentId: string,
  filters?: InterventionFilters,
  sortOptions?: InterventionSortOptions,
  limitCount?: number
) => {
  const collectionRef = getInterventionsCollection(establishmentId);
  const constraints: QueryConstraint[] = [];
  
  // Exclure les supprimés par défaut
  constraints.push(where('isDeleted', '==', false));
  
  // Filtres
  if (filters) {
    if (filters.status && filters.status.length > 0) {
      constraints.push(where('status', 'in', filters.status));
    }
    
    if (filters.priority && filters.priority.length > 0) {
      constraints.push(where('priority', 'in', filters.priority));
    }
    
    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }
    
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    
    if (filters.assignedTo) {
      constraints.push(where('assignedTo', '==', filters.assignedTo));
    }
    
    if (filters.createdBy) {
      constraints.push(where('createdBy', '==', filters.createdBy));
    }
    
    if (filters.isUrgent !== undefined) {
      constraints.push(where('isUrgent', '==', filters.isUrgent));
    }
    
    if (filters.isBlocking !== undefined) {
      constraints.push(where('isBlocking', '==', filters.isBlocking));
    }
    
    if (filters.dateFrom) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.dateFrom)));
    }
    
    if (filters.dateTo) {
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.dateTo)));
    }
  }
  
  // Tri
  if (sortOptions) {
    constraints.push(orderBy(sortOptions.field, sortOptions.order));
  } else {
    // Tri par défaut : plus récents en premier
    constraints.push(orderBy('createdAt', 'desc'));
  }
  
  // Limite
  if (limitCount) {
    constraints.push(limit(limitCount));
  }
  
  return query(collectionRef, ...constraints);
};

/**
 * Obtenir la liste des interventions avec filtres
 */
export const getInterventions = async (
  establishmentId: string,
  filters?: InterventionFilters,
  sortOptions?: InterventionSortOptions,
  limitCount: number = 50
): Promise<Intervention[]> => {
  try {
    const q = buildQuery(establishmentId, filters, sortOptions, limitCount);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Intervention[];
  } catch (error) {
    console.error('Erreur lors de la récupération des interventions:', error);
    throw new Error('Impossible de récupérer les interventions');
  }
};

/**
 * S'abonner aux interventions en temps réel
 */
export const subscribeToInterventions = (
  establishmentId: string,
  filters: InterventionFilters | undefined,
  sortOptions: InterventionSortOptions | undefined,
  limitCount: number,
  callback: (interventions: Intervention[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const q = buildQuery(establishmentId, filters, sortOptions, limitCount);
    
    return onSnapshot(
      q,
      (snapshot) => {
        const interventions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Intervention[];
        
        callback(interventions);
      },
      (error) => {
        console.error('Erreur lors de l\'écoute des interventions:', error);
        if (onError) {
          onError(new Error('Erreur de synchronisation temps réel'));
        }
      }
    );
  } catch (error) {
    console.error('Erreur lors de la configuration de l\'écoute:', error);
    throw new Error('Impossible de s\'abonner aux interventions');
  }
};

/**
 * Incrémenter le compteur de vues
 */
export const incrementViewCount = async (
  establishmentId: string,
  interventionId: string,
  userId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);
    
    await updateDoc(docRef, {
      viewsCount: increment(1),
      lastViewedAt: serverTimestamp(),
      lastViewedBy: userId,
    });
  } catch (error) {
    console.error('Erreur lors de l\'incrémentation des vues:', error);
    // Ne pas lever d'erreur, c'est une action secondaire
  }
};

export default {
  createIntervention,
  getIntervention,
  updateIntervention,
  changeStatus,
  assignIntervention,
  deleteIntervention,
  permanentlyDeleteIntervention,
  getInterventions,
  subscribeToInterventions,
  incrementViewCount,
};
