/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Dashboard Service
 *
 * Service pour gérer les préférences de dashboard et calculer les statistiques
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type {
  DashboardPreferences,
  WidgetConfig,
  InterventionStats,
  TimelineData,
  RoomStats,
  TechnicianPerformance,
} from '../types/dashboard.types';
import { DEFAULT_WIDGET_CONFIGS } from '../types/dashboard.types';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import { InterventionStatus } from '@/shared/types/status.types';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from 'date-fns';

class DashboardService {
  private readonly COLLECTION = 'dashboardPreferences';

  /**
   * Obtenir les préférences dashboard d'un utilisateur
   * Synchronise automatiquement les nouveaux widgets manquants
   */
  async getPreferences(
    userId: string,
    establishmentId: string
  ): Promise<DashboardPreferences | null> {
    const docId = `${userId}_${establishmentId}`;
    const docRef = doc(db, this.COLLECTION, docId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    const preferences = {
      id: snapshot.id,
      ...snapshot.data(),
    } as DashboardPreferences;

    // Synchroniser les nouveaux widgets manquants
    const existingDataSources = new Set(preferences.widgets.map(w => w.dataSource));
    const missingWidgets = DEFAULT_WIDGET_CONFIGS.filter(
      config => !existingDataSources.has(config.dataSource)
    );

    if (missingWidgets.length > 0) {
      // Ajouter les widgets manquants
      const newWidgets = missingWidgets.map((config, index) => ({
        ...config,
        id: `widget_new_${Date.now()}_${index}`,
      }));

      const updatedWidgets = [...preferences.widgets, ...newWidgets];

      // Sauvegarder la mise à jour
      await updateDoc(docRef, {
        widgets: updatedWidgets,
        updatedAt: serverTimestamp(),
      });

      preferences.widgets = updatedWidgets;
    }

    return preferences;
  }

  /**
   * Créer les préférences par défaut
   */
  async createDefaultPreferences(
    userId: string,
    establishmentId: string
  ): Promise<DashboardPreferences> {
    const docId = `${userId}_${establishmentId}`;
    const docRef = doc(db, this.COLLECTION, docId);

    const now = Timestamp.now();
    const preferences: Omit<DashboardPreferences, 'id'> = {
      userId,
      establishmentId,
      widgets: DEFAULT_WIDGET_CONFIGS.map((config, index) => ({
        ...config,
        id: `widget_${index}`,
      })),
      layout: 'grid',
      columns: 4,
      defaultDateRange: 'month',
      autoRefresh: false,
      refreshInterval: 300,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, {
      ...preferences,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docId,
      ...preferences,
    };
  }

  /**
   * Mettre à jour les préférences
   */
  async updatePreferences(
    userId: string,
    establishmentId: string,
    updates: Partial<Omit<DashboardPreferences, 'id' | 'userId' | 'establishmentId'>>
  ): Promise<void> {
    const docId = `${userId}_${establishmentId}`;
    const docRef = doc(db, this.COLLECTION, docId);

    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Mettre à jour un widget
   * Note: Cette méthode doit recevoir la liste complète des widgets déjà mise à jour
   * depuis le hook (optimistic update pattern)
   */
  async updateWidget(
    userId: string,
    establishmentId: string,
    widgetId: string,
    updates: Partial<WidgetConfig>,
    currentWidgets?: WidgetConfig[]
  ): Promise<void> {
    let updatedWidgets: WidgetConfig[];

    if (currentWidgets) {
      // Utiliser les widgets fournis (optimistic update)
      updatedWidgets = currentWidgets.map(widget =>
        widget.id === widgetId ? { ...widget, ...updates } : widget
      );
    } else {
      // Fallback: re-fetch si pas de widgets fournis
      const preferences = await this.getPreferences(userId, establishmentId);
      if (!preferences) return;

      updatedWidgets = preferences.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, ...updates } : widget
      );
    }

    await this.updatePreferences(userId, establishmentId, {
      widgets: updatedWidgets,
    });
  }

  /**
   * Ajouter un widget
   */
  async addWidget(
    userId: string,
    establishmentId: string,
    widget: Omit<WidgetConfig, 'id'>
  ): Promise<void> {
    const preferences = await this.getPreferences(userId, establishmentId);
    if (!preferences) return;

    const newWidget: WidgetConfig = {
      ...widget,
      id: `widget_${Date.now()}`,
    };

    await this.updatePreferences(userId, establishmentId, {
      widgets: [...preferences.widgets, newWidget],
    });
  }

  /**
   * Supprimer un widget
   */
  async removeWidget(userId: string, establishmentId: string, widgetId: string): Promise<void> {
    const preferences = await this.getPreferences(userId, establishmentId);
    if (!preferences) return;

    const updatedWidgets = preferences.widgets.filter(widget => widget.id !== widgetId);

    await this.updatePreferences(userId, establishmentId, {
      widgets: updatedWidgets,
    });
  }

  /**
   * Réorganiser les widgets
   */
  async reorderWidgets(
    userId: string,
    establishmentId: string,
    widgets: WidgetConfig[]
  ): Promise<void> {
    await this.updatePreferences(userId, establishmentId, { widgets });
  }

  // ============================================================================
  // STATISTIQUES
  // ============================================================================

  /**
   * Calculer la plage de dates selon le filtre
   */
  private getDateRange(
    dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom',
    customDateFrom?: Date,
    customDateTo?: Date
  ): { from: Date; to: Date } {
    const now = new Date();

    switch (dateRange) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'week':
        return {
          from: startOfWeek(now, { weekStartsOn: 1 }),
          to: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case 'month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'quarter':
        return { from: startOfQuarter(now), to: endOfQuarter(now) };
      case 'year':
        return { from: startOfYear(now), to: endOfYear(now) };
      case 'custom':
        return {
          from: customDateFrom || startOfMonth(now),
          to: customDateTo || endOfMonth(now),
        };
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  }

  /**
   * Obtenir les statistiques d'interventions
   * Par défaut récupère TOUTES les interventions (pas de filtre de date)
   * Les interventions sont dans: establishments/{establishmentId}/interventions
   */
  async getInterventionStats(
    establishmentId: string,
    dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom' | 'all' = 'all',
    customDateFrom?: Date,
    customDateTo?: Date
  ): Promise<InterventionStats> {
    // IMPORTANT: Les interventions sont dans une sous-collection de l'établissement
    const interventionsRef = collection(db, 'establishments', establishmentId, 'interventions');

    // Si 'all', pas de filtre de date - récupérer toutes les interventions NON SUPPRIMÉES
    let q;
    if (dateRange === 'all') {
      q = query(interventionsRef, where('isDeleted', '==', false));
    } else {
      const { from, to } = this.getDateRange(dateRange, customDateFrom, customDateTo);
      q = query(
        interventionsRef,
        where('isDeleted', '==', false),
        where('createdAt', '>=', Timestamp.fromDate(from)),
        where('createdAt', '<=', Timestamp.fromDate(to))
      );
    }

    const snapshot = await getDocs(q);
    const interventions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Intervention[];

    // Calculer les statistiques
    const stats: InterventionStats = {
      total: interventions.length,
      byStatus: {},
      byPriority: {},
      byType: {},
      byRoom: {},
      byTechnician: {},
      completionRate: 0,
      avgResponseTime: 0,
      slaCompliance: 0,
      overdue: 0,
      upcoming: 0,
    };

    let totalResponseTime = 0;
    let responseTimeCount = 0;
    let completedCount = 0;
    let slaCompliantCount = 0;
    let slaCount = 0;

    const now = new Date();

    interventions.forEach(intervention => {
      // Par statut
      const status = intervention.status || 'pending';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Par priorité
      const priority = intervention.priority || 'medium';
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

      // Par type
      const type = intervention.type || 'other';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Par chambre
      if (intervention.roomNumber) {
        stats.byRoom[intervention.roomNumber] = (stats.byRoom[intervention.roomNumber] || 0) + 1;
      }

      // Par technicien
      if (intervention.assignedToIds && intervention.assignedToIds.length > 0) {
        intervention.assignedToIds.forEach((techId, index) => {
          const techName = intervention.assignedToNames?.[index] || techId;
          stats.byTechnician[techName] = (stats.byTechnician[techName] || 0) + 1;
        });
      } else if (intervention.assignedToName) {
        stats.byTechnician[intervention.assignedToName] =
          (stats.byTechnician[intervention.assignedToName] || 0) + 1;
      }

      // Taux de complétion
      if (status === InterventionStatus.COMPLETED || status === InterventionStatus.VALIDATED) {
        completedCount++;

        // Temps de réponse moyen
        if (intervention.createdAt && intervention.completedAt) {
          const createdDate =
            intervention.createdAt instanceof Timestamp
              ? intervention.createdAt.toDate()
              : new Date(intervention.createdAt);
          const completedDate =
            intervention.completedAt instanceof Timestamp
              ? intervention.completedAt.toDate()
              : new Date(intervention.completedAt);

          const responseTime = (completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60); // heures
          totalResponseTime += responseTime;
          responseTimeCount++;
        }
      }

      // SLA compliance (simulation - à adapter avec les vrais champs SLA)
      if (intervention.dueDate) {
        slaCount++;
        const deadline =
          intervention.dueDate instanceof Timestamp
            ? intervention.dueDate.toDate()
            : new Date(intervention.dueDate);

        if (intervention.completedAt) {
          const completedDate =
            intervention.completedAt instanceof Timestamp
              ? intervention.completedAt.toDate()
              : new Date(intervention.completedAt);

          if (completedDate <= deadline) {
            slaCompliantCount++;
          }
        }
      }

      // En retard
      if (intervention.dueDate) {
        const dueDate =
          intervention.dueDate instanceof Timestamp
            ? intervention.dueDate.toDate()
            : new Date(intervention.dueDate);

        if (
          dueDate < now &&
          status !== InterventionStatus.COMPLETED &&
          status !== InterventionStatus.VALIDATED &&
          status !== InterventionStatus.CANCELLED
        ) {
          stats.overdue++;
        }
      }

      // À venir (prochaines 24h)
      if (intervention.scheduledAt) {
        const scheduledDate =
          intervention.scheduledAt instanceof Timestamp
            ? intervention.scheduledAt.toDate()
            : new Date(intervention.scheduledAt);

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (
          scheduledDate >= now &&
          scheduledDate <= tomorrow &&
          status !== InterventionStatus.COMPLETED &&
          status !== InterventionStatus.VALIDATED &&
          status !== InterventionStatus.CANCELLED
        ) {
          stats.upcoming++;
        }
      }
    });

    // Calculer les moyennes
    stats.completionRate = stats.total > 0 ? (completedCount / stats.total) * 100 : 0;
    stats.avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    stats.slaCompliance = slaCount > 0 ? (slaCompliantCount / slaCount) * 100 : 0;

    return stats;
  }

  /**
   * Obtenir les données de timeline
   * Par défaut récupère les 30 derniers jours
   * Les interventions sont dans: establishments/{establishmentId}/interventions
   */
  async getTimelineData(
    establishmentId: string,
    dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month'
  ): Promise<TimelineData[]> {
    // IMPORTANT: Les interventions sont dans une sous-collection de l'établissement
    const interventionsRef = collection(db, 'establishments', establishmentId, 'interventions');

    let q;
    if (dateRange === 'all') {
      // Pour 'all', récupérer les 90 derniers jours pour la timeline (interventions NON SUPPRIMÉES)
      const from = new Date();
      from.setDate(from.getDate() - 90);
      q = query(
        interventionsRef,
        where('isDeleted', '==', false),
        where('createdAt', '>=', Timestamp.fromDate(from))
      );
    } else {
      const { from, to } = this.getDateRange(dateRange);
      q = query(
        interventionsRef,
        where('isDeleted', '==', false),
        where('createdAt', '>=', Timestamp.fromDate(from)),
        where('createdAt', '<=', Timestamp.fromDate(to))
      );
    }

    const snapshot = await getDocs(q);
    const interventions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Intervention[];

    // Grouper par jour
    const dataByDate: Record<string, TimelineData> = {};

    interventions.forEach(intervention => {
      if (!intervention.createdAt) return;

      const date =
        intervention.createdAt instanceof Timestamp
          ? intervention.createdAt.toDate()
          : new Date(intervention.createdAt);

      const dateKey = date.toISOString().split('T')[0];

      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = {
          date: dateKey,
          created: 0,
          completed: 0,
          inProgress: 0,
          cancelled: 0,
        };
      }

      dataByDate[dateKey].created++;

      const status = intervention.status || 'pending';
      if (status === 'completed' || status === 'validated') {
        dataByDate[dateKey].completed++;
      } else if (status === 'in_progress') {
        dataByDate[dateKey].inProgress++;
      } else if (status === 'cancelled') {
        dataByDate[dateKey].cancelled++;
      }
    });

    return Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Obtenir les statistiques des chambres
   * Les rooms sont dans: establishments/{establishmentId}/rooms
   */
  async getRoomStats(establishmentId: string): Promise<RoomStats> {
    // IMPORTANT: Les rooms sont dans une sous-collection de l'établissement
    const roomsRef = collection(db, 'establishments', establishmentId, 'rooms');
    const q = query(roomsRef);

    const snapshot = await getDocs(q);
    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    const stats: RoomStats = {
      total: rooms.length,
      byType: {},
      byStatus: {},
      available: 0,
      occupied: 0,
      maintenance: 0,
      blocked: 0,
    };

    rooms.forEach(room => {
      // Par type
      const type = room.type || 'other';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Par statut
      const status = room.status || 'available';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Compteurs
      if (status === 'available') stats.available++;
      else if (status === 'occupied') stats.occupied++;
      else if (status === 'maintenance') stats.maintenance++;
      else if (status === 'blocked') stats.blocked++;
    });

    return stats;
  }

  /**
   * Obtenir les performances des techniciens
   * Par défaut récupère TOUTES les interventions
   * Les interventions sont dans: establishments/{establishmentId}/interventions
   */
  async getTechnicianPerformance(
    establishmentId: string,
    dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' = 'all'
  ): Promise<TechnicianPerformance[]> {
    // IMPORTANT: Les interventions sont dans une sous-collection de l'établissement
    const interventionsRef = collection(db, 'establishments', establishmentId, 'interventions');

    let q;
    if (dateRange === 'all') {
      q = query(interventionsRef, where('isDeleted', '==', false));
    } else {
      const { from, to } = this.getDateRange(dateRange);
      q = query(
        interventionsRef,
        where('isDeleted', '==', false),
        where('createdAt', '>=', Timestamp.fromDate(from)),
        where('createdAt', '<=', Timestamp.fromDate(to))
      );
    }

    const snapshot = await getDocs(q);
    const interventions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Intervention[];

    // Grouper par technicien
    const techStats: Record<string, TechnicianPerformance> = {};

    interventions.forEach(intervention => {
      const techIds =
        intervention.assignedToIds || (intervention.assignedTo ? [intervention.assignedTo] : []);
      const techNames =
        intervention.assignedToNames ||
        (intervention.assignedToName ? [intervention.assignedToName] : []);

      techIds.forEach((techId, index) => {
        const techName = techNames[index] || techId;

        if (!techStats[techId]) {
          techStats[techId] = {
            userId: techId,
            name: techName,
            totalAssigned: 0,
            completed: 0,
            inProgress: 0,
            avgCompletionTime: 0,
            completionRate: 0,
          };
        }

        techStats[techId].totalAssigned++;

        const status = intervention.status || 'pending';
        if (status === 'completed' || status === 'validated') {
          techStats[techId].completed++;
        } else if (status === 'in_progress') {
          techStats[techId].inProgress++;
        }
      });
    });

    // Calculer les moyennes
    Object.values(techStats).forEach(tech => {
      tech.completionRate =
        tech.totalAssigned > 0 ? (tech.completed / tech.totalAssigned) * 100 : 0;
    });

    return Object.values(techStats).sort((a, b) => b.totalAssigned - a.totalAssigned);
  }

  /**
   * Obtenir les interventions récentes (dernières 10)
   */
  async getRecentInterventions(
    establishmentId: string,
    limit: number = 10
  ): Promise<Intervention[]> {
    const interventionsRef = collection(db, 'establishments', establishmentId, 'interventions');
    const q = query(
      interventionsRef,
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Intervention[];
  }

  /**
   * Obtenir les interventions en retard
   */
  async getOverdueInterventions(establishmentId: string): Promise<Intervention[]> {
    const interventionsRef = collection(db, 'establishments', establishmentId, 'interventions');
    const now = new Date();

    // Récupérer les interventions non terminées avec une date d'échéance
    const q = query(
      interventionsRef,
      where('isDeleted', '==', false),
      where('status', 'not-in', ['completed', 'validated', 'cancelled'])
    );

    const snapshot = await getDocs(q);
    const interventions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Intervention[];

    // Filtrer celles qui sont en retard
    return interventions
      .filter(intervention => {
        if (!intervention.dueDate) return false;
        const dueDate =
          intervention.dueDate instanceof Timestamp
            ? intervention.dueDate.toDate()
            : new Date(intervention.dueDate);
        return dueDate < now;
      })
      .sort((a, b) => {
        const dueDateA = a.dueDate as Date | Timestamp | string | undefined;
        const dueDateB = b.dueDate as Date | Timestamp | string | undefined;
        const dateA =
          dueDateA instanceof Timestamp ? dueDateA.toDate() : new Date(dueDateA as string | Date);
        const dateB =
          dueDateB instanceof Timestamp ? dueDateB.toDate() : new Date(dueDateB as string | Date);
        return dateA.getTime() - dateB.getTime(); // Plus ancien en premier
      });
  }

  /**
   * Obtenir les interventions à venir (prochaines 24h)
   */
  async getUpcomingInterventions(establishmentId: string): Promise<Intervention[]> {
    const interventionsRef = collection(db, 'establishments', establishmentId, 'interventions');
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const q = query(
      interventionsRef,
      where('isDeleted', '==', false),
      where('status', 'not-in', ['completed', 'validated', 'cancelled']),
      where('scheduledAt', '>=', Timestamp.fromDate(now)),
      where('scheduledAt', '<=', Timestamp.fromDate(tomorrow))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Intervention[];
  }

  /**
   * Obtenir le taux de résolution (créées vs complétées sur une période)
   */
  async getResolutionRate(
    establishmentId: string,
    period: 'today' | 'week' | 'month' = 'week'
  ): Promise<{ created: number; completed: number; rate: number }> {
    const interventionsRef = collection(db, 'establishments', establishmentId, 'interventions');
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
    }

    // Interventions créées dans la période
    const createdQuery = query(
      interventionsRef,
      where('isDeleted', '==', false),
      where('createdAt', '>=', Timestamp.fromDate(startDate))
    );
    const createdSnapshot = await getDocs(createdQuery);
    const created = createdSnapshot.size;

    // Interventions complétées dans la période
    const completedQuery = query(
      interventionsRef,
      where('isDeleted', '==', false),
      where('status', 'in', ['completed', 'validated']),
      where('completedAt', '>=', Timestamp.fromDate(startDate))
    );
    const completedSnapshot = await getDocs(completedQuery);
    const completed = completedSnapshot.size;

    const rate = created > 0 ? Math.round((completed / created) * 100) : 0;

    return { created, completed, rate };
  }

  /**
   * Obtenir les interventions par étage/bâtiment
   * Récupère d'abord les chambres pour faire la correspondance avec roomNumber
   */
  async getInterventionsByLocation(
    establishmentId: string
  ): Promise<{ byFloor: Record<string, number>; byBuilding: Record<string, number> }> {
    // 1. Récupérer toutes les chambres pour avoir la correspondance roomNumber -> floor/building
    const roomsRef = collection(db, 'establishments', establishmentId, 'rooms');
    const roomsSnapshot = await getDocs(roomsRef);

    const roomsMap = new Map<string, { floor: number; building?: string }>();
    roomsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      roomsMap.set(data.number, {
        floor: data.floor,
        building: data.building,
      });
    });

    // 2. Récupérer les interventions
    const interventionsRef = collection(db, 'establishments', establishmentId, 'interventions');
    const q = query(interventionsRef, where('isDeleted', '==', false));

    const snapshot = await getDocs(q);
    const byFloor: Record<string, number> = {};
    const byBuilding: Record<string, number> = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();

      // Essayer de récupérer l'étage depuis:
      // 1. Le champ floor de l'intervention (si rempli)
      // 2. La correspondance avec la chambre via roomNumber
      let floor: number | undefined = data.floor;
      let building: string | undefined = data.building;

      // Si pas de floor mais qu'on a un roomNumber, chercher dans les chambres
      if (floor === undefined && data.roomNumber) {
        const roomInfo = roomsMap.get(data.roomNumber);
        if (roomInfo) {
          floor = roomInfo.floor;
          if (!building) {
            building = roomInfo.building;
          }
        }
      }

      // Par étage
      const floorLabel = floor !== undefined ? `Étage ${floor}` : 'Non défini';
      byFloor[floorLabel] = (byFloor[floorLabel] || 0) + 1;

      // Par bâtiment
      const buildingLabel = building || 'Principal';
      byBuilding[buildingLabel] = (byBuilding[buildingLabel] || 0) + 1;
    });

