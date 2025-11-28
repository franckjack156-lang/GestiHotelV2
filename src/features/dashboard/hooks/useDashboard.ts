/* eslint-disable react-hooks/exhaustive-deps */
/**
 * useDashboard Hook
 *
 * Hook pour gérer le dashboard personnalisable et ses statistiques
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useEstablishmentStore } from '@/features/establishments/stores/establishmentStore';
import dashboardService from '../services/dashboardService';
import { logger } from '@/core/utils/logger';
import type {
  DashboardPreferences,
  WidgetConfig,
  InterventionStats,
  TimelineData,
  RoomStats,
  TechnicianPerformance,
} from '../types/dashboard.types';
import type { Intervention } from '@/features/interventions/types/intervention.types';

export const useDashboard = () => {
  const { user } = useAuthStore();
  const { currentEstablishment } = useEstablishmentStore();

  const establishmentId =
    currentEstablishment?.id || user?.currentEstablishmentId || user?.establishmentIds?.[0];
  const userId = user?.id;

  const [preferences, setPreferences] = useState<DashboardPreferences | null>(null);
  const [interventionStats, setInterventionStats] = useState<InterventionStats | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [roomStats, setRoomStats] = useState<RoomStats | null>(null);
  const [technicianPerformance, setTechnicianPerformance] = useState<TechnicianPerformance[]>([]);
  const [recentInterventions, setRecentInterventions] = useState<Intervention[]>([]);
  const [overdueInterventions, setOverdueInterventions] = useState<Intervention[]>([]);
  const [pendingValidationInterventions, setPendingValidationInterventions] = useState<
    Intervention[]
  >([]);
  const [resolutionRate, setResolutionRate] = useState<{
    created: number;
    completed: number;
    rate: number;
  } | null>(null);
  const [locationStats, setLocationStats] = useState<{
    byFloor: Record<string, number>;
    byBuilding: Record<string, number>;
  } | null>(null);
  const [problematicRooms, setProblematicRooms] = useState<
    { roomNumber: string; count: number; lastIntervention: Date | null }[]
  >([]);
  const [todayScheduled, setTodayScheduled] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger les préférences
   */
  const loadPreferences = useCallback(async () => {
    if (!userId || !establishmentId) return;

    try {
      let prefs = await dashboardService.getPreferences(userId, establishmentId);

      // Créer les préférences par défaut si elles n'existent pas
      if (!prefs) {
        prefs = await dashboardService.createDefaultPreferences(userId, establishmentId);
      }

      setPreferences(prefs);
    } catch (err) {
      logger.error('Erreur loadPreferences:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement des préférences');
    }
  }, [userId, establishmentId]);

  /**
   * Charger les statistiques d'interventions
   */
  const loadInterventionStats = useCallback(
    async (
      dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom' | 'all' = 'all',
      customDateFrom?: Date,
      customDateTo?: Date
    ) => {
      if (!establishmentId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const stats = await dashboardService.getInterventionStats(
          establishmentId,
          dateRange,
          customDateFrom,
          customDateTo
        );
        setInterventionStats(stats);
      } catch (err) {
        logger.error('Erreur loadInterventionStats:', err);
        setError(err instanceof Error ? err.message : 'Erreur de chargement des statistiques');
      } finally {
        setIsLoading(false);
      }
    },
    [establishmentId]
  );

  /**
   * Charger les données de timeline
   */
  const loadTimelineData = useCallback(
    async (dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' = 'all') => {
      if (!establishmentId) return;

      try {
        const data = await dashboardService.getTimelineData(establishmentId, dateRange);
        setTimelineData(data);
      } catch (err) {
        logger.error('Erreur loadTimelineData:', err);
      }
    },
    [establishmentId]
  );

  /**
   * Charger les statistiques des chambres
   */
  const loadRoomStats = useCallback(async () => {
    if (!establishmentId) return;

    try {
      const stats = await dashboardService.getRoomStats(establishmentId);
      setRoomStats(stats);
    } catch (err) {
      logger.error('Erreur loadRoomStats:', err);
    }
  }, [establishmentId]);

  /**
   * Charger les performances des techniciens
   */
  const loadTechnicianPerformance = useCallback(
    async (dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' = 'all') => {
      if (!establishmentId) return;

      try {
        const performance = await dashboardService.getTechnicianPerformance(
          establishmentId,
          dateRange
        );
        setTechnicianPerformance(performance);
      } catch (err) {
        logger.error('Erreur loadTechnicianPerformance:', err);
      }
    },
    [establishmentId]
  );

  /**
   * Charger les interventions récentes
   */
  const loadRecentInterventions = useCallback(async () => {
    if (!establishmentId) return;

    try {
      const interventions = await dashboardService.getRecentInterventions(establishmentId, 10);
      setRecentInterventions(interventions);
    } catch (err) {
      logger.error('Erreur loadRecentInterventions:', err);
    }
  }, [establishmentId]);

  /**
   * Charger les interventions en retard
   */
  const loadOverdueInterventions = useCallback(async () => {
    if (!establishmentId) return;

    try {
      const interventions = await dashboardService.getOverdueInterventions(establishmentId);
      setOverdueInterventions(interventions);
    } catch (err) {
      logger.error('Erreur loadOverdueInterventions:', err);
    }
  }, [establishmentId]);

  /**
   * Charger les interventions en attente de validation
   */
  const loadPendingValidationInterventions = useCallback(async () => {
    if (!establishmentId) return;

    try {
      const interventions =
        await dashboardService.getPendingValidationInterventions(establishmentId);
      setPendingValidationInterventions(interventions);
    } catch (err) {
      logger.error('Erreur loadPendingValidationInterventions:', err);
    }
  }, [establishmentId]);

  /**
   * Charger le taux de résolution
   */
  const loadResolutionRate = useCallback(
    async (period: 'today' | 'week' | 'month' = 'week') => {
      if (!establishmentId) return;

      try {
        const rate = await dashboardService.getResolutionRate(establishmentId, period);
        setResolutionRate(rate);
      } catch (err) {
        logger.error('Erreur loadResolutionRate:', err);
      }
    },
    [establishmentId]
  );

  /**
   * Charger les statistiques par localisation
   */
  const loadLocationStats = useCallback(async () => {
    if (!establishmentId) return;

    try {
      const stats = await dashboardService.getInterventionsByLocation(establishmentId);
      setLocationStats(stats);
    } catch (err) {
      logger.error('Erreur loadLocationStats:', err);
    }
  }, [establishmentId]);

  /**
   * Charger les chambres problématiques
   */
  const loadProblematicRooms = useCallback(async () => {
    if (!establishmentId) return;

    try {
      const rooms = await dashboardService.getProblematicRooms(establishmentId, 5);
      setProblematicRooms(rooms);
    } catch (err) {
      logger.error('Erreur loadProblematicRooms:', err);
    }
  }, [establishmentId]);

  /**
   * Charger les interventions planifiées aujourd'hui
   */
  const loadTodayScheduled = useCallback(async () => {
    if (!establishmentId) return;

    try {
      const interventions = await dashboardService.getTodayScheduledInterventions(establishmentId);
      setTodayScheduled(interventions);
    } catch (err) {
      logger.error('Erreur loadTodayScheduled:', err);
    }
  }, [establishmentId]);

  /**
   * Mettre à jour les préférences
   */
  const updatePreferences = useCallback(
    async (updates: Partial<Omit<DashboardPreferences, 'id' | 'userId' | 'establishmentId'>>) => {
      if (!userId || !establishmentId || !preferences) return;

      try {
        // Mise à jour optimiste de l'état local
        setPreferences(prev => {
          if (!prev) return prev;
          return { ...prev, ...updates };
        });

        // Mise à jour dans Firestore en arrière-plan
        await dashboardService.updatePreferences(userId, establishmentId, updates);
      } catch (err) {
        logger.error('Erreur updatePreferences:', err);
        // En cas d'erreur, recharger les préférences depuis Firestore
        await loadPreferences();
        throw err;
      }
    },
    [userId, establishmentId, preferences, loadPreferences]
  );

  /**
   * Mettre à jour un widget
   */
  const updateWidget = useCallback(
    async (widgetId: string, updates: Partial<WidgetConfig>) => {
      if (!userId || !establishmentId || !preferences) return;

      try {
        // Mise à jour optimiste de l'état local
        const updatedWidgets = preferences.widgets.map(w =>
          w.id === widgetId ? { ...w, ...updates } : w
        );

        setPreferences(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            widgets: updatedWidgets,
          };
        });

        // Mise à jour dans Firestore en arrière-plan avec les widgets déjà mis à jour
        await dashboardService.updateWidget(
          userId,
          establishmentId,
          widgetId,
          updates,
          updatedWidgets
        );
      } catch (err) {
        logger.error('Erreur updateWidget:', err);
        // En cas d'erreur, recharger les préférences depuis Firestore
        await loadPreferences();
        throw err;
      }
    },
    [userId, establishmentId, preferences, loadPreferences]
  );

  /**
   * Ajouter un widget
   */
  const addWidget = useCallback(
    async (widget: Omit<WidgetConfig, 'id'>) => {
      if (!userId || !establishmentId) return;

      try {
        await dashboardService.addWidget(userId, establishmentId, widget);
        await loadPreferences();
      } catch (err) {
        logger.error('Erreur addWidget:', err);
        throw err;
      }
    },
    [userId, establishmentId, loadPreferences]
  );

  /**
   * Supprimer un widget
   */
  const removeWidget = useCallback(
    async (widgetId: string) => {
      if (!userId || !establishmentId || !preferences) return;

      try {
        // Mise à jour optimiste de l'état local
        setPreferences(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            widgets: prev.widgets.filter(w => w.id !== widgetId),
          };
        });

        // Suppression dans Firestore en arrière-plan
        await dashboardService.removeWidget(userId, establishmentId, widgetId);
      } catch (err) {
        logger.error('Erreur removeWidget:', err);
        // En cas d'erreur, recharger les préférences depuis Firestore
        await loadPreferences();
        throw err;
      }
    },
    [userId, establishmentId, preferences, loadPreferences]
  );

  /**
   * Réorganiser les widgets
   */
  const reorderWidgets = useCallback(
    async (widgets: WidgetConfig[]) => {
      if (!userId || !establishmentId) return;

      try {
        await dashboardService.reorderWidgets(userId, establishmentId, widgets);
        await loadPreferences();
      } catch (err) {
        logger.error('Erreur reorderWidgets:', err);
        throw err;
      }
    },
    [userId, establishmentId, loadPreferences]
  );

  /**
   * Rafraîchir toutes les données
   * Charge toutes les interventions (pas de filtre de date)
   */
  const refreshAll = useCallback(() => {
    if (!preferences) return;

    // Charger toutes les données
    loadInterventionStats('all');
    loadTimelineData('all');
    loadRoomStats();
    loadTechnicianPerformance('all');
    loadRecentInterventions();
    loadOverdueInterventions();
    loadPendingValidationInterventions();
    loadResolutionRate('week');
    loadLocationStats();
    loadProblematicRooms();
    loadTodayScheduled();
  }, [
    preferences,
    loadInterventionStats,
    loadTimelineData,
    loadRoomStats,
    loadTechnicianPerformance,
    loadRecentInterventions,
    loadOverdueInterventions,
    loadPendingValidationInterventions,
    loadResolutionRate,
    loadLocationStats,
    loadProblematicRooms,
    loadTodayScheduled,
  ]);

  /**
   * Charger les données initiales
   */
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  /**
   * Charger les statistiques quand les préférences sont prêtes (une seule fois)
   * Par défaut, charge TOUTES les données (pas de filtre de date)
   */
  useEffect(() => {
    if (preferences && establishmentId) {
      // Charger toutes les interventions par défaut pour les stats globales
      loadInterventionStats('all');
      // Pour la timeline, utiliser 'all' qui prend les 90 derniers jours
      loadTimelineData('all');
      loadRoomStats();
      // Charger toutes les performances techniciens
      loadTechnicianPerformance('all');
      // Charger les interventions récentes et en retard
      loadRecentInterventions();
      loadOverdueInterventions();
      // Charger les nouvelles données
      loadPendingValidationInterventions();
      loadResolutionRate('week');
      loadLocationStats();
      loadProblematicRooms();
      loadTodayScheduled();
    }
  }, [preferences?.id, establishmentId]); // Ne se déclenche que quand les préférences changent vraiment (via leur ID)

  /**
   * Auto-refresh si activé
   */
  useEffect(() => {
    if (!preferences?.autoRefresh) return;

    const interval = setInterval(() => {
      refreshAll();
    }, preferences.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [preferences, refreshAll]);

  return {
    // État
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
    isLoading,
    error,

    // Actions - Préférences
    updatePreferences,
    updateWidget,
    addWidget,
    removeWidget,
    reorderWidgets,

    // Actions - Données
    loadInterventionStats,
    loadTimelineData,
    loadRoomStats,
    loadTechnicianPerformance,
    loadRecentInterventions,
    loadOverdueInterventions,
    loadPendingValidationInterventions,
    loadResolutionRate,
    loadLocationStats,
    loadProblematicRooms,
    loadTodayScheduled,
    refreshAll,

    // Utilitaires
    hasPreferences: !!preferences,
    visibleWidgets: preferences?.widgets.filter(w => w.visible) || [],
  };
};
