/**
 * ============================================================================
 * USE AUDIT LOG HOOK
 * ============================================================================
 *
 * Hook React personnalisé pour faciliter l'utilisation du système d'audit
 * dans les composants et hooks de l'application.
 *
 * @example
 * ```tsx
 * const { logCreate, logUpdate, logDelete } = useAuditLog();
 *
 * const handleCreate = async () => {
 *   const id = await createIntervention(data);
 *   await logCreate('intervention', id, data.title);
 * };
 * ```
 */

import { useCallback } from 'react';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import {
  logAction,
  calculateChanges,
  type AuditEntityType,
  type CreateAuditLogData,
} from '@/shared/services/auditService';

// ============================================================================
// TYPES
// ============================================================================

interface UseAuditLogReturn {
  /**
   * Logger une action générique
   */
  log: (data: CreateAuditLogData) => Promise<void>;

  /**
   * Logger une création
   */
  logCreate: (
    entityType: AuditEntityType,
    entityId: string,
    entityName?: string,
    metadata?: Record<string, unknown>
  ) => Promise<void>;

  /**
   * Logger une modification
   */
  logUpdate: (
    entityType: AuditEntityType,
    entityId: string,
    entityName?: string,
    oldData?: Record<string, unknown>,
    newData?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) => Promise<void>;

  /**
   * Logger une suppression
   */
  logDelete: (
    entityType: AuditEntityType,
    entityId: string,
    entityName?: string,
    metadata?: Record<string, unknown>
  ) => Promise<void>;

  /**
   * Logger une restauration
   */
  logRestore: (entityType: AuditEntityType, entityId: string, entityName?: string) => Promise<void>;

  /**
   * Logger un export
   */
  logExport: (entityType: AuditEntityType, metadata?: Record<string, unknown>) => Promise<void>;

