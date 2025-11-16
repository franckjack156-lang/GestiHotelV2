/**
 * ============================================================================
 * USER TYPES
 * ============================================================================
 *
 * Types et interfaces pour la gestion des utilisateurs
 */

import type { Timestamp } from 'firebase/firestore';
import type { UserRole, Permission } from './role.types';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Statut d'un utilisateur
 * - ACTIVE: Actif - peut se connecter
 * - INACTIVE: Inactif - ne peut pas se connecter
 * - PENDING: En attente d'activation
 * - SUSPENDED: Suspendu temporairement
 * - BANNED: Banni définitivement
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

// ============================================================================
// BASE USER
// ============================================================================

/**
 * Utilisateur de base
 */
export interface User {
  /** Identifiant unique (Firebase Auth UID) */
  id: string;

  /** Email de l'utilisateur */
  email: string;

  /** Nom complet */
  displayName: string;

  /** Prénom */
  firstName: string;

  /** Nom de famille */
  lastName: string;

  /** Rôle global de l'utilisateur */
  role: UserRole;

  /** Est un technicien (peut recevoir des assignations d'interventions) */
  isTechnician?: boolean;

  /** URL de la photo de profil */
  photoURL?: string;

  /** Numéro de téléphone */
  phoneNumber?: string;

  /** Liste des établissements accessibles */
  establishmentIds: string[];

  /** Établissement actif actuellement */
  currentEstablishmentId?: string;

  /** Statut du compte */
  status: UserStatus;

  /** Compte actif */
  isActive: boolean;

  /** Email vérifié */
  emailVerified: boolean;

  /** Date de création */
  createdAt: Date | Timestamp;

  /** Date de dernière modification */
  updatedAt: Date | Timestamp;

  /** Créé par (user ID) */
  createdBy?: string;

  /** Dernière connexion */
  lastLoginAt?: Date | Timestamp;

  /** Permissions spécifiques (override du rôle) */
  customPermissions?: Permission[];

  /** Tokens FCM pour notifications push */
  fcmTokens?: string[];
}

// ============================================================================
// USER PROFILE (données étendues)
// ============================================================================

/**
 * Profil utilisateur étendu
 */
export interface UserProfile extends User {
  /** Biographie / Description */
  bio?: string;

  /** Titre / Poste */
  jobTitle?: string;

  /** Département */
  department?: string;

  /** Localisation */
  location?: string;

  /** Langue préférée */
  locale?: string;

  /** Fuseau horaire */
  timezone?: string;

  /** Préférences de notifications */
  notificationPreferences: NotificationPreferences;

  /** Préférences d'affichage */
  displayPreferences: DisplayPreferences;

  /** Compétences (pour techniciens) */
  skills?: string[];

  /** Certifications */
  certifications?: string[];

  /** Spécialités techniques */
  specialties?: string[];

  /** Niveau d'expérience */
  experienceLevel?: 'junior' | 'intermediate' | 'senior' | 'expert';

  /** Date de naissance */
  birthDate?: Date | Timestamp;

  /** Adresse */
  address?: Address;

  /** Informations d'urgence */
  emergencyContact?: EmergencyContact;

  /** Métadonnées additionnelles */
  metadata?: Record<string, any>;
}

/**
 * Préférences de notifications
 */
export interface NotificationPreferences {
  /** Notifications email */
  email: {
    enabled: boolean;
    interventions: boolean;
    assignments: boolean;
    statusChanges: boolean;
    messages: boolean;
    reports: boolean;
    dailyDigest?: boolean;
  };

  /** Notifications push */
  push: {
    enabled: boolean;
    interventions: boolean;
    assignments: boolean;
    statusChanges: boolean;
    messages: boolean;
  };

  /** Notifications in-app */
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
}

/**
 * Préférences d'affichage
 */
export interface DisplayPreferences {
  /** Thème (light, dark, auto) */
  theme: 'light' | 'dark' | 'auto';

  /** Couleur du thème */
  themeColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink';

  /** Densité UI (compact, comfortable, spacious) */
  density: 'compact' | 'comfortable' | 'spacious';

  /** Vue par défaut (liste, grille, calendrier) */
  defaultView: 'list' | 'grid' | 'calendar';

  /** Nombre d'items par page */
  itemsPerPage: number;

  /** Langue interface */
  language: string;

  /** Format de date */
  dateFormat: string;

