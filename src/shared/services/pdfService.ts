/**
 * ============================================================================
 * PDF SERVICE - GÉNÉRATION DE RAPPORTS PDF
 * ============================================================================
 *
 * Service pour générer des rapports PDF avec jsPDF et jspdf-autotable
 * - Export liste d'interventions
 * - Export détail d'intervention
 * - Export rapport mensuel
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Déclarer le module jsPDF avec autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface PDFOptions {
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  logo?: string;
}

export interface MonthlyReportData {
  period: string;
  totalInterventions: number;
  completedInterventions: number;
  pendingInterventions: number;
  averageResolutionTime: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  topTechnicians?: Array<{ name: string; count: number }>;
  topLocations?: Array<{ location: string; count: number }>;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  assigned: 'Assignée',
  in_progress: 'En cours',
  on_hold: 'En pause',
  completed: 'Terminée',
  validated: 'Validée',
  cancelled: 'Annulée',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  urgent: 'Urgente',
  critical: 'Critique',
};

const TYPE_LABELS: Record<string, string> = {
  maintenance: 'Maintenance',
  repair: 'Réparation',
  installation: 'Installation',
  inspection: 'Inspection',
  cleaning: 'Nettoyage',
  other: 'Autre',
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Ajoute l'en-tête du PDF
 */
const addHeader = (doc: jsPDF, options: PDFOptions) => {
  const pageWidth = doc.internal.pageSize.width;

  // Logo (si fourni)
  if (options.logo) {
    try {
      doc.addImage(options.logo, 'PNG', 15, 10, 30, 30);
    } catch (error) {
      console.warn('Logo non chargé:', error);
    }
  }

  // Titre
  doc.setFontSize(20);
  doc.setTextColor(COLORS.primary);
  doc.text(options.title, options.logo ? 50 : 15, 25);

  // Sous-titre
  if (options.subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(COLORS.textLight);
    doc.text(options.subtitle, options.logo ? 50 : 15, 33);
  }

  // Date de génération (en haut à droite)
  doc.setFontSize(9);
  doc.setTextColor(COLORS.textLight);
  const dateText = `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`;
  doc.text(dateText, pageWidth - 15, 15, { align: 'right' });

  // Ligne de séparation
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(15, 45, pageWidth - 15, 45);
};

/**
 * Ajoute le pied de page du PDF
 */
const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  // Ligne de séparation
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);

  // Numéro de page
  doc.setFontSize(9);
  doc.setTextColor(COLORS.textLight);
  doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth / 2, pageHeight - 10, {
    align: 'center',
  });

  // Texte "Généré avec GestiHotel"
  doc.text('Généré avec GestiHotel', pageWidth - 15, pageHeight - 10, { align: 'right' });
};

/**
 * Formate une date Firestore
 */
const formatFirebaseDate = (timestamp: any): string => {
  if (!timestamp) return '-';

  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd/MM/yyyy', { locale: fr });
  } catch {
    return '-';
  }
};

/**
 * Formate une date et heure Firestore
 */
const formatFirebaseDateTime = (timestamp: any): string => {
  if (!timestamp) return '-';

  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return '-';
  }
};

// ============================================================================
// GÉNÉRATION PDF - LISTE D'INTERVENTIONS
// ============================================================================

/**
 * Génère un PDF avec la liste des interventions
 */
