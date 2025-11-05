/**
 * useCurrentEstablishment Hook
 * 
 * Hook simplifié pour accéder à l'établissement actuel
 */

import { useEstablishmentStore } from '../stores/establishmentStore';
import { useAuthStore } from '@/features/auth/stores/authStore';

export const useCurrentEstablishment = () => {
  const { user } = useAuthStore();
  const { currentEstablishment } = useEstablishmentStore();

  /**
   * Obtenir l'ID de l'établissement actuel
   * 
   * Ordre de priorité:
   * 1. Établissement sélectionné dans le store
   * 2. currentEstablishmentId de l'utilisateur
   * 3. Premier établissement de la liste de l'utilisateur
   */
  const getCurrentEstablishmentId = (): string | null => {
    if (currentEstablishment) {
      return currentEstablishment.id;
    }

    if (user?.currentEstablishmentId) {
      return user.currentEstablishmentId;
    }

    if (user?.establishmentIds && user.establishmentIds.length > 0) {
      return user.establishmentIds[0];
    }

    return null;
  };

  /**
   * Vérifier si l'utilisateur a accès à plusieurs établissements
   */
  const hasMultipleEstablishments = (): boolean => {
    if (user?.role === 'super_admin') {
      return true;
    }

    return (user?.establishmentIds?.length || 0) > 1;
  };

  /**
   * Vérifier si l'utilisateur peut changer d'établissement
   */
  const canSwitchEstablishment = (): boolean => {
    return hasMultipleEstablishments();
  };

  return {
    // Établissement actuel
    currentEstablishment,
    
    // Helpers
    getCurrentEstablishmentId,
    hasMultipleEstablishments,
    canSwitchEstablishment,
    
    // Alias utiles
    establishmentId: getCurrentEstablishmentId(),
    establishment: currentEstablishment,
  };
};
