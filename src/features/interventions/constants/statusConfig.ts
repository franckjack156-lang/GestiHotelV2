/**
 * ============================================================================
 * STATUS CONFIGURATION
 * ============================================================================
 *
 * Configuration complète des statuts d'interventions avec :
 * - Couleurs et icônes
 * - Transitions autorisées (bidirectionnelles)
 * - Labels et descriptions
 */

// import { InterventionStatus } from '@/shared/types/status.types'; // TODO: Imported but unused - may be needed for type definitions

export type StatusValue =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'validated'
  | 'cancelled';

export interface StatusInfo {
  label: string;
  color: string;
  icon: string;
  description: string;
  allowedTransitions: StatusValue[];
}

export const STATUS_CONFIG: Record<StatusValue, StatusInfo> = {
  pending: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: '⏳',
    description: "Intervention créée, en attente d'assignation",
    allowedTransitions: ['assigned', 'cancelled'], // Peut aller vers assigné ou annulé
  },
  assigned: {
    label: 'Assignée',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: '👤',
    description: 'Assignée à un technicien',
    allowedTransitions: ['pending', 'in_progress', 'cancelled'], // Peut revenir en attente ou avancer
  },
  in_progress: {
    label: 'En cours',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    icon: '🔧',
    description: 'Intervention en cours de réalisation',
    allowedTransitions: ['assigned', 'on_hold', 'completed', 'cancelled'], // Grande flexibilité
  },
  on_hold: {
    label: 'En pause',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    icon: '⏸️',
    description: 'Intervention temporairement suspendue',
    allowedTransitions: ['in_progress', 'assigned', 'cancelled'], // Peut reprendre ou revenir en arrière
  },
  completed: {
    label: 'Terminée',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: '✅',
    description: 'Intervention terminée, en attente de validation',
    allowedTransitions: ['in_progress', 'validated', 'cancelled'], // Peut être réouverte ou validée
  },
  validated: {
    label: 'Validée',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    icon: '🎯',
    description: 'Intervention validée et clôturée',
    allowedTransitions: ['completed'], // Peut revenir à terminée si besoin de modifications
  },
  cancelled: {
    label: 'Annulée',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: '❌',
    description: 'Intervention annulée',
    allowedTransitions: ['pending', 'assigned'], // Peut être réactivée
  },
};

/**
 * Obtenir les statuts disponibles pour une transition
 */
export const getAvailableTransitions = (currentStatus: StatusValue): StatusValue[] => {
  return STATUS_CONFIG[currentStatus].allowedTransitions;
};

/**
 * Vérifier si une transition est autorisée
 */
export const isTransitionAllowed = (fromStatus: StatusValue, toStatus: StatusValue): boolean => {
  return STATUS_CONFIG[fromStatus].allowedTransitions.includes(toStatus);
};

/**
 * Obtenir le type de transition (forward ou backward)
 */
export const getTransitionDirection = (
  fromStatus: StatusValue,
  toStatus: StatusValue
): 'forward' | 'backward' | 'lateral' => {
  const statusOrder: StatusValue[] = [
    'pending',
    'assigned',
    'in_progress',
    'on_hold',
    'completed',
    'validated',
  ];

  const fromIndex = statusOrder.indexOf(fromStatus);
  const toIndex = statusOrder.indexOf(toStatus);

  if (toStatus === 'cancelled') return 'lateral';
  if (fromStatus === 'cancelled') return 'lateral';
  if (toIndex > fromIndex) return 'forward';
  if (toIndex < fromIndex) return 'backward';
  return 'lateral';
};

/**
 * Messages de confirmation pour certaines transitions sensibles
 */
export const TRANSITION_CONFIRMATIONS: Partial<
  Record<StatusValue, Partial<Record<StatusValue, string>>>
> = {
  validated: {
    completed: 'Êtes-vous sûr de vouloir rouvrir cette intervention validée ?',
  },
  completed: {
    in_progress: 'Êtes-vous sûr de vouloir rouvrir cette intervention terminée ?',
  },
  cancelled: {
    pending: 'Réactiver cette intervention annulée ?',
    assigned: 'Réactiver cette intervention annulée ?',
  },
};

/**
 * Obtenir le message de confirmation pour une transition (si nécessaire)
 */
export const getTransitionConfirmation = (
  fromStatus: StatusValue,
  toStatus: StatusValue
): string | null => {
  return TRANSITION_CONFIRMATIONS[fromStatus]?.[toStatus] || null;
};
