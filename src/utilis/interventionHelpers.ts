/**
 * Intervention Helpers
 *
 * Fonctions utilitaires pour les interventions
 */

import { differenceInMinutes, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Timestamp } from 'firebase/firestore';
import type {
  Intervention,
  InterventionFilters,
} from '@/features/interventions/types/intervention.types';
import {
  InterventionStatus,
  InterventionPriority,
  ALLOWED_STATUS_TRANSITIONS,
  ACTIVE_STATUSES,
  COMPLETED_STATUSES,
  FINAL_STATUSES,
} from '@/shared/types/status.types';

/**
 * Vérifier si une transition de statut est autorisée
 */
export const canTransitionTo = (
  currentStatus: InterventionStatus,
  newStatus: InterventionStatus
): boolean => {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};

/**
 * Vérifier si un statut est actif
 */
export const isActiveStatus = (status: InterventionStatus): boolean => {
  return ACTIVE_STATUSES.includes(status);
};

/**
 * Vérifier si un statut est terminé
 */
export const isCompletedStatus = (status: InterventionStatus): boolean => {
  return COMPLETED_STATUSES.includes(status);
};

/**
 * Vérifier si un statut est final
 */
export const isFinalStatus = (status: InterventionStatus): boolean => {
  return FINAL_STATUSES.includes(status);
};

/**
 * Calculer la durée réelle d'une intervention
 */
export const calculateActualDuration = (
  startedAt?: Timestamp,
  completedAt?: Timestamp
): number | undefined => {
  if (!startedAt || !completedAt) return undefined;

  return differenceInMinutes(completedAt.toDate(), startedAt.toDate());
};

/**
 * Formater une durée en minutes en texte lisible
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Formater une date Timestamp
 */
export const formatInterventionDate = (
  timestamp: Timestamp,
  formatStr: string = 'dd MMMM yyyy à HH:mm'
): string => {
  return format(timestamp.toDate(), formatStr, { locale: fr });
};

/**
 * Obtenir le délai depuis la création
 */
export const getTimeSinceCreation = (createdAt: Timestamp): string => {
  const now = new Date();
  const created = createdAt.toDate();
  const diffMinutes = differenceInMinutes(now, created);

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `Il y a ${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''}`;

  const diffMonths = Math.floor(diffDays / 30);
  return `Il y a ${diffMonths} mois`;
};

/**
 * Vérifier si une intervention est en retard
 */
export const isOverdue = (intervention: Intervention): boolean => {
  if (!intervention.scheduledAt) return false;
  if (isCompletedStatus(intervention.status)) return false;

  const now = new Date();
  const scheduled = intervention.scheduledAt.toDate();

  return now > scheduled;
};

/**
 * Obtenir la couleur de priorité pour les graphiques
 */
export const getPriorityColor = (priority: InterventionPriority): string => {
  const colors = {
    low: '#9CA3AF',
    normal: '#3B82F6',
    high: '#F97316',
    urgent: '#EF4444',
    critical: '#A855F7',
  };

  return colors[priority];
};

/**
 * Obtenir la couleur de statut pour les graphiques
 */
export const getStatusColor = (status: InterventionStatus): string => {
  const colors = {
    draft: '#9CA3AF',
    pending: '#EAB308',
    assigned: '#3B82F6',
    in_progress: '#6366F1',
    on_hold: '#F97316',
    completed: '#10B981',
    validated: '#059669',
    cancelled: '#EF4444',
  };

  return colors[status];
};

/**
 * Filtrer les interventions localement (pour pagination côté client)
 */
export const filterInterventionsLocally = (
  interventions: Intervention[],
  filters: InterventionFilters
): Intervention[] => {
  return interventions.filter(intervention => {
    // Recherche textuelle
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesTitle = intervention.title.toLowerCase().includes(search);
      const matchesDescription = intervention.description.toLowerCase().includes(search);
      const matchesRoom = intervention.roomNumber?.toLowerCase().includes(search);

      if (!matchesTitle && !matchesDescription && !matchesRoom) {
        return false;
      }
    }

    // Autres filtres (status, priority, etc.) sont gérés par Firestore
    return true;
  });
};

/**
 * Trier les interventions
 */
export const sortInterventions = (
  interventions: Intervention[],
  field: string,
  order: 'asc' | 'desc'
): Intervention[] => {
  const sorted = [...interventions].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (field) {
      case 'createdAt':
      case 'updatedAt':
      case 'scheduledAt':
        aValue = a[field]?.toDate().getTime() || 0;
        bValue = b[field]?.toDate().getTime() || 0;
        break;
      case 'priority': {
        const priorityValues = {
          low: 1,
          normal: 2,
          high: 3,
          urgent: 4,
          critical: 5,
        };
        aValue = priorityValues[a.priority];
        bValue = priorityValues[b.priority];
        break;
      }
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      default: {
        const defaultValue = a[field as keyof Intervention];
        aValue =
          typeof defaultValue === 'string' || typeof defaultValue === 'number' ? defaultValue : '';
        const defaultValueB = b[field as keyof Intervention];
        bValue =
          typeof defaultValueB === 'string' || typeof defaultValueB === 'number'
            ? defaultValueB
            : '';
      }
    }

    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

/**
 * Générer un nom de fichier pour l'export
 */
export const generateExportFileName = (
  prefix: string = 'interventions',
  extension: string = 'csv'
): string => {
  const now = new Date();
  const dateStr = format(now, 'yyyy-MM-dd_HH-mm');
  return `${prefix}_${dateStr}.${extension}`;
};

/**
 * Valider les données d'intervention avant création
 */
export const validateInterventionData = (
  data: Record<string, unknown>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
    errors.push('Le titre doit contenir au moins 3 caractères');
  }

  if (
    !data.description ||
    typeof data.description !== 'string' ||
    data.description.trim().length < 10
  ) {
    errors.push('La description doit contenir au moins 10 caractères');
  }

  if (!data.type) {
    errors.push("Le type d'intervention est requis");
  }

  if (!data.category) {
    errors.push('La catégorie est requise');
  }

  if (!data.priority) {
    errors.push('La priorité est requise');
  }

  if (!data.location || typeof data.location !== 'string' || data.location.trim().length < 3) {
    errors.push('La localisation doit contenir au moins 3 caractères');
  }

  if (data.photos && Array.isArray(data.photos) && data.photos.length > 5) {
    errors.push('Vous ne pouvez pas uploader plus de 5 photos');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Obtenir un résumé d'intervention pour notifications
 */
export const getInterventionSummary = (intervention: Intervention): string => {
  const parts = [intervention.title];

  if (intervention.roomNumber) {
    parts.push(`Ch. ${intervention.roomNumber}`);
  }

  if (intervention.isUrgent) {
    parts.push('URGENT');
  }

  return parts.join(' - ');
};
