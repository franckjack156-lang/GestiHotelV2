/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-refresh/only-export-components, @typescript-eslint/ban-ts-comment, react-hooks/exhaustive-deps */
/**
 * WidgetRenderer Component
 *
 * Rendu dynamique des widgets du dashboard selon leur configuration
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { StatsCard } from '@/features/dashboard/components/charts/StatsCard';
import { LineChart } from '@/features/dashboard/components/charts/LineChart';
import { BarChart } from '@/features/dashboard/components/charts/BarChart';
import { PieChart } from '@/features/dashboard/components/charts/PieChart';
import { AreaChart } from '@/features/dashboard/components/charts/AreaChart';
import { StatCard } from '@/shared/components/ui-extended';
import { ClockWidget } from './widgets/ClockWidget';
import { QuickLinksWidget } from './widgets/QuickLinksWidget';
import { ButtonGridWidget } from './widgets/ButtonGridWidget';
import { NoteWidget } from './widgets/NoteWidget';
import { CustomListWidget } from './widgets/CustomListWidget';
import { IframeWidget } from './widgets/IframeWidget';
import type { WidgetConfig, InterventionStats, TimelineData, RoomStats, TechnicianPerformance } from '../types/dashboard.types';
import {
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  Home
} from 'lucide-react';

interface WidgetRendererProps {
  widget: WidgetConfig;
  interventionStats?: InterventionStats | null;
  timelineData?: TimelineData[];
  roomStats?: RoomStats | null;
  technicianPerformance?: TechnicianPerformance[];
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
    evolutionData: any[];
    statusData: any[];
    priorityData: any[];
  };
  onNavigate?: (path: string) => void;
}

export const WidgetRenderer = ({
  widget,
  interventionStats,
  timelineData,
  roomStats,
  technicianPerformance,
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
        if (widget.type === 'stats_card' && calculatedStats) {
          return (
            <StatCard
              title="Total Interventions"
              value={calculatedStats.total}
              description={`${calculatedStats.pending} en attente`}
              icon={<ClipboardList size={20} />}
              color="blue"
              onClick={() => onNavigate?.('/app/interventions')}
            />
          );
        }
        break;

      case 'completion_rate':
      case 'interventions_completion_rate':
        if (widget.type === 'stats_card' && calculatedStats) {
          return (
            <StatCard
              title="Taux de complétion"
              value={`${calculatedStats.completionRate}%`}
              description={`${calculatedStats.completed} terminées`}
              icon={<CheckCircle2 size={20} />}
              color="green"
            />
          );
        }
        break;

      case 'urgent_interventions':
        if (widget.type === 'stats_card' && calculatedStats) {
          return (
            <StatCard
              title="Interventions urgentes"
              value={calculatedStats.urgent}
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
        if (widget.type === 'stats_card' && calculatedStats) {
          return (
            <StatCard
              title="Temps moyen"
              value={`${calculatedStats.avgDuration}h`}
              description="Temps de résolution"
              icon={<Clock size={20} />}
              color="purple"
            />
          );
        }
        break;

      // ==================== CHARTS ====================
      case 'interventions_timeline':
        if (widget.type === 'line_chart' && chartData) {
          return (
            <Card>
              <CardHeader>
                <CardTitle>{widget.title}</CardTitle>
                <CardDescription>Nombre d'interventions par jour</CardDescription>
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
                  height={250}
                />
              </CardContent>
            </Card>
          );
        }
        break;

      case 'status_distribution':
        if (widget.type === 'pie_chart' && chartData) {
          return (
            <Card>
              <CardHeader>
                <CardTitle>{widget.title}</CardTitle>
                <CardDescription>Distribution des interventions</CardDescription>
              </CardHeader>
              <CardContent>
                <PieChart
                  title=""
                  data={chartData.statusData}
                  dataKey="value"
                  nameKey="name"
                  height={250}
                />
              </CardContent>
            </Card>
          );
        }
        break;

      case 'interventions_by_priority':
        if (widget.type === 'bar_chart' && chartData) {
          return (
            <Card>
              <CardHeader>
                <CardTitle>{widget.title}</CardTitle>
                <CardDescription>Nombre d'interventions par niveau de priorité</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  title=""
                  data={chartData.priorityData}
                  bars={[{ dataKey: 'value', name: 'Interventions', color: '#8b5cf6' }]}
                  xAxisKey="name"
                  showGrid={true}
                  showValues={true}
                  height={250}
                />
              </CardContent>
            </Card>
          );
        }
        break;

      case 'technician_performance':
      case 'interventions_by_technician':
        if (widget.type === 'bar_chart') {
          // Vérifier si nous avons des données
          if (interventionStats && interventionStats.byTechnician && Object.keys(interventionStats.byTechnician).length > 0) {
            return (
              <BarChart
                title={widget.title}
                data={Object.entries(interventionStats.byTechnician).map(([name, value]) => ({
                  name: name.length > 20 ? name.substring(0, 20) + '...' : name,
                  value,
                }))}
                bars={[{ dataKey: 'value', name: 'Interventions', color: '#3b82f6' }]}
                showGrid={true}
                showValues={true}
                height={300}
              />
            );
          }

          // Pas de données disponibles
          return (
            <Card>
              <CardHeader>
                <CardTitle>{widget.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucune donnée disponible pour ce widget
                </p>
              </CardContent>
            </Card>
          );
        }
        break;

      case 'rooms_by_status':
        if (widget.type === 'bar_chart' && interventionStats && Object.keys(interventionStats.byRoom).length > 0) {
          return (
            <BarChart
              title={widget.title}
              data={Object.entries(interventionStats.byRoom)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([name, value]) => ({ name, value }))}
              bars={[{ dataKey: 'value', name: 'Interventions', color: '#10b981' }]}
              showGrid={true}
              showValues={true}
              height={300}
            />
          );
        }
        break;

      // ==================== ENHANCED STATS ====================
      case 'sla_compliance':
        if (widget.type === 'stats_card' && interventionStats) {
          return (
            <StatsCard
              title="Conformité SLA"
              value={`${interventionStats.slaCompliance.toFixed(0)}%`}
              subtitle="Respect des délais"
              icon={CheckCircle2}
              color="blue"
            />
          );
        }
        break;

      case 'overdue_interventions':
        if (widget.type === 'stats_card' && interventionStats) {
          return (
            <StatsCard
              title="Interventions en retard"
              value={interventionStats.overdue}
              subtitle={`${interventionStats.upcoming} à venir`}
              icon={AlertCircle}
              color={interventionStats.overdue > 0 ? 'red' : 'gray'}
            />
          );
        }
        break;

      case 'recent_interventions':
        // Ce widget nécessiterait les données des interventions récentes
        // Pour l'instant, on affiche un placeholder
        return (
          <Card className="border-dashed border-2">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-500">
                Widget "Interventions récentes" en cours de développement
              </p>
            </CardContent>
          </Card>
        );
        break;

      // ==================== WIDGETS PERSONNALISABLES ====================
      case 'static':
      case 'custom':
        // Widgets statiques/personnalisés basés sur le type
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

          default:
            return (
              <Card className="border-dashed border-2">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-gray-500">
                    Widget personnalisé "{widget.title}"
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Type: {widget.type}
                  </p>
                </CardContent>
              </Card>
            );
        }
        break;

      default:
        // Widget non reconnu ou non implémenté
        return (
          <Card className="border-dashed border-2">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-500">
                Widget "{widget.title}" ({widget.dataSource})
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Type: {widget.type}
              </p>
            </CardContent>
          </Card>
        );
    }

    // Si aucun rendu n'a été retourné
    return null;
  };

  return <>{renderWidget()}</>;
};
