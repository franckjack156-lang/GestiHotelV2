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
 * Chaque feature peut être activée/désactivée par établissement
 */
export interface EstablishmentFeatures {
  // Core features
  interventions: FeatureConfig;
  rooms: FeatureConfig;
  planning: FeatureConfig;
  analytics: FeatureConfig;

  // Communication features
  messaging: FeatureConfig;
  notifications: FeatureConfig;
  pushNotifications: FeatureConfig;

  // Data management features
  exports: FeatureConfig;
  tags: FeatureConfig;
  photos: FeatureConfig;

  // Advanced features
  qrcodes: FeatureConfig;
  templates: FeatureConfig;
  signatures: FeatureConfig;
  validation: FeatureConfig;
  advancedAnalytics: FeatureConfig;
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
  // Core features (activées par défaut)
  interventions: { enabled: true },
  rooms: { enabled: true },
  planning: { enabled: true },
  analytics: { enabled: true },

  // Communication features
  messaging: { enabled: true },
  notifications: { enabled: true },
  pushNotifications: { enabled: false }, // Nécessite configuration supplémentaire

  // Data management features
  exports: { enabled: true },
  tags: { enabled: true },
  photos: { enabled: true },

  // Advanced features (désactivées par défaut)
  qrcodes: { enabled: false },
  templates: { enabled: false },
  signatures: { enabled: false },
  validation: { enabled: true },
  advancedAnalytics: { enabled: false },
};

/**
 * Métadonnées des features (labels, descriptions, icônes)
 */
export interface FeatureMetadata {
  key: keyof EstablishmentFeatures;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'core' | 'communication' | 'data' | 'advanced';
  requiresConfig?: boolean;
  dependsOn?: (keyof EstablishmentFeatures)[];
}

/**
 * Catalogue des features disponibles
 */
export const FEATURES_CATALOG: FeatureMetadata[] = [
  // Core features
  {
    key: 'interventions',
    label: 'Interventions',
    description: 'Gestion des interventions de maintenance',
    icon: 'ClipboardList',
    category: 'core',
  },
  {
    key: 'rooms',
    label: 'Chambres',
    description: 'Gestion des chambres et espaces',
    icon: 'DoorClosed',
    category: 'core',
  },
  {
    key: 'planning',
    label: 'Planning',
    description: 'Calendrier et planification des interventions',
    icon: 'Calendar',
    category: 'core',
    dependsOn: ['interventions'],
  },
  {
    key: 'analytics',
    label: 'Analytics de base',
    description: 'Statistiques et rapports simples',
    icon: 'BarChart3',
    category: 'core',
  },

  // Communication features
  {
    key: 'messaging',
    label: 'Messagerie',
    description: 'Commentaires et discussions sur les interventions',
    icon: 'MessageSquare',
    category: 'communication',
    dependsOn: ['interventions'],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Notifications dans l\'application',
    icon: 'Bell',
    category: 'communication',
  },
  {
    key: 'pushNotifications',
    label: 'Notifications Push',
    description: 'Notifications push sur appareils mobiles',
    icon: 'BellRing',
    category: 'communication',
    requiresConfig: true,
    dependsOn: ['notifications'],
  },

  // Data management features
  {
    key: 'exports',
    label: 'Export de données',
    description: 'Export en Excel, PDF, CSV',
    icon: 'Download',
    category: 'data',
  },
  {
    key: 'tags',
    label: 'Gestion des tags',
    description: 'Étiquettes personnalisées pour les interventions',
    icon: 'Tag',
    category: 'data',
    dependsOn: ['interventions'],
  },
  {
    key: 'photos',
    label: 'Photos',
    description: 'Photos attachées aux interventions',
    icon: 'Camera',
    category: 'data',
    dependsOn: ['interventions'],
  },

  // Advanced features
  {
    key: 'qrcodes',
    label: 'QR Codes',
    description: 'Génération et scan de QR codes',
    icon: 'QrCode',
    category: 'advanced',
  },
  {
    key: 'templates',
    label: 'Templates',
    description: 'Modèles d\'interventions pré-remplis',
    icon: 'FileText',
    category: 'advanced',
    dependsOn: ['interventions'],
  },
  {
    key: 'signatures',
    label: 'Signatures',
    description: 'Signature électronique des interventions',
    icon: 'PenTool',
    category: 'advanced',
    dependsOn: ['interventions'],
  },
  {
    key: 'validation',
    label: 'Validation',
    description: 'Workflow de validation des interventions',
    icon: 'CheckCircle',
    category: 'advanced',
    dependsOn: ['interventions'],
  },
  {
    key: 'advancedAnalytics',
    label: 'Analytics avancées',
    description: 'Rapports détaillés et analytics personnalisées',
    icon: 'TrendingUp',
    category: 'advanced',
    dependsOn: ['analytics'],
  },
];

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
