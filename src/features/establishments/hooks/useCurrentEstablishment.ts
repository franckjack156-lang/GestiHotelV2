/**
 * useCurrentEstablishment Hook
 *
 * Hook simplifié pour accéder à l'établissement actuel
 */

import { useEstablishmentStore } from '../stores/establishmentStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import establishmentService from '../services/establishmentService';

export const useCurrentEstablishment = () => {
  const { user } = useAuthStore();
  const { currentEstablishment, setCurrentEstablishment } = useEstablishmentStore();

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

  /**
   * Changer d'établissement
   */
  const setEstablishmentId = async (establishmentId: string) => {
    try {
      // Vérifier que l'utilisateur a accès à cet établissement
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      if (user.role !== 'super_admin' && !user.establishmentIds?.includes(establishmentId)) {
        throw new Error("Vous n'avez pas accès à cet établissement");
      }

      // Charger l'établissement
      const establishment = await establishmentService.getEstablishment(establishmentId);

      if (!establishment) {
        throw new Error('Établissement introuvable');
      }

      // Mettre à jour l'établissement actuel
      setCurrentEstablishment(establishment);

      console.log('Switched to establishment:', establishment.name);
    } catch (error) {
      console.error('Error switching establishment:', error);
      throw error;
    }
  };

  return {
    // Établissement actuel
    currentEstablishment,
    setCurrentEstablishment,

    // Helpers
    getCurrentEstablishmentId,
    hasMultipleEstablishments,
    canSwitchEstablishment,
    setEstablishmentId,

    // Alias utiles
    establishmentId: getCurrentEstablishmentId(),
    establishment: currentEstablishment,
  };
};
