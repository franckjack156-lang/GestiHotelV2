/**
 * Permissions Constants
 * 
 * Définition des permissions granulaires par rôle utilisateur
 */

import { UserRole, Permission } from '@/shared/types/roles.types';

/**
 * Permissions par rôle
 * 
 * Chaque rôle a un ensemble spécifique de permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  /**
   * SUPER_ADMIN - Accès complet à tout
   */
  [UserRole.SUPER_ADMIN]: [
    // Interventions
    Permission.INTERVENTIONS_VIEW,
    Permission.INTERVENTIONS_CREATE,
    Permission.INTERVENTIONS_EDIT,
    Permission.INTERVENTIONS_DELETE,
    Permission.INTERVENTIONS_ASSIGN,
    Permission.INTERVENTIONS_CLOSE,
    Permission.INTERVENTIONS_EXPORT,
    
    // Établissements
    Permission.ESTABLISHMENTS_VIEW,
    Permission.ESTABLISHMENTS_CREATE,
    Permission.ESTABLISHMENTS_EDIT,
    Permission.ESTABLISHMENTS_DELETE,
    Permission.ESTABLISHMENTS_SWITCH,
    
    // Utilisateurs
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.USERS_DELETE,
    Permission.USERS_MANAGE_ROLES,
    
    // Chambres
    Permission.ROOMS_VIEW,
    Permission.ROOMS_CREATE,
    Permission.ROOMS_EDIT,
    Permission.ROOMS_DELETE,
    Permission.ROOMS_BLOCK,
    
    // Analytics
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.ANALYTICS_ADVANCED,
    
    // Planning
    Permission.PLANNING_VIEW,
    Permission.PLANNING_EDIT,
    
    // Templates
    Permission.TEMPLATES_VIEW,
    Permission.TEMPLATES_CREATE,
    Permission.TEMPLATES_EDIT,
    Permission.TEMPLATES_DELETE,
    
    // Notifications
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_MANAGE,
    
    // Paramètres
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
  ],

  /**
   * ADMIN - Administrateur d'un établissement
   */
  [UserRole.ADMIN]: [
    // Interventions - Accès complet
    Permission.INTERVENTIONS_VIEW,
    Permission.INTERVENTIONS_CREATE,
    Permission.INTERVENTIONS_EDIT,
    Permission.INTERVENTIONS_DELETE,
    Permission.INTERVENTIONS_ASSIGN,
    Permission.INTERVENTIONS_CLOSE,
    Permission.INTERVENTIONS_EXPORT,
    
    // Établissements - Lecture + édition de son établissement
    Permission.ESTABLISHMENTS_VIEW,
    Permission.ESTABLISHMENTS_EDIT,
    
    // Utilisateurs - Accès complet (son établissement)
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.USERS_DELETE,
    Permission.USERS_MANAGE_ROLES,
    
    // Chambres - Accès complet
    Permission.ROOMS_VIEW,
    Permission.ROOMS_CREATE,
    Permission.ROOMS_EDIT,
    Permission.ROOMS_DELETE,
    Permission.ROOMS_BLOCK,
    
    // Analytics - Accès complet
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.ANALYTICS_ADVANCED,
    
    // Planning - Accès complet
    Permission.PLANNING_VIEW,
    Permission.PLANNING_EDIT,
    
    // Templates - Accès complet
    Permission.TEMPLATES_VIEW,
    Permission.TEMPLATES_CREATE,
    Permission.TEMPLATES_EDIT,
    Permission.TEMPLATES_DELETE,
    
    // Notifications
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_MANAGE,
    
    // Paramètres
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
  ],

  /**
   * MANAGER - Manager/Superviseur
   */
  [UserRole.MANAGER]: [
    // Interventions - Accès complet
    Permission.INTERVENTIONS_VIEW,
    Permission.INTERVENTIONS_CREATE,
    Permission.INTERVENTIONS_EDIT,
    Permission.INTERVENTIONS_ASSIGN,
    Permission.INTERVENTIONS_CLOSE,
    Permission.INTERVENTIONS_EXPORT,
    // PAS de suppression
    
    // Établissements - Lecture seule
    Permission.ESTABLISHMENTS_VIEW,
    
    // Utilisateurs - Lecture seule
    Permission.USERS_VIEW,
    
    // Chambres - Accès complet
    Permission.ROOMS_VIEW,
    Permission.ROOMS_BLOCK,
    
    // Analytics - Vue standard
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    
    // Planning - Accès complet
    Permission.PLANNING_VIEW,
    Permission.PLANNING_EDIT,
    
    // Templates - Lecture + création
    Permission.TEMPLATES_VIEW,
    Permission.TEMPLATES_CREATE,
    
    // Notifications
    Permission.NOTIFICATIONS_VIEW,
    
    // Paramètres - Lecture
    Permission.SETTINGS_VIEW,
  ],

  /**
   * TECHNICIAN - Technicien de maintenance
   */
  [UserRole.TECHNICIAN]: [
    // Interventions - Lecture + édition de ses interventions
    Permission.INTERVENTIONS_VIEW,
    Permission.INTERVENTIONS_EDIT, // Uniquement ses interventions
    Permission.INTERVENTIONS_CLOSE,
    
    // Établissements - Lecture
    Permission.ESTABLISHMENTS_VIEW,
    
    // Chambres - Lecture
    Permission.ROOMS_VIEW,
    
    // Planning - Lecture
    Permission.PLANNING_VIEW,
    
    // Templates - Lecture
    Permission.TEMPLATES_VIEW,
    
    // Notifications
    Permission.NOTIFICATIONS_VIEW,
  ],

  /**
   * RECEPTIONIST - Réceptionniste
   */
  [UserRole.RECEPTIONIST]: [
    // Interventions - Création + édition limitée
    Permission.INTERVENTIONS_VIEW,
    Permission.INTERVENTIONS_CREATE,
    
    // Établissements - Lecture
    Permission.ESTABLISHMENTS_VIEW,
    
    // Chambres - Blocage/déblocage
    Permission.ROOMS_VIEW,
    Permission.ROOMS_BLOCK,
    
    // Planning - Lecture
    Permission.PLANNING_VIEW,
    
    // Templates - Lecture
    Permission.TEMPLATES_VIEW,
    
    // Notifications
    Permission.NOTIFICATIONS_VIEW,
  ],

  /**
   * VIEWER - Lecture seule
   */
  [UserRole.VIEWER]: [
    // Interventions - Lecture seule
    Permission.INTERVENTIONS_VIEW,
    
    // Établissements - Lecture
    Permission.ESTABLISHMENTS_VIEW,
    
    // Chambres - Lecture
    Permission.ROOMS_VIEW,
    
    // Analytics - Vue basique
    Permission.ANALYTICS_VIEW,
    
    // Planning - Lecture
    Permission.PLANNING_VIEW,
    
    // Templates - Lecture
    Permission.TEMPLATES_VIEW,
  ],
};

