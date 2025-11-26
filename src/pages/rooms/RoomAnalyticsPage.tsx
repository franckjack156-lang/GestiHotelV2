/**
 * ============================================================================
 * ROOM ANALYTICS PAGE
 * ============================================================================
 *
 * Page d'analyse des blocages de chambres avec KPIs et graphiques
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { DollarSign, Clock, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useBlockages } from '@/features/rooms/hooks/useBlockages';
import { BlockageCard } from '@/features/rooms/components';
import { LoadingSkeleton, StatCard } from '@/shared/components/ui-extended';

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDuration = (days: number): string => {
  if (days === 0) return '< 1 jour';
  if (days === 1) return '1 jour';
  return `${days} jours`;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const RoomAnalyticsPage = () => {
  const navigate = useNavigate();
  const { activeBlockages, stats, topBlockedRooms, isLoading, isLoadingStats } = useBlockages();

  if (isLoading || isLoadingStats) {
    return <LoadingSkeleton type="card" />;
  }

  const urgencyColors = {
    low: 'text-blue-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/rooms')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Analyse des Blocages</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Statistiques et performance des chambres bloquées
            </p>
          </div>
        </div>
      </div>

      {/* KPIs Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Blocages Actifs"
          value={stats?.totalActive || 0}
          icon={<Lock className="h-4 w-4" />}
          color="orange"
        />
        <StatCard
          title="Total Complétés"
          value={stats?.totalCompleted || 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="green"
        />
        <StatCard
          title="Perte de Revenu Totale"
          value={formatCurrency(stats?.totalRevenueLoss || 0)}
          icon={<DollarSign className="h-4 w-4" />}
          color="red"
        />
        <StatCard
          title="Durée Moyenne"
          value={`${stats?.averageDurationDays || 0}j`}
          icon={<Clock className="h-4 w-4" />}
          color="blue"
        />
      </div>

      {/* Duration Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Durée Moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats?.averageDurationDays || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Temps moyen de résolution des blocages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Blocage le Plus Long</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatDuration(stats?.longestBlockageDays || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Record de blocage le plus prolongé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Blocage le Plus Court</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatDuration(stats?.shortestBlockageDays || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Résolution la plus rapide</p>
          </CardContent>
        </Card>
      </div>

      {/* By Urgency */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Urgence</CardTitle>
          <CardDescription>Nombre de blocages par niveau d'urgence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {stats?.byUrgency &&
              Object.entries(stats.byUrgency).map(([urgency, count]) => (
                <div
                  key={urgency}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">{urgency}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                  <div
                    className={`text-2xl font-bold ${urgencyColors[urgency as keyof typeof urgencyColors]}`}
                  >
                    {count}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* By Intervention Type */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Type d'Intervention</CardTitle>
          <CardDescription>Causes principales des blocages de chambres</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.byInterventionType &&
              Object.entries(stats.byInterventionType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 rounded bg-blue-500" />
                      <span className="font-medium capitalize">{type}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        {Math.round((count / (stats?.totalActive + stats?.totalCompleted)) * 100)}%
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Blocked Rooms */}
      {topBlockedRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chambres les Plus Bloquées</CardTitle>
            <CardDescription>
              Top {topBlockedRooms.length} des chambres avec le plus de blocages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topBlockedRooms.map((room, index) => (
                <div
                  key={room.roomId}
                  className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-orange-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">Chambre {room.roomNumber || room.roomId}</p>
                      <p className="text-sm text-muted-foreground">
                        {room.blockageCount} blocage{room.blockageCount > 1 ? 's' : ''} •{' '}
                        {room.totalDaysBlocked} jours
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {formatCurrency(room.totalRevenueLoss)}
                    </p>
                    <p className="text-xs text-muted-foreground">Perte estimée</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Blockages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Blocages Actifs ({activeBlockages.length})
          </CardTitle>
          <CardDescription>
            Chambres actuellement bloquées nécessitant une résolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeBlockages.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucune chambre bloquée actuellement
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Excellent ! Toutes les chambres sont disponibles
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBlockages.map(blockage => (
                <BlockageCard
                  key={blockage.id}
                  blockage={blockage}
                  onViewIntervention={interventionId =>
                    navigate(`/app/interventions/${interventionId}`)
                  }
                  showActions={false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
