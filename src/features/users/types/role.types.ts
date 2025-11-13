/**
 * ============================================================================
 * ROLE TYPES
 * ============================================================================
 *
 * Types et permissions pour le système de rôles
 */

// ============================================================================
// USER ROLES
// ============================================================================

/**
 * Rôles utilisateur dans l'application
 */
export enum UserRole {
  /** Super Admin - Accès total, gestion multi-établissements */
  SUPER_ADMIN = 'super_admin',

  /** Admin - Gestion complète d'un établissement */
  ADMIN = 'admin',

  /** Manager - Gestion quotidienne, création interventions, assignation */
  MANAGER = 'manager',

  /** Technicien - Exécute les interventions */
  TECHNICIAN = 'technician',

  /** Réceptionniste - Création interventions de base */
  RECEPTIONIST = 'receptionist',

  /** Viewer - Lecture seule */
  VIEWER = 'viewer',
}

/**
 * Labels pour les rôles (affichage UI)
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
  [UserRole.ADMIN]: "Gestion complète de l'établissement, utilisateurs et paramètres",
  [UserRole.MANAGER]: 'Gestion des interventions, assignations et chambres',
  [UserRole.TECHNICIAN]: 'Exécution des interventions assignées',
  [UserRole.RECEPTIONIST]: "Création d'interventions de base",
  [UserRole.VIEWER]: 'Consultation uniquement, aucune modification',
};

/**
 * Couleurs pour les badges de rôles
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'purple',
  [UserRole.ADMIN]: 'red',
  [UserRole.MANAGER]: 'blue',
  [UserRole.TECHNICIAN]: 'green',
  [UserRole.RECEPTIONIST]: 'yellow',
  [UserRole.VIEWER]: 'gray',
};

// ============================================================================
// PERMISSIONS
// ============================================================================

/**
 * Permissions granulaires de l'application
 */
export enum Permission {
  // ========== INTERVENTIONS ==========
  /** Voir les interventions */
  INTERVENTIONS_VIEW = 'interventions.view',
  /** Voir toutes les interventions (pas seulement les siennes) */
  INTERVENTIONS_VIEW_ALL = 'interventions.view_all',
  /** Créer une intervention */
  INTERVENTIONS_CREATE = 'interventions.create',
  /** Modifier une intervention */
  INTERVENTIONS_EDIT = 'interventions.edit',
  /** Modifier toutes les interventions */
  INTERVENTIONS_EDIT_ALL = 'interventions.edit_all',
  /** Supprimer une intervention */
  INTERVENTIONS_DELETE = 'interventions.delete',
  /** Assigner une intervention à un technicien */
  INTERVENTIONS_ASSIGN = 'interventions.assign',
  /** Changer le statut d'une intervention */
  INTERVENTIONS_CHANGE_STATUS = 'interventions.change_status',
  /** Modifier la priorité */
  INTERVENTIONS_CHANGE_PRIORITY = 'interventions.change_priority',
  /** Exporter les interventions */
  INTERVENTIONS_EXPORT = 'interventions.export',
  /** Voir l'historique */
  INTERVENTIONS_VIEW_HISTORY = 'interventions.view_history',
  /** Clôturer une intervention */
  INTERVENTIONS_CLOSE = 'interventions.close',
  /** Valider une intervention */
  INTERVENTIONS_VALIDATE = 'interventions.validate',

  // ========== USERS ==========
  /** Voir les utilisateurs */
  USERS_VIEW = 'users.view',
  /** Créer un utilisateur */
  USERS_CREATE = 'users.create',
  /** Modifier un utilisateur */
  USERS_EDIT = 'users.edit',
  /** Supprimer un utilisateur */
  USERS_DELETE = 'users.delete',
  /** Gérer les rôles et permissions */
  USERS_MANAGE_ROLES = 'users.manage_roles',
  /** Inviter des utilisateurs */
  USERS_INVITE = 'users.invite',

  // ========== ESTABLISHMENTS ==========
  /** Voir les établissements */
  ESTABLISHMENTS_VIEW = 'establishments.view',
  /** Créer un établissement */
  ESTABLISHMENTS_CREATE = 'establishments.create',
  /** Modifier un établissement */
  ESTABLISHMENTS_EDIT = 'establishments.edit',
  /** Supprimer un établissement */
  ESTABLISHMENTS_DELETE = 'establishments.delete',
  /** Changer d'établissement */
  ESTABLISHMENTS_SWITCH = 'establishments.switch',

