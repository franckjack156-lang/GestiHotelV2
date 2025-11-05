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

    // Super admin a toutes les permissions
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Vérifier dans les permissions du rôle
    return userPermissions.includes(permission);
  };

  /**
   * Vérifier si l'utilisateur a toutes les permissions spécifiées
   */
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;
    if (user.role === UserRole.SUPER_ADMIN) return true;

    return permissions.every((permission) => userPermissions.includes(permission));
  };

  /**
   * Vérifier si l'utilisateur a au moins une des permissions spécifiées
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    if (user.role === UserRole.SUPER_ADMIN) return true;

    return permissions.some((permission) => userPermissions.includes(permission));
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
   * Vérifier si l'utilisateur est admin (super_admin ou admin)
   */
  const isAdmin = (): boolean => {
    return hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
  };

  /**
   * Vérifier si l'utilisateur est super admin
   */
  const isSuperAdmin = (): boolean => {
    return hasRole(UserRole.SUPER_ADMIN);
  };

  /**
   * Vérifier si l'utilisateur peut accéder à un établissement
   */
  const canAccessEstablishment = (establishmentId: string): boolean => {
    if (!user) return false;

    // Super admin peut accéder à tous les établissements
    if (user.role === UserRole.SUPER_ADMIN) return true;

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
