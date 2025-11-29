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
  // deleteDoc, // TODO: Imported but unused
  deleteField,
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
// HELPERS
// ============================================================================

/**
 * Nettoyer les champs undefined d'un objet (Firestore n'accepte pas undefined)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanUndefined = (obj: any): any => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        cleaned[key] = cleanUndefined(obj[key]);
      } else if (Array.isArray(obj[key])) {
        cleaned[key] = obj[key].map((item: any) =>
          typeof item === 'object' && item !== null ? cleanUndefined(item) : item
        );
      } else {
        cleaned[key] = obj[key];
      }
    }
  });
  return cleaned;
};

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
  const allParticipantIds = [...new Set([userId, ...data.participantIds])]; // Inclure le créateur

  // Récupérer les informations des participants
  const participantsData = await Promise.all(
    allParticipantIds.map(async participantId => {
      const userDoc = await getDoc(doc(db, 'users', participantId));
      const userData = userDoc.data();
      return {
        userId: participantId,
        name: userData?.displayName || userData?.email || 'Utilisateur',
        email: userData?.email || '',
        avatar: userData?.photoURL,
        role: userData?.role,
        isOnline: false,
        joinedAt: serverTimestamp(),
      };
    })
  );

  const conversationData: Record<string, unknown> = {
    type: data.type,
    participantIds: allParticipantIds,
    participants: participantsData,
    establishmentId,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    unreadCount: {},
  };

  // Ajouter les champs optionnels seulement s'ils sont définis
  if (data.name) {
    conversationData.name = data.name;
  }
  if (data.description) {
    conversationData.description = data.description;
  }
  if (data.interventionId) {
    conversationData.interventionId = data.interventionId;
  }

  // Nettoyer les undefined avant d'envoyer à Firestore
  const cleanedData = cleanUndefined(conversationData);

  const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), cleanedData);
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
  const existing = snapshot.docs.find(doc => {
    const conv = doc.data() as Conversation;
    return conv.participantIds.includes(userId2);
  });

  if (existing) {
    const conversationId = existing.id;
    const conv = existing.data() as Conversation;

    // Si la conversation a été cachée par userId1, la restaurer
    if (conv.hiddenBy?.includes(userId1)) {
      const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);

      // Retirer de hiddenBy pour que la conversation réapparaisse
      // MAIS on garde deletedBy pour filtrer les anciens messages
      await updateDoc(conversationRef, {
        hiddenBy: arrayRemove(userId1),
        updatedAt: serverTimestamp(),
      });
    }

    return conversationId;
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
  const conversations = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Conversation[];

  // Filtres côté client
  let filtered = conversations;

  if (filters?.unreadOnly) {
    filtered = filtered.filter(conv => (conv.unreadCount[userId] || 0) > 0);
  }

  if (filters?.archived) {
    filtered = filtered.filter(conv => conv.archivedBy?.includes(userId));
  }

  if (filters?.pinned) {
    filtered = filtered.filter(conv => conv.pinnedBy?.includes(userId));
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      conv =>
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

  return onSnapshot(q, snapshot => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Conversation[];

    // Filtrer les conversations cachées par l'utilisateur
    const visibleConversations = conversations.filter(conv => !conv.hiddenBy?.includes(userId));

    callback(visibleConversations);
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

/**
 * Supprimer une conversation (pour l'utilisateur uniquement)
 * La conversation reste visible pour les autres participants
 * Enregistre le timestamp de suppression pour filtrer les anciens messages
 */
