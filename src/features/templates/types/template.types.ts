/**
 * ============================================================================
 * INTERVENTION TEMPLATE TYPES
 * ============================================================================
 *
 * Types pour les modèles d'interventions réutilisables
 */

import type { Timestamp } from 'firebase/firestore';
import type { InterventionType, InterventionPriority } from '@/shared/types/status.types';

/**
 * Modèle d'intervention
 */
export interface InterventionTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;

  // Données pré-remplies pour l'intervention
  templateData: {
    title: string;
    description?: string;
    type?: InterventionType;
    priority?: InterventionPriority;
    estimatedDuration?: number; // en minutes
    category?: string;
  };

  // Métadonnées
  establishmentId: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  usageCount: number; // Nombre de fois que le modèle a été utilisé
  isActive: boolean; // Permet de désactiver sans supprimer
}

/**
 * Données pour créer un template
 */
export interface CreateTemplateData {
  name: string;
  description?: string;
  category?: string;
  templateData: {
    title: string;
    description?: string;
    type?: InterventionType;
    priority?: InterventionPriority;
    estimatedDuration?: number;
    category?: string;
  };
}

/**
 * Données pour mettre à jour un template
 */
export interface UpdateTemplateData {
  name?: string;
  description?: string;
  category?: string;
  templateData?: {
    title?: string;
    description?: string;
    type?: InterventionType;
    priority?: InterventionPriority;
    estimatedDuration?: number;
    category?: string;
  };
  isActive?: boolean;
}

/**
 * Catégories de templates prédéfinies
 */
export const TEMPLATE_CATEGORIES = [
  'Plomberie',
  'Électricité',
  'Climatisation',
  'Nettoyage',
  'Maintenance',
  'Sécurité',
  'Autre',
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
