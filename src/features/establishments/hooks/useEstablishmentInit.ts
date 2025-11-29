/**
 * Establishment Initialization Hook
 *
 * Hook pour gérer l'initialisation des établissements
 */

import { useState, useCallback } from 'react';
import {
  initializeEstablishment,
  isEstablishmentInitialized,
} from '../services/establishmentInitService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import type { EstablishmentFeatures } from '@/shared/types/establishment.types';
import { logger } from '@/core/utils/logger';

export const useEstablishmentInit = () => {
  const { user } = useAuth();
  const [initializing, setInitializing] = useState(false);
  const [checking, setChecking] = useState(false);

  /**
   * Initialiser un établissement
   */
  const initialize = useCallback(
    async (establishmentId: string, features?: EstablishmentFeatures): Promise<boolean> => {
      if (!user?.id) {
        toast.error('Vous devez être connecté');
        return false;
      }

      setInitializing(true);
      try {
        await initializeEstablishment(establishmentId, user.id, features);
        toast.success('Établissement initialisé avec succès');
        return true;
      } catch (error: any) {
        logger.error('Error initializing establishment:', error);
        toast.error("Erreur lors de l'initialisation", {
          description: error.message,
        });
        return false;
      } finally {
        setInitializing(false);
      }
    },
    [user]
  );

  /**
   * Vérifier si un établissement est initialisé
   */
  const checkInitialized = useCallback(async (establishmentId: string): Promise<boolean> => {
    setChecking(true);
    try {
      const initialized = await isEstablishmentInitialized(establishmentId);
      return initialized;
    } catch (error: unknown) {
      logger.error('Error checking initialization:', error);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  /**
   * Initialiser si nécessaire
   */
  const initializeIfNeeded = useCallback(
    async (establishmentId: string, features?: EstablishmentFeatures): Promise<void> => {
      const initialized = await checkInitialized(establishmentId);
      if (!initialized) {
        await initialize(establishmentId, features);
      }
    },
    [checkInitialized, initialize]
  );

  return {
    initialize,
    checkInitialized,
    initializeIfNeeded,
    initializing,
    checking,
  };
};
