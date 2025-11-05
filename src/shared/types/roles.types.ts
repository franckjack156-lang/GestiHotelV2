/**
 * Role & Permission Types
 * 
 * Système de permissions granulaires par rôle
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Rôles utilisateurs
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',     // Accès complet à tout
  ADMIN = 'admin',                  // Admin d'un établissement
  MANAGER = 'manager',              // Manager/superviseur
  TECHNICIAN = 'technician',        // Technicien de maintenance
  RECEPTIONIST = 'receptionist',    // Réceptionniste
  VIEWER = 'viewer',                // Lecture seule
}

/**
 * Permissions granulaires
 */
export enum Permission {
  // Interventions
  INTERVENTIONS_VIEW = 'interventions:view',
  INTERVENTIONS_CREATE = 'interventions:create',
  INTERVENTIONS_EDIT = 'interventions:edit',
  INTERVENTIONS_DELETE = 'interventions:delete',
  INTERVENTIONS_ASSIGN = 'interventions:assign',
  INTERVENTIONS_CLOSE = 'interventions:close',
  INTERVENTIONS_EXPORT = 'interventions:export',
  
  // Établissements
  ESTABLISHMENTS_VIEW = 'establishments:view',
  ESTABLISHMENTS_CREATE = 'establishments:create',
  ESTABLISHMENTS_EDIT = 'establishments:edit',
  ESTABLISHMENTS_DELETE = 'establishments:delete',
  ESTABLISHMENTS_SWITCH = 'establishments:switch',
  
  // Utilisateurs
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_EDIT = 'users:edit',
  USERS_DELETE = 'users:delete',
  USERS_MANAGE_ROLES = 'users:manage_roles',
  
  // Chambres
  ROOMS_VIEW = 'rooms:view',
  ROOMS_CREATE = 'rooms:create',
  ROOMS_EDIT = 'rooms:edit',
  ROOMS_DELETE = 'rooms:delete',
  ROOMS_BLOCK = 'rooms:block',
  
  // Analytics
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  ANALYTICS_ADVANCED = 'analytics:advanced',
  
  // Planning
  PLANNING_VIEW = 'planning:view',
  PLANNING_EDIT = 'planning:edit',
  
  // Templates
  TEMPLATES_VIEW = 'templates:view',
  TEMPLATES_CREATE = 'templates:create',
  TEMPLATES_EDIT = 'templates:edit',
  TEMPLATES_DELETE = 'templates:delete',
  
  // QR Codes
  QRCODES_VIEW = 'qrcodes:view',
  QRCODES_GENERATE = 'qrcodes:generate',
  QRCODES_SCAN = 'qrcodes:scan',
  
  // Messagerie
  MESSAGES_VIEW = 'messages:view',
  MESSAGES_SEND = 'messages:send',
  
  // Notifications
  NOTIFICATIONS_MANAGE = 'notifications:manage',
  
  // Paramètres
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',
  
  // Admin
  ADMIN_PANEL = 'admin:panel',
  ADMIN_LOGS = 'admin:logs',
  ADMIN_FEATURES = 'admin:features',
}

/**
 * Mapping rôles -> permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission), // Toutes les permissions
  
  [UserRole.ADMIN]: [
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
    Permission.ESTABLISHMENTS_EDIT,
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
    // QR Codes
    Permission.QRCODES_VIEW,
    Permission.QRCODES_GENERATE,
    Permission.QRCODES_SCAN,
    // Messages
    Permission.MESSAGES_VIEW,
    Permission.MESSAGES_SEND,
    // Notifications
    Permission.NOTIFICATIONS_MANAGE,
    // Settings
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
  ],
  
  [UserRole.MANAGER]: [
    // Interventions
    Permission.INTERVENTIONS_VIEW,
    Permission.INTERVENTIONS_CREATE,
    Permission.INTERVENTIONS_EDIT,
    Permission.INTERVENTIONS_ASSIGN,
    Permission.INTERVENTIONS_CLOSE,
    Permission.INTERVENTIONS_EXPORT,
    // Utilisateurs
    Permission.USERS_VIEW,
    // Chambres
    Permission.ROOMS_VIEW,
    Permission.ROOMS_BLOCK,
    // Analytics
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    // Planning
    Permission.PLANNING_VIEW,
    Permission.PLANNING_EDIT,
    // Templates
    Permission.TEMPLATES_VIEW,
    Permission.TEMPLATES_CREATE,
    // QR Codes
    Permission.QRCODES_VIEW,
    Permission.QRCODES_GENERATE,
    Permission.QRCODES_SCAN,
    // Messages
    Permission.MESSAGES_VIEW,
    Permission.MESSAGES_SEND,
    // Settings
    Permission.SETTINGS_VIEW,
  ],
  
  [UserRole.TECHNICIAN]: [
    // Interventions
    Permission.INTERVENTIONS_VIEW,
    Permission.INTERVENTIONS_EDIT,
    Permission.INTERVENTIONS_CLOSE,
    // Chambres
    Permission.ROOMS_VIEW,
    // Planning
    Permission.PLANNING_VIEW,
    // QR Codes
    Permission.QRCODES_SCAN,
    // Messages
    Permission.MESSAGES_VIEW,
    Permission.MESSAGES_SEND,
  ],
  
  [UserRole.RECEPTIONIST]: [
    // Interventions
    Permission.INTERVENTIONS_VIEW,
    Permission.INTERVENTIONS_CREATE,
    // Chambres
    Permission.ROOMS_VIEW,
    Permission.ROOMS_BLOCK,
    // Messages
    Permission.MESSAGES_VIEW,
    Permission.MESSAGES_SEND,
  ],
  
  [UserRole.VIEWER]: [
    // Interventions
    Permission.INTERVENTIONS_VIEW,
    // Chambres
    Permission.ROOMS_VIEW,
    // Analytics
    Permission.ANALYTICS_VIEW,
    // Planning
    Permission.PLANNING_VIEW,
  ],
};

/**
 * Labels des rôles (i18n friendly)
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrateur',
  [UserRole.ADMIN]: 'Administrateur',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.TECHNICIAN]: 'Technicien',
  [UserRole.RECEPTIONIST]: 'Réceptionniste',
  [UserRole.VIEWER]: 'Visualiseur',
};

/**
 * Descriptions des rôles
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Accès complet à toutes les fonctionnalités et tous les établissements',
  [UserRole.ADMIN]: 'Gestion complète d\'un établissement',
  [UserRole.MANAGER]: 'Supervision des interventions et du planning',
  [UserRole.TECHNICIAN]: 'Exécution des interventions techniques',
  [UserRole.RECEPTIONIST]: 'Création d\'interventions et gestion des chambres',
  [UserRole.VIEWER]: 'Consultation uniquement',
};

/**
 * Couleurs des rôles (pour les badges)
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [UserRole.ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [UserRole.MANAGER]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [UserRole.TECHNICIAN]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [UserRole.RECEPTIONIST]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [UserRole.VIEWER]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

/**
 * Type pour les informations de rôle
 */
export interface RoleInfo {
  role: UserRole;
  label: string;
  description: string;
  permissions: Permission[];
  color: string;
}

/**
 * Interface pour les données de rôle d'un utilisateur
 */
export interface UserRoleData {
  role: UserRole;
  establishmentId?: string; // null pour super_admin
  assignedAt: Timestamp;
  assignedBy: string; // userId de celui qui a assigné le rôle
}