export const deleteConversationForUser = async (conversationId: string, userId: string) => {
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const deletionTimestamp = Date.now();

  await updateDoc(conversationRef, {
    [`deletedBy.${userId}`]: deletionTimestamp, // Timestamp pour filtrer les anciens messages
    hiddenBy: arrayUnion(userId), // Cacher la conversation
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
  // Sanitize filename: remplacer les espaces et caractères spéciaux
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueFileName = `${Date.now()}_${sanitizedFileName}`;

  const fileRef = ref(storage, `messages/${conversationId}/${messageId}/${uniqueFileName}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  return {
    id: `${Date.now()}-${Math.random()}`,
    name: file.name, // Garder le nom original pour l'affichage
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
  // Créer le message avec timestamp client pour garantir l'ordre
  const clientTimestamp = Date.now();
  const messageData: Record<string, unknown> = {
    conversationId,
    type: data.type || 'text',
    content: data.content,
    senderId: userId,
    senderName: userName,
    mentions: data.mentions || [],
    readBy: [userId], // Le sender a lu son propre message
    createdAt: serverTimestamp(),
    clientCreatedAt: clientTimestamp, // Timestamp client pour fallback
  };

  // Ajouter replyTo seulement s'il existe
  if (data.replyTo) {
    messageData.replyTo = data.replyTo;
  }

  // Nettoyer les undefined
  const cleanedMessageData = cleanUndefined(messageData);

  const messageRef = await addDoc(collection(db, MESSAGES_COLLECTION), cleanedMessageData);

  // Upload des pièces jointes si présentes
  if (data.attachments && data.attachments.length > 0) {
    const attachments = await Promise.all(
      data.attachments.map(file => uploadAttachment(conversationId, messageRef.id, file))
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
  const updates: Record<string, unknown> = {
    lastMessage: {
      content: data.content,
      senderId: userId,
      senderName: userName,
      createdAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  };

  conversation.participantIds.forEach(participantId => {
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
 * Filtre automatiquement les messages antérieurs à la suppression de la conversation
 */
export const getMessages = async (
  conversationId: string,
  // userId, // TODO: Unused parameter
  limitCount: number = 50,
  deletionTimestamp?: number
): Promise<Message[]> => {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  let messages = snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .reverse() as Message[]; // Inverser pour avoir chronologique

  // Filtrer les messages antérieurs à la suppression
  if (deletionTimestamp) {
    messages = messages.filter(msg => {
      const createdAt = msg.createdAt;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msgTimestamp =
        msg.clientCreatedAt ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (createdAt && typeof (createdAt as any).toDate === 'function'
          ? (createdAt as any).toDate().getTime()
          : createdAt instanceof Date
            ? createdAt.getTime()
            : 0);
      return msgTimestamp > deletionTimestamp;
    });
  }

  return messages;
};

/**
 * Charger plus de messages (pagination avec curseur)
 */
export const loadMoreMessages = async (
  conversationId: string,
  limitCount: number = 50,
  oldestMessageTimestamp?: number
): Promise<{ messages: Message[]; hasMore: boolean }> => {
  let q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'desc'),
    limit(limitCount + 1) // +1 pour savoir s'il y a plus de messages
  );

  // Si on a un timestamp, charger les messages plus anciens
  if (oldestMessageTimestamp) {
    const oldestDate = Timestamp.fromMillis(oldestMessageTimestamp);
    q = query(
      collection(db, MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      where('createdAt', '<', oldestDate),
      orderBy('createdAt', 'desc'),
      limit(limitCount + 1)
    );
  }

  const snapshot = await getDocs(q);
  const hasMore = snapshot.docs.length > limitCount;

  const messages = snapshot.docs
    .slice(0, limitCount) // Enlever le message supplémentaire
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .reverse() as Message[]; // Chronologique

  return { messages, hasMore };
};

/**
 * Écouter les messages en temps réel
 * Filtre automatiquement les messages antérieurs à la suppression de la conversation
 */
export const subscribeToMessages = (
  conversationId: string,
  // userId, // TODO: Unused parameter
  callback: (messages: Message[]) => void,
  limitCount: number = 50,
  deletionTimestamp?: number
) => {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, snapshot => {
    let messages = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .reverse() as Message[]; // Chronologique

    // Filtrer les messages antérieurs à la suppression
    if (deletionTimestamp) {
      messages = messages.filter(msg => {
        const createdAt = msg.createdAt;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msgTimestamp =
          msg.clientCreatedAt ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (createdAt && typeof (createdAt as any).toDate === 'function'
            ? (createdAt as any).toDate().getTime()
            : createdAt instanceof Date
              ? createdAt.getTime()
              : 0);
        return msgTimestamp > deletionTimestamp;
      });
    }

    callback(messages);
  });
};

/**
 * Marquer les messages comme lus
 */
export const markMessagesAsRead = async (messageIds: string[], userId: string) => {
  const batch = writeBatch(db);

  messageIds.forEach(messageId => {
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
 * Un utilisateur ne peut avoir qu'une seule réaction par message
 * Si une réaction existe déjà, elle est remplacée par la nouvelle
 */
export const addReaction = async (
  messageId: string,
  userId: string,
  userName: string,
  emoji: string
) => {
  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  const messageSnap = await getDoc(messageRef);
  const message = messageSnap.data() as Message;

  // Retirer l'ancienne réaction de l'utilisateur s'il en avait une
  const existingReactions = message.reactions || [];
  const filteredReactions = existingReactions.filter(r => r.userId !== userId);

  // Ajouter la nouvelle réaction
  const newReaction = {
    emoji,
    userId,
    userName,
    createdAt: Date.now(),
  };

  await updateDoc(messageRef, {
    reactions: [...filteredReactions, newReaction],
  });
};

/**
 * Retirer la réaction d'un utilisateur sur un message
 * Retire toutes les réactions de l'utilisateur (il ne peut en avoir qu'une)
 */
export const removeReaction = async (messageId: string, userId: string) => {
  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  const messageSnap = await getDoc(messageRef);
  const message = messageSnap.data() as Message;

  // Retirer toutes les réactions de cet utilisateur
  const updatedReactions = message.reactions?.filter(r => r.userId !== userId);

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

  return onSnapshot(q, snapshot => {
    const presence: Record<string, UserPresence> = {};

    snapshot.docs.forEach(doc => {
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
      [`typing.${userId}`]: deleteField(),
    });
  }
};