    return { byFloor, byBuilding };
  }

  /**
   * Obtenir les interventions en attente de validation
   */
  async getPendingValidationInterventions(establishmentId: string): Promise<Intervention[]> {
    const interventionsRef = collection(db, 'establishments', establishmentId, 'interventions');
    const q = query(
      interventionsRef,
      where('isDeleted', '==', false),
      where('status', '==', 'completed'),
      orderBy('completedAt', 'desc'),
      firestoreLimit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Intervention[];
  }

  /**
   * Obtenir les chambres avec le plus d'interventions (chambres problématiques)
   */
  async getProblematicRooms(
    establishmentId: string,
    limit: number = 5
  ): Promise<{ roomNumber: string; count: number; lastIntervention: Date | null }[]> {
    const interventionsRef = collection(db, 'establishments', establishmentId, 'interventions');
    const q = query(interventionsRef, where('isDeleted', '==', false));

    const snapshot = await getDocs(q);
    const roomCounts: Record<string, { count: number; lastDate: Date | null }> = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const roomNumber = data.roomNumber;
      if (!roomNumber) return;

      if (!roomCounts[roomNumber]) {
        roomCounts[roomNumber] = { count: 0, lastDate: null };
      }
      roomCounts[roomNumber].count++;

      // Tracker la dernière intervention
      const createdAt =
        data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt);
      if (!roomCounts[roomNumber].lastDate || createdAt > roomCounts[roomNumber].lastDate) {
        roomCounts[roomNumber].lastDate = createdAt;
      }
    });

    // Trier par nombre d'interventions et limiter
    return Object.entries(roomCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([roomNumber, data]) => ({
        roomNumber,
        count: data.count,
        lastIntervention: data.lastDate,
      }));
  }

  /**
   * Obtenir les interventions planifiées pour aujourd'hui
   */
  async getTodayScheduledInterventions(establishmentId: string): Promise<Intervention[]> {
    const interventionsRef = collection(db, 'establishments', establishmentId, 'interventions');
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const q = query(
      interventionsRef,
      where('isDeleted', '==', false),
      where('status', 'not-in', ['completed', 'validated', 'cancelled']),
      where('scheduledAt', '>=', Timestamp.fromDate(todayStart)),
      where('scheduledAt', '<=', Timestamp.fromDate(todayEnd))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Intervention[];
  }
}

export default new DashboardService();
