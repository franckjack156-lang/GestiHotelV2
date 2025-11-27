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

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as DashboardPreferences;
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
   */
  async getInterventionStats(
    establishmentId: string,
    dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom' = 'month',
    customDateFrom?: Date,
    customDateTo?: Date
  ): Promise<InterventionStats> {
    const { from, to } = this.getDateRange(dateRange, customDateFrom, customDateTo);

    const interventionsRef = collection(db, 'interventions');
    const q = query(
      interventionsRef,
      where('establishmentId', '==', establishmentId),
      where('createdAt', '>=', Timestamp.fromDate(from)),
      where('createdAt', '<=', Timestamp.fromDate(to))
    );

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
   */
  async getTimelineData(
    establishmentId: string,
    dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<TimelineData[]> {
    const { from, to } = this.getDateRange(dateRange);

    const interventionsRef = collection(db, 'interventions');
    const q = query(
      interventionsRef,
      where('establishmentId', '==', establishmentId),
      where('createdAt', '>=', Timestamp.fromDate(from)),
      where('createdAt', '<=', Timestamp.fromDate(to))
    );

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
   */
  async getRoomStats(establishmentId: string): Promise<RoomStats> {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('establishmentId', '==', establishmentId));

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
   */
  async getTechnicianPerformance(
    establishmentId: string,
    dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<TechnicianPerformance[]> {
    const { from, to } = this.getDateRange(dateRange);

    const interventionsRef = collection(db, 'interventions');
    const q = query(
      interventionsRef,
      where('establishmentId', '==', establishmentId),
      where('createdAt', '>=', Timestamp.fromDate(from)),
      where('createdAt', '<=', Timestamp.fromDate(to))
    );

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
}

export default new DashboardService();