  // ========== ROOMS ==========
  /** Voir les chambres */
  ROOMS_VIEW = 'rooms.view',
  /** Créer une chambre */
  ROOMS_CREATE = 'rooms.create',
  /** Modifier une chambre */
  ROOMS_EDIT = 'rooms.edit',
  /** Supprimer une chambre */
  ROOMS_DELETE = 'rooms.delete',
  /** Bloquer/débloquer une chambre */
  ROOMS_BLOCK = 'rooms.block',

  // ========== PLANNING ==========
  /** Voir le planning */
  PLANNING_VIEW = 'planning.view',
  /** Modifier le planning */
  PLANNING_EDIT = 'planning.edit',
  /** Réorganiser les interventions */
  PLANNING_REORDER = 'planning.reorder',

  // ========== ANALYTICS ==========
  /** Voir les analytics */
  ANALYTICS_VIEW = 'analytics.view',
  /** Voir les analytics avancées */
  ANALYTICS_ADVANCED = 'analytics.advanced',
  /** Exporter les rapports */
  ANALYTICS_EXPORT = 'analytics.export',

  // ========== SETTINGS ==========
  /** Voir les paramètres */
  SETTINGS_VIEW = 'settings.view',
  /** Modifier les paramètres */
  SETTINGS_EDIT = 'settings.edit',
  /** Gérer les listes de référence */
  SETTINGS_REFERENCE_LISTS = 'settings.reference_lists',

  // ========== NOTIFICATIONS ==========
  /** Voir les notifications */
  NOTIFICATIONS_VIEW = 'notifications.view',
  /** Envoyer des notifications */
  NOTIFICATIONS_SEND = 'notifications.send',
  /** Configurer les notifications */
  NOTIFICATIONS_CONFIGURE = 'notifications.configure',

  // ========== MESSAGES ==========
  /** Envoyer des messages */
  MESSAGES_SEND = 'messages.send',
  /** Voir tous les messages */
  MESSAGES_VIEW_ALL = 'messages.view_all',

  // ========== TEMPLATES ==========
  /** Voir les templates */
  TEMPLATES_VIEW = 'templates.view',
  /** Créer des templates */
  TEMPLATES_CREATE = 'templates.create',
  /** Modifier des templates */
  TEMPLATES_EDIT = 'templates.edit',
  /** Supprimer des templates */
  TEMPLATES_DELETE = 'templates.delete',

  // ========== IMPORTS ==========
  /** Importer des données */
  IMPORTS_EXECUTE = 'imports.execute',

  // ========== SUPER ADMIN ONLY ==========
  /** Accès système complet */
  SYSTEM_ADMIN = 'system.admin',
}

// ============================================================================
// ROLE PERMISSIONS MAPPING
// ============================================================================

