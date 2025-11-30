/**
 * ============================================================================
 * SLA SERVICE
 * ============================================================================
 *
 * Service pour calculer et gérer les SLA et deadlines des interventions
 */

import type { Timestamp } from 'firebase/firestore';
import type { Intervention, SLAInfo, SLAStatus } from '../types/intervention.types';
import type { InterventionPriority } from '@/shared/types/status.types';

/**
 * Objectifs SLA par priorité (en minutes)
 */
export const SLA_TARGETS: Record<InterventionPriority, number> = {
  low: 24 * 60, // 24 heures
  normal: 8 * 60, // 8 heures
  high: 4 * 60, // 4 heures
  urgent: 2 * 60, // 2 heures
  critical: 1 * 60, // 1 heure
};

/**
 * Seuils pour déterminer le statut SLA
 */
const SLA_AT_RISK_THRESHOLD = 0.75; // 75% du temps écoulé = à risque

/**
 * Convertit un Timestamp Firebase en Date
 */
const timestampToDate = (timestamp: Timestamp | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  return timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
};

/**
 * Calcule le temps écoulé en minutes entre deux dates
 */
const getElapsedMinutes = (start: Date, end: Date = new Date()): number => {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
};

/**
 * Calcule la date limite SLA
 */
export const calculateDueDate = (
  createdAt: Date,
  priority: InterventionPriority,
  customDueDate?: Date
): Date => {
  if (customDueDate) {
    return customDueDate;
  }

  const targetMinutes = SLA_TARGETS[priority];
  const dueDate = new Date(createdAt);
  dueDate.setMinutes(dueDate.getMinutes() + targetMinutes);
  return dueDate;
};

/**
 * Détermine le statut SLA en fonction du pourcentage de temps écoulé
 */
export const calculateSLAStatus = (percentageUsed: number, isCompleted: boolean): SLAStatus => {
  if (isCompleted) {
    return percentageUsed > 100 ? 'breached' : 'on_track';
  }

  if (percentageUsed >= 100) {
    return 'breached';
  }

  if (percentageUsed >= SLA_AT_RISK_THRESHOLD * 100) {
    return 'at_risk';
  }

  return 'on_track';
};

/**
 * Calcule les informations SLA complètes pour une intervention
 */
export const calculateSLA = (intervention: Intervention): SLAInfo => {
  const createdAt = timestampToDate(intervention.createdAt);
  if (!createdAt) {
    throw new Error('createdAt is required to calculate SLA');
  }

  // Déterminer la date limite
  const customDueDate = intervention.dueDate ? timestampToDate(intervention.dueDate) : undefined;
  const dueDate = calculateDueDate(createdAt, intervention.priority, customDueDate);

  // Calculer l'objectif SLA (peut être personnalisé)
  const targetMinutes = intervention.slaTarget || SLA_TARGETS[intervention.priority];

  // Calculer le temps écoulé
  const now = new Date();
  const completedAt = timestampToDate(intervention.completedAt);
  const endDate = completedAt || now;
  const elapsedMinutes = getElapsedMinutes(createdAt, endDate);

  // Calculer le temps restant
  const remainingMinutes = Math.max(0, targetMinutes - elapsedMinutes);

  // Calculer le pourcentage utilisé
  const percentageUsed = Math.min(100, (elapsedMinutes / targetMinutes) * 100);

  // Déterminer si le SLA est dépassé
  const isBreached = elapsedMinutes > targetMinutes;
  const status = calculateSLAStatus(percentageUsed, !!completedAt);

  // Calculer le temps de réponse (temps jusqu'à la première action)
  let responseTime: number | undefined;
  const firstResponseAt = timestampToDate(intervention.firstResponseAt);
  if (firstResponseAt) {
    responseTime = getElapsedMinutes(createdAt, firstResponseAt);
  }

  // Calculer le temps de résolution
  let resolutionTime: number | undefined;
  if (completedAt) {
    resolutionTime = getElapsedMinutes(createdAt, completedAt);
  }

  // Date de dépassement du SLA
  let breachedAt: Date | undefined;
  if (isBreached && !completedAt) {
    breachedAt = dueDate;
  } else if (isBreached && completedAt && completedAt > dueDate) {
    breachedAt = dueDate;
  }

  return {
    status,
    targetMinutes,
    elapsedMinutes,
    remainingMinutes,
    percentageUsed: Math.round(percentageUsed),
    dueDate,
    isBreached,
    breachedAt,
    responseTime,
    resolutionTime,
  };
};

