/**
 * ============================================================================
 * DASHBOARD PAGE - COMPLET
 * ============================================================================
 *
 * Dashboard principal avec :
 * - Stats KPIs en temps réel
 * - Graphiques Recharts
 * - Interventions récentes
 * - Interventions urgentes
 * - Mes interventions (si technicien)
 * - Activité récente
 * - Filtres par période
 */

import { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useInterventions } from '@/features/interventions/hooks/useInterventions';
import { useFeature } from '@/features/establishments/hooks/useFeature';
import { ClipboardList, AlertCircle, CheckCircle2, Clock, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { StatCard, EmptyState, LoadingSkeleton } from '@/shared/components/ui-extended';
import { StatusBadge } from '@/features/interventions/components/badges/StatusBadge';
import { PriorityBadge } from '@/features/interventions/components/badges/PriorityBadge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Intervention } from '@/features/interventions/types/intervention.types';

// ============================================================================
// TYPES
// ============================================================================

type PeriodFilter = 'today' | 'week' | 'month' | 'all';

// ============================================================================
// HELPERS
// ============================================================================

const filterInterventionsByPeriod = (
  interventions: Intervention[],
  period: PeriodFilter
): Intervention[] => {
  const now = new Date();

  if (period === 'all') return interventions;

  const daysAgo = {
    today: 0,
    week: 7,
    month: 30,
  }[period];

  const startDate = startOfDay(subDays(now, daysAgo));
  const endDate = endOfDay(now);

  return interventions.filter(intervention => {
    const createdAt = intervention.createdAt?.toDate();
    if (!createdAt) return false;
    return isWithinInterval(createdAt, { start: startDate, end: endDate });
  });
};

// ============================================================================
// COMPONENT
// ============================================================================

const DashboardPageComponent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allInterventions, isLoading } = useInterventions();
  const { hasFeature } = useFeature();

  const [period, setPeriod] = useState<PeriodFilter>('week');

  // Filtrer les interventions par période
  const filteredInterventions = useMemo(
    () => filterInterventionsByPeriod(allInterventions, period),
    [allInterventions, period]
  );

  // Stats calculées
  const calculatedStats = useMemo(() => {
    const total = filteredInterventions.length;
    const pending = filteredInterventions.filter(i => i.status === 'pending').length;
    const inProgress = filteredInterventions.filter(i => i.status === 'in_progress').length;
    const completed = filteredInterventions.filter(
      i => i.status === 'completed' || i.status === 'validated'
    ).length;
    const urgent = filteredInterventions.filter(i => i.isUrgent).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Temps moyen de résolution (en heures)
    const completedWithDuration = filteredInterventions.filter(
      i => i.status === 'completed' && i.actualDuration
    );
    const avgDuration =
      completedWithDuration.length > 0
        ? completedWithDuration.reduce((acc, i) => acc + (i.actualDuration || 0), 0) /
          completedWithDuration.length /
          60 // Convertir en heures
        : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      urgent,
      completionRate,
      avgDuration: avgDuration.toFixed(1),
    };
  }, [filteredInterventions]);

  // Interventions récentes (5 dernières)
  const recentInterventions = useMemo(
    () =>
      [...filteredInterventions]
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate()?.getTime() || 0;
          const dateB = b.createdAt?.toDate()?.getTime() || 0;
          return dateB - dateA;
        })
        .slice(0, 5),
    [filteredInterventions]
  );

  // Interventions urgentes non traitées
  const urgentInterventions = useMemo(
    () =>
      filteredInterventions
        .filter(i => i.isUrgent && i.status !== 'completed' && i.status !== 'validated')
        .slice(0, 3),
    [filteredInterventions]
  );

  // Mes interventions (si technicien)
  const myInterventions = useMemo(() => {
    if (!user?.id) return [];
    return filteredInterventions
      .filter(i => i.assignedTo === user.id && i.status === 'in_progress')
      .slice(0, 3);
  }, [filteredInterventions, user]);

  // Données pour graphiques
  const chartData = useMemo(() => {
    // Évolution sur les 7 derniers jours
    const evolutionData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayInterventions = allInterventions.filter(intervention => {
        const createdAt = intervention.createdAt?.toDate();
        if (!createdAt) return false;
        return isWithinInterval(createdAt, { start: dayStart, end: dayEnd });
      });

      return {
        date: format(date, 'dd/MM', { locale: fr }),
        total: dayInterventions.length,
        completed: dayInterventions.filter(
          i => i.status === 'completed' || i.status === 'validated'
        ).length,
        pending: dayInterventions.filter(i => i.status === 'pending').length,
      };
    });

    // Répartition par statut
    const statusData = [
      { name: 'En attente', value: calculatedStats.pending, color: '#fbbf24' },
      { name: 'En cours', value: calculatedStats.inProgress, color: '#3b82f6' },
      { name: 'Terminées', value: calculatedStats.completed, color: '#10b981' },
    ];

    // Répartition par priorité
    const priorityData = [
      {
        name: 'Urgente',
        value: filteredInterventions.filter(i => i.priority === 'urgent').length,
      },
      {
        name: 'Haute',
        value: filteredInterventions.filter(i => i.priority === 'high').length,
      },
      {
        name: 'Normale',
        value: filteredInterventions.filter(i => i.priority === 'normal').length,
      },
      {
        name: 'Basse',
        value: filteredInterventions.filter(i => i.priority === 'low').length,
      },
    ];

    return { evolutionData, statusData, priorityData };
  }, [allInterventions, filteredInterventions, calculatedStats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bienvenue, {user?.displayName || 'Utilisateur'} ! 👋
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Voici un aperçu de votre activité</p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(value: PeriodFilter) => setPeriod(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>

          {hasFeature('interventionQuickCreate') && (
            <Button onClick={() => navigate('/app/interventions/create')}>
              <Plus size={16} className="mr-2" />
              Nouvelle intervention
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Interventions"
          value={calculatedStats.total}
          description={`${calculatedStats.pending} en attente`}
          icon={<ClipboardList size={20} />}
          color="blue"
          onClick={() => navigate('/app/interventions')}
        />

        <StatCard
          title="Taux de complétion"
          value={`${calculatedStats.completionRate}%`}
          description={`${calculatedStats.completed} terminées`}
          icon={<CheckCircle2 size={20} />}
          color="green"
        />

        <StatCard
          title="Interventions urgentes"
          value={calculatedStats.urgent}
          description="Nécessitent attention"
          icon={<AlertCircle size={20} />}
          color="red"
          onClick={() => navigate('/app/interventions?filter=urgent')}
        />

        <StatCard
          title="Temps moyen"
          value={`${calculatedStats.avgDuration}h`}
          description="Temps de résolution"
          icon={<Clock size={20} />}
          color="purple"
        />
      </div>

      {/* Graphiques */}
      {hasFeature('dashboard') && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Évolution sur 7 jours */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution (7 derniers jours)</CardTitle>
              <CardDescription>Nombre d'interventions par jour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" name="Terminées" />
                  <Line type="monotone" dataKey="pending" stroke="#fbbf24" name="En attente" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Répartition par statut */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par statut</CardTitle>
              <CardDescription>Distribution des interventions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={entry => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Répartition par priorité */}
      {hasFeature('dashboard') && (
        <Card>
          <CardHeader>
            <CardTitle>Répartition par priorité</CardTitle>
            <CardDescription>Nombre d'interventions par niveau de priorité</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Contenu principal */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Interventions urgentes */}
        {urgentInterventions.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="text-red-500" size={20} />
                  Interventions Urgentes
                </CardTitle>
                <CardDescription>Nécessitent une attention immédiate</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/interventions?filter=urgent')}
              >
                Voir tout
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {urgentInterventions.map(intervention => (
                <div
                  key={intervention.id}
                  onClick={() => navigate(`/app/interventions/${intervention.id}`)}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{intervention.title}</h4>
                    <PriorityBadge priority={intervention.priority} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {intervention.location}
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={intervention.status} />
                    <span className="text-xs text-gray-500">
                      {intervention.createdAt &&
                        format(intervention.createdAt.toDate(), 'dd/MM/yyyy HH:mm', {
                          locale: fr,
                        })}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Mes interventions (si technicien) */}
        {myInterventions.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mes Interventions En Cours</CardTitle>
                <CardDescription>Interventions qui me sont assignées</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/app/interventions?assignedTo=${user?.id}`)}
              >
                Voir tout
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {myInterventions.map(intervention => (
                <div
                  key={intervention.id}
                  onClick={() => navigate(`/app/interventions/${intervention.id}`)}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{intervention.title}</h4>
                    <PriorityBadge priority={intervention.priority} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {intervention.location}
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={intervention.status} />
                    <span className="text-xs text-gray-500">
                      {intervention.createdAt &&
                        format(intervention.createdAt.toDate(), 'dd/MM/yyyy HH:mm', {
                          locale: fr,
                        })}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Interventions récentes */}
        <Card
          className={
            myInterventions.length > 0 || urgentInterventions.length > 0 ? 'lg:col-span-2' : ''
          }
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Interventions Récentes</CardTitle>
              <CardDescription>Les 5 dernières interventions créées</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/interventions')}>
              Voir tout
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentInterventions.length === 0 ? (
              <EmptyState
                icon={<ClipboardList size={48} />}
                title="Aucune intervention"
                description="Il n'y a aucune intervention pour le moment"
                action={
                  hasFeature('interventionQuickCreate')
                    ? {
                        label: 'Créer une intervention',
                        onClick: () => navigate('/app/interventions/create'),
                      }
                    : undefined
                }
              />
            ) : (
              <div className="space-y-4">
                {recentInterventions.map(intervention => (
                  <div
                    key={intervention.id}
                    onClick={() => navigate(`/app/interventions/${intervention.id}`)}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{intervention.title}</h4>
                          {intervention.isUrgent && (
                            <span className="text-red-500">
                              <AlertCircle size={16} />
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {intervention.description}
                        </p>
                      </div>
                      <PriorityBadge priority={intervention.priority} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={intervention.status} />
                        <span className="text-xs text-gray-500">{intervention.location}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {intervention.createdAt &&
                          format(intervention.createdAt.toDate(), 'dd/MM/yyyy HH:mm', {
                            locale: fr,
                          })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

DashboardPageComponent.displayName = 'DashboardPage';

export const DashboardPage = memo(DashboardPageComponent);

export default DashboardPage;
