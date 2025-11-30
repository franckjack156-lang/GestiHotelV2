/**
 * ============================================================================
 * PERMISSION SERVICE - PRODUCTION-READY
 * ============================================================================
 *
 * Service centralisé pour la gestion des permissions
 * - Validation côté client ET serveur
 * - Support des permissions custom
 * - Cache des permissions pour performance
 * - Audit trail des vérifications de permissions
 */

import { logger } from '@/core/utils/logger';
import {
  Permission,
  UserRole,
  ROLE_PERMISSIONS,
  isAdminRole,
  isSuperAdminRole,
} from '@/features/users/types/role.types';
import type { User } from '@/features/users/types/user.types';

/**
 * Options pour la vérification de permissions
 */
export interface PermissionCheckOptions {
  /** User à vérifier */
  user: User | null;
  /** Permission(s) requise(s) */
  permissions: Permission | Permission[];
  /** Mode de vérification (AND = toutes, OR = au moins une) */
  mode?: 'AND' | 'OR';
  /** ID de l'établissement (optionnel, pour vérifications contextuelles) */
  establishmentId?: string;
  /** Audit la vérification (log dans Firestore) */
  audit?: boolean;
}

/**
 * Résultat d'une vérification de permission
 */
export interface PermissionCheckResult {
  /** Permission accordée */
  granted: boolean;
  /** Raison du refus (si granted = false) */
  reason?: string;
  /** Permissions manquantes */
  missingPermissions?: Permission[];
}

class PermissionService {
  /**
   * Cache des permissions par utilisateur (pour performance)
   * Key: userId, Value: Map<Permission, boolean>
   */
  private permissionCache: Map<string, Map<Permission, boolean>> = new Map();

  /**
   * Vérifier si un utilisateur a une ou plusieurs permissions
   */
  checkPermission(options: PermissionCheckOptions): PermissionCheckResult {
    const { user, permissions, mode = 'AND', establishmentId, audit = false } = options;

    // Pas d'utilisateur = pas de permission
    if (!user) {
      return {
        granted: false,
        reason: 'Utilisateur non authentifié',
      };
    }

    // Utilisateur inactif = pas de permission
    if (!user.isActive) {
      return {
        granted: false,
        reason: 'Utilisateur inactif',
      };
    }

    // Normaliser les permissions en tableau
    const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];

    // Vérifier l'accès à l'établissement (si spécifié)
    if (establishmentId && !this.hasEstablishmentAccess(user, establishmentId)) {
      return {
        granted: false,
        reason: "Pas d'accès à cet établissement",
      };
    }

    // Obtenir les permissions de l'utilisateur
    const userPermissions = this.getUserPermissions(user);

    // Vérifier les permissions selon le mode
    let granted = false;
    const missingPermissions: Permission[] = [];

    if (mode === 'AND') {
      // Mode AND : toutes les permissions sont requises
      granted = permissionsArray.every(perm => {
        const has = userPermissions.includes(perm);
        if (!has) {
          missingPermissions.push(perm);
        }
        return has;
      });
    } else {
      // Mode OR : au moins une permission est requise
      granted = permissionsArray.some(perm => userPermissions.includes(perm));

      if (!granted) {
        missingPermissions.push(...permissionsArray);
      }
    }

    // Audit si demandé
    if (audit) {
      this.auditPermissionCheck(user, permissionsArray, granted);
    }

