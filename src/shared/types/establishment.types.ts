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
  // Core features (INDISPENSABLES - toujours activées)
  interventions: FeatureConfig;
  interventionQuickCreate: FeatureConfig;
  history: FeatureConfig;

  // Interventions - Fonctionnalités optionnelles
  interventionGuidedCreate: FeatureConfig;
  interventionTemplates: FeatureConfig;
  interventionImportExport: FeatureConfig;
  interventionRecurrence: FeatureConfig;
  interventionPlanning: FeatureConfig;

  // Communication
  comments: FeatureConfig;
  emailNotifications: FeatureConfig;
  pushNotifications: FeatureConfig;
  internalChat: FeatureConfig;

  // Médias
  photos: FeatureConfig;
  documents: FeatureConfig;
  signatures: FeatureConfig;

  // Pièces et stocks
  parts: FeatureConfig;
  partsOrderEmail: FeatureConfig;
  inventory: FeatureConfig;
  suppliers: FeatureConfig;

  // Temps et facturation
  timeTracking: FeatureConfig;
  manualTimeEntry: FeatureConfig;
  invoicing: FeatureConfig;
  financialReports: FeatureConfig;

  // Analytique
  dashboard: FeatureConfig;
  customReports: FeatureConfig;
  advancedStatistics: FeatureConfig;
  dataExport: FeatureConfig;

  // Chambres et espaces
  rooms: FeatureConfig;
  roomsQRCode: FeatureConfig;

  // Intégrations
  apiAccess: FeatureConfig;
  webhooks: FeatureConfig;
  thirdPartyIntegrations: FeatureConfig;
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
  logoUrl?: string; // Logo carré (pour header, sélecteur)
  logoWideUrl?: string; // Logo rectangulaire/horizontal (pour sidebar)
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

  // Email pour les commandes de pièces
  orderEmail?: string;

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
  logoWideUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  settings?: Partial<EstablishmentSettings>;
  features?: Partial<EstablishmentFeatures>;
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
  // Core features (INDISPENSABLES - toujours activées)
  interventions: { enabled: true },
  interventionQuickCreate: { enabled: true },
  history: { enabled: true },

  // Interventions - Fonctionnalités optionnelles
  interventionGuidedCreate: { enabled: true },
  interventionTemplates: { enabled: false },
  interventionImportExport: { enabled: true },
  interventionRecurrence: { enabled: false },
  interventionPlanning: { enabled: true },

  // Communication
  comments: { enabled: true },
  emailNotifications: { enabled: true },
  pushNotifications: { enabled: false },
  internalChat: { enabled: false },

  // Médias
  photos: { enabled: true },
  documents: { enabled: false },
  signatures: { enabled: false },

  // Pièces et stocks
  parts: { enabled: true },
  partsOrderEmail: { enabled: true },
  inventory: { enabled: false },
  suppliers: { enabled: false },

  // Temps et facturation
  timeTracking: { enabled: true },
  manualTimeEntry: { enabled: true },
  invoicing: { enabled: false },
  financialReports: { enabled: false },

  // Analytique
  dashboard: { enabled: true },
  customReports: { enabled: false },
  advancedStatistics: { enabled: false },
  dataExport: { enabled: true },

  // Chambres et espaces
  rooms: { enabled: true },
  roomsQRCode: { enabled: false },

  // Intégrations
  apiAccess: { enabled: false },
  webhooks: { enabled: false },
  thirdPartyIntegrations: { enabled: false },
};

/**
 * Métadonnées des features (labels, descriptions, icônes)
 */
export interface FeatureMetadata {
  key: keyof EstablishmentFeatures;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  category:
    | 'core'
    | 'interventions'
    | 'communication'
    | 'media'
    | 'parts'
    | 'time'
    | 'analytics'
    | 'rooms'
    | 'integrations';
  isRequired?: boolean; // Fonctionnalité indispensable (ne peut pas être désactivée)
  requiresConfig?: boolean;
  dependsOn?: (keyof EstablishmentFeatures)[];
  badge?: 'new' | 'beta' | 'premium' | 'coming-soon';
}

/**
 * Catalogue des features disponibles
 */