  /** Format d'heure */
  timeFormat: '12h' | '24h';

  /** Sidebar collapsed par défaut */
  sidebarCollapsed: boolean;
}

/**
 * Adresse
 */
export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

/**
 * Contact d'urgence
 */
export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

// ============================================================================
// CREATE / UPDATE
// ============================================================================

/**
 * Données pour créer un utilisateur
 */
export interface CreateUserData {
  /** Email (obligatoire) */
  email: string;

  /** Mot de passe (obligatoire pour création) */
  password: string;

  /** Prénom */
  firstName: string;

  /** Nom de famille */
  lastName: string;

  /** Rôle */
  role: UserRole;

  /** Établissements accessibles */
  establishmentIds: string[];

  /** Téléphone (optionnel) */
  phoneNumber?: string;

  /** Photo URL (optionnel) */
  photoURL?: string;

  /** Titre / Poste */
  jobTitle?: string;

  /** Département */
  department?: string;

  /** Compétences */
  skills?: string[];

  /** Est un technicien (peut recevoir des assignations d'interventions) */
  isTechnician?: boolean;

  /** Spécialités techniques (pour techniciens) */
  specialties?: string[];

  /** Niveau d'expérience (pour techniciens) */
  experienceLevel?: 'junior' | 'intermediate' | 'senior' | 'expert';

  /** Envoyer email d'invitation */
  sendInvitation?: boolean;
}

/**
 * Données pour mettre à jour un utilisateur
 */
export interface UpdateUserData {
  /** Prénom */
  firstName?: string;

  /** Nom de famille */
  lastName?: string;

  /** Rôle */
  role?: UserRole;

  /** Établissements accessibles */
  establishmentIds?: string[];

  /** Téléphone */
  phoneNumber?: string;

  /** Photo URL */
  photoURL?: string;

  /** Titre / Poste */
  jobTitle?: string;

  /** Département */
  department?: string;

  /** Compétences */
  skills?: string[];

  /** Est un technicien (peut recevoir des assignations d'interventions) */
  isTechnician?: boolean;

  /** Spécialités techniques (pour techniciens) */
  specialties?: string[];

  /** Niveau d'expérience (pour techniciens) */
  experienceLevel?: 'junior' | 'intermediate' | 'senior' | 'expert';

  /** Statut */
  status?: UserStatus;

  /** Actif */
  isActive?: boolean;

  /** Permissions custom */
  customPermissions?: Permission[];
}

/**
 * Données pour mettre à jour le profil
 */
export interface UpdateProfileData {
  /** Nom complet */
  displayName?: string;

  /** Prénom */
  firstName?: string;

  /** Nom de famille */
  lastName?: string;

  /** Photo URL */
  photoURL?: string;

  /** Téléphone */
  phoneNumber?: string;

  /** Bio */
  bio?: string;

  /** Titre */
  jobTitle?: string;

  /** Département */
  department?: string;

  /** Compétences */
  skills?: string[];

  /** Localisation */
  location?: string;

  /** Adresse */
  address?: Address;

  /** Contact d'urgence */
  emergencyContact?: EmergencyContact;

  /** Préférences */
  notificationPreferences?: Partial<NotificationPreferences>;
  displayPreferences?: Partial<DisplayPreferences>;
}

/**
 * Données pour changer le rôle d'un utilisateur
 */
export interface ChangeUserRoleData {
  userId: string;
  newRole: UserRole;
  establishmentIds?: string[];
  reason?: string;
}

// ============================================================================
// FILTERS & SORT
// ============================================================================

/**
 * Filtres pour la liste d'utilisateurs
 */
export interface UserFilters {
  /** Recherche par nom ou email */
  search?: string;

  /** Filtrer par rôle */
  role?: UserRole | UserRole[];

  /** Filtrer par statut */
  status?: UserStatus | UserStatus[];

  /** Filtrer par établissement */
  establishmentId?: string;

  /** Filtrer par département */
  department?: string;

  /** Afficher uniquement actifs */
  activeOnly?: boolean;

  /** Afficher uniquement avec compétences */
  withSkills?: string[];
}

/**
 * Options de tri pour les utilisateurs
 */
export interface UserSortOptions {
  /** Champ de tri */
  field: 'displayName' | 'email' | 'createdAt' | 'lastLoginAt' | 'role';

