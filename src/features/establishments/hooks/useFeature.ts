/**
 * Hook pour vérifier si une fonctionnalité est activée pour l'établissement courant
 */

import { useEstablishmentStore } from '../stores/establishmentStore';
import type { EstablishmentFeatures } from '@/shared/types/establishment.types';

/**
 * Hook pour vérifier si une fonctionnalité est activée
 *
 * @example
 * const isPhotosEnabled = useFeature('photos');
 * const { hasFeature, hasAnyFeature, hasAllFeatures } = useFeature();
 */
export function useFeature(featureKey: keyof EstablishmentFeatures): boolean;
export function useFeature(): {
  hasFeature: (key: keyof EstablishmentFeatures) => boolean;
  hasAnyFeature: (...keys: (keyof EstablishmentFeatures)[]) => boolean;
  hasAllFeatures: (...keys: (keyof EstablishmentFeatures)[]) => boolean;
  getEnabledFeatures: () => (keyof EstablishmentFeatures)[];
  features: EstablishmentFeatures | undefined;
};
export function useFeature(featureKey?: keyof EstablishmentFeatures) {
  const { currentEstablishment } = useEstablishmentStore();

  /**
   * Vérifier si une fonctionnalité spécifique est activée
   */
  const hasFeature = (key: keyof EstablishmentFeatures): boolean => {
    if (!currentEstablishment?.features) return false;
    return currentEstablishment.features[key]?.enabled ?? false;
  };

  /**
   * Vérifier si au moins une des fonctionnalités est activée
   */
  const hasAnyFeature = (...keys: (keyof EstablishmentFeatures)[]): boolean => {
    return keys.some(key => hasFeature(key));
  };

  /**
   * Vérifier si toutes les fonctionnalités sont activées
   */
  const hasAllFeatures = (...keys: (keyof EstablishmentFeatures)[]): boolean => {
    return keys.every(key => hasFeature(key));
  };

  /**
   * Obtenir toutes les fonctionnalités activées
   */
  const getEnabledFeatures = (): (keyof EstablishmentFeatures)[] => {
    if (!currentEstablishment?.features) return [];

    return (Object.keys(currentEstablishment.features) as (keyof EstablishmentFeatures)[]).filter(
      key => currentEstablishment.features[key]?.enabled
    );
  };

  /**
   * Si une clé est fournie, retourner directement le résultat
   * Sinon retourner les fonctions utilitaires
   */
  if (featureKey) {
    return hasFeature(featureKey);
  }

  return {
    hasFeature,
    hasAnyFeature,
    hasAllFeatures,
    getEnabledFeatures,
    features: currentEstablishment?.features,
  };
}
