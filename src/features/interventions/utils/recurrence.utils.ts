/**
 * ============================================================================
 * RECURRENCE UTILITIES
 * ============================================================================
 *
 * Utilitaires pour gérer les interventions récurrentes
 */

import { addDays, addWeeks, addMonths, addYears, isAfter, setDay } from 'date-fns';
import type { RecurrenceConfig } from '../types/intervention.types';

/**
 * Génère les dates des occurrences récurrentes
 */
export const generateRecurrenceDates = (startDate: Date, config: RecurrenceConfig): Date[] => {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  let occurrenceCount = 0;

  // Limite de sécurité pour éviter les boucles infinies
  const MAX_OCCURRENCES = 365;

  while (occurrenceCount < MAX_OCCURRENCES) {
    // Ajouter la date actuelle si elle respecte les contraintes
    if (shouldIncludeDate(currentDate, config, occurrenceCount)) {
      dates.push(new Date(currentDate));
      occurrenceCount++;
    }

    // Vérifier les conditions d'arrêt
    if (config.count && occurrenceCount >= config.count) {
      break;
    }

    if (config.endDate && isAfter(currentDate, config.endDate)) {
      break;
    }

    // Calculer la prochaine date selon la fréquence
    currentDate = getNextOccurrence(currentDate, config);

    // Vérifier que la prochaine date est bien après la date de début
    if (!isAfter(currentDate, startDate)) {
      break;
    }
  }

  return dates;
};

/**
 * Détermine si une date doit être incluse selon la configuration
 */
const shouldIncludeDate = (
  date: Date,
  config: RecurrenceConfig,
  occurrenceIndex: number
): boolean => {
  // Pour la récurrence hebdomadaire, vérifier les jours de la semaine
  if (config.frequency === 'weekly' && config.daysOfWeek && config.daysOfWeek.length > 0) {
    const dayOfWeek = date.getDay();
    return config.daysOfWeek.includes(dayOfWeek);
  }

  // Pour la récurrence mensuelle, vérifier le jour du mois
  if (config.frequency === 'monthly' && config.dayOfMonth) {
    return date.getDate() === config.dayOfMonth;
  }

  // Pour la récurrence annuelle, vérifier le mois et le jour
  if (config.frequency === 'yearly' && config.monthOfYear) {
    return date.getMonth() + 1 === config.monthOfYear;
  }

  // Pour les autres cas, inclure toutes les occurrences
  return occurrenceIndex === 0 || true;
};

/**
 * Calcule la prochaine occurrence selon la fréquence
 */
const getNextOccurrence = (currentDate: Date, config: RecurrenceConfig): Date => {
  const { frequency, interval } = config;

  switch (frequency) {
    case 'daily':
      return addDays(currentDate, interval);

    case 'weekly':
      // Si des jours spécifiques sont définis, passer au prochain jour de la semaine
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        return getNextWeekdayOccurrence(currentDate, config.daysOfWeek, interval);
      }
      return addWeeks(currentDate, interval);

    case 'monthly':
      return addMonths(currentDate, interval);

    case 'yearly':
      return addYears(currentDate, interval);

    default:
      return currentDate;
  }
};

/**
 * Trouve la prochaine occurrence pour une récurrence hebdomadaire avec jours spécifiques
 */
const getNextWeekdayOccurrence = (
  currentDate: Date,
  daysOfWeek: number[],
  interval: number
): Date => {
  const currentDay = currentDate.getDay();
  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

  // Trouver le prochain jour dans la même semaine
  const nextDayInWeek = sortedDays.find(day => day > currentDay);

  if (nextDayInWeek !== undefined) {
    // Il y a un jour dans la même semaine
    return setDay(currentDate, nextDayInWeek);
  } else {
    // Passer à la semaine suivante (selon l'intervalle) et prendre le premier jour
    const nextWeek = addWeeks(currentDate, interval);
    return setDay(nextWeek, sortedDays[0]);
  }
};

/**
 * Génère un ID de groupe unique pour une série d'interventions récurrentes
 */
export const generateRecurrenceGroupId = (): string => {
  return `recurrence-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Valide une configuration de récurrence
 */
export const validateRecurrenceConfig = (config: RecurrenceConfig): string[] => {
  const errors: string[] = [];

  if (!config.frequency) {
    errors.push('La fréquence est requise');
  }

  if (!config.interval || config.interval < 1) {
    errors.push("L'intervalle doit être supérieur à 0");
  }

  if (config.count && config.count < 1) {
    errors.push("Le nombre d'occurrences doit être supérieur à 0");
  }

  if (config.count && config.count > 365) {
    errors.push("Le nombre d'occurrences ne peut pas dépasser 365");
  }

  if (config.frequency === 'weekly' && config.daysOfWeek) {
    if (config.daysOfWeek.length === 0) {
      errors.push('Au moins un jour de la semaine doit être sélectionné');
    }
    if (config.daysOfWeek.some(day => day < 0 || day > 6)) {
      errors.push('Les jours de la semaine doivent être entre 0 et 6');
    }
  }

  if (config.frequency === 'monthly' && config.dayOfMonth) {
    if (config.dayOfMonth < 1 || config.dayOfMonth > 31) {
      errors.push('Le jour du mois doit être entre 1 et 31');
    }
  }

  if (config.frequency === 'yearly' && config.monthOfYear) {
    if (config.monthOfYear < 1 || config.monthOfYear > 12) {
      errors.push("Le mois de l'année doit être entre 1 et 12");
    }
  }

  if (config.endDate && config.count) {
    errors.push(
      "Vous devez choisir soit une date de fin, soit un nombre d'occurrences, pas les deux"
    );
  }

  return errors;
};

/**
 * Formate une description lisible de la récurrence
 */
export const formatRecurrenceDescription = (config: RecurrenceConfig): string => {
  const { frequency, interval } = config;

  let description = '';

  // Fréquence
  switch (frequency) {
    case 'daily':
      description = interval === 1 ? 'Tous les jours' : `Tous les ${interval} jours`;
      break;
    case 'weekly':
      description = interval === 1 ? 'Toutes les semaines' : `Toutes les ${interval} semaines`;
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const days = config.daysOfWeek.map(d => dayNames[d]).join(', ');
        description += ` (${days})`;
      }
      break;
    case 'monthly':
      description = interval === 1 ? 'Tous les mois' : `Tous les ${interval} mois`;
      if (config.dayOfMonth) {
        description += ` le ${config.dayOfMonth}`;
      }
      break;
    case 'yearly':
      description = interval === 1 ? 'Tous les ans' : `Tous les ${interval} ans`;
      break;
  }

  // Fin
  if (config.count) {
    description += ` (${config.count} occurrences)`;
  } else if (config.endDate) {
    const endDateStr = config.endDate.toLocaleDateString('fr-FR');
    description += ` jusqu'au ${endDateStr}`;
  }

  return description;
};
