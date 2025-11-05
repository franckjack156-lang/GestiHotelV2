/**
 * User Types
 * 
 * Types pour la gestion des utilisateurs
 */

import type { Timestamp } from 'firebase/firestore';
import type { UserRole } from './roles.types';
import type { TimestampedDocument, Contact, UserPreferences } from './common.types';

/**
 * Utilisateur de base
 */
export interface User extends TimestampedDocument {
  // Informations personnelles
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  
  // Rôle et permissions
  role: UserRole;
  establishmentIds: string[]; // Établissements auxquels l'utilisateur a accès
  currentEstablishmentId?: string; // Établissement actuellement sélectionné
  
  // Contact
  phone?: string;
  mobile?: string;
  
  // Statut
  isActive: boolean;
  isEmailVerified: boolean;
  
  // Préférences
  preferences: UserPreferences;
  
  // Métadonnées
  lastLoginAt?: Timestamp;
  createdBy?: string; // userId du créateur
  
  // Tokens FCM pour notifications push
  fcmTokens?: string[];
  
  // Champs optionnels
  bio?: string;
  department?: string;
  position?: string;
}

/**
 * Profil utilisateur (version publique)
 */
export interface UserProfile {
  id: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * Données pour créer un utilisateur
 */
export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  establishmentIds: string[];
  phone?: string;
  mobile?: string;
  photoURL?: string;
  position?: string;
  department?: string;
}

/**
 * Données pour mettre à jour un utilisateur
 */
export interface UpdateUserData {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  mobile?: string;
  photoURL?: string;
  position?: string;
  department?: string;
  bio?: string;
  preferences?: Partial<UserPreferences>;
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

/**
 * Statistiques utilisateur
 */
export interface UserStats {
  totalInterventions: number;
  completedInterventions: number;
  pendingInterventions: number;
  averageCompletionTime: number; // en minutes
  lastActivityAt?: Timestamp;
}

/**
 * Activité utilisateur
 */
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
}

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
  createdAt: Timestamp;
  expiresAt: Timestamp;
  lastActivityAt: Timestamp;
}

/**
 * Invitation utilisateur
 */
export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  establishmentIds: string[];
  invitedBy: string;
  invitedByName: string;
  invitedAt: Timestamp;
  expiresAt: Timestamp;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  acceptedAt?: Timestamp;
  token: string;
}

/**
 * Filtre utilisateurs
 */
export interface UserFilters {
  role?: UserRole;
  establishmentId?: string;
  isActive?: boolean;
  search?: string;
}

/**
 * Options de tri utilisateurs
 */
export type UserSortField = 'displayName' | 'email' | 'createdAt' | 'lastLoginAt' | 'role';

export interface UserSortOptions {
  field: UserSortField;
  order: 'asc' | 'desc';
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
  readAt?: Timestamp;
  createdAt: Timestamp;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Paramètres de notification utilisateur
 */
export interface NotificationSettings {
  email: {
    enabled: boolean;
    interventionAssigned: boolean;
    interventionCompleted: boolean;
    interventionOverdue: boolean;
    dailyDigest: boolean;
  };
  push: {
    enabled: boolean;
    interventionAssigned: boolean;
    interventionCompleted: boolean;
    interventionOverdue: boolean;
    messages: boolean;
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
}