    // Retourner le résultat
    return {
      granted,
      reason: granted ? undefined : `Permissions manquantes: ${missingPermissions.join(', ')}`,
      missingPermissions: granted ? undefined : missingPermissions,
    };
  }

  /**
   * Vérifie simplement si l'utilisateur a une permission (version simple)
   */
  hasPermission(user: User | null, permission: Permission): boolean {
    return this.checkPermission({ user, permissions: permission }).granted;
  }

  /**
   * Vérifie si l'utilisateur a toutes les permissions
   */
  hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
    return this.checkPermission({ user, permissions, mode: 'AND' }).granted;
  }

  /**
   * Vérifie si l'utilisateur a au moins une des permissions
   */
  hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
    return this.checkPermission({ user, permissions, mode: 'OR' }).granted;
  }

  /**
   * Vérifie si l'utilisateur est admin (ADMIN ou SUPER_ADMIN)
   */
  isAdmin(user: User | null): boolean {
    if (!user) return false;
    return isAdminRole(user.role);
  }

  /**
   * Vérifie si l'utilisateur est super admin
   */
  isSuperAdmin(user: User | null): boolean {
    if (!user) return false;
    return isSuperAdminRole(user.role);
  }

  /**
   * Obtenir toutes les permissions d'un utilisateur
   * (permissions du rôle + permissions custom)
   */
  getUserPermissions(user: User): Permission[] {
    // Utiliser le cache si disponible
    const cached = this.permissionCache.get(user.id);
    if (cached) {
      return Array.from(cached.keys()).filter(perm => cached.get(perm));
    }

    // Permissions de base du rôle
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];

    // Permissions custom (override ou ajout)
    const customPermissions = user.customPermissions || [];

    // Fusionner et dédupliquer
    const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];

    // Mettre en cache
    const cacheMap = new Map<Permission, boolean>();
    allPermissions.forEach(perm => cacheMap.set(perm, true));
    this.permissionCache.set(user.id, cacheMap);

    return allPermissions;
  }

  /**
   * Vérifier si l'utilisateur a accès à un établissement
   */
  hasEstablishmentAccess(user: User, establishmentId: string): boolean {
    // Super admin a accès à tous les établissements
    if (isSuperAdminRole(user.role)) {
      return true;
    }

    // Vérifier dans la liste des établissements de l'utilisateur
    return user.establishmentIds?.includes(establishmentId) ?? false;
  }

  /**
   * Vérifier si l'utilisateur peut modifier un autre utilisateur
   * (règle métier : un utilisateur ne peut pas modifier quelqu'un d'un rôle supérieur)
   */
  canManageUser(currentUser: User, targetUser: User): boolean {
    // Super admin peut tout faire
    if (isSuperAdminRole(currentUser.role)) {
      return true;
    }

    // Admin peut gérer tout sauf super admin
    if (isAdminRole(currentUser.role)) {
      return !isSuperAdminRole(targetUser.role);
    }

    // Manager peut gérer technicien, réceptionniste, viewer
    if (currentUser.role === UserRole.MANAGER) {
      return [UserRole.TECHNICIAN, UserRole.RECEPTIONIST, UserRole.VIEWER].includes(
        targetUser.role
      );
    }

    // Autres rôles ne peuvent pas gérer
    return false;
  }

  /**
   * Vérifier si l'utilisateur peut assigner un rôle
   */
  canAssignRole(currentUser: User, targetRole: UserRole): boolean {
    // Super admin peut assigner tous les rôles
    if (isSuperAdminRole(currentUser.role)) {
      return true;
    }

    // Admin peut assigner tous les rôles sauf super admin
    if (isAdminRole(currentUser.role)) {
      return targetRole !== UserRole.SUPER_ADMIN;
    }

    // Autres rôles ne peuvent pas assigner
    return false;
  }

  /**
   * Invalider le cache de permissions pour un utilisateur
   */
  clearUserCache(userId: string): void {
    this.permissionCache.delete(userId);
    logger.debug('Cache de permissions effacé', { userId });
  }

  /**
   * Invalider tout le cache
   */
  clearAllCache(): void {
    this.permissionCache.clear();
    logger.debug('Cache de permissions entièrement effacé');
  }

  /**
   * Audit trail des vérifications de permissions (à implémenter avec Firestore)
   */
  private auditPermissionCheck(user: User, permissions: Permission[], granted: boolean): void {
    logger.info('Vérification de permission auditée', {
      userId: user.id,
      userRole: user.role,
      permissions,
      granted,
      timestamp: new Date().toISOString(),
    });

    // TODO: Stocker dans Firestore pour audit trail complet
    // const auditDoc = {
    //   userId: user.id,
    //   permissions,
    //   granted,
    //   timestamp: serverTimestamp(),
    // };
    // await addDoc(collection(db, 'audit_logs'), auditDoc);
  }
}

// Instance singleton
export const permissionService = new PermissionService();

// Export de la classe pour les tests
export { PermissionService };
