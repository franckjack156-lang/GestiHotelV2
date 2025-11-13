/**
 * ============================================================================
 * EXPORT SERVICE - COMPLET
 * ============================================================================
 *
 * Service pour exporter les données en différents formats
 * - PDF (rapports, interventions)
 * - Excel (listes, analytics)
 * - CSV (export simple)
 */

import * as XLSX from 'xlsx';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import type { User } from '@/features/users/types/user.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// TYPES
// ============================================================================

interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
}

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Convertir des données en CSV
 */
const convertToCSV = (data: any[], headers: string[]): string => {
  const rows = [headers];

  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value).replace(/"/g, '""'); // Échapper les guillemets
    });
    rows.push(row);
  });

  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

/**
 * Télécharger un fichier CSV
 */
const downloadCSV = (csv: string, filename: string): void => {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============================================================================
// EXCEL EXPORT
// ============================================================================

/**
 * Exporter des données en Excel
 */
const exportToExcel = (data: any[], options: ExportOptions = {}): void => {
  const { filename = `export_${Date.now()}.xlsx`, sheetName = 'Data' } = options;

  // Créer un nouveau workbook
  const wb = XLSX.utils.book_new();

  // Convertir les données en worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Ajouter le worksheet au workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Télécharger le fichier
  XLSX.writeFile(wb, filename);
};

/**
 * Exporter plusieurs feuilles en Excel
 */
const exportMultiSheetExcel = (
  sheets: { name: string; data: any[] }[],
  filename: string = `export_${Date.now()}.xlsx`
): void => {
  const wb = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });

  XLSX.writeFile(wb, filename);
};

// ============================================================================
// INTERVENTIONS EXPORT
// ============================================================================

/**
 * Préparer les données d'interventions pour l'export
 */
const prepareInterventionsData = (interventions: Intervention[]) => {
  return interventions.map(intervention => ({
    Référence: intervention.reference || intervention.id,
    Titre: intervention.title,
    Type: intervention.type,
    Catégorie: intervention.category,
    Priorité: intervention.priority,
    Statut: intervention.status,
    Localisation: intervention.location,
    Chambre: intervention.roomNumber || '',
    Étage: intervention.floor || '',
    'Assigné à': intervention.assignedTo || 'Non assigné',
    'Créé par': intervention.createdBy,
    'Date création': intervention.createdAt?.toDate
      ? format(intervention.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr })
      : '',
    'Date planifiée': intervention.scheduledAt?.toDate
      ? format(intervention.scheduledAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr })
      : '',
    'Date début': intervention.startedAt?.toDate
      ? format(intervention.startedAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr })
      : '',
    'Date fin': intervention.completedAt?.toDate
      ? format(intervention.completedAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr })
      : '',
    'Durée estimée (min)': intervention.estimatedDuration || '',
    'Durée réelle (min)': intervention.actualDuration || '',
    Urgent: intervention.isUrgent ? 'Oui' : 'Non',
    Bloquant: intervention.isBlocking ? 'Oui' : 'Non',
    Description: intervention.description,
    'Notes internes': intervention.internalNotes || '',
    'Notes de résolution': intervention.resolutionNotes || '',
  }));
};

/**
 * Exporter les interventions en CSV
 */
export const exportInterventionsToCSV = (interventions: Intervention[]): void => {
  const data = prepareInterventionsData(interventions);
  const headers = Object.keys(data[0] || {});
  const csv = convertToCSV(data, headers);
  const filename = `interventions_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
  downloadCSV(csv, filename);
};

/**
 * Exporter les interventions en Excel
 */
export const exportInterventionsToExcel = (interventions: Intervention[]): void => {
  const data = prepareInterventionsData(interventions);
  const filename = `interventions_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
  exportToExcel(data, { filename, sheetName: 'Interventions' });
};

// ============================================================================
// USERS EXPORT
// ============================================================================

/**
 * Préparer les données d'utilisateurs pour l'export
 */
const prepareUsersData = (users: User[]) => {
  return users.map(user => ({
    ID: user.id,
    Email: user.email,
    Nom: user.displayName || '',
    Prénom: user.firstName || '',
    'Nom de famille': user.lastName || '',
    Rôle: user.role,
    Statut: user.status,
    Téléphone: user.phoneNumber || '',
    Poste: user.jobTitle || '',
    Département: user.department || '',
    Actif: user.isActive ? 'Oui' : 'Non',
    'Email vérifié': user.emailVerified ? 'Oui' : 'Non',
    'Date création': user.createdAt?.toDate
      ? format(user.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr })
      : '',
    'Dernière connexion': user.lastLoginAt?.toDate
      ? format(user.lastLoginAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr })
      : '',
  }));
};

/**
 * Exporter les utilisateurs en CSV
 */
