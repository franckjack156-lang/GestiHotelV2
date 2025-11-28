/**
 * Hook pour la navigation dans le calendrier du planning
 */

import { useState, useMemo, useCallback } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  subDays,
  format,
  isSameDay,
  isToday,
  isSameMonth,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ViewMode, CalendarPeriod, CalendarDay } from '../types/planning.types';
import type { Intervention } from '@/features/interventions/types/intervention.types';

interface UsePlanningNavigationOptions {
  initialDate?: Date;
  initialViewMode?: ViewMode;
}

export const usePlanningNavigation = (options: UsePlanningNavigationOptions = {}) => {
  const { initialDate = new Date(), initialViewMode = 'week' } = options;

  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

  /**
   * Navigation vers la période précédente
   */
  const goToPrevious = useCallback(() => {
    setCurrentDate(current => {
      switch (viewMode) {
        case 'day':
          return subDays(current, 1);
        case 'week':
          return subWeeks(current, 1);
        case 'month':
          return subMonths(current, 1);
        default:
          return current;
      }
    });
  }, [viewMode]);

  /**
   * Navigation vers la période suivante
   */
  const goToNext = useCallback(() => {
    setCurrentDate(current => {
      switch (viewMode) {
        case 'day':
          return addDays(current, 1);
        case 'week':
          return addWeeks(current, 1);
        case 'month':
          return addMonths(current, 1);
        default:
          return current;
      }
    });
  }, [viewMode]);

  /**
   * Aller à aujourd'hui
   */
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  /**
   * Aller à une date spécifique
   */
  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  /**
   * Période courante calculée
   */
  const period: CalendarPeriod = useMemo(() => {
    let start: Date;
    let end: Date;
    let title: string;

    switch (viewMode) {
      case 'day':
        start = currentDate;
        end = currentDate;
        title = format(currentDate, 'EEEE d MMMM yyyy', { locale: fr });
        break;
      case 'week':
        start = startOfWeek(currentDate, { locale: fr });
        end = endOfWeek(currentDate, { locale: fr });
        title = `${format(start, 'd MMM', { locale: fr })} - ${format(end, 'd MMM yyyy', { locale: fr })}`;
        break;
      case 'month':
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        title = format(currentDate, 'MMMM yyyy', { locale: fr });
        break;
      default:
        start = currentDate;
        end = currentDate;
        title = '';
    }

    const days = eachDayOfInterval({ start, end });

    return { start, end, days, title };
  }, [currentDate, viewMode]);

  /**
   * Génère les jours du calendrier avec métadonnées
   */
  const getCalendarDays = useCallback(
    (interventions: Intervention[]): CalendarDay[] => {
      return period.days.map(date => {
        const dayInterventions = interventions.filter(intervention => {
          if (!intervention.scheduledAt || typeof intervention.scheduledAt.toDate !== 'function') {
            return false;
          }
          return isSameDay(intervention.scheduledAt.toDate(), date);
        });

        return {
          date,
          isToday: isToday(date),
          isCurrentMonth: isSameMonth(date, currentDate),
          interventions: dayInterventions,
          interventionCount: dayInterventions.length,
        };
      });
    },
    [period.days, currentDate]
  );

  /**
   * Vérifie si une date est dans la période courante
   */
  const isInCurrentPeriod = useCallback(
    (date: Date): boolean => {
      return date >= period.start && date <= period.end;
    },
    [period]
  );

  return {
    // État
    currentDate,
    viewMode,
    period,

    // Setters
    setCurrentDate,
    setViewMode,

    // Navigation
    goToPrevious,
    goToNext,
    goToToday,
    goToDate,

    // Helpers
    getCalendarDays,
    isInCurrentPeriod,
  };
};
