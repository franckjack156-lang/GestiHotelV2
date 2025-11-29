/**
 * ============================================================================
 * AUDIT SERVICE
 * ============================================================================
 *
 * Service pour gérer l'audit logging de toutes les actions importantes
 * dans l'application GestiHotel.
 *
 * Fonctionnalités:
 * - Enregistrement des actions CRUD sur toutes les entités
 * - Tracking des changements de permissions
 * - Logs d'authentification (login/logout)
 * - Export/Import de données
 * - Filtrage et recherche dans les logs
 * - Export des logs en CSV/JSON
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  serverTimestamp,
  limit as firestoreLimit,
  QueryConstraint,
} from 'firebase/firestore';
import { db, auth } from '@/core/config/firebase';
import { logger } from '@/core/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Types d'entités auditées
 */
export type AuditEntityType =
  | 'intervention'
  | 'room'
  | 'user'
  | 'establishment'
  | 'settings'
  | 'template'
  | 'supplier'
  | 'inventory'
  | 'reference_list'
  | 'notification'
  | 'report';

/**
 * Actions auditées
 */
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'permission_change'
  | 'status_change'
  | 'assignment'
  | 'bulk_update'
  | 'bulk_delete';

/**
 * Représentation d'un changement de champ
 */
export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Log d'audit complet
 */
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  userRole?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  changes?: FieldChange[];
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  establishmentId: string;
  establishmentName?: string;
}

/**
 * Données pour créer un log d'audit
 */
export interface CreateAuditLogData {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  changes?: FieldChange[];
  metadata?: Record<string, unknown>;
}

/**
 * Filtres pour rechercher dans les logs
 */
export interface AuditLogFilters {
  userId?: string;
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Format d'export
 */
export type ExportFormat = 'csv' | 'json';

/**
 * Options pour l'export
 */
export interface ExportAuditLogsOptions {
  filters?: AuditLogFilters;
  format: ExportFormat;
  includeMetadata?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtenir les informations de l'utilisateur actuel
 */
const getCurrentUserInfo = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Aucun utilisateur connecté');
  }

  return {
    userId: currentUser.uid,
    userEmail: currentUser.email || 'unknown@email.com',
    userName: currentUser.displayName || undefined,
  };
};

/**
 * Obtenir l'IP et le User Agent (côté client)
 */
const getBrowserInfo = (): { ipAddress?: string; userAgent?: string } => {
  return {
    userAgent: navigator.userAgent,
    // Note: L'IP ne peut être obtenue côté client de manière fiable
    // Elle pourrait être ajoutée via Cloud Functions côté serveur
  };
};

/**
 * Nettoyer les champs undefined pour Firestore
 */
const removeUndefinedFields = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
};

/**
 * Calculer les changements entre deux objets
 */
export const calculateChanges = (
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): FieldChange[] => {
  const changes: FieldChange[] = [];

  // Tous les champs présents dans l'ancien ou le nouveau objet
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    const oldValue = oldData[key];
    const newValue = newData[key];

    // Ignorer certains champs techniques
    if (['updatedAt', 'modifiedAt', 'lastModified'].includes(key)) {
      continue;
    }

    // Comparer les valeurs (simple comparaison)
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue,
        newValue,
      });
    }
  }

  return changes;
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Enregistrer une action dans les logs d'audit
 *
 * @param establishmentId - ID de l'établissement
 * @param data - Données de l'action à logger
 * @returns ID du log créé
 */
export const logAction = async (
  establishmentId: string,
  data: CreateAuditLogData
): Promise<string> => {
  try {
    // Récupérer les infos utilisateur
    const userInfo = await getCurrentUserInfo();
    const browserInfo = getBrowserInfo();

    // Préparer les données du log
    const auditLogData = removeUndefinedFields({
      ...userInfo,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      entityName: data.entityName,
      changes: data.changes,
      metadata: data.metadata,
      ...browserInfo,
      timestamp: serverTimestamp(),
      establishmentId,
    });

    // Enregistrer dans audit-logs global (collection racine)
    const globalLogRef = await addDoc(collection(db, 'audit-logs'), auditLogData);

    logger.debug(`✅ Audit log créé: ${data.action} on ${data.entityType}/${data.entityId}`);

    return globalLogRef.id;
  } catch (error) {
    logger.error("❌ Erreur lors de la création du log d'audit:", error);
    // Ne pas bloquer l'opération principale si le log échoue
    return '';
  }
};

/**
 * Récupérer les logs d'audit avec filtres
 *
 * @param establishmentId - ID de l'établissement
 * @param filters - Filtres de recherche
 * @returns Liste des logs d'audit
 */