/**
 * Vérifier si un rôle a une permission
 */
export const roleHasPermission = (role: UserRole, permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
};

/**
 * Vérifier si un rôle a toutes les permissions d'une liste
 */
export const roleHasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.every((permission) => roleHasPermission(role, permission));
};

/**
 * Vérifier si un rôle a au moins une permission d'une liste
 */
export const roleHasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.some((permission) => roleHasPermission(role, permission));
};

/**
 * Obtenir toutes les permissions d'un rôle
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Labels des rôles (pour affichage)
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrateur',
  [UserRole.ADMIN]: 'Administrateur',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.TECHNICIAN]: 'Technicien',
  [UserRole.RECEPTIONIST]: 'Réceptionniste',
  [UserRole.VIEWER]: 'Observateur',
};

/**
 * Descriptions des rôles
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Accès complet à tous les établissements et toutes les fonctionnalités',
  [UserRole.ADMIN]: 'Administration complète de son établissement',
  [UserRole.MANAGER]: 'Gestion des interventions et supervision',
  [UserRole.TECHNICIAN]: 'Exécution des interventions techniques',
  [UserRole.RECEPTIONIST]: 'Création d\'interventions et gestion des chambres',
  [UserRole.VIEWER]: 'Consultation uniquement, aucune modification',
};
