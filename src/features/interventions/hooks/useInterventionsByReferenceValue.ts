/**
 * ============================================================================
 * USE INTERVENTIONS BY REFERENCE VALUE HOOK
 * ============================================================================
 *
 * Hook pour compter et récupérer les interventions utilisant une valeur de référence
 * Utilisé pour détecter l'impact des modifications de listes de référence
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type { Intervention } from '../types/intervention.types';
import type { ListKey } from '@/shared/types/reference-lists.types';

// ============================================================================
// TYPES
// ============================================================================

interface UseInterventionsByReferenceValueReturn {
  /** Nombre d'interventions utilisant cette valeur */
  count: number;
  /** Liste des interventions (si loadFull = true) */
  interventions: Intervention[];
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: Error | null;
  /** Recharger les données */
  reload: () => Promise<void>;
}

// Mapping entre les clés de liste et les champs d'intervention
const FIELD_MAPPING: Record<ListKey, string[]> = {
  buildings: ['building'],
  floors: ['floor'],
  interventionTypes: ['type'],
  interventionPriorities: ['priority'],
  interventionCategories: ['category'],
  interventionStatuses: ['status'],
  interventionLocations: ['location'],
  equipmentTypes: ['equipmentType'],
  equipmentBrands: ['equipmentBrand'],
  equipmentLocations: ['equipmentLocation'],
  roomTypes: ['roomType'],
  roomStatuses: ['roomStatus'],
  bedTypes: ['bedType'],
  supplierCategories: ['supplierCategory'],
  supplierTypes: ['supplierType'],
  maintenanceFrequencies: ['maintenanceFrequency'],
  maintenanceTypes: ['maintenanceType'],
  documentCategories: ['documentCategory'],
  documentTypes: ['documentType'],
  expenseCategories: ['expenseCategory'],
  paymentMethods: ['paymentMethod'],
  staffDepartments: ['assignedDepartment'],
  staffRoles: ['assignedRole'],
  staffSkills: ['requiredSkills'],
  technicalSpecialties: ['technicalSpecialty'],
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook pour récupérer les interventions utilisant une valeur de référence
 *
 * @param establishmentId - ID de l'établissement
 * @param listKey - Clé de la liste de référence
 * @param value - Valeur à rechercher
 * @param options - Options de chargement
 */
export const useInterventionsByReferenceValue = (
  establishmentId: string | undefined,
  listKey: ListKey,
  value: string,
  options: {
    /** Charger la liste complète des interventions (sinon juste le count) */
    loadFull?: boolean;
    /** Auto-load au montage */
    autoLoad?: boolean;
  } = {}
): UseInterventionsByReferenceValueReturn => {
  const { loadFull = false, autoLoad = true } = options;

  const [count, setCount] = useState(0);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!establishmentId || !value) {
      setCount(0);
      setInterventions([]);
      setIsLoading(false);
      return;
    }

    // Obtenir les champs à rechercher pour cette liste
    const fields = FIELD_MAPPING[listKey];
    if (!fields || fields.length === 0) {
      console.warn(`No field mapping found for list key: ${listKey}`);
      setCount(0);
      setInterventions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const interventionsRef = collection(db, 'interventions');
      const allInterventions: Intervention[] = [];

      // Rechercher dans chaque champ possible
      for (const field of fields) {
        const q = query(
          interventionsRef,
          where('establishmentId', '==', establishmentId),
          where(field, '==', value)
        );

        const snapshot = await getDocs(q);
        const foundInterventions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Intervention[];

        // Éviter les doublons
        for (const intervention of foundInterventions) {
          if (!allInterventions.find(i => i.id === intervention.id)) {
            allInterventions.push(intervention);
          }
        }
      }

      setCount(allInterventions.length);
      if (loadFull) {
        setInterventions(allInterventions);
      }
    } catch (err) {
      console.error('Error loading interventions by reference value:', err);
      setError(err as Error);
      setCount(0);
      setInterventions([]);
    } finally {
      setIsLoading(false);
    }
  }, [establishmentId, listKey, value, loadFull]);

  // Auto-load
  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    count,
    interventions,
    isLoading,
    error,
    reload: load,
  };
};
