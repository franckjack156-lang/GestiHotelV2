/**
 * Service d'export programmé (Scheduled Export)
 *
 * Permet de configurer des exports automatiques périodiques
 * - Rapports quotidiens, hebdomadaires, mensuels
 * - Envoi par email
 * - Stockage dans Firebase Storage
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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/core/config/firebase';
import { logger } from '@/core/utils/logger';
import * as XLSX from 'xlsx';
import { format, addDays, addMonths } from 'date-fns';

/**
 * Types de fréquence d'export
 */
export type ExportFrequency = 'daily' | 'weekly' | 'monthly' | 'once';

/**
 * Types de données exportables
 */
export type ExportDataType =
  | 'interventions'
  | 'users'
  | 'rooms'
  | 'analytics'
  | 'sla_report'
  | 'activity_log';

/**
 * Format d'export
 */
export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

/**
 * Configuration d'un export programmé
 */
export interface ScheduledExport {
  id: string;
  establishmentId: string;
  name: string;
  description?: string;
  dataType: ExportDataType;
  format: ExportFormat;
  frequency: ExportFrequency;

  // Configuration de la planification
  scheduledTime: string; // HH:mm format
  scheduledDayOfWeek?: number; // 0-6 pour weekly
  scheduledDayOfMonth?: number; // 1-31 pour monthly

  // Filtres de données
  filters?: {
    dateRange?: 'last_7_days' | 'last_30_days' | 'last_month' | 'custom';
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
  };

  // Destinataires
  recipients: string[]; // Emails
  sendToCreator: boolean;

  // État
  isActive: boolean;
  lastRunAt?: Timestamp;
  nextRunAt?: Timestamp;
  lastError?: string;
  runCount: number;