/**
 * Permissions par rôle
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // SUPER ADMIN - Toutes les permissions
  [UserRole.SUPER_ADMIN]: Object.values(Permission),

  // ADMIN - Gestion complète établissement
  [UserRole.ADMIN]: [
    // Interventions
    Permission.INTERVENTIONS_VIEW,
    Permission.INTERVENTIONS_VIEW_ALL,
    Permission.INTERVENTIONS_CREATE,
    Permission.INTERVENTIONS_EDIT,
    Permission.INTERVENTIONS_EDIT_ALL,
    Permission.INTERVENTIONS_DELETE,
    Permission.INTERVENTIONS_ASSIGN,
    Permission.INTERVENTIONS_CHANGE_STATUS,
    Permission.INTERVENTIONS_CHANGE_PRIORITY,
    Permission.INTERVENTIONS_EXPORT,
    Permission.INTERVENTIONS_VIEW_HISTORY,

    // Users
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.USERS_DELETE,
    Permission.USERS_MANAGE_ROLES,
    Permission.USERS_INVITE,

    // Establishments
    Permission.ESTABLISHMENTS_VIEW,
    Permission.ESTABLISHMENTS_EDIT,

    // Rooms
    Permission.ROOMS_VIEW,
    Permission.ROOMS_CREATE,
    Permission.ROOMS_EDIT,
    Permission.ROOMS_DELETE,
    Permission.ROOMS_BLOCK,

    // Planning
    Permission.PLANNING_VIEW,
    Permission.PLANNING_EDIT,
    Permission.PLANNING_REORDER,

    // Analytics
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_ADVANCED,
    Permission.ANALYTICS_EXPORT,

    // Settings
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
    Permission.SETTINGS_REFERENCE_LISTS,

    // Notifications
    Permission.NOTIFICATIONS_SEND,
    Permission.NOTIFICATIONS_CONFIGURE,

    // Messages
    Permission.MESSAGES_SEND,
    Permission.MESSAGES_VIEW_ALL,

    // Templates
    Permission.TEMPLATES_VIEW,
    Permission.TEMPLATES_CREATE,
    Permission.TEMPLATES_EDIT,
    Permission.TEMPLATES_DELETE,

    // Imports
    Permission.IMPORTS_EXECUTE,
  ],

  // MANAGER - Gestion quotidienne
  [UserRole.MANAGER]: [
    // Interventions
    Permission.INTERVENTIONS_VIEW,
    Permission.INTERVENTIONS_VIEW_ALL,
    Permission.INTERVENTIONS_CREATE,
    Permission.INTERVENTIONS_EDIT,
    Permission.INTERVENTIONS_ASSIGN,
    Permission.INTERVENTIONS_CHANGE_STATUS,
    Permission.INTERVENTIONS_CHANGE_PRIORITY,
    Permission.INTERVENTIONS_EXPORT,
    Permission.INTERVENTIONS_VIEW_HISTORY,

    // Users
    Permission.USERS_VIEW,

    // Establishments
    Permission.ESTABLISHMENTS_VIEW,

    // Rooms
    Permission.ROOMS_VIEW,
    Permission.ROOMS_EDIT,
    Permission.ROOMS_BLOCK,

    // Planning
    Permission.PLANNING_VIEW,
    Permission.PLANNING_EDIT,
    Permission.PLANNING_REORDER,

    // Analytics
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,

    // Settings
    Permission.SETTINGS_VIEW,

    // Messages
    Permission.MESSAGES_SEND,
    Permission.MESSAGES_VIEW_ALL,

    // Templates
    Permission.TEMPLATES_VIEW,
    Permission.TEMPLATES_CREATE,
    Permission.TEMPLATES_EDIT,
  ],

  // TECHNICIAN - Exécution interventions
  [UserRole.TECHNICIAN]: [
    // Interventions (seulement les siennes)
    Permission.INTERVENTIONS_VIEW,
    Permission.INTERVENTIONS_EDIT,
    Permission.INTERVENTIONS_CHANGE_STATUS,

    // Users
    Permission.USERS_VIEW,

    // Rooms
    Permission.ROOMS_VIEW,

    // Planning
    Permission.PLANNING_VIEW,

    // Messages
    Permission.MESSAGES_SEND,

    // Templates
    Permission.TEMPLATES_VIEW,
  ],

  // RECEPTIONIST - Création interventions de base
  [UserRole.RECEPTIONIST]: [
    // Interventions
    Permission.INTERVENTIONS_VIEW,
    Permission.INTERVENTIONS_CREATE,
    Permission.INTERVENTIONS_EDIT,

    // Users
    Permission.USERS_VIEW,

    // Rooms
    Permission.ROOMS_VIEW,

    // Planning
    Permission.PLANNING_VIEW,

    // Messages
    Permission.MESSAGES_SEND,

    // Templates
    Permission.TEMPLATES_VIEW,
  ],

  // VIEWER - Lecture seule
  [UserRole.VIEWER]: [
    // Interventions
    Permission.INTERVENTIONS_VIEW,

    // Users
    Permission.USERS_VIEW,

    // Establishments
    Permission.ESTABLISHMENTS_VIEW,

    // Rooms
    Permission.ROOMS_VIEW,

    // Planning
    Permission.PLANNING_VIEW,

    // Analytics
    Permission.ANALYTICS_VIEW,

    // Templates
    Permission.TEMPLATES_VIEW,
  ],
};

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

/**
 * Vérifier si un rôle a une permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Vérifier si un rôle a toutes les permissions données
 */
export function roleHasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  return permissions.every(perm => rolePerms.includes(perm));
}

/**
 * Vérifier si un rôle a au moins une des permissions données
 */
export function roleHasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  return permissions.some(perm => rolePerms.includes(perm));
}

/**
 * Obtenir toutes les permissions d'un rôle
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Vérifier si un rôle est admin (ADMIN ou SUPER_ADMIN)
 */
