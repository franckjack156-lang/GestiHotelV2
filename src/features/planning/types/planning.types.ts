/**
 * Types pour le module Planning
 */

import type { Intervention } from '@/features/interventions/types/intervention.types';

/**
 * Mode d'affichage du calendrier
 */
export type ViewMode = 'day' | 'week' | 'month';

/**
 * Mode de groupement des interventions
 */
export type GroupMode = 'default' | 'technician' | 'room' | 'priority' | 'status';

/**
 * Configuration des filtres de planning
 */
export interface PlanningFilters {
  searchKeyword: string;
  statuses: string[];
  priorities: string[];
  technicianIds: string[];
  roomNumbers: string[];
  types: string[];
  showRecurringOnly: boolean;
}

/**
 * État du planning
 */
export interface PlanningState {
  viewMode: ViewMode;
  groupMode: GroupMode;
  currentDate: Date;
  filters: PlanningFilters;
  selectedInterventionId: string | null;
  isFilterPanelOpen: boolean;
}

/**
 * Créneau horaire droppable
 */
export interface TimeSlot {
  date: Date;
  hour: number;
  interventions: Intervention[];
}

/**
 * Jour du calendrier
 */
export interface CalendarDay {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  interventions: Intervention[];
  interventionCount: number;
}

/**
 * Période affichée
 */
export interface CalendarPeriod {
  start: Date;
  end: Date;
  days: Date[];
  title: string;
}

/**
 * Statistiques du planning
 */
export interface PlanningStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byTechnician: Record<string, number>;
  overdue: number;
  upcoming: number;
  recurringCount: number;
}

/**
 * Configuration du drag & drop
 */
export interface DragDropConfig {
  enableDrag: boolean;
  enableDrop: boolean;
  snapToHour: boolean;
  allowCrossDay: boolean;
}

/**
 * Événement de drop
 */
export interface DropEvent {
  interventionId: string;
  sourceDate: Date;
  targetDate: Date;
  targetHour?: number;
}

/**
 * Options d'export du planning
 */
export interface PlanningExportOptions {
  format: 'pdf' | 'excel' | 'ics';
  period: CalendarPeriod;
  includeCompleted: boolean;
  groupByTechnician: boolean;
}

/**
 * Couleurs par charge de travail
 */
export const LOAD_COLORS = {
  empty: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  light: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  busy: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  overloaded: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
} as const;

/**
 * Heures de travail par défaut
 */
export const DEFAULT_WORKING_HOURS = {
  start: 6,
  end: 22,
} as const;

/**
 * Labels pour les modes de vue
 */
export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  day: 'Jour',
  week: 'Semaine',
  month: 'Mois',
};

/**
 * Labels pour les modes de groupement
 */
export const GROUP_MODE_LABELS: Record<GroupMode, string> = {
  default: 'Par défaut',
  technician: 'Par technicien',
  room: 'Par chambre',
  priority: 'Par priorité',
  status: 'Par statut',
};
