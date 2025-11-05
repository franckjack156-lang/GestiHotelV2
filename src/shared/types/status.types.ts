/**
 * Status & Priority Types
 * 
 * Types pour les statuts et priorités des interventions
 */

/**
 * Statuts d'intervention
 */
export enum InterventionStatus {
  DRAFT = 'draft',               // Brouillon
  PENDING = 'pending',           // En attente
  ASSIGNED = 'assigned',         // Assignée
  IN_PROGRESS = 'in_progress',   // En cours
  ON_HOLD = 'on_hold',          // En pause
  COMPLETED = 'completed',       // Terminée
  VALIDATED = 'validated',       // Validée
  CANCELLED = 'cancelled',       // Annulée
}

/**
 * Priorités d'intervention
 */
export enum InterventionPriority {
  LOW = 'low',           // Basse
  NORMAL = 'normal',     // Normale
  HIGH = 'high',         // Haute
  URGENT = 'urgent',     // Urgente
  CRITICAL = 'critical', // Critique
}

/**
 * Types d'intervention
 */
export enum InterventionType {
  PLUMBING = 'plumbing',           // Plomberie
  ELECTRICITY = 'electricity',     // Électricité
  HEATING = 'heating',             // Chauffage
  AIR_CONDITIONING = 'air_conditioning', // Climatisation
  CARPENTRY = 'carpentry',         // Menuiserie
  PAINTING = 'painting',           // Peinture
  CLEANING = 'cleaning',           // Nettoyage
  LOCKSMITH = 'locksmith',         // Serrurerie
  GLAZING = 'glazing',             // Vitrerie
  MASONRY = 'masonry',             // Maçonnerie
  APPLIANCE = 'appliance',         // Électroménager
  FURNITURE = 'furniture',         // Mobilier
  IT = 'it',                       // Informatique
  SECURITY = 'security',           // Sécurité
  GARDEN = 'garden',               // Jardinage
  POOL = 'pool',                   // Piscine
  OTHER = 'other',                 // Autre
}

/**
 * Catégories d'intervention
 */
export enum InterventionCategory {
  MAINTENANCE = 'maintenance',     // Maintenance préventive
  REPAIR = 'repair',               // Réparation
  INSTALLATION = 'installation',   // Installation
  INSPECTION = 'inspection',       // Inspection
  EMERGENCY = 'emergency',         // Urgence
}

/**
 * Labels des statuts
 */
export const STATUS_LABELS: Record<InterventionStatus, string> = {
  [InterventionStatus.DRAFT]: 'Brouillon',
  [InterventionStatus.PENDING]: 'En attente',
  [InterventionStatus.ASSIGNED]: 'Assignée',
  [InterventionStatus.IN_PROGRESS]: 'En cours',
  [InterventionStatus.ON_HOLD]: 'En pause',
  [InterventionStatus.COMPLETED]: 'Terminée',
  [InterventionStatus.VALIDATED]: 'Validée',
  [InterventionStatus.CANCELLED]: 'Annulée',
};

/**
 * Couleurs des statuts
 */
