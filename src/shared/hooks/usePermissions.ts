/**
 * usePermissions Hook
 *
 * Hook pour vérifier les permissions de l'utilisateur actuel
 */

import { useMemo } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROLE_PERMISSIONS } from '@/shared/constants/permissions';
// TODO: roleHasPermission and UserRole imported but unused
// import { roleHasPermission } from '@/shared/constants/permissions';
// import { UserRole } from '@/features/users/types/role.types';
import { Permission } from '@/features/users/types/role.types';
import type { Intervention } from '@/features/interventions/types/intervention.types';

/**
 * Hook de gestion des permissions
 */
export const usePermissions = () => {
  const { user } = useAuth();

  /**
   * Vérifier si l'utilisateur a une permission
   */
  const hasPermission = useMemo(
    () =>
      (permission: Permission): boolean => {
        if (!user) return false;

        const userPermissions = ROLE_PERMISSIONS[user.role];
        return userPermissions ? userPermissions.includes(permission) : false;
      },
    [user]
  );

  /**
   * Vérifier si l'utilisateur a toutes les permissions d'une liste
   */
  const hasAllPermissions = useMemo(
    () =>
      (permissions: Permission[]): boolean => {
        if (!user) return false;

        return permissions.every(permission => hasPermission(permission));
      },
    [user, hasPermission]
  );

  /**
   * Vérifier si l'utilisateur a au moins une permission d'une liste
   */
  const hasAnyPermission = useMemo(
    () =>
      (permissions: Permission[]): boolean => {
        if (!user) return false;

        return permissions.some(permission => hasPermission(permission));
      },
    [user, hasPermission]
  );

  // =========================================
  // Permissions INTERVENTIONS
  // =========================================

  /**
   * Peut voir les interventions
   */
  const canViewInterventions = useMemo(
    () => hasPermission(Permission.INTERVENTIONS_VIEW),
    [hasPermission]
  );

  /**
   * Peut créer des interventions
   */
  const canCreateInterventions = useMemo(
    () => hasPermission(Permission.INTERVENTIONS_CREATE),
    [hasPermission]
  );

  /**
   * Peut éditer une intervention
   *
   * Règles:
   * - SUPER_ADMIN, ADMIN, MANAGER: Toutes les interventions
   * - RECEPTIONIST: Uniquement ses propres interventions non assignées
   * - TECHNICIAN: Uniquement ses interventions assignées
   */
  const canEditIntervention = useMemo(
    () =>
      (intervention?: Intervention): boolean => {
        if (!user || !intervention) return false;

        // Permission globale d'édition
        if (hasPermission(Permission.INTERVENTIONS_EDIT)) {
          // SuperAdmin, Admin, Manager peuvent éditer toutes les interventions
          if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'manager') {
            return true;
          }

          // Receptionist: Peut éditer ses propres interventions non assignées
          if (user.role === 'receptionist') {
            return intervention.createdBy === user.id && !intervention.assignedTo;
          }

          // Technician: Peut éditer ses interventions assignées
          if (user.role === 'technician') {
            return intervention.assignedTo === user.id;
          }
        }

        return false;
      },
    [user, hasPermission]
  );

  /**
   * Peut supprimer des interventions
   *
   * Règles:
   * - Uniquement SUPER_ADMIN et ADMIN
   */
  const canDeleteIntervention = useMemo(
    () =>
      (intervention?: Intervention): boolean => {
        if (!user || !intervention) return false;

        return hasPermission(Permission.INTERVENTIONS_DELETE);
      },
    [user, hasPermission]
  );

  /**
   * Peut assigner des interventions
   */
  const canAssignInterventions = useMemo(
    () => hasPermission(Permission.INTERVENTIONS_ASSIGN),
    [hasPermission]
  );

  /**
   * Peut clôturer des interventions
   */
  const canCloseInterventions = useMemo(
    () => hasPermission(Permission.INTERVENTIONS_CLOSE),
    [hasPermission]
  );

  /**
   * Peut exporter des interventions
   */
  const canExportInterventions = useMemo(
    () => hasPermission(Permission.INTERVENTIONS_EXPORT),
    [hasPermission]
  );

  // =========================================
  // Permissions ÉTABLISSEMENTS
  // =========================================

  /**
   * Peut voir les établissements
   */
  const canViewEstablishments = useMemo(
    () => hasPermission(Permission.ESTABLISHMENTS_VIEW),
    [hasPermission]
  );

  /**
   * Peut créer des établissements
   */
  const canCreateEstablishments = useMemo(
    () => hasPermission(Permission.ESTABLISHMENTS_CREATE),
    [hasPermission]
  );

  /**
   * Peut éditer des établissements
   */
  const canEditEstablishments = useMemo(
    () => hasPermission(Permission.ESTABLISHMENTS_EDIT),
    [hasPermission]
  );

  /**
   * Peut supprimer des établissements
   */
  const canDeleteEstablishments = useMemo(
    () => hasPermission(Permission.ESTABLISHMENTS_DELETE),
    [hasPermission]
  );

  /**
   * Peut changer d'établissement
   */
  const canSwitchEstablishments = useMemo(
    () => hasPermission(Permission.ESTABLISHMENTS_SWITCH),
    [hasPermission]
  );

  // =========================================
  // Permissions UTILISATEURS
  // =========================================

  /**
   * Peut voir les utilisateurs
   */
  const canViewUsers = useMemo(() => hasPermission(Permission.USERS_VIEW), [hasPermission]);

  /**
   * Peut créer des utilisateurs
   */
  const canCreateUsers = useMemo(() => hasPermission(Permission.USERS_CREATE), [hasPermission]);

  /**
   * Peut éditer des utilisateurs
   */
  const canEditUsers = useMemo(() => hasPermission(Permission.USERS_EDIT), [hasPermission]);

  /**
   * Peut supprimer des utilisateurs
   */
  const canDeleteUsers = useMemo(() => hasPermission(Permission.USERS_DELETE), [hasPermission]);

  /**
   * Peut gérer les rôles
   */
  const canManageRoles = useMemo(
    () => hasPermission(Permission.USERS_MANAGE_ROLES),
    [hasPermission]
  );

  // =========================================
  // Permissions CHAMBRES
  // =========================================

  /**
   * Peut voir les chambres
   */
  const canViewRooms = useMemo(() => hasPermission(Permission.ROOMS_VIEW), [hasPermission]);

  /**
   * Peut bloquer/débloquer des chambres
   */
  const canBlockRooms = useMemo(() => hasPermission(Permission.ROOMS_BLOCK), [hasPermission]);

  // =========================================
  // Permissions ANALYTICS
  // =========================================

  /**
   * Peut voir les analytics
   */
  const canViewAnalytics = useMemo(() => hasPermission(Permission.ANALYTICS_VIEW), [hasPermission]);

  /**
   * Peut voir les analytics avancées
   */
  const canViewAdvancedAnalytics = useMemo(
    () => hasPermission(Permission.ANALYTICS_ADVANCED),
    [hasPermission]
  );

  /**
   * Peut exporter les analytics
   */
  const canExportAnalytics = useMemo(
    () => hasPermission(Permission.ANALYTICS_EXPORT),
    [hasPermission]
  );

  // =========================================
  // Permissions PLANNING
  // =========================================

  /**
   * Peut voir le planning
   */
  const canViewPlanning = useMemo(() => hasPermission(Permission.PLANNING_VIEW), [hasPermission]);

  /**
   * Peut éditer le planning
   */
  const canEditPlanning = useMemo(() => hasPermission(Permission.PLANNING_EDIT), [hasPermission]);

  // =========================================
  // Permissions TEMPLATES
  // =========================================

  /**
   * Peut voir les templates
   */
  const canViewTemplates = useMemo(() => hasPermission(Permission.TEMPLATES_VIEW), [hasPermission]);

  /**
   * Peut créer des templates
   */
  const canCreateTemplates = useMemo(
    () => hasPermission(Permission.TEMPLATES_CREATE),
    [hasPermission]
  );

  /**
   * Peut éditer des templates
   */
  const canEditTemplates = useMemo(() => hasPermission(Permission.TEMPLATES_EDIT), [hasPermission]);

  /**
   * Peut supprimer des templates
   */
  const canDeleteTemplates = useMemo(
    () => hasPermission(Permission.TEMPLATES_DELETE),
    [hasPermission]
  );

  // =========================================
  // Permissions PARAMÈTRES
  // =========================================

  /**
   * Peut voir les paramètres
   */
  const canViewSettings = useMemo(() => hasPermission(Permission.SETTINGS_VIEW), [hasPermission]);

  /**
   * Peut éditer les paramètres
   */
  const canEditSettings = useMemo(() => hasPermission(Permission.SETTINGS_EDIT), [hasPermission]);

  // =========================================
  // Return
  // =========================================

  return {
    // Fonctions génériques
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,

    // Interventions
    canViewInterventions,
    canCreateInterventions,
    canEditIntervention,
    canDeleteIntervention,
    canAssignInterventions,
    canCloseInterventions,
    canExportInterventions,

    // Établissements
    canViewEstablishments,
    canCreateEstablishments,
    canEditEstablishments,
    canDeleteEstablishments,
    canSwitchEstablishments,

    // Utilisateurs
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canManageRoles,

    // Chambres
    canViewRooms,
    canBlockRooms,

    // Analytics
    canViewAnalytics,
    canViewAdvancedAnalytics,
    canExportAnalytics,

    // Planning
    canViewPlanning,
    canEditPlanning,

    // Templates
    canViewTemplates,
    canCreateTemplates,
    canEditTemplates,
    canDeleteTemplates,

    // Paramètres
    canViewSettings,
    canEditSettings,
  };
};
