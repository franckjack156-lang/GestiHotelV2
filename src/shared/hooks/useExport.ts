/**
 * Export Hook
 *
 * Hook pour faciliter l'utilisation de l'export de données
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  exportInterventionsToCSV,
  exportInterventionsToExcel,
  exportUsersToCSV,
  exportUsersToExcel,
  exportAnalyticsReport,
  downloadInterventionsTemplate,
  downloadUsersTemplate,
} from '@/shared/services/exportService';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import type { User } from '@/features/users/types/user.types';
import { logger } from '@/core/utils/logger';

export type ExportFormat = 'csv' | 'excel' | 'pdf';
export type ExportType = 'interventions' | 'users' | 'analytics';

export const useExport = () => {
  const [exporting, setExporting] = useState(false);

  /**
   * Exporter des interventions
   */
  const exportInterventions = useCallback(
    async (interventions: Intervention[], format: ExportFormat = 'excel'): Promise<void> => {
      if (interventions.length === 0) {
        toast.error('Aucune donnée à exporter');
        return;
      }

      setExporting(true);
      try {
        if (format === 'csv') {
          exportInterventionsToCSV(interventions);
        } else if (format === 'excel') {
          exportInterventionsToExcel(interventions);
        }

        toast.success(`${interventions.length} intervention(s) exportée(s)`);
      } catch (error: any) {
        logger.error('Export error:', error);
        toast.error("Erreur lors de l'export", {
          description: error.message,
        });
      } finally {
        setExporting(false);
      }
    },
    []
  );

  /**
   * Exporter des utilisateurs
   */
  const exportUsers = useCallback(
    async (users: User[], format: ExportFormat = 'excel'): Promise<void> => {
      if (users.length === 0) {
        toast.error('Aucune donnée à exporter');
        return;
      }

      setExporting(true);
      try {
        if (format === 'csv') {
          exportUsersToCSV(users);
        } else if (format === 'excel') {
          exportUsersToExcel(users);
        }

        toast.success(`${users.length} utilisateur(s) exporté(s)`);
      } catch (error: any) {
        logger.error('Export error:', error);
        toast.error("Erreur lors de l'export", {
          description: error.message,
        });
      } finally {
        setExporting(false);
      }
    },
    []
  );

  /**
   * Exporter un rapport d'analytics complet
   */
  const exportAnalytics = useCallback(
    async (interventions: Intervention[], users: User[], stats: any): Promise<void> => {
      setExporting(true);
      try {
        exportAnalyticsReport(interventions, users, stats);
        toast.success('Rapport exporté avec succès');
      } catch (error: any) {
        logger.error('Export error:', error);
        toast.error("Erreur lors de l'export", {
          description: error.message,
        });
      } finally {
        setExporting(false);
      }
    },
    []
  );

  /**
   * Télécharger un template d'import
   */
  const downloadTemplate = useCallback((type: 'interventions' | 'users'): void => {
    try {
      if (type === 'interventions') {
        downloadInterventionsTemplate();
      } else {
        downloadUsersTemplate();
      }
      toast.success('Template téléchargé');
    } catch (error: any) {
      logger.error('Download template error:', error);
      toast.error('Erreur lors du téléchargement');
    }
  }, []);

  /**
   * Export générique
   */
  const exportData = useCallback(
    async (
      data: Intervention[] | User[],
      type: ExportType,
      format: ExportFormat = 'excel'
    ): Promise<void> => {
      if (type === 'interventions') {
        await exportInterventions(data as Intervention[], format);
      } else if (type === 'users') {
        await exportUsers(data as User[], format);
      }
    },
    [exportInterventions, exportUsers]
  );

  return {
    exporting,
    exportInterventions,
    exportUsers,
    exportAnalytics,
    downloadTemplate,
    exportData,
  };
};
