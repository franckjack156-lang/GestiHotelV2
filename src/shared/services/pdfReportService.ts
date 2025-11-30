/**
 * ============================================================================
 * PDF REPORT SERVICE
 * ============================================================================
 *
 * Service pour générer des rapports PDF automatiques
 * - Rapports d'interventions
 * - Rapports analytiques
 * - Rapports SLA
 * - Rapports d'activité
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/core/config/firebase';
import { logger } from '@/core/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export type ReportType =
  | 'interventions_summary'
  | 'interventions_detailed'
  | 'sla_compliance'
  | 'technician_performance'
  | 'room_statistics'
  | 'activity_log'
  | 'monthly_recap'
  | 'custom';

export type ReportFormat = 'pdf' | 'html';

export type ReportFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export interface ReportConfig {
  id?: string;
  establishmentId: string;
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  frequency: ReportFrequency;

  // Filtres
  filters?: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    relativePeriod?:
      | 'today'
      | 'yesterday'
      | 'this_week'
      | 'last_week'
      | 'this_month'
      | 'last_month'
      | 'this_year';
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    roomIds?: string[];
    categories?: string[];
  };

  // Options de contenu
  content?: {
    includeCharts?: boolean;
    includeDetails?: boolean;
    includeSummary?: boolean;
    includeComments?: boolean;
    includePhotos?: boolean;
    groupBy?: 'status' | 'priority' | 'technician' | 'room' | 'category' | 'date';
    sortBy?: 'date' | 'priority' | 'status';
    sortOrder?: 'asc' | 'desc';
  };

  // Envoi par email
  emailConfig?: {
    enabled: boolean;
    recipients: string[];
    subject?: string;
    message?: string;
  };

  // Planification
  schedule?: {
    enabled: boolean;
    time?: string; // HH:mm
    dayOfWeek?: number; // 0-6 (dimanche-samedi)
    dayOfMonth?: number; // 1-31
    nextRun?: Timestamp;
    lastRun?: Timestamp;
  };

  // Métadonnées
  createdAt?: Timestamp;
  createdBy?: string;
  updatedAt?: Timestamp;
  isActive: boolean;
}

export interface GeneratedReport {
  id?: string;
  configId: string;
  establishmentId: string;
  type: ReportType;
  format: ReportFormat;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  pageCount?: number;
  generatedAt: Timestamp;
  generatedBy?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  emailsSent?: string[];
  metadata?: Record<string, unknown>;
}

export interface ReportData {
  title: string;
  subtitle?: string;
  establishmentName: string;
  generatedAt: Date;
  period?: {
    start: Date;
    end: Date;
  };
  summary?: ReportSummary;
  sections: ReportSection[];
  footer?: string;
}

export interface ReportSummary {
  totalInterventions?: number;
  completedInterventions?: number;
  pendingInterventions?: number;
  averageResolutionTime?: number;
  slaCompliance?: number;
  topCategories?: Array<{ name: string; count: number }>;
  topTechnicians?: Array<{ name: string; completed: number }>;
}

export interface ReportSection {
  title: string;
  type: 'table' | 'chart' | 'text' | 'list' | 'stats';
  data: unknown;
}

// ============================================================================
// HELPERS - Calcul des périodes
// ============================================================================

const getDateRange = (relativePeriod: string): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (relativePeriod) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday,
        end: new Date(today.getTime() - 1),
      };
    case 'this_week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
      return {
        start: startOfWeek,
        end: now,
      };
    case 'last_week':
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 6);
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(today.getDate() - today.getDay());
      return {
        start: lastWeekStart,
        end: lastWeekEnd,
      };
    case 'this_month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
      };
    case 'last_month':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    case 'this_year':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: now,
      };
    default:
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
      };
  }
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================================================
// GÉNÉRATION HTML pour PDF
// ============================================================================

const generateReportStyles = (): string => `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #333;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3b82f6;
    }
    .header h1 {
      font-size: 24px;
      color: #1e40af;
      margin-bottom: 5px;
    }
    .header .subtitle {
      font-size: 14px;
      color: #6b7280;
    }
    .header .meta {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 10px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .summary-card .value {
      font-size: 28px;
      font-weight: bold;
      color: #1e40af;
    }
    .summary-card .label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
    }
    .section {
      margin-bottom: 25px;
    }
    .section h2 {
      font-size: 16px;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #475569;
      font-size: 11px;
      text-transform: uppercase;
    }
    tr:hover {
      background: #f8fafc;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
    }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-in_progress { background: #dbeafe; color: #1e40af; }
    .status-completed { background: #d1fae5; color: #065f46; }
    .status-cancelled { background: #f3f4f6; color: #6b7280; }
    .priority-low { color: #22c55e; }
    .priority-normal { color: #3b82f6; }
    .priority-high { color: #f97316; }
    .priority-urgent { color: #ef4444; }
    .priority-critical { color: #dc2626; font-weight: bold; }
    .chart-container {
      margin: 20px 0;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .bar-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .bar-label {
      width: 120px;
      font-size: 11px;
    }
    .bar-track {
      flex: 1;
      height: 20px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: #3b82f6;
      border-radius: 4px;
      transition: width 0.3s;
    }
    .bar-value {
      width: 50px;
      text-align: right;
      font-weight: 500;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }
    .page-break {
      page-break-before: always;
    }
    @media print {
      body { padding: 0; }
      .summary { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
`;

const generateSummaryCards = (summary: ReportSummary): string => {
  const cards: string[] = [];

  if (summary.totalInterventions !== undefined) {
    cards.push(`
      <div class="summary-card">
        <div class="value">${summary.totalInterventions}</div>
        <div class="label">Total interventions</div>
      </div>
    `);
  }

  if (summary.completedInterventions !== undefined) {
    cards.push(`
      <div class="summary-card">
        <div class="value">${summary.completedInterventions}</div>
        <div class="label">Terminées</div>
      </div>
    `);
  }

  if (summary.slaCompliance !== undefined) {
    cards.push(`
      <div class="summary-card">
        <div class="value">${summary.slaCompliance}%</div>
        <div class="label">Conformité SLA</div>
      </div>
    `);
  }

  if (summary.averageResolutionTime !== undefined) {
    const hours = Math.floor(summary.averageResolutionTime / 60);
    const minutes = summary.averageResolutionTime % 60;
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    cards.push(`
      <div class="summary-card">
        <div class="value">${timeStr}</div>
        <div class="label">Temps moyen résolution</div>
      </div>
    `);
  }

  return `<div class="summary">${cards.join('')}</div>`;
};

const generateTableSection = (title: string, columns: string[], rows: string[][]): string => {
  const headerCells = columns.map(col => `<th>${col}</th>`).join('');
  const bodyRows = rows
    .map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`)
    .join('');

  return `
    <div class="section">
      <h2>${title}</h2>
      <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;
};

const generateBarChart = (
  title: string,
  data: Array<{ label: string; value: number; max?: number }>
): string => {
  const maxValue = Math.max(...data.map(d => d.max || d.value));

  const bars = data
    .map(item => {
      const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
      return `
      <div class="bar-item">
        <div class="bar-label">${item.label}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="bar-value">${item.value}</div>
      </div>
    `;
    })
    .join('');

  return `
    <div class="section">
      <h2>${title}</h2>
      <div class="chart-container">
        <div class="bar-chart">${bars}</div>
      </div>
    </div>
  `;
};

// ============================================================================
// GÉNÉRATION DES RAPPORTS
// ============================================================================

export const generateReportHTML = (data: ReportData): string => {
  let html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      ${generateReportStyles()}
    </head>
    <body>
      <div class="header">
        <h1>${data.title}</h1>
        ${data.subtitle ? `<div class="subtitle">${data.subtitle}</div>` : ''}
        <div class="meta">
          ${data.establishmentName}<br>
          Généré le ${formatDateTime(data.generatedAt)}
          ${data.period ? `<br>Période: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}` : ''}
        </div>
      </div>
  `;

  // Summary
  if (data.summary) {
    html += generateSummaryCards(data.summary);
  }

  // Sections
  for (const section of data.sections) {
    switch (section.type) {
      case 'table':
        const tableData = section.data as { columns: string[]; rows: string[][] };
        html += generateTableSection(section.title, tableData.columns, tableData.rows);
        break;
      case 'chart':
        const chartData = section.data as Array<{ label: string; value: number }>;
        html += generateBarChart(section.title, chartData);
        break;
      case 'text':
        html += `<div class="section"><h2>${section.title}</h2><p>${section.data}</p></div>`;
        break;
      case 'list':
        const listData = section.data as string[];
        html += `
          <div class="section">
            <h2>${section.title}</h2>
            <ul>${listData.map(item => `<li>${item}</li>`).join('')}</ul>
          </div>
        `;
        break;
      case 'stats':
        const statsData = section.data as Array<{ label: string; value: string | number }>;
        html += `
          <div class="section">
            <h2>${section.title}</h2>
            <div class="stats-grid">
              ${statsData
                .map(
                  stat => `
                <div class="stat-item">
                  <span class="stat-label">${stat.label}:</span>
                  <span class="stat-value">${stat.value}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `;
        break;
    }
  }

  // Footer
  html += `
      <div class="footer">
        ${data.footer || 'Rapport généré automatiquement par GestiHotel'}
      </div>
    </body>
    </html>
  `;

  return html;
};

// ============================================================================
// CRUD CONFIGURATIONS DE RAPPORTS
// ============================================================================

const getReportConfigsCollection = (establishmentId: string) =>
  collection(db, 'establishments', establishmentId, 'reportConfigs');

const getGeneratedReportsCollection = (establishmentId: string) =>
  collection(db, 'establishments', establishmentId, 'generatedReports');

export const createReportConfig = async (
  establishmentId: string,
  userId: string,
  config: Omit<ReportConfig, 'id' | 'establishmentId' | 'createdAt' | 'updatedAt' | 'createdBy'>
): Promise<string> => {
  try {
    const collectionRef = getReportConfigsCollection(establishmentId);

    const docData = {
      ...config,
      establishmentId,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collectionRef, docData);
    logger.info('📄 Configuration rapport créée:', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('❌ Erreur création config rapport:', error);
    throw error;
  }
};

export const updateReportConfig = async (
  establishmentId: string,
  configId: string,
  updates: Partial<ReportConfig>
): Promise<void> => {
  try {
    const docRef = doc(getReportConfigsCollection(establishmentId), configId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    logger.info('📄 Configuration rapport mise à jour:', configId);
  } catch (error) {
    logger.error('❌ Erreur mise à jour config rapport:', error);
    throw error;
  }
};

export const deleteReportConfig = async (
  establishmentId: string,
  configId: string
): Promise<void> => {
  try {
    const docRef = doc(getReportConfigsCollection(establishmentId), configId);
    await deleteDoc(docRef);
    logger.info('📄 Configuration rapport supprimée:', configId);
  } catch (error) {
    logger.error('❌ Erreur suppression config rapport:', error);
    throw error;
  }
};

export const getReportConfigs = async (establishmentId: string): Promise<ReportConfig[]> => {
  try {
    const collectionRef = getReportConfigsCollection(establishmentId);
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ReportConfig[];
  } catch (error) {
    logger.error('❌ Erreur récupération configs rapport:', error);
    throw error;
  }
};

export const getReportConfig = async (
  establishmentId: string,
  configId: string
): Promise<ReportConfig | null> => {
  try {
    const docRef = doc(getReportConfigsCollection(establishmentId), configId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as ReportConfig;
  } catch (error) {
    logger.error('❌ Erreur récupération config rapport:', error);
    throw error;
  }
};

// ============================================================================
// GÉNÉRATION ET STOCKAGE
// ============================================================================

export const generateReport = async (
  config: ReportConfig,
  interventions: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: Date;
    completedAt?: Date;
    assignedToName?: string;
    roomNumber?: string;
    category?: string;
    resolutionTime?: number;
    slaStatus?: string;
  }>,
  establishmentName: string,
  userId?: string
): Promise<GeneratedReport> => {
  try {
    // Créer l'entrée du rapport
    const collectionRef = getGeneratedReportsCollection(config.establishmentId);
    const reportEntry: Omit<GeneratedReport, 'id'> = {
      configId: config.id || '',
      establishmentId: config.establishmentId,
      type: config.type,
      format: config.format,
      fileName: `rapport_${config.type}_${Date.now()}.${config.format === 'pdf' ? 'html' : config.format}`,
      generatedAt: Timestamp.now(),
      generatedBy: userId,
      status: 'generating',
    };

    const reportDoc = await addDoc(collectionRef, reportEntry);

    try {
      // Calculer la période
      let period: { start: Date; end: Date } | undefined;
      if (config.filters?.relativePeriod) {
        period = getDateRange(config.filters.relativePeriod);
      } else if (config.filters?.dateRange) {
        period = config.filters.dateRange;
      }

      // Filtrer les interventions
      let filteredInterventions = [...interventions];

      if (period) {
        filteredInterventions = filteredInterventions.filter(i => {
          const createdAt = i.createdAt;
          return createdAt >= period!.start && createdAt <= period!.end;
        });
      }

      if (config.filters?.status?.length) {
        filteredInterventions = filteredInterventions.filter(i =>
          config.filters!.status!.includes(i.status)
        );
      }

      if (config.filters?.priority?.length) {
        filteredInterventions = filteredInterventions.filter(i =>
          config.filters!.priority!.includes(i.priority)
        );
      }

      // Calculer les statistiques
      const totalCount = filteredInterventions.length;
      const completedCount = filteredInterventions.filter(i => i.status === 'completed').length;
      const slaCompliant = filteredInterventions.filter(i => i.slaStatus === 'on_track').length;
      const avgResolutionTime =
        filteredInterventions
          .filter(i => i.resolutionTime)
          .reduce((acc, i) => acc + (i.resolutionTime || 0), 0) / (completedCount || 1);

      // Grouper par catégorie
      const byCategory: Record<string, number> = {};
      filteredInterventions.forEach(i => {
        const cat = i.category || 'Non catégorisé';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      });

      // Grouper par technicien
      const byTechnician: Record<string, number> = {};
      filteredInterventions
        .filter(i => i.status === 'completed')
        .forEach(i => {
          const tech = i.assignedToName || 'Non assigné';
          byTechnician[tech] = (byTechnician[tech] || 0) + 1;
        });

      // Construire les données du rapport
      const reportData: ReportData = {
        title: config.name,
        subtitle: getReportTypeLabel(config.type),
        establishmentName,
        generatedAt: new Date(),
        period,
        summary: {
          totalInterventions: totalCount,
          completedInterventions: completedCount,
          slaCompliance: totalCount > 0 ? Math.round((slaCompliant / totalCount) * 100) : 100,
          averageResolutionTime: Math.round(avgResolutionTime),
          topCategories: Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count })),
          topTechnicians: Object.entries(byTechnician)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, completed]) => ({ name, completed })),
        },
        sections: [],
      };

      // Ajouter les sections selon le type de rapport
      if (config.content?.includeDetails !== false) {
        reportData.sections.push({
          title: 'Liste des interventions',
          type: 'table',
          data: {
            columns: ['Titre', 'Statut', 'Priorité', 'Technicien', 'Chambre', 'Date'],
            rows: filteredInterventions
              .slice(0, 100)
              .map(i => [
                i.title,
                getStatusLabel(i.status),
                getPriorityLabel(i.priority),
                i.assignedToName || '-',
                i.roomNumber || '-',
                formatDate(i.createdAt),
              ]),
          },
        });
      }

      if (config.content?.includeCharts !== false && Object.keys(byCategory).length > 0) {
        reportData.sections.push({
          title: 'Répartition par catégorie',
          type: 'chart',
          data: Object.entries(byCategory).map(([label, value]) => ({ label, value })),
        });
      }

      if (Object.keys(byTechnician).length > 0) {
        reportData.sections.push({
          title: 'Performance des techniciens',
          type: 'chart',
          data: Object.entries(byTechnician).map(([label, value]) => ({ label, value })),
        });
      }

      // Générer le HTML
      const html = generateReportHTML(reportData);

      // Sauvegarder dans Storage
      const blob = new Blob([html], { type: 'text/html' });
      const storageRef = ref(
        storage,
        `establishments/${config.establishmentId}/reports/${reportEntry.fileName}`
      );

      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      // Mettre à jour le statut
      await updateDoc(doc(collectionRef, reportDoc.id), {
        status: 'completed',
        fileUrl: downloadUrl,
        fileSize: blob.size,
      });

      logger.info('📄 Rapport généré avec succès:', reportDoc.id);

      return {
        id: reportDoc.id,
        ...reportEntry,
        status: 'completed',
        fileUrl: downloadUrl,
        fileSize: blob.size,
      };
    } catch (error) {
      // Marquer comme échoué
      await updateDoc(doc(collectionRef, reportDoc.id), {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
      throw error;
    }
  } catch (error) {
    logger.error('❌ Erreur génération rapport:', error);
    throw error;
  }
};

// ============================================================================
// HISTORIQUE DES RAPPORTS
// ============================================================================

export const getGeneratedReports = async (
  establishmentId: string,
  configId?: string,
  limit = 50
): Promise<GeneratedReport[]> => {
  try {
    const collectionRef = getGeneratedReportsCollection(establishmentId);
    let q;

    if (configId) {
      q = query(collectionRef, where('configId', '==', configId), orderBy('generatedAt', 'desc'));
    } else {
      q = query(collectionRef, orderBy('generatedAt', 'desc'));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.slice(0, limit).map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as GeneratedReport[];
  } catch (error) {
    logger.error('❌ Erreur récupération rapports:', error);
    throw error;
  }
};

export const deleteGeneratedReport = async (
  establishmentId: string,
  reportId: string
): Promise<void> => {
  try {
    const docRef = doc(getGeneratedReportsCollection(establishmentId), reportId);
    await deleteDoc(docRef);
    logger.info('📄 Rapport supprimé:', reportId);
  } catch (error) {
    logger.error('❌ Erreur suppression rapport:', error);
    throw error;
  }
};

// ============================================================================
// HELPERS
// ============================================================================

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  interventions_summary: 'Résumé des interventions',
  interventions_detailed: 'Rapport détaillé des interventions',
  sla_compliance: 'Conformité SLA',
  technician_performance: 'Performance des techniciens',
  room_statistics: 'Statistiques par chambre',
  activity_log: "Journal d'activité",
  monthly_recap: 'Récapitulatif mensuel',
  custom: 'Rapport personnalisé',
};

const getReportTypeLabel = (type: ReportType): string => {
  return REPORT_TYPE_LABELS[type] || type;
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    assigned: 'Assignée',
    in_progress: 'En cours',
    on_hold: 'En pause',
    completed: 'Terminée',
    cancelled: 'Annulée',
  };
  return labels[status] || status;
};

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: 'Basse',
    normal: 'Normale',
    high: 'Haute',
    urgent: 'Urgente',
    critical: 'Critique',
  };
  return labels[priority] || priority;
};

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default {
  // Config CRUD
  createReportConfig,
  updateReportConfig,
  deleteReportConfig,
  getReportConfigs,
  getReportConfig,

  // Génération
  generateReport,
  generateReportHTML,

  // Historique
  getGeneratedReports,
  deleteGeneratedReport,
};