export const getAuditLogs = async (
  establishmentId: string,
  filters?: AuditLogFilters
): Promise<AuditLog[]> => {
  try {
    const constraints: QueryConstraint[] = [where('establishmentId', '==', establishmentId)];

    // Appliquer les filtres
    if (filters?.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }
    if (filters?.entityType) {
      constraints.push(where('entityType', '==', filters.entityType));
    }
    if (filters?.entityId) {
      constraints.push(where('entityId', '==', filters.entityId));
    }
    if (filters?.action) {
      constraints.push(where('action', '==', filters.action));
    }
    if (filters?.startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters?.endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }

    // Toujours trier par timestamp décroissant
    constraints.push(orderBy('timestamp', 'desc'));

    // Limiter les résultats
    if (filters?.limit) {
      constraints.push(firestoreLimit(filters.limit));
    }

    const q = query(collection(db, 'audit-logs'), ...constraints);
    const snapshot = await getDocs(q);

    const logs: AuditLog[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        userRole: data.userRole,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        changes: data.changes,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: data.timestamp?.toDate() || new Date(),
        establishmentId: data.establishmentId,
        establishmentName: data.establishmentName,
      };
    });

    return logs;
  } catch (error) {
    logger.error("❌ Erreur lors de la récupération des logs d'audit:", error);
    throw new Error("Impossible de récupérer les logs d'audit");
  }
};

/**
 * Exporter les logs d'audit
 *
 * @param establishmentId - ID de l'établissement
 * @param options - Options d'export
 * @returns Blob du fichier exporté
 */
export const exportAuditLogs = async (
  establishmentId: string,
  options: ExportAuditLogsOptions
): Promise<Blob> => {
  try {
    // Récupérer les logs
    const logs = await getAuditLogs(establishmentId, options.filters);

    if (options.format === 'json') {
      return exportToJSON(logs, options.includeMetadata);
    } else {
      return exportToCSV(logs, options.includeMetadata);
    }
  } catch (error) {
    logger.error("❌ Erreur lors de l'export des logs:", error);
    throw new Error("Impossible d'exporter les logs d'audit");
  }
};

/**
 * Exporter en JSON
 */
const exportToJSON = (logs: AuditLog[], includeMetadata = false): Blob => {
  const data = logs.map(log => {
    const record: Record<string, unknown> = {
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      user: `${log.userName || log.userEmail} (${log.userEmail})`,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      entityName: log.entityName || '',
    };

    if (includeMetadata) {
      record.changes = log.changes;
      record.metadata = log.metadata;
      record.ipAddress = log.ipAddress;
      record.userAgent = log.userAgent;
    }

    return record;
  });

  const json = JSON.stringify(data, null, 2);
  return new Blob([json], { type: 'application/json' });
};

/**
 * Exporter en CSV
 */
const exportToCSV = (logs: AuditLog[], includeMetadata = false): Blob => {
  // En-têtes
  const headers = [
    'Date/Heure',
    'Utilisateur',
    'Email',
    'Action',
    "Type d'entité",
    'ID Entité',
    'Nom Entité',
  ];

  if (includeMetadata) {
    headers.push('Changements', 'IP', 'User Agent');
  }

  // Lignes
  const rows = logs.map(log => {
    const row = [
      log.timestamp.toLocaleString('fr-FR'),
      log.userName || log.userEmail,
      log.userEmail,
      log.action,
      log.entityType,
      log.entityId,
      log.entityName || '',
    ];

    if (includeMetadata) {
      row.push(
        log.changes ? JSON.stringify(log.changes) : '',
        log.ipAddress || '',
        log.userAgent || ''
      );
    }

    return row;
  });

  // Construire le CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

// ============================================================================
// HELPER FUNCTIONS POUR ACTIONS SPÉCIFIQUES
// ============================================================================

/**
 * Logger une connexion
 */
export const logLogin = async (establishmentId: string): Promise<void> => {
  await logAction(establishmentId, {
    action: 'login',
    entityType: 'user',
    entityId: auth.currentUser?.uid || '',
    entityName: auth.currentUser?.email || '',
  });
};

/**
 * Logger une déconnexion
 */
export const logLogout = async (establishmentId: string): Promise<void> => {
  await logAction(establishmentId, {
    action: 'logout',
    entityType: 'user',
    entityId: auth.currentUser?.uid || '',
    entityName: auth.currentUser?.email || '',
  });
};

/**
 * Logger un changement de permission
 */
export const logPermissionChange = async (
  establishmentId: string,
  userId: string,
  oldRole: string,
  newRole: string
): Promise<void> => {
  await logAction(establishmentId, {
    action: 'permission_change',
    entityType: 'user',
    entityId: userId,
    changes: [
      {
        field: 'role',
        oldValue: oldRole,
        newValue: newRole,
      },
    ],
  });
};

/**
 * Logger un export de données
 */
export const logExport = async (
  establishmentId: string,
  entityType: AuditEntityType,
  metadata?: Record<string, unknown>
): Promise<void> => {
  await logAction(establishmentId, {
    action: 'export',
    entityType,
    entityId: 'bulk',
    metadata,
  });
};

/**
 * Logger un import de données
 */
export const logImport = async (
  establishmentId: string,
  entityType: AuditEntityType,
  metadata?: Record<string, unknown>
): Promise<void> => {
  await logAction(establishmentId, {
    action: 'import',
    entityType,
    entityId: 'bulk',
    metadata,
  });
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  logAction,
  getAuditLogs,
  exportAuditLogs,
  calculateChanges,
  logLogin,
  logLogout,
  logPermissionChange,
  logExport,
  logImport,
};