export const FEATURES_CATALOG: FeatureMetadata[] = [
  // ==================================================
  // CORE - Fonctionnalités indispensables
  // ==================================================
  {
    key: 'interventions',
    label: 'Gestion des interventions',
    description: 'CRUD des interventions de maintenance',
    icon: 'ClipboardList',
    category: 'core',
    isRequired: true,
  },
  {
    key: 'interventionQuickCreate',
    label: 'Création rapide',
    description: "Formulaire simplifié de création d'intervention",
    icon: 'Zap',
    category: 'core',
    isRequired: true,
    dependsOn: ['interventions'],
  },
  {
    key: 'history',
    label: 'Historique',
    description: 'Traçabilité complète des modifications',
    icon: 'History',
    category: 'core',
    isRequired: true,
    dependsOn: ['interventions'],
  },

  // ==================================================
  // INTERVENTIONS - Fonctionnalités optionnelles
  // ==================================================
  {
    key: 'interventionGuidedCreate',
    label: 'Création guidée',
    description: 'Wizard étape par étape pour créer une intervention',
    icon: 'Navigation',
    category: 'interventions',
    dependsOn: ['interventions'],
  },
  {
    key: 'interventionTemplates',
    label: "Modèles d'intervention",
    description: 'Templates pré-remplis pour interventions récurrentes',
    icon: 'FileText',
    category: 'interventions',
    dependsOn: ['interventions'],
    badge: 'coming-soon',
  },
  {
    key: 'interventionImportExport',
    label: 'Import/Export',
    description: "Import et export d'interventions (Excel, CSV)",
    icon: 'ArrowUpDown',
    category: 'interventions',
    dependsOn: ['interventions'],
  },
  {
    key: 'interventionRecurrence',
    label: 'Récurrence',
    description: 'Interventions récurrentes automatiques',
    icon: 'Repeat',
    category: 'interventions',
    dependsOn: ['interventions'],
    badge: 'coming-soon',
  },
  {
    key: 'interventionPlanning',
    label: 'Planning',
    description: 'Vue calendrier et planification',
    icon: 'Calendar',
    category: 'interventions',
    dependsOn: ['interventions'],
  },

  // ==================================================
  // COMMUNICATION
  // ==================================================
  {
    key: 'comments',
    label: 'Commentaires',
    description: 'Discussions et commentaires sur les interventions',
    icon: 'MessageSquare',
    category: 'communication',
    dependsOn: ['interventions'],
  },
  {
    key: 'emailNotifications',
    label: 'Notifications email',
    description: 'Alertes par email',
    icon: 'Mail',
    category: 'communication',
  },
  {
    key: 'pushNotifications',
    label: 'Notifications push',
    description: 'Notifications mobiles en temps réel',
    icon: 'BellRing',
    category: 'communication',
    requiresConfig: true,
    badge: 'coming-soon',
  },
  {
    key: 'internalChat',
    label: 'Chat interne',
    description: 'Messagerie instantanée entre techniciens',
    icon: 'MessagesSquare',
    category: 'communication',
    badge: 'coming-soon',
  },

  // ==================================================
  // MÉDIAS
  // ==================================================
  {
    key: 'photos',
    label: 'Photos',
    description: 'Photos avant/pendant/après intervention',
    icon: 'Camera',
    category: 'media',
    dependsOn: ['interventions'],
  },
  {
    key: 'documents',
    label: 'Documents',
    description: 'Pièces jointes (PDF, Word, etc.)',
    icon: 'Paperclip',
    category: 'media',
    dependsOn: ['interventions'],
    badge: 'coming-soon',
  },
  {
    key: 'signatures',
    label: 'Signatures électroniques',
    description: 'Signature numérique des interventions',
    icon: 'PenTool',
    category: 'media',
    dependsOn: ['interventions'],
    badge: 'premium',
  },

  // ==================================================
  // PIÈCES ET STOCKS
  // ==================================================
  {
    key: 'parts',
    label: 'Gestion des pièces',
    description: 'Liste des pièces par intervention',
    icon: 'Package',
    category: 'parts',
    dependsOn: ['interventions'],
  },
  {
    key: 'partsOrderEmail',
    label: 'Commande par email',
    description: 'Envoi automatique de commandes de pièces',
    icon: 'Send',
    category: 'parts',
    dependsOn: ['parts'],
    badge: 'new',
  },
  {
    key: 'inventory',
    label: 'Gestion des stocks',
    description: 'Suivi des stocks de pièces détachées',
    icon: 'Database',
    category: 'parts',
    dependsOn: ['parts'],
    badge: 'coming-soon',
  },
  {
    key: 'suppliers',
    label: 'Fournisseurs',
    description: 'Base de données des fournisseurs',
    icon: 'Truck',
    category: 'parts',
    dependsOn: ['parts'],
    badge: 'coming-soon',
  },

  // ==================================================
  // TEMPS ET FACTURATION
  // ==================================================
  {
    key: 'timeTracking',
    label: 'Chronomètre',
    description: 'Suivi du temps en temps réel',
    icon: 'Timer',
    category: 'time',
    dependsOn: ['interventions'],
  },
  {
    key: 'manualTimeEntry',
    label: 'Saisie manuelle',
    description: 'Ajout manuel de sessions de temps',
    icon: 'Clock',
    category: 'time',
    dependsOn: ['interventions'],
  },
  {
    key: 'invoicing',
    label: 'Facturation',
    description: 'Génération de factures',
    icon: 'FileText',
    category: 'time',
    dependsOn: ['timeTracking'],
    badge: 'premium',
  },
  {
    key: 'financialReports',
    label: 'Rapports financiers',
    description: 'Analyses de rentabilité',
    icon: 'DollarSign',
    category: 'time',
    dependsOn: ['invoicing'],
    badge: 'premium',
  },

  // ==================================================
  // ANALYTIQUE
  // ==================================================
  {
    key: 'dashboard',
    label: 'Tableau de bord',
    description: "Vue d'ensemble et statistiques de base",
    icon: 'BarChart3',
    category: 'analytics',
  },
  {
    key: 'customReports',
    label: 'Rapports personnalisés',
    description: 'Création de rapports sur mesure',
    icon: 'FileBarChart',
    category: 'analytics',
    dependsOn: ['dashboard'],
    badge: 'premium',
  },
  {
    key: 'advancedStatistics',
    label: 'Statistiques avancées',
    description: 'Analyses approfondies et prédictions',
    icon: 'TrendingUp',
    category: 'analytics',
    dependsOn: ['dashboard'],
    badge: 'premium',
  },
  {
    key: 'dataExport',
    label: 'Export de données',
    description: 'Export Excel, PDF, CSV',
    icon: 'Download',
    category: 'analytics',
  },

  // ==================================================
  // CHAMBRES ET ESPACES
  // ==================================================
  {
    key: 'rooms',
    label: 'Gestion des chambres',
    description: 'Base de données des chambres et espaces',
    icon: 'DoorClosed',
    category: 'rooms',
  },
  {
    key: 'roomsQRCode',
    label: 'QR Codes chambres',
    description: 'Génération et scan de QR codes par chambre',
    icon: 'QrCode',
    category: 'rooms',
    dependsOn: ['rooms'],
    badge: 'coming-soon',
  },

  // ==================================================
  // INTÉGRATIONS
  // ==================================================
  {
    key: 'apiAccess',
    label: 'Accès API',
    description: 'API REST pour intégrations externes',
    icon: 'Code',
    category: 'integrations',
    badge: 'premium',
  },
  {
    key: 'webhooks',
    label: 'Webhooks',
    description: 'Notifications automatiques vers systèmes tiers',
    icon: 'Webhook',
    category: 'integrations',
    badge: 'premium',
  },
  {
    key: 'thirdPartyIntegrations',
    label: 'Intégrations tierces',
    description: 'Connexion avec PMS et autres logiciels',
    icon: 'Plug',
    category: 'integrations',
    badge: 'coming-soon',
  },
];

/**
 * Labels des catégories de fonctionnalités
 */
export const FEATURE_CATEGORY_LABELS: Record<FeatureMetadata['category'], string> = {
  core: 'Fonctionnalités essentielles',
  interventions: 'Interventions',
  communication: 'Communication',
  media: 'Médias',
  parts: 'Pièces et stocks',
  time: 'Temps et facturation',
  analytics: 'Analytique',
  rooms: 'Chambres',
  integrations: 'Intégrations',
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
