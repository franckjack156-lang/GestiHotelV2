/**
 * Feature Flag Hook
 *
 * Hook pour vérifier si une fonctionnalité est activée pour l'établissement actuel
 */

import { useMemo } from 'react';
import { useEstablishmentStore } from '@/features/establishments/stores/establishmentStore';
import type { EstablishmentFeatures } from '@/shared/types/establishment.types';

/**
 * Hook pour vérifier si une feature est activée
 *
 * @param featureKey - Clé de la feature à vérifier
 * @returns true si la feature est activée, false sinon
 *
 * @example
 * const hasPlanning = useFeatureFlag('planning');
 * if (!hasPlanning) return <FeatureDisabled />;
 */
export const useFeatureFlag = (featureKey: keyof EstablishmentFeatures): boolean => {
  const { currentEstablishment } = useEstablishmentStore();

  return useMemo(() => {
    if (!currentEstablishment) {
      // Si pas d'établissement, on refuse l'accès par sécurité
      return false;
    }

    const feature = currentEstablishment.features?.[featureKey];
    return feature?.enabled ?? false;
  }, [currentEstablishment, featureKey]);
};

/**
 * Hook pour vérifier plusieurs features à la fois
 *
 * @param featureKeys - Array de clés de features
 * @returns Object avec les statuts de chaque feature
 *
 * @example
 * const { planning, rooms, exports } = useFeatureFlags(['planning', 'rooms', 'exports']);
 */
export const useFeatureFlags = (
  featureKeys: (keyof EstablishmentFeatures)[]
): Record<string, boolean> => {
  const { currentEstablishment } = useEstablishmentStore();

  return useMemo(() => {
    if (!currentEstablishment) {
      // Toutes les features désactivées par défaut
      return featureKeys.reduce(
        (acc, key) => {
          acc[key] = false;
          return acc;
        },
        {} as Record<string, boolean>
      );
    }

    return featureKeys.reduce(
      (acc, key) => {
        const feature = currentEstablishment.features?.[key];
        acc[key] = feature?.enabled ?? false;
        return acc;
      },
      {} as Record<string, boolean>
    );
  }, [currentEstablishment, featureKeys]);
};

/**
 * Hook pour obtenir toutes les features de l'établissement
 *
 * @returns Object avec toutes les features et leur statut
 */
export const useAllFeatures = (): EstablishmentFeatures | null => {
  const { currentEstablishment } = useEstablishmentStore();

  return useMemo(() => {
    return currentEstablishment?.features ?? null;
  }, [currentEstablishment]);
};

/**
 * Hook pour vérifier si TOUTES les features requises sont activées (AND)
 *
 * @param featureKeys - Array de clés de features requises
 * @returns true si toutes les features sont activées
 *
 * @example
 * const canUseAdvanced = useRequiresFeatures(['interventions', 'planning', 'analytics']);
 */
export const useRequiresFeatures = (featureKeys: (keyof EstablishmentFeatures)[]): boolean => {
  const { currentEstablishment } = useEstablishmentStore();

  return useMemo(() => {
    if (!currentEstablishment || featureKeys.length === 0) {
      return false;
    }

    return featureKeys.every(key => {
      const feature = currentEstablishment.features?.[key];
      return feature?.enabled ?? false;
    });
  }, [currentEstablishment, featureKeys]);
};

/**
 * Hook pour vérifier si AU MOINS UNE feature est activée (OR)
 *
 * @param featureKeys - Array de clés de features
 * @returns true si au moins une feature est activée
 */
export const useHasAnyFeature = (featureKeys: (keyof EstablishmentFeatures)[]): boolean => {
  const { currentEstablishment } = useEstablishmentStore();

  return useMemo(() => {
    if (!currentEstablishment || featureKeys.length === 0) {
      return false;
    }

    return featureKeys.some(key => {
      const feature = currentEstablishment.features?.[key];
      return feature?.enabled ?? false;
    });
  }, [currentEstablishment, featureKeys]);
};

/**
 * Type pour les résultats détaillés d'une feature
 */
export interface FeatureStatus {
  enabled: boolean;
  hasEstablishment: boolean;
  featureExists: boolean;
}

/**
 * Hook pour obtenir le statut détaillé d'une feature
 * Utile pour le debugging ou afficher des messages d'erreur spécifiques
 *
 * @param featureKey - Clé de la feature
 * @returns Statut détaillé de la feature
 */
export const useFeatureStatus = (featureKey: keyof EstablishmentFeatures): FeatureStatus => {
  const { currentEstablishment } = useEstablishmentStore();

  return useMemo(() => {
    const hasEstablishment = !!currentEstablishment;
    const featureExists = hasEstablishment && !!currentEstablishment.features?.[featureKey];
    const enabled = featureExists ? currentEstablishment.features[featureKey].enabled : false;

    return {
      enabled,
      hasEstablishment,
      featureExists,
    };
  }, [currentEstablishment, featureKey]);
};
