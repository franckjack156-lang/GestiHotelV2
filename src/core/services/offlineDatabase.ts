/**
 * ============================================================================
 * OFFLINE DATABASE SERVICE
 * ============================================================================
 *
 * Service de cache local avec IndexedDB via Dexie.js
 * - Cache des données critiques (interventions, chambres, utilisateurs)
 * - Stratégie offline-first
 * - Synchronisation différée avec Firestore
 */

import Dexie, { type Table } from 'dexie';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import type { Room } from '@/features/rooms/types/room.types';
import type { User } from '@/features/users/types/user.types';
import type { Message, Conversation } from '@/features/messaging/types/message.types';

// ============================================================================
// TYPES
// ============================================================================

export interface PendingSync {
  id?: number;
  collection: string;
  documentId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  retries: number;
  error?: string;
}

export interface CacheMetadata {
  id?: number;
  key: string;
  lastSync: Date;
  version: number;
  establishmentId: string;
}

// ============================================================================
// DATABASE DEFINITION
// ============================================================================

export class GestiHotelDatabase extends Dexie {
  // Tables
  interventions!: Table<Intervention, string>;
  rooms!: Table<Room, string>;
  users!: Table<User, string>;
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  pendingSyncs!: Table<PendingSync, number>;
  cacheMetadata!: Table<CacheMetadata, number>;

  constructor() {
    super('GestiHotelDB');

    // Version 1 - Schéma initial
    this.version(1).stores({
      interventions: 'id, establishmentId, status, priority, createdAt, assignedTo',
      rooms: 'id, establishmentId, number, floor, status',
      users: 'id, email, establishmentIds',
      conversations: 'id, establishmentId, participantIds, updatedAt',
      messages: 'id, conversationId, senderId, createdAt',
      pendingSyncs: '++id, collection, documentId, timestamp, operation',
      cacheMetadata: '++id, key, establishmentId, lastSync',
    });

    // Version 2 - Ajout de l'index retries sur pendingSyncs
    this.version(2).stores({
      pendingSyncs: '++id, collection, documentId, timestamp, operation, retries',
    });
  }
}

// Singleton instance
export const db = new GestiHotelDatabase();

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Sauvegarder des interventions dans le cache
 */
export const cacheInterventions = async (
  interventions: Intervention[],
  establishmentId: string
) => {
  await db.interventions.bulkPut(interventions);
  await updateCacheMetadata('interventions', establishmentId);
};

/**
 * Récupérer les interventions du cache
 */
export const getCachedInterventions = async (
  establishmentId: string
): Promise<Intervention[]> => {
  return await db.interventions
    .where('establishmentId')
    .equals(establishmentId)
    .toArray();
};

/**
 * Sauvegarder des chambres dans le cache
 */
export const cacheRooms = async (rooms: Room[], establishmentId: string) => {
  await db.rooms.bulkPut(rooms);
  await updateCacheMetadata('rooms', establishmentId);
};

/**
 * Récupérer les chambres du cache
 */
export const getCachedRooms = async (establishmentId: string): Promise<Room[]> => {
  return await db.rooms.where('establishmentId').equals(establishmentId).toArray();
};

/**
 * Sauvegarder des utilisateurs dans le cache
 */
export const cacheUsers = async (users: User[], establishmentId: string) => {
  await db.users.bulkPut(users);
  await updateCacheMetadata('users', establishmentId);
};

/**
 * Récupérer les utilisateurs du cache
 */
export const getCachedUsers = async (establishmentId: string): Promise<User[]> => {
  return await db.users
    .where('establishmentIds')
    .equals(establishmentId)
    .toArray();
};

/**
 * Sauvegarder des conversations dans le cache
 */
export const cacheConversations = async (
  conversations: Conversation[],
  establishmentId: string
) => {
  await db.conversations.bulkPut(conversations);
  await updateCacheMetadata('conversations', establishmentId);
};

/**
 * Récupérer les conversations du cache
 */
export const getCachedConversations = async (
  establishmentId: string
): Promise<Conversation[]> => {
  return await db.conversations
    .where('establishmentId')
    .equals(establishmentId)
    .toArray();
};

/**
 * Sauvegarder des messages dans le cache
 */
export const cacheMessages = async (messages: Message[], conversationId: string) => {
  await db.messages.bulkPut(messages);
  await updateCacheMetadata(`messages-${conversationId}`, conversationId);
};

/**
 * Récupérer les messages du cache
 */
export const getCachedMessages = async (conversationId: string): Promise<Message[]> => {
  return await db.messages
    .where('conversationId')
    .equals(conversationId)
    .toArray();
};

