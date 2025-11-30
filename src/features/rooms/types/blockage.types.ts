/**
 * Room Blockage Types
 *
 * Type definitions for room blockage tracking and analytics
 */

import { Timestamp } from 'firebase/firestore';
import { InterventionType, InterventionPriority } from '@/shared/types/status.types';

/**
 * Blockage Urgency Level
 */
export type BlockageUrgency = 'low' | 'medium' | 'high' | 'critical';

/**
 * Room Blockage Entity
 * Tracks when a room is blocked due to an intervention
 */
export interface RoomBlockage {
  id: string;
  establishmentId: string;
  roomId: string;

  // Intervention liée
  interventionId: string;
  interventionTitle: string;
  interventionType: InterventionType;
  interventionPriority: InterventionPriority;

  // Dates
  blockedAt: Timestamp;
  estimatedUnblockDate?: Timestamp;
  actualUnblockDate?: Timestamp;

  // Durée (calculée automatiquement)
  durationDays: number;
  durationHours: number;
  durationMinutes: number;

  // Impact financier
  estimatedRevenueLoss?: number; // Prix nuitée × nombre de jours
  roomPricePerNight?: number;

  // Raison et détails
  reason: string;
  urgency: BlockageUrgency;
  notes?: string;

  // Responsables
  blockedBy: string; // User ID qui a créé l'intervention
  blockedByName: string;
  assignedTo?: string; // Technicien assigné
  assignedToName?: string;

  // Statut
  isActive: boolean; // true si la chambre est toujours bloquée
  isOverdue: boolean; // true si dépassement estimation

  // Métadonnées
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Create Blockage Data
 */
export interface CreateBlockageData {
  roomId: string;
  interventionId: string;
  interventionTitle: string;
  interventionType: InterventionType;
  interventionPriority: InterventionPriority;
  reason: string;
  urgency: BlockageUrgency;
  estimatedUnblockDate?: Date;
  roomPricePerNight?: number;
  blockedBy: string;
  blockedByName: string;
  assignedTo?: string;
  assignedToName?: string;
  notes?: string;
}

/**
 * Update Blockage Data
 */
export interface UpdateBlockageData {
  estimatedUnblockDate?: Timestamp;
  actualUnblockDate?: Timestamp;
  urgency?: BlockageUrgency;
  notes?: string;
  assignedTo?: string;
  assignedToName?: string;
  isActive?: boolean;
}

/**
 * Blockage Statistics
 */
export interface BlockageStats {
  // Nombres
  totalActive: number;
  totalCompleted: number;
  totalOverdue: number;

  // Durées
  averageDurationDays: number;
  longestBlockageDays: number;
  shortestBlockageDays: number;

  // Impact financier
  totalRevenueLoss: number;
  averageRevenueLoss: number;

  // Par urgence
  byUrgency: Record<BlockageUrgency, number>;

  // Par type d'intervention
  byInterventionType: Record<InterventionType, number>;
}

/**
 * Blockage Analytics (pour graphiques)
 */
export interface BlockageAnalytics {
  date: string; // Format: YYYY-MM-DD
  activeBlockages: number;
  newBlockages: number;
  resolvedBlockages: number;
  averageDuration: number;
  totalRevenueLoss: number;
}

/**
 * Top Blocked Rooms
 */
export interface TopBlockedRoom {
  roomId: string;
  roomNumber: string;
  blockageCount: number;
  totalDaysBlocked: number;
  totalRevenueLoss: number;
  lastBlockedAt: Timestamp;
  averageBlockageDuration: number;
}

/**
 * Blockage Filters
 */
export interface BlockageFilters {
  isActive?: boolean;
  urgency?: BlockageUrgency | 'all';
  roomId?: string;
  interventionType?: InterventionType | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}
