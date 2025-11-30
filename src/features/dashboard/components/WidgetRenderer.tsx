/**
 * WidgetRenderer Component
 *
 * Rendu dynamique des widgets du dashboard selon leur configuration
 * Affiche les vraies données ou des placeholders si pas de données
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card';
import { StatsCard } from '@/features/dashboard/components/charts/StatsCard';
import { LineChart } from '@/features/dashboard/components/charts/LineChart';
import { BarChart } from '@/features/dashboard/components/charts/BarChart';
import { PieChart } from '@/features/dashboard/components/charts/PieChart';
import { StatCard } from '@/shared/components/ui-extended';
import { ClockWidget } from './widgets/ClockWidget';
import { QuickLinksWidget } from './widgets/QuickLinksWidget';
import { ButtonGridWidget } from './widgets/ButtonGridWidget';
import { NoteWidget } from './widgets/NoteWidget';
import { CustomListWidget } from './widgets/CustomListWidget';
import { IframeWidget } from './widgets/IframeWidget';
import { WeatherWidget } from './widgets/WeatherWidget';
import type {
  WidgetConfig,
  InterventionStats,
  TimelineData,
  RoomStats,
  TechnicianPerformance,
} from '../types/dashboard.types';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Building2,
  CalendarClock,
  History,
  TrendingUp,
  Layers,
  DoorOpen,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WidgetRendererProps {
  widget: WidgetConfig;
  interventionStats?: InterventionStats | null;
  timelineData?: TimelineData[];
  roomStats?: RoomStats | null;
  technicianPerformance?: TechnicianPerformance[];
  recentInterventions?: Intervention[];
  overdueInterventions?: Intervention[];
  pendingValidationInterventions?: Intervention[];
  resolutionRate?: { created: number; completed: number; rate: number } | null;
  locationStats?: { byFloor: Record<string, number>; byBuilding: Record<string, number> } | null;
  problematicRooms?: { roomNumber: string; count: number; lastIntervention: Date | null }[];
  todayScheduled?: Intervention[];
  calculatedStats?: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    urgent: number;
    completionRate: number;
    avgDuration: string;
  };
  chartData?: {
    evolutionData: Record<string, unknown>[];
    statusData: Record<string, unknown>[];
    priorityData: Record<string, unknown>[];
  };
  onNavigate?: (path: string) => void;
}

// Widget pour afficher "Aucune donnée"
const EmptyDataCard = ({
  title,
  icon: Icon,
  message,
}: {
  title: string;
  icon: LucideIcon;
  message: string;
}) => (
  <Card className="h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2">
        <Icon size={16} className="text-gray-400" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="flex items-center justify-center py-6">
      <p className="text-sm text-gray-500 text-center">{message}</p>
    </CardContent>
  </Card>
);

// Helper pour formater la date relative
const formatRelativeDate = (date: Date | { toDate: () => Date } | string | undefined): string => {
  if (!date) return '';
  try {
    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'object' && 'toDate' in date) {
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
    }
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: fr });
  } catch {
    return '';
  }
};

// Helper pour obtenir la couleur de priorité
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  }
};

// Helper pour obtenir le label de priorité
const getPriorityLabel = (priority: string): string => {
  switch (priority) {
    case 'urgent':
      return 'Urgent';
    case 'high':
      return 'Haute';
    case 'medium':
      return 'Moyenne';
    default:
      return 'Basse';
  }
};

// Helper pour obtenir la couleur du statut
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'text-green-600 dark:text-green-400';
    case 'in_progress':
      return 'text-blue-600 dark:text-blue-400';
    case 'pending':
      return 'text-yellow-600 dark:text-yellow-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

export const WidgetRenderer = ({
  widget,
  interventionStats,
  timelineData: _timelineData,
  roomStats,
  technicianPerformance,
  recentInterventions,
  overdueInterventions,
  pendingValidationInterventions,
  resolutionRate,
  locationStats,
  problematicRooms,
  todayScheduled,
  calculatedStats,
  chartData,
  onNavigate,
}: WidgetRendererProps) => {
  // Si le widget n'est pas visible, ne rien rendre
  if (!widget.visible) return null;

  // Rendu selon le type et la source de données
  const renderWidget = () => {
    switch (widget.dataSource) {
      // ==================== STATS CARDS ====================
      case 'interventions_by_status':
        if (widget.type === 'stats_card') {
          // Toujours afficher, avec 0 si pas de données
          const total = calculatedStats?.total ?? interventionStats?.total ?? 0;
          const pending = calculatedStats?.pending ?? interventionStats?.byStatus?.pending ?? 0;
          return (
            <StatCard
              title="Total Interventions"
              value={total}
              description={`${pending} en attente`}
              icon={<ClipboardList size={20} />}
              color="blue"
              onClick={() => onNavigate?.('/app/interventions')}
            />
          );
        }
        // Pie chart pour les statuts
        if (widget.type === 'pie_chart') {
          if (!chartData?.statusData || chartData.statusData.length === 0) {
            return (
              <EmptyDataCard
                title={widget.title}
                icon={ClipboardList}
                message="Aucune donnée de statut"
              />
            );
          }
          return (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{widget.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart
                  title=""
                  data={chartData.statusData}
                  dataKey="value"
                  nameKey="name"
                  height={200}
                />
              </CardContent>
            </Card>
          );
        }
        break;

      case 'completion_rate':
      case 'interventions_completion_rate':
        if (widget.type === 'stats_card') {
          const rate = calculatedStats?.completionRate ?? interventionStats?.completionRate ?? 0;
          const completed = calculatedStats?.completed ?? 0;
          return (
            <StatCard
              title="Taux de complétion"
              value={`${Math.round(rate)}%`}
              description={`${completed} terminées`}
              icon={<CheckCircle2 size={20} />}
              color="green"
            />
          );
        }
        break;

      case 'urgent_interventions':
        if (widget.type === 'stats_card') {
          const urgent = calculatedStats?.urgent ?? interventionStats?.byPriority?.urgent ?? 0;
          return (
            <StatCard
              title="Interventions urgentes"
              value={urgent}
              description="Nécessitent attention"
              icon={<AlertCircle size={20} />}
              color="red"
              onClick={() => onNavigate?.('/app/interventions?filter=urgent')}
            />
          );
        }
        break;

      case 'avg_response_time':
      case 'response_time_avg':
        if (widget.type === 'stats_card') {
          const avgTime =
            calculatedStats?.avgDuration ?? interventionStats?.avgResponseTime?.toFixed(1) ?? '0';
          return (
            <StatCard
              title="Temps moyen"
              value={`${avgTime}h`}
              description="Temps de résolution"
              icon={<Clock size={20} />}
              color="purple"
            />
          );
        }
        break;

      // ==================== CHARTS ====================
      case 'interventions_timeline':
        if (widget.type === 'line_chart') {
          if (!chartData?.evolutionData || chartData.evolutionData.length === 0) {
            return (
              <EmptyDataCard
                title={widget.title}
                icon={ClipboardList}
                message="Aucune donnée d'évolution pour cette période"
              />
            );
          }
          return (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{widget.title}</CardTitle>
                <CardDescription className="text-xs">
                  Nombre d'interventions par jour
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart
                  title=""
                  data={chartData.evolutionData}
                  lines={[
                    { dataKey: 'total', name: 'Total', color: '#3b82f6' },
                    { dataKey: 'completed', name: 'Terminées', color: '#10b981' },
                    { dataKey: 'pending', name: 'En attente', color: '#fbbf24' },
                  ]}
                  xAxisKey="date"
                  showGrid={true}
                  height={220}
                />
              </CardContent>
            </Card>
          );
        }
        break;

      case 'status_distribution':
        if (widget.type === 'pie_chart') {
          if (!chartData?.statusData || chartData.statusData.length === 0) {
            return (
              <EmptyDataCard title={widget.title} icon={ClipboardList} message="Aucune donnée" />
            );
          }
          return (
            <Card className="h-full overflow-hidden flex flex-col">
              <CardHeader className="pb-1 flex-shrink-0">
                <CardTitle className="text-sm">{widget.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-2 pt-0">
                <PieChart
                  title=""
                  data={chartData.statusData}
                  dataKey="value"
                  nameKey="name"
                  height={150}
                  showLegend={false}
                />
              </CardContent>
            </Card>
          );
        }
        break;

      case 'interventions_by_priority':
        if (widget.type === 'bar_chart') {
          if (!chartData?.priorityData || chartData.priorityData.length === 0) {
            return (
              <EmptyDataCard
                title={widget.title}
                icon={AlertCircle}
                message="Aucune donnée de priorité"
              />
            );
          }
          return (
            <Card className="h-full overflow-hidden flex flex-col">
              <CardHeader className="pb-1 flex-shrink-0">
                <CardTitle className="text-sm">{widget.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-2 pt-0">
                <BarChart
                  title=""
                  data={chartData.priorityData}
                  bars={[{ dataKey: 'value', name: 'Interventions', color: '#8b5cf6' }]}
                  xAxisKey="name"
                  showGrid={false}
                  showValues={true}
                  showLegend={false}
                  height={150}
                />
              </CardContent>
            </Card>
          );
        }
        break;

      case 'technician_performance':
      case 'interventions_by_technician':
        if (widget.type === 'bar_chart') {
          // Utiliser technicianPerformance si disponible
          if (technicianPerformance && technicianPerformance.length > 0) {
            return (
              <Card className="h-full overflow-hidden flex flex-col">
                <CardHeader className="pb-1 flex-shrink-0">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users size={16} />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-2 pt-0">
                  <BarChart
                    title=""
                    data={technicianPerformance.slice(0, 5).map(tech => ({
                      name: tech.name.length > 10 ? tech.name.substring(0, 10) + '…' : tech.name,
                      value: tech.totalAssigned,
                      completed: tech.completed,
                    }))}
                    bars={[
                      { dataKey: 'value', name: 'Assignées', color: '#3b82f6' },
                      { dataKey: 'completed', name: 'Terminées', color: '#10b981' },
                    ]}
                    showGrid={false}
                    showValues={false}
                    showLegend={false}
                    height={150}
                  />
                </CardContent>
              </Card>
            );
          }

          // Fallback sur interventionStats.byTechnician
          if (
            interventionStats?.byTechnician &&
            Object.keys(interventionStats.byTechnician).length > 0
          ) {
            return (
              <Card className="h-full overflow-hidden flex flex-col">
                <CardHeader className="pb-1 flex-shrink-0">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users size={16} />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-2 pt-0">
                  <BarChart
                    title=""
                    data={Object.entries(interventionStats.byTechnician)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([name, value]) => ({
                        name: name.length > 10 ? name.substring(0, 10) + '…' : name,
                        value,
                      }))}
                    bars={[{ dataKey: 'value', name: 'Interventions', color: '#3b82f6' }]}
                    showGrid={false}
                    showValues={false}
                    showLegend={false}
                    height={150}
                  />
                </CardContent>
              </Card>
            );
          }

          return (
            <EmptyDataCard title={widget.title} icon={Users} message="Aucun technicien assigné" />
          );
        }
        break;

      case 'rooms_by_status':
        if (widget.type === 'bar_chart') {
          if (roomStats && Object.keys(roomStats.byStatus).length > 0) {
            const statusLabels: Record<string, string> = {
              available: 'Disponible',
              occupied: 'Occupée',
              maintenance: 'Maintenance',
              blocked: 'Bloquée',
              cleaning: 'Nettoyage',
            };
            return (
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 size={16} />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart
                    title=""
                    data={Object.entries(roomStats.byStatus).map(([status, count]) => ({
                      name: statusLabels[status] || status,
                      value: count,
                    }))}
                    bars={[{ dataKey: 'value', name: 'Chambres', color: '#10b981' }]}
                    showGrid={true}
                    showValues={true}
                    height={220}
                  />
                </CardContent>
              </Card>
            );
          }

          // Fallback sur interventionStats.byRoom
          if (interventionStats?.byRoom && Object.keys(interventionStats.byRoom).length > 0) {
            return (
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 size={16} />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart
                    title=""
                    data={Object.entries(interventionStats.byRoom)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 8)
                      .map(([name, value]) => ({ name, value }))}
                    bars={[{ dataKey: 'value', name: 'Interventions', color: '#10b981' }]}
                    showGrid={true}
                    showValues={true}
                    height={220}
                  />
                </CardContent>
              </Card>
            );
          }

          return (
            <EmptyDataCard
              title={widget.title}
              icon={Building2}
              message="Aucune donnée de chambre"
            />
          );
        }
        break;

      // ==================== ENHANCED STATS ====================
      case 'sla_compliance':
        if (widget.type === 'stats_card') {
          const sla = interventionStats?.slaCompliance ?? 0;
          return (
            <StatsCard
              title="Conformité SLA"
              value={`${Math.round(sla)}%`}
              subtitle="Respect des délais"
              icon={CheckCircle2}
              color="blue"
            />
          );
        }
        break;

      case 'overdue_interventions':
        if (widget.type === 'stats_card') {
          const overdue = overdueInterventions?.length ?? interventionStats?.overdue ?? 0;
          const upcoming = interventionStats?.upcoming ?? 0;
          return (
            <StatsCard
              title="En retard"
              value={overdue}
              subtitle={`${upcoming} à venir`}
              icon={AlertCircle}
              color={overdue > 0 ? 'red' : 'gray'}
            />
          );
        }
        if (widget.type === 'list') {
          if (!overdueInterventions || overdueInterventions.length === 0) {
            return (
              <Card className="h-full overflow-hidden flex flex-col">
                <CardHeader className="pb-1 flex-shrink-0">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarClock size={16} className="text-green-500" />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
                    <p className="text-sm text-gray-500">Aucune intervention en retard</p>
                  </div>
                </CardContent>
              </Card>
            );
          }
          return (
            <Card className="h-full overflow-hidden flex flex-col border-red-200 dark:border-red-800">
              <CardHeader className="pb-1 flex-shrink-0 bg-red-50 dark:bg-red-900/20">
                <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle size={16} />
                  {widget.title}
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {overdueInterventions.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 overflow-y-auto p-2 pt-1">
                <div className="space-y-2">
                  {overdueInterventions.slice(0, 5).map(intervention => (
                    <div
                      key={intervention.id}
                      className="flex items-start gap-2 p-2 rounded-md bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 cursor-pointer transition-colors border-l-2 border-red-500"
                      onClick={() => onNavigate?.(`/app/interventions/${intervention.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{intervention.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {intervention.roomNumber && (
                            <span className="text-xs text-gray-500">
                              Ch. {intervention.roomNumber}
                            </span>
                          )}
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(intervention.priority)}`}
                          >
                            {getPriorityLabel(intervention.priority)}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-red-600 dark:text-red-400 whitespace-nowrap font-medium">
                        {formatRelativeDate(intervention.dueDate)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        }
        break;

      case 'recent_interventions':
        if (widget.type === 'list') {
          if (!recentInterventions || recentInterventions.length === 0) {
            return (
              <EmptyDataCard
                title={widget.title}
                icon={History}
                message="Aucune intervention récente"
              />
            );
          }
          return (
            <Card className="h-full overflow-hidden flex flex-col">
              <CardHeader className="pb-1 flex-shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History size={16} />
                  {widget.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 overflow-y-auto p-2 pt-0">
                <div className="space-y-2">
                  {recentInterventions.slice(0, 5).map(intervention => (
                    <div
                      key={intervention.id}
                      className="flex items-start gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => onNavigate?.(`/app/interventions/${intervention.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{intervention.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {intervention.roomNumber && (
                            <span className="text-xs text-gray-500">
                              Ch. {intervention.roomNumber}
                            </span>
                          )}
                          <span className={`text-xs ${getStatusColor(intervention.status)}`}>
                            {intervention.status === 'completed'
                              ? '✓'
                              : intervention.status === 'in_progress'
                                ? '◐'
                                : '○'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatRelativeDate(intervention.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        }
        break;

      // ==================== WIDGETS PERSONNALISABLES ====================
      case 'static':
      case 'custom':
        switch (widget.type) {
          case 'clock':
            return (
              <ClockWidget
                title={widget.title}
                format={widget.clockOptions?.format || '24h'}
                showSeconds={widget.clockOptions?.showSeconds}
                showDate={widget.clockOptions?.showDate}
                timezone={widget.clockOptions?.timezone}
              />
            );

          case 'quick_links':
            return (
              <QuickLinksWidget
                title={widget.title}
                links={widget.linksOptions?.links || []}
                columns={widget.linksOptions?.columns || 2}
              />
            );

          case 'button_grid':
            return (
              <ButtonGridWidget
                title={widget.title}
                buttons={widget.buttonsOptions?.buttons || []}
                columns={widget.buttonsOptions?.columns || 2}
                onNavigate={onNavigate}
              />
            );

          case 'note':
            return (
              <NoteWidget
                title={widget.title}
                content={widget.noteOptions?.content || ''}
                backgroundColor={widget.noteOptions?.backgroundColor}
                textColor={widget.noteOptions?.textColor}
                fontSize={widget.noteOptions?.fontSize}
              />
            );

          case 'custom_list':
            return (
              <CustomListWidget
                title={widget.title}
                items={widget.customListOptions?.items || []}
                editable={widget.customListOptions?.editable}
                showCheckboxes={widget.customListOptions?.showCheckboxes}
              />
            );

          case 'iframe':
            return (
              <IframeWidget
                title={widget.title}
                url={widget.iframeOptions?.url || ''}
                allowFullscreen={widget.iframeOptions?.allowFullscreen}
                allowScripts={widget.iframeOptions?.allowScripts}
              />
            );

          case 'weather':
            return (
              <WeatherWidget
                title={widget.title}
                location={widget.weatherOptions?.location}
                latitude={widget.weatherOptions?.latitude}
                longitude={widget.weatherOptions?.longitude}
                showForecast={widget.weatherOptions?.showForecast}
                refreshInterval={widget.weatherOptions?.refreshInterval}
              />
            );

          default:
            return (
              <Card className="h-full border-dashed border-2">
                <CardContent className="p-4 text-center flex flex-col items-center justify-center h-full">
                  <p className="text-sm text-gray-500">Widget "{widget.title}"</p>
                  <p className="text-xs text-gray-400 mt-1">Type: {widget.type}</p>
                </CardContent>
              </Card>
            );
        }

      // ==================== NOUVEAUX WIDGETS ====================
      case 'resolution_rate':
        if (widget.type === 'stats_card') {
          const rate = resolutionRate?.rate ?? 0;
          const created = resolutionRate?.created ?? 0;
          const completed = resolutionRate?.completed ?? 0;
          return (
            <Card className="h-full overflow-hidden flex flex-col">
              <CardHeader className="pb-1 flex-shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-500" />
                  {widget.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {Math.round(rate)}%
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {completed} / {created} interventions
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(rate, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        }
        break;

      case 'location_stats':
      case 'interventions_by_floor':
      case 'interventions_by_building':
        if (widget.type === 'bar_chart') {
          const dataSource =
            widget.dataSource === 'interventions_by_building'
              ? locationStats?.byBuilding
              : locationStats?.byFloor;

          if (!dataSource || Object.keys(dataSource).length === 0) {
            return (
              <EmptyDataCard
                title={widget.title}
                icon={Layers}
                message="Aucune donnée de localisation"
              />
            );
          }

          const chartDataFormatted = Object.entries(dataSource)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, value]) => ({
              name: name || 'Non défini',
              value,
            }));

          return (
            <Card className="h-full overflow-hidden flex flex-col">
              <CardHeader className="pb-1 flex-shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers size={16} />
                  {widget.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-2 pt-0">
                <BarChart
                  title=""
                  data={chartDataFormatted}
                  bars={[{ dataKey: 'value', name: 'Interventions', color: '#6366f1' }]}
                  showGrid={false}
                  showValues={true}
                  showLegend={false}
                  height={150}
                />
              </CardContent>
            </Card>
          );
        }
        break;

      case 'pending_validation':
        if (widget.type === 'list') {
          if (!pendingValidationInterventions || pendingValidationInterventions.length === 0) {
            return (
              <Card className="h-full overflow-hidden flex flex-col">
                <CardHeader className="pb-1 flex-shrink-0">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
                    <p className="text-sm text-gray-500">Toutes les interventions sont validées</p>
                  </div>
                </CardContent>
              </Card>
            );
          }
          return (
            <Card className="h-full overflow-hidden flex flex-col border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-1 flex-shrink-0 bg-amber-50 dark:bg-amber-900/20">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Clock size={16} />
                  {widget.title}
                  <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingValidationInterventions.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 overflow-y-auto p-2 pt-1">
                <div className="space-y-2">
                  {pendingValidationInterventions.slice(0, 5).map(intervention => (
                    <div
                      key={intervention.id}
                      className="flex items-start gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 cursor-pointer transition-colors border-l-2 border-amber-500"
                      onClick={() => onNavigate?.(`/app/interventions/${intervention.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{intervention.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {intervention.roomNumber && (
                            <span className="text-xs text-gray-500">
                              Ch. {intervention.roomNumber}
                            </span>
                          )}
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            Terminée - En attente de validation
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatRelativeDate(intervention.updatedAt || intervention.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        }
        break;

      case 'problematic_rooms':
        if (widget.type === 'list') {
          if (!problematicRooms || problematicRooms.length === 0) {
            return (
              <Card className="h-full overflow-hidden flex flex-col">
                <CardHeader className="pb-1 flex-shrink-0">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DoorOpen size={16} className="text-green-500" />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
                    <p className="text-sm text-gray-500">Aucune chambre problématique</p>
                  </div>
                </CardContent>
              </Card>
            );
          }
          return (
            <Card className="h-full overflow-hidden flex flex-col">
              <CardHeader className="pb-1 flex-shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DoorOpen size={16} className="text-orange-500" />
                  {widget.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 overflow-y-auto p-2 pt-0">
                <div className="space-y-2">
                  {problematicRooms.map((room, index) => (
                    <div
                      key={room.roomNumber}
                      className="flex items-center gap-3 p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => onNavigate?.(`/app/interventions?room=${room.roomNumber}`)}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                            : index === 1
                              ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Chambre {room.roomNumber}</p>
                        {room.lastIntervention && (
                          <p className="text-xs text-gray-500">
                            Dernière: {formatRelativeDate(room.lastIntervention)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {room.count}
                        </span>
                        <p className="text-xs text-gray-500">interventions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        }
        break;

      case 'today_scheduled':
        if (widget.type === 'list') {
          if (!todayScheduled || todayScheduled.length === 0) {
            return (
              <Card className="h-full overflow-hidden flex flex-col">
                <CardHeader className="pb-1 flex-shrink-0">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" />
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Calendar size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Aucune intervention planifiée aujourd'hui
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          }
          return (
            <Card className="h-full overflow-hidden flex flex-col border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-1 flex-shrink-0 bg-blue-50 dark:bg-blue-900/20">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Calendar size={16} />
                  {widget.title}
                  <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {todayScheduled.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 overflow-y-auto p-2 pt-1">
                <div className="space-y-2">
                  {todayScheduled.slice(0, 5).map(intervention => (
                    <div
                      key={intervention.id}
                      className="flex items-start gap-2 p-2 rounded-md bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 cursor-pointer transition-colors border-l-2 border-blue-500"
                      onClick={() => onNavigate?.(`/app/interventions/${intervention.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{intervention.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {intervention.roomNumber && (
                            <span className="text-xs text-gray-500">
                              Ch. {intervention.roomNumber}
                            </span>
                          )}
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(intervention.priority)}`}
                          >
                            {getPriorityLabel(intervention.priority)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs whitespace-nowrap ${getStatusColor(intervention.status)}`}
                      >
                        {intervention.status === 'completed'
                          ? '✓ Terminée'
                          : intervention.status === 'in_progress'
                            ? '◐ En cours'
                            : '○ En attente'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        }
        break;

      default:
        // Widget non reconnu - afficher un placeholder informatif
        return (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <p className="text-xs text-gray-400">
                Source: {widget.dataSource} | Type: {widget.type}
              </p>
            </CardContent>
          </Card>
        );
    }

    // Fallback si aucune condition n'est remplie - afficher le widget avec son titre
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <p className="text-sm text-gray-500">Chargement...</p>
        </CardContent>
      </Card>
    );
  };

  return <>{renderWidget()}</>;
};
