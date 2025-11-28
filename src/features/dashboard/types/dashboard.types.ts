/**
 * Dashboard Types
 *
 * Types pour les statistiques et préférences de dashboard personnalisables
 */

import type { TimestampedDocument } from '@/shared/types/common.types';

// ============================================================================
// WIDGET TYPES
// ============================================================================

export type WidgetType =
  | 'stats_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'donut_chart'
  | 'table'
  | 'calendar'
  | 'list'
  | 'clock' // Horloge (analogique ou digitale)
  | 'quick_links' // Liens rapides cliquables
  | 'button_grid' // Grille de boutons d'action
  | 'iframe' // Iframe pour sites web
  | 'custom_list' // Liste personnalisée éditable
  | 'note' // Note/texte libre
  | 'weather'; // Météo (si intégration API)

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export type WidgetHeight = 'normal' | 'tall' | 'extra-tall';

export type WidgetDataSource =
  | 'interventions_by_status'
  | 'interventions_by_priority'
  | 'interventions_by_type'
  | 'interventions_by_room'
  | 'interventions_by_technician'
  | 'interventions_timeline'
  | 'interventions_completion_rate'
  | 'sla_compliance'
  | 'response_time_avg'
  | 'recent_interventions'
  | 'overdue_interventions'
  | 'upcoming_interventions'
  | 'rooms_status'
  | 'rooms_by_type'
  | 'rooms_by_status'
  | 'blockages_active'
  | 'completion_rate'
  | 'urgent_interventions'
  | 'avg_response_time'
  | 'status_distribution'
  | 'technician_performance'
  // Nouveaux widgets
  | 'resolution_rate' // Taux de résolution (complétées / créées)
  | 'location_stats' // Stats par localisation (étage/bâtiment)
  | 'interventions_by_floor' // Interventions par étage
  | 'interventions_by_building' // Interventions par bâtiment
  | 'pending_validation' // Interventions en attente de validation
  | 'problematic_rooms' // Chambres avec le plus d'interventions
  | 'today_scheduled' // Interventions planifiées aujourd'hui
  | 'custom' // Données personnalisées
  | 'static'; // Widget statique (horloge, liens, etc.)

// ============================================================================
// WIDGET CONFIGURATION
// ============================================================================

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  dataSource: WidgetDataSource;
  title: string;
  size: WidgetSize;
  height?: WidgetHeight; // Hauteur du widget (normal = 1 ligne, tall = 2 lignes, extra-tall = 3 lignes)
  position: { row: number; col: number };
  visible: boolean;
  showOnMobile?: boolean; // Afficher ce widget sur mobile (défaut: true pour small, false pour autres)
  refreshInterval?: number; // en secondes
  filters?: {
    dateRange?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
    customDateFrom?: Date;
    customDateTo?: Date;
    status?: string[];
    priority?: string[];
    roomType?: string[];
  };
  chartOptions?: {
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
    colors?: string[];
    stacked?: boolean;
    showValues?: boolean;
  };
  // Configurations spécifiques par type de widget
  clockOptions?: {
    format?: '12h' | '24h' | 'analog'; // Defaults to '24h'
    showSeconds?: boolean;
    showDate?: boolean;
    timezone?: string;
  };
  linksOptions?: {
    links?: Array<{
      id: string;
      label: string;
      url: string;
      icon?: string;
      color?: string;
      openInNewTab?: boolean;
    }>; // Defaults to []
    columns?: number; // Nombre de colonnes pour afficher les liens
  };
  buttonsOptions?: {
    buttons?: Array<{
      id: string;
      label: string;
      action: 'navigate' | 'external_link' | 'custom';
      target?: string; // URL ou chemin
      icon?: string;
      color?: string;
      variant?: 'default' | 'outline' | 'destructive';
    }>; // Defaults to []
    columns?: number;
  };
  iframeOptions?: {
    url?: string; // Defaults to ''
    allowFullscreen?: boolean;
    allowScripts?: boolean;
  };
  customListOptions?: {
    items?: Array<{
      id: string;
      text: string;
      checked?: boolean;
      priority?: 'low' | 'medium' | 'high';
    }>; // Defaults to []
    editable?: boolean;
    showCheckboxes?: boolean;
  };
  noteOptions?: {
    content?: string; // Defaults to ''
    backgroundColor?: string;
    textColor?: string;
    fontSize?: 'small' | 'medium' | 'large';
  };
  weatherOptions?: {
    location?: string; // Nom de la ville à afficher (ex: "Paris, France")
    latitude?: number; // Latitude (ex: 48.8566 pour Paris)
    longitude?: number; // Longitude (ex: 2.3522 pour Paris)
    showForecast?: boolean; // Afficher les prévisions sur 5 jours
    refreshInterval?: number; // Intervalle de rafraîchissement en minutes
  };
}