// ============================================================================
// CACHE METADATA
// ============================================================================

/**
 * Mettre à jour les métadonnées de cache
 */
const updateCacheMetadata = async (key: string, establishmentId: string) => {
  const existing = await db.cacheMetadata.where('key').equals(key).first();

  if (existing) {
    await db.cacheMetadata.update(existing.id!, {
      lastSync: new Date(),
      version: existing.version + 1,
    });
  } else {
    await db.cacheMetadata.add({
      key,
      establishmentId,
      lastSync: new Date(),
      version: 1,
    });
  }
};

/**
 * Vérifier si le cache est à jour (< 5 minutes)
 */
export const isCacheFresh = async (key: string): Promise<boolean> => {
  const metadata = await db.cacheMetadata.where('key').equals(key).first();

  if (!metadata) return false;

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return metadata.lastSync > fiveMinutesAgo;
};

/**
 * Effacer tout le cache pour un établissement
 */
export const clearEstablishmentCache = async (establishmentId: string) => {
  await db.interventions.where('establishmentId').equals(establishmentId).delete();
  await db.rooms.where('establishmentId').equals(establishmentId).delete();
  await db.conversations.where('establishmentId').equals(establishmentId).delete();
  await db.cacheMetadata
    .where('establishmentId')
    .equals(establishmentId)
    .delete();
};

/**
 * Effacer tout le cache
 */
export const clearAllCache = async () => {
  await db.interventions.clear();
  await db.rooms.clear();
  await db.users.clear();
  await db.conversations.clear();
  await db.messages.clear();
  await db.cacheMetadata.clear();
};

// ============================================================================
// PENDING SYNC OPERATIONS
// ============================================================================

/**
 * Ajouter une opération en attente de synchronisation
 */
export const addPendingSync = async (
  collection: string,
  documentId: string,
  operation: 'create' | 'update' | 'delete',
  data: any
) => {
  await db.pendingSyncs.add({
    collection,
    documentId,
    operation,
    data,
    timestamp: new Date(),
    retries: 0,
  });
};

/**
 * Récupérer toutes les opérations en attente
 */
export const getPendingSyncs = async (): Promise<PendingSync[]> => {
  return await db.pendingSyncs.orderBy('timestamp').toArray();
};

/**
 * Marquer une opération comme synchronisée
 */
export const markSyncComplete = async (syncId: number) => {
  await db.pendingSyncs.delete(syncId);
};

/**
 * Incrémenter le compteur de tentatives
 */
export const incrementSyncRetries = async (syncId: number, error: string) => {
  const sync = await db.pendingSyncs.get(syncId);
  if (sync) {
    await db.pendingSyncs.update(syncId, {
      retries: sync.retries + 1,
      error,
    });
  }
};

/**
 * Supprimer les opérations échouées (> 5 tentatives)
 */
export const clearFailedSyncs = async () => {
  await db.pendingSyncs.where('retries').above(5).delete();
};

// ============================================================================
// DATABASE MANAGEMENT
// ============================================================================

/**
 * Obtenir la taille de la base de données
 */
export const getDatabaseSize = async (): Promise<number> => {
  const interventionsCount = await db.interventions.count();
  const roomsCount = await db.rooms.count();
  const usersCount = await db.users.count();
  const conversationsCount = await db.conversations.count();
  const messagesCount = await db.messages.count();
  const pendingSyncsCount = await db.pendingSyncs.count();

  return (
    interventionsCount +
    roomsCount +
    usersCount +
    conversationsCount +
    messagesCount +
    pendingSyncsCount
  );
};

/**
 * Exporter la base de données (pour debug)
 */
export const exportDatabase = async () => {
  return {
    interventions: await db.interventions.toArray(),
    rooms: await db.rooms.toArray(),
    users: await db.users.toArray(),
    conversations: await db.conversations.toArray(),
    messages: await db.messages.toArray(),
    pendingSyncs: await db.pendingSyncs.toArray(),
    cacheMetadata: await db.cacheMetadata.toArray(),
  };
};

/**
 * Importer une base de données (pour debug/restauration)
 */
export const importDatabase = async (data: any) => {
  await db.interventions.bulkPut(data.interventions || []);
  await db.rooms.bulkPut(data.rooms || []);
  await db.users.bulkPut(data.users || []);
  await db.conversations.bulkPut(data.conversations || []);
  await db.messages.bulkPut(data.messages || []);
  await db.pendingSyncs.bulkPut(data.pendingSyncs || []);
  await db.cacheMetadata.bulkPut(data.cacheMetadata || []);
};