export const generateInterventionsPDF = async (
  interventions: Intervention[],
  options: PDFOptions
): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: options.orientation || 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // En-tête
  addHeader(doc, options);

  // Tableau des interventions
  const tableData = interventions.map(intervention => [
    intervention.reference || intervention.id.slice(0, 8),
    intervention.title.substring(0, 40) + (intervention.title.length > 40 ? '...' : ''),
    STATUS_LABELS[intervention.status] || intervention.status,
    PRIORITY_LABELS[intervention.priority] || intervention.priority,
    TYPE_LABELS[intervention.type] || intervention.type,
    intervention.roomNumber || intervention.location || '-',
    intervention.assignedToName || '-',
    formatFirebaseDate(intervention.createdAt),
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Réf', 'Titre', 'Statut', 'Priorité', 'Type', 'Localisation', 'Assigné à', 'Date']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: '#ffffff',
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: '#f8fafc',
    },
    margin: { top: 55, left: 15, right: 15, bottom: 25 },
    didDrawPage: data => {
      // Pied de page sur chaque page
      const pageCount = doc.internal.pages.length - 1;
      addFooter(doc, data.pageNumber, pageCount);
    },
  });

  // Statistiques en bas de la dernière page
  const finalY = (doc as any).lastAutoTable.finalY || 55;

  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.text(`Total: ${interventions.length} intervention(s)`, 15, finalY + 10);

  // Retourner le blob
  return doc.output('blob');
};

// ============================================================================
// GÉNÉRATION PDF - DÉTAIL D'INTERVENTION
// ============================================================================

/**
 * Génère un PDF avec le détail d'une intervention
 */
