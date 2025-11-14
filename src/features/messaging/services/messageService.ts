/**
 * ============================================================================
 * MESSAGE SERVICE
 * ============================================================================
 *
 * Service pour gérer la messagerie interne
 * - Conversations (direct, groupe, intervention)
 * - Messages avec pièces jointes
 * - Temps réel avec Firestore
 * - Présence utilisateur
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/core/config/firebase';
import type {
  Conversation,
  Message,
  CreateConversationData,
  SendMessageData,
  ConversationFilters,
  Attachment,
  UserPresence,
} from '../types/message.types';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';
const PRESENCE_COLLECTION = 'presence';

// ============================================================================
// CONVERSATIONS
// ============================================================================

/**
 * Créer une nouvelle conversation
 */
export const createConversation = async (
  establishmentId: string,
  userId: string,
  data: CreateConversationData
): Promise<string> => {
  const conversationData: Partial<Conversation> = {
    type: data.type,
    participantIds: [...new Set([userId, ...data.participantIds])], // Inclure le créateur
    name: data.name,
    description: data.description,
    interventionId: data.interventionId,
    establishmentId,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    unreadCount: {},
  };

  const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), conversationData);
  return docRef.id;
};

/**
 * Obtenir ou créer une conversation directe entre deux utilisateurs
 */
export const getOrCreateDirectConversation = async (
  establishmentId: string,
  userId1: string,
  userId2: string
): Promise<string> => {
  // Chercher une conversation existante
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('type', '==', 'direct'),
    where('establishmentId', '==', establishmentId),
    where('participantIds', 'array-contains', userId1)
  );

  const snapshot = await getDocs(q);

  // Vérifier si l'autre utilisateur est dans les participants
  const existing = snapshot.docs.find((doc) => {
    const conv = doc.data() as Conversation;
    return conv.participantIds.includes(userId2);
  });

  if (existing) {
    return existing.id;
  }

  // Créer une nouvelle conversation
  return createConversation(establishmentId, userId1, {
    type: 'direct',
    participantIds: [userId2],
  });
};

/**
 * Récupérer les conversations d'un utilisateur
 */
export const getUserConversations = async (
  establishmentId: string,
  userId: string,
  filters?: ConversationFilters
): Promise<Conversation[]> => {
  let q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('establishmentId', '==', establishmentId),
    where('participantIds', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  if (filters?.type) {
    q = query(q, where('type', '==', filters.type));
  }

  const snapshot = await getDocs(q);
  const conversations = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Conversation[];

  // Filtres côté client
  let filtered = conversations;

  if (filters?.unreadOnly) {
    filtered = filtered.filter((conv) => (conv.unreadCount[userId] || 0) > 0);
  }

  if (filters?.archived) {
    filtered = filtered.filter((conv) => conv.archivedBy?.includes(userId));
  }

  if (filters?.pinned) {
    filtered = filtered.filter((conv) => conv.pinnedBy?.includes(userId));
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (conv) =>
        conv.name?.toLowerCase().includes(searchLower) ||
        conv.lastMessage?.content.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
};

/**
 * Écouter les conversations en temps réel
 */
export const subscribeToConversations = (
  establishmentId: string,
  userId: string,
  callback: (conversations: Conversation[]) => void
) => {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('establishmentId', '==', establishmentId),
    where('participantIds', 'array-contains', userId),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Conversation[];

    callback(conversations);
  });
};

/**
 * Marquer une conversation comme lue
 */
export const markConversationAsRead = async (conversationId: string, userId: string) => {
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  await updateDoc(conversationRef, {
    [`unreadCount.${userId}`]: 0,
  });
};

/**
 * Archiver/désarchiver une conversation
 */
export const toggleArchiveConversation = async (
  conversationId: string,
  userId: string,
  archive: boolean
) => {
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  await updateDoc(conversationRef, {
    archivedBy: archive ? arrayUnion(userId) : arrayRemove(userId),
  });
};

/**
 * Épingler/désépingler une conversation
 */
export const togglePinConversation = async (
  conversationId: string,
  userId: string,
  pin: boolean
) => {
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  await updateDoc(conversationRef, {
    pinnedBy: pin ? arrayUnion(userId) : arrayRemove(userId),
    isPinned: pin,
  });
};

// ============================================================================
// MESSAGES
// ============================================================================

/**
 * Upload d'un fichier attaché
 */