/**
 * Met à jour les champs SLA d'une intervention
 */
export const updateInterventionSLA = (intervention: Intervention): Partial<Intervention> => {
  const slaInfo = calculateSLA(intervention);

  return {
    slaStatus: slaInfo.status,
    slaTarget: slaInfo.targetMinutes,
    dueDate: intervention.dueDate, // On garde la date limite personnalisée si elle existe
    responseTime: slaInfo.responseTime,
    resolutionTime: slaInfo.resolutionTime,
  };
};

/**
 * Calcule le temps de première réponse
 */
export const calculateFirstResponseTime = (
  createdAt: Timestamp,
  assignedAt?: Timestamp,
  firstCommentAt?: Timestamp
): number | undefined => {
  const created = timestampToDate(createdAt);
  if (!created) return undefined;

  // La première réponse est soit l'assignation, soit le premier commentaire
  const assigned = timestampToDate(assignedAt);
  const commented = timestampToDate(firstCommentAt);

  let firstResponse: Date | undefined;
  if (assigned && commented) {
    firstResponse = assigned < commented ? assigned : commented;
  } else if (assigned) {
    firstResponse = assigned;
  } else if (commented) {
    firstResponse = commented;
  }

  if (!firstResponse) return undefined;

  return getElapsedMinutes(created, firstResponse);
};

/**
 * Vérifie si une intervention est proche de dépasser son SLA
 */
export const isApproachingSLA = (intervention: Intervention): boolean => {
  const slaInfo = calculateSLA(intervention);
  return slaInfo.status === 'at_risk';
};

/**
 * Vérifie si une intervention a dépassé son SLA
 */
export const hasBreachedSLA = (intervention: Intervention): boolean => {
  const slaInfo = calculateSLA(intervention);
  return slaInfo.isBreached;
};

/**
 * Obtient la liste des interventions qui approchent du dépassement SLA
 */
export const getInterventionsAtRisk = (interventions: Intervention[]): Intervention[] => {
  return interventions.filter(
    intervention =>
      intervention.status !== 'completed' &&
      intervention.status !== 'cancelled' &&
      isApproachingSLA(intervention)
  );
};

/**
 * Obtient la liste des interventions qui ont dépassé leur SLA
 */
export const getBreachedInterventions = (interventions: Intervention[]): Intervention[] => {
  return interventions.filter(
    intervention =>
      intervention.status !== 'completed' &&
      intervention.status !== 'cancelled' &&
      hasBreachedSLA(intervention)
  );
};

/**
 * Formate le temps restant en format lisible
 */
export const formatRemainingTime = (minutes: number): string => {
  if (minutes <= 0) return 'Dépassé';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}min`;
  }

  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days === 1) {
    return remainingHours > 0 ? `1j ${remainingHours}h` : '1j';
  }

  return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
};

/**
 * Obtient la couleur du badge SLA selon le statut
 */
export const getSLABadgeColor = (status: SLAStatus): string => {
  switch (status) {
    case 'on_track':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'at_risk':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'breached':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
};

/**
 * Obtient le label du statut SLA
 */
export const getSLAStatusLabel = (status: SLAStatus): string => {
  switch (status) {
    case 'on_track':
      return 'Dans les temps';
    case 'at_risk':
      return 'À risque';
    case 'breached':
      return 'Dépassé';
  }
};