  /**
   * Logger un import
   */
  logImport: (entityType: AuditEntityType, metadata?: Record<string, unknown>) => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export const useAuditLog = (): UseAuditLogReturn => {
  const { currentEstablishment } = useCurrentEstablishment();

  /**
   * Logger une action générique
   */
  const log = useCallback(
    async (data: CreateAuditLogData) => {
      if (!currentEstablishment) {
        console.warn("useAuditLog: Pas d'établissement actif");
        return;
      }

      try {
        await logAction(currentEstablishment.id, data);
      } catch (error) {
        console.error('useAuditLog: Erreur lors du logging:', error);
        // Ne pas bloquer le flux principal
      }
    },
    [currentEstablishment]
  );

  /**
   * Logger une création
   */
  const logCreate = useCallback(
    async (
      entityType: AuditEntityType,
      entityId: string,
      entityName?: string,
      metadata?: Record<string, unknown>
    ) => {
      await log({
        action: 'create',
        entityType,
        entityId,
        entityName,
        metadata,
      });
    },
    [log]
  );

  /**
   * Logger une modification avec détection automatique des changements
   */
  const logUpdate = useCallback(
    async (
      entityType: AuditEntityType,
      entityId: string,
      entityName?: string,
      oldData?: Record<string, unknown>,
      newData?: Record<string, unknown>,
      metadata?: Record<string, unknown>
    ) => {
      // Calculer les changements si les données sont fournies
      const changes = oldData && newData ? calculateChanges(oldData, newData) : undefined;

      await log({
        action: 'update',
        entityType,
        entityId,
        entityName,
        changes,
        metadata,
      });
    },
    [log]
  );

  /**
   * Logger une suppression
   */
  const logDelete = useCallback(
    async (
      entityType: AuditEntityType,
      entityId: string,
      entityName?: string,
      metadata?: Record<string, unknown>
    ) => {
      await log({
        action: 'delete',
        entityType,
        entityId,
        entityName,
        metadata,
      });
    },
    [log]
  );

  /**
   * Logger une restauration
   */
  const logRestore = useCallback(
    async (entityType: AuditEntityType, entityId: string, entityName?: string) => {
      await log({
        action: 'restore',
        entityType,
        entityId,
        entityName,
      });
    },
    [log]
  );

  /**
   * Logger un export
   */
  const logExport = useCallback(
    async (entityType: AuditEntityType, metadata?: Record<string, unknown>) => {
      await log({
        action: 'export',
        entityType,
        entityId: 'bulk',
        metadata,
      });
    },
    [log]
  );

  /**
   * Logger un import
   */
  const logImport = useCallback(
    async (entityType: AuditEntityType, metadata?: Record<string, unknown>) => {
      await log({
        action: 'import',
        entityType,
        entityId: 'bulk',
        metadata,
      });
    },
    [log]
  );

  return {
    log,
    logCreate,
    logUpdate,
    logDelete,
    logRestore,
    logExport,
    logImport,
  };
};

/**
 * ============================================================================
 * EXEMPLE D'UTILISATION
 * ============================================================================
 *
 * Dans un composant React :
 *
 * ```tsx
 * import { useAuditLog } from '@/shared/hooks/useAuditLog';
 *
 * export const InterventionForm = () => {
 *   const { logCreate, logUpdate, logDelete } = useAuditLog();
 *
 *   const handleCreate = async (data: CreateInterventionData) => {
 *     try {
 *       const id = await createIntervention(establishmentId, userId, data);
 *
 *       // Logger la création
 *       await logCreate('intervention', id, data.title, {
 *         priority: data.priority,
 *         category: data.category,
 *         isUrgent: data.isUrgent,
 *       });
 *
 *       toast.success('Intervention créée');
 *     } catch (error) {
 *       toast.error('Erreur lors de la création');
 *     }
 *   };
 *
 *   const handleUpdate = async (id: string, data: UpdateInterventionData) => {
 *     try {
 *       // Récupérer les données avant modification
 *       const oldIntervention = await getIntervention(establishmentId, id);
 *
 *       // Effectuer la mise à jour
 *       await updateIntervention(establishmentId, id, data);
 *
 *       // Récupérer les données après modification
 *       const newIntervention = await getIntervention(establishmentId, id);
 *
 *       // Logger la modification avec détection des changements
 *       await logUpdate(
 *         'intervention',
 *         id,
 *         newIntervention.title,
 *         oldIntervention,
 *         newIntervention
 *       );
 *
 *       toast.success('Intervention mise à jour');
 *     } catch (error) {
 *       toast.error('Erreur lors de la mise à jour');
 *     }
 *   };
 *
 *   const handleDelete = async (id: string, title: string) => {
 *     try {
 *       await deleteIntervention(establishmentId, id);
 *
 *       // Logger la suppression
 *       await logDelete('intervention', id, title);
 *
 *       toast.success('Intervention supprimée');
 *     } catch (error) {
 *       toast.error('Erreur lors de la suppression');
 *     }
 *   };
 *
 *   return (
 *     // ... votre composant
 *   );
 * };
 * ```
 *
 * Dans un hook personnalisé :
 *
 * ```tsx
 * import { useAuditLog } from '@/shared/hooks/useAuditLog';
 *
 * export const useInterventionActions = () => {
 *   const { logCreate, logUpdate, logDelete } = useAuditLog();
 *
 *   const createIntervention = useCallback(async (data: CreateInterventionData) => {
 *     const id = await interventionService.create(data);
 *     await logCreate('intervention', id, data.title);
 *     return id;
 *   }, [logCreate]);
 *
 *   const updateIntervention = useCallback(async (
 *     id: string,
 *     data: UpdateInterventionData
 *   ) => {
 *     const oldData = await interventionService.get(id);
 *     await interventionService.update(id, data);
 *     const newData = await interventionService.get(id);
 *
 *     await logUpdate('intervention', id, newData.title, oldData, newData);
 *   }, [logUpdate]);
 *
 *   const deleteIntervention = useCallback(async (id: string, title: string) => {
 *     await interventionService.delete(id);
 *     await logDelete('intervention', id, title);
 *   }, [logDelete]);
 *
 *   return { createIntervention, updateIntervention, deleteIntervention };
 * };
 * ```
 */