export const generateInterventionDetailPDF = async (
  intervention: Intervention,
  options: PDFOptions
): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.width;
  let currentY = 55;

  // En-tête
  addHeader(doc, options);

  // Informations principales
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text('Informations générales', 15, currentY);
  currentY += 10;

  // Créer un tableau pour les informations
  const infoData = [
    ['Référence', intervention.reference || intervention.id.slice(0, 8)],
    ['Titre', intervention.title],
    ['Description', intervention.description || '-'],
    ['Type', TYPE_LABELS[intervention.type] || intervention.type],
    ['Catégorie', intervention.category || '-'],
    ['Statut', STATUS_LABELS[intervention.status] || intervention.status],
    ['Priorité', PRIORITY_LABELS[intervention.priority] || intervention.priority],
    [
      'Localisation',
      intervention.roomNumber ? `Chambre ${intervention.roomNumber}` : intervention.location || '-',
    ],
  ];

  if (intervention.building) {
    infoData.push(['Bâtiment', intervention.building]);
  }
  if (intervention.floor) {
    infoData.push(['Étage', intervention.floor.toString()]);
  }

  autoTable(doc, {
    startY: currentY,
    body: infoData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: COLORS.textLight },
      1: { cellWidth: 'auto', textColor: COLORS.text },
    },
    margin: { left: 15, right: 15 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Section Assignation
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text('Assignation et planification', 15, currentY);
  currentY += 10;

  const assignmentData = [
    ['Assigné à', intervention.assignedToName || '-'],
    ['Créé par', intervention.createdByName || '-'],
    ['Date de création', formatFirebaseDateTime(intervention.createdAt)],
  ];

  if (intervention.scheduledAt) {
    assignmentData.push(['Planifié pour', formatFirebaseDateTime(intervention.scheduledAt)]);
  }
  if (intervention.startedAt) {
    assignmentData.push(['Démarré le', formatFirebaseDateTime(intervention.startedAt)]);
  }
  if (intervention.completedAt) {
    assignmentData.push(['Terminé le', formatFirebaseDateTime(intervention.completedAt)]);
  }
  if (intervention.estimatedDuration) {
    assignmentData.push(['Durée estimée', `${intervention.estimatedDuration} min`]);
  }
  if (intervention.actualDuration) {
    assignmentData.push(['Durée réelle', `${intervention.actualDuration} min`]);
  }

  autoTable(doc, {
    startY: currentY,
    body: assignmentData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: COLORS.textLight },
      1: { cellWidth: 'auto', textColor: COLORS.text },
    },
    margin: { left: 15, right: 15 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Notes internes (si présentes)
  if (intervention.internalNotes) {
    doc.setFontSize(14);
    doc.setTextColor(COLORS.primary);
    doc.text('Notes internes', 15, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    const notesLines = doc.splitTextToSize(intervention.internalNotes, pageWidth - 30);
    doc.text(notesLines, 15, currentY);
    currentY += notesLines.length * 5 + 10;
  }

  // Notes de résolution (si présentes)
  if (intervention.resolutionNotes) {
    doc.setFontSize(14);
    doc.setTextColor(COLORS.primary);
    doc.text('Notes de résolution', 15, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    const notesLines = doc.splitTextToSize(intervention.resolutionNotes, pageWidth - 30);
    doc.text(notesLines, 15, currentY);
    currentY += notesLines.length * 5 + 10;
  }

  // Pied de page
  addFooter(doc, 1, 1);

  // Retourner le blob
  return doc.output('blob');
};

// ============================================================================
// GÉNÉRATION PDF - RAPPORT MENSUEL
// ============================================================================

/**
 * Génère un PDF avec un rapport mensuel
 */
export const generateMonthlyReportPDF = async (
  data: MonthlyReportData,
  options: PDFOptions
): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let currentY = 55;

  // En-tête
  addHeader(doc, options);

  // Résumé en cartes
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text('Résumé', 15, currentY);
  currentY += 12;

  // Statistiques principales
  const statsData = [
    ['Total interventions', data.totalInterventions.toString()],
    ['Interventions terminées', data.completedInterventions.toString()],
    ['Interventions en attente', data.pendingInterventions.toString()],
    ['Temps moyen de résolution', `${data.averageResolutionTime} min`],
    [
      'Taux de complétion',
      `${
        data.totalInterventions > 0
          ? Math.round((data.completedInterventions / data.totalInterventions) * 100)
          : 0
      }%`,
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    body: statsData,
    theme: 'plain',
    styles: {
      fontSize: 11,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80, textColor: COLORS.textLight },
      1: { cellWidth: 'auto', textColor: COLORS.text, fontStyle: 'bold', fontSize: 12 },
    },
    margin: { left: 15, right: 15 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Répartition par statut
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text('Répartition par statut', 15, currentY);
  currentY += 10;

  const statusData = Object.entries(data.byStatus).map(([status, count]) => [
    STATUS_LABELS[status] || status,
    count.toString(),
  ]);

  autoTable(doc, {
    startY: currentY,
    body: statusData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
    },
    styles: {
      fontSize: 10,
    },
    margin: { left: 15, right: 15 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Répartition par priorité
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text('Répartition par priorité', 15, currentY);
  currentY += 10;

  const priorityData = Object.entries(data.byPriority).map(([priority, count]) => [
    PRIORITY_LABELS[priority] || priority,
    count.toString(),
  ]);

  autoTable(doc, {
    startY: currentY,
    body: priorityData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
    },
    styles: {
      fontSize: 10,
    },
    margin: { left: 15, right: 15 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Répartition par type
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text('Répartition par type', 15, currentY);
  currentY += 10;

  const typeData = Object.entries(data.byType).map(([type, count]) => [
    TYPE_LABELS[type] || type,
    count.toString(),
  ]);

  autoTable(doc, {
    startY: currentY,
    body: typeData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
    },
    styles: {
      fontSize: 10,
    },
    margin: { left: 15, right: 15 },
  });

  // Top techniciens (si disponible)
  if (data.topTechnicians && data.topTechnicians.length > 0) {
    currentY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.setTextColor(COLORS.primary);
    doc.text('Top 5 techniciens', 15, currentY);
    currentY += 10;

    const techData = data.topTechnicians.map(tech => [tech.name, tech.count.toString()]);

    autoTable(doc, {
      startY: currentY,
      head: [['Technicien', 'Interventions terminées']],
      body: techData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
      },
      styles: {
        fontSize: 10,
      },
      margin: { left: 15, right: 15 },
    });
  }

  // Pied de page
  addFooter(doc, 1, 1);

  // Retourner le blob
  return doc.output('blob');
};

// ============================================================================
// UTILITAIRE - TÉLÉCHARGEMENT
// ============================================================================

/**
 * Télécharge un blob PDF
 */
export const downloadPDF = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default {
  generateInterventionsPDF,
  generateInterventionDetailPDF,
  generateMonthlyReportPDF,
  downloadPDF,
};
