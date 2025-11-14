/**
 * ============================================================================
 * MESSAGE TYPES
 * ============================================================================
 *
 * Types pour le système de messagerie interne
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// TYPES DE BASE
// ============================================================================

export type ConversationType = 'direct' | 'group' | 'intervention';

export type MessageType = 'text' | 'file' | 'image' | 'system';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string; // MIME type
  size: number; // en bytes
  uploadedAt: Date | Timestamp;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  createdAt: Date | Timestamp;
}

// ============================================================================
// MESSAGE
// ============================================================================

export interface Message {
  id: string;
  conversationId: string;

  // Contenu
  type: MessageType;
  content: string;
  attachments?: Attachment[];

  // Métadonnées
  senderId: string;
  senderName: string;
  senderAvatar?: string;

  // Mentions
  mentions?: string[]; // Array de userId

  // Réactions
  reactions?: MessageReaction[];

  // Lecture
  readBy: string[]; // Array de userId ayant lu le message

  // Timestamps
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  deletedAt?: Date | Timestamp;

  // Message supprimé
  isDeleted?: boolean;

  // Édition
  isEdited?: boolean;
  editHistory?: {
    content: string;
    editedAt: Date | Timestamp;
  }[];

  // Réponse à un message
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
}

// ============================================================================
// CONVERSATION
// ============================================================================

export interface Conversation {
  id: string;

  // Type de conversation
  type: ConversationType;

  // Participants
  participantIds: string[];
  participants: ConversationParticipant[];

  // Métadonnées
  name?: string; // Pour les groupes
  avatar?: string; // Pour les groupes
  description?: string;

  // Dernier message
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    createdAt: Date | Timestamp;
  };

  // Messages non lus
  unreadCount: Record<string, number>; // userId -> count

  // Timestamps
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;

  // Créateur
  createdBy: string;

  // Établissement (pour isolation)
  establishmentId: string;

  // Lien avec une intervention (optionnel)
  interventionId?: string;
  interventionTitle?: string;

  // Archivage
  isArchived?: boolean;
  archivedBy?: string[];

  // Épinglage
  isPinned?: boolean;
  pinnedBy?: string[];
}

export interface ConversationParticipant {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;

  // Statut
  isOnline?: boolean;
  lastSeen?: Date | Timestamp;

  // Permissions
  canSendMessages?: boolean;
  isAdmin?: boolean;

  // Notifications
  isMuted?: boolean;

  // Timestamps
  joinedAt: Date | Timestamp;
  leftAt?: Date | Timestamp;
}

// ============================================================================
// TYPING INDICATOR
// ============================================================================

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  startedAt: Date | Timestamp;
}

// ============================================================================
// FORMS DATA
// ============================================================================

export interface CreateConversationData {
  type: ConversationType;
  participantIds: string[];
  name?: string;
  description?: string;
  interventionId?: string;
}

export interface SendMessageData {
  content: string;
  type?: MessageType;
  attachments?: File[];
  mentions?: string[];
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
}

export interface EditMessageData {
  content: string;
}

// ============================================================================
// FILTERS & SEARCH
// ============================================================================

export interface ConversationFilters {
  type?: ConversationType;
  search?: string;
  unreadOnly?: boolean;
  archived?: boolean;
  pinned?: boolean;
}

export interface MessageFilters {
  senderId?: string;
  type?: MessageType;
  hasAttachments?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// PRESENCE
// ============================================================================

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: Date | Timestamp;
  status?: 'available' | 'busy' | 'away' | 'offline';
  statusMessage?: string;
}
