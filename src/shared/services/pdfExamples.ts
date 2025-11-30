/**
 * ============================================================================
 * PDF GENERATION EXAMPLES
 * ============================================================================
 *
 * Exemples d'utilisation du service PDF pour différents cas d'usage
 */

import {
  generateInterventionsPDF,
  generateInterventionDetailPDF,
  generateMonthlyReportPDF,
  downloadPDF,
  type MonthlyReportData,
} from './pdfService';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// EXEMPLE 1 : Export liste d'interventions filtrées
// ============================================================================

export const exportFilteredInterventions = async (
  interventions: Intervention[],
  filterLabel: string
) => {
  const blob = await generateInterventionsPDF(interventions, {
    title: 'Interventions',
    subtitle: `${filterLabel} - ${interventions.length} intervention(s)`,
    orientation: 'landscape',
  });

  const filename = `interventions_${filterLabel.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  downloadPDF(blob, filename);
};

// ============================================================================
// EXEMPLE 2 : Export détail intervention avec contexte
// ============================================================================

export const exportInterventionWithContext = async (
  intervention: Intervention,
  establishmentName: string
) => {
  const blob = await generateInterventionDetailPDF(intervention, {
    title: `${establishmentName} - Intervention`,
    subtitle: `${intervention.reference || intervention.id.slice(0, 8)} - ${intervention.title}`,
  });

  const filename = `intervention_${intervention.reference || intervention.id.slice(0, 8)}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  downloadPDF(blob, filename);
};

// ============================================================================
// EXEMPLE 3 : Génération rapport mensuel à partir des données
// ============================================================================

export const generateMonthlyReportFromInterventions = async (
  interventions: Intervention[],
  month: string,
  year: number
) => {
  // Calculer les statistiques
  const totalInterventions = interventions.length;
  const completedInterventions = interventions.filter(
    i => i.status === 'completed' || i.status === 'validated'
  ).length;
  const pendingInterventions = interventions.filter(
    i => i.status === 'pending' || i.status === 'assigned'
  ).length;

  // Calculer temps moyen de résolution
  const completedWithDuration = interventions.filter(
    i => i.actualDuration && (i.status === 'completed' || i.status === 'validated')
  );
  const averageResolutionTime =
    completedWithDuration.length > 0
      ? Math.round(
          completedWithDuration.reduce((acc, i) => acc + (i.actualDuration || 0), 0) /
            completedWithDuration.length
        )
      : 0;

  // Répartition par statut
  const byStatus: Record<string, number> = {};
  interventions.forEach(i => {
    byStatus[i.status] = (byStatus[i.status] || 0) + 1;
  });

  // Répartition par priorité
  const byPriority: Record<string, number> = {};
  interventions.forEach(i => {
    byPriority[i.priority] = (byPriority[i.priority] || 0) + 1;
  });

  // Répartition par type
  const byType: Record<string, number> = {};
  interventions.forEach(i => {
    byType[i.type] = (byType[i.type] || 0) + 1;
  });

  // Top techniciens
  const technicianStats: Record<string, number> = {};
  interventions
    .filter(i => i.assignedToName && (i.status === 'completed' || i.status === 'validated'))
    .forEach(i => {
      const name = i.assignedToName!;
      technicianStats[name] = (technicianStats[name] || 0) + 1;
    });

  const topTechnicians = Object.entries(technicianStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Top localisations
  const locationStats: Record<string, number> = {};
  interventions.forEach(i => {
    const location = i.roomNumber ? `Chambre ${i.roomNumber}` : i.location || 'Non spécifié';
    locationStats[location] = (locationStats[location] || 0) + 1;
  });

  const topLocations = Object.entries(locationStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([location, count]) => ({ location, count }));

  // Construire les données du rapport
  const reportData: MonthlyReportData = {
    period: `${month} ${year}`,
    totalInterventions,
    completedInterventions,
    pendingInterventions,
    averageResolutionTime,
    byStatus,
    byPriority,
    byType,
    topTechnicians,
    topLocations,
  };

  // Générer le PDF
  const blob = await generateMonthlyReportPDF(reportData, {
    title: 'Rapport mensuel des interventions',
    subtitle: `${month} ${year}`,
  });

  const filename = `rapport_mensuel_${month.toLowerCase()}_${year}.pdf`;
  downloadPDF(blob, filename);
};

// ============================================================================
// EXEMPLE 4 : Export interventions urgentes
// ============================================================================

export const exportUrgentInterventions = async (interventions: Intervention[]) => {
  const urgentInterventions = interventions.filter(
    i => i.isUrgent || i.priority === 'critical' || i.priority === 'urgent'
  );

  const blob = await generateInterventionsPDF(urgentInterventions, {
    title: 'Interventions urgentes',
    subtitle: `${urgentInterventions.length} intervention(s) nécessitant une attention immédiate`,
    orientation: 'landscape',
  });

  const filename = `interventions_urgentes_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
  downloadPDF(blob, filename);
};

// ============================================================================
// EXEMPLE 5 : Export interventions par technicien
// ============================================================================

export const exportInterventionsByTechnician = async (
  interventions: Intervention[],
  technicianName: string
) => {
  const technicianInterventions = interventions.filter(i => i.assignedToName === technicianName);

  const blob = await generateInterventionsPDF(technicianInterventions, {
    title: `Interventions - ${technicianName}`,
    subtitle: `${technicianInterventions.length} intervention(s)`,
    orientation: 'landscape',
  });

  const filename = `interventions_${technicianName.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  downloadPDF(blob, filename);
};

// ============================================================================
// EXEMPLE 6 : Export interventions par période
// ============================================================================

export const exportInterventionsByPeriod = async (
  interventions: Intervention[],
  startDate: Date,
  endDate: Date
) => {
  const blob = await generateInterventionsPDF(interventions, {
    title: 'Interventions par période',
    subtitle: `Du ${format(startDate, 'dd/MM/yyyy', { locale: fr })} au ${format(endDate, 'dd/MM/yyyy', { locale: fr })} - ${interventions.length} intervention(s)`,
    orientation: 'landscape',
  });

  const filename = `interventions_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.pdf`;
  downloadPDF(blob, filename);
};

// ============================================================================
// EXEMPLE 7 : Export interventions par chambre
// ============================================================================

export const exportInterventionsByRoom = async (
  interventions: Intervention[],
  roomNumber: string
) => {
  const roomInterventions = interventions.filter(i => i.roomNumber === roomNumber);

  const blob = await generateInterventionsPDF(roomInterventions, {
    title: `Historique des interventions - Chambre ${roomNumber}`,
    subtitle: `${roomInterventions.length} intervention(s)`,
    orientation: 'landscape',
  });

  const filename = `interventions_chambre_${roomNumber}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  downloadPDF(blob, filename);
};

// ============================================================================
// EXPORT
// ============================================================================

export default {
  exportFilteredInterventions,
  exportInterventionWithContext,
  generateMonthlyReportFromInterventions,
  exportUrgentInterventions,
  exportInterventionsByTechnician,
  exportInterventionsByPeriod,
  exportInterventionsByRoom,
};