export const exportUsersToCSV = (users: User[]): void => {
  const data = prepareUsersData(users);
  const headers = Object.keys(data[0] || {});
  const csv = convertToCSV(data, headers);
  const filename = `utilisateurs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
  downloadCSV(csv, filename);
};

/**
 * Exporter les utilisateurs en Excel
 */
export const exportUsersToExcel = (users: User[]): void => {
  const data = prepareUsersData(users);
  const filename = `utilisateurs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
  exportToExcel(data, { filename, sheetName: 'Utilisateurs' });
};

// ============================================================================
// ANALYTICS EXPORT
// ============================================================================

/**
 * Exporter un rapport d'analytics complet
 */
export const exportAnalyticsReport = (
  interventions: Intervention[],
  users: User[],
  stats: any
): void => {
  const sheets = [
    {
      name: 'Résumé',
      data: [
        { Métrique: 'Total interventions', Valeur: stats.total },
        { Métrique: 'En attente', Valeur: stats.pending },
        { Métrique: 'En cours', Valeur: stats.inProgress },
        { Métrique: 'Terminées', Valeur: stats.completed },
        { Métrique: 'Urgentes', Valeur: stats.urgent },
        { Métrique: 'Taux complétion', Valeur: `${stats.completionRate}%` },
      ],
    },
    {
      name: 'Interventions',
      data: prepareInterventionsData(interventions),
    },
    {
      name: 'Utilisateurs',
      data: prepareUsersData(users),
    },
  ];

  const filename = `rapport_analytics_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
  exportMultiSheetExcel(sheets, filename);
};

// ============================================================================
// PDF EXPORT (Simplifié)
// ============================================================================

/**
 * Générer un PDF simple (utilise print du navigateur)
 * Pour un vrai PDF, on devrait utiliser jsPDF ou pdfmake
 */
export const exportToPDF = (elementId: string, filename: string): void => {
  // Pour l'instant, on utilise window.print()
  // Dans une vraie implementation, on utiliserait jsPDF
  window.print();
};

/**
 * Préparer le contenu HTML pour l'impression PDF
 */
export const preparePrintContent = (intervention: Intervention): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Intervention ${intervention.reference}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        .section { margin: 20px 0; }
        .label { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <h1>Intervention #${intervention.reference}</h1>
      <div class="section">
        <p><span class="label">Titre:</span> ${intervention.title}</p>
        <p><span class="label">Description:</span> ${intervention.description}</p>
        <p><span class="label">Type:</span> ${intervention.type}</p>
        <p><span class="label">Priorité:</span> ${intervention.priority}</p>
        <p><span class="label">Statut:</span> ${intervention.status}</p>
        <p><span class="label">Localisation:</span> ${intervention.location}</p>
      </div>
    </body>
    </html>
  `;
};

// ============================================================================
// TEMPLATE EXCEL
// ============================================================================

/**
 * Télécharger un template Excel pour l'import
 */
export const downloadInterventionsTemplate = (): void => {
  const template = [
    {
      Titre: 'Exemple intervention',
      Description: "Description de l'intervention",
      Type: 'maintenance',
      Catégorie: 'plomberie',
      Priorité: 'normal',
      Localisation: 'Chambre 101',
      Chambre: '101',
      Étage: '1',
      Urgent: 'Non',
      Bloquant: 'Non',
    },
  ];

  const filename = 'template_interventions.xlsx';
  exportToExcel(template, { filename, sheetName: 'Template' });
};

/**
 * Télécharger un template Excel pour l'import d'utilisateurs
 */
export const downloadUsersTemplate = (): void => {
  const template = [
    {
      Email: 'exemple@email.com',
      Prénom: 'Jean',
      Nom: 'Dupont',
      Rôle: 'technician',
      Téléphone: '0612345678',
      Département: 'Maintenance',
    },
  ];

  const filename = 'template_utilisateurs.xlsx';
  exportToExcel(template, { filename, sheetName: 'Template' });
};

/**
 * Télécharger un template Excel pour l'import de chambres
 */
export const downloadRoomsTemplate = (): void => {
  const template = [
    {
      Numero: '101',
      Nom: 'Chambre 101',
      Etage: '1',
      Type: 'double',
      Capacite: '2',
      Prix: '100',
      Surface: '25',
      Description: 'Chambre double avec vue sur le jardin',
      Equipements: 'TV, WiFi, Climatisation',
    },
  ];

  const filename = 'template_chambres.xlsx';
  exportToExcel(template, { filename, sheetName: 'Template' });
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  // Interventions
  exportInterventionsToCSV,
  exportInterventionsToExcel,
  downloadInterventionsTemplate,

  // Users
  exportUsersToCSV,
  exportUsersToExcel,
  downloadUsersTemplate,

  // Rooms
  downloadRoomsTemplate,

  // Analytics
  exportAnalyticsReport,

  // PDF
  exportToPDF,
  preparePrintContent,

  // Generic
  exportToExcel,
  exportMultiSheetExcel,
};