// ============================================================================
// DASHBOARD PREFERENCES
// ============================================================================

export interface DashboardPreferences extends TimestampedDocument {
  userId: string;
  establishmentId: string;
  widgets: WidgetConfig[];
  layout: 'grid' | 'list';
  columns: number; // 2, 3, ou 4 colonnes
  theme?: 'light' | 'dark' | 'auto';
  defaultDateRange: 'today' | 'week' | 'month' | 'quarter' | 'year';
  autoRefresh: boolean;
  refreshInterval: number; // en secondes
}

// ============================================================================
// STATS DATA
// ============================================================================

export interface InterventionStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  byRoom: Record<string, number>;
  byTechnician: Record<string, number>;
  completionRate: number;
  avgResponseTime: number; // en heures
  slaCompliance: number; // pourcentage
  overdue: number;
  upcoming: number;
}

export interface TimelineData {
  date: string;
  created: number;
  completed: number;
  inProgress: number;
  cancelled: number;
}

export interface RoomStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  available: number;
  occupied: number;
  maintenance: number;
  blocked: number;
}

export interface TechnicianPerformance {
  userId: string;
  name: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  avgCompletionTime: number; // en heures
  completionRate: number;
}

// ============================================================================
// CHART DATA
// ============================================================================

export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  [key: string]: string | number;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_WIDGET_CONFIGS: Omit<WidgetConfig, 'id'>[] = [
  // Cartes de statistiques
  {
    type: 'stats_card',
    dataSource: 'interventions_by_status',
    title: 'Interventions par statut',
    size: 'small',
    position: { row: 0, col: 0 },
    visible: true,
  },
  {
    type: 'stats_card',
    dataSource: 'interventions_completion_rate',
    title: 'Taux de complétion',
    size: 'small',
    position: { row: 0, col: 1 },
    visible: true,
  },
  {
    type: 'stats_card',
    dataSource: 'sla_compliance',
    title: 'Conformité SLA',
    size: 'small',
    position: { row: 0, col: 2 },
    visible: true,
  },
  {
    type: 'stats_card',
    dataSource: 'response_time_avg',
    title: 'Temps de réponse moyen',
    size: 'small',
    position: { row: 0, col: 3 },
    visible: true,
  },

  // Graphiques
  {
    type: 'line_chart',
    dataSource: 'interventions_timeline',
    title: 'Évolution des interventions',
    size: 'large',
    position: { row: 1, col: 0 },
    visible: true,
    filters: {
      dateRange: 'month',
    },
    chartOptions: {
      showLegend: true,
      showGrid: true,
      showTooltip: true,
      stacked: false,
    },
  },
  {
    type: 'pie_chart',
    dataSource: 'interventions_by_status',
    title: 'Répartition par statut',
    size: 'medium',
    position: { row: 1, col: 2 },
    visible: true,
    chartOptions: {
      showLegend: true,
      showTooltip: true,
    },
  },
  {
    type: 'bar_chart',
    dataSource: 'interventions_by_priority',
    title: 'Interventions par priorité',
    size: 'medium',
    position: { row: 2, col: 0 },
    visible: true,
    chartOptions: {
      showLegend: false,
      showGrid: true,
      showTooltip: true,
      showValues: true,
    },
  },
  {
    type: 'bar_chart',
    dataSource: 'interventions_by_technician',
    title: 'Interventions par technicien',
    size: 'medium',
    position: { row: 2, col: 2 },
    visible: true,
    chartOptions: {
      showLegend: false,
      showGrid: true,
      showTooltip: true,
      showValues: true,
    },
  },
  {
    type: 'list',
    dataSource: 'recent_interventions',
    title: 'Interventions récentes',
    size: 'medium',
    position: { row: 3, col: 0 },
    visible: true,
  },
  {
    type: 'list',
    dataSource: 'overdue_interventions',
    title: 'Interventions en retard',
    size: 'medium',
    position: { row: 3, col: 2 },
    visible: true,
  },
  // Nouveaux widgets
  {
    type: 'stats_card',
    dataSource: 'resolution_rate',
    title: 'Taux de résolution',
    size: 'small',
    position: { row: 4, col: 0 },
    visible: true,
  },
  {
    type: 'bar_chart',
    dataSource: 'interventions_by_floor',
    title: 'Interventions par étage',
    size: 'medium',
    position: { row: 4, col: 1 },
    visible: true,
    chartOptions: {
      showLegend: false,
      showGrid: false,
      showValues: true,
    },
  },
  {
    type: 'bar_chart',
    dataSource: 'interventions_by_building',
    title: 'Interventions par bâtiment',
    size: 'medium',
    position: { row: 4, col: 3 },
    visible: false,
    chartOptions: {
      showLegend: false,
      showGrid: false,
      showValues: true,
    },
  },
  {
    type: 'list',
    dataSource: 'pending_validation',
    title: 'En attente de validation',
    size: 'medium',
    position: { row: 5, col: 0 },
    visible: true,
  },
  {
    type: 'list',
    dataSource: 'problematic_rooms',
    title: 'Top 5 chambres problématiques',
    size: 'medium',
    position: { row: 5, col: 2 },
    visible: true,
  },
  {
    type: 'list',
    dataSource: 'today_scheduled',
    title: "Planifiées aujourd'hui",
    size: 'medium',
    position: { row: 6, col: 0 },
    visible: true,
  },
  {
    type: 'weather',
    dataSource: 'static',
    title: 'Météo locale',
    size: 'small',
    position: { row: 6, col: 2 },
    visible: false,
    weatherOptions: {
      location: 'Paris, France',
      latitude: 48.8566,
      longitude: 2.3522,
      showForecast: true,
      refreshInterval: 30,
    },
  },
  {
    type: 'note',
    dataSource: 'static',
    title: 'Notes épinglées',
    size: 'medium',
    position: { row: 6, col: 3 },
    visible: false,
    noteOptions: {
      content: '',
      fontSize: 'medium',
    },
  },
  {
    type: 'quick_links',
    dataSource: 'static',
    title: 'Raccourcis rapides',
    size: 'medium',
    position: { row: 7, col: 0 },
    visible: false,
    linksOptions: {
      links: [
        {
          id: 'link_1',
          label: 'Nouvelle intervention',
          url: '/app/interventions/create',
          icon: 'Plus',
          color: 'blue',
        },
        {
          id: 'link_2',
          label: 'Voir planning',
          url: '/app/planning',
          icon: 'Calendar',
          color: 'green',
        },
        {
          id: 'link_3',
          label: 'Gérer les chambres',
          url: '/app/rooms',
          icon: 'DoorOpen',
          color: 'purple',
        },
        {
          id: 'link_4',
          label: 'Rapports',
          url: '/app/reports',
          icon: 'BarChart',
          color: 'orange',
        },
      ],
      columns: 2,
    },
  },
];

export const DEFAULT_DASHBOARD_PREFERENCES: Omit<
  DashboardPreferences,
  'id' | 'userId' | 'establishmentId' | 'createdAt' | 'updatedAt'
> = {
  widgets: DEFAULT_WIDGET_CONFIGS.map((config, index) => ({
    ...config,
    id: `widget_${index}`,
  })),
  layout: 'grid',
  columns: 4,
  defaultDateRange: 'month',
  autoRefresh: false,
  refreshInterval: 300, // 5 minutes
};
