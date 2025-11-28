/**
 * ============================================================================
 * DASHBOARD PAGE - PERSONNALISABLE
 * ============================================================================
 *
 * Dashboard principal avec :
 * - Personnalisation complète par utilisateur
 * - Stats KPIs en temps réel
 * - Graphiques variés (Line, Bar, Pie, Area)
 * - Widgets personnalisables
 * - Filtres par période
 * - Sauvegarde des préférences
 */

import { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useFeature } from '@/features/establishments/hooks/useFeature';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { Plus, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { LoadingSkeleton } from '@/shared/components/ui-extended';
import { CustomizeDashboardDialog } from '@/features/dashboard/components/CustomizeDashboardDialog';
import { DashboardEditMode } from '@/features/dashboard/components/DashboardEditMode';
import { SimpleDashboardGrid } from '@/features/dashboard/components/SimpleDashboardGrid';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';

// ============================================================================
// COMPONENT
// ============================================================================

const DashboardPageComponent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasFeature } = useFeature();

  const {
    preferences,
    interventionStats,
    timelineData,
    roomStats,
    technicianPerformance,
    recentInterventions,
    overdueInterventions,
    pendingValidationInterventions,
    resolutionRate,
    locationStats,
    problematicRooms,
    todayScheduled,
    isLoading: isDashboardLoading,
    updatePreferences,
    updateWidget,
    removeWidget,
    refreshAll,
    visibleWidgets,
  } = useDashboard();

  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Données calculées pour les widgets (utilisées par WidgetRenderer)
  const calculatedStats = useMemo(() => {
    if (!interventionStats) return null;

    return {
      total: interventionStats.total,
      pending: interventionStats.byStatus?.pending || 0,
      inProgress: interventionStats.byStatus?.in_progress || 0,
      completed: interventionStats.byStatus?.completed || 0,
      urgent: interventionStats.byPriority?.urgent || 0,
      completionRate: interventionStats.completionRate,
      avgDuration: interventionStats.avgResponseTime.toFixed(1),
    };
  }, [interventionStats]);

  const chartData = useMemo(() => {
    if (!interventionStats) return null;

    // Transformer les données de status pour le graphique
    const statusLabels: Record<string, string> = {
      pending: 'En attente',
      in_progress: 'En cours',
      completed: 'Terminées',
      validated: 'Validées',
      cancelled: 'Annulées',
    };

    const statusColors: Record<string, string> = {
      pending: '#fbbf24', // yellow
      in_progress: '#3b82f6', // blue
      completed: '#10b981', // green
      validated: '#8b5cf6', // purple
      cancelled: '#ef4444', // red
    };

    const statusData = Object.entries(interventionStats.byStatus).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      color: statusColors[status] || '#6b7280',
    }));

    // Transformer les données de priorité pour le graphique
    const priorityLabels: Record<string, string> = {
      low: 'Basse',
      normal: 'Normale',
      high: 'Haute',
      urgent: 'Urgente',
    };

    const priorityColors: Record<string, string> = {
      low: '#10b981', // green
      normal: '#3b82f6', // blue
      high: '#f59e0b', // orange
      urgent: '#ef4444', // red
    };

    const priorityData = Object.entries(interventionStats.byPriority).map(([priority, count]) => ({
      name: priorityLabels[priority] || priority,
      value: count,
      color: priorityColors[priority] || '#6b7280',
    }));

    // Utiliser timelineData si disponible pour l'évolution
    const evolutionData =
      timelineData?.map(item => ({
        date: item.date,
        total: item.created + item.completed + item.inProgress,
        completed: item.completed,
        pending: item.created,
        inProgress: item.inProgress,
      })) || [];

    return {
      evolutionData,
      statusData,
      priorityData,
    };
  }, [interventionStats, timelineData]);

  const handleRefresh = () => {
    refreshAll();
    toast.success('Dashboard actualisé');
  };

  const handleLayoutChange = async (updatedWidgets: typeof visibleWidgets) => {
    if (!preferences) return;

    try {
      await updatePreferences({ widgets: updatedWidgets });
      toast.success('Disposition mise à jour');
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la disposition:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  if (isDashboardLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
            Bienvenue, {user?.displayName || 'Utilisateur'} ! 👋
          </h1>
          <p className="mt-1 sm:mt-2 text-sm text-gray-600 dark:text-gray-400">
            Dashboard personnalisable avec statistiques en temps réel
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="flex-shrink-0">
            <RefreshCw size={16} className="sm:mr-2" />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>

          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditMode(true)}
            className="flex-shrink-0"
          >
            <Settings size={16} className="sm:mr-2" />
            <span className="hidden sm:inline">Mode Édition</span>
          </Button>

          {hasFeature('interventionQuickCreate') && (
            <Button
              onClick={() => navigate('/app/interventions/create')}
              className="flex-shrink-0"
              size="sm"
            >
              <Plus size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">Nouvelle intervention</span>
            </Button>
          )}
        </div>
      </div>

      {/* Widgets dynamiques du dashboard */}
      {preferences && visibleWidgets.length > 0 ? (
        <SimpleDashboardGrid
          widgets={visibleWidgets}
          interventionStats={interventionStats}
          timelineData={timelineData}
          roomStats={roomStats}
          technicianPerformance={technicianPerformance}
          recentInterventions={recentInterventions}
          overdueInterventions={overdueInterventions}
          pendingValidationInterventions={pendingValidationInterventions}
          resolutionRate={resolutionRate}
          locationStats={locationStats}
          problematicRooms={problematicRooms}
          todayScheduled={todayScheduled}
          calculatedStats={calculatedStats ?? undefined}
          chartData={chartData ?? undefined}
          onNavigate={navigate}
          onLayoutChange={handleLayoutChange}
          isEditMode={false}
        />
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Aucun widget configuré pour le moment
          </p>
          <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configurer le dashboard
          </Button>
        </div>
      )}

      {/* Dialogue de personnalisation */}
      {preferences && (
        <CustomizeDashboardDialog
          open={isCustomizeDialogOpen}
          onClose={() => setIsCustomizeDialogOpen(false)}
          preferences={preferences}
          onUpdatePreferences={updatePreferences}
          onUpdateWidget={updateWidget}
          onRemoveWidget={removeWidget}
        />
      )}

      {/* Mode édition */}
      {isEditMode && preferences && (
        <DashboardEditMode
          preferences={preferences}
          onUpdatePreferences={updatePreferences}
          onUpdateWidget={updateWidget}
          onExit={() => setIsEditMode(false)}
        />
      )}
    </div>
  );
};

DashboardPageComponent.displayName = 'DashboardPage';

export const DashboardPage = memo(DashboardPageComponent);

export default DashboardPage;
