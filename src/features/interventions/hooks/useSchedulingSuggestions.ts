/**
 * ============================================================================
 * USE SCHEDULING SUGGESTIONS HOOK
 * ============================================================================
 *
 * Hook pour suggérer des créneaux de planification optimaux
 * basé sur la charge actuelle des interventions
 */

import { useMemo } from 'react';
import {
  addDays,
  setHours,
  setMinutes,
  startOfDay,
  format,
  isWeekend,
  addMinutes,
  isBefore,
  isAfter,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Intervention } from '../types/intervention.types';

export interface TimeSlot {
  date: Date;
  label: string;
  load: number; // Nombre d'interventions déjà planifiées
  isRecommended: boolean;
  reason?: string;
}

interface UseSchedulingSuggestionsOptions {
  interventions: Intervention[];
  estimatedDuration?: number; // en minutes
  assignedTo?: string; // ID du technicien
  priority?: string;
  excludeWeekends?: boolean;
}

/**
 * Hook pour obtenir des suggestions de créneaux de planification
 */
export const useSchedulingSuggestions = ({
  interventions,
  estimatedDuration = 60,
  assignedTo,
  priority,
  excludeWeekends = false,
}: UseSchedulingSuggestionsOptions) => {
  // Calculer la charge par jour
  const dailyLoad = useMemo(() => {
    const loadMap = new Map<string, number>();

    interventions.forEach(intervention => {
      if (intervention.scheduledAt && typeof intervention.scheduledAt.toDate === 'function') {
        const date = intervention.scheduledAt.toDate();
        const dayKey = format(date, 'yyyy-MM-dd');

        // Compter uniquement les interventions du même technicien si spécifié
        if (!assignedTo || intervention.assignedTo === assignedTo) {
          loadMap.set(dayKey, (loadMap.get(dayKey) || 0) + 1);
        }
      }
    });

    return loadMap;
  }, [interventions, assignedTo]);

  // Générer les suggestions de créneaux
  const suggestions = useMemo((): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const maxDays = 14; // Suggérer jusqu'à 2 semaines à l'avance

    // Créneaux horaires suggérés (heures de travail: 8h-18h)
    const timeSlots = [
      { hour: 8, minute: 0, label: 'Matin (8h)' },
      { hour: 10, minute: 0, label: 'Milieu de matinée (10h)' },
      { hour: 14, minute: 0, label: "Début d'après-midi (14h)" },
      { hour: 16, minute: 0, label: "Fin d'après-midi (16h)" },
    ];

    for (let dayOffset = 0; dayOffset < maxDays; dayOffset++) {
      const targetDate = addDays(startOfDay(now), dayOffset);
      const dayKey = format(targetDate, 'yyyy-MM-dd');
      const load = dailyLoad.get(dayKey) || 0;

      // Exclure les week-ends si demandé
      if (excludeWeekends && isWeekend(targetDate)) {
        continue;
      }

      timeSlots.forEach(({ hour, minute, label: timeLabel }) => {
        const slotDate = setMinutes(setHours(targetDate, hour), minute);

        // Ne pas suggérer des créneaux dans le passé
        if (isBefore(slotDate, now)) {
          return;
        }

        // Vérifier si le créneau chevauche avec des interventions existantes
        const hasConflict = interventions.some(intervention => {
          if (!intervention.scheduledAt || !intervention.estimatedDuration) return false;
          if (typeof intervention.scheduledAt.toDate !== 'function') return false;
          if (assignedTo && intervention.assignedTo !== assignedTo) return false;

          const start = intervention.scheduledAt.toDate();
          const end = addMinutes(start, intervention.estimatedDuration);
          const slotEnd = addMinutes(slotDate, estimatedDuration);

          // Vérifier le chevauchement
          return (
            (isAfter(slotDate, start) && isBefore(slotDate, end)) ||
            (isAfter(slotEnd, start) && isBefore(slotEnd, end)) ||
            (isBefore(slotDate, start) && isAfter(slotEnd, end))
          );
        });

        if (hasConflict) {
          return; // Ne pas suggérer les créneaux avec conflit
        }

        // Déterminer si c'est recommandé
        let isRecommended = false;
        let reason: string | undefined;

        // Critères de recommandation
        if (load === 0) {
          isRecommended = true;
          reason = 'Journée libre';
        } else if (load < 3) {
          isRecommended = dayOffset <= 3; // Recommander les 3 prochains jours si charge faible
          reason = `Charge faible (${load} intervention${load > 1 ? 's' : ''})`;
        } else if (load < 5) {
          reason = `Charge modérée (${load} interventions)`;
        } else {
          reason = `Charge élevée (${load} interventions)`;
        }

        // Priorité urgente : recommander le plus tôt possible
        if (priority === 'urgent' || priority === 'critical') {
          if (dayOffset === 0) {
            isRecommended = true;
            reason = "Intervention urgente - Aujourd'hui";
          }
        }

        const dayLabel =
          dayOffset === 0
            ? "Aujourd'hui"
            : dayOffset === 1
              ? 'Demain'
              : format(targetDate, 'EEEE d MMMM', { locale: fr });

        slots.push({
          date: slotDate,
          label: `${dayLabel} - ${timeLabel}`,
          load,
          isRecommended,
          reason,
        });
      });
    }

    // Trier : recommandés d'abord, puis par date
    return slots.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return a.date.getTime() - b.date.getTime();
    });
  }, [dailyLoad, estimatedDuration, assignedTo, priority, interventions, excludeWeekends]);

  // Obtenir les 5 meilleures suggestions
  const topSuggestions = useMemo(() => suggestions.slice(0, 5), [suggestions]);

  // Statistiques de charge
  const stats = useMemo(() => {
    const loads = Array.from(dailyLoad.values());
    return {
      totalScheduled: interventions.filter(i => i.scheduledAt).length,
      averageLoad: loads.length > 0 ? loads.reduce((a, b) => a + b, 0) / loads.length : 0,
      maxLoad: Math.max(0, ...loads),
      minLoad: Math.min(Infinity, ...loads) === Infinity ? 0 : Math.min(...loads),
      busiestDay: Array.from(dailyLoad.entries()).sort((a, b) => b[1] - a[1])[0]?.[0],
    };
  }, [dailyLoad, interventions]);

  return {
    suggestions,
    topSuggestions,
    dailyLoad,
    stats,
  };
};