  /** Direction du tri */
  direction: 'asc' | 'desc';
}

// ============================================================================
// INVITE & INVITATION
// ============================================================================

/**
 * Invitation utilisateur
 */
export interface UserInvitation {
  /** ID de l'invitation */
  id: string;

  /** Email invité */
  email: string;

  /** Rôle prévu */
  role: UserRole;

  /** Établissements accessibles */
  establishmentIds: string[];

  /** Invité par (user ID) */
  invitedBy: string;

  /** Nom de celui qui invite */
  invitedByName?: string;

  /** Token d'invitation */
  token: string;

  /** Date d'expiration */
  expiresAt: Date | Timestamp;

  /** Date de création */
  createdAt: Date | Timestamp;

  /** Statut */
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';

  /** Date d'acceptation */
  acceptedAt?: Date | Timestamp;
}

/**
 * Données pour inviter un utilisateur
 */
export interface InviteUserData {
  email: string;
  role: UserRole;
  establishmentIds: string[];
  firstName?: string;
  lastName?: string;
  message?: string;
}

// ============================================================================
// STATS & ANALYTICS
// ============================================================================

/**
 * Statistiques utilisateur
 */
export interface UserStats {
  /** Nombre total d'utilisateurs */
  totalUsers: number;

  /** Utilisateurs actifs */
  activeUsers: number;

  /** Utilisateurs inactifs */
  inactiveUsers: number;

  /** Répartition par rôle */
  byRole: Record<UserRole, number>;

  /** Répartition par statut */
  byStatus: Record<UserStatus, number>;

  /** Nouveaux utilisateurs (30 jours) */
  newUsersLast30Days: number;

  /** Dernières connexions */
  recentLogins: number;

  /** Utilisateurs par établissement */
  byEstablishment: Record<string, number>;

  /** Statistiques interventions */
  totalInterventions?: number;
  completedInterventions?: number;
  pendingInterventions?: number;
  averageCompletionTime?: number;
}

/**
 * Activité utilisateur
 */
export interface UserActivity {
  /** ID activité */
  id: string;

  /** User ID */
  userId: string;

  /** Type d'activité */
  type:
    | 'login'
    | 'logout'
    | 'profile_update'
    | 'password_change'
    | 'intervention_created'
    | 'intervention_updated';

  /** Action */
  action: string;

  /** Description */
  description?: string;

  /** Resource */
  resource?: string;

  /** Resource ID */
  resourceId?: string;

  /** Métadonnées */
  metadata?: Record<string, any>;

  /** Date */
  timestamp: Date | Timestamp;

  /** IP address (optionnel) */
  ipAddress?: string;

  /** User agent */
  userAgent?: string;
}

// ============================================================================
// SESSION & AUTH
// ============================================================================

/**
 * Session utilisateur
 */
export interface UserSession {
  userId: string;
  token: string;
  deviceInfo: {
    type: 'web' | 'mobile' | 'tablet';
    os?: string;
    browser?: string;
  };
  ipAddress?: string;
  createdAt: Date | Timestamp;
  expiresAt: Date | Timestamp;
  lastActivityAt: Date | Timestamp;
}

/**
 * Type pour les données d'authentification
 */
export interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * Type pour reset password
 */
export interface PasswordResetData {
  email: string;
}

/**
 * Type pour change password
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Notification utilisateur
 */
export interface UserNotification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date | Timestamp;
  createdAt: Date | Timestamp;
  link?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Utilisateur avec données établissement
 */
export interface UserWithEstablishment extends User {
  establishment: {
    id: string;
    name: string;
  };
}

/**
 * Utilisateur simplifié (pour sélecteurs)
 */
export interface UserSimple {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  isActive?: boolean;
}

/**
 * Profil utilisateur (version publique)
 */
export interface UserPublicProfile {
  id: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  isActive: boolean;
  jobTitle?: string;
  department?: string;
}

/**
 * Résumé utilisateur pour listes
 */
export interface UserSummary {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date | Timestamp;
}

/**
 * Options de liste d'utilisateurs
 */
export interface UsersListConfig {
  /** Vue (list, grid, table) */
  view: 'list' | 'grid' | 'table';

  /** Items par page */
  itemsPerPage: number;

  /** Colonnes visibles (mode table) */
  visibleColumns?: string[];

  /** Grouper par */
  groupBy?: 'role' | 'department' | 'establishment';
}
