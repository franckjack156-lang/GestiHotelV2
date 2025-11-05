/**
 * Establishment Types
 * 
 * Types pour la gestion des établissements hôteliers
 */

import type { TimestampedDocument, Address, Contact, FeatureConfig } from './common.types';

/**
 * Type d'établissement
 */
export enum EstablishmentType {
  HOTEL = 'hotel',
  RESORT = 'resort',
  MOTEL = 'motel',
  HOSTEL = 'hostel',
  APARTMENT = 'apartment',
  OTHER = 'other',
}

/**
 * Catégorie d'établissement (étoiles)
 */
export type EstablishmentCategory = 1 | 2 | 3 | 4 | 5;

/**
 * Configuration des features d'un établissement
 */
export interface EstablishmentFeatures {
  interventions: FeatureConfig;
  rooms: FeatureConfig;
  planning: FeatureConfig;
  analytics: FeatureConfig;
  qrcodes: FeatureConfig;
  templates: FeatureConfig;
  messaging: FeatureConfig;
  notifications: FeatureConfig;
  exports: FeatureConfig;
  signatures: FeatureConfig;
}

/**
 * Établissement
 */
export interface Establishment extends TimestampedDocument {
  // Informations de base
  name: string;
  displayName: string;
  type: EstablishmentType;
  category?: EstablishmentCategory;
  
  // Description
  description?: string;
  
  // Adresse et contact
  address: Address;
  contact: Contact;
  website?: string;
  
  // Capacité
  totalRooms: number;
  totalFloors?: number;
  
  // Logo et branding
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  
  // Statut
  isActive: boolean;
  
  // Configuration des fonctionnalités
  features: EstablishmentFeatures;
  
  // Informations légales
  siret?: string;
  vatNumber?: string;
  legalName?: string;
  
  // Paramètres
  settings: EstablishmentSettings;
  
  // Métadonnées
  ownerId: string; // userId du propriétaire
  managerIds: string[]; // userIds des managers
  
  // Statistiques
  stats?: EstablishmentStats;
}

/**
 * Paramètres d'établissement
 */
export interface EstablishmentSettings {
  // Fuseau horaire
  timezone: string;
  
  // Langue par défaut
  defaultLanguage: 'fr' | 'en';
  
  // Devises
  currency: string;
  
  // Format de date
  dateFormat: string;
  timeFormat: '12h' | '24h';
  
  // Numérotation des interventions
  interventionPrefix: string;
  interventionStartNumber: number;
  
  // Notifications
  notificationEmail?: string;
  
  // Intégrations
  integrations?: {
    pms?: {
      enabled: boolean;
      provider?: string;
      apiKey?: string;
    };
  };
  
  // Heures d'ouverture
  businessHours?: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
}

/**
 * Statistiques d'établissement
 */
export interface EstablishmentStats {
  totalInterventions: number;
  pendingInterventions: number;
  completedInterventions: number;
  totalUsers: number;
  activeUsers: number;
  totalRooms: number;
  blockedRooms: number;
  averageResponseTime: number; // en minutes
  averageCompletionTime: number; // en minutes
  lastUpdated: Date;
}

/**
 * Données pour créer un établissement
 */
export interface CreateEstablishmentData {
  name: string;
  type: EstablishmentType;
  category?: EstablishmentCategory;
  address: Address;
  contact: Contact;
  totalRooms: number;
  totalFloors?: number;
  description?: string;
  website?: string;
  timezone?: string;
}

/**
 * Données pour mettre à jour un établissement
 */
export interface UpdateEstablishmentData {
  name?: string;
  displayName?: string;
  description?: string;
  address?: Partial<Address>;
  contact?: Partial<Contact>;
  website?: string;
  totalRooms?: number;
  totalFloors?: number;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  settings?: Partial<EstablishmentSettings>;
}

/**
 * Résumé d'établissement pour listes
 */
export interface EstablishmentSummary {
  id: string;
  name: string;
  type: EstablishmentType;
  category?: EstablishmentCategory;
  logoUrl?: string;
  isActive: boolean;
  totalRooms: number;
  city: string;
}

/**
 * Filtre établissements
 */
export interface EstablishmentFilters {
  type?: EstablishmentType;
  category?: EstablishmentCategory;
  isActive?: boolean;
  city?: string;
  search?: string;
}

/**
 * Labels des types d'établissement
 */
export const ESTABLISHMENT_TYPE_LABELS: Record<EstablishmentType, string> = {
  [EstablishmentType.HOTEL]: 'Hôtel',
  [EstablishmentType.RESORT]: 'Resort',
  [EstablishmentType.MOTEL]: 'Motel',
  [EstablishmentType.HOSTEL]: 'Auberge',
  [EstablishmentType.APARTMENT]: 'Résidence',
  [EstablishmentType.OTHER]: 'Autre',
};

/**
 * Configuration par défaut des features
 */
export const DEFAULT_ESTABLISHMENT_FEATURES: EstablishmentFeatures = {
  interventions: { enabled: true },
  rooms: { enabled: true },
  planning: { enabled: true },
  analytics: { enabled: true },
  qrcodes: { enabled: false },
  templates: { enabled: false },
  messaging: { enabled: true },
  notifications: { enabled: true },
  exports: { enabled: true },
  signatures: { enabled: false },
};

/**
 * Paramètres par défaut
 */
export const DEFAULT_ESTABLISHMENT_SETTINGS: EstablishmentSettings = {
  timezone: 'Europe/Paris',
  defaultLanguage: 'fr',
  currency: 'EUR',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  interventionPrefix: 'INT',
  interventionStartNumber: 1,
};
