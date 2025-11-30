/**
 * ============================================================================
 * PLANNING STATISTICS COMPONENT
 * ============================================================================
 *
 * Composant pour afficher les statistiques visuelles du planning
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Intervention } from '../types/intervention.types';

interface PlanningStatisticsProps {
  interventions: Intervention[];
  period: { start: Date; end: Date };
}

export const PlanningStatistics = ({ interventions, period }: PlanningStatisticsProps) => {
  // Calculer les statistiques
  const stats = useMemo(() => {
    const total = interventions.length;

    // Par statut
    const byStatus = {
      pending: interventions.filter(i => i.status === 'pending').length,
      assigned: interventions.filter(i => i.status === 'assigned').length,
      in_progress: interventions.filter(i => i.status === 'in_progress').length,
      completed: interventions.filter(i => i.status === 'completed' || i.status === 'validated')
        .length,
      cancelled: interventions.filter(i => i.status === 'cancelled').length,
    };

    // Par priorité
    const byPriority = {
      critical: interventions.filter(i => i.priority === 'critical').length,
      urgent: interventions.filter(i => i.priority === 'urgent').length,
      high: interventions.filter(i => i.priority === 'high').length,
      normal: interventions.filter(i => i.priority === 'normal').length,
      low: interventions.filter(i => i.priority === 'low').length,
    };

    // Charge par jour
    const days = eachDayOfInterval(period);
    const dailyLoad = days.map(day => {
      const count = interventions.filter(i => {
        if (!i.scheduledAt || typeof i.scheduledAt.toDate !== 'function') return false;
        return isSameDay(i.scheduledAt.toDate(), day);
      }).length;
      return { day, count };
    });

    const maxDailyLoad = Math.max(...dailyLoad.map(d => d.count), 1);
    const avgDailyLoad = total / days.length;

    // Par technicien
    const technicianMap = new Map<string, number>();
    interventions.forEach(i => {
      if (i.assignedToName) {
        const current = technicianMap.get(i.assignedToName) || 0;
        technicianMap.set(i.assignedToName, current + 1);
      }
    });

    const topTechnicians = Array.from(technicianMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Taux de complétion
    const completionRate = total > 0 ? (byStatus.completed / total) * 100 : 0;

    // Durée moyenne estimée
    const withDuration = interventions.filter(i => i.estimatedDuration);
    const avgDuration =
      withDuration.length > 0
        ? withDuration.reduce((sum, i) => sum + (i.estimatedDuration || 0), 0) / withDuration.length
        : 0;

    return {
      total,
      byStatus,
      byPriority,
      dailyLoad,
      maxDailyLoad,
      avgDailyLoad,
      topTechnicians,
      completionRate,
      avgDuration,
    };
  }, [interventions, period]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  return (
    <div className="space-y-4">
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total interventions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total interventions</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Taux de complétion */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Taux de complétion</p>
                <p className="text-2xl font-bold mt-1">{stats.completionRate.toFixed(0)}%</p>
                <Progress value={stats.completionRate} className="mt-2" />
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 ml-4" />
            </div>
          </CardContent>
        </Card>

        {/* Interventions urgentes */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Urgentes/Critiques</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.byPriority.urgent + stats.byPriority.critical}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        {/* Durée moyenne */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Durée moyenne</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.avgDuration > 0 ? formatDuration(stats.avgDuration) : '-'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques détaillés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Charge quotidienne */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Charge quotidienne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Charge moyenne: {stats.avgDailyLoad.toFixed(1)} interventions/jour</span>
                <span>Maximum: {stats.maxDailyLoad}</span>
              </div>
              <div className="space-y-2">
                {stats.dailyLoad.map(({ day, count }, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs w-12 text-gray-600 dark:text-gray-400">
                      {format(day, 'EEE d', { locale: fr })}
                    </span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-6 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          count === 0
                            ? 'bg-gray-300 dark:bg-gray-700'
                            : count <= 3
                              ? 'bg-green-500'
                              : count <= 6
                                ? 'bg-blue-500'
                                : count <= 9
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                        }`}
                        style={{ width: `${(count / stats.maxDailyLoad) * 100}%` }}
                      />
                      {count > 0 && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {count}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par statut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Répartition par statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byStatus).map(([status, count]) => {
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                const statusLabels = {
                  pending: 'En attente',
                  assigned: 'Assignée',
                  in_progress: 'En cours',
                  completed: 'Terminée',
                  cancelled: 'Annulée',
                };
                const statusColors = {
                  pending: 'bg-gray-500',
                  assigned: 'bg-blue-500',
                  in_progress: 'bg-yellow-500',
                  completed: 'bg-green-500',
                  cancelled: 'bg-red-500',
                };

                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {statusLabels[status as keyof typeof statusLabels]}
                      </span>
                      <span className="font-medium">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${statusColors[status as keyof typeof statusColors]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top techniciens */}
        {stats.topTechnicians.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Top techniciens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topTechnicians.map(({ name, count }, index) => {
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 truncate">{name}</span>
                        <span className="font-medium ml-2">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Répartition par priorité */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Répartition par priorité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byPriority).map(([priority, count]) => {
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                const priorityLabels = {
                  critical: 'Critique',
                  urgent: 'Urgente',
                  high: 'Haute',
                  normal: 'Normale',
                  low: 'Basse',
                };
                const priorityColors = {
                  critical: 'bg-red-600',
                  urgent: 'bg-red-500',
                  high: 'bg-orange-500',
                  normal: 'bg-blue-500',
                  low: 'bg-gray-500',
                };

                return (
                  <div key={priority} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {priorityLabels[priority as keyof typeof priorityLabels]}
                      </span>
                      <span className="font-medium">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${priorityColors[priority as keyof typeof priorityColors]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
