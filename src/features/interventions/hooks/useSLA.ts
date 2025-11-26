/**
 * Hook pour gérer les SLA
 */

import { useMemo } from 'react';
import type { Intervention, SLAInfo } from '../types/intervention.types';
import { calculateSLA } from '../services/slaService';
import { logger } from '@/core/utils/logger';

/**
 * Hook pour calculer les informations SLA d'une intervention
 */
export const useSLA = (intervention: Intervention | null): SLAInfo | null => {
  return useMemo(() => {
    if (!intervention) return null;

    // Ne pas calculer le SLA pour les interventions terminées ou annulées
    if (intervention.status === 'completed' || intervention.status === 'cancelled') {
      return null;
    }

    try {
      return calculateSLA(intervention);
    } catch (error) {
      logger.error('Error calculating SLA:', error);
      return null;
    }
  }, [intervention]);
};

/**
 * Hook pour calculer les SLA de plusieurs interventions
 */
export const useSLAList = (interventions: Intervention[]): Map<string, SLAInfo> => {
  return useMemo(() => {
    const slaMap = new Map<string, SLAInfo>();

    interventions.forEach((intervention) => {
      // Ignorer les interventions terminées ou annulées
      if (intervention.status === 'completed' || intervention.status === 'cancelled') {
        return;
      }

      try {
        const slaInfo = calculateSLA(intervention);
        slaMap.set(intervention.id, slaInfo);
      } catch (error) {
        logger.error(`Error calculating SLA for intervention ${intervention.id}:`, error);
      }
    });

    return slaMap;
  }, [interventions]);
};

/**
 * Hook pour obtenir les statistiques SLA d'une liste d'interventions
 */
export const useSLAStats = (interventions: Intervention[]) => {
  return useMemo(() => {
    const stats = {
      total: 0,
      onTrack: 0,
      atRisk: 0,
      breached: 0,
      completed: 0,
    };

    interventions.forEach((intervention) => {
      stats.total++;

      if (intervention.status === 'completed' || intervention.status === 'cancelled') {
        stats.completed++;
        return;
      }

      try {
        const slaInfo = calculateSLA(intervention);

        switch (slaInfo.status) {
          case 'on_track':
            stats.onTrack++;
            break;
          case 'at_risk':
            stats.atRisk++;
            break;
          case 'breached':
            stats.breached++;
            break;
        }
      } catch (error) {
        logger.error(`Error calculating SLA for intervention ${intervention.id}:`, error);
      }
    });

    return stats;
  }, [interventions]);
};
