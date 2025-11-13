/**
 * Room Types
 *
 * Type definitions for room management
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Room Type Enum
 */
export type RoomType = 'single' | 'double' | 'triple' | 'suite' | 'other';

/**
 * Room Status
 */
export type RoomStatus = 'available' | 'blocked' | 'maintenance' | 'cleaning';

/**
 * Room Entity
 */
export interface Room {
  id: string;
  establishmentId: string;

  // Identifiants
  number: string; // Numéro de chambre
  floor: number; // Étage
  building?: string; // Bâtiment (optionnel)

  // Caractéristiques
  type: RoomType;
  capacity: number; // Nombre de personnes
  description?: string;

  // État
  status: RoomStatus;
  isBlocked: boolean;
  blockReason?: string;
  blockedAt?: Timestamp;
  blockedBy?: string;

  // Équipements
  amenities?: string[]; // Liste des équipements

  // Métadonnées
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  lastModifiedBy?: string;
}

/**
 * Create Room Data
 */
export interface CreateRoomData {
  number: string;
  floor: number;
  building?: string;
  type: RoomType;
  capacity: number;
  description?: string;
  amenities?: string[];
}

/**
 * Update Room Data
 */
export interface UpdateRoomData {
  number?: string;
  floor?: number;
  building?: string;
  type?: RoomType;
  capacity?: number;
  description?: string;
  amenities?: string[];
  status?: RoomStatus;
}

/**
 * Block Room Data
 */
export interface BlockRoomData {
  reason: string;
  userId: string;
}

/**
 * Room Filters
 */
export interface RoomFilters {
  status?: RoomStatus | 'all';
  floor?: number | 'all';
  type?: RoomType | 'all';
  isBlocked?: boolean;
  searchTerm?: string;
}

/**
 * Room Statistics
 */
export interface RoomStats {
  total: number;
  available: number;
  blocked: number;
  inMaintenance: number;
  byCleaning: number;
  byType: Record<RoomType, number>;
  byFloor: Record<number, number>;
}

/**
 * Room History Event
 */
export interface RoomHistoryEvent {
  id: string;
  roomId: string;
  type: 'created' | 'updated' | 'blocked' | 'unblocked' | 'status_changed';
  description: string;
  userId: string;
  userName: string;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
}
