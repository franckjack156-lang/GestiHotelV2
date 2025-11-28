/**
 * usePermissions Hook
 *
 * Hook personnalisé pour vérifier les permissions utilisateur
 */

import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { ROLE_PERMISSIONS, Permission, UserRole } from '@/shared/types';

export const usePermissions = () => {
  const { user } = useAuthStore();

  /**
   * Obtenir toutes les permissions de l'utilisateur actuel
   */
  const userPermissions = useMemo(() => {
    if (!user) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  }, [user]);

  /**
   * Vérifier si l'utilisateur a une permission spécifique
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;

    // Editor et Super admin ont toutes les permissions
    if (user.role === UserRole.EDITOR || user.role === UserRole.SUPER_ADMIN) return true;

    // Vérifier dans les permissions du rôle
    return userPermissions.includes(permission);
  };

  /**
   * Vérifier si l'utilisateur a toutes les permissions spécifiées
   */
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;
    if (user.role === UserRole.EDITOR || user.role === UserRole.SUPER_ADMIN) return true;

    return permissions.every(permission => userPermissions.includes(permission));
  };

  /**
   * Vérifier si l'utilisateur a au moins une des permissions spécifiées
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    if (user.role === UserRole.EDITOR || user.role === UserRole.SUPER_ADMIN) return true;

    return permissions.some(permission => userPermissions.includes(permission));
  };

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  /**
   * Vérifier si l'utilisateur a un des rôles spécifiés
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  /**
   * Vérifier si l'utilisateur est admin (editor, super_admin ou admin)
   */
  const isAdmin = (): boolean => {
    return hasAnyRole([UserRole.EDITOR, UserRole.SUPER_ADMIN, UserRole.ADMIN]);
  };

  /**
   * Vérifier si l'utilisateur est super admin ou editor
   */
  const isSuperAdmin = (): boolean => {
    return hasAnyRole([UserRole.EDITOR, UserRole.SUPER_ADMIN]);
  };

  /**
   * Vérifier si l'utilisateur est editor (plus haut privilège)
   */
  const isEditor = (): boolean => {
    return hasRole(UserRole.EDITOR);
  };

  /**
   * Vérifier si l'utilisateur peut accéder à un établissement
   */
  const canAccessEstablishment = (establishmentId: string): boolean => {
    if (!user) return false;

    // Editor et Super admin peuvent accéder à tous les établissements
    if (user.role === UserRole.EDITOR || user.role === UserRole.SUPER_ADMIN) return true;

    // Vérifier si l'utilisateur a accès à cet établissement
    return user.establishmentIds.includes(establishmentId);
  };

  /**
   * Vérifier si l'utilisateur peut modifier un établissement
   */
  const canEditEstablishment = (establishmentId: string): boolean => {
    if (!canAccessEstablishment(establishmentId)) return false;
    return hasPermission(Permission.ESTABLISHMENTS_EDIT);
  };

  /**
   * Vérifier si l'utilisateur peut gérer les utilisateurs
   */
  const canManageUsers = (): boolean => {
    return hasPermission(Permission.USERS_MANAGE_ROLES);
  };

  /**
   * Vérifier si l'utilisateur peut créer des interventions
   */
  const canCreateInterventions = (): boolean => {
    return hasPermission(Permission.INTERVENTIONS_CREATE);
  };

  /**
   * Vérifier si l'utilisateur peut assigner des interventions
   */
  const canAssignInterventions = (): boolean => {
    return hasPermission(Permission.INTERVENTIONS_ASSIGN);
  };

  /**
   * Vérifier si l'utilisateur peut voir les analytics
   */
  const canViewAnalytics = (): boolean => {
    return hasPermission(Permission.ANALYTICS_VIEW);
  };

  /**
   * Obtenir le niveau d'accès (pour le debug)
   */
  const getAccessLevel = () => {
    if (!user) return 'none';
    return {
      role: user.role,
      permissions: userPermissions,
      establishments: user.establishmentIds,
    };
  };

  return {
    // Permissions
    userPermissions,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,

    // Rôles
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    isEditor,

    // Établissements
    canAccessEstablishment,
    canEditEstablishment,

    // Actions spécifiques
    canManageUsers,
    canCreateInterventions,
    canAssignInterventions,
    canViewAnalytics,

    // Debug
    getAccessLevel,
  };
};