  // Métadonnées
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Historique d'exécution
 */
export interface ExportExecution {
  id: string;
  scheduledExportId: string;
  establishmentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Timestamp;
  completedAt?: Timestamp;
  fileUrl?: string;
  filePath?: string;
  fileSize?: number;
  recordCount?: number;
  error?: string;
  recipientsSent?: string[];
}

/**
 * Données pour créer un export programmé
 */
export interface CreateScheduledExportData {
  name: string;
  description?: string;
  dataType: ExportDataType;
  format: ExportFormat;
  frequency: ExportFrequency;
  scheduledTime: string;
  scheduledDayOfWeek?: number;
  scheduledDayOfMonth?: number;
  filters?: ScheduledExport['filters'];
  recipients: string[];
  sendToCreator?: boolean;
}

// Collection references
const getExportsCollection = (establishmentId: string) =>
  collection(db, 'establishments', establishmentId, 'scheduledExports');

const getExecutionsCollection = (establishmentId: string) =>
  collection(db, 'establishments', establishmentId, 'exportExecutions');

/**
 * Calculer la prochaine date d'exécution
 */
const calculateNextRunDate = (
  frequency: ExportFrequency,
  scheduledTime: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  fromDate: Date = new Date()
): Date => {
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  let nextRun = new Date(fromDate);
  nextRun.setHours(hours, minutes, 0, 0);

  // Si l'heure est déjà passée aujourd'hui, commencer demain
  if (nextRun <= fromDate) {
    nextRun = addDays(nextRun, 1);
  }

  switch (frequency) {
    case 'daily':
      // Déjà configuré
      break;

    case 'weekly':
      // Trouver le prochain jour de la semaine
      if (dayOfWeek !== undefined) {
        while (nextRun.getDay() !== dayOfWeek) {
          nextRun = addDays(nextRun, 1);
        }
      }
      break;

    case 'monthly':
      // Trouver le prochain jour du mois
      if (dayOfMonth !== undefined) {
        nextRun.setDate(dayOfMonth);
        if (nextRun <= fromDate) {
          nextRun = addMonths(nextRun, 1);
          nextRun.setDate(dayOfMonth);
        }
      }
      break;

    case 'once':
      // Pas de récurrence
      break;
  }

  return nextRun;
};

/**
 * Créer un export programmé
 */
export const createScheduledExport = async (
  establishmentId: string,
  userId: string,
  data: CreateScheduledExportData
): Promise<string> => {
  try {
    const collectionRef = getExportsCollection(establishmentId);

    const nextRunAt = calculateNextRunDate(
      data.frequency,
      data.scheduledTime,
      data.scheduledDayOfWeek,
      data.scheduledDayOfMonth
    );

    const exportData = {
      establishmentId,
      name: data.name,
      description: data.description || null,
      dataType: data.dataType,
      format: data.format,
      frequency: data.frequency,
      scheduledTime: data.scheduledTime,
      scheduledDayOfWeek: data.scheduledDayOfWeek || null,
      scheduledDayOfMonth: data.scheduledDayOfMonth || null,
      filters: data.filters || null,
      recipients: data.recipients,
      sendToCreator: data.sendToCreator ?? true,
      isActive: true,
      nextRunAt: Timestamp.fromDate(nextRunAt),
      runCount: 0,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collectionRef, exportData);
    logger.info('Export programmé créé:', { id: docRef.id, name: data.name });

    return docRef.id;
  } catch (error) {
    logger.error('Erreur création export programmé:', error);
    throw error;
  }
};

/**
 * Mettre à jour un export programmé
 */
export const updateScheduledExport = async (
  establishmentId: string,
  exportId: string,
  data: Partial<CreateScheduledExportData & { isActive: boolean }>
): Promise<void> => {
  try {
    const docRef = doc(getExportsCollection(establishmentId), exportId);

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Recalculer la prochaine exécution si la planification change
    if (data.frequency || data.scheduledTime) {
      const currentDoc = await getDoc(docRef);
      const current = currentDoc.data() as ScheduledExport;

      const nextRunAt = calculateNextRunDate(
        data.frequency || current.frequency,
        data.scheduledTime || current.scheduledTime,
        data.scheduledDayOfWeek ?? current.scheduledDayOfWeek,
        data.scheduledDayOfMonth ?? current.scheduledDayOfMonth
      );

      updateData.nextRunAt = Timestamp.fromDate(nextRunAt);
    }

    await updateDoc(docRef, updateData);
    logger.info('Export programmé mis à jour:', { id: exportId });
  } catch (error) {
    logger.error('Erreur mise à jour export programmé:', error);
    throw error;
  }
};

/**
 * Supprimer un export programmé
 */
export const deleteScheduledExport = async (
  establishmentId: string,
  exportId: string
): Promise<void> => {
  try {
    const docRef = doc(getExportsCollection(establishmentId), exportId);
    await deleteDoc(docRef);
    logger.info('Export programmé supprimé:', { id: exportId });
  } catch (error) {
    logger.error('Erreur suppression export programmé:', error);
    throw error;
  }
};

/**
 * Récupérer tous les exports programmés
 */
export const getScheduledExports = async (establishmentId: string): Promise<ScheduledExport[]> => {
  try {
    const collectionRef = getExportsCollection(establishmentId);
    const snapshot = await getDocs(collectionRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduledExport[];
  } catch (error) {
    logger.error('Erreur récupération exports programmés:', error);
    throw error;
  }
};

/**
 * Récupérer un export programmé par ID
 */
export const getScheduledExportById = async (
  establishmentId: string,
  exportId: string
): Promise<ScheduledExport | null> => {
  try {
    const docRef = doc(getExportsCollection(establishmentId), exportId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as ScheduledExport;
  } catch (error) {
    logger.error('Erreur récupération export programmé:', error);
    throw error;
  }
};

/**
 * Récupérer les exports à exécuter maintenant
 */
export const getPendingExports = async (establishmentId: string): Promise<ScheduledExport[]> => {
  try {
    const collectionRef = getExportsCollection(establishmentId);
    const now = Timestamp.now();

    const q = query(collectionRef, where('isActive', '==', true), where('nextRunAt', '<=', now));

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduledExport[];
  } catch (error) {
    logger.error('Erreur récupération exports en attente:', error);
    throw error;
  }
};

/**
 * Enregistrer une exécution d'export
 */
export const createExportExecution = async (
  establishmentId: string,
  scheduledExportId: string
): Promise<string> => {
  try {
    const collectionRef = getExecutionsCollection(establishmentId);

    const executionData = {
      scheduledExportId,
      establishmentId,
      status: 'pending',
      startedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collectionRef, executionData);
    return docRef.id;
  } catch (error) {
    logger.error('Erreur création exécution:', error);
    throw error;
  }
};

/**
 * Mettre à jour une exécution
 */
export const updateExportExecution = async (
  establishmentId: string,
  executionId: string,
  data: Partial<ExportExecution>
): Promise<void> => {
  try {
    const docRef = doc(getExecutionsCollection(establishmentId), executionId);
    await updateDoc(docRef, data);
  } catch (error) {
    logger.error('Erreur mise à jour exécution:', error);
    throw error;
  }
};

/**
 * Récupérer l'historique des exécutions
 */
export const getExportExecutions = async (
  establishmentId: string,
  scheduledExportId?: string,
  limit?: number
): Promise<ExportExecution[]> => {
  try {
    const collectionRef = getExecutionsCollection(establishmentId);

    let q = query(collectionRef);
    if (scheduledExportId) {
      q = query(collectionRef, where('scheduledExportId', '==', scheduledExportId));
    }

    const snapshot = await getDocs(q);

    let executions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ExportExecution[];

    // Trier par date décroissante
    executions.sort((a, b) => {
      const aTime = a.startedAt?.toMillis() || 0;
      const bTime = b.startedAt?.toMillis() || 0;
      return bTime - aTime;
    });

    if (limit) {
      executions = executions.slice(0, limit);
    }

    return executions;
  } catch (error) {
    logger.error('Erreur récupération historique:', error);
    throw error;
  }
};

/**
 * Générer et uploader le fichier d'export
 */
export const generateExportFile = async (
  establishmentId: string,
  exportConfig: ScheduledExport,
  data: unknown[]
): Promise<{ url: string; path: string; size: number }> => {
  try {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    const filename = `${exportConfig.dataType}_${timestamp}.${exportConfig.format}`;
    const storagePath = `exports/${establishmentId}/${exportConfig.id}/${filename}`;

    let blob: Blob;

    if (exportConfig.format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data as object[]);
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    } else if (exportConfig.format === 'csv') {
      const headers = Object.keys((data[0] as object) || {});
      const csvContent = [
        headers.join(','),
        ...(data as object[]).map(row =>
          headers
            .map(h => `"${String((row as Record<string, unknown>)[h] || '').replace(/"/g, '""')}"`)
            .join(',')
        ),
      ].join('\n');
      blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    } else {
      throw new Error(`Format non supporté: ${exportConfig.format}`);
    }

    // Upload vers Firebase Storage
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);

    return {
      url,
      path: storagePath,
      size: blob.size,
    };
  } catch (error) {
    logger.error('Erreur génération fichier:', error);
    throw error;
  }
};

/**
 * Exécuter un export programmé manuellement
 */
export const runScheduledExport = async (
  establishmentId: string,
  exportId: string,
  dataFetcher: () => Promise<unknown[]>
): Promise<ExportExecution> => {
  const exportConfig = await getScheduledExportById(establishmentId, exportId);
  if (!exportConfig) {
    throw new Error('Export non trouvé');
  }

  // Créer l'enregistrement d'exécution
  const executionId = await createExportExecution(establishmentId, exportId);

  try {
    // Mettre à jour le statut
    await updateExportExecution(establishmentId, executionId, { status: 'running' });

    // Récupérer les données
    const data = await dataFetcher();

    // Générer le fichier
    const { url, path, size } = await generateExportFile(establishmentId, exportConfig, data);

    // Mettre à jour l'exécution avec succès
    const execution: Partial<ExportExecution> = {
      status: 'completed',
      completedAt: Timestamp.now(),
      fileUrl: url,
      filePath: path,
      fileSize: size,
      recordCount: data.length,
    };

    await updateExportExecution(establishmentId, executionId, execution);

    // Mettre à jour l'export programmé
    const nextRunAt =
      exportConfig.frequency !== 'once'
        ? calculateNextRunDate(
            exportConfig.frequency,
            exportConfig.scheduledTime,
            exportConfig.scheduledDayOfWeek,
            exportConfig.scheduledDayOfMonth
          )
        : null;

    await updateDoc(doc(getExportsCollection(establishmentId), exportId), {
      lastRunAt: serverTimestamp(),
      nextRunAt: nextRunAt ? Timestamp.fromDate(nextRunAt) : null,
      runCount: exportConfig.runCount + 1,
      lastError: null,
      updatedAt: serverTimestamp(),
    });

    logger.info('Export exécuté avec succès:', { exportId, executionId, recordCount: data.length });

    return {
      id: executionId,
      scheduledExportId: exportId,
      establishmentId,
      ...execution,
    } as ExportExecution;
  } catch (error) {
    // Enregistrer l'erreur
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

    await updateExportExecution(establishmentId, executionId, {
      status: 'failed',
      completedAt: Timestamp.now(),
      error: errorMessage,
    });

    await updateDoc(doc(getExportsCollection(establishmentId), exportId), {
      lastError: errorMessage,
      updatedAt: serverTimestamp(),
    });

    logger.error('Erreur exécution export:', { exportId, error });
    throw error;
  }
};

/**
 * Activer/désactiver un export programmé
 */
export const toggleScheduledExport = async (
  establishmentId: string,
  exportId: string,
  isActive: boolean
): Promise<void> => {
  try {
    const docRef = doc(getExportsCollection(establishmentId), exportId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
    logger.info(`Export programmé ${isActive ? 'activé' : 'désactivé'}:`, { id: exportId });
  } catch (error) {
    logger.error('Erreur toggle export programmé:', error);
    throw error;
  }
};

/**
 * Labels pour l'UI
 */
export const FREQUENCY_LABELS: Record<ExportFrequency, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  once: 'Une fois',
};

export const DATA_TYPE_LABELS: Record<ExportDataType, string> = {
  interventions: 'Interventions',
  users: 'Utilisateurs',
  rooms: 'Chambres',
  analytics: 'Analytics',
  sla_report: 'Rapport SLA',
  activity_log: "Journal d'activité",
};

export const FORMAT_LABELS: Record<ExportFormat, string> = {
  xlsx: 'Excel (.xlsx)',
  csv: 'CSV (.csv)',
  pdf: 'PDF (.pdf)',
};