const uploadAttachment = async (
  conversationId: string,
  messageId: string,
  file: File
): Promise<Attachment> => {
  const fileRef = ref(storage, `messages/${conversationId}/${messageId}/${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  return {
    id: `${Date.now()}-${Math.random()}`,
    name: file.name,
    url,
    type: file.type,
    size: file.size,
    uploadedAt: new Date(),
  };
};

/**
 * Envoyer un message
 */
export const sendMessage = async (
  conversationId: string,
  userId: string,
  userName: string,
  data: SendMessageData
): Promise<string> => {
  // Créer le message
  const messageData: Partial<Message> = {
    conversationId,
    type: data.type || 'text',
    content: data.content,
    senderId: userId,
    senderName: userName,
    mentions: data.mentions || [],
    readBy: [userId], // Le sender a lu son propre message
    createdAt: serverTimestamp(),
    replyTo: data.replyTo,
  };

  const messageRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData);

  // Upload des pièces jointes si présentes
  if (data.attachments && data.attachments.length > 0) {
    const attachments = await Promise.all(
      data.attachments.map((file) => uploadAttachment(conversationId, messageRef.id, file))
    );

    await updateDoc(messageRef, {
      attachments,
    });
  }

  // Mettre à jour la conversation
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const conversationSnap = await getDoc(conversationRef);
  const conversation = conversationSnap.data() as Conversation;

  const batch = writeBatch(db);

  // Incrémenter le compteur non lu pour tous les participants sauf le sender
  const updates: any = {
    lastMessage: {
      content: data.content,
      senderId: userId,
      senderName: userName,
      createdAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  };

  conversation.participantIds.forEach((participantId) => {
    if (participantId !== userId) {
      updates[`unreadCount.${participantId}`] = increment(1);
    }
  });

  batch.update(conversationRef, updates);
  await batch.commit();

  return messageRef.id;
};

/**
 * Récupérer les messages d'une conversation
 */
export const getMessages = async (
  conversationId: string,
  limitCount: number = 50
): Promise<Message[]> => {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .reverse() as Message[]; // Inverser pour avoir chronologique
};

/**
 * Écouter les messages en temps réel
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void,
  limitCount: number = 50
) => {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .reverse() as Message[]; // Chronologique

    callback(messages);
  });
};

/**
 * Marquer les messages comme lus
 */
export const markMessagesAsRead = async (messageIds: string[], userId: string) => {
  const batch = writeBatch(db);

  messageIds.forEach((messageId) => {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    batch.update(messageRef, {
      readBy: arrayUnion(userId),
    });
  });

  await batch.commit();
};

/**
 * Éditer un message
 */
export const editMessage = async (messageId: string, newContent: string) => {
  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  const messageSnap = await getDoc(messageRef);
  const message = messageSnap.data() as Message;

  await updateDoc(messageRef, {
    content: newContent,
    isEdited: true,
    updatedAt: serverTimestamp(),
    editHistory: arrayUnion({
      content: message.content,
      editedAt: serverTimestamp(),
    }),
  });
};

/**
 * Supprimer un message
 */
export const deleteMessage = async (messageId: string) => {
  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  await updateDoc(messageRef, {
    isDeleted: true,
    content: 'Ce message a été supprimé',
    deletedAt: serverTimestamp(),
  });
};

/**
 * Ajouter une réaction à un message
 */
export const addReaction = async (
  messageId: string,
  userId: string,
  userName: string,
  emoji: string
) => {
  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  await updateDoc(messageRef, {
    reactions: arrayUnion({
      emoji,
      userId,
      userName,
      createdAt: serverTimestamp(),
    }),
  });
};

/**
 * Retirer une réaction
 */
export const removeReaction = async (
  messageId: string,
  userId: string,
  emoji: string
) => {
  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  const messageSnap = await getDoc(messageRef);
  const message = messageSnap.data() as Message;

  const updatedReactions = message.reactions?.filter(
    (r) => !(r.userId === userId && r.emoji === emoji)
  );

  await updateDoc(messageRef, {
    reactions: updatedReactions || [],
  });
};

// ============================================================================
// PRESENCE
// ============================================================================

/**
 * Mettre à jour la présence d'un utilisateur
 */
export const updateUserPresence = async (
  userId: string,
  isOnline: boolean,
  status?: 'available' | 'busy' | 'away' | 'offline'
) => {
  const presenceRef = doc(db, PRESENCE_COLLECTION, userId);
  await updateDoc(presenceRef, {
    isOnline,
    status: status || (isOnline ? 'available' : 'offline'),
    lastSeen: serverTimestamp(),
  });
};

/**
 * Écouter la présence d'utilisateurs
 */
export const subscribeToPresence = (
  userIds: string[],
  callback: (presence: Record<string, UserPresence>) => void
) => {
  if (userIds.length === 0) return () => {};

  const q = query(
    collection(db, PRESENCE_COLLECTION),
    where('__name__', 'in', userIds.slice(0, 10)) // Firestore limit
  );

  return onSnapshot(q, (snapshot) => {
    const presence: Record<string, UserPresence> = {};

    snapshot.docs.forEach((doc) => {
      presence[doc.id] = {
        userId: doc.id,
        ...doc.data(),
      } as UserPresence;
    });

    callback(presence);
  });
};

/**
 * Indicateur de frappe
 */
export const setTypingIndicator = async (
  conversationId: string,
  userId: string,
  userName: string,
  isTyping: boolean
) => {
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);

  if (isTyping) {
    await updateDoc(conversationRef, {
      [`typing.${userId}`]: {
        userId,
        userName,
        startedAt: serverTimestamp(),
      },
    });
  } else {
    await updateDoc(conversationRef, {
      [`typing.${userId}`]: deleteDoc as any,
    });
  }
};