export const STATUS_COLORS: Record<InterventionStatus, string> = {
  [InterventionStatus.DRAFT]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  [InterventionStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [InterventionStatus.ASSIGNED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [InterventionStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  [InterventionStatus.ON_HOLD]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [InterventionStatus.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [InterventionStatus.VALIDATED]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  [InterventionStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

/**
 * Icônes des statuts (Lucide React)
 */
export const STATUS_ICONS: Record<InterventionStatus, string> = {
  [InterventionStatus.DRAFT]: 'FileEdit',
  [InterventionStatus.PENDING]: 'Clock',
  [InterventionStatus.ASSIGNED]: 'UserCheck',
  [InterventionStatus.IN_PROGRESS]: 'Wrench',
  [InterventionStatus.ON_HOLD]: 'Pause',
  [InterventionStatus.COMPLETED]: 'CheckCircle',
  [InterventionStatus.VALIDATED]: 'CheckCircle2',
  [InterventionStatus.CANCELLED]: 'XCircle',
};

/**
 * Labels des priorités
 */
export const PRIORITY_LABELS: Record<InterventionPriority, string> = {
  [InterventionPriority.LOW]: 'Basse',
  [InterventionPriority.NORMAL]: 'Normale',
  [InterventionPriority.HIGH]: 'Haute',
  [InterventionPriority.URGENT]: 'Urgente',
  [InterventionPriority.CRITICAL]: 'Critique',
};

/**
 * Couleurs des priorités
 */
export const PRIORITY_COLORS: Record<InterventionPriority, string> = {
  [InterventionPriority.LOW]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  [InterventionPriority.NORMAL]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [InterventionPriority.HIGH]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [InterventionPriority.URGENT]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [InterventionPriority.CRITICAL]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

/**
 * Valeurs numériques des priorités (pour tri)
 */
export const PRIORITY_VALUES: Record<InterventionPriority, number> = {
  [InterventionPriority.LOW]: 1,
  [InterventionPriority.NORMAL]: 2,
  [InterventionPriority.HIGH]: 3,
  [InterventionPriority.URGENT]: 4,
  [InterventionPriority.CRITICAL]: 5,
};

/**
 * Labels des types d'intervention
 */
export const INTERVENTION_TYPE_LABELS: Record<InterventionType, string> = {
  [InterventionType.PLUMBING]: 'Plomberie',
  [InterventionType.ELECTRICITY]: 'Électricité',
  [InterventionType.HEATING]: 'Chauffage',
  [InterventionType.AIR_CONDITIONING]: 'Climatisation',
  [InterventionType.CARPENTRY]: 'Menuiserie',
  [InterventionType.PAINTING]: 'Peinture',
  [InterventionType.CLEANING]: 'Nettoyage',
  [InterventionType.LOCKSMITH]: 'Serrurerie',
  [InterventionType.GLAZING]: 'Vitrerie',
  [InterventionType.MASONRY]: 'Maçonnerie',
  [InterventionType.APPLIANCE]: 'Électroménager',
  [InterventionType.FURNITURE]: 'Mobilier',
  [InterventionType.IT]: 'Informatique',
  [InterventionType.SECURITY]: 'Sécurité',
  [InterventionType.GARDEN]: 'Jardinage',
  [InterventionType.POOL]: 'Piscine',
  [InterventionType.OTHER]: 'Autre',
};

/**
 * Labels des catégories
 */
export const CATEGORY_LABELS: Record<InterventionCategory, string> = {
  [InterventionCategory.MAINTENANCE]: 'Maintenance',
  [InterventionCategory.REPAIR]: 'Réparation',
  [InterventionCategory.INSTALLATION]: 'Installation',
  [InterventionCategory.INSPECTION]: 'Inspection',
  [InterventionCategory.EMERGENCY]: 'Urgence',
};

/**
 * Transitions de statut autorisées
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<InterventionStatus, InterventionStatus[]> = {
  [InterventionStatus.DRAFT]: [
    InterventionStatus.PENDING,
    InterventionStatus.CANCELLED,
  ],
  [InterventionStatus.PENDING]: [
    InterventionStatus.ASSIGNED,
    InterventionStatus.IN_PROGRESS,
    InterventionStatus.CANCELLED,
  ],
  [InterventionStatus.ASSIGNED]: [
    InterventionStatus.IN_PROGRESS,
    InterventionStatus.PENDING,
    InterventionStatus.CANCELLED,
  ],
  [InterventionStatus.IN_PROGRESS]: [
    InterventionStatus.ON_HOLD,
    InterventionStatus.COMPLETED,
    InterventionStatus.CANCELLED,
  ],
  [InterventionStatus.ON_HOLD]: [
    InterventionStatus.IN_PROGRESS,
    InterventionStatus.CANCELLED,
  ],
  [InterventionStatus.COMPLETED]: [
    InterventionStatus.VALIDATED,
    InterventionStatus.IN_PROGRESS, // Réouverture possible
  ],
  [InterventionStatus.VALIDATED]: [], // État final
  [InterventionStatus.CANCELLED]: [], // État final
};

/**
 * Statuts considérés comme "actifs"
 */
export const ACTIVE_STATUSES: InterventionStatus[] = [
  InterventionStatus.PENDING,
  InterventionStatus.ASSIGNED,
  InterventionStatus.IN_PROGRESS,
  InterventionStatus.ON_HOLD,
];

/**
 * Statuts considérés comme "terminés"
 */
export const COMPLETED_STATUSES: InterventionStatus[] = [
  InterventionStatus.COMPLETED,
  InterventionStatus.VALIDATED,
];

/**
 * Statuts considérés comme "finaux" (non modifiables)
 */
export const FINAL_STATUSES: InterventionStatus[] = [
  InterventionStatus.VALIDATED,
  InterventionStatus.CANCELLED,
];