export function isAdminRole(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

/**
 * Vérifier si un rôle est super admin
 */
export function isSuperAdminRole(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}

/**
 * Obtenir la hiérarchie des rôles (du plus élevé au plus bas)
 */
export const ROLE_HIERARCHY: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.TECHNICIAN,
  UserRole.RECEPTIONIST,
  UserRole.VIEWER,
];

/**
 * Comparer deux rôles (retourne true si role1 >= role2)
 */
export function compareRoles(role1: UserRole, role2: UserRole): boolean {
  const index1 = ROLE_HIERARCHY.indexOf(role1);
  const index2 = ROLE_HIERARCHY.indexOf(role2);
  return index1 <= index2;
}

// ============================================================================
// PERMISSION GROUPS (pour UI)
// ============================================================================

/**
 * Groupes de permissions pour l'UI
 */
export const PERMISSION_GROUPS: Record<
  string,
  {
    label: string;
    description: string;
    permissions: Permission[];
  }
> = {
  interventions: {
    label: 'Interventions',
    description: 'Gestion des interventions techniques',
    permissions: [
      Permission.INTERVENTIONS_VIEW,
      Permission.INTERVENTIONS_VIEW_ALL,
      Permission.INTERVENTIONS_CREATE,
      Permission.INTERVENTIONS_EDIT,
      Permission.INTERVENTIONS_EDIT_ALL,
      Permission.INTERVENTIONS_DELETE,
      Permission.INTERVENTIONS_ASSIGN,
      Permission.INTERVENTIONS_CHANGE_STATUS,
      Permission.INTERVENTIONS_CHANGE_PRIORITY,
      Permission.INTERVENTIONS_EXPORT,
      Permission.INTERVENTIONS_VIEW_HISTORY,
    ],
  },
  users: {
    label: 'Utilisateurs',
    description: 'Gestion des utilisateurs et des accès',
    permissions: [
      Permission.USERS_VIEW,
      Permission.USERS_CREATE,
      Permission.USERS_EDIT,
      Permission.USERS_DELETE,
      Permission.USERS_MANAGE_ROLES,
      Permission.USERS_INVITE,
    ],
  },
  establishments: {
    label: 'Établissements',
    description: 'Gestion des établissements',
    permissions: [
      Permission.ESTABLISHMENTS_VIEW,
      Permission.ESTABLISHMENTS_CREATE,
      Permission.ESTABLISHMENTS_EDIT,
      Permission.ESTABLISHMENTS_DELETE,
      Permission.ESTABLISHMENTS_SWITCH,
    ],
  },
  rooms: {
    label: 'Chambres',
    description: 'Gestion des chambres et des blocages',
    permissions: [
      Permission.ROOMS_VIEW,
      Permission.ROOMS_CREATE,
      Permission.ROOMS_EDIT,
      Permission.ROOMS_DELETE,
      Permission.ROOMS_BLOCK,
    ],
  },
  planning: {
    label: 'Planning',
    description: 'Gestion du planning et du calendrier',
    permissions: [Permission.PLANNING_VIEW, Permission.PLANNING_EDIT, Permission.PLANNING_REORDER],
  },
  analytics: {
    label: 'Analytics',
    description: 'Statistiques et rapports',
    permissions: [
      Permission.ANALYTICS_VIEW,
      Permission.ANALYTICS_ADVANCED,
      Permission.ANALYTICS_EXPORT,
    ],
  },
  settings: {
    label: 'Paramètres',
    description: "Configuration de l'application",
    permissions: [
      Permission.SETTINGS_VIEW,
      Permission.SETTINGS_EDIT,
      Permission.SETTINGS_REFERENCE_LISTS,
    ],
  },
  messaging: {
    label: 'Messagerie',
    description: 'Messages et notifications',
    permissions: [
      Permission.MESSAGES_SEND,
      Permission.MESSAGES_VIEW_ALL,
      Permission.NOTIFICATIONS_SEND,
      Permission.NOTIFICATIONS_CONFIGURE,
    ],
  },
  templates: {
    label: 'Templates',
    description: "Modèles d'interventions",
    permissions: [
      Permission.TEMPLATES_VIEW,
      Permission.TEMPLATES_CREATE,
      Permission.TEMPLATES_EDIT,
      Permission.TEMPLATES_DELETE,
    ],
  },
};
